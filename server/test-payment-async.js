const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTZiODA3NWFlNWEzYmFiNzY2NjkxZTciLCJpYXQiOjE3ODU0MzAxMzMsImV4cCI6MTc4NjAzNDkzM30.Su-10poacaGLLZwywXm4BC0CvJ38K4kdH5B_DoNSN_Q';
const COMPETITION_ID = '69aef6111761b1a1b8843d4c';

async function testPayment() {
  try {
    console.log('Testing backend payment endpoint...');

    const response = await fetch(`http://localhost:5000/api/competitions/${COMPETITION_ID}/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ entryFee: 5 }),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPayment();
