# Payment System Testing Checklist

## Pre-Testing Setup ✓

- [ ] Backend server running (`npm start` or `npm run dev`)
- [ ] Frontend development server running (`npm run dev`)
- [ ] PayPal credentials set in `.env`:
  - [ ] `PAYPAL_CLIENT_ID`
  - [ ] `PAYPAL_CLIENT_SECRET`
  - [ ] `PAYPAL_API_URL` (sandbox)
- [ ] Database connection active
- [ ] User account created and logged in

---

## Test 1: Free Tournament Registration

### Setup
- [ ] Create a tournament with `requiresPayment: false` or `entryFee: 0`

### Test Steps
- [ ] Navigate to Tournaments view
- [ ] Browse available tournaments
- [ ] Click on the free tournament
- [ ] Verify "Register Now" button appears (NOT "Register to Pay")
- [ ] Click "Register Now"
- [ ] Verify registration succeeds
- [ ] Confirm "✓ You are registered" message appears
- [ ] Verify user appears in participant list

### Expected Result ✓
- [ ] User registered without payment modal
- [ ] No PayPal redirect
- [ ] Immediate confirmation

---

## Test 2: Paid Tournament Registration - Entry Fee Display

### Setup
- [ ] Create a tournament with `requiresPayment: true` and `entryFee: 25`

### Test Steps
- [ ] Navigate to Tournaments view
- [ ] Click on the paid tournament
- [ ] In registration card, verify:
  - [ ] "This is a paid tournament" message shows
  - [ ] Entry fee displays: "Entry Fee: $25.00"
  - [ ] "Register to Pay" button appears
- [ ] Verify prize distribution info shows: "50% to 1st place, 30% to 2nd, 20% to 3rd"

### Expected Result ✓
- [ ] Entry fee properly displayed
- [ ] Clear indication of paid tournament
- [ ] Prize information visible

---

## Test 3: Paid Tournament - PayPal Payment Flow

### Setup
- [ ] Have a paid tournament ready (from Test 2)
- [ ] Have a PayPal sandbox test buyer account

### Test Steps
- [ ] Click "Register to Pay"
- [ ] Registration modal appears
- [ ] Click "Load Entry Fee" button (if not auto-loaded)
- [ ] Verify entry fee loads: "$25.00"
- [ ] Click "Pay with PayPal"
- [ ] Verify "Creating payment order..." message
- [ ] Verify "Redirecting to PayPal..." message
- [ ] **Redirected to PayPal approval page**

### PayPal Sandbox Steps
- [ ] Login with sandbox buyer account
- [ ] Review payment details: $25.00
- [ ] Click "Approve" or equivalent
- [ ] **Automatic redirect back to application**

### Post-Payment Steps
- [ ] Back in application modal
- [ ] Verify "Confirming payment..." message briefly appears
- [ ] Modal shows success:
  - [ ] Green checkmark icon appears
  - [ ] "Registration Successful!" message
  - [ ] "You are now registered for [Tournament Name]" message
- [ ] Modal auto-closes after 2 seconds
- [ ] Verify "✓ You are registered" appears in tournament details

### Expected Result ✓
- [ ] Payment processed successfully
- [ ] User registered for tournament
- [ ] No errors or exceptions
- [ ] Registration data saved to database

---

## Test 4: Admin Dashboard - View Registrations

### Setup
- [ ] Have at least 2 users registered for a paid tournament
- [ ] Login as admin user (or set `isAdmin: true`)

### Test Steps
- [ ] Open the paid tournament
- [ ] Verify "⚙️ Admin" tab appears (only for admins)
- [ ] Click "Admin" tab
- [ ] Verify dashboard shows:
  - [ ] Total Registrations: 2 (or your count)
  - [ ] Completed Payments: X
  - [ ] Total Revenue: $X.XX
  - [ ] Prize Pool: $X.XX
- [ ] Check Registrations list:
  - [ ] Shows all users who registered
  - [ ] Payment status for each (completed/pending/failed)
  - [ ] Entry fee amount
  - [ ] Refund button available

### Expected Result ✓
- [ ] Admin can view registrations
- [ ] Statistics calculate correctly
- [ ] All user data displays properly

---

## Test 5: Admin Dashboard - Prize Distribution

### Setup
- [ ] Have tournament marked as "completed"
- [ ] Have 3+ registered users with completed payments
- [ ] Login as admin

