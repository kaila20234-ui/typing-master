# Ranked Ladder System Implementation

## Overview
The Ranked Ladder System allows players to compete, earn rating points, and progress through tiers (Bronze → Silver → Gold → Platinum → Diamond). This document covers the complete implementation.

## Architecture

### Backend Components

#### 1. **UserRanking Model** (`server/models/UserRanking.js`)
Stores competitive ranking data for each user.

**Key Fields:**
- `ratingPoints` (default: 1000) - Elo-based rating system
- `tier` - Current tier (Bronze, Silver, Gold, Platinum, Diamond)
- `totalRaces` - Lifetime race count
- `racesWon` - Wins count
- `winRate` - Win percentage (0-100)
- `winStreak` - Current win streak
- `maxWinStreak` - Best streak
- `averageWpm` - Average words per minute
- `averageAccuracy` - Average accuracy percentage
- `ratingHistory` - Last 50 race results with rating changes

**Tier System:**
```
Bronze:     0 - 1499    🥉
Silver:     1500 - 2499 ⚪
Gold:       2500 - 3499 🥇
Platinum:   3500 - 4999 💎
Diamond:    5000+       👑
```

#### 2. **Ranking Utility Functions** (`server/lib/rankingSystem.js`)

**Key Functions:**

```javascript
// Calculate rating change using Elo algorithm
calculateRatingChange(winnerRating, loserRating, isWin)

// Update user ranking after race completion
updateUserRanking(userId, raceResult)

// Get tier information
getTierInfo(tier)

// Get all tiers data
getAllTiers()

// Reset seasonal ratings (monthly)
resetSeasonalRatings()
```

**Rating Calculation (Elo Algorithm):**
- K-factor: 32 (controls volatility)
- Expected score formula: 1 / (1 + 10^((opponent - player) / 400))
- Win: +expected_score × 32
- Loss: -expected_score × 32

#### 3. **Leaderboard Routes** (`server/routes/leaderboard.js`)

