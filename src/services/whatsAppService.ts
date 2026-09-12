import { Order, MOCK_RESTAURANT, Restaurant } from '@/mock/data';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { useActivityLogStore } from '@/stores/useActivityLogStore';
import { api } from '@/services/authService.mock';

/**
 * Sanitizes phone number to international E.164 format without '+' symbol for WhatsApp URL.
 * Defaults to Indian country code (91) if 10-digit number provided.
 */
export const sanitizePhoneNumber = (rawPhone: string): string => {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
};

/**
 * Generates a clean, formatted text invoice suitable for WhatsApp messaging.
 */
export const formatWhatsAppBillMessage = (
  order: Order,
  restaurant: Restaurant = MOCK_RESTAURANT,
): string => {
  const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateStr = formatDate(dateObj);
  const timeStr = formatTime(dateObj);

  const lines: string[] = [
    `🧾 *${restaurant.name.toUpperCase()}*`,
    `📍 ${restaurant.branch}`,
    `📞 ${restaurant.phone}`,
    `GSTIN: ${restaurant.gstNumber}`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `*Order:* #${order.orderNumber}`,
    `*Date:* ${dateStr} ${timeStr}`,
    `*Type:* ${(order.type || 'dine-in').toUpperCase()}${order.tableName ? ` • ${order.tableName}` : ''}`,
  ];

  if (order.customerName) {
    lines.push(`*Customer:* ${order.customerName}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`*ITEMS ORDERED:*`);

  order.items.forEach((item) => {
    const itemTotal = formatCurrency(item.product.price * item.quantity);
    lines.push(`• ${item.quantity}x ${item.product.name} — ${itemTotal}`);
    if (item.notes) {
      lines.push(`  _(Note: ${item.notes})_`);
    }
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}`);

  if (order.discount > 0) {
    lines.push(`Discount: -${formatCurrency(order.discount)}`);
  }

  lines.push(`GST (5%): ${formatCurrency(order.gst)}`);
  lines.push(`*Grand Total: ${formatCurrency(order.total)}*`);

  if (order.paymentMethod) {
    lines.push(`Payment Method: *${order.paymentMethod.toUpperCase()}*`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`✨ *Thank you for dining with Sanwariya Cuisine!*`);
  lines.push(`We look forward to serving you again soon.`);

  return lines.join('\n');
};

/**
 * Sends the formatted bill to the customer over WhatsApp via the backend
 * (Twilio). The backend prepends the +91 country code, so we pass the national
 * 10-digit number as `to`.
 */
export const sendBillWhatsApp = async (
  order: Order,
  rawPhone: string,
): Promise<{ success: boolean; sid?: string; error?: string }> => {
  const digits = rawPhone.replace(/\D/g, '');
  const nationalNumber = digits.length > 10 ? digits.slice(-10) : digits;

  if (nationalNumber.length < 10) {
    return {
      success: false,
      error: 'Please enter a valid 10-digit mobile number.',
    };
  }

  const messageText = formatWhatsAppBillMessage(order);

  try {
    const res = await api.post('/whatsapp/send', {
      to: nationalNumber,
      body: messageText,
    });

    // Backend responds { success: true, data: { sid, to, status } }.
    const sid = res.data?.data?.sid as string | undefined;

    useActivityLogStore.getState().logEvent({
      type: 'bill.sentWhatsApp',
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableId: order.tableId,
      tableName: order.tableName,
      customerId: order.customerId,
      customerName: order.customerName,
      payload: {
        recipientPhone: nationalNumber,
        totalAmount: order.total,
        itemCount: order.items.length,
        channel: 'whatsapp_twilio_api',
        messageSid: sid,
      },
    });

    return { success: true, sid };
  } catch (err: any) {
    const message =
      err?.response?.data?.message || err?.message || 'Failed to send WhatsApp bill.';
    return { success: false, error: message };
  }
};
