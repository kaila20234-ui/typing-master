import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Zap, Activity } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { apiClient } from '@/lib/api'

interface LivePlayer {
  userId: string
  username: string
  competitionType: 'race' | 'tournament' | 'squadWar' | 'dailyChallenge'
  competitionId: string
  competitionName: string
  roomId?: string
  score: number
  wpm: number
  accuracy: number
  status: 'typing' | 'completed' | 'waiting' | 'ready'
  joinedAt: string
  lastUpdate: string
}

export function LivePlayersPage() {
  const [players, setPlayers] = useState<LivePlayer[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<LivePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [socketConnected, setSocketConnected] = useState(false)

  useEffect(() => {
    fetchLivePlayers()
    setupSocket()
  }, [])

  useEffect(() => {
    filterPlayers()
  }, [players, selectedType, searchTerm])

  async function fetchLivePlayers() {
    try {
      setLoading(true)
      const res = await apiClient.getLivePlayers()
      const data = res.data as any
      setPlayers(Array.isArray(data) ? data : data?.players || [])
    } catch (error) {
      console.error('Error fetching live players:', error)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  function setupSocket() {
    try {
      const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
      const socket: Socket = io(socketUrl)

      socket.on('connect', () => {
        console.log('✅ Connected to live players')
        setSocketConnected(true)
        socket.emit('live-players:subscribe')
      })

      socket.on('live-players:snapshot', (data) => {
        setPlayers(data.players || [])
      })

      socket.on('live-players:update', (data) => {
        setPlayers(data.players || [])
      })

      socket.on('disconnect', () => {
        console.log('❌ Disconnected from live players')
        setSocketConnected(false)
      })

      return () => {
        socket.off('live-players:snapshot')
        socket.off('live-players:update')
        socket.disconnect()
      }
    } catch (error) {
      console.error('Socket setup error:', error)
    }
  }

  function filterPlayers() {
    let filtered = players
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.competitionType === selectedType)
    }
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.competitionName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredPlayers(filtered)
  }

  const typeLabel = {
    race: '🏁 Race',
    tournament: '🏆 Tournament',
    squadWar: '⚔️ Squad War',
    dailyChallenge: '📅 Daily Challenge'
  }

  const statusColor = {
    typing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    waiting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ready: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-purple-400" />
            Live Players
          </h1>
          <p className="text-gray-400 mt-1">{players.length} players actively competing</p>
        </div>
        <Badge className={socketConnected ? 'bg-green-500' : 'bg-red-500'}>
          {socketConnected ? '🟢 Live' : '🔴 Offline'}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {['all', 'race', 'tournament', 'squadWar', 'dailyChallenge'].map((type) => (
          <Button
            key={type}
            onClick={() => setSelectedType(type)}
            variant={selectedType === type ? 'default' : 'outline'}
            className={selectedType === type ? 'bg-purple-600' : ''}
            size="sm"
          >
            {type === 'all' ? '👥 All' : typeLabel[type as keyof typeof typeLabel]}
          </Button>
        ))}
      </div>

      <Input
        placeholder="Search by username or competition..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-slate-800 border-slate-700"
      />

      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Players ({filteredPlayers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading live players...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No active players right now</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 font-semibold text-gray-300">Player</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-300">Competition</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-300">Score</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-300">WPM</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-300">Accuracy</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr key={player.userId} className="border-b border-slate-800 hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-medium text-white">{player.username}</td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="text-gray-300 font-medium">{player.competitionName}</p>
                          <p className="text-xs text-gray-500">{typeLabel[player.competitionType as keyof typeof typeLabel]}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-blue-400">{player.score}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="flex items-center justify-center gap-1 text-yellow-400 font-semibold">
                          <Zap className="w-3 h-3" />
                          {player.wpm}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-green-400">
                        {player.accuracy.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge className={statusColor[player.status as keyof typeof statusColor]}>
                          {player.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
