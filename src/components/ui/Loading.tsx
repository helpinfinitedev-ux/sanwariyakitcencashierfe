import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Button } from './Button';

// ----------------------------------------------------
// SPINNER LOADER
// ----------------------------------------------------
interface LoaderProps {
  message?: string;
  style?: ViewStyle;
}

export const Loader: React.FC<LoaderProps> = ({ message, style }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  return (
    <View style={[styles.centeredContainer, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={[styles.loaderText, { color: colors.textSecondary }]}>{message}</Text>
      )}
    </View>
  );
};

// ----------------------------------------------------
// SKELETON LOADER
// ----------------------------------------------------
interface SkeletonLoaderProps {
  count?: number;
  height?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 3,
  height = 80,
  style,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const skeletons = Array.from({ length: count });

  return (
    <View style={[styles.skeletonList, style]}>
      {skeletons.map((_, i) => (
        <View
          key={i}
          style={[
            styles.skeletonItem,
            {
              height,
              backgroundColor: colors.surfaceLight,
              borderColor: colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
};

// ----------------------------------------------------
// EMPTY STATE
// ----------------------------------------------------
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'database-off',
  actionLabel,
  onAction,
  style,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  return (
    <View style={[styles.centeredContainer, styles.paddingX, style]}>
      <MaterialCommunityIcons name={icon} size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{description}</Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

// ----------------------------------------------------
// ERROR STATE
// ----------------------------------------------------
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  style,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  return (
    <View style={[styles.centeredContainer, styles.paddingX, style]}>
      <MaterialCommunityIcons name="alert-octagon" size={64} color={colors.error} />
      <Text style={[styles.emptyTitle, { color: colors.error }]}>{title}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry && (
        <Button
          label="Retry Again"
          onPress={onRetry}
          variant="primary"
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  paddingX: {
    paddingHorizontal: SPACING.xl,
  },
  loaderText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  skeletonList: {
    width: '100%',
  },
  skeletonItem: {
    width: '100%',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: SPACING.md,
  },
  emptyDesc: {
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
  },
  actionBtn: {
    minWidth: 120,
  },
});
