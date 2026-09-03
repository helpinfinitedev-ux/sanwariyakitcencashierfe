import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface ButtonProps {
  label?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  labelStyle,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  // Dynamic Styles based on theme colors
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: colors.primary },
          text: { color: '#FFFFFF' },
          icon: '#FFFFFF',
        };
      case 'secondary':
        return {
          container: { backgroundColor: colors.surfaceLight },
          text: { color: colors.textPrimary },
          icon: colors.textPrimary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.border,
          },
          text: { color: colors.textPrimary },
          icon: colors.textPrimary,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: colors.textSecondary },
          icon: colors.textSecondary,
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.error },
          text: { color: '#FFFFFF' },
          icon: '#FFFFFF',
        };
      default:
        return {
          container: { backgroundColor: colors.primary },
          text: { color: '#FFFFFF' },
          icon: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: SPACING.xs,
            paddingHorizontal: SPACING.sm,
            borderRadius: RADIUS.sm,
            minHeight: 36,
          },
          text: {
            fontSize: TYPOGRAPHY.sizes.sm,
            fontWeight: TYPOGRAPHY.weights.medium,
          },
          icon: 16,
        };
      case 'lg':
        return {
          container: {
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.xl,
            borderRadius: RADIUS.md,
            minHeight: 56,
          },
          text: {
            fontSize: TYPOGRAPHY.sizes.lg,
            fontWeight: TYPOGRAPHY.weights.bold,
          },
          icon: 24,
        };
      case 'md':
      default:
        return {
          container: {
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.lg,
            borderRadius: RADIUS.md,
            minHeight: 46,
          },
          text: {
            fontSize: TYPOGRAPHY.sizes.md,
            fontWeight: TYPOGRAPHY.weights.semibold,
          },
          icon: 20,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.baseContainer,
        sizeStyles.container,
        variantStyles.container,
        disabled && { opacity: 0.5 },
        variant === 'primary' && !disabled && SHADOWS.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.text.color} />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons
              name={icon}
              size={sizeStyles.icon}
              color={variantStyles.icon}
              style={styles.leftIcon}
            />
          )}
          {label && <Text style={[sizeStyles.text, variantStyles.text, labelStyle]}>{label}</Text>}
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons
              name={icon}
              size={sizeStyles.icon}
              color={variantStyles.icon}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

interface IconButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  style,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: colors.primary },
          icon: '#FFFFFF',
        };
      case 'secondary':
        return {
          container: { backgroundColor: colors.surfaceLight },
          icon: colors.textPrimary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.border,
          },
          icon: colors.textPrimary,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          icon: colors.textSecondary,
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.error },
          icon: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: {
            width: 32,
            height: 32,
            borderRadius: RADIUS.xs,
          },
          icon: 18,
        };
      case 'lg':
        return {
          container: {
            width: 54,
            height: 54,
            borderRadius: RADIUS.lg,
          },
          icon: 28,
        };
      case 'md':
      default:
        return {
          container: {
            width: 44,
            height: 44,
            borderRadius: RADIUS.md,
          },
          icon: 22,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.iconButtonContainer,
        sizeStyles.container,
        variantStyles.container,
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={sizeStyles.icon} color={variantStyles.icon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: SPACING.xs,
  },
  rightIcon: {
    marginLeft: SPACING.xs,
  },
  iconButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