**Endpoints:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/global` | GET | - | Global leaderboard (top 100) |
| `/tier/:tier` | GET | - | Tier-specific leaderboard |
| `/me` | GET | ✓ | User's detailed ranking stats |
| `/rank/:userId` | GET | - | User's rank and position |
| `/user-rank/:userId` | GET | - | User rank with nearby players (±5) |

**Response Format:**
```json
{
  "leaderboard": [
    {
      "_id": "...",
      "userId": {
        "_id": "...",
        "username": "player123",
        "userId": "USER_ABC123",
        "profilePicture": "..."
      },
      "ratingPoints": 2500,
      "tier": "Gold",
      "rank": 1,
      "totalRaces": 50,
      "racesWon": 35,
      "winRate": 70,
      "averageWpm": 85,
      "averageAccuracy": 97
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 2
}
```

### Frontend Components

#### 1. **Leaderboard Component** (`src/components/Leaderboard.tsx`)
Main leaderboard display with global and tier-specific views.

**Features:**
- Global leaderboard view
- Tier-filtered leaderboards (Diamond, Platinum, Gold, Silver, Bronze)
- User's current ranking display (when logged in)
- Pagination support
- Personal stats: rating, wins, win rate, average WPM
- Medal indicators for top 3 players

**Props:**
```typescript
interface LeaderboardProps {
  userId?: string  // User's ID for logged-in users
}
```

#### 2. **TierBadge Component** (`src/components/TierBadge.tsx`)
Visual tier indicator with icon and optional label.

**Features:**
- Tier-specific colors and icons
- Configurable sizes (sm, md, lg)
- Optional label display
- TierProgress sub-component for rating progression

**Props:**
```typescript
interface TierBadgeProps {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}
```

#### 3. **Race Result Handler** (`src/lib/raceResultHandler.ts`)
Submits race results and triggers ranking updates.

**Key Functions:**
```typescript
submitRaceResult(raceResult): Promise
getRaceResults(roomId): Promise
getUserStats(userId): Promise
```

### API Client Integration

New endpoints in `src/lib/api.ts`:

```typescript
getGlobalLeaderboard(page: number, limit: number): Promise
getTierLeaderboard(tier: string, limit: number): Promise
getUserRank(userId: string): Promise
getMyRanking(): Promise
getUserRankWithNearby(userId: string): Promise
```

## Data Flow

### Race Completion Flow

```
1. Race finishes
   ↓
2. Frontend calls submitRaceResult()
   ↓
3. Backend receives POST /api/races/{roomId}/finish
   ↓
4. Backend calls updateUserRanking() for each player
   ↓
5. Rating updated based on Elo calculation
   ↓
6. Tier updated if rating crosses threshold
   ↓
7. Stats updated (races, wins, WPM, accuracy)
   ↓
8. Response sent to frontend
   ↓
9. Frontend can fetch updated ranking via getMyRanking()
```

## Key Formulas

### Win Rate Calculation
```
winRate = (racesWon / totalRaces) × 100
```

### Average Statistics
```
averageWpm = sum(all_race_wpms) / totalRaces
averageAccuracy = sum(all_race_accuracies) / totalRaces
```

### Elo Rating Change
```
K = 32 (volatility factor)
Expected = 1 / (1 + 10^((opponent - player) / 400))

If Win: ratingChange = K × (1 - Expected)
If Loss: ratingChange = K × (0 - Expected)
```

## UI Integration

### Competition Page Layout

```
┌─────────────────────────────────┐
│ Multiplayer Competitions [Home] │
├─────────────────────────────────┤
│                                 │
│ Create or Join a Race           │
│ ┌─────────────────────────────┐ │
│ │ RaceHub Component           │ │
│ └─────────────────────────────┘ │
│                                 │
│ Ranked Leaderboard              │
│ ┌─────────────────────────────┐ │
│ │ Your Current Ranking        │ │
│ │ • Rank #5                   │ │
│ │ • Tier: Gold                │ │
│ │ • Rating: 2845 points       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Global] [💎] [💎] [🥇] [⚪]│ │
│ │ Global Leaderboard Tabs     │ │
│ │ 1. 🥇 User123  2845 pts     │ │
│ │ 2. 🥈 User456  2790 pts     │ │
│ │ 3. 🥉 User789  2750 pts     │ │
│ │ ...                         │ │
│ └─────────────────────────────┘ │
│                                 │
│ Tier Requirements              │ │
│ 🥉 Bronze | ⚪ Silver | 🥇 Gold │ │
│ 💎 Platinum | 👑 Diamond       │ │
└─────────────────────────────────┘
```

## Testing Checklist

- [ ] User registration generates unique userId
- [ ] Race creation stores userCode for participants
- [ ] Race completion triggers ranking update
- [ ] Rating points calculated correctly (Elo)
- [ ] Tier updates when rating crosses threshold
- [ ] Win rate calculation is accurate
- [ ] Global leaderboard displays top 100 players
- [ ] Tier leaderboards filter by tier correctly
- [ ] User's personal ranking displays (My Ranking)
- [ ] Nearby players displayed correctly in user-rank endpoint
- [ ] Pagination works on leaderboard
- [ ] Profile shows user's tier badge
- [ ] Competition page shows leaderboard when logged in
- [ ] Mobile responsive layout

## Future Enhancements

1. **Seasonal Leagues** - Monthly rating resets with new seasons
2. **Achievements** - Badges for milestones (100 races, 10 winning streak, etc.)
3. **Match History** - Detailed record of past races with opponents
4. **Tier Promotions** - Visual celebration when advancing tiers
5. **Rating Decay** - Reduce rating for inactive players
6. **Head-to-Head Stats** - Historical matchup data with specific opponents
7. **Placement Matches** - Provisional ranking for new players
8. **Performance Trends** - Charts showing rating over time

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Rating not updating | Check race result submission via POST endpoint |
| Wrong tier displayed | Verify tier threshold in UserRanking.js |
| Leaderboard not loading | Check API endpoints and CORS configuration |
| User rank showing 0 | Ensure userId is stored correctly in User model |
| WPM not averaging correctly | Verify race result data is passed to updateUserRanking |

## Development Notes

- Rating system uses Elo algorithm (K-factor: 32) similar to chess ratings
- Tiers are determined solely by rating points
- Win streaks reset on loss (important for tracking momentum)
- Rating history limited to last 50 races to manage database size
- All leaderboard endpoints paginated for performance
- Consider adding rate limiting to leaderboard endpoints for high-traffic periods
