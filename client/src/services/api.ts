import axios from 'axios';
import type {
  Student,
  Group,
  Session,
  Payment,
  Settings,
  ApiResponse,
  Summary,
  Balance,
  StudentBalance,
  MonthlyReport,
  ChartData,
  User,
  LoginResponse,
  Note,
  TeachingRequest,
  StudentLoginResponse,
  StudentPortalInfo,
  StudentPortalSession,
  StudentBalanceInfo,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore parsing errors
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if already on login page or student portal to avoid infinite loop
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/student')) {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { username, password }).then((r) => r.data),
  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me').then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse<{ message: string }>>('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
  getUsers: () =>
    api.get<ApiResponse<User[]>>('/auth/users').then((r) => r.data),
  createUser: (data: { username: string; password: string; name: string; email?: string; role: 'admin' | 'user' }) =>
    api.post<ApiResponse<User>>('/auth/users', data).then((r) => r.data),
  updateUser: (id: string, data: Partial<User> & { password?: string }) =>
    api.put<ApiResponse<User>>(`/auth/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/auth/users/${id}`).then((r) => r.data),
};

export const studentApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Student[]>>('/students', { params }).then((r) => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Student>>(`/students/${id}`).then((r) => r.data),
  create: (data: Partial<Student>) =>
    api.post<ApiResponse<Student>>('/students', data).then((r) => r.data),
  update: (id: string, data: Partial<Student>) =>
    api.put<ApiResponse<Student>>(`/students/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<Student>>(`/students/${id}`).then((r) => r.data),
  getSessions: (id: string) =>
    api.get<ApiResponse<Session[]>>(`/students/${id}/sessions`).then((r) => r.data),
  getPayments: (id: string) =>
    api.get<ApiResponse<Payment[]>>(`/students/${id}/payments`).then((r) => r.data),
  getBalance: (id: string) =>
    api.get<ApiResponse<Balance>>(`/students/${id}/balance`).then((r) => r.data),
  generateCodes: () =>
    api.post<ApiResponse<{ message: string; updatedCount: number }>>('/students/generate-codes').then((r) => r.data),
};

export const groupApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Group[]>>('/groups', { params }).then((r) => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Group>>(`/groups/${id}`).then((r) => r.data),
  create: (data: Partial<Group>) =>
    api.post<ApiResponse<Group>>('/groups', data).then((r) => r.data),
  update: (id: string, data: Partial<Group>) =>
    api.put<ApiResponse<Group>>(`/groups/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<Group>>(`/groups/${id}`).then((r) => r.data),
  getStudents: (id: string) =>
    api.get<ApiResponse<Student[]>>(`/groups/${id}/students`).then((r) => r.data),
  addStudent: (id: string, studentId: string) =>
    api.post<ApiResponse<Student>>(`/groups/${id}/students`, { studentId }).then((r) => r.data),
  removeStudent: (id: string, studentId: string) =>
    api.delete<ApiResponse<Student>>(`/groups/${id}/students/${studentId}`).then((r) => r.data),
  getSchoolYears: () =>
    api.get<ApiResponse<string[]>>('/groups/school-years').then((r) => r.data),
  advanceToNextYear: (id: string, data: { newName?: string; incrementGrade?: boolean }) =>
    api.post<ApiResponse<{ oldGroup: Group; newGroup: Group; studentsUpdated: number }>>(`/groups/${id}/advance`, data).then((r) => r.data),
};

export const sessionApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Session[]>>('/sessions', { params }).then((r) => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Session>>(`/sessions/${id}`).then((r) => r.data),
  create: (data: Partial<Session>) =>
    api.post<ApiResponse<Session>>('/sessions', data).then((r) => r.data),
  update: (id: string, data: Partial<Session>) =>
    api.put<ApiResponse<Session>>(`/sessions/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/sessions/${id}`).then((r) => r.data),
  updateAttendance: (id: string, attendance: Session['attendance']) =>
    api.post<ApiResponse<Session>>(`/sessions/${id}/attendance`, { attendance }).then((r) => r.data),
  getCalendar: (year: number, month: number) =>
    api.get<ApiResponse<Session[]>>('/sessions/calendar', { params: { year, month } }).then((r) => r.data),
  generate: (data: { groupId: string; startDate: string; endDate: string }) =>
    api.post<ApiResponse<Session[]>>('/sessions/generate', data).then((r) => r.data),
  duplicateWeek: (data: { weekStartDate: string; numberOfWeeks: number }) =>
    api.post<ApiResponse<Session[]>>('/sessions/duplicate-week', data).then((r) => r.data),
};

export const paymentApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Payment[]>>('/payments', { params }).then((r) => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Payment>>(`/payments/${id}`).then((r) => r.data),
  create: (data: Partial<Payment>) =>
    api.post<ApiResponse<Payment>>('/payments', data).then((r) => r.data),
  update: (id: string, data: Partial<Payment>) =>
    api.put<ApiResponse<Payment>>(`/payments/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/payments/${id}`).then((r) => r.data),
};

export const reportApi = {
  getSummary: () =>
    api.get<ApiResponse<Summary>>('/reports/summary').then((r) => r.data),
  getMonthly: (year: number, month: number) =>
    api.get<ApiResponse<MonthlyReport>>('/reports/monthly', { params: { year, month } }).then((r) => r.data),
  getBalance: () =>
    api.get<ApiResponse<StudentBalance[]>>('/reports/balance').then((r) => r.data),
  getChart: () =>
    api.get<ApiResponse<ChartData[]>>('/reports/chart').then((r) => r.data),
  getStudent: (id: string, params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<unknown>>(`/reports/student/${id}`, { params }).then((r) => r.data),
};

export const settingsApi = {
  get: () =>
    api.get<ApiResponse<Settings>>('/settings').then((r) => r.data),
  update: (data: Partial<Settings>) =>
    api.put<ApiResponse<Settings>>('/settings', data).then((r) => r.data),
};

export const noteApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Note[]>>('/notes', { params }).then((r) => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Note>>(`/notes/${id}`).then((r) => r.data),
  getByDate: (date: string) =>
    api.get<ApiResponse<Note | null>>(`/notes/date/${date}`).then((r) => r.data),
  create: (data: Partial<Note>) =>
    api.post<ApiResponse<Note>>('/notes', data).then((r) => r.data),
  upsertDaily: (date: string, content: string) =>
    api.post<ApiResponse<Note>>('/notes/daily', { date, content }).then((r) => r.data),
  update: (id: string, data: Partial<Note>) =>
    api.put<ApiResponse<Note>>(`/notes/${id}`, data).then((r) => r.data),
  togglePin: (id: string) =>
    api.put<ApiResponse<Note>>(`/notes/${id}/pin`).then((r) => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/notes/${id}`).then((r) => r.data),
};

export const teachingRequestApi = {
  getAll: () =>
    api.get<ApiResponse<TeachingRequest[]>>('/teaching-requests/all').then((r) => r.data),
  getSent: () =>
    api.get<ApiResponse<TeachingRequest[]>>('/teaching-requests/sent').then((r) => r.data),
  getReceived: () =>
    api.get<ApiResponse<TeachingRequest[]>>('/teaching-requests/received').then((r) => r.data),
  getPendingCount: () =>
    api.get<ApiResponse<{ count: number }>>('/teaching-requests/pending-count').then((r) => r.data),
  getAvailableSubstitutes: () =>
    api.get<ApiResponse<User[]>>('/teaching-requests/substitutes').then((r) => r.data),
  create: (data: { substituteId: string; sessionId: string; message?: string }) =>
    api.post<ApiResponse<TeachingRequest>>('/teaching-requests', data).then((r) => r.data),
  accept: (id: string, responseMessage?: string) =>
    api.put<ApiResponse<TeachingRequest>>(`/teaching-requests/${id}/accept`, { responseMessage }).then((r) => r.data),
  decline: (id: string, responseMessage?: string) =>
    api.put<ApiResponse<TeachingRequest>>(`/teaching-requests/${id}/decline`, { responseMessage }).then((r) => r.data),
  cancel: (id: string) =>
    api.put<ApiResponse<TeachingRequest>>(`/teaching-requests/${id}/cancel`).then((r) => r.data),
};

// Student Portal API (separate axios instance without auth interceptor)
const studentPortalApi = axios.create({
  baseURL: '/api/student-portal',
});

studentPortalApi.interceptors.request.use((config) => {
  const studentStorage = localStorage.getItem('student-portal-storage');
  if (studentStorage) {
    try {
      const { state } = JSON.parse(studentStorage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore parsing errors
    }
  }
  return config;
});

studentPortalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/student')) {
        localStorage.removeItem('student-portal-storage');
        window.location.href = '/student';
      }
    }
    return Promise.reject(error);
  }
);

export const studentPortalApiService = {
  login: (studentCode: string) =>
    studentPortalApi.post<ApiResponse<StudentLoginResponse>>('/login', { studentCode }).then((r) => r.data),
  getMe: () =>
    studentPortalApi.get<ApiResponse<StudentPortalInfo>>('/me').then((r) => r.data),
  getSessions: (params?: { year?: number; month?: number }) =>
    studentPortalApi.get<ApiResponse<StudentPortalSession[]>>('/sessions', { params }).then((r) => r.data),
  getUpcoming: () =>
    studentPortalApi.get<ApiResponse<Session>>('/upcoming').then((r) => r.data),
  getBalance: (params?: { year?: number; month?: number }) =>
    studentPortalApi.get<ApiResponse<StudentBalanceInfo>>('/balance', { params }).then((r) => r.data),
};

export interface DatabaseInfo {
  currentUri: string;
  isConnected: boolean;
  databaseName: string;
  collections: { name: string; count: number }[];
}

export interface MigrateResult {
  success: boolean;
  message: string;
  migratedCounts?: {
    students: number;
    groups: number;
    sessions: number;
    payments: number;
    notes: number;
    settings: number;
    users: number;
  };
}

export const databaseApi = {
  getInfo: () =>
    api.get<ApiResponse<DatabaseInfo>>('/database/info').then((r) => r.data),
  testConnection: (uri: string) =>
    api.post<ApiResponse<{ success: boolean; message: string; databaseName?: string }>>('/database/test', { uri }).then((r) => r.data),
  switchDatabase: (uri: string) =>
    api.post<ApiResponse<{ success: boolean; message: string }>>('/database/switch', { uri }).then((r) => r.data),
  migrate: (targetUri: string, options?: { clearTarget?: boolean }) =>
    api.post<ApiResponse<MigrateResult>>('/database/migrate', { targetUri, ...options }).then((r) => r.data),
};
