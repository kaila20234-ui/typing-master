import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useRef } from 'react'
import { socketClient } from '@/lib/socket'
import { apiClient } from '@/lib/api'

export function LeaderboardsPage() {
  const [leaderboards, setLeaderboards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'rank' | 'wpm' | 'wins' | 'winRate'>('rank')
  const [filterOpen, setFilterOpen] = useState(false)
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'weekly' | 'monthly' | 'squad'>('global')


  // Ref to avoid duplicate event listeners
  const socketInitialized = useRef(false)

  useEffect(() => {
    fetchLeaderboards()

    if (!socketInitialized.current) {
      socketClient.connect()
      socketClient.on('leaderboardUpdate', handleLeaderboardUpdate)
      socketClient.on('squadLeaderboardUpdate', handleSquadLeaderboardUpdate)
      socketInitialized.current = true
    }
    return () => {
      socketClient.off('leaderboardUpdate', handleLeaderboardUpdate)
      socketClient.off('squadLeaderboardUpdate', handleSquadLeaderboardUpdate)
    }
    // eslint-disable-next-line
  }, [leaderboardType])

  function handleSquadLeaderboardUpdate(data: any) {
    // Only update if viewing squad leaderboard (if you have a squad leaderboard tab/type)
    if (leaderboardType === 'squad') {
      setLeaderboards(Array.isArray(data) ? data : data?.squads || [])
      setLoading(false)
    }
  }

  function handleLeaderboardUpdate(data: any) {
    // Optionally filter by leaderboardType if needed
    setLeaderboards(Array.isArray(data) ? data : data?.leaderboards || [])
    setLoading(false)
  }

  async function fetchLeaderboards() {
    setLoading(true)
    try {
      const res = await apiClient.getAdminLeaderboard()
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.leaderboards || []
      setLeaderboards(data)
    } catch (err) {
      setLeaderboards([])
    }
    setLoading(false)
  }

  // Filter leaderboards based on search term
  const filteredLeaderboards = leaderboards.filter((entry) =>
    entry.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort leaderboards based on selected sort option
  const sortedLeaderboards = [...filteredLeaderboards].sort((a, b) => {
    switch (sortBy) {
      case 'wpm':
        return (b.wpm || 0) - (a.wpm || 0)
      case 'wins':
        return (b.wins || 0) - (a.wins || 0)
      case 'winRate':
        const rateA = parseFloat(a.winRate) || 0
        const rateB = parseFloat(b.winRate) || 0
        return rateB - rateA
      case 'rank':
      default:
        return (a.rank || 0) - (b.rank || 0)
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboards</h1>
        <p className="text-muted-foreground mt-2">Global rankings and player statistics</p>
      </div>

      {/* Leaderboard Type Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setLeaderboardType('global')}
          className={`px-4 py-2 font-medium transition-colors ${
            leaderboardType === 'global'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🌍 Global Rankings
        </button>
        <button
          onClick={() => setLeaderboardType('weekly')}
          className={`px-4 py-2 font-medium transition-colors ${
            leaderboardType === 'weekly'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📅 Weekly Rankings
        </button>
        <button
          onClick={() => setLeaderboardType('monthly')}
          className={`px-4 py-2 font-medium transition-colors ${
            leaderboardType === 'monthly'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📊 Monthly Rankings
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Search player..."
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            ⚙️ Sort by
          </Button>
          {filterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setSortBy('rank')
                  setFilterOpen(false)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${sortBy === 'rank' ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
              >
                🏆 Rank
              </button>
              <button
                onClick={() => {
                  setSortBy('wpm')
                  setFilterOpen(false)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${sortBy === 'wpm' ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
              >
                ⚡ WPM (Highest)
              </button>
              <button
                onClick={() => {
                  setSortBy('wins')
                  setFilterOpen(false)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${sortBy === 'wins' ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
              >
                🎯 Wins (Most)
              </button>
              <button
                onClick={() => {
                  setSortBy('winRate')
                  setFilterOpen(false)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${sortBy === 'winRate' ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
              >
                📈 Win Rate
              </button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {leaderboardType === 'global' && '🌍 Global Rankings'}
            {leaderboardType === 'weekly' && '📅 Weekly Rankings'}
            {leaderboardType === 'monthly' && '📊 Monthly Rankings'}
          </CardTitle>
          <CardDescription>Based on WPM and race victories</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : sortedLeaderboards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No players found</div>
          ) : (
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-6 gap-4 py-3 px-4 bg-gray-100 rounded-md font-bold text-sm">
                <div>Rank</div>
                <div>Player</div>
                <div>WPM</div>
                <div>Races</div>
                <div>Wins</div>
                <div>Win Rate</div>
              </div>
              {/* Data Rows */}
              {sortedLeaderboards.map((entry, index) => (
                <div
                  key={entry._id || index}
                  className="grid grid-cols-6 gap-4 py-3 px-4 border rounded-md items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="font-bold text-lg">{entry.rank || index + 1}</div>
                  <div className="font-medium">{entry.username || 'Unknown'}</div>
                  <div className="text-right">{entry.wpm || 0} WPM</div>
                  <div className="text-right">{entry.races || 0}</div>
                  <div className="text-right text-green-600 font-medium">{entry.wins || 0}</div>
                  <div>
                    <Badge variant={parseFloat(entry.winRate) > 50 ? 'default' : 'secondary'}>
                      {entry.winRate || '0%'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
