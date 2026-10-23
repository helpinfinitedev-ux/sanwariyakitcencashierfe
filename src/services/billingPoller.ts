import { useOrderStore } from '@/stores/useOrderStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { useCashierNotificationStore } from '@/stores/useCashierNotificationStore';

type ToastFn = (msg: string, type: 'success' | 'error' | 'info') => void;

// The cashier POS no longer holds a Socket.IO connection. A persistent socket
// is a long-lived in-flight request, which Cloud Run bills at the active-CPU
// rate for the entire shift (it was ~78% of the backend bill). Short REST polls
// cost a tiny fraction of that. Orders + floor are the two surfaces the cashier
// actually works from, so we refresh both here; reports/menu refresh on
// navigation. The only alert the cashier needs is "ready to bill".
const POLL_INTERVAL_MS = 20000;

let timer: ReturnType<typeof setInterval> | null = null;
// Order ids already announced as ready-to-bill, so the alert fires exactly once
// per order — and never replays for orders that were already served at login.
let announced = new Set<string>();
let primed = false;

// Short chime when a table becomes ready to bill.
function playReadyChime() {
  try {
    const player = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
    player.volume = 0.7;
    void player.play();
  } catch (error) {
    console.warn('Cashier chime failed:', error);
  }
}

async function tick(showToast?: ToastFn) {
  // Refresh the cashier's working data over REST.
  await Promise.allSettled([
    useOrderStore.getState().fetchOrders(),
    useFloorStore.getState().fetchTables(),
  ]);

  // An order is "ready to bill" once the waiter has served it (POS status
  // `billing`). Announce each such order once, on its first appearance.
  const readyToBill = useOrderStore.getState().orders.filter((o) => o.status === 'billing');

  if (!primed) {
    // First poll after login: seed everything already served as known baseline
    // so we don't replay a backlog of alerts on connect.
    readyToBill.forEach((o) => announced.add(o.id));
    primed = true;
    return;
  }

  for (const order of readyToBill) {
    if (announced.has(order.id)) continue;
    announced.add(order.id);

    useCashierNotificationStore.getState().pushNotification({
      type: 'ready_to_bill',
      title: 'Ready to Bill',
      description: `${order.tableName || 'Table'} order #${
        order.orderNumber || ''
      } has been served and is ready to bill.`,
      route: 'orders',
    });
    playReadyChime();
    showToast?.(`Ready to bill — ${order.tableName || ''}`, 'info');
  }
}

export const billingPoller = {
  start: (showToast?: ToastFn) => {
    billingPoller.stop();
    announced = new Set();
    primed = false;
    // Run once immediately so the baseline is seeded without waiting a cycle.
    void tick(showToast);
    timer = setInterval(() => void tick(showToast), POLL_INTERVAL_MS);
  },

  stop: () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    announced = new Set();
    primed = false;
  },
};
