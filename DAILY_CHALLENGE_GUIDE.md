# Daily Speed Challenge Implementation Guide

## Overview
The Daily Speed Challenge is a time-limited typing competition that resets every 24 hours at midnight. Players compete on the same challenge text daily, earning rating points and rank-based rewards for top placements.

## Architecture

### Backend Components

#### 1. **DailyChallenge Model** (`server/models/DailyChallenge.js`)
Stores challenge data and submissions.

**Key Fields:**
- `date` - Challenge date (unique per day)
- `title` - Challenge name (e.g., "Speed Demon", "Accuracy Master")
- `description` - Challenge flavor text
- `challengeText` - Text that users must type
- `challengeMode` - 'passage' or 'random'
- `difficulty` - 'beginner' | 'intermediate' | 'advanced'
- `targetWpm` - Goal WPM for scoring
- `submissions[]` - Array of player attempts
- `startTime` / `endTime` - Challenge time window
- `isActive` - Whether challenge is live

**Submission Structure:**
```javascript
{
  userId,           // Reference to User document
  username,         // Username snapshot
  userCode,         // USER_XXXXX format
  wpm,              // Words per minute
  accuracy,         // Accuracy percentage
  timeSpent,        // Duration in ms
  score,            // Calculated score
  rank,             // Leaderboard position
  completedAt,      // Submission timestamp
  reward: {
    ratingPoints,   // Rating reward (top 10 only)
    bonus           // Bonus points
  }
}
```

**Scoring Formula:**
```
Score = (WPM / targetWPM) × 50 + Accuracy
- Max 50 points for WPM
- Max 50 points for accuracy (0-100%)
- Total range: 0-100 points
```

**Reward Structure (Top 10):**
```
1st:  500 rating points + 100 bonus
2nd:  400 rating points + 90 bonus
3rd:  350 rating points + 80 bonus
4th:  300 rating points + 70 bonus
5th:  250 rating points + 60 bonus
6th:  200 rating points + 50 bonus
7th:  150 rating points + 40 bonus
8th:  100 rating points + 30 bonus
9th:  50 rating points + 20 bonus
10th: 25 rating points + 10 bonus
```

#### 2. **Daily Challenge Utilities** (`server/lib/dailyChallengeUtils.js`)

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `getTodaysChallenge()` | Get or create today's challenge |
| `submitDailyChallengeAttempt()` | Record submission and update ranking |
| `getDailyChallengeLeaderboard()` | Get top submissions |
| `getUserDailyPerformance()` | Get user's current submission |
| `getPastChallenges()` | Get historical challenges |
| `getUserPastChallengeRankings()` | Get user's past performance |
| `initializeTomorrowsChallenge()` | Create next day's challenge |

#### 3. **Daily Challenge Routes** (`server/routes/dailyChallenge.js`)

**Endpoints:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/` | GET | - | Get today's challenge |
| `/leaderboard` | GET | - | Top 100 submissions |
| `/me` | GET | ✓ | User's submission |
| `/submit` | POST | ✓ | Submit new attempt |
| `/past` | GET | - | Past 7 days |
| `/history` | GET | ✓ | User's past rankings |
| `/:challengeId/leaderboard` | GET | - | Specific challenge leaderboard |

**Response Format:**
```json
{
  "leaderboard": [
    {
      "userId": {...},
      "username": "player123",
      "userCode": "USER_ABC123",
      "wpm": 95,
      "accuracy": 98,
      "score": 98,
      "rank": 1,
      "reward": {
        "ratingPoints": 500,
        "bonus": 100
      }
    }
  ],
  "totalSubmissions": 145,
  "challenge": {...}
}
```

### Frontend Components

#### 1. **DailyChallenge Component** (`src/components/DailyChallenge.tsx`)
Main challenge interface with typing test and leaderboard.

**Features:**
- Challenge header with difficulty and stats
- Countdown timer to reset
- Typing test area with real-time accuracy highlighting
- Leaderboard display
- Personal performance display (if submitted)
- Reward notification for top 10

**Props:**
```typescript
interface DailyChallengeProps {
  userId?: string
  onBack?: () => void
}
```

#### 2. **TestArea Component** (`src/components/TestArea.tsx`)
Self-contained typing test interface.

**Features:**
- Character-by-character accuracy highlighting
- Real-time WPM calculation
- Progress bar
- Time tracking
- Early finish option

**Return State:**
```typescript
{
  wpm: number           // Words per minute
  accuracy: number      // Percentage (0-100)
  duration: number      // Total time in ms
  correctChars: number  // Total correct characters
  incorrectChars: number // Total incorrect characters
}
```

### API Client Integration

**New Endpoints in `src/lib/api.ts`:**

```typescript
getTodaysChallenge(): Promise
getDailyChallengeLeaderboard(limit: number): Promise
getUserDailyPerformance(): Promise
submitDailyChallenge(wpm, accuracy, timeSpent): Promise
getPastChallenges(days: number): Promise
getUserChallengeHistory(days: number): Promise
getChallengeLeaderboard(challengeId: string): Promise
```

## Data Flow

### Daily Challenge Submission

```
1. User completes typing test
   ↓
