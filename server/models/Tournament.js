import mongoose from 'mongoose';

const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: 'A competitive typing tournament',
  },
  type: {
    type: String,
    enum: ['single-elimination', 'double-elimination', 'round-robin'],
    default: 'single-elimination',
  },
  status: {
    type: String,
    enum: ['pending', 'registration', 'in-progress', 'completed', 'cancelled'],
    default: 'registration',
  },
  bracketGenerated: {
    type: Boolean,
    default: false,
  },
  maxParticipants: {
    type: Number,
    default: 16,
  },
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      username: String,
      userCode: String,
      rating: Number,
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['registered', 'active', 'eliminated', 'winner'],
        default: 'registered',
      },
      seed: Number, // Seeding for bracket positioning
    },
  ],
  bracket: [
    {
      round: Number, // Round number (1 = first round, 2 = semifinals, etc.)
      matchNumber: Number, // Match sequence in round
      participant1: {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        username: String,
        userCode: String,
        wpm: Number,
        accuracy: Number,
        score: Number,
        isWinner: Boolean,
      },
      participant2: {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        username: String,
        userCode: String,
        wpm: Number,
        accuracy: Number,
        score: Number,
        isWinner: Boolean,
      },
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending',
      },
      winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      raceId: String, // Link to race if applicable
      completedAt: Date,
    },
  ],
  prizePool: {
    totalReward: {
      type: Number,
      default: 0,
    },
    distribution: [
      {
        placement: String, // "1st", "2nd", "3rd", "Finalist", etc.
        ratingPoints: Number,
        prizeAmount: Number,
      },
    ],
  },
  startDate: {
    type: Date,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    default: null, // null means no deadline (registration always open)
  },
  registrationOpen: {
    type: Boolean,
    default: true, // Whether registration is currently accepting entries
  },
  entryFee: {
    type: Number,
    default: 5.00, // Entry fee in USD
  },
  endDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate bracket structure
TournamentSchema.methods.generateBracket = function () {
  if (this.participants.length < 2) {
    throw new Error('Need at least 2 participants for tournament');
  }

  // Sort participants by seed
  const seededParticipants = this.participants
    .sort((a, b) => (a.seed || 999) - (b.seed || 999))
    .slice(0, this.maxParticipants);

  const bracket = [];
  let round = 1;
  let currentRoundParticipants = seededParticipants;

  // Generate first round matches
  for (let i = 0; i < currentRoundParticipants.length; i += 2) {
    if (i + 1 < currentRoundParticipants.length) {
      bracket.push({
        round,
        matchNumber: Math.floor(i / 2) + 1,
        participant1: {
          userId: currentRoundParticipants[i].userId,
          username: currentRoundParticipants[i].username,
          userCode: currentRoundParticipants[i].userCode,
        },
        participant2: {
          userId: currentRoundParticipants[i + 1].userId,
          username: currentRoundParticipants[i + 1].username,
          userCode: currentRoundParticipants[i + 1].userCode,
        },
        status: 'pending',
      });
    }
  }

  // Store bracket structure
  this.bracket = bracket;
  return bracket;
};

// Get current round matches
TournamentSchema.methods.getCurrentRoundMatches = function () {
  return this.bracket.filter((match) => match.status !== 'completed');
};

// Get completed matches
TournamentSchema.methods.getCompletedMatches = function () {
  return this.bracket.filter((match) => match.status === 'completed');
};

// Record match result
TournamentSchema.methods.recordMatchResult = async function (
  matchNumber,
  round,
  winnerId,
  participant1Score,
  participant2Score
) {
  const match = this.bracket.find((m) => m.round === round && m.matchNumber === matchNumber);

  if (!match) {
    throw new Error('Match not found');
  }

  // Update match result
  const isParticipant1Winner = winnerId.toString() === match.participant1.userId.toString();

  if (isParticipant1Winner) {
    match.participant1.isWinner = true;
    match.participant1.score = participant1Score;
    match.participant2.score = participant2Score;
  } else {
    match.participant2.isWinner = true;
    match.participant1.score = participant1Score;
    match.participant2.score = participant2Score;
  }

  match.winner = winnerId;
  match.status = 'completed';
  match.completedAt = new Date();

  // Update participant in bracket
  const winner = this.participants.find((p) => p.userId.toString() === winnerId.toString());
  if (winner) {
    winner.status = 'active';
  }

  await this.save();

  // Check if tournament is complete
  const allMatches = this.bracket;
  const completedMatches = allMatches.filter((m) => m.status === 'completed');

  if (allMatches.length > 0 && completedMatches.length === allMatches.length) {
    this.status = 'completed';
    this.endDate = new Date();

    // Find winner
    const finalMatch = allMatches[allMatches.length - 1];
    const tournamentWinner = this.participants.find((p) =>
      p.userId.toString() === finalMatch.winner.toString()
    );
    if (tournamentWinner) {
      tournamentWinner.status = 'winner';
    }
  }

  await this.save();

  return {
    success: true,
    match,
    tournamentStatus: this.status,
  };
};

// Get participant ranking
TournamentSchema.methods.getResults = function () {
  const completedMatches = this.getCompletedMatches();
  const results = {};

  // Count wins for each participant
  this.participants.forEach((p) => {
    results[p.userId.toString()] = {
      username: p.username,
      userCode: p.userCode,
      wins: 0,
      losses: 0,
      totalScore: 0,
      status: p.status,
      seed: p.seed,
    };
  });

  completedMatches.forEach((match) => {
    const p1Id = match.participant1.userId.toString();
    const p2Id = match.participant2.userId.toString();

    if (match.winner.toString() === p1Id) {
      results[p1Id].wins++;
      results[p2Id].losses++;
    } else {
      results[p2Id].wins++;
      results[p1Id].losses++;
    }

    results[p1Id].totalScore += match.participant1.score || 0;
    results[p2Id].totalScore += match.participant2.score || 0;
  });

  return Object.values(results).sort((a, b) => b.wins - a.wins || b.totalScore - a.totalScore);
};

// Advance winner to next round
TournamentSchema.methods.advanceWinner = function (matchRound, matchNumber, winnerId) {
  const currentMatch = this.bracket.find((m) => m.round === matchRound && m.matchNumber === matchNumber);

  if (!currentMatch) {
    throw new Error('Match not found');
  }

  const nextRound = matchRound + 1;
  const nextMatchNumber = Math.ceil(matchNumber / 2);

  // Find or create next round match
  let nextMatch = this.bracket.find((m) => m.round === nextRound && m.matchNumber === nextMatchNumber);

  if (!nextMatch) {
    // Create new match in next round
    const winnerInfo = currentMatch.participant1.userId.toString() === winnerId.toString()
      ? currentMatch.participant1
      : currentMatch.participant2;

    nextMatch = {
      round: nextRound,
      matchNumber: nextMatchNumber,
      participant1: winnerInfo,
      participant2: null,
      status: 'pending',
    };

    this.bracket.push(nextMatch);
  } else {
    // Add winner to existing match
    const winnerInfo = currentMatch.participant1.userId.toString() === winnerId.toString()
      ? currentMatch.participant1
      : currentMatch.participant2;

    if (!nextMatch.participant1) {
      nextMatch.participant1 = winnerInfo;
    } else if (!nextMatch.participant2) {
      nextMatch.participant2 = winnerInfo;
    }
  }

  return nextMatch;
};

export default mongoose.model('Tournament', TournamentSchema);
