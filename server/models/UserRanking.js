import mongoose from 'mongoose';

const userRankingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  ratingPoints: {
    type: Number,
    default: 1000,
    min: 0,
  },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    default: 'Bronze',
  },
  tipsRanking: {
    type: Number,
    default: null,
  },
  totalRaces: {
    type: Number,
    default: 0,
  },
  racesWon: {
    type: Number,
    default: 0,
  },
  winRate: {
    type: Number,
    default: 0,
  },
  winStreak: {
    type: Number,
    default: 0,
  },
  maxWinStreak: {
    type: Number,
    default: 0,
  },
  averageWpm: {
    type: Number,
    default: 0,
  },
  averageAccuracy: {
    type: Number,
    default: 0,
  },
  lastRaceDate: {
    type: Date,
    default: null,
  },
  seasonReset: {
    type: Date,
    default: Date.now,
  },
  ratingHistory: [{
    date: Date,
    ratingChange: Number,
    opponent: String,
    result: String, // 'win' or 'loss'
  }],
  achievements: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Tier thresholds
export const TIER_THRESHOLDS = {
  'Bronze': 0,
  'Silver': 1500,
  'Gold': 2500,
  'Platinum': 3500,
  'Diamond': 5000,
};

// Calculate tier based on rating points
userRankingSchema.methods.calculateTier = function() {
  let tier = 'Bronze';
  for (const [tierName, minPoints] of Object.entries(TIER_THRESHOLDS)) {
    if (this.ratingPoints >= minPoints) {
      tier = tierName;
    }
  }
  this.tier = tier;
  return tier;
};

// Calculate win rate
userRankingSchema.methods.updateWinRate = function() {
  if (this.totalRaces > 0) {
    this.winRate = Math.round((this.racesWon / this.totalRaces) * 100);
  }
};

export default mongoose.model('UserRanking', userRankingSchema);
