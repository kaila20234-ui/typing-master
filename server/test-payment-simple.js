// Simple payment test
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTZiODA3NWFlNWEzYmFiNzY2NjkxZTciLCJpYXQiOjE3ODU0MzAxMzMsImV4cCI6MTc4NjAzNDkzM30.Su-10poacaGLLZwywXm4BC0CvJ38K4kdH5B_DoNSN_Q';
const COMPETITION_ID = '69aef6111761b1a1b8843d4c';

console.log('Testing payment endpoint with real competition ID...\n');

fetch('http://localhost:5000/api/competitions/' + COMPETITION_ID + '/create-payment-order', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + TOKEN,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    entryFee: 5000,
  }),
})
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
  })
  .catch(err => console.error('Error:', err.message));
