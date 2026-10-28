import { useState, useEffect } from 'react'

export function MaintenancePage() {
  const [maintenance, setMaintenance] = useState<any>({
    enabled: false,
    message: 'We are currently undergoing scheduled maintenance. Please check back soon!',
    estimatedTime: null,
  })

  useEffect(() => {
    fetchMaintenanceStatus()
    const interval = setInterval(fetchMaintenanceStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  async function fetchMaintenanceStatus() {
    try {
      const res = await fetch('/api/admin/public-settings/maintenance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setMaintenance(data)
      }
    } catch (err) {
      console.error('Failed to fetch maintenance status:', err)
    }
  }

  if (!maintenance.enabled) {
    return null
  }

  const estimatedTime = maintenance.estimatedTime
    ? new Date(maintenance.estimatedTime).toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="text-6xl mb-6">🔧</div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">Under Maintenance</h1>

        {/* Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            {maintenance.message}
          </p>

          {/* Estimated Time */}
          {estimatedTime && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Estimated completion:</strong>
              </p>
              <p className="text-lg font-semibold text-blue-600">
                {estimatedTime}
              </p>
            </div>
          )}

          {/* Features that will be back */}
          <div className="text-left space-y-2 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Services being improved:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✨ Platform performance optimization</p>
              <p>✨ New features and improvements</p>
              <p>✨ Security enhancements</p>
              <p>✨ Bug fixes and stability</p>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-600">
              <strong>Need assistance?</strong>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Contact us at{' '}
              <a href="mailto:support@typingmaster.com" className="text-blue-600 hover:underline">
                support@typingmaster.com
              </a>
            </p>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        <p className="text-white text-sm opacity-80">
          Thank you for your patience. We'll be back online soon!
        </p>
      </div>
    </div>
  )
}
