import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import UserRanking from '../models/UserRanking.js';
import CompetitionRegistration from '../models/CompetitionRegistration.js';
import { isRegistrationOpen } from './competitionUtils.js';

/**
 * Create a new tournament
 */
export async function createTournament(createdBy, tournamentData) {
  const tournament = new Tournament({
    ...tournamentData,
    createdBy,
    status: 'registration',
  });

  await tournament.save();
  return tournament;
}

/**
 * Get tournament details
 */
export async function getTournamentDetails(tournamentId) {
  const tournament = await Tournament.findById(tournamentId)
    .populate('participants.userId', 'username userId profilePicture')
    .populate('createdBy', 'username userId')
    .populate('bracket.participant1.userId', 'username')
    .populate('bracket.participant2.userId', 'username')
    .populate('bracket.winner', 'username');

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  return tournament;
}

/**
 * Register user for tournament
 */
export async function registerForTournament(tournamentId, userId) {
  const tournament = await Tournament.findById(tournamentId);
  const user = await User.findById(userId);
  const userRanking = await UserRanking.findOne({ userId });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  // Check registration deadline
  const registrationOpen = await isRegistrationOpen(tournament);
  if (!registrationOpen) {
    throw new Error('Registration is closed for this tournament');
  }

  // Check if already registered
  const existingRegistration = await CompetitionRegistration.findOne({
    competition: tournamentId,
    user: userId,
    competitionType: 'tournament',
  });

  if (existingRegistration) {
    throw new Error('Already registered for this tournament');
  }

  // Enforce payment for paid tournaments
  if (tournament.requiresPayment && tournament.entryFee > 0) {
    // Check for completed payment registration
    const paidRegistration = await CompetitionRegistration.findOne({
      competition: tournamentId,
      user: userId,
      competitionType: 'tournament',
      paymentStatus: 'completed',
    });
    if (!paidRegistration) {
      throw new Error('Payment required to register for this tournament');
    }
    return {
      success: true,
      registration: paidRegistration,
      message: 'Registration completed after payment.',
    };
  } else {
    // Free tournament registration
    const registration = new CompetitionRegistration({
      competition: tournamentId,
      competitionType: 'tournament',
      user: userId,
      username: user.username,
      userCode: user.userId,
      email: user.email,
      entryFee: 0,
      paymentStatus: 'completed',
      registrationStatus: 'pending',
    });
    await registration.save();
    return {
      success: true,
      registration,
      message: 'Registration submitted. Awaiting admin approval.',
    };
  }
}

/**
 * Start tournament (generate bracket)
 */
export async function startTournament(tournamentId) {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.status !== 'registration') {
    throw new Error('Tournament is not in registration status');
  }

  if (tournament.participants.length < 2) {
    throw new Error('Need at least 2 participants');
  }

  // Seed participants by rating (higher rating = better seed)
  tournament.participants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  tournament.participants.forEach((p, idx) => {
    p.seed = idx + 1;
  });

  // Generate bracket
  tournament.generateBracket();
  tournament.status = 'in-progress';

  await tournament.save();

  return {
    success: true,
    tournament,
    bracket: tournament.bracket,
  };
}

/**
 * Record match result and advance winner
 */
export async function recordMatchResult(tournamentId, matchRound, matchNumber, winnerId, matchData) {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  // Record the match result
  const result = await tournament.recordMatchResult(
    matchNumber,
    matchRound,
    winnerId,
    matchData.participant1Score,
    matchData.participant2Score
  );

  // Award rating points if applicable
  if (tournament.prizePool.distribution.length > 0 && tournament.status === 'completed') {
    const results = tournament.getResults();
    const winnerResult = results.find((r) => r.userCode === matchData.winnerCode);

    if (winnerResult) {
      const placement = results.findIndex((r) => r.userCode === matchData.winnerCode) + 1;
      const prizeInfo = tournament.prizePool.distribution.find((d) => d.placement === `${placement}`);

      if (prizeInfo && prizeInfo.ratingPoints > 0) {
        const userRanking = await UserRanking.findOne({ userId: winnerId });
        if (userRanking) {
          userRanking.ratingPoints += prizeInfo.ratingPoints;

          // Update tier
          const TIER_THRESHOLDS = {
            'Bronze': 0,
            'Silver': 1500,
            'Gold': 2500,
            'Platinum': 3500,
            'Diamond': 5000,
          };

          for (const [tier, threshold] of Object.entries(TIER_THRESHOLDS)) {
            if (userRanking.ratingPoints >= threshold) {
              userRanking.tier = tier;
            }
          }

          await userRanking.save();
          // Emit leaderboardUpdate event after ranking change
          const { io } = await import('../server.js');
          const topRankings = await UserRanking.find().sort({ ratingPoints: -1 }).limit(100).lean();
          io.emit('leaderboardUpdate', topRankings);
        }
      }
    }
  }

  return result;
}

