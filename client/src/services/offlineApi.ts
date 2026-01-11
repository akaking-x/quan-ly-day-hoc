import { v4 as uuidv4 } from 'uuid';
import { offlineStorage, syncQueue, metadata } from './offlineDb';
import { studentApi, groupApi, sessionApi, paymentApi, reportApi, noteApi, settingsApi } from './api';
import { isOnline, processSyncQueue } from './syncService';
import type { Student, Group, Session, Payment, Note, ApiResponse, Settings } from '../types';

// Helper to generate temporary IDs for offline-created items
const generateTempId = () => `temp_${uuidv4()}`;

// Offline-aware Student API
export const offlineStudentApi = {
  async getAll(params?: Record<string, string>): Promise<ApiResponse<Student[]>> {
    if (isOnline()) {
      try {
        const result = await studentApi.getAll(params);
        if (result.success && result.data) {
          await offlineStorage.saveAll('students', result.data);
        }
        return result;
      } catch {
        // Fall through to offline mode
      }
    }

    // Offline: return from local storage
    const students = await offlineStorage.getAll<Student>('students');
    let filtered = students.filter((s) => s.active !== false);

    if (params?.active === 'false') {
      filtered = students.filter((s) => s.active === false);
    }

    return { success: true, data: filtered };
  },

  async getById(id: string): Promise<ApiResponse<Student>> {
    if (isOnline()) {
      try {
        const result = await studentApi.getById(id);
        if (result.success && result.data) {
          await offlineStorage.save('students', result.data);
        }
        return result;
      } catch {
        // Fall through to offline mode
      }
    }

    const student = await offlineStorage.getById<Student>('students', id);
    if (student) {
      return { success: true, data: student };
    }
    return { success: false, error: 'Student not found' };
  },

  async create(data: Partial<Student>): Promise<ApiResponse<Student>> {
    if (isOnline()) {
      try {
        const result = await studentApi.create(data);
        if (result.success && result.data) {
          await offlineStorage.save('students', result.data);
        }
        return result;
      } catch {
        // Fall through to offline mode
      }
    }

    // Offline: save locally and queue for sync
    const tempStudent: Student = {
      _id: generateTempId(),
      name: data.name || '',
      phone: data.phone,
      school: data.school,
      grade: data.grade,
      feePerSession: data.feePerSession || 0,
      type: data.type || 'individual',
      groupId: data.groupId,
      notes: data.notes,
      active: true,
      studentCode: data.studentCode || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.save('students', tempStudent);
    await syncQueue.add({ type: 'create', entity: 'students', data: data as Record<string, unknown> });

    return { success: true, data: tempStudent };
  },

  async update(id: string, data: Partial<Student>): Promise<ApiResponse<Student>> {
    if (isOnline()) {
      try {
        const result = await studentApi.update(id, data);
        if (result.success && result.data) {
          await offlineStorage.save('students', result.data);
        }
        return result;
      } catch {
        // Fall through to offline mode
      }
    }

    // Offline: update locally and queue for sync
    const existing = await offlineStorage.getById<Student>('students', id);
    if (!existing) {
      return { success: false, error: 'Student not found' };
    }

    const updated: Student = {
      ...existing,
      ...data,
      _id: id,
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.save('students', updated);
    await syncQueue.add({ type: 'update', entity: 'students', data: { _id: id, ...data } });

    return { success: true, data: updated };
  },

  async delete(id: string): Promise<ApiResponse<Student>> {
    if (isOnline()) {
      try {
        const result = await studentApi.delete(id);
        if (result.success) {
          // Soft delete locally
          const existing = await offlineStorage.getById<Student>('students', id);
          if (existing) {
            existing.active = false;
            await offlineStorage.save('students', existing);
          }
        }
        return result;
      } catch {
        // Fall through to offline mode
      }
    }

    // Offline: soft delete locally and queue for sync
    const existing = await offlineStorage.getById<Student>('students', id);
    if (!existing) {
      return { success: false, error: 'Student not found' };
    }

    existing.active = false;
    await offlineStorage.save('students', existing);
    await syncQueue.add({ type: 'delete', entity: 'students', data: { _id: id } });

    return { success: true, data: existing };
  },
};

// Offline-aware Group API
export const offlineGroupApi = {
  async getAll(params?: Record<string, string>): Promise<ApiResponse<Group[]>> {
    if (isOnline()) {
      try {
        const result = await groupApi.getAll(params);
        if (result.success && result.data) {
          await offlineStorage.saveAll('groups', result.data);
        }
        return result;
      } catch {
        // Fall through to offline mode
      }
    }

    const groups = await offlineStorage.getAll<Group>('groups');
    let filtered = groups.filter((g) => g.active !== false);

    if (params?.active === 'false') {
      filtered = groups.filter((g) => g.active === false);
    }

    return { success: true, data: filtered };
  },

  async getById(id: string): Promise<ApiResponse<Group>> {
    if (isOnline()) {
      try {
        const result = await groupApi.getById(id);
        if (result.success && result.data) {
          await offlineStorage.save('groups', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const group = await offlineStorage.getById<Group>('groups', id);
    if (group) {
      return { success: true, data: group };
    }
    return { success: false, error: 'Group not found' };
  },

  async create(data: Partial<Group>): Promise<ApiResponse<Group>> {
    if (isOnline()) {
      try {
        const result = await groupApi.create(data);
        if (result.success && result.data) {
          await offlineStorage.save('groups', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const tempGroup: Group = {
      _id: generateTempId(),
      name: data.name || '',
      description: data.description,
      schoolYear: data.schoolYear || '',
      schedule: data.schedule || [],
      defaultFeePerSession: data.defaultFeePerSession || 0,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.save('groups', tempGroup);
    await syncQueue.add({ type: 'create', entity: 'groups', data: data as Record<string, unknown> });

    return { success: true, data: tempGroup };
  },

  async update(id: string, data: Partial<Group>): Promise<ApiResponse<Group>> {
    if (isOnline()) {
      try {
        const result = await groupApi.update(id, data);
        if (result.success && result.data) {
          await offlineStorage.save('groups', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const existing = await offlineStorage.getById<Group>('groups', id);
    if (!existing) {
      return { success: false, error: 'Group not found' };
    }

    const updated: Group = { ...existing, ...data, _id: id, updatedAt: new Date().toISOString() };
    await offlineStorage.save('groups', updated);
    await syncQueue.add({ type: 'update', entity: 'groups', data: { _id: id, ...data } });

    return { success: true, data: updated };
  },

  async delete(id: string): Promise<ApiResponse<Group>> {
    if (isOnline()) {
      try {
        return await groupApi.delete(id);
      } catch {
        // Fall through
      }
    }

    const existing = await offlineStorage.getById<Group>('groups', id);
    if (!existing) {
      return { success: false, error: 'Group not found' };
    }

    existing.active = false;
    await offlineStorage.save('groups', existing);
    await syncQueue.add({ type: 'delete', entity: 'groups', data: { _id: id } });

    return { success: true, data: existing };
  },

  async getStudents(id: string): Promise<ApiResponse<Student[]>> {
    if (isOnline()) {
      try {
        return await groupApi.getStudents(id);
      } catch {
        // Fall through
      }
    }

    const students = await offlineStorage.getAll<Student>('students');
    const filtered = students.filter((s) => s.groupId === id && s.active !== false);
    return { success: true, data: filtered };
  },
};

// Offline-aware Session API
export const offlineSessionApi = {
  async getAll(params?: Record<string, string>): Promise<ApiResponse<Session[]>> {
    if (isOnline()) {
      try {
        const result = await sessionApi.getAll(params);
        if (result.success && result.data) {
          await offlineStorage.saveAll('sessions', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const sessions = await offlineStorage.getAll<Session>('sessions');
    return { success: true, data: sessions };
  },

  async getById(id: string): Promise<ApiResponse<Session>> {
    if (isOnline()) {
      try {
        const result = await sessionApi.getById(id);
        if (result.success && result.data) {
          await offlineStorage.save('sessions', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const session = await offlineStorage.getById<Session>('sessions', id);
    if (session) {
      return { success: true, data: session };
    }
    return { success: false, error: 'Session not found' };
  },

  async create(data: Partial<Session>): Promise<ApiResponse<Session>> {
    if (isOnline()) {
      try {
        const result = await sessionApi.create(data);
        if (result.success && result.data) {
          await offlineStorage.save('sessions', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const tempSession: Session = {
      _id: generateTempId(),
      date: data.date || new Date().toISOString(),
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      groupId: data.groupId,
      studentIds: data.studentIds || [],
      type: data.type || 'scheduled',
      subject: data.subject || '',
      notes: data.notes,
      attendance: data.attendance || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.save('sessions', tempSession);
    await syncQueue.add({ type: 'create', entity: 'sessions', data: data as Record<string, unknown> });

    return { success: true, data: tempSession };
  },

  async update(id: string, data: Partial<Session>): Promise<ApiResponse<Session>> {
    if (isOnline()) {
      try {
        const result = await sessionApi.update(id, data);
        if (result.success && result.data) {
          await offlineStorage.save('sessions', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const existing = await offlineStorage.getById<Session>('sessions', id);
    if (!existing) {
      return { success: false, error: 'Session not found' };
    }

    const updated: Session = { ...existing, ...data, _id: id, updatedAt: new Date().toISOString() };
    await offlineStorage.save('sessions', updated);
    await syncQueue.add({ type: 'update', entity: 'sessions', data: { _id: id, ...data } });

    return { success: true, data: updated };
  },

  async updateAttendance(id: string, attendance: Session['attendance']): Promise<ApiResponse<Session>> {
    if (isOnline()) {
      try {
        const result = await sessionApi.updateAttendance(id, attendance);
        if (result.success && result.data) {
          await offlineStorage.save('sessions', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    return this.update(id, { attendance });
  },

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    if (isOnline()) {
      try {
        const result = await sessionApi.delete(id);
        if (result.success) {
          await offlineStorage.delete('sessions', id);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    await offlineStorage.delete('sessions', id);
    await syncQueue.add({ type: 'delete', entity: 'sessions', data: { _id: id } });

    return { success: true, data: { message: 'Session deleted' } };
  },

  async getCalendar(year: number, month: number): Promise<ApiResponse<Session[]>> {
    if (isOnline()) {
      try {
        const result = await sessionApi.getCalendar(year, month);
        if (result.success && result.data) {
          // Don't overwrite all sessions, just update these
          for (const session of result.data) {
            await offlineStorage.save('sessions', session);
          }
        }
        return result;
      } catch {
        // Fall through
      }
    }

    // Filter sessions by month from local storage
    const sessions = await offlineStorage.getAll<Session>('sessions');
    const filtered = sessions.filter((s) => {
      const date = new Date(s.date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });

    return { success: true, data: filtered };
  },

  async duplicateWeek(data: { weekStartDate: string; numberOfWeeks: number }): Promise<ApiResponse<Session[]>> {
    if (isOnline()) {
      try {
        const result = await sessionApi.duplicateWeek(data);
        if (result.success && result.data) {
          for (const session of result.data) {
            await offlineStorage.save('sessions', session);
          }
        }
        return result;
      } catch {
        // Fall through
      }
    }

    // Offline: duplicate sessions locally
    const weekStart = new Date(data.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const sessions = await offlineStorage.getAll<Session>('sessions');
    const weekSessions = sessions.filter((s) => {
      const date = new Date(s.date);
      return date >= weekStart && date <= weekEnd;
    });

    const createdSessions: Session[] = [];

    for (let week = 1; week <= data.numberOfWeeks; week++) {
      for (const session of weekSessions) {
        const originalDate = new Date(session.date);
        const newDate = new Date(originalDate);
        newDate.setDate(newDate.getDate() + week * 7);

        const newSession: Session = {
          ...session,
          _id: generateTempId(),
          date: newDate.toISOString(),
          attendance: session.attendance.map((a) => ({
            studentId: typeof a.studentId === 'string' ? a.studentId : a.studentId._id,
            status: 'absent' as const,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await offlineStorage.save('sessions', newSession);
        createdSessions.push(newSession);
      }
    }

    return { success: true, data: createdSessions };
  },
};

// Offline-aware Payment API
export const offlinePaymentApi = {
  async getAll(params?: Record<string, string>): Promise<ApiResponse<Payment[]>> {
    if (isOnline()) {
      try {
        const result = await paymentApi.getAll(params);
        if (result.success && result.data) {
          await offlineStorage.saveAll('payments', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const payments = await offlineStorage.getAll<Payment>('payments');
    return { success: true, data: payments };
  },

  async create(data: Partial<Payment>): Promise<ApiResponse<Payment>> {
    if (isOnline()) {
      try {
        const result = await paymentApi.create(data);
        if (result.success && result.data) {
          await offlineStorage.save('payments', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const tempPayment: Payment = {
      _id: generateTempId(),
      studentId: data.studentId || '',
      amount: data.amount || 0,
      paymentDate: data.paymentDate || new Date().toISOString(),
      periodStart: data.periodStart || '',
      periodEnd: data.periodEnd || '',
      sessionsCount: data.sessionsCount || 0,
      method: data.method || 'cash',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    await offlineStorage.save('payments', tempPayment);
    await syncQueue.add({ type: 'create', entity: 'payments', data: data as Record<string, unknown> });

    return { success: true, data: tempPayment };
  },

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    if (isOnline()) {
      try {
        const result = await paymentApi.delete(id);
        if (result.success) {
          await offlineStorage.delete('payments', id);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    await offlineStorage.delete('payments', id);
    await syncQueue.add({ type: 'delete', entity: 'payments', data: { _id: id } });

    return { success: true, data: { message: 'Payment deleted' } };
  },
};

// Report API - primarily online only, but can use cached data
export const offlineReportApi = {
  async getSummary() {
    if (isOnline()) {
      try {
        return await reportApi.getSummary();
      } catch {
        // Fall through
      }
    }

    // Calculate from local data
    const students = await offlineStorage.getAll<Student>('students');
    const sessions = await offlineStorage.getAll<Session>('sessions');
    const payments = await offlineStorage.getAll<Payment>('payments');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const activeStudents = students.filter((s) => s.active !== false);
    const sessionsThisMonth = sessions.filter((s) => {
      const date = new Date(s.date);
      return date >= startOfMonth && date <= endOfMonth;
    });
    const paymentsThisMonth = payments.filter((p) => {
      const date = new Date(p.paymentDate);
      return date >= startOfMonth && date <= endOfMonth;
    });

    return {
      success: true,
      data: {
        totalStudents: activeStudents.length,
        sessionsThisMonth: sessionsThisMonth.length,
        revenueThisMonth: paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0),
        totalDebt: 0, // Would need complex calculation
      },
    };
  },

  async getMonthly(year: number, month: number) {
    // This requires server-side calculation, just pass through
    if (isOnline()) {
      return reportApi.getMonthly(year, month);
    }

    return {
      success: false,
      error: 'Monthly report requires network connection',
    };
  },

  async getBalance() {
    if (isOnline()) {
      return reportApi.getBalance();
    }
    return { success: false, error: 'Balance report requires network connection' };
  },

  async getChart() {
    if (isOnline()) {
      return reportApi.getChart();
    }
    return { success: false, error: 'Chart data requires network connection' };
  },
};

// Offline-aware Note API
export const offlineNoteApi = {
  async getAll(params?: Record<string, string>): Promise<ApiResponse<Note[]>> {
    if (isOnline()) {
      try {
        const result = await noteApi.getAll(params);
        if (result.success && result.data) {
          await offlineStorage.saveAll('notes', result.data);
        }
        return result;
      } catch {
        // Fall through to offline mode
      }
    }

    const notes = await offlineStorage.getAll<Note>('notes');
    // Sort by pinned first, then by date
    const sorted = notes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
    });
    return { success: true, data: sorted };
  },

  async getById(id: string): Promise<ApiResponse<Note>> {
    if (isOnline()) {
      try {
        const result = await noteApi.getById(id);
        if (result.success && result.data) {
          await offlineStorage.save('notes', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const note = await offlineStorage.getById<Note>('notes', id);
    if (note) {
      return { success: true, data: note };
    }
    return { success: false, error: 'Note not found' };
  },

  async getByDate(date: string): Promise<ApiResponse<Note | null>> {
    if (isOnline()) {
      try {
        const result = await noteApi.getByDate(date);
        if (result.success && result.data) {
          await offlineStorage.save('notes', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const notes = await offlineStorage.getAll<Note>('notes');
    const note = notes.find(n => n.date === date && n.type === 'daily');
    return { success: true, data: note || null };
  },

  async create(data: Partial<Note>): Promise<ApiResponse<Note>> {
    if (isOnline()) {
      try {
        const result = await noteApi.create(data);
        if (result.success && result.data) {
          await offlineStorage.save('notes', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const tempNote: Note = {
      _id: generateTempId(),
      title: data.title || '',
      content: data.content || '',
      date: data.date,
      type: data.type || 'general',
      pinned: data.pinned || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.save('notes', tempNote);
    await syncQueue.add({ type: 'create', entity: 'notes' as any, data: data as Record<string, unknown> });

    return { success: true, data: tempNote };
  },

  async upsertDaily(date: string, content: string): Promise<ApiResponse<Note>> {
    if (isOnline()) {
      try {
        const result = await noteApi.upsertDaily(date, content);
        if (result.success && result.data) {
          await offlineStorage.save('notes', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    // Check if note exists
    const notes = await offlineStorage.getAll<Note>('notes');
    const existing = notes.find(n => n.date === date && n.type === 'daily');

    if (existing) {
      const updated: Note = {
        ...existing,
        content,
        updatedAt: new Date().toISOString(),
      };
      await offlineStorage.save('notes', updated);
      await syncQueue.add({ type: 'update', entity: 'notes' as any, data: { _id: existing._id, content } });
      return { success: true, data: updated };
    } else {
      return this.create({ date, content, type: 'daily', title: `Ghi chú ${date}` });
    }
  },

  async update(id: string, data: Partial<Note>): Promise<ApiResponse<Note>> {
    if (isOnline()) {
      try {
        const result = await noteApi.update(id, data);
        if (result.success && result.data) {
          await offlineStorage.save('notes', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const existing = await offlineStorage.getById<Note>('notes', id);
    if (!existing) {
      return { success: false, error: 'Note not found' };
    }

    const updated: Note = {
      ...existing,
      ...data,
      _id: id,
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.save('notes', updated);
    await syncQueue.add({ type: 'update', entity: 'notes' as any, data: { _id: id, ...data } });

    return { success: true, data: updated };
  },

  async togglePin(id: string): Promise<ApiResponse<Note>> {
    if (isOnline()) {
      try {
        const result = await noteApi.togglePin(id);
        if (result.success && result.data) {
          await offlineStorage.save('notes', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const existing = await offlineStorage.getById<Note>('notes', id);
    if (!existing) {
      return { success: false, error: 'Note not found' };
    }

    const updated: Note = {
      ...existing,
      pinned: !existing.pinned,
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.save('notes', updated);
    await syncQueue.add({ type: 'update', entity: 'notes' as any, data: { _id: id, pinned: updated.pinned } });

    return { success: true, data: updated };
  },

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    if (isOnline()) {
      try {
        const result = await noteApi.delete(id);
        if (result.success) {
          await offlineStorage.delete('notes', id);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    await offlineStorage.delete('notes', id);
    await syncQueue.add({ type: 'delete', entity: 'notes' as any, data: { _id: id } });

    return { success: true, data: { message: 'Note deleted' } };
  },
};

// Offline-aware Settings API
export const offlineSettingsApi = {
  async get(): Promise<ApiResponse<Settings>> {
    if (isOnline()) {
      try {
        const result = await settingsApi.get();
        if (result.success && result.data) {
          await metadata.set('settings', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    const cached = await metadata.get('settings') as Settings | undefined;
    if (cached) {
      return { success: true, data: cached };
    }

    // Return default settings if no cached data
    return {
      success: true,
      data: {
        subjects: ['Toán', 'Lý', 'Hóa', 'Anh'],
        workingHoursStart: 6,
        workingHoursEnd: 22,
      } as Settings,
    };
  },

  async update(data: Partial<Settings>): Promise<ApiResponse<Settings>> {
    if (isOnline()) {
      try {
        const result = await settingsApi.update(data);
        if (result.success && result.data) {
          await metadata.set('settings', result.data);
        }
        return result;
      } catch {
        // Fall through
      }
    }

    // Offline: update locally
    const cached = await metadata.get('settings') as Settings | undefined;
    const updated = { ...cached, ...data } as Settings;
    await metadata.set('settings', updated);

    return { success: true, data: updated };
  },
};

// Trigger sync when going online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processSyncQueue();
  });
}
