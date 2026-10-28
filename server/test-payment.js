const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTZiODA3NWFlNWEzYmFiNzY2NjkxZTciLCJpYXQiOjE3ODU0MzAxMzMsImV4cCI6MTc4NjAzNDkzM30.Su-10poacaGLLZwywXm4BC0CvJ38K4kdH5B_DoNSN_Q';
const COMPETITION_ID = '669f8075ae5a3bab766691e7'; // Dummy ID for testing

console.log('🧪 Testing Payment Endpoint...\n');

// Test 1: Health Check
console.log('Test 1: Health Check');
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Health:', JSON.stringify(data, null, 2));
  })
  .catch(err => console.error('❌ Error:', err.message));

// Test 2: Maintenance Settings
console.log('\nTest 2: Maintenance Settings');
fetch('http://localhost:5000/api/admin/public-settings/maintenance')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Maintenance Settings:', JSON.stringify(data, null, 2));
  })
  .catch(err => console.error('❌ Error:', err.message));

// Test 3: Payment Order Creation
console.log('\nTest 3: Payment Order Creation');
setTimeout(() => {
  fetch('http://localhost:5000/api/competitions/' + COMPETITION_ID + '/create-payment-order', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entryFee: 5000, // 50 NGN
    }),
  })
    .then(res => res.json())
    .then(data => {
      console.log('✅ Payment Order Response:', JSON.stringify(data, null, 2));
      if (data.approvalLink) {
        console.log('\n🔗 Paystack Payment Link:', data.approvalLink);
      }
    })
    .catch(err => console.error('❌ Error:', err.message));
}, 1000);
