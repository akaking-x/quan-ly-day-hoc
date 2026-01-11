import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, CardBody, Badge, PageLoading, Modal, Select } from '../components/common';
import { groupApi, studentApi } from '../services/api';
import type { Group, Student } from '../types';

const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);

    const [groupRes, studentsRes, allStudentsRes] = await Promise.all([
      groupApi.getById(id),
      groupApi.getStudents(id),
      studentApi.getAll({ active: 'true' }),
    ]);

    if (groupRes.success && groupRes.data) setGroup(groupRes.data);
    if (studentsRes.success && studentsRes.data) setStudents(studentsRes.data);
    if (allStudentsRes.success && allStudentsRes.data) setAllStudents(allStudentsRes.data);

    setLoading(false);
  };

  const addStudent = async () => {
    if (!id || !selectedStudentId) return;
    try {
      await groupApi.addStudent(id, selectedStudentId);
      toast.success('Thêm học sinh vào nhóm thành công');
      setIsAddModalOpen(false);
      setSelectedStudentId('');
      loadData();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!id) return;
    try {
      await groupApi.removeStudent(id, studentId);
      toast.success('Xóa học sinh khỏi nhóm thành công');
      loadData();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // Students not in this group
  const availableStudents = allStudents.filter(
    (s) => !students.some((gs) => gs._id === s._id)
  );

  // Get unique grades from available students
  const availableGrades = [...new Set(availableStudents.map(s => s.grade).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));

  // Filter by grade if selected
  const filteredAvailableStudents = filterGrade
    ? availableStudents.filter(s => s.grade === parseInt(filterGrade))
    : availableStudents;

  if (loading || !group) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/groups')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin nhóm</h2>

            {group.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mô tả</p>
                <p className="font-medium dark:text-white">{group.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Học phí mặc định</p>
              <p className="font-medium dark:text-white">{formatCurrency(group.defaultFeePerSession)} VNĐ/buổi</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Lịch học</p>
              <div className="space-y-2">
                {group.schedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="primary">{dayNames[s.dayOfWeek]}</Badge>
                    <span className="text-sm dark:text-white">
                      {s.startTime} - {s.endTime}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({s.subject})</span>
                  </div>
                ))}
                {group.schedule.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có lịch học</p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Học sinh ({students.length})
              </h2>
              <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                Thêm học sinh
              </Button>
            </div>

            {students.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Chưa có học sinh trong nhóm</p>
            ) : (
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/students/${student._id}`)}
                    >
                      <p className="font-medium dark:text-white">{student.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(student.feePerSession)} VNĐ/buổi
                      </p>
                    </div>
                    <button
                      onClick={() => removeStudent(student._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Xóa khỏi nhóm
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFilterGrade('');
          setSelectedStudentId('');
        }}
        title="Thêm học sinh vào nhóm"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Lọc theo khối"
            value={filterGrade}
            onChange={(e) => {
              setFilterGrade(e.target.value);
              setSelectedStudentId('');
            }}
            options={[
              { value: '', label: 'Tất cả khối' },
              ...availableGrades.map((g) => ({ value: g!.toString(), label: `Khối ${g}` })),
            ]}
          />
          <Select
            label="Chọn học sinh"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            options={[
              { value: '', label: `Chọn học sinh${filteredAvailableStudents.length > 0 ? ` (${filteredAvailableStudents.length})` : ''}` },
              ...filteredAvailableStudents.map((s) => ({ value: s._id, label: `${s.name}${s.grade ? ` - Khối ${s.grade}` : ''}` })),
            ]}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => {
              setIsAddModalOpen(false);
              setFilterGrade('');
              setSelectedStudentId('');
            }}>
              Hủy
            </Button>
            <Button onClick={addStudent} disabled={!selectedStudentId}>
              Thêm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
