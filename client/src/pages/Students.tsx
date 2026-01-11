import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Button,
  Input,
  Select,
  Modal,
  Card,
  CardBody,
  Badge,
  StudentsSkeleton,
  EmptyState,
  ConfirmDialog,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '../components/common';
import { useStore } from '../store/useStore';
import { offlineStudentApi, offlineGroupApi } from '../services/offlineApi';
import type { Student, Group, StudentStatus } from '../types';

// Template columns for import
interface ImportStudent {
  name: string;
  phone?: string;
  school?: string;
  grade?: number;
  feePerSession: number;
  type: 'individual' | 'group';
  groupName?: string;
  notes?: string;
  status?: StudentStatus;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

const statusLabels: Record<StudentStatus | 'unknown', { label: string; color: string }> = {
  weak: { label: 'Yếu', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  average: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  good: { label: 'Khá', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  excellent: { label: 'Giỏi', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  outstanding: { label: 'Xuất sắc', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
  unknown: { label: 'Chưa rõ', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

export function Students() {
  const navigate = useNavigate();
  const { students, fetchStudents, loading } = useStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Import feature
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<ImportStudent[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    school: '',
    grade: '',
    feePerSession: '200000',
    type: 'individual',
    groupId: '',
    notes: '',
    status: '' as StudentStatus | '',
  });

  useEffect(() => {
    fetchStudents({ active: 'true' });
    loadGroups();
  }, [fetchStudents]);

  const loadGroups = async () => {
    const res = await offlineGroupApi.getAll({ active: 'true' });
    if (res.success && res.data) {
      setGroups(res.data);
    }
  };

  // Get unique grades from students
  const availableGrades = [...new Set(students.map(s => s.grade).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));

  const filteredStudents = students.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && s.type !== filterType) return false;
    if (filterGroup) {
      // groupId có thể là string hoặc object (khi populate)
      const studentGroupId = typeof s.groupId === 'string' ? s.groupId : s.groupId?._id;
      if (studentGroupId !== filterGroup) return false;
    }
    if (filterGrade && s.grade !== parseInt(filterGrade)) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      phone: '',
      school: '',
      grade: '',
      feePerSession: '200000',
      type: 'individual',
      groupId: '',
      notes: '',
      status: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      phone: student.phone || '',
      school: student.school || '',
      grade: student.grade?.toString() || '',
      feePerSession: student.feePerSession.toString(),
      type: student.type,
      groupId: typeof student.groupId === 'string' ? student.groupId : student.groupId?._id || '',
      notes: student.notes || '',
      status: student.status || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      phone: formData.phone || undefined,
      school: formData.school || undefined,
      grade: formData.grade ? parseInt(formData.grade) : undefined,
      feePerSession: parseInt(formData.feePerSession),
      type: formData.type as 'individual' | 'group',
      groupId: formData.groupId || undefined,
      notes: formData.notes || undefined,
      status: formData.status || undefined,
    };

    try {
      if (editingStudent) {
        await offlineStudentApi.update(editingStudent._id, data);
        toast.success('Cập nhật học sinh thành công');
      } else {
        await offlineStudentApi.create(data);
        toast.success('Thêm học sinh thành công');
      }
      setIsModalOpen(false);
      fetchStudents({ active: 'true' });
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await offlineStudentApi.delete(deleteId);
      toast.success('Xóa học sinh thành công');
      setDeleteId(null);
      fetchStudents({ active: 'true' });
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // Download template for import
  const downloadTemplate = () => {
    const templateData = [
      {
        'Tên học sinh (*)': 'Nguyễn Văn A',
        'Số điện thoại': '0123456789',
        'Trường': 'THPT ABC',
        'Khối lớp': 10,
        'Học phí/buổi (*)': 200000,
        'Loại (*)': 'Cá nhân',
        'Tên lớp (nếu nhóm)': '',
        'Ghi chú': '',
        'Học lực': 'Khá',
      },
      {
        'Tên học sinh (*)': 'Trần Thị B',
        'Số điện thoại': '0987654321',
        'Trường': 'THCS XYZ',
        'Khối lớp': 9,
        'Học phí/buổi (*)': 150000,
        'Loại (*)': 'Nhóm',
        'Tên lớp (nếu nhóm)': 'Toán 9A',
        'Ghi chú': 'Cần chú ý thêm',
        'Học lực': 'Giỏi',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Học sinh');

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Tên học sinh
      { wch: 15 }, // Số điện thoại
      { wch: 15 }, // Trường
      { wch: 10 }, // Khối lớp
      { wch: 15 }, // Học phí/buổi
      { wch: 12 }, // Loại
      { wch: 20 }, // Tên lớp
      { wch: 20 }, // Ghi chú
      { wch: 12 }, // Học lực
    ];

    XLSX.writeFile(wb, 'template_hoc_sinh.xlsx');
    toast.success('Đã tải template');
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const errors: string[] = [];
        const parsedData: ImportStudent[] = [];

        jsonData.forEach((row: any, index: number) => {
          const rowNum = index + 2; // Excel rows start at 1, plus header
          const name = row['Tên học sinh (*)'] || row['Tên học sinh'] || row['name'];
          const phone = row['Số điện thoại'] || row['phone'] || '';
          const school = row['Trường'] || row['school'] || '';
          const grade = parseInt(row['Khối lớp'] || row['grade'] || '0') || undefined;
          const feePerSession = parseInt(row['Học phí/buổi (*)'] || row['Học phí/buổi'] || row['feePerSession'] || '200000');
          const typeRaw = row['Loại (*)'] || row['Loại'] || row['type'] || 'Cá nhân';
          const type = typeRaw.toLowerCase().includes('nhóm') || typeRaw.toLowerCase() === 'group' ? 'group' : 'individual';
          const groupName = row['Tên lớp (nếu nhóm)'] || row['Tên lớp'] || row['groupName'] || '';
          const notes = row['Ghi chú'] || row['notes'] || '';
          const statusRaw = row['Học lực'] || row['status'] || '';

          // Map status
          let status: StudentStatus | undefined;
          const statusMap: Record<string, StudentStatus> = {
            'yếu': 'weak',
            'trung bình': 'average',
            'khá': 'good',
            'giỏi': 'excellent',
            'xuất sắc': 'outstanding',
            'weak': 'weak',
            'average': 'average',
            'good': 'good',
            'excellent': 'excellent',
            'outstanding': 'outstanding',
          };
          if (statusRaw) {
            status = statusMap[statusRaw.toLowerCase()];
          }

          if (!name) {
            errors.push(`Dòng ${rowNum}: Thiếu tên học sinh`);
            return;
          }

          if (!feePerSession || feePerSession <= 0) {
            errors.push(`Dòng ${rowNum}: Học phí không hợp lệ`);
            return;
          }

          parsedData.push({
            name: name.trim(),
            phone: phone?.toString().trim() || undefined,
            school: school?.toString().trim() || undefined,
            grade,
            feePerSession,
            type,
            groupName: groupName?.toString().trim() || undefined,
            notes: notes?.toString().trim() || undefined,
            status,
          });
        });

        setImportErrors(errors);
        setImportData(parsedData);
        setIsImportModalOpen(true);
      } catch (err) {
        toast.error('Không thể đọc file. Vui lòng kiểm tra định dạng.');
        console.error('Import error:', err);
      }
    };

    reader.readAsBinaryString(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import students
  const handleImport = async () => {
    if (importData.length === 0) {
      toast.error('Không có dữ liệu để import');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const student of importData) {
        // Find group ID by name if type is group
        let groupId: string | undefined;
        if (student.type === 'group' && student.groupName) {
          const group = groups.find(g => g.name.toLowerCase() === student.groupName?.toLowerCase());
          if (group) {
            groupId = group._id;
          }
        }

        try {
          await offlineStudentApi.create({
            name: student.name,
            phone: student.phone,
            school: student.school,
            grade: student.grade,
            feePerSession: student.feePerSession,
            type: student.type,
            groupId,
            notes: student.notes,
            status: student.status,
          });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      toast.success(`Import thành công ${successCount} học sinh${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`);
      setIsImportModalOpen(false);
      setImportData([]);
      setImportErrors([]);
      fetchStudents({ active: 'true' });
    } catch {
      toast.error('Có lỗi xảy ra khi import');
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return <StudentsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Học sinh</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý danh sách học sinh</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={downloadTemplate}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Tải template</span>
            <span className="sm:hidden">Template</span>
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Import Excel</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button onClick={openAddModal}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Thêm học sinh</span>
            <span className="sm:hidden">Thêm</span>
          </Button>
        </div>
      </div>

      {/* Search Bar - Prominent on Desktop */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm học sinh theo tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="py-3 px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Filter Selects */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Lọc:
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-9 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Loại</option>
                <option value="individual">Cá nhân</option>
                <option value="group">Nhóm</option>
              </select>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="h-9 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-[140px]"
              >
                <option value="">Lớp</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="h-9 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Khối</option>
                {availableGrades.map((g) => (
                  <option key={g} value={g!.toString()}>Khối {g}</option>
                ))}
              </select>
              {/* Clear filters button */}
              {(filterType || filterGroup || filterGrade) && (
                <button
                  onClick={() => {
                    setFilterType('');
                    setFilterGroup('');
                    setFilterGrade('');
                  }}
                  className="h-9 px-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Xóa bộ lọc"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Stats - Right aligned */}
            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
              <span className="font-semibold text-gray-900 dark:text-white">{filteredStudents.length}</span>
              <span>học sinh</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Student List */}
      <Card>
        <CardBody className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Chưa có học sinh"
                description="Thêm học sinh đầu tiên để bắt đầu quản lý"
                action={<Button onClick={openAddModal}>Thêm học sinh</Button>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell header>Tên học sinh</TableCell>
                    <TableCell header className="hidden sm:table-cell">Điện thoại</TableCell>
                    <TableCell header className="hidden md:table-cell">Lớp</TableCell>
                    <TableCell header>Loại</TableCell>
                    <TableCell header className="hidden sm:table-cell">Tình trạng</TableCell>
                    <TableCell header className="hidden sm:table-cell text-right">Học phí/buổi</TableCell>
                    <TableCell header className="text-right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow
                      key={student._id}
                      onClick={() => navigate(`/students/${student._id}`)}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                            <div className="flex items-center gap-2">
                              {student.studentCode && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(student.studentCode);
                                    toast.success('Đã sao chép mã học sinh');
                                  }}
                                  title="Click để sao chép mã"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                  </svg>
                                  {student.studentCode}
                                </span>
                              )}
                              {student.school && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">{student.school}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-gray-600 dark:text-gray-400">{student.phone || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600 dark:text-gray-400">{student.grade || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={student.type === 'group' ? 'primary' : 'gray'} className="min-w-[60px] text-center justify-center">
                          {student.type === 'group' ? 'Nhóm' : 'Cá nhân'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusLabels[student.status || 'unknown'].color}`}>
                          {statusLabels[student.status || 'unknown'].label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(student.feePerSession)}đ
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(student);
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
                              setDeleteId(student._id);
                            }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Tên học sinh *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nhập tên học sinh"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0123 456 789"
            />
            <Input
              label="Trường"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              placeholder="Tên trường"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Khối lớp"
              type="number"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              placeholder="VD: 10"
            />
            <Input
              label="Học phí/buổi (VNĐ) *"
              type="number"
              value={formData.feePerSession}
              onChange={(e) => setFormData({ ...formData, feePerSession: e.target.value })}
              placeholder="200000"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Loại hình học"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'individual', label: 'Cá nhân' },
                { value: 'group', label: 'Nhóm' },
              ]}
            />
            {formData.type === 'group' && (
              <Select
                label="Chọn lớp"
                value={formData.groupId}
                onChange={(e) => {
                  const selectedGroupId = e.target.value;
                  const selectedGroup = groups.find(g => g._id === selectedGroupId);
                  // Tự động điền học phí từ nhóm nếu có
                  const newFee = selectedGroup?.defaultFeePerSession?.toString() || formData.feePerSession;
                  setFormData({ ...formData, groupId: selectedGroupId, feePerSession: newFee });
                }}
                options={[
                  { value: '', label: 'Chọn lớp...' },
                  ...groups.map((g) => ({ value: g._id, label: g.name })),
                ]}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tình trạng học lực
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(statusLabels) as [StudentStatus | 'unknown', { label: string; color: string }][])
                .filter(([key]) => key !== 'unknown')
                .map(([status, { label, color }]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: status as StudentStatus })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      formData.status === status
                        ? `${color} ring-2 ring-offset-2 ring-blue-500`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              {formData.status && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: '' })}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
          <Input
            label="Ghi chú"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Thông tin bổ sung..."
          />
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit">
              {editingStudent ? 'Cập nhật' : 'Thêm học sinh'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa học sinh"
        message="Bạn có chắc chắn muốn xóa học sinh này? Hành động này không thể hoàn tác."
      />

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportData([]);
          setImportErrors([]);
        }}
        title="Import học sinh từ Excel"
        size="lg"
      >
        <div className="space-y-4">
          {/* Errors */}
          {importErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">
                Cảnh báo: {importErrors.length} dòng bị lỗi
              </h4>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {importData.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Xem trước: {importData.length} học sinh
              </h4>
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Tên</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 hidden sm:table-cell">Trường</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Khối</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Loại</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Học phí</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {importData.slice(0, 50).map((student, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{student.name}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{student.school || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{student.grade || '—'}</td>
                        <td className="px-3 py-2">
                          <Badge variant={student.type === 'group' ? 'primary' : 'gray'}>
                            {student.type === 'group' ? 'Nhóm' : 'Cá nhân'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                          {formatCurrency(student.feePerSession)}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData.length > 50 && (
                  <div className="px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                    ... và {importData.length - 50} học sinh khác
                  </div>
                )}
              </div>
            </div>
          )}

          {importData.length === 0 && importErrors.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Chọn file Excel hoặc CSV để import</p>
            </div>
          )}

          {/* Help text */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Hướng dẫn</h4>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Tải template mẫu để xem định dạng chuẩn</li>
              <li>• Cột bắt buộc: Tên học sinh, Học phí/buổi</li>
              <li>• Loại: "Cá nhân" hoặc "Nhóm"</li>
              <li>• Học lực: Yếu, Trung bình, Khá, Giỏi, Xuất sắc</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportData([]);
                setImportErrors([]);
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleImport}
              disabled={importData.length === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang import...
                </>
              ) : (
                <>Import {importData.length} học sinh</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