### Test Steps
- [ ] Open completed tournament
- [ ] Click "Admin" tab
- [ ] Click "Actions" tab (if present)
- [ ] Locate "Distribute Prizes" section
- [ ] Verify button and instructions present:
  - [ ] "50% to 1st place"
  - [ ] "30% to 2nd place"
  - [ ] "20% to 3rd place"
- [ ] Click "Distribute Prizes Now"
- [ ] Confirm dialog appears: "Are you sure you want to distribute prizes?"
- [ ] Click "Yes" or "Confirm"
- [ ] Verify "Distributing..." state briefly appears
- [ ] Verify success message:
  - [ ] "Prizes distributed!"
  - [ ] Shows amounts for 1st, 2nd, 3rd places
  - [ ] Example: "1st: $1,125, 2nd: $675, 3rd: $450"

### Expected Result ✓
- [ ] Prizes calculated correctly based on pool
- [ ] Top 3 winners identified
- [ ] Prize amounts distributed
- [ ] Success confirmation shows

---

## Test 6: Winners Announcement View

### Setup
- [ ] Tournament marked as "completed"
- [ ] Prizes distributed (from Test 5)

### Test Steps
- [ ] Open completed tournament
- [ ] Click "🏆 Winners" tab
- [ ] Verify winners display:
  - [ ] 🥇 1st place with username, medal icon, prize amount
  - [ ] 🥈 2nd place with medal icon, prize amount
  - [ ] 🥉 3rd place with medal icon, prize amount
