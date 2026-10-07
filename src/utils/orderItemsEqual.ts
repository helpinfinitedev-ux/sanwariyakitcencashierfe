import type { OrderItem } from '@/mock/data';

// Compare bill lines independently of their display order. Product, notes and
// quantity together identify the backend line that would need to be replaced.
export function areOrderItemsEqual(left: OrderItem[], right: OrderItem[]): boolean {
  if (left.length !== right.length) return false;

  const lineCounts = new Map<string, number>();
  for (const item of left) {
    const key = JSON.stringify([item.product.id, item.notes || '', item.quantity]);
    lineCounts.set(key, (lineCounts.get(key) || 0) + 1);
  }

  for (const item of right) {
    const key = JSON.stringify([item.product.id, item.notes || '', item.quantity]);
    const remaining = lineCounts.get(key);
    if (!remaining) return false;
    if (remaining === 1) lineCounts.delete(key);
    else lineCounts.set(key, remaining - 1);
  }

  return lineCounts.size === 0;
}
