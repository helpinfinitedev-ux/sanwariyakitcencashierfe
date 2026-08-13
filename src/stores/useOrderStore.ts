import { create } from 'zustand';
import { Order, OrderStatus, OrderItem, MOCK_ORDERS } from '@/mock/data';
import { useActivityLogStore } from './useActivityLogStore';
import { useCartStore } from './useCartStore';

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
  const gst = Math.round(Math.max(0, subtotal - discount) * 0.18 * 100) / 100;
  const total = Math.round((subtotal + gst - discount) * 100) / 100;
  return { subtotal, gst, total };
}

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, rejectionReason?: string) => void;
  approveAddonOrder: (addonOrderId: string) => void;
  rejectAddonOrder: (addonOrderId: string, rejectionReason: string) => void;
  getApprovedAddonsForOrder: (parentOrderId: string) => Order[];
  completeOrder: (orderId: string, paymentMethod: Order['paymentMethod']) => void;
  cancelOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: MOCK_ORDERS,
  addOrder: (order) => {
    // Standardize order fields
    const standardizedOrder: Order = {
      ...order,
      orderId: order.orderId || order.id,
      tableNumber: order.tableNumber || order.tableName,
    };

    // Emit order.created activity log
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
        isAddon: standardizedOrder.isAddon,
        addonApprovalStatus: standardizedOrder.addonApprovalStatus,
        parentOrderId: standardizedOrder.parentOrderId,
      },
    });

    set((state) => ({
      orders: [standardizedOrder, ...state.orders],
    }));
  },

  updateOrderStatus: (orderId, status, rejectionReason) => {
    const order = get().orders.find((o) => o.id === orderId || o.orderId === orderId);
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

    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId || ord.orderId === orderId
          ? { ...ord, status, rejectionReason: rejectionReason ?? ord.rejectionReason }
          : ord,
      ),
    }));
  },

  approveAddonOrder: (addonOrderId) => {
    const currentOrders = get().orders;
    const addonOrder = currentOrders.find((o) => o.id === addonOrderId || o.orderId === addonOrderId);
    if (!addonOrder) return;

    // Find parent order (either via parentOrderId or finding active non-completed table order)
    const parentOrder = currentOrders.find(
      (o) =>
        !o.isAddon &&
        (o.id === addonOrder.parentOrderId ||
          o.orderId === addonOrder.parentOrderId ||
          (addonOrder.tableId && o.tableId === addonOrder.tableId && o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'rejected')),
    );

    const updatedAddonOrder: Order = {
      ...addonOrder,
      addonApprovalStatus: 'APPROVED',
      status: 'preparing', // Push forward to KDS-bound active orders
      isAddon: true,
      parentOrderId: addonOrder.parentOrderId || parentOrder?.id,
    };

    let updatedOrders = currentOrders.map((ord) =>
      ord.id === addonOrder.id || ord.orderId === addonOrder.id ? updatedAddonOrder : ord,
    );

    // Merge into parent order in orderStore if parent exists
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
        ord.id === parentOrder.id || ord.orderId === parentOrder.id ? updatedParentOrder : ord,
      );
    }

    set({ orders: updatedOrders });

    // Merge into active cart if cart is viewing this table / parent order
    useCartStore.getState().mergeAddonItems(updatedAddonOrder);

    // Audit log
    useActivityLogStore.getState().logEvent({
      type: 'addon.approved',
      orderId: updatedAddonOrder.id,
      orderNumber: updatedAddonOrder.orderNumber,
      tableId: updatedAddonOrder.tableId,
      tableName: updatedAddonOrder.tableName,
      customerId: updatedAddonOrder.customerId,
      customerName: updatedAddonOrder.customerName,
      payload: {
        parentOrderId: updatedAddonOrder.parentOrderId,
        items: updatedAddonOrder.items,
        addonTotal: updatedAddonOrder.total,
        status: 'APPROVED',
      },
    });
  },

  rejectAddonOrder: (addonOrderId, rejectionReason) => {
    const currentOrders = get().orders;
    const addonOrder = currentOrders.find((o) => o.id === addonOrderId || o.orderId === addonOrderId);
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
        ord.id === addonOrder.id || ord.orderId === addonOrder.id ? updatedAddonOrder : ord,
      ),
    });

    // Audit log for Waiter app consumption
    useActivityLogStore.getState().logEvent({
      type: 'addon.rejected',
      orderId: updatedAddonOrder.id,
      orderNumber: updatedAddonOrder.orderNumber,
      tableId: updatedAddonOrder.tableId,
      tableName: updatedAddonOrder.tableName,
      payload: {
        parentOrderId: updatedAddonOrder.parentOrderId,
        reason,
        items: updatedAddonOrder.items,
        waiterId: updatedAddonOrder.waiterId,
        waiterName: updatedAddonOrder.waiterName,
      },
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

  completeOrder: (orderId, paymentMethod) => {
    const currentOrders = get().orders;
    const order = currentOrders.find((o) => o.id === orderId || o.orderId === orderId);
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

    // Complete the parent order AND any approved add-on orders tied to this order/table
    set((state) => ({
      orders: state.orders.map((ord) => {
        const isTargetParent = ord.id === orderId || ord.orderId === orderId;
        const isChildAddon =
          ord.isAddon &&
          (ord.parentOrderId === orderId ||
            (order?.tableId && ord.tableId === order.tableId && ord.status !== 'cancelled' && ord.status !== 'rejected'));

        if (isTargetParent || isChildAddon) {
          return {
            ...ord,
            status: 'completed',
            paymentMethod: paymentMethod || ord.paymentMethod,
          };
        }
        return ord;
      }),
    }));
  },

  cancelOrder: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId || o.orderId === orderId);
    if (order) {
      useActivityLogStore.getState().logEvent({
        type: 'order.cancelled',
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        tableName: order.tableName,
        payload: {
          totalAmount: order.total,
          itemCount: order.items.length,
        },
      });
    }

    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId || ord.orderId === orderId ? { ...ord, status: 'cancelled' } : ord,
      ),
    }));
  },
}));

