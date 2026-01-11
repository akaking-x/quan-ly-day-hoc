import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardBody, Badge, PageLoading, Button } from '../components/common';
import { studentApi } from '../services/api';
import type { Student, Session, Payment, Balance, StudentStatus } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

const statusLabels: Record<string, string> = {
  present: 'Có mặt',
  absent: 'Vắng',
  late: 'Đi muộn',
  excused: 'Có phép',
};

const studentStatusLabels: Record<StudentStatus, { label: string; color: string }> = {
  weak: { label: 'Yếu', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  average: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  good: { label: 'Khá', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  excellent: { label: 'Giỏi', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  outstanding: { label: 'Xuất sắc', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
};

export function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'sessions' | 'payments' | 'notes'>('info');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesContent, setNotesContent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus | ''>('');
  const [savingNotes, setSavingNotes] = useState(false);

  // State cho bộ lọc tháng/năm
  const currentDate = new Date();
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear());
  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth() + 1);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);

    const [studentRes, sessionsRes, paymentsRes, balanceRes] = await Promise.all([
      studentApi.getById(id),
      studentApi.getSessions(id),
      studentApi.getPayments(id),
      studentApi.getBalance(id),
    ]);

    if (studentRes.success && studentRes.data) {
      setStudent(studentRes.data);
      setNotesContent(studentRes.data.notes || '');
      setSelectedStatus(studentRes.data.status || '');
    }
    if (sessionsRes.success && sessionsRes.data) setSessions(sessionsRes.data);
    if (paymentsRes.success && paymentsRes.data) setPayments(paymentsRes.data);
    if (balanceRes.success && balanceRes.data) setBalance(balanceRes.data);

    setLoading(false);
  };

  // Save notes and status
  const saveNotes = useCallback(async () => {
    if (!id || !student) return;

    setSavingNotes(true);
    try {
      await studentApi.update(id, {
        ...student,
        notes: notesContent,
        status: selectedStatus || undefined,
      });
      setStudent(prev => prev ? { ...prev, notes: notesContent, status: selectedStatus || undefined } : null);
      setIsEditingNotes(false);
      toast.success('Đã lưu ghi chú');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
    setSavingNotes(false);
  }, [id, student, notesContent, selectedStatus]);

  // Handle checkbox toggle in notes
  const handleCheckboxToggle = useCallback((lineIndex: number) => {
    const lines = notesContent.split('\n');
    const line = lines[lineIndex];

    if (line.includes('- [ ]')) {
      lines[lineIndex] = line.replace('- [ ]', '- [x]');
    } else if (line.includes('- [x]')) {
      lines[lineIndex] = line.replace('- [x]', '- [ ]');
    }

    setNotesContent(lines.join('\n'));
  }, [notesContent]);

  // Insert checklist template
  const insertChecklist = (template: string) => {
    setNotesContent(prev => prev + (prev ? '\n' : '') + template);
  };

  // Lọc sessions theo tháng/năm
  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    return sessionDate.getFullYear() === filterYear && sessionDate.getMonth() + 1 === filterMonth;
  });

  // Lọc payments theo tháng/năm
  const filteredPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.paymentDate);
    return paymentDate.getFullYear() === filterYear && paymentDate.getMonth() + 1 === filterMonth;
  });

  // Tạo danh sách năm để chọn (5 năm gần đây)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  if (loading || !student) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => navigate('/students')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}</h1>
          {student.studentCode && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">Mã học sinh:</span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(student.studentCode);
                  toast.success('Đã sao chép mã học sinh');
                }}
                title="Click để sao chép mã"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {student.studentCode}
              </span>
            </div>
          )}
        </div>
        <Badge variant={student.type === 'group' ? 'primary' : 'gray'}>
          {student.type === 'group' ? 'Nhóm' : 'Cá nhân'}
        </Badge>
        {student.status && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${studentStatusLabels[student.status].color}`}>
            {studentStatusLabels[student.status].label}
          </span>
        )}
      </div>

      {balance && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tổng phải đóng</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(balance.totalFee)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Đã đóng</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(balance.totalPaid)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Công nợ</p>
              <p className={`text-xl font-bold ${balance.balance > 0 ? 'text-red-600' : balance.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {balance.balance > 0 ? formatCurrency(balance.balance) : balance.balance < 0 ? `+${formatCurrency(Math.abs(balance.balance))}` : '0'}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {(['info', 'notes', 'sessions', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'info' ? 'Thông tin' :
             tab === 'notes' ? 'Ghi chú tiến độ' :
             tab === 'sessions' ? 'Lịch sử điểm danh' : 'Lịch sử thanh toán'}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <Card>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Số điện thoại</p>
                <p className="font-medium dark:text-white">{student.phone || 'Chưa có'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Trường</p>
                <p className="font-medium dark:text-white">{student.school || 'Chưa có'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Khối lớp</p>
                <p className="font-medium dark:text-white">{student.grade || 'Chưa có'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Học phí/buổi</p>
                <p className="font-medium dark:text-white">{formatCurrency(student.feePerSession)} VNĐ</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'notes' && (
        <Card>
          <CardBody className="space-y-4">
            {/* Status selector */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trình độ học sinh
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(studentStatusLabels) as [StudentStatus, { label: string; color: string }][]).map(([status, { label, color }]) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedStatus === status
                          ? `${color} ring-2 ring-offset-2 ring-blue-500`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {selectedStatus && (
                    <button
                      onClick={() => setSelectedStatus('')}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!isEditingNotes ? (
                  <Button variant="secondary" size="sm" onClick={() => setIsEditingNotes(true)}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Sửa ghi chú
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => {
                      setIsEditingNotes(false);
                      setNotesContent(student.notes || '');
                    }}>
                      Hủy
                    </Button>
                    <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                      {savingNotes ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Notes content */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ghi chú tiến độ học tập
              </label>

              {isEditingNotes ? (
                <div className="space-y-3">
                  {/* Quick add buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => insertChecklist('- [ ] ')}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                    >
                      + Checkbox
                    </button>
                    <button
                      type="button"
                      onClick={() => insertChecklist('## Tiến độ tuần này\n- [ ] Hoàn thành bài tập\n- [ ] Ôn lại kiến thức cũ\n- [ ] Làm bài kiểm tra')}
                      className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                    >
                      + Tiến độ tuần
                    </button>
                    <button
                      type="button"
                      onClick={() => insertChecklist('## Điểm mạnh\n- \n\n## Cần cải thiện\n- \n\n## Kế hoạch\n- [ ] ')}
                      className="px-3 py-1.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
                    >
                      + Đánh giá
                    </button>
                  </div>

                  <textarea
                    value={notesContent}
                    onChange={(e) => setNotesContent(e.target.value)}
                    placeholder="Nhập ghi chú về tiến độ học tập... (hỗ trợ Markdown)"
                    className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hỗ trợ Markdown: **đậm**, *nghiêng*, - [ ] checkbox, ## tiêu đề
                  </p>
                </div>
              ) : notesContent ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  {/* Render with interactive checkboxes */}
                  {notesContent.includes('- [ ]') || notesContent.includes('- [x]') ? (
                    <div className="space-y-1">
                      {notesContent.split('\n').map((line, index) => {
                        const isUnchecked = line.includes('- [ ]');
                        const isChecked = line.includes('- [x]');

                        if (isUnchecked || isChecked) {
                          const textContent = line.replace(/- \[[ x]\]\s*/, '');
                          return (
                            <div key={index} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxToggle(index)}
                                className="mt-0.5 w-4 h-4 border-2 border-gray-400 dark:border-gray-500 rounded cursor-pointer"
                              />
                              <span className={`text-sm ${isChecked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {textContent}
                              </span>
                            </div>
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
                      {notesContent !== student.notes && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                            {savingNotes ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setNotesContent(student.notes || '')}>
                            Hủy
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{notesContent}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 mb-3">Chưa có ghi chú tiến độ</p>
                  <Button variant="secondary" size="sm" onClick={() => setIsEditingNotes(true)}>
                    Thêm ghi chú
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'sessions' && (
        <Card>
          <CardBody className="space-y-4">
            {/* Bộ lọc tháng/năm */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lọc theo:</span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({filteredSessions.length} buổi)
              </span>
            </div>

            {filteredSessions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Không có lịch sử điểm danh trong tháng {filterMonth}/{filterYear}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => {
                  const attendance = session.attendance.find(
                    (a) => (typeof a.studentId === 'string' ? a.studentId : a.studentId._id) === id
                  );
                  return (
                    <div key={session._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium dark:text-white">{session.subject}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(session.date), 'dd/MM/yyyy')} | {session.startTime} - {session.endTime}
                        </p>
                      </div>
                      {attendance && (
                        <Badge
                          variant={
                            attendance.status === 'present'
                              ? 'success'
                              : attendance.status === 'absent'
                              ? 'danger'
                              : attendance.status === 'late'
                              ? 'warning'
                              : 'gray'
                          }
                        >
                          {statusLabels[attendance.status]}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card>
          <CardBody className="space-y-4">
            {/* Bộ lọc tháng/năm */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lọc theo:</span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({filteredPayments.length} thanh toán • {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))} VNĐ)
              </span>
            </div>

            {filteredPayments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Không có thanh toán trong tháng {filterMonth}/{filterYear}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-green-600">+{formatCurrency(payment.amount)} VNĐ</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(payment.paymentDate), 'dd/MM/yyyy')} |{' '}
                        {payment.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                      </p>
                      {payment.notes && <p className="text-sm text-gray-500 dark:text-gray-400">{payment.notes}</p>}
                    </div>
                    <Badge variant="gray">{payment.sessionsCount} buổi</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
