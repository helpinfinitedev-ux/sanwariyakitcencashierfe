import { create } from 'zustand';
import { Floor, Table, TableStatus, MOCK_FLOORS, MOCK_TABLES } from '@/mock/data';
import { useActivityLogStore } from './useActivityLogStore';

interface FloorState {
  floors: Floor[];
  tables: Table[];
  selectedFloorId: string;
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
  floors: MOCK_FLOORS,
  tables: MOCK_TABLES,
  selectedFloorId: MOCK_FLOORS[0].id,
  selectFloor: (floorId) => set({ selectedFloorId: floorId }),
  updateTableStatus: (tableId, status, currentOrderId, waiterId) => {
    const table = get().tables.find((t) => t.id === tableId);
    if (table && table.status !== status) {
      useActivityLogStore.getState().logEvent({
        type: 'table.statusChanged',
        tableId,
        tableName: table.name,
        orderId: currentOrderId || table.currentOrderId,
        payload: {
          previousStatus: table.status,
          newStatus: status,
          waiterId: waiterId || table.waiterId,
        },
      });
    }

    set((state) => ({
      tables: state.tables.map((tbl) =>
        tbl.id === tableId
          ? {
              ...tbl,
              status,
              currentOrderId:
                status === 'available' ? undefined : (currentOrderId ?? tbl.currentOrderId),
              waiterId: status === 'available' ? undefined : (waiterId ?? tbl.waiterId),
            }
          : tbl,
      ),
    }));
  },
  resetTables: () => set({ tables: MOCK_TABLES }),
}));

