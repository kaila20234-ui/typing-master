import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Race from '../models/Race.js';
import Tournament from '../models/Tournament.js';
import Payment from '../models/Payment.js';
import SquadWar from '../models/SquadWar.js';
import DailyChallenge from '../models/DailyChallenge.js';
import Leaderboard from '../models/Leaderboard.js';
import Report from '../models/Report.js';
import Settings from '../models/Settings.js';
import Activity from '../models/Activity.js';
import CompetitionRegistration from '../models/CompetitionRegistration.js';
import { startRaceCountdown } from '../socket/raceHandler.js';

const router = express.Router();

/**
 * Middleware: All admin routes require authentication and admin role
 */
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * Enhanced helper function to log activities with admin context
 */
async function logActivity(type, title, description, userId, username, relatedId, relatedType, metadata, adminUser = null) {
  try {
    const activity = new Activity({
      type,
      title,
      description,
      userId: userId || null,
      username: username || null,
      relatedId,
      relatedType,
      metadata: {
        ...metadata,
        adminUser: adminUser ? { userId: adminUser._id, username: adminUser.username } : null
      }
    });
    await activity.save();
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

/**
 * GET /api/admin/stats/overview
 * Returns dashboard statistics for admin panel
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const usersThisMonth = await User.countDocuments({ joinDate: { $gte: new Date(new Date().setDate(1)) } });
    const activeRaces = await Race.countDocuments({ status: 'active' });
    const racesToday = await Race.countDocuments({ startDate: { $gte: new Date(new Date().setHours(0,0,0,0)) } });
    const totalTournaments = await Tournament.countDocuments();
    const activeTournaments = await Tournament.countDocuments({ status: 'active' });
    const totalRevenue = await Payment.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);
    const revenueGrowth = '+12%'; // Placeholder, implement real calculation if needed

    res.json({
      totalUsers,
      usersThisMonth,
      activeRaces,
      racesToday,
      totalTournaments,
      activeTournaments,
      totalRevenue: totalRevenue[0]?.sum || 0,
      revenueGrowth,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/activity
 * Returns recent platform activity for dashboard
 */
router.get('/activity', async (req, res) => {
  try {
    const activity = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    // Format activity for frontend display
    const formattedActivity = activity.map(act => ({
      type: getActivityType(act.type),
      title: act.title,
      timestamp: getTimeAgo(act.createdAt),
      description: act.description,
      metadata: act.metadata
    }));
    
    res.json({ activity: formattedActivity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to get display type for activity
 */
function getActivityType(type) {
  const typeMap = {
    'user_registration': 'Users',
    'user_suspension': 'Users',
    'user_deletion': 'Users',
    'race_started': 'Races',
    'race_completed': 'Races',
    'tournament_started': 'Tournament',
    'tournament_ended': 'Tournament',
    'report_submitted': 'Moderation',
    'report_resolved': 'Moderation',
    'user_banned': 'Moderation',
    'payment_received': 'Payments',
    'payment_refunded': 'Payments',
    'maintenance_enabled': 'System',
    'maintenance_disabled': 'System',
    'challenge_completed': 'Challenge'
  };
  return typeMap[type] || 'Event';
}

/**
 * Helper function to format timestamp
 */
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

/**
 * GET /api/admin/payments
 * Returns payment records for admin payment management with filtering and sorting
 */
router.get('/payments', async (req, res) => {
  try {
    const { status, type, sortBy } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const sort = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    
    const payments = await Payment.find(filter)
      .populate('userId', 'username email')
      .sort(sort)
      .limit(100);
    
    // Format response
    const formatted = payments.map(p => ({
      _id: p._id,
      userId: p.userId?._id || p.userId,
      username: p.username || p.userId?.username || 'Unknown',
      amount: p.amount,
      currency: p.currency || 'USD',
      type: p.type,
      description: p.description,
      paymentMethod: p.paymentMethod,
      status: p.status,
      transactionId: p.transactionId,
      createdAt: p.createdAt,
    }));
    
    res.json(formatted.length > 0 ? formatted : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/payments/stats/overview
 * Returns payment statistics
 */
router.get('/payments/stats/overview', async (req, res) => {
  try {
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const failedPayments = await Payment.countDocuments({ status: 'failed' });
    const refundedAmount = await Payment.aggregate([
      { $match: { status: 'refunded' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    
    res.json({
      totalRevenue: totalRevenue[0]?.sum || 0,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedAmount: refundedAmount[0]?.sum || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/payments
 * Create a payment record (manual creation)
 */
router.post('/payments', async (req, res) => {
  try {
    const { userId, username, amount, type, description, paymentMethod, status } = req.body;
    
    if (!userId && !username) {
      return res.status(400).json({ error: 'User ID or username is required' });
    }
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ username });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const payment = new Payment({
      userId: user._id,
      username: user.username,
      amount: Number(amount),
      type: type || 'entry',
      description: description || '',
      paymentMethod: paymentMethod || 'internal',
      status: status || 'completed',
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
    
    await payment.save();

    // Log payment activity
    if (status !== 'failed') {
      await logActivity(
        'payment_received',
        `Payment of $${amount} received from "${user.username}"`,
        `Payment: ${description || type}`,
        user._id,
        user.username,
        payment._id.toString(),
        'Payment',
        { amount, type, paymentMethod },
        req.user
      );
    }

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/payments/:id
 * Update a payment record
 */
router.put('/payments/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/payments/:id/refund
 * Process refund for a payment
 */
router.post('/payments/:id/refund', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    
    const payment = await Payment.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'refunded',
        refundedAt: new Date()
      }, 
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Log payment refund activity
    await logActivity(
      'payment_refunded',
      `Payment of $${payment.amount} refunded to "${payment.username}"`,
      `Refund processed for payment: ${payment.description || payment.type}`,
      payment.userId,
      payment.username,
      payment._id.toString(),
      'Payment',
      { amount: payment.amount },
      req.user
    );
    
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/payments/:id
 * Delete a payment record
 */
router.delete('/payments/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ success: true, message: 'Payment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/squadwars
 * Returns squad war records for admin management
 */
router.get('/squadwars', async (req, res) => {
  try {
    const wars = await SquadWar.find().sort({ createdAt: -1 }).limit(50);
    res.json(wars.length > 0 ? wars : [{ id: 1, title: 'Squad War #1', status: 'active', squadAName: 'Squad A', squadBName: 'Squad B', squadAScore: 100, squadBScore: 85 }]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/leaderboard
 * Returns leaderboard records for admin viewing
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboards = await Leaderboard.find().sort({ rank: 1 }).limit(100);
    const formattedLeaderboards = leaderboards.map((lb) => ({
      _id: lb._id,
      userId: lb.userId,
      username: lb.username,
      wpm: lb.bestWpm || lb.wpm || 0,
      races: lb.racesCompleted || 0,
      wins: lb.wins || 0,
      winRate: lb.winRate || '0%',
      rank: lb.rank || 0,
    }));
    res.json(formattedLeaderboards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/dailyChallenge
 * Returns daily challenge records for admin management
 */
router.get('/dailyChallenge', async (req, res) => {
  try {
    const challenges = await DailyChallenge.find().sort({ date: -1 }).limit(50);
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/**
 * GET /api/admin/users
 * Returns all users for admin user management
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').limit(100);
    res.json(users.length > 0 ? users : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update a user by admin (status, etc.)
 */
router.put('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log activity for status changes
    if (req.body.status) {
      if (req.body.status === 'suspended') {
        await logActivity(
          'user_suspension',
          `User "${user.username}" has been suspended`,
          `Admin suspended user: ${user.username}`,
          req.params.id,
          user.username,
          null,
          'User',
          { reason: req.body.reason || 'No reason provided' },
          req.user
        );
      }
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user by admin
 */
router.delete('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log user deletion
    await logActivity(
      'user_deletion',
      `User "${user.username}" has been deleted`,
      `Admin deleted user: ${user.username} (${user.email})`,
      req.params.id,
      user.username,
      null,
      'User',
      { email: user.email },
      req.user
    );

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/moderation/reports
 * Returns moderation reports for admin review
 */
router.get('/moderation/reports', async (req, res) => {
  try {
    const { status, sortBy } = req.query;
    const filter = status ? { status } : {};
    const sort = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    
    const reports = await Report.find(filter)
      .sort(sort)
      .limit(100)
      .populate('reportedUser', 'username email')
      .populate('reporter', 'username');
    
    res.json(reports.length > 0 ? reports : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/moderation/reports
 * Create a new report
 */
router.post('/moderation/reports', async (req, res) => {
  try {
    const { reportedUserId, reason, description, evidence, reporterUsername } = req.body;
    
    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'Reported user ID and reason are required' });
    }
    
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ error: 'Reported user not found' });
    }
    
    const report = new Report({
      reportedUser: reportedUserId,
      reportedUsername: reportedUser.username,
      reason,
      description: description || '',
      evidence: evidence || '',
      reporterUsername: reporterUsername || 'system',
      status: 'pending',
    });
    
    await report.save();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/moderation/reports/:id
 * Update a report status
 */
router.put('/moderation/reports/:id', async (req, res) => {
  try {
    const { status, actionTaken, actionTakenBy } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }
    
    const updateData = { status };
    if (actionTaken) updateData.actionTaken = actionTaken;
    if (actionTakenBy) updateData.actionTakenBy = actionTakenBy;
    if (status === 'resolved' || status === 'banned' || status === 'dismissed') {
      updateData.resolvedAt = new Date();
    }
    
    const report = await Report.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/moderation/reports/:id/ban
 * Ban user from a report
 */
router.post('/moderation/reports/:id/ban', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update user status to suspended
    const user = await User.findByIdAndUpdate(
      report.reportedUser,
      { status: 'suspended' },
      { new: true }
    );
    
    // Update report status to banned
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'banned', actionTaken: 'User suspended', resolvedAt: new Date() },
      { new: true }
    );
    
    // Log user ban activity
    await logActivity(
      'user_banned',
      `User "${report.reportedUsername}" has been banned`,
      `User banned due to report: ${report.reason}`,
      report.reportedUser,
      report.reportedUsername,
      req.params.id,
      'Report',
      { reason: report.reason },
      req.user
    );

    res.json({ success: true, report: updatedReport, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/moderation/reports/:id
 * Delete a report
 */
router.delete('/moderation/reports/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }
    
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/tournaments
 * Returns all tournaments for admin management
 */
router.get('/tournaments', async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ createdAt: -1 }).limit(100);
    res.json(tournaments.length > 0 ? tournaments : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/tournaments
 * Create a new tournament
 */
router.post('/tournaments', async (req, res) => {
  try {
    const tournament = new Tournament({
      name: req.body.name,
      description: req.body.description,
      type: req.body.type || 'single-elimination',
      maxParticipants: req.body.maxParticipants,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      entryFee: req.body.entryFee || 5.00,
      status: 'registration',
    });
    await tournament.save();
    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/tournaments/:id
 * Update a tournament
 */
router.put('/tournaments/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/tournaments/:id
 * Delete a tournament
 */
router.delete('/tournaments/:id', async (req, res) => {
  try {
    await Tournament.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/tournaments/:id/generate-bracket
 * Generate tournament bracket from registered participants
 */
router.post('/tournaments/:id/generate-bracket', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    if (tournament.participants.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 participants to generate bracket' });
    }

    // Generate bracket using existing method
    tournament.generateBracket();
    tournament.bracketGenerated = true;
    tournament.status = 'in-progress';
    tournament.registrationOpen = false; // Close registration after bracket generation
    await tournament.save();

    // Log admin action
    await logActivity(
      'tournament_admin_action',
      `Admin generated bracket for tournament "${tournament.name}"`,
      `Tournament bracket generated: ${tournament.name} (${tournament.participants.length} participants)`,
      null,
      req.user.username,
      tournament._id.toString(),
      'Tournament',
      { action: 'generate-bracket', participantCount: tournament.participants.length },
      req.user
    );

    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/tournaments/:id/advance
 * Manually advance a participant to next round (record match result)
 */
router.post('/tournaments/:id/advance', async (req, res) => {
  try {
    const { round, matchNumber, winnerId, participant1Score, participant2Score } = req.body;

    if (!round || !matchNumber || !winnerId) {
      return res.status(400).json({ error: 'round, matchNumber, and winnerId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Find the match
    const match = tournament.bracket.find(m => m.round === round && m.matchNumber === matchNumber);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Record result
    const isWinner1 = winnerId.toString() === match.participant1.userId.toString();
    match.status = 'completed';
    match.winner = winnerId;
    match.completedAt = new Date();

    if (isWinner1) {
      match.participant1.isWinner = true;
      match.participant1.score = participant1Score || 0;
      match.participant2.score = participant2Score || 0;
    } else {
      match.participant2.isWinner = true;
      match.participant1.score = participant1Score || 0;
      match.participant2.score = participant2Score || 0;
    }

    await tournament.save();

    // Log admin action
    await logActivity(
      'tournament_admin_action',
      `Admin advanced participant in tournament "${tournament.name}"`,
      `Round ${round}, Match ${matchNumber} - Winner: ${isWinner1 ? match.participant1.username : match.participant2.username}`,
      winnerId,
      isWinner1 ? match.participant1.username : match.participant2.username,
      tournament._id.toString(),
      'Tournament',
      { action: 'advance', round, matchNumber },
      req.user
    );

    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/tournaments/:id/set-prize-pool
 * Configure tournament prize distribution
 */
router.post('/tournaments/:id/set-prize-pool', async (req, res) => {
  try {
    const { totalReward, distribution } = req.body;

    if (!totalReward || !distribution) {
      return res.status(400).json({ error: 'totalReward and distribution are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    tournament.prizePool.totalReward = totalReward;
    tournament.prizePool.distribution = distribution;
    await tournament.save();

    // Log admin action
    await logActivity(
      'tournament_admin_action',
      `Admin set prize pool for tournament "${tournament.name}"`,
      `Prize pool configured: $${totalReward} total reward`,
      null,
      req.user.username,
      tournament._id.toString(),
      'Tournament',
      { action: 'set-prize-pool', totalReward, distributionCount: distribution.length },
      req.user
    );

    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/tournaments/:id/force-end
 * Cancel or forcefully end a tournament
 */
router.post('/tournaments/:id/force-end', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled',
        endDate: new Date()
      },
      { new: true }
    );

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Process refunds for all participants
    const Payment = require('../models/Payment.js').default;
    const CompetitionRegistration = require('../models/CompetitionRegistration.js').default;
    
    try {
      // Find all confirmed payments for this tournament
      const payments = await Payment.find({
        competitionId: tournament._id,
        status: 'completed'
      });

      // Create refunds for each payment
      for (const payment of payments) {
        payment.status = 'refunded';
        payment.refundReason = `Tournament cancelled by admin: ${req.body.reason || 'No reason provided'}`;
        payment.refundedAt = new Date();
        await payment.save();
      }

      // Also mark registrations as refunded
      await CompetitionRegistration.updateMany(
        { competitionId: tournament._id },
        { 
          status: 'refunded',
          refundReason: `Tournament cancelled by admin: ${req.body.reason || 'No reason provided'}`,
          refundedAt: new Date()
        }
      );
    } catch (refundError) {
      console.error('Error processing refunds:', refundError);
      // Don't fail the tournament cancellation if refund processing has issues
    }

    // Log admin action
    await logActivity(
      'tournament_admin_action',
      `Admin force-ended tournament "${tournament.name}"`,
      `Tournament cancelled by admin: ${req.body.reason || 'No reason provided'}`,
      null,
      req.user.username,
      tournament._id.toString(),
      'Tournament',
      { action: 'force-end', reason: req.body.reason, refundsProcessed: true },
      req.user
    );

    res.json({ success: true, tournament, message: 'Tournament cancelled and refunds processed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/tournaments/:id/bracket
 * Get tournament bracket structure
 */
router.get('/tournaments/:id/bracket', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Organize bracket by rounds
    const roundBracket = {};
    tournament.bracket.forEach(match => {
      if (!roundBracket[match.round]) {
        roundBracket[match.round] = [];
      }
      roundBracket[match.round].push(match);
    });

    res.json({
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        type: tournament.type,
        status: tournament.status,
        bracketGenerated: tournament.bracketGenerated,
        participantCount: tournament.participants.length
      },
      bracket: roundBracket,
      prizePool: tournament.prizePool
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/races
 * Returns all races for admin management
 */
router.get('/races', async (req, res) => {
  try {
    const races = await Race.find().sort({ createdAt: -1 }).limit(100);
    res.json(races.length > 0 ? races : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/races/:id/registrations
 * Returns all paid/registered users for a race so admins can see user IDs
 */
router.get('/races/:id/registrations', async (req, res) => {
  try {
    let race = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      race = await Race.findById(req.params.id);
    } else {
      race = await Race.findOne({ roomId: req.params.id });
    }

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const registrations = await CompetitionRegistration.find({
      competition: race._id,
      competitionType: 'race',
    })
      .populate('user', 'username email userId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      raceId: race._id,
      roomId: race.roomId,
      registrations: registrations.map((reg) => ({
        _id: reg._id,
        userId: reg.user?._id || reg.user,
        username: reg.username || reg.user?.username || 'Unknown',
        email: reg.email || reg.user?.email || null,
        paymentStatus: reg.paymentStatus,
        registrationStatus: reg.registrationStatus,
        createdAt: reg.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin race registrations error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/races
 * Create a new race from admin panel
 */
router.post('/races', async (req, res) => {
  try {
    const { name, description, maxParticipants } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Race name is required' });
    }

    const race = new Race({
      roomId: `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: description || 'Admin-created race',
      raceType: 'passage',
      difficulty: 'intermediate',
      maxParticipants: maxParticipants || 100,
      status: 'waiting',
      participants: [],
    });

    await race.save();
    res.json({ success: true, race });
  } catch (error) {
    console.error('Admin race creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/races/:id
 * Update a race
 */
router.put('/races/:id', async (req, res) => {
  try {
    const race = await Race.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, race });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/races/:id
 * Delete a race
 */
router.delete('/races/:id', async (req, res) => {
  try {
    await Race.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/races/:id/deadline
 * Set race deadline
 */
router.post('/races/:id/deadline', async (req, res) => {
  try {
    const { deadline } = req.body;
    if (!deadline) {
      return res.status(400).json({ error: 'Deadline is required' });
    }
    const race = await Race.findByIdAndUpdate(
      req.params.id,
      { registrationDeadline: new Date(deadline) },
      { new: true }
    );
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    res.json({ success: true, race });
  } catch (error) {
    console.error('Deadline update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/races/:id/force-start
 * Force a race to start immediately
 */
router.post('/races/:id/force-start', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }

    const race = await Race.findById(req.params.id);

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    race.forcedStatus = 'started';
    race.status = 'ready';
    race.registrationOpen = false;
    race.adminNotes = req.body.notes || 'Admin force-started race';
    await race.save();

    // Log admin action
    await logActivity(
      'race_admin_action',
      `Admin force-started race "${race.roomId}"`,
      `Race force-started by admin: ${race.roomId}`,
      null,
      req.user.username,
      race._id.toString(),
      'Race',
      { action: 'force-start' },
      req.user
    );

    // Broadcast to connected race participants via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(race.roomId).emit('race:admin-force-start', {
        message: `Race force-started by admin ${req.user.username}`,
        adminName: req.user.username,
        roomId: race.roomId,
        timestamp: new Date(),
      });
      await startRaceCountdown(io, race.roomId);
    }

    res.json({ success: true, race });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/races/:id/force-end
 * Force a race to end and calculate results
 */
router.post('/races/:id/force-end', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }

    const race = await Race.findByIdAndUpdate(
      req.params.id,
      {
        forcedStatus: 'ended',
        status: 'completed',
        completedAt: new Date(),
        registrationOpen: false,
        adminNotes: req.body.notes || 'Admin force-ended race'
      },
      { new: true }
    );

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    // Log admin action
    await logActivity(
      'race_admin_action',
      `Admin force-ended race "${race.roomId}"`,
      `Race force-ended by admin: ${race.roomId}`,
      null,
      req.user.username,
      race._id.toString(),
      'Race',
      { action: 'force-end' },
      req.user
    );

    // Broadcast to connected race participants via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(race.roomId).emit('race:admin-force-end', {
        message: `Race force-ended by admin ${req.user.username}`,
        adminName: req.user.username,
        roomId: race.roomId,
        timestamp: new Date(),
      });
    }

    res.json({ success: true, race });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/races/:id/participants/:userId
 * Remove a participant from a race (only before race starts)
 */
router.delete('/races/:id/participants/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }

    const race = await Race.findById(req.params.id);
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    if (race.status !== 'waiting') {
      return res.status(400).json({ error: 'Cannot remove participants after race has started' });
    }

    // Find and remove participant
    const participant = race.participants.find(p => p.userId.toString() === req.params.userId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    race.participants = race.participants.filter(p => p.userId.toString() !== req.params.userId);
    await race.save();

    // Log admin action
    await logActivity(
      'race_admin_action',
      `Admin removed participant "${participant.username}" from race "${race.roomId}"`,
      `Participant removed: ${participant.username}`,
      req.params.userId,
      participant.username,
      race._id.toString(),
      'Race',
      { action: 'remove-participant' },
      req.user
    );

    res.json({ success: true, message: 'Participant removed', race });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/races/:id/live-data
 * Get live race data (current progress of all participants)
 */
router.get('/races/:id/live-data', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }

    const race = await Race.findById(req.params.id).populate('participants.userId', 'username profilePicture');
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const liveData = {
      race: {
        roomId: race.roomId,
        status: race.status,
        raceType: race.raceType,
        difficulty: race.difficulty,
        startedAt: race.startedAt,
      },
      participants: race.participants.map(p => ({
        userId: p.userId._id,
        username: p.username,
        profilePicture: p.profilePicture,
        wpm: p.wpm,
        accuracy: p.accuracy,
        position: p.position,
        raceStatus: p.raceStatus,
        finishTime: p.finishTime,
        characterCount: p.characterCount,
      })).sort((a, b) => a.position - b.position),
      leaderboard: race.participants
        .filter(p => p.raceStatus === 'finished')
        .sort((a, b) => a.finishTime - b.finishTime)
        .map((p, idx) => ({
          rank: idx + 1,
          username: p.username,
          wpm: p.wpm,
          accuracy: p.accuracy,
          finishTime: p.finishTime,
        }))
    };

    res.json(liveData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/races/:id/override-result
 * Manually override race results (set winner or adjust results)
 */
router.post('/races/:id/override-result', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }

    const { winnerId, participantAdjustments } = req.body;
    if (!winnerId && !participantAdjustments) {
      return res.status(400).json({ error: 'Either winnerId or participantAdjustments is required' });
    }

    let race = await Race.findById(req.params.id);
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    if (winnerId) {
      // Set specific winner
      const winner = race.participants.find(p => p.userId.toString() === winnerId);
      if (!winner) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      // Mark all others as not winners
      race.participants.forEach(p => {
        if (p.userId.toString() === winnerId) {
          p.position = 1;
        } else {
          p.position = race.participants.indexOf(p) + 2;
        }
      });
    }

    if (participantAdjustments) {
      // Apply individual adjustments
      participantAdjustments.forEach(adj => {
        const participant = race.participants.find(p => p.userId.toString() === adj.userId);
        if (participant) {
          if (adj.wpm !== undefined) participant.wpm = adj.wpm;
          if (adj.accuracy !== undefined) participant.accuracy = adj.accuracy;
          if (adj.position !== undefined) participant.position = adj.position;
        }
      });
    }

    race.adminNotes = req.body.reason || 'Admin override of race results';
    await race.save();

    // Log admin action
    await logActivity(
      'race_admin_action',
      `Admin overrode results for race "${race.roomId}"`,
      `Race results overridden by admin: ${race.roomId}`,
      null,
      req.user.username,
      race._id.toString(),
      'Race',
      { action: 'override-result', winnerId, adjustmentCount: participantAdjustments?.length || 0 },
      req.user
    );

    res.json({ success: true, race });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/dailyChallenge
 * Create a new daily challenge
 */
router.post('/dailyChallenge', async (req, res) => {
  try {
    const { title, description, difficulty, targetWpm, date, challengeText } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!challengeText) {
      return res.status(400).json({ error: 'Challenge text is required' });
    }

    const challenge = new DailyChallenge({
      title,
      description: description || 'Complete today\'s typing challenge and compete for the top spot!',
      challengeText,
      difficulty: difficulty || 'intermediate',
      targetWpm: targetWpm || 60,
      date: date ? new Date(date) : new Date(),
      challengeMode: 'passage',
    });

    await challenge.save();
    res.json({ success: true, challenge });
  } catch (error) {
    console.error('Daily challenge creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/dailyChallenge/:id
 * Update a daily challenge
 */
router.put('/dailyChallenge/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid challenge ID format' });
    }
    
    const challenge = await DailyChallenge.findByIdAndUpdate(id, req.body, { new: true });
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/dailyChallenge/:id
 * Delete a daily challenge
 */
router.delete('/dailyChallenge/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid challenge ID format' });
    }
    
    const challenge = await DailyChallenge.findByIdAndDelete(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/dailyChallenge/schedule
 * Schedule challenges for specific dates (bulk scheduling)
 */
router.post('/dailyChallenge/schedule', async (req, res) => {
  try {
    const { challenges } = req.body;

    if (!challenges || !Array.isArray(challenges) || challenges.length === 0) {
      return res.status(400).json({ error: 'challenges array is required' });
    }

    const scheduledChallenges = [];

    for (const challengeData of challenges) {
      const { scheduledDate, title, description, difficulty, targetWpm, challengeText, challengeMode } = challengeData;

      if (!scheduledDate || !challengeText) {
        continue;
      }

      const challenge = new DailyChallenge({
        date: new Date(scheduledDate),
        scheduledDate: new Date(scheduledDate),
        title: title || 'Daily Speed Challenge',
        description: description || 'Complete today\'s typing challenge!',
        challengeText,
        difficulty: difficulty || 'intermediate',
        targetWpm: targetWpm || 80,
        challengeMode: challengeMode || 'passage',
        autoPublish: true,
        isActive: false, // Not active until scheduled date
      });

      await challenge.save();
      scheduledChallenges.push(challenge);
    }

    // Log admin action
    await logActivity(
      'challenge_scheduled',
      `Admin scheduled ${scheduledChallenges.length} daily challenges`,
      `Bulk scheduled ${scheduledChallenges.length} challenges for future dates`,
      null,
      req.user.username,
      null,
      'DailyChallenge',
      { count: scheduledChallenges.length },
      req.user
    );

    res.json({ success: true, count: scheduledChallenges.length, challenges: scheduledChallenges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/dailyChallenge/schedule
 * View scheduled challenges for next 30 days
 */
router.get('/dailyChallenge/schedule', async (req, res) => {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const scheduledChallenges = await DailyChallenge.find({
      scheduledDate: { $gte: now, $lte: futureDate }
    }).sort({ scheduledDate: 1 });

    res.json({ schedule: scheduledChallenges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/dailyChallenge/:id/unschedule
 * Remove a challenge from the schedule
 */
router.delete('/dailyChallenge/:id/unschedule', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid challenge ID format' });
    }

    const challenge = await DailyChallenge.findByIdAndUpdate(
      id,
      {
        scheduledDate: null,
        autoPublish: false
      },
      { new: true }
    );

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Log admin action
    await logActivity(
      'challenge_unscheduled',
      `Admin unscheduled daily challenge "${challenge.title}"`,
      `Challenge removed from schedule: ${challenge.title}`,
      null,
      req.user.username,
      challenge._id.toString(),
      'DailyChallenge',
      { action: 'unschedule' },
      req.user
    );

    res.json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/dailyChallenge/:id/publish
 * Manually publish a scheduled challenge
 */
router.post('/dailyChallenge/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid challenge ID format' });
    }

    const challenge = await DailyChallenge.findByIdAndUpdate(
      id,
      {
        isActive: true,
        publishedAt: new Date()
      },
      { new: true }
    );

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Log admin action
    await logActivity(
      'challenge_published',
      `Admin published daily challenge "${challenge.title}"`,
      `Challenge is now active and available to users`,
      null,
      req.user.username,
      challenge._id.toString(),
      'DailyChallenge',
      { action: 'publish' },
      req.user
    );

    res.json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/squadwars
 * Returns all squad wars for admin management
 */
router.get('/squadwars', async (req, res) => {
  try {
    const wars = await SquadWar.find().sort({ createdAt: -1 }).limit(100);
    res.json(wars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/squadwars
 * Create a new squad war
 */
router.post('/squadwars', async (req, res) => {
  try {
    const { title, description, squadAName, squadBName, warType, duration, maxParticipantsPerSquad } = req.body;
    
    if (!title || !squadAName || !squadBName) {
      return res.status(400).json({ error: 'Title and squad names are required' });
    }

    // Create simple squad war without requiring actual squad IDs
    const war = new SquadWar({
      title,
      description: description || '',
      squadA: {
        name: squadAName,
        score: 0,
        memberScores: [],
      },
      squadB: {
        name: squadBName,
        score: 0,
        memberScores: [],
      },
      status: 'pending',
      warType: warType || 'elimination',
      duration: Number(duration) || 30,
      maxParticipantsPerSquad: Number(maxParticipantsPerSquad) || 5,
    });

    await war.save();
    res.json({ success: true, war });
  } catch (error) {
    console.error('Squad war creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/squadwars/:id
 * Update a squad war
 */
router.put('/squadwars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid war ID format' });
    }
    
    const war = await SquadWar.findByIdAndUpdate(id, req.body, { new: true });
    if (!war) {
      return res.status(404).json({ error: 'War not found' });
    }
    res.json({ success: true, war });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/squadwars/:id
 * Delete a squad war
 */
router.delete('/squadwars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid war ID format' });
    }
    
    const war = await SquadWar.findByIdAndDelete(id);
    if (!war) {
      return res.status(404).json({ error: 'War not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/squadwars/:id/add-participant
 * Add a participant to an active squad war
 */
router.post('/squadwars/:id/add-participant', async (req, res) => {
  try {
    const { userId, squadId, squad } = req.body;
    
    if (!userId || (!squadId && !squad)) {
      return res.status(400).json({ error: 'userId and (squadId or squad) are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid war ID' });
    }

    const war = await SquadWar.findById(req.params.id);
    if (!war) {
      return res.status(404).json({ error: 'War not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine which squad to add to
    const targetSquad = squad === 'A' ? 'squadA' : 'squadB';
    const squadData = war[targetSquad];

    // Check if user already in squad
    const exists = squadData.memberScores.find(m => m.userId.toString() === userId);
    if (exists) {
      return res.status(400).json({ error: 'Participant already in this squad' });
    }

    // Add participant
    squadData.memberScores.push({
      userId,
      username: user.username,
      score: 0,
      wpm: 0,
      accuracy: 0,
      timestamp: new Date(),
    });

    war.managedByAdmin = true;
    await war.save();

    // Log admin action
    await logActivity(
      'squadwar_admin_action',
      `Admin added participant to squad war "${war.title}"`,
      `User "${user.username}" added to Squad ${squad}`,
      userId,
      user.username,
      war._id.toString(),
      'SquadWar',
      { action: 'add-participant', squad },
      req.user
    );

    res.json({ success: true, war });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/squadwars/:id/participants/:userId
 * Remove a participant from a squad war
 */
router.delete('/squadwars/:id/participants/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid war ID' });
    }

    const war = await SquadWar.findById(req.params.id);
    if (!war) {
      return res.status(404).json({ error: 'War not found' });
    }

    let removed = false;
    let username = '';

    // Try to remove from squadA
    const squadAIndex = war.squadA.memberScores.findIndex(m => m.userId?.toString() === req.params.userId);
    if (squadAIndex !== -1) {
      username = war.squadA.memberScores[squadAIndex].username;
      war.squadA.memberScores.splice(squadAIndex, 1);
      removed = true;
    } else {
      // Try to remove from squadB
      const squadBIndex = war.squadB.memberScores.findIndex(m => m.userId?.toString() === req.params.userId);
      if (squadBIndex !== -1) {
        username = war.squadB.memberScores[squadBIndex].username;
        war.squadB.memberScores.splice(squadBIndex, 1);
        removed = true;
      }
    }

    if (!removed) {
      return res.status(404).json({ error: 'Participant not found in this war' });
    }

    await war.save();

    // Log admin action
    await logActivity(
      'squadwar_admin_action',
      `Admin removed participant from squad war "${war.title}"`,
      `User "${username}" removed from squad war`,
      req.params.userId,
      username,
      war._id.toString(),
      'SquadWar',
      { action: 'remove-participant' },
      req.user
    );

    res.json({ success: true, message: 'Participant removed', war });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/squadwars/:id/adjust-score
 * Manually adjust a participant's score
 */
router.post('/squadwars/:id/adjust-score', async (req, res) => {
  try {
    const { userId, scoreAdjustment, reason } = req.body;

    if (!userId || scoreAdjustment === undefined) {
      return res.status(400).json({ error: 'userId and scoreAdjustment are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid war ID' });
    }

    const war = await SquadWar.findById(req.params.id);
    if (!war) {
      return res.status(404).json({ error: 'War not found' });
    }

    // Find participant and adjust score
    let participant = null;
    let squad = '';

    const squadAMember = war.squadA.memberScores.find(m => m.userId?.toString() === userId);
    if (squadAMember) {
      participant = squadAMember;
      squad = 'A';
      squadAMember.score = (squadAMember.score || 0) + scoreAdjustment;
      war.squadA.score += scoreAdjustment;
    } else {
      const squadBMember = war.squadB.memberScores.find(m => m.userId?.toString() === userId);
      if (squadBMember) {
        participant = squadBMember;
        squad = 'B';
        squadBMember.score = (squadBMember.score || 0) + scoreAdjustment;
        war.squadB.score += scoreAdjustment;
      }
    }

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found in war' });
    }

    // Record scoring override
    war.scoringOverrides.push({
      userId,
      username: participant.username,
      scoreAdjustment,
      reason: reason || 'Manual adjustment',
      appliedAt: new Date(),
    });

    await war.save();

    // Log admin action
    await logActivity(
      'squadwar_admin_action',
      `Admin adjusted score for "${participant.username}" in squad war`,
      `Score adjustment: ${scoreAdjustment > 0 ? '+' : ''}${scoreAdjustment} (Reason: ${reason})`,
      userId,
      participant.username,
      war._id.toString(),
      'SquadWar',
      { action: 'adjust-score', scoreAdjustment, squad },
      req.user
    );

    res.json({ success: true, war });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/squadwars/:id/set-winner
 * Manually declare a winner for squad war
 */
router.post('/squadwars/:id/set-winner', async (req, res) => {
  try {
    const { winner } = req.body;

    if (!winner || !['squadA', 'squadB', 'draw'].includes(winner)) {
      return res.status(400).json({ error: 'winner must be "squadA", "squadB", or "draw"' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid war ID' });
    }

    const war = await SquadWar.findByIdAndUpdate(
      req.params.id,
      {
        winner,
        status: 'completed',
        endDate: new Date(),
      },
      { new: true }
    );

    if (!war) {
      return res.status(404).json({ error: 'War not found' });
    }

    // Log admin action
    await logActivity(
      'squadwar_admin_action',
      `Admin declared winner for squad war "${war.title}"`,
      `Winner: ${winner === 'draw' ? 'Draw' : `Squad ${winner === 'squadA' ? 'A' : 'B'} (Score: ${winner === 'squadA' ? war.squadA.score : war.squadB.score})`}`,
      null,
      req.user.username,
      war._id.toString(),
      'SquadWar',
      { action: 'set-winner', winner, reason: req.body.reason },
      req.user
    );

    res.json({ success: true, war });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/squadwars/:id/live-standings
 * Get current squad war standings and member contributions
 */
router.get('/squadwars/:id/live-standings', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid war ID' });
    }

    const war = await SquadWar.findById(req.params.id);
    if (!war) {
      return res.status(404).json({ error: 'War not found' });
    }

    const standings = {
      war: {
        _id: war._id,
        title: war.title,
        status: war.status,
        winner: war.winner,
      },
      squadA: {
        name: war.squadA.name,
        totalScore: war.squadA.score,
        members: war.squadA.memberScores.map(m => ({
          userId: m.userId,
          username: m.username,
          score: m.score,
          wpm: m.wpm,
          accuracy: m.accuracy,
          timestamp: m.timestamp,
        })),
      },
      squadB: {
        name: war.squadB.name,
        totalScore: war.squadB.score,
        members: war.squadB.memberScores.map(m => ({
          userId: m.userId,
          username: m.username,
          score: m.score,
          wpm: m.wpm,
          accuracy: m.accuracy,
          timestamp: m.timestamp,
        })),
      },
      scoringOverrides: war.scoringOverrides,
    };

    res.json(standings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/settings
 * Returns all platform settings
 * Auto-disables maintenance if estimated time has passed
 */
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    // Auto-disable maintenance if estimated time has passed
    if (settings.maintenanceMode.enabled && settings.maintenanceMode.estimatedTime) {
      const now = new Date();
      const estimatedEnd = new Date(settings.maintenanceMode.estimatedTime);
      
      if (now >= estimatedEnd) {
        // Maintenance time has elapsed, auto-disable
        settings.maintenanceMode.enabled = false;
        settings.maintenanceMode.startedAt = null;
        await settings.save();
      }
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/settings/maintenance
 * Update maintenance mode settings
 */
router.put('/settings/maintenance', async (req, res) => {
  try {
    const { enabled, message, estimatedTime } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    const wasEnabled = settings.maintenanceMode.enabled;
    settings.maintenanceMode.enabled = enabled || false;
    settings.maintenanceMode.message = message || settings.maintenanceMode.message;
    settings.maintenanceMode.estimatedTime = estimatedTime || null;
    
    if (enabled && !settings.maintenanceMode.startedAt) {
      settings.maintenanceMode.startedAt = new Date();
    } else if (!enabled) {
      settings.maintenanceMode.startedAt = null;
    }
    
    await settings.save();

    // Log maintenance mode changes
    if (!wasEnabled && enabled) {
      await logActivity(
        'maintenance_enabled',
        'Platform entered maintenance mode',
        `Maintenance enabled with message: ${message}`,
        null,
        'Admin',
        null,
        'System',
        { estimatedTime },
        req.user
      );
    } else if (wasEnabled && !enabled) {
      await logActivity(
        'maintenance_disabled',
        'Platform exited maintenance mode',
        'Maintenance mode disabled by admin',
        null,
        'Admin',
        null,
        'System',
        {},
        req.user
      );
    }

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/settings
 * Update all platform settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { platformName, contactEmail, supportUrl } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    if (platformName) settings.platformName = platformName;
    if (contactEmail) settings.contactEmail = contactEmail;
    if (supportUrl) settings.supportUrl = supportUrl;
    
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/settings/maintenance
 * Public endpoint to check maintenance mode status
 * Auto-disables maintenance if estimated time has passed
 */
router.get('/public-settings/maintenance', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      return res.json({ 
        enabled: false, 
        message: 'We are currently undergoing scheduled maintenance. Please check back soon!' 
      });
    }

    // Auto-disable maintenance if estimated time has passed
    if (settings.maintenanceMode.enabled && settings.maintenanceMode.estimatedTime) {
      const now = new Date();
      const estimatedEnd = new Date(settings.maintenanceMode.estimatedTime);
      
      if (now >= estimatedEnd) {
        // Maintenance time has elapsed, auto-disable
        settings.maintenanceMode.enabled = false;
        settings.maintenanceMode.startedAt = null;
        await settings.save();
      }
    }

    res.json({
      enabled: settings.maintenanceMode.enabled,
      message: settings.maintenanceMode.message,
      estimatedTime: settings.maintenanceMode.estimatedTime,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/statistics/races
 * Returns race statistics with filtering support
 * Query params: startDate, endDate, status
 */
router.get('/statistics/races', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Status filter
    if (status) filter.status = status;

    const totalRaces = await Race.countDocuments(filter);
    const activeRaces = await Race.countDocuments({ ...filter, status: 'in_progress' });
    const completedRaces = await Race.countDocuments({ ...filter, status: 'completed' });
    const totalParticipations = await Race.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: { $size: '$participants' } }
        }
      }
    ]);

    const avgParticipantsPerRace = totalRaces > 0 
      ? Math.round((totalParticipations[0]?.totalParticipants || 0) / totalRaces)
      : 0;

    const completionRate = totalRaces > 0
      ? Math.round((completedRaces / totalRaces) * 100)
      : 0;

    res.json({
      totalRaces,
      activeRaces,
      completedRaces,
      avgParticipantsPerRace,
      completionRate: `${completionRate}%`,
      totalParticipations: totalParticipations[0]?.totalParticipants || 0,
      filters: { startDate, endDate, status },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/statistics/tournaments
 * Returns tournament statistics with filtering support
 * Query params: startDate, endDate, status, type
 */
router.get('/statistics/tournaments', async (req, res) => {
  try {
    const { startDate, endDate, status, type } = req.query;
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Status and type filters
    if (status) filter.status = status;
    if (type) filter.type = type;

    const totalTournaments = await Tournament.countDocuments(filter);
    const activeTournaments = await Tournament.countDocuments({ ...filter, status: 'in-progress' });
    const completedTournaments = await Tournament.countDocuments({ ...filter, status: 'completed' });
    const totalParticipations = await Tournament.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: { $size: '$participants' } }
        }
      }
    ]);

    const totalPrizePool = await Tournament.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPrizes: { $sum: '$prizePool.totalReward' }
        }
      }
    ]);

    res.json({
      totalTournaments,
      activeTournaments,
      completedTournaments,
      totalParticipations: totalParticipations[0]?.totalParticipants || 0,
      totalPrizePool: totalPrizePool[0]?.totalPrizes || 0,
      avgParticipantsPerTournament: totalTournaments > 0
        ? Math.round((totalParticipations[0]?.totalParticipants || 0) / totalTournaments)
        : 0,
      filters: { startDate, endDate, status, type },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/statistics/challenges
 * Returns daily challenge statistics
 */
router.get('/statistics/challenges', async (req, res) => {
  try {
    const totalChallenges = await DailyChallenge.countDocuments();
    const activeChallenges = await DailyChallenge.countDocuments({ isActive: true });
    const scheduledChallenges = await DailyChallenge.countDocuments({ scheduledDate: { $ne: null } });
    
    const submissions = await DailyChallenge.aggregate([
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: { $size: '$submissions' } }
        }
      }
    ]);

    const avgParticipationPerChallenge = totalChallenges > 0
      ? Math.round((submissions[0]?.totalSubmissions || 0) / totalChallenges)
      : 0;

    res.json({
      totalChallenges,
      activeChallenges,
      scheduledChallenges,
      totalSubmissions: submissions[0]?.totalSubmissions || 0,
      avgParticipationPerChallenge,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/statistics/users
 * Returns user statistics
 */
router.get('/statistics/users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // Users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      newUsersLast30Days,
      userTrend: `${Math.round((newUsersLast30Days / totalUsers) * 100)}%`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/statistics/revenue
 * Returns revenue statistics with filtering support
 * Query params: startDate, endDate, status, paymentMethod
 */
router.get('/statistics/revenue', async (req, res) => {
  try {
    const { startDate, endDate, status, paymentMethod } = req.query;
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Status and payment method filters
    if (status) filter.status = status;
    else filter.status = 'completed'; // Default to completed
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const totalRevenue = await Payment.aggregate([
      { $match: filter },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);

    const completedPayments = await Payment.countDocuments({ ...filter, status: 'completed' });
    const pendingPayments = await Payment.countDocuments({ createdAt: filter.createdAt || {}, status: 'pending' });
    const failedPayments = await Payment.countDocuments({ createdAt: filter.createdAt || {}, status: 'failed' });
    const refundedFilter = { ...filter, status: 'refunded' };
    const refundedAmount = await Payment.aggregate([
      { $match: refundedFilter },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);

    // Revenue by type
    const revenueByType = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.sum || 0,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedAmount: refundedAmount[0]?.sum || 0,
      revenueByType: revenueByType.reduce((acc, item) => {
        acc[item._id] = { amount: item.amount, count: item.count };
        return acc;
      }, {}),
      filters: { startDate, endDate, status, paymentMethod },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/statistics/overview
 * Returns overall platform statistics
 */
router.get('/statistics/overview', async (req, res) => {
  try {
    const stats = {};

    // User stats
    stats.users = {
      total: await User.countDocuments(),
      active: await User.countDocuments({ status: 'active' }),
    };

    // Race stats
    const races = await Race.countDocuments();
    stats.races = {
      total: races,
      completed: await Race.countDocuments({ status: 'completed' }),
    };

    // Tournament stats
    const tournaments = await Tournament.countDocuments();
    stats.tournaments = {
      total: tournaments,
      active: await Tournament.countDocuments({ status: 'in-progress' }),
      completed: await Tournament.countDocuments({ status: 'completed' }),
    };

    // Challenge stats
    stats.challenges = {
      total: await DailyChallenge.countDocuments(),
      active: await DailyChallenge.countDocuments({ isActive: true }),
    };

    // Revenue
    const revenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    stats.revenue = revenue[0]?.sum || 0;

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/export/races
 * Export all races as CSV with filtering support
 * Query params: startDate, endDate, status
 */
router.get('/export/races', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const filter = {};

    // Date range and status filters
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (status) filter.status = status;

    const races = await Race.find(filter).populate('createdBy', 'username email');
    
    const csv = convertToCSV(races.map(race => ({
      roomId: race.roomId,
      status: race.status,
      raceType: race.raceType,
      difficulty: race.difficulty,
      maxParticipants: race.maxParticipants,
      participantCount: race.participants.length,
      createdBy: race.createdBy?.username || 'N/A',
      createdAt: race.createdAt,
      startedAt: race.startedAt,
      completedAt: race.completedAt,
    })));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=races.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/export/tournaments
 * Export all tournaments as CSV with filtering support
 * Query params: startDate, endDate, status, type
 */
router.get('/export/tournaments', async (req, res) => {
  try {
    const { startDate, endDate, status, type } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (status) filter.status = status;
    if (type) filter.type = type;

    const tournaments = await Tournament.find(filter);
    
    const csv = convertToCSV(tournaments.map(tournament => ({
      name: tournament.name,
      type: tournament.type,
      status: tournament.status,
      maxParticipants: tournament.maxParticipants,
      participantCount: tournament.participants.length,
      prizePool: tournament.prizePool.totalReward,
      matchCount: tournament.bracket.length,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      createdAt: tournament.createdAt,
    })));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tournaments.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/export/users
 * Export all users as CSV
 */
router.get('/export/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    const csv = convertToCSV(users.map(user => ({
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      totalRaces: user.stats.totalRaces,
      racesWon: user.stats.racesWon,
      winRate: user.stats.winRate,
      bestWpm: user.stats.bestWpm,
      averageWpm: user.stats.averageWpm,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    })));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/export/payments
 * Export all payments as CSV with filtering support
 * Query params: startDate, endDate, status, paymentMethod, username
 */
router.get('/export/payments', async (req, res) => {
  try {
    const { startDate, endDate, status, paymentMethod } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const payments = await Payment.find(filter).populate('userId', 'username email');
    
    const csv = convertToCSV(payments.map(payment => ({
      username: payment.userId?.username || payment.username,
      email: payment.userId?.email || 'N/A',
      amount: payment.amount,
      currency: payment.currency,
      type: payment.type,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
    })));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to convert JSON to CSV
 */
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (value instanceof Date) return `"${value.toISOString()}"`;
        return `"${value}"`;
      }).join(',')
    )
  ].join('\n');

  return csv;
}

export default router;
