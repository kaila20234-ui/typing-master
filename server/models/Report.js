import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedUsername: {
    type: String,
    required: true,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reporterUsername: {
    type: String,
    default: 'system',
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'Inappropriate language',
      'Cheating',
      'Spam',
      'Harassment',
      'Fraud',
      'Suspicious activity',
      'Other'
    ],
  },
  description: {
    type: String,
    default: '',
  },
  evidence: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed', 'banned'],
    default: 'pending',
  },
  actionTaken: {
    type: String,
    default: '',
  },
  actionTakenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
