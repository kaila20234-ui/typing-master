import UserRanking, { TIER_THRESHOLDS } from '../models/UserRanking.js';
import { io } from '../server.js';

/**
 * Calculate rating change based on match outcome
 * Uses ELO-like system with base rating of 1000
 */
export function calculateRatingChange(winnerRating, loserRating, isWin = true) {
  const K = 32; // Rating volatility factor
  const expectedScore = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));

  if (isWin) {
    return Math.round(K * (1 - expectedScore));
  } else {
    return Math.round(K * (0 - expectedScore));
  }
}

/**
 * Update user ranking after a race
 */
export async function updateUserRanking(userId, raceResult) {
  try {
    let userRanking = await UserRanking.findOne({ userId });

    // Create ranking if doesn't exist
    if (!userRanking) {
      userRanking = new UserRanking({
        userId,
        ratingPoints: 1000,
      });
    }

    const { isWin, opponentRating = 1000, wpm, accuracy } = raceResult;

    // Calculate rating change
    const ratingChange = calculateRatingChange(userRanking.ratingPoints, opponentRating, isWin);
    const previousRating = userRanking.ratingPoints;

    // Update rating
    userRanking.ratingPoints = Math.max(0, userRanking.ratingPoints + ratingChange);

    // Update stats
    userRanking.totalRaces += 1;
    if (isWin) {
      userRanking.racesWon += 1;
      userRanking.winStreak += 1;
      if (userRanking.winStreak > userRanking.maxWinStreak) {
        userRanking.maxWinStreak = userRanking.winStreak;
      }
    } else {
      userRanking.winStreak = 0;
    }

    // Update average stats
    userRanking.averageWpm = Math.round(
      (userRanking.averageWpm * (userRanking.totalRaces - 1) + wpm) / userRanking.totalRaces
    );
    userRanking.averageAccuracy = Math.round(
      (userRanking.averageAccuracy * (userRanking.totalRaces - 1) + accuracy) / userRanking.totalRaces
    );

    userRanking.updateWinRate();
    userRanking.calculateTier();
    userRanking.lastRaceDate = new Date();

    // Add to rating history (keep last 50 races)
    userRanking.ratingHistory.push({
      date: new Date(),
      ratingChange,
      result: isWin ? 'win' : 'loss',
    });
    if (userRanking.ratingHistory.length > 50) {
      userRanking.ratingHistory = userRanking.ratingHistory.slice(-50);
    }


    await userRanking.save();

    // Emit leaderboardUpdate event after ranking change
    const topRankings = await UserRanking.find().sort({ ratingPoints: -1 }).limit(100).lean();
    io.emit('leaderboardUpdate', topRankings);

    return {
      userRanking,
      ratingChange,
      previousRating,
      newRating: userRanking.ratingPoints,
      tier: userRanking.tier,
    };
  } catch (error) {
    console.error('Update user ranking error:', error);
    throw error;
  }
}

/**
 * Get tier info (requirements, etc.)
 */
export function getTierInfo(tier) {
  const tierList = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const tierIndex = tierList.indexOf(tier);

  return {
    tier,
    currentMinRating: TIER_THRESHOLDS[tier],
    nextTier: tierIndex < tierList.length - 1 ? tierList[tierIndex + 1] : null,
    nextTierMinRating: tierIndex < tierList.length - 1 ? TIER_THRESHOLDS[tierList[tierIndex + 1]] : null,
    tierNumber: tierIndex + 1,
    totalTiers: tierList.length,
  };
}

/**
 * Get all tiers and their thresholds
 */
export function getAllTiers() {
  return Object.entries(TIER_THRESHOLDS).map(([tier, minRating]) => ({
    tier,
    minRating,
  }));
}

/**
 * Reset seasonal ratings (monthly)
 * Keep tier but reduce rating by 20%
 */
export async function resetSeasonalRatings() {
  try {
    const allRankings = await UserRanking.find();

    for (const ranking of allRankings) {
      // Keep minimum of current rating or 1000
      ranking.ratingPoints = Math.max(1000, Math.round(ranking.ratingPoints * 0.8));
      ranking.winStreak = 0;
      ranking.seasonReset = new Date();
      ranking.calculateTier();
      await ranking.save();
    }

    return { updated: allRankings.length };
  } catch (error) {
    console.error('Season reset error:', error);
    throw error;
  }
}
