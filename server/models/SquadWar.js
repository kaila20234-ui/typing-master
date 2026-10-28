import mongoose from 'mongoose';

const squadWarSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    squadA: {
      squadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Squad',
        required: true,
      },
      name: String,
      score: {
        type: Number,
        default: 0,
      },
      memberScores: [
        {
          userId: mongoose.Schema.Types.ObjectId,
          username: String,
          score: Number,
          wpm: Number,
          accuracy: Number,
          timestamp: Date,
        },
      ],
    },
    squadB: {
      squadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Squad',
        required: true,
      },
      name: String,
      score: {
        type: Number,
        default: 0,
      },
      memberScores: [
        {
          userId: mongoose.Schema.Types.ObjectId,
          username: String,
          score: Number,
          wpm: Number,
          accuracy: Number,
          timestamp: Date,
        },
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    warType: {
      type: String,
      enum: ['elimination', 'time-based', 'point-target'],
      default: 'elimination',
    },
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    maxParticipantsPerSquad: {
      type: Number,
      default: 5,
    },
    winner: {
      type: String,
      enum: ['squadA', 'squadB', 'draw', null],
      default: null,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    rules: {
      typeForWar: {
        type: String,
        default: 'random', // random, words, sentences, quotations
      },
      difficulty: {
        type: String,
        default: 'normal', // normal, hard, expert
      },
    },
    rewards: {
      winnerReward: {
        type: Number,
        default: 100, // rating points
      },
      loserReward: {
        type: Number,
        default: 25,
      },
    },
    managedByAdmin: {
      type: Boolean,
      default: false,
    },
    scoringOverrides: [{
      userId: mongoose.Schema.Types.ObjectId,
      username: String,
      scoreAdjustment: Number,
      reason: String,
      appliedAt: {
        type: Date,
        default: Date.now,
      }
    }],
    entryFee: {
      type: Number,
      default: 5.00,
    },
    registrationOpen: {
      type: Boolean,
      default: true,
    },
    registrationDeadline: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from creation
    },
    readyStatus: {
      squadA: {
        type: Boolean,
        default: false,
      },
      squadB: {
        type: Boolean,
        default: false,
      },
    },
    registrations: [
      {
        squadId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Squad',
          required: true,
        },
        squadName: String,
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        paymentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Payment',
        },
        status: {
          type: String,
          enum: ['pending', 'paid', 'refunded'],
          default: 'pending',
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('SquadWar', squadWarSchema);
