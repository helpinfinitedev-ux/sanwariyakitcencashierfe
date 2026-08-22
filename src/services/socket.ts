import { io, Socket } from 'socket.io-client';
import { useOrderStore } from '@/stores/useOrderStore';

let socket: Socket | null = null;

// Determine central backend socket host
const getSocketUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!envUrl || envUrl === 'mock_api_url') {
    return 'http://localhost:5000';
  }
  // Strip trailing '/api' from connection URL if present
  return envUrl.endsWith('/api') ? envUrl.slice(0, -4) : envUrl;
};

export const socketService = {
  connect: (token: string, showToastMessage?: (msg: string, type: 'success' | 'error' | 'info') => void) => {
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

    events.forEach((event) => {
      socket?.on(event, (payload: any) => {
        console.log(`Cashier POS WebSocket received: ${event}`, payload);
        
        // Refresh store orders list
        useOrderStore.getState().fetchOrders();

        if (event === 'order:pendingApproval') {
          if (showToastMessage) {
            showToastMessage(`New KOT pending approval for Table ${payload.tableNo || ''}`, 'info');
          }
        } else if (event === 'order:readyToServe') {
          if (showToastMessage) {
            showToastMessage(`Table ${payload.tableNo || ''} order is READY!`, 'success');
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
