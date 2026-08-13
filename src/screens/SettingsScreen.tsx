import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCartStore } from '@/stores/useCartStore';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';

interface SettingsScreenProps {
  showToastMessage: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ showToastMessage }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const { taxRate, kdsAutoPrint, receiptAutoPrint, toggleTheme, updateSettings } =
    useSettingsStore();

  const { currentUser, user, logout } = useAuthStore();
  const { cartItems, clearCart } = useCartStore();
  const resetTables = useFloorStore((state) => state.resetTables);

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);

  const cashierDisplayName = currentUser?.cashierName || user?.name || 'Moazzam Ali';
  const cashierEmpId = currentUser?.employeeId || user?.employeeId || 'EMP-9821';
  const cashierMobile = currentUser?.mobileNumber || '9876543210';
  const cashierBranch = currentUser?.branchName || 'Main Branch - Sector V';

  const handleResetSystem = () => {
    setResetDialogVisible(true);
  };

  const confirmResetSystem = () => {
    resetTables();
    setResetDialogVisible(false);
    showToastMessage('POS Table States Reset to default mock layout.', 'success');
  };

  const handleLogoutPress = () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = () => {
    clearCart();
    logout();
    setLogoutDialogVisible(false);
    showToastMessage('Logged out of POS terminal successfully.', 'info');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>System Settings & Account</Text>

      {/* Cashier Session & Account Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
            Active Cashier Session
          </Text>
          <Badge label="ROLE: CASHIER" variant="primary" />
        </View>

        <View style={styles.cashierProfileRow}>
          <View style={[styles.cashierAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.cashierAvatarText}>
              {cashierDisplayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.cashierDetailsCol}>
            <Text style={[styles.cashierNameText, { color: colors.textPrimary }]}>
              {cashierDisplayName}
            </Text>
            <Text style={[styles.cashierMetaText, { color: colors.textSecondary }]}>
              ID: {cashierEmpId} • Mobile: {cashierMobile}
            </Text>
            <Text style={[styles.cashierBranchText, { color: colors.textMuted }]}>
              {cashierBranch}
            </Text>
          </View>

          <Button
            label="Log Out Terminal"
            variant="danger"
            icon="logout"
            onPress={handleLogoutPress}
            style={styles.logoutBtn}
          />
        </View>
      </View>

      {/* Theme Toggling Section */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>Appearance Theme</Text>
        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
              Use High-Contrast Dark Mode
            </Text>
            <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
              Switch between standard light colors and comfortable eye-strain dark colors.
            </Text>
          </View>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={themeMode === 'dark' ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Taxes and Values Section */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
          Tax & Invoicing Config
        </Text>
        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
              GST (Goods & Services Tax) Rate
            </Text>
            <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
              Set the default percentage applied to sales. (Current: {(taxRate * 100).toFixed(0)}%)
            </Text>
          </View>
          <View style={styles.rateControls}>
            <TouchableOpacity
              onPress={() => {
                updateSettings({ taxRate: 0.05 });
                showToastMessage('GST Rate set to 5%.', 'info');
              }}
              style={[
                styles.rateBtn,
                { borderColor: colors.border },
                taxRate === 0.05 && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={{
                  color: taxRate === 0.05 ? '#FFF' : colors.textPrimary,
                  fontWeight: 'bold',
                }}
              >
                5%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                updateSettings({ taxRate: 0.12 });
                showToastMessage('GST Rate set to 12%.', 'info');
              }}
              style={[
                styles.rateBtn,
                { borderColor: colors.border },
                taxRate === 0.12 && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={{
                  color: taxRate === 0.12 ? '#FFF' : colors.textPrimary,
                  fontWeight: 'bold',
                }}
              >
                12%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                updateSettings({ taxRate: 0.18 });
                showToastMessage('GST Rate set to 18%.', 'info');
              }}
              style={[
                styles.rateBtn,
                { borderColor: colors.border },
                taxRate === 0.18 && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={{
                  color: taxRate === 0.18 ? '#FFF' : colors.textPrimary,
                  fontWeight: 'bold',
                }}
              >
                18%
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Printing toggles */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
          Peripheral Devices & Printing
        </Text>

        <View
          style={[styles.optionRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
        >
          <View style={styles.optionInfo}>
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
              Auto-Print KOT on Send
            </Text>
            <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
              Trigger kitchen printer ticket immediately when "Send KOT" is pressed.
            </Text>
          </View>
          <Switch
            value={kdsAutoPrint}
            onValueChange={(val) => updateSettings({ kdsAutoPrint: val })}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={kdsAutoPrint ? colors.primary : '#f4f3f4'}
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
              Auto-Print Final Invoice
            </Text>
            <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
              Trigger receipt printer print job immediately upon checkout completion.
            </Text>
          </View>
          <Switch
            value={receiptAutoPrint}
            onValueChange={(val) => updateSettings({ receiptAutoPrint: val })}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={receiptAutoPrint ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Danger Zone */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: '#FCA5A5', borderWidth: 1 },
        ]}
      >
        <Text style={[styles.cardHeader, { color: colors.error }]}>
          System Maintenance (Danger Zone)
        </Text>
        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
              Reset Interactive Table Layouts
            </Text>
            <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
              Restore all mock tables and active order data to clean initialized states.
            </Text>
          </View>
          <Button label="Reset States" variant="danger" size="sm" onPress={handleResetSystem} />
        </View>
      </View>

      {/* Logout Confirmation Dialog */}
      <Dialog
        visible={logoutDialogVisible}
        title="Log Out of POS Terminal"
        description={
          cartItems.length > 0
            ? 'Warning: You have unconfirmed items in the current order cart. Logging out will discard this active cart session. Are you sure you want to proceed?'
            : 'Are you sure you want to log out of the current cashier session? You will need your mobile credentials to sign back in.'
        }
        confirmLabel="Yes, Log Out"
        cancelLabel="Stay Signed In"
        type="danger"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutDialogVisible(false)}
      />

      {/* Reset Confirmation Dialog */}
      <Dialog
        visible={resetDialogVisible}
        title="Reset Table States"
        description="Are you sure you want to reset all floor tables to their default mock statuses? Active session assignments will be restored."
        confirmLabel="Yes, Reset"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmResetSystem}
        onCancel={() => setResetDialogVisible(false)}
      />
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
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardHeader: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cashierProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  cashierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cashierAvatarText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: 'bold',
  },
  cashierDetailsCol: {
    flex: 1,
  },
  cashierNameText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: 'bold',
  },
  cashierMetaText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  cashierBranchText: {
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  optionInfo: {
    flex: 1,
    paddingRight: SPACING.lg,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  optionSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  rateControls: {
    flexDirection: 'row',
  },
  rateBtn: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    width: 46,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
});

