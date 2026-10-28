import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Alert, AlertDescription } from './alert';
import { Spinner } from './spinner';
import { apiClient } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { TrendingUp, Award } from 'lucide-react';

interface RegistrationHistory {
  _id: string;
  competition: {
    _id: string;
    title: string;
  };
  entryFee: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  finalRank?: number;
  prizeAwarded?: number;
  registeredAt: string;
}

interface UserEarnings {
  totalEarnings: number;
  totalParticipations: number;
  totalWinnings: number;
  averagePrizeAmount: number;
  bestRank: number | null;
  totalSpent: number;
  netEarnings: number;
}

interface UserCompetitionHistoryProps {
  userId?: string;
}

const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '↩' },
};

export function UserCompetitionHistory({ userId }: UserCompetitionHistoryProps) {
  const [history, setHistory] = useState<RegistrationHistory[]>([]);
  const [earnings, setEarnings] = useState<UserEarnings | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    await Promise.all([fetchHistory(), fetchEarnings()]);
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      setError('');
      const response = await apiClient.getUserRegistrationHistory();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setHistory((response.data as { registrations?: RegistrationHistory[] } | undefined)?.registrations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch competition history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      setLoadingEarnings(true);
      const response = await apiClient.getUserEarnings();
      
      if (!response.error && (response.data as { earnings?: UserEarnings } | undefined)?.earnings) {
        setEarnings((response.data as { earnings?: UserEarnings }).earnings ?? null);
      }
    } catch (err: any) {
      console.log('Earnings data not available:', err);
    } finally {
      setLoadingEarnings(false);
    }
  };

  const completedRegistrations = history.filter((r) => r.paymentStatus === 'completed');
  const paidRegistrations = completedRegistrations.filter((r) => r.prizeAwarded && r.prizeAwarded > 0);

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Earnings Summary Cards */}
      {earnings && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold text-green-600">
                  ${earnings.totalEarnings.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Competitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <p className="text-2xl font-bold">{earnings.totalParticipations}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {earnings.totalWinnings} wins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average Prize</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${earnings.averagePrizeAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Best Rank: {earnings.bestRank ? `#${earnings.bestRank}` : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Net Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  earnings.netEarnings >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${earnings.netEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Spent: ${earnings.totalSpent.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Competition History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Competitions</CardTitle>
              <CardDescription>
                {completedRegistrations.length} completed, {paidRegistrations.length} with prizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-gray-500">No competition history yet. Start your first competition!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((reg) => {
                    const config = statusColors[reg.paymentStatus];
                    return (
                      <div
                        key={reg._id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{reg.competition.title}</h4>
                            <Badge className={`${config.bg} ${config.text}`}>
                              {reg.paymentStatus}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <p>Entry Fee: ${reg.entryFee.toFixed(2)}</p>
                            <p>
                              Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                            </p>

                            {reg.finalRank && (
                              <p className="font-semibold text-gray-800">
                                📊 Rank: #{reg.finalRank}
                              </p>
                            )}

                            {reg.prizeAwarded && (
                              <p className="font-bold text-green-600">
                                🏆 Prize: ${reg.prizeAwarded.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          {loadingEarnings ? (
            <div className="flex justify-center py-8">
              <Spinner className="w-6 h-6" />
            </div>
          ) : earnings ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-semibold mb-1">TOTAL WINNINGS</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ${earnings.totalWinnings.toFixed(2)}
                      </p>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 font-semibold mb-1">TOTAL SPENT</p>
                      <p className="text-2xl font-bold text-orange-900">
                        ${earnings.totalSpent.toFixed(2)}
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600 font-semibold mb-1">AVG PRIZE</p>
                      <p className="text-2xl font-bold text-green-900">
                        ${earnings.averagePrizeAmount.toFixed(2)}
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-600 font-semibold mb-1">BEST RANK</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {earnings.bestRank ? `#${earnings.bestRank}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💰</span>
                    <p>
                      You've earned{' '}
                      <span className="font-bold">
                        ${earnings.netEarnings > 0 ? '+' : ''}
                        {earnings.netEarnings.toFixed(2)}
                      </span>{' '}
                      net from competitions
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">🏆</span>
                    <p>
                      You've participated in{' '}
                      <span className="font-bold">{earnings.totalParticipations}</span> {earnings.totalParticipations === 1 ? 'competition' : 'competitions'} and won{' '}
                      <span className="font-bold">{earnings.totalWinnings}</span>
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">📈</span>
                    <p>
                      Your average prize is{' '}
                      <span className="font-bold">${earnings.averagePrizeAmount.toFixed(2)}</span>
                    </p>
                  </div>

                  {earnings.bestRank && (
                    <div className="flex items-start gap-2">
                      <span className="text-lg">⭐</span>
                      <p>
                        Your best ranking is{' '}
                        <span className="font-bold">#{earnings.bestRank}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-700">
                No earnings data available yet. Start competing to earn prizes!
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
