// Squad and Squad Wars Type Definitions

export interface SquadMember {
  userId: string;
  username: string;
  profilePicture?: string;
  joinedAt: Date;
  role: 'leader' | 'officer' | 'member';
}

export interface SquadStats {
  totalWars: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPoints: number;
}

export interface Squad {
  _id: string;
  name: string;
  description: string;
  leader: {
    _id: string;
    username: string;
    userId: string;
    profilePicture?: string;
  };
  members: SquadMember[];
  maxMembers: number;
  squadRating: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Mythic';
  stats: SquadStats;
  profilePicture?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SquadInvite {
  _id: string;
  squad: {
    _id: string;
    name: string;
    description: string;
    leader: {
      username: string;
    };
  };
  invitedUser: string;
  invitedBy: {
    username: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message: string;
  expiresAt: Date;
  respondedAt?: Date;
  createdAt: Date;
}

export interface MemberScore {
  userId: string;
  username: string;
  score: number;
  wpm: number;
  accuracy: number;
  timestamp: Date;
}

export interface SquadWarTeam {
  squadId: string;
  name: string;
  score: number;
  memberScores: MemberScore[];
}

export interface SquadWarRules {
  typeForWar: 'random' | 'words' | 'sentences' | 'quotations';
  difficulty: 'normal' | 'hard' | 'expert';
}

export interface SquadWarRewards {
  winnerReward: number;
  loserReward: number;
}

export interface SquadWar {
  _id: string;
  title: string;
  description: string;
  squadA: SquadWarTeam;
  squadB: SquadWarTeam;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  warType: 'elimination' | 'time-based' | 'point-target';
  duration: number;
  maxParticipantsPerSquad: number;
  winner: 'squadA' | 'squadB' | 'draw' | null;
  startDate: Date;
  endDate?: Date;
  rules: SquadWarRules;
  rewards: SquadWarRewards;
  entryFee?: number;
  registrationDeadline?: string | Date;
  registrations?: Array<{ squadId: string; status?: string; userId?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SquadLeaderboardEntry {
  _id: string;
  name: string;
  tier: string;
  squadRating: number;
  stats: SquadStats;
  members: SquadMember[];
  leader: {
    username: string;
  };
}

export interface SquadLeaderboard {
  squads: SquadLeaderboardEntry[];
  total: number;
  page: number;
  pages: number;
}

export interface AvailableSquad {
  _id: string;
  name: string;
  description: string;
  leader: {
    username: string;
  };
  stats: SquadStats;
  tier: string;
  squadRating: number;
  memberCount: number;
}

export interface AvailableSquads {
  squads: AvailableSquad[];
  total: number;
  page: number;
  pages: number;
}

export interface SquadWarHistory {
  wars: SquadWar[];
  total: number;
  page: number;
  pages: number;
}
