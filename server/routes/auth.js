import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import UserRanking from '../models/UserRanking.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateUserId } from '../lib/idGenerator.js';

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, username, name, password, picture, isAdmin, adminSecret } = req.body;

    // Validation
    if (!email || !username || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If trying to create admin account, verify admin secret
    if (isAdmin) {
      const expectedSecret = process.env.ADMIN_SECRET || 'admin_secret_key_123';
      if (adminSecret !== expectedSecret) {
        return res.status(403).json({ error: 'Invalid admin secret' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already registered' });
    }

    // Create new user
    let userId;
    let isUnique = false;
    
    // Generate unique userId
    while (!isUnique) {
      userId = generateUserId();
      const existingUserId = await User.findOne({ userId });
      if (!existingUserId) {
        isUnique = true;
      }
    }

    const user = new User({
      userId,
      email,
      username: username.toLowerCase(),
      name,
      password,
      profilePicture: picture || null,
      role: isAdmin ? 'admin' : 'user',
    });

    await user.save();

    // Create UserRanking record for new user
    try {
      const userRanking = new UserRanking({
        userId: user._id,
        ratingPoints: 1000,
        tier: 'Bronze',
      });
      await userRanking.save();
      console.log('[Auth] UserRanking created for user:', user._id);
    } catch (rankingError) {
      console.error('[Auth] Failed to create UserRanking:', rankingError.message);
      // Don't fail registration if ranking creation fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
      { expiresIn: '7d' }
    );

    const userData = user.toJSON();
    // Map _id to id for frontend consistency
    userData.id = userData._id;

    res.status(201).json({
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Register error:', error.message, error.stack);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Ensure user has a userId (fix for legacy users)
    if (!user.userId) {
      let userId;
      let isUnique = false;
      
      // Generate unique userId
      while (!isUnique) {
        userId = generateUserId();
        const existingUserId = await User.findOne({ userId });
        if (!existingUserId) {
          isUnique = true;
        }
      }
      
      user.userId = userId;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
      { expiresIn: '7d' }
    );

    const userData = user.toJSON();
    // Map _id to id for frontend consistency
    userData.id = userData._id;

    res.json({
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Verify token endpoint
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = user.toJSON();
    // Map _id to id for frontend consistency
    userData.id = userData._id;
    res.json({ user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
