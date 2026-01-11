import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { OrientationToggle } from '../common/OrientationToggle';
import { ThemeToggle } from '../common/ThemeToggle';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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
