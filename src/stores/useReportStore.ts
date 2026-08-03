import { create } from 'zustand';
import { ReportData, MOCK_REPORT, Order } from '@/mock/data';

interface ReportState {
  report: ReportData;
  addOrderToReport: (order: Order) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  report: MOCK_REPORT,
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
