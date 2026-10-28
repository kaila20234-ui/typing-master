import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Ban, Check, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function ModerationPage() {
  const [reports, setReports] = useState<any[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [filterStatus])

  async function fetchReports() {
    try {
      const res = await apiClient.getAdminModeration()
      setReports(Array.isArray(res.data) ? res.data : (res.data as any)?.reports || [])
    } catch (err) {
      setReports([])
    }
  }

  async function handleApproveReport(reportId: string) {
    try {
      await apiClient.updateAdminModeration(reportId, { 
        status: 'resolved',
        actionTaken: 'Approved - No violation found'
      })
      setStatusMsg('Report approved!')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchReports()
    } catch (err: any) {
      setStatusMsg('Failed to approve report')
    }
  }

  async function handleDismissReport(reportId: string) {
    try {
      await apiClient.updateAdminModeration(reportId, { 
        status: 'dismissed',
        actionTaken: 'Report dismissed'
      })
      setStatusMsg('Report dismissed!')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchReports()
    } catch (err: any) {
      setStatusMsg('Failed to dismiss report')
    }
  }

  async function handleBanUser(reportId: string, username: string) {
    if (!confirm(`Ban ${username}? This will suspend their account.`)) return

    try {
      await apiClient.banAdminUser(reportId)
      setStatusMsg(`User ${username} has been banned!`)
      setTimeout(() => setStatusMsg(''), 3000)
      fetchReports()
    } catch (err: any) {
      setStatusMsg('Failed to ban user: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleChangeStatus(reportId: string, newStatus: string) {
    try {
      await apiClient.updateAdminModeration(reportId, { status: newStatus })
      setStatusMsg('Status updated!')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchReports()
    } catch (err: any) {
      setStatusMsg('Failed to update status')
    }
  }

  const filteredReports = reports.filter((report) =>
    report.reportedUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reporterUsername?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    pending: reports.filter(r => r.status === 'pending').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    banned: reports.filter(r => r.status === 'banned').length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewing': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      case 'banned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🛡️ Moderation</h1>
        <p className="text-muted-foreground mt-2">Review reports and manage user violations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{stats.reviewing}</div>
            <p className="text-sm text-muted-foreground">Reviewing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600">{stats.banned}</div>
            <p className="text-sm text-muted-foreground">Banned</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by username, reason, or reporter..."
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button 
          variant={filterStatus === null ? 'default' : 'outline'}
          onClick={() => setFilterStatus(null)}
        >
          All
        </Button>
        <Button 
          variant={filterStatus === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('pending')}
        >
          Pending
        </Button>
        <Button 
          variant={filterStatus === 'reviewing' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('reviewing')}
        >
          Reviewing
        </Button>
        <Button 
          variant={filterStatus === 'resolved' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('resolved')}
        >
          Resolved
        </Button>
        <Button 
          variant={filterStatus === 'banned' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('banned')}
        >
          Banned
        </Button>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>📋 User Reports</CardTitle>
          <CardDescription>Total: {filteredReports.length} report(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No reports found' : 'No reports to display'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* User Info */}
                    <div className="col-span-6">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h3 className="font-bold text-lg">{report.reportedUsername || 'Unknown User'}</h3>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm"><strong>Reason:</strong> {report.reason}</p>
                        {report.description && (
                          <p className="text-sm"><strong>Description:</strong> {report.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Reported by: {report.reporterUsername || 'system'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Date: {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="col-span-6 flex flex-col gap-2">
                      {/* Status Dropdown */}
                      <div className="flex gap-2">
                        <select
                          value={report.status}
                          onChange={(e) => handleChangeStatus(report._id, e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                          <option value="banned">Banned</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {report.status !== 'resolved' && report.status !== 'banned' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveReport(report._id)}
                            title="Mark as resolved"
                            className="flex-1"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {report.status !== 'dismissed' && report.status !== 'banned' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDismissReport(report._id)}
                            title="Dismiss this report"
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                        )}
                        {report.status !== 'banned' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBanUser(report._id, report.reportedUsername)}
                            title="Ban this user"
                            className="flex-1"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Ban User
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Message */}
      {statusMsg && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-lg text-white font-medium shadow-lg ${
          statusMsg.includes('Failed') ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {statusMsg}
        </div>
      )}
    </div>
  )
}
