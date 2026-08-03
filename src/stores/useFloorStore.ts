import { create } from 'zustand';
import { Floor, Table, TableStatus, MOCK_FLOORS, MOCK_TABLES } from '@/mock/data';

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

export const useFloorStore = create<FloorState>((set) => ({
  floors: MOCK_FLOORS,
  tables: MOCK_TABLES,
  selectedFloorId: MOCK_FLOORS[0].id,
  selectFloor: (floorId) => set({ selectedFloorId: floorId }),
  updateTableStatus: (tableId, status, currentOrderId, waiterId) =>
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status,
              currentOrderId:
                status === 'available' ? undefined : (currentOrderId ?? table.currentOrderId),
              waiterId: status === 'available' ? undefined : (waiterId ?? table.waiterId),
            }
          : table,
      ),
    })),
  resetTables: () => set({ tables: MOCK_TABLES }),
}));
