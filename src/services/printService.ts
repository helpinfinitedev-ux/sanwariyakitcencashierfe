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

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Builds an 80mm-formatted HTML receipt for browser printing. The `@page`
 * size/margins are tuned for a thermal roll so it prints edge-to-edge.
 */
export const buildReceiptHtml = (order: Order): string => {
  const r = formatThermalReceipt(order);
  const itemRows = r.items
    .map(
      (it) =>
        `<tr><td>${escapeHtml(it.name)}${
          it.notes ? `<div class="muted">${escapeHtml(it.notes)}</div>` : ''
        }</td><td class="qty">${it.quantity}</td><td class="amt">${formatCurrency(it.amount)}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(
    r.meta.orderNumber,
  )}</title><style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { width: 80mm; padding: 4mm 3mm; font-family: 'Courier New', ui-monospace, monospace; font-size: 12px; color: #000; }
    .c { text-align: center; }
    .b { font-weight: bold; }
    .lg { font-size: 15px; }
    .muted { font-size: 10px; }
    .row { display: flex; justify-content: space-between; }
    hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; padding: 1px 0; }
    .qty { width: 14%; text-align: center; }
    .amt { text-align: right; white-space: nowrap; }
  </style></head><body>
    <div class="c b lg">${escapeHtml(r.header.restaurantName)}</div>
    <div class="c">${escapeHtml(r.header.branch)}</div>
    <div class="c muted">${escapeHtml(r.header.address)}</div>
    <div class="c muted">Ph: ${escapeHtml(r.header.phone)}</div>
    <div class="c muted">GSTIN: ${escapeHtml(r.header.gstNumber)}</div>
    <hr/>
    <div class="row"><span>Bill: ${escapeHtml(r.meta.orderNumber)}</span><span>${escapeHtml(r.meta.orderType)}</span></div>
    <div class="row"><span>${escapeHtml(r.meta.date)}</span><span>${escapeHtml(r.meta.time)}</span></div>
    ${r.meta.tableName ? `<div>Table: ${escapeHtml(r.meta.tableName)}${r.meta.floorName ? ` (${escapeHtml(r.meta.floorName)})` : ''}</div>` : ''}
    ${r.meta.waiterName ? `<div>Waiter: ${escapeHtml(r.meta.waiterName)}</div>` : ''}
    ${r.meta.customerName ? `<div>Customer: ${escapeHtml(r.meta.customerName)}</div>` : ''}
    <hr/>
    <table>
      <tr class="b"><td>Item</td><td class="qty">Qty</td><td class="amt">Amount</td></tr>
      ${itemRows}
    </table>
    <hr/>
    <div class="row"><span>Subtotal</span><span>${r.totals.subtotal}</span></div>
    <div class="row"><span>Discount</span><span>-${r.totals.discountAmount}</span></div>
    <div class="row"><span>GST (5%)</span><span>${r.totals.gstAmount}</span></div>
    <div class="row b lg"><span>TOTAL</span><span>${r.totals.grandTotal}</span></div>
    <div class="row"><span>Paid via</span><span>${escapeHtml(r.totals.paymentMethod || 'CASH')}</span></div>
    <hr/>
    <div class="c">${escapeHtml(r.footer.thankYouMessage)}</div>
    ${r.footer.fssaiLicense ? `<div class="c muted">${escapeHtml(r.footer.fssaiLicense)}</div>` : ''}
    <div class="c muted">${escapeHtml(r.footer.poweredBy)}</div>
  </body></html>`;
};

/**
 * Prints HTML through a hidden iframe using the browser's print pipeline, which
 * routes to whatever thermal printer is installed on the POS machine. Resolves
 * once the print dialog has been triggered.
 */
const printHtml = (html: string): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      resolve(false);
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      iframe.remove();
      resolve(false);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
      window.setTimeout(() => iframe.remove(), 500);
    };
    iframe.contentWindow.onafterprint = cleanup;

    // Let the iframe lay out before invoking print.
    window.setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        resolve(true);
      } catch {
        resolve(false);
      }
      // Safety cleanup if onafterprint never fires (some browsers).
      window.setTimeout(cleanup, 3000);
    }, 250);
  });

/**
 * Prints the customer bill to the OS-installed thermal printer via the browser.
 */
export const printBill = async (
  order: Order,
  options?: { printerName?: string; copies?: number },
): Promise<{ success: boolean; message: string }> => {
  const copies = options?.copies || 1;
  let printed = false;
  for (let i = 0; i < copies; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    printed = await printHtml(buildReceiptHtml(order));
    if (!printed) break;
  }

  if (!printed) {
    return { success: false, message: 'Printing is not available in this browser.' };
  }

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
