#!/usr/bin/env node

const API_URL = 'http://localhost:5000/api';

async function testRaceRegistration() {
  try {
    console.log('🏁 Testing Race Registration System');
    console.log('============================\n');

    // Test 1: Get active races
    console.log('📋 Test 1: Get Active Races');
    const racesRes = await fetch(`${API_URL}/races`);
    const races = await racesRes.json();
    console.log('Status:', racesRes.status);
    console.log('Response:', JSON.stringify(races, null, 2));
    console.log('\n');

    // Test 2: Try to register for a race (with mock roomId)
    const mockRoomId = races[0]?.roomId || 'mock-room-123';
    console.log('📝 Test 2: Register for Race');
    const registerRes = await fetch(`${API_URL}/races/${mockRoomId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Add user info if needed
    });
    const registerResult = await registerRes.json();
    console.log('Status:', registerRes.status);
    console.log('Response:', JSON.stringify(registerResult, null, 2));
    console.log('\n');

    // Test 3: Get registration status
    console.log('🔎 Test 3: Get Registration Status');
    const statusRes = await fetch(`${API_URL}/races/${mockRoomId}/registration-status`);
    const status = await statusRes.json();
    console.log('Status:', statusRes.status);
    console.log('Response:', JSON.stringify(status, null, 2));
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

testRaceRegistration();
