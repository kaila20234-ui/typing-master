import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { X, Flame, Trophy } from 'lucide-react'
import { socketClient } from '@/lib/socket'
import axios from 'axios'
import type { Participant, Race } from '@/types/racing'

interface LiveRaceProps {
  roomId: string
  race: Race
  userId: string
  isTyping: boolean
  currentStats: {
    wpm: number
    accuracy: number
    characterCount: number
    timeElapsed: number
  }
  onFinish: (stats: any) => void
  onExit: () => void
}

export function LiveRace({
  roomId,
  race,
  userId,
  isTyping,
  currentStats,
  onExit,
}: LiveRaceProps) {
  const normalizeParticipants = (incomingParticipants: Array<{
    userId: string
    userCode?: string
    username: string
    profilePicture?: string
    wpm?: number
    accuracy?: number
    characterCount?: number
    raceStatus?: string
    position?: number
  }>): Participant[] => {
    return incomingParticipants.map((participant) => ({
      userId: participant.userId,
      userCode: participant.userCode ?? '',
      username: participant.username,
      profilePicture: participant.profilePicture,
      wpm: participant.wpm ?? 0,
      accuracy: participant.accuracy ?? 0,
      characterCount: participant.characterCount ?? 0,
      raceStatus: (participant.raceStatus === 'ready' || participant.raceStatus === 'typing' || participant.raceStatus === 'finished' || participant.raceStatus === 'waiting')
        ? participant.raceStatus
        : 'waiting',
      position: participant.position,
    }))
  }

  const [raceStatus, setRaceStatus] = useState('waiting') // waiting, countdown, in_progress, finished
  const [countdown, setCountdown] = useState(0)
  const [participants, setParticipants] = useState<Participant[]>(normalizeParticipants(race.participants as Array<{
    userId: string
    userCode?: string
    username: string
    profilePicture?: string
    wpm?: number
    accuracy?: number
    characterCount?: number
    raceStatus?: Participant['raceStatus']
    position?: number
  }>))
  const [raceFinished, setRaceFinished] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<'loading' | 'open' | 'closed'>('loading')
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | null>(null)
  const [registrationCountdown, setRegistrationCountdown] = useState<number | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    // Subscribe to race events
    socketClient.on('race:countdown', ({ count }) => {
      setCountdown(count)
      setRaceStatus('countdown')
    })

    socketClient.on('race:start', ({ participants: newParticipants }) => {
      setRaceStatus('in_progress')
      setCountdown(0)
      setParticipants(normalizeParticipants(newParticipants))
    })

    socketClient.on('race:progress', ({ participants: newParticipants }) => {
      setParticipants(normalizeParticipants(newParticipants))
    })

    socketClient.on('race:player_finished', ({ participants: newParticipants }) => {
      setParticipants(normalizeParticipants(newParticipants))
    })

    socketClient.on('race:results', ({ leaderboard }) => {
      setRaceStatus('finished')
      setRaceFinished(true)
      setParticipants(normalizeParticipants(leaderboard))
    })

    socketClient.on('race:error', ({ message }) => {
      alert('Race Error: ' + message)
      onExit()
    })

    return () => {
      // Clean up listeners
    }
  }, [onExit])

  // Send progress updates every 100ms while typing
  useEffect(() => {
    if (raceStatus === 'in_progress' && isTyping) {
      const interval = setInterval(() => {
        socketClient.sendProgress(
          roomId,
          currentStats.wpm,
          currentStats.accuracy,
          currentStats.characterCount
        )
      }, 100)

      return () => clearInterval(interval)
    }
  }, [roomId, raceStatus, isTyping, currentStats])

  // Fetch registration status and deadline
  useEffect(() => {
    async function fetchRegistrationStatus() {
      try {
        const res = await axios.get(`/api/races/${roomId}/registration-status`)
        setRegistrationStatus(res.data.registrationOpen ? 'open' : 'closed')
        setRegistrationDeadline(res.data.registrationDeadline ? new Date(res.data.registrationDeadline) : null)
      } catch (err) {
        setRegistrationStatus('closed')
        setRegistrationDeadline(null)
      }
    }
    fetchRegistrationStatus()
  }, [roomId])

  // Countdown timer for deadline
  useEffect(() => {
    if (!registrationDeadline) return
    const interval = setInterval(() => {
      const now = new Date()
      const diff = registrationDeadline.getTime() - now.getTime()
      setRegistrationCountdown(diff > 0 ? Math.floor(diff / 1000) : 0)
    }, 1000)
    return () => clearInterval(interval)
  }, [registrationDeadline])

  // Check if user is registered
  useEffect(() => {
    async function checkRegistration() {
      try {
        const res = await axios.get(`/api/races/admin/${roomId}/registrations`)
        setIsRegistered(res.data.registrations.some((reg: any) => reg.user._id === userId))
      } catch (err) {
        setIsRegistered(false)
      }
    }
    checkRegistration()
  }, [roomId, userId])

  const currentParticipant = participants.find(p => p.userId === userId)
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.raceStatus === 'finished' && b.raceStatus !== 'finished') return -1
    if (a.raceStatus !== 'finished' && b.raceStatus === 'finished') return 1
    return b.wpm - a.wpm
  })

  const getPositionBadge = (position?: number) => {
    if (!position) return null
    const badges = ['🥇', '🥈', '🥉']
    return position <= 3 ? badges[position - 1] : position.toString()
  }

  // Registration UI
  if (registrationStatus === 'loading') {
    return <div className="text-center py-12 text-slate-400">Loading registration status...</div>
  }
  if (registrationStatus === 'closed') {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <p className="text-xl text-red-400 mb-4">Registration Closed</p>
          {registrationDeadline && (
            <p className="text-sm text-slate-500">Registration deadline was: {registrationDeadline.toLocaleString()}</p>
          )}
        </CardContent>
      </Card>
    )
  }
  if (!isRegistered && registrationStatus === 'open') {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <p className="text-xl text-cyan-400 mb-4">Registration Open</p>
          {registrationDeadline && registrationCountdown !== null && registrationCountdown > 0 && (
            <p className="text-sm text-slate-500">Registration closes in: {Math.floor(registrationCountdown / 60)}m {registrationCountdown % 60}s</p>
          )}
          <Button
            className="mt-4 bg-cyan-600 hover:bg-cyan-700"
            onClick={async () => {
              try {
                await axios.post(`/api/races/${roomId}/register`)
                setIsRegistered(true)
              } catch (err: any) {
                alert('Registration failed: ' + (err.response?.data?.error || err.message))
              }
            }}
          >
            Register for Race
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Countdown / Status */}
      {raceStatus === 'countdown' && (
        <div className="text-center py-12">
          <div className="text-6xl font-bold text-cyan-400 animate-pulse">
            {countdown || 'GO!'}
          </div>
        </div>
      )}

      {raceStatus === 'waiting' && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <p className="text-xl text-slate-300 mb-4">
              ⏳ Waiting for players...
            </p>
            <p className="text-sm text-slate-500">
              {participants.length}/{race.maxParticipants} players connected
            </p>
          </CardContent>
        </Card>
      )}

      {/* Race Text with Character Highlighting */}
      {raceStatus !== 'waiting' && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-8">
            <div className="text-center text-xl leading-relaxed font-mono space-y-4">
              {race.text.split('').map((char, idx) => {
                let charClass = 'text-slate-400'
                if (idx < currentStats.characterCount) {
                  // Character already typed - check if correct
                  const isCorrect = race.text[idx] === char
                  charClass = isCorrect 
                    ? 'text-emerald-400 bg-emerald-900/20'
                    : 'text-red-400 bg-red-900/20'
                } else if (idx === currentStats.characterCount) {
                  // Current character
                  charClass = 'text-cyan-400 animate-pulse'
                }
                return (
                  <span key={idx} className={charClass}>
                    {char}
                  </span>
                )
              })}
            </div>
            <div className="mt-4 text-sm text-slate-500 text-center">
              {currentStats.characterCount}/{race.text.length} characters
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Participants Leaderboard */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-emerald-400 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Race Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedParticipants.map((participant) => (
            <div
              key={participant.userId}
              className={`p-4 rounded-lg border ${
                participant.userId === userId
                  ? 'bg-cyan-900/20 border-cyan-600/50'
                  : 'bg-slate-700/30 border-slate-600/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getPositionBadge(participant.position) && (
                    <span className="text-2xl">{getPositionBadge(participant.position)}</span>
                  )}
                  {participant.profilePicture ? (
                    <img
                      src={participant.profilePicture}
                      alt={participant.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{participant.username}</p>
                    <p className="text-xs text-purple-300 font-mono">{participant.userCode}</p>
                    <p className="text-xs text-slate-400">
                      {participant.characterCount}/{race.text.length} chars
                    </p>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-emerald-400">{Math.floor(participant.wpm)} WPM</p>
                  <p className="text-sm text-slate-400">{participant.accuracy}% acc</p>
                </div>

                {participant.raceStatus === 'finished' && (
                  <Badge className="ml-4 bg-emerald-600">Finished</Badge>
                )}
              </div>

              {/* Progress Bar */}
              <Progress
                value={(participant.characterCount / race.text.length) * 100}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Race Results */}
      {raceFinished && (
        <Card className="bg-gradient-to-br from-emerald-900/30 to-slate-800 border-emerald-700/50">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Race Finished! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-400">{currentStats.wpm}</p>
                <p className="text-sm text-slate-400 mt-1">WPM</p>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-3xl font-bold text-cyan-400">{currentStats.accuracy}%</p>
                <p className="text-sm text-slate-400 mt-1">Accuracy</p>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-400">#{currentParticipant?.position || '?'}</p>
                <p className="text-sm text-slate-400 mt-1">Position</p>
              </div>
            </div>

            <Button
              onClick={onExit}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              Back to Races
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Exit Button */}
      {raceStatus !== 'finished' && (
        <div className="flex justify-center">
          <Button
            onClick={onExit}
            variant="outline"
            className="border-slate-600"
          >
            <X className="w-4 h-4 mr-2" />
            Exit Race
          </Button>
        </div>
      )}
    </div>
  )
}
