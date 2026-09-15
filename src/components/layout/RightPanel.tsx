import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCartStore } from '@/stores/useCartStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { formatCurrency, generateOrderId, generateOrderNumber } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { NumberPadModal, Dialog } from '@/components/ui/Dialog';
import { Order, OrderItem } from '@/mock/data';
import { printKOT } from '@/services/printService';

interface RightPanelProps {
  onNavigateToBilling?: () => void;
  onNavigateToFloor?: () => void;
  showToastMessage: (msg: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  onNavigateToBilling,
  onNavigateToFloor,
  showToastMessage,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();
  const adaptiveWidth = screenWidth < 1280 ? '34%' : screenWidth < 1600 ? '28%' : '24%';

  // Cart Store State
  const {
    cartItems,
    selectedTableId,
    selectedTableName,
    selectedFloorName,
    selectedWaiterId,
    selectedWaiterName,
    selectedCustomerId,
    selectedCustomerName,
    selectedCustomerPhone,
    discount,
    orderType,
    editingOrderId,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateNotes,
    setDiscount,
    setOrderType,
    clearCart,
    getCalculations,
  } = useCartStore();

  // Stores for placing/paying orders
  const updateTableStatus = useFloorStore((state) => state.updateTableStatus);
  const { sendNewOrderToKitchen, updateOrder, orders } = useOrderStore();
  const { customers } = useCustomerStore();

  // Calculations
  const { subtotal, discountAmount, gst, total } = getCalculations();

  // Modals state
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [itemNotesModalVisible, setItemNotesModalVisible] = useState(false);
  const [activeItemForNotes, setActiveItemForNotes] = useState<OrderItem | null>(null);
  const [notesText, setNotesText] = useState('');
  const [customerModalVisible, setCustomerModalVisible] = useState(false);

  // Dialog state
  const [confirmClearVisible, setConfirmClearVisible] = useState(false);

  // Measured height of the pinned bottom bar (totals + action buttons). Used to
  // pad the scrollable items area so the last item can always scroll clear of
  // the absolutely-positioned bar. Seeded with a sensible estimate for the
  // first paint, then corrected via onLayout.
  const [bottomBarHeight, setBottomBarHeight] = useState(170);

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      showToastMessage('Cart is empty. Add products first.');
      return;
    }

    if (orderType === 'dine-in' && !selectedTableId) {
      showToastMessage('Please select a Table for Dine-In.');
      if (onNavigateToFloor) onNavigateToFloor();
      return;
    }

    // Creating order structure
    const isEditing = !!editingOrderId;
    const orderId = isEditing ? editingOrderId! : generateOrderId();
    const orderNumber = isEditing
      ? orders.find((o) => o.id === editingOrderId)?.orderNumber || generateOrderNumber()
      : generateOrderNumber();

    const newOrder: Order = {
      id: orderId,
      orderId,
      orderNumber,
      tableId: selectedTableId,
      tableName: selectedTableName,
      tableNumber: selectedTableName,
      floorName: selectedFloorName,
      isAddon: false,
      waiterId: selectedWaiterId,
      waiterName: selectedWaiterName,
      customerId: selectedCustomerId,
      customerName: selectedCustomerName,
      customerPhone: selectedCustomerPhone,
      items: cartItems,
      subtotal,
      gst,
      discount: discountAmount,
      total,
      status: 'preparing',
      type: orderType,
      createdAt: new Date().toISOString(),
    };

    if (isEditing) {
      // Persist the edited items/totals onto the existing order (keeps its id,
      // number, status and timestamp) instead of creating a duplicate.
      updateOrder(orderId, {
        items: cartItems,
        subtotal,
        gst,
        discount: discountAmount,
        total,
        tableId: selectedTableId,
        tableName: selectedTableName,
        tableNumber: selectedTableName,
        floorName: selectedFloorName,
        waiterId: selectedWaiterId,
        waiterName: selectedWaiterName,
        customerId: selectedCustomerId,
        customerName: selectedCustomerName,
        customerPhone: selectedCustomerPhone,
      });
      showToastMessage(`KOT Updated: ${orderNumber}`);
      if (orderType === 'takeaway') {
        printKOT({
          ...newOrder,
          id: editingOrderId!,
          orderNumber,
        });
      }
    } else {
      // Create + send on the backend so it reaches the KDS (takeaway included).
      sendNewOrderToKitchen(newOrder);
      showToastMessage(`KOT Sent to Kitchen: ${orderNumber}`);
      // Trigger KOT print automatically for Takeaway orders from Cashier Touch POS
      if (orderType === 'takeaway') {
        printKOT(newOrder);
      }
    }

