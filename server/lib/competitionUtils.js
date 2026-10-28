import CompetitionRegistration from '../models/CompetitionRegistration.js';
import PrizePool from '../models/PrizePool.js';
import Tournament from '../models/Tournament.js';
import Race from '../models/Race.js';
import User from '../models/User.js';

/**
 * Register user for competition after payment
 */
export async function registerForCompetition(competitionId, userId, username, email, paymentId, transactionId, entryFee) {
  try {
    // Check if already registered
    const existingRegistration = await CompetitionRegistration.findOne({
      competition: competitionId,
      user: userId,
      paymentStatus: 'completed',
    });

    if (existingRegistration) {
      throw new Error('User already registered for this competition');
    }

    // Create registration record
    const registration = new CompetitionRegistration({
      competition: competitionId,
      user: userId,
      username,
      email,
      entryFee,
      paymentId,
      transactionId,
      paymentStatus: 'completed',
      registrationStatus: 'verified',
      paymentDate: new Date(),
    });

    await registration.save();

    // Update prize pool
    const prizePool = await PrizePool.findOne({ competition: competitionId });
    if (prizePool) {
      await prizePool.addRegistration(entryFee);
    }

    return {
      success: true,
      registration,
      prizePool,
    };
  } catch (error) {
    throw new Error(`Failed to register: ${error.message}`);
  }
}

/**
 * Get registrations for a competition
 */
export async function getCompetitionRegistrations(competitionId, status = null) {
  try {
    const query = { competition: competitionId };
    if (status) {
      query.paymentStatus = status;
    }

    const registrations = await CompetitionRegistration.find(query)
      .populate('user', 'username email userId')
      .sort({ createdAt: -1 });

    return registrations;
  } catch (error) {
    throw new Error(`Failed to fetch registrations: ${error.message}`);
  }
}

/**
 * Get registration fee for a competition
 */
export async function getCompetitionEntryFee(competitionId) {
  try {
    const tournament = await Tournament.findById(competitionId);
    if (!tournament) {
      throw new Error('Competition not found');
    }

    return {
      entryFee: tournament.entryFee || 0,
      currency: tournament.currency || 'USD',
    };
  } catch (error) {
    throw new Error(`Failed to get entry fee: ${error.message}`);
  }
}

/**
 * Distribute prizes to top 3 winners
 */
