export interface TournamentParticipant {
  userId: string;
  username: string;
  userCode: string;
  rating: number;
  joinedAt: string;
  status: 'registered' | 'active' | 'eliminated' | 'winner';
  seed: number;
}

export interface BracketMatch {
  round: number;
  matchNumber: number;
  participant1: {
    userId: string;
    username: string;
    userCode: string;
    wpm?: number;
    accuracy?: number;
    score?: number;
    isWinner?: boolean;
  };
  participant2?: {
    userId: string;
    username: string;
    userCode: string;
    wpm?: number;
    accuracy?: number;
    score?: number;
    isWinner?: boolean;
  };
  status: 'pending' | 'in-progress' | 'completed';
  winner?: string;
  raceId?: string;
  completedAt?: string;
}

export interface PrizeReward {
  placement: string;
  ratingPoints: number;
  prizeAmount: number;
}

export interface Tournament {
  _id: string;
  name: string;
  description: string;
  type: 'single-elimination' | 'double-elimination' | 'round-robin';
  status: 'pending' | 'registration' | 'in-progress' | 'completed' | 'cancelled';
  maxParticipants: number;
  participants: TournamentParticipant[];
  bracket: BracketMatch[];
  prizePool: {
    totalReward: number;
    distribution: PrizeReward[];
  };
  entryFee?: number; // Optional entry fee for paid tournaments
  requiresPayment?: boolean; // Flag for paid tournaments
  registrationOpen?: boolean;
  registrationDeadline?: string;
  startDate: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface TournamentLeaderboard {
  tournament: {
    _id: string;
    name: string;
    type: string;
    status: string;
    totalParticipants: number;
    startDate: string;
    endDate?: string;
  };
  leaderboard: Array<{
    username: string;
    userCode: string;
    wins: number;
    losses: number;
    totalScore: number;
    status: string;
    seed: number;
  }>;
  completedMatches: number;
  totalMatches: number;
}

export interface TournamentBracket {
  tournament: {
    _id: string;
    name: string;
    type: string;
    status: string;
  };
  bracket: {
    [round: number]: BracketMatch[];
  };
}

export interface TournamentHistory {
  tournament: {
    _id: string;
    name: string;
    type: string;
    status: string;
    startDate: string;
    endDate?: string;
  };
  placement: number;
  wins: number;
  losses: number;
}

export interface TournamentMatch {
  _id: string;
  tournament: {
    _id: string;
    name: string;
  };
  round: number;
  matchNumber: number;
  opponent: {
    userId: string;
    username: string;
    userCode: string;
  };
  status: 'pending' | 'in-progress' | 'completed';
}

export interface AvailableTournament {
  _id: string;
  name: string;
  description: string;
  type: string;
  maxParticipants: number;
  startDate: string;
}

export interface TournamentRegistrationResult {
  success: boolean;
  participantCount: number;
  maxParticipants: number;
}

export interface TournamentStartResult {
  success: boolean;
  tournament: Tournament;
  bracket: BracketMatch[];
}

export interface MatchResultSubmission {
  winnerId: string;
  participant1Score: number;
  participant2Score: number;
}

export interface MatchResultResponse {
  success: boolean;
  match: BracketMatch;
  tournamentStatus: string;
}
