import { create } from 'zustand';
import { Order, OrderStatus, OrderItem, AddonApprovalStatus } from '@/mock/data';
import { useActivityLogStore } from './useActivityLogStore';
import { useCartStore } from './useCartStore';
import { api } from '@/services/authService.mock';

const mapBackendStatusToPosStatus = (status: string): OrderStatus => {
  switch (status) {
    case 'pendingApproval':
      return 'pending';
    case 'approved':
      return 'accepted';
    case 'preparing':
      return 'preparing';
    case 'readyToServe':
      return 'ready';
    case 'served':
      return 'billing';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};

const mapBackendOrderItemToPosOrderItem = (item: any): OrderItem => {
  // `item.product` is usually just an ObjectId (the /orders list doesn't
  // populate products). The order item carries snapshot `name`/`price` taken
  // at add-time, so those are the source of truth for display.
  const populated = typeof item.product === 'object' && item.product ? item.product : null;
  const productId = populated ? populated._id || populated.id : item.product;

  return {
    product: {
      id: productId || '',
      categoryId: populated?.category || 'uncategorized',
      name: item.name || populated?.name || 'Item',
      price: item.price ?? populated?.price ?? 0,
      description: populated?.description || '',
      isVeg: populated?.foodType === 'veg',
      isAvailable: populated?.isAvailable ?? true,
      image: populated?.imageUrl || undefined,
    },
    quantity: item.quantity || 1,
    notes: item.notes || '',
  };
};

const mapBackendOrderToPosOrder = (order: any): Order => {
  const waiterName = order.waiter?.name || 'Waiter';
  const waiterId = order.waiter?._id || order.waiter || '';
  const items = (order.items || []).map(mapBackendOrderItemToPosOrderItem);

  return {
    id: order._id || order.id,
    orderId: order._id || order.id,
    orderNumber: order.liveOrderId || 'KOT-000',
    tableId: order.tableNo || '1',
    tableName: `Table ${order.tableNo || '1'}`,
    tableNumber: order.tableNo || '1',
    waiterId,
    waiterName,
    customerName: order.customerName || `Table ${order.tableNo}`,
    customerId: 'cust-1',
    items,
    subtotal: order.subtotal || 0,
    gst: order.tax || 0,
    discount: order.discount || 0,
    total: order.totalPrice || 0,
    status: mapBackendStatusToPosStatus(order.status),
    type: 'dine-in',
    createdAt: order.createdAt || new Date().toISOString(),
    rejectionReason: order.rejectionReason,
  };
};

function combineOrderItems(existing: OrderItem[], newItems: OrderItem[]): OrderItem[] {
  const merged: OrderItem[] = existing.map((item) => ({ ...item }));
  for (const item of newItems) {
    const existingIndex = merged.findIndex(
      (m) => m.product.id === item.product.id && (m.notes || '') === (item.notes || '')
    );
    if (existingIndex > -1) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: merged[existingIndex].quantity + item.quantity,
      };
    } else {
      merged.push({ ...item });
    }
  }
  return merged;
}

