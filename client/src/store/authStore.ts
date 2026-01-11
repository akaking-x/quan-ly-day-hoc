import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

// Simple hash function for offline password comparison
const simpleHash = async (str: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface CachedCredentials {
  username: string;
  passwordHash: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  offlineModeEnabled: boolean;
  cachedCredentials: CachedCredentials | null;
  isOfflineSession: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  enableOfflineMode: (username: string, password: string, user: User) => Promise<void>;
  disableOfflineMode: () => void;
  tryOfflineLogin: (username: string, password: string) => Promise<boolean>;
  setIsOfflineSession: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      offlineModeEnabled: false,
      cachedCredentials: null,
      isOfflineSession: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true, isOfflineSession: false }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, isOfflineSession: false }),
      enableOfflineMode: async (username, password, user) => {
        const passwordHash = await simpleHash(password);
        set({
          offlineModeEnabled: true,
          cachedCredentials: { username, passwordHash, user },
        });
      },
      disableOfflineMode: () => set({
        offlineModeEnabled: false,
        cachedCredentials: null,
      }),
      tryOfflineLogin: async (username, password) => {
        const { cachedCredentials, offlineModeEnabled } = get();
        if (!offlineModeEnabled || !cachedCredentials) {
          return false;
        }

        const passwordHash = await simpleHash(password);
        if (cachedCredentials.username === username && cachedCredentials.passwordHash === passwordHash) {
          set({
            user: cachedCredentials.user,
            token: 'offline-token',
            isAuthenticated: true,
            isOfflineSession: true,
          });
          return true;
        }
        return false;
      },
      setIsOfflineSession: (value) => set({ isOfflineSession: value }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
