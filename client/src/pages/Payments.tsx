import { useEffect, useState } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Button,
  Input,
  Select,
  Modal,
  Card,
  CardBody,
  Badge,
  PaymentsSkeleton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '../components/common';
import { offlineReportApi, offlinePaymentApi } from '../services/offlineApi';
import type { MonthlyReport } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

// Short format for currency (K = thousands, M = millions)
const formatCurrencyShort = (value: number): string => {
  if (value >= 1000000) {
    const m = value / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(0)}K`;
  }
  return value.toString();
};

const monthNames = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

// Column configuration
type ColumnKey = 'status' | 'sessions' | 'feePerSession' | 'totalFee' | 'paid' | 'balance';

const columnConfig: { key: ColumnKey; label: string; shortLabel: string }[] = [
  { key: 'status', label: 'Trạng thái', shortLabel: 'TT' },
  { key: 'sessions', label: 'Số buổi', shortLabel: 'Buổi' },
  { key: 'feePerSession', label: 'Đơn giá', shortLabel: 'Đơn giá' },
  { key: 'totalFee', label: 'Thành tiền', shortLabel: 'Tiền' },
  { key: 'paid', label: 'Đã đóng', shortLabel: 'Đã đóng' },
  { key: 'balance', label: 'Còn nợ', shortLabel: 'Nợ' },
];

// Get saved column visibility from localStorage
const getDefaultColumns = (): Record<ColumnKey, boolean> => {
  const saved = localStorage.getItem('paymentTableColumns');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    status: true,
    sessions: true,
    feePerSession: false,
    totalFee: true,
    paid: false,
    balance: true,
  };
};

export function Payments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(getDefaultColumns);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    _id: string;
    name: string;
    feePerSession: number;
    sessions: number;
    totalFee: number;
    paid: number;
    balance: number;
  } | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    notes: '',
  });

  useEffect(() => {
    loadReport();
  }, [currentDate]);

  const loadReport = async () => {
    setLoading(true);
    const res = await offlineReportApi.getMonthly(currentDate.getFullYear(), currentDate.getMonth() + 1);
    if (res.success && res.data) {
      setReport(res.data as MonthlyReport);
    }
    setLoading(false);
  };

  const openPaymentModal = (student: typeof selectedStudent) => {
    setSelectedStudent(student);
    setPaymentForm({
      amount: student?.balance.toString() || '',
      method: 'cash',
      notes: '',
    });
    setIsPaymentModalOpen(true);
  };

  const submitPayment = async () => {
    if (!selectedStudent) return;

    const periodStart = startOfMonth(currentDate);
    const periodEnd = endOfMonth(currentDate);

    try {
      await offlinePaymentApi.create({
        studentId: selectedStudent._id,
        amount: parseInt(paymentForm.amount),
        paymentDate: new Date().toISOString(),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        sessionsCount: selectedStudent.sessions,
        method: paymentForm.method as 'cash' | 'transfer',
        notes: paymentForm.notes || undefined,
      });

      toast.success('Ghi nhận thanh toán thành công');
      setIsPaymentModalOpen(false);
      loadReport();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const toggleColumn = (key: ColumnKey) => {
    const newColumns = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(newColumns);
    localStorage.setItem('paymentTableColumns', JSON.stringify(newColumns));
  };

  if (loading || !report) {
    return <PaymentsSkeleton />;
  }

  const paidCount = report.students.filter((s) => s.isPaid).length;
  const unpaidCount = report.students.filter((s) => !s.isPaid && s.sessions > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Học phí</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý thu học phí hàng tháng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardBody className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Đã đóng</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {paidCount}/{report.students.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Phải thu</p>
                <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-white" title={`${formatCurrency(report.totalFees)}đ`}>
                  <span className="sm:hidden">{formatCurrencyShort(report.totalFees)}</span>
                  <span className="hidden sm:inline">{formatCurrency(report.totalFees)}đ</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Đã thu</p>
                <p className="text-base sm:text-xl font-bold text-green-600 dark:text-green-400" title={`${formatCurrency(report.totalRevenue)}đ`}>
                  <span className="sm:hidden">{formatCurrencyShort(report.totalRevenue)}</span>
                  <span className="hidden sm:inline">{formatCurrency(report.totalRevenue)}đ</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Còn nợ</p>
                <p className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400" title={`${formatCurrency(report.totalDebt)}đ`}>
                  <span className="sm:hidden">{formatCurrencyShort(report.totalDebt)}</span>
                  <span className="hidden sm:inline">{formatCurrency(report.totalDebt)}đ</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Payment Table */}
      <Card>
        <CardBody className="p-0">
          {/* Month Navigation & Column Settings */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {monthNames[report.month - 1]} {report.year}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {paidCount} đã đóng • {unpaidCount} chưa đóng
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* Column Toggle Button */}
              <div className="relative">
                <button
                  onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  title="Tùy chỉnh cột hiển thị"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
                {/* Column Menu Dropdown */}
                {isColumnMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsColumnMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                        Hiển thị cột
                      </div>
                      {columnConfig.map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[col.key]}
                            onChange={() => toggleColumn(col.key)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header className="text-xs sm:text-sm">Học sinh</TableCell>
                  {visibleColumns.status && <TableCell header className="text-center text-xs sm:text-sm">TT</TableCell>}
                  {visibleColumns.sessions && <TableCell header className="text-right text-xs sm:text-sm">Buổi</TableCell>}
                  {visibleColumns.feePerSession && <TableCell header className="text-right text-xs sm:text-sm">Đơn giá</TableCell>}
                  {visibleColumns.totalFee && <TableCell header className="text-right text-xs sm:text-sm">Tiền</TableCell>}
                  {visibleColumns.paid && <TableCell header className="text-right text-xs sm:text-sm">Đã đóng</TableCell>}
                  {visibleColumns.balance && <TableCell header className="text-right text-xs sm:text-sm">Nợ</TableCell>}
                  <TableCell header className="w-16 sm:w-auto"> </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.students.map((item) => (
                  <TableRow
                    key={item.student._id}
                    className={item.isPaid ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : item.balance > 0 ? 'bg-red-50/30 dark:bg-red-900/20' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base ${
                          item.isPaid
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {item.student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{item.student.name}</span>
                      </div>
                    </TableCell>
                    {visibleColumns.status && (
                      <TableCell className="text-center">
                        {item.isPaid ? (
                          <Badge variant="success" size="sm">Đã đóng</Badge>
                        ) : item.sessions === 0 ? (
                          <Badge variant="gray" size="sm">Chưa học</Badge>
                        ) : (
                          <Badge variant="danger" size="sm">Chưa đóng</Badge>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.sessions && (
                      <TableCell className="text-right font-medium text-sm sm:text-base">{item.sessions}</TableCell>
                    )}
                    {visibleColumns.feePerSession && (
                      <TableCell className="text-right text-gray-600 dark:text-gray-400 whitespace-nowrap text-sm" title={`${formatCurrency(item.student.feePerSession)}đ`}>
                        {formatCurrencyShort(item.student.feePerSession)}
                      </TableCell>
                    )}
                    {visibleColumns.totalFee && (
                      <TableCell className="text-right font-medium text-sm whitespace-nowrap" title={`${formatCurrency(item.totalFee)}đ`}>
                        {formatCurrencyShort(item.totalFee)}
                      </TableCell>
                    )}
                    {visibleColumns.paid && (
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap text-sm" title={`${formatCurrency(item.paid)}đ`}>
                        {formatCurrencyShort(item.paid)}
                      </TableCell>
                    )}
                    {visibleColumns.balance && (
                      <TableCell className="text-right whitespace-nowrap">
                        {item.balance > 0 ? (
                          <span className="font-bold text-red-600 dark:text-red-400 text-sm" title={`${formatCurrency(item.balance)}đ`}>{formatCurrencyShort(item.balance)}</span>
                        ) : item.balance < 0 ? (
                          <Badge variant="success" size="sm" title={`+${formatCurrency(Math.abs(item.balance))}đ`}>+{formatCurrencyShort(Math.abs(item.balance))}</Badge>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">0</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {item.balance > 0 && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() =>
                            openPaymentModal({
                              _id: item.student._id,
                              name: item.student.name,
                              feePerSession: item.student.feePerSession,
                              sessions: item.sessions,
                              totalFee: item.totalFee,
                              paid: item.paid,
                              balance: item.balance,
                            })
                          }
                          className="whitespace-nowrap text-xs sm:text-sm"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="hidden sm:inline">Thu tiền</span>
                          <span className="sm:hidden">Thu</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Ghi nhận thanh toán"
        size="md"
      >
        {selectedStudent && (
          <div className="space-y-5">
            {/* Student Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{selectedStudent.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{monthNames[currentDate.getMonth()]} năm {currentDate.getFullYear()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                  <p className="text-gray-500 dark:text-gray-400">Số buổi</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedStudent.sessions} buổi</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                  <p className="text-gray-500 dark:text-gray-400">Đơn giá</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedStudent.feePerSession)}đ</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                  <p className="text-gray-500 dark:text-gray-400">Thành tiền</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedStudent.totalFee)}đ</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                  <p className="text-gray-500 dark:text-gray-400">Đã đóng</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedStudent.paid)}đ</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Còn nợ:</span>
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedStudent.balance)}đ</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <Input
              label="Số tiền đóng (VNĐ) *"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="Nhập số tiền"
            />

            <Select
              label="Hình thức thanh toán"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              options={[
                { value: 'cash', label: 'Tiền mặt' },
                { value: 'transfer', label: 'Chuyển khoản' },
              ]}
            />

            <Input
              label="Ghi chú"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="Thông tin bổ sung..."
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button variant="success" onClick={submitPayment}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Xác nhận thanh toán
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
