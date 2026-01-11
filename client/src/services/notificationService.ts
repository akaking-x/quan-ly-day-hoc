// Notification Service for PWA - Thông báo trước giờ học

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  minutesBefore: number; // 5, 10, 15, 30
}

const STORAGE_KEY = 'notification-settings';
const SCHEDULED_KEY = 'scheduled-notifications';

// Default settings
const defaultSettings: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  minutesBefore: 5,
};

// Get notification settings from localStorage
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading notification settings:', e);
  }
  return defaultSettings;
};

// Save notification settings
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving notification settings:', e);
  }
};

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
};

// Get current permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

// Play notification sound
export const playNotificationSound = (): void => {
  const settings = getNotificationSettings();
  if (!settings.soundEnabled) return;

  try {
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant notification tone
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6
    oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.2); // E6

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error('Error playing notification sound:', e);
  }
};

// Show a notification
export const showNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  const settings = getNotificationSettings();

  if (!settings.enabled || !isNotificationSupported()) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    // Play sound if enabled
    if (settings.soundEnabled) {
      playNotificationSound();
    }

    // Try to use service worker notification first (works better on mobile)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'session-reminder',
        renotify: true,
        ...options,
      } as NotificationOptions & { vibrate?: number[]; renotify?: boolean });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options,
      });
    }
  } catch (e) {
    console.error('Error showing notification:', e);
  }
};

// Session interface for scheduling
export interface ScheduledSession {
  id: string;
  date: string;
  startTime: string;
  subject: string;
  groupName?: string;
}

// Get scheduled notifications
export const getScheduledNotifications = (): Map<string, number> => {
  try {
    const stored = localStorage.getItem(SCHEDULED_KEY);
    if (stored) {
      return new Map(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Error reading scheduled notifications:', e);
  }
  return new Map();
};

// Save scheduled notifications
const saveScheduledNotifications = (scheduled: Map<string, number>): void => {
  try {
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(Array.from(scheduled.entries())));
  } catch (e) {
    console.error('Error saving scheduled notifications:', e);
  }
};

// Schedule a notification for a session
export const scheduleSessionNotification = (session: ScheduledSession): void => {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const scheduled = getScheduledNotifications();
  const sessionKey = `${session.id}-${session.date}`;

  // Already scheduled?
  if (scheduled.has(sessionKey)) {
    clearTimeout(scheduled.get(sessionKey));
  }

  // Calculate when to notify
  const [hours, minutes] = session.startTime.split(':').map(Number);
  const sessionDate = new Date(session.date);
  sessionDate.setHours(hours, minutes, 0, 0);

  const notifyTime = new Date(sessionDate.getTime() - settings.minutesBefore * 60 * 1000);
  const now = new Date();
  const delay = notifyTime.getTime() - now.getTime();

  // Only schedule if in the future and within 24 hours
  if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
    const timeoutId = window.setTimeout(() => {
      showNotification(
        `Sắp đến giờ học!`,
        {
          body: `${session.subject}${session.groupName ? ` - ${session.groupName}` : ''} bắt đầu lúc ${session.startTime}`,
          tag: `session-${session.id}`,
          requireInteraction: true,
        }
      );

      // Remove from scheduled
      const currentScheduled = getScheduledNotifications();
      currentScheduled.delete(sessionKey);
      saveScheduledNotifications(currentScheduled);
    }, delay);

    scheduled.set(sessionKey, timeoutId);
    saveScheduledNotifications(scheduled);
  }
};

// Schedule notifications for multiple sessions
export const scheduleAllNotifications = (sessions: ScheduledSession[]): void => {
  // Clear all existing scheduled notifications
  clearAllScheduledNotifications();

  // Schedule new ones
  sessions.forEach(session => {
    scheduleSessionNotification(session);
  });
};

// Clear all scheduled notifications
export const clearAllScheduledNotifications = (): void => {
  const scheduled = getScheduledNotifications();
  scheduled.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  localStorage.removeItem(SCHEDULED_KEY);
};

// Check and reschedule notifications on app load
export const initializeNotifications = async (sessions: ScheduledSession[]): Promise<void> => {
  const settings = getNotificationSettings();

  if (!settings.enabled || !isNotificationSupported()) {
    return;
  }

  // Request permission if not already granted
  if (Notification.permission === 'default') {
    await requestNotificationPermission();
  }

  // Schedule notifications for upcoming sessions
  if (Notification.permission === 'granted') {
    scheduleAllNotifications(sessions);
  }
};

// Format time until notification
export const formatTimeUntilSession = (date: string, startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const sessionDate = new Date(date);
  sessionDate.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const diff = sessionDate.getTime() - now.getTime();

  if (diff < 0) return 'Đã qua';

  const diffMinutes = Math.floor(diff / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} ngày nữa`;
  if (diffHours > 0) return `${diffHours} giờ nữa`;
  if (diffMinutes > 0) return `${diffMinutes} phút nữa`;
  return 'Sắp bắt đầu';
};
