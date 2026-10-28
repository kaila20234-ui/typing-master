import mongoose from 'mongoose';

const prizePoolSchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      unique: true,
    },
    totalPrizePool: {
      type: Number,
      default: 0,
      description: 'Total prize money collected from registrations',
    },
    totalEntryFees: {
      type: Number,
      default: 0,
      description: 'Sum of all entry fees collected',
    },
    registrationCount: {
      type: Number,
      default: 0,
    },
    entryFeePerPerson: {
      type: Number,
      required: true,
    },
    platformCommission: {
      type: Number,
      default: 10,
      description: 'Platform fee percentage (e.g., 10%)',
    },
    platformFeeCollected: {
      type: Number,
      default: 0,
    },
    netPrizePool: {
      type: Number,
      default: 0,
      description: 'Prize pool after platform commission',
    },
    prizeDistribution: {
      firstPlace: {
        percentage: {
          type: Number,
          default: 50,
        },
        amount: Number,
        winner: mongoose.Schema.Types.ObjectId,
        winnerUsername: String,
        distributedAt: Date,
      },
      secondPlace: {
        percentage: {
          type: Number,
          default: 30,
        },
        amount: Number,
        winner: mongoose.Schema.Types.ObjectId,
        winnerUsername: String,
        distributedAt: Date,
      },
      thirdPlace: {
        percentage: {
          type: Number,
          default: 20,
        },
        amount: Number,
        winner: mongoose.Schema.Types.ObjectId,
        winnerUsername: String,
        distributedAt: Date,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    winnersAnnounced: Boolean,
    allPrizesDistributed: Boolean,
    notes: String,
  },
  { timestamps: true }
);

// Method to calculate prize amounts
prizePoolSchema.methods.calculatePrizes = async function () {
  this.platformFeeCollected = (this.totalEntryFees * this.platformCommission) / 100;
  this.netPrizePool = this.totalEntryFees - this.platformFeeCollected;

  this.prizeDistribution.firstPlace.amount =
    (this.netPrizePool * this.prizeDistribution.firstPlace.percentage) / 100;
  this.prizeDistribution.secondPlace.amount =
    (this.netPrizePool * this.prizeDistribution.secondPlace.percentage) / 100;
  this.prizeDistribution.thirdPlace.amount =
    (this.netPrizePool * this.prizeDistribution.thirdPlace.percentage) / 100;

  return this.save();
};

// Method to add registration fee to pool
prizePoolSchema.methods.addRegistration = async function (entryFee) {
  this.totalEntryFees += entryFee;
  this.registrationCount += 1;
  await this.calculatePrizes();
  return this;
};

export default mongoose.model('PrizePool', prizePoolSchema);
