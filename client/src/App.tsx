import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Import ALL pages directly - no lazy loading for offline support
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { StudentDetail } from './pages/StudentDetail';
import { Groups } from './pages/Groups';
import { GroupDetail } from './pages/GroupDetail';
import { Attendance } from './pages/Attendance';
import { Payments } from './pages/Payments';
import { Notes } from './pages/Notes';
import { Guide } from './pages/Guide';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import { StudentPortal } from './pages/StudentPortal';

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

function App() {
  return (
    <BrowserRouter>
      <OfflineIndicator />
      <Toaster position="top-right" />
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
            <Route path="users" element={<Users />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
