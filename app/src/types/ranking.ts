export interface UserRanking {
  _id?: string;
  userId: {
    _id: string;
    username: string;
    userId: string;
    profilePicture?: string;
  };
  ratingPoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  rank?: number;
  tierRank?: number;
  totalRaces: number;
  racesWon: number;
  winRate: number;
  winStreak: number;
  maxWinStreak: number;
  averageWpm: number;
  averageAccuracy: number;
  lastRaceDate?: string;
  seasonReset?: string;
  ratingHistory?: Array<{
    date: string;
    ratingChange: number;
    result: 'win' | 'loss';
  }>;
}

export interface LeaderboardData {
  leaderboard: UserRanking[];
  total: number;
  page: number;
  pages: number;
}

export interface TierInfo {
  tier: string;
  currentMinRating: number;
  nextTier?: string;
  nextTierMinRating?: number;
  tierNumber: number;
  totalTiers: number;
}
