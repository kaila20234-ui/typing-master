import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Lock, Unlock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await apiClient.getAdminUsers()
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.users || []
      setUsers(data.map((user: any) => ({
        ...user,
        _id: user._id,
        id: user._id || user.id,
        status: user.status || 'active'
      })))
    } catch (err) {
      setUsers([])
    }
  }

  async function handleSuspendUser(userId: string, currentStatus: string) {
    if (!userId) {
      setStatusMsg('User ID is missing')
      return
    }
    
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    const action = currentStatus === 'suspended' ? 'unsuspended' : 'suspended'

    try {
      const res = await apiClient.updateAdminUser(userId, { status: newStatus })
      if (!res.error) {
        setStatusMsg(`User ${action}!`)
        setTimeout(() => setStatusMsg(''), 3000)
        await fetchUsers()
      } else {
        setStatusMsg('Failed to update user status: ' + res.error)
      }
    } catch (err: any) {
      setStatusMsg('Failed to update user status: ' + (err.message || 'Unknown error'))
    }
  }

  async function handleDeleteUser(userId: string, username: string) {
    if (!userId) {
      setStatusMsg('User ID is missing')
      return
    }

    if (!confirm(`Are you sure you want to delete ${username}? This action cannot be undone.`)) return

    try {
      const res = await apiClient.deleteAdminUser(userId)
      if (!res.error) {
        setStatusMsg('User deleted!')
        setTimeout(() => setStatusMsg(''), 3000)
        await fetchUsers()
      } else {
        setStatusMsg('Failed to delete user: ' + res.error)
      }
    } catch (err: any) {
      setStatusMsg('Failed to delete user: ' + (err.message || 'Unknown error'))
    }
  }

  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-2">Manage platform users and accounts</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search users by name or email..."
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Badge variant="secondary" className="px-3 py-1 h-10 flex items-center">
          {filteredUsers.length} users
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>👥 User Management</CardTitle>
          <CardDescription>View and manage platform users • Suspend or delete accounts as needed</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No users found</p>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* User Info */}
                  <div className="col-span-6">
                    <h3 className="font-medium text-lg">{user.username}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined: {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'} • 
                      Races: {user.races || 0}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2">
                    <Badge
                      variant={user.status === 'active' ? 'default' : 'destructive'}
                      className="w-full text-center justify-center"
                    >
                      {user.status === 'active' ? '✅ Active' : '🔒 Suspended'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="col-span-4 flex gap-2 justify-end">
                    <Button
                      variant={user.status === 'suspended' ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => handleSuspendUser(user._id || user.id, user.status)}
                      title={user.status === 'suspended' ? 'Unsuspend user' : 'Suspend user'}
                    >
                      {user.status === 'suspended' ? (
                        <>
                          <Unlock className="w-4 h-4 mr-1" />
                          Unsuspend
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-1" />
                          Suspend
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user._id || user.id, user.username)}
                      title="Delete user permanently"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
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
