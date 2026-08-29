import AsyncStorage from '@react-native-async-storage/async-storage';

// Synchronous key/value facade backed by AsyncStorage (works in Expo Go, on
// native, and on web). Reads are served from an in-memory cache so the axios
// request interceptor and Zustand initializers can stay synchronous; writes
// update the cache immediately and persist to AsyncStorage in the background.
//
// Call `storage.hydrate()` once at startup (before reading persisted values)
// to load previously stored keys into the cache — otherwise the cache starts
// empty on a cold launch and the session would appear lost.
const cache = new Map<string, string>();
let hydrating: Promise<void> | null = null;

async function hydrate(): Promise<void> {
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const entries = await AsyncStorage.multiGet(keys);
      for (const [key, value] of entries) {
        if (value != null) cache.set(key, value);
      }
    } catch {
      // Ignore hydration errors; cache simply starts empty.
    }
  })();
  return hydrating;
}

export const storage = {
  hydrate,
  getItem: (key: string): string | null => (cache.has(key) ? (cache.get(key) as string) : null),
  setItem: (key: string, value: string): void => {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch(() => {
      // Ignore persistence errors; the in-memory value is still available.
    });
  },
  removeItem: (key: string): void => {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch(() => {
      // Ignore persistence errors.
    });
  },
};
