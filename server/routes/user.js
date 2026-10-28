import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username profilePicture');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('friends', 'username profilePicture')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Cannot update other user profiles' });
    }

    const { name, bio, profilePicture } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, bio, profilePicture },
      { new: true }
    );

    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user stats
router.put('/:userId/stats', async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Cannot update other user stats' });
    }

    const { bestWpm, averageWpm, totalTests, totalRaces, racesWon } = req.body;

    const user = await User.findById(req.userId);

    if (bestWpm !== undefined && bestWpm > user.stats.bestWpm) {
      user.stats.bestWpm = bestWpm;
    }
    if (averageWpm !== undefined) user.stats.averageWpm = averageWpm;
    if (totalTests !== undefined) user.stats.totalTests = totalTests;
    if (totalRaces !== undefined) user.stats.totalRaces = totalRaces;
    if (racesWon !== undefined) user.stats.racesWon = racesWon;

    // Calculate win rate
    if (user.stats.totalRaces > 0) {
      user.stats.winRate = (user.stats.racesWon / user.stats.totalRaces * 100).toFixed(1);
    }

    await user.save();

    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { username: { $regex: req.params.query, $options: 'i' } },
        { name: { $regex: req.params.query, $options: 'i' } },
      ],
    })
      .select('-password')
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
