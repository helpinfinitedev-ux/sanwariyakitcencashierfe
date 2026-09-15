import { create } from 'zustand';
import { Floor, Table, TableStatus } from '@/mock/data';
import { api } from '@/services/authService.mock';
import { useActivityLogStore } from './useActivityLogStore';

// Backend tables only carry a section, not screen coordinates. Lay them out on
// a 4-column grid per section so the interactive floor map still renders.
const COLUMNS = 4;
const gridPosition = (indexInSection: number) => {
  const col = indexInSection % COLUMNS;
  const row = Math.floor(indexInSection / COLUMNS);
  return { x: 6 + col * 23, y: 8 + row * 28 };
};

// Backend statuses are a subset of the POS statuses ('billing' is POS-only).
const mapBackendStatus = (status: string): TableStatus => {
  switch (status) {
    case 'occupied':
      return 'occupied';
    case 'reserved':
      return 'reserved';
    case 'cleaning':
      return 'cleaning';
    case 'available':
    default:
      return 'available';
  }
};

const TAKEAWAY_SECTION = 'Takeaway';

const DEFAULT_TAKEAWAY_SLOTS: Table[] = [
  { id: 'takeaway-01', name: 'Takeaway 01', tableNo: 'Takeaway 01', floorId: TAKEAWAY_SECTION, status: 'available', capacity: 1, x: 6, y: 8, isTakeaway: true },
  { id: 'takeaway-02', name: 'Takeaway 02', tableNo: 'Takeaway 02', floorId: TAKEAWAY_SECTION, status: 'available', capacity: 1, x: 29, y: 8, isTakeaway: true },
  { id: 'takeaway-03', name: 'Takeaway 03', tableNo: 'Takeaway 03', floorId: TAKEAWAY_SECTION, status: 'available', capacity: 1, x: 52, y: 8, isTakeaway: true },
  { id: 'takeaway-04', name: 'Takeaway 04', tableNo: 'Takeaway 04', floorId: TAKEAWAY_SECTION, status: 'available', capacity: 1, x: 75, y: 8, isTakeaway: true },
  { id: 'takeaway-05', name: 'Takeaway 05', tableNo: 'Takeaway 05', floorId: TAKEAWAY_SECTION, status: 'available', capacity: 1, x: 6, y: 36, isTakeaway: true },
  { id: 'takeaway-06', name: 'Takeaway 06', tableNo: 'Takeaway 06', floorId: TAKEAWAY_SECTION, status: 'available', capacity: 1, x: 29, y: 36, isTakeaway: true },
];

const mapBackendTable = (t: any, indexInSection: number): Table => {
  const { x, y } = gridPosition(indexInSection);
  const isTakeaway = Boolean(
    t.isTakeaway ||
    t.section?.toLowerCase() === 'takeaway' ||
    t.label?.toLowerCase()?.includes('takeaway') ||
    String(t.tableNo)?.toLowerCase()?.includes('takeaway')
  );
  return {
    id: t._id || t.id,
    name: t.label || `Table ${t.tableNo}`,
    tableNo: t.tableNo != null ? String(t.tableNo) : undefined,
    floorId: t.section || 'Main',
    status: mapBackendStatus(t.status),
    capacity: t.capacity || 4,
    waiterId: t.waiter?._id || t.waiter || undefined,
    x,
    y,
    isTakeaway,
  };
};

