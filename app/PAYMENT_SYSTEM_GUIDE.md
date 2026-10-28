# PayPal Competition Payment System - Setup Guide

## Frontend Components Created

### 1. **RegistrationModal** (`src/components/ui/registration-modal.tsx`)
Payment registration modal for competitions.

**Features:**
- Display entry fee
- PayPal payment integration
- Payment status tracking (ready → processing → awaiting-approval → success/error)
- Automatic error handling and retry logic

**Usage:**
```tsx
import { RegistrationModal } from '@/components/ui/registration-modal';

const [isOpen, setIsOpen] = useState(false);

<RegistrationModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  competition={{ _id: 'comp-123', title: 'Speed Championship', entryFee: 25 }}
  onSuccess={() => {
    // Refresh tournaments or show success message
  }}
/>
```

### 2. **WinnerAnnouncement** (`src/components/ui/winner-announcement.tsx`)
Displays competition winners and prize distribution.

**Features:**
- Medal display (🥇🥈🥉)
- Prize amount per winner
- Leaderboard view with winner stats
- Refresh button to reload results
- Prize breakdown information

**Usage:**
```tsx
import { WinnerAnnouncement } from '@/components/ui/winner-announcement';

<WinnerAnnouncement
  competitionId="comp-123"
  competitionTitle="Speed Championship"
/>
```

### 3. **AdminDashboard** (`src/components/ui/admin-dashboard.tsx`)
Admin panel for tournament management and prize distribution.

**Features:**
- Registration overview (total, completed, pending)
- Revenue and prize pool statistics
- Registrations list with payment status
- Refund management
- One-click prize distribution (top 3 winners)
- Tabs for overview and actions
- Admin access control

**Usage:**
```tsx
import { AdminDashboard } from '@/components/ui/admin-dashboard';

<AdminDashboard
  competitionId="comp-123"
  competitionTitle="Speed Championship"
  isAdmin={userIsAdmin}
/>
```

### 4. **UserCompetitionHistory** (`src/components/ui/user-competition-history.tsx`)
User dashboard showing competition history and earnings.

**Features:**
- Competition history with payment status
- Winner rankings and prizes earned
- Total earnings summary
- Performance statistics
- Net balance calculation (earnings - entry fees)
- Insights and analytics

**Usage:**
```tsx
import { UserCompetitionHistory } from '@/components/ui/user-competition-history';

<UserCompetitionHistory userId={currentUserId} />
```

## Backend Integration

### New API Endpoints (via `apiClient`)

All endpoints require authentication token.

```typescript
// Entry fee endpoints
await apiClient.getCompetitionEntryFee(competitionId)
// Returns: { entryFee: number }

// Payment flow
await apiClient.createPaymentOrder(competitionId, entryFee)
// Returns: { success: boolean, orderId: string, approvalLink: string }

await apiClient.confirmPayment(competitionId, orderId)
// Returns: { success: boolean, registration: ..., transactionId: string }

// Admin endpoints
await apiClient.getCompetitionRegistrations(competitionId, status?, page?, limit?)
// Returns: { registrations: [...], total: number }

await apiClient.getCompetitionStats(competitionId)
// Returns: { stats: { totalRegistrations, completedPayments, totalRevenue, ... } }

await apiClient.distributePrizes(competitionId)
// Returns: { success: boolean, prizesDistributed: { '1st': ..., '2nd': ..., '3rd': ... } }

await apiClient.refundPayment(competitionId, registrationId, reason)
// Returns: { success: boolean }

// User endpoints
await apiClient.getCompetitionWinners(competitionId)
// Returns: { winners: [...] }

await apiClient.getUserRegistrationHistory()
// Returns: { registrations: [...] }

await apiClient.getUserEarnings()
// Returns: { earnings: { totalEarnings, totalParticipations, avgPrize, ... } }

await apiClient.getPrizePool(competitionId)
// Returns: { prizePool: ... }
```

## Environment Variables (Backend)

Set these in `.env` file for PayPal integration:

```
# PayPal Configuration
PAYPAL_API_URL=https://api-sandbox.paypal.com  # Use sandbox for testing
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_MODE=sandbox  # or 'production'

# Optional: Frontend callback URLs
PAYPAL_RETURN_URL=http://localhost:3000/competition/payment-success
PAYPAL_CANCEL_URL=http://localhost:3000/competition/payment-cancel
```

## Prize Distribution System

**Automatic Calculation:**
- Entry fee is collected from each participant
- Platform commission: 10% of total entry fees
- Net prize pool = (total entry fees - platform commission)
- Prize distribution:
  - 1st Place: 50% of net prize pool
  - 2nd Place: 30% of net prize pool
  - 3rd Place: 20% of net prize pool

**Example:**
- 100 participants × $25 entry fee = $2,500 total
- Platform commission (10%) = $250
- Net prize pool = $2,250
- 1st Place: $2,250 × 50% = $1,125
- 2nd Place: $2,250 × 30% = $675
- 3rd Place: $2,250 × 20% = $450

## Database Models

Four new Mongoose models support the payment system:

1. **CompetitionRegistration** - Tracks user registrations and payments
2. **PrizePool** - Manages prize pool calculations
3. **Supporting utilities** - `paymentUtils.js`, `competitionUtils.js`

See backend files:
- `models/CompetitionRegistration.js`
- `models/PrizePool.js`
- `routes/payment.js`
- `utils/paymentUtils.js`
- `utils/competitionUtils.js`

## Payment Flow

### User Registration Flow:
1. User views competition details
2. Clicks "Register" → RegistrationModal opens
3. Modal fetches entry fee via `getCompetitionEntryFee`
4. User clicks "Pay with PayPal"
5. Frontend creates PayPal order via `createPaymentOrder`
6. PayPal redirects user to approval page
7. User approves payment
8. PayPal redirects back to app
9. Frontend confirms payment via `confirmPayment`
10. User is registered and can compete

### Admin Prize Distribution Flow:
1. Admin opens AdminDashboard
2. Views registered competitors
3. Views registration statistics
4. After competition ends, clicks "Distribute Prizes"
5. System automatically selects top 3 performers
6. Calculates prize amounts based on pool
7. Creates payout records
8. Winners can view winnings in UserCompetitionHistory

## Testing with PayPal Sandbox

1. Create PayPal Developer account: https://developer.paypal.com
2. Create a Sandbox Business account
3. Create Sandbox test buyers and sellers
4. Get credentials from Dashboard
5. Set in `.env`:
   ```
   PAYPAL_API_URL=https://api-sandbox.paypal.com
   PAYPAL_CLIENT_ID=<sandbox_client_id>
   PAYPAL_CLIENT_SECRET=<sandbox_client_secret>
   ```
6. Use sandbox buyer account to test payment flow

## Type Safety

All API responses are fully typed with TypeScript interfaces in `src/types/competition.ts`:

- `CompetitionRegistration`
- `PrizePool`
- `CompetitionWinner`
- `CompetitionStats`
- `UserEarnings`
- `PaymentOrderResponse`
- `RegistrationsResponse`
- `WinnersResponse`
- `DistributePrizesResponse`
- And more...

## Error Handling

All components include:
- API error messages
- Network error handling
- User-friendly error messages
- Retry mechanisms
- Loading states with spinners

## Next Steps

1. **Environment Setup**: Set PayPal credentials in `.env`
2. **Integration**: Add components to Tournament/Competition views
3. **Testing**: Test payment flow with PayPal sandbox
4. **Admin Role**: Implement admin authentication for dashboard
5. **Notifications**: Add email notifications for winners
6. **Webhooks**: Set up PayPal webhooks for transaction confirmation