    // Update table status if it's a Dine-in table or assigned Takeaway slot
    if ((orderType === 'dine-in' || orderType === 'takeaway') && selectedTableId) {
      updateTableStatus(selectedTableId, 'occupied', orderId, selectedWaiterId);
    }

    clearCart();
    if (onNavigateToFloor) onNavigateToFloor();
  };

  const handleCollectPayment = () => {
    if (cartItems.length === 0) {
      showToastMessage('Cart is empty. Add products first.');
      return;
    }

    if (orderType === 'dine-in' && !selectedTableId) {
      showToastMessage('Please select a Table.');
      return;
    }

    // Direct checkout
    if (onNavigateToBilling) {
      onNavigateToBilling();
    }
  };

  const openNotesModal = (item: OrderItem) => {
    setActiveItemForNotes(item);
    setNotesText(item.notes || '');
    setItemNotesModalVisible(true);
  };

  const saveItemNotes = () => {
    if (activeItemForNotes) {
      updateNotes(activeItemForNotes.product.id, notesText);
      setItemNotesModalVisible(false);
      setActiveItemForNotes(null);
      showToastMessage('Item notes updated.');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          width: adaptiveWidth,
        },
      ]}
    >
      {/* Header Info */}
      <View style={[styles.section, styles.headerSection, { borderBottomColor: colors.border }]}>
        <View style={styles.orderTypeRow}>
          {/* Dine-in ordering is handled by the waiter app; the cashier POS
              only takes walk-in takeaway orders here. */}
          <TouchableOpacity
            onPress={() => setOrderType('takeaway')}
            style={[
              styles.typeTab,
              { borderColor: colors.border },
              orderType === 'takeaway' && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="bag-checked"
              size={14}
              color={orderType === 'takeaway' ? '#FFF' : colors.textPrimary}
            />
            <Text
              style={[
                styles.typeLabel,
                { color: orderType === 'takeaway' ? '#FFF' : colors.textPrimary },
              ]}
            >
              Takeaway
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table / Waiter Meta information */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name={orderType === 'takeaway' ? 'bag-checked' : 'floor-plan'}
              size={14}
              color={orderType === 'takeaway' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.metaText, { color: colors.textPrimary }]}>
              {orderType === 'dine-in'
                ? selectedTableName
                  ? `${selectedFloorName || 'Floor'} • ${selectedTableName}`
                  : 'No Table Selected'
                : selectedTableName
                  ? `Takeaway Slot • ${selectedTableName}`
                  : 'Takeaway Order'}
            </Text>
          </View>
          {selectedWaiterName && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-tie" size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textPrimary }]}>
                {selectedWaiterName}
              </Text>
            </View>
          )}
        </View>

        {/* Customer Select Row */}
        <TouchableOpacity
          onPress={() => setCustomerModalVisible(true)}
          style={[styles.customerRow, { backgroundColor: colors.surfaceLight }]}
        >
          <MaterialCommunityIcons name="account-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.customerText, { color: colors.textPrimary }]} numberOfLines={1}>
            {selectedCustomerName
              ? `${selectedCustomerName} (${selectedCustomerPhone})`
              : 'Walk-In Customer'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Cart Items List */}
      <ScrollView
        style={styles.cartItemsScroll}
        contentContainerStyle={[styles.cartItemsContent, { paddingBottom: bottomBarHeight + 20 }]}
        showsVerticalScrollIndicator
      >
        {cartItems.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={48}
              color={colors.textMuted}
              style={{ marginBottom: SPACING.sm }}
            />
            <Text style={[styles.emptyCartTitle, { color: colors.textSecondary }]}>
              Order Cart is Empty
            </Text>
            <Text style={[styles.emptyCartSub, { color: colors.textMuted }]}>
              Select categories and add items to begin ordering.
            </Text>
          </View>
        ) : (
          cartItems.map((item) => (
            <View
              key={item.product.id}
              style={[styles.cartItem, { borderBottomColor: colors.border }]}
            >
              <View style={styles.cartItemHeader}>
                <Text
                  style={[styles.cartItemName, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {item.product.name}
                </Text>
                <Text style={[styles.cartItemPrice, { color: colors.textPrimary }]}>
                  {formatCurrency(item.product.price * item.quantity)}
                </Text>
              </View>

              {item.notes && (
                <Text style={[styles.cartItemNotesText, { color: colors.warning }]}>
                  * Note: {item.notes}
                </Text>
              )}

              <View style={styles.cartItemFooter}>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    style={[styles.qtyBtn, { backgroundColor: colors.surfaceLight }]}
                  >
                    <MaterialCommunityIcons name="minus" size={14} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.textPrimary }]}>
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => addToCart(item.product, 1)}
                    style={[styles.qtyBtn, { backgroundColor: colors.surfaceLight }]}
                  >
                    <MaterialCommunityIcons name="plus" size={14} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => openNotesModal(item)}
                    style={styles.itemActionIcon}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.product.id)}
                    style={styles.itemActionIcon}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Pinned bottom bar: totals + action buttons. Absolutely positioned so it
          never gets pushed off-screen; the items ScrollView pads its bottom by
          this bar's measured height so nothing is hidden behind it. */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
        onLayout={(e: { nativeEvent: { layout: { height: number } } }) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h && h !== bottomBarHeight) setBottomBarHeight(h);
        }}
      >
        {/* Calculations Summary Panel */}
        <View style={styles.calculationsContainer}>
        <View style={styles.calcRow}>
          <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Subtotal</Text>
          <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
            {formatCurrency(subtotal)}
          </Text>
        </View>

        <View style={styles.calcRow}>
          <View style={styles.discountLabelCol}>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Discount</Text>
            <TouchableOpacity
              onPress={() => setDiscountModalVisible(true)}
              style={styles.editDiscountBtn}
            >
              <MaterialCommunityIcons name="pencil" size={12} color={colors.primary} />
              <Text style={[styles.editDiscountLabel, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.calcValue, { color: colors.error }]}>
            -{formatCurrency(discountAmount)}
          </Text>
        </View>

        <View style={styles.calcRow}>
          <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>GST (5%)</Text>
          <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
            {formatCurrency(gst)}
          </Text>
        </View>

        <View style={[styles.calcRow, styles.totalRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Payable</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>

        {/* Action Buttons Footer */}
        <View style={[styles.footerContainer, { borderTopColor: colors.border }]}>
          <View style={[styles.footerRow, { marginBottom: SPACING.xs }]}>
            <Button
              label="Clear"
              variant="outline"
              size="sm"
              onPress={() => setConfirmClearVisible(true)}
              disabled={cartItems.length === 0}
              style={styles.clearBtn}
            />
            <Button
              label={editingOrderId ? 'Update KOT' : 'Send to Kitchen'}
              variant="secondary"
              size="sm"
              icon="silverware-clean"
              onPress={handlePlaceOrder}
              disabled={cartItems.length === 0}
              style={styles.sendKotBtn}
            />
          </View>
          <Button
            label="Collect Payment & Checkout"
            variant="primary"
            size="sm"
            icon="credit-card-outline"
            onPress={handleCollectPayment}
            disabled={cartItems.length === 0}
            style={styles.checkoutBtn}
          />
        </View>
      </View>

      {/* Modals & Dialog Overlays */}
      <NumberPadModal
        visible={discountModalVisible}
        title="Apply Flat Discount (INR)"
        initialValue={discount.toString()}
        suffix="₹"
        onConfirm={(val) => {
          setDiscount(val, false);
          setDiscountModalVisible(false);
          showToastMessage(`Discount applied: ₹${val}`);
        }}
        onCancel={() => setDiscountModalVisible(false)}
      />

      <Dialog
        visible={itemNotesModalVisible}
        title="Add Notes"
        description="Enter instructions for KOT item:"
        confirmLabel="Save"
        onConfirm={saveItemNotes}
        onCancel={() => setItemNotesModalVisible(false)}
      >
        {/* We embed numeric or notes layout */}
      </Dialog>

      <Dialog
        visible={confirmClearVisible}
        title="Clear Cart"
        description="Are you sure you want to delete all items from this order cart?"
        confirmLabel="Yes, Clear"
        cancelLabel="Keep Items"
        type="danger"
        onConfirm={() => {
          clearCart();
          setConfirmClearVisible(false);
          showToastMessage('Cart Cleared.');
        }}
        onCancel={() => setConfirmClearVisible(false)}
      />

      {/* Item Notes input modal overlay */}
      <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} transparent visible={itemNotesModalVisible} animationType="fade">
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOWS.lg,
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Item Instructions
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              For: {activeItemForNotes?.product.name}
            </Text>

            <View
              style={[
                styles.notesInputContainer,
                { borderColor: colors.border, backgroundColor: colors.surfaceLight },
              ]}
            >
              <TextInput
                style={[styles.notesInput, { color: colors.textPrimary }]}
                placeholder="Enter notes (e.g. less oil, make spicy, no onions)..."
                placeholderTextColor={colors.textMuted}
                value={notesText}
                onChangeText={setNotesText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setItemNotesModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                label="Save Note"
                variant="primary"
                onPress={saveItemNotes}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Quick Select Modal */}
      <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} transparent visible={customerModalVisible} animationType="fade">
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.customerModalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOWS.lg,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Select Customer
              </Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.customerScroll}>
              <TouchableOpacity
                onPress={() => {
                  useCartStore.getState().selectCustomer(undefined);
                  setCustomerModalVisible(false);
                  showToastMessage('Switched to Walk-In Customer');
                }}
                style={[
                  styles.customerSelectCard,
                  { borderBottomColor: colors.border },
                  !selectedCustomerId && { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text
                  style={[
                    styles.customerSelectName,
                    {
                      color: !selectedCustomerId ? colors.primary : colors.textPrimary,
                      fontWeight: 'bold',
                    },
                  ]}
                >
                  Walk-In Customer
                </Text>
              </TouchableOpacity>

              {customers.map((cust) => {
                const isSelected = selectedCustomerId === cust.id;
                return (
                  <TouchableOpacity
                    key={cust.id}
                    onPress={() => {
                      useCartStore.getState().selectCustomer(cust.id, cust.name, cust.phone);
                      setCustomerModalVisible(false);
                      showToastMessage(`Customer Selected: ${cust.name}`);
                    }}
                    style={[
                      styles.customerSelectCard,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <View>
                      <Text
                        style={[
                          styles.customerSelectName,
                          {
                            color: isSelected ? colors.primary : colors.textPrimary,
                            fontWeight: 'bold',
                          },
                        ]}
                      >
                        {cust.name}
                      </Text>
                      <Text style={[styles.customerSelectPhone, { color: colors.textSecondary }]}>
                        +91 {cust.phone}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    borderLeftWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  headerSection: {
    borderBottomWidth: 1,
  },
  orderTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    height: 28,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: 4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    height: 30,
  },
  customerText: {
    fontSize: 11,
    flex: 1,
    marginLeft: 4,
  },
  cartItemsScroll: {
    flex: 1,
  },
  cartItemsContent: {
    paddingBottom: SPACING.md,
  },
  emptyCartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyCartTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyCartSub: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
  },
  cartItem: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
    flex: 1,
    paddingRight: SPACING.sm,
  },
  cartItemPrice: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cartItemNotesText: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  cartItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginHorizontal: SPACING.sm,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemActionIcon: {
    padding: 4,
    marginLeft: SPACING.xs,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  calculationsContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  calcLabel: {
    fontSize: 12,
  },
  discountLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editDiscountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.xs,
    paddingHorizontal: 4,
  },
  editDiscountLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  calcValue: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 2,
    paddingTop: SPACING.xs,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  footerContainer: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  clearBtn: {
    flex: 0.32,
    minHeight: 38,
  },
  sendKotBtn: {
    flex: 0.68,
    minHeight: 38,
  },
  checkoutBtn: {
    width: '100%',
    minHeight: 38,
  },
  // Notes Modal Overlay
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 320,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modalSub: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  notesInputContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    height: 80,
    marginBottom: SPACING.md,
  },
  notesInput: {
    flex: 1,
    height: '100%',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    width: '48%',
    minHeight: 38,
  },
  // Customer modal styles
  customerModalBox: {
    width: 350,
    height: '60%',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  customerScroll: {
    flex: 1,
    marginTop: SPACING.sm,
  },
  customerSelectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: 1,
  },
  customerSelectName: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  customerSelectPhone: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
});
