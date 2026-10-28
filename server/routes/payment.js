import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  refundPaystackPayment,
} from '../lib/paymentUtils.js';
import {
  registerForCompetition,
  getCompetitionRegistrations,
  getCompetitionEntryFee,
  distributePrizes,
  getCompetitionWinners,
  getUserRegistrationHistory,
  getCompetitionStatistics,
} from '../lib/competitionUtils.js';
import Tournament from '../models/Tournament.js';
import PrizePool from '../models/PrizePool.js';
import CompetitionRegistration from '../models/CompetitionRegistration.js';

const router = express.Router();

/**
 * GET /api/competitions/:id/entry-fee
 * Get entry fee for a competition
 */
router.get('/:competitionId/entry-fee', async (req, res) => {
  try {
    const { entryFee, currency } = await getCompetitionEntryFee(req.params.competitionId);
    res.json({ entryFee, currency });
  } catch (error) {
    console.error('Error fetching entry fee:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/competitions/:id/create-payment-order
 * Create Paystack payment initialization for competition entry
 */
router.post('/:competitionId/create-payment-order', authenticateToken, async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { entryFee } = req.body;

    if (!entryFee || entryFee <= 0) {
      return res.status(400).json({ error: 'Invalid entry fee' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await initializePaystackTransaction(
      entryFee,
      user.email,
      `Registration for Competition ${competitionId}`,
      competitionId,
      req.userId
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      orderId: result.reference,
      approvalLink: result.authorizationUrl,
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/competitions/:id/verify-payment
 * Verify Paystack payment reference before confirming registration
 */
router.post('/:competitionId/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }

    const verificationResult = await verifyPaystackTransaction(reference);
    if (!verificationResult.success) {
      return res.status(400).json({ error: verificationResult.error });
    }

    res.json({
      success: true,
      transactionId: verificationResult.transactionId,
      status: verificationResult.status,
      amount: verificationResult.amount,
      payerEmail: verificationResult.payerEmail,
      reference: verificationResult.reference,
      transactionData: verificationResult.transactionData,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/competitions/:id/confirm-payment
 * Confirm PayPal payment and register user
 */
router.post('/:competitionId/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { orderId, entryFee } = req.body;
    const { competitionId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    const verificationResult = await verifyPaystackTransaction(orderId);
    if (!verificationResult.success) {
      return res.status(400).json({ error: verificationResult.error });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const payment = new Payment({
      user: req.userId,
      competition: competitionId,
      orderId,
      transactionId: verificationResult.transactionId,
      amount: Number(verificationResult.amount) || Number(entryFee) || 0,
      currency: 'NGN',
      status: 'completed',
      method: 'paystack',
      paymentDate: new Date(),
    });
    await payment.save();

    const registrationResult = await registerForCompetition(
      competitionId,
      req.userId,
      user.username,
      user.email,
      orderId,
      verificationResult.transactionId,
      payment.amount
    );

    res.json({
      success: true,
      registration: registrationResult.registration,
      transactionId: verificationResult.transactionId,
      message: 'Successfully registered for competition!',
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/competitions/:id/refund
 * Refund a registration (Admin only)
 */
router.post('/:competitionId/refund', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { registrationId, reason } = req.body;

    const registration = await CompetitionRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.paymentStatus !== 'completed') {
      return res.status(400).json({ error: 'Cannot refund non-completed payments' });
    }

    if (!registration.transactionId) {
      return res.status(400).json({ error: 'No transaction found for this registration' });
    }

    // Process refund via Paystack
    const refundResult = await refundPaystackPayment(registration.transactionId, registration.entryFee);
    if (!refundResult.success) {
      return res.status(400).json({ error: refundResult.error });
    }

    // Update registration
    registration.paymentStatus = 'refunded';
    registration.notes = reason || 'Refunded by admin';
    registration.rejectedAt = new Date();
    registration.rejectedBy = req.userId;
    await registration.save();

    // Update payment record if present
    const payment = await Payment.findOne({ transactionId: registration.transactionId });
    if (payment) {
      payment.status = 'refunded';
      payment.refundedAt = new Date();
      payment.refundReason = reason || 'Refund processed by admin';
      await payment.save();
    }

    // Update prize pool
    const prizePool = await PrizePool.findOne({ competition: req.params.competitionId });
    if (prizePool) {
      prizePool.totalEntryFees = Math.max(0, prizePool.totalEntryFees - registration.entryFee);
      prizePool.registrationCount = Math.max(0, prizePool.registrationCount - 1);
      await prizePool.calculatePrizes();
    }

    res.json({
      success: true,
      refundId: refundResult.refundId,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/competitions/:id/registrations
 * Get all registrations for a competition (Admin only)
 */
router.get('/:competitionId/registrations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const registrations = await getCompetitionRegistrations(req.params.competitionId, status);

    res.json({
      registrations,
      total: registrations.length,
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/competitions/:id/winners
 * Get competition winners
 */
router.get('/:competitionId/winners', async (req, res) => {
  try {
    const result = await getCompetitionWinners(req.params.competitionId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/competitions/:id/distribute-prizes
 * Distribute prizes to top 3 winners (Admin only)
 */
router.post('/:competitionId/distribute-prizes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await distributePrizes(req.params.competitionId);
    res.json(result);
  } catch (error) {
    console.error('Error distributing prizes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/competitions/:id/stats
 * Get competition statistics (Admin only)
 */
router.get('/:competitionId/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getCompetitionStatistics(req.params.competitionId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/competitions/:id/prize-pool
 * Get prize pool details
 */
router.get('/:competitionId/prize-pool', async (req, res) => {
  try {
    const prizePool = await PrizePool.findOne({ competition: req.params.competitionId });

    if (!prizePool) {
      return res.status(404).json({ error: 'Prize pool not found' });
    }

    res.json(prizePool);
  } catch (error) {
    console.error('Error fetching prize pool:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/registration-history
 * Get user's registration history
 */
router.get('/user/registration-history', authenticateToken, async (req, res) => {
  try {
    const history = await getUserRegistrationHistory(req.userId);
    res.json({ registrations: history });
  } catch (error) {
    console.error('Error fetching registration history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/earnings
 * Get user's total prize earnings
 */
router.get('/user/earnings', authenticateToken, async (req, res) => {
  try {
    const registrations = await CompetitionRegistration.find({
      user: req.userId,
      prizeDistributed: true,
    });

    const totalEarnings = registrations.reduce((sum, reg) => sum + (reg.prizeAwarded || 0), 0);
    const winCount = registrations.length;

    res.json({
      totalEarnings,
      winCount,
      earnings: registrations.map((reg) => ({
        competitionId: reg.competition,
        prizeAmount: reg.prizeAwarded,
        distributedAt: reg.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
