import { create } from 'zustand';
import { ActivityLogEvent, ActivityEventType } from '@/types/activityLog';
import { MOCK_ACTIVITY_LOGS } from '@/mock/activityData';
import { MOCK_RESTAURANT } from '@/mock/data';
import { useAuthStore } from './useAuthStore';

interface LogEventInput {
  type: ActivityEventType;
  orderId?: string;
  orderNumber?: string;
  tableId?: string;
  tableName?: string;
  customerId?: string;
  customerName?: string;
  cashierId?: string;
  cashierName?: string;
  storeId?: string;
  storeName?: string;
  payload?: Record<string, any>;
}

interface ActivityLogState {
  events: ActivityLogEvent[];
  logEvent: (input: LogEventInput) => ActivityLogEvent;
  clearLogs: () => void;
  exportLogsJSON: () => string;
}

export const useActivityLogStore = create<ActivityLogState>((set, get) => ({
  events: MOCK_ACTIVITY_LOGS,

  logEvent: (input) => {
    const authUser = useAuthStore.getState().user;
    const cashierId = input.cashierId || authUser?.employeeId || 'EMP-9821';
    const cashierName = input.cashierName || authUser?.name || 'Moazzam Ali';
    const storeId = input.storeId || MOCK_RESTAURANT.id;
    const storeName = input.storeName || MOCK_RESTAURANT.name;

    const newEvent: ActivityLogEvent = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: input.type,
      timestamp: new Date().toISOString(),
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      tableId: input.tableId,
      tableName: input.tableName,
      customerId: input.customerId,
      customerName: input.customerName,
      cashierId,
      cashierName,
      storeId,
      storeName,
      payload: input.payload || {},
    };

    set((state) => ({
      events: [newEvent, ...state.events],
    }));

    return newEvent;
  },

  clearLogs: () => set({ events: [] }),

  exportLogsJSON: () => {
    const { events } = get();
    const payload = {
      store: MOCK_RESTAURANT,
      exportedAt: new Date().toISOString(),
      eventsCount: events.length,
      auditEvents: events,
    };
    return JSON.stringify(payload, null, 2);
  },
}));
