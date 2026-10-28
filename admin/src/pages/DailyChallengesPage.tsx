import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Calendar, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function DailyChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newChallenge, setNewChallenge] = useState<any | null>(null)
  const [editChallenge, setEditChallenge] = useState<any | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchChallenges()
  }, [])

  async function fetchChallenges() {
    setLoading(true)
    try {
      const res = await apiClient.getAdminDailyChallenges()
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.challenges || []
      const challengesWithIds = data.map((challenge: any) => ({
        ...challenge,
        _id: challenge._id || challenge.id,
        id: challenge._id || challenge.id || Math.random().toString()
      }))
      setChallenges(challengesWithIds)
    } catch (err) {
      setChallenges([])
    }
    setLoading(false)
  }

  async function handleCreateChallenge() {
    if (!newChallenge?.title || !newChallenge?.challengeText) {
      setStatusMsg('Please fill in title and challenge text')
      return
    }
    try {
      const challengeData = {
        title: newChallenge.title,
        description: newChallenge.description || '',
        difficulty: newChallenge.difficulty || 'intermediate',
        targetWpm: Number(newChallenge.targetWpm) || 60,
        date: newChallenge.date || new Date().toISOString().split('T')[0],
        challengeText: newChallenge.challengeText,
      }
      await apiClient.createAdminChallenge(challengeData)
      setStatusMsg('✅ Challenge created successfully!')
      setNewChallenge(null)
      setTimeout(() => setStatusMsg(''), 3000)
      fetchChallenges()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleEditChallenge() {
    if (!editChallenge) return
    try {
      const id = editChallenge._id || editChallenge.id
      if (!id) {
        setStatusMsg('Challenge ID is missing')
        return
      }
      await apiClient.updateAdminChallenge(id, editChallenge)
      setStatusMsg('✅ Challenge updated!')
      setEditChallenge(null)
      setTimeout(() => setStatusMsg(''), 3000)
      fetchChallenges()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleDeleteChallenge(id: string) {
    if (!id) {
      setStatusMsg('Challenge ID is missing')
      return
    }
    if (!confirm('Are you sure you want to delete this challenge?')) return
    try {
      await apiClient.deleteAdminChallenge(id)
      setStatusMsg('✅ Challenge deleted!')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchChallenges()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleScheduleChallenge(challengeId: string, scheduledDate: string) {
    try {
      await apiClient.scheduleAdminChallenge({
        challengeIds: [challengeId],
        scheduledDate: scheduledDate,
        autoPublish: true
      })
      setStatusMsg(`✅ Challenge scheduled for ${scheduledDate}!`)
      setTimeout(() => setStatusMsg(''), 3000)
      fetchChallenges()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handlePublishChallenge(challengeId: string) {
    try {
      await apiClient.publishAdminChallenge(challengeId)
      setStatusMsg('✅ Challenge published!')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchChallenges()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  const filteredChallenges = challenges.filter((c) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {statusMsg && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          statusMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
          statusMsg.startsWith('❌') ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {statusMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Challenges</h1>
          <p className="text-muted-foreground mt-2">Create and manage daily typing challenges</p>
        </div>
        <Button onClick={() => setNewChallenge({})}>
          <Plus className="w-4 h-4 mr-2" />
          New Challenge
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search challenges..."
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline">Filter</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : filteredChallenges.length === 0 ? (
            <p className="text-muted-foreground">No challenges found.</p>
          ) : (
            <div className="space-y-4">
              {filteredChallenges.map((challenge: any) => (
                <div key={challenge.id} className="flex flex-col gap-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{challenge.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {challenge.difficulty} • {challenge.targetWpm || 0} WPM target • {challenge.completions || 0} completions
                      </p>
                      {challenge.scheduledDate && (
                        <p className="text-xs text-blue-600 mt-1">📅 Scheduled: {new Date(challenge.scheduledDate).toLocaleDateString()}</p>
                      )}
                      {challenge.isActive && (
                        <p className="text-xs text-green-600 mt-1">✓ Published</p>
                      )}
                    </div>
                    <Badge variant={challenge.isActive ? 'default' : 'secondary'}>
                      {challenge.isActive ? 'Active' : 'Draft'}
                    </Badge>
                  </div>

                  {/* Admin Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {!challenge.isActive && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handlePublishChallenge(challenge._id || challenge.id)}
                        className="flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Publish Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const dateStr = prompt('Enter date (YYYY-MM-DD):', new Date().toISOString().split('T')[0])
                        if (dateStr) {
                          handleScheduleChallenge(challenge._id || challenge.id, dateStr)
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      Schedule
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditChallenge(challenge)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteChallenge(challenge._id || challenge.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for creating/editing challenge */}
      {(newChallenge || editChallenge) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                {editChallenge ? '✏️ Edit Challenge' : '✨ Create New Challenge'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Challenge Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Speed Demon Challenge"
                  value={editChallenge?.title || newChallenge?.title || ''}
                  onChange={e => {
                    if (editChallenge) setEditChallenge({ ...editChallenge, title: e.target.value })
                    else setNewChallenge({ ...newChallenge, title: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Describe your challenge..."
                  value={editChallenge?.description || newChallenge?.description || ''}
                  onChange={e => {
                    if (editChallenge) setEditChallenge({ ...editChallenge, description: e.target.value })
                    else setNewChallenge({ ...newChallenge, description: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                />
              </div>

              {/* Challenge Text */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Challenge Text *</label>
                <textarea
                  placeholder="Enter the typing passage or text for this challenge..."
                  value={editChallenge?.challengeText || newChallenge?.challengeText || ''}
                  onChange={e => {
                    if (editChallenge) setEditChallenge({ ...editChallenge, challengeText: e.target.value })
                    else setNewChallenge({ ...newChallenge, challengeText: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                />
              </div>

              {/* Difficulty & Target WPM */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                  <select
                    value={editChallenge?.difficulty || newChallenge?.difficulty || 'intermediate'}
                    onChange={e => {
                      if (editChallenge) setEditChallenge({ ...editChallenge, difficulty: e.target.value })
                      else setNewChallenge({ ...newChallenge, difficulty: e.target.value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">🟢 Beginner</option>
                    <option value="intermediate">🟡 Intermediate</option>
                    <option value="advanced">🔴 Advanced</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Target WPM</label>
                  <input
                    type="number"
                    placeholder="60"
                    value={editChallenge?.targetWpm || newChallenge?.targetWpm || '60'}
                    onChange={e => {
                      if (editChallenge) setEditChallenge({ ...editChallenge, targetWpm: Number(e.target.value) })
                      else setNewChallenge({ ...newChallenge, targetWpm: Number(e.target.value) })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Challenge Date</label>
                <input
                  type="date"
                  value={editChallenge?.date?.split('T')[0] || newChallenge?.date || new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    if (editChallenge) setEditChallenge({ ...editChallenge, date: e.target.value })
                    else setNewChallenge({ ...newChallenge, date: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Message */}
              {statusMsg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${
                  statusMsg.includes('Failed')
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {statusMsg}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={editChallenge ? handleEditChallenge : handleCreateChallenge}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {editChallenge ? 'Save Changes' : 'Create Challenge'}
                </Button>
                <Button
                  onClick={() => {
                    setNewChallenge(null)
                    setEditChallenge(null)
                    setStatusMsg('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
