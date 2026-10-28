/**
 * Admin Notifications System
 * Provides toast-like notifications for admin actions
 */

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
  action?: string
  actionCallback?: () => void
}

// Store active notifications
let notificationStore: Notification[] = []
let listeners: Array<(notifications: Notification[]) => void> = []

/**
 * Subscribe to notification changes
 */
export function subscribeToNotifications(callback: (notifications: Notification[]) => void) {
  listeners.push(callback)
  // Initial call with current notifications
  callback(notificationStore)
  
  return () => {
    listeners = listeners.filter(listener => listener !== callback)
  }
}

/**
 * Notify all subscribers
 */
function notifySubscribers() {
  listeners.forEach(listener => listener(notificationStore))
}

/**
 * Show a notification
 */
export function showNotification(notification: Omit<Notification, 'id'>) {
  const id = `notification-${Date.now()}-${Math.random()}`
  const newNotification: Notification = {
    ...notification,
    id,
    duration: notification.duration || 3000
  }

  notificationStore.push(newNotification)
  notifySubscribers()

  // Auto-remove after duration
  if (newNotification.duration) {
    setTimeout(() => {
      removeNotification(id)
    }, newNotification.duration)
  }

  return id
}

/**
 * Remove a notification
 */
export function removeNotification(id: string) {
  notificationStore = notificationStore.filter(n => n.id !== id)
  notifySubscribers()
}

/**
 * Clear all notifications
 */
export function clearNotifications() {
  notificationStore = []
  notifySubscribers()
}

/**
 * Shortcut methods
 */
export const notify = {
  success: (message: string, duration?: number) =>
    showNotification({ type: 'success', message, duration }),
  
  error: (message: string, duration?: number) =>
    showNotification({ type: 'error', message, duration }),
  
  info: (message: string, duration?: number) =>
    showNotification({ type: 'info', message, duration }),
  
  warning: (message: string, duration?: number) =>
    showNotification({ type: 'warning', message, duration }),
  
  promise: async <T,>(
    promise: Promise<T>,
    loadingMessage: string,
    successMessage: string,
    errorMessage: string = 'Operation failed'
  ): Promise<T> => {
    showNotification({ type: 'info', message: loadingMessage })
    try {
      const result = await promise
      showNotification({ type: 'success', message: successMessage })
      return result
    } catch (error: any) {
      showNotification({ 
        type: 'error', 
        message: `${errorMessage}: ${error.response?.data?.error || error.message}` 
      })
      throw error
    }
  }
}
