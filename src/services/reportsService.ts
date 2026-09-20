import { Order, Customer, ReportData, MOCK_RESTAURANT } from '@/mock/data';
import { ActivityLogEvent, TimeRangeFilter } from '@/types/activityLog';

export type { TimeRangeFilter };

export interface SalesSummaryAggregate {
  totalRevenue: number;
  ordersCount: number;
  avgOrderValue: number;
  grossSales: number;
  totalDiscount: number;
  totalGst: number;
  dineInRevenue: number;
  takeawayRevenue: number;
  deliveryRevenue: number;
}

export interface PaymentBreakdownItem {
  method: 'cash' | 'upi' | 'card';
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface CustomerActivityAggregate {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastVisit: string;
  points: number;
}

export interface BillDeliveryLogItem {
  id: string;
  orderId: string;
  orderNumber: string;
  channel: 'print' | 'whatsapp';
  recipient?: string;
  timestamp: string;
  cashierName: string;
  amount: number;
}

export interface AdminReportData {
  timeRange: TimeRangeFilter;
  salesSummary: SalesSummaryAggregate;
  paymentBreakdown: PaymentBreakdownItem[];
  customerActivity: CustomerActivityAggregate[];
  recentOrders: Order[];
  billDeliveryLogs: BillDeliveryLogItem[];
  billDeliverySummary: {
    totalPrinted: number;
    totalWhatsApp: number;
    totalDeliveries: number;
  };
}

/**
 * Filter orders and events based on selected time range.
 */
const filterByDate = <T extends { createdAt?: string; timestamp?: string }>(
  items: T[],
  range: TimeRangeFilter,
): T[] => {
  if (range === 'all') return items;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let cutoffDate = startOfDay;

  if (range === 'week') {
    // Current calendar week (Monday to today)
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
  } else if (range === 'month') {
    // Current calendar month (1st of month to today)
    cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return items.filter((item) => {
    const rawDate = item.createdAt || item.timestamp;
    if (!rawDate) return false;
    const itemDate = new Date(rawDate);
    return itemDate >= cutoffDate;
  });
};

/**
 * Main report aggregation engine.
 */
export const getAdminReportData = (
  timeRange: TimeRangeFilter,
  orders: Order[],
  activityEvents: ActivityLogEvent[],
  customers: Customer[],
  baseReport: ReportData,
): AdminReportData => {
  const filteredOrders = filterByDate(orders, timeRange);
  const completedOrders = filteredOrders.filter((o) => o.status === 'completed');

  // 1. Sales Summary calculation from real completed orders
  let totalRevenue = 0;
  let grossSales = 0;
  let totalDiscount = 0;
  let totalGst = 0;
  let dineInRevenue = 0;
  let takeawayRevenue = 0;
  let deliveryRevenue = 0;

  completedOrders.forEach((o) => {
    totalRevenue += o.total;
    grossSales += o.subtotal;
    totalDiscount += o.discount;
    totalGst += o.gst;

    if (o.type === 'takeaway') {
      takeawayRevenue += o.total;
    } else if (o.type === 'delivery') {
      deliveryRevenue += o.total;
    } else {
      dineInRevenue += o.total;
    }
  });

  const ordersCount = completedOrders.length;
  const avgOrderValue = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

  const salesSummary: SalesSummaryAggregate = {
    totalRevenue,
    ordersCount,
    avgOrderValue,
    grossSales,
    totalDiscount,
    totalGst,
    dineInRevenue,
    takeawayRevenue,
    deliveryRevenue,
  };

  // 2. Payment Method Breakdown strictly from real orders
  let cashAmt = 0;
  let cashCount = 0;
  let upiAmt = 0;
  let upiCount = 0;
  let cardAmt = 0;
  let cardCount = 0;

  completedOrders.forEach((o) => {
    if (o.paymentMethod === 'cash') {
      cashAmt += o.total;
      cashCount++;
    } else if (o.paymentMethod === 'upi') {
      upiAmt += o.total;
      upiCount++;
    } else if (o.paymentMethod === 'card') {
      cardAmt += o.total;
      cardCount++;
    }
  });

  const grandPaid = cashAmt + upiAmt + cardAmt;

  const paymentBreakdown: PaymentBreakdownItem[] = [
    {
      method: 'cash',
      label: 'Cash Tender',
      amount: cashAmt,
      count: cashCount,
      percentage: grandPaid > 0 ? Math.round((cashAmt / grandPaid) * 100) : 0,
    },
    {
      method: 'upi',
      label: 'UPI QR Scan',
      amount: upiAmt,
      count: upiCount,
      percentage: grandPaid > 0 ? Math.round((upiAmt / grandPaid) * 100) : 0,
    },
    {
      method: 'card',
      label: 'Card Machine',
      amount: cardAmt,
      count: cardCount,
      percentage: grandPaid > 0 ? Math.round((cardAmt / grandPaid) * 100) : 0,
    },
  ];

  // 3. Customer Activity Aggregates strictly from real order history
  const customerActivity: CustomerActivityAggregate[] = customers.map((cust) => {
    const custOrders = orders.filter((o) => o.customerId === cust.id && o.status === 'completed');
    const spent = custOrders.reduce((sum, o) => sum + o.total, 0);
    const lastOrder = custOrders[0];

    return {
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
      orderCount: custOrders.length,
      totalSpent: spent,
      lastVisit: lastOrder?.createdAt || '',
      points: cust.points,
    };
  });

  // Sort customers by total spend descending
  customerActivity.sort((a, b) => b.totalSpent - a.totalSpent);

  // 4. Bill Delivery Logs (from activity log events)
  const deliveryEvents = activityEvents.filter(
    (e) => e.type === 'bill.printed' || e.type === 'bill.sentWhatsApp',
  );

  const billDeliveryLogs: BillDeliveryLogItem[] = deliveryEvents.map((e) => ({
    id: e.id,
    orderId: e.orderId || 'ord-unknown',
    orderNumber: e.orderNumber || 'SK-????',
    channel: e.type === 'bill.printed' ? 'print' : 'whatsapp',
    recipient: e.payload?.recipientPhone || e.payload?.printer || '80mm Thermal Printer',
    timestamp: e.timestamp,
    cashierName: e.cashierName,
    amount: e.payload?.totalAmount || 0,
  }));

  const totalPrinted = billDeliveryLogs.filter((d) => d.channel === 'print').length;
  const totalWhatsApp = billDeliveryLogs.filter((d) => d.channel === 'whatsapp').length;

  return {
    timeRange,
    salesSummary,
    paymentBreakdown,
    customerActivity,
    recentOrders: filteredOrders,
    billDeliveryLogs,
    billDeliverySummary: {
      totalPrinted,
      totalWhatsApp,
      totalDeliveries: billDeliveryLogs.length,
    },
  };
};

/**
 * Formats a full audit payload for export as JSON (sync packet).
 */
export const generateSyncExportPayload = (
  reportData: AdminReportData,
  events: ActivityLogEvent[],
): string => {
  const exportObject = {
    metadata: {
      version: '1.0.0',
      exportTimestamp: new Date().toISOString(),
      storeId: MOCK_RESTAURANT.id,
      storeName: MOCK_RESTAURANT.name,
      branch: MOCK_RESTAURANT.branch,
      filterRange: reportData.timeRange,
    },
    analyticsSummary: reportData.salesSummary,
    paymentBreakdown: reportData.paymentBreakdown,
    customerInsights: reportData.customerActivity,
    billDeliverySummary: reportData.billDeliverySummary,
    orderRecords: reportData.recentOrders,
    rawActivityAuditLogs: events,
  };

  return JSON.stringify(exportObject, null, 2);
};
