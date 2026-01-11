import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { OrientationToggle } from '../common/OrientationToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { addSyncListener, getPendingSyncCount, forceSync, isOnline } from '../../services/syncService';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNetworkTooltip, setShowNetworkTooltip] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = addSyncListener((status, count) => {
      setSyncing(status === 'syncing');
      setPendingCount(count);
    });

    getPendingSyncCount().then(setPendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleSync = async () => {
    if (!online || syncing) return;
    try {
      await forceSync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 shadow-lg"
      style={{ background: 'linear-gradient(to right, var(--gradient-from, #3B82F6), var(--gradient-to, #8B5CF6))' }}
    >
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-white/10 lg:hidden transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-white text-lg">Quản Lý Dạy Học</h1>
              <p className="text-blue-100 text-xs">Hệ thống quản lý dạy học</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="text-right hidden sm:block mr-3 px-3 py-1 bg-white/10 rounded-lg">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-blue-100">
              {user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
            </p>
          </div>

          {/* Network Status Button */}
          <div className="relative">
            <button
              onClick={() => {
                if (online && pendingCount > 0 && !syncing) {
                  handleSync();
                } else {
                  setShowNetworkTooltip(!showNetworkTooltip);
                }
              }}
              onMouseEnter={() => setShowNetworkTooltip(true)}
              onMouseLeave={() => setShowNetworkTooltip(false)}
              className={`p-2.5 rounded-xl transition-colors ${
                !online
                  ? 'bg-red-500/30 hover:bg-red-500/40'
                  : syncing
                  ? 'bg-blue-500/30 hover:bg-blue-500/40'
                  : pendingCount > 0
                  ? 'bg-amber-500/30 hover:bg-amber-500/40'
                  : 'hover:bg-white/10'
              }`}
              title={!online ? 'Offline' : syncing ? 'Đang đồng bộ...' : pendingCount > 0 ? `${pendingCount} thay đổi chờ đồng bộ` : 'Online'}
            >
              {!online ? (
                <svg className="w-5 h-5 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                </svg>
              ) : syncing ? (
                <svg className="w-5 h-5 text-blue-200 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : pendingCount > 0 ? (
                <div className="relative">
                  <svg className="w-5 h-5 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                </div>
              ) : (
                <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              )}
            </button>

            {/* Tooltip */}
            {showNetworkTooltip && (
              <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
                {!online ? (
                  'Đang offline - Sử dụng dữ liệu đã lưu'
                ) : syncing ? (
                  'Đang đồng bộ dữ liệu...'
                ) : pendingCount > 0 ? (
                  `${pendingCount} thay đổi chờ đồng bộ - Nhấn để đồng bộ`
                ) : (
                  'Đã kết nối'
                )}
                <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            )}
          </div>

          <ThemeToggle />
          <OrientationToggle />
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Đăng xuất"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
