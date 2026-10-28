import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  raceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Race',
  },
  type: {
    type: String,
    enum: ['race', 'friend_request'],
    default: 'race',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
}, { timestamps: true });

export default mongoose.model('Invitation', invitationSchema);
