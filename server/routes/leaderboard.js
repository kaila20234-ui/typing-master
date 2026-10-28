import express from 'express';
import UserRanking from '../models/UserRanking.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get global leaderboard (top players by rating)
router.get('/global', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const rankings = await UserRanking.find()
      .sort({ ratingPoints: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username userId profilePicture')
      .lean();

    // Add rank position
    const ranked = rankings.map((r, idx) => ({
      ...r,
      rank: skip + idx + 1,
    }));

    const total = await UserRanking.countDocuments();

    res.json({
      leaderboard: ranked,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's rank and nearby players
router.get('/user-rank/:userId', async (req, res) => {
  try {
    const userRanking = await UserRanking.findOne({ userId: req.params.userId })
      .populate('userId', 'username userId profilePicture');

    if (!userRanking) {
      return res.status(404).json({ error: 'User ranking not found' });
    }

    // Get user's rank
    const betterRanks = await UserRanking.countDocuments({
      ratingPoints: { $gt: userRanking.ratingPoints },
    });
    const rank = betterRanks + 1;

    // Get nearby players (5 above, 5 below)
    const nearby = await UserRanking.find()
      .sort({ ratingPoints: -1 })
      .populate('userId', 'username userId profilePicture')
      .lean();

    const userIndex = nearby.findIndex(r => r.userId._id.toString() === req.params.userId);
    const nearbyPlayers = nearby.slice(Math.max(0, userIndex - 5), userIndex + 6);

    res.json({
      userRanking: { ...userRanking.toObject(), rank },
      nearbyPlayers,
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tier leaderboard (by tier)
router.get('/tier/:tier', async (req, res) => {
  try {
    const tier = req.params.tier;
    const limit = parseInt(req.query.limit) || 50;

    const rankings = await UserRanking.find({ tier })
      .sort({ ratingPoints: -1 })
      .limit(limit)
      .populate('userId', 'username userId profilePicture')
      .lean();

    const total = await UserRanking.countDocuments({ tier });

    res.json({
      tier,
      leaderboard: rankings,
      total,
    });
  } catch (error) {
    console.error('Get tier leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's detailed ranking info (protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let userRanking = await UserRanking.findOne({ userId: req.userId });

    // If ranking doesn't exist, create it (for users who registered before this feature)
    if (!userRanking) {
      console.log('[Leaderboard] Creating UserRanking for user:', req.userId);
      try {
        userRanking = new UserRanking({
          userId: req.userId,
          ratingPoints: 1000,
          tier: 'Bronze',
        });
        await userRanking.save();
        console.log('[Leaderboard] UserRanking created successfully');
      } catch (createError) {
        console.error('[Leaderboard] Failed to create UserRanking:', createError.message);
        return res.status(500).json({ error: 'Failed to initialize user ranking' });
      }
    }

    // Get rank position
    const betterRanks = await UserRanking.countDocuments({
      ratingPoints: { $gt: userRanking.ratingPoints },
    });
    const rank = betterRanks + 1;

    const betterInTier = await UserRanking.countDocuments({
      tier: userRanking.tier,
      ratingPoints: { $gt: userRanking.ratingPoints },
    });
    const tierRank = betterInTier + 1;

    res.json({
      ...userRanking.toObject(),
      rank,
      tierRank,
    });
  } catch (error) {
    console.error('[Leaderboard] Get user ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user rank by userId (public)
router.get('/rank/:userId', async (req, res) => {
  try {
    const userRanking = await UserRanking.findOne({ userId: req.params.userId });

    if (!userRanking) {
      return res.status(404).json({ error: 'User ranking not found' });
    }

    // Get rank position
    const betterRanks = await UserRanking.countDocuments({
      ratingPoints: { $gt: userRanking.ratingPoints },
    });
    const rank = betterRanks + 1;

    res.json({
      ...userRanking.toObject(),
      rank,
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