- [ ] Verify each winner card shows:
  - [ ] Medal icon (gold/silver/bronze)
  - [ ] Rank (#1, #2, #3)
  - [ ] Username in badge
  - [ ] Prize amount in large text
  - [ ] "Accuracy" and "Completion Time" stats (if available)
- [ ] Verify prize breakdown info shows:
  - [ ] 50% of pool → 1st place
  - [ ] 30% of pool → 2nd place
  - [ ] 20% of pool → 3rd place
- [ ] Click "Refresh Results" button
- [ ] Verify data reloads without errors

### Expected Result ✓
- [ ] Winners display correctly
- [ ] Prize amounts accurate
- [ ] Medal decorations show properly
- [ ] All stats visible

---

## Test 7: User Earnings Dashboard

### Setup
- [ ] Logged in as a user who:
  - [ ] Registered for a paid tournament
  - [ ] Has been awarded a prize (top 3 placement)
- [ ] Open that tournament

### Test Steps
- [ ] Click "💰 My Earnings" tab
- [ ] Verify summary cards show:
  - [ ] **Total Earnings**: $X.XX (positive green number)
  - [ ] **Competitions**: X (number of competitions)
  - [ ] **Average Prize**: $X.XX
  - [ ] **Net Balance**: $X.XX (earnings - fees spent)
- [ ] Verify "Competition History" tab shows:
  - [ ] Tournament name
  - [ ] Entry fee paid
  - [ ] Payment status (completed)
  - [ ] Final rank (if applicable)
  - [ ] Prize awarded amount
- [ ] Click "Statistics" tab
- [ ] Verify performance stats:
  - [ ] **Total Earnings** card
  - [ ] **Total Spent** card
  - [ ] **Avg Prize** card
  - [ ] **Best Rank** card
- [ ] Verify insights section with:
  - [ ] Summary of total earnings
  - [ ] Number of competitions participated
  - [ ] Best ranking achieved

### Expected Result ✓
- [ ] All earnings calculated correctly
- [ ] Statistics display accurately
- [ ] User can see detailed history
- [ ] Visual representation clear

---

## Test 8: Error Handling - Network Error

### Setup
- [ ] Stop the backend server

### Test Steps
- [ ] Try "Register to Pay"
- [ ] Click "Pay with PayPal"
- [ ] Verify error message appears:
  - [ ] Red alert box with error details
  - [ ] "Try Again" and "Close" buttons available
- [ ] Click "Try Again"
- [ ] Verify retry attempt
- [ ] Restart backend server
- [ ] Retry registration (should work)

### Expected Result ✓
- [ ] Graceful error handling
- [ ] User informed of issue
- [ ] Retry mechanism works

---

## Test 9: Error Handling - Invalid Amount

### Setup  
- [ ] Ready to test payment with invalid data

### Test Steps
- [ ] Attempt to register with entry fee = 0
- [ ] Verify error prevention or proper handling
- [ ] Try entry fee = very large number
- [ ] Verify proper validation

### Expected Result ✓
- [ ] Invalid amounts rejected with message
- [ ] Validation prevents bad data

---

## Test 10: Refund Processing (Admin)

### Setup
- [ ] Have a completed payment registration
- [ ] Login as admin

### Test Steps
- [ ] Open tournament admin dashboard
- [ ] In Registrations list, find a user with "completed" payment
- [ ] Click "Refund" button on that registration
- [ ] Confirm dialog: "Refund entry fee for [username]?"
- [ ] Click "Yes" or "Confirm"
- [ ] Verify success message:
  - [ ] "Refund processed for [username]"
- [ ] Refresh data
- [ ] Verify payment status changed to "refunded"

### Expected Result ✓
- [ ] Refund processed successfully
- [ ] Payment status updated
- [ ] Admin can process multiple refunds

---

## Test 11: API Response Types

### Setup
- [ ] Monitor browser DevTools Network tab

### Test Steps
- [ ] Register for tournament (free)
- [ ] Open DevTools → Network tab
- [ ] Click "Register to Pay"
- [ ] Watch network requests:
  - [ ] `POST /api/competitions/:id/create-payment-order`
  - [ ] Verify response has: `orderId`, `approvalLink`, `success`
- [ ] After PayPal approval:
  - [ ] `POST /api/competitions/:id/confirm-payment`
  - [ ] Verify response has: `success`, `registration`, `transactionId`
- [ ] Get earnings:
  - [ ] `GET /competitions/user/earnings`
  - [ ] Verify response has proper earnings object
- [ ] Get winners:
  - [ ] `GET /api/competitions/:id/winners`
  - [ ] Verify response has `winners` array

### Expected Result ✓
- [ ] All API responses properly formatted
- [ ] Response contains expected fields
- [ ] No TypeScript errors in data handling

---

## Test 12: Complete User Journey

### Full Flow Test
- [ ] Create account (if new)
- [ ] Browse tournaments
- [ ] Find paid tournament
- [ ] Register with PayPal payment
- [ ] Participate in tournament (complete matches)
- [ ] Win tournament (place in top 3)
- [ ] View winners announcement
- [ ] Check earnings dashboard
- [ ] Verify prize received
- [ ] Try refund (as admin)

### Expected Result ✓
- [ ] Complete end-to-end flow works
- [ ] All features integrated seamlessly
- [ ] User experience is smooth
- [ ] Data consistency maintained

---

## Final Verification Checklist

### Frontend
- [ ] All components render without errors
- [ ] No console errors or warnings
- [ ] Responsive design works on mobile/tablet
- [ ] Payment modal displays properly
- [ ] Admin dashboard accessible to admins only
- [ ] Earnings display for registered users

### Backend
- [ ] All endpoints working (`/api/competitions/*`)
- [ ] Database records created for registrations
- [ ] Payment status tracking accurate
- [ ] Prize distribution calculations correct
- [ ] User earnings calculations accurate

### PayPal Integration
- [ ] Sandbox credentials working
- [ ] Order creation successful
- [ ] Order approval/cancellation handled
- [ ] Payment capture working
- [ ] Redirect back to app successful

### Type Safety
- [ ] Zero TypeScript compilation errors
- [ ] All API responses properly typed
- [ ] Props properly typed in components

---

## Testing Notes

| Test | Status | Notes | Pass/Fail |
|------|--------|-------|-----------|
| Test 1: Free Registration | - | - | ⬜ |
| Test 2: Entry Fee Display | - | - | ⬜ |
| Test 3: PayPal Payment | - | - | ⬜ |
| Test 4: Admin Registrations | - | - | ⬜ |
| Test 5: Prize Distribution | - | - | ⬜ |
| Test 6: Winners Display | - | - | ⬜ |
| Test 7: User Earnings | - | - | ⬜ |
| Test 8: Error Handling | - | - | ⬜ |
| Test 9: Validation | - | - | ⬜ |
| Test 10: Refund | - | - | ⬜ |
| Test 11: API Types | - | - | ⬜ |
| Test 12: Full Journey | - | - | ⬜ |

---

## Support

If you encounter issues:

1. **Check logs**: Browser console and server console
2. **Verify setup**: PayPal credentials, database connection, backend running
3. **Check types**: Ensure API responses match TypeScript interfaces
4. **Test endpoints**: Use Postman to test API directly
5. **Review documentation**: PAYMENT_SYSTEM_GUIDE.md and INTEGRATION_COMPLETE.md

🎉 **Happy Testing!**
