import { create } from 'zustand';
import { Product, OrderItem, OrderType, Order } from '@/mock/data';
import { calculateGST, calculateDiscount } from '@/utils/formatters';
import { useActivityLogStore } from './useActivityLogStore';

interface CartState {
  cartItems: OrderItem[];
  selectedTableId?: string;
  selectedTableName?: string;
  selectedFloorId?: string;
  selectedFloorName?: string;
  selectedWaiterId?: string;
  selectedWaiterName?: string;
  selectedCustomerId?: string;
  selectedCustomerName?: string;
  selectedCustomerPhone?: string;
  discount: number;
  discountIsPercent: boolean;
  orderType: OrderType;
  editingOrderId?: string;

  // Actions
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  selectTable: (tableId?: string, tableName?: string, floorId?: string, floorName?: string) => void;
  selectWaiter: (waiterId?: string, waiterName?: string) => void;
  selectCustomer: (customerId?: string, customerName?: string, customerPhone?: string) => void;
  setDiscount: (value: number, isPercent?: boolean) => void;
  setOrderType: (type: OrderType) => void;
  loadOrderIntoCart: (order: Order) => void;
  mergeAddonItems: (addonOrder: Order) => void;
  clearCart: () => void;
  getCalculations: () => {
    subtotal: number;
    discountAmount: number;
    gst: number;
    total: number;
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  selectedTableId: undefined,
  selectedTableName: undefined,
  selectedFloorId: undefined,
  selectedFloorName: undefined,
  selectedWaiterId: undefined,
  selectedWaiterName: undefined,
  selectedCustomerId: undefined,
  selectedCustomerName: undefined,
  selectedCustomerPhone: undefined,
  discount: 0,
  discountIsPercent: false,
  orderType: 'takeaway',
  editingOrderId: undefined,

  addToCart: (product, quantity = 1, notes) => {
    // Emit order.itemAdded activity event
    const { selectedTableId, selectedTableName, selectedCustomerId, selectedCustomerName, editingOrderId } = get();
    useActivityLogStore.getState().logEvent({
      type: 'order.itemAdded',
      orderId: editingOrderId,
      tableId: selectedTableId,
      tableName: selectedTableName,
      customerId: selectedCustomerId,
      customerName: selectedCustomerName,
      payload: {
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        notes,
      },
    });

    set((state) => {
      const existingItemIndex = state.cartItems.findIndex((item) => item.product.id === product.id);

      if (existingItemIndex > -1) {
        const updatedItems = [...state.cartItems];
        updatedItems[existingItemIndex].quantity += quantity;
        if (notes !== undefined) {
          updatedItems[existingItemIndex].notes = notes;
        }
        return { cartItems: updatedItems };
      }

      return {
        cartItems: [...state.cartItems, { product, quantity, notes }],
      };
    });
  },

  removeFromCart: (productId) =>
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.product.id !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          cartItems: state.cartItems.filter((item) => item.product.id !== productId),
        };
      }
      return {
        cartItems: state.cartItems.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        ),
      };
    }),

  updateNotes: (productId, notes) =>
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.product.id === productId ? { ...item, notes } : item,
      ),
    })),

  selectTable: (tableId, tableName, floorId, floorName) =>
    set({
      selectedTableId: tableId,
      selectedTableName: tableName,
      selectedFloorId: floorId,
      selectedFloorName: floorName,
      // Default to dine-in if table is selected
      orderType: tableId ? 'dine-in' : 'takeaway',
    }),

  selectWaiter: (waiterId, waiterName) =>
    set({ selectedWaiterId: waiterId, selectedWaiterName: waiterName }),

  selectCustomer: (customerId, customerName, customerPhone) => {
    if (customerId) {
      const { selectedTableId, selectedTableName, editingOrderId } = get();
      useActivityLogStore.getState().logEvent({
        type: 'customer.linked',
        orderId: editingOrderId,
        tableId: selectedTableId,
        tableName: selectedTableName,
        customerId,
        customerName,
        payload: {
          phone: customerPhone,
        },
      });
    }

    set({
      selectedCustomerId: customerId,
      selectedCustomerName: customerName,
      selectedCustomerPhone: customerPhone,
    });
  },

  setDiscount: (value, isPercent = false) => set({ discount: value, discountIsPercent: isPercent }),

  setOrderType: (orderType) =>
    set((state) => ({
      orderType,
      // Clear table if shifting to takeaway/delivery
      selectedTableId: orderType === 'dine-in' ? state.selectedTableId : undefined,
      selectedTableName: orderType === 'dine-in' ? state.selectedTableName : undefined,
    })),

  loadOrderIntoCart: (order) => {
    set({
      cartItems: [...order.items],
      selectedTableId: order.tableId,
      selectedTableName: order.tableName,
      selectedFloorName: order.floorName,
      selectedWaiterId: order.waiterId,
      selectedWaiterName: order.waiterName,
      selectedCustomerId: order.customerId,
      selectedCustomerName: order.customerName,
      selectedCustomerPhone: order.customerPhone,
      discount: order.discount,
      discountIsPercent: false, // Order object uses flat discount amount
      orderType: order.type,
      editingOrderId: order.id,
    });
  },

  mergeAddonItems: (addonOrder) => {
    const state = get();
    const isMatchingTable = !!(state.selectedTableId && state.selectedTableId === addonOrder.tableId);
    const isMatchingOrder = !!(
      state.editingOrderId &&
      (state.editingOrderId === addonOrder.parentOrderId || state.editingOrderId === addonOrder.id)
    );

    if (isMatchingTable || isMatchingOrder) {
      const updatedCartItems = [...state.cartItems];
      for (const addonItem of addonOrder.items) {
        const existingIdx = updatedCartItems.findIndex(
          (item) =>
            item.product.id === addonItem.product.id &&
            (item.notes || '') === (addonItem.notes || '')
        );
        if (existingIdx > -1) {
          updatedCartItems[existingIdx] = {
            ...updatedCartItems[existingIdx],
            quantity: updatedCartItems[existingIdx].quantity + addonItem.quantity,
          };
        } else {
          updatedCartItems.push({ ...addonItem });
        }
      }
      set({ cartItems: updatedCartItems });
    }
  },

  clearCart: () =>
    set({
      cartItems: [],
      selectedTableId: undefined,
      selectedTableName: undefined,
      selectedFloorId: undefined,
      selectedFloorName: undefined,
      selectedWaiterId: undefined,
      selectedWaiterName: undefined,
      selectedCustomerId: undefined,
      selectedCustomerName: undefined,
      selectedCustomerPhone: undefined,
      discount: 0,
      discountIsPercent: false,
      orderType: 'dine-in',
      editingOrderId: undefined,
    }),

  getCalculations: () => {
    const { cartItems, discount, discountIsPercent } = get();
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discountAmount = calculateDiscount(subtotal, discount, discountIsPercent);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const gst = calculateGST(taxableAmount); // 18% standard
    const total = parseFloat((taxableAmount + gst).toFixed(2));

    return {
      subtotal,
      discountAmount,
      gst,
      total,
    };
  },
}));
