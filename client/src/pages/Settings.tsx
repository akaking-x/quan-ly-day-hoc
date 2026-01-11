import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Button, Input, Card, CardBody, SettingsSkeleton, Modal } from '../components/common';
import { settingsApi, databaseApi, DatabaseInfo, MigrateResult, authApi } from '../services/api';
import { backupRestore, BackupData } from '../services/offlineDb';
import { useAuthStore } from '../store/authStore';
import type { Settings as SettingsType } from '../types';

import {
  downloadAllDataWithProgress,
  addDownloadProgressListener,
  getLastDownloadTime,
  hasOfflineData,
  detectConflicts,
  resolveConflict,
  resolveAllConflicts,
  addConflictListener,
  getConflicts,
} from '../services/syncService';
import { ConflictItem } from '../services/offlineDb';
import {
  downloadForOffline,
  isOfflineReady,
  getOfflineDownloadTime,
  clearOfflineStatus,
  DownloadProgress,
} from '../services/offlineDownload';
import {
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  showNotification,
  playNotificationSound,
} from '../services/notificationService';

// Notification Settings Card
function NotificationSettingsCard() {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [testing, setTesting] = useState(false);

  const supported = isNotificationSupported();

  const handleToggleEnabled = async () => {
    if (!settings.enabled && permission !== 'granted') {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      if (newPermission !== 'granted') {
        return;
      }
    }
    const newSettings = { ...settings, enabled: !settings.enabled };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleToggleSound = () => {
    const newSettings = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleChangeReminderHours = (hours: number) => {
    const newSettings = { ...settings, reminderHours: Math.max(0, Math.min(24, hours)) };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleChangeReminderMinutes = (minutes: number) => {
    const newSettings = { ...settings, reminderMinutes: Math.max(0, Math.min(59, minutes)) };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleChangeSoundDuration = (seconds: number) => {
    const newSettings = { ...settings, soundDurationSeconds: Math.max(1, Math.min(60, seconds)) };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleTestNotification = async () => {
    setTesting(true);
    await showNotification('Thông báo thử nghiệm', {
      body: 'Đây là thông báo thử nghiệm từ ứng dụng Quản Lý Dạy Học',
    });
    setTesting(false);
  };

  const handleTestSound = () => {
    playNotificationSound();
  };

  if (!supported) {
    return (
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Thông báo</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Trình duyệt không hỗ trợ thông báo</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Thông báo nhắc nhở</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo trước giờ học</p>
          </div>
          {permission === 'denied' && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 rounded-full">
              Bị chặn
            </span>
          )}
        </div>

        {permission === 'denied' ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300">
              Thông báo đã bị chặn. Vui lòng mở cài đặt trình duyệt và cho phép thông báo cho trang web này.
            </p>
          </div>
        ) : (
          <>
            {/* Toggle Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Bật thông báo</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo trước khi buổi học bắt đầu</p>
              </div>
              <button
                onClick={handleToggleEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.enabled && (
              <>
                {/* Toggle Sound */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Âm thanh</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phát chuông khi có thông báo</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleSound}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Duration - chỉ hiện khi bật âm thanh */}
                {settings.soundEnabled && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Độ dài chuông</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Thời lượng âm thanh (1-60 giây)</p>
                        </div>
                      </div>
                      <button
                        onClick={handleTestSound}
                        className="px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                      >
                        Nghe thử
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={settings.soundDurationSeconds}
                        onChange={(e) => handleChangeSoundDuration(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 text-center text-lg font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="text-gray-600 dark:text-gray-400">giây</span>
                      <div className="flex gap-1 ml-auto">
                        {[3, 5, 10].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => handleChangeSoundDuration(sec)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              settings.soundDurationSeconds === sec
                                ? 'bg-purple-600 text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reminder Time - Hours & Minutes */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Thời gian báo trước</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo trước giờ học</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={settings.reminderHours}
                        onChange={(e) => handleChangeReminderHours(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-2 text-center text-lg font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="text-gray-600 dark:text-gray-400">giờ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={settings.reminderMinutes}
                        onChange={(e) => handleChangeReminderMinutes(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-2 text-center text-lg font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="text-gray-600 dark:text-gray-400">phút</span>
                    </div>
                    <div className="flex gap-1 ml-auto">
                      {[
                        { h: 0, m: 5, label: '5p' },
                        { h: 0, m: 15, label: '15p' },
                        { h: 0, m: 30, label: '30p' },
                        { h: 1, m: 0, label: '1h' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => {
                            handleChangeReminderHours(preset.h);
                            handleChangeReminderMinutes(preset.m);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            settings.reminderHours === preset.h && settings.reminderMinutes === preset.m
                              ? 'bg-purple-600 text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Test Button */}
                <button
                  onClick={handleTestNotification}
                  disabled={testing}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Gửi thông báo thử
                    </>
                  )}
                </button>
              </>
            )}
          </>
        )}

        {/* iOS Note */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Lưu ý iPhone/iPad:</strong> Cần thêm ứng dụng vào Màn hình chính (Add to Home Screen) để nhận thông báo.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

// Offline Data Management Card
function OfflineDataCard() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [downloading, setDownloading] = useState(false);
  const [downloadingApp, setDownloadingApp] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0, entity: '' });
  const [appProgress, setAppProgress] = useState<DownloadProgress | null>(null);
  const [lastDownload, setLastDownload] = useState<number | null>(null);
  const [lastAppDownload, setLastAppDownload] = useState<number | null>(null);
  const [hasData, setHasData] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial state
    getLastDownloadTime().then(setLastDownload);
    hasOfflineData().then(setHasData);

    // Load app offline status
    setAppReady(isOfflineReady());
    setLastAppDownload(getOfflineDownloadTime());

    // Listen for conflicts
    const unsubConflict = addConflictListener((c) => {
      setConflicts(c);
      if (c.length > 0) {
        setShowConflictModal(true);
      }
    });

    // Listen for download progress
    const unsubProgress = addDownloadProgressListener(setProgress);

    // Check initial conflicts
    setConflicts(getConflicts());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubConflict();
      unsubProgress();
    };
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await downloadAllDataWithProgress();
      if (result.success) {
        toast.success(result.message);
        setLastDownload(Date.now());
        setHasData(true);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Có lỗi khi tải dữ liệu');
    }
    setDownloading(false);
  };

  // Download entire app for offline use
  const handleDownloadApp = async () => {
    setDownloadingApp(true);
    setAppProgress(null);
    try {
      const success = await downloadForOffline((progress) => {
        setAppProgress(progress);
      });
      if (success) {
        toast.success('Đã tải xuống ứng dụng để sử dụng offline!');
        setAppReady(true);
        setLastAppDownload(Date.now());
      } else {
        toast.error('Có lỗi khi tải ứng dụng offline');
      }
    } catch {
      toast.error('Có lỗi khi tải ứng dụng offline');
    }
    setDownloadingApp(false);
  };

  const handleClearOffline = () => {
    clearOfflineStatus();
    setAppReady(false);
    setLastAppDownload(null);
    toast.success('Đã xóa trạng thái offline');
  };

  const handleCheckConflicts = async () => {
    setCheckingConflicts(true);
    try {
      const found = await detectConflicts();
      if (found.length === 0) {
        toast.success('Không có xung đột dữ liệu');
      } else {
        setShowConflictModal(true);
      }
    } catch {
      toast.error('Có lỗi khi kiểm tra xung đột');
    }
    setCheckingConflicts(false);
  };

  const handleResolve = async (conflictId: string, choice: 'local' | 'server') => {
    try {
      await resolveConflict(conflictId, choice);
      toast.success('Đã giải quyết xung đột');
    } catch {
      toast.error('Có lỗi khi giải quyết xung đột');
    }
  };

  const handleResolveAll = async (choice: 'local' | 'server') => {
    try {
      await resolveAllConflicts(choice);
      toast.success(`Đã giải quyết tất cả xung đột với ${choice === 'local' ? 'dữ liệu máy' : 'dữ liệu server'}`);
      setShowConflictModal(false);
    } catch {
      toast.error('Có lỗi khi giải quyết xung đột');
    }
  };

  const getEntityName = (entity: string) => {
    const names: Record<string, string> = {
      students: 'Học sinh',
      groups: 'Lớp học',
      sessions: 'Buổi học',
      payments: 'Thanh toán',
    };
    return names[entity] || entity;
  };

  return (
    <>
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tải xuống Offline</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tải ứng dụng và dữ liệu để sử dụng khi không có mạng</p>
            </div>
            {conflicts.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 rounded-full">
                {conflicts.length} xung đột
              </span>
            )}
          </div>

          {/* Download App for Offline - Main Feature */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Tải xuống toàn bộ ứng dụng</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Tải tất cả trang, tính năng và dữ liệu để sử dụng hoàn toàn offline
                </p>
              </div>
              {appReady && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full flex-shrink-0">
                  Sẵn sàng
                </span>
              )}
            </div>

            {/* App Download Progress */}
            {downloadingApp && appProgress && (
              <div className="space-y-3 mb-4">
                {appProgress.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'done' ? 'bg-green-500' :
                      step.status === 'loading' ? 'bg-violet-500' :
                      step.status === 'error' ? 'bg-red-500' :
                      'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      {step.status === 'done' ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step.status === 'loading' ? (
                        <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : step.status === 'error' ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <span className="text-xs text-white font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      step.status === 'done' ? 'text-green-700 dark:text-green-300' :
                      step.status === 'loading' ? 'text-violet-700 dark:text-violet-300 font-medium' :
                      step.status === 'error' ? 'text-red-700 dark:text-red-300' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
                {appProgress.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">{appProgress.error}</p>
                )}
              </div>
            )}

            {/* App Status */}
            {!downloadingApp && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Trạng thái</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${appReady ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {appReady ? 'Đã sẵn sàng' : 'Chưa tải'}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Lần tải cuối</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {lastAppDownload
                      ? new Date(lastAppDownload).toLocaleString('vi-VN')
                      : 'Chưa tải'}
                  </p>
                </div>
              </div>
            )}

            {/* App Download Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleDownloadApp}
                disabled={downloadingApp || !isOnline}
                className="flex-1 sm:flex-none"
              >
                {downloadingApp ? (
                  <>
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang tải...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {appReady ? 'Cập nhật offline' : 'Tải xuống offline'}
                  </>
                )}
              </Button>
              {appReady && (
                <Button
                  variant="secondary"
                  onClick={handleClearOffline}
                  disabled={downloadingApp}
                  className="flex-1 sm:flex-none"
                >
                  Xóa cache
                </Button>
              )}
            </div>
          </div>

          {/* Data Only Download */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Chỉ tải dữ liệu</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tải học sinh, lớp học, buổi học, thanh toán
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasData ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {hasData ? 'Đã có' : 'Chưa tải'}
                </span>
              </div>
            </div>

            {/* Data Progress bar */}
            {downloading && (
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{progress.entity}</span>
                  <span className="text-gray-900 dark:text-white">{progress.current}/{progress.total}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                disabled={downloading || !isOnline}
              >
                {downloading ? 'Đang tải...' : 'Tải dữ liệu'}
              </Button>
              {hasData && isOnline && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCheckConflicts}
                  disabled={checkingConflicts}
                >
                  {checkingConflicts ? 'Đang kiểm tra...' : 'Kiểm tra xung đột'}
                </Button>
              )}
            </div>
            {lastDownload && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Lần tải: {new Date(lastDownload).toLocaleString('vi-VN')}
              </p>
            )}
          </div>

          {/* Warning */}
          {!isOnline && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Bạn đang ngoại tuyến. Kết nối mạng để tải dữ liệu mới.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Hướng dẫn sử dụng Offline</h4>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• <strong>Tải xuống offline:</strong> Tải toàn bộ ứng dụng + dữ liệu</li>
              <li>• <strong>Chỉ tải dữ liệu:</strong> Nếu đã tải ứng dụng, chỉ cập nhật dữ liệu</li>
              <li>• Khi offline, tất cả các trang sẽ hoạt động bình thường</li>
              <li>• Dữ liệu thay đổi sẽ được đồng bộ khi có mạng trở lại</li>
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Conflict Resolution Modal */}
      <Modal
        isOpen={showConflictModal && conflicts.length > 0}
        onClose={() => setShowConflictModal(false)}
        title={`Giải quyết xung đột (${conflicts.length})`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Có {conflicts.length} bản ghi bị xung đột giữa dữ liệu trên máy và server. Chọn phiên bản bạn muốn giữ lại.
            </p>
          </div>

          {/* Quick resolve all */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleResolveAll('local')}
            >
              Giữ tất cả dữ liệu máy
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleResolveAll('server')}
            >
              Giữ tất cả dữ liệu server
            </Button>
          </div>

          {/* Conflict list */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getEntityName(conflict.entity)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(conflict.localData as any).name || conflict.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Dữ liệu máy</p>
                    <p className="text-xs text-gray-500">
                      {new Date(conflict.localTimestamp).toLocaleString('vi-VN')}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2 w-full"
                      onClick={() => handleResolve(conflict.id, 'local')}
                    >
                      Chọn
                    </Button>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="font-medium text-green-700 dark:text-green-300 mb-1">Dữ liệu server</p>
                    <p className="text-xs text-gray-500">
                      {new Date(conflict.serverTimestamp).toLocaleString('vi-VN')}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2 w-full"
                      onClick={() => handleResolve(conflict.id, 'server')}
                    >
                      Chọn
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setShowConflictModal(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Offline Login Mode Card Component
function OfflineLoginCard() {
  const { offlineModeEnabled, enableOfflineMode, disableOfflineMode, user, isOfflineSession } = useAuthStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleEnableOffline = async () => {
    if (!password.trim()) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      // Verify password with server first
      const result = await authApi.login(user?.username || '', password);
      if (result.success && result.data) {
        await enableOfflineMode(user?.username || '', password, result.data.user);
        toast.success('Đã bật chế độ đăng nhập offline');
        setShowPasswordModal(false);
        setPassword('');
      } else {
        toast.error('Mật khẩu không đúng');
      }
    } catch {
      toast.error('Không thể xác minh mật khẩu');
    }
    setLoading(false);
  };

  const handleDisableOffline = () => {
    disableOfflineMode();
    toast.success('Đã tắt chế độ đăng nhập offline');
  };

  return (
    <>
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Đăng nhập Offline</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cho phép đăng nhập khi không có mạng</p>
            </div>
            {isOfflineSession && (
              <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                Đang offline
              </span>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${offlineModeEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {offlineModeEnabled ? 'Đã bật' : 'Đã tắt'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {offlineModeEnabled
                    ? 'Bạn có thể đăng nhập khi không có mạng'
                    : 'Yêu cầu kết nối mạng để đăng nhập'}
                </p>
              </div>
            </div>
            {offlineModeEnabled ? (
              <Button variant="secondary" size="sm" onClick={handleDisableOffline}>
                Tắt
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowPasswordModal(true)}
                disabled={!isOnline}
                title={!isOnline ? 'Cần kết nối mạng để bật' : ''}
              >
                Bật
              </Button>
            )}
          </div>

          {/* Warning if offline */}
          {!isOnline && !offlineModeEnabled && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Bạn đang ngoại tuyến. Kết nối lại mạng để bật chế độ đăng nhập offline.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Lưu ý</h4>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Chỉ có thể bật khi đang có kết nối mạng</li>
              <li>• Thông tin đăng nhập được mã hóa và lưu trên thiết bị</li>
              <li>• Khi offline, dữ liệu sẽ được lưu cục bộ và đồng bộ khi có mạng</li>
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassword('');
        }}
        title="Xác nhận bật chế độ offline"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nhập mật khẩu để xác nhận và lưu thông tin đăng nhập cho chế độ offline.
          </p>
          <Input
            type="password"
            label="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu của bạn"
            autoComplete="current-password"
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                setPassword('');
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleEnableOffline} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function Settings() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [backupPreview, setBackupPreview] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database settings
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [dbConnectionType, setDbConnectionType] = useState<'local' | 'remote'>('local');
  const [dbUri, setDbUri] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [switchingDb, setSwitchingDb] = useState(false);
  // Migration
  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
  const [migrateTargetUri, setMigrateTargetUri] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<MigrateResult | null>(null);
  const [clearTargetBeforeMigrate, setClearTargetBeforeMigrate] = useState(false);

  const [formData, setFormData] = useState({
    defaultFeePerSession: '',
    reminderDays: '',
    workingHoursStart: '6',
    workingHoursEnd: '22',
    gradientFrom: '#3B82F6',
    gradientTo: '#8B5CF6',
  });

  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    loadSettings();
    loadDbInfo();
  }, []);

  const loadDbInfo = async () => {
    // Skip loading database info when offline
    if (!navigator.onLine) {
      return;
    }

    try {
      const res = await databaseApi.getInfo();
      if (res.success && res.data) {
        setDbInfo(res.data);
        // Determine connection type based on URI
        const uri = res.data.currentUri || '';
        if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
          setDbConnectionType('local');
          setDbUri('mongodb://localhost:27017/tuition-management');
        } else {
          setDbConnectionType('remote');
          setDbUri(uri);
        }
      }
    } catch {
      // Database info not available
    }
  };

  const handleTestConnection = async () => {
    if (!dbUri.trim()) {
      toast.error('Vui lòng nhập connection string');
      return;
    }

    setTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const res = await databaseApi.testConnection(dbUri);
      if (res.success && res.data) {
        setConnectionTestResult(res.data);
      } else {
        setConnectionTestResult({ success: false, message: res.error || 'Không thể kết nối' });
      }
    } catch {
      setConnectionTestResult({ success: false, message: 'Lỗi kết nối' });
    }

    setTestingConnection(false);
  };

  const handleSwitchDatabase = async () => {
    if (!dbUri.trim()) {
      toast.error('Vui lòng nhập connection string');
      return;
    }

    setSwitchingDb(true);

    try {
      const res = await databaseApi.switchDatabase(dbUri);
      if (res.success) {
        toast.success('Chuyển đổi database thành công. Tải lại trang...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(res.error || 'Không thể chuyển đổi database');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }

    setSwitchingDb(false);
  };

  const handleMigrate = async () => {
    if (!migrateTargetUri.trim()) {
      toast.error('Vui lòng nhập URI database đích');
      return;
    }

    setMigrating(true);
    setMigrateResult(null);

    try {
      const res = await databaseApi.migrate(migrateTargetUri, { clearTarget: clearTargetBeforeMigrate });
      if (res.success && res.data) {
        setMigrateResult(res.data);
        if (res.data.success) {
          toast.success('Migrate dữ liệu thành công');
        } else {
          toast.error(res.data.message);
        }
      } else {
        setMigrateResult({ success: false, message: res.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMigrateResult({ success: false, message: 'Có lỗi xảy ra khi migrate' });
    }

    setMigrating(false);
  };

  const loadSettings = async () => {
    setLoading(true);

    // Try loading from server first
    try {
      const res = await settingsApi.get();
      if (res.success && res.data) {
        setSettings(res.data);
        setFormData({
          defaultFeePerSession: res.data.defaultFeePerSession.toString(),
          reminderDays: res.data.reminderDays.toString(),
          workingHoursStart: (res.data.workingHoursStart ?? 6).toString(),
          workingHoursEnd: (res.data.workingHoursEnd ?? 22).toString(),
          gradientFrom: res.data.gradientFrom || '#3B82F6',
          gradientTo: res.data.gradientTo || '#8B5CF6',
        });
        setSubjects(res.data.subjects || []);
        // Save to localStorage for offline use
        localStorage.setItem('cachedSettings', JSON.stringify(res.data));
        setLoading(false);
        return;
      }
    } catch {
      // Fall through to offline fallback
    }

    // Fallback: Load from localStorage when offline
    const cached = localStorage.getItem('cachedSettings');
    if (cached) {
      try {
        const data = JSON.parse(cached) as SettingsType;
        setSettings(data);
        setFormData({
          defaultFeePerSession: data.defaultFeePerSession.toString(),
          reminderDays: data.reminderDays.toString(),
          workingHoursStart: (data.workingHoursStart ?? 6).toString(),
          workingHoursEnd: (data.workingHoursEnd ?? 22).toString(),
          gradientFrom: data.gradientFrom || '#3B82F6',
          gradientTo: data.gradientTo || '#8B5CF6',
        });
        setSubjects(data.subjects || []);
      } catch {
        // Use defaults
        setFormData({
          defaultFeePerSession: '200000',
          reminderDays: '5',
          workingHoursStart: '6',
          workingHoursEnd: '22',
          gradientFrom: '#3B82F6',
          gradientTo: '#8B5CF6',
        });
      }
    } else {
      // Use defaults
      setFormData({
        defaultFeePerSession: '200000',
        reminderDays: '5',
        workingHoursStart: '6',
        workingHoursEnd: '22',
        gradientFrom: '#3B82F6',
        gradientTo: '#8B5CF6',
      });
    }

    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await settingsApi.update({
        defaultFeePerSession: parseInt(formData.defaultFeePerSession),
        reminderDays: parseInt(formData.reminderDays),
        subjects,
        workingHoursStart: parseInt(formData.workingHoursStart),
        workingHoursEnd: parseInt(formData.workingHoursEnd),
        gradientFrom: formData.gradientFrom,
        gradientTo: formData.gradientTo,
      });
      toast.success('Lưu cài đặt thành công');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
    setSaving(false);
  };

  const addSubject = () => {
    const trimmed = newSubject.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      toast.error('Môn học đã tồn tại');
      return;
    }
    setSubjects([...subjects, trimmed]);
    setNewSubject('');
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const data = await backupRestore.exportBackup();
      backupRestore.downloadBackupFile(data);
      toast.success('Xuất dữ liệu thành công');
    } catch {
      toast.error('Có lỗi xảy ra khi xuất dữ liệu');
    }
    setExporting(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await backupRestore.readBackupFile(file);
      setBackupPreview(data);
      setIsImportModalOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportBackup = async () => {
    if (!backupPreview) return;

    setImporting(true);
    try {
      const result = await backupRestore.importBackup(backupPreview);
      if (result.success) {
        toast.success(result.message);
        setIsImportModalOpen(false);
        setBackupPreview(null);
        // Reload page to refresh data
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi khôi phục dữ liệu');
    }
    setImporting(false);
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý cấu hình hệ thống</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cài đặt chung</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Thiết lập mặc định cho hệ thống</p>
            </div>
          </div>

          <Input
            label="Học phí mặc định (VNĐ/buổi)"
            type="number"
            value={formData.defaultFeePerSession}
            onChange={(e) => setFormData({ ...formData, defaultFeePerSession: e.target.value })}
            placeholder="200000"
          />

          <Input
            label="Nhắc đóng tiền trước (ngày)"
            type="number"
            value={formData.reminderDays}
            onChange={(e) => setFormData({ ...formData, reminderDays: e.target.value })}
            placeholder="5"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Khung giờ làm việc (hiển thị trên lịch)
            </label>
            <div className="flex items-center gap-2">
              <select
                value={formData.workingHoursStart}
                onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
              <span className="text-gray-500">đến</span>
              <select
                value={formData.workingHoursEnd}
                onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Timeline trong ô ngày sẽ chỉ hiển thị trong khoảng giờ này
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Màu gradient chủ đạo
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.gradientFrom}
                  onChange={(e) => setFormData({ ...formData, gradientFrom: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Từ</p>
                  <input
                    type="text"
                    value={formData.gradientFrom}
                    onChange={(e) => setFormData({ ...formData, gradientFrom: e.target.value })}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                  />
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.gradientTo}
                  onChange={(e) => setFormData({ ...formData, gradientTo: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Đến</p>
                  <input
                    type="text"
                    value={formData.gradientTo}
                    onChange={(e) => setFormData({ ...formData, gradientTo: e.target.value })}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                  />
                </div>
              </div>
            </div>
            <div
              className="mt-2 h-8 rounded-lg"
              style={{ background: `linear-gradient(to right, ${formData.gradientFrom}, ${formData.gradientTo})` }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Màu gradient sẽ được áp dụng cho header và các thành phần chính
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Lưu cài đặt
                </>
              )}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Subjects Management */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Danh sách môn học</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý các môn học hiển thị trong dropdown</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {subjects.map((subject, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
              >
                {subject}
                <button
                  onClick={() => removeSubject(index)}
                  className="ml-1 text-purple-500 hover:text-purple-700 dark:hover:text-purple-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Nhập tên môn học mới..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
              className="flex-1"
            />
            <Button variant="secondary" onClick={addSubject}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Các môn học sẽ hiển thị dạng dropdown khi thêm lịch học hoặc buổi học. Nhấn "Lưu cài đặt" ở trên để lưu thay đổi.
          </p>
        </CardBody>
      </Card>

      {/* Notification Settings */}
      <NotificationSettingsCard />

      {/* Offline Data Management */}
      <OfflineDataCard />

      {/* Offline Login Mode */}
      <OfflineLoginCard />

      {/* App Info */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Thông tin ứng dụng</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Chi tiết phiên bản và cấu hình</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">Phiên bản</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">1.0.0</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">Đơn vị tiền tệ</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{settings?.currency || 'VNĐ'}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sao lưu & Khôi phục</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Xuất và nhập dữ liệu của bạn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Xuất dữ liệu</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tải xuống file backup</p>
                </div>
              </div>
              <Button
                onClick={handleExportBackup}
                disabled={exporting}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Xuất backup
                  </>
                )}
              </Button>
            </div>

            {/* Import */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Khôi phục dữ liệu</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nhập từ file backup</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="success"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Chọn file backup
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Backup bao gồm: Học sinh, Lớp học, Buổi học, Thanh toán. Khuyến nghị sao lưu định kỳ để bảo vệ dữ liệu.
          </p>
        </CardBody>
      </Card>

      {/* Database Settings - Admin Only */}
      {user?.role === 'admin' && (
      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cơ sở dữ liệu</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý kết nối MongoDB</p>
            </div>
          </div>

          {/* Current Database Info */}
          {dbInfo && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dbInfo.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {dbInfo.isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Database:</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{dbInfo.databaseName}</p>
              </div>
              {dbInfo.collections && dbInfo.collections.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Collections:</p>
                  <div className="flex flex-wrap gap-2">
                    {dbInfo.collections.map((col) => (
                      <span key={col.name} className="px-2 py-1 text-xs bg-white dark:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                        {col.name}: {col.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connection Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại kết nối
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDbConnectionType('local');
                  setDbUri('mongodb://localhost:27017/tuition-management');
                  setConnectionTestResult(null);
                }}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  dbConnectionType === 'local'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Local</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDbConnectionType('remote');
                  setDbUri('');
                  setConnectionTestResult(null);
                }}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  dbConnectionType === 'remote'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Remote</span>
                </div>
              </button>
            </div>
          </div>

          {/* Connection String */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Connection String
            </label>
            <Input
              value={dbUri}
              onChange={(e) => {
                setDbUri(e.target.value);
                setConnectionTestResult(null);
              }}
              placeholder={dbConnectionType === 'local' ? 'mongodb://localhost:27017/tuition-management' : 'mongodb+srv://user:pass@cluster.mongodb.net/dbname'}
              className="font-mono text-sm"
            />
            {dbConnectionType === 'remote' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ví dụ: mongodb+srv://user:password@cluster.mongodb.net/database
              </p>
            )}
          </div>

          {/* Connection Test Result */}
          {connectionTestResult && (
            <div className={`p-3 rounded-xl ${connectionTestResult.success ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center gap-2">
                {connectionTestResult.success ? (
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={`text-sm font-medium ${connectionTestResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {connectionTestResult.message}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={handleTestConnection}
              disabled={testingConnection || !dbUri.trim()}
            >
              {testingConnection ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Kiểm tra kết nối
                </>
              )}
            </Button>
            <Button
              onClick={handleSwitchDatabase}
              disabled={switchingDb || !dbUri.trim() || !connectionTestResult?.success}
            >
              {switchingDb ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang chuyển...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Chuyển database
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMigrateTargetUri('');
                setMigrateResult(null);
                setClearTargetBeforeMigrate(false);
                setIsMigrateModalOpen(true);
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Migrate dữ liệu
            </Button>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Hướng dẫn</h4>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• <strong>Local:</strong> Sử dụng MongoDB trên máy tính của bạn</li>
              <li>• <strong>Remote:</strong> Kết nối với MongoDB Atlas hoặc server khác</li>
              <li>• <strong>Migrate:</strong> Sao chép dữ liệu từ database hiện tại sang database khác</li>
            </ul>
          </div>
        </CardBody>
      </Card>
      )}

      {/* Support */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-white">Hỗ trợ</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Liên hệ nếu bạn cần trợ giúp</p>
            </div>
            <a href="tel:0977040868">
              <Button variant="secondary" size="sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                0977 040 868
              </Button>
            </a>
          </div>
        </CardBody>
      </Card>

      {/* Import Confirmation Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setBackupPreview(null);
        }}
        title="Xác nhận khôi phục dữ liệu"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">Lưu ý</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Dữ liệu hiện tại sẽ bị xóa và thay thế bằng dữ liệu từ file backup. Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
          </div>

          {backupPreview && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nội dung backup:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Học sinh</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{backupPreview.students?.length || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Lớp học</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{backupPreview.groups?.length || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Buổi học</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{backupPreview.sessions?.length || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Thanh toán</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{backupPreview.payments?.length || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thời gian tạo: {new Date(backupPreview.timestamp).toLocaleString('vi-VN')}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => {
                setIsImportModalOpen(false);
                setBackupPreview(null);
              }}
              disabled={importing}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              onClick={handleImportBackup}
              disabled={importing}
            >
              {importing ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang khôi phục...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Khôi phục dữ liệu
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Migration Modal */}
      <Modal
        isOpen={isMigrateModalOpen}
        onClose={() => {
          setIsMigrateModalOpen(false);
          setMigrateTargetUri('');
          setMigrateResult(null);
        }}
        title="Migrate dữ liệu"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Sao chép toàn bộ dữ liệu từ database hiện tại sang database đích. Database hiện tại không bị ảnh hưởng.
            </p>
          </div>

          {/* Current DB Info */}
          {dbInfo && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400">Database nguồn (hiện tại):</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{dbInfo.databaseName}</p>
            </div>
          )}

          {/* Target URI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URI database đích
            </label>
            <Input
              value={migrateTargetUri}
              onChange={(e) => setMigrateTargetUri(e.target.value)}
              placeholder="mongodb+srv://user:pass@cluster.mongodb.net/new-database"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Nhập connection string của database muốn migrate dữ liệu đến
            </p>
          </div>

          {/* Clear target option */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={clearTargetBeforeMigrate}
              onChange={(e) => setClearTargetBeforeMigrate(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Xóa dữ liệu đích trước khi migrate</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cẩn thận: sẽ xóa toàn bộ dữ liệu trong database đích</p>
            </div>
          </label>

          {/* Migration Result */}
          {migrateResult && (
            <div className={`p-4 rounded-xl ${migrateResult.success ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}`}>
              <div className="flex items-start gap-3">
                {migrateResult.success ? (
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <div className="flex-1">
                  <p className={`font-medium ${migrateResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {migrateResult.message}
                  </p>
                  {migrateResult.migratedCounts && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500">Học sinh</p>
                        <p className="font-bold text-gray-900 dark:text-white">{migrateResult.migratedCounts.students}</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500">Lớp học</p>
                        <p className="font-bold text-gray-900 dark:text-white">{migrateResult.migratedCounts.groups}</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500">Buổi học</p>
                        <p className="font-bold text-gray-900 dark:text-white">{migrateResult.migratedCounts.sessions}</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500">Thanh toán</p>
                        <p className="font-bold text-gray-900 dark:text-white">{migrateResult.migratedCounts.payments}</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500">Ghi chú</p>
                        <p className="font-bold text-gray-900 dark:text-white">{migrateResult.migratedCounts.notes}</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500">Users</p>
                        <p className="font-bold text-gray-900 dark:text-white">{migrateResult.migratedCounts.users}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => {
                setIsMigrateModalOpen(false);
                setMigrateTargetUri('');
                setMigrateResult(null);
              }}
              disabled={migrating}
            >
              Đóng
            </Button>
            <Button
              onClick={handleMigrate}
              disabled={migrating || !migrateTargetUri.trim()}
            >
              {migrating ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang migrate...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Bắt đầu migrate
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
