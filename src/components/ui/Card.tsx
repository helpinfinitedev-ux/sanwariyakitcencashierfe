import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Table, Product, Order, Customer } from '@/mock/data';
import { TableStatusBadge, OrderStatusBadge } from './Badge';
import { formatCurrency, formatTime } from '@/utils/formatters';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    SHADOWS.sm,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// ----------------------------------------------------
// TABLE CARD
// ----------------------------------------------------
interface TableCardProps {
  table: Table;
  waiterName?: string;
  orderTotal?: number;
  onPress: () => void;
}

export const TableCard: React.FC<TableCardProps> = ({ table, waiterName, orderTotal, onPress }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const getStatusColorBorder = () => {
    switch (table.status) {
      case 'occupied':
        return colors.error;
      case 'billing':
        return colors.primary;
      case 'reserved':
        return colors.warning;
      case 'cleaning':
        return colors.secondary;
      case 'available':
      default:
        return 'transparent';
    }
  };

  return (
    <Card
      onPress={onPress}
      style={[
        styles.tableCard,
        {
          borderLeftWidth: 5,
          borderLeftColor: getStatusColorBorder(),
        },
      ]}
    >
      <View style={styles.tableCardHeader}>
        <Text style={[styles.tableName, { color: colors.textPrimary }]}>{table.name}</Text>
        <TableStatusBadge status={table.status} />
      </View>

      <View style={styles.tableCardBody}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account-group" size={16} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Capacity: {table.capacity} Pax
          </Text>
        </View>

        {waiterName && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={16} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Waiter: {waiterName}
            </Text>
          </View>
        )}

        {orderTotal !== undefined && orderTotal > 0 && (
          <View style={[styles.infoRow, styles.amountRow]}>
            <MaterialCommunityIcons name="receipt" size={16} color={colors.primary} />
            <Text style={[styles.amountText, { color: colors.primary }]}>
              Bill: {formatCurrency(orderTotal)}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

// ----------------------------------------------------
// PRODUCT CARD
// ----------------------------------------------------
interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  return (
    <Card onPress={onPress} style={styles.productCard}>
      <View style={styles.productHeader}>
        {/* Veg/Non-Veg Dot Indicator */}
        <View
          style={[styles.foodTypeBorder, { borderColor: product.isVeg ? '#10B981' : '#EF4444' }]}
        >
          <View
            style={[styles.foodTypeDot, { backgroundColor: product.isVeg ? '#10B981' : '#EF4444' }]}
          />
        </View>

        <Text style={[styles.productPrice, { color: colors.primary }]} numberOfLines={1}>
          {formatCurrency(product.price)}
        </Text>
      </View>

      <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
        {product.name}
      </Text>

      <Text style={[styles.productDesc, { color: colors.textMuted }]} numberOfLines={2}>
        {product.description}
      </Text>
    </Card>
  );
};

// ----------------------------------------------------
// ORDER CARD
// ----------------------------------------------------
interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card onPress={onPress} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>
            {order.orderNumber}
          </Text>
          <Text style={[styles.orderTime, { color: colors.textMuted }]}>
            {formatTime(order.createdAt)} • {order.type.toUpperCase()}
          </Text>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.orderBody}>
        <Text style={[styles.orderInfo, { color: colors.textSecondary }]}>
          {order.tableName ? `Table: ${order.tableName}` : 'Takeaway / Delivery'}
        </Text>
        <Text style={[styles.orderInfo, { color: colors.textSecondary }]}>
          Items: {itemCount} ({order.items.length} unique)
        </Text>
        <Text style={[styles.orderTotal, { color: colors.primary }]}>
          Total: {formatCurrency(order.total)}
        </Text>
      </View>
    </Card>
  );
};

// ----------------------------------------------------
// CUSTOMER CARD
// ----------------------------------------------------
interface CustomerCardProps {
  customer: Customer;
  isSelected?: boolean;
  onPress: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, isSelected, onPress }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  return (
    <Card
      onPress={onPress}
      style={[styles.customerCard, isSelected && { borderColor: colors.primary, borderWidth: 1.5 }]}
    >
      <View style={styles.customerHeader}>
        <View>
          <Text style={[styles.customerName, { color: colors.textPrimary }]}>{customer.name}</Text>
          <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>
            +91 {customer.phone}
          </Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
        )}
      </View>

      <View style={styles.customerFooter}>
        <Text style={[styles.customerPoints, { color: colors.textMuted }]}>
          Loyalty Points:{' '}
          <Text style={{ color: colors.success, fontWeight: 'bold' }}>{customer.points}</Text>
        </Text>
      </View>
    </Card>
  );
};

// ----------------------------------------------------
// SUMMARY / STATISTICS CARD
// ----------------------------------------------------
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  trend?: string;
  trendDirection?: 'up' | 'down';
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendDirection = 'up',
  variant = 'secondary',
  style,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const isPrimary = variant === 'primary';
  const bgColor = isPrimary ? colors.primary : colors.surface;
  const textColor = isPrimary ? '#FFFFFF' : colors.textPrimary;
  const labelColor = isPrimary ? 'rgba(255,255,255,0.7)' : colors.textSecondary;
  const iconColor = isPrimary ? '#FFFFFF' : colors.primary;

  return (
    <Card style={[styles.summaryCard, { backgroundColor: bgColor }, style]}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryTextCol}>
          <Text style={[styles.summaryTitle, { color: labelColor }]}>{title}</Text>
          <Text style={[styles.summaryValue, { color: textColor }]}>{value}</Text>
        </View>
        <View
          style={[
            styles.summaryIconContainer,
            { backgroundColor: isPrimary ? 'rgba(255,255,255,0.2)' : colors.primaryLight },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
        </View>
      </View>

      {trend && (
        <View style={styles.trendRow}>
          <MaterialCommunityIcons
            name={trendDirection === 'up' ? 'arrow-up-bold' : 'arrow-down-bold'}
            size={16}
            color={trendDirection === 'up' ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.trendText,
              { color: trendDirection === 'up' ? colors.success : colors.error },
            ]}
          >
            {trend}
          </Text>
        </View>
      )}
    </Card>
  );
};

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  // Table Card
  tableCard: {
    minHeight: 120,
    justifyContent: 'space-between',
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  tableCardBody: {
    marginTop: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginLeft: SPACING.xs,
  },
  amountRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xxs,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  amountText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
  },
  // Product Card
  productCard: {
    flex: 1,
    margin: SPACING.xs,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodTypeBorder: {
    borderWidth: 1,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    padding: 1,
  },
  foodTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  productName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: SPACING.xs,
  },
  productDesc: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: SPACING.xxs,
  },
  // Order Card
  orderCard: {
    minHeight: 120,
    marginBottom: SPACING.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  orderTime: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  orderTotal: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  // Customer Card
  customerCard: {
    marginBottom: SPACING.sm,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  customerPhone: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  customerFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  customerPoints: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  // Summary Card
  summaryCard: {
    minHeight: 90,
    justifyContent: 'space-between',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: SPACING.xxs,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  trendText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: 4,
  },
});
