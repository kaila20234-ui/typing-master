import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Button } from './button'
import { Badge } from './badge'
import { Alert, AlertDescription } from './alert'
import { AlertCircle, ToggleRight } from 'lucide-react'

interface AdminPanelProps {
  userId?: string
  isAdmin: boolean
  onBack?: () => void
}

export function AdminPanel({ userId, isAdmin, onBack }: AdminPanelProps) {
  const [devMode, setDevMode] = useState(false)

  if (!isAdmin && !devMode) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700">
          Admin access required. You must have admin role to access this panel.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">⚙️ Admin Panel</h1>
          {!isAdmin && devMode && (
            <Badge variant="outline" className="bg-yellow-900/50 text-yellow-300">
              Dev Mode - Not Official Admin
            </Badge>
          )}
          {isAdmin && (
            <Badge variant="outline" className="bg-green-900/50 text-green-300">
              Official Admin
            </Badge>
          )}
        </div>
        <p className="text-slate-400">Manage tournaments, registrations, prizes, and more</p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full gap-2 grid-cols-auto">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="tournaments">🏆 Tournaments</TabsTrigger>
          <TabsTrigger value="users">👥 Users</TabsTrigger>
          <TabsTrigger value="payments">💳 Payments</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">Total Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-400">—</p>
                <p className="text-xs text-slate-500 mt-1">Connect to backend</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">Active Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-400">—</p>
                <p className="text-xs text-slate-500 mt-1">Across all tournaments</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-400">$0.00</p>
                <p className="text-xs text-slate-500 mt-1">From paid tournaments</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">Prize Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-400">$0.00</p>
                <p className="text-xs text-slate-500 mt-1">Total awarded</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-900/20 border-blue-600/50">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>📈 Admin dashboard is ready to display tournament analytics</p>
              <p>💾 Backend integration required for live data</p>
              <p>🔗 Connect to /api/admin/stats endpoint for metrics</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tournaments Tab */}
        <TabsContent value="tournaments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Management</CardTitle>
              <CardDescription>Create, edit, and manage tournaments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-slate-400">
                <p>✅ Create new tournaments (paid/free)</p>
                <p>✅ Set entry fees and prize pools</p>
                <p>✅ Manage tournament status</p>
                <p>✅ View and moderate registrations</p>
                <p>✅ Distribute prizes to winners</p>
                <p>✅ Process refunds if needed</p>
              </div>
              
              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="font-semibold text-white mb-3">To Create a Tournament:</p>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li>1. Use the backend API: POST /api/tournaments</li>
                  <li>2. Set required fields: name, type, maxParticipants</li>
                  <li>3. Optional: entryFee, requiresPayment, prizePool</li>
                  <li>4. Verify in Tournaments view</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="font-semibold text-white mb-2">Your Account</p>
                  <div className="space-y-1 text-sm text-slate-400">
                    <p>👤 User ID: {userId || 'Not available'}</p>
                    <p>🔑 Role: <span className="text-green-400">{isAdmin ? 'Admin' : 'User'}</span></p>
                    <p>📊 Status: <span className="text-blue-400">Active</span></p>
                  </div>
                </div>

                <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-600/50">
                  <p className="font-semibold text-blue-300 mb-2">Admin Capabilities</p>
                  <ul className="space-y-1 text-sm text-blue-200">
                    <li>✓ View all users and their stats</li>
                    <li>✓ Assign/revoke admin roles</li>
                    <li>✓ Monitor user activity</li>
                    <li>✓ Manage account restrictions</li>
                    <li>✓ View user earnings and withdrawals</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>Monitor and manage all payments and transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-800/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-400 mb-2">Pending Payments</p>
                    <p className="text-2xl font-bold text-yellow-400">0</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-400 mb-2">Completed Payments</p>
                    <p className="text-2xl font-bold text-green-400">0</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-400 mb-2">Failed Payments</p>
                    <p className="text-2xl font-bold text-red-400">0</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-400 mb-2">Refunds</p>
                    <p className="text-2xl font-bold text-blue-400">0</p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-600/50">
                <p className="font-semibold text-purple-300 mb-2">Payment Features</p>
                <ul className="space-y-1 text-sm text-purple-200">
                  <li>✓ View all payment transactions</li>
                  <li>✓ PayPal integration monitoring</li>
                  <li>✓ Process refunds</li>
                  <li>✓ Download payment reports</li>
                  <li>✓ Monitor fraud/disputes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
              <CardDescription>Configure admin panel and system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Admin Mode Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white font-medium">Admin Mode</label>
                  <Badge className={isAdmin ? 'bg-green-600' : 'bg-slate-600'}>
                    {isAdmin ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">
                  {isAdmin 
                    ? 'You have full admin access enabled.'
                    : 'Developer mode available for testing'}
                </p>
              </div>

              {/* Dev Mode Toggle (if not official admin) */}
              {!isAdmin && (
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white font-medium">Developer Mode</label>
                    <Button
                      size="sm"
                      variant={devMode ? 'default' : 'outline'}
                      onClick={() => setDevMode(!devMode)}
                      className="gap-2"
                    >
                      <ToggleRight className="w-4 h-4" />
                      {devMode ? 'Enabled' : 'Enable'}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-400">
                    Enable developer mode to access admin panel for testing (not official)
                  </p>
                </div>
              )}

              {/* System Settings */}
              <div className="border-t border-slate-700 pt-4 space-y-3">
                <h4 className="font-semibold text-white">System Configuration</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    <span className="text-sm text-slate-400">Platform Commission</span>
                    <span className="text-sm font-bold text-white">10%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    <span className="text-sm text-slate-400">Prize Distribution 1st</span>
                    <span className="text-sm font-bold text-white">50%</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    <span className="text-sm text-slate-400">Prize Distribution 2nd</span>
                    <span className="text-sm font-bold text-white">30%</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    <span className="text-sm text-slate-400">Prize Distribution 3rd</span>
                    <span className="text-sm font-bold text-white">20%</span>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="border-t border-slate-700 pt-4">
                <h4 className="font-semibold text-white mb-3">API Endpoints</h4>
                <div className="space-y-2 text-xs font-mono text-slate-400 bg-slate-900/50 p-3 rounded border border-slate-700">
                  <p>GET /api/admin/stats</p>
                  <p>GET /api/tournaments</p>
                  <p>POST /api/tournaments</p>
                  <p>GET /api/competitions/:id/registrations</p>
                  <p>POST /api/competitions/:id/distribute-prizes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Access Info */}
      <Card className="bg-green-900/20 border-green-600/50">
        <CardHeader>
          <CardTitle className="text-lg text-green-300">🎯 What You Can Do</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-green-200">
            <li>✅ Go to Tournaments → Select any paid tournament</li>
            <li>✅ Click the "⚙️ Admin" tab to access tournament admin dashboard</li>
            <li>✅ View all registrations and payment statuses</li>
            <li>✅ Distribute prizes to top 3 winners</li>
            <li>✅ Process refunds if necessary</li>
            <li>✅ Export statistics and reports</li>
          </ul>
        </CardContent>
      </Card>

      {onBack && (
        <Button onClick={onBack} variant="outline" className="w-full">
          Back
        </Button>
      )}
    </div>
  )
}
