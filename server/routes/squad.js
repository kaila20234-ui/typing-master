import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createSquad,
  getSquadDetails,
  getAvailableSquads,
  inviteUserToSquad,
  acceptSquadInvite,
  rejectSquadInvite,
  getUserSquadInvitations,
  leaveSquad,
  createSquadWar,
  getSquadWarDetails,
  recordMemberScore,
  endSquadWar,
  getSquadLeaderboard,
  getSquadWarHistory,
  getActiveSquadWars,
  getUserSquads,
} from '../lib/squadUtils.js';
import Squad from '../models/Squad.js';

const router = express.Router();

/**
 * GET /api/squads
 * Get available squads (public)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await getAvailableSquads(limit, page);
    res.json(result);
  } catch (error) {
    console.error('Error fetching squads:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/squads/me
 * Get user's squads
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const squads = await getUserSquads(req.userId);
    res.json({ squads });
  } catch (error) {
    console.error('Error fetching user squads:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/squads/leaderboard
 * Get squad leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await getSquadLeaderboard(limit, page);
    res.json(result);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads
 * Create a new squad
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, maxMembers, isPublic, profilePicture } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Squad name must be at least 3 characters' });
    }

    const squad = await createSquad(req.userId, {
      name: name.trim(),
      description,
      maxMembers,
      isPublic,
      profilePicture,
    });

    res.status(201).json({ success: true, squad });
  } catch (error) {
    console.error('Error creating squad:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/squads/:squadId
 * Get squad details
 */
