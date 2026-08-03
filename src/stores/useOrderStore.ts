import { create } from 'zustand';
import { Order, OrderStatus, MOCK_ORDERS } from '@/mock/data';

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, rejectionReason?: string) => void;
  completeOrder: (orderId: string, paymentMethod: Order['paymentMethod']) => void;
  cancelOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: MOCK_ORDERS,
  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),
  updateOrderStatus: (orderId, status, rejectionReason) =>
    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId ? { ...ord, status, rejectionReason: rejectionReason ?? ord.rejectionReason } : ord,
      ),
    })),
  completeOrder: (orderId, paymentMethod) =>
    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId ? { ...ord, status: 'completed', paymentMethod } : ord,
      ),
    })),
  cancelOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId ? { ...ord, status: 'cancelled' } : ord,
      ),
    })),
}));