const buildFloorPlan = (
  backendTables: any[],
  existingTables: Table[] = [],
  activeOrders: any[] = [],
): { floors: Floor[]; tables: Table[] } => {
  const perSection: Record<string, number> = {};
  const tables = backendTables.map((t) => {
    const section = t.section || 'Main';
    const idx = (perSection[section] = (perSection[section] ?? -1) + 1);
    return mapBackendTable(t, idx);
  });

  const relevantActiveOrders = (activeOrders || []).filter(
    (o) => o && o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'rejected',
  );

  // Ensure designated Takeaway slots are always present
  const hasTakeawaySection = tables.some(
    (t) => t.floorId.toLowerCase() === 'takeaway' || t.isTakeaway
  );
  if (!hasTakeawaySection) {
    const takeawaySlots = DEFAULT_TAKEAWAY_SLOTS.map((slot) => {
      const existing = existingTables.find(
        (et) =>
          et.id === slot.id ||
          et.name === slot.name ||
          (et.name && slot.name && et.name.replace(/\s*0?/, '') === slot.name.replace(/\s*0?/, ''))
      );
      // A slot is only occupied/billing if an active order is actually tied to it.
      // Once the order completes, it is guaranteed to resolve to 'available'.
      const hasActiveOrder = relevantActiveOrders.some(
        (o) =>
          o.tableId === slot.id ||
          o.tableId === slot.tableNo ||
          o.tableName === slot.name ||
          o.tableName === slot.tableNo ||
          (slot.name && o.tableName && slot.name.replace(/\s*0?/, '') === o.tableName.replace(/\s*0?/, ''))
      );
      const resolvedStatus: TableStatus = hasActiveOrder
        ? (existing?.status === 'billing' ? 'billing' : 'occupied')
        : 'available';
      return { ...slot, status: resolvedStatus };
    });
    tables.push(...takeawaySlots);
  }

  const floors: Floor[] = [...new Set(tables.map((t) => t.floorId))].map((id) => ({
    id,
    name: id,
  }));
  return { floors, tables };
};

interface FloorState {
  floors: Floor[];
  tables: Table[];
  selectedFloorId: string;
  isLoading: boolean;
  error: string | null;
  fetchTables: (activeOrders?: any[]) => Promise<void>;
  selectFloor: (floorId: string) => void;
  updateTableStatus: (
    tableId: string,
    status: TableStatus,
    currentOrderId?: string,
    waiterId?: string,
  ) => void;
  resetTables: () => void;
}

export const useFloorStore = create<FloorState>((set, get) => ({
  floors: [],
  tables: [],
  selectedFloorId: '',
  isLoading: false,
  error: null,

  fetchTables: async (activeOrders) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/tables');
      const { floors, tables } = buildFloorPlan(
        response.data.data || [],
        get().tables,
        activeOrders,
      );
      set((state) => ({
        floors,
        tables,
        // Keep the current floor selection if it still exists.
        selectedFloorId: floors.some((f) => f.id === state.selectedFloorId)
          ? state.selectedFloorId
          : floors[0]?.id || '',
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to load floor plan', isLoading: false });
    }
  },

  selectFloor: (floorId) => set({ selectedFloorId: floorId }),

  updateTableStatus: (tableId, status, currentOrderId, waiterId) => {
    const table = get().tables.find((t) => t.id === tableId);
    if (table && table.status !== status) {
      useActivityLogStore.getState().logEvent({
        type: 'table.statusChanged',
        tableId,
        tableName: table.name,
        orderId: currentOrderId,
        payload: { previousStatus: table.status, newStatus: status, waiterId },
      });
    }

    // Optimistic local update — keeps the map responsive and preserves the
    // POS-only 'billing' state that the backend does not model.
    set((state) => ({
      tables: state.tables.map((tbl) =>
        tbl.id === tableId
          ? {
              ...tbl,
              status,
              waiterId: status === 'available' ? undefined : (waiterId ?? tbl.waiterId),
            }
          : tbl,
      ),
    }));

    // Best-effort backend sync. A 'table:updated' broadcast triggers a refetch
    // that reconciles every connected client. 'billing' stays client-side.
    if (!table?.isTakeaway) {
      if (status === 'available') {
        api.post(`/tables/${tableId}/clear`).catch(() => {});
      } else if (status === 'occupied') {
        api.post(`/tables/${tableId}/seat`, {}).catch(() => {});
      } else if (status === 'reserved' || status === 'cleaning') {
        api.post(`/tables/${tableId}/status`, { status }).catch(() => {});
      }
    } else if (tableId.length === 24) {
      if (status === 'available') {
        api.post(`/tables/${tableId}/clear`).catch(() => {});
      } else if (status === 'occupied') {
        api.post(`/tables/${tableId}/seat`, {}).catch(() => {});
      }
    }
  },

  resetTables: () => {
    get().fetchTables();
  },
}));
