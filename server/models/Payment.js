import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  type: {
    type: String,
    enum: ['entry', 'prize', 'refund', 'subscription', 'tournament', 'squad_war'],
    default: 'entry',
  },
  description: {
    type: String,
    default: '',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paystack', 'wallet', 'internal'],
    default: 'card',
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'refunded'],
    default: 'completed',
  },
  transactionId: {
    type: String,
    default: null,
  },
  relatedTo: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  refundedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
