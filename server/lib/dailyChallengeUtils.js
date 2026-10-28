import DailyChallenge from '../models/DailyChallenge.js';
import UserRanking from '../models/UserRanking.js';
import { io } from '../server.js';

/**
 * Get or create today's daily challenge
 */
export async function getTodaysChallenge() {
  return await DailyChallenge.getTodaysChallenge();
}

/**
 * Submit a daily challenge attempt
 */
export async function submitDailyChallengeAttempt(userId, username, userCode, wpm, accuracy, timeSpent) {
  const challenge = await DailyChallenge.getTodaysChallenge();

  const result = await challenge.addSubmission(userId, username, userCode, wpm, accuracy, timeSpent);

  // Update user ranking if top 10
  if (result.rank && result.rank <= 10) {
    const userRanking = await UserRanking.findOne({ userId });
    if (userRanking && result.reward.ratingPoints > 0) {
      userRanking.ratingPoints += result.reward.ratingPoints;
      userRanking.totalRaces += 1;
      
      // Track as a win for daily challenge completion
      userRanking.racesWon += 1;
      userRanking.winRate = Math.round((userRanking.racesWon / userRanking.totalRaces) * 100);
      userRanking.averageWpm = Math.round(
        (userRanking.averageWpm * (userRanking.totalRaces - 1) + wpm) / userRanking.totalRaces
      );
      userRanking.averageAccuracy = Math.round(
        (userRanking.averageAccuracy * (userRanking.totalRaces - 1) + accuracy) / userRanking.totalRaces
      );

      // Update tier
      const TIER_THRESHOLDS = {
        'Bronze': 0,
        'Silver': 1500,
        'Gold': 2500,
        'Platinum': 3500,
        'Diamond': 5000,
      };
      
      for (const [tier, threshold] of Object.entries(TIER_THRESHOLDS)) {
        if (userRanking.ratingPoints >= threshold) {
          userRanking.tier = tier;
        }
      }

      await userRanking.save();
      // Emit leaderboardUpdate event after ranking change
      const topRankings = await UserRanking.find().sort({ ratingPoints: -1 }).limit(100).lean();
      io.emit('leaderboardUpdate', topRankings);
    }
  }

  return result;
}

/**
 * Get daily challenge leaderboard
 */
export async function getDailyChallengeLeaderboard(limit = 100) {
  try {
    const challenge = await DailyChallenge.getTodaysChallenge();
    
    if (!challenge) {
      console.error('Failed to retrieve or create today\'s challenge');
      return {
        challenge: null,
        leaderboard: [],
        totalSubmissions: 0,
        endTime: new Date(),
        error: 'No challenge available for today'
      };
    }
    
    // Ensure submissions array exists
    const submissions = challenge.submissions || [];
    
    // Sort and create leaderboard safely
    const leaderboard = submissions
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((submission, index) => ({
        ...(submission.toObject ? submission.toObject() : submission),
        rank: index + 1,
      }))
      .slice(0, limit);
    
    return {
      challenge: {
        _id: challenge._id,
        date: challenge.date || challenge.startTime,
        title: challenge.title || 'Daily Challenge',
        description: challenge.description || 'Complete today\'s typing challenge',
        difficulty: challenge.difficulty,
        targetWpm: challenge.targetWpm,
        startTime: challenge.startTime,
      },
      leaderboard,
      totalSubmissions: submissions.length,
      endTime: challenge.endTime,
    };
  } catch (error) {
    console.error('Error in getDailyChallengeLeaderboard:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Get user's daily challenge performance
 */
export async function getUserDailyPerformance(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const challenge = await DailyChallenge.findOne({
    startTime: { $gte: today },
  });

  if (!challenge) {
    return null;
  }

  const submission = challenge.submissions.find((s) => s.userId.toString() === userId.toString());

  if (!submission) {
    return {
      hasSubmitted: false,
      challenge: {
        _id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        endTime: challenge.endTime,
      },
    };
  }

  return {
    hasSubmitted: true,
    submission: {
      wpm: submission.wpm,
      accuracy: submission.accuracy,
      score: submission.score,
      rank: submission.rank,
      completedAt: submission.completedAt,
      reward: submission.reward,
    },
    challenge: {
      _id: challenge._id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      endTime: challenge.endTime,
      totalSubmissions: challenge.submissions.length,
    },
  };
}

/**
 * Get past daily challenges
 */
export async function getPastChallenges(days = 7) {
  const challenges = await DailyChallenge.find()
    .sort({ date: -1 })
    .limit(days)
    .select('date title difficulty submissions')
    .lean();

  return challenges.map((challenge) => ({
    date: challenge.date,
    title: challenge.title,
    difficulty: challenge.difficulty,
    totalSubmissions: challenge.submissions.length,
  }));
}

/**
 * Get user's past daily challenge rankings
 */
export async function getUserPastChallengeRankings(userId, days = 7) {
  const challenges = await DailyChallenge.find()
    .sort({ date: -1 })
    .limit(days)
    .lean();

  const rankings = challenges
    .map((challenge) => {
      const submission = challenge.submissions.find((s) => s.userId.toString() === userId.toString());
      if (!submission) return null;

      // Calculate rank
      const sortedSubmissions = challenge.submissions.sort((a, b) => b.score - a.score);
      const rank = sortedSubmissions.findIndex((s) => s._id.toString() === submission._id.toString()) + 1;

      return {
        date: challenge.date,
        title: challenge.title,
        wpm: submission.wpm,
        accuracy: submission.accuracy,
        score: submission.score,
        rank,
        reward: submission.reward,
      };
    })
    .filter((r) => r !== null);

  return rankings;
}

/**
 * Initialize daily challenge for tomorrow (should run at midnight)
 */
export async function initializeTomorrowsChallenge() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const existingChallenge = await DailyChallenge.findOne({
    startTime: { $gte: tomorrow, $lt: new Date(tomorrow.getTime() + 86400000) },
  });

  if (existingChallenge) {
    return existingChallenge;
  }

  // Create new challenge
  const challenges = [
    {
      title: 'Speed Demon',
      description: 'Push your typing speed to the limit!',
      difficulty: 'advanced',
      targetWpm: 100,
    },
    {
      title: 'Accuracy Master',
      description: 'Perfect precision is the goal today.',
      difficulty: 'intermediate',
      targetWpm: 70,
    },
    {
      title: 'Consistent Typer',
      description: 'Maintain steady speed and accuracy.',
      difficulty: 'beginner',
      targetWpm: 60,
    },
    {
      title: 'Word Warrior',
      description: 'Random words await. Stay sharp!',
      difficulty: 'intermediate',
      targetWpm: 80,
    },
  ];

  const selectedChallenge = challenges[Math.floor(Math.random() * challenges.length)];

  const wordList = (await import('./wordList.js')).getRandomWordsPreview({
    count: 50,
    difficulty: selectedChallenge.difficulty,
  });

  const challengeText = wordList?.words?.join(' ') || 'the quick brown fox jumps over the lazy dog';

  return await DailyChallenge.create({
    date: tomorrow,
    startTime: tomorrow,
    endTime: new Date(tomorrow.getTime() + 86400000 - 1000),
    ...selectedChallenge,
    challengeText,
    challengeMode: 'random',
  });
}
