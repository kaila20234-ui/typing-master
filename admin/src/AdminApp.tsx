import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogOut, Lock, Mail, Key } from 'lucide-react'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { NotificationContainer } from '@/components/NotificationContainer'
import { AuditDashboard } from '@/components/AuditDashboard'
import { apiClient } from '@/lib/api'
import { DashboardPage } from '@/pages/DashboardPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { TournamentsPage } from '@/pages/TournamentsPage'
import { RacesPage } from '@/pages/RacesPage'
import { DailyChallengesPage } from '@/pages/DailyChallengesPage'
import { SquadWarsPage } from '@/pages/SquadWarsPage'
import { LeaderboardsPage } from '@/pages/LeaderboardsPage'
import { UsersPage } from '@/pages/UsersPage'
import { ModerationPage } from '@/pages/ModerationPage'
import { PaymentsPage } from '@/pages/PaymentsPage'
import { SettingsPage } from '@/pages/SettingsPage'

interface AdminUser {
  id: string
  email: string
  username: string
  role: string
}

export default function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignupMode, setIsSignupMode] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [createAsAdmin, setCreateAsAdmin] = useState(false)
  const [adminSecret, setAdminSecret] = useState('')

  // Check if already logged in via token
  useEffect(() => {
    const verifyAdminAccess = async () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          apiClient.setToken(token)
          const result = await apiClient.getMe()
          const userData = result.data as any
          if (userData?.role === 'admin') {
            setAdminUser({
              id: userData.id || '',
              email: userData.email || '',
              username: userData.username || '',
              role: userData.role
            })
            setIsLoggedIn(true)
          } else {
            localStorage.removeItem('authToken')
            setIsLoggedIn(false)
          }
        } catch (err) {
          localStorage.removeItem('authToken')
          setIsLoggedIn(false)
        }
      }
    }

    verifyAdminAccess()
  }, [])

  const handleAdminAuth = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignupMode) {
        // Signup mode
        if (!email.trim() || !password.trim() || !name.trim() || !username.trim()) {
          setError('Please fill in all fields')
          setLoading(false)
          return
        }

        if (createAsAdmin && !adminSecret.trim()) {
          setError('Please enter admin secret to create admin account')
          setLoading(false)
          return
        }

        const result = await apiClient.register(
          email.trim(), 
          username.trim().toLowerCase().replace(/\s/g, ''), 
          name.trim(), 
          password,
          undefined,
          createAsAdmin,
          createAsAdmin ? adminSecret : undefined
        )

        if (result.error) {
          setError('Signup failed: ' + result.error)
          setLoading(false)
          return
        }

        // After signup, log them in
        const responseData = result.data as any
        if (responseData?.token) {
          localStorage.setItem('authToken', responseData.token)
          apiClient.setToken(responseData.token)
          
          const userRole = responseData.user?.role || 'user'
          
          // Check if user should have admin access
          if (createAsAdmin && userRole !== 'admin') {
            setError('Admin account creation successful, but role was not set to admin. Please log in and check settings.')
            setLoading(false)
            localStorage.removeItem('authToken')
            return
          }
          
          setAdminUser({
            id: responseData.user?.id || responseData.id || '',
            email: responseData.user?.email || email,
            username: responseData.user?.username || username,
            role: userRole
          })
          setIsLoggedIn(true)
          setEmail('')
          setPassword('')
          setName('')
          setUsername('')
          setCreateAsAdmin(false)
          setAdminSecret('')
        }
      } else {
        // Login mode
        if (!email.trim() || !password.trim()) {
          setError('Please enter email and password')
          setLoading(false)
          return
        }

        const result = await apiClient.login(email.trim(), password)

        if (result.error) {
          setError('Invalid credentials or unauthorized access')
          setLoading(false)
          return
        }

        const responseData = result.data as any
        if (responseData?.user?.role !== 'admin') {
          setError('This account does not have admin privileges')
          setLoading(false)
          return
        }

        // Admin verified
        const token = responseData?.token
        if (token) {
          localStorage.setItem('authToken', token)
          apiClient.setToken(token)
        }
        setAdminUser({
          id: responseData.user.id,
          email: responseData.user.email,
          username: responseData.user.username,
          role: responseData.user.role
        })
        setIsLoggedIn(true)
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError(isSignupMode ? 'Signup failed. Please try again.' : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    setAdminUser(null)
    setIsLoggedIn(false)
    setEmail('')
    setPassword('')
  }

  // Render page content based on currentPage
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'audit':
        return <AuditDashboard />
      case 'tournaments':
        return <TournamentsPage />
      case 'races':
        return <RacesPage />
      case 'daily-challenges':
        return <DailyChallengesPage />
      case 'squad-wars':
        return <SquadWarsPage />
      case 'leaderboards':
        return <LeaderboardsPage />
      case 'all-users':
        return <UsersPage />
      case 'moderation':
        return <ModerationPage />
      case 'payments':
        return <PaymentsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  // Admin Panel Page
  if (isLoggedIn && adminUser) {
    return (
      <>
        <NotificationContainer />
        <div className="flex min-h-screen bg-background">
          {/* Sidebar */}
          <SidebarNav activeItem={currentPage} onNavigate={setCurrentPage} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col md:ml-0">
            {/* Header */}
            <header className="border-b border-border bg-card sticky top-0 z-30">
              <div className="px-6 py-4 flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">TypeMaster Admin</h1>
                  <p className="text-sm text-muted-foreground mt-1">Management Dashboard</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{adminUser.username}</p>
                    <p className="text-xs text-muted-foreground">Admin Account</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto p-6">
              {renderPageContent()}
            </main>
          </div>
        </div>
      </>
    )
  }

  // Login Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            {isSignupMode ? 'Create Admin Account' : 'Admin Login'}
          </CardTitle>
          <p className="text-xs text-muted-foreground text-center mt-2">
            TypeMaster Admin Panel
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminAuth} className="space-y-4">
            {error && (
              <Alert className="bg-destructive/10 border-destructive text-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSignupMode && (
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  type="text"
                  placeholder="Admin Name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
              </div>
            )}

            {isSignupMode && (
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  type="text"
                  placeholder="admin_username"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                />
              </div>
            )}

            {isSignupMode && (
              <div className="space-y-3 p-3 bg-muted rounded-md border border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createAsAdmin"
                    checked={createAsAdmin}
                    onChange={(e) => setCreateAsAdmin(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="createAsAdmin" className="cursor-pointer mb-0">
                    Create as Admin Account
                  </Label>
                </div>
                {createAsAdmin && (
                  <div className="space-y-2">
                    <Label>Admin Secret Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter admin secret"
                      value={adminSecret}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminSecret(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Required to create admin accounts</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (isSignupMode ? 'Creating Account...' : 'Logging in...') : (isSignupMode ? 'Create Admin Account' : 'Login')}
            </Button>

            <div className="text-center pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsSignupMode(!isSignupMode)
                  setError('')
                  setEmail('')
                  setPassword('')
                  setName('')
                  setUsername('')
                }}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {isSignupMode ? 'Already have an account? Login' : "Don't have an account? Create one"}
              </button>
            </div>

            <div className="text-xs text-muted-foreground text-center mt-4 p-3 bg-muted rounded border border-border">
              {isSignupMode ? (
                <>
                  <p className="font-semibold mb-2">📝 Creating Admin Account</p>
                  <p className="mb-2">To create a new admin account:</p>
                  <ol className="text-left space-y-1 mb-2">
                    <li>1. Check "Create as Admin Account" option</li>
                    <li>2. Enter the admin secret key</li>
                    <li>3. Fill in all fields and submit</li>
                  </ol>
                  <p className="font-semibold mt-2">Admin Secret: <span className="font-mono text-foreground">admin_secret_key_123</span></p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">Default Admin Credentials</p>
                  <p>Email: admin@typemaster.com</p>
                  <p>Password: Admin@123456</p>
                  <p className="mt-2 text-destructive font-medium">⚠️ Change password after first login!</p>
                  <p className="mt-2">Or <span className="text-primary font-medium">create a new admin account</span> using signup</p>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )}