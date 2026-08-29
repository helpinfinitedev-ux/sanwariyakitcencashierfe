import { create } from 'zustand';
import { authService, AuthUser } from '@/services/authService.mock';
import { storage } from '@/services/storage';
import { useActivityLogStore } from './useActivityLogStore';

const STORAGE_SESSION_KEY = 'sanwariya_pos_cashier_session';

interface StoredSession {
  token: string;
  userId: string;
}

const getStoredSession = (): StoredSession | null => {
  try {
    const raw = storage.getItem(STORAGE_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage parse errors
  }
  return null;
};

const saveStoredSession = (session: StoredSession | null) => {
  try {
    if (session) {
      storage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } else {
      storage.removeItem(STORAGE_SESSION_KEY);
    }
  } catch {
    // Ignore storage write errors
  }
};

interface AuthState {
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  user: { name: string; role: string; employeeId: string } | null; // Compatibility alias
  token: string | null;
  isLoading: boolean;
  error: string | null;
  branchName: string;

  // Actions
  login: (mobileNumber: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuthSession: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  currentUser: null,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  branchName: 'Main Branch - Sector V',

  login: async (mobileNumber, password) => {
    set({ isLoading: true, error: null });

    try {
      const res = await authService.login(mobileNumber, password);

      if (res.success) {
        saveStoredSession({ token: res.token, userId: res.user.id });

        set({
          isAuthenticated: true,
          currentUser: res.user,
          user: {
            name: res.user.cashierName,
            role: 'Head Cashier',
            employeeId: res.user.employeeId,
          },
          token: res.token,
          branchName: res.user.branchName || 'Main Branch - Sector V',
          isLoading: false,
          error: null,
        });

        return { success: true };
      } else {
        set({
          isLoading: false,
          error: res.message,
        });
        return { success: false, message: res.message };
      }
    } catch {
      const fallbackMsg = 'Network error during login. Please try again.';
      set({ isLoading: false, error: fallbackMsg });
      return { success: false, message: fallbackMsg };
    }
  },

  logout: () => {
    saveStoredSession(null);
    set({
      isAuthenticated: false,
      currentUser: null,
      user: null,
      token: null,
      error: null,
      isLoading: false,
    });
  },

  checkAuthSession: async () => {
    // Load persisted values into the synchronous cache before reading them
    // (and before the axios interceptor needs the token).
    await storage.hydrate();
    const session = getStoredSession();

    if (!session || !session.userId) {
      set({ isAuthenticated: false, currentUser: null, user: null, token: null });
      return false;
    }

    try {
      const validatedUser = await authService.validateStoredSession(session.userId);

      if (validatedUser) {
        set({
          isAuthenticated: true,
          currentUser: validatedUser,
          user: {
            name: validatedUser.cashierName,
            role: 'Head Cashier',
            employeeId: validatedUser.employeeId,
          },
          token: session.token,
          branchName: validatedUser.branchName || 'Main Branch - Sector V',
        });
        return true;
      } else {
        // Deactivated by Super Admin while session was stored -> force logout
        saveStoredSession(null);
        set({
          isAuthenticated: false,
          currentUser: null,
          user: null,
          token: null,
          error: 'Access revoked. Contact your admin.',
        });
        return false;
      }
    } catch {
      saveStoredSession(null);
      set({ isAuthenticated: false, currentUser: null, user: null, token: null });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
