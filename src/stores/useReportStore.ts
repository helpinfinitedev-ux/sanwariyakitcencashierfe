import { create } from 'zustand';
import { ReportData, MOCK_REPORT, Order } from '@/mock/data';
import { api } from '@/services/authService.mock';

interface ReportState {
  report: ReportData;
  isLoading: boolean;
  fetchReport: () => Promise<void>;
  addOrderToReport: (order: Order) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  report: MOCK_REPORT,
  isLoading: false,

  // Pulls today's sales + floor analytics from the backend. Payment-method and
  // channel splits are not tracked server-side yet (all orders are dine-in),
  // so those collapse to dine-in / zero rather than mock figures.
  fetchReport: async () => {
    set({ isLoading: true });
    try {
      const [summaryRes, floorRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/floor'),
      ]);
      const s = summaryRes.data.data || {};
      const f = floorRes.data.data || {};
      const revenue = s.revenue || 0;

      set({
        isLoading: false,
        report: {
          salesToday: revenue,
          ordersTodayCount: s.completedOrders || 0,
          activeTablesCount: f.occupied || 0,
          dineInSales: revenue,
          takeawaySales: 0,
          deliverySales: 0,
          cashSales: 0,
          upiSales: 0,
          cardSales: 0,
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
