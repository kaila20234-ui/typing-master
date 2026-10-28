import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: 'We are currently undergoing scheduled maintenance. Please check back soon!',
    },
    estimatedTime: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
  },
  platformName: {
    type: String,
    default: 'Typing Master Platform',
  },
  contactEmail: {
    type: String,
    default: 'support@typingmaster.com',
  },
  supportUrl: {
    type: String,
    default: 'https://typingmaster.com',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Settings = mongoose.model('Settings', SettingsSchema);
export default Settings;
