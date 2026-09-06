import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useCartStore } from '@/stores/useCartStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { OrderCard } from '@/components/ui/Card';

import { EmptyState } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { Order } from '@/mock/data';
import { ReceiptPreviewModal } from '@/components/ui/ReceiptPreviewModal';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';

interface OrdersScreenProps {
  onNavigate: (route: string) => void;
  showToastMessage: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ onNavigate, showToastMessage }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  // Store variables
  const { orders, cancelOrder } = useOrderStore();
  const updateTableStatus = useFloorStore((state) => state.updateTableStatus);
  const loadOrderIntoCart = useCartStore((state) => state.loadOrderIntoCart);

  // Tab state
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Cancel Confirmation
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);

  // Print & WhatsApp Modals
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [whatsAppModalVisible, setWhatsAppModalVisible] = useState(false);

  // Filtering orders
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'active') {
      return order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'pending' && order.status !== 'rejected';
    } else {
      return order.status === 'completed' || order.status === 'cancelled' || order.status === 'rejected';
    }
  });

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleOpenReceiptModal = () => {
    if (selectedOrder) {
      setReceiptModalVisible(true);
    }
  };

  const handleOpenWhatsAppModal = () => {
    if (selectedOrder) {
      setWhatsAppModalVisible(true);
    }
  };

  const handleCollectPayment = () => {
    if (selectedOrder) {
      // Load order into cart store and go to checkout screen
      loadOrderIntoCart(selectedOrder);
      setDetailModalVisible(false);
      onNavigate('billing');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Order Management</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('active')}
          activeOpacity={0.7}
          style={[
            styles.tabButton,
            { borderColor: colors.border },
            activeTab === 'active' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'active' ? '#FFF' : colors.textPrimary },
            ]}
          >
            Active Orders (
            {orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'pending' && o.status !== 'rejected').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
          style={[
            styles.tabButton,
            { borderColor: colors.border },
            activeTab === 'history' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'history' ? '#FFF' : colors.textPrimary },
            ]}
          >
            Order History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title={activeTab === 'active' ? 'No Active Orders' : 'No Order History'}
          description={
            activeTab === 'active'
              ? 'There are currently no active kitchen orders in progress.'
              : 'No transactions have been recorded today.'
          }
          icon={activeTab === 'active' ? 'clipboard-text-outline' : 'clipboard-outline'}
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.gridItemCol}>
              <OrderCard order={item} onPress={() => handleOrderPress(item)} />
            </View>
          )}
        />
      )}

      {/* Order Details Sliding Overlay */}
      <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} transparent visible={detailModalVisible} animationType="slide">
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOWS.xl,
            ]}
          >
            {/* Header info */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Order Details: {selectedOrder?.orderNumber}
                </Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  {selectedOrder && formatDate(selectedOrder.createdAt)} at{' '}
                  {selectedOrder && formatTime(selectedOrder.createdAt)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Content Details */}
            {selectedOrder && (
              <ScrollView
                style={styles.detailsScroll}
                contentContainerStyle={styles.detailsContent}
              >
                {/* Meta details cards */}
                <View style={styles.metaRow}>
                  <DetailBadge
                    label={selectedOrder.type.toUpperCase()}
                    icon="shopping"
                    color={colors.primary}
                    colors={colors}
                  />
                  <DetailBadge
                    label={
                      selectedOrder.tableName ? `Table: ${selectedOrder.tableName}` : 'Takeaway'
                    }
                    icon="table-chair"
                    color={colors.secondary}
                    colors={colors}
                  />
                  {selectedOrder.waiterName && (
                    <DetailBadge
                      label={`Waiter: ${selectedOrder.waiterName}`}
                      icon="account-tie"
                      color={colors.textSecondary}
                      colors={colors}
                    />
                  )}
                </View>

                {/* Items List */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Items Summary
                </Text>
                <View style={[styles.itemsContainer, { borderColor: colors.border }]}>
                  {selectedOrder.items.map((item, idx) => (
                    <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.itemNameCol}>
                        <Text style={[styles.itemQty, { color: colors.primary }]}>
                          {item.quantity}x
                        </Text>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          {item.product.name}
                        </Text>
                      </View>
                      <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                        {formatCurrency(item.product.price * item.quantity)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Calculation breakdown */}
                <View style={styles.calcContainer}>
                  <View style={styles.calcRow}>
                    <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
                    <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                      {formatCurrency(selectedOrder.subtotal)}
                    </Text>
                  </View>
                  {selectedOrder.discount > 0 && (
                    <View style={styles.calcRow}>
                      <Text style={{ color: colors.textSecondary }}>Discount</Text>
                      <Text style={{ color: colors.error }}>
                        -{formatCurrency(selectedOrder.discount)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.calcRow}>
                    <Text style={{ color: colors.textSecondary }}>GST (5%)</Text>
                    <Text style={{ color: colors.textPrimary }}>
                      {formatCurrency(selectedOrder.gst)}
                    </Text>
                  </View>
                  <View
                    style={[styles.calcRow, styles.totalRow, { borderTopColor: colors.border }]}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontWeight: 'bold',
                        fontSize: TYPOGRAPHY.sizes.md,
                      }}
                    >
                      Total Paid/Payable
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: 'bold',
                        fontSize: TYPOGRAPHY.sizes.lg,
                      }}
                    >
                      {formatCurrency(selectedOrder.total)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Dialog Action Buttons */}
            {selectedOrder && (
              <View style={[styles.modalActionsRow, { borderTopColor: colors.border }]}>
                 {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'rejected' ? (
                  <>
                    <Button
                      label="Collect & Checkout"
                      variant="primary"
                      icon="cash-register"
                      onPress={handleCollectPayment}
                      style={styles.checkoutBtn}
                    />
                  </>
                ) : (
                  <>
                    <Button
                      label="Print 80mm Receipt"
                      variant="primary"
                      icon="printer"
                      onPress={handleOpenReceiptModal}
                      style={{ flex: 1, marginRight: SPACING.xs }}
                    />
                    <Button
                      label="WhatsApp Bill"
                      variant="secondary"
                      icon="whatsapp"
                      onPress={handleOpenWhatsAppModal}
                      style={{ flex: 1, marginRight: SPACING.xs }}
                    />
                    <Button
                      label="Close"
                      variant="outline"
                      onPress={() => setDetailModalVisible(false)}
                      style={{ width: 100 }}
                    />
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Reusable 80mm Receipt Preview Modal */}
      <ReceiptPreviewModal
        visible={receiptModalVisible}
        order={selectedOrder}
        onClose={() => setReceiptModalVisible(false)}
        onPrintSuccess={(msg) => showToastMessage(msg, 'success')}
      />

      {/* Reusable WhatsApp Bill Modal */}
      <WhatsAppModal
        visible={whatsAppModalVisible}
        order={selectedOrder}
        initialPhone={selectedOrder?.customerPhone}
        onClose={() => setWhatsAppModalVisible(false)}
        onSuccess={(msg) => showToastMessage(msg, 'success')}
        onError={(err) => showToastMessage(err, 'error')}
      />
    </View>
  );
};

// Sub-components
interface DetailBadgeProps {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  colors: any;
}

const DetailBadge: React.FC<DetailBadgeProps> = ({ label, icon, color, colors }) => (
  <View style={[styles.detailBadgeCard, { backgroundColor: colors.surfaceLight }]}>
    <MaterialCommunityIcons name={icon} size={14} color={color} />
    <Text style={[styles.detailBadgeLabel, { color: colors.textPrimary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  tabButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  gridItemCol: {
    width: '50%',
    paddingHorizontal: SPACING.xs,
  },
  // Details Modal
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '55%',
    height: '80%',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modalSub: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  detailsScroll: {
    flex: 1,
    marginTop: SPACING.md,
  },
  detailsContent: {
    paddingBottom: SPACING.lg,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  detailBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  detailBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.sm,
  },
  itemsContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
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
    width: 32,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  calcContainer: {
    paddingHorizontal: SPACING.xs,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  totalRow: {
    borderTopWidth: 0.5,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  actionBtn: {
    width: '20%',
    minHeight: 44,
  },
  checkoutBtn: {
    width: '32%',
    minHeight: 44,
  },
});
