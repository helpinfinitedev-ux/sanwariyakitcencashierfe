import { Platform } from 'react-native';

// Synchronous key/value storage that works on native (MMKV) and web
// (localStorage). Kept synchronous so the axios request interceptor can read
// the token without awaiting. On native this persists the cashier session
// across app restarts — the previous localStorage-only approach silently
// no-oped on device, so the session was lost every cold start.
let store: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

if (Platform.OS === 'web') {
  store = {
    getString: (key) => {
      try {
        return localStorage.getItem(key) ?? undefined;
      } catch {
        return undefined;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore quota / privacy-mode errors
      }
    },
    delete: (key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
} else {
  const { MMKV } = require('react-native-mmkv');
  const mmkv = new MMKV({ id: 'cashier-pos-storage' });
  store = {
    getString: (key) => mmkv.getString(key),
    set: (key, value) => mmkv.set(key, value),
    delete: (key) => mmkv.delete(key),
  };
}

export const storage = {
  getItem: (key: string): string | null => store.getString(key) ?? null,
  setItem: (key: string, value: string): void => store.set(key, value),
  removeItem: (key: string): void => store.delete(key),
};
