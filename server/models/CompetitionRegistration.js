import mongoose from 'mongoose';

const competitionRegistrationSchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Can reference either Tournament or Race depending on competitionType
    },
    competitionType: {
      type: String,
      enum: ['tournament', 'race'],
      default: 'tournament',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: String,
    userCode: String,
    email: String,
    entryFee: {
      type: Number,
      default: 0, // Races typically don't have entry fees
    },
    paymentId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending', // Only relevant for tournaments with fees
    },
    transactionId: String,
    paymentMethod: {
      type: String,
      enum: ['paystack', 'stripe', 'other'],
      default: 'paystack',
    },
    paymentDate: Date,
    registrationStatus: {
      type: String,
      enum: ['registered', 'pending', 'approved', 'verified', 'disqualified', 'withdrawn', 'rejected'],
      default: 'registered', // 'pending' for tournaments awaiting admin approval, 'approved' for races (instant)
    },
    rejectionReason: String, // If admin rejects registration
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin who rejected
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin who approved (for tournaments)
    },
    finalRank: Number,
    finalScore: Number,
    prizeAwarded: Number,
    prizeDistributed: Boolean,
    notes: String,
  },
  { timestamps: true }
);

// Index for quick lookups
competitionRegistrationSchema.index({ competition: 1, user: 1 });
competitionRegistrationSchema.index({ competition: 1, competitionType: 1 });
competitionRegistrationSchema.index({ paymentStatus: 1 });
competitionRegistrationSchema.index({ registrationStatus: 1 });
competitionRegistrationSchema.index({ competition: 1, paymentStatus: 1 });
competitionRegistrationSchema.index({ competition: 1, registrationStatus: 1 });

export default mongoose.model('CompetitionRegistration', competitionRegistrationSchema);
