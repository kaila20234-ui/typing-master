import express from 'express';
import Race from '../models/Race.js';
import RaceResult from '../models/RaceResult.js';
import User from '../models/User.js';
import CompetitionRegistration from '../models/CompetitionRegistration.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import wordList from '../lib/wordList.js';
import { generateRoomId } from '../lib/idGenerator.js';
import {
  registerForRace,
  isRegistrationOpen,
  setRegistrationDeadline,
} from '../lib/competitionUtils.js';

const router = express.Router();

// Create a race room
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { text, difficulty, maxParticipants, lessonId, raceType } = req.body;

    let raceText = text;
    const finalRaceType = raceType || 'passage';

    // If random words mode, generate text from word list
    if (finalRaceType === 'random') {
      raceText = wordList.generateRandomWords(difficulty || 'intermediate');
    } else if (!text) {
      return res.status(400).json({ error: 'Race text required for passage mode' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roomId = generateRoomId();
    const race = new Race({
      roomId,
      text: raceText,
      raceType: finalRaceType,
      difficulty: difficulty || 'intermediate',
      maxParticipants: maxParticipants || 10,
      lessonId,
      createdBy: req.userId,
      participants: [{
        userId: req.userId,
        userCode: user.userId,
        username: user.username,
        profilePicture: user.profilePicture,
        raceStatus: 'waiting',
      }],
    });

    await race.save();

    res.status(201).json({
      roomId: race.roomId,
      race,
    });
  } catch (error) {
    console.error('Create race error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get race by room ID
router.get('/:roomId', async (req, res) => {
  try {
    const race = await Race.findOne({ roomId: req.params.roomId })
      .populate('createdBy', 'username profilePicture')
      .populate('participants.userId', 'username profilePicture');

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    res.json(race);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join a race
router.post('/:roomId/join', authMiddleware, async (req, res) => {
  try {
    const race = await Race.findOne({ roomId: req.params.roomId });

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    if (race.status !== 'waiting') {
      return res.status(400).json({ error: 'Race already started' });
    }

    if (race.participants.length >= race.maxParticipants) {
      return res.status(400).json({ error: 'Race is full' });
    }

    // Check if user is registered for this race
    const registration = await CompetitionRegistration.findOne({
      competition: race._id,
      user: req.userId,
      competitionType: 'race',
    });

    if (!registration) {
      return res.status(403).json({ error: 'You must register for this race first' });
    }

    // Check if user already in race
    const alreadyJoined = race.participants.some(p => p.userId.toString() === req.userId);
    if (alreadyJoined) {
      return res.status(400).json({ error: 'Already joined this race' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    race.participants.push({
      userId: req.userId,
      userCode: user.userId,
      username: user.username,
      profilePicture: user.profilePicture,
      raceStatus: 'waiting',
    });

    await race.save();

    res.json({ message: 'Joined race', race });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active races
router.get('/', async (req, res) => {
  try {
    const races = await Race.find({
      status: { $in: ['waiting', 'ready'] },
    })
      .populate('createdBy', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(races);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's race history
router.get('/user/:userId/history', async (req, res) => {
  try {
    const results = await RaceResult.find({ userId: req.params.userId })
      .populate('raceId')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/races/:roomId/finish
 * Submit a finished race result for persistence and ranking updates
 */
router.post('/:roomId/finish', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { wpm, accuracy, correctChars, incorrectChars, totalChars, timeElapsed } = req.body;

    if (!roomId || typeof wpm !== 'number' || typeof accuracy !== 'number' || typeof timeElapsed !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid race result fields' });
    }

    const race = await Race.findOne({ roomId });
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const participant = race.participants.find(p => p.userId.toString() === req.userId);
    if (!participant) {
      return res.status(403).json({ error: 'User not participating in the race' });
    }

    if (participant.raceStatus === 'finished') {
      return res.status(400).json({ error: 'Race result already submitted' });
    }

    const finishedCount = race.participants.filter((p) => p.raceStatus === 'finished').length;
    const position = finishedCount + 1;

    participant.raceStatus = 'finished';
    participant.finishTime = new Date();
    participant.wpm = wpm;
    participant.accuracy = accuracy;
    participant.position = position;

    await race.save();

    const result = new RaceResult({
      raceId: race._id,
      userId: req.userId,
      position,
      wpm,
      accuracy,
      correctChars: Number(correctChars) || 0,
      incorrectChars: Number(incorrectChars) || 0,
      totalChars: Number(totalChars) || 0,
      timeElapsed,
    });
    await result.save();

    // Update user ranking if the ranking system exists
    try {
      const { updateUserRanking } = await import('../lib/rankingSystem.js');
      const isWin = position === 1;
      await updateUserRanking(req.userId, {
        isWin,
        opponentRating: 1000,
        wpm,
        accuracy,
      });
    } catch (rankingError) {
      console.warn('Unable to update ranking after race finish:', rankingError.message);
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Finish race error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/races/:roomId/results
 * Fetch all results for a race room
 */
router.get('/:roomId/results', async (req, res) => {
  try {
    const { roomId } = req.params;

    const race = await Race.findOne({ roomId });
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const results = await RaceResult.find({ raceId: race._id })
      .populate('userId', 'username profilePicture')
      .sort({ position: 1 });

    res.json({ success: true, results });
  } catch (error) {
    console.error('Fetch race results error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/races/:roomId/register
 * Register for a race (auth required)
 */
router.post('/:roomId/register', authMiddleware, async (req, res) => {
  try {
    const race = await Race.findOne({ roomId: req.params.roomId });

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await registerForRace(race._id.toString(), req.userId, user.username, user.email, user.userId);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error registering for race:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/races/:roomId/registration-status
 * Get registration status and deadline for a race (no auth required)
 */
router.get('/:roomId/registration-status', async (req, res) => {
  try {
    const race = await Race.findOne({ roomId: req.params.roomId });

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const registrationOpen = await isRegistrationOpen(race);

    res.json({
      registrationOpen,
      registrationDeadline: race.registrationDeadline,
      currentParticipants: race.participants.length,
      maxParticipants: race.maxParticipants,
      spotsAvailable: Math.max(0, race.maxParticipants - race.participants.length),
    });
  } catch (error) {
    console.error('Error fetching registration status:', error);
    res.status(500).json({ error: 'Failed to fetch registration status' });
  }
});

/**
 * POST /api/admin/races/:roomId/set-deadline
 * Set registration deadline for a race (auth required - admin)
 */
router.post('/admin/:roomId/set-deadline', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const race = await Race.findOne({ roomId: req.params.roomId });

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const { deadline } = req.body;

    if (!deadline) {
      return res.status(400).json({ error: 'Deadline is required' });
    }

    const result = await setRegistrationDeadline(race._id.toString(), 'race', new Date(deadline));

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
 * GET /api/admin/races/:roomId/registrations
 * Get all registrations for a race (auth required - admin)
 */
router.get('/admin/:roomId/registrations', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const race = await Race.findOne({ roomId: req.params.roomId });

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const registrations = await CompetitionRegistration.find({
      competition: race._id,
      competitionType: 'race',
    })
      .populate('user', 'username email userId')
      .sort({ createdAt: -1 });

    res.json({ registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

export default router;
