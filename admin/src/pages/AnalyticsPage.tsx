import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrendingUp, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function AnalyticsPage() {
  const [stats, setStats] = useState<any | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'completed'
  })

  useEffect(() => {
    fetchStats()
  }, [filters])

  async function fetchStats() {
    try {
      const res = await apiClient.getAdminStatistics(filters.startDate, filters.endDate)
      setStats(res.data)
    } catch (err) {
      console.error('Failed to fetch stats')
    }
  }

  async function handleExport(type: 'races' | 'tournaments' | 'payments' | 'users') {
    try {
      const res = await apiClient.exportAdminData(type, filters.startDate, filters.endDate, filters.status)
      
      if (!res.error && res.data) {
        const blob = new Blob([res.data as BlobPart], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${type}-${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        
        setStatusMsg(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`)
        setTimeout(() => setStatusMsg(''), 3000)
      } else {
        setStatusMsg('Failed to export data')
      }
    } catch (err: any) {
      setStatusMsg(`❌ Export failed: ${err.response?.data?.error || 'Unknown error'}`)
      setTimeout(() => setStatusMsg(''), 3000)
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

      <div>
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-2">Platform performance and user engagement metrics</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchStats} className="w-full">Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Races</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRaces || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Tournaments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTournaments || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(stats.totalRevenue || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-md">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground ml-2">Chart placeholder</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Race Activity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-md">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground ml-2">Chart placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download data with applied filters</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleExport('races')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Races
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleExport('tournaments')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Tournaments
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleExport('payments')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Revenue
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleExport('users')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
