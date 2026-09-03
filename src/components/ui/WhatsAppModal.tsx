import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Order } from '@/mock/data';
import { sendBillWhatsApp, formatWhatsAppBillMessage } from '@/services/whatsAppService';
import { Button } from './Button';

interface WhatsAppModalProps {
  visible: boolean;
  order: Order | null;
  initialPhone?: string;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  visible,
  order,
  initialPhone,
  onClose,
  onSuccess,
  onError,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (visible && order) {
      const raw = order.customerPhone || initialPhone || '';
      // Strip non-digits
      const digits = raw.replace(/\D/g, '');
      // If starts with 91 and has 12 digits, take last 10
      if (digits.length === 12 && digits.startsWith('91')) {
        setPhone(digits.substring(2));
      } else {
        setPhone(digits.slice(-10));
      }
    }
  }, [visible, order, initialPhone]);

  if (!order) return null;

  const modalWidth = screenWidth < 1024 ? '85%' : '460px';
  const previewText = formatWhatsAppBillMessage(order);

  const handleSend = async () => {
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      if (onError) onError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendBillWhatsApp(order, cleanDigits);
      setLoading(false);

      if (res.success) {
        onClose();
        if (onSuccess) {
          onSuccess(`WhatsApp invoice launched for ${order.orderNumber}`);
        }
      } else {
        if (onError) {
          onError(res.error || 'WhatsApp not available on this device.');
        }
      }
    } catch (err: any) {
      setLoading(false);
      if (onError) {
        onError(err?.message || 'Error launching WhatsApp.');
      }
    }
  };

  const handleKeyPress = (val: string) => {
    if (val === 'DEL') {
      setPhone((prev) => prev.slice(0, -1));
    } else if (val === 'CLR') {
      setPhone('');
    } else {
      if (phone.length < 10) {
        setPhone((prev) => prev + val);
      }
    }
  };

  return (
    <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']} visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              width: modalWidth as any,
            },
            SHADOWS.xl,
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerIconRow}>
              <View style={[styles.whatsappIconBg, { backgroundColor: '#25D366' }]}>
                <MaterialCommunityIcons name="whatsapp" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.headerTitles}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Send Bill on WhatsApp
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  Invoice #{order.orderNumber} • ₹{order.total.toFixed(2)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Customer linked banner */}
            {order.customerName && (
              <View style={[styles.customerBanner, { backgroundColor: colors.surfaceLight }]}>
                <MaterialCommunityIcons name="account-check" size={18} color={colors.primary} />
                <Text style={[styles.customerBannerText, { color: colors.textPrimary }]}>
                  Linked Customer: <Text style={{ fontWeight: 'bold' }}>{order.customerName}</Text>
                </Text>
              </View>
            )}

            {/* Phone Input Box */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Recipient Mobile Number (10 Digits)
            </Text>

            <View
              style={[
                styles.phoneInputContainer,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
            >
              <View style={styles.countryCodeBadge}>
                <Text style={[styles.countryCodeText, { color: colors.textPrimary }]}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={[styles.phoneTextInput, { color: colors.textPrimary }]}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={10}
                autoFocus
              />
              {phone.length > 0 && (
                <TouchableOpacity onPress={() => setPhone('')} style={styles.clearInputBtn}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Touch Keypad for Fast Cashier Entry */}
            <View style={styles.keypadContainer}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['CLR', '0', 'DEL'],
              ].map((row, rIdx) => (
                <View key={rIdx} style={styles.keypadRow}>
                  {row.map((k) => (
                    <TouchableOpacity
                      key={k}
                      onPress={() => handleKeyPress(k)}
                      activeOpacity={0.7}
                      style={[
                        styles.keypadBtn,
                        {
                          backgroundColor:
                            k === 'DEL' || k === 'CLR'
                              ? colors.surfaceLight
                              : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {k === 'DEL' ? (
                        <MaterialCommunityIcons
                          name="backspace-outline"
                          size={20}
                          color={colors.error}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.keypadText,
                            {
                              color:
                                k === 'CLR'
                                  ? colors.error
                                  : colors.textPrimary,
                            },
                          ]}
                        >
                          {k}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            {/* Toggle Preview */}
            <TouchableOpacity
              onPress={() => setShowPreview(!showPreview)}
              style={styles.togglePreviewRow}
            >
              <MaterialCommunityIcons
                name={showPreview ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.togglePreviewText, { color: colors.primary }]}>
                {showPreview ? 'Hide Message Preview' : 'View WhatsApp Message Preview'}
              </Text>
            </TouchableOpacity>

            {showPreview && (
              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.previewContentText, { color: colors.textSecondary }]}>
                  {previewText}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              label="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.cancelBtn}
            />
            <Button
              label={loading ? 'Opening...' : 'Send on WhatsApp'}
              variant="primary"
              icon="whatsapp"
              onPress={handleSend}
              disabled={loading || phone.length < 10}
              style={styles.sendBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalBox: {
    maxHeight: '92%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whatsappIconBg: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerTitles: {
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  sub: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.md,
  },
  customerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  customerBannerText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginLeft: SPACING.xs,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    height: 52,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  countryCodeBadge: {
    marginRight: SPACING.xs,
  },
  countryCodeText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: 'bold',
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    height: '100%',
  },
  clearInputBtn: {
    padding: SPACING.xxs,
  },
  keypadContainer: {
    marginVertical: SPACING.xs,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  keypadBtn: {
    flex: 0.31,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  togglePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
  },
  togglePreviewText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    maxHeight: 140,
    marginTop: SPACING.xs,
  },
  previewContentText: {
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  cancelBtn: {
    width: '30%',
    minHeight: 48,
  },
  sendBtn: {
    width: '66%',
    minHeight: 48,
  },
});
