#!/usr/bin/env node
/**
 * Squad Rating System Test Suite
 * Tests the ELO-based squad rating calculation
 * 
 * Run with: node server/test-squad-rating.mjs
 */

// Mock squad objects for testing
class MockSquad {
  constructor(name, initialRating = 1000) {
    this.name = name;
    this.squadRating = initialRating;
    this.tier = this.getTierFromRating(initialRating);
  }

  getTierFromRating(rating) {
    if (rating >= 2400) return 'Mythic';
    else if (rating >= 2000) return 'Diamond';
    else if (rating >= 1600) return 'Platinum';
    else if (rating >= 1200) return 'Gold';
    else if (rating >= 800) return 'Silver';
    else return 'Bronze';
  }
}

// ELO calculation function (mimics squadUtils.js)
function updateSquadRating(winner, loser, winnerWon) {
  const K_FACTOR = 32;
  const RATING_DIFF = winner.squadRating - loser.squadRating;
  const EXPECTED_WIN_CHANCE = 1 / (1 + Math.pow(10, -RATING_DIFF / 400));

  const oldWinnerRating = winner.squadRating;
  const oldLoserRating = loser.squadRating;

  let winnerRatingChange = 0;
  let loserRatingChange = 0;

  if (winnerWon) {
    winnerRatingChange = K_FACTOR * (1 - EXPECTED_WIN_CHANCE);
    loserRatingChange = K_FACTOR * (0 - (1 - EXPECTED_WIN_CHANCE));
    winner.squadRating += winnerRatingChange;
    loser.squadRating += loserRatingChange;
  } else {
    winnerRatingChange = K_FACTOR * (0 - EXPECTED_WIN_CHANCE);
    loserRatingChange = K_FACTOR * (1 - (1 - EXPECTED_WIN_CHANCE));
    winner.squadRating += winnerRatingChange;
    loser.squadRating += loserRatingChange;
  }

  winner.squadRating = Math.max(0, winner.squadRating);
  loser.squadRating = Math.max(0, loser.squadRating);

  winner.squadRating = Math.round(winner.squadRating * 100) / 100;
  loser.squadRating = Math.round(loser.squadRating * 100) / 100;

  const oldWinnerTier = winner.tier;
  const oldLoserTier = loser.tier;
  winner.tier = winner.getTierFromRating(winner.squadRating);
  loser.tier = loser.getTierFromRating(loser.squadRating);

  return {
    winner: {
      name: winner.name,
      oldRating: oldWinnerRating,
      newRating: winner.squadRating,
      change: winnerRatingChange,
      oldTier: oldWinnerTier,
      newTier: winner.tier,
    },
    loser: {
      name: loser.name,
      oldRating: oldLoserRating,
      newRating: loser.squadRating,
      change: loserRatingChange,
      oldTier: oldLoserTier,
      newTier: loser.tier,
    },
  };
}

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
}

