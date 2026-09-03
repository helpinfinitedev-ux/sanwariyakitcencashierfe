import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Button } from './Button';

// ----------------------------------------------------
// CONFIRMATION & ALERT DIALOG
// ----------------------------------------------------
interface DialogProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'info' | 'danger' | 'success' | 'warning';
  onConfirm: () => void;
  onCancel?: () => void;
  isAlertOnly?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  title,
  description,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel,
  isAlertOnly = false,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const getHeaderIcon = () => {
    switch (type) {
      case 'danger':
        return { name: 'alert-circle' as const, color: colors.error };
      case 'success':
        return { name: 'check-circle' as const, color: colors.success };
      case 'warning':
        return { name: 'alert' as const, color: colors.warning };
      case 'info':
      default:
        return { name: 'information' as const, color: colors.secondary };
    }
  };

  const iconInfo = getHeaderIcon();

  return (
    <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <TouchableWithoutFeedback onPress={isAlertOnly ? onConfirm : onCancel}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.dialogContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
            SHADOWS.lg,
          ]}
        >
          <View style={styles.dialogHeader}>
            <MaterialCommunityIcons name={iconInfo.name} size={36} color={iconInfo.color} />
            <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>{title}</Text>
          </View>

          <Text style={[styles.dialogDesc, { color: colors.textSecondary }]}>{description}</Text>

          <View style={styles.dialogActions}>
            {!isAlertOnly && onCancel && (
              <Button
                label={cancelLabel}
                variant="outline"
                onPress={onCancel}
                style={styles.actionButton}
              />
            )}
            <Button
              label={confirmLabel}
              variant={type === 'danger' ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ----------------------------------------------------
// NUMERIC KEYPAD / DIAL MODAL
// ----------------------------------------------------
interface NumberPadModalProps {
  visible: boolean;
  title: string;
  initialValue?: string;
  suffix?: string;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

export const NumberPadModal: React.FC<NumberPadModalProps> = ({
  visible,
  title,
  initialValue = '0',
  suffix = '',
  onConfirm,
  onCancel,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const [prevVisible, setPrevVisible] = React.useState(visible);
  const [val, setVal] = React.useState(initialValue);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setVal(initialValue);
    }
  }

  const handleKeyPress = (char: string) => {
    setVal((prev) => {
      if (prev === '0' && char !== '.') {
        return char;
      }
      if (char === '.' && prev.includes('.')) {
        return prev;
      }
      return prev + char;
    });
  };

  const handleBackspace = () => {
    setVal((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setVal('0');
  };

  const handleConfirm = () => {
    const numeric = parseFloat(val);
    onConfirm(isNaN(numeric) ? 0 : numeric);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'C'];

  return (
    <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} transparent visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.numpadContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
            SHADOWS.xl,
          ]}
        >
          <View style={styles.numpadHeader}>
            <Text style={[styles.numpadTitle, { color: colors.textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={onCancel}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Display Output */}
          <View
            style={[
              styles.numpadDisplay,
              { backgroundColor: colors.surfaceLight, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.numpadDisplayText, { color: colors.textPrimary }]}>
              {val} {suffix}
            </Text>
          </View>

          {/* Keypad Grid */}
          <View style={styles.numpadGrid}>
            {keys.map((key) => {
              const isClear = key === 'C';
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => (isClear ? handleClear() : handleKeyPress(key))}
                  activeOpacity={0.6}
                  style={[
                    styles.numpadKey,
                    {
                      backgroundColor: isClear ? colors.errorLight : colors.surfaceLight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.numpadKeyText,
                      { color: isClear ? colors.error : colors.textPrimary },
                    ]}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Backspace and Done Buttons row */}
            <TouchableOpacity
              onPress={handleBackspace}
              activeOpacity={0.6}
              style={[
                styles.numpadKeyWide,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons
                name="backspace-outline"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.6}
              style={[styles.numpadKeyWide, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.numpadKeyText, { color: '#FFFFFF', fontWeight: 'bold' }]}>
                DONE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ----------------------------------------------------
// TOAST ALERT NOTIFICATION
// ----------------------------------------------------
interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  onDismiss,
  duration = 2500,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const getToastColors = () => {
    switch (type) {
      case 'error':
        return { bg: colors.error, text: '#FFFFFF', icon: 'alert-circle' as const };
      case 'info':
        return { bg: colors.surfaceLight, text: colors.textPrimary, icon: 'information' as const };
      case 'success':
      default:
        return { bg: colors.success, text: '#FFFFFF', icon: 'check-circle' as const };
    }
  };

  const toastStyle = getToastColors();

  return (
    <View style={[styles.toastWrapper, SHADOWS.lg]}>
      <View style={[styles.toastContainer, { backgroundColor: toastStyle.bg }]}>
        <MaterialCommunityIcons name={toastStyle.icon} size={22} color={toastStyle.text} />
        <Text style={[styles.toastText, { color: toastStyle.text }]}>{message}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <MaterialCommunityIcons name="close" size={18} color={toastStyle.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '35%', // fits touch screens beautifully in landscape
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dialogTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.sm,
  },
  dialogDesc: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    marginBottom: SPACING.lg,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: SPACING.sm,
    minWidth: 100,
  },
  // Numpad Styles
  numpadContainer: {
    width: 380,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  numpadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  numpadTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  numpadDisplay: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  numpadDisplayText: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  numpadKey: {
    width: '31%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    marginBottom: '3%',
  },
  numpadKeyText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  numpadKeyWide: {
    width: '48%',
    aspectRatio: 2.3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    marginBottom: '3%',
  },
  // Toast Styles
  toastWrapper: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  toastText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.sm,
  },
});
