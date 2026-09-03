import { Order, MOCK_RESTAURANT, Restaurant } from '@/mock/data';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { useActivityLogStore } from '@/stores/useActivityLogStore';

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

  lines.push(`GST (18%): ${formatCurrency(order.gst)}`);
  lines.push(`*Grand Total: ${formatCurrency(order.total)}*`);

  if (order.paymentMethod) {
    lines.push(`Payment Method: *${order.paymentMethod.toUpperCase()}*`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`✨ *Thank you for dining with Sanwariya Kitchen!*`);
  lines.push(`We look forward to serving you again soon.`);

  return lines.join('\n');
};

/**
 * Dispatches the formatted WhatsApp bill link.
 */
export const sendBillWhatsApp = async (
  order: Order,
  rawPhone: string,
): Promise<{ success: boolean; url?: string; error?: string }> => {
  const cleanPhone = sanitizePhoneNumber(rawPhone);

  if (!cleanPhone || cleanPhone.length < 10) {
    return {
      success: false,
      error: 'Please enter a valid 10-digit mobile number.',
    };
  }

  const messageText = formatWhatsAppBillMessage(order);
  const encodedMessage = encodeURIComponent(messageText);

  // Use wa.me deep link
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  try {
    const popup = window.open(waUrl, '_blank', 'noopener,noreferrer');

    if (popup) {
      // Log event in activity audit store
      useActivityLogStore.getState().logEvent({
        type: 'bill.sentWhatsApp',
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        tableName: order.tableName,
        customerId: order.customerId,
        customerName: order.customerName,
        payload: {
          recipientPhone: cleanPhone,
          totalAmount: order.total,
          itemCount: order.items.length,
          channel: 'whatsapp_web_api',
        },
      });

      return { success: true, url: waUrl };
    } else {
      return {
        success: false,
        error: 'WhatsApp is not installed or available on this device.',
      };
    }
  } catch (err: any) {
    // Fallback for browsers that initially deny a popup request.
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      useActivityLogStore.getState().logEvent({
        type: 'bill.sentWhatsApp',
        orderId: order.id,
        orderNumber: order.orderNumber,
        payload: {
          recipientPhone: cleanPhone,
          totalAmount: order.total,
        },
      });
      return { success: true, url: waUrl };
    } catch {
      return {
        success: false,
        error: err?.message || 'Unable to open WhatsApp.',
      };
    }
  }
};
