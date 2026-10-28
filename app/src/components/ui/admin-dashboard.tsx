import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Alert, AlertDescription } from './alert';
import { Spinner } from './spinner';
import { apiClient } from '@/lib/api';
import { AlertCircle, CheckCircle, Users, DollarSign, Trophy } from 'lucide-react';

interface Registration {
  _id: string;
  user: {
    username: string;
    userId: string;
  };
  entryFee: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  finalRank?: number;
  prizeAwarded?: number;
  createdAt: string;
}

interface CompetitionStats {
  totalRegistrations: number;
  completedPayments: number;
  pendingPayments: number;
  totalRevenue: number;
  platformCommission: number;
  totalPrizePool: number;
}

interface AdminDashboardProps {
  competitionId: string;
  competitionTitle: string;
  isAdmin?: boolean;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export function AdminDashboard({ competitionId, competitionTitle, isAdmin = false }: AdminDashboardProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<CompetitionStats | null>(null);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [distributingPrizes, setDistributingPrizes] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [competitionId]);

  const fetchData = async () => {
    await Promise.all([fetchRegistrations(), fetchStats()]);
  };

  const fetchRegistrations = async () => {
    try {
      setLoadingRegistrations(true);
      setError('');
      const response = await apiClient.getCompetitionRegistrations(competitionId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setRegistrations((response.data as { registrations?: Registration[] } | undefined)?.registrations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch registrations');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await apiClient.getCompetitionStats(competitionId);
      
      if (!response.error && (response.data as { stats?: CompetitionStats } | undefined)?.stats) {
        setStats((response.data as { stats?: CompetitionStats }).stats ?? null);
      }
    } catch (err: any) {
      // Stats might not be available yet
      console.log('Stats not available:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDistributePrizes = async () => {
    if (!isAdmin) {
      setError('You do not have permission to distribute prizes');
      return;
    }

    if (!window.confirm('Are you sure you want to distribute prizes to the top 3 competitors?')) {
      return;
    }

    try {
      setDistributingPrizes(true);
      setError('');
      setSuccessMessage('');

      const response = await apiClient.distributePrizes(competitionId);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.success) {
        const prizeData = response.data as { prizesDistributed?: Record<string, number> };
        setSuccessMessage(
          `Prizes distributed! 1st: $${prizeData.prizesDistributed?.['1st'] ?? 0}, 2nd: $${prizeData.prizesDistributed?.['2nd'] ?? 0}, 3rd: $${prizeData.prizesDistributed?.['3rd'] ?? 0}`
        );
        await fetchData();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to distribute prizes');
    } finally {
      setDistributingPrizes(false);
    }
  };

  const handleRefund = async (registrationId: string, username: string) => {
    if (!isAdmin) {
      setError('You do not have permission to process refunds');
      return;
    }

    if (!window.confirm(`Refund entry fee for ${username}?`)) {
      return;
    }

    try {
      await apiClient.refundPayment(competitionId, registrationId, 'Admin refund');
      setSuccessMessage(`Refund processed for ${username}`);
      await fetchRegistrations();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    }
  };

  if (!isAdmin) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700">
          Admin access required to view competition dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-2">{competitionTitle}</h2>
        <p className="text-gray-600">Competition ID: {competitionId}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-2xl font-bold">{stats.totalRegistrations}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold">{stats.completedPayments}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.pendingPayments} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Commission: ${stats.platformCommission.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Prize Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <p className="text-2xl font-bold">${stats.totalPrizePool.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Registrations</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Registrations Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrations</CardTitle>
              <CardDescription>
                {registrations.length} total registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRegistrations ? (
                <div className="flex justify-center py-8">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : registrations.length === 0 ? (
                <p className="text-gray-500">No registrations yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {registrations.map((reg) => (
                    <div
                      key={reg._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{reg.user.username}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge className={statusColors[reg.paymentStatus]}>
                            {reg.paymentStatus}
                          </Badge>
                          {reg.finalRank && (
                            <p className="text-xs font-semibold mt-1">
                              Rank: #{reg.finalRank}
                            </p>
                          )}
                          {reg.prizeAwarded && (
                            <p className="text-xs text-green-600 font-semibold">
                              Prize: ${reg.prizeAwarded}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-medium">${reg.entryFee.toFixed(2)}</p>
                        </div>

                        {reg.paymentStatus === 'completed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRefund(reg._id, reg.user.username)}
                          >
                            Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competition Actions</CardTitle>
              <CardDescription>Manage competition lifecycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Distribute Prizes</h4>
                <p className="text-sm text-blue-800 mb-4">
                  Automatically select top 3 performers and distribute prize pool:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 mb-4 ml-4">
                  <li>• 1st Place: 50% of prize pool</li>
                  <li>• 2nd Place: 30% of prize pool</li>
                  <li>• 3rd Place: 20% of prize pool</li>
                </ul>
                <Button
                  onClick={handleDistributePrizes}
                  disabled={distributingPrizes}
                  className="w-full"
                >
                  {distributingPrizes ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Distributing...
                    </>
                  ) : (
                    'Distribute Prizes Now'
                  )}
                </Button>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-900 mb-2">Quick Stats</h4>
                {loadingStats ? (
                  <Spinner className="w-4 h-4" />
                ) : stats ? (
                  <div className="space-y-1 text-sm text-amber-800">
                    <p>Total Registrations: <span className="font-bold">{stats.totalRegistrations}</span></p>
                    <p>Completed Payments: <span className="font-bold">{stats.completedPayments}</span></p>
                    <p>Pending Payments: <span className="font-bold">{stats.pendingPayments}</span></p>
                    <p>Total Revenue: <span className="font-bold">${stats.totalRevenue.toFixed(2)}</span></p>
                    <p>Prize Pool: <span className="font-bold">${stats.totalPrizePool.toFixed(2)}</span></p>
                  </div>
                ) : (
                  <p className="text-sm text-amber-700">Stats not available</p>
                )}
              </div>

              <Button
                variant="outline"
                onClick={fetchData}
                className="w-full"
              >
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
