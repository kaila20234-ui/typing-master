import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Copy, Play, Users, Zap, Trophy } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { socketClient } from '@/lib/socket'
import { getRandomWordsPreview } from '@/lib/wordList'
import { CompetitionRegistrationModal } from '@/components/CompetitionRegistrationModal'
import type { Race, Invitation } from '@/types/racing'

interface RaceHubProps {
  userId: string
  username: string
  profilePicture?: string
  onRaceStart?: (roomId: string) => void
  hideCreateTab?: boolean
}

export function RaceHub({ userId, username, profilePicture, onRaceStart, hideCreateTab = false }: RaceHubProps) {
  const [activeTab, setActiveTab] = useState(hideCreateTab ? 'join' : 'create')
  const [createLoading, setCreateLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [activeRaces, setActiveRaces] = useState<Race[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([])
  const [showInviteCode, setShowInviteCode] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteCodeInput, setInviteCodeInput] = useState('')

  // Registration modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [selectedRaceForRegistration, setSelectedRaceForRegistration] = useState<Race | null>(null)
  const [raceEntryFee] = useState(5.00) // Default entry fee for races

  // Form states
  const [raceText, setRaceText] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [maxPlayers, setMaxPlayers] = useState('4')
  const [raceType, setRaceType] = useState<'passage' | 'random'>('passage')
  const [randomWordsPreview, setRandomWordsPreview] = useState('')

  // Load active races and invitations
  useEffect(() => {
    loadActiveRaces()
    loadInvitations()

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      loadActiveRaces()
      loadInvitations()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Update random words preview when difficulty or race type changes
  useEffect(() => {
    if (raceType === 'random') {
      setRandomWordsPreview(getRandomWordsPreview({ difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced' }))
    }
  }, [difficulty, raceType])

  const loadActiveRaces = async () => {
    const result = await apiClient.getActiveRaces()
    if (result.data) {
      setActiveRaces(result.data as Race[])
    }
  }

  const loadInvitations = async () => {
    const result = await apiClient.getPendingInvitations()
    if (result.data) {
      setPendingInvitations(result.data as Invitation[])
    }
  }

  const handleCreateRace = async () => {
    if (raceType === 'passage' && !raceText.trim()) {
      alert('Please enter race text or select Random Words mode')
      return
    }

    setCreateLoading(true)
    const result = await apiClient.createRace(
      raceText,
      difficulty,
      parseInt(maxPlayers),
      undefined,
      raceType
    )

    if (result.error) {
      alert('Error creating race: ' + result.error)
    } else if (result.data) {
      setInviteCode((result.data as Race).roomId)
      setShowInviteCode(true)
      setRaceText('')
      setRaceType('passage')

      // Connect to socket and join race
      socketClient.connect()
      socketClient.joinRace((result.data as Race).roomId, userId, username, profilePicture)

      // Auto-navigate to race after a short delay
      setTimeout(() => {
        if (onRaceStart) {
          onRaceStart((result.data as Race).roomId)
        }
      }, 1000)
    }

    setCreateLoading(false)
  }

  const handleJoinRace = (race: Race) => {
    // Show registration modal instead of directly joining
    setSelectedRaceForRegistration(race)
    setShowRegistrationModal(true)
  }

  const handleRegistrationSuccess = async () => {
    if (!selectedRaceForRegistration) return

    // After successful registration, join the race
    setJoinLoading(true)
    const result = await apiClient.joinRace(selectedRaceForRegistration.roomId)

    if (result.error) {
      alert('Error joining race: ' + result.error)
    } else if (result.data) {
      // Connect to socket and join race
      socketClient.connect()
      socketClient.joinRace(selectedRaceForRegistration.roomId, userId, username, profilePicture)

      // Navigate to race
      if (onRaceStart) {
        onRaceStart(selectedRaceForRegistration.roomId)
      }
    }

    setJoinLoading(false)
  }

  const handleJoinByCode = async () => {
    if (!inviteCodeInput.trim()) {
      alert('Please enter a race code')
      return
    }

    const result = await apiClient.getRace(inviteCodeInput.trim())
    if (result.error || !result.data) {
      alert('Unable to find race: ' + (result.error || 'Race not found'))
      return
    }

    setSelectedRaceForRegistration(result.data as Race)
    setShowRegistrationModal(true)
    setInviteCodeInput('')
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    const result = await apiClient.acceptInvitation(invitationId)
    if (result.error) {
      alert('Error accepting invitation: ' + result.error)
    } else {
      await loadInvitations()
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    const result = await apiClient.declineInvitation(invitationId)
    if (result.error) {
      alert('Error declining invitation: ' + result.error)
    } else {
      await loadInvitations()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode)
    alert('Invite code copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card className="bg-emerald-900/20 border-emerald-700/50">
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvitations.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium">{inv.from} invited you to a race</p>
                  {inv.message && <p className="text-sm text-slate-400">{inv.message}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvitation(inv._id!)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineInvitation(inv._id!)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Race Hub */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${hideCreateTab ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {!hideCreateTab && <TabsTrigger value="create">Create Race</TabsTrigger>}
          <TabsTrigger value="join">Join Race</TabsTrigger>
          <TabsTrigger value="active">Active Races</TabsTrigger>
        </TabsList>

        {/* Create Race Tab */}
        {!hideCreateTab && (
          <TabsContent value="create" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-cyan-400" />
                Create a New Race
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Race Type Selection */}
              <div className="space-y-3">
                <Label className="text-slate-300">Race Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="raceType"
                      value="passage"
                      checked={raceType === 'passage'}
                      onChange={(e) => setRaceType(e.target.value as 'passage' | 'random')}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-slate-300">Passage Mode</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="raceType"
                      value="random"
                      checked={raceType === 'random'}
                      onChange={(e) => setRaceType(e.target.value as 'passage' | 'random')}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-slate-300">Random Words</span>
                  </label>
                </div>
              </div>

              {/* Passage Mode - Text Input */}
              {raceType === 'passage' ? (
                <div className="space-y-2">
                  <Label className="text-slate-300">Enter Text</Label>
                  <textarea
                    value={raceText}
                    onChange={(e) => setRaceText(e.target.value)}
                    placeholder="Enter the text players will type..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 min-h-24 resize-none"
                  />
                  <p className="text-xs text-slate-400">
                    {raceText.length} characters
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-slate-300">Random Words Preview</Label>
                  <div className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white min-h-24 text-slate-300">
                    {randomWordsPreview}
                  </div>
                  <p className="text-xs text-slate-400">
                    Random words will be generated based on difficulty level
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Difficulty</Label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Max Players</Label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white"
                  >
                    <option value="2">2 Players</option>
                    <option value="4">4 Players</option>
                    <option value="10">10 Players</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleCreateRace}
                disabled={createLoading || (raceType === 'passage' && !raceText.trim())}
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
              >
                {createLoading ? 'Creating...' : 'Create Race'}
              </Button>
            </CardContent>
          </Card>
          </TabsContent>
        )}

        {/* Join Race Tab */}
        <TabsContent value="join" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Join a Race
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Enter Invite Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g., RACE_ABCD1234"
                    className="bg-slate-700 border-slate-600"
                  />
                  <Button
                    onClick={handleJoinByCode}
                    disabled={joinLoading || !inviteCodeInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Join
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800 text-slate-400">or browse active races</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Races Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Available Races ({activeRaces.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeRaces.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No active races available. Create one to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {activeRaces.map((race) => (
                    <div
                      key={race.roomId}
                      className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-white font-medium truncate">
                              {race.text.substring(0, 50)}...
                            </p>
                            <Badge className="bg-cyan-600">{race.difficulty}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {race.participants.length}/{race.maxParticipants}
                            </span>
                            <span className="text-cyan-400">{race.roomId}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleJoinRace(race)}
                          disabled={joinLoading || race.participants.length >= race.maxParticipants}
                          className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Code Dialog */}
      <Dialog open={showInviteCode} onOpenChange={setShowInviteCode}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Share Your Race</DialogTitle>
            <DialogDescription>
              Send this code to friends to invite them to your race
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={inviteCode}
                readOnly
                className="bg-slate-700 border-slate-600 font-mono"
              />
              <Button
                onClick={copyToClipboard}
                size="icon"
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-slate-400">
              Waiting for players to join... The race will start when everyone is ready.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Competition Registration Modal */}
      {selectedRaceForRegistration && (
        <CompetitionRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => {
            setShowRegistrationModal(false)
            setSelectedRaceForRegistration(null)
          }}
          competitionId={selectedRaceForRegistration.roomId}
          competitionName={`Race: ${selectedRaceForRegistration.text.substring(0, 30)}...`}
          competitionType="race"
          entryFee={raceEntryFee}
          onRegistrationSuccess={handleRegistrationSuccess}
          userId={userId}
          username={username}
        />
      )}
    </div>
  )
}
