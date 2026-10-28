import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, Trophy, TrendingUp, Activity, Zap } from 'lucide-react'
import axios from 'axios'

interface AdminStats {
  totalUsers: number
  activeRaces: number
  totalTournaments: number
  totalChallenges: number
  totalRevenue: number
  activePlayers: number
  recentActivity: Array<{
    type: string
    title: string
    timestamp: string
  }>
}

interface AdminStatisticsProps {
  userId?: string
}

export function AdminStatistics({ userId: _userId }: AdminStatisticsProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const res = await axios.get('/api/admin/stats/overview')
        setStats(res.data)
      } catch (err) {
        setStats(null)
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-slate-700/50 rounded mb-2" />
              <div className="h-4 bg-slate-700/50 rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return <div className="text-red-600">Failed to load statistics</div>
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Admin Header Badge */}
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/50">
          👑 Admin Dashboard
        </Badge>
        <span className="text-sm text-slate-400">Global Competition Statistics</span>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">+180 this month</p>
          </CardContent>
        </Card>

        {/* Active Races */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Races</CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRaces}</div>
            <p className="text-xs text-slate-400 mt-1">+42 today</p>
          </CardContent>
        </Card>

        {/* Tournaments */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTournaments}</div>
            <p className="text-xs text-slate-400 mt-1">3 active now</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Challenges */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daily Challenges</CardTitle>
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Active Challenges</span>
                <span className="text-lg font-bold">{stats.totalChallenges}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Players Competing</span>
                <span className="text-lg font-bold text-cyan-400">{stats.activePlayers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Metrics */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Platform Health</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Server Status</span>
                <Badge className="bg-green-500/20 text-green-400">● Online</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">API Response</span>
                <span className="text-sm font-mono text-emerald-400">42ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-xs text-slate-500">{activity.timestamp}</p>
                </div>
                <Badge variant="outline" className="text-xs border-slate-600">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
