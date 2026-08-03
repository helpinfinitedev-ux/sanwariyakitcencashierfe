import { create } from 'zustand';

export interface UserProfile {
  name: string;
  role: string;
  employeeId: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  branchName: string;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    name: 'Moazzam Ali',
    role: 'Head Cashier',
    employeeId: 'EMP-9821',
  },
  isLoggedIn: true,
  branchName: 'Main Branch - Sector V',
  login: async (code: string) => {
    // Simple cashier login logic (pin-code based)
    if (code === '1234') {
      set({
        user: { name: 'Moazzam Ali', role: 'Head Cashier', employeeId: 'EMP-9821' },
        isLoggedIn: true,
      });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isLoggedIn: false }),
}));
