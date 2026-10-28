import mongoose from 'mongoose';

const raceSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'ready', 'in_progress', 'completed'],
    default: 'waiting',
  },
  forcedStatus: {
    type: String,
    enum: ['started', 'ended', null],
    default: null,
  },
  adminNotes: {
    type: String,
    default: '',
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userCode: {
      type: String,
      required: true,
    },
    username: String,
    profilePicture: String,
    wpm: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    raceStatus: {
      type: String,
      enum: ['waiting', 'ready', 'typing', 'finished'],
      default: 'waiting',
    },
    finishTime: Date,
    characterCount: { type: Number, default: 0 },
  }],
  text: {
    type: String,
    required: true,
  },
  raceType: {
    type: String,
    enum: ['passage', 'random'],
    default: 'passage',
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'custom'],
    default: 'intermediate',
  },
  lessonId: mongoose.Schema.Types.ObjectId,
  maxParticipants: {
    type: Number,
    default: 10,
  },
  registrationDeadline: {
    type: Date,
    default: null, // null means no deadline (registration always open)
  },
  registrationOpen: {
    type: Boolean,
    default: true, // Whether registration is currently accepting entries
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

export default mongoose.model('Race', raceSchema);
