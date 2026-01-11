import { useEffect, useState, useRef, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Button,
  Input,
  Select,
  Modal,
  Card,
  CardBody,
  Badge,
  AttendanceSkeleton,
} from '../components/common';
import { offlineSessionApi, offlineGroupApi, offlineStudentApi, offlineNoteApi, offlineSettingsApi } from '../services/offlineApi';
import type { Session, Group, Student, AttendanceStatus, Settings } from '../types';

const statusLabels: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  absent: 'Vắng',
  late: 'Đi muộn',
  excused: 'Có phép',
};

const statusColors: Record<AttendanceStatus, 'success' | 'danger' | 'warning' | 'gray'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'gray',
};

// Days starting from Monday
const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Max teaching hours per day for percentage calculation
const MAX_TEACHING_HOURS = 8;

// Helper to parse time string to hours (decimal)
const timeToHours = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
};

// Get the Monday of the week containing the given date
const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Custom hook to preserve scroll position
function useScrollPreservation() {
  const scrollRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveScroll = useCallback(() => {
    scrollRef.current = window.scrollY;
  }, []);

  const restoreScroll = useCallback(() => {
    if (scrollRef.current !== null) {
      // Clear any pending restore
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Use multiple restore attempts to handle async renders
      const savedPosition = scrollRef.current;
      window.scrollTo(0, savedPosition);

      // Restore again after a short delay (for async content)
      timeoutRef.current = setTimeout(() => {
        window.scrollTo(0, savedPosition);
      }, 50);

      // And once more for safety
      setTimeout(() => {
        window.scrollTo(0, savedPosition);
        scrollRef.current = null;
      }, 150);
    }
  }, []);

  return { saveScroll, restoreScroll, scrollRef };
}

