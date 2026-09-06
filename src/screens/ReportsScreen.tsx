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
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, BREAKPOINTS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useReportStore } from '@/stores/useReportStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useActivityLogStore } from '@/stores/useActivityLogStore';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import {
  getAdminReportData,
  generateSyncExportPayload,
  TimeRangeFilter,
} from '@/services/reportsService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

type ActiveSectionType = 'overview' | 'customers' | 'orders' | 'delivery';

export const ReportsScreen: React.FC = () => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();

  // Stores
  const { report } = useReportStore();
  const { orders } = useOrderStore();
  const { customers } = useCustomerStore();
  const { events: activityEvents } = useActivityLogStore();

  // Screen State
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('today');
  const [activeSection, setActiveSection] = useState<ActiveSectionType>('overview');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Aggregated data from isolated service
  const adminData = getAdminReportData(timeRange, orders, activityEvents, customers, report);

  const isMediumWidth = screenWidth < BREAKPOINTS.large; // under 1366px
  const kpiCardWidth = isMediumWidth ? '48%' : '24%';
  const kpiCardMarginBottom = isMediumWidth ? SPACING.md : 0;

  // Filter orders in audit trail
  const auditOrders = adminData.recentOrders.filter((o) => {
    if (!orderSearchQuery) return true;
    const q = orderSearchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.tableName && o.tableName.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.paymentMethod && o.paymentMethod.toLowerCase().includes(q))
    );
  });

  const exportPayloadString = generateSyncExportPayload(adminData, activityEvents);

  const handleCopyExport = () => {
    // In React Native web / mobile simulation, show copy feedback
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Bar with Title & Export Action */}
      <View style={styles.topHeaderRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Admin Reports & Audit Trail
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Live business analytics, customer intelligence, transaction ledger & bill delivery logs
          </Text>
        </View>

        <Button
          label="Export Sync JSON"
          variant="primary"
          icon="cloud-upload-outline"
          onPress={() => setExportModalVisible(true)}
          style={styles.exportBtn}
        />
      </View>

      {/* Filter Range Selector Bar */}
      <View
        style={[
          styles.filterRangeBar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.timeFilterGroup}>
          <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>
            TIME HORIZON:
          </Text>
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((item) => {
            const isSelected = timeRange === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setTimeRange(item.id)}
                activeOpacity={0.7}
                style={[
                  styles.filterPill,
                  { borderColor: colors.border },
                  isSelected && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sync Status Badge */}
        <View style={[styles.syncStatusBadge, { backgroundColor: colors.surfaceLight }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.syncStatusText, { color: colors.textSecondary }]}>
            Audit Log Synced • {activityEvents.length} Events Captured
          </Text>
        </View>
      </View>

      {/* Top 4 Executive KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={{ width: kpiCardWidth, marginBottom: kpiCardMarginBottom }}>
          <Card
            style={[
              styles.kpiCard,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
          >
            <View style={styles.kpiIconHeader}>
              <View style={[styles.kpiIconBg, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="currency-inr" size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.kpiChannelSub, { color: colors.primary }]}>
                Dine-In: {formatCurrency(adminData.salesSummary.dineInRevenue)}
              </Text>
            </View>
            <Text style={[styles.kpiLabel, { color: colors.textPrimary }]}>Net Sales Revenue</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>
              {formatCurrency(adminData.salesSummary.totalRevenue)}
            </Text>
          </Card>
        </View>

        <View style={{ width: kpiCardWidth, marginBottom: kpiCardMarginBottom }}>
          <Card style={[styles.kpiCard, { borderColor: colors.border }]}>
            <View style={styles.kpiIconHeader}>
              <View
                style={[styles.kpiIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}
              >
                <MaterialCommunityIcons name="clipboard-check-outline" size={22} color="#3B82F6" />
              </View>
              <Text style={[styles.kpiChannelSub, { color: colors.textSecondary }]}>
                AOV: {formatCurrency(adminData.salesSummary.avgOrderValue)}
              </Text>
            </View>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Orders Completed</Text>
            <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
              {adminData.salesSummary.ordersCount}
            </Text>
          </Card>
        </View>

        <View style={{ width: kpiCardWidth, marginBottom: kpiCardMarginBottom }}>
          <Card style={[styles.kpiCard, { borderColor: colors.border }]}>
            <View style={styles.kpiIconHeader}>
              <View
                style={[styles.kpiIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
              >
                <MaterialCommunityIcons name="file-percent-outline" size={22} color="#10B981" />
              </View>
              <Text style={[styles.kpiChannelSub, { color: colors.error }]}>
                Discount: -{formatCurrency(adminData.salesSummary.totalDiscount)}
              </Text>
            </View>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>GST (5%) Collected</Text>
            <Text style={[styles.kpiValue, { color: '#10B981' }]}>
              {formatCurrency(adminData.salesSummary.totalGst)}
            </Text>
          </Card>
        </View>

        <View style={{ width: kpiCardWidth, marginBottom: kpiCardMarginBottom }}>
          <Card style={[styles.kpiCard, { borderColor: colors.border }]}>
            <View style={styles.kpiIconHeader}>
              <View
                style={[styles.kpiIconBg, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}
              >
                <MaterialCommunityIcons name="receipt-text-send-outline" size={22} color="#8B5CF6" />
              </View>
              <Text style={[styles.kpiChannelSub, { color: '#25D366' }]}>
                WhatsApp: {adminData.billDeliverySummary.totalWhatsApp}
              </Text>
            </View>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>80mm Thermal Printed</Text>
            <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
              {adminData.billDeliverySummary.totalPrinted} Bills
            </Text>
          </Card>
        </View>
      </View>

      {/* Section Switcher Tabs */}
      <View style={styles.sectionTabsRow}>
        {(
          [
            { id: 'overview', label: 'Payment Breakdown & Sales', icon: 'credit-card-settings-outline' },
            { id: 'customers', label: 'Customer Intelligence', icon: 'account-group-outline' },
            { id: 'orders', label: 'Order Audit Ledger', icon: 'format-list-numbered' },
            { id: 'delivery', label: 'Bill Delivery Logs (Print + WhatsApp)', icon: 'whatsapp' },
          ] as const
        ).map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveSection(tab.id)}
              activeOpacity={0.7}
              style={[
                styles.sectionTabBtn,
                { borderBottomColor: colors.border },
                isActive && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 3,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={20}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.sectionTabLabel,
                  { color: isActive ? colors.primary : colors.textSecondary },
                  isActive && { fontWeight: 'bold' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section 1: Overview & Payment Breakdown */}
      {activeSection === 'overview' && (
        <View style={styles.sectionContainer}>
          {/* Payment Mode Cards */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Payment Methods Breakdown
          </Text>

          <View style={styles.paymentMethodsRow}>
            {adminData.paymentBreakdown.map((pm) => (
              <View
                key={pm.method}
                style={[
                  styles.paymentMethodCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    width: '32%',
                  },
                  SHADOWS.sm,
                ]}
              >
                <View style={styles.pmHeader}>
                  <MaterialCommunityIcons
                    name={
                      pm.method === 'cash'
                        ? 'cash'
                        : pm.method === 'upi'
                        ? 'qrcode'
                        : 'credit-card-outline'
                    }
                    size={28}
                    color={
                      pm.method === 'cash'
                        ? '#10B981'
                        : pm.method === 'upi'
                        ? '#3B82F6'
                        : '#8B5CF6'
                    }
                  />
                  <View style={[styles.percentageBadge, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.percentageText, { color: colors.textPrimary }]}>
                      {pm.percentage}%
                    </Text>
                  </View>
                </View>

                <Text style={[styles.pmLabel, { color: colors.textSecondary }]}>{pm.label}</Text>
                <Text style={[styles.pmAmount, { color: colors.textPrimary }]}>
                  {formatCurrency(pm.amount)}
                </Text>
                <Text style={[styles.pmCount, { color: colors.textMuted }]}>
                  {pm.count} Transactions Settled
                </Text>
              </View>
            ))}
          </View>

          {/* Sales Channels Breakdown */}
          <View
            style={[
              styles.channelsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOWS.sm,
            ]}
          >
            <Text style={[styles.channelsTitle, { color: colors.textPrimary }]}>
              Revenue by Channel
            </Text>
            <View style={styles.channelsGrid}>
              <View style={styles.channelCol}>
                <Text style={[styles.channelLabel, { color: colors.textSecondary }]}>🍽️ Dine-In</Text>
                <Text style={[styles.channelValue, { color: colors.textPrimary }]}>
                  {formatCurrency(adminData.salesSummary.dineInRevenue)}
                </Text>
              </View>
              <View style={styles.channelCol}>
                <Text style={[styles.channelLabel, { color: colors.textSecondary }]}>🥡 Takeaway</Text>
                <Text style={[styles.channelValue, { color: colors.textPrimary }]}>
                  {formatCurrency(adminData.salesSummary.takeawayRevenue)}
                </Text>
              </View>
              <View style={styles.channelCol}>
                <Text style={[styles.channelLabel, { color: colors.textSecondary }]}>🛵 Delivery</Text>
                <Text style={[styles.channelValue, { color: colors.textPrimary }]}>
                  {formatCurrency(adminData.salesSummary.deliveryRevenue)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Section 2: Customer Intelligence */}
      {activeSection === 'customers' && (
        <View
          style={[
            styles.tableCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            SHADOWS.sm,
          ]}
        >
          <View style={styles.tableHeaderBar}>
            <Text style={[styles.tableTitle, { color: colors.textPrimary }]}>
              Customer Profiles & Loyalty Analytics
            </Text>
            <Text style={[styles.tableCountSubtitle, { color: colors.textSecondary }]}>
              {adminData.customerActivity.length} Registered Customers
            </Text>
          </View>

          {/* Table Header */}
          <View style={[styles.gridRowHeader, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.colHeader, { flex: 2, color: colors.textSecondary }]}>
              CUSTOMER NAME
            </Text>
            <Text style={[styles.colHeader, { flex: 1.5, color: colors.textSecondary }]}>
              PHONE
            </Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center', color: colors.textSecondary }]}>
              ORDERS
            </Text>
            <Text style={[styles.colHeader, { flex: 1.5, textAlign: 'right', color: colors.textSecondary }]}>
              TOTAL SPENT
            </Text>
            <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'center', color: colors.textSecondary }]}>
              LOYALTY PTS
            </Text>
            <Text style={[styles.colHeader, { flex: 1.5, textAlign: 'right', color: colors.textSecondary }]}>
              LAST VISIT
            </Text>
          </View>

          {/* Customer Rows */}
          {adminData.customerActivity.map((cust) => (
            <View
              key={cust.id}
              style={[styles.gridRowItem, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.flexRow, { flex: 2 }]}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                    {cust.name.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.custNameText, { color: colors.textPrimary }]}>
                  {cust.name}
                </Text>
              </View>
              <Text style={[styles.monoText, { flex: 1.5, color: colors.textSecondary }]}>
                {cust.phone}
              </Text>
              <Text style={[styles.centerText, { flex: 1, color: colors.textPrimary }]}>
                {cust.orderCount}
              </Text>
              <Text style={[styles.rightBoldText, { flex: 1.5, color: colors.textPrimary }]}>
                {formatCurrency(cust.totalSpent)}
              </Text>
              <View style={[styles.centerCol, { flex: 1.2 }]}>
                <View style={[styles.pointsBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.pointsText}>{cust.points} pts</Text>
                </View>
              </View>
              <Text style={[styles.rightText, { flex: 1.5, color: colors.textSecondary }]}>
                {formatDate(cust.lastVisit)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Section 3: Order Audit Ledger */}
      {activeSection === 'orders' && (
        <View
          style={[
            styles.tableCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            SHADOWS.sm,
          ]}
        >
          <View style={styles.orderAuditHeader}>
            <View>
              <Text style={[styles.tableTitle, { color: colors.textPrimary }]}>
                Transaction & Order Ledger
              </Text>
              <Text style={[styles.tableCountSubtitle, { color: colors.textSecondary }]}>
                Showing {auditOrders.length} audited orders
              </Text>
            </View>

            <View
              style={[
                styles.searchAuditBox,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchAuditInput, { color: colors.textPrimary }]}
                placeholder="Search order#, table, customer..."
                placeholderTextColor={colors.textMuted}
                value={orderSearchQuery}
                onChangeText={setOrderSearchQuery}
              />
              {orderSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setOrderSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Ledger Table Header */}
          <View style={[styles.gridRowHeader, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.colHeader, { flex: 1.2, color: colors.textSecondary }]}>
              ORDER #
            </Text>
            <Text style={[styles.colHeader, { flex: 1.2, color: colors.textSecondary }]}>
              TIMESTAMP
            </Text>
            <Text style={[styles.colHeader, { flex: 1.2, color: colors.textSecondary }]}>
              TABLE / TYPE
            </Text>
            <Text style={[styles.colHeader, { flex: 1.5, color: colors.textSecondary }]}>
              CUSTOMER
            </Text>
            <Text style={[styles.colHeader, { flex: 1, color: colors.textSecondary }]}>
              STATUS
            </Text>
            <Text style={[styles.colHeader, { flex: 1, color: colors.textSecondary }]}>
              PAYMENT
            </Text>
            <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'right', color: colors.textSecondary }]}>
              AMOUNT
            </Text>
          </View>

          {/* Ledger Rows */}
          {auditOrders.map((ord) => (
            <View
              key={ord.id}
              style={[styles.gridRowItem, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.orderNumBold, { flex: 1.2, color: colors.primary }]}>
                #{ord.orderNumber}
              </Text>
              <Text style={[styles.timestampText, { flex: 1.2, color: colors.textSecondary }]}>
                {formatTime(ord.createdAt)}
              </Text>
              <Text style={[styles.tableInfoText, { flex: 1.2, color: colors.textPrimary }]}>
                {ord.tableName || (ord.type === 'takeaway' ? 'Takeaway' : 'Delivery')}
              </Text>
              <Text style={[styles.custNameText, { flex: 1.5, color: colors.textPrimary }]}>
                {ord.customerName || 'Walk-In Customer'}
              </Text>
              <View style={{ flex: 1 }}>
                <Badge
                  label={ord.status.toUpperCase()}
                  variant={
                    ord.status === 'completed'
                      ? 'success'
                      : ord.status === 'preparing'
                      ? 'warning'
                      : ord.status === 'cancelled' || ord.status === 'rejected'
                      ? 'danger'
                      : 'info'
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                {ord.paymentMethod ? (
                  <View style={[styles.pmTag, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.pmTagText, { color: colors.textPrimary }]}>
                      {ord.paymentMethod.toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.pmTagText, { color: colors.textMuted }]}>—</Text>
                )}
              </View>
              <Text style={[styles.rightBoldText, { flex: 1.2, color: colors.textPrimary }]}>
                {formatCurrency(ord.total)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Section 4: Bill Delivery Logs (Print + WhatsApp) */}
      {activeSection === 'delivery' && (
        <View
          style={[
            styles.tableCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            SHADOWS.sm,
          ]}
        >
          <View style={styles.tableHeaderBar}>
            <View>
              <Text style={[styles.tableTitle, { color: colors.textPrimary }]}>
                Bill Delivery Audit Log (Print & WhatsApp)
              </Text>
              <Text style={[styles.tableCountSubtitle, { color: colors.textSecondary }]}>
                Complete audit trail of receipts spooled to thermal printers and WhatsApp messages
              </Text>
            </View>

            <View style={styles.deliveryCountersGroup}>
              <View
                style={[
                  styles.counterPill,
                  { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
              >
                <MaterialCommunityIcons name="printer" size={16} color={colors.primary} />
                <Text style={[styles.counterPillText, { color: colors.primary }]}>
                  {adminData.billDeliverySummary.totalPrinted} Thermal Spooled
                </Text>
              </View>

              <View
                style={[
                  styles.counterPill,
                  { backgroundColor: 'rgba(37, 211, 102, 0.1)', borderColor: '#25D366' },
                ]}
              >
                <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
                <Text style={[styles.counterPillText, { color: '#25D366' }]}>
                  {adminData.billDeliverySummary.totalWhatsApp} WhatsApp Sent
                </Text>
              </View>
            </View>
          </View>

          {/* Table Header */}
          <View style={[styles.gridRowHeader, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.colHeader, { flex: 1.2, color: colors.textSecondary }]}>
              CHANNEL
            </Text>
            <Text style={[styles.colHeader, { flex: 1.2, color: colors.textSecondary }]}>
              ORDER #
            </Text>
            <Text style={[styles.colHeader, { flex: 2, color: colors.textSecondary }]}>
              DESTINATION / PRINTER
            </Text>
            <Text style={[styles.colHeader, { flex: 1.5, color: colors.textSecondary }]}>
              CASHIER (AUDIT ID)
            </Text>
            <Text style={[styles.colHeader, { flex: 1.5, color: colors.textSecondary }]}>
              TIMESTAMP
            </Text>
            <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'right', color: colors.textSecondary }]}>
              AMOUNT
            </Text>
          </View>

          {/* Delivery Rows */}
          {adminData.billDeliveryLogs.length === 0 ? (
            <View style={styles.emptyLogsContainer}>
              <MaterialCommunityIcons
                name="receipt-text-check-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyLogsText, { color: colors.textSecondary }]}>
                No bill delivery events recorded in this time horizon.
              </Text>
            </View>
          ) : (
            adminData.billDeliveryLogs.map((log) => (
              <View
                key={log.id}
                style={[styles.gridRowItem, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.flexRow, { flex: 1.2 }]}>
                  <View
                    style={[
                      styles.channelBadgeIcon,
                      {
                        backgroundColor:
                          log.channel === 'whatsapp'
                            ? 'rgba(37, 211, 102, 0.15)'
                            : colors.primaryLight,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={log.channel === 'whatsapp' ? 'whatsapp' : 'printer'}
                      size={16}
                      color={log.channel === 'whatsapp' ? '#25D366' : colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.channelNameText,
                      {
                        color:
                          log.channel === 'whatsapp' ? '#25D366' : colors.primary,
                      },
                    ]}
                  >
                    {log.channel === 'whatsapp' ? 'WhatsApp' : 'Thermal 80mm'}
                  </Text>
                </View>

                <Text style={[styles.orderNumBold, { flex: 1.2, color: colors.textPrimary }]}>
                  #{log.orderNumber}
                </Text>

                <Text style={[styles.monoText, { flex: 2, color: colors.textPrimary }]}>
                  {log.recipient}
                </Text>

                <Text style={[styles.cashierAuditText, { flex: 1.5, color: colors.textSecondary }]}>
                  {log.cashierName}
                </Text>

                <Text style={[styles.timestampText, { flex: 1.5, color: colors.textSecondary }]}>
                  {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                </Text>

                <Text style={[styles.rightBoldText, { flex: 1.2, color: colors.textPrimary }]}>
                  {formatCurrency(log.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* JSON Sync / Export Preview Modal */}
      <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} visible={exportModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.exportModalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOWS.xl,
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons
                  name="code-json"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.modalTitleText, { color: colors.textPrimary }]}>
                  Super-Admin Ready Sync Payload (JSON)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.exportDesc, { color: colors.textSecondary }]}>
              This structured payload contains all normalized event logs, customer metrics, sales
              aggregates, and order audit items ready to be pushed to your centralized Super Admin API.
            </Text>

            <ScrollView
              style={[
                styles.jsonScrollBox,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
              contentContainerStyle={styles.jsonContent}
            >
              <Text style={[styles.jsonText, { color: colors.textPrimary }]}>
                {exportPayloadString}
              </Text>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              {copiedToast ? (
                <View style={styles.copiedBadge}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                  <Text style={styles.copiedText}>Payload Copied to Clipboard!</Text>
                </View>
              ) : (
                <View />
              )}

              <View style={styles.footerBtnsGroup}>
                <Button
                  label="Close"
                  variant="outline"
                  onPress={() => setExportModalVisible(false)}
                  style={{ width: 100, marginRight: SPACING.sm }}
                />
                <Button
                  label="Copy JSON Payload"
                  variant="primary"
                  icon="content-copy"
                  onPress={handleCopyExport}
                  style={{ minWidth: 180 }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  exportBtn: {
    minHeight: 44,
    paddingHorizontal: SPACING.lg,
  },
  filterRangeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  timeFilterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
    letterSpacing: 0.5,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.xs,
  },
  filterPillText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  kpiCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  kpiIconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  kpiIconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiChannelSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  kpiValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },
  sectionTabsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.md,
  },
  sectionTabLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginLeft: SPACING.xs,
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.md,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  paymentMethodCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  pmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  percentageBadge: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.xs,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  pmLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  pmAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginVertical: 2,
  },
  pmCount: {
    fontSize: 11,
  },
  channelsCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  channelsTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.md,
  },
  channelsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  channelCol: {
    alignItems: 'center',
  },
  channelLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: 4,
  },
  channelValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  tableHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  orderAuditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  tableTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  tableCountSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  deliveryCountersGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginLeft: SPACING.xs,
  },
  counterPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchAuditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    width: 260,
    height: 38,
  },
  searchAuditInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginLeft: SPACING.xs,
    height: '100%',
  },
  gridRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  gridRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  custNameText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
  },
  monoText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  centerText: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  centerCol: {
    alignItems: 'center',
  },
  rightText: {
    textAlign: 'right',
    fontSize: 11,
  },
  rightBoldText: {
    textAlign: 'right',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: 'bold',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.xs,
  },
  pointsText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
    marginLeft: 2,
  },
  orderNumBold: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: 'bold',
  },
  timestampText: {
    fontSize: 11,
  },
  tableInfoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  pmTag: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.xs,
  },
  pmTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  channelBadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  channelNameText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cashierAuditText: {
    fontSize: 11,
  },
  emptyLogsContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLogsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  exportModalBox: {
    width: '75%',
    maxHeight: '85%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
  },
  exportDesc: {
    fontSize: TYPOGRAPHY.sizes.xs,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    lineHeight: 16,
  },
  jsonScrollBox: {
    margin: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    height: 360,
    padding: SPACING.md,
  },
  jsonContent: {
    paddingBottom: SPACING.md,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  copiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copiedText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  footerBtnsGroup: {
    flexDirection: 'row',
  },
});
