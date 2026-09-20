import { create } from 'zustand';
import { ReportData, Order } from '@/mock/data';
import { api } from '@/services/authService.mock';
import { useOrderStore } from './useOrderStore';

export const EMPTY_REPORT: ReportData = {
  salesToday: 0,
  ordersTodayCount: 0,
  activeTablesCount: 0,
  dineInSales: 0,
  takeawaySales: 0,
  deliverySales: 0,
  cashSales: 0,
  upiSales: 0,
  cardSales: 0,
  categorySales: [],
  popularProducts: [],
};

interface ReportState {
  report: ReportData;
  isLoading: boolean;
  fetchReport: (params?: { from?: string; to?: string }) => Promise<void>;
  addOrderToReport: (order: Order) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  report: EMPTY_REPORT,
  isLoading: false,

  fetchReport: async (params) => {
    set({ isLoading: true });
    try {
      const [summaryRes, floorRes] = await Promise.all([
        api.get('/reports/summary', { params }),
        api.get('/reports/floor'),
      ]);
      const s = summaryRes.data?.data || {};
      const f = floorRes.data?.data || {};

      // Compute channels and payments from real loaded completed orders
      const completedOrders = useOrderStore.getState().orders.filter((o) => o.status === 'completed');
      const dineIn = completedOrders
        .filter((o) => o.type === 'dine-in' || (!o.type && o.tableId))
        .reduce((sum, o) => sum + o.total, 0);
      const takeaway = completedOrders
        .filter((o) => o.type === 'takeaway')
        .reduce((sum, o) => sum + o.total, 0);
      const delivery = completedOrders
        .filter((o) => o.type === 'delivery')
        .reduce((sum, o) => sum + o.total, 0);
      const cash = completedOrders
        .filter((o) => o.paymentMethod === 'cash')
        .reduce((sum, o) => sum + o.total, 0);
      const upi = completedOrders
        .filter((o) => o.paymentMethod === 'upi')
        .reduce((sum, o) => sum + o.total, 0);
      const card = completedOrders
        .filter((o) => o.paymentMethod === 'card')
        .reduce((sum, o) => sum + o.total, 0);

      const computedChannelSum = dineIn + takeaway + delivery;
      const finalRevenue = typeof s.revenue === 'number' && s.revenue > 0 ? s.revenue : computedChannelSum;
      const finalOrdersCount = typeof s.completedOrders === 'number' && s.completedOrders > 0 ? s.completedOrders : completedOrders.length;

      set({
        isLoading: false,
        report: {
          salesToday: finalRevenue,
          ordersTodayCount: finalOrdersCount,
          activeTablesCount: f.occupied || 0,
          dineInSales: dineIn,
          takeawaySales: takeaway,
          deliverySales: delivery,
          cashSales: cash,
          upiSales: upi,
          cardSales: card,
          categorySales: [],
          popularProducts: (s.topProducts || []).map(
            (p: { name: string; quantity: number; revenue: number }) => ({
              name: p.name,
              quantity: p.quantity,
              amount: p.revenue,
            }),
          ),
        },
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addOrderToReport: (order) =>
    set((state) => {
      const updatedReport = { ...state.report };
      updatedReport.salesToday += order.total;
      updatedReport.ordersTodayCount += 1;

      // Update channels
      if (order.type === 'dine-in') updatedReport.dineInSales += order.total;
      else if (order.type === 'takeaway') updatedReport.takeawaySales += order.total;
      else if (order.type === 'delivery') updatedReport.deliverySales += order.total;

      // Update payment methods
      if (order.paymentMethod === 'cash') updatedReport.cashSales += order.total;
      else if (order.paymentMethod === 'upi') updatedReport.upiSales += order.total;
      else if (order.paymentMethod === 'card') updatedReport.cardSales += order.total;

      // Update popular products
      order.items.forEach(({ product, quantity }) => {
        const index = updatedReport.popularProducts.findIndex((p) => p.name === product.name);
        if (index > -1) {
          updatedReport.popularProducts[index].quantity += quantity;
          updatedReport.popularProducts[index].amount += product.price * quantity;
        } else {
          updatedReport.popularProducts.push({
            name: product.name,
            quantity,
            amount: product.price * quantity,
          });
        }
      });

      // Sort popular products by quantity
      updatedReport.popularProducts.sort((a, b) => b.quantity - a.quantity);

      return { report: updatedReport };
    }),
}));