export async function distributePrizes(competitionId) {
  try {
    const tournament = await Tournament.findById(competitionId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Get all registrations sorted by final score
    const registrations = await CompetitionRegistration.find({
      competition: competitionId,
      paymentStatus: 'completed',
      registrationStatus: 'verified',
    })
      .populate('user', 'username email userId')
      .sort({ finalScore: -1 })
      .limit(3);

    if (registrations.length === 0) {
      throw new Error('No verified registrations found');
    }

    const prizePool = await PrizePool.findOne({ competition: competitionId });
    if (!prizePool) {
      throw new Error('Prize pool not found');
    }

    // Distribute prizes
    const prizes = [
      { position: 'firstPlace', registration: registrations[0] },
      { position: 'secondPlace', registration: registrations[1] },
      { position: 'thirdPlace', registration: registrations[2] },
    ];

    for (const prize of prizes) {
      if (prize.registration) {
        const prizeAmount = prizePool.prizeDistribution[prize.position].amount;

        // Award prize to winner
        prize.registration.prizeAwarded = prizeAmount;
        prize.registration.prizeDistributed = true;
        await prize.registration.save();

        // Update prize pool distribution
        prizePool.prizeDistribution[prize.position].winner = prize.registration.user._id;
        prizePool.prizeDistribution[prize.position].winnerUsername = prize.registration.username;
        prizePool.prizeDistribution[prize.position].distributedAt = new Date();

        // Award rating points to winner
        const pointsAwarded = prize.position === 'firstPlace' ? 500 : prize.position === 'secondPlace' ? 300 : 200;
        // TODO: Update user rating points
      }
    }

    prizePool.winnersAnnounced = true;
    prizePool.allPrizesDistributed = true;
    prizePool.status = 'completed';
    await prizePool.save();

    return {
      success: true,
      winners: registrations.map((reg, idx) => ({
        rank: idx + 1,
        username: reg.username,
        score: reg.finalScore,
        prizeAmount: prizePool.prizeDistribution[
          idx === 0 ? 'firstPlace' : idx === 1 ? 'secondPlace' : 'thirdPlace'
        ].amount,
      })),
      prizePool,
    };
  } catch (error) {
    throw new Error(`Failed to distribute prizes: ${error.message}`);
  }
}

/**
 * Get competition winners
 */
export async function getCompetitionWinners(competitionId) {
  try {
    const prizePool = await PrizePool.findOne({ competition: competitionId });
    if (!prizePool) {
      throw new Error('Prize pool not found');
    }

    const winners = [];

    if (prizePool.prizeDistribution.firstPlace.winner) {
      winners.push({
        rank: 1,
        userId: prizePool.prizeDistribution.firstPlace.winner,
        username: prizePool.prizeDistribution.firstPlace.winnerUsername,
        prizeAmount: prizePool.prizeDistribution.firstPlace.amount,
        distributedAt: prizePool.prizeDistribution.firstPlace.distributedAt,
      });
    }

    if (prizePool.prizeDistribution.secondPlace.winner) {
      winners.push({
        rank: 2,
        userId: prizePool.prizeDistribution.secondPlace.winner,
        username: prizePool.prizeDistribution.secondPlace.winnerUsername,
        prizeAmount: prizePool.prizeDistribution.secondPlace.amount,
        distributedAt: prizePool.prizeDistribution.secondPlace.distributedAt,
      });
    }

    if (prizePool.prizeDistribution.thirdPlace.winner) {
      winners.push({
        rank: 3,
        userId: prizePool.prizeDistribution.thirdPlace.winner,
        username: prizePool.prizeDistribution.thirdPlace.winnerUsername,
        prizeAmount: prizePool.prizeDistribution.thirdPlace.amount,
        distributedAt: prizePool.prizeDistribution.thirdPlace.distributedAt,
      });
    }

    return {
      success: true,
      winners,
      totalPool: prizePool.netPrizePool,
      platformFee: prizePool.platformFeeCollected,
    };
  } catch (error) {
    throw new Error(`Failed to get winners: ${error.message}`);
  }
}

/**
 * Get user's registration history
 */
export async function getUserRegistrationHistory(userId) {
  try {
    const registrations = await CompetitionRegistration.find({ user: userId })
      .populate('competition', 'name startDate endDate status')
      .sort({ createdAt: -1 });

    const enrichedRegistrations = registrations.map((reg) => ({
      ...reg.toObject(),
      prizeEarned: reg.prizeAwarded || 0,
      status: reg.paymentStatus,
    }));

    return enrichedRegistrations;
  } catch (error) {
    throw new Error(`Failed to fetch registration history: ${error.message}`);
  }
}

/**
 * Get competition statistics
 */
export async function getCompetitionStatistics(competitionId) {
  try {
    const registrations = await CompetitionRegistration.find({
      competition: competitionId,
    });

    const completedPayments = registrations.filter((r) => r.paymentStatus === 'completed').length;
    const failedPayments = registrations.filter((r) => r.paymentStatus === 'failed').length;
    const totalRevenue = registrations
      .filter((r) => r.paymentStatus === 'completed')
      .reduce((sum, r) => sum + r.entryFee, 0);

    const prizePool = await PrizePool.findOne({ competition: competitionId });

    return {
      totalRegistrations: registrations.length,
      completedPayments,
      failedPayments,
      totalRevenue,
      platformFee: prizePool?.platformFeeCollected || 0,
      netPrizePool: prizePool?.netPrizePool || 0,
      averageEntryFee: totalRevenue / completedPayments || 0,
    };
  } catch (error) {
    throw new Error(`Failed to get statistics: ${error.message}`);
  }
}

/**
 * Check if registration is currently open for a competition
 * Returns true if no deadline set or deadline has not passed
 */
export async function isRegistrationOpen(competition) {
  try {
    if (!competition.registrationDeadline) {
      return competition.registrationOpen !== false; // Default to open if no deadline
    }

    const now = new Date();
    const isOpen = now < competition.registrationDeadline && competition.registrationOpen !== false;

    return isOpen;
  } catch (error) {
    throw new Error(`Failed to check registration status: ${error.message}`);
  }
}

/**
 * Set registration deadline for a competition
 */
export async function setRegistrationDeadline(competitionId, competitionType, deadline) {
  try {
    let competition;

    if (competitionType === 'tournament') {
      competition = await Tournament.findByIdAndUpdate(
        competitionId,
        {
          registrationDeadline: deadline,
          registrationOpen: deadline ? new Date() < deadline : true,
        },
        { new: true }
      );
    } else if (competitionType === 'race') {
      competition = await Race.findByIdAndUpdate(
        competitionId,
        {
          registrationDeadline: deadline,
          registrationOpen: deadline ? new Date() < deadline : true,
        },
        { new: true }
      );
    } else {
      throw new Error('Invalid competition type');
    }

    if (!competition) {
      throw new Error('Competition not found');
    }

    return {
      success: true,
      competition,
    };
  } catch (error) {
    throw new Error(`Failed to set registration deadline: ${error.message}`);
  }
}

/**
 * Register user for a race (instant approval)
 */
export async function registerForRace(raceId, userId, username, email, userCode) {
  try {
    // Get race
    const race = await Race.findById(raceId);
    if (!race) {
      throw new Error('Race not found');
    }

    // Check if registration is open
    const registrationOpen = await isRegistrationOpen(race);
    if (!registrationOpen) {
      throw new Error('Registration is closed for this race');
    }

    // Check if already registered
    const existingRegistration = await CompetitionRegistration.findOne({
      competition: raceId,
      user: userId,
      competitionType: 'race',
    });

    if (existingRegistration) {
      throw new Error('User already registered for this race');
    }

    // Check race capacity
    if (race.participants.length >= race.maxParticipants) {
      throw new Error('Race is at maximum capacity');
    }

    // Create registration record (instantly approved for races)
    const registration = new CompetitionRegistration({
      competition: raceId,
      competitionType: 'race',
      user: userId,
      username,
      userCode,
      email,
      entryFee: 0,
      paymentStatus: 'completed', // N/A for races
      registrationStatus: 'approved', // Instant approval
      approvedAt: new Date(),
    });

    await registration.save();

    return {
      success: true,
      registration,
    };
  } catch (error) {
    throw new Error(`Failed to register for race: ${error.message}`);
  }
}

/**
 * Approve a pending tournament registration (admin only)
 */
export async function approveRegistration(registrationId, approvedBy) {
  try {
    const registration = await CompetitionRegistration.findByIdAndUpdate(
      registrationId,
      {
        registrationStatus: 'approved',
        approvedAt: new Date(),
        approvedBy,
      },
      { new: true }
    );

    if (!registration) {
      throw new Error('Registration not found');
    }

    return {
      success: true,
      registration,
    };
  } catch (error) {
    throw new Error(`Failed to approve registration: ${error.message}`);
  }
}

/**
 * Reject a tournament registration (admin only)
 */
export async function rejectRegistration(registrationId, rejectionReason, rejectedBy) {
  try {
    const registration = await CompetitionRegistration.findByIdAndUpdate(
      registrationId,
      {
        registrationStatus: 'rejected',
        rejectionReason,
        rejectedAt: new Date(),
        rejectedBy,
      },
      { new: true }
    );

    if (!registration) {
      throw new Error('Registration not found');
    }

    // If tournament registration with payment, handle refund
    if (registration.competitionType === 'tournament' && registration.paymentStatus === 'completed') {
      // TODO: Initiate refund process if needed
    }

    return {
      success: true,
      registration,
    };
  } catch (error) {
    throw new Error(`Failed to reject registration: ${error.message}`);
  }
}

/**
 * Get pending registrations for a competition
 */
export async function getPendingRegistrations(competitionId, competitionType) {
  try {
    const registrations = await CompetitionRegistration.find({
      competition: competitionId,
      competitionType,
      registrationStatus: 'pending',
    })
      .populate('user', 'username email userId')
      .sort({ createdAt: 1 }); // Oldest first (FIFO)

    return registrations;
  } catch (error) {
    throw new Error(`Failed to fetch pending registrations: ${error.message}`);
  }
}
