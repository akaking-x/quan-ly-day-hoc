import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isToday, isTomorrow, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardBody, DashboardSkeleton, Button, Badge } from '../components/common';
import { useStore } from '../store/useStore';
import { reportApi } from '../services/api';
import { offlineSessionApi, offlineStudentApi } from '../services/offlineApi';
import type { ChartData, StudentBalance, Session, Student, StudentStatus } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

type TimeFilter = 'week' | 'month' | 'lastMonth';

const statusColors: Record<StudentStatus | 'unknown', string> = {
  weak: '#ef4444',
  average: '#eab308',
  good: '#3b82f6',
  excellent: '#22c55e',
  outstanding: '#a855f7',
  unknown: '#9ca3af',
};

const statusLabels: Record<StudentStatus | 'unknown', string> = {
  weak: 'Yếu',
  average: 'Trung bình',
  good: 'Khá',
  excellent: 'Giỏi',
  outstanding: 'Xuất sắc',
  unknown: 'Chưa đánh giá',
};

export function Dashboard() {
  const navigate = useNavigate();
  const { summary, fetchSummary } = useStore();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [debtStudents, setDebtStudents] = useState<StudentBalance[]>([]);
  const [allDebtStudents, setAllDebtStudents] = useState<StudentBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showAllDebt, setShowAllDebt] = useState(false);
  const debtSectionRef = useRef<HTMLDivElement>(null);

  const scrollToDebtSection = () => {
    setShowAllDebt(true);
    setTimeout(() => {
      debtSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSummary();

      const chartRes = await reportApi.getChart();
      if (chartRes.success && chartRes.data) {
        setChartData(chartRes.data);
      }

      const balanceRes = await reportApi.getBalance();
      if (balanceRes.success && balanceRes.data) {
        const debtList = balanceRes.data.filter(s => s.balance > 0);
        setAllDebtStudents(debtList);
        setDebtStudents(debtList.slice(0, 5));
      }

      // Load sessions for upcoming
      const now = new Date();
      const sessionsRes = await offlineSessionApi.getCalendar(now.getFullYear(), now.getMonth() + 1);
      if (sessionsRes.success && sessionsRes.data) {
        setSessions(sessionsRes.data);
      }

      // Load students for status distribution
      const studentsRes = await offlineStudentApi.getAll({ active: 'true' });
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data);
      }

      setLoading(false);
    };
    loadData();
  }, [fetchSummary]);

  // Calculate filtered stats based on time filter
  const filteredStats = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    switch (timeFilter) {
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default: // month
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    const filteredSessions = sessions.filter(s => {
      const date = parseISO(s.date);
      return date >= start && date <= end;
    });

    // Calculate attendance stats
    let totalAttendance = 0;
    let presentCount = 0;
    filteredSessions.forEach(s => {
      s.attendance.forEach(a => {
        totalAttendance++;
        if (a.status === 'present' || a.status === 'late') {
          presentCount++;
        }
      });
    });

    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return {
      sessionsCount: filteredSessions.length,
      attendanceRate,
      totalAttendance,
      presentCount,
    };
  }, [sessions, timeFilter]);

  // Upcoming sessions (today and tomorrow)
  const upcomingSessions = useMemo(() => {
    return sessions
      .filter(s => {
        const date = parseISO(s.date);
        return isToday(date) || isTomorrow(date);
      })
      .sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 5);
  }, [sessions]);

  // Student status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      weak: 0,
      average: 0,
      good: 0,
      excellent: 0,
      outstanding: 0,
      unknown: 0,
    };

    students.forEach(s => {
      const status = s.status || 'unknown';
      counts[status]++;
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: statusLabels[status as StudentStatus | 'unknown'],
        value: count,
        color: statusColors[status as StudentStatus | 'unknown'],
      }));
  }, [students]);

  // Collection rate
  const collectionRate = useMemo(() => {
    if (!summary) return 0;
    const totalFees = summary.revenueThisMonth + summary.totalDebt;
    if (totalFees === 0) return 100;
    return Math.round((summary.revenueThisMonth / totalFees) * 100);
  }, [summary]);

  if (loading || !summary) {
    return <DashboardSkeleton />;
  }

  const chartDataFormatted = chartData.map(d => ({
    name: `T${d.month}`,
    revenue: d.revenue / 1000000,
  }));

  const timeFilterLabels: Record<TimeFilter, string> = {
    week: 'Tuần này',
    month: 'Tháng này',
    lastMonth: 'Tháng trước',
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Bảng điều khiển quản lý học phí</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {(['week', 'month', 'lastMonth'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {timeFilterLabels[filter]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Students */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/students')}>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Học sinh</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalStudents}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Sessions with filter */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/attendance')}>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Buổi học ({timeFilterLabels[timeFilter].toLowerCase()})</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredStats.sessionsCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Attendance Rate */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ đi học</p>
                <p className={`text-2xl font-bold ${filteredStats.attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' : filteredStats.attendanceRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                  {filteredStats.attendanceRate}%
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Collection Rate */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ thu tiền</p>
                <p className={`text-2xl font-bold ${collectionRate >= 80 ? 'text-green-600 dark:text-green-400' : collectionRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                  {collectionRate}%
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Revenue and Debt Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/payments')}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Thu tháng này</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.revenueThisMonth)}đ</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={scrollToDebtSection}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tổng công nợ</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.totalDebt)}đ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="danger">{allDebtStudents.length} học sinh</Badge>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Buổi học sắp tới</h2>
              <Button variant="secondary" size="sm" onClick={() => navigate('/attendance')}>
                Xem tất cả
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingSessions.map((session) => {
                const sessionDate = parseISO(session.date);
                const isTodaySession = isToday(sessionDate);
                return (
                  <div
                    key={session._id}
                    className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                      isTodaySession
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => navigate('/attendance')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={isTodaySession ? 'primary' : 'gray'}>
                        {isTodaySession ? 'Hôm nay' : 'Ngày mai'}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{session.subject}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {session.studentIds.length} học sinh
                    </p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Thu nhập 6 tháng gần nhất</h2>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Triệu VNĐ</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataFormatted}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)} triệu VNĐ`, 'Thu nhập']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Student Status Distribution */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Phân bố tình trạng học sinh</h2>
            </div>
            {statusDistribution.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu đánh giá học sinh</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Debt Students */}
      <Card>
        <CardBody>
          <div ref={debtSectionRef} className="flex items-center justify-between mb-4 scroll-mt-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Học sinh cần nhắc đóng tiền</h2>
            {allDebtStudents.length > 5 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAllDebt(!showAllDebt)}
              >
                {showAllDebt ? 'Thu gọn' : `Xem tất cả (${allDebtStudents.length})`}
              </Button>
            )}
          </div>
          {allDebtStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Tất cả học sinh đã đóng đủ tiền</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Không có học sinh nợ tiền</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(showAllDebt ? allDebtStudents : debtStudents).map((item) => (
                <div
                  key={item.student._id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all"
                  onClick={() => navigate(`/students/${item.student._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold">
                      {item.student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.student.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.student.phone || 'Chưa có SĐT'}</p>
                    </div>
                  </div>
                  <p className="font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(item.balance)}đ
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="secondary" className="flex-col h-auto py-4" onClick={() => navigate('/students')}>
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Thêm học sinh
            </Button>
            <Button variant="secondary" className="flex-col h-auto py-4" onClick={() => navigate('/attendance')}>
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Điểm danh
            </Button>
            <Button variant="secondary" className="flex-col h-auto py-4" onClick={() => navigate('/payments')}>
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Thu tiền
            </Button>
            <Button variant="secondary" className="flex-col h-auto py-4" onClick={() => navigate('/notes')}>
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Ghi chú
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
