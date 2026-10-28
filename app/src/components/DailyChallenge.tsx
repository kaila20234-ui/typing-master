import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TestArea, type TestState } from '@/components/TestArea'
import { Trophy, Zap, Target } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { CompetitionRegistrationModal } from '@/components/CompetitionRegistrationModal'
import type { DailyChallenge as DailyChallengeType, DailyChallengeLeaderboard, UserDailyPerformance, DailyChallengeSubmitResult } from '@/types/dailyChallenge'

interface DailyChallengeProps {
  userId?: string
  username?: string
  onBack?: () => void
}

const difficultyColors = {
  beginner: 'bg-emerald-900/30 border-emerald-600',
  intermediate: 'bg-blue-900/30 border-blue-600',
  advanced: 'bg-red-900/30 border-red-600',
}

const difficultyIcons = {
  beginner: '🟢',
  intermediate: '🟡',
  advanced: '🔴',
}

export function DailyChallenge({ userId, onBack }: DailyChallengeProps) {
  const [challenge, setChallenge] = useState<DailyChallengeType | null>(null)
  const [leaderboard, setLeaderboard] = useState<DailyChallengeLeaderboard | null>(null)
  const [userPerformance, setUserPerformance] = useState<UserDailyPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [submitResult, setSubmitResult] = useState<DailyChallengeSubmitResult | null>(null)
  const [testState, setTestState] = useState<TestState | null>(null)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const entryFee = 5.00

  useEffect(() => {
    loadDailyChallenge()
  }, [])

  const loadDailyChallenge = async () => {
    setLoading(true)
    try {
      const [challengeRes, leaderboardRes, performanceRes] = await Promise.all([
        apiClient.getTodaysChallenge(),
        apiClient.getDailyChallengeLeaderboard(100),
        userId ? apiClient.getUserDailyPerformance() : Promise.resolve({ data: null }),
      ])

      if (challengeRes.data) {
        setChallenge(challengeRes.data as DailyChallengeType)
      }
      if (leaderboardRes.data) {
        setLeaderboard(leaderboardRes.data as DailyChallengeLeaderboard)
      }
      if (performanceRes.data) {
        setUserPerformance(performanceRes.data as UserDailyPerformance)
      }
    } catch (error) {
      console.error('Error loading daily challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChallengeComplete = async (state: TestState) => {
    setTestState(state)
    setShowResults(true)

    if (!userId) {
      return
    }

    // User has already registered, now submit the challenge
    setSubmitting(true)
    try {
      const result = await apiClient.submitDailyChallenge(state.wpm, state.accuracy, state.duration)
      if (result.data) {
        setSubmitResult(result.data as DailyChallengeSubmitResult)
        // Refresh performance data
        const performanceRes = await apiClient.getUserDailyPerformance()
        if (performanceRes.data) {
          setUserPerformance(performanceRes.data as UserDailyPerformance)
        }
        // Refresh leaderboard
        const leaderboardRes = await apiClient.getDailyChallengeLeaderboard(100)
        if (leaderboardRes.data) {
          setLeaderboard(leaderboardRes.data as DailyChallengeLeaderboard)
        }
      }
    } catch (error) {
      console.error('Error submitting daily challenge:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegistrationSuccess = async () => {
    // User has registered, now they can take the challenge
    // Reset to show the challenge text and typing test
    setShowResults(false)
    setTestState(null)
    setSubmitResult(null)
    setShowRegistrationModal(false)
    // Refresh user performance data
    const performanceRes = await apiClient.getUserDailyPerformance()
    if (performanceRes.data) {
      setUserPerformance(performanceRes.data as UserDailyPerformance)
    }
  }

  // Check if registration window is still open (within 15 hours of challenge start)
  const isRegistrationOpen = (): boolean => {
    if (!challenge) return false
    
    const startTime = new Date(challenge.startTime).getTime()
    const currentTime = Date.now()
    const hoursPassed = (currentTime - startTime) / (1000 * 60 * 60)
    
    return hoursPassed < 15
  }

  const hoursRemainingForRegistration = (): number => {
    if (!challenge) return 0
    
    const startTime = new Date(challenge.startTime).getTime()
    const currentTime = Date.now()
    const hoursPassed = (currentTime - startTime) / (1000 * 60 * 60)
    
    return Math.max(0, 15 - hoursPassed)
  }

  const handleChallengeStartClick = () => {
    if (!userId) {
      // User needs to sign in first
      return
    }
    setShowRegistrationModal(true)
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>Loading today's challenge...</p>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>Failed to load daily challenge</p>
      </div>
    )
  }

  const timeUntilReset = new Date(challenge.endTime).getTime() - Date.now()
  const hoursRemaining = Math.floor(timeUntilReset / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60))

  const difficultyKey = challenge.difficulty as keyof typeof difficultyColors

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

      {/* Challenge Header */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border-purple-600/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Zap className="w-8 h-8 text-yellow-400" />
                {challenge.title}
              </CardTitle>
              <p className="text-slate-400 mt-2">{challenge.description}</p>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-lg ${difficultyColors[difficultyKey]} border`}>
                <p className="text-lg">{difficultyIcons[difficultyKey]}</p>
                <p className="text-xs font-semibold capitalize">{challenge.difficulty}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-400">Time Remaining</p>
            <p className="text-xl font-bold text-cyan-400">
              {hoursRemaining}h {minutesRemaining}m
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Target WPM</p>
            <p className="text-xl font-bold text-emerald-400">{challenge.targetWpm}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Submissions</p>
            <p className="text-xl font-bold text-purple-400">{challenge.totalSubmissions}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Mode</p>
            <p className="text-xl font-bold text-yellow-400 capitalize">{challenge.challengeMode}</p>
          </div>
        </CardContent>
      </Card>

      {/* User's Status */}
      {userPerformance && userPerformance.hasSubmitted && userPerformance.submission && (
        <Card className="bg-emerald-900/20 border-emerald-600/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-400">
              <Trophy className="w-5 h-5" />
              Your Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-cyan-400">#{userPerformance.submission.rank}</p>
                <p className="text-xs text-slate-400 mt-1">Your Rank</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-400">{userPerformance.submission.wpm}</p>
                <p className="text-xs text-slate-400 mt-1">WPM</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-400">{userPerformance.submission.accuracy}%</p>
                <p className="text-xs text-slate-400 mt-1">Accuracy</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-400">{userPerformance.submission.score}</p>
                <p className="text-xs text-slate-400 mt-1">Score</p>
              </div>
            </div>

            {userPerformance.submission.rank <= 10 && (
              <div className="bg-yellow-900/30 border border-yellow-600/50 p-3 rounded-lg text-center">
                <p className="text-sm text-yellow-300">
                  🎉 Reward: +{userPerformance.submission.reward.ratingPoints} Rating Points
                </p>
                {userPerformance.submission.reward.bonus > 0 && (
                  <p className="text-sm text-yellow-400 mt-1">
                    Bonus: +{userPerformance.submission.reward.bonus} points
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue={userPerformance?.hasSubmitted ? 'leaderboard' : 'challenge'} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {!userPerformance?.hasSubmitted && (
            <TabsTrigger value="challenge">Today's Challenge</TabsTrigger>
          )}
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          {userPerformance?.hasSubmitted && (
            <TabsTrigger value="history">Your History</TabsTrigger>
          )}
        </TabsList>

        {/* Challenge Tab */}
        {!userPerformance?.hasSubmitted && (
          <TabsContent value="challenge" className="space-y-4">
            {/* Check if registration window is closed */}
            {!isRegistrationOpen() ? (
              <Card className="bg-red-900/20 border-red-600/50">
                <CardContent className="p-6 text-center">
                  <p className="text-red-400 font-semibold text-lg">⏰ Registration Closed</p>
                  <p className="text-red-300 mt-2">The 15-hour registration window has passed.</p>
                  <p className="text-slate-400 text-sm mt-3">You can view the leaderboard and check other submissions in the Leaderboard tab.</p>
                </CardContent>
              </Card>
            ) : !userPerformance?.hasSubmitted ? (
              <>
                {/* Registration Required - Show if user hasn't registered yet */}
                {!userId ? (
                  <Card className="bg-blue-900/20 border-blue-600/50">
                    <CardContent className="p-6 text-center">
                      <p className="text-blue-300 font-semibold">Sign in to participate in today's challenge</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-yellow-900/20 border-yellow-600/50">
                    <CardContent className="p-6 text-center">
                      <p className="text-yellow-300 font-semibold mb-4">⚡ Ready to Challenge?</p>
                      <p className="text-yellow-200 text-sm mb-4">Register with a $5.00 entry fee to start typing.</p>
                      <p className="text-slate-400 text-xs mb-4">Time remaining: <span className="font-bold text-yellow-400">{Math.ceil(hoursRemainingForRegistration())}h</span></p>
                      <Button
                        onClick={handleChallengeStartClick}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        Register & Start Challenge
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Challenge Text Display - Only shown after registration/payment */}
                {userPerformance?.hasSubmitted && (
                  <>
                    {!showResults ? (
                      <>
                        <Card className="bg-slate-800/50 border-slate-700/50">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Target className="w-5 h-5 text-cyan-400" />
                              Challenge Text
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-slate-900/50 p-6 rounded-lg font-mono text-slate-300 leading-relaxed text-center break-words">
                              {challenge.challengeText}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Typing Test Area */}
                        <TestArea
                          text={challenge.challengeText}
                          onComplete={handleChallengeComplete}
                          focusOnMount={true}
                        />
                      </>
                    ) : (
                      <>
                        {/* Results Display */}
                        {testState && (
                          <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardHeader>
                              <CardTitle>Your Results</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-slate-800 p-3 rounded-lg text-center">
                                  <p className="text-2xl font-bold text-cyan-400">{testState.wpm}</p>
                                  <p className="text-xs text-slate-400 mt-1">WPM</p>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-lg text-center">
                                  <p className="text-2xl font-bold text-emerald-400">{testState.accuracy}%</p>
                                  <p className="text-xs text-slate-400 mt-1">Accuracy</p>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-lg text-center">
                                  <p className="text-2xl font-bold text-purple-400">{Math.round(testState.duration / 1000)}s</p>
                                  <p className="text-xs text-slate-400 mt-1">Duration</p>
                                </div>
                                {submitResult && (
                                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-yellow-400">{submitResult.score}</p>
                                    <p className="text-xs text-slate-400 mt-1">Score</p>
                                  </div>
                                )}
                              </div>

                              {submitting ? (
                                <p className="text-center text-slate-400">Submitting...</p>
                              ) : submitResult ? (
                                <div className="bg-emerald-900/20 border border-emerald-600/50 p-4 rounded-lg text-center">
                                  <p className="text-emerald-300 font-semibold">{submitResult.message}</p>
                                  {submitResult.rank && submitResult.rank <= 10 && (
                                    <p className="text-yellow-300 mt-2">
                                      🎉 +{submitResult.reward?.ratingPoints} Rating Points!
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  onClick={() => apiClient.submitDailyChallenge(testState.wpm, testState.accuracy, testState.duration)}
                                  className="w-full bg-purple-600 hover:bg-purple-700"
                                  disabled={submitting}
                                >
                                  {submitting ? 'Submitting...' : 'Submit Score'}
                                </Button>
                              )}

                              <Button
                                onClick={() => {
                                  setShowResults(false)
                                  setTestState(null)
                                  setSubmitResult(null)
                                }}
                                variant="outline"
                                className="w-full border-slate-600 text-slate-400 hover:text-white"
                              >
                                Try Again
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            ) : null}
          </TabsContent>
        )}

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          {leaderboard && leaderboard.leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.leaderboard.slice(0, 100).map((entry, idx) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-center w-8">
                      {idx < 3 ? (
                        <span className="text-2xl">{['🥇', '🥈', '🥉'][idx]}</span>
                      ) : (
                        <span className="font-bold text-slate-400">#{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium truncate">{entry.username}</p>
                      <p className="text-xs text-slate-400">{entry.userCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-center min-w-fit">
                      <p className="text-lg font-bold text-emerald-400">{entry.wpm}</p>
                      <p className="text-xs text-slate-400">WPM</p>
                    </div>
                    <div className="text-center min-w-fit">
                      <p className="text-lg font-bold text-yellow-400">{entry.accuracy}%</p>
                      <p className="text-xs text-slate-400">Acc</p>
                    </div>
                    <div className="text-center min-w-fit">
                      <p className="text-lg font-bold text-purple-400">{entry.score}</p>
                      <p className="text-xs text-slate-400">Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">No submissions yet. Be the first!</p>
          )}
        </TabsContent>

        {/* History Tab */}
        {userPerformance?.hasSubmitted && (
          <TabsContent value="history" className="space-y-4">
            <p className="text-center text-slate-400 py-8">Coming soon: View your historical performance</p>
          </TabsContent>
        )}
      </Tabs>

      {/* Registration Modal for Daily Challenge */}
      {challenge && (
        <CompetitionRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          competitionId={challenge._id}
          competitionName={challenge.title}
          competitionType="daily-challenge"
          entryFee={entryFee}
          currency="USD"
          onRegistrationSuccess={handleRegistrationSuccess}
          onRegistrationError={(error) => console.error('Registration error:', error)}
          userId={userId}
          username="Challenge Player"
        />
      )}
    </div>
  )
}
