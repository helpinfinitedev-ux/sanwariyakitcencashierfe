import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { formatDate, formatTime, formatCurrency } from '@/utils/formatters';
import { MOCK_RESTAURANT, MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_WAITERS, Order } from '@/mock/data';

export interface HeaderProps {
  showToastMessage?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Header: React.FC<HeaderProps> = ({ showToastMessage }) => {
  const { themeMode, toggleTheme } = useSettingsStore();
  const user = useAuthStore((state) => state.user);
  const colors = COLORS[themeMode];

  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const { orders, addOrder, updateOrderStatus, cancelOrder } = useOrderStore();
  const { tables, updateTableStatus } = useFloorStore();

  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingOrders = orders.filter((o) => o.status === 'pending');

  const handleAcceptOrder = (order: Order) => {
    updateOrderStatus(order.id, 'accepted');
    if (order.type === 'dine-in' && order.tableId) {
      updateTableStatus(order.tableId, 'occupied', order.id, order.waiterId);
    }
    if (showToastMessage) {
      showToastMessage(`Order ${order.orderNumber} accepted!`, 'success');
    }
  };

  const handleRejectOrder = (order: Order) => {
    setOrderToReject(order);
    setRejectDialogVisible(true);
  };

  const confirmRejectOrder = () => {
    if (orderToReject) {
      updateOrderStatus(orderToReject.id, 'rejected', rejectionReason);
      if (orderToReject.type === 'dine-in' && orderToReject.tableId) {
        updateTableStatus(orderToReject.tableId, 'available');
      }
      if (showToastMessage) {
        showToastMessage(`Order ${orderToReject.orderNumber} rejected.`, 'error');
      }
      setRejectDialogVisible(false);
      setRejectionReason('');
      setOrderToReject(null);
    }
  };

  const simulateIncomingOrder = () => {
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
      const availableTables = tables.filter(t => t.status === 'available');
      if (availableTables.length > 0) {
        const randomTable = availableTables[Math.floor(Math.random() * availableTables.length)];
        tableId = randomTable.id;
        tableName = randomTable.name;
        floorName = randomTable.floorId === 'floor-g' ? 'Ground Floor' : 
                    randomTable.floorId === 'floor-1' ? 'First Floor (AC)' : 'Rooftop Lounge';
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
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const gst = Math.round(subtotal * 0.18 * 100) / 100;
    const discount = Math.random() > 0.5 ? 50 : 0;
    const total = Math.round((subtotal + gst - discount) * 100) / 100;
    
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      tableId,
      tableName,
      floorName,
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
          onPress={() => setShowNotifications(true)}
          activeOpacity={0.7}
          style={[styles.actionIcon, { backgroundColor: colors.surfaceLight }]}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
          {pendingOrders.length > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{pendingOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceLight }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.name
                .split(' ')
                .map((n) => n[0])
                .join('') || 'CA'}
            </Text>
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {user?.name || 'Cashier User'}
            </Text>
            <Text style={[styles.profileId, { color: colors.textMuted }]}>
              {user?.employeeId || 'ID: 991'}
            </Text>
          </View>
        </View>
      </View>

      {/* Right-Side Notification Drawer Modal */}
      <Modal
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
                  Pending Orders ({pendingOrders.length})
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.simulateBtn, { backgroundColor: colors.primaryLight, marginRight: SPACING.sm }]}
                  onPress={simulateIncomingOrder}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={14} color={colors.primary} />
                  <Text style={[styles.simulateBtnText, { color: colors.primary }]}>Simulate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowNotifications(false)}
                >
                  <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

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
                  New waiter orders will appear here.
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.scrollList} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
                {pendingOrders.map((order) => {
                  const tableName = order.tableName || (order.tableId ? `Table ${order.tableId}` : 'N/A');
                  const waiterName = order.waiterName || 'Unknown Waiter';
                  const customerName = order.customerName || 'Walk-in Customer';
                  const customerPhone = order.customerPhone;
                  const guestsCount = order.numberOfGuests || 2;
                  
                  const specialInstructions = order.items
                    .filter(item => item.notes)
                    .map(item => `${item.product.name}: ${item.notes}`)
                    .join(', ');

                  return (
                    <View
                      key={order.id}
                      style={[styles.orderCard, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                    >
                      {/* Card Header */}
                      <View style={styles.cardHeader}>
                        <Text style={[styles.orderNo, { color: colors.textPrimary }]}>
                          {order.orderNumber}
                        </Text>
                        <Text style={[styles.orderTime, { color: colors.textSecondary }]}>
                          {formatTime(order.createdAt)}
                        </Text>
                      </View>
                      
                      {/* Details Row 1 */}
                      <View style={styles.detailsRow}>
                        <View style={styles.infoCol}>
                          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Type</Text>
                          <View style={styles.typeBadgeContainer}>
                            <MaterialCommunityIcons
                              name={order.type === 'dine-in' ? 'table-chair' : 'bag-checked'}
                              size={14}
                              color={order.type === 'dine-in' ? '#3B82F6' : '#F59E0B'}
                            />
                            <Text style={[styles.typeText, { color: order.type === 'dine-in' ? '#3B82F6' : '#F59E0B' }]}>
                              {order.type === 'dine-in' ? `Dine-In (${tableName})` : 'Takeaway'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.infoCol}>
                          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Guests</Text>
                          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                            {guestsCount} Guests
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
                        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Ordered Items</Text>
                        {order.items.map((item, idx) => (
                          <View key={idx} style={styles.itemRow}>
                            <Text style={[styles.itemQty, { color: colors.primary }]}>{item.quantity}x</Text>
                            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                              {item.product.name}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Special Instructions */}
                      {specialInstructions ? (
                        <View style={[styles.instructionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total</Text>
                          <Text style={[styles.totalValueText, { color: colors.primary }]}>
                            {formatCurrency(order.total)}
                          </Text>
                        </View>
                        
                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={[styles.rejectBtn, { borderColor: colors.error }]}
                            onPress={() => handleRejectOrder(order)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.rejectBtnText, { color: colors.error }]}>Reject Order</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.acceptBtn, { backgroundColor: colors.success }]}
                            onPress={() => handleAcceptOrder(order)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.acceptBtnText}>Accept Order</Text>
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
        transparent
        visible={rejectDialogVisible}
        onRequestClose={() => {
          setRejectDialogVisible(false);
          setRejectionReason('');
          setOrderToReject(null);
        }}
        animationType="fade"
      >
        <View style={[styles.dialogOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialogBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>Reject Order</Text>
            <Text style={[styles.dialogDescription, { color: colors.textSecondary }]}>
              Are you sure you want to reject order {orderToReject?.orderNumber}?
            </Text>
            
            <TextInput
              style={[
                styles.reasonInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceLight,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Reason for rejection (optional)"
              placeholderTextColor={colors.textMuted}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setRejectDialogVisible(false);
                  setRejectionReason('');
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
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
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
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderNo: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  orderTime: {
    fontSize: 11,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
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
