#!/usr/bin/env node

const API_URL = 'http://localhost:5000/api';

async function testTournaments() {
  try {
    console.log('🏁 Testing Tournament System');
    console.log('============================\n');

    // Test 1: Get available tournaments
    console.log('📋 Test 1: Get Available Tournaments');
    const tournamentRes = await fetch(`${API_URL}/tournaments`);
    const tournaments = await tournamentRes.json();
    console.log('Status:', tournamentRes.status);
    console.log('Response:', JSON.stringify(tournaments, null, 2));
    console.log('\n');

    // Test 2: Try to get tournament details (with mock ID)
    console.log('🏆 Test 2: Get Tournament Details (with mock ID)');
    const mockTournamentRes = await fetch(`${API_URL}/tournaments/test-id-123`);
    const mockTournament = await mockTournamentRes.json();
    console.log('Status:', mockTournamentRes.status);
    console.log('Response:', JSON.stringify(mockTournament, null, 2));
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

testTournaments();
