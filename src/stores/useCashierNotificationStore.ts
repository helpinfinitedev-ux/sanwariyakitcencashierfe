import { create } from 'zustand';

export type CashierNotificationType = 'ready_to_bill' | 'info';

export interface CashierNotification {
  id: string;
  type: CashierNotificationType;
  title: string;
  description: string;
  /** Route to open when the notification is tapped (e.g. 'orders'). */
  route?: string;
  createdAt: string;
  read: boolean;
}

let seq = 0;
const nextId = () => `cnf-${Date.now()}-${seq++}`;

interface CashierNotificationState {
  notifications: CashierNotification[];
  pushNotification: (
    n: Pick<CashierNotification, 'type' | 'title' | 'description' | 'route'>,
  ) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
}

// In-memory bell feed for the cashier POS. Fed by realtime socket events
// (e.g. order:served -> "ready to bill"). Not persisted — a session-lifetime
// alert list, mirroring the waiter app's notification store.
export const useCashierNotificationStore = create<CashierNotificationState>((set, get) => ({
  notifications: [],
  pushNotification: (n) =>
    set((state) => ({
      notifications: [
        { id: nextId(), createdAt: new Date().toISOString(), read: false, ...n },
        ...state.notifications,
      ].slice(0, 50),
    })),
  markAllRead: () =>
    set((state) => ({ notifications: state.notifications.map((x) => ({ ...x, read: true })) })),
  dismiss: (id) =>
    set((state) => ({ notifications: state.notifications.filter((x) => x.id !== id) })),
  clearAll: () => set({ notifications: [] }),
  unreadCount: () => get().notifications.filter((x) => !x.read).length,
}));
