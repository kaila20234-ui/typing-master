// Competition and Payment Types

export interface CompetitionRegistration {
  _id: string;
  competition: string;
  user: string;
  username: string;
  email: string;
  entryFee: number;
  paymentId: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  paymentMethod: 'paystack' | 'stripe' | 'other';
  paymentDate: Date;
  registrationStatus: 'registered' | 'verified' | 'disqualified' | 'withdrawn';
  finalRank?: number;
  finalScore?: number;
  prizeAwarded?: number;
  prizeDistributed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrizeDistribution {
  percentage: number;
  amount?: number;
  winner?: string;
  winnerUsername?: string;
  distributedAt?: Date;
}

export interface PrizePool {
  _id: string;
  competition: string;
  totalPrizePool: number;
  totalEntryFees: number;
  registrationCount: number;
  entryFeePerPerson: number;
  platformCommission: number;
  platformFeeCollected: number;
  netPrizePool: number;
  prizeDistribution: {
    firstPlace: PrizeDistribution;
    secondPlace: PrizeDistribution;
    thirdPlace: PrizeDistribution;
  };
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  winnersAnnounced: boolean;
  allPrizesDistributed: boolean;
}

export interface CompetitionWinner {
  rank: 1 | 2 | 3;
  userId: string;
  username: string;
  prizeAmount: number;
  distributedAt?: Date;
}

export interface CompetitionStats {
  totalRegistrations: number;
  completedPayments: number;
  failedPayments: number;
  totalRevenue: number;
  platformFee: number;
  netPrizePool: number;
  averageEntryFee: number;
}

export interface PaymentOrder {
  orderId: string;
  approvalLink: string;
  status: string;
}

export interface UserEarnings {
  totalEarnings: number;
  winCount: number;
  earnings: {
    competitionId: string;
    prizeAmount: number;
    distributedAt: Date;
  }[];
}

export interface RegistrationHistory {
  _id: string;
  competition: {
    _id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
  entryFee: number;
  paymentStatus: string;
  registrationStatus: string;
  finalRank?: number;
  finalScore?: number;
  prizeEarned: number;
  createdAt: Date;
}
// API Response Types
export interface EntryFeeResponse {
  entryFee: number;
  competitionId: string;
}

export interface PaymentOrderResponse {
  success: boolean;
  orderId: string;
  approvalLink: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  registration: CompetitionRegistration;
  transactionId: string;
}

export interface RegistrationsResponse {
  registrations: (CompetitionRegistration & { user: { username: string; userId: string } })[];
  total: number;
}

export interface WinnersResponse {
  winners: CompetitionWinner[];
}

export interface CompetitionStatsResponse {
  stats: CompetitionStats;
}

export interface DistributePrizesResponse {
  success: boolean;
  prizesDistributed: {
    '1st': number;
    '2nd': number;
    '3rd': number;
  };
}

export interface UserEarningsResponse {
  earnings: {
    totalEarnings: number;
    totalParticipations: number;
    totalWinnings: number;
    averagePrizeAmount: number;
    bestRank: number | null;
    totalSpent: number;
    netEarnings: number;
  };
}

export interface UserRegistrationHistoryResponse {
  registrations: (CompetitionRegistration & {
    competition: { title: string };
    registeredAt: string;
  })[];
}

export interface PrizePoolResponse {
  prizePool: PrizePool;
}

export interface RefundResponse {
  success: boolean;
  message: string;
}