import { io, Socket } from 'socket.io-client';
import { useOrderStore } from '@/stores/useOrderStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useReportStore } from '@/stores/useReportStore';

let socket: Socket | null = null;

// Plays a short chime when a new KOT lands in the pending-approval queue.
function playPendingChime() {
  try {
    const player = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
    player.volume = 0.7;
    void player.play();
  } catch (error) {
    console.warn('Cashier chime failed:', error);
  }
}

// Determine central backend socket host
const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.EXPO_PUBLIC_API_URL;
  if (!envUrl || envUrl === 'mock_api_url') {
    return 'http://localhost:4000';
  }
  // Strip trailing '/api' from connection URL if present
  return envUrl.endsWith('/api') ? envUrl.slice(0, -4) : envUrl;
};

export const socketService = {
  connect: (
    token: string,
    showToastMessage?: (msg: string, type: 'success' | 'error' | 'info') => void,
  ) => {
    if (socket) {
      socket.disconnect();
    }

    socket = io(getSocketUrl(), {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Cashier POS WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('Cashier POS WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Cashier POS Socket Handshake Error:', error.message);
    });

    // Real-time events to reload orders list and play notification audio
    const events = [
      'order:created',
      'order:updated',
      'order:pendingApproval',
      'order:approved',
      'order:accepted',
      'order:rejected',
      'order:preparing',
      'order:readyToServe',
      'order:served',
      'order:completed',
      'order:cancelled',
    ];

    // Floor occupancy sync — any table change refreshes the floor map.
    ['table:updated', 'table:created', 'table:removed'].forEach((event) => {
      socket?.on(event, () => {
        useFloorStore.getState().fetchTables();
      });
    });

    // Menu changes (admin edits) refresh the product grid.
    socket.on('menu:updated', () => {
      useMenuStore.getState().fetchMenu();
    });

    // Add-on placed on an existing table's order: the SAME order's total grows
    // in place — no new order row, no re-approval. The cashier is just notified.
    socket.on('order:addon', (payload: any) => {
      useOrderStore.getState().fetchOrders();
      playPendingChime();
      if (showToastMessage) {
        const total =
          typeof payload?.totalPrice === 'number' ? ` — new total ₹${payload.totalPrice}` : '';
        showToastMessage(`Add-on added to Table ${payload?.tableNo || ''}${total}`, 'info');
      }
    });

    events.forEach((event) => {
      socket?.on(event, (payload: any) => {
        console.log(`Cashier POS WebSocket received: ${event}`, payload);

        // Refresh store orders list
        useOrderStore.getState().fetchOrders();

        // Completed bills change today's totals — refresh the dashboard/report.
        if (event === 'order:completed') {
          useReportStore.getState().fetchReport();
        }

        if (event === 'order:pendingApproval') {
          playPendingChime();
          if (showToastMessage) {
            showToastMessage(`New KOT pending approval for Table ${payload.tableNo || ''}`, 'info');
          }
        } else if (event === 'order:updated') {
          // A waiter edited an existing order — notify the cashier.
          playPendingChime();
          if (showToastMessage) {
            const total =
              typeof payload?.totalPrice === 'number' ? ` — new total ₹${payload.totalPrice}` : '';
            showToastMessage(
              `Order for Table ${payload?.tableNo || ''} was edited${total}`,
              'info',
            );
          }
        } else if (event === 'order:readyToServe') {
          if (showToastMessage) {
            showToastMessage(`Table ${payload.tableNo || ''} order is READY!`, 'success');
          }
        } else if (event === 'order:served') {
          // Waiter has served the table — it's now ready for billing.
          playPendingChime();
          if (showToastMessage) {
            showToastMessage(`Ready to bill - Table ${payload.tableNo || ''}`, 'info');
          }
        }
      });
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: () => socket,
};
