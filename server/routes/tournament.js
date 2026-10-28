import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  createTournament,
  getTournamentDetails,
  registerForTournament,
  startTournament,
  recordMatchResult,
  getTournamentLeaderboard,
  getAvailableTournaments,
  getTournamentBracket,
  getUserTournamentHistory,
  getUserActiveTournamentMatches,
  getDefaultPrizeDistribution,
} from '../lib/tournamentUtils.js';
import {
  setRegistrationDeadline,
  isRegistrationOpen,
  approveRegistration,
  rejectRegistration,
  getPendingRegistrations,
} from '../lib/competitionUtils.js';
import CompetitionRegistration from '../models/CompetitionRegistration.js';
import Tournament from '../models/Tournament.js';

const router = express.Router();

/**
 * GET /api/tournaments
 * Get available tournaments (no auth required)
 */
router.get('/', async (req, res) => {
  try {
    const tournaments = await getAvailableTournaments();
    res.json({ tournaments });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

/**
 * GET /api/tournaments/:tournamentId
 * Get tournament details (no auth required)
 */
router.get('/:tournamentId', async (req, res) => {
  try {
    const tournament = await getTournamentDetails(req.params.tournamentId);
    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

/**
 * POST /api/tournaments
 * Create new tournament (auth required - admin/organizer)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, type, maxParticipants, startDate, prizePool } = req.body;
    const createdBy = req.userId;

    const tournament = await createTournament(createdBy, {
      name,
      description,
      type: type || 'single-elimination',
      maxParticipants: maxParticipants || 16,
      startDate: new Date(startDate),
      prizePool: prizePool || {
        totalReward: 0,
        distribution: getDefaultPrizeDistribution(maxParticipants),
      },
    });

    res.status(201).json({
      success: true,
      tournament,
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:tournamentId/register
 * Register for tournament (auth required)
 */
router.post('/:tournamentId/register', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { tournamentId } = req.params;

    const result = await registerForTournament(tournamentId, userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error registering for tournament:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:tournamentId/add-participant
 * Add user as participant after successful payment (auth required)
 */
router.post('/:tournamentId/add-participant', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { tournamentId } = req.params;

    // Validate tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Check registration is open
    if (tournament.status !== 'registration') {
      return res.status(400).json({ error: 'Tournament is not accepting registrations' });
    }

    if (!tournament.registrationOpen) {
      return res.status(400).json({ error: 'Registration is currently closed' });
    }

    // Check not already registered
    const alreadyRegistered = tournament.participants.some(p => p.userId.toString() === userId.toString());
    if (alreadyRegistered) {
      return res.status(400).json({ error: 'User already registered for this tournament' });
    }

    // Check tournament not full
    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({ error: 'Tournament is full' });
    }

    // Get user data
    const User = require('../models/User.js').default;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add participant
    tournament.participants.push({
      userId,
      username: user.username,
      userCode: user.userCode,
      rating: user.rating || 0,
      status: 'registered',
    });

    await tournament.save();

    res.json({
      success: true,
      message: 'Successfully added to tournament',
      tournament,
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:tournamentId/start
 * Start tournament and generate bracket (auth required - organizer)
 */
router.post('/:tournamentId/start', authenticateToken, async (req, res) => {
  try {
    const result = await startTournament(req.params.tournamentId);
    res.json(result);
  } catch (error) {
    console.error('Error starting tournament:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/tournaments/:tournamentId/bracket
 * Get tournament bracket (no auth required)
 */
router.get('/:tournamentId/bracket', async (req, res) => {
  try {
    const bracket = await getTournamentBracket(req.params.tournamentId);
    res.json(bracket);
  } catch (error) {
    console.error('Error fetching bracket:', error);
    res.status(500).json({ error: 'Failed to fetch bracket' });
  }
});

/**
 * GET /api/tournaments/:tournamentId/leaderboard
 * Get tournament leaderboard (no auth required)
 */
router.get('/:tournamentId/leaderboard', async (req, res) => {
  try {
    const leaderboard = await getTournamentLeaderboard(req.params.tournamentId);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * POST /api/tournaments/:tournamentId/match/:round/:matchNumber/result
 * Record match result (auth required)
 */
router.post('/:tournamentId/match/:round/:matchNumber/result', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, round, matchNumber } = req.params;
    const { winnerId, participant1Score, participant2Score } = req.body;

    if (!winnerId || participant1Score === undefined || participant2Score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const match = tournament.bracket.find((m) => m.round === parseInt(round) && m.matchNumber === parseInt(matchNumber));
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const matchData = {
      participant1Score,
      participant2Score,
      winnerCode: match.participant1.userId.toString() === winnerId ? match.participant1.userCode : match.participant2.userCode,
    };

    const result = await recordMatchResult(tournamentId, parseInt(round), parseInt(matchNumber), winnerId, matchData);

    res.json(result);
  } catch (error) {
    console.error('Error recording match result:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tournaments/user/history
 * Get user's tournament history (auth required)
 */
router.get('/user/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const history = await getUserTournamentHistory(userId);
    res.json({ history });
  } catch (error) {
    console.error('Error fetching tournament history:', error);
    res.status(500).json({ error: 'Failed to fetch tournament history' });
  }
});

/**
 * GET /api/tournaments/user/active-matches
 * Get user's active tournament matches (auth required)
 */
router.get('/user/active-matches', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const matches = await getUserActiveTournamentMatches(userId);
    res.json({ matches });
  } catch (error) {
    console.error('Error fetching active matches:', error);
    res.status(500).json({ error: 'Failed to fetch active matches' });
  }
});

/**
 * GET /api/tournaments/:tournamentId/registration-status
 * Get registration status with deadline (no auth required)
 */
router.get('/:tournamentId/registration-status', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const registrationOpen = await isRegistrationOpen(tournament);

    res.json({
      registrationOpen,
      registrationDeadline: tournament.registrationDeadline,
      currentParticipants: tournament.participants.length,
      maxParticipants: tournament.maxParticipants,
      spotsAvailable: Math.max(0, tournament.maxParticipants - tournament.participants.length),
    });
  } catch (error) {
    console.error('Error fetching registration status:', error);
    res.status(500).json({ error: 'Failed to fetch registration status' });
  }
});

/**
 * POST /api/admin/tournaments/:tournamentId/set-deadline
 * Set registration deadline for tournament (auth required - admin)
 */
router.post('/admin/:tournamentId/set-deadline', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { deadline } = req.body;

    if (!deadline) {
      return res.status(400).json({ error: 'Deadline is required' });
    }

    const result = await setRegistrationDeadline(req.params.tournamentId, 'tournament', new Date(deadline));

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error setting registration deadline:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/admin/tournaments/registrations/pending
 * Get all pending tournament registrations (auth required - admin)
 */
router.get('/admin/registrations/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get all pending tournament registrations across all tournaments
    const registrations = await CompetitionRegistration.find({
      competitionType: 'tournament',
      registrationStatus: 'pending',
    })
      .populate('user', 'username email userId')
      .populate('competition', 'name startDate status')
      .sort({ createdAt: 1 });

    res.json({ registrations });
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    res.status(500).json({ error: 'Failed to fetch pending registrations' });
  }
});

/**
 * GET /api/admin/tournaments/:tournamentId/registrations/pending
 * Get pending registrations for specific tournament (auth required - admin)
 */
router.get('/admin/:tournamentId/registrations/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const registrations = await getPendingRegistrations(req.params.tournamentId, 'tournament');

    res.json({ registrations });
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    res.status(500).json({ error: 'Failed to fetch pending registrations' });
  }
});

/**
 * POST /api/admin/tournaments/registrations/:regId/approve
 * Approve pending tournament registration (auth required - admin)
 */
router.post('/admin/registrations/:regId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await approveRegistration(req.params.regId, req.userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/admin/tournaments/registrations/:regId/reject
 * Reject pending tournament registration (auth required - admin)
 */
router.post('/admin/registrations/:regId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const result = await rejectRegistration(req.params.regId, rejectionReason, req.userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
