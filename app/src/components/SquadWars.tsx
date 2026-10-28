import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trophy, Users, Sword, TrendingUp, UserPlus } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { CompetitionRegistrationModal } from '@/components/CompetitionRegistrationModal'
import type { Squad, SquadWar, SquadLeaderboard, SquadInvite } from '@/types/squad'

interface SquadWarsProps {
  userId?: string
  onBack?: () => void
}

const tierColors = {
  Bronze: 'bg-amber-900/30 border-amber-600 text-amber-300',
  Silver: 'bg-gray-700/30 border-gray-500 text-gray-300',
  Gold: 'bg-yellow-700/30 border-yellow-500 text-yellow-300',
  Platinum: 'bg-cyan-700/30 border-cyan-500 text-cyan-300',
  Diamond: 'bg-blue-700/30 border-blue-500 text-blue-300',
  Mythic: 'bg-purple-700/30 border-purple-500 text-purple-300',
}

const warStatusColors = {
  pending: 'bg-slate-900/30 border-slate-600',
  'in-progress': 'bg-purple-900/30 border-purple-600',
  completed: 'bg-emerald-900/30 border-emerald-600',
  cancelled: 'bg-red-900/30 border-red-600',
}

export function SquadWars({ userId, onBack }: SquadWarsProps) {
  const [activeTab, setActiveTab] = useState('browse')
  
  const [squads, setSquads] = useState<Squad[]>([])
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null)
  const [userSquads, setUserSquads] = useState<Squad[]>([])
  const [leaderboard, setLeaderboard] = useState<SquadLeaderboard | null>(null)
  const [activeWars, setActiveWars] = useState<SquadWar[]>([])
  const [invitations, setInvitations] = useState<SquadInvite[]>([])
  
  const [loading, setLoading] = useState(true)
  const [creatingSquad, setCreatingSquad] = useState(false)
  const [newSquadName, setNewSquadName] = useState('')
  const [newSquadDesc, setNewSquadDesc] = useState('')
  const [createdSquad, setCreatedSquad] = useState<Squad | null>(null)
  
  // Invite dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [selectedSquadForInvite, setSelectedSquadForInvite] = useState<Squad | null>(null)
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Registration modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [selectedSquadForRegistration, setSelectedSquadForRegistration] = useState<Squad | null>(null)
  const [selectedWarForRegistration, setSelectedWarForRegistration] = useState<SquadWar | null>(null)
  // Simple join confirmation for squads (not squad-war registrations)
  const [showJoinConfirm, setShowJoinConfirm] = useState(false)

  // Squad War ready states and countdowns
  const [readyStates, setReadyStates] = useState<{ [warId: string]: { squadA: boolean; squadB: boolean } }>({})
  const [countdowns, setCountdowns] = useState<{ [warId: string]: number }>({})

  useEffect(() => {
    loadInitialData()
  }, [activeTab])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'browse') {
        const result = await apiClient.getAvailableSquads(1, 20)
        if (result.data) {
          const data = result.data as any
          setSquads(Array.isArray(data) ? data : data.squads || [])
        }
      } else if (activeTab === 'mySquads') {
        const result = await apiClient.getUserSquads()
        if (result.data) {
          const data = result.data as any
          setUserSquads(Array.isArray(data) ? data : data.squads || [])
        }
        const invResult = await apiClient.getSquadInvitations()
        if (invResult.data) {
          const data = invResult.data as any
          setInvitations(Array.isArray(data) ? data : data.invites || [])
        }
      } else if (activeTab === 'leaderboard') {
        const result = await apiClient.getSquadLeaderboard(1, 50)
        if (result.data) {
          setLeaderboard(result.data as SquadLeaderboard)
        }
      } else if (activeTab === 'wars') {
        const result = await apiClient.getActiveSquadWars(20)
        if (result.data) {
          const data = result.data as any
          setActiveWars(Array.isArray(data) ? data : data.wars || [])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSquad = async () => {
    if (!newSquadName.trim()) return
    try {
      setCreatingSquad(true)
      const result = await apiClient.createSquad(newSquadName, newSquadDesc)
      if (result.data) {
        const squad = result.data as Squad
        setCreatedSquad(squad)
        setUserSquads([squad, ...userSquads])
        setNewSquadName('')
        setNewSquadDesc('')
        setSelectedSquadForInvite(squad)
        setShowInviteDialog(true)
      }
    } catch (error) {
      console.error('Error creating squad:', error)
    } finally {
      setCreatingSquad(false)
    }
  }

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await apiClient.acceptSquadInvite(inviteId)
      loadInitialData()
    } catch (error) {
      console.error('Error accepting invite:', error)
    }
  }

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await apiClient.rejectSquadInvite(inviteId)
      loadInitialData()
    } catch (error) {
      console.error('Error rejecting invite:', error)
    }
  }

  const handleSendInvite = async () => {
    if (!selectedSquadForInvite || !inviteUserId.trim()) return
    try {
      setInviteError('')
      setInviteSuccess('')
      setSendingInvite(true)
      const result = await apiClient.inviteUserToSquad(selectedSquadForInvite._id, inviteUserId, inviteMessage)
      if (result.data) {
        setInviteUserId('')
        setInviteMessage('')
        setInviteSuccess('Invite sent successfully!')
        setTimeout(() => {
          closeInviteDialog()
          setInviteSuccess('')
        }, 2000)
        loadInitialData()
      }
    } catch (error: any) {
      console.error('Error sending invite:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to send invite. Please check the user ID.'
      setInviteError(errorMessage)
    } finally {
      setSendingInvite(false)
    }
  }

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    try {
      setIsSearching(true)
      const result = await apiClient.searchUsers(query)
      if (result.data) {
        setSearchResults(result.data as any)
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const selectUserFromSearch = (user: any) => {
    setInviteUserId(user._id)
    setSearchQuery(user.username)
    setSearchResults([])
  }

  const openInviteDialog = (squad: Squad) => {
    setSelectedSquadForInvite(squad)
    setInviteUserId('')
    setInviteMessage('')
    setSearchQuery('')
    setSearchResults([])
    setShowInviteDialog(true)
  }

  const closeInviteDialog = () => {
    setShowInviteDialog(false)
    setSelectedSquadForInvite(null)
    setInviteUserId('')
    setInviteMessage('')
    setInviteError('')
    setInviteSuccess('')
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRequestToJoinSquad = (squad: Squad) => {
    // For normal squad join (not a squad-war registration) show a simple confirmation
    setSelectedSquadForRegistration(squad)
    setShowJoinConfirm(true)
  }

  const handleConfirmJoin = async () => {
    if (!selectedSquadForRegistration) return
    try {
      await apiClient.requestSquadJoin(selectedSquadForRegistration._id)
      // refresh data and close dialogs
      setShowJoinConfirm(false)
      setSelectedSquadForRegistration(null)
      loadInitialData()
    } catch (error) {
      console.error('Error requesting to join squad:', error)
      alert('Failed to send join request. Please try again.')
    }
  }

  const handleReady = async (warId: string, squad: 'A' | 'B') => {
    try {
      // Find the user's squad that's in this war
      const userSquadInWar = userSquads.find(s => {
        if (squad === 'A') {
          return s._id && activeWars.find(w => w._id === warId)?.squadA?.squadId === s._id
        } else {
          return s._id && activeWars.find(w => w._id === warId)?.squadB?.squadId === s._id
        }
      })

      if (!userSquadInWar) {
        console.error('User squad not found in this war')
        return
      }

      // Call API to set squad as ready
      await apiClient.setSquadReady(warId, userSquadInWar._id)

      // Update local state
      setReadyStates(prev => ({
        ...prev,
        [warId]: { ...(prev[warId] || { squadA: false, squadB: false }), [squad === 'A' ? 'squadA' : 'squadB']: true }
      }))

      // Start countdown if both are ready
      const updatedReady = { ...(readyStates[warId] || { squadA: false, squadB: false }), [squad === 'A' ? 'squadA' : 'squadB']: true }
      if (updatedReady.squadA && updatedReady.squadB) {
        let countdown = 5
        setCountdowns(prev => ({ ...prev, [warId]: countdown }))
        const interval = setInterval(() => {
          countdown--
          setCountdowns(prev => ({ ...prev, [warId]: countdown }))
          if (countdown <= 0) {
            clearInterval(interval)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Error setting squad ready:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sword className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold">Squad Wars</h2>
        </div>
        {onBack && <Button onClick={onBack} variant="outline">Back</Button>}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Squads
          </TabsTrigger>
          <TabsTrigger value="mySquads" className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            My Squads
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="wars" className="flex items-center gap-1">
            <Sword className="w-4 h-4" />
            Wars
          </TabsTrigger>
        </TabsList>

        {/* Browse Squads Tab */}
        <TabsContent value="browse" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-8 text-gray-400">Loading squads...</div>
            ) : squads.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">No squads available</div>
            ) : (
              squads.map((squad, index) => (
                <Card key={squad._id || `squad-${index}`} className="border border-slate-700 bg-slate-900/50 cursor-pointer hover:border-purple-500 transition" onClick={() => setSelectedSquad(squad)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{squad.name}</CardTitle>
                        <p className="text-sm text-gray-400 mt-1">{squad.description}</p>
                      </div>
                      <Badge className={`${tierColors[squad.tier as keyof typeof tierColors]} border`}>{squad.tier}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Members: {squad.members?.length || 0}/{squad.maxMembers}</span>
                      <span className="text-purple-400 font-semibold">⭐ {(squad.squadRating || 0).toFixed(0)}</span>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-400">
                      <span>🏆 {squad.stats?.wins || 0}W</span>
                      <span>📉 {squad.stats?.losses || 0}L</span>
                      <span>📊 {Number(squad.stats?.winRate || 0).toFixed(1)}%</span>
                    </div>
                    <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" size="sm">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Squad Details Modal-like View */}
          {selectedSquad && (
            <Card className="border border-purple-600 bg-slate-900">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedSquad.name}</CardTitle>
                    <p className="text-sm text-gray-400 mt-2">{selectedSquad.description}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedSquad(null)}>✕</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Members</p>
                    <p className="text-xl font-bold">{selectedSquad.members?.length || 0}/{selectedSquad.maxMembers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Rating</p>
                    <p className="text-xl font-bold text-purple-400">⭐ {(selectedSquad.squadRating || 0).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <p className="text-xl font-bold text-emerald-400">{Number(selectedSquad.stats?.winRate || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Points</p>
                    <p className="text-xl font-bold text-blue-400">{selectedSquad.stats?.totalPoints || 0}</p>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <p className="text-sm font-semibold mb-3">Members</p>
                  <div className="space-y-2">
                    {selectedSquad.members?.map((member, index) => (
                      <div key={member.userId || `member-${index}`} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                        <span>{member.username || 'Unknown'}</span>
                        <Badge variant="outline" className="text-xs">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleRequestToJoinSquad(selectedSquad)}>
                  Request to Join
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Squads Tab */}
        <TabsContent value="mySquads" className="space-y-4">
          <Card className="border border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle>Create New Squad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="text"
                placeholder="Squad Name"
                value={newSquadName}
                onChange={(e) => setNewSquadName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <textarea
                placeholder="Squad Description (optional)"
                value={newSquadDesc}
                onChange={(e) => setNewSquadDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 h-20 resize-none"
              />
              <Button onClick={handleCreateSquad} disabled={creatingSquad || !newSquadName.trim()} className="w-full bg-purple-600 hover:bg-purple-700">
                {creatingSquad ? 'Creating...' : 'Create Squad'}
              </Button>
              {createdSquad && (
                <Button onClick={() => openInviteDialog(createdSquad)} className="w-full bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Members to {createdSquad.name}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Invitations */}
          {invitations.length > 0 && (
            <Card className="border border-blue-600/50 bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-lg">Pending Invitations ({invitations.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invitations.map((invite, index) => (
                  <div key={invite._id || `invite-${index}`} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                    <div>
                      <p className="font-semibold">{invite.squad.name}</p>
                      <p className="text-sm text-gray-400">Leader: {invite.squad.leader.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRejectInvite(invite._id)}>
                        Reject
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAcceptInvite(invite._id)}>
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* User's Squads */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Your Squads</h3>
            {loading ? (
              <div className="text-center py-4 text-gray-400">Loading squads...</div>
            ) : userSquads.length === 0 ? (
              <div className="text-center py-4 text-gray-400">You haven't joined any squads yet</div>
            ) : (
              userSquads.map((squad, index) => (
                <Card key={squad._id || `userSquad-${index}`} className="border border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{squad.name}</CardTitle>
                        <Badge className={`mt-2 ${tierColors[squad.tier as keyof typeof tierColors]} border`}>{squad.tier}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Rating</p>
                        <p className="text-xl font-bold text-purple-400">⭐ {(squad.squadRating || 0).toFixed(0)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Members: {squad.members?.length || 0}/{squad.maxMembers}</span>
                      <div className="flex gap-2">
                        <span>🏆 {squad.stats?.wins || 0}W</span>
                        <span>📉 {squad.stats?.losses || 0}L</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => openInviteDialog(squad)}>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Invite Members
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">Manage</Button>
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">Start War</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading leaderboard...</div>
          ) : leaderboard && leaderboard.squads.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.squads.map((squad, idx) => (
                <Card key={squad._id || `leaderboard-${idx}`} className="border border-slate-700 bg-slate-900/50">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-purple-400 w-8 text-center">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </div>
                        <div>
                          <p className="font-semibold">{squad.name}</p>
                          <p className="text-sm text-gray-400">{squad.leader.username}'s Squad</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Rating</p>
                          <p className="text-xl font-bold text-purple-400">⭐ {(squad.squadRating || 0).toFixed(0)}</p>
                        </div>
                        <div className="text-right mr-2">
                          <Badge className={`${tierColors[squad.tier as keyof typeof tierColors]} border`}>{squad.tier}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No squads in leaderboard</div>
          )}
        </TabsContent>

        {/* Wars Tab */}
        <TabsContent value="wars" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading wars...</div>
          ) : activeWars.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No active squad wars</div>
          ) : (
            activeWars.map((war, index) => {
              const ready = readyStates[war._id] || { squadA: false, squadB: false }
              const countdown = countdowns[war._id] || null
              return (
                <Card key={war._id || `war-${index}`} className={`border ${warStatusColors[war.status]}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{war.title}</CardTitle>
                        <p className="text-sm text-gray-400 mt-1">Entry Fee: ${(war.entryFee || 5.00).toFixed(2)} USD</p>
                        {war.registrationDeadline && (
                          <p className="text-xs text-gray-500 mt-1">
                            Registration Deadline: {new Date(war.registrationDeadline).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{war.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="font-semibold">{war.squadA.name}</p>
                        <p className="text-2xl font-bold text-purple-400 mt-1">{war.squadA.score}</p>
                        {war.status === 'pending' && !ready.squadA && (
                          <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700" onClick={() => handleReady(war._id, 'A')}>Ready</Button>
                        )}
                        {war.status === 'pending' && ready.squadA && <span className="block mt-2 text-green-500 font-bold">Ready!</span>}
                      </div>
                      <div className="text-center flex items-center justify-center">
                        <Sword className="w-5 h-5 text-gray-400" />
                        {war.status === 'pending' && ready.squadA && ready.squadB && countdown !== null && countdown > 0 && (
                          <span className="ml-2 text-yellow-400 font-bold text-lg">Countdown: {countdown}</span>
                        )}
                        {war.status === 'pending' && ready.squadA && ready.squadB && countdown === 0 && (
                          <span className="ml-2 text-purple-500 font-bold text-lg">War Started!</span>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{war.squadB.name}</p>
                        <p className="text-2xl font-bold text-blue-400 mt-1">{war.squadB.score}</p>
                        {war.status === 'pending' && !ready.squadB && (
                          <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700" onClick={() => handleReady(war._id, 'B')}>Ready</Button>
                        )}
                        {war.status === 'pending' && ready.squadB && <span className="block mt-2 text-green-500 font-bold">Ready!</span>}
                      </div>
                    </div>
                    {war.status === 'completed' && war.winner && (
                      <div className="text-center pt-2 border-t border-slate-700">
                        <p className="text-sm text-gray-400 mb-1">Winner</p>
                        <p className="font-semibold text-lg text-yellow-400">
                          {war.winner === 'squadA' ? war.squadA.name : war.winner === 'squadB' ? war.squadB.name : 'Draw'}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {war.status === 'pending' && (
                        <>
                          {userSquads.map(squad => {
                            const isSquadRegistered = war.registrations?.some(r => r.squadId === squad._id);
                            const isSquadInWar = war.squadA?.squadId === squad._id || war.squadB?.squadId === squad._id;
                            
                            if (!isSquadInWar && !isSquadRegistered) {
                              return (
                                <Button 
                                  key={squad._id}
                                  size="sm" 
                                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                                  onClick={() => {
                                    setSelectedSquadForRegistration(squad)
                                    setSelectedWarForRegistration(war)
                                    setShowRegistrationModal(true)
                                  }}
                                >
                                  Register {squad.name}
                                </Button>
                              );
                            }
                            return null;
                          })}
                        </>
                      )}
                      <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={closeInviteDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Invite Members to {selectedSquadForInvite?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Search for users by username or enter their user ID to send an invite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {inviteError && (
              <div className="p-3 bg-red-900/30 border border-red-600 rounded text-red-300 text-sm">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="p-3 bg-emerald-900/30 border border-emerald-600 rounded text-emerald-300 text-sm">
                {inviteSuccess}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-white text-sm">Search User by Username</label>
              <input
                type="text"
                placeholder="Search username..."
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {isSearching && <p className="text-xs text-blue-300">Searching users...</p>}
              {searchResults.length > 0 && (
                <div className="bg-slate-800 border border-slate-600 rounded max-h-40 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => selectUserFromSearch(user)}
                      className="p-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
                    >
                      <p className="text-white text-sm font-medium">{user.username}</p>
                      <p className="text-gray-400 text-xs">{user.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">
                Selected User: {inviteUserId ? <span className="text-blue-400">{searchQuery || inviteUserId}</span> : <span className="text-gray-400">None</span>}
              </label>
              {!inviteUserId && (
                <p className="text-xs text-gray-400">
                  Or paste user ID directly:
                </p>
              )}
              {!inviteUserId && (
                <input
                  type="text"
                  placeholder="Enter user ID manually"
                  onChange={(e) => {
                    setInviteUserId(e.target.value)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">Message (optional)</label>
              <textarea
                placeholder="Add a personal message..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 h-20 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeInviteDialog} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSendInvite} 
                disabled={sendingInvite || !inviteUserId.trim() || !selectedSquadForInvite}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {sendingInvite ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Simple Join Confirmation Dialog (for requesting to join a squad) */}
      <Dialog open={showJoinConfirm} onOpenChange={(open) => { if (!open) { setShowJoinConfirm(false); setSelectedSquadForRegistration(null) } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Request to Join Squad</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedSquadForRegistration ? `Send a join request to ${selectedSquadForRegistration.name}?` : 'Send a join request?'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-xs text-gray-400">A request will be sent to the squad leaders. They must approve your membership.</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowJoinConfirm(false); setSelectedSquadForRegistration(null) }} className="flex-1">Cancel</Button>
              <Button onClick={handleConfirmJoin} className="flex-1 bg-purple-600 hover:bg-purple-700">Send Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Modal for Squad Joining and Squad War Registration */}
      {selectedSquadForRegistration && selectedWarForRegistration && (
        <CompetitionRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => {
            setShowRegistrationModal(false)
            setSelectedSquadForRegistration(null)
            setSelectedWarForRegistration(null)
          }}
          competitionId={selectedWarForRegistration._id}
          competitionName={selectedWarForRegistration.title}
          competitionType="squad-war"
          entryFee={selectedWarForRegistration.entryFee || 5.00}
          currency="USD"
          onRegistrationSuccess={() => {
            loadInitialData()
            setShowRegistrationModal(false)
            setSelectedSquadForRegistration(null)
            setSelectedWarForRegistration(null)
          }}
          onRegistrationError={(error) => console.error('Registration error:', error)}
          userId={userId || ''}
          username={selectedSquadForRegistration.name}
          squadId={selectedSquadForRegistration._id}
        />
      )}
    </div>
  )
}
