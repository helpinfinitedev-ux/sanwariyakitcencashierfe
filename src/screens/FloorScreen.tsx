import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { useCartStore } from '@/stores/useCartStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { MOCK_WAITERS, Table } from '@/mock/data';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';

interface FloorScreenProps {
  onNavigate: (route: string) => void;
  showToastMessage: (msg: string) => void;
}

export const FloorScreen: React.FC<FloorScreenProps> = ({ onNavigate, showToastMessage }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();

  // Scale table card size for larger touch displays
  const tableCardSize = screenWidth < 1280 ? 100 : screenWidth < 1600 ? 120 : 140;

  // Floor and Cart stores
  const { floors, tables, selectedFloorId, selectFloor, updateTableStatus } = useFloorStore();
  const { selectTable, selectWaiter, clearCart, loadOrderIntoCart, selectedTableId } =
    useCartStore();
  const { orders } = useOrderStore();

  // Waiter Selection Dialog
  const [waiterModalVisible, setWaiterModalVisible] = useState(false);
  const [activeTableForWaiter, setActiveTableForWaiter] = useState<Table | null>(null);

  // Active Floor details
  const activeFloor = floors.find((f) => f.id === selectedFloorId);
  const activeTables = tables.filter((t) => t.floorId === selectedFloorId);

  const handleTablePress = (table: Table) => {
    // If table is occupied or billing, load its active order immediately into the cart
    if (table.status === 'occupied' || table.status === 'billing') {
      const activeOrder = orders.find(
        (o) => o.tableId === table.id && o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'pending' && o.status !== 'rejected',
      );
      if (activeOrder) {
        loadOrderIntoCart(activeOrder);
        showToastMessage(`Loaded ${table.name} Active Order.`);
      } else {
        // Fallback: create cart session with table
        selectTable(table.id, table.name, activeFloor?.id, activeFloor?.name);
      }
    } else if (table.status === 'available') {
      // Open waiter selection modal to start a new order
      setActiveTableForWaiter(table);
      setWaiterModalVisible(true);
    } else if (table.status === 'cleaning') {
      // Reset table status to available
      updateTableStatus(table.id, 'available');
      showToastMessage(`${table.name} status updated to Available.`);
    } else if (table.status === 'reserved') {
      // Ask to occupy or free the table
      setActiveTableForWaiter(table);
      setWaiterModalVisible(true);
    }
  };

  const selectWaiterAndStartOrder = (waiterId: string, waiterName: string) => {
    if (activeTableForWaiter) {
      // Clear previous cart
      clearCart();
      // Set table & waiter in cart store
      selectTable(
        activeTableForWaiter.id,
        activeTableForWaiter.name,
        activeFloor?.id,
        activeFloor?.name,
      );
      selectWaiter(waiterId, waiterName);

      // Update Table Status to occupied
      updateTableStatus(activeTableForWaiter.id, 'occupied', undefined, waiterId);

      setWaiterModalVisible(false);
      setActiveTableForWaiter(null);

      showToastMessage(`Order started for ${activeTableForWaiter.name} under ${waiterName}.`);
      onNavigate('menu'); // Navigate to Product Menu to add items
    }
  };

  const getTableColor = (status: Table['status']) => {
    switch (status) {
      case 'occupied':
        return colors.error; // Red
      case 'billing':
        return colors.primary; // Orange
      case 'reserved':
        return colors.warning; // Yellow
      case 'cleaning':
        return colors.secondary; // Teal
      case 'available':
      default:
        return colors.success; // Green
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Upper header section */}
      <View style={styles.floorHeader}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Floor Layout Map</Text>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
            Select floor and tap tables to manage dine-in guests.
          </Text>
        </View>

        {/* Legend status checklist */}
        <View style={styles.legendContainer}>
          <LegendItem label="Available" color={colors.success} />
          <LegendItem label="Occupied" color={colors.error} />
          <LegendItem label="Reserved" color={colors.warning} />
          <LegendItem label="Billing" color={colors.primary} />
          <LegendItem label="Cleaning" color={colors.secondary} />
        </View>
      </View>

      {/* Floor selection buttons Row */}
      <View style={styles.tabRow}>
        {floors.map((floor) => {
          const isActive = selectedFloorId === floor.id;
          return (
            <TouchableOpacity
              key={floor.id}
              onPress={() => selectFloor(floor.id)}
              activeOpacity={0.7}
              style={[
                styles.tabButton,
                { borderColor: colors.border },
                isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? '#FFFFFF' : colors.textPrimary },
                  isActive && { fontWeight: TYPOGRAPHY.weights.bold },
                ]}
              >
                {floor.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Interactive floor map grid */}
      <View
        style={[
          styles.mapContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
          SHADOWS.sm,
        ]}
      >
        {activeTables.map((table) => {
          const isTableSelectedInCart = selectedTableId === table.id;
          const tableColor = getTableColor(table.status);
          const activeOrder = orders.find(
            (o) => o.tableId === table.id && o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'pending' && o.status !== 'rejected',
          );

          return (
            <TouchableOpacity
              key={table.id}
              onPress={() => handleTablePress(table)}
              activeOpacity={0.7}
              style={[
                styles.tableElement,
                {
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  width: tableCardSize,
                  height: tableCardSize,
                  borderColor: isTableSelectedInCart ? colors.primary : colors.border,
                  borderWidth: isTableSelectedInCart ? 3 : 1.5,
                  backgroundColor: colors.surfaceLight,
                },
                SHADOWS.md,
              ]}
            >
              {/* Colored status strip */}
              <View style={[styles.tableStatusIndicator, { backgroundColor: tableColor }]} />

              <Text style={[styles.tableLabelText, { color: colors.textPrimary }]}>
                {table.name}
              </Text>

              <View style={styles.tableCapacityRow}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text style={[styles.tableCapacityText, { color: colors.textSecondary }]}>
                  {table.capacity} Pax
                </Text>
              </View>

              {activeOrder && (
                <Text style={[styles.tableOrderAmount, { color: colors.primary }]}>
                  {formatCurrency(activeOrder.total)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {activeTables.length === 0 && (
          <View style={styles.emptyMapContainer}>
            <MaterialCommunityIcons name="floor-plan" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyMapTitle, { color: colors.textSecondary }]}>
              No Tables Added
            </Text>
          </View>
        )}
      </View>

      {/* Waiter Selection Modal */}
      <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} transparent visible={waiterModalVisible} animationType="fade">
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOWS.xl,
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Assign Waiter
                </Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  Select waiter for {activeTableForWaiter?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setWaiterModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.waitersScroll}
              contentContainerStyle={styles.waitersScrollContent}
            >
              {MOCK_WAITERS.map((waiter) => (
                <TouchableOpacity
                  key={waiter.id}
                  onPress={() => selectWaiterAndStartOrder(waiter.id, waiter.name)}
                  activeOpacity={0.7}
                  style={[
                    styles.waiterCard,
                    { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.waiterAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.waiterAvatarText}>
                      {waiter.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </Text>
                  </View>
                  <View style={styles.waiterInfo}>
                    <Text style={[styles.waiterName, { color: colors.textPrimary }]}>
                      {waiter.name}
                    </Text>
                    <Text style={[styles.waiterCode, { color: colors.textMuted }]}>
                      Code: {waiter.code}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button
              label="Cancel"
              variant="outline"
              onPress={() => setWaiterModalVisible(false)}
              style={styles.modalCancelBtn}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Sub-components
interface LegendItemProps {
  label: string;
  color: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ label, color }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  subTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  tabButton: {
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  mapContainer: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    position: 'relative', // essential for absolute table placement
    overflow: 'hidden',
  },
  tableElement: {
    position: 'absolute',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tableStatusIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  tableLabelText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 4,
  },
  tableCapacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tableCapacityText: {
    fontSize: 10,
    marginLeft: 2,
  },
  tableOrderAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  emptyMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMapTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    marginTop: SPACING.sm,
  },
  // Modal Overlays
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 400,
    height: '65%',
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
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modalSub: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  waitersScroll: {
    flex: 1,
    marginTop: SPACING.md,
  },
  waitersScrollContent: {
    paddingBottom: SPACING.md,
  },
  waiterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  waiterAvatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waiterAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  waiterInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  waiterName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  waiterCode: {
    fontSize: 10,
    marginTop: 1,
  },
  modalCancelBtn: {
    marginTop: SPACING.sm,
    height: 56,
  },
});
