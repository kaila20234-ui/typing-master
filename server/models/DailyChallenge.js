import mongoose from 'mongoose';

const DailyChallengeSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    default: () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now;
    },
  },
  title: {
    type: String,
    default: 'Daily Speed Challenge',
  },
  description: {
    type: String,
    default: 'Complete today\'s typing challenge and compete for the top spot!',
  },
  challengeText: {
    type: String,
    required: true,
  },
  challengeMode: {
    type: String,
    enum: ['passage', 'random'],
    default: 'passage',
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },
  targetWpm: {
    type: Number,
    default: 80,
  },
  submissions: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      username: String,
      userCode: String,
      wpm: Number,
      accuracy: Number,
      timeSpent: Number,
      completedAt: {
        type: Date,
        default: Date.now,
      },
      score: {
        type: Number,
        default: 0,
      },
      rank: Number,
      reward: {
        ratingPoints: {
          type: Number,
          default: 0,
        },
        bonus: {
          type: Number,
          default: 0,
        },
      },
    },
  ],
  startTime: {
    type: Date,
    default: () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now;
    },
  },
  endTime: {
    type: Date,
    default: () => {
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      return now;
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  scheduledDate: {
    type: Date,
    default: null,
  },
  autoPublish: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Sort submissions by score (leaderboard)
DailyChallengeSchema.methods.getLeaderboard = function () {
  return this.submissions
    .sort((a, b) => b.score - a.score)
    .map((submission, index) => ({
      ...submission.toObject(),
      rank: index + 1,
    }));
};

// Calculate score based on WPM, accuracy, and comparison to target
DailyChallengeSchema.statics.calculateScore = function (wpm, accuracy, targetWpm = 80) {
  const wpmScore = (wpm / targetWpm) * 50; // 50 points for WPM
  const accuracyScore = accuracy; // Up to 50 points for accuracy
  return Math.round(wpmScore + accuracyScore);
};

// Get today's challenge
DailyChallengeSchema.statics.getTodaysChallenge = async function () {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // Generate challenge text in case we need to create it
  const wordListModule = await import('../lib/wordList.js');
  const challengeText = wordListModule.default.generateRandomWords('intermediate');

  // Use findOneAndUpdate with upsert to safely create or get the challenge
  const challenge = await this.findOneAndUpdate(
    {
      date: startOfDay,
    },
    {
      $setOnInsert: {
        date: startOfDay,
        challengeText,
        challengeMode: 'random',
        difficulty: 'intermediate',
        startTime: startOfDay,
        endTime: endOfDay,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );

  return challenge;
};

// Add submission
DailyChallengeSchema.methods.addSubmission = async function (userId, username, userCode, wpm, accuracy, timeSpent) {
  const DailyChallenge = mongoose.model('DailyChallenge', DailyChallengeSchema);
  const score = DailyChallenge.calculateScore(wpm, accuracy, this.targetWpm);

  // Check if user already submitted
  const existingSubmission = this.submissions.find((s) => s.userId.toString() === userId.toString());

  if (existingSubmission) {
    // Update if new score is better
    if (score > existingSubmission.score) {
      existingSubmission.wpm = wpm;
      existingSubmission.accuracy = accuracy;
      existingSubmission.timeSpent = timeSpent;
      existingSubmission.score = score;
      existingSubmission.completedAt = Date.now();
    }
  } else {
    // Add new submission
    this.submissions.push({
      userId,
      username,
      userCode,
      wpm,
      accuracy,
      timeSpent,
      score,
    });
  }

  await this.save();

  // Calculate rewards for top 10
  const leaderboard = this.getLeaderboard();
  const topSubmission = leaderboard.find((s) => s.userId.toString() === userId.toString());

  if (topSubmission && topSubmission.rank <= 10) {
    const rewardPoints = [500, 400, 350, 300, 250, 200, 150, 100, 50, 25];
    topSubmission.reward.ratingPoints = rewardPoints[topSubmission.rank - 1];
    topSubmission.reward.bonus = (11 - topSubmission.rank) * 10; // Extra bonus for top placements
    await this.save();
  }

  return {
    score,
    rank: topSubmission?.rank,
    reward: topSubmission?.reward,
  };
};

export default mongoose.model('DailyChallenge', DailyChallengeSchema);
