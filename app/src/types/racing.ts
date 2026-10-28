// Type definitions for racing/multiplayer features

export interface Participant {
  userId: string;
  userCode?: string;
  username: string;
  profilePicture?: string;
  wpm: number;
  accuracy: number;
  characterCount: number;
  raceStatus: 'waiting' | 'ready' | 'typing' | 'finished';
  finishTime?: Date;
  position?: number;
}

export interface Race {
  _id?: string;
  roomId: string;
  status: 'waiting' | 'ready' | 'in_progress' | 'completed';
  participants: Participant[];
  text: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'custom';
  maxParticipants: number;
  createdBy?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RaceResult {
  _id?: string;
  raceId: string;
  userId: string;
  position: number;
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  timeElapsed: number;
  finishTime?: Date;
}

export interface Invitation {
  _id?: string;
  from: string;
  to: string;
  raceId?: string;
  type: 'race' | 'friend_request';
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt?: string;
  expiresAt?: string;
}

export interface LeaderboardEntry {
  _id?: string;
  userId: string;
  username: string;
  bestWpm: number;
  averageWpm: number;
  totalRaces: number;
  racesWon: number;
  winRate: number;
  rank?: number;
  timeFrame: 'all_time' | 'monthly' | 'weekly';
}
