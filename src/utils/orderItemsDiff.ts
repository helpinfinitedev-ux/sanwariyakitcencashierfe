import { OrderItem } from '@/mock/data';

// Diffs the cart against the order's items as they were when editing began,
// returning only the net-new quantity per product+notes line. Mirrors the
// merge rule used by the backend's add-items endpoint (same product + notes
// = one line), so sending this delta there reproduces the cart exactly
// without double-counting quantities that were already persisted.
export function computeAddedItems(
  originalItems: OrderItem[],
  currentItems: OrderItem[],
): { productId: string; quantity: number; notes?: string }[] {
  const added: { productId: string; quantity: number; notes?: string }[] = [];

  for (const cur of currentItems) {
    const original = originalItems.find(
      (o) => o.product.id === cur.product.id && (o.notes || '') === (cur.notes || ''),
    );
    const originalQty = original?.quantity || 0;
    const delta = cur.quantity - originalQty;
    if (delta > 0) {
      added.push({ productId: cur.product.id, quantity: delta, notes: cur.notes });
    }
  }

  return added;
}
