import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { useCashierNotificationStore } from '@/stores/useCashierNotificationStore';
import { formatDate, formatTime, formatCurrency } from '@/utils/formatters';
import { MOCK_RESTAURANT, MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_WAITERS, Order } from '@/mock/data';
import { Badge } from '@/components/ui/Badge';

export interface HeaderProps {
  showToastMessage?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate?: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ showToastMessage, onNavigate }) => {
  const { themeMode, toggleTheme } = useSettingsStore();
  const { user, currentUser } = useAuthStore();
  const colors = COLORS[themeMode];

  // Bell feed: ready-to-bill alerts (waiter served an order) live here.
  const notifications = useCashierNotificationStore((s) => s.notifications);
  const markAllRead = useCashierNotificationStore((s) => s.markAllRead);
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const openNotifications = () => {
    setShowNotifications(true);
    markAllRead();
  };

  const handleNotificationPress = (route?: string) => {
    setShowNotifications(false);
    if (route && onNavigate) onNavigate(route);
  };

  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const { orders, addOrder, updateOrderStatus, approveAddonOrder, rejectAddonOrder, cancelOrder } =
    useOrderStore();
  const { tables, updateTableStatus } = useFloorStore();

  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState(false);

  const pendingOrders = orders.filter(
    (o) => o.status === 'pending' || o.addonApprovalStatus === 'PENDING_CASHIER_APPROVAL',
  );

  const handleAcceptOrder = (order: Order) => {
    const isAddon = order.isAddon || order.addonApprovalStatus === 'PENDING_CASHIER_APPROVAL';
    if (isAddon) {
      approveAddonOrder(order.id);
      if (showToastMessage) {
        showToastMessage(
          `Add-on ${order.orderNumber} for ${order.tableNumber || order.tableName || 'Table'} Approved & Merged!`,
          'success',
        );
      }
    } else {
      updateOrderStatus(order.id, 'accepted');
      if (order.type === 'dine-in' && order.tableId) {
        updateTableStatus(order.tableId, 'occupied', order.id, order.waiterId);
      }
      if (showToastMessage) {
        showToastMessage(`Order ${order.orderNumber} accepted!`, 'success');
      }
    }
  };

  const handleRejectOrder = (order: Order) => {
    setOrderToReject(order);
    setRejectionReason('');
    setRejectReasonError(false);
    setRejectDialogVisible(true);
  };

  const confirmRejectOrder = () => {
    if (!orderToReject) return;

    const isAddon =
      orderToReject.isAddon || orderToReject.addonApprovalStatus === 'PENDING_CASHIER_APPROVAL';

    if (isAddon && !rejectionReason.trim()) {
      setRejectReasonError(true);
      if (showToastMessage) {
        showToastMessage('Rejection reason is required for Add-on requests.', 'error');
      }
      return;
    }

    if (isAddon) {
      rejectAddonOrder(orderToReject.id, rejectionReason.trim());
      if (showToastMessage) {
        showToastMessage(`Add-on ${orderToReject.orderNumber} rejected.`, 'error');
      }
    } else {
      updateOrderStatus(orderToReject.id, 'rejected', rejectionReason);
      if (orderToReject.type === 'dine-in' && orderToReject.tableId) {
        updateTableStatus(orderToReject.tableId, 'available');
      }
      if (showToastMessage) {
        showToastMessage(`Order ${orderToReject.orderNumber} rejected.`, 'error');
      }
    }

    setRejectDialogVisible(false);
    setRejectionReason('');
    setRejectReasonError(false);
    setOrderToReject(null);
  };

  const simulateIncomingOrder = (simType?: 'fresh' | 'addon') => {
    const shouldSimulateAddon =
      simType === 'addon' ||
      (simType === undefined &&
        Math.random() > 0.45 &&
        orders.some(
          (o) =>
            !o.isAddon &&
            o.type === 'dine-in' &&
            o.status !== 'completed' &&
            o.status !== 'cancelled' &&
            o.status !== 'rejected',
        ));

    if (shouldSimulateAddon) {
      // Find an active parent order tied to a table
      const activeParent = orders.find(
        (o) =>
          !o.isAddon &&
          o.type === 'dine-in' &&
          o.status !== 'completed' &&
          o.status !== 'cancelled' &&
          o.status !== 'rejected',
      );

      const tableId = activeParent?.tableId || 't-g2';
      const tableName = activeParent?.tableName || 'Table 2';
      const tableNumber = activeParent?.tableNumber || tableName;
      const floorName = activeParent?.floorName || 'Ground Floor';
      const parentOrderId = activeParent?.id || 'ord-101';
      const waiter = MOCK_WAITERS[Math.floor(Math.random() * MOCK_WAITERS.length)];
      const customer = MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)];

      const addonItemsPool = [
        MOCK_PRODUCTS[9], // Butter Naan
        MOCK_PRODUCTS[10], // Garlic Naan
        MOCK_PRODUCTS[18], // Sweet Lassi
        MOCK_PRODUCTS[12], // Gulab Jamun
        MOCK_PRODUCTS[16], // Virgin Mojito
        MOCK_PRODUCTS[4], // Paneer Butter Masala
      ];

      const chosenProduct = addonItemsPool[Math.floor(Math.random() * addonItemsPool.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      const addonItems = [
        {
          product: chosenProduct,
          quantity: qty,
          notes: Math.random() > 0.5 ? 'Serve hot with active meal' : undefined,
        },
      ];

      const subtotal = addonItems.reduce((s, it) => s + it.product.price * it.quantity, 0);
      const gst = Math.round(subtotal * 0.05 * 100) / 100;
      const total = Math.round((subtotal + gst) * 100) / 100;
      const orderNum = `SK-${1000 + orders.length + 1}-ADD`;

      const newAddonOrder: Order = {
        id: `ord-addon-${Date.now()}`,
        orderId: `ord-addon-${Date.now()}`,
        orderNumber: orderNum,
        tableId,
        tableName,
        tableNumber,
        floorName,
        parentOrderId,
        isAddon: true,
        addonApprovalStatus: 'PENDING_CASHIER_APPROVAL',
        waiterId: activeParent?.waiterId || waiter.id,
        waiterName: activeParent?.waiterName || waiter.name,
        customerId: activeParent?.customerId || customer.id,
        customerName: activeParent?.customerName || customer.name,
        customerPhone: activeParent?.customerPhone || customer.phone,
        items: addonItems,
        subtotal,
        gst,
        discount: 0,
        total,
        status: 'pending',
        type: 'dine-in',
        createdAt: new Date().toISOString(),
        numberOfGuests: activeParent?.numberOfGuests || 2,
      };

      addOrder(newAddonOrder);
      if (showToastMessage) {
        showToastMessage(`Incoming Add-on request received for ${tableName}!`, 'info');
      }
      return;
    }

    // 1. Order Number
    const orderNum = `SK-${1000 + orders.length + 1}`;

    // 2. Select Order Type
    const types: ('dine-in' | 'takeaway')[] = ['dine-in', 'takeaway'];
    let type = types[Math.floor(Math.random() * types.length)];

    // 3. Select Table if Dine-In
    let tableId: string | undefined;
    let tableName: string | undefined;
    let floorName: string | undefined;

    if (type === 'dine-in') {
      const availableTables = tables.filter((t) => t.status === 'available');
      if (availableTables.length > 0) {
        const randomTable = availableTables[Math.floor(Math.random() * availableTables.length)];
        tableId = randomTable.id;
        tableName = randomTable.name;
        floorName =
          randomTable.floorId === 'floor-g'
            ? 'Ground Floor'
            : randomTable.floorId === 'floor-1'
              ? 'First Floor (AC)'
              : 'Rooftop Lounge';
      } else {
        // Fallback to takeaway
        type = 'takeaway';
      }
    }

    // 4. Select Customer
    const customer = MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)];
    const waiter = MOCK_WAITERS[Math.floor(Math.random() * MOCK_WAITERS.length)];
    const guests = Math.floor(Math.random() * 4) + 1;

    // 5. Select Items
    const itemsCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
    const selectedItems = [];
    const usedProductIds = new Set<string>();

    for (let i = 0; i < itemsCount; i++) {
      let product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
      while (usedProductIds.has(product.id)) {
        product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
      }
      usedProductIds.add(product.id);
      selectedItems.push({
        product,
        quantity: Math.floor(Math.random() * 2) + 1, // 1 or 2
        notes: Math.random() > 0.5 ? 'Less oil, make spicy' : undefined,
      });
    }

    // 6. Calculations
    const subtotal = selectedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const discount = Math.random() > 0.5 ? 50 : 0;
    const total = Math.round((subtotal + gst - discount) * 100) / 100;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderId: `ord-${Date.now()}`,
      orderNumber: orderNum,
      tableId,
      tableName,
      tableNumber: tableName,
      floorName,
      isAddon: false,
      waiterId: waiter.id,
      waiterName: waiter.name,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: selectedItems,
      subtotal,
      gst,
      discount,
      total,
      status: 'pending',
      type,
      createdAt: new Date().toISOString(),
      numberOfGuests: guests,
    };

    addOrder(newOrder);
    if (showToastMessage) {
      showToastMessage(`New waiter order ${orderNum} received!`, 'info');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderBottomWidth: 1,
        },
      ]}
    >
      {/* Restaurant Details */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.restaurantName, { color: colors.primary }]}>
          {MOCK_RESTAURANT.name}
        </Text>
        <View style={styles.subDetailsRow}>
          <Text style={[styles.branchName, { color: colors.textPrimary }]}>
            {user?.role || 'Cashier'} Terminal
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textMuted }]}>•</Text>
          <Text style={[styles.branchDetail, { color: colors.textSecondary }]}>
            {MOCK_RESTAURANT.branch}
          </Text>
        </View>
      </View>

      {/* Clock and Calendar */}
      <View style={styles.clockContainer}>
        <View style={styles.clockItem}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
          <Text style={[styles.clockText, { color: colors.textPrimary }]}>{formatTime(time)}</Text>
        </View>
        <View style={styles.clockItem}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={18}
            color={colors.textMuted}
          />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(time)}</Text>
        </View>
      </View>

      {/* Cashier profile & Action keys */}
      <View style={styles.profileActions}>
        {/* Theme Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.7}
          style={[styles.actionIcon, { backgroundColor: colors.surfaceLight }]}
        >
          <MaterialCommunityIcons
            name={themeMode === 'dark' ? 'weather-sunny' : 'weather-night'}
            size={22}
            color={themeMode === 'dark' ? '#FBBF24' : colors.textPrimary}
          />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          onPress={openNotifications}
          activeOpacity={0.7}
          style={[styles.actionIcon, { backgroundColor: colors.surfaceLight }]}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
          {pendingOrders.length + unreadNotifCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{pendingOrders.length + unreadNotifCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceLight }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(currentUser?.cashierName || user?.name || 'Cashier')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'CA'}
            </Text>
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {currentUser?.cashierName || user?.name || 'Cashier User'}
            </Text>
            <Text style={[styles.profileId, { color: colors.textMuted }]}>
              {currentUser?.employeeId || user?.employeeId || 'EMP-POS'}
            </Text>
          </View>
        </View>
      </View>

      {/* Right-Side Notification Drawer Modal */}
      <Modal
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
        transparent
        visible={showNotifications}
        onRequestClose={() => setShowNotifications(false)}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.drawerContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.drawerHeaderLeft}>
                <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary} />
                <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>
                  Pending Approvals ({pendingOrders.length})
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={[
                    styles.simulateBtn,
                    { backgroundColor: colors.primaryLight, marginRight: 6 },
                  ]}
                  onPress={() => simulateIncomingOrder('fresh')}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={13} color={colors.primary} />
                  <Text style={[styles.simulateBtnText, { color: colors.primary }]}>+ Fresh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.simulateBtn,
                    { backgroundColor: colors.warningLight, marginRight: SPACING.sm },
                  ]}
                  onPress={() => simulateIncomingOrder('addon')}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="playlist-plus" size={14} color={colors.warning} />
                  <Text style={[styles.simulateBtnText, { color: colors.warning }]}>+ Add-on</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowNotifications(false)}
                >
                  <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Ready-to-bill alerts (waiter marked an order served) */}
            {notifications.length > 0 && (
              <View style={styles.notifSection}>
                <Text style={[styles.notifSectionTitle, { color: colors.textSecondary }]}>
                  Notifications
                </Text>
                {notifications.slice(0, 6).map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    activeOpacity={0.7}
                    onPress={() => handleNotificationPress(n.route)}
                    style={[
                      styles.notifRow,
                      { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={n.type === 'new_order' ? 'receipt-text-outline' : 'cash-register'}
                      size={20}
                      color={colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notifRowTitle, { color: colors.textPrimary }]}>
                        {n.title}
                      </Text>
                      <Text style={[styles.notifRowDesc, { color: colors.textSecondary }]}>
                        {n.description}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* List */}
            {pendingOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="bell-off-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No pending orders
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  New waiter orders and add-on approval requests will appear here.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
                {pendingOrders.map((order) => {
                  const isAddonOrder =
                    order.isAddon || order.addonApprovalStatus === 'PENDING_CASHIER_APPROVAL';
                  const tableLabel = order.tableNumber || order.tableName || (order.tableId ? `Table ${order.tableId}` : 'N/A');
                  const waiterName = order.waiterName || 'Unknown Waiter';
                  const customerName = order.customerName || 'Walk-in Customer';
                  const customerPhone = order.customerPhone;
                  const guestsCount = order.numberOfGuests || 2;

                  const specialInstructions = order.items
                    .filter((item) => item.notes)
                    .map((item) => `${item.product.name}: ${item.notes}`)
                    .join(', ');

                  return (
                    <View
                      key={order.id}
                      style={[
                        styles.orderCard,
                        {
                          backgroundColor: colors.surfaceLight,
                          borderColor: isAddonOrder ? colors.warning : colors.border,
                          borderWidth: isAddonOrder ? 1.5 : 1,
                        },
                      ]}
                    >
                      {/* Card Header */}
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderTitleCol}>
                          <Text style={[styles.orderNo, { color: colors.textPrimary }]}>
                            {isAddonOrder ? `Add-on — ${tableLabel}` : order.orderNumber}
                          </Text>
                          <Text style={[styles.orderSubLabel, { color: colors.textMuted }]}>
                            {isAddonOrder
                              ? `Order Ref: ${order.orderNumber}${order.parentOrderId ? ` • Parent: ${order.parentOrderId}` : ''}`
                              : `Fresh Incoming Order`}
                          </Text>
                        </View>

                        <View style={styles.cardHeaderRight}>
                          <Badge
                            label={isAddonOrder ? 'ADD-ON APPROVAL' : 'NEW ORDER'}
                            variant={isAddonOrder ? 'warning' : 'primary'}
                            style={{ marginBottom: 2 }}
                          />
                          <Text style={[styles.orderTime, { color: colors.textSecondary }]}>
                            {formatTime(order.createdAt)}
                          </Text>
                        </View>
                      </View>

                      {/* Details Row 1 */}
                      <View style={styles.detailsRow}>
                        <View style={styles.infoCol}>
                          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Type</Text>
                          <View style={styles.typeBadgeContainer}>
                            <MaterialCommunityIcons
                              name={
                                isAddonOrder
                                  ? 'playlist-plus'
                                  : order.type === 'dine-in'
                                    ? 'table-chair'
                                    : 'bag-checked'
                              }
                              size={14}
                              color={
                                isAddonOrder
                                  ? colors.warning
                                  : order.type === 'dine-in'
                                    ? '#3B82F6'
                                    : '#F59E0B'
                              }
                            />
                            <Text
                              style={[
                                styles.typeText,
                                {
                                  color: isAddonOrder
                                    ? colors.warning
                                    : order.type === 'dine-in'
                                      ? '#3B82F6'
                                      : '#F59E0B',
                                },
                              ]}
                            >
                              {isAddonOrder
                                ? `Add-on Request (${tableLabel})`
                                : order.type === 'dine-in'
                                  ? `Dine-In (${tableLabel})`
                                  : 'Takeaway'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.infoCol}>
                          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                            {isAddonOrder ? 'Table Ref' : 'Guests'}
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                            {isAddonOrder ? tableLabel : `${guestsCount} Guests`}
                          </Text>
                        </View>
                      </View>

                      {/* Details Row 2 */}
                      <View style={styles.detailsRow}>
                        <View style={styles.infoCol}>
                          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Added By</Text>
                          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                            {waiterName}
                          </Text>
                        </View>

                        <View style={styles.infoCol}>
                          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Customer</Text>
                          <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            {customerName}
                          </Text>
                          {customerPhone ? (
                            <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                              {customerPhone}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Items */}
                      <View style={styles.itemsSection}>
                        <Text style={[styles.sectionTitle, { color: isAddonOrder ? colors.warning : colors.textMuted }]}>
                          {isAddonOrder ? 'Add-on Items to Merge' : 'Ordered Items'}
                        </Text>
                        {order.items.map((item, idx) => (
                          <View key={idx} style={styles.itemRow}>
                            <Text style={[styles.itemQty, { color: isAddonOrder ? colors.warning : colors.primary }]}>
                              {item.quantity}x
                            </Text>
                            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                              {item.product.name}
                            </Text>
                            <Text style={[styles.itemPriceText, { color: colors.textSecondary }]}>
                              {formatCurrency(item.product.price * item.quantity)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Special Instructions */}
                      {specialInstructions ? (
                        <View
                          style={[
                            styles.instructionsContainer,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                          ]}
                        >
                          <Text style={[styles.instructionsTitle, { color: colors.error }]}>
                            Special Instructions:
                          </Text>
                          <Text style={[styles.instructionsText, { color: colors.textPrimary }]}>
                            {specialInstructions}
                          </Text>
                        </View>
                      ) : null}

                      {/* Footer Actions */}
                      <View style={[styles.cardDivider, { borderBottomColor: colors.border }]} />
                      <View style={styles.cardFooter}>
                        <View>
                          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
                            {isAddonOrder ? 'Add-on Amount' : 'Total'}
                          </Text>
                          <Text style={[styles.totalValueText, { color: isAddonOrder ? colors.warning : colors.primary }]}>
                            {formatCurrency(order.total)}
                          </Text>
                        </View>

                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={[styles.rejectBtn, { borderColor: colors.error }]}
                            onPress={() => handleRejectOrder(order)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.rejectBtnText, { color: colors.error }]}>
                              {isAddonOrder ? 'Reject Add-on' : 'Reject Order'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.acceptBtn,
                              { backgroundColor: isAddonOrder ? colors.success : colors.success },
                            ]}
                            onPress={() => handleAcceptOrder(order)}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons
                              name="check-circle-outline"
                              size={15}
                              color="#FFFFFF"
                              style={{ marginRight: 4 }}
                            />
                            <Text style={styles.acceptBtnText}>
                              {isAddonOrder ? 'Approve & Merge' : 'Accept Order'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Reject Confirmation Dialog */}
      <Modal
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
        transparent
        visible={rejectDialogVisible}
        onRequestClose={() => {
          setRejectDialogVisible(false);
          setRejectionReason('');
          setRejectReasonError(false);
          setOrderToReject(null);
        }}
        animationType="fade"
      >
        <View style={[styles.dialogOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialogBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
              {orderToReject?.isAddon || orderToReject?.addonApprovalStatus === 'PENDING_CASHIER_APPROVAL'
                ? 'Reject Add-on Request'
                : 'Reject Order'}
            </Text>
            <Text style={[styles.dialogDescription, { color: colors.textSecondary }]}>
              {orderToReject?.isAddon || orderToReject?.addonApprovalStatus === 'PENDING_CASHIER_APPROVAL'
                ? `Are you sure you want to reject the add-on order (${orderToReject?.orderNumber}) for ${orderToReject?.tableNumber || orderToReject?.tableName || 'Table'}? A rejection reason is required for the waiter app.`
                : `Are you sure you want to reject order ${orderToReject?.orderNumber}?`}
            </Text>

            <TextInput
              style={[
                styles.reasonInput,
                {
                  borderColor: rejectReasonError ? colors.error : colors.border,
                  backgroundColor: colors.surfaceLight,
                  color: colors.textPrimary,
                },
              ]}
              placeholder={
                orderToReject?.isAddon || orderToReject?.addonApprovalStatus === 'PENDING_CASHIER_APPROVAL'
                  ? 'Reason for rejection (Required, e.g. Out of stock, table leaving)...'
                  : 'Reason for rejection (optional)'
              }
              placeholderTextColor={colors.textMuted}
              value={rejectionReason}
              onChangeText={(text) => {
                setRejectionReason(text);
                if (text.trim()) setRejectReasonError(false);
              }}
            />
            {rejectReasonError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                * Please provide a reason to notify the waiter app.
              </Text>
            )}

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setRejectDialogVisible(false);
                  setRejectionReason('');
                  setRejectReasonError(false);
                  setOrderToReject(null);
                }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.confirmBtn, { backgroundColor: colors.error }]}
                onPress={confirmRejectOrder}
              >
                <Text style={styles.confirmBtnText}>Yes, Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  detailsContainer: {
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  subDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  branchName: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  bulletPoint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginHorizontal: 4,
  },
  branchDetail: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  clockText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
    fontFamily: 'System',
  },
  dateText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.xs,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    position: 'relative',
  },
  notifSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  notifSectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  notifRowTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  notifRowDesc: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginLeft: SPACING.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  profileTextContainer: {
    marginLeft: SPACING.sm,
  },
  profileName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  profileId: {
    fontSize: 10,
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    width: 450,
    height: '100%',
    boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)',
    borderLeftWidth: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  drawerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
  simulateBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollList: {
    flex: 1,
    padding: SPACING.md,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cardHeaderTitleCol: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  orderSubLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  orderNo: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  orderTime: {
    fontSize: 11,
    marginTop: 2,
  },
  itemPriceText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginLeft: SPACING.xs,
  },
  errorText: {
    fontSize: 11,
    marginTop: -SPACING.md,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  infoCol: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  phoneText: {
    fontSize: 10,
    marginTop: 1,
  },
  typeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  typeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  itemsSection: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: 'bold',
    width: 20,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.xs,
    flex: 1,
  },
  instructionsContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginTop: SPACING.xs,
  },
  instructionsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  instructionsText: {
    fontSize: 11,
    lineHeight: 14,
  },
  cardDivider: {
    borderBottomWidth: 0.5,
    marginVertical: SPACING.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  totalValueText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rejectBtn: {
    borderWidth: 1.5,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.xs,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: 'bold',
  },
  acceptBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textAlign: 'center',
    marginTop: 4,
  },
  dialogOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBox: {
    width: 400,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.lg,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
  },
  dialogTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.sm,
  },
  dialogDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.lg,
    height: 48,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: 'bold',
  },
  confirmBtn: {
    minWidth: 100,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: 'bold',
  },
});
