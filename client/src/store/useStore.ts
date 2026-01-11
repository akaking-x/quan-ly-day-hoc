import { create } from 'zustand';
import type { Student, Group, Session, Summary, Settings } from '../types';
import {
  offlineStudentApi as studentApi,
  offlineGroupApi as groupApi,
  offlineSessionApi as sessionApi,
  offlineReportApi as reportApi,
} from '../services/offlineApi';
import { settingsApi } from '../services/api';

interface AppState {
  students: Student[];
  groups: Group[];
  sessions: Session[];
  summary: Summary | null;
  settings: Settings | null;
  loading: boolean;
  error: string | null;

  fetchStudents: (params?: Record<string, string>) => Promise<void>;
  fetchGroups: (params?: Record<string, string>) => Promise<void>;
  fetchSessions: (params?: Record<string, string>) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  students: [],
  groups: [],
  sessions: [],
  summary: null,
  settings: null,
  loading: false,
  error: null,

  fetchStudents: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await studentApi.getAll(params);
      if (response.success && response.data) {
        set({ students: response.data });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchGroups: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await groupApi.getAll(params);
      if (response.success && response.data) {
        set({ groups: response.data });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchSessions: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await sessionApi.getAll(params);
      if (response.success && response.data) {
        set({ sessions: response.data });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const response = await reportApi.getSummary();
      if (response.success && response.data) {
        set({ summary: response.data });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchSettings: async () => {
    try {
      const response = await settingsApi.get();
      if (response.success && response.data) {
        set({ settings: response.data });
        // Apply gradient CSS variables
        const root = document.documentElement;
        root.style.setProperty('--gradient-from', response.data.gradientFrom || '#3B82F6');
        root.style.setProperty('--gradient-to', response.data.gradientTo || '#8B5CF6');
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
