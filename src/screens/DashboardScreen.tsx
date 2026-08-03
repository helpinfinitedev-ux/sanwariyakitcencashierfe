import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, BREAKPOINTS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useReportStore } from '@/stores/useReportStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { SummaryCard } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';

interface DashboardScreenProps {
  onNavigate: (route: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const { report } = useReportStore();
  const tables = useFloorStore((state) => state.tables);
  const { orders } = useOrderStore();
  const { width: screenWidth } = useWindowDimensions();

  const isMediumWidth = screenWidth < BREAKPOINTS.large; // under 1366px

  const statsCardWidth = isMediumWidth ? '48%' : '24%';
  const statsCardMarginBottom = SPACING.md;
  const kitchenCardWidth = isMediumWidth ? '48%' : '32%';
  const actionCardWidth = isMediumWidth ? '48%' : '19%';
  const actionCardMarginBottom = SPACING.md;

  const reportLayoutFlexDirection = isMediumWidth ? 'column' : 'row';
  const reportCardWidth = isMediumWidth ? '100%' : '49%';
  const reportCardMarginBottom = isMediumWidth ? SPACING.lg : 0;

  // Dynamic calculation of table metrics
  const occupiedTables = tables.filter(
    (t) => t.status === 'occupied' || t.status === 'billing',
  ).length;
  const availableTables = tables.filter((t) => t.status === 'available').length;

  // Dynamic calculation of order status metrics
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const preparingOrdersCount = orders.filter((o) => o.status === 'preparing' || o.status === 'accepted').length;
  const readyOrdersCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Page Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>Dashboard & Overview</Text>

      {/* Main Operations Stats */}
      <View style={styles.statsRow}>
        <View
          style={[styles.statsCol, { width: statsCardWidth, marginBottom: statsCardMarginBottom }]}
        >
          <SummaryCard
            title="Today's Sales"
            value={formatCurrency(report.salesToday)}
            icon="currency-inr"
            trend="+12.4% from yesterday"
            trendDirection="up"
            variant="primary"
          />
        </View>
        <View
          style={[styles.statsCol, { width: statsCardWidth, marginBottom: statsCardMarginBottom }]}
        >
          <SummaryCard
            title="Orders Completed"
            value={report.ordersTodayCount}
            icon="clipboard-check-outline"
            trend="+5.2% from average"
            trendDirection="up"
          />
        </View>
        <View
          style={[styles.statsCol, { width: statsCardWidth, marginBottom: statsCardMarginBottom }]}
        >
          <SummaryCard
            title="Occupied Tables"
            value={`${occupiedTables} / ${tables.length}`}
            icon="table-chair"
            trend={`${((occupiedTables / tables.length) * 100).toFixed(0)}% Occupancy`}
            trendDirection="up"
          />
        </View>
        <View
          style={[styles.statsCol, { width: statsCardWidth, marginBottom: statsCardMarginBottom }]}
        >
          <SummaryCard
            title="Available Tables"
            value={availableTables}
            icon="check-circle-outline"
            trend="Ready for guests"
            trendDirection="up"
          />
        </View>
      </View>

      {/* Kitchen KOT Status Queue */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Kitchen KOT Queue</Text>
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statsCol,
            { width: kitchenCardWidth, marginBottom: statsCardMarginBottom },
          ]}
        >
          <SummaryCard
            title="Pending KOTs"
            value={pendingOrdersCount}
            icon="clock-outline"
            trend="Awaiting preparation"
            trendDirection="up"
          />
        </View>
        <View
          style={[
            styles.statsCol,
            { width: kitchenCardWidth, marginBottom: statsCardMarginBottom },
          ]}
        >
          <SummaryCard
            title="Preparing KOTs"
            value={preparingOrdersCount}
            icon="fire"
            trend="Under chef preparation"
            trendDirection="up"
          />
        </View>
        <View
          style={[
            styles.statsCol,
            { width: kitchenCardWidth, marginBottom: statsCardMarginBottom },
          ]}
        >
          <SummaryCard
            title="Ready KOTs"
            value={readyOrdersCount}
            icon="bell-ring-outline"
            trend="Ready to serve/collect"
            trendDirection="up"
          />
        </View>
      </View>