2. Frontend calls submitDailyChallenge()
   ↓
3. Backend receives POST /api/daily-challenge/submit
   ↓
4. Validation: Check if user already submitted (update if better)
   ↓
5. Calculate score: (WPM / targetWPM) × 50 + Accuracy
   ↓
6. Determine rank and reward points (if top 10)
   ↓
7. Update UserRanking with reward points (if applicable)
   ↓
8. Save submission to DailyChallenge.submissions[]
   ↓
9. Return: { score, rank, reward, message }
   ↓
10. Frontend displays results and leaderboard updates
```

### Challenge Creation

Automatically runs at midnight to create next day's challenge:
1. Random challenge type selected from predefined list
2. Random words generated based on difficulty
3. Challenge stored in database
4. Available immediately on client

## UI Integration

### Competition Page Layout

```
Competitions
├── Multiplayer Tab
│   ├── Create or Join a Race
│   └── Ranked Leaderboard
└── Daily Challenge Tab
    ├── Challenge Header
    │   ├── Title & Description
    │   ├── Difficulty Badge
    │   ├── Time Remaining (hrs/mins)
    │   ├── Target WPM
    │   ├── Total Submissions
    │   └── Challenge Mode
    ├── Your Performance (if submitted)
    │   ├── Your Rank (#)
    │   ├── Your WPM
    │   ├── Your Accuracy
    │   └── Reward Points
    └── Content Areas
        ├── Today's Challenge Tab
        │   ├── Challenge Text Display
        │   ├── Typing Test Area
        │   │   ├── Input field
        │   │   ├── Real-time highlighting
        │   │   ├── Progress bar
        │   │   └── WPM/Time display
        │   └── Results & Submit
        └── Leaderboard Tab
            ├── Top 100 submissions
            └── Player stats (WPM, Accuracy, Score)
```

## Scoring System

### Score Calculation

The scoring system rewards both speed and accuracy:

```typescript
baseWpmScore = (actualWPM / targetWPM) × 50
accuracyScore = accuracy  // 0-100

totalScore = baseWpmScore + accuracyScore
```

**Examples:**
- 80 WPM (target 80), 100% accuracy: (80/80)×50 + 100 = 150 (capped at 100)
- 100 WPM (target 80), 95% accuracy: (100/80)×50 + 95 = 156 (capped at 100)
- 50 WPM (target 80), 100% accuracy: (50/80)×50 + 100 = 131 (capped at 100)

**Final Score Range:** 0-100 points

### Rating Point Rewards

Only top 10 placements earn rating points:
- Calculated per day's challenge
- Added to user's overall ranking points
- Can affect tier progression
- Bonus points for exceptional placements (1st gets 100 bonus)

## Database Queries

### Get Today's Challenge
```javascript
DailyChallenge.findOne({
  startTime: { $gte: startOfDay, $lt: endOfDay }
})
```

### Get User's Daily Submission
```javascript
challenge.submissions.find(s => s.userId === userId)
```

### Get Daily Leaderboard
```javascript
challenge.submissions
  .sort((a, b) => b.score - a.score)
  .slice(0, 100)
```

### Get User's Past Challenge Rankings
```javascript
DailyChallenge.find({
  date: { $lt: today }
})
.sort({ date: -1 })
.limit(7)
```

## Testing Checklist

- [ ] Daily challenge loads without errors
- [ ] Challenge text displays correctly
- [ ] Typing test tracks WPM and accuracy
- [ ] Character highlighting works (correct/incorrect)
- [ ] Progress bar updates real-time
- [ ] Finish early button works
- [ ] Score calculated correctly
- [ ] Submission saves to database
- [ ] Leaderboard displays top 100
- [ ] User's submission shows in leaderboard
- [ ] Top 10 get reward points
- [ ] Rating points applied to user ranking
- [ ] Time remaining countdown works
- [ ] Challenge resets at midnight
- [ ] Past challenges accessible
- [ ] User history shows rankings

## Development Notes

### Challenge Generation Strategy

```javascript
const challengeTitles = [
  { title: 'Speed Demon', difficulty: 'advanced', target: 100 },
  { title: 'Accuracy Master', difficulty: 'intermediate', target: 70 },
  { title: 'Consistent Typer', difficulty: 'beginner', target: 60 },
  { title: 'Word Warrior', difficulty: 'intermediate', target: 80 }
]
```

**Selection:** Random selection ensures variety daily

### Performance Optimization

- Challenge data cached on initialization
- Leaderboard limited to top 100 for query performance
- Submission list indexed by userId for quick lookups
- Consider database indexing for `DailyChallenge.date` and `submissions.userId`

### Future Enhancements

1. **Weekly Challenges** - Longer format with different rules
2. **Challenge Streaks** - Bonuses for consecutive day participation
3. **Seasonal Themes** - Themed challenges with special text
4. **Challenge Difficulty Selection** - Let players choose difficulty level
5. **Persistence Rewards** - Bonuses for completing N days in a row
6. **Social Sharing** - Share daily scores on profiles
7. **Challenge Analytics** - Charts showing improvement over time
8. **Multiplayer Daily Races** - Real-time daily race mode
9. **Achievement Badges** - Unlock badges for challenge milestones
10. **Seasonal Leaderboards** - Monthly and yearly tracking

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Challenge not loading | Check DailyChallenge.getTodaysChallenge() |
| Score not calculating | Verify formula in calculateScore() |
| Reward not applying | Ensure user is in top 10, check UserRanking update |
| Leaderboard not updating | Refresh browser or call getDailyChallengeLeaderboard() |
| WPM inaccurate | Check word length counted (5 chars = 1 word) |
| Accuracy always 100% | Verify character comparison logic in TestArea |

## API Response Examples

### Get Today's Challenge
```json
{
  "_id": "...",
  "date": "2026-02-27T00:00:00Z",
  "title": "Speed Demon",
  "description": "Push your typing speed to the limit!",
  "challengeText": "the quick brown fox jumps over the lazy dog...",
  "difficulty": "advanced",
  "targetWpm": 100,
  "totalSubmissions": 45,
  "endTime": "2026-02-28T00:00:00Z"
}
```

### Submit Challenge
```json
{
  "success": true,
  "score": 92,
  "rank": 5,
  "reward": {
    "ratingPoints": 250,
    "bonus": 60
  },
  "message": "Congratulations! You're ranked #5!"
}
```

### User Performance
```json
{
  "hasSubmitted": true,
  "submission": {
    "wpm": 95,
    "accuracy": 96,
    "score": 92,
    "rank": 5,
    "reward": {
      "ratingPoints": 250,
      "bonus": 60
    }
  },
  "challenge": {
    "_id": "...",
    "title": "Speed Demon",
    "totalSubmissions": 45
  }
}
```
