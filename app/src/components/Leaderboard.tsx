import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, TrendingUp, Award, Medal } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { TierBadge } from '@/components/TierBadge'
import type { UserRanking, LeaderboardData } from '@/types/ranking'

interface LeaderboardProps {
  userId?: string
}

const tierColors = {
  'Bronze': 'from-amber-900 to-amber-700',
  'Silver': 'from-slate-500 to-slate-400',
  'Gold': 'from-yellow-600 to-yellow-500',
  'Platinum': 'from-cyan-500 to-cyan-400',
  'Diamond': 'from-purple-600 to-purple-500',
}

export function Leaderboard({ userId }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState('global')
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardData | null>(null)
  const [tierLeaderboards, setTierLeaderboards] = useState<Record<string, UserRanking[]>>({})
  const [userRanking, setUserRanking] = useState<UserRanking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboards()
  }, [])

  const loadLeaderboards = async () => {
    setLoading(true)
    try {
      // Load global leaderboard
      const globalResult = await apiClient.getGlobalLeaderboard(1, 100)
      if (globalResult.data) {
        setGlobalLeaderboard(globalResult.data as LeaderboardData)
      }

      // Load user's ranking if logged in
      if (userId) {
        const userResult = await apiClient.getMyRanking()
        if (userResult.data) {
          setUserRanking(userResult.data as UserRanking)
        }

        // Load tier leaderboards
        const tiers = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];
        for (const tier of tiers) {
          const tierResult = await apiClient.getTierLeaderboard(tier, 50)
          if (tierResult.data) {
            const tierData = tierResult.data as { leaderboard?: UserRanking[] }
            if (tierData.leaderboard && tierData.leaderboard.length > 0) {
              setTierLeaderboards(prev => ({
                ...prev,
                [tier]: tierData.leaderboard!,
              }))
            }
          }
        }
      }
    } catch (error) {
      console.error('Load leaderboards error:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderLeaderboardRow = (ranking: UserRanking, index: number) => (
    <div
      key={ranking._id}
      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-600/50 transition-colors"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Rank */}
        <div className="text-center w-8">
          {ranking.rank && ranking.rank <= 3 ? (
            <span className="text-2xl">{['🥇', '🥈', '🥉'][ranking.rank - 1]}</span>
          ) : (
            <span className="font-bold text-slate-400 text-lg">#{ranking.rank || index + 1}</span>
          )}
        </div>

        {/* Tier */}
        <TierBadge tier={ranking.tier} size="sm" />

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          {ranking.userId.profilePicture ? (
            <img
              src={ranking.userId.profilePicture}
              alt={ranking.userId.username}
              className="w-8 h-8 rounded-full inline-block mr-2"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 inline-block mr-2" />
          )}
          <span className="text-white font-medium truncate">{ranking.userId.username}</span>
          <span className="text-xs text-slate-400 ml-2">{ranking.userId.userId}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 ml-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-cyan-400">{ranking.ratingPoints}</p>
          <p className="text-xs text-slate-400">Rating</p>
        </div>
        <div className="text-center min-w-fit">
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <p className="text-lg font-bold text-white">{ranking.racesWon}</p>
          </div>
          <p className="text-xs text-slate-400">{ranking.winRate}%</p>
        </div>
        <div className="text-center min-w-fit hidden sm:block">
          <p className="text-lg font-bold text-emerald-400">{ranking.averageWpm} WPM</p>
          <p className="text-xs text-slate-400">Avg</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* User's Current Ranking */}
      {userRanking && (
        <Card className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border-purple-600/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              <Medal className="w-5 h-5" />
              Your Current Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                <p className="text-3xl font-bold text-cyan-400">#{userRanking.rank}</p>
                <p className="text-xs text-slate-400 mt-1">Global Rank</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                <p className={`text-2xl font-bold ${tierColors[userRanking.tier as keyof typeof tierColors]} px-2 py-1 rounded inline-block`}>
                  {userRanking.tier}
                </p>
                <p className="text-xs text-slate-400 mt-1">Tier</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-400">{userRanking.ratingPoints}</p>
                <p className="text-xs text-slate-400 mt-1">Rating Points</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                <p className="text-3xl font-bold text-emerald-400">{userRanking.maxWinStreak}</p>
                <p className="text-xs text-slate-400 mt-1">Best Streak</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="text-lg font-bold text-white">{userRanking.totalRaces}</p>
                <p className="text-slate-400">Total Races</p>
              </div>
              <div>
                <p className="text-lg font-bold text-cyan-400">{userRanking.winRate}%</p>
                <p className="text-slate-400">Win Rate</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-400">{userRanking.averageWpm} WPM</p>
                <p className="text-slate-400">Avg WPM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboards */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Ranked Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="global" className="text-xs">
                Global
              </TabsTrigger>
              <TabsTrigger value="diamond" className="text-xs bg-purple-900/30">
                💎 Diamond
              </TabsTrigger>
              <TabsTrigger value="platinum" className="text-xs bg-cyan-900/30">
                💎 Platinum
              </TabsTrigger>
              <TabsTrigger value="gold" className="text-xs bg-yellow-900/30">
                🥇 Gold
              </TabsTrigger>
              <TabsTrigger value="silver" className="text-xs bg-slate-900/30">
                ⚪ Silver
              </TabsTrigger>
            </TabsList>

            {/* Global Leaderboard */}
            <TabsContent value="global" className="space-y-3">
              {loading ? (
                <p className="text-center text-slate-400 py-8">Loading leaderboard...</p>
              ) : globalLeaderboard && globalLeaderboard.leaderboard.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {globalLeaderboard.leaderboard.map((ranking, idx) => renderLeaderboardRow(ranking, idx))}
                  </div>
                  <div className="text-center text-sm text-slate-400 mt-4">
                    Showing {globalLeaderboard.leaderboard.length} of {globalLeaderboard.total} players
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-400 py-8">No rankings available</p>
              )}
            </TabsContent>

            {/* Tier Leaderboards */}
            {['Diamond', 'Platinum', 'Gold', 'Silver'].map(tier => (
              <TabsContent key={tier} value={tier.toLowerCase()} className="space-y-3">
                {tierLeaderboards[tier] && tierLeaderboards[tier].length > 0 ? (
                  <div className="space-y-3">
                    {tierLeaderboards[tier].map((ranking, idx) => renderLeaderboardRow(ranking, idx))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8">No players in {tier} tier yet</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Tier Information */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Tier Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {(['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'] as const).map(tier => (
              <div key={tier} className={`bg-gradient-to-br ${tierColors[tier]} rounded-lg p-3 text-center text-white`}>
                <TierBadge tier={tier} showLabel={false} size="lg" />
                <p className="font-bold text-white mt-2">{tier}</p>
                <p className="text-xs text-slate-200 mt-1">
                  {tier === 'Bronze' 
                    ? '0+ Rating' 
                    : tier === 'Silver' 
                    ? '1500+' 
                    : tier === 'Gold' 
                    ? '2500+' 
                    : tier === 'Platinum' 
                    ? '3500+' 
                    : '5000+'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
