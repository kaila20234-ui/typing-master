# Paystack Payment Integration - Setup Guide

This document explains how to configure Paystack payment integration for the Typing Master App.

## Overview

The app has been migrated from PayPal to Paystack for processing competition entry fees. Paystack is a payment platform popular in Africa that supports multiple payment methods.

## Environment Variables

Add these environment variables to your `.env` file in the server directory:

### Required Variables

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
PAYSTACK_API_URL=https://api.paystack.co  # Production URL
```

### Optional Variables (already default in code)

```env
# Frontend callback URL (used for payment redirect)
FRONTEND_URL=http://localhost:5173  # Development
# For production, use: https://your-domain.com
```

## Getting Paystack Credentials

### 1. Create a Paystack Account

1. Go to [https://paystack.com](https://paystack.com)
2. Click "Sign Up"
3. Fill in your details (Business name, email, password)
4. Verify your email
5. Complete KYC (Know Your Customer) verification

### 2. Get Your API Keys

1. Log in to your Paystack dashboard
2. Click on "Settings" in the sidebar
3. Select "API Keys & Webhooks"
4. Copy your **Secret Key** (this is what goes in `PAYSTACK_SECRET_KEY`)
   - Keep this secret and never expose it in client-side code
5. Your **Public Key** is for client-side integrations (not currently used)

### 3. Test Mode vs Live Mode

- **Test Mode**: Use during development with test keys
  - Paystack provides test card numbers on their dashboard
  - No real money is charged
  - Test Secret Key starts with `sk_test_`

- **Live Mode**: Use in production
  - Real payments are processed
  - Use Live Secret Key (starts with `sk_live_`)
  - Make sure your account is fully verified

## Environment File Example

Create `.env` file in the `server` directory:

```env
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/typing-master
JWT_SECRET=your_jwt_secret_key_here

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_test_key_here
PAYSTACK_API_URL=https://api.paystack.co

# Frontend
FRONTEND_URL=http://localhost:5173
```

## Payment Flow

### User Perspective

1. User clicks "Register" on a paid competition
2. Registration modal appears with entry fee
3. User selects "Paystack" payment method
4. User clicks "Pay & Register"
5. User is redirected to Paystack payment page
6. User enters payment details on Paystack
7. After successful payment, user is redirected back to: `{FRONTEND_URL}/payment/verify?reference={TRANSACTION_REFERENCE}`
8. App verifies the payment and completes registration

### Backend Flow

1. `POST /api/competitions/:id/create-payment-order` - Initialize transaction
   - Returns: `authorizationUrl`, `reference`, `accessCode`
   
2. User pays on Paystack and is redirected back with reference

3. `POST /api/competitions/:id/verify-payment` - Verify payment
   - Checks if payment was successful
   
4. `POST /api/competitions/:id/confirm-payment` - Complete registration
   - Registers user for competition
   - Creates payment record

## Testing the Integration

### Using Test Cards

Paystack provides test card numbers. Log in to your dashboard to see them:

- **Visa**: 4084084084084081
- **Mastercard**: 5362306215410685
- Other test cards available in your dashboard

### Test PIN & OTP

- **PIN**: Any 4 digits (e.g., 1234)
- **OTP**: Any 6 digits (e.g., 123456)

### Test Flow

1. Start the app: `npm run dev` in both `app` and `server` directories
2. Navigate to a paid competition
3. Click "Register"
4. Select Paystack and complete payment
5. Use test card details above
6. You should be redirected and registered

## Webhook Configuration (Optional but Recommended)

For production, configure webhooks to handle payment confirmations:

1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. Enter your webhook URL: `https://your-domain.com/api/webhooks/paystack`
3. Copy the webhook signing key (starts with `whsec_`)
4. Add to `.env`: `PAYSTACK_WEBHOOK_SECRET=whsec_your_key`

(Note: Webhook handler needs to be implemented separately)

## Troubleshooting

### 500 Error on Payment Order Creation

**Issue**: "Failed to get Paystack access token"

**Solutions**:
- Verify `PAYSTACK_SECRET_KEY` is correct
- Check that the key is not wrapped in quotes in `.env` file
- Ensure you're using the correct environment (test vs live)
- Restart the server after changing environment variables

### Payment Not Verifying

**Issue**: Payment completed on Paystack but verification fails

**Solutions**:
- Ensure `FRONTEND_URL` matches your actual frontend URL
- Check that the payment reference is being passed correctly
- Verify network connectivity to Paystack API
- Check server logs for detailed error messages

### User Stuck on Payment Page

**Issue**: User redirected to payment but page doesn't load

**Solutions**:
- Verify `PAYSTACK_API_URL` is correct
- Check browser console for CORS or network errors
- Ensure PAYSTACK_SECRET_KEY is valid
- Make sure competition ID in URL is valid

## Migration from PayPal

### What Changed

| Aspect | PayPal | Paystack |
|--------|--------|----------|
| API Endpoint | `api-m.sandbox.paypal.com` | `api.paystack.co` |
| Auth Method | OAuth 2.0 (Client ID + Secret) | API Key in header |
| Currency | USD | NGN (Nigerian Naira) |
| Payment Flow | Order → Approve → Capture | Initialize → Pay → Verify |
| Redirect | PayPal approval page | Paystack checkout page |
| Return | OrderId + approval status | Transaction reference |

### Files Modified

- `server/lib/paymentUtils.js` - Payment utility functions
- `server/routes/payment.js` - Payment routes
- `server/models/Payment.js` - Payment model (enum)
- `server/models/CompetitionRegistration.js` - Registration model (enum)
- `app/src/components/CompetitionRegistrationModal.tsx` - UI component
- `app/src/lib/api.ts` - API client
- `app/src/pages/PaymentCallbackPage.tsx` - Callback handler (new)
- `app/src/main.tsx` - Router setup (new)

## Support

For Paystack API documentation, visit: [https://paystack.com/docs](https://paystack.com/docs)

For issues with the integration, check:
1. Server logs: `console.log` statements in payment routes
2. Paystack dashboard: Transaction history and details
3. Network tab in browser DevTools: Failed requests
