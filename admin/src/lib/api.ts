// API client for communicating with backend

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Check for authToken (used by AdminApp) first, then fallback to token
    this.token = localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    // Store in authToken for admin panel consistency
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token); // Keep for backwards compatibility
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const options: any = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_URL}${endpoint}`, options);

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || `HTTP ${response.status}` };
      }

      const responseData = await response.json();
      return { data: responseData };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Auth endpoints
  async register(email: string, username: string, name: string, password: string, picture?: string, isAdmin?: boolean, adminSecret?: string) {
    return this.request('POST', '/auth/register', { email, username, name, password, picture, isAdmin, adminSecret });
  }

  async login(email: string, password: string) {
    return this.request('POST', '/auth/login', { email, password });
  }

  async verifyToken() {
    return this.request('GET', '/auth/verify');
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

  async updateStats(userId: string, stats: any) {
    return this.request('PUT', `/users/${userId}/stats`, stats);
  }

  async searchUsers(query: string) {
    return this.request('GET', `/users/search/${query}`);
  }

  async getCompetitorsCount() {
    return this.request('GET', `/users/count/competitors`);
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

  async createSquadWar(squadA_Id: string, squadB_Id: string, title: string, description?: string, options?: any) {
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

  // Competition & Payment Methods
  async getCompetitionEntryFee(competitionId: string) {
    return this.request<{entryFee: number}>('GET', `/competitions/${competitionId}/entry-fee`);
  }

  async createPaymentOrder(competitionId: string, entryFee: number) {
    return this.request<{success: boolean; orderId: string; approvalLink: string}>('POST', `/competitions/${competitionId}/create-payment-order`, {
      entryFee,
    });
  }

  async confirmPayment(competitionId: string, orderId: string) {
    return this.request<{success: boolean; registration: any; transactionId: string}>('POST', `/competitions/${competitionId}/confirm-payment`, {
      orderId,
    });
  }

  async getCompetitionRegistrations(competitionId: string, status?: string, page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return this.request<{registrations: any[]}>('GET', `/competitions/${competitionId}/registrations?${params.toString()}`);
  }

  async getCompetitionWinners(competitionId: string) {
    return this.request<{winners: any[]}>('GET', `/competitions/${competitionId}/winners`);
  }

  async distributePrizes(competitionId: string) {
    return this.request<{success: boolean; prizesDistributed: {[key: string]: number}}>('POST', `/competitions/${competitionId}/distribute-prizes`, {});
  }

  async getCompetitionStats(competitionId: string) {
    return this.request<{stats: any}>('GET', `/competitions/${competitionId}/stats`);
  }

  async getPrizePool(competitionId: string) {
    return this.request<{prizePool: any}>('GET', `/competitions/${competitionId}/prize-pool`);
  }

  async refundPayment(competitionId: string, registrationId: string, reason: string) {
    return this.request<{success: boolean}>('POST', `/competitions/${competitionId}/refund`, {
      registrationId,
      reason,
    });
  }

  async getUserRegistrationHistory() {
    return this.request<{registrations: any[]}>('GET', `/competitions/user/registration-history`);
  }

  async getUserEarnings() {
    return this.request<{earnings: any}>('GET', `/competitions/user/earnings`);
  }

  // Admin endpoints
  async getAdminDashboardStats() {
    return this.request('GET', '/admin/stats/overview');
  }

  async getAdminStatistics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request('GET', `/admin/statistics/overview?${params.toString()}`);
  }

  async getAdminActivity(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request('GET', `/admin/activity${params}`);
  }

  async getAdminTournaments() {
    return this.request('GET', '/admin/tournaments');
  }

  async getAdminRaces() {
    return this.request('GET', '/admin/races');
  }

  async getAdminRaceRegistrations(raceId: string) {
    return this.request('GET', `/admin/races/${raceId}/registrations`);
  }

  async getAdminDailyChallenges() {
    return this.request('GET', '/admin/dailyChallenge');
  }

  async getAdminSquadWars() {
    return this.request('GET', '/admin/squadwars');
  }

  async getAdminLeaderboard() {
    return this.request('GET', '/admin/leaderboard');
  }

  async getAdminUsers(page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return this.request('GET', `/admin/users?${params.toString()}`);
  }

  async getAdminModeration() {
    return this.request('GET', '/admin/moderation/reports');
  }

  async getAdminPayments() {
    return this.request('GET', '/admin/payments');
  }

  async getAdminPaymentStats() {
    return this.request('GET', '/admin/payments/stats/overview');
  }

  async getAdminSettings() {
    return this.request('GET', '/admin/settings');
  }

  async updateAdminSettings(settings: any) {
    return this.request('PUT', '/admin/settings', settings);
  }

  async updateAdminUser(userId: string, updates: any) {
    return this.request('PUT', `/admin/users/${userId}`, updates);
  }

  async deleteAdminUser(userId: string) {
    return this.request('DELETE', `/admin/users/${userId}`);
  }

  async exportAdminData(type: string, startDate?: string, endDate?: string, status?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);
    return this.request('GET', `/admin/export/${type}?${params.toString()}`);
  }

  async createAdminChallenge(challengeData: any) {
    return this.request('POST', '/admin/dailyChallenge', challengeData);
  }

  async updateAdminChallenge(challengeId: string, updates: any) {
    return this.request('PUT', `/admin/dailyChallenge/${challengeId}`, updates);
  }

  async deleteAdminChallenge(challengeId: string) {
    return this.request('DELETE', `/admin/dailyChallenge/${challengeId}`);
  }

  async scheduleAdminChallenge(scheduleData: any) {
    return this.request('POST', '/admin/dailyChallenge/schedule', scheduleData);
  }

  async publishAdminChallenge(challengeId: string) {
    return this.request('POST', `/admin/dailyChallenge/${challengeId}/publish`, {});
  }

  async createAdminRace(raceData: any) {
    return this.request('POST', '/admin/races', raceData);
  }

  async updateAdminRace(raceId: string, updates: any) {
    return this.request('PUT', `/admin/races/${raceId}`, updates);
  }

  async forceStartAdminRace(raceId: string) {
    return this.request('POST', `/admin/races/${raceId}/force-start`, { notes: 'Force-started by admin' });
  }

  async forceEndAdminRace(raceId: string) {
    return this.request('POST', `/admin/races/${raceId}/force-end`, { notes: 'Force-ended by admin' });
  }

  async createAdminSquadWar(warData: any) {
    return this.request('POST', '/admin/squadwars', warData);
  }

  async updateAdminSquadWar(warId: string, updates: any) {
    return this.request('PUT', `/admin/squadwars/${warId}`, updates);
  }

  async deleteAdminSquadWar(warId: string) {
    return this.request('DELETE', `/admin/squadwars/${warId}`);
  }

  async adjustAdminSquadWarScore(warId: string, squad: 'A' | 'B', amount: number) {
    return this.request('POST', `/admin/squadwars/${warId}/adjust-score`, { squad, amount });
  }

  async setAdminSquadWarWinner(warId: string, winner: 'A' | 'B') {
    return this.request('POST', `/admin/squadwars/${warId}/set-winner`, { winner });
  }

  async createAdminTournament(tournamentData: any) {
    return this.request('POST', '/admin/tournaments', tournamentData);
  }

  async updateAdminTournament(tournamentId: string, updates: any) {
    return this.request('PUT', `/admin/tournaments/${tournamentId}`, updates);
  }

  async deleteAdminTournament(tournamentId: string) {
    return this.request('DELETE', `/admin/tournaments/${tournamentId}`);
  }

  async generateAdminTournamentBracket(tournamentId: string) {
    return this.request('POST', `/admin/tournaments/${tournamentId}/generate-bracket`, {});
  }

  async forceEndAdminTournament(tournamentId: string) {
    return this.request('POST', `/admin/tournaments/${tournamentId}/force-end`, {});
  }

  async refundAdminPayment(paymentId: string) {
    return this.request('POST', `/admin/payments/${paymentId}/refund`, {});
  }

  async deleteAdminPayment(paymentId: string) {
    return this.request('DELETE', `/admin/payments/${paymentId}`);
  }

  async updateAdminModeration(reportId: string, updates: any) {
    return this.request('PUT', `/admin/moderation/reports/${reportId}`, updates);
  }

  async banAdminUser(reportId: string) {
    return this.request('POST', `/admin/moderation/reports/${reportId}/ban`, {});
  }

  // Admin Live Players endpoints
  async getAdminLivePlayers() {
    return this.request('GET', '/live-players');
  }

  async getAdminLivePlayersCount() {
    return this.request('GET', '/live-players/count');
  }

  async getAdminLivePlayersByType(type: string) {
    return this.request('GET', `/live-players/by-type/${type}`);
  }
}

export const apiClient = new ApiClient();
