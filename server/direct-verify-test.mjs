const url = 'http://localhost:5000/api/competitions/69aef6111761b1a1b8843d4c/verify-payment';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTZiODA3NWFlNWEzYmFiNzY2NjkxZTciLCJpYXQiOjE3ODU0MzAxMzMsImV4cCI6MTc4NjAzNDkzM30.Su-10poacaGLLZwywXm4BC0CvJ38K4kdH5B_DoNSN_Q';

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reference: 'testref' }),
  });
  console.log('status', res.status);
  const text = await res.text();
  console.log('body', text);
} catch (error) {
  console.error('error', error);
}
