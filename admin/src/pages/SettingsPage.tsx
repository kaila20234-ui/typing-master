import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    platformName: '',
    contactEmail: '',
    supportUrl: '',
    maintenanceMode: {
      enabled: false,
      message: '',
      estimatedTime: null,
    },
  })
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await apiClient.getAdminSettings()
      setSettings(res.data)
    } catch (err) {
      console.error('Failed to fetch settings')
    }
  }

  async function handleToggleMaintenance() {
    try {
      const newState = !settings.maintenanceMode.enabled
      await apiClient.updateAdminSettings({
        maintenanceMode: {
          enabled: newState,
          message: settings.maintenanceMode.message,
          estimatedTime: settings.maintenanceMode.estimatedTime,
        }
      })
      setStatusMsg(newState ? '🔧 Maintenance mode ENABLED' : '✅ Maintenance mode DISABLED')
      setTimeout(() => setStatusMsg(''), 3000)
      fetchSettings()
    } catch (err: any) {
      setStatusMsg('Failed to toggle maintenance mode')
    }
  }

  async function handleSaveGeneral() {
    try {
      await apiClient.updateAdminSettings({
        platformName: settings.platformName,
        contactEmail: settings.contactEmail,
        supportUrl: settings.supportUrl,
      })
      setStatusMsg('Settings saved successfully!')
      setTimeout(() => setStatusMsg(''), 3000)
    } catch (err: any) {
      setStatusMsg('Failed to save settings')
    }
  }

  async function handleSaveMaintenance() {
    try {
      await apiClient.updateAdminSettings({
        maintenanceMode: {
          enabled: settings.maintenanceMode.enabled,
          message: settings.maintenanceMode.message,
          estimatedTime: settings.maintenanceMode.estimatedTime,
        }
      })
      setStatusMsg('Maintenance settings updated!')
      setTimeout(() => setStatusMsg(''), 3000)
    } catch (err: any) {
      setStatusMsg('Failed to update maintenance settings')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">⚙️ Settings</h1>
        <p className="text-muted-foreground mt-2">Manage platform settings and maintenance mode</p>
      </div>

      {/* Maintenance Mode Section */}
      <Card className="border-2 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">🔧 Maintenance Mode</CardTitle>
          <CardDescription>
            Enable maintenance mode to temporarily take the platform offline for updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-white rounded-lg border border-red-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">Status</p>
                <p className={`text-sm mt-1 ${settings.maintenanceMode.enabled ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}`}>
                  {settings.maintenanceMode.enabled ? '🔴 MAINTENANCE MODE ACTIVE' : '🟢 PLATFORM OPERATIONAL'}
                </p>
                {settings.maintenanceMode.enabled && settings.maintenanceMode.startedAt && (
                  <p className="text-xs text-gray-600 mt-2">
                    Started at: {new Date(settings.maintenanceMode.startedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <Button
                onClick={handleToggleMaintenance}
                variant={settings.maintenanceMode.enabled ? 'destructive' : 'outline'}
                size="lg"
              >
                {settings.maintenanceMode.enabled ? '🟢 Disable' : '🔴 Enable'}
              </Button>
            </div>
          </div>

          {/* Maintenance Message */}
          <div>
            <label className="block text-sm font-medium mb-2">Maintenance Message</label>
            <textarea
              value={settings.maintenanceMode.message}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenanceMode: {
                    ...settings.maintenanceMode,
                    message: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={4}
              placeholder="Enter message to show users during maintenance..."
            />
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium mb-2">Estimated Completion Time</label>
            <input
              type="datetime-local"
              value={settings.maintenanceMode.estimatedTime ? new Date(settings.maintenanceMode.estimatedTime).toISOString().slice(0, 16) : ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenanceMode: {
                    ...settings.maintenanceMode,
                    estimatedTime: e.target.value ? new Date(e.target.value).toISOString() : null,
                  },
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <Button onClick={handleSaveMaintenance} className="w-full bg-blue-600 hover:bg-blue-700">
            Save Maintenance Settings
          </Button>
        </CardContent>
      </Card>

      {/* General Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>📋 General Settings</CardTitle>
          <CardDescription>Configure basic platform information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Platform Name</label>
            <Input
              value={settings.platformName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  platformName: e.target.value,
                })
              }
              placeholder="e.g., Typing Master Platform"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Contact Email</label>
            <Input
              type="email"
              value={settings.contactEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contactEmail: e.target.value,
                })
              }
              placeholder="e.g., support@typingmaster.com"
            />
          </div>

          {/* Support URL */}
          <div>
            <label className="block text-sm font-medium mb-2">Support URL</label>
            <Input
              type="url"
              value={settings.supportUrl}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  supportUrl: e.target.value,
                })
              }
              placeholder="e.g., https://typingmaster.com"
            />
          </div>

          <Button onClick={handleSaveGeneral} className="w-full">
            Save General Settings
          </Button>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ About Maintenance Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            ✅ <strong>Enabled:</strong> Users will see a maintenance page with your custom message
          </p>
          <p>
            ✅ <strong>Estimated Time:</strong> Shows users when they can expect service to resume
          </p>
          <p>
            ✅ <strong>Admin Access:</strong> Admins can still access the application during maintenance
          </p>
          <p>
            ✅ <strong>Instant Update:</strong> Changes take effect immediately across the platform
          </p>
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
