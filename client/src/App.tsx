import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageLoader } from './components/common/PageLoader';

// Import critical pages directly (not lazy) for offline support
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

// Lazy load less critical pages
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

// Offline indicator component
function OfflineIndicator() {
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

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm font-medium z-[9999]">
      Đang offline - Sử dụng dữ liệu đã lưu
    </div>
  );
}

// Error boundary for lazy loaded components
function LazyFallback() {
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!navigator.onLine) {
        setShowOfflineMessage(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showOfflineMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="w-16 h-16 mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Trang chưa được lưu offline
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Vui lòng kết nối mạng và truy cập trang này một lần để có thể sử dụng offline.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return <PageLoader />;
}

function App() {
  return (
    <BrowserRouter>
      <OfflineIndicator />
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/student"
          element={
            <Suspense fallback={<LazyFallback />}>
              <StudentPortal />
            </Suspense>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={
              <Suspense fallback={<LazyFallback />}>
                <Students />
              </Suspense>
            } />
            <Route path="students/:id" element={
              <Suspense fallback={<LazyFallback />}>
                <StudentDetail />
              </Suspense>
            } />
            <Route path="groups" element={
              <Suspense fallback={<LazyFallback />}>
                <Groups />
              </Suspense>
            } />
            <Route path="groups/:id" element={
              <Suspense fallback={<LazyFallback />}>
                <GroupDetail />
              </Suspense>
            } />
            <Route path="attendance" element={
              <Suspense fallback={<LazyFallback />}>
                <Attendance />
              </Suspense>
            } />
            <Route path="payments" element={
              <Suspense fallback={<LazyFallback />}>
                <Payments />
              </Suspense>
            } />
            <Route path="notes" element={
              <Suspense fallback={<LazyFallback />}>
                <Notes />
              </Suspense>
            } />
            <Route path="guide" element={
              <Suspense fallback={<LazyFallback />}>
                <Guide />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<LazyFallback />}>
                <Settings />
              </Suspense>
            } />
          </Route>
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/" element={<Layout />}>
            <Route path="users" element={
              <Suspense fallback={<LazyFallback />}>
                <Users />
              </Suspense>
            } />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
