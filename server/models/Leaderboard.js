import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  username: String,
  bestWpm: { type: Number, default: 0 },
  averageWpm: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  totalRaces: { type: Number, default: 0 },
  racesWon: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  timeFrame: {
    type: String,
    enum: ['all_time', 'monthly', 'weekly'],
    default: 'all_time',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Leaderboard', leaderboardSchema);