function calculateOrderTotals(items: OrderItem[], discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const gst = Math.round(Math.max(0, subtotal - discount) * 0.05 * 100) / 100; // 5% backend GST
  const total = Math.round((subtotal + gst - discount) * 100) / 100;
  return { subtotal, gst, total };
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, patch: Partial<Order>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, rejectionReason?: string) => Promise<void>;
  approveAddonOrder: (addonOrderId: string) => void;
  rejectAddonOrder: (addonOrderId: string, rejectionReason: string) => void;
  getApprovedAddonsForOrder: (parentOrderId: string) => Order[];
  completeOrder: (orderId: string, paymentMethod: Order['paymentMethod']) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/orders');
      const backendOrders = response.data.data || [];
      const mappedOrders = backendOrders.map(mapBackendOrderToPosOrder);
      set({ orders: mappedOrders, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch active orders', isLoading: false });
    }
  },

  addOrder: (order) => {
    const standardizedOrder: Order = {
      ...order,
      orderId: order.orderId || order.id,
      tableNumber: order.tableNumber || order.tableName,
    };

    useActivityLogStore.getState().logEvent({
      type: 'order.created',
      orderId: standardizedOrder.id,
      orderNumber: standardizedOrder.orderNumber,
      tableId: standardizedOrder.tableId,
      tableName: standardizedOrder.tableName,
      customerId: standardizedOrder.customerId,
      customerName: standardizedOrder.customerName,
      payload: {
        itemsCount: standardizedOrder.items.length,
        subtotal: standardizedOrder.subtotal,
        total: standardizedOrder.total,
        type: standardizedOrder.type,
      },
    });

    set((state) => ({
      orders: [standardizedOrder, ...state.orders],
    }));
  },

  // Local edit of an existing order (items/totals/table/customer). Preserves
  // the order's identity and status — used by the cashier "Edit Order" flow.
  updateOrder: (orderId, patch) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o)),
    }));

    const updated = get().orders.find((o) => o.id === orderId);
    if (updated) {
      useActivityLogStore.getState().logEvent({
        type: 'order.updated',
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        tableId: updated.tableId,
        tableName: updated.tableName,
        payload: {
          itemsCount: updated.items.length,
          subtotal: updated.subtotal,
          total: updated.total,
        },
      });
    }
  },

  updateOrderStatus: async (orderId, status, rejectionReason) => {
    try {
      if (status === 'accepted') {
        // Cashier approves KOT order -> transitions backend to 'approved'
        await api.post(`/orders/${orderId}/approve`);
      } else if (status === 'rejected' || status === 'pending') {
        // Cashier rejects or sends back to waiter draft -> transitions backend to 'draft'
        await api.post(`/orders/${orderId}/send-back`, { reason: rejectionReason || 'Cashier sent back' });
      } else if (status === 'cancelled') {
        await api.post(`/orders/${orderId}/cancel`, { reason: rejectionReason || 'Cashier cancelled' });
      }

      // Refresh list
      await get().fetchOrders();

      const order = get().orders.find((o) => o.id === orderId);
      if (order && status === 'rejected') {
        useActivityLogStore.getState().logEvent({
          type: 'order.cancelled',
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableId: order.tableId,
          tableName: order.tableName,
          payload: {
            reason: rejectionReason || 'Rejected by cashier',
          },
        });
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  },

  approveAddonOrder: (addonOrderId) => {
    const currentOrders = get().orders;
    const addonOrder = currentOrders.find((o) => o.id === addonOrderId);
    if (!addonOrder) return;

    const parentOrder = currentOrders.find(
      (o) =>
        !o.isAddon &&
        (o.id === addonOrder.parentOrderId ||
          (addonOrder.tableId && o.tableId === addonOrder.tableId && o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'rejected')),
    );

    const updatedAddonOrder: Order = {
      ...addonOrder,
      addonApprovalStatus: 'APPROVED',
      status: 'preparing',
      isAddon: true,
      parentOrderId: addonOrder.parentOrderId || parentOrder?.id,
    };

    let updatedOrders = currentOrders.map((ord) =>
      ord.id === addonOrder.id ? updatedAddonOrder : ord,
    );

    if (parentOrder) {
      const mergedItems = combineOrderItems(parentOrder.items, addonOrder.items);
      const totals = calculateOrderTotals(mergedItems, parentOrder.discount);
      const updatedParentOrder: Order = {
        ...parentOrder,
        items: mergedItems,
        subtotal: totals.subtotal,
        gst: totals.gst,
        total: totals.total,
      };

      updatedOrders = updatedOrders.map((ord) =>
        ord.id === parentOrder.id ? updatedParentOrder : ord,
      );
    }

    set({ orders: updatedOrders });
    useCartStore.getState().mergeAddonItems(updatedAddonOrder);
  },

  rejectAddonOrder: (addonOrderId, rejectionReason) => {
    const currentOrders = get().orders;
    const addonOrder = currentOrders.find((o) => o.id === addonOrderId);
    if (!addonOrder) return;

    const reason = rejectionReason.trim() || 'Rejected by Cashier';

    const updatedAddonOrder: Order = {
      ...addonOrder,
      addonApprovalStatus: 'REJECTED',
      status: 'rejected',
      rejectionReason: reason,
    };

    set({
      orders: currentOrders.map((ord) =>
        ord.id === addonOrder.id ? updatedAddonOrder : ord,
      ),
    });
  },

  getApprovedAddonsForOrder: (parentOrderId) => {
    return get().orders.filter(
      (o) =>
        o.isAddon &&
        o.addonApprovalStatus === 'APPROVED' &&
        (o.parentOrderId === parentOrderId || o.id === parentOrderId),
    );
  },

  completeOrder: async (orderId, paymentMethod) => {
    try {
      await api.post(`/orders/${orderId}/complete`);
      await get().fetchOrders();

      const order = get().orders.find((o) => o.id === orderId);
      if (order) {
        useActivityLogStore.getState().logEvent({
          type: 'payment.completed',
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableId: order.tableId,
          tableName: order.tableName,
          customerId: order.customerId,
          customerName: order.customerName,
          payload: {
            paymentMethod: paymentMethod || order.paymentMethod || 'cash',
            amount: order.total,
            subtotal: order.subtotal,
            discount: order.discount,
            gst: order.gst,
          },
        });
      }
    } catch (err) {
      console.error('Failed to complete order billing:', err);
    }
  },

  cancelOrder: async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: 'Voided by cashier' });
      await get().fetchOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  },
}));
