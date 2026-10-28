import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Spinner } from './spinner';
import { Alert, AlertDescription } from './alert';
import { apiClient } from '@/lib/api';
import { Trophy } from 'lucide-react';

interface Winner {
  rank: number;
  user: {
    _id: string;
    username: string;
    totalWPM?: number;
  };
  prizeAmount: number;
  completionTime?: number;
  accuracy?: number;
}

interface WinnerAnnouncementProps {
  competitionId: string;
  competitionTitle: string;
}

const medalConfig = [
  { rank: 1, icon: '🥇', color: 'gold', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  { rank: 2, icon: '🥈', color: 'silver', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' },
  { rank: 3, icon: '🥉', color: 'bronze', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
];

export function WinnerAnnouncement({ competitionId, competitionTitle }: WinnerAnnouncementProps) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchWinners();
  }, [competitionId]);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getCompetitionWinners(competitionId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setWinners((response.data as { winners?: Winner[] } | undefined)?.winners || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch winners');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-700">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!winners || winners.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-700">
          No winners announced yet. Competition may not be completed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">🎉 Winners Announced!</CardTitle>
          <CardDescription>{competitionTitle}</CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {winners.map((winner) => {
          const config = medalConfig.find((m) => m.rank === winner.rank);
          if (!config) return null;

          return (
            <Card
              key={winner.user._id}
              className={`border-2 ${config.borderColor} ${config.bgColor}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{config.icon}</div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-lg font-bold ${config.textColor}`}>
                        #{winner.rank} Place
                      </h3>
                      <Badge variant="outline" className={config.textColor}>
                        {winner.user.username}
                      </Badge>
                    </div>

                    {winner.accuracy !== undefined && (
                      <p className="text-sm text-gray-600">
                        Accuracy: {winner.accuracy.toFixed(2)}%
                      </p>
                    )}

                    {winner.completionTime !== undefined && (
                      <p className="text-sm text-gray-600">
                        Completion Time: {(winner.completionTime / 1000).toFixed(2)}s
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600">Prize Amount</p>
                    <p className={`text-2xl font-bold ${config.textColor}`}>
                      ${winner.prizeAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Prize Breakdown</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>🥇 1st Place: 50% of prize pool</p>
          <p>🥈 2nd Place: 30% of prize pool</p>
          <p>🥉 3rd Place: 20% of prize pool</p>
        </div>
      </div>

      <button
        onClick={fetchWinners}
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Refresh Results
      </button>
    </div>
  );
}
