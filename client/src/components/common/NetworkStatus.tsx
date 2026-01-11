import { useState, useEffect } from 'react';
import { addSyncListener, getPendingSyncCount, forceSync, isOnline } from '../../services/syncService';

export function NetworkStatus() {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync status changes
    const unsubscribe = addSyncListener((status, count) => {
      setSyncing(status === 'syncing');
      setPendingCount(count);
    });

    // Initial pending count
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

  // Don't show anything if online and no pending items
  if (online && pendingCount === 0 && !syncing) {
    return null;
  }

  return (
    <>
      {/* Status bar */}
      <div
        className={`fixed bottom-16 left-0 right-0 lg:bottom-0 lg:left-72 z-30 px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer backdrop-blur-lg ${
          online
            ? syncing
              ? 'bg-blue-500/95 text-white'
              : pendingCount > 0
              ? 'bg-amber-500/95 text-white'
              : 'bg-emerald-500/95 text-white'
            : 'bg-red-500/95 text-white'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          {!online ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
              </svg>
              <span>Đang ngoại tuyến - Dữ liệu được lưu cục bộ</span>
            </>
          ) : syncing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Đang đồng bộ dữ liệu...</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{pendingCount} thay đổi chưa đồng bộ</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Đã đồng bộ</span>
            </>
          )}
        </div>

        {online && pendingCount > 0 && !syncing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSync();
            }}
            className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors font-medium"
          >
            Đồng bộ ngay
          </button>
        )}
      </div>

      {/* Details modal */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end lg:items-center justify-center"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl w-full lg:max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Trạng thái mạng</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className={`w-3 h-3 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="font-medium text-gray-700 dark:text-gray-300">{online ? 'Đang kết nối' : 'Mất kết nối'}</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className={`w-3 h-3 rounded-full ${pendingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {pendingCount > 0
                    ? `${pendingCount} thay đổi chờ đồng bộ`
                    : 'Không có thay đổi chờ đồng bộ'}
                </span>
              </div>

              {syncing && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">Đang đồng bộ...</span>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Khi mất kết nối, dữ liệu sẽ được lưu cục bộ và tự động đồng bộ khi có mạng trở lại.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              {online && pendingCount > 0 && !syncing && (
                <button
                  onClick={handleSync}
                  className="flex-1 px-4 py-3 text-white rounded-xl hover:opacity-90 font-medium transition-all"
                  style={{ background: 'linear-gradient(to right, var(--gradient-from, #3B82F6), var(--gradient-to, #8B5CF6))' }}
                >
                  Đồng bộ ngay
                </button>
              )}
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
