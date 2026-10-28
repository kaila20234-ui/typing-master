import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Filter, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function AuditDashboard() {
  const [activities, setActivities] = useState<any[]>([])
  const [filteredActivities, setFilteredActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMsg, setStatusMsg] = useState('')
  const [filters, setFilters] = useState({
    actionType: '',
    adminUser: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [activities, filters])

  async function fetchActivities() {
    setLoading(true)
    try {
      const res = await apiClient.getAdminActivity()
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.activities || []
      setActivities(data)
    } catch (err) {
      console.error('Failed to fetch activities')
      setActivities([])
    }
    setLoading(false)
  }

  function applyFilters() {
    let filtered = activities.filter((activity: any) => {
      // Filter by action type
      if (filters.actionType && activity.action !== filters.actionType) {
        return false
      }
      
      // Filter by admin user
      if (filters.adminUser && !activity.adminUser?.toLowerCase().includes(filters.adminUser.toLowerCase())) {
        return false
      }
      
      // Filter by date range
      const activityDate = new Date(activity.createdAt)
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      
      if (activityDate < startDate || activityDate > endDate) {
        return false
      }
      
      return true
    })
    
    setFilteredActivities(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  async function handleExportAudit() {
    try {
      const csvContent = generateCSV()
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit-log-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      
      setStatusMsg('✅ Audit log exported successfully!')
      setTimeout(() => setStatusMsg(''), 3000)
    } catch (err: any) {
      setStatusMsg('❌ Export failed')
      setTimeout(() => setStatusMsg(''), 3000)
    }
  }

  function generateCSV() {
    const headers = ['DateTime', 'AdminUser', 'Action', 'Description', 'ResourceType', 'ResourceId', 'Status']
    const rows = filteredActivities.map((activity: any) => [
      new Date(activity.createdAt).toLocaleString(),
      activity.adminUser || 'system',
      activity.action || '-',
      activity.description || '-',
      activity.resourceType || '-',
      activity.resourceId || '-',
      'completed'
    ])
    
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ]
    
    return csvRows.join('\n')
  }

  const actionTypes = [...new Set(activities.map(a => a.action))].filter(Boolean) as string[]
  const adminUsers = [...new Set(activities.map(a => a.adminUser))].filter(Boolean) as string[]

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

      <div>
        <h1 className="text-3xl font-bold">Audit Dashboard</h1>
        <p className="text-muted-foreground mt-2">Admin activity timeline and system events</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleExportAudit}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Action Type</label>
              <select
                value={filters.actionType}
                onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All</option>
                {actionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Admin User</label>
              <select
                value={filters.adminUser}
                onChange={(e) => setFilters({ ...filters, adminUser: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All</option>
                {adminUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{filteredActivities.length} events</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No activities found.</div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity: any, idx: number) => (
                <div key={idx} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                    {idx < filteredActivities.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200" />
                    )}
                  </div>
                  
                  {/* Activity details */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{activity.action || 'Unknown Action'}</p>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description || '-'}</p>
                        {activity.resourceType && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Resource: {activity.resourceType} {activity.resourceId ? `(${activity.resourceId})` : ''}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <p className="text-xs font-medium">{activity.adminUser || 'system'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.resourceType || 'System'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredActivities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">in selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Unique Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{[...new Set(filteredActivities.map((a: any) => a.adminUser))].length}</div>
            <p className="text-xs text-muted-foreground mt-1">performed actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Action Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{[...new Set(filteredActivities.map((a: any) => a.action))].length}</div>
            <p className="text-xs text-muted-foreground mt-1">different types</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
