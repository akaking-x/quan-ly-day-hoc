import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { PageTransition } from '../common/PageTransition';
import { PageSkeleton } from '../common/PageLoader';
import { initSync } from '../../services/syncService';
import { initOfflineDb } from '../../services/offlineDb';
import { useThemeStore, applyTheme } from '../../store/themeStore';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    // Initialize offline database and sync service
    const init = async () => {
      await initOfflineDb();
      await initSync();
    };
    init();
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 pb-20 lg:pb-6 lg:pl-72">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Suspense fallback={<PageSkeleton />}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </Suspense>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