export function Attendance() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [selectedDays, setSelectedDays] = useState<Date[]>([]); // Multi-day selection
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [dragStartDay, setDragStartDay] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const { saveScroll, restoreScroll } = useScrollPreservation();
  const [dailyNote, setDailyNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isDuplicateDaysModalOpen, setIsDuplicateDaysModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ studentId: string; status: AttendanceStatus; note: string }[]>([]);
  const [duplicateWeeks, setDuplicateWeeks] = useState('4');
  const [duplicateDirection, setDuplicateDirection] = useState<'forward' | 'backward' | 'both'>('forward');
  const [duplicating, setDuplicating] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [newSession, setNewSession] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    type: 'scheduled' | 'makeup';
    subject: string;
    groupId: string;
    studentIds: string[];
    notes: string;
    onlineLink: string;
  }>({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '14:00',
    endTime: '16:00',
    type: 'scheduled',
    subject: '',
    groupId: '',
    studentIds: [],
    notes: '',
    onlineLink: '',
  });

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    // Only show full skeleton on initial load
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setCalendarLoading(true);
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const [sessionsRes, groupsRes, studentsRes, settingsRes] = await Promise.all([
      offlineSessionApi.getCalendar(year, month),
      offlineGroupApi.getAll({ active: 'true' }),
      offlineStudentApi.getAll({ active: 'true' }),
      offlineSettingsApi.get(),
    ]);

    if (sessionsRes.success && sessionsRes.data) setSessions(sessionsRes.data);
    if (groupsRes.success && groupsRes.data) setGroups(groupsRes.data);
    if (studentsRes.success && studentsRes.data) setStudents(studentsRes.data);
    if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data);

    setLoading(false);
    setCalendarLoading(false);
    setIsInitialLoad(false);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate empty cells for Monday start
  // getDay returns 0 for Sunday, 1 for Monday, etc.
  // For Monday start: Monday=0, Tuesday=1, ..., Sunday=6
  const getEmptyCellsCount = () => {
    const firstDayOfMonth = monthStart.getDay();
    // Convert from Sunday-based (0=Sun) to Monday-based (0=Mon)
    return firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  };

  const getSessionsForDay = (date: Date) => {
    return sessions.filter((s) => isSameDay(new Date(s.date), date));
  };

  // Calculate workload for a day
  const calculateDayWorkload = (daySessions: Session[]) => {
    if (daySessions.length === 0) {
      return { totalHours: 0, percentage: 0, timeBlocks: [] as { start: number; end: number; intensity: number }[] };
    }

    let totalHours = 0;
    const timeBlocks: { start: number; end: number; intensity: number }[] = [];

    daySessions.forEach((session) => {
      const startHour = timeToHours(session.startTime);
      const endHour = timeToHours(session.endTime);
      const duration = endHour - startHour;
      totalHours += duration;

      // Calculate intensity based on number of students
      const studentCount = session.attendance?.length || 1;
      const intensity = Math.min(studentCount / 5, 1); // Normalize to 0-1

      timeBlocks.push({ start: startHour, end: endHour, intensity });
    });

    const percentage = Math.min(Math.round((totalHours / MAX_TEACHING_HOURS) * 100), 100);

    return { totalHours, percentage, timeBlocks };
  };

  const isInSelectedWeek = (date: Date): boolean => {
    if (!selectedWeekStart) return false;
    const weekEnd = new Date(selectedWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return date >= selectedWeekStart && date <= weekEnd;
  };

  const isInSelectedDays = (date: Date): boolean => {
    return selectedDays.some(d => isSameDay(d, date));
  };

  // Get days between two dates (inclusive)
  const getDaysBetween = (start: Date, end: Date): Date[] => {
    const days: Date[] = [];
    const startDate = start < end ? start : end;
    const endDate = start < end ? end : start;

    let current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const handleDayClick = (day: Date, isLongPress: boolean = false, isShiftKey: boolean = false) => {
    // Save scroll position before state change
    saveScroll();

    if (isMultiSelectMode || isShiftKey) {
      // Multi-select mode: toggle day in selection
      if (isInSelectedDays(day)) {
        setSelectedDays(prev => prev.filter(d => !isSameDay(d, day)));
      } else {
        if (isShiftKey && selectedDays.length > 0) {
          // Shift+click: select range from last selected to current
          const lastSelected = selectedDays[selectedDays.length - 1];
          const rangeDays = getDaysBetween(lastSelected, day);
          setSelectedDays(prev => {
            const newDays = [...prev];
            rangeDays.forEach(d => {
              if (!newDays.some(nd => isSameDay(nd, d))) {
                newDays.push(d);
              }
            });
            return newDays;
          });
        } else {
          setSelectedDays(prev => [...prev, day]);
        }
      }
      setSelectedDate(null);
      setSelectedWeekStart(null);
    } else if (isLongPress) {
      // Long press/right click selects the week
      const monday = getMondayOfWeek(day);
      if (selectedWeekStart && monday.getTime() === selectedWeekStart.getTime()) {
        setSelectedWeekStart(null);
      } else {
        setSelectedWeekStart(monday);
      }
      setSelectedDate(null);
      setSelectedDays([]);
    } else {
      setSelectedDate(day);
      setSelectedWeekStart(null);
      setSelectedDays([]);
    }

    // Restore scroll after state updates
    requestAnimationFrame(() => {
      restoreScroll();
    });
  };

  // Handle drag selection for touch devices
  const handleDragStart = (day: Date) => {
    setDragStartDay(day);
    setSelectedDays([day]);
    setSelectedDate(null);
    setSelectedWeekStart(null);
  };

  const handleDragEnter = (day: Date) => {
    if (dragStartDay) {
      const rangeDays = getDaysBetween(dragStartDay, day);
      setSelectedDays(rangeDays);
    }
  };

  const handleDragEnd = () => {
    setDragStartDay(null);
    if (selectedDays.length > 0) {
      // Keep selection for duplication
      setIsMultiSelectMode(true);
    }
  };

  // Clear multi-select mode
  const clearMultiSelect = () => {
    setSelectedDays([]);
    setIsMultiSelectMode(false);
  };

  // Load notes when selectedDate changes
  useEffect(() => {
    const loadNote = async () => {
      if (selectedDate) {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        try {
          const res = await offlineNoteApi.getByDate(dateKey);
          if (res.success && res.data) {
            setDailyNote(res.data.content);
            setNoteContent(res.data.content);
          } else {
            setDailyNote('');
            setNoteContent('');
          }
        } catch {
          setDailyNote('');
          setNoteContent('');
        }
        setIsEditingNote(false);
        // Restore scroll after note loads
        requestAnimationFrame(() => {
          restoreScroll();
        });
      }
    };
    loadNote();
  }, [selectedDate, restoreScroll]);

  // Save notes to database
  const saveNote = useCallback(async () => {
    if (selectedDate) {
      saveScroll();
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      try {
        await offlineNoteApi.upsertDaily(dateKey, noteContent);
        setDailyNote(noteContent);
        setIsEditingNote(false);
        toast.success('Đã lưu ghi chú');
        restoreScroll();
      } catch {
        toast.error('Lỗi khi lưu ghi chú');
      }
    }
  }, [selectedDate, noteContent, saveScroll, restoreScroll]);

  const deleteNote = useCallback(async () => {
    if (selectedDate && dailyNote) {
      saveScroll();
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      try {
        await offlineNoteApi.upsertDaily(dateKey, '');
        setDailyNote('');
        setNoteContent('');
        setIsEditingNote(false);
        toast.success('Đã xóa ghi chú');
        restoreScroll();
      } catch {
        toast.error('Lỗi khi xóa ghi chú');
      }
    }
  }, [selectedDate, dailyNote, saveScroll, restoreScroll]);

  // Wrapper to preserve scroll on any action
  const withScrollPreservation = useCallback(<T extends unknown[]>(fn: (...args: T) => void) => {
    return (...args: T) => {
      saveScroll();
      fn(...args);
      requestAnimationFrame(() => {
        restoreScroll();
      });
    };
  }, [saveScroll, restoreScroll]);

  // Download notes as markdown file
  const downloadNote = useCallback(() => {
    if (selectedDate && dailyNote) {
      const dateFormatted = format(selectedDate, 'dd-MM-yyyy');
      const daySessions = getSessionsForDay(selectedDate);

      // Build markdown content with session info
      let content = `# Ghi chú ngày ${format(selectedDate, 'dd/MM/yyyy')}\n\n`;

      if (daySessions.length > 0) {
        content += `## Lịch dạy (${daySessions.length} buổi)\n\n`;
        daySessions.forEach((session) => {
          content += `- **${session.subject}**: ${session.startTime} - ${session.endTime}\n`;
        });
        content += '\n';
      }

      content += `## Ghi chú\n\n${dailyNote}`;

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ghi-chu-${dateFormatted}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [selectedDate, dailyNote]);

  const openAttendanceModal = useCallback((session: Session) => {
    setSelectedSession(session);
    setAttendanceData(
      session.attendance.map((a) => ({
        studentId: typeof a.studentId === 'string' ? a.studentId : (a.studentId as Student)._id,
        status: a.status,
        note: a.note || '',
      }))
    );
    setIsAttendanceModalOpen(true);
  }, []);

  const saveAttendance = async () => {
    if (!selectedSession) return;
    saveScroll();
    try {
      await offlineSessionApi.updateAttendance(selectedSession._id, attendanceData);
      toast.success('Lưu điểm danh thành công');
      setIsAttendanceModalOpen(false);
      await loadData();
      restoreScroll();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const deleteSession = async () => {
    if (!selectedSession) return;
    if (!window.confirm(`Bạn có chắc muốn xoá buổi học "${selectedSession.subject}" không?`)) return;

    saveScroll();
    try {
      const result = await offlineSessionApi.delete(selectedSession._id);
      if (result.success) {
        toast.success('Xoá buổi học thành công');
        setIsAttendanceModalOpen(false);
        setSelectedSession(null);
        await loadData();
        restoreScroll();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi xoá buổi học');
    }
  };

  const createSession = async () => {
    if (!newSession.subject) {
      toast.error('Vui lòng chọn môn học');
      return;
    }
    if (!newSession.groupId && newSession.studentIds.length === 0) {
      toast.error('Vui lòng chọn lớp hoặc học sinh');
      return;
    }

    try {
      let studentIds = newSession.studentIds;
      if (newSession.groupId) {
        const groupStudents = students.filter(
          (s) => s.groupId === newSession.groupId || (typeof s.groupId === 'object' && s.groupId?._id === newSession.groupId)
        );
        studentIds = groupStudents.map((s) => s._id);
      }

      await offlineSessionApi.create({
        date: new Date(newSession.date).toISOString(),
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        type: newSession.type,
        subject: newSession.subject,
        groupId: newSession.groupId || undefined,
        studentIds,
        attendance: studentIds.map((id) => ({ studentId: id, status: 'absent' as AttendanceStatus })),
        notes: newSession.notes || undefined,
        onlineLink: newSession.onlineLink || undefined,
      });

      toast.success('Tạo buổi học thành công');
      setIsSessionModalOpen(false);
      setNewSession({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '14:00',
        endTime: '16:00',
        type: 'scheduled',
        subject: '',
        groupId: '',
        studentIds: [],
        notes: '',
        onlineLink: '',
      });
      saveScroll();
      await loadData();
      restoreScroll();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDuplicateWeek = async () => {
    if (!selectedWeekStart) return;

    setDuplicating(true);
    saveScroll();
    try {
      const result = await offlineSessionApi.duplicateWeek({
        weekStartDate: selectedWeekStart.toISOString(),
        numberOfWeeks: parseInt(duplicateWeeks),
        direction: duplicateDirection,
      });

      if (result.success) {
        toast.success(`Đã tạo ${result.data?.length || 0} buổi học mới`);
        setIsDuplicateModalOpen(false);
        setSelectedWeekStart(null);
        setDuplicateDirection('forward'); // Reset to default
        await loadData();
        restoreScroll();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
    setDuplicating(false);
  };

  if (loading) {
    return <AttendanceSkeleton />;
  }

  const today = new Date();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Điểm danh</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Quản lý buổi học và điểm danh</p>
        </div>
        <div className="flex gap-2">
          {selectedWeekStart && (
            <Button variant="success" size="sm" onClick={() => setIsDuplicateModalOpen(true)}>
              <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Nhân bản</span>
            </Button>
          )}
          <Button size="sm" onClick={() => {
              if (selectedDate) {
                setNewSession({ ...newSession, date: format(selectedDate, 'yyyy-MM-dd') });
              }
              setIsSessionModalOpen(true);
            }}>
            <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Thêm buổi</span>
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardBody>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <button
              onClick={withScrollPreservation(() => setCurrentDate(subMonths(currentDate, 1)))}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: vi })}
              </h2>
              <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 mt-1">
                Nhấn giữ vào ngày để chọn tuần cần nhân bản
              </p>
            </div>
            <button
              onClick={withScrollPreservation(() => setCurrentDate(addMonths(currentDate, 1)))}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers - Starting from Monday */}
          <div className="grid grid-cols-7 gap-1 mb-1 sm:mb-2">
            {dayLabels.map((day) => (
              <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 py-1 sm:py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="relative">
            {/* Loading overlay for month change */}
            {calendarLoading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-xl">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium">Đang tải...</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first of the month */}
              {Array.from({ length: getEmptyCellsCount() }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[55px] sm:min-h-[70px] lg:min-h-[80px] bg-gray-50/50 dark:bg-gray-800/30 rounded-lg sm:rounded-xl" />
              ))}

              {/* Days of the month */}
              {days.map((day) => {
              const daySessions = getSessionsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              const inSelectedWeek = isInSelectedWeek(day);
              const inSelectedDays = isInSelectedDays(day);
              const workload = calculateDayWorkload(daySessions);

              // Get fill color based on workload percentage
              const getFillColor = (pct: number) => {
                if (pct === 0) return 'bg-transparent';
                if (pct <= 25) return 'bg-yellow-400/30';
                if (pct <= 50) return 'bg-yellow-500/30';
                if (pct <= 75) return 'bg-orange-500/30';
                return 'bg-red-500/30';
              };

              return (
                <button
                  key={day.toISOString()}
                  onClick={(e) => handleDayClick(day, false, e.shiftKey)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleDayClick(day, true);
                  }}
                  onMouseDown={(e) => {
                    if (e.shiftKey || isMultiSelectMode) return;
                    // Start drag selection on mouse down (require 500ms hold)
                    const startDragTimer = setTimeout(() => {
                      handleDragStart(day);
                    }, 500);
                    const mouseUp = () => {
                      clearTimeout(startDragTimer);
                      document.removeEventListener('mouseup', mouseUp);
                    };
                    document.addEventListener('mouseup', mouseUp);
                  }}
                  onMouseEnter={() => {
                    if (dragStartDay) handleDragEnter(day);
                  }}
                  onMouseUp={() => {
                    // Only call handleDragEnd if drag was actually started
                    if (dragStartDay) handleDragEnd();
                  }}
                  onTouchStart={(e) => {
                    let moved = false;
                    let dragStarted = false;
                    const startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    const longPressTimer = setTimeout(() => {
                      if (!moved) handleDayClick(day, true);
                    }, 500);
                    const dragTimer = setTimeout(() => {
                      if (!moved) {
                        handleDragStart(day);
                        dragStarted = true;
                      }
                    }, 400);
                    const touchMove = (ev: TouchEvent) => {
                      const dx = Math.abs(ev.touches[0].clientX - startPos.x);
                      const dy = Math.abs(ev.touches[0].clientY - startPos.y);
                      if (dx > 10 || dy > 10) moved = true;
                    };
                    const touchEnd = () => {
                      clearTimeout(longPressTimer);
                      clearTimeout(dragTimer);
                      // Only call handleDragEnd if drag was actually started
                      if (dragStarted || dragStartDay) handleDragEnd();
                      document.removeEventListener('touchmove', touchMove);
                      document.removeEventListener('touchend', touchEnd);
                    };
                    document.addEventListener('touchmove', touchMove);
                    document.addEventListener('touchend', touchEnd);
                  }}
                  className={`p-1 sm:p-1.5 text-center rounded-lg sm:rounded-xl transition-all min-h-[55px] sm:min-h-[70px] lg:min-h-[80px] relative flex flex-col overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-blue-500'
                      : inSelectedDays
                      ? 'ring-2 ring-purple-500'
                      : inSelectedWeek
                      ? 'ring-1 ring-green-500'
                      : isToday
                      ? 'ring-2 ring-blue-500 shadow-lg'
                      : ''
                  } ${
                    isToday && workload.percentage === 0
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      : isSelected
                      ? 'bg-blue-50 dark:bg-blue-950'
                      : inSelectedDays
                      ? 'bg-purple-50 dark:bg-purple-950'
                      : inSelectedWeek
                      ? 'bg-green-50 dark:bg-green-950'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {/* Water fill effect - fills from bottom */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
                      isToday
                        ? workload.percentage <= 25 ? 'bg-yellow-400/30' :
                          workload.percentage <= 50 ? 'bg-yellow-500/30' :
                          workload.percentage <= 75 ? 'bg-orange-500/30' :
                          'bg-red-500/30'
                        : getFillColor(workload.percentage)
                    }`}
                    style={{ height: `${workload.percentage}%` }}
                  />

                  {/* Multi-select indicator */}
                  {inSelectedDays && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center z-20">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Content - always on top of fill */}
                  <div className="relative z-10 flex flex-col h-full w-full pb-3">
                    {/* Date number */}
                    <span className={`text-xs sm:text-sm font-bold ${
                      isToday && workload.percentage === 0
                        ? 'text-white'
                        : isToday
                        ? 'text-blue-600 dark:text-blue-300'
                        : isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : inSelectedDays
                        ? 'text-purple-700 dark:text-purple-300'
                        : inSelectedWeek
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {format(day, 'd')}
                    </span>

                    {/* Session count */}
                    {daySessions.length > 0 && (
                      <span className={`text-[10px] sm:text-xs font-bold tabular-nums mt-auto ${
                        isToday && workload.percentage === 0 ? 'text-white' :
                        isToday ? 'text-blue-600 dark:text-blue-300' :
                        workload.percentage > 50 ? 'text-gray-800 dark:text-white' :
                        'text-gray-600 dark:text-gray-300'
                      }`}>
                        {daySessions.length}x
                      </span>
                    )}
                  </div>

                  {/* Mini timeline bar - fixed at bottom */}
                  {(() => {
                    const startHour = settings?.workingHoursStart ?? 6;
                    const endHour = settings?.workingHoursEnd ?? 22;
                    const range = endHour - startHour;
                    return (
                      <div className={`absolute bottom-1 left-1 right-1 h-1 sm:h-1.5 rounded-full overflow-hidden z-10 ${
                        isToday ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        {workload.timeBlocks.map((block, i) => {
                          const blockStart = Math.max(block.start, startHour);
                          const blockEnd = Math.min(block.end, endHour);
                          if (blockStart >= blockEnd) return null;
                          const left = ((blockStart - startHour) / range) * 100;
                          const width = ((blockEnd - blockStart) / range) * 100;
                          const bgColor = block.intensity <= 0.3
                            ? 'bg-yellow-500'
                            : block.intensity <= 0.6
                            ? 'bg-orange-500'
                            : 'bg-red-600';
                          return (
                            <div
                              key={i}
                              className={`absolute top-0 h-full ${bgColor}`}
                              style={{ left: `${left}%`, width: `${width}%` }}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}
                </button>
              );
            })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Selected Week Info */}
      {selectedWeekStart && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Tuần đã chọn</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(selectedWeekStart, 'dd/MM')} - {format(new Date(selectedWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={withScrollPreservation(() => setSelectedWeekStart(null))}>
                  Bỏ chọn
                </Button>
                <Button variant="success" size="sm" onClick={withScrollPreservation(() => setIsDuplicateModalOpen(true))}>
                  Nhân bản
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Selected Days Info (Multi-select) */}
      {selectedDays.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Đã chọn {selectedDays.length} ngày</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDays.slice(0, 5).map((d, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                        {format(d, 'dd/MM')}
                      </span>
                    ))}
                    {selectedDays.length > 5 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        +{selectedDays.length - 5} ngày
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={withScrollPreservation(clearMultiSelect)}>
                  Bỏ chọn
                </Button>
                {selectedDays.length === 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={withScrollPreservation(() => {
                      // Select all days in the week of the selected day
                      const monday = getMondayOfWeek(selectedDays[0]);
                      const weekDays: Date[] = [];
                      for (let i = 0; i < 7; i++) {
                        const d = new Date(monday);
                        d.setDate(monday.getDate() + i);
                        weekDays.push(d);
                      }
                      setSelectedDays(weekDays);
                    })}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Chọn tuần này
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={withScrollPreservation(() => setIsMultiSelectMode(!isMultiSelectMode))}
                  className={isMultiSelectMode ? 'ring-2 ring-purple-500' : ''}
                >
                  {isMultiSelectMode ? 'Thoát chọn nhiều' : 'Thêm ngày'}
                </Button>
                <Button variant="success" size="sm" onClick={withScrollPreservation(() => setIsDuplicateDaysModalOpen(true))}>
                  Nhân bản các ngày
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Nhấn Shift + click để chọn nhiều ngày liên tiếp, hoặc kéo chuột/vuốt để chọn vùng
            </p>
          </CardBody>
        </Card>
      )}

      {/* Selected Date Sessions */}
      {selectedDate && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Buổi học ngày {format(selectedDate, 'dd/MM/yyyy')}
            </h3>

            {/* Detailed 24h Timeline */}
            {(() => {
              const daySessions = getSessionsForDay(selectedDate);
              const workload = calculateDayWorkload(daySessions);

              return (
                <div className="mb-6">
                  {/* Workload summary with glass/battery style */}
                  <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    {/* Glass container */}
                    <div className="relative w-14 h-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      {/* Water fill */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${
                          workload.percentage <= 25 ? 'bg-yellow-400' :
                          workload.percentage <= 50 ? 'bg-yellow-500' :
                          workload.percentage <= 75 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ height: `${workload.percentage}%` }}
                      />
                      {/* Percentage text overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold tabular-nums ${
                          workload.percentage > 40 ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {workload.percentage}%
                        </span>
                      </div>
                      {/* Glass shine effect */}
                      <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-white/20 to-transparent" />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Khối lượng công việc</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {daySessions.length} buổi • {workload.totalHours.toFixed(1)} giờ dạy / {MAX_TEACHING_HOURS}h tối đa
                      </p>
                      {/* Legend */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-yellow-400"></span> 0-25%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-yellow-500"></span> 26-50%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-orange-500"></span> 51-75%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-red-500"></span> 76-100%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 24h Timeline */}
                  <div className="relative">
                    {/* Time markers */}
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">
                      {[0, 6, 12, 18, 24].map((h) => (
                        <span key={h}>{h.toString().padStart(2, '0')}:00</span>
                      ))}
                    </div>

                    {/* Timeline bar */}
                    <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      {/* Working hours background (6am - 10pm) */}
                      <div
                        className="absolute top-0 h-full bg-gray-300 dark:bg-gray-600"
                        style={{ left: `${(6/24)*100}%`, width: `${(16/24)*100}%` }}
                      />

                      {/* Session blocks */}
                      {workload.timeBlocks.map((block, i) => {
                        const left = (block.start / 24) * 100;
                        const width = ((block.end - block.start) / 24) * 100;
                        const bgColor = block.intensity <= 0.3
                          ? 'bg-yellow-400'
                          : block.intensity <= 0.6
                          ? 'bg-orange-400'
                          : 'bg-red-500';
                        return (
                          <div
                            key={i}
                            className={`absolute top-0 h-full ${bgColor} border-l-2 border-r-2 border-white dark:border-gray-800`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${daySessions[i]?.subject || 'Buổi học'}: ${daySessions[i]?.startTime} - ${daySessions[i]?.endTime}`}
                          />
                        );
                      })}

                      {/* Hour grid lines */}
                      {[6, 12, 18].map((h) => (
                        <div
                          key={h}
                          className="absolute top-0 h-full w-px bg-gray-400 dark:bg-gray-500"
                          style={{ left: `${(h/24)*100}%` }}
                        />
                      ))}
                    </div>

                    {/* Session labels below timeline */}
                    {daySessions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {daySessions.map((session, i) => {
                          const intensity = (session.attendance?.length || 1) / 5;
                          const bgColor = intensity <= 0.3
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400'
                            : intensity <= 0.6
                            ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-400'
                            : 'bg-red-100 dark:bg-red-900/30 border-red-400';
                          return (
                            <div
                              key={i}
                              className={`text-xs px-2 py-1 rounded-lg border ${bgColor}`}
                            >
                              <span className="font-semibold text-gray-900 dark:text-white">{session.subject}</span>
                              <span className="text-gray-500 dark:text-gray-400 ml-1">
                                {session.startTime}-{session.endTime}
                              </span>
                              <span className="text-gray-400 dark:text-gray-500 ml-1">
                                ({session.attendance?.length || 0} HS)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {getSessionsForDay(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">Không có buổi học</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={withScrollPreservation(() => {
                    setNewSession({ ...newSession, date: format(selectedDate, 'yyyy-MM-dd') });
                    setIsSessionModalOpen(true);
                  })}
                >
                  Thêm buổi học cho ngày này
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {getSessionsForDay(selectedDate).map((session) => (
                  <div
                    key={session._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => openAttendanceModal(session)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{session.subject}</span>
                        <Badge variant={session.type === 'makeup' ? 'warning' : 'primary'}>
                          {session.type === 'makeup' ? 'Học bù' : 'Lịch cố định'}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {session.attendance.map((a, i) => {
                        const student = typeof a.studentId === 'object' ? a.studentId : students.find((s) => s._id === a.studentId);
                        return (
                          <Badge key={i} variant={statusColors[a.status]}>
                            {(student as Student)?.name || 'N/A'}: {statusLabels[a.status]}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Daily Notes Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Ghi chú trong ngày
                </h4>
                <div className="flex gap-2">
                  {!isEditingNote ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={withScrollPreservation(() => {
                          setNoteContent(dailyNote);
                          setIsEditingNote(true);
                        })}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Sửa
                      </Button>
                      {dailyNote && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={withScrollPreservation(downloadNote)}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Tải xuống
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={deleteNote}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={withScrollPreservation(() => {
                          setNoteContent(dailyNote);
                          setIsEditingNote(false);
                        })}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveNote}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Lưu
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditingNote ? (
                <div className="space-y-3">
                  {/* Quick checklist buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={withScrollPreservation(() => setNoteContent(noteContent + (noteContent ? '\n' : '') + '- [ ] '))}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                    >
                      + Checkbox
                    </button>
                    <button
                      type="button"
                      onClick={withScrollPreservation(() => setNoteContent(noteContent + (noteContent ? '\n' : '') + '- [ ] Soạn đề kiểm tra\n- [ ] Chuẩn bị tài liệu\n- [ ] In bài tập'))}
                      className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                    >
                      + Checklist mẫu
                    </button>
                    <button
                      type="button"
                      onClick={withScrollPreservation(() => setNoteContent(noteContent + (noteContent ? '\n' : '') + '## Chuẩn bị\n- [ ] \n\n## Ghi nhớ\n- '))}
                      className="px-3 py-1.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
                    >
                      + Template
                    </button>
                  </div>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Nhập ghi chú cho ngày này... (hỗ trợ Markdown)"
                    className="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hỗ trợ Markdown: **đậm**, *nghiêng*, - [ ] checkbox, - danh sách, # tiêu đề
                  </p>
                </div>
              ) : dailyNote ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  {/* Render with interactive checkboxes */}
                  {(noteContent || dailyNote).includes('- [ ]') || (noteContent || dailyNote).includes('- [x]') ? (
                    <div className="space-y-2">
                      {(noteContent || dailyNote).split('\n').map((line, index) => {
                        const isUnchecked = line.includes('- [ ]');
                        const isChecked = line.includes('- [x]');

                        if (isUnchecked || isChecked) {
                          const textContent = line.replace(/- \[[ x]\]\s*/, '');
                          return (
                            <label
                              key={index}
                              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                  : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                  isChecked
                                    ? 'bg-green-500 text-white'
                                    : 'border-2 border-gray-300 dark:border-gray-500'
                                }`}
                                onClick={withScrollPreservation(() => {
                                  const lines = (noteContent || dailyNote).split('\n');
                                  if (lines[index].includes('- [ ]')) {
                                    lines[index] = lines[index].replace('- [ ]', '- [x]');
                                  } else if (lines[index].includes('- [x]')) {
                                    lines[index] = lines[index].replace('- [x]', '- [ ]');
                                  }
                                  setNoteContent(lines.join('\n'));
                                })}
                              >
                                {isChecked && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-sm flex-1 ${isChecked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {textContent}
                              </span>
                            </label>
                          );
                        }

                        if (line.trim()) {
                          return (
                            <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{line}</ReactMarkdown>
                            </div>
                          );
                        }
                        return <div key={index} className="h-2" />;
                      })}
                      {/* Save button if checkboxes were modified */}
                      {noteContent && noteContent !== dailyNote && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button size="sm" onClick={saveNote}>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Lưu thay đổi
                          </Button>
                          <Button size="sm" variant="secondary" onClick={withScrollPreservation(() => setNoteContent(dailyNote))}>
                            Hủy
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{dailyNote}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có ghi chú</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={withScrollPreservation(() => setIsEditingNote(true))}
                  >
                    Thêm ghi chú
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Add Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title="Thêm buổi học mới"
        size="sm"
      >
        <form onSubmit={(e) => { e.preventDefault(); createSession(); }} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày *</label>
            <div className="relative">
              <input
                type="date"
                value={newSession.date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  let updatedSession = { ...newSession, date: newDate };

                  // Nếu đã chọn nhóm, cập nhật lại thông tin từ lịch nhóm cho ngày mới
                  if (newSession.groupId) {
                    const selectedGroup = groups.find(g => g._id === newSession.groupId);
                    if (selectedGroup && selectedGroup.schedule && selectedGroup.schedule.length > 0) {
                      const sessionDate = new Date(newDate);
                      const dayOfWeek = sessionDate.getDay();
                      const scheduleItem = selectedGroup.schedule.find((s: { dayOfWeek: number; startTime: string; endTime: string; subject: string }) => s.dayOfWeek === dayOfWeek);

                      if (scheduleItem) {
                        updatedSession = {
                          ...updatedSession,
                          startTime: scheduleItem.startTime,
                          endTime: scheduleItem.endTime,
                          subject: scheduleItem.subject,
                        };
                      }
                    }
                  }

                  setNewSession(updatedSession);
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <div className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-between">
                <span className={newSession.date ? '' : 'text-gray-400'}>
                  {newSession.date
                    ? format(new Date(newSession.date), 'dd/MM/yyyy')
                    : 'Chọn ngày'}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newSession.startTime}
                onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-400 flex-shrink-0">-</span>
              <input
                type="time"
                value={newSession.endTime}
                onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Loại"
              value={newSession.type}
              onChange={(e) => setNewSession({ ...newSession, type: e.target.value as 'scheduled' | 'makeup' })}
              options={[
                { value: 'scheduled', label: 'Cố định' },
                { value: 'makeup', label: 'Học bù' },
              ]}
            />
            <Select
              label="Môn học *"
              value={newSession.subject}
              onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
              options={[
                { value: '', label: 'Chọn môn' },
                ...(settings?.subjects || []).map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>

          <Select
            label="Lớp học"
            value={newSession.groupId}
            onChange={(e) => {
              const selectedGroupId = e.target.value;
              const selectedGroup = groups.find(g => g._id === selectedGroupId);

              // Nếu chọn nhóm, tìm lịch học cho ngày đang chọn
              let updatedSession = { ...newSession, groupId: selectedGroupId, studentIds: [] };

              if (selectedGroup && selectedGroup.schedule && selectedGroup.schedule.length > 0) {
                const sessionDate = new Date(newSession.date);
                const dayOfWeek = sessionDate.getDay();
                const scheduleItem = selectedGroup.schedule.find((s: { dayOfWeek: number; startTime: string; endTime: string; subject: string }) => s.dayOfWeek === dayOfWeek);

                if (scheduleItem) {
                  // Tự động điền thông tin từ lịch nhóm
                  updatedSession = {
                    ...updatedSession,
                    startTime: scheduleItem.startTime,
                    endTime: scheduleItem.endTime,
                    subject: scheduleItem.subject,
                  };
                }
              }

              setNewSession(updatedSession);
            }}
            options={[
              { value: '', label: 'Học sinh cá nhân' },
              ...groups.map((g) => ({ value: g._id, label: g.name })),
            ]}
          />

          {!newSession.groupId && students.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Chọn học sinh</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {students.map((s) => (
                  <label key={s._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSession.studentIds.includes(s._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewSession({ ...newSession, studentIds: [...newSession.studentIds, s._id] });
                        } else {
                          setNewSession({ ...newSession, studentIds: newSession.studentIds.filter((id) => id !== s._id) });
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Ghi chú"
            value={newSession.notes}
            onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
            placeholder="Thông tin bổ sung..."
          />

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => setIsSessionModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Thêm buổi học</Button>
          </div>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Điểm danh"
        size="lg"
      >
        <div className="space-y-4">
          {/* Session Info */}
          {selectedSession && (
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">{selectedSession.subject}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {format(new Date(selectedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })} • {selectedSession.startTime} - {selectedSession.endTime}
                  </p>
                </div>
                <Badge variant={selectedSession.type === 'makeup' ? 'warning' : 'primary'}>
                  {selectedSession.type === 'makeup' ? 'Học bù' : 'Lịch cố định'}
                </Badge>
              </div>
            </div>
          )}
          {attendanceData.map((a, i) => {
            const student = students.find((s) => s._id === a.studentId);
            return (
              <div key={a.studentId} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  {student?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="font-medium text-gray-900 dark:text-white flex-1">{student?.name || 'N/A'}</span>
                <Select
                  value={a.status}
                  onChange={(e) => {
                    e.preventDefault();
                    const newData = [...attendanceData];
                    newData[i].status = e.target.value as AttendanceStatus;
                    setAttendanceData(newData);
                  }}
                  options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
                  className="w-32"
                />
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button variant="danger" onClick={deleteSession}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xoá
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setIsAttendanceModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button onClick={saveAttendance}>Lưu điểm danh</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Duplicate Week Modal */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title="Nhân bản tuần"
        size="md"
      >
        <div className="space-y-5">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Các buổi học trong tuần từ{' '}
              <strong>
                {selectedWeekStart ? format(selectedWeekStart, 'dd/MM') : ''} -{' '}
                {selectedWeekStart ? format(new Date(selectedWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') : ''}
              </strong>{' '}
              sẽ được sao chép sang các tuần tiếp theo.
            </p>
          </div>

          {/* Direction selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hướng nhân bản</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDuplicateDirection('backward')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  duplicateDirection === 'backward'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ← Lùi (về quá khứ)
              </button>
              <button
                type="button"
                onClick={() => setDuplicateDirection('forward')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  duplicateDirection === 'forward'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tiến (tương lai) →
              </button>
              <button
                type="button"
                onClick={() => setDuplicateDirection('both')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  duplicateDirection === 'both'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ← Cả hai →
              </button>
            </div>
          </div>

          <Input
            label="Số tuần cần nhân bản"
            type="number"
            value={duplicateWeeks}
            onChange={(e) => setDuplicateWeeks(e.target.value)}
            min="1"
            max="52"
            placeholder="VD: 4"
          />

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {duplicateDirection === 'forward' && (
              <>Các buổi học sẽ được tạo cho <strong>{duplicateWeeks}</strong> tuần tiếp theo (tương lai).</>
            )}
            {duplicateDirection === 'backward' && (
              <>Các buổi học sẽ được tạo cho <strong>{duplicateWeeks}</strong> tuần về trước (quá khứ).</>
            )}
            {duplicateDirection === 'both' && (
              <>Các buổi học sẽ được tạo cho <strong>{duplicateWeeks}</strong> tuần mỗi hướng (cả quá khứ và tương lai).</>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setIsDuplicateModalOpen(false)} disabled={duplicating}>
              Hủy bỏ
            </Button>
            <Button variant="success" onClick={handleDuplicateWeek} disabled={duplicating}>
              {duplicating ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Nhân bản
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Selected Days Modal */}
      <Modal
        isOpen={isDuplicateDaysModalOpen}
        onClose={() => setIsDuplicateDaysModalOpen(false)}
        title="Nhân bản các ngày đã chọn"
        size="md"
      >
        <div className="space-y-5">
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4">
            <p className="text-sm text-purple-800 dark:text-purple-300">
              Các buổi học trong <strong>{selectedDays.length} ngày</strong> đã chọn sẽ được sao chép sang các tuần tiếp theo.
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedDays.slice(0, 7).map((d, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
                  {format(d, 'dd/MM')}
                </span>
              ))}
              {selectedDays.length > 7 && (
                <span className="text-xs text-purple-600 dark:text-purple-400">+{selectedDays.length - 7} ngày khác</span>
              )}
            </div>
          </div>

          {/* Direction selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hướng nhân bản</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDuplicateDirection('backward')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  duplicateDirection === 'backward'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ← Lùi
              </button>
              <button
                type="button"
                onClick={() => setDuplicateDirection('forward')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  duplicateDirection === 'forward'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tiến →
              </button>
              <button
                type="button"
                onClick={() => setDuplicateDirection('both')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  duplicateDirection === 'both'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ← Cả hai →
              </button>
            </div>
          </div>

          <Input
            label="Số tuần cần nhân bản"
            type="number"
            value={duplicateWeeks}
            onChange={(e) => setDuplicateWeeks(e.target.value)}
            min="1"
            max="52"
            placeholder="VD: 4"
          />

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {duplicateDirection === 'forward' && (
              <>Các buổi học sẽ được tạo cho <strong>{duplicateWeeks}</strong> tuần tiếp theo.</>
            )}
            {duplicateDirection === 'backward' && (
              <>Các buổi học sẽ được tạo cho <strong>{duplicateWeeks}</strong> tuần về trước.</>
            )}
            {duplicateDirection === 'both' && (
              <>Các buổi học sẽ được tạo cho <strong>{duplicateWeeks}</strong> tuần mỗi hướng.</>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setIsDuplicateDaysModalOpen(false)} disabled={duplicating}>
              Hủy bỏ
            </Button>
            <Button
              variant="success"
              onClick={async () => {
                setDuplicating(true);
                try {
                  // Duplicate sessions for each selected day
                  let totalCreated = 0;

                  const createSessionsInDirection = async (isForward: boolean) => {
                    for (const day of selectedDays) {
                      const daySessions = getSessionsForDay(day);
                      for (let week = 1; week <= parseInt(duplicateWeeks); week++) {
                        for (const session of daySessions) {
                          const newDate = new Date(day);
                          newDate.setDate(newDate.getDate() + (isForward ? week : -week) * 7);

                          await offlineSessionApi.create({
                            date: newDate.toISOString(),
                            startTime: session.startTime,
                            endTime: session.endTime,
                            type: session.type as 'scheduled' | 'makeup',
                            subject: session.subject,
                            groupId: session.groupId ? (typeof session.groupId === 'string' ? session.groupId : session.groupId._id) : undefined,
                            studentIds: session.attendance.map(a => typeof a.studentId === 'string' ? a.studentId : a.studentId._id),
                            attendance: session.attendance.map(a => ({
                              studentId: typeof a.studentId === 'string' ? a.studentId : a.studentId._id,
                              status: 'absent' as AttendanceStatus,
                            })),
                            notes: session.notes,
                          });
                          totalCreated++;
                        }
                      }
                    }
                  };

                  if (duplicateDirection === 'forward' || duplicateDirection === 'both') {
                    await createSessionsInDirection(true);
                  }
                  if (duplicateDirection === 'backward' || duplicateDirection === 'both') {
                    await createSessionsInDirection(false);
                  }

                  toast.success(`Đã tạo ${totalCreated} buổi học mới`);
                  setDuplicateDirection('forward'); // Reset to default
                  setIsDuplicateDaysModalOpen(false);
                  clearMultiSelect();
                  await loadData();
                } catch {
                  toast.error('Có lỗi xảy ra');
                }
                setDuplicating(false);
              }}
              disabled={duplicating}
            >
              {duplicating ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Nhân bản
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
