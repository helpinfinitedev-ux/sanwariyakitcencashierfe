import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { TableStatus, OrderStatus } from '@/mock/data';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style, labelStyle }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: { backgroundColor: colors.successLight, borderColor: colors.success },
          text: { color: colors.success },
        };
      case 'warning':
        return {
          container: { backgroundColor: colors.warningLight, borderColor: colors.warning },
          text: { color: colors.warning },
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.errorLight, borderColor: colors.error },
          text: { color: colors.error },
        };
      case 'info':
        return {
          container: { backgroundColor: colors.secondaryLight, borderColor: colors.secondary },
          text: { color: colors.secondary },
        };
      case 'primary':
        return {
          container: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
          text: { color: colors.primary },
        };
      case 'neutral':
      default:
        return {
          container: { backgroundColor: colors.surfaceLight, borderColor: colors.border },
          text: { color: colors.textSecondary },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.container, variantStyles.container, style]}>
      <Text style={[styles.text, variantStyles.text, labelStyle]}>{label}</Text>
    </View>
  );
};

interface TableStatusBadgeProps {
  status: TableStatus;
  style?: ViewStyle;
}

export const TableStatusBadge: React.FC<TableStatusBadgeProps> = ({ status, style }) => {
  const getBadgeProps = (): { label: string; variant: BadgeProps['variant'] } => {
    switch (status) {
      case 'available':
        return { label: 'Available', variant: 'success' };
      case 'occupied':
        return { label: 'Occupied', variant: 'danger' };
      case 'reserved':
        return { label: 'Reserved', variant: 'warning' };
      case 'billing':
        return { label: 'Billing', variant: 'primary' };
      case 'cleaning':
        return { label: 'Cleaning', variant: 'info' };
      default:
        return { label: status, variant: 'neutral' };
    }
  };

  const badgeProps = getBadgeProps();
  return <Badge {...badgeProps} style={style} />;
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  style?: ViewStyle;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, style }) => {
  const getBadgeProps = (): { label: string; variant: BadgeProps['variant'] } => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'warning' };
      case 'preparing':
        return { label: 'Preparing', variant: 'primary' };
      case 'accepted':
        return { label: 'Accepted', variant: 'primary' };
      case 'ready':
        return { label: 'KOT Ready', variant: 'success' };
      case 'billing':
        return { label: 'Billing', variant: 'info' };
      case 'completed':
        return { label: 'Completed', variant: 'success' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'danger' };
      case 'rejected':
        return { label: 'Rejected', variant: 'danger' };
      default:
        return { label: status, variant: 'neutral' };
    }
  };

  const badgeProps = getBadgeProps();
  return <Badge {...badgeProps} style={style} />;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
  },
});
