import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Grid3x3, Square } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'


export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newTournament, setNewTournament] = useState({
    name: '',
    startDate: '',
    endDate: '',
    maxParticipants: 16,
    description: '',
    entryFee: 5.00,
  })
  const [statusMsg, setStatusMsg] = useState('')
  const [editTournament, setEditTournament] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function handleStartTournament(tournamentId: string) {
      setLoading(true)
      try {
        const res = await apiClient.generateAdminTournamentBracket(tournamentId)
        if (!res.error) {
          setStatusMsg('✅ Tournament started! Bracket generated.')
          fetchTournaments()
        } else {
          setStatusMsg('❌ ' + (res.error || 'Failed to start tournament'))
        }
      } catch (err: any) {
        setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
      }
      setLoading(false)
    }
  useEffect(() => {
    fetchTournaments()
  }, [])

  async function fetchTournaments() {
    try {
      const res = await apiClient.getAdminTournaments()
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.tournaments || []
      setTournaments(data)
    } catch {
      setTournaments([])
    }
  }

  async function handleCreateTournament() {
    try {
      const payload = {
        name: newTournament.name,
        description: newTournament.description,
        type: 'single-elimination',
        maxParticipants: newTournament.maxParticipants,
        startDate: newTournament.startDate,
        endDate: newTournament.endDate,
        entryFee: newTournament.entryFee,
      }
      const res = await apiClient.createAdminTournament(payload)
      if (!res.error) {
        setStatusMsg('✅ Tournament created!')
        setShowModal(false)
        fetchTournaments()
      } else {
        setStatusMsg('❌ ' + (res.error || 'Failed to create tournament'))
      }
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleEditTournament() {
    if (!editTournament) return
    try {
      await apiClient.updateAdminTournament(editTournament._id, editTournament)
      setStatusMsg('✅ Tournament updated!')
      setEditTournament(null)
      fetchTournaments()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleDeleteTournament(id: string) {
    try {
      await apiClient.deleteAdminTournament(id)
      setStatusMsg('✅ Tournament deleted!')
      fetchTournaments()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleForceEndTournament(tournamentId: string) {
    setLoading(true)
    try {
      await apiClient.forceEndAdminTournament(tournamentId)
      setStatusMsg('✅ Tournament force-ended!')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchTournaments()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
      setTimeout(() => setStatusMsg(''), 3000)
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground mt-2">Manage typing competitions and events</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Tournament
        </Button>
      </div>

      {/* Modal for creating tournament */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg py-3 px-4">
              <CardTitle className="text-lg">Create New Tournament</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Set up a new typing competition</p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                
                {/* Tournament Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-900">Tournament Name *</label>
                  <Input
                    type="text"
                    placeholder="e.g., Winter Championship 2026"
                    value={newTournament.name}
                    onChange={e => setNewTournament({ ...newTournament, name: e.target.value })}
                    className="text-sm h-8"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-900">Description</label>
                  <textarea
                    placeholder="Optional: Tournament details"
                    value={newTournament.description}
                    onChange={e => setNewTournament({ ...newTournament, description: e.target.value })}
                    className="w-full border rounded-md px-2 py-1 text-xs resize-none h-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Dates Section */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-xs mb-2 text-gray-900">Tournament Duration</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-900">Start Date *</label>
                      <Input
                        type="date"
                        value={newTournament.startDate}
                        onChange={e => setNewTournament({ ...newTournament, startDate: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-900">End Date *</label>
                      <Input
                        type="date"
                        value={newTournament.endDate}
                        onChange={e => setNewTournament({ ...newTournament, endDate: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-xs mb-2 text-gray-900">Participant Settings</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-900 mb-1">Max Participants *</label>
                      <Input
                        type="number"
                        value={newTournament.maxParticipants}
                        onChange={e => setNewTournament({ ...newTournament, maxParticipants: Number(e.target.value) })}
                        className="text-sm h-8"
                        min="4"
                        step="4"
                      />
                    </div>
                    <span className="text-xs text-gray-500 self-end pb-1">players</span>
                  </div>
                </div>

                {/* Entry Fee Section */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-xs mb-2 text-gray-900">Entry Fee</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">$</span>
                    <Input
                      type="number"
                      value={newTournament.entryFee}
                      onChange={e => setNewTournament({ ...newTournament, entryFee: Number(e.target.value) })}
                      className="text-sm h-8 flex-1"
                      min="0"
                      step="0.01"
                      placeholder="5.00"
                    />
                    <span className="text-xs text-gray-500">USD</span>
                  </div>
                </div>

                {/* Status Message */}
                {statusMsg && (
                  <div className={`p-2 rounded-lg text-xs ${statusMsg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {statusMsg}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button 
                    onClick={handleCreateTournament}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create
                  </Button>
                  <Button 
                    onClick={() => setShowModal(false)}
                    variant="outline"
                    className="flex-1 text-sm h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal for editing tournament */}
      {editTournament && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg py-3 px-4">
              <CardTitle className="text-lg">Edit Tournament</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Update tournament details</p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                
                {/* Tournament Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-900">Tournament Name *</label>
                  <Input
                    type="text"
                    placeholder="e.g., Winter Championship 2026"
                    value={editTournament.name}
                    onChange={e => setEditTournament({ ...editTournament, name: e.target.value })}
                    className="text-sm h-8"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-900">Description</label>
                  <textarea
                    placeholder="Optional: Tournament details"
                    value={editTournament.description}
                    onChange={e => setEditTournament({ ...editTournament, description: e.target.value })}
                    className="w-full border rounded-md px-2 py-1 text-xs resize-none h-12 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Dates Section */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-xs mb-2 text-gray-900">Tournament Duration</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-900">Start Date *</label>
                      <Input
                        type="date"
                        value={editTournament.startDate}
                        onChange={e => setEditTournament({ ...editTournament, startDate: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-900">End Date *</label>
                      <Input
                        type="date"
                        value={editTournament.endDate}
                        onChange={e => setEditTournament({ ...editTournament, endDate: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-xs mb-2 text-gray-900">Participant Settings</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-900 mb-1">Max Participants *</label>
                      <Input
                        type="number"
                        value={editTournament.maxParticipants}
                        onChange={e => setEditTournament({ ...editTournament, maxParticipants: Number(e.target.value) })}
                        className="text-sm h-8"
                        min="4"
                        step="4"
                      />
                    </div>
                    <span className="text-xs text-gray-500 self-end pb-1">players</span>
                  </div>
                </div>

                {/* Status Message */}
                {statusMsg && (
                  <div className={`p-2 rounded-lg text-xs ${statusMsg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {statusMsg}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button 
                    onClick={handleEditTournament}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm h-8"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button 
                    onClick={() => setEditTournament(null)}
                    variant="outline"
                    className="flex-1 text-sm h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-4">
        <Input placeholder="Search tournaments..." className="flex-1" />
        <Button variant="outline">Filter</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tournaments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tournaments.map((tournament: any) => (
              <div key={tournament._id} className="flex flex-col gap-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{tournament.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tournament.startDate} to {tournament.endDate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tournament.participants?.length || 0} participants • Type: {tournament.type || 'single-elimination'}
                    </p>
                    {tournament.bracketGenerated && (
                      <p className="text-xs text-green-600 mt-1">✓ Bracket generated</p>
                    )}
                  </div>
                  <Badge variant={tournament.status === 'active' ? 'default' : tournament.status === 'completed' ? 'outline' : 'secondary'}>
                    {tournament.status}
                  </Badge>
                </div>

                {/* Admin Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {tournament.status === 'registration' && !tournament.bracketGenerated && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStartTournament(tournament._id)}
                      disabled={loading}
                      className="flex items-center gap-1"
                    >
                      <Grid3x3 className="w-3 h-3" />
                      Start Tournament
                    </Button>
                  )}
                  {tournament.status === 'active' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleForceEndTournament(tournament._id)}
                      disabled={loading}
                      className="flex items-center gap-1"
                    >
                      <Square className="w-3 h-3" />
                      Force End
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => alert(`Registrations View:\n\nParticipants: ${tournament.participants?.length || 0}\n\n${tournament.participants?.map((p: any) => `• ${p.username}`).join('\n') || 'No participants'}`)}
                  >
                    👥 View Registrations ({tournament.participants?.length || 0})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditTournament({ ...tournament })}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTournament(tournament._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
