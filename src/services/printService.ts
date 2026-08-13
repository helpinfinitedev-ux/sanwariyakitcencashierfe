import { Order, MOCK_RESTAURANT, Restaurant } from '@/mock/data';
import { formatCurrency, formatDate, formatTime, mockDelay } from '@/utils/formatters';
import { useActivityLogStore } from '@/stores/useActivityLogStore';

export interface ThermalReceiptLine {
  text: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  size?: 'normal' | 'large';
}

export interface FormattedReceipt {
  header: {
    restaurantName: string;
    branch: string;
    address: string;
    phone: string;
    gstNumber: string;
  };
  meta: {
    orderNumber: string;
    date: string;
    time: string;
    orderType: string;
    tableName?: string;
    floorName?: string;
    waiterName?: string;
    customerName?: string;
    customerPhone?: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
    amount: number;
    notes?: string;
  }[];
  totals: {
    subtotal: string;
    discountAmount: string;
    gstAmount: string;
    grandTotal: string;
    paymentMethod?: string;
  };
  footer: {
    thankYouMessage: string;
    fssaiLicense?: string;
    poweredBy: string;
  };
}

/**
 * Formats order data into structured 80mm receipt data representation.
 */
export const formatThermalReceipt = (
  order: Order,
  restaurant: Restaurant = MOCK_RESTAURANT,
): FormattedReceipt => {
  const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();

  return {
    header: {
      restaurantName: restaurant.name.toUpperCase(),
      branch: restaurant.branch,
      address: restaurant.address,
      phone: restaurant.phone,
      gstNumber: restaurant.gstNumber,
    },
    meta: {
      orderNumber: order.orderNumber,
      date: formatDate(dateObj),
      time: formatTime(dateObj),
      orderType: (order.type || 'dine-in').toUpperCase(),
      tableName: order.tableName,
      floorName: order.floorName,
      waiterName: order.waiterName,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    },
    items: order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      amount: item.product.price * item.quantity,
      notes: item.notes,
    })),
    totals: {
      subtotal: formatCurrency(order.subtotal),
      discountAmount: order.discount > 0 ? formatCurrency(order.discount) : '₹0.00',
      gstAmount: formatCurrency(order.gst),
      grandTotal: formatCurrency(order.total),
      paymentMethod: (order.paymentMethod || 'CASH').toUpperCase(),
    },
    footer: {
      thankYouMessage: '*** THANK YOU! VISIT AGAIN ***',
      fssaiLicense: 'FSSAI Lic No: 12821019000456',
      poweredBy: 'Sanwariya POS Thermal Core v1.0',
    },
  };
};

/**
 * Service to simulate thermal bill printing (80mm ESC/POS).
 * Can be swapped with native USB/Bluetooth/Network ESC/POS SDK without altering UI.
 */
export const printBill = async (
  order: Order,
  options?: { printerName?: string; copies?: number },
): Promise<{ success: boolean; message: string }> => {
  // Simulate driver spooling time
  await mockDelay(600);

  // Log activity event
  useActivityLogStore.getState().logEvent({
    type: 'bill.printed',
    orderId: order.id,
    orderNumber: order.orderNumber,
    tableId: order.tableId,
    tableName: order.tableName,
    customerId: order.customerId,
    customerName: order.customerName,
    payload: {
      printer: options?.printerName || 'Default 80mm Thermal Printer',
      paperWidth: '80mm',
      copies: options?.copies || 1,
      totalAmount: order.total,
      paymentMethod: order.paymentMethod,
    },
  });

  return {
    success: true,
    message: `Receipt for ${order.orderNumber} sent to thermal printer.`,
  };
};

/**
 * Service to simulate KOT (Kitchen Order Ticket) printing.
 */
export const printKOT = async (
  order: Order,
): Promise<{ success: boolean; message: string }> => {
  await mockDelay(400);

  return {
    success: true,
    message: `KOT for ${order.orderNumber} sent to Kitchen Printer.`,
  };
};
