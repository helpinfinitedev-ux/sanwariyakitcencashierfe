import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, BREAKPOINTS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useReportStore } from '@/stores/useReportStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { formatCurrency, formatTime } from '@/utils/formatters';
import { Card } from '@/components/ui/Card';

export const ReportsScreen: React.FC = () => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();
  const { report } = useReportStore();
  const { orders } = useOrderStore();

  // Filter completed orders for detailed transactions list
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const isMediumWidth = screenWidth < BREAKPOINTS.large; // under 1366px

  const metricCardWidth = isMediumWidth ? '48%' : '24%';
  const metricCardMarginBottom = isMediumWidth ? SPACING.md : 0;

  const analyticsFlexDirection = isMediumWidth ? 'column' : 'row';
  const leftColWidth = isMediumWidth ? '100%' : '38%';
  const rightColWidth = isMediumWidth ? '100%' : '59%';
  const leftColMarginBottom = isMediumWidth ? SPACING.lg : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>Sales & Analytics Reports</Text>

      {/* Payment Methods Breakdown Cards */}
      <View style={styles.metricsRow}>
        <View style={{ width: metricCardWidth, marginBottom: metricCardMarginBottom }}>
          <Card style={[styles.metricCard, { borderColor: colors.border }]}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <MaterialCommunityIcons name="cash" size={24} color="#10B981" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Cash Payments</Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
              {formatCurrency(report.cashSales)}
            </Text>
          </Card>
        </View>

        <View style={{ width: metricCardWidth, marginBottom: metricCardMarginBottom }}>
          <Card style={[styles.metricCard, { borderColor: colors.border }]}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <MaterialCommunityIcons name="qrcode" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              UPI Scan Payments
            </Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
              {formatCurrency(report.upiSales)}
            </Text>
          </Card>
        </View>

        <View style={{ width: metricCardWidth, marginBottom: metricCardMarginBottom }}>
          <Card style={[styles.metricCard, { borderColor: colors.border }]}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <MaterialCommunityIcons name="credit-card-outline" size={24} color="#8B5CF6" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Card Swipe Payments
            </Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
              {formatCurrency(report.cardSales)}
            </Text>
          </Card>
        </View>

        <View style={{ width: metricCardWidth, marginBottom: metricCardMarginBottom }}>
          <Card
            style={[
              styles.metricCard,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
          >
            <View style={[styles.iconBg, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="currency-inr" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>
              Total Daily Revenue
            </Text>
            <Text style={[styles.metricVal, { color: colors.primary, fontWeight: 'bold' }]}>
              {formatCurrency(report.salesToday)}
            </Text>
          </Card>
        </View>
      </View>

      {/* Categories & Transactions Layout */}
      <View style={[styles.analyticsLayout, { flexDirection: analyticsFlexDirection }]}>
        {/* Category breakdown (Left) */}
        <View
          style={[
            styles.analyticsCard,
            {
              width: leftColWidth,
              marginBottom: leftColMarginBottom,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Category Sales Distribution
          </Text>
          <View style={styles.categorySalesList}>
            {report.categorySales.map((cat) => (
              <View
                key={cat.categoryName}
                style={[styles.catRow, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.catLabel, { color: colors.textPrimary }]}>
                  {cat.categoryName}
                </Text>
                <Text style={[styles.catValue, { color: colors.primary }]}>
                  {formatCurrency(cat.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Transactions log (Right) */}
        <View
          style={[
            styles.analyticsCard,
            { width: rightColWidth, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Recent Completed Transactions
          </Text>
          {completedOrders.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <MaterialCommunityIcons
                name="receipt-text-minus"
                size={48}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No receipts printed today.
              </Text>
            </View>
          ) : (
            <ScrollView nestedScrollEnabled style={styles.transactionScroll}>
              {completedOrders.map((order) => (
                <View
                  key={order.id}
                  style={[styles.transRow, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.transHeader}>
                    <Text style={[styles.transNumber, { color: colors.textPrimary }]}>
                      {order.orderNumber}
                    </Text>
                    <Text style={[styles.transTime, { color: colors.textSecondary }]}>
                      {formatTime(order.createdAt)} • {order.tableName || 'Takeaway'}
                    </Text>
                  </View>
                  <View style={styles.transFooter}>
                    <Text style={[styles.transMethod, { color: colors.textMuted }]}>
                      Method: {order.paymentMethod?.toUpperCase() || 'CASH'}
                    </Text>
                    <Text style={[styles.transAmount, { color: colors.primary }]}>
                      {formatCurrency(order.total)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  metricCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    height: 120,
    justifyContent: 'space-between',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 4,
  },
  metricVal: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },
  analyticsLayout: {
    justifyContent: 'space-between',
  },
  analyticsCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    height: 380,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.md,
  },
  categorySalesList: {
    marginTop: SPACING.xs,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
  },
  catLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  catValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyTransactions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.sm,
  },
  transactionScroll: {
    flex: 1,
  },
  transRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
  },
  transHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transNumber: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  transTime: {
    fontSize: 11,
  },
  transFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  transMethod: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  transAmount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
