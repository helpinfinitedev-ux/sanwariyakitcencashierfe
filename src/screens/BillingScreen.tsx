import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCartStore } from '@/stores/useCartStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useReportStore } from '@/stores/useReportStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { formatCurrency, generateOrderId, generateOrderNumber } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Order } from '@/mock/data';
import { ReceiptPreviewModal } from '@/components/ui/ReceiptPreviewModal';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';

interface BillingScreenProps {
  onNavigate: (route: string) => void;
  showToastMessage: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type PaymentMethodType = 'cash' | 'card' | 'upi';

export const BillingScreen: React.FC<BillingScreenProps> = ({ onNavigate, showToastMessage }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();
  const isLargeScreen = screenWidth >= 1366; // 3-column layout breakpoint

  // Cart store details
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
    editingOrderId,
    clearCart,
    getCalculations,
  } = useCartStore();

  // Calculation values
  const { subtotal, discountAmount, gst, total } = getCalculations();

  // Stores
  const { addOrder, completeOrder, orders } = useOrderStore();
  const addOrderToReport = useReportStore((state) => state.addOrderToReport);
  const updateTableStatus = useFloorStore((state) => state.updateTableStatus);

  // States
  const [payMethod, setPayMethod] = useState<PaymentMethodType>('cash');
  const [cashReceived, setCashReceived] = useState(total.toString());
  const [upiQrVisible, setUpiQrVisible] = useState(false);

  // Post-Payment & Print/WhatsApp Modals
  const [settledOrder, setSettledOrder] = useState<Order | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [whatsAppModalVisible, setWhatsAppModalVisible] = useState(false);
  const [activeOrderForModal, setActiveOrderForModal] = useState<Order | null>(null);

  // Calculations for cash change
  const numericCashReceived = parseFloat(cashReceived) || 0;
  const changeReturn = Math.max(0, numericCashReceived - total);

  // Current draft order representation for pre-settlement preview
  const currentDraftOrder: Order = {
    id: editingOrderId || 'draft-ord',
    orderId: editingOrderId || 'draft-ord',
    orderNumber: editingOrderId
      ? orders.find((o) => o.id === editingOrderId)?.orderNumber || 'SK-DRAFT'
      : 'SK-DRAFT',
    tableId: selectedTableId,
    tableName: selectedTableName,
    tableNumber: selectedTableName,
    floorName: selectedFloorName,
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
    status: 'billing',
    type: selectedTableId ? 'dine-in' : 'takeaway',
    paymentMethod: payMethod,
    isAddon: false,
    createdAt: new Date().toISOString(),
  };

  // Suggested tender options
  const quickCashOptions = [
    { label: `Exact (₹${total})`, value: total },
    { label: '₹100', value: 100 },
    { label: '₹200', value: 200 },
    { label: '₹500', value: 500 },
    { label: '₹2,000', value: 2000 },
  ].filter((opt) => opt.value >= total || opt.value === total);

  const handleQuickCash = (value: number) => {
    setCashReceived(value.toString());
  };

  const openReceiptModalForDraft = () => {
    if (cartItems.length === 0) {
      showToastMessage('Cart is empty. Add products to print receipt.', 'error');
      return;
    }
    setActiveOrderForModal(currentDraftOrder);
    setReceiptModalVisible(true);
  };

  const openWhatsAppModalForDraft = () => {
    if (cartItems.length === 0) {
      showToastMessage('Cart is empty. Add products to send WhatsApp bill.', 'error');
      return;
    }
    setActiveOrderForModal(currentDraftOrder);
    setWhatsAppModalVisible(true);
  };

