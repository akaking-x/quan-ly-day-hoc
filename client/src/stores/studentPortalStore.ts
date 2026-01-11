import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudentPortalInfo } from '../types';

interface StudentPortalState {
  student: StudentPortalInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (student: StudentPortalInfo, token: string) => void;
  logout: () => void;
}

export const useStudentPortalStore = create<StudentPortalState>()(
  persist(
    (set) => ({
      student: null,
      token: null,
      isAuthenticated: false,
      login: (student, token) =>
        set({
          student,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          student: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'student-portal-storage',
    }
  )
);