      {/* Quick Action Shortcuts */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacityAction
          title="Takeaway Order"
          desc="Create rapid KOT for walk-in takeaway"
          icon="bag-checked"
          onPress={() => {
            // Clear cart & switch to takeaway
            import('@/stores/useCartStore').then((store) => {
              store.useCartStore.getState().clearCart();
              store.useCartStore.getState().setOrderType('takeaway');
            });
            onNavigate('menu');
          }}
          colors={colors}
          style={{ width: actionCardWidth, marginBottom: actionCardMarginBottom }}
        />
        <TouchableOpacityAction
          title="Floor Table Map"
          desc="View and manage sit-down dining layout"
          icon="floor-plan"
          onPress={() => onNavigate('floor')}
          colors={colors}
          style={{ width: actionCardWidth, marginBottom: actionCardMarginBottom }}
        />
        <TouchableOpacityAction
          title="Active Orders List"
          desc="Track preparing food or process checks"
          icon="clipboard-list-outline"
          onPress={() => onNavigate('orders')}
          colors={colors}
          style={{ width: actionCardWidth, marginBottom: actionCardMarginBottom }}
        />
        <TouchableOpacityAction
          title="Quick Billing"
          desc="Collect payment and print receipts"
          icon="cash-register"
          onPress={() => onNavigate('billing')}
          colors={colors}
          style={{ width: actionCardWidth, marginBottom: actionCardMarginBottom }}
        />
        <TouchableOpacityAction
          title="System Settings"
          desc="Adjust receipt printing or toggle themes"
          icon="cog-outline"
          onPress={() => onNavigate('settings')}
          colors={colors}
          style={{ width: actionCardWidth, marginBottom: actionCardMarginBottom }}
        />
      </View>

      {/* Two Column Layout for Reports */}
      <View style={[styles.reportSectionRow, { flexDirection: reportLayoutFlexDirection }]}>
        {/* Popular Dishes */}
        <View
          style={[
            styles.reportCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              width: reportCardWidth,
              marginBottom: reportCardMarginBottom,
            },
          ]}
        >
          <Text style={[styles.reportCardTitle, { color: colors.textPrimary }]}>
            Top Selling Items
          </Text>
          <View style={styles.reportList}>
            {report.popularProducts.slice(0, 5).map((prod, index) => (
              <View
                key={prod.name}
                style={[styles.reportItemRow, { borderBottomColor: colors.border }]}
              >
                <View style={styles.reportItemNameCol}>
                  <Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text>
                  <Text style={[styles.reportItemName, { color: colors.textPrimary }]}>
                    {prod.name}
                  </Text>
                </View>
                <View style={styles.reportItemValCol}>
                  <Text style={[styles.reportItemQty, { color: colors.textSecondary }]}>
                    {prod.quantity} sold
                  </Text>
                  <Text style={[styles.reportItemAmt, { color: colors.textPrimary }]}>
                    {formatCurrency(prod.amount)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Revenue by Channel */}
        <View
          style={[
            styles.reportCard,
            { backgroundColor: colors.surface, borderColor: colors.border, width: reportCardWidth },
          ]}
        >
          <Text style={[styles.reportCardTitle, { color: colors.textPrimary }]}>
            Sales by Channels
          </Text>
          <View style={styles.channelSalesList}>
            <ChannelItem
              label="Dine-In"
              value={report.dineInSales}
              icon="table-chair"
              color={colors.primary}
              colors={colors}
            />
            <ChannelItem
              label="Takeaway"
              value={report.takeawaySales}
              icon="bag-checked"
              color={colors.secondary}
              colors={colors}
            />
            <ChannelItem
              label="Home Delivery"
              value={report.deliverySales}
              icon="truck-delivery-outline"
              color={colors.success}
              colors={colors}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// Sub-components for Cleanliness
interface TouchActionProps {
  title: string;
  desc: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  colors: any;
  style?: any;
}

const TouchableOpacityAction: React.FC<TouchActionProps> = ({
  title,
  desc,
  icon,
  onPress,
  colors,
  style,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      styles.actionCard,
      { backgroundColor: colors.surface, borderColor: colors.border },
      style,
    ]}
  >
    <View style={[styles.actionIconContainer, { backgroundColor: colors.primaryLight }]}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
    </View>
    <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{title}</Text>
    <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{desc}</Text>
  </TouchableOpacity>
);

interface ChannelItemProps {
  label: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  colors: any;
}

const ChannelItem: React.FC<ChannelItemProps> = ({ label, value, icon, color, colors }) => (
  <View style={[styles.channelRow, { borderBottomColor: colors.border }]}>
    <View style={styles.channelLabelCol}>
      <View style={[styles.channelIconBg, { backgroundColor: colors.surfaceLight }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.channelLabel, { color: colors.textPrimary }]}>{label}</Text>
    </View>
    <Text style={[styles.channelValue, { color: colors.textPrimary }]}>
      {formatCurrency(value)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statsCol: {
    // Width set dynamically in component
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.md,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  actionCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 120, // touch target size helper
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  actionDesc: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 14,
  },
  reportSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  reportCardTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.md,
  },
  reportList: {
    marginTop: SPACING.xs,
  },
  reportItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
  },
  reportItemNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    width: 24,
  },
  reportItemName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  reportItemValCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportItemQty: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginRight: SPACING.md,
  },
  reportItemAmt: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    width: 80,
    textAlign: 'right',
  },
  channelSalesList: {
    marginTop: SPACING.xs,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
    height: 55,
  },
  channelLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelIconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  channelLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  channelValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