  const handleCompleteTransaction = () => {
    if (cartItems.length === 0) {
      showToastMessage('Cannot finalize an empty bill.', 'error');
      return;
    }

    // Validate cash received
    if (payMethod === 'cash' && numericCashReceived < total) {
      showToastMessage('Cash received is less than total payable.', 'error');
      return;
    }

    const isEditing = !!editingOrderId;
    const orderId = isEditing ? editingOrderId! : generateOrderId();
    const orderNumber = isEditing
      ? orders.find((o) => o.id === editingOrderId)?.orderNumber || generateOrderNumber()
      : generateOrderNumber();

    const finalOrder: Order = {
      id: orderId,
      orderId,
      orderNumber,
      tableId: selectedTableId,
      tableName: selectedTableName,
      tableNumber: selectedTableName,
      floorName: selectedFloorName,
      waiterId: selectedWaiterId,
      waiterName: selectedWaiterName,
      customerId: selectedCustomerId,
      customerName: selectedCustomerName,
      customerPhone: selectedCustomerPhone,
      items: [...cartItems],
      subtotal,
      gst,
      discount: discountAmount,
      total,
      status: 'completed',
      type: selectedTableId ? 'dine-in' : 'takeaway',
      paymentMethod: payMethod,
      isAddon: false,
      createdAt: new Date().toISOString(),
    };

    // Store KOT finalized transition
    if (isEditing) {
      completeOrder(orderId, payMethod);
      showToastMessage(`Invoice Completed: ${orderNumber}`, 'success');
    } else {
      addOrder(finalOrder);
      completeOrder(orderId, payMethod);
      showToastMessage(`Direct Invoice Completed: ${orderNumber}`, 'success');
    }

    // Update sales metrics in store
    addOrderToReport(finalOrder);

    // Free the table. `selectedTableId` holds the table *number* (orders track
    // tables by number), so resolve the real floor-table id before clearing.
    if (selectedTableId) {
      const floorTable = useFloorStore
        .getState()
        .tables.find((t) => t.id === selectedTableId || t.tableNo === selectedTableId);
      if (floorTable) {
        updateTableStatus(floorTable.id, 'available');
      }
    }

    // Clear cart and show post-payment settlement modal
    clearCart();
    setSettledOrder(finalOrder);
    setSuccessModalVisible(true);
  };

  const handlePostPaymentPrint = () => {
    if (settledOrder) {
      setActiveOrderForModal(settledOrder);
      setReceiptModalVisible(true);
    }
  };

  const handlePostPaymentWhatsApp = () => {
    if (settledOrder) {
      setActiveOrderForModal(settledOrder);
      setWhatsAppModalVisible(true);
    }
  };

