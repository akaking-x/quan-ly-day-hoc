export type StudentStatus = 'weak' | 'average' | 'good' | 'excellent' | 'outstanding';

export interface Student {
  _id: string;
  studentCode: string;
  name: string;
  phone?: string;
  school?: string;
  grade?: number;
  feePerSession: number;
  type: 'individual' | 'group';
  groupId?: string | Group;
  notes?: string;
  status?: StudentStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleItem {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  schoolYear: string;
  schedule: ScheduleItem[];
  defaultFeePerSession: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  studentId: string | Student;
  status: AttendanceStatus;
  note?: string;
}

export interface Session {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupId?: string | Group;
  studentIds: string[];
  type: 'scheduled' | 'makeup';
  subject: string;
  notes?: string;
  onlineLink?: string;
  attendance: Attendance[];
  substituteTeacher?: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  studentId: string | Student;
  amount: number;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  sessionsCount: number;
  method: 'cash' | 'transfer';
  notes?: string;
  createdAt: string;
}

export interface Settings {
  defaultFeePerSession: number;
  currency: string;
  reminderDays: number;
  subjects: string[];
  workingHoursStart: number;
  workingHoursEnd: number;
  gradientFrom: string;
  gradientTo: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Summary {
  totalStudents: number;
  sessionsThisMonth: number;
  revenueThisMonth: number;
  totalDebt: number;
}

export interface Balance {
  totalFee: number;
  totalPaid: number;
  balance: number;
  status: 'debt' | 'credit' | 'paid';
}

export interface StudentBalance {
  student: {
    _id: string;
    name: string;
    phone?: string;
    feePerSession: number;
  };
  totalFee: number;
  totalPaid: number;
  balance: number;
  status: 'debt' | 'credit' | 'paid';
}

export interface MonthlyReport {
  year: number;
  month: number;
  sessionsCount: number;
  totalRevenue: number;
  totalFees: number;
  totalDebt: number;
  students: {
    student: { _id: string; name: string; feePerSession: number };
    sessions: number;
    totalFee: number;
    paid: number;
    balance: number;
    isPaid: boolean;
  }[];
}

export interface ChartData {
  month: number;
  year: number;
  revenue: number;
}

export interface User {
  _id: string;
  username: string;
  name: string;
  email?: string;
  role: 'admin' | 'user';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Note {
  _id: string;
  date: string;
  content: string;
  type: 'daily' | 'general';
  title?: string;
  tags?: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TeachingRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface TeachingRequest {
  _id: string;
  requester: User;
  substitute: User;
  session: Session;
  status: TeachingRequestStatus;
  message?: string;
  responseMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Student Portal Types
export interface StudentPortalInfo {
  _id: string;
  name: string;
  studentCode: string;
  school?: string;
  grade?: number;
  groupId?: Group;
}

export interface StudentPortalSession {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  type: 'scheduled' | 'makeup';
  onlineLink?: string;
  notes?: string;
  groupId?: Group;
  attendance: Attendance | null;
}

export interface StudentLoginResponse {
  student: StudentPortalInfo;
  token: string;
}

export interface StudentBalanceInfo {
  feePerSession: number;
  totalSessions: number;
  totalFee: number;
  totalPaid: number;
  balance: number;
  status: 'debt' | 'credit' | 'paid';
  recentPayments: {
    _id: string;
    amount: number;
    paymentDate: string;
    method: 'cash' | 'transfer';
    notes?: string;
  }[];
}
