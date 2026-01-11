import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Button,
  Input,
  Select,
  Modal,
  Card,
  CardBody,
  Badge,
  GroupsSkeleton,
  EmptyState,
  ConfirmDialog,
} from '../components/common';
import { useStore } from '../store/useStore';
import { groupApi } from '../services/api';
import { offlineSessionApi } from '../services/offlineApi';
import type { Group, ScheduleItem } from '../types';

const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

// Helper to get current year for school year selection
const getCurrentYear = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // If before September, use previous year as the start of school year
  if (month < 8) {
    return year - 1;
  }
  return year;
};

// Helper to format school year from a starting year
const formatSchoolYear = (startYear: number): string => {
  return `${startYear}-${startYear + 1}`;
};

// Helper to get current school year
const getCurrentSchoolYear = (): string => {
  return formatSchoolYear(getCurrentYear());
};

// Helper to extract start year from school year string
const getStartYearFromSchoolYear = (schoolYear: string): number => {
  const parts = schoolYear.split('-');
  return parseInt(parts[0]) || getCurrentYear();
};


export function Groups() {
  const navigate = useNavigate();
  const { groups, fetchGroups, loading, settings, fetchSettings } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentSchoolYear());
  const [advanceGroup, setAdvanceGroup] = useState<Group | null>(null);
  const [advanceForm, setAdvanceForm] = useState({ newName: '', incrementGrade: true });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schoolYear: getCurrentSchoolYear(),
    defaultFeePerSession: '200000',
    schedule: [] as ScheduleItem[],
  });
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: '1',
    startTime: '14:00',
    endTime: '16:00',
    subject: '',
  });
  const [duplicateSchedule, setDuplicateSchedule] = useState(false);
  const [weeksToGenerate, setWeeksToGenerate] = useState(4);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadSchoolYears();
    fetchGroups({ active: 'true', schoolYear: getCurrentSchoolYear() });
    fetchSettings();
  }, [fetchGroups, fetchSettings]);

  useEffect(() => {
    if (selectedYear) {
      fetchGroups({ active: 'true', schoolYear: selectedYear });
    } else {
      fetchGroups({ active: 'true' });
    }
  }, [selectedYear, fetchGroups]);

  const loadSchoolYears = async () => {
    const res = await groupApi.getSchoolYears();
    if (res.success && res.data) {
      // Ensure current school year is always in the list
      const currentYear = getCurrentSchoolYear();
      const years = res.data.includes(currentYear) ? res.data : [currentYear, ...res.data];
      setSchoolYears(years);
    } else {
      // If no data, at least show current school year
      setSchoolYears([getCurrentSchoolYear()]);
    }
  };

  const openAddModal = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      description: '',
      schoolYear: selectedYear || getCurrentSchoolYear(),
      defaultFeePerSession: '200000',
      schedule: [],
    });
    setDuplicateSchedule(false);
    setWeeksToGenerate(4);
    setIsModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      schoolYear: group.schoolYear,
      defaultFeePerSession: group.defaultFeePerSession.toString(),
      schedule: [...group.schedule],
    });
    setIsModalOpen(true);
  };

  const addSchedule = () => {
    if (!newSchedule.subject) {
      toast.error('Vui lòng chọn môn học');
      return;
    }
    setFormData({
      ...formData,
      schedule: [
        ...formData.schedule,
        {
          dayOfWeek: parseInt(newSchedule.dayOfWeek),
          startTime: newSchedule.startTime,
          endTime: newSchedule.endTime,
          subject: newSchedule.subject,
        },
      ],
    });
    setNewSchedule({ dayOfWeek: '1', startTime: '14:00', endTime: '16:00', subject: '' });
  };

  const removeSchedule = (index: number) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      schoolYear: formData.schoolYear,
      defaultFeePerSession: parseInt(formData.defaultFeePerSession),
      schedule: formData.schedule,
    };

    try {
      if (editingGroup) {
        await groupApi.update(editingGroup._id, data);
        toast.success('Cập nhật lớp học thành công');
      } else {
        const result = await groupApi.create(data);

        // If duplicate schedule is enabled and we have a schedule
        if (duplicateSchedule && formData.schedule.length > 0 && result.success && result.data) {
          const newGroupId = result.data._id;
          const now = new Date();
          let sessionsCreated = 0;

          // For each week
          for (let week = 0; week < weeksToGenerate; week++) {
            // For each schedule item
            for (const scheduleItem of formData.schedule) {
              // Calculate the date for this session
              const sessionDate = new Date(now);

              // Get current day of week (0 = Sunday, 1 = Monday, ...)
              const currentDayOfWeek = now.getDay();
              const targetDayOfWeek = scheduleItem.dayOfWeek;

              // Calculate days until target day in current week
              let daysUntil = targetDayOfWeek - currentDayOfWeek;

              // Add weeks offset
              daysUntil += week * 7;

              // If it's the first week and the day has passed, skip
              if (week === 0 && daysUntil < 0) {
                continue;
              }

              sessionDate.setDate(now.getDate() + daysUntil);
              sessionDate.setHours(0, 0, 0, 0);

              // Check if this session time has already passed
              const [startHour, startMin] = scheduleItem.startTime.split(':').map(Number);
              const sessionDateTime = new Date(sessionDate);
              sessionDateTime.setHours(startHour, startMin, 0, 0);

              // Skip if session time has already passed
              if (sessionDateTime <= now) {
                continue;
              }

              // Create the session
              await offlineSessionApi.create({
                date: sessionDate.toISOString(),
                startTime: scheduleItem.startTime,
                endTime: scheduleItem.endTime,
                type: 'scheduled',
                subject: scheduleItem.subject,
                groupId: newGroupId,
                studentIds: [],
                attendance: [],
              });
              sessionsCreated++;
            }
          }

          if (sessionsCreated > 0) {
            toast.success(`Thêm lớp học thành công và tạo ${sessionsCreated} buổi học`);
          } else {
            toast.success('Thêm lớp học thành công');
          }
        } else {
          toast.success('Thêm lớp học thành công');
        }
      }
      setIsModalOpen(false);
      loadSchoolYears();
      fetchGroups({ active: 'true', ...(selectedYear && { schoolYear: selectedYear }) });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAdvance = async () => {
    if (!advanceGroup) return;
    try {
      const res = await groupApi.advanceToNextYear(advanceGroup._id, {
        newName: advanceForm.newName || undefined,
        incrementGrade: advanceForm.incrementGrade,
      });
      if (res.success && res.data) {
        toast.success(`Đã chuyển ${res.data.studentsUpdated} học sinh sang năm học mới`);
        setAdvanceGroup(null);
        loadSchoolYears();
        fetchGroups({ active: 'true' });
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await groupApi.delete(deleteId);
      toast.success('Xóa lớp học thành công');
      setDeleteId(null);
      fetchGroups({ active: 'true' });
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  if (loading) {
    return <GroupsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lớp học</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý các lớp và lịch học</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            options={[
              { value: '', label: 'Tất cả năm học' },
              ...schoolYears.map((y) => ({ value: y, label: `Năm ${y}` })),
            ]}
            className="w-40"
          />
          <Button onClick={openAddModal}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm lớp
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardBody className="p-8">
            <EmptyState
              title="Chưa có lớp học"
              description="Tạo lớp học để quản lý học sinh theo nhóm"
              action={<Button onClick={openAddModal}>Thêm lớp học</Button>}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card
              key={group._id}
              onClick={() => navigate(`/groups/${group._id}`)}
              className="hover:shadow-lg transition-all cursor-pointer group"
            >
              <CardBody className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{group.name}</h3>
                      <Badge variant="info" size="sm">{group.schoolYear}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdvanceGroup(group);
                        setAdvanceForm({ newName: group.name, incrementGrade: true });
                      }}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-xl transition-colors"
                      title="Chuyển năm học"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(group);
                      }}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
                      title="Sửa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(group._id);
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                      title="Xóa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {group.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{group.description}</p>
                )}

                {/* Schedule */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Lịch học</p>
                  {group.schedule.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Chưa có lịch học</p>
                  ) : (
                    <div className="space-y-2">
                      {group.schedule.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="primary">{dayNames[s.dayOfWeek]}</Badge>
                          <span className="text-gray-600 dark:text-gray-400">
                            {s.startTime} - {s.endTime}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">• {s.subject}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fee */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Học phí/buổi</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(group.defaultFeePerSession)}đ</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên lớp *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Lớp Toán 10A"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Năm học *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={getStartYearFromSchoolYear(formData.schoolYear)}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val === '') {
                      setFormData({ ...formData, schoolYear: formatSchoolYear(getCurrentYear()) });
                    } else {
                      const year = parseInt(val);
                      setFormData({ ...formData, schoolYear: formatSchoolYear(year) });
                    }
                  }}
                  className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  required
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  → {formData.schoolYear}
                </span>
              </div>
            </div>
            <Input
              label="Học phí/buổi *"
              type="number"
              value={formData.defaultFeePerSession}
              onChange={(e) => setFormData({ ...formData, defaultFeePerSession: e.target.value })}
              placeholder="200000"
              required
            />
          </div>
          <Input
            label="Mô tả"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Thông tin thêm..."
          />

          {/* Schedule Section */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Lịch học hàng tuần</h4>

            {formData.schedule.length > 0 && (
              <div className="space-y-2">
                {formData.schedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 rounded-xl text-sm">
                    <Badge variant="primary" size="sm">{dayNames[s.dayOfWeek]}</Badge>
                    <span className="font-medium dark:text-white whitespace-nowrap">{s.startTime} - {s.endTime}</span>
                    <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{s.subject}</span>
                    <button
                      type="button"
                      onClick={() => removeSchedule(i)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add schedule form - 2 rows layout */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thêm lịch mới</p>

              {/* Row 1: Day and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Day of week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thứ trong tuần</label>
                  <Select
                    value={newSchedule.dayOfWeek}
                    onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: e.target.value })}
                    options={dayNames.map((d, i) => ({ value: i.toString(), label: d }))}
                  />
                </div>
                {/* Time range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thời gian học</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-400 dark:text-gray-500 font-medium">đến</span>
                    <input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Subject and Add button */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                {/* Subject */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Môn học</label>
                  <Select
                    value={newSchedule.subject}
                    onChange={(e) => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                    options={[
                      { value: '', label: 'Chọn môn học' },
                      ...(settings?.subjects || []).map((s) => ({ value: s, label: s })),
                    ]}
                  />
                </div>
                {/* Add button */}
                <div>
                  <Button type="button" variant="primary" onClick={addSchedule} className="w-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm lịch
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Duplicate Schedule Option - Only show when creating new class */}
          {!editingGroup && formData.schedule.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="duplicateSchedule"
                  checked={duplicateSchedule}
                  onChange={(e) => setDuplicateSchedule(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="duplicateSchedule" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tạo buổi học từ lịch (bắt đầu từ tuần này)
                </label>
              </div>
              {duplicateSchedule && (
                <div className="flex items-center gap-3 pl-7">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Số tuần:</label>
                  <Select
                    value={weeksToGenerate.toString()}
                    onChange={(e) => setWeeksToGenerate(parseInt(e.target.value))}
                    options={[
                      { value: '1', label: '1 tuần' },
                      { value: '2', label: '2 tuần' },
                      { value: '4', label: '4 tuần' },
                      { value: '8', label: '8 tuần' },
                      { value: '12', label: '12 tuần' },
                    ]}
                    className="w-28"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (Bỏ qua buổi đã qua)
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={isCreating}>
              {editingGroup ? 'Cập nhật' : 'Thêm lớp'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Advance to Next Year Modal */}
      <Modal
        isOpen={!!advanceGroup}
        onClose={() => setAdvanceGroup(null)}
        title="Chuyển sang năm học mới"
        size="md"
      >
        {advanceGroup && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 border border-green-100 dark:border-green-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{advanceGroup.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {advanceGroup.schoolYear} → {(() => {
                      const parts = advanceGroup.schoolYear.split('-');
                      return `${parseInt(parts[1])}-${parseInt(parts[1]) + 1}`;
                    })()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lớp hiện tại sẽ được lưu trữ và một lớp mới sẽ được tạo cho năm học mới.
                Tất cả học sinh sẽ được chuyển sang lớp mới.
              </p>
            </div>

            <Input
              label="Tên lớp mới (để trống nếu giữ nguyên)"
              value={advanceForm.newName}
              onChange={(e) => setAdvanceForm({ ...advanceForm, newName: e.target.value })}
              placeholder={advanceGroup.name}
            />

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <input
                type="checkbox"
                id="incrementGrade"
                checked={advanceForm.incrementGrade}
                onChange={(e) => setAdvanceForm({ ...advanceForm, incrementGrade: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="incrementGrade" className="text-sm text-gray-700 dark:text-gray-300">
                Tăng khối lớp của học sinh lên 1 (VD: lớp 10 → lớp 11)
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button variant="secondary" onClick={() => setAdvanceGroup(null)}>
                Hủy bỏ
              </Button>
              <Button variant="success" onClick={handleAdvance}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Chuyển năm học
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa lớp học"
        message="Bạn có chắc chắn muốn xóa lớp học này? Học sinh trong lớp sẽ chuyển thành học cá nhân."
      />
    </div>
  );
}
