import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, Trophy, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function DashboardPage() {
  const [stats, setStats] = useState<any | null>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true)
      try {
        const statsRes = await apiClient.getAdminDashboardStats()
        setStats(statsRes.data)
        const activityRes = await apiClient.getAdminActivity()
        setActivity(Array.isArray(activityRes.data) ? activityRes.data : (activityRes.data as any)?.activity || [])
      } catch (err) {
        setStats(null)
        setActivity([])
      }
      setLoading(false)
    }
    fetchDashboard()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to TypeMaster Admin Panel</p>
      </div>
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? stats.totalUsers : '...'}</div>
            <p className="text-xs text-muted-foreground">+{stats ? stats.usersThisMonth : '...'} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Races</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? stats.activeRaces : '...'}</div>
            <p className="text-xs text-muted-foreground">+{stats ? stats.racesToday : '...'} today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? stats.totalTournaments : '...'}</div>
            <p className="text-xs text-muted-foreground">{stats ? stats.activeTournaments : '...'} active now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats ? stats.totalRevenue : '...'}</div>
            <p className="text-xs text-muted-foreground">+{stats ? stats.revenueGrowth : '...'} from last month</p>
          </CardContent>
        </Card>
      </div>
      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest events from the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {activity.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.timestamp}</p>
                  </div>
                  <Badge variant={event.type === 'Tournament' ? 'default' : event.type === 'Users' ? 'secondary' : 'outline'}>{event.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
