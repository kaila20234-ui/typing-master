import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getTodaysChallenge,
  submitDailyChallengeAttempt,
  getDailyChallengeLeaderboard,
  getUserDailyPerformance,
  getPastChallenges,
  getUserPastChallengeRankings,
} from '../lib/dailyChallengeUtils.js';
import DailyChallenge from '../models/DailyChallenge.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/daily-challenge
 * Get today's daily challenge (no auth required)
 */
router.get('/', async (req, res) => {
  try {
    const challenge = await getTodaysChallenge();
    
    res.json({
      _id: challenge._id,
      date: challenge.date,
      title: challenge.title,
      description: challenge.description,
      challengeText: challenge.challengeText,
      challengeMode: challenge.challengeMode,
      difficulty: challenge.difficulty,
      targetWpm: challenge.targetWpm,
      startTime: challenge.startTime,
      endTime: challenge.endTime,
      totalSubmissions: challenge.submissions.length,
    });
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    res.status(500).json({ error: 'Failed to fetch daily challenge' });
  }
});

/**
 * GET /api/daily-challenge/leaderboard
 * Get daily challenge leaderboard (no auth required)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    console.log('Fetching daily challenge leaderboard with limit:', limit);
    
    const data = await getDailyChallengeLeaderboard(limit);
    
    if (data.error && !data.leaderboard) {
      return res.status(200).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error in leaderboard route:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/daily-challenge/me
 * Get current user's daily challenge performance (auth required)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const performance = await getUserDailyPerformance(userId);
    
    if (!performance) {
      return res.json(null);
    }

    res.json(performance);
  } catch (error) {
    console.error('Error fetching user daily performance:', error);
    res.status(500).json({ error: 'Failed to fetch daily performance' });
  }
});

/**
 * POST /api/daily-challenge/submit
 * Submit a daily challenge attempt (auth required)
 */
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { wpm, accuracy, timeSpent } = req.body;
    const userId = req.userId;

    // Fetch user to get username and userCode
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = user.username;
    const userCode = user.userId; // USER_XXXXXX format from auth

    if (!wpm || accuracy === undefined) {
      return res.status(400).json({ error: 'Missing required fields: wpm, accuracy' });
    }

    const result = await submitDailyChallengeAttempt(userId, username, userCode, wpm, accuracy, timeSpent || 0);

    res.json({
      success: true,
      score: result.score,
      rank: result.rank,
      reward: result.reward,
      message: result.rank && result.rank <= 10 
        ? `Congratulations! You're ranked #${result.rank}!` 
        : 'Your submission has been recorded.',
    });
  } catch (error) {
    console.error('Error submitting daily challenge:', error);
    res.status(500).json({ error: 'Failed to submit daily challenge' });
  }
});

/**
 * GET /api/daily-challenge/past
 * Get past daily challenges (no auth required)
 */
router.get('/past', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const challenges = await getPastChallenges(days);
    
    res.json({ challenges });
  } catch (error) {
    console.error('Error fetching past challenges:', error);
    res.status(500).json({ error: 'Failed to fetch past challenges' });
  }
});

/**
 * GET /api/daily-challenge/history
 * Get user's past daily challenge rankings (auth required)
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const days = parseInt(req.query.days) || 7;
    const rankings = await getUserPastChallengeRankings(userId, days);
    
    res.json({ rankings });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ error: 'Failed to fetch user history' });
  }
});

/**
 * GET /api/daily-challenge/:challengeId/leaderboard
 * Get specific challenge's leaderboard (no auth required)
 */
router.get('/:challengeId/leaderboard', async (req, res) => {
  try {
    const challenge = await DailyChallenge.findById(req.params.challengeId);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const leaderboard = challenge.getLeaderboard();

    res.json({
      challenge: {
        _id: challenge._id,
        date: challenge.date,
        title: challenge.title,
        difficulty: challenge.difficulty,
      },
      leaderboard: leaderboard.slice(0, 100),
      totalSubmissions: challenge.submissions.length,
    });
  } catch (error) {
    console.error('Error fetching challenge leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch challenge leaderboard' });
  }
});

export default router;
