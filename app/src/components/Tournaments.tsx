import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users } from 'lucide-react'
import { apiClient } from '@/lib/api'
import type { Tournament, TournamentLeaderboard } from '@/types/tournament'
import { CompetitionRegistrationModal } from '@/components/CompetitionRegistrationModal'

interface TournamentProps {
  userId?: string
  isAdmin?: boolean
  onBack?: () => void
}

const statusColors = {
  pending: 'bg-slate-900/30 border-slate-600',
  registration: 'bg-blue-900/30 border-blue-600',
  'in-progress': 'bg-purple-900/30 border-purple-600',
  completed: 'bg-emerald-900/30 border-emerald-600',
  cancelled: 'bg-red-900/30 border-red-600',
}

const typeLabels = {
  'single-elimination': '🔥 Single Elimination',
  'double-elimination': '⭐ Double Elimination',
  'round-robin': '🔄 Round Robin',
}

export function Tournaments({ userId, isAdmin = false, onBack }: TournamentProps) {
  const [activeTab, setActiveTab] = useState('browse')
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [leaderboard, setLeaderboard] = useState<TournamentLeaderboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRegistered, setUserRegistered] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    setLoading(true)
    try {
      const result = await apiClient.getAvailableTournaments()
      if (result.data) {
        const data = result.data as any
        setTournaments(Array.isArray(data) ? data : data.tournaments || [])
      }
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTournamentDetails = async (tournamentId: string) => {
    try {
      const [tourRes, leaderRes] = await Promise.all([
        apiClient.getTournament(tournamentId),
        apiClient.getTournamentLeaderboard(tournamentId),
      ])

      if (tourRes.data) {
        setSelectedTournament(tourRes.data as Tournament)
        
        // Check if user is registered
        const isRegistered = (tourRes.data as Tournament).participants?.some(
          (p) => p.userId === userId
        ) ?? false
        setUserRegistered(isRegistered)
      }

      if (leaderRes.data) {
        setLeaderboard(leaderRes.data as TournamentLeaderboard)
      }

    } catch (error) {
      console.error('Error loading tournament details:', error)
    }
  }

  const handleRegister = async () => {
    if (!selectedTournament) return;
    // All tournaments require payment: always open payment modal
    setShowRegistrationModal(true);
  }

  const handleRegistrationSuccess = async (_registrationId: string) => {
    // Refresh tournament details after successful registration
    if (selectedTournament) {
      await loadTournamentDetails(selectedTournament._id)
      setShowRegistrationModal(false)
    }
  }

  const renderTournamentCard = (tournament: Tournament) => (
    <div
      key={tournament._id}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-purple-500 ${
        statusColors[tournament.status as keyof typeof statusColors]
      }`}
      onClick={() => {
        loadTournamentDetails(tournament._id)
        setActiveTab('details')
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{tournament.name}</h3>
          <p className="text-sm text-slate-400">{typeLabels[tournament.type as keyof typeof typeLabels]}</p>
        </div>
        <Badge className="capitalize">{tournament.status}</Badge>
      </div>

      <p className="text-sm text-slate-400 mb-3">{tournament.description}</p>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-slate-800/50 p-2 rounded text-center">
          <p className="text-cyan-400 font-bold">{tournament.participants?.length ?? 0}</p>
          <p className="text-xs text-slate-400">Registered</p>
        </div>
        <div className="bg-slate-800/50 p-2 rounded text-center">
          <p className="text-emerald-400 font-bold">{tournament.maxParticipants ?? 'N/A'}</p>
          <p className="text-xs text-slate-400">Max</p>
        </div>
        <div className="bg-slate-800/50 p-2 rounded text-center">
          <p className="text-yellow-400 font-bold">{tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'}</p>
          <p className="text-xs text-slate-400">Start</p>
        </div>
      </div>
    </div>
  )

  const renderLeaderboard = () => {
    if (!leaderboard) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3 text-sm text-slate-400 mb-4 px-3">
          <p>Rank</p>
          <p>Player</p>
          <p>Record</p>
          <p>Score</p>
        </div>

        {leaderboard.leaderboard.map((entry, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30"
          >
            <div className="grid grid-cols-4 gap-3 flex-1 items-center">
              <div className="text-center">
                {idx < 3 ? (
                  <span className="text-2xl">{['🥇', '🥈', '🥉'][idx]}</span>
                ) : (
                  <span className="font-bold text-slate-400">#{idx + 1}</span>
                )}
              </div>
              <div>
                <p className="font-medium text-white truncate">{entry.username}</p>
                <p className="text-xs text-slate-400">{entry.userCode}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-400">{entry.wins}W</p>
                <p className="text-xs text-red-400">{entry.losses}L</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-400">{entry.totalScore}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center text-sm text-slate-400 mt-4">
          {leaderboard.completedMatches} of {leaderboard.totalMatches} matches completed
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button
          onClick={onBack}
          variant="outline"
          className="border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
        >
          ← Back
        </Button>
      )}

      {isAdmin && (
        <div className="rounded border border-amber-500/40 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">
          Admin mode enabled
        </div>
      )}

      {/* Navigation Tabs: Browse, Details, Leaderboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">🏆 Browse Tournaments</TabsTrigger>
          {selectedTournament && <TabsTrigger value="details">📋 Tournament Details</TabsTrigger>}
          {selectedTournament && <TabsTrigger value="leaderboard">📊 Leaderboard</TabsTrigger>}
          <TabsTrigger value="completed">✓ Completed</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          {loading ? (
            <p className="text-center text-slate-400 py-8">Loading tournaments...</p>
          ) : tournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map(renderTournamentCard)}
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Trophy className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400">No tournaments available at the moment.</p>
                <p className="text-sm text-slate-500 mt-2">Check back soon!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        {selectedTournament && (
          <TabsContent value="details" className="space-y-6">
            {/* Tournament Header */}
            <Card className={`border ${statusColors[selectedTournament.status as keyof typeof statusColors]}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl">{selectedTournament.name}</CardTitle>
                    <p className="text-slate-400 mt-2">{selectedTournament.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-400 capitalize">{selectedTournament.status}</p>
                    <p className="text-sm text-slate-400">{typeLabels[selectedTournament.type as keyof typeof typeLabels]}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-cyan-400">{selectedTournament.participants?.length ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Registered</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-emerald-400">{selectedTournament.maxParticipants ?? 'N/A'}</p>
                    <p className="text-xs text-slate-400 mt-1">Max Players</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-400">{selectedTournament.bracket?.length ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Matches</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {selectedTournament.prizePool.totalReward > 0 ? selectedTournament.prizePool.totalReward : '—'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Prize Pool</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration / Info with debug output */}
            {selectedTournament.status === 'registration' && !userRegistered && userId && (
              <Card className="bg-blue-900/20 border-blue-600/50">
                <CardContent className="p-6 text-center">
                  <p className="text-blue-300 mb-2">This tournament requires payment</p>
                  <p className="text-sm text-blue-400 mb-2">Entry Fee: ${selectedTournament.entryFee ? selectedTournament.entryFee.toFixed(2) : 'N/A'}</p>
                  <p className="text-xs text-blue-300 mb-3">Spots Available: {Math.max(0, selectedTournament.maxParticipants - (selectedTournament.participants?.length || 0))} of {selectedTournament.maxParticipants}</p>
                  {selectedTournament.startDate && (
                    <p className="text-xs text-slate-300 mb-3">
                      📅 Tournament Starts: {new Date(selectedTournament.startDate).toLocaleString()}
                    </p>
                  )}
                  <Button
                    onClick={handleRegister}
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                    disabled={selectedTournament.participants?.length >= selectedTournament.maxParticipants}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Register to Pay
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedTournament.status === 'in-progress' && !userRegistered && (
              <Card className="bg-amber-900/20 border-amber-600/50">
                <CardContent className="p-4 text-center">
                  <p className="text-amber-300 font-semibold">⚠️ Registration is closed</p>
                  <p className="text-xs text-amber-400 mt-1">The tournament has started. Bracket is now locked.</p>
                </CardContent>
              </Card>
            )}

            {userRegistered && (
              <Card className="bg-emerald-900/20 border-emerald-600/50">
                <CardContent className="p-4 text-center">
                  <p className="text-emerald-300 font-semibold">✓ You are registered for this tournament</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Leaderboard Tab */}
        {selectedTournament && (
          <TabsContent value="leaderboard" className="space-y-6">
            {renderLeaderboard()}
          </TabsContent>
        )}

        {/* Completed Tournaments Tab */}
        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <p className="text-center text-slate-400 py-8">Loading tournaments...</p>
          ) : tournaments.filter(t => t.status === 'completed' || t.status === 'cancelled').length > 0 ? (
            <div className="space-y-4">
              {tournaments.filter(t => t.status === 'completed' || t.status === 'cancelled').map(tournament => (
                <Card key={tournament._id} className={`border ${tournament.status === 'completed' ? 'border-emerald-600' : 'border-red-600'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{tournament.name}</CardTitle>
                        <p className="text-sm text-slate-400 mt-1">{tournament.description}</p>
                      </div>
                      <Badge className={tournament.status === 'completed' ? 'bg-emerald-600' : 'bg-red-600'}>
                        {tournament.status === 'completed' ? '✓ Completed' : '✗ Cancelled'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-slate-800/50 p-2 rounded text-center">
                        <p className="text-xs text-slate-400">Participants</p>
                        <p className="font-bold text-yellow-400">{tournament.participants?.length || 0}</p>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded text-center">
                        <p className="text-xs text-slate-400">Matches</p>
                        <p className="font-bold text-purple-400">{tournament.bracket?.length || 0}</p>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded text-center">
                        <p className="text-xs text-slate-400">Prize Pool</p>
                        <p className="font-bold text-cyan-400">${tournament.prizePool?.totalReward || 0}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setSelectedTournament(tournament)
                        setActiveTab('leaderboard')
                      }}
                    >
                      View Results
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Trophy className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400">No completed tournaments yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Registration Modal for Paid Tournaments */}
      {selectedTournament && (
        <CompetitionRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          competitionId={selectedTournament._id}
          competitionName={selectedTournament.name}
          competitionType="tournament"
          entryFee={selectedTournament.entryFee || 5.00}
          currency="USD"
          onRegistrationSuccess={handleRegistrationSuccess}
          onRegistrationError={(error) => console.error('Registration error:', error)}
          userId={userId}
          username="Tournament Player"
        />
      )}
    </div>
  )
}
