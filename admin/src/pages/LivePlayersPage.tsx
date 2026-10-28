import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Zap, Activity, Trash2, Eye } from 'lucide-react'
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
  const [selectedPlayer, setSelectedPlayer] = useState<LivePlayer | null>(null)

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
      const res = await apiClient.getAdminLivePlayers()
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

  async function handleRemovePlayer(userId: string) {
    if (confirm('Remove this player from live tracking?')) {
      // Emit socket event to remove player
      console.log('Removing player:', userId)
    }
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
          <p className="text-muted-foreground mt-1">{players.length} players actively competing</p>
        </div>
        <Badge className={socketConnected ? 'bg-green-600' : 'bg-red-600'}>
          {socketConnected ? '🟢 Live' : '🔴 Offline'}
        </Badge>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {['all', 'race', 'tournament', 'squadWar', 'dailyChallenge'].map((type) => (
          <Button
            key={type}
            onClick={() => setSelectedType(type)}
            variant={selectedType === type ? 'default' : 'outline'}
            className={selectedType === type ? 'bg-purple-600 hover:bg-purple-700' : ''}
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
        className="bg-white border-gray-300"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Players ({filteredPlayers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading live players...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active players right now</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold">Player</th>
                    <th className="text-left py-2 px-3 font-semibold">User ID</th>
                    <th className="text-left py-2 px-3 font-semibold">Competition</th>
                    <th className="text-center py-2 px-3 font-semibold">Score</th>
                    <th className="text-center py-2 px-3 font-semibold">WPM</th>
                    <th className="text-center py-2 px-3 font-semibold">Accuracy</th>
                    <th className="text-center py-2 px-3 font-semibold">Status</th>
                    <th className="text-center py-2 px-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr key={player.userId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">{player.username}</td>
                      <td className="py-3 px-3 text-xs font-mono text-gray-600">{player.userId.slice(0, 8)}...</td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-medium">{player.competitionName}</p>
                          <p className="text-xs text-gray-600">{typeLabel[player.competitionType as keyof typeof typeLabel]}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-blue-600">{player.score}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="flex items-center justify-center gap-1 font-semibold text-amber-600">
                          <Zap className="w-3 h-3" />
                          {player.wpm}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-green-600">
                        {player.accuracy.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge className={statusColor[player.status as keyof typeof statusColor]}>
                          {player.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPlayer(player)}
                            title="View details"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemovePlayer(player.userId)}
                            title="Remove from tracking"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Details Panel */}
      {selectedPlayer && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedPlayer.username} - Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPlayer(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">User ID</p>
              <p className="font-mono text-sm">{selectedPlayer.userId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Competition</p>
              <p className="font-medium">{selectedPlayer.competitionName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium">{typeLabel[selectedPlayer.competitionType as keyof typeof typeLabel]}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={statusColor[selectedPlayer.status as keyof typeof statusColor]}>
                {selectedPlayer.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-xl font-bold text-blue-600">{selectedPlayer.score}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">WPM</p>
              <p className="text-xl font-bold text-amber-600">{selectedPlayer.wpm}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Accuracy</p>
              <p className="text-xl font-bold text-green-600">{selectedPlayer.accuracy.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Update</p>
              <p className="text-sm">{new Date(selectedPlayer.lastUpdate).toLocaleTimeString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
