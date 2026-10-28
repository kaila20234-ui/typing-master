import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import routes
import authRoutes from './routes/auth.js';
import raceRoutes from './routes/race.js';
import userRoutes from './routes/user.js';
import leaderboardRoutes from './routes/leaderboard.js';
import invitationRoutes from './routes/invitation.js';
import dailyChallengeRoutes from './routes/dailyChallenge.js';
import tournamentRoutes from './routes/tournament.js';
import squadRoutes from './routes/squad.js';
import paymentRoutes from './routes/payment.js';
import livePlayerRoutes, { setLivePlayersApi } from './routes/livePlayer.js';

// Import models
import User from './models/User.js';
import Race from './models/Race.js';
import Tournament from './models/Tournament.js';
import Payment from './models/Payment.js';

// Import middleware
import { authMiddleware, requireAdmin } from './middleware/auth.js';

// Import socket handlers
import { setupRaceSocket } from './socket/raceHandler.js';
import { setupLivePlayersSocket } from './socket/livePlayersHandler.js';
import { startChallengeScheduler } from './lib/challengeScheduler.js';

const app = express();
const httpServer = createServer(app);
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5174', // Admin app
      'http://localhost:5175', // Alternative admin app port
    ],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('Authentication token required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production');
    if (!decoded || !decoded.userId) {
      throw new Error('Invalid authentication token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    socket.data.userId = user._id.toString();
    socket.data.username = user.username;
    socket.data.profilePicture = user.profilePicture;
    next();
  } catch (error) {
    next(error);
  }
});

// io is exported above

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174', // Admin app
    'http://localhost:5175', // Alternative admin app port
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/typemaster')
  .then(() => {
    console.log('✅ MongoDB connected');
    // Start challenge scheduler after DB is connected
    startChallengeScheduler(0); // Publish daily challenges at midnight UTC
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Public endpoints (no auth required)
app.get('/api/users/count/competitors', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const count = await User.countDocuments();
    res.json({ count: Math.max(count, 100) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
import adminRoutes from './routes/admin.js';
import DailyChallenge from './models/DailyChallenge.js';
import SquadWar from './models/SquadWar.js';
import Leaderboard from './models/Leaderboard.js';
import Settings from './models/Settings.js';

// Public Settings Endpoint (before admin routes middleware)
app.get('/api/admin/public-settings/maintenance', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      return res.json({ 
        enabled: false, 
        message: 'We are currently undergoing scheduled maintenance. Please check back soon!' 
      });
    }

    // Auto-disable maintenance if time has passed
    if (settings.maintenanceMode?.enabled && settings.maintenanceMode?.estimatedTime) {
      const estimatedTime = new Date(settings.maintenanceMode.estimatedTime);
      if (new Date() > estimatedTime) {
        settings.maintenanceMode.enabled = false;
        await settings.save();
      }
    }

    res.json({
      enabled: settings.maintenanceMode?.enabled || false,
      message: settings.maintenanceMode?.message || 'Under maintenance',
      estimatedTime: settings.maintenanceMode?.estimatedTime || null
    });
  } catch (error) {
    res.status(200).json({ enabled: false, error: error.message });
  }
});

// Admin routes
app.use('/api/admin', adminRoutes);

// Admin endpoints exposed at root level for admin app
app.get('/api/payments', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(50);
    res.json(payments.length > 0 ? payments : [{ id: 1, userId: 'user1', amount: 29.99, status: 'completed', date: new Date().toISOString() }]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/:id/refund', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundReason = req.body.reason || 'Refund processed by admin';
    await payment.save();

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/squadwars', async (req, res) => {
  try {
    const wars = await SquadWar.find().sort({ createdAt: -1 }).limit(50);
    res.json(wars.length > 0 ? wars : [{ id: 1, title: 'Squad War #1', status: 'active', squadAName: 'Squad A', squadBName: 'Squad B', squadAScore: 100, squadBScore: 85 }]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dailyChallenge', async (req, res) => {
  try {
    const challenges = await DailyChallenge.find().sort({ date: -1 }).limit(50);
    res.json(challenges.length > 0 ? challenges : [{ id: 1, date: new Date().toISOString(), title: 'Daily Speed Challenge', completions: 42 }]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoints
app.get('/api/statistics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRaces = await Race.countDocuments();
    const totalTournaments = await Tournament.countDocuments();
    const totalRevenue = await Payment.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);
    
    res.json({
      totalUsers,
      totalRaces,
      totalTournaments,
      totalRevenue: totalRevenue[0]?.sum || 0,
      userGrowth: '+15%',
      raceIncrase: '+23%',
      revenueGrowth: '+12%',
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/statistics/export', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRaces = await Race.countDocuments();
    const totalTournaments = await Tournament.countDocuments();
    const totalRevenue = await Payment.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);
    
    const csv = 'Metric,Value\nTotal Users,' + totalUsers + '\nTotal Races,' + totalRaces + '\nTotal Tournaments,' + totalTournaments + '\nTotal Revenue,' + (totalRevenue[0]?.sum || 0);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="statistics.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Moderation endpoints
app.get('/api/moderation/reports', async (req, res) => {
  try {
    const reports = [
      { id: 1, user: 'user_456', reason: 'Inappropriate language', reporter: 'user_789', date: '2026-02-28', status: 'pending' },
      { id: 2, user: 'typeFast', reason: 'Possible cheating', reporter: 'user_123', date: '2026-02-27', status: 'reviewing' },
      { id: 3, user: 'spamBot', reason: 'Spam messages', reporter: 'system', date: '2026-02-26', status: 'banned' },
    ];
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Other routes
app.use('/api/auth', authRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboards = await Leaderboard.find().sort({ rank: 1 }).limit(100);
    res.json(leaderboards.length > 0 ? leaderboards : [{ userId: 'user1', username: 'Player1', bestWpm: 150, rank: 1 }]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/daily-challenge', dailyChallengeRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/squads', squadRoutes);
app.use('/api/competitions', paymentRoutes);
app.use('/api/invitations', authMiddleware, invitationRoutes);
app.use('/api/live-players', livePlayerRoutes);

// Socket.io event handlers
setupRaceSocket(io);
const livePlayersApi = setupLivePlayersSocket(io);
setLivePlayersApi(livePlayersApi);

// Make io instance available to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready at ws://localhost:${PORT}`);
});
