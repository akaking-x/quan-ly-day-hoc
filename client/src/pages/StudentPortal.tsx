import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { studentPortalApiService } from '../services/api';
import { useStudentPortalStore } from '../stores/studentPortalStore';
import { useThemeStore, applyTheme } from '../store/themeStore';
import type { StudentPortalSession, StudentBalanceInfo } from '../types';
import {
  initializeNotifications,
  getNotificationSettings,
  ScheduledSession,
} from '../services/notificationService';

export const StudentPortal = () => {
  const { student, isAuthenticated, login, logout } = useStudentPortalStore();
  const { theme, setTheme } = useThemeStore();
  const [studentCode, setStudentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<StudentPortalSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [balance, setBalance] = useState<StudentBalanceInfo | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // State cho bộ lọc tháng/năm
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [filterMode, setFilterMode] = useState<'recent' | 'month'>('recent'); // 'recent' = 30 ngày gần đây, 'month' = theo tháng

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleDarkMode = () => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setTheme(isDark ? 'light' : 'dark');
  };

  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
      loadBalance();
    }
  }, [isAuthenticated, filterMode, selectedYear, selectedMonth]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const params = filterMode === 'month' ? { year: selectedYear, month: selectedMonth } : undefined;
      const result = await studentPortalApiService.getSessions(params);
      if (result.success && result.data) {
        setSessions(result.data);

        // Schedule notifications for upcoming sessions (only in 'recent' mode)
        if (filterMode === 'recent') {
          const settings = getNotificationSettings();
          if (settings.enabled) {
            const scheduledSessions: ScheduledSession[] = result.data
              .filter((s) => {
                const sessionDate = new Date(s.date);
                const now = new Date();
                return sessionDate >= now;
              })
              .map((s) => ({
                id: s._id,
                date: s.date,
                startTime: s.startTime,
                subject: s.subject,
                groupName: s.groupId?.name,
              }));
            initializeNotifications(scheduledSessions);
          }
        }
      }
    } catch {
      toast.error('Không thể tải lịch học');
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadBalance = async () => {
    setLoadingBalance(true);
    try {
      const params = filterMode === 'month' ? { year: selectedYear, month: selectedMonth } : undefined;
      const result = await studentPortalApiService.getBalance(params);
      if (result.success && result.data) {
        setBalance(result.data);
      }
    } catch {
      console.error('Không thể tải thông tin công nợ');
    } finally {
      setLoadingBalance(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) {
      toast.error('Vui lòng nhập mã học sinh');
      return;
    }

    setLoading(true);
    try {
      const result = await studentPortalApiService.login(studentCode.trim());
      if (result.success && result.data) {
        login(result.data.student, result.data.token);
        toast.success(`Xin chào, ${result.data.student.name}!`);
      } else {
        toast.error(result.error || 'Mã học sinh không hợp lệ');
      }
    } catch {
      toast.error('Mã học sinh không hợp lệ hoặc đã bị vô hiệu hóa');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setSessions([]);
    setBalance(null);
    setStudentCode('');
    toast.success('Đã đăng xuất');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isFuture = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const getAttendanceStatus = (status?: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      present: { label: 'Có mặt', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      absent: { label: 'Vắng', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      late: { label: 'Muộn', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      excused: { label: 'Có phép', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    };
    return statusMap[status || ''] || null;
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 relative overflow-hidden transition-colors duration-300">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all z-20"
          title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="max-w-md w-full relative z-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl mb-6 border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-br from-white to-emerald-100 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              Cổng Học Sinh
            </h1>
            <p className="text-emerald-200/80 text-lg">Nhập mã học sinh để xem lịch học</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Mã học sinh
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    placeholder="VD: ABC12345"
                    maxLength={8}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent focus:bg-white/15 uppercase tracking-widest text-center text-xl font-mono"
                  />
                </div>
                <p className="text-white/50 text-xs mt-2 text-center">
                  Mã học sinh gồm 8 ký tự (chữ và số)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Xem lịch học
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Back to Teacher Login */}
          <div className="text-center mt-6">
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Đăng nhập với tài khoản giáo viên</span>
            </a>
          </div>

          {/* Footer */}
          <p className="text-center text-emerald-200/60 text-sm mt-6">
            © 2024 Quản Lý Dạy Học - Cổng Học Sinh
          </p>
        </div>
      </div>
    );
  }

  // Dashboard Screen (after login)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                  Xin chào, {student?.name}!
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mã HS: <span className="font-mono font-semibold">{student?.studentCode}</span>
                  {student?.school && ` | ${student.school}`}
                  {student?.grade && ` | Lớp ${student.grade}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Payment Status Card */}
        {balance && (
          <div className={`mb-6 rounded-2xl shadow-sm border overflow-hidden ${
            balance.status === 'debt'
              ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
              : balance.status === 'credit'
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
          }`}>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    balance.status === 'debt'
                      ? 'bg-red-100 dark:bg-red-900/40'
                      : balance.status === 'credit'
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-green-100 dark:bg-green-900/40'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      balance.status === 'debt'
                        ? 'text-red-600 dark:text-red-400'
                        : balance.status === 'credit'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-green-600 dark:text-green-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Tình trạng học phí
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {balance.totalSessions} buổi học • {formatCurrency(balance.feePerSession)}/buổi
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    balance.status === 'debt'
                      ? 'text-red-600 dark:text-red-400'
                      : balance.status === 'credit'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {balance.status === 'debt' ? '-' : balance.status === 'credit' ? '+' : ''}
                    {formatCurrency(Math.abs(balance.balance))}
                  </p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    balance.status === 'debt'
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                      : balance.status === 'credit'
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  }`}>
                    {balance.status === 'debt' && (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Còn nợ
                      </>
                    )}
                    {balance.status === 'credit' && (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Dư học phí
                      </>
                    )}
                    {balance.status === 'paid' && (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Đã đóng đủ
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tổng học phí</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {formatCurrency(balance.totalFee)}
                  </p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Đã thanh toán</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(balance.totalPaid)}
                  </p>
                </div>
              </div>

              {/* Recent Payments */}
              {balance.recentPayments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Thanh toán gần đây:
                  </p>
                  <div className="space-y-2">
                    {balance.recentPayments.slice(0, 3).map((payment) => (
                      <div
                        key={payment._id}
                        className="flex items-center justify-between text-sm p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            payment.method === 'cash' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-slate-600 dark:text-slate-300">
                            {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({payment.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'})
                          </span>
                        </div>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning message for debt */}
              {balance.status === 'debt' && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <p className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Bạn đang còn nợ <strong>{formatCurrency(balance.balance)}</strong> học phí.
                      Vui lòng thanh toán để tiếp tục học tập không gián đoạn.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {loadingBalance && !balance && (
          <div className="mb-6 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <svg className="animate-spin w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-2 text-sm text-slate-500">Đang tải thông tin học phí...</span>
          </div>
        )}

        {/* Section Header with Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Lịch học của bạn</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {filterMode === 'recent' ? '30 ngày gần đây và sắp tới' : `Tháng ${selectedMonth}/${selectedYear}`}
              </p>
            </div>
            <button
              onClick={loadSessions}
              disabled={loadingSessions}
              className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Filter Mode Toggle */}
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
              <button
                onClick={() => setFilterMode('recent')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterMode === 'recent'
                    ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Gần đây
              </button>
              <button
                onClick={() => setFilterMode('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterMode === 'month'
                    ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Theo tháng
              </button>
            </div>

            {/* Month/Year Selectors - Only show when filterMode is 'month' */}
            {filterMode === 'month' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent"
                >
                  {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Sessions List */}
        {loadingSessions ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400">Đang tải lịch học...</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Chưa có buổi học nào</h3>
            <p className="text-slate-500 dark:text-slate-400">Lịch học của bạn sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session._id}
                className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                  isToday(session.date)
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Today indicator */}
                {isToday(session.date) && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5">
                    <span className="text-white text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Hôm nay
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Date & Time */}
                    <div className="flex items-start gap-4">
                      <div className={`flex flex-col items-center justify-center min-w-[60px] rounded-xl p-2 ${
                        isToday(session.date)
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : isFuture(session.date)
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                        <span className={`text-xs font-medium ${
                          isToday(session.date)
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isFuture(session.date)
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {new Date(session.date).toLocaleDateString('vi-VN', { month: 'short' })}
                        </span>
                        <span className={`text-2xl font-bold ${
                          isToday(session.date)
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : isFuture(session.date)
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {new Date(session.date).getDate()}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                          {session.subject}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          {formatDate(session.date)}
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                          {session.startTime} - {session.endTime}
                        </p>
                        {session.type === 'makeup' && (
                          <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                            Buổi học bù
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attendance & Online Link */}
                    <div className="flex flex-col gap-2 md:items-end">
                      {/* Attendance Status */}
                      {session.attendance && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                          getAttendanceStatus(session.attendance.status)?.color || 'bg-slate-100 text-slate-600'
                        }`}>
                          {session.attendance.status === 'present' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {getAttendanceStatus(session.attendance.status)?.label || 'Chưa điểm danh'}
                        </span>
                      )}

                      {/* Online Link */}
                      {session.onlineLink && isFuture(session.date) && (
                        <a
                          href={session.onlineLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all hover:from-blue-600 hover:to-indigo-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Vào lớp học online
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {session.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-medium">Ghi chú:</span> {session.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