  const handleDismissSuccess = (routeTo: 'floor' | 'menu') => {
    setSuccessModalVisible(false);
    setSettledOrder(null);
    onNavigate(routeTo);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Collect Payment & Invoicing</Text>

      <View style={styles.contentRow}>
        {/* Column 1: Receipt Preview */}
        <View
          style={[
            styles.leftCol,
            styles.billingCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              width: isLargeScreen ? '33%' : '38%',
            },
            SHADOWS.sm,
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Order Summary</Text>

          <ScrollView
            style={styles.itemsScroll}
            contentContainerStyle={styles.itemsContent}
            showsVerticalScrollIndicator={false}
          >
            {cartItems.map((item) => (
              <View
                key={item.product.id}
                style={[styles.itemRow, { borderBottomColor: colors.border }]}
              >
                <View style={styles.itemNameCol}>
                  <Text style={[styles.itemQty, { color: colors.primary }]}>{item.quantity}x</Text>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                    {item.product.name}
                  </Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                  {formatCurrency(item.product.price * item.quantity)}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Receipt Math */}
          <View style={[styles.mathPanel, { borderTopColor: colors.border }]}>
            <View style={styles.mathRow}>
              <Text style={[styles.mathLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.mathVal, { color: colors.textPrimary }]}>
                {formatCurrency(subtotal)}
              </Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.mathRow}>
                <Text style={[styles.mathLabel, { color: colors.textSecondary }]}>
                  Discount Applied
                </Text>
                <Text style={[styles.mathVal, { color: colors.error }]}>
                  -{formatCurrency(discountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.mathRow}>
              <Text style={[styles.mathLabel, { color: colors.textSecondary }]}>GST (18%)</Text>
              <Text style={[styles.mathVal, { color: colors.textPrimary }]}>
                {formatCurrency(gst)}
              </Text>
            </View>
            <View style={[styles.mathRow, styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Net Payable</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {formatCurrency(total)}
              </Text>
            </View>
          </View>

          {/* Quick Pre-Payment Bill Actions */}
          <View style={[styles.quickBillActionsRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={openReceiptModalForDraft}
              activeOpacity={0.7}
              style={[
                styles.quickBillBtn,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons name="printer-outline" size={18} color={colors.textPrimary} />
              <Text style={[styles.quickBillBtnText, { color: colors.textPrimary }]}>
                80mm Preview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openWhatsAppModalForDraft}
              activeOpacity={0.7}
              style={[
                styles.quickBillBtn,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
              <Text style={[styles.quickBillBtnText, { color: colors.textPrimary }]}>
                WhatsApp Bill
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3-Column vs 2-Column layout choice */}
        {isLargeScreen ? (
          <>
            {/* Column 2: Payment method vertical selector */}
            <View style={{ width: '25%', justifyContent: 'flex-start' }}>
              <Text
                style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: SPACING.md }]}
              >
                Payment Method
              </Text>

              <TouchableOpacity
                onPress={() => setPayMethod('cash')}
                style={[
                  styles.payMethodTab,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    width: '100%',
                    height: 90,
                    marginBottom: SPACING.md,
                  },
                  payMethod === 'cash' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <MaterialCommunityIcons
                  name="cash"
                  size={32}
                  color={payMethod === 'cash' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.payMethodLabel, { color: colors.textPrimary }]}>Cash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setPayMethod('upi');
                  setUpiQrVisible(true);
                }}
                style={[
                  styles.payMethodTab,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    width: '100%',
                    height: 90,
                    marginBottom: SPACING.md,
                  },
                  payMethod === 'upi' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <MaterialCommunityIcons
                  name="qrcode"
                  size={32}
                  color={payMethod === 'upi' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.payMethodLabel, { color: colors.textPrimary }]}>UPI Scan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPayMethod('card')}
                style={[
                  styles.payMethodTab,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    width: '100%',
                    height: 90,
                    marginBottom: SPACING.md,
                  },
                  payMethod === 'card' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={32}
                  color={payMethod === 'card' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.payMethodLabel, { color: colors.textPrimary }]}>
                  Card Swipe
                </Text>
              </TouchableOpacity>
            </View>

            {/* Column 3: Payment Terminal calculations + action triggers */}
            <View style={[styles.rightCol, { width: '38%', justifyContent: 'space-between' }]}>
              <View
                style={[
                  styles.paymentTerminalPanel,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    flex: 1,
                    height: undefined,
                    marginBottom: SPACING.md,
                  },
                  SHADOWS.sm,
                ]}
              >
                {payMethod === 'cash' ? (
                  <View style={styles.cashTerminal}>
                    <Text style={[styles.terminalTitle, { color: colors.textPrimary }]}>
                      Cash Tender Calculator
                    </Text>

                    <View style={styles.cashInputsRow}>
                      <View style={styles.amountDisplay}>
                        <Text style={styles.cashInputSub}>Bill Total</Text>
                        <Text style={[styles.cashInputValText, { color: colors.textPrimary }]}>
                          {formatCurrency(total)}
                        </Text>
                      </View>

                      <View style={styles.amountDisplay}>
                        <Text style={styles.cashInputSub}>Cash Received (₹)</Text>
                        <TextInput
                          style={[
                            styles.receivedTextInput,
                            { color: colors.primary, borderColor: colors.border },
                          ]}
                          keyboardType="numeric"
                          value={cashReceived}
                          onChangeText={setCashReceived}
                          selectTextOnFocus
                        />
                      </View>
                    </View>

                    <Text style={[styles.quickCashTitle, { color: colors.textSecondary }]}>
                      Quick Cash Suggestions
                    </Text>
                    <View style={styles.quickCashRow}>
                      {quickCashOptions.map((opt, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => handleQuickCash(opt.value)}
                          style={[
                            styles.quickCashBtn,
                            { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                          ]}
                        >
                          <Text style={[styles.quickCashText, { color: colors.textPrimary }]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View
                      style={[styles.changeReturnRow, { backgroundColor: colors.primaryLight }]}
                    >
                      <Text style={[styles.changeReturnLabel, { color: colors.primary }]}>
                        Change Return Amount
                      </Text>
                      <Text style={[styles.changeReturnValue, { color: colors.primary }]}>
                        {formatCurrency(changeReturn)}
                      </Text>
                    </View>
                  </View>
                ) : payMethod === 'upi' ? (
                  <View style={styles.upiTerminal}>
                    <Text style={[styles.terminalTitle, { color: colors.textPrimary }]}>
                      UPI Dynamic QR Code Payment
                    </Text>
                    <Text style={[styles.upiSubText, { color: colors.textSecondary }]}>
                      A dynamic payment request QR has been generated for amount:{' '}
                      <Text style={{ fontWeight: 'bold', color: colors.primary }}>
                        {formatCurrency(total)}
                      </Text>
                    </Text>

                    <TouchableOpacity
                      onPress={() => setUpiQrVisible(true)}
                      style={[
                        styles.upiQrBox,
                        { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                      ]}
                    >
                      <MaterialCommunityIcons name="qrcode" size={100} color={colors.textPrimary} />
                      <Text style={[styles.scanPromptText, { color: colors.primary }]}>
                        TAP TO VIEW LARGE QR
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.upiInstruction, { color: colors.textMuted }]}>
                      Ask customer to scan using GPay, PhonePe, BHIM, or Paytm.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardTerminal}>
                    <Text style={[styles.terminalTitle, { color: colors.textPrimary }]}>
                      POS Card Terminal
                    </Text>
                    <View style={styles.cardTerminalIllustration}>
                      <MaterialCommunityIcons
                        name="credit-card-scan-outline"
                        size={80}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={[styles.cardInstructions, { color: colors.textSecondary }]}>
                      Please insert/swipe/tap the customer's card on the connected physical
                      credit/debit card swipe machine.
                    </Text>
                    <Text style={[styles.cardTerminalWait, { color: colors.textMuted }]}>
                      Awaiting confirmation from Card Terminal...
                    </Text>
                  </View>
                )}
              </View>

              {/* Action row at bottom */}
              <View style={styles.terminalActionsRow}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => onNavigate('menu')}
                  style={styles.cancelColBtn}
                />
                <Button
                  label="Settle & Complete Invoice"
                  variant="primary"
                  icon="check-circle-outline"
                  onPress={handleCompleteTransaction}
                  style={styles.finalizeColBtn}
                />
              </View>
            </View>
          </>
        ) : (
          /* 2-Column layout on smaller landscape displays */
          <View style={[styles.rightCol, { width: '59%', justifyContent: 'space-between' }]}>
            <View>
              <View style={styles.payMethodsGrid}>
                <TouchableOpacity
                  onPress={() => setPayMethod('cash')}
                  style={[
                    styles.payMethodTab,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    payMethod === 'cash' && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="cash"
                    size={32}
                    color={payMethod === 'cash' ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.payMethodLabel, { color: colors.textPrimary }]}>Cash</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setPayMethod('upi');
                    setUpiQrVisible(true);
                  }}
                  style={[
                    styles.payMethodTab,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    payMethod === 'upi' && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="qrcode"
                    size={32}
                    color={payMethod === 'upi' ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.payMethodLabel, { color: colors.textPrimary }]}>
                    UPI Scan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPayMethod('card')}
                  style={[
                    styles.payMethodTab,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    payMethod === 'card' && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="credit-card-outline"
                    size={32}
                    color={payMethod === 'card' ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.payMethodLabel, { color: colors.textPrimary }]}>
                    Card Swipe
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.paymentTerminalPanel,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  SHADOWS.sm,
                ]}
              >
                {payMethod === 'cash' ? (
                  <View style={styles.cashTerminal}>
                    <Text style={[styles.terminalTitle, { color: colors.textPrimary }]}>
                      Cash Tender Calculator
                    </Text>

                    <View style={styles.cashInputsRow}>
                      <View style={styles.amountDisplay}>
                        <Text style={styles.cashInputSub}>Bill Total</Text>
                        <Text style={[styles.cashInputValText, { color: colors.textPrimary }]}>
                          {formatCurrency(total)}
                        </Text>
                      </View>

                      <View style={styles.amountDisplay}>
                        <Text style={styles.cashInputSub}>Cash Received (₹)</Text>
                        <TextInput
                          style={[
                            styles.receivedTextInput,
                            { color: colors.primary, borderColor: colors.border },
                          ]}
                          keyboardType="numeric"
                          value={cashReceived}
                          onChangeText={setCashReceived}
                          selectTextOnFocus
                        />
                      </View>
                    </View>

                    <Text style={[styles.quickCashTitle, { color: colors.textSecondary }]}>
                      Quick Cash Suggestions
                    </Text>
                    <View style={styles.quickCashRow}>
                      {quickCashOptions.map((opt, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => handleQuickCash(opt.value)}
                          style={[
                            styles.quickCashBtn,
                            { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                          ]}
                        >
                          <Text style={[styles.quickCashText, { color: colors.textPrimary }]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View
                      style={[styles.changeReturnRow, { backgroundColor: colors.primaryLight }]}
                    >
                      <Text style={[styles.changeReturnLabel, { color: colors.primary }]}>
                        Change Return Amount
                      </Text>
                      <Text style={[styles.changeReturnValue, { color: colors.primary }]}>
                        {formatCurrency(changeReturn)}
                      </Text>
                    </View>
                  </View>
                ) : payMethod === 'upi' ? (
                  <View style={styles.upiTerminal}>
                    <Text style={[styles.terminalTitle, { color: colors.textPrimary }]}>
                      UPI Dynamic QR Code Payment
                    </Text>
                    <Text style={[styles.upiSubText, { color: colors.textSecondary }]}>
                      A dynamic payment request QR has been generated for amount:{' '}
                      <Text style={{ fontWeight: 'bold', color: colors.primary }}>
                        {formatCurrency(total)}
                      </Text>
                    </Text>

                    <TouchableOpacity
                      onPress={() => setUpiQrVisible(true)}
                      style={[
                        styles.upiQrBox,
                        { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                      ]}
                    >
                      <MaterialCommunityIcons name="qrcode" size={100} color={colors.textPrimary} />
                      <Text style={[styles.scanPromptText, { color: colors.primary }]}>
                        TAP TO VIEW LARGE QR
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.upiInstruction, { color: colors.textMuted }]}>
                      Ask customer to scan using GPay, PhonePe, BHIM, or Paytm.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardTerminal}>
                    <Text style={[styles.terminalTitle, { color: colors.textPrimary }]}>
                      POS Card Terminal
                    </Text>
                    <View style={styles.cardTerminalIllustration}>
                      <MaterialCommunityIcons
                        name="credit-card-scan-outline"
                        size={80}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={[styles.cardInstructions, { color: colors.textSecondary }]}>
                      Please insert/swipe/tap the customer's card on the connected physical
                      credit/debit card swipe machine.
                    </Text>
                    <Text style={[styles.cardTerminalWait, { color: colors.textMuted }]}>
                      Awaiting confirmation from Card Terminal...
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.terminalActionsRow}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => onNavigate('menu')}
                style={styles.cancelColBtn}
              />
              <Button
                label="Settle & Complete Invoice"
                variant="primary"
                icon="check-circle-outline"
                onPress={handleCompleteTransaction}
                style={styles.finalizeColBtn}
              />
            </View>
          </View>
        )}
      </View>

      {/* Large UPI QR Modal */}
      <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} transparent visible={upiQrVisible} animationType="fade">
        <View style={[styles.qrOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.qrModalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOWS.xl,
            ]}
          >
            <View style={[styles.qrHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>UPI QR Payment</Text>
              <TouchableOpacity onPress={() => setUpiQrVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrCodeWrapper}>
              <View style={[styles.largeQrIndicator, { borderColor: colors.border }]}>
                <MaterialCommunityIcons name="qrcode" size={160} color={colors.textPrimary} />
              </View>
              <Text style={[styles.qrPriceDisplay, { color: colors.primary }]}>
                {formatCurrency(total)}
              </Text>
              <Text style={[styles.qrMerchant, { color: colors.textSecondary }]}>
                Merchant: SANWARIYA KITCHEN
              </Text>
            </View>

            <Button
              label="I Have Received payment"
              variant="primary"
              onPress={() => {
                setUpiQrVisible(false);
                handleCompleteTransaction();
              }}
              style={styles.confirmQrBtn}
            />
          </View>
        </View>
      </Modal>

      {/* Post-Payment Settlement Success Modal */}
      <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} transparent visible={successModalVisible} animationType="fade">
        <View style={[styles.qrOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.successModalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOWS.xl,
            ]}
          >
            {/* Header / Success Icon */}
            <View style={styles.successIconBadge}>
              <MaterialCommunityIcons name="check-decagram" size={64} color={colors.success} />
            </View>

            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
              Payment Successful!
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
              Invoice #{settledOrder?.orderNumber} has been finalized.
            </Text>

            <View
              style={[
                styles.successSummaryCard,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
            >
              <View style={styles.successSummaryRow}>
                <Text style={[styles.summaryRowLabel, { color: colors.textSecondary }]}>
                  Amount Settled
                </Text>
                <Text style={[styles.summaryRowValBold, { color: colors.primary }]}>
                  {formatCurrency(settledOrder?.total || 0)}
                </Text>
              </View>
              <View style={styles.successSummaryRow}>
                <Text style={[styles.summaryRowLabel, { color: colors.textSecondary }]}>
                  Payment Method
                </Text>
                <Text style={[styles.summaryRowVal, { color: colors.textPrimary }]}>
                  {(settledOrder?.paymentMethod || 'CASH').toUpperCase()}
                </Text>
              </View>
              {settledOrder?.tableName && (
                <View style={styles.successSummaryRow}>
                  <Text style={[styles.summaryRowLabel, { color: colors.textSecondary }]}>
                    Table Status
                  </Text>
                  <Text style={[styles.summaryRowVal, { color: colors.success }]}>
                    Released & Available
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Bill Actions Post Payment */}
            <Text style={[styles.deliveryActionsTitle, { color: colors.textSecondary }]}>
              Deliver Bill to Customer
            </Text>

            <View style={styles.postBillActionsRow}>
              <TouchableOpacity
                onPress={handlePostPaymentPrint}
                activeOpacity={0.7}
                style={[
                  styles.postBillActionBtn,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                ]}
              >
                <MaterialCommunityIcons name="printer" size={24} color={colors.primary} />
                <Text style={[styles.postBillActionText, { color: colors.textPrimary }]}>
                  Print 80mm Receipt
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePostPaymentWhatsApp}
                activeOpacity={0.7}
                style={[
                  styles.postBillActionBtn,
                  { backgroundColor: 'rgba(37, 211, 102, 0.1)', borderColor: '#25D366' },
                ]}
              >
                <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
                <Text style={[styles.postBillActionText, { color: colors.textPrimary }]}>
                  Send on WhatsApp
                </Text>
              </TouchableOpacity>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.successFooterRow}>
              <Button
                label="Return to Floor"
                variant="outline"
                icon="floor-plan"
                onPress={() => handleDismissSuccess('floor')}
                style={{ flex: 0.48 }}
              />
              <Button
                label="Start New Order"
                variant="primary"
                icon="food-fork-drink"
                onPress={() => handleDismissSuccess('menu')}
                style={{ flex: 0.48 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Reusable 80mm Receipt Preview Modal */}
      <ReceiptPreviewModal
        visible={receiptModalVisible}
        order={activeOrderForModal}
        onClose={() => setReceiptModalVisible(false)}
        onPrintSuccess={(msg) => showToastMessage(msg, 'success')}
      />

      {/* Reusable WhatsApp Bill Modal */}
      <WhatsAppModal
        visible={whatsAppModalVisible}
        order={activeOrderForModal}
        initialPhone={activeOrderForModal?.customerPhone}
        onClose={() => setWhatsAppModalVisible(false)}
        onSuccess={(msg) => showToastMessage(msg, 'success')}
        onError={(err) => showToastMessage(err, 'error')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.lg,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftCol: {
    height: '100%',
  },
  rightCol: {
    height: '100%',
  },
  billingCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.sm,
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContent: {
    paddingBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
  },
  itemNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    width: 28,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  mathPanel: {
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    marginTop: SPACING.xs,
  },
  mathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  mathLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  mathVal: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  // Right Col: Pay Terminals
  payMethodsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  payMethodTab: {
    width: '32%',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
  },
  payMethodLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: SPACING.xs,
  },
  paymentTerminalPanel: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    height: 310,
    justifyContent: 'center',
  },
  terminalTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.sm,
  },
  // Cash Calculator
  cashTerminal: {
    flex: 1,
  },
  cashInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  amountDisplay: {
    width: '48%',
  },
  cashInputSub: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 4,
  },
  cashInputValText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    paddingVertical: SPACING.xs,
  },
  receivedTextInput: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
  },
  quickCashTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  quickCashRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  quickCashBtn: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginRight: 6,
    marginBottom: 6,
    height: 36,
    justifyContent: 'center',
  },
  quickCashText: {
    fontSize: 11,
    fontWeight: '600',
  },
  changeReturnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: 'auto',
  },
  changeReturnLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  changeReturnValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  // UPI styles
  upiTerminal: {
    alignItems: 'center',
  },
  upiSubText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  upiQrBox: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  scanPromptText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
  upiInstruction: {
    fontSize: 11,
    marginTop: SPACING.md,
  },
  // Card styles
  cardTerminal: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  cardTerminalIllustration: {
    marginBottom: SPACING.md,
  },
  cardInstructions: {
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  cardTerminalWait: {
    fontSize: 11,
  },
  // Footer
  terminalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  cancelColBtn: {
    width: '35%',
    minHeight: 56,
  },
  finalizeColBtn: {
    width: '62%',
    minHeight: 56,
  },
  // QR Modal Styles
  qrOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalBox: {
    width: 320,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: SPACING.xs,
  },
  qrTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  largeQrIndicator: {
    borderWidth: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  qrPriceDisplay: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  qrMerchant: {
    fontSize: 11,
    marginTop: 2,
  },
  confirmQrBtn: {
    width: '100%',
    minHeight: 56,
  },
  // Quick Bill Actions in Left Panel
  quickBillActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    marginTop: SPACING.xs,
  },
  quickBillBtn: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  quickBillBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Post Payment Success Modal
  successModalBox: {
    width: 460,
    maxWidth: '90%',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  successIconBadge: {
    marginBottom: SPACING.xs,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  successSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  successSummaryCard: {
    width: '100%',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  successSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  summaryRowLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  summaryRowVal: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
  },
  summaryRowValBold: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: 'bold',
  },
  deliveryActionsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    alignSelf: 'flex-start',
  },
  postBillActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  postBillActionBtn: {
    flex: 0.48,
    height: 60,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  postBillActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  successFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

