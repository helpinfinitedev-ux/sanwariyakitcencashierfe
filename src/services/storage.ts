// Browser-local persistence keeps the synchronous facade used by the Axios
// interceptor and Zustand stores while replacing native AsyncStorage.
const getBrowserStorage = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
};

export const storage = {
  hydrate: async (): Promise<void> => undefined,
  getItem: (key: string): string | null => getBrowserStorage()?.getItem(key) ?? null,
  setItem: (key: string, value: string): void => {
    getBrowserStorage()?.setItem(key, value);
  },
  removeItem: (key: string): void => {
    getBrowserStorage()?.removeItem(key);
  },
};
