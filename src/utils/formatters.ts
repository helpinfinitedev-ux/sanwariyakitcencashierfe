/**
 * Formats a numeric value into Indian Rupees (INR) currency representation.
 */
export const formatCurrency = (value: number): string => {
  if (isNaN(value)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formats a Date object or ISO string into a readable date string.
 * Example: '10 Jul 2026'
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a Date object or ISO string into a readable time string.
 * Example: '09:30 AM'
 */
export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Calculates standard GST (CGST 9% + SGST 9% = 18% total).
 */
export const calculateGST = (subtotal: number, rate: number = 0.18): number => {
  return parseFloat((subtotal * rate).toFixed(2));
};

/**
 * Calculates the discount amount.
 * Can be flat value or percentage.
 */
export const calculateDiscount = (
  subtotal: number,
  discountValue: number,
  isPercent: boolean = false,
): number => {
  if (isPercent) {
    return parseFloat(((subtotal * discountValue) / 100).toFixed(2));
  }
  return Math.min(discountValue, subtotal);
};

/**
 * Helper to simulate network latency for loading indicators and async simulations.
 */
export const mockDelay = (ms: number = 800): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generates a unique order ID using the current time.
 */
export const generateOrderId = (): string => {
  return `ord-${Date.now()}`;
};

/**
 * Generates a mock order number starting with SK-.
 */
export const generateOrderNumber = (): string => {
  return `SK-${Math.floor(1000 + Math.random() * 9000)}`;
};