/**
 * Get tournament leaderboard
 */
export async function getTournamentLeaderboard(tournamentId) {
  const tournament = await Tournament.findById(tournamentId).populate(
    'participants.userId',
    'username userId'
  );

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const results = tournament.getResults();

  return {
    tournament: {
      _id: tournament._id,
      name: tournament.name,
      type: tournament.type,
      status: tournament.status,
      totalParticipants: tournament.participants.length,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
    },
    leaderboard: results,
    completedMatches: tournament.getCompletedMatches().length,
    totalMatches: tournament.bracket.length,
  };
}

/**
 * Get available tournaments
 */
export async function getAvailableTournaments() {
  const tournaments = await Tournament.find({
    status: { $in: ['pending', 'registration'] },
  })
    .select('name description type maxParticipants startDate')
    .lean();

  return tournaments;
}

/**
 * Get tournament bracket
 */
export async function getTournamentBracket(tournamentId) {
  const tournament = await Tournament.findById(tournamentId)
    .populate('bracket.participant1.userId', 'username')
    .populate('bracket.participant2.userId', 'username')
    .populate('bracket.winner', 'username');

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  // Organize bracket by round
  const bracketByRound = {};
  tournament.bracket.forEach((match) => {
    if (!bracketByRound[match.round]) {
      bracketByRound[match.round] = [];
    }
    bracketByRound[match.round].push(match);
  });

  return {
    tournament: {
      _id: tournament._id,
      name: tournament.name,
      type: tournament.type,
      status: tournament.status,
    },
    bracket: bracketByRound,
  };
}

/**
 * Get user's tournament history
 */
export async function getUserTournamentHistory(userId) {
  const tournaments = await Tournament.find({
    'participants.userId': userId,
  })
    .select('name type status startDate endDate')
    .lean();

  const results = [];

  for (const tournament of tournaments) {
    const detail = await getTournamentDetails(tournament._id);
    const results_data = detail.getResults();
    const userResult = results_data.find(
      (r) => r.userCode === tournament.participants.find((p) => p.userId.toString() === userId.toString())?.userCode
    );

    results.push({
      tournament: {
        _id: detail._id,
        name: detail.name,
        type: detail.type,
        status: detail.status,
        startDate: detail.startDate,
        endDate: detail.endDate,
      },
      placement: results_data.findIndex((r) => r === userResult) + 1 || results_data.length,
      wins: userResult?.wins || 0,
      losses: userResult?.losses || 0,
    });
  }

  return results;
}

/**
 * Get active tournament matches for user
 */
export async function getUserActiveTournamentMatches(userId) {
  const tournaments = await Tournament.find({
    'participants.userId': userId,
    status: 'in-progress',
  });

  const matches = [];

  for (const tournament of tournaments) {
    const userMatches = tournament.bracket.filter(
      (match) =>
        match.status === 'pending' &&
        (match.participant1.userId.toString() === userId.toString() ||
          match.participant2.userId.toString() === userId.toString())
    );

    matches.push(
      ...userMatches.map((match) => ({
        _id: match._id,
        tournament: {
          _id: tournament._id,
          name: tournament.name,
        },
        round: match.round,
        matchNumber: match.matchNumber,
        opponent: match.participant1.userId.toString() === userId.toString()
          ? match.participant2
          : match.participant1,
        status: match.status,
      }))
    );
  }

  return matches;
}

/**
 * Initialize default prize distribution
 */
export function getDefaultPrizeDistribution(participantCount) {
  const distribution = [
    { placement: '1st', ratingPoints: 200, prizeAmount: 100 },
    { placement: '2nd', ratingPoints: 150, prizeAmount: 60 },
    { placement: '3rd', ratingPoints: 100, prizeAmount: 40 },
  ];

  if (participantCount >= 8) {
    distribution.push(
      { placement: '4th', ratingPoints: 50, prizeAmount: 20 },
      { placement: 'Finalist', ratingPoints: 25, prizeAmount: 10 }
    );
  }

  return distribution;
}
