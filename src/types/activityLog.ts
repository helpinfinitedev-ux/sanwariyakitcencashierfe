export type ActivityEventType =
  | 'order.created'
  | 'order.itemAdded'
  | 'order.cancelled'
  | 'payment.completed'
  | 'bill.printed'
  | 'bill.sentWhatsApp'
  | 'table.statusChanged'
  | 'customer.linked'
  | 'addon.approved'
  | 'addon.rejected';

export interface ActivityLogEvent {
  id: string;
  type: ActivityEventType;
  timestamp: string; // ISO 8601 string
  orderId?: string;
  orderNumber?: string;
  tableId?: string;
  tableName?: string;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  storeId: string;
  storeName: string;
  payload: Record<string, any>;
}

export type TimeRangeFilter = 'today' | 'week' | 'month' | 'all';