function assertClose(actual, expected, tolerance = 0.01, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`❌ VALUE MISMATCH: Expected ${expected}, got ${actual}. ${message}`);
  }
}

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✅ ${testName}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${testName}`);
    console.log(`   ${error.message}`);
    testsFailed++;
  }
  console.log('');
}

// ============================================
// TEST CASES
// ============================================

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     SQUAD RATING SYSTEM - TEST SUITE                  ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// TEST 1: Equal rating squads
runTest('Test 1: Equal Rating Squads (Both 1000)', () => {
  const squad1 = new MockSquad('Squad A', 1000);
  const squad2 = new MockSquad('Squad B', 1000);

  const result = updateSquadRating(squad1, squad2, true);

  // With equal ratings, expected win chance is 0.5
  // Winner gains: 32 * (1 - 0.5) = 16
  // Loser loses: 32 * (-(1 - 0.5)) = -16
  assertClose(result.winner.change, 16, 0.01, 'Winner should gain ~16 points');
  assertClose(result.loser.change, -16, 0.01, 'Loser should lose ~16 points');
  assertClose(squad1.squadRating, 1016, 0.01, 'Squad A should be at 1016');
  assertClose(squad2.squadRating, 984, 0.01, 'Squad B should be at 984');
});

// TEST 2: Higher rated squad beats lower rated squad
runTest('Test 2: Strong Squad Beats Weak Squad', () => {
  const strongSquad = new MockSquad('Strong Squad', 1500);
  const weakSquad = new MockSquad('Weak Squad', 1000);

  const result = updateSquadRating(strongSquad, weakSquad, true);

  // Strong should gain less, weak should lose less
  assert(result.winner.change < 16, 'Strong squad should gain less than 16 points');
  assert(Math.abs(result.loser.change) < 16, 'Weak squad should lose less than 16 points');
  console.log(`   Strong Squad: ${result.winner.oldRating} → ${result.winner.newRating} (${result.winner.change.toFixed(2)})`);
  console.log(`   Weak Squad: ${result.loser.oldRating} → ${result.loser.newRating} (${result.loser.change.toFixed(2)})`);
});

// TEST 3: Upset scenario - lower rated beats higher rated
runTest('Test 3: Upset Scenario - Weak Beats Strong', () => {
  const weakSquad = new MockSquad('Weak Squad', 1000);
  const strongSquad = new MockSquad('Strong Squad', 1500);

  // In this case, strongSquad is recorded as "winner" but loses (winnerWon = false = upset)
  const result = updateSquadRating(strongSquad, weakSquad, false); // strongSquad loses to weak

  // Weak squad should gain significant points due to upset, strong should lose significant points
  assert(result.loser.change > 20, 'Weak squad achieving upset should gain >20 points');
  assert(result.winner.change < -20, 'Strong squad losing upset should lose <-20 points');
  console.log(`   Weak Squad: ${result.loser.oldRating} → ${result.loser.newRating} (${result.loser.change.toFixed(2)})`);
  console.log(`   Strong Squad: ${result.winner.oldRating} → ${result.winner.newRating} (${result.winner.change.toFixed(2)})`);
});

// TEST 4: Rating bounds - negative prevention
runTest('Test 4: Rating Bounds - No Negative Ratings', () => {
  const squad1 = new MockSquad('Squad A', 50);
  const squad2 = new MockSquad('Squad B', 2000);

  updateSquadRating(squad1, squad2, false); // Very weak squad upsets very strong

  assert(squad1.squadRating >= 0, 'Rating should never go below 0');
  assert(squad2.squadRating >= 0, 'Rating should never go below 0');
  console.log(`   Squad A: ${squad1.squadRating} (should be >= 0)`);
  console.log(`   Squad B: ${squad2.squadRating} (should be >= 0)`);
});

// TEST 5: Tier transitions
runTest('Test 5: Tier Transitions at Boundaries', () => {
  const squad = new MockSquad('Tier Test Squad', 1180);
  assert(squad.tier === 'Silver', 'Squad at 1180 should be Silver');

  // Simulate wins to reach 1200 (Gold boundary)
  while (squad.squadRating < 1200) {
    const opponent = new MockSquad('Opponent', 1000);
    updateSquadRating(squad, opponent, true);
  }

  assert(squad.tier === 'Gold', `Squad should be Gold tier now (${squad.squadRating})`);
  console.log(`   Squad tier transitioned to: ${squad.tier} at rating ${squad.squadRating.toFixed(2)}`);
});

// TEST 6: All tier boundaries
runTest('Test 6: Verify All Tier Thresholds', () => {
  const tierTests = [
    { rating: 100, expectedTier: 'Bronze' },
    { rating: 800, expectedTier: 'Silver' },
    { rating: 1200, expectedTier: 'Gold' },
    { rating: 1600, expectedTier: 'Platinum' },
    { rating: 2000, expectedTier: 'Diamond' },
    { rating: 2400, expectedTier: 'Mythic' },
  ];

  tierTests.forEach(({ rating, expectedTier }) => {
    const squad = new MockSquad('Tier Test', rating);
    assert(squad.tier === expectedTier, `Rating ${rating} should be ${expectedTier} (got ${squad.tier})`);
  });
  console.log(`   All 6 tier boundaries verified ✓`);
});

// TEST 7: Rating stability over multiple matches
runTest('Test 7: Rating Stability - 10 Equal Matches', () => {
  const squadA = new MockSquad('Squad A', 1200);
  const squadB = new MockSquad('Squad B', 1200);
  const startRatingA = squadA.squadRating;
  const startRatingB = squadB.squadRating;

  // Both squads win alternately
  for (let i = 0; i < 10; i++) {
    const winner = i % 2 === 0 ? squadA : squadB;
    const loser = i % 2 === 0 ? squadB : squadA;
    updateSquadRating(winner, loser, true);
  }

  // After equal wins/losses against equal opponent, ratings should be roughly stable
  // Allow larger tolerance due to rounding on each calculation
  assertClose(squadA.squadRating, startRatingA, 10, 'Squad A rating should be stable within tolerance');
  assertClose(squadB.squadRating, startRatingB, 10, 'Squad B rating should be stable within tolerance');
  console.log(`   Squad A: ${startRatingA} → ${squadA.squadRating.toFixed(2)}`);
  console.log(`   Squad B: ${startRatingB} → ${squadB.squadRating.toFixed(2)}`);
});

// TEST 8: K-factor consistency (32 points max gain)
runTest('Test 8: K-Factor Consistency (Max 32 points)', () => {
  const squad1 = new MockSquad('Squad 1', 1000);
  const squad2 = new MockSquad('Squad 2', 1000);

  const result = updateSquadRating(squad1, squad2, true);

  // Max point swing at K=32 is 32 (when upset)
  assert(Math.abs(result.winner.change) <= 32, 'Rating change should not exceed K-factor (32)');
  assert(Math.abs(result.loser.change) <= 32, 'Rating change should not exceed K-factor (32)');
  console.log(`   Winner change: ${result.winner.change.toFixed(2)} (max 32)`);
  console.log(`   Loser change: ${result.loser.change.toFixed(2)} (max 32)`);
});

// TEST 9: Rating sum conservation (approximately)
runTest('Test 9: Total Rating Points Distributed Correctly', () => {
  const squad1 = new MockSquad('Squad 1', 1500);
  const squad2 = new MockSquad('Squad 2', 1000);

  const totalBefore = squad1.squadRating + squad2.squadRating;
  updateSquadRating(squad1, squad2, true);
  const totalAfter = squad1.squadRating + squad2.squadRating;

  // Due to K-factor redistribution, total should be approximately equal (within rounding)
  assertClose(totalAfter, totalBefore, 0.5, 'Total rating points should be approximately conserved');
  console.log(`   Total before: ${totalBefore}`);
  console.log(`   Total after: ${totalAfter.toFixed(2)}`);
});

// TEST 10: Realistic scenario - tournament progression
runTest('Test 10: Realistic Tournament Progression', () => {
  const newSquad = new MockSquad('New Squad', 1000);
  const experiencedSquad = new MockSquad('Experienced Squad', 1800);

  console.log(`   Initial: ${newSquad.name} (${newSquad.squadRating} ${newSquad.tier}) vs ${experiencedSquad.name} (${experiencedSquad.squadRating} ${experiencedSquad.tier})`);

  // New squad loses first match
  updateSquadRating(experiencedSquad, newSquad, true);
  console.log(`   After loss: ${newSquad.name} now ${newSquad.squadRating} ${newSquad.tier}`);

  // New squad wins upset
  updateSquadRating(newSquad, experiencedSquad, true);
  console.log(`   After upset win: ${newSquad.name} now ${newSquad.squadRating} ${newSquad.tier}`);

  assert(newSquad.squadRating > 1000, 'New squad should gain rating from upset');
});

// ============================================
// RESULTS
// ============================================

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log(`║  TOTAL: ${testsPassed + testsFailed} Tests | PASSED: ${testsPassed} | FAILED: ${testsFailed}${' '.repeat(testsFailed === 0 ? 20 : 18)}║`);
if (testsFailed === 0) {
  console.log('║  ✅ ALL TESTS PASSED - Rating system is working correctly!║');
} else {
  console.log('║  ❌ Some tests failed - review the output above         ║');
}
console.log('╚════════════════════════════════════════════════════════╝\n');

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
