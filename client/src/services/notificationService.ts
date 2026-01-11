// Notification Service for PWA - Thông báo trước giờ học

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  minutesBefore: number; // 5, 10, 15, 30
  soundDuration: 'short' | 'medium' | 'long'; // Độ dài chuông
}

const STORAGE_KEY = 'notification-settings';
const SCHEDULED_KEY = 'scheduled-notifications';

// Default settings - Mặc định tắt thông báo
const defaultSettings: NotificationSettings = {
  enabled: false,
  soundEnabled: true,
  minutesBefore: 5,
  soundDuration: 'medium',
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

// Sound duration configurations
const soundDurations = {
  short: { duration: 0.8, repeats: 1 },
  medium: { duration: 1.5, repeats: 2 },
  long: { duration: 3.0, repeats: 3 },
};

// Play a single notification chime
const playChime = (audioContext: AudioContext, startTime: number, volume: number = 0.3): void => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.type = 'sine';
  oscillator2.type = 'sine';

  // Pleasant two-tone chime (like a doorbell)
  oscillator1.frequency.setValueAtTime(659.25, startTime); // E5
  oscillator1.frequency.setValueAtTime(783.99, startTime + 0.15); // G5
  oscillator1.frequency.setValueAtTime(987.77, startTime + 0.3); // B5

  oscillator2.frequency.setValueAtTime(329.63, startTime); // E4 (harmony)
  oscillator2.frequency.setValueAtTime(392.00, startTime + 0.15); // G4
  oscillator2.frequency.setValueAtTime(493.88, startTime + 0.3); // B4

  // Volume envelope
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
  gainNode.gain.setValueAtTime(volume, startTime + 0.35);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

  oscillator1.start(startTime);
  oscillator1.stop(startTime + 0.6);
  oscillator2.start(startTime);
  oscillator2.stop(startTime + 0.6);
};

// Play notification sound
export const playNotificationSound = (): void => {
  const settings = getNotificationSettings();
  if (!settings.soundEnabled) return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const config = soundDurations[settings.soundDuration] || soundDurations.medium;

    // Play chimes based on duration setting
    for (let i = 0; i < config.repeats; i++) {
      const startTime = audioContext.currentTime + (i * 0.7); // 0.7s gap between chimes
      playChime(audioContext, startTime, 0.25);
    }
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
