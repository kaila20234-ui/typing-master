import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, RotateCcw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [statusMsg, setStatusMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
    fetchStats()
  }, [filterStatus, filterType])

  async function fetchPayments() {
    try {
      const res = await apiClient.getAdminPayments()
      setPayments(Array.isArray(res.data) ? res.data : (res.data as any)?.payments || [])
    } catch (err) {
      setPayments([])
    }
  }

  async function fetchStats() {
    try {
      const res = await apiClient.getAdminPaymentStats()
      setStats(res.data)
    } catch (err) {
      setStats({})
    }
  }

  async function handleRefundPayment(id: string, username: string) {
    if (!confirm(`Refund payment for ${username}?`)) return

    try {
      await apiClient.refundAdminPayment(id)
      setStatusMsg('Refund processed successfully!')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchPayments()
      fetchStats()
    } catch (err: any) {
      setStatusMsg('Failed to process refund: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleDeletePayment(id: string) {
    if (!confirm('Delete this payment record? This action cannot be undone.')) return

    try {
      await apiClient.deleteAdminPayment(id)
      setStatusMsg('Payment deleted!')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchPayments()
      fetchStats()
    } catch (err: any) {
      setStatusMsg('Failed to delete payment')
    }
  }

  const filteredPayments = payments.filter((payment) =>
    payment.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entry': return 'bg-blue-50 text-blue-700'
      case 'prize': return 'bg-green-50 text-green-700'
      case 'refund': return 'bg-red-50 text-red-700'
      case 'subscription': return 'bg-purple-50 text-purple-700'
      case 'tournament': return 'bg-indigo-50 text-indigo-700'
      case 'squad_war': return 'bg-pink-50 text-pink-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">💳 Payments & Transactions</h1>
        <p className="text-muted-foreground mt-2">Track all financial transactions on the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">${stats.totalRevenue?.toFixed(2) || '0.00'}</div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{stats.completedPayments || 0}</div>
            <p className="text-sm text-muted-foreground">Completed Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingPayments || 0}</div>
            <p className="text-sm text-muted-foreground">Pending Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600">${stats.refundedAmount?.toFixed(2) || '0.00'}</div>
            <p className="text-sm text-muted-foreground">Refunded Amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by username, description, or transaction ID..."
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <span className="text-sm font-medium pt-2">Status:</span>
          <Button 
            variant={filterStatus === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(null)}
          >
            All
          </Button>
          <Button 
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </Button>
          <Button 
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </Button>
          <Button 
            variant={filterStatus === 'refunded' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('refunded')}
          >
            Refunded
          </Button>
        </div>

        <div className="flex gap-2">
          <span className="text-sm font-medium pt-2">Type:</span>
          <Button 
            variant={filterType === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType(null)}
          >
            All
          </Button>
          <Button 
            variant={filterType === 'entry' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('entry')}
          >
            Entry
          </Button>
          <Button 
            variant={filterType === 'prize' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('prize')}
          >
            Prize
          </Button>
          <Button 
            variant={filterType === 'subscription' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('subscription')}
          >
            Subscription
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Recent Transactions</CardTitle>
          <CardDescription>Total: {filteredPayments.length} transaction(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No transactions found' : 'No transactions to display'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* User & Transaction Info */}
                  <div className="col-span-6">
                    <h3 className="font-semibold text-lg">{payment.username}</h3>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm">{payment.description || 'No description'}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {payment.transactionId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Badge className={getTypeColor(payment.type)}>
                        {payment.type?.charAt(0).toUpperCase() + payment.type?.slice(1)}
                      </Badge>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="col-span-6 flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${payment.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {payment.amount > 0 ? '+' : '-'}${Math.abs(payment.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{payment.paymentMethod}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {payment.status !== 'refunded' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefundPayment(payment._id, payment.username)}
                          title="Refund this payment"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Refund
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePayment(payment._id)}
                        title="Delete payment record"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
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
