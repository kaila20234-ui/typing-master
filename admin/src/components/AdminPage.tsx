import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { AdminPanel } from '@/components/ui/admin-panel'

interface AdminPageProps {
  userId?: string
  isAdmin: boolean
  onLogout?: () => void
  onBack?: () => void
}

export function AdminPage({ userId, isAdmin, onLogout, onBack }: AdminPageProps) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is admin
    if (isAdmin && userId) {
      setAuthorized(true)
    }
    setLoading(false)
  }, [isAdmin, userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="text-center">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authorized - show access denied
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4">
        <div className="max-w-md w-full">
          <Card className="bg-red-900/20 border-red-600/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <CardTitle className="text-2xl text-red-400">Access Denied</CardTitle>
              </div>
              <CardDescription className="text-red-300 mt-2">
                Admin Panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-200">
                You do not have permission to access this page. Only administrators can access the admin panel.
              </p>

              <div className="space-y-2">
                <p className="text-sm text-red-300 font-semibold">Your Status:</p>
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <p className="text-sm text-slate-300">
                    User ID: <span className="text-slate-400">{userId || 'Not available'}</span>
                  </p>
                  <p className="text-sm text-red-400 mt-1">
                    Role: <span className="font-bold">User</span> (Admin required)
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-3">
                  If you believe this is an error, please contact a system administrator.
                </p>
                <div className="flex gap-2">
                  {onBack && (
                    <Button
                      onClick={onBack}
                      variant="outline"
                      className="flex-1"
                    >
                      Go Back
                    </Button>
                  )}
                  {onLogout && (
                    <Button
                      onClick={onLogout}
                      variant="destructive"
                      className="flex-1"
                    >
                      Logout
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Authorized - show admin panel
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
          <div>
            <h1 className="text-4xl font-bold text-white">⚙️ Admin Panel</h1>
            <p className="text-slate-400 mt-1">Restricted Access - Administrators Only</p>
          </div>
          <div className="flex gap-2">
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
              >
                Exit Admin
              </Button>
            )}
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="destructive"
              >
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Security Info Banner */}
        <Alert className="mb-6 bg-green-900/20 border-green-600/50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-300">
            ✓ You have verified admin access to this panel. All actions are logged for security purposes.
          </AlertDescription>
        </Alert>

        {/* Admin Panel Component */}
        <AdminPanel
          userId={userId}
          isAdmin={isAdmin}
          onBack={onBack}
        />
      </div>
    </div>
  )
}
