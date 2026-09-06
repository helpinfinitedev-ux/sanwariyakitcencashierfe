import { create } from 'zustand';

interface SettingsState {
  themeMode: 'dark' | 'light';
  isSidebarCollapsed: boolean;
  taxRate: number; // e.g. 0.05 for 5% GST
  kdsAutoPrint: boolean;
  receiptAutoPrint: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setThemeMode: (mode: 'dark' | 'light') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  updateSettings: (
    settings: Partial<
      Omit<
        SettingsState,
        'toggleTheme' | 'toggleSidebar' | 'setThemeMode' | 'setSidebarCollapsed' | 'updateSettings'
      >
    >,
  ) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: 'dark', // default theme is premium dark mode
  isSidebarCollapsed: false,
  taxRate: 0.05,
  kdsAutoPrint: true,
  receiptAutoPrint: true,

  toggleTheme: () => set((state) => ({ themeMode: state.themeMode === 'dark' ? 'light' : 'dark' })),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setThemeMode: (themeMode) => set({ themeMode }),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
}));
