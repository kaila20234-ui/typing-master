export interface DailyChallenge {
  _id: string;
  date: string;
  title: string;
  description: string;
  challengeText: string;
  challengeMode: 'passage' | 'random';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetWpm: number;
  startTime: string;
  endTime: string;
  totalSubmissions: number;
}

export interface DailyChallengeSubmission {
  userId: string;
  username: string;
  userCode: string;
  wpm: number;
  accuracy: number;
  timeSpent: number;
  score: number;
  rank: number;
  completedAt: string;
  reward: {
    ratingPoints: number;
    bonus: number;
  };
}

export interface DailyChallengeLeaderboard {
  challenge: {
    _id: string;
    date: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    targetWpm: number;
  };
  leaderboard: DailyChallengeSubmission[];
  totalSubmissions: number;
  endTime: string;
}

export interface UserDailyPerformance {
  hasSubmitted: boolean;
  submission?: {
    wpm: number;
    accuracy: number;
    score: number;
    rank: number;
    completedAt: string;
    reward: {
      ratingPoints: number;
      bonus: number;
    };
  };
  challenge: {
    _id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    endTime: string;
    totalSubmissions?: number;
  };
}

export interface DailyChallengeSubmitResult {
  success: boolean;
  score: number;
  rank?: number;
  reward?: {
    ratingPoints: number;
    bonus: number;
  };
  message: string;
}

export interface PastChallenge {
  date: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalSubmissions: number;
}

export interface UserChallengeRanking {
  date: string;
  title: string;
  wpm: number;
  accuracy: number;
  score: number;
  rank: number;
  reward: {
    ratingPoints: number;
    bonus: number;
  };
}
