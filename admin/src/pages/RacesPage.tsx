import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Square } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function RacesPage() {
  const [statusMsg, setStatusMsg] = useState('')
  const [races, setRaces] = useState<any[]>([])
  const [editRace, setEditRace] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'recent' | 'active'>('recent')
  const [newRace, setNewRace] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRace, setSelectedRace] = useState<any | null>(null)
  const [selectedRegistrations, setSelectedRegistrations] = useState<any[]>([])
  const [loadingRegistrations, setLoadingRegistrations] = useState(false)

  useEffect(() => {
    fetchRaces()
  }, [])

  async function fetchRaces() {
    try {
      const res = await apiClient.getAdminRaces()
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.races || []
      setRaces(data)
    } catch {
      setRaces([])
    }
  }

  async function handleEditRace() {
    if (!editRace) return
    try {
      await apiClient.updateAdminRace(editRace._id, editRace)
      setStatusMsg('Race updated!')
      setEditRace(null)
      fetchRaces()
    } catch (err: any) {
      setStatusMsg('Failed to update race')
    }
  }

  async function handleForceStart(raceId: string) {
    setLoading(true)
    try {
      const race = races.find(r => r._id === raceId)
      await apiClient.forceStartAdminRace(raceId)
      setStatusMsg(`✅ Race ${race?.roomId} force-started`)
      setTimeout(() => setStatusMsg(''), 3000)
      fetchRaces()
    } catch (err: any) {
      setStatusMsg(`❌ Failed: ${err.message || 'Unknown error'}`)
      setTimeout(() => setStatusMsg(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  async function openRegistrationsModal(race: any) {
    setSelectedRace(race)
    setLoadingRegistrations(true)
    try {
      const res = await apiClient.getAdminRaceRegistrations(race._id)
      setSelectedRegistrations((res as any)?.data?.registrations || [])
    } catch (err: any) {
      setSelectedRegistrations([])
      setStatusMsg(`❌ Failed to load registrations: ${err.message || 'Unknown error'}`)
    } finally {
      setLoadingRegistrations(false)
    }
  }

  async function handleForceEnd(raceId: string) {
    setLoading(true)
    try {
      const race = races.find(r => r._id === raceId)
      await apiClient.forceEndAdminRace(raceId)
      setStatusMsg(`✅ Race ${race?.roomId} force-ended`)
      setTimeout(() => setStatusMsg(''), 3000)
      fetchRaces()
    } catch (err: any) {
      setStatusMsg(`❌ Failed: ${err.message || 'Unknown error'}`)
      setTimeout(() => setStatusMsg(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateRace() {
    if (!newRace?.name) {
      setStatusMsg('Please fill in all required fields')
      return
    }
    try {
      const raceData = {
        name: newRace.name,
        description: newRace.description || '',
        maxParticipants: Number(newRace.maxParticipants) || 100,
        status: 'waiting'
      }
      await apiClient.createAdminRace(raceData)
      setStatusMsg('Race created successfully!')
      setNewRace(null)
      fetchRaces()
    } catch (err: any) {
      setStatusMsg('Failed to create race: ' + (err.message || 'Unknown error'))
    }
  }

  const recentRaces = races.filter((r) => r.status !== 'active')
  const activeRaces = races.filter((r) => r.status === 'active')
  const displayRaces = activeTab === 'recent' ? recentRaces : activeRaces
  const filteredRaces = displayRaces.filter((r) =>
    r.roomId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold">Live Races</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage active races</p>
        </div>
        <Button onClick={() => setNewRace({})}>
          <Plus className="w-4 h-4 mr-2" />
          Start Race
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search races..."
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline">Filter</Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'recent'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Recent Races ({recentRaces.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'active'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Active Races ({activeRaces.length})
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeTab === 'recent' ? 'Recent Races' : 'Active Races'}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRaces.length === 0 ? (
            <p className="text-muted-foreground">No races found.</p>
          ) : (
            <div className="space-y-4">
              {filteredRaces.map((race) => (
                <div key={race._id} className="flex flex-col gap-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{race.roomId || race.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {race.participants?.length || 0} participants • Status: {race.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(race.createdAt).toLocaleString()}
                      </p>
                      {race.forcedStatus && (
                        <p className="text-xs text-orange-600 mt-1">Forced: {race.forcedStatus}</p>
                      )}
                    </div>
                    <Badge variant={race.status === 'waiting' ? 'default' : race.status === 'in_progress' ? 'secondary' : 'outline'}>
                      {race.status}
                    </Badge>
                  </div>

                  {/* Admin Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {race.status !== 'in_progress' && race.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleForceStart(race._id)}
                        disabled={loading}
                        className="flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Force Start
                      </Button>
                    )}
                    {race.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleForceEnd(race._id)}
                        disabled={loading}
                        className="flex items-center gap-1"
                      >
                        <Square className="w-3 h-3" />
                        Force End
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRegistrationsModal(race)}
                    >
                      View Registrations ({race.participants?.length || 0})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditRace(race)}
                    >
                      Edit
                    </Button>
                  </div>

                  {/* Live Data Section (if race in progress) */}
                  {race.status === 'in_progress' && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <p className="font-medium text-blue-900">Live Progress:</p>
                      {race.participants && race.participants.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {race.participants.slice(0, 3).map((p: any, idx: number) => (
                            <div key={idx} className="text-xs text-blue-800">
                              {p.username}: {p.wpm || 0} WPM • {p.accuracy || 0}% accuracy
                            </div>
                          ))}
                          {race.participants.length > 3 && (
                            <div className="text-xs text-blue-700">+{race.participants.length - 3} more</div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-blue-800">No participants yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Details Modal */}
      {selectedRace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Registered Users</h2>
                <p className="text-sm text-muted-foreground">{selectedRace.roomId}</p>
              </div>
              <Button variant="outline" onClick={() => setSelectedRace(null)}>
                Close
              </Button>
            </div>

            {loadingRegistrations ? (
              <p className="text-sm text-muted-foreground">Loading registrations...</p>
            ) : selectedRegistrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registrations yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedRegistrations.map((reg: any) => (
                  <div key={reg._id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{reg.username}</p>
                        <p className="text-xs text-muted-foreground">{reg.email || 'No email'}</p>
                      </div>
                      <Badge variant="outline">{reg.registrationStatus}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">User ID: {reg.userId}</p>
                    <p className="text-xs text-muted-foreground">Payment: {reg.paymentStatus}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for creating/editing race */}
      {(newRace || editRace) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editRace ? 'Edit Race' : 'Start New Race'}</h2>
            <input
              type="text"
              placeholder="Race Name"
              value={editRace?.name || newRace?.name || ''}
              onChange={e => {
                if (editRace) setEditRace({ ...editRace, name: e.target.value })
                else setNewRace({ ...newRace, name: e.target.value })
              }}
              className="w-full mb-2 border rounded px-2 py-1"
            />
            <textarea
              placeholder="Description (optional)"
              value={editRace?.description || newRace?.description || ''}
              onChange={e => {
                if (editRace) setEditRace({ ...editRace, description: e.target.value })
                else setNewRace({ ...newRace, description: e.target.value })
              }}
              className="w-full mb-2 border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="Max Participants"
              value={editRace?.maxParticipants || newRace?.maxParticipants || '100'}
              onChange={e => {
                if (editRace) setEditRace({ ...editRace, maxParticipants: Number(e.target.value) })
                else setNewRace({ ...newRace, maxParticipants: Number(e.target.value) })
              }}
              className="w-full mb-2 border rounded px-2 py-1"
            />
            {editRace && (
              <>
                <input
                  type="date"
                  placeholder="Start Date"
                  value={editRace.startDate || ''}
                  onChange={e => setEditRace({ ...editRace, startDate: e.target.value })}
                  className="w-full mb-2 border rounded px-2 py-1"
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={editRace.endDate || ''}
                  onChange={e => setEditRace({ ...editRace, endDate: e.target.value })}
                  className="w-full mb-2 border rounded px-2 py-1"
                />
              </>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={editRace ? handleEditRace : handleCreateRace}
                className="bg-blue-600 text-white"
              >
                {editRace ? 'Save' : 'Create Race'}
              </Button>
              <Button
                onClick={() => {
                  setNewRace(null)
                  setEditRace(null)
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
            {statusMsg && <div className="mt-2 text-sm text-blue-600">{statusMsg}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