router.get('/:squadId', async (req, res) => {
  try {
    const squad = await getSquadDetails(req.params.squadId);
    res.json(squad);
  } catch (error) {
    console.error('Error fetching squad:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/:squadId/invite
 * Invite user to squad
 */
router.post('/:squadId/invite', authenticateToken, async (req, res) => {
  try {
    const { invitedUserId, message } = req.body;

    if (!invitedUserId) {
      return res.status(400).json({ error: 'Invited user ID is required' });
    }

    const squad = await Squad.findById(req.params.squadId);
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    // Only leader/officers can invite
    const member = squad.members.find((m) => m.userId.toString() === req.userId);
    if (!member || (member.role !== 'leader' && member.role !== 'officer')) {
      return res.status(403).json({ error: 'Only leaders and officers can invite members' });
    }

    const invite = await inviteUserToSquad(req.params.squadId, invitedUserId, req.userId);
    res.status(201).json({ success: true, invite });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/squads/invites/me
 * Get user's pending squad invitations
 */
router.get('/invites/me', authenticateToken, async (req, res) => {
  try {
    const invites = await getUserSquadInvitations(req.userId);
    res.json({ invites });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/invites/:inviteId/accept
 * Accept squad invitation
 */
router.post('/invites/:inviteId/accept', authenticateToken, async (req, res) => {
  try {
    const result = await acceptSquadInvite(req.params.inviteId, req.userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/invites/:inviteId/reject
 * Reject squad invitation
 */
router.post('/invites/:inviteId/reject', authenticateToken, async (req, res) => {
  try {
    const invite = await rejectSquadInvite(req.params.inviteId, req.userId);
    res.json({ success: true, invite });
  } catch (error) {
    console.error('Error rejecting invite:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/:squadId/leave
 * Leave squad
 */
router.post('/:squadId/leave', authenticateToken, async (req, res) => {
  try {
    const result = await leaveSquad(req.params.squadId, req.userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error leaving squad:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/:squadId/join
 * Request to join squad
 */
router.post('/:squadId/join', authenticateToken, async (req, res) => {
  try {
    const squadId = req.params.squadId;
    const userId = req.userId;

    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    // Check if user is already a member
    const isMember = squad.members.some((m) => m.userId.toString() === userId);
    if (isMember) {
      return res.status(400).json({ error: 'You are already a member of this squad' });
    }

    // Check if squad is full
    if (squad.members.length >= squad.maxMembers) {
      return res.status(400).json({ error: 'Squad is full' });
    }

    // Add user to squad
    squad.members.push({
      userId: userId,
      role: 'member',
    });

    await squad.save();

    res.json({ success: true, squad });
  } catch (error) {
    console.error('Error joining squad:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/wars
 * Create a squad war
 */
router.post('/wars', authenticateToken, async (req, res) => {
  try {
    const { squadA_Id, squadB_Id, title, description, warType, duration, maxParticipantsPerSquad, rules, rewards } = req.body;

    if (!squadA_Id || !squadB_Id) {
      return res.status(400).json({ error: 'Both squad IDs are required' });
    }

    // Verify user is leader of one of the squads
    const squadA = await Squad.findById(squadA_Id);
    const squadB = await Squad.findById(squadB_Id);

    if (!squadA || !squadB) {
      return res.status(404).json({ error: 'One or both squads not found' });
    }

    if (squadA.leader.toString() !== req.userId && squadB.leader.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only squad leaders can initiate wars' });
    }

    const war = await createSquadWar(squadA_Id, squadB_Id, {
      title,
      description,
      warType,
      duration,
      maxParticipantsPerSquad,
      rules,
      rewards,
    });

    res.status(201).json({ success: true, war });
  } catch (error) {
    console.error('Error creating war:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/squads/wars/active
 * Get active squad wars
 */
router.get('/wars/active', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const wars = await getActiveSquadWars(limit);
    res.json({ wars });
  } catch (error) {
    console.error('Error fetching active wars:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/squads/wars/:warId
 * Get squad war details
 */
router.get('/wars/:warId', async (req, res) => {
  try {
    const war = await getSquadWarDetails(req.params.warId);
    res.json(war);
  } catch (error) {
    console.error('Error fetching war:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/wars/:warId/score
 * Record member score
 */
router.post('/wars/:warId/score', authenticateToken, async (req, res) => {
  try {
    const { squadPosition, userId, username, score, wpm, accuracy } = req.body;

    if (!squadPosition || !userId || !score) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const war = await recordMemberScore(req.params.warId, squadPosition, userId, username, score, wpm, accuracy);
    res.json({ success: true, war });
  } catch (error) {
    console.error('Error recording score:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/wars/:warId/end
 * End squad war
 */
router.post('/wars/:warId/end', authenticateToken, async (req, res) => {
  try {
    const war = await endSquadWar(req.params.warId);
    res.json({ success: true, war });
  } catch (error) {
    console.error('Error ending war:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/squads/:squadId/wars
 * Get squad war history
 */
router.get('/:squadId/wars', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await getSquadWarHistory(req.params.squadId, limit, page);
    res.json(result);
  } catch (error) {
    console.error('Error fetching war history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/wars/:warId/register
 * Register a squad for a squad war
 */
router.post('/wars/:warId/register', authenticateToken, async (req, res) => {
  try {
    const { squadId, paymentId } = req.body;

    if (!squadId || !paymentId) {
      return res.status(400).json({ error: 'Squad ID and Payment ID are required' });
    }

    const { SquadWar } = await import('../models/SquadWar.js');
    const war = await SquadWar.findById(req.params.warId);

    if (!war) {
      return res.status(404).json({ error: 'Squad war not found' });
    }

    if (!war.registrationOpen) {
      return res.status(400).json({ error: 'Registration is no longer open for this war' });
    }

    // Check if squad is already registered
    const existingRegistration = war.registrations.find(r => r.squadId.toString() === squadId);
    if (existingRegistration) {
      return res.status(400).json({ error: 'This squad is already registered for this war' });
    }

    // Check if squad is one of the squads in the war
    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    // Only squad leader can register
    if (squad.leader.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only squad leaders can register squads for wars' });
    }

    // Add registration
    war.registrations.push({
      squadId,
      squadName: squad.name,
      paymentId,
      status: 'paid',
    });

    await war.save();

    res.status(201).json({ success: true, war });
  } catch (error) {
    console.error('Error registering squad for war:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/wars/:warId/set-ready
 * Set squad ready status for a war
 */
router.post('/wars/:warId/set-ready', authenticateToken, async (req, res) => {
  try {
    const { squadId } = req.body;

    if (!squadId) {
      return res.status(400).json({ error: 'Squad ID is required' });
    }

    const { SquadWar } = await import('../models/SquadWar.js');
    const war = await SquadWar.findById(req.params.warId);

    if (!war) {
      return res.status(404).json({ error: 'Squad war not found' });
    }

    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    // Only squad leader can set ready
    if (squad.leader.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only squad leaders can set ready status' });
    }

    // Check if squad is registered
    const registration = war.registrations.find(r => r.squadId.toString() === squadId);
    if (!registration || registration.status !== 'paid') {
      return res.status(400).json({ error: 'Squad must be registered and have paid to mark as ready' });
    }

    // Determine which squad position (A or B) the squad is in
    const isSquadA = war.squadA.squadId.toString() === squadId;
    const isSquadB = war.squadB.squadId.toString() === squadId;

    if (!isSquadA && !isSquadB) {
      return res.status(400).json({ error: 'This squad is not part of this war' });
    }

    // Set ready status
    if (isSquadA) {
      war.readyStatus.squadA = true;
    } else {
      war.readyStatus.squadB = true;
    }

    await war.save();

    res.json({ success: true, war });
  } catch (error) {
    console.error('Error setting ready status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/squads/wars/:warId/cancel
 * Cancel a squad war and issue refunds
 */
router.post('/wars/:warId/cancel', authenticateToken, async (req, res) => {
  try {
    const { SquadWar } = await import('../models/SquadWar.js');
    const { Payment } = await import('../models/Payment.js');
    
    const war = await SquadWar.findById(req.params.warId);

    if (!war) {
      return res.status(404).json({ error: 'Squad war not found' });
    }

    if (war.status === 'completed' || war.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot cancel a completed or already cancelled war' });
    }

    // Process refunds for all registered squads
    for (const registration of war.registrations) {
      if (registration.paymentId && registration.status === 'paid') {
        const payment = await Payment.findById(registration.paymentId);
        if (payment && payment.status === 'completed') {
          // Mark payment as refunded
          payment.status = 'refunded';
          payment.refundedAt = new Date();
          await payment.save();
          
          // TODO: Process actual refund through Stripe/PayPal
          // This would involve calling the payment provider's refund API
        }
        registration.status = 'refunded';
      }
    }

    // Cancel the war
    war.status = 'cancelled';
    await war.save();

    res.json({ success: true, message: 'War cancelled and refunds processed', war });
  } catch (error) {
    console.error('Error cancelling war:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
