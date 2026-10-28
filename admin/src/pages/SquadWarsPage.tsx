import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, TrendingUp, Trophy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function SquadWarsPage() {
  const [wars, setWars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newWar, setNewWar] = useState<any | null>(null)
  const [editWar, setEditWar] = useState<any | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [scoreAdjustMode, setScoreAdjustMode] = useState<string | null>(null)
  const [scoreAdjust, setScoreAdjust] = useState({ warId: '', squad: '', amount: 0 })
  const [expandedRegistrations, setExpandedRegistrations] = useState<string | null>(null)

  useEffect(() => {
    fetchWars()
  }, [])

  async function fetchWars() {
    setLoading(true)
    try {
      const res = await apiClient.getAdminSquadWars()
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.wars || []
      const warsWithIds = data.map((war: any) => ({
        ...war,
        _id: war._id || war.id,
        id: war._id || war.id || Math.random().toString()
      }))
      setWars(warsWithIds)
    } catch (err) {
      setWars([])
    }
    setLoading(false)
  }

  async function handleCreateWar() {
    if (!newWar?.title || !newWar?.squadAName || !newWar?.squadBName) {
      setStatusMsg('Please fill in title and squad names')
      return
    }
    try {
      const warData = {
        title: newWar.title,
        description: newWar.description || '',
        squadAName: newWar.squadAName,
        squadBName: newWar.squadBName,
        warType: newWar.warType || 'elimination',
        duration: Number(newWar.duration) || 30,
        maxParticipantsPerSquad: Number(newWar.maxParticipantsPerSquad) || 5,
        entryFee: Number(newWar.entryFee) || 5.00,
      }
      await apiClient.createAdminSquadWar(warData)
      setStatusMsg('✅ Squad war created successfully!')
      setNewWar(null)
      setTimeout(() => setStatusMsg(''), 3000)
      fetchWars()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleEditWar() {
    if (!editWar) return
    try {
      const id = editWar._id || editWar.id
      if (!id) {
        setStatusMsg('War ID is missing')
        return
      }
      await apiClient.updateAdminSquadWar(id, editWar)
      setStatusMsg('✅ War updated!')
      setEditWar(null)
      setTimeout(() => setStatusMsg(''), 3000)
      fetchWars()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleDeleteWar(id: string) {
    if (!id) {
      setStatusMsg('War ID is missing')
      return
    }
    if (!confirm('Are you sure you want to delete this war?')) return
    try {
      await apiClient.deleteAdminSquadWar(id)
      setStatusMsg('✅ War deleted!')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchWars()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleAdjustScore(warId: string, squad: 'A' | 'B', amount: number) {
    try {
      await apiClient.adjustAdminSquadWarScore(warId, squad, amount)
      setStatusMsg(`✅ Score adjusted for Squad ${squad}!`)
      setTimeout(() => setStatusMsg(''), 3000)
      setScoreAdjustMode(null)
      fetchWars()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleSetWinner(warId: string, winnerSquad: 'A' | 'B') {
    try {
      await apiClient.setAdminSquadWarWinner(warId, winnerSquad)
      setStatusMsg(`✅ Squad ${winnerSquad} declared winner!`)
      setTimeout(() => setStatusMsg(''), 3000)
      fetchWars()
    } catch (err: any) {
      setStatusMsg('❌ Failed: ' + (err.message || 'Unknown error'))
    }
  }

  const filteredWars = wars.filter((w) =>
    w.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.squadAName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.squadBName?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold">Squad Wars</h1>
          <p className="text-muted-foreground mt-2">Manage squad competitions and team battles</p>
        </div>
        <Button onClick={() => setNewWar({})}>
          <Plus className="w-4 h-4 mr-2" />
          New War
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search squad wars..."
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline">Filter</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Squad Wars</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : filteredWars.length === 0 ? (
            <p className="text-muted-foreground">No squad wars found.</p>
          ) : (
            <div className="space-y-4">
              {filteredWars.map((war: any) => (
                <div key={war.id} className="flex flex-col gap-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{war.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">{war.squadAName || war.squadA?.name}</span>
                        {' '}<span className="text-lg font-bold">{war.squadA?.score || 0}</span>
                        {' '}-{' '}
                        <span className="text-lg font-bold">{war.squadB?.score || 0}</span>
                        {' '}<span className="font-medium">{war.squadBName || war.squadB?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {war.warType} • Duration: {war.duration} min
                      </p>
                    </div>
                    <Badge variant={war.status === 'pending' ? 'default' : war.status === 'in-progress' ? 'secondary' : 'outline'}>
                      {war.status}
                    </Badge>
                  </div>

                  {/* Admin Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {war.status === 'in-progress' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setScoreAdjustMode(`${war._id}-A`)}
                          className="flex items-center gap-1"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Adjust Squad A Score
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setScoreAdjustMode(`${war._id}-B`)}
                          className="flex items-center gap-1"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Adjust Squad B Score
                        </Button>
                      </>
                    )}
                    {(war.status === 'in-progress' || war.status === 'pending') && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSetWinner(war._id || war.id, 'A')}
                          className="flex items-center gap-1"
                        >
                          <Trophy className="w-3 h-3" />
                          Squad A Wins
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSetWinner(war._id || war.id, 'B')}
                          className="flex items-center gap-1"
                        >
                          <Trophy className="w-3 h-3" />
                          Squad B Wins
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setExpandedRegistrations(expandedRegistrations === war._id ? null : war._id)}
                      className="flex items-center gap-1"
                    >
                      👥 Registrations ({war.registrations?.length || 0})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditWar(war)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteWar(war._id || war.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Score Adjustment Modal */}
                  {scoreAdjustMode === `${war._id}-A` || scoreAdjustMode === `${war._id}-B` && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Adjust Score for Squad {scoreAdjustMode?.endsWith('-A') ? 'A' : 'B'}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={scoreAdjust.amount}
                          onChange={(e) => setScoreAdjust({ ...scoreAdjust, amount: Number(e.target.value) })}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const squad = scoreAdjustMode?.endsWith('-A') ? 'A' : 'B'
                            handleAdjustScore(war._id || war.id, squad as 'A' | 'B', scoreAdjust.amount)
                            setScoreAdjust({ ...scoreAdjust, amount: 0 })
                          }}
                        >
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setScoreAdjustMode(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Registrations View */}
                  {expandedRegistrations === war._id && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-300">
                      <p className="text-sm font-medium text-slate-900 mb-2">Squad Registrations</p>
                      {war.registrations && war.registrations.length > 0 ? (
                        <div className="space-y-2">
                          {war.registrations.map((reg: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{reg.squadName}</p>
                                <p className="text-xs text-slate-500">Status: {reg.status}</p>
                              </div>
                              <Badge 
                                variant={reg.status === 'paid' ? 'default' : reg.status === 'refunded' ? 'secondary' : 'outline'}
                              >
                                {reg.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">No squad registrations yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for creating/editing squad war */}
      {(newWar || editWar) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                {editWar ? '✏️ Edit Squad War' : '⚔️ Create Squad War'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">War Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Championship Round 1"
                  value={editWar?.title || newWar?.title || ''}
                  onChange={e => {
                    if (editWar) setEditWar({ ...editWar, title: e.target.value })
                    else setNewWar({ ...newWar, title: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Describe the squad war..."
                  value={editWar?.description || newWar?.description || ''}
                  onChange={e => {
                    if (editWar) setEditWar({ ...editWar, description: e.target.value })
                    else setNewWar({ ...newWar, description: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-16 resize-none"
                />
              </div>

              {/* Squad Names */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Squad A Name *</label>
                  <input
                    type="text"
                    placeholder="Team A"
                    value={editWar?.squadA?.name || newWar?.squadAName || ''}
                    onChange={e => {
                      if (editWar) setEditWar({ ...editWar, squadA: { ...editWar.squadA, name: e.target.value } })
                      else setNewWar({ ...newWar, squadAName: e.target.value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Squad B Name *</label>
                  <input
                    type="text"
                    placeholder="Team B"
                    value={editWar?.squadB?.name || newWar?.squadBName || ''}
                    onChange={e => {
                      if (editWar) setEditWar({ ...editWar, squadB: { ...editWar.squadB, name: e.target.value } })
                      else setNewWar({ ...newWar, squadBName: e.target.value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* War Type & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">War Type</label>
                  <select
                    value={editWar?.warType || newWar?.warType || 'elimination'}
                    onChange={e => {
                      if (editWar) setEditWar({ ...editWar, warType: e.target.value })
                      else setNewWar({ ...newWar, warType: e.target.value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="elimination">Elimination</option>
                    <option value="time-based">Time-based</option>
                    <option value="point-target">Point Target</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={editWar?.duration || newWar?.duration || '30'}
                    onChange={e => {
                      if (editWar) setEditWar({ ...editWar, duration: Number(e.target.value) })
                      else setNewWar({ ...newWar, duration: Number(e.target.value) })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Max Participants per Squad</label>
                <input
                  type="number"
                  placeholder="5"
                  value={editWar?.maxParticipantsPerSquad || newWar?.maxParticipantsPerSquad || '5'}
                  onChange={e => {
                    if (editWar) setEditWar({ ...editWar, maxParticipantsPerSquad: Number(e.target.value) })
                    else setNewWar({ ...newWar, maxParticipantsPerSquad: Number(e.target.value) })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Entry Fee */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Entry Fee (USD)</label>
                <input
                  type="number"
                  placeholder="5.00"
                  step="0.01"
                  min="0"
                  value={editWar?.entryFee || newWar?.entryFee || '5.00'}
                  onChange={e => {
                    if (editWar) setEditWar({ ...editWar, entryFee: Number(e.target.value) })
                    else setNewWar({ ...newWar, entryFee: Number(e.target.value) })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  onClick={editWar ? handleEditWar : handleCreateWar}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                >
                  {editWar ? 'Save Changes' : 'Create War'}
                </Button>
                <Button
                  onClick={() => {
                    setNewWar(null)
                    setEditWar(null)
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
