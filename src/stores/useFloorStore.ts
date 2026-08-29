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

const mapBackendTable = (t: any, indexInSection: number): Table => {
  const { x, y } = gridPosition(indexInSection);
  return {
    id: t._id || t.id,
    name: t.label || `Table ${t.tableNo}`,
    floorId: t.section || 'Main',
    status: mapBackendStatus(t.status),
    capacity: t.capacity || 4,
    waiterId: t.waiter?._id || t.waiter || undefined,
    x,
    y,
  };
};

const buildFloorPlan = (backendTables: any[]): { floors: Floor[]; tables: Table[] } => {
  const perSection: Record<string, number> = {};
  const tables = backendTables.map((t) => {
    const section = t.section || 'Main';
    const idx = (perSection[section] = (perSection[section] ?? -1) + 1);
    return mapBackendTable(t, idx);
  });
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
  fetchTables: () => Promise<void>;
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

  fetchTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/tables');
      const { floors, tables } = buildFloorPlan(response.data.data || []);
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
    if (status === 'available') {
      api.post(`/tables/${tableId}/clear`).catch(() => {});
    } else if (status === 'occupied') {
      api.post(`/tables/${tableId}/seat`, {}).catch(() => {});
    } else if (status === 'reserved' || status === 'cleaning') {
      api.post(`/tables/${tableId}/status`, { status }).catch(() => {});
    }
  },

  resetTables: () => {
    get().fetchTables();
  },
}));
