import mongoose from 'mongoose';

const raceResultSchema = new mongoose.Schema({
  raceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Race',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  wpm: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    required: true,
  },
  correctChars: {
    type: Number,
    default: 0,
  },
  incorrectChars: {
    type: Number,
    default: 0,
  },
  totalChars: {
    type: Number,
    default: 0,
  },
  timeElapsed: {
    type: Number,
    required: true,
  },
  finishTime: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('RaceResult', raceResultSchema);
