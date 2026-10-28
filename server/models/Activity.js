import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['user_registration', 'user_suspension', 'user_deletion', 'race_started', 'race_completed', 'tournament_started', 'tournament_ended', 'report_submitted', 'report_resolved', 'user_banned', 'payment_received', 'payment_refunded', 'maintenance_enabled', 'maintenance_disabled', 'challenge_completed'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String
  },
  relatedId: {
    type: String, // ID of related resource (race, tournament, etc)
  },
  relatedType: {
    type: String, // Type of related resource
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Store additional data like amounts, names, etc
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Index for faster queries
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ userId: 1 });

const Activity = mongoose.model('Activity', ActivitySchema);
export default Activity;
