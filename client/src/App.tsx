import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageLoader } from './components/common/PageLoader';

// Lazy load pages for better initial performance
// Offline caching is handled by the "Download Offline" feature in Settings
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Students = lazy(() => import('./pages/Students').then(m => ({ default: m.Students })));
const StudentDetail = lazy(() => import('./pages/StudentDetail').then(m => ({ default: m.StudentDetail })));
const Groups = lazy(() => import('./pages/Groups').then(m => ({ default: m.Groups })));
const GroupDetail = lazy(() => import('./pages/GroupDetail').then(m => ({ default: m.GroupDetail })));
const Attendance = lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const Payments = lazy(() => import('./pages/Payments').then(m => ({ default: m.Payments })));
const Notes = lazy(() => import('./pages/Notes').then(m => ({ default: m.Notes })));
const Guide = lazy(() => import('./pages/Guide').then(m => ({ default: m.Guide })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const StudentPortal = lazy(() => import('./pages/StudentPortal').then(m => ({ default: m.StudentPortal })));

// Network status indicator component - shows online/offline status as a floating badge
function NetworkStatusIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999]"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          {isOffline ? 'Đang offline - Sử dụng dữ liệu đã lưu' : 'Đang online'}
          <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
      {/* Status Badge */}
      <button
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all duration-300 ${
          isOffline
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : 'bg-green-500 text-white hover:bg-green-600'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-white animate-pulse' : 'bg-white'}`} />
        <span className="text-xs font-medium">{isOffline ? 'Offline' : 'Online'}</span>
      </button>
    </div>
  );
}

// Offline Users Page - shown when trying to access users page while offline
function OfflineUsersPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không khả dụng khi Offline</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Quản lý người dùng yêu cầu kết nối internet. Vui lòng kết nối mạng để sử dụng tính năng này.
        </p>
      </div>
    </div>
  );
}

// Wrapper component to handle offline mode for Users page
function UsersPageWrapper() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return <OfflineUsersPage />;
  }

  return <Users />;
}

function App() {
  return (
    <BrowserRouter>
      <NetworkStatusIndicator />
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/student" element={<StudentPortal />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="students/:id" element={<StudentDetail />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:id" element={<GroupDetail />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="payments" element={<Payments />} />
              <Route path="notes" element={<Notes />} />
              <Route path="guide" element={<Guide />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/" element={<Layout />}>
              <Route path="users" element={<UsersPageWrapper />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
