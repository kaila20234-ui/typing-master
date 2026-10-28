// API client for communicating with backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

type RequestBody = Record<string, unknown> | undefined;

type RequestOptions = {
  method: string;
  headers: Record<string, string>;
  body?: string;
};

interface AuthUser {
  id: string;
  userId: string;
  email: string;
  username: string;
  name: string;
  bio: string;
  picture: string | null;
  createdAt: string;
  role?: 'user' | 'admin';
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface VerifyResponse {
  user: AuthUser;
}

interface CompetitorsCountResponse {
  count: number;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: RequestBody
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const options: RequestOptions = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_URL}${endpoint}`, options);

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        return { error: errorData.error || `HTTP ${response.status}` };
      }

      const responseData = (await response.json()) as T;
      return { data: responseData };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: message };
    }
  }

  // Auth endpoints
  async register(email: string, username: string, name: string, password: string, picture?: string) {
    return this.request<AuthResponse>('POST', '/auth/register', { email, username, name, password, picture });
  }

  async login(email: string, password: string) {
    return this.request<AuthResponse>('POST', '/auth/login', { email, password });
  }

  async verifyToken() {
    return this.request<VerifyResponse>('GET', '/auth/verify');
  }

  // User endpoints
  async getMe() {
    return this.request('GET', '/users/me');
  }

  async getUser(userId: string) {
    return this.request('GET', `/users/${userId}`);
  }

  async updateProfile(userId: string, name: string, bio: string, profilePicture?: string) {
    return this.request('PUT', `/users/${userId}`, { name, bio, profilePicture });
  }

  async updateStats(userId: string, stats: Record<string, unknown>) {
    return this.request('PUT', `/users/${userId}/stats`, stats);
  }

  async searchUsers(query: string) {
    return this.request('GET', `/users/search/${query}`);
  }

  async getCompetitorsCount() {
    return this.request<CompetitorsCountResponse>('GET', `/users/count/competitors`);
  }

  // Race endpoints
  async createRace(text: string, difficulty: string, maxParticipants?: number, lessonId?: string, raceType: string = 'passage') {
    return this.request('POST', '/races/create', { text, difficulty, maxParticipants, lessonId, raceType });
  }

  async getRace(roomId: string) {
    return this.request('GET', `/races/${roomId}`);
  }

  async joinRace(roomId: string) {
    return this.request('POST', `/races/${roomId}/join`, {});
  }

  async getActiveRaces() {
    return this.request('GET', '/races');
  }

  async getRaceHistory(userId: string) {
    return this.request('GET', `/races/user/${userId}/history`);
  }

  // Leaderboard & Ranking endpoints
  async getGlobalLeaderboard(page: number = 1, limit: number = 100) {
    return this.request('GET', `/leaderboard/global?page=${page}&limit=${limit}`);
  }

  async getTierLeaderboard(tier: string, limit: number = 50) {
    return this.request('GET', `/leaderboard/tier/${tier}?limit=${limit}`);
  }

  async getUserRank(userId: string) {
    return this.request('GET', `/leaderboard/rank/${userId}`);
  }

  async getMyRanking() {
    return this.request('GET', '/leaderboard/me');
  }

  async getUserRankWithNearby(userId: string) {
    return this.request('GET', `/leaderboard/user-rank/${userId}`);
  }

  // Invitation endpoints
  async getPendingInvitations() {
    return this.request('GET', '/invitations/pending');
  }

  async sendInvitation(toUserId: string, type: 'race' | 'friend_request', raceId?: string, message?: string) {
    return this.request('POST', '/invitations/send', { toUserId, type, raceId, message });
  }

  async acceptInvitation(invitationId: string) {
    return this.request('POST', `/invitations/${invitationId}/accept`, {});
  }

  async declineInvitation(invitationId: string) {
    return this.request('POST', `/invitations/${invitationId}/decline`, {});
  }

  // Daily Challenge endpoints
  async getTodaysChallenge() {
    return this.request('GET', '/daily-challenge');
  }

  async getDailyChallengeLeaderboard(limit: number = 100) {
    return this.request('GET', `/daily-challenge/leaderboard?limit=${limit}`);
  }

  async getUserDailyPerformance() {
    return this.request('GET', '/daily-challenge/me');
  }

  async submitDailyChallenge(wpm: number, accuracy: number, timeSpent: number) {
    return this.request('POST', '/daily-challenge/submit', { wpm, accuracy, timeSpent });
  }

  async getPastChallenges(days: number = 7) {
    return this.request('GET', `/daily-challenge/past?days=${days}`);
  }

  async getUserChallengeHistory(days: number = 7) {
    return this.request('GET', `/daily-challenge/history?days=${days}`);
  }

  async getChallengeLeaderboard(challengeId: string) {
    return this.request('GET', `/daily-challenge/${challengeId}/leaderboard`);
  }

  // Tournament endpoints
  async getAvailableTournaments() {
    return this.request('GET', '/tournaments');
  }

  async getTournament(tournamentId: string) {
    return this.request('GET', `/tournaments/${tournamentId}`);
  }

  async createTournament(name: string, description: string, type: string, maxParticipants: number, startDate: string) {
    return this.request('POST', '/tournaments', { name, description, type, maxParticipants, startDate });
  }

  async registerForTournament(tournamentId: string) {
    return this.request('POST', `/tournaments/${tournamentId}/register`, {});
  }

  async addTournamentParticipant(tournamentId: string) {
    return this.request('POST', `/tournaments/${tournamentId}/add-participant`, {});
  }

  async startTournament(tournamentId: string) {
    return this.request('POST', `/tournaments/${tournamentId}/start`, {});
  }

  async getTournamentBracket(tournamentId: string) {
    return this.request('GET', `/tournaments/${tournamentId}/bracket`);
  }

  async getTournamentLeaderboard(tournamentId: string) {
    return this.request('GET', `/tournaments/${tournamentId}/leaderboard`);
  }

  async submitMatchResult(tournamentId: string, round: number, matchNumber: number, winnerId: string, participant1Score: number, participant2Score: number) {
    return this.request('POST', `/tournaments/${tournamentId}/match/${round}/${matchNumber}/result`, {
      winnerId,
      participant1Score,
      participant2Score,
    });
  }

  async getTournamentHistory() {
    return this.request('GET', '/tournaments/user/history');
  }

  async getUserActiveTournamentMatches() {
    return this.request('GET', '/tournaments/user/active-matches');
  }

  // Squad Wars Endpoints
  async getAvailableSquads(page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return this.request('GET', `/squads?${params.toString()}`);
  }

  async getUserSquads() {
    return this.request('GET', '/squads/me');
  }

  async getSquadDetails(squadId: string) {
    return this.request('GET', `/squads/${squadId}`);
  }

  async createSquad(name: string, description: string, maxMembers?: number, isPublic?: boolean) {
    return this.request('POST', '/squads', { name, description, maxMembers, isPublic });
  }

  async getSquadLeaderboard(page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return this.request('GET', `/squads/leaderboard?${params.toString()}`);
  }

  async inviteUserToSquad(squadId: string, invitedUserId: string, message?: string) {
    return this.request('POST', `/squads/${squadId}/invite`, { invitedUserId, message });
  }

  async getSquadInvitations() {
    return this.request('GET', '/squads/invites/me');
  }

  async acceptSquadInvite(inviteId: string) {
    return this.request('POST', `/squads/invites/${inviteId}/accept`, {});
  }

  async rejectSquadInvite(inviteId: string) {
    return this.request('POST', `/squads/invites/${inviteId}/reject`, {});
  }

  async leaveSquad(squadId: string) {
    return this.request('POST', `/squads/${squadId}/leave`, {});
  }

  async requestSquadJoin(squadId: string) {
    return this.request('POST', `/squads/${squadId}/join`, {});
  }

  async createSquadWar(squadA_Id: string, squadB_Id: string, title: string, description?: string, options?: Record<string, unknown>) {
    return this.request('POST', '/squads/wars', {
      squadA_Id,
      squadB_Id,
      title,
      description,
      ...options,
    });
  }

  async getActiveSquadWars(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request('GET', `/squads/wars/active${params}`);
  }

  async getSquadWarDetails(warId: string) {
    return this.request('GET', `/squads/wars/${warId}`);
  }

  async recordSquadWarScore(warId: string, squadPosition: string, userId: string, username: string, score: number, wpm?: number, accuracy?: number) {
    return this.request('POST', `/squads/wars/${warId}/score`, {
      squadPosition,
      userId,
      username,
      score,
      wpm,
      accuracy,
    });
  }

  async endSquadWar(warId: string) {
    return this.request('POST', `/squads/wars/${warId}/end`, {});
  }

  async getSquadWarHistory(squadId: string, page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return this.request('GET', `/squads/${squadId}/wars?${params.toString()}`);
  }

  async registerSquadForWar(warId: string, squadId: string, paymentId: string) {
    return this.request('POST', `/squads/wars/${warId}/register`, {
      squadId,
      paymentId,
    });
  }

  async setSquadReady(warId: string, squadId: string) {
    return this.request('POST', `/squads/wars/${warId}/set-ready`, {
      squadId,
    });
  }

  async cancelSquadWar(warId: string) {
    return this.request('POST', `/squads/wars/${warId}/cancel`, {});
  }

  // Competition & Payment Methods
  async getCompetitionEntryFee(competitionId: string) {
    return this.request<{entryFee: number}>('GET', `/competitions/${competitionId}/entry-fee`);
  }

  async createPaymentOrder(competitionId: string, entryFee: number) {
    return this.request<{success: boolean; orderId: string; approvalLink: string}>('POST', `/competitions/${competitionId}/create-payment-order`, {
      entryFee,
    });
  }

  async confirmPayment(competitionId: string, orderId: string, entryFee?: number) {
    return this.request<{ success: boolean; registration: unknown; transactionId: string }>('POST', `/competitions/${competitionId}/confirm-payment`, {
      orderId,
      entryFee,
    });
  }

  async getCompetitionRegistrations(competitionId: string, status?: string, page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return this.request<{ registrations: unknown[] }>('GET', `/competitions/${competitionId}/registrations?${params.toString()}`);
  }

  async getCompetitionWinners(competitionId: string) {
    return this.request<{ winners: unknown[] }>('GET', `/competitions/${competitionId}/winners`);
  }

  async distributePrizes(competitionId: string) {
    return this.request<{ success: boolean; prizePool?: unknown; winners?: unknown }>('POST', `/competitions/${competitionId}/distribute-prizes`, {});
  }

  async getCompetitionStats(competitionId: string) {
    return this.request<{ stats: unknown }>('GET', `/competitions/${competitionId}/stats`);
  }

  async getPrizePool(competitionId: string) {
    return this.request<{ prizePool: unknown }>('GET', `/competitions/${competitionId}/prize-pool`);
  }

  async refundPayment(competitionId: string, registrationId: string, reason: string) {
    return this.request<{ success: boolean }>('POST', `/competitions/${competitionId}/refund`, {
      registrationId,
      reason,
    });
  }

  async getUserRegistrationHistory() {
    return this.request<{ registrations: unknown[] }>('GET', `/competitions/user/registration-history`);
  }

  async getUserEarnings() {
    return this.request<{ earnings: unknown }>('GET', `/competitions/user/earnings`);
  }

  // Live Players endpoints
  async getLivePlayers() {
    return this.request('GET', '/live-players');
  }

  async getLivePlayersCount() {
    return this.request('GET', '/live-players/count');
  }

  async getLivePlayersByType(type: string) {
    return this.request('GET', `/live-players/by-type/${type}`);
  }
}

export const apiClient = new ApiClient();
