import Squad from '../models/Squad.js';
import SquadWar from '../models/SquadWar.js';
import SquadInvite from '../models/SquadInvite.js';
import User from '../models/User.js';
import { io } from '../server.js';

/**
 * Create a new squad
 */
export async function createSquad(leaderId, squadData) {
  try {
    const squad = new Squad({
      name: squadData.name,
      description: squadData.description || '',
      leader: leaderId,
      members: [
        {
          userId: leaderId,
          role: 'leader',
        },
      ],
      maxMembers: squadData.maxMembers || 10,
      profilePicture: squadData.profilePicture || null,
      isPublic: squadData.isPublic !== false,
    });

    await squad.save();
    return squad;
  } catch (error) {
    throw new Error(`Failed to create squad: ${error.message}`);
  }
}

/**
 * Get squad details
 */
export async function getSquadDetails(squadId) {
  try {
    const squad = await Squad.findById(squadId)
      .populate('leader', 'username userId profilePicture')
      .populate('members.userId', 'username userId profilePicture');

    if (!squad) {
      throw new Error('Squad not found');
    }

    return squad;
  } catch (error) {
    throw new Error(`Failed to fetch squad: ${error.message}`);
  }
}

/**
 * Get all available squads (public)
 */
export async function getAvailableSquads(limit = 20, page = 1) {
  try {
    const skip = (page - 1) * limit;
    const squads = await Squad.find({ isPublic: true })
      .select('name description leader stats tier squadRating members')
      .populate('leader', 'username')
      .limit(limit)
      .skip(skip)
      .sort({ squadRating: -1 });

    const total = await Squad.countDocuments({ isPublic: true });

    return {
      squads,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw new Error(`Failed to fetch available squads: ${error.message}`);
  }
}

/**
 * Invite a user to squad
 */
export async function inviteUserToSquad(squadId, invitedUserId, invitedBy) {
  try {
    const squad = await Squad.findById(squadId);
    if (!squad) {
      throw new Error('Squad not found');
    }

    // Check if the invited user exists
    const invitedUser = await User.findById(invitedUserId);
    if (!invitedUser) {
      throw new Error('User not found. Please check the user ID and try again.');
    }

    // Check if user is already a member
    const isMember = squad.members.some((m) => m.userId.toString() === invitedUserId);
    if (isMember) {
      throw new Error('User is already a member of this squad');
    }

    // Check if invitation already exists
    const existingInvite = await SquadInvite.findOne({
      squad: squadId,
      invitedUser: invitedUserId,
      status: 'pending',
    });

    if (existingInvite) {
      throw new Error('User already has a pending invitation');
    }

    const invite = new SquadInvite({
      squad: squadId,
      invitedUser: invitedUserId,
      invitedBy,
    });

    await invite.save();
    return invite;
  } catch (error) {
    throw new Error(`Failed to invite user: ${error.message}`);
  }
}

/**
 * Accept squad invitation
 */
export async function acceptSquadInvite(inviteId, userId) {
  try {
    const invite = await SquadInvite.findById(inviteId);
    if (!invite) {
      throw new Error('Invitation not found');
    }

    if (invite.invitedUser.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    if (invite.status !== 'pending') {
      throw new Error('Invitation is no longer pending');
    }

    const squad = await Squad.findById(invite.squad);
    if (!squad) {
      throw new Error('Squad not found');
    }

    if (squad.members.length >= squad.maxMembers) {
      throw new Error('Squad is full');
    }

    // Add user to squad
    squad.members.push({
      userId: userId,
      role: 'member',
    });

    await squad.save();

    // Update invite status
    invite.status = 'accepted';
    invite.respondedAt = new Date();
    await invite.save();

    return { squad, invite };
  } catch (error) {
    throw new Error(`Failed to accept invitation: ${error.message}`);
  }
}

/**
 * Reject squad invitation
 */
export async function rejectSquadInvite(inviteId, userId) {
  try {
    const invite = await SquadInvite.findById(inviteId);
    if (!invite) {
      throw new Error('Invitation not found');
    }

    if (invite.invitedUser.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    invite.status = 'rejected';
    invite.respondedAt = new Date();
    await invite.save();

    return invite;
  } catch (error) {
    throw new Error(`Failed to reject invitation: ${error.message}`);
  }
}

/**
 * Get user's pending squad invitations
 */
export async function getUserSquadInvitations(userId) {
  try {
    const invites = await SquadInvite.find({
      invitedUser: userId,
      status: 'pending',
    })
      .populate('squad', 'name description leader')
      .populate('invitedBy', 'username')
      .sort({ createdAt: -1 });

    return invites;
  } catch (error) {
    throw new Error(`Failed to fetch invitations: ${error.message}`);
  }
}

/**
 * Leave squad
 */
export async function leaveSquad(squadId, userId) {
  try {
    const squad = await Squad.findById(squadId);
    if (!squad) {
      throw new Error('Squad not found');
    }

    const isMember = squad.members.findIndex((m) => m.userId.toString() === userId);
    if (isMember === -1) {
      throw new Error('User is not a member of this squad');
    }

    // Can't leave if you're the leader and there are members
    if (squad.leader.toString() === userId && squad.members.length > 1) {
      throw new Error('Leader cannot leave while squad has members');
    }

    squad.members.splice(isMember, 1);

    // If squad is empty, optionally delete it
    if (squad.members.length === 0) {
      await Squad.findByIdAndDelete(squadId);
      return { message: 'Squad deleted as it has no members' };
    }

    await squad.save();
    return squad;
  } catch (error) {
    throw new Error(`Failed to leave squad: ${error.message}`);
  }
}

/**
 * Create a squad war
 */
export async function createSquadWar(squadA_Id, squadB_Id, warData) {
  try {
    const squadA = await Squad.findById(squadA_Id);
    const squadB = await Squad.findById(squadB_Id);

    if (!squadA || !squadB) {
      throw new Error('One or both squads not found');
    }

    const war = new SquadWar({
      title: warData.title || `${squadA.name} vs ${squadB.name}`,
      description: warData.description || '',
      squadA: {
        squadId: squadA_Id,
        name: squadA.name,
      },
      squadB: {
        squadId: squadB_Id,
        name: squadB.name,
      },
      warType: warData.warType || 'elimination',
      duration: warData.duration || 30,
      maxParticipantsPerSquad: warData.maxParticipantsPerSquad || 5,
      rules: warData.rules || {
        typeForWar: 'random',
        difficulty: 'normal',
      },
      rewards: warData.rewards || {
        winnerReward: 100,
        loserReward: 25,
      },
      startDate: warData.startDate || new Date(),
    });

    await war.save();
    return war;
  } catch (error) {
    throw new Error(`Failed to create squad war: ${error.message}`);
  }
}

/**
 * Get squad war details
 */
export async function getSquadWarDetails(warId) {
  try {
    const war = await SquadWar.findById(warId)
      .populate('squadA.squadId', 'name')
      .populate('squadB.squadId', 'name');

    if (!war) {
      throw new Error('Squad war not found');
    }

    return war;
  } catch (error) {
    throw new Error(`Failed to fetch squad war: ${error.message}`);
  }
}

/**
 * Record member score in squad war
 */
export async function recordMemberScore(warId, squadPosition, userId, username, score, wpm, accuracy) {
  try {
    const war = await SquadWar.findById(warId);
    if (!war) {
      throw new Error('Squad war not found');
    }

    const memberScore = {
      userId,
      username,
      score,
      wpm,
      accuracy,
      timestamp: new Date(),
    };

    if (squadPosition === 'A') {
      war.squadA.memberScores.push(memberScore);
      war.squadA.score += score;
    } else if (squadPosition === 'B') {
      war.squadB.memberScores.push(memberScore);
      war.squadB.score += score;
    } else {
      throw new Error('Invalid squad position');
    }

    // Determine winner if war is completed
    if (war.status === 'completed') {
      determineSqWinner(war);
    }

    await war.save();
    return war;
  } catch (error) {
    throw new Error(`Failed to record score: ${error.message}`);
  }
}

/**
 * End squad war and determine winner
 */
export async function endSquadWar(warId) {
  try {
    const war = await SquadWar.findById(warId);
    if (!war) {
      throw new Error('Squad war not found');
    }

    war.status = 'completed';
    war.endDate = new Date();

    // Determine winner
    if (war.squadA.score > war.squadB.score) {
      war.winner = 'squadA';
    } else if (war.squadB.score > war.squadA.score) {
      war.winner = 'squadB';
    } else {
      war.winner = 'draw';
    }

    // Update squad stats
    const squadA = await Squad.findById(war.squadA.squadId);
    const squadB = await Squad.findById(war.squadB.squadId);

    if (squadA && squadB) {
      squadA.stats.totalWars += 1;
      squadB.stats.totalWars += 1;

      if (war.winner === 'squadA') {
        squadA.stats.wins += 1;
        squadB.stats.losses += 1;
        squadA.stats.totalPoints += war.rewards.winnerReward;
        squadB.stats.totalPoints += war.rewards.loserReward;
        updateSquadRating(squadA, squadB, true);
      } else if (war.winner === 'squadB') {
        squadB.stats.wins += 1;
        squadA.stats.losses += 1;
        squadB.stats.totalPoints += war.rewards.winnerReward;
        squadA.stats.totalPoints += war.rewards.loserReward;
        updateSquadRating(squadB, squadA, true);
      } else if (war.winner === 'draw') {
        // For draws, split rewards and apply minor rating adjustments
        // This ensures well-matched squads maintain stable ratings
        squadA.stats.totalPoints += Math.floor(war.rewards.winnerReward / 2);
        squadB.stats.totalPoints += Math.floor(war.rewards.winnerReward / 2);
        console.log(`\n🤝 SQUAD WAR DRAW:`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`${squadA.name} (Score: ${war.squadA.score}) vs ${squadB.name} (Score: ${war.squadB.score})`);
        console.log(`Both squads split rewards (${Math.floor(war.rewards.winnerReward / 2)} points each)`);
        console.log(`Ratings remain unchanged`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      }

      squadA.stats.winRate = (squadA.stats.wins / squadA.stats.totalWars * 100).toFixed(2);
      squadB.stats.winRate = (squadB.stats.wins / squadB.stats.totalWars * 100).toFixed(2);

      await squadA.save();
      await squadB.save();
      // Emit squadLeaderboardUpdate event after squad leaderboard changes
      const topSquads = await Squad.find().select('name tier squadRating stats members leader').populate('leader', 'username').sort({ squadRating: -1 }).limit(50).lean();
      io.emit('squadLeaderboardUpdate', topSquads);
    }

    await war.save();
    return war;
  } catch (error) {
    throw new Error(`Failed to end squad war: ${error.message}`);
  }
}

/**
 * Update squad rating based on war result (Elo-style)
 * Uses K-factor of 32 for moderate volatility
 */
function updateSquadRating(winner, loser, winnerWon) {
  const K_FACTOR = 32;
  const RATING_DIFF = winner.squadRating - loser.squadRating;
  const EXPECTED_WIN_CHANCE = 1 / (1 + Math.pow(10, -RATING_DIFF / 400));

  const oldWinnerRating = winner.squadRating;
  const oldLoserRating = loser.squadRating;

  let winnerRatingChange = 0;
  let loserRatingChange = 0;

  if (winnerWon) {
    winnerRatingChange = K_FACTOR * (1 - EXPECTED_WIN_CHANCE);
    loserRatingChange = K_FACTOR * (0 - (1 - EXPECTED_WIN_CHANCE));
    winner.squadRating += winnerRatingChange;
    loser.squadRating += loserRatingChange;
  } else {
    // Upset scenario
    winnerRatingChange = K_FACTOR * (0 - EXPECTED_WIN_CHANCE);
    loserRatingChange = K_FACTOR * (1 - (1 - EXPECTED_WIN_CHANCE));
    winner.squadRating += winnerRatingChange;
    loser.squadRating += loserRatingChange;
  }

  // Ensure ratings don't go below 0
  winner.squadRating = Math.max(0, winner.squadRating);
  loser.squadRating = Math.max(0, loser.squadRating);

  // Round to 2 decimal places for consistency
  winner.squadRating = Math.round(winner.squadRating * 100) / 100;
  loser.squadRating = Math.round(loser.squadRating * 100) / 100;

  console.log(`\n⚔️  SQUAD RATING UPDATE:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Winner: ${winner.name} (${oldWinnerRating} → ${winner.squadRating})`);
  console.log(`Loser:  ${loser.name} (${oldLoserRating} → ${loser.squadRating})`);
  console.log(`Rating Diff: ${RATING_DIFF} | Expected Win Chance: ${(EXPECTED_WIN_CHANCE * 100).toFixed(2)}%`);
  console.log(`Result: Winner ${winnerRatingChange >= 0 ? '+' : ''}${winnerRatingChange.toFixed(2)}, Loser ${loserRatingChange.toFixed(2)}`);

  // Update tier based on rating
  const oldWinnerTier = winner.tier;
  const oldLoserTier = loser.tier;
  updateSquadTier(winner);
  updateSquadTier(loser);

  if (oldWinnerTier !== winner.tier || oldLoserTier !== loser.tier) {
    console.log(`Tier Changes: ${winner.name} ${oldWinnerTier}→${winner.tier}, ${loser.name} ${oldLoserTier}→${loser.tier}`);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

/**
 * Update squad tier based on rating
 * Tier thresholds: Bronze < 800, Silver 800-1199, Gold 1200-1599,
 * Platinum 1600-1999, Diamond 2000-2399, Mythic >= 2400
 */
function updateSquadTier(squad) {
  const rating = squad.squadRating;

  if (rating >= 2400) squad.tier = 'Mythic';
  else if (rating >= 2000) squad.tier = 'Diamond';
  else if (rating >= 1600) squad.tier = 'Platinum';
  else if (rating >= 1200) squad.tier = 'Gold';
  else if (rating >= 800) squad.tier = 'Silver';
  else squad.tier = 'Bronze';
}

/**
 * Get squad leaderboard
 */
export async function getSquadLeaderboard(limit = 50, page = 1) {
  try {
    const skip = (page - 1) * limit;
    const squads = await Squad.find()
      .select('name tier squadRating stats members')
      .populate('leader', 'username')
      .limit(limit)
      .skip(skip)
      .sort({ squadRating: -1 });

    const total = await Squad.countDocuments();

    return {
      squads,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  }
}

/**
 * Get squad's war history
 */
export async function getSquadWarHistory(squadId, limit = 20, page = 1) {
  try {
    const skip = (page - 1) * limit;
    const wars = await SquadWar.find({
      $or: [{ 'squadA.squadId': squadId }, { 'squadB.squadId': squadId }],
    })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await SquadWar.countDocuments({
      $or: [{ 'squadA.squadId': squadId }, { 'squadB.squadId': squadId }],
    });

    return {
      wars,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw new Error(`Failed to fetch war history: ${error.message}`);
  }
}

/**
 * Get active squad wars
 */
export async function getActiveSquadWars(limit = 20) {
  try {
    const wars = await SquadWar.find({
      status: { $in: ['pending', 'in-progress'] },
    })
      .limit(limit)
      .sort({ startDate: -1 });

    return wars;
  } catch (error) {
    throw new Error(`Failed to fetch active wars: ${error.message}`);
  }
}

/**
 * Get user's squads
 */
export async function getUserSquads(userId) {
  try {
    const squads = await Squad.find({
      $or: [
        { leader: userId },
        { 'members.userId': userId },
      ],
    })
      .populate('leader', 'username userId')
      .populate('members.userId', 'username userId');

    return squads;
  } catch (error) {
    throw new Error(`Failed to fetch user squads: ${error.message}`);
  }
}
