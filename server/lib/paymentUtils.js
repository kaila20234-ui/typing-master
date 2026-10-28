/**
 * Paystack Payment Utilities
 * Handles Paystack API integration for competition registrations
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PAYSTACK_API_URL = process.env.PAYSTACK_API_URL?.trim() || 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY?.trim();

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('Paystack secret key is not configured. Set PAYSTACK_SECRET_KEY in server/.env');
}

/**
 * Initialize Paystack transaction for competition registration
 */
export async function initializePaystackTransaction(amount, userEmail, description, competitionId, userId) {
  try {
    const amountInKobo = Math.round(amount * 100); // Paystack uses kobo (1/100 of Naira)
    
    const transactionData = {
      email: userEmail,
      amount: amountInKobo,
      metadata: {
        competitionId,
        userId,
        description,
      },
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/verify`,
    };

    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Paystack initialization failed: ${response.statusText} - ${text}`);
    }

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || 'Paystack initialization failed');
    }

    return {
      success: true,
      accessCode: data.data.access_code,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify Paystack payment transaction
 */
export async function verifyPaystackTransaction(reference) {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Paystack verification failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Paystack verification failed');
    }

    const transaction = data.data;

    if (transaction.status === 'success') {
      return {
        success: true,
        transactionId: transaction.reference,
        status: transaction.status,
        amount: transaction.amount / 100, // Convert from kobo to naira
        amountInKobo: transaction.amount,
        payerEmail: transaction.customer.email,
        customerName: transaction.customer.customer_code,
        reference: transaction.reference,
        transactionData: transaction,
      };
    }

    return {
      success: false,
      error: `Payment status: ${transaction.status}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Refund Paystack payment
 */
export async function refundPaystackPayment(reference, amount) {
  try {
    const amountInKobo = Math.round(amount * 100);

    const refundData = {
      transaction: reference,
      amount: amountInKobo,
    };

    const response = await fetch(`${PAYSTACK_API_URL}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refundData),
    });

    if (!response.ok) {
      throw new Error(`Paystack refund failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Refund failed');
    }

    return {
      success: true,
      refundId: data.data.reference,
      status: data.data.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  refundPaystackPayment,
};
