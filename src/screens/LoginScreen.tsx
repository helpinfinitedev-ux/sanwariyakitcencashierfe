import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, BREAKPOINTS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { MOCK_CASHIER_CREDENTIALS } from '@/mock/credentials';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export const LoginScreen: React.FC = () => {
  const { themeMode, toggleTheme } = useSettingsStore();
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();

  const { login, isLoading, error, clearError } = useAuthStore();

  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [password, setPassword] = useState('pos@123');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isTablet = screenWidth < BREAKPOINTS.medium; // < 1024px
  const cardWidth = isTablet ? '85%' : screenWidth < 1400 ? '480px' : '520px';

  const handleLogin = async () => {
    setLocalError(null);
    clearError();

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    const result = await login(cleanMobile, password);
    if (!result.success && result.message) {
      setLocalError(result.message);
    }
  };

  const handleSelectQuickAccount = (mobile: string, pass: string) => {
    setMobileNumber(mobile);
    setPassword(pass);
    setLocalError(null);
    clearError();
  };

  const displayedError = localError || error;

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      {/* Top Bar with Brand & Theme Switch */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={styles.brandRow}>
          <View style={[styles.brandIconBg, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
              SANWARIYA CUISINE
            </Text>
            <Text style={[styles.brandSubtitle, { color: colors.primary }]}>
              TOUCH POS TERMINAL
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.7}
          style={[
            styles.themeToggleBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name={themeMode === 'dark' ? 'weather-sunny' : 'weather-night'}
            size={20}
            color={themeMode === 'dark' ? '#FBBF24' : colors.textPrimary}
          />
          <Text style={[styles.themeToggleText, { color: colors.textSecondary }]}>
            {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Centered Login Box */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.loginCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              width: cardWidth as any,
            },
            SHADOWS.xl,
          ]}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.lockIconCircle, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="shield-lock-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Cashier Sign In</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              Enter your registered mobile credentials to unlock POS terminal
            </Text>

            <View style={styles.roleBadgeContainer}>
              <Badge label="ROLE: CASHIER ONLY" variant="primary" />
            </View>
          </View>

          {/* Inline Error Alert */}
          {displayedError && (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.errorLight,
                  borderColor: colors.error,
                },
              ]}
            >
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{displayedError}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Mobile Number Input */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Mobile Number (10 Digits)
            </Text>
            <Input
              value={mobileNumber}
              onChangeText={(t) => {
                setMobileNumber(t.replace(/\D/g, '').slice(0, 10));
                if (displayedError) {
                  setLocalError(null);
                  clearError();
                }
              }}
              placeholder="e.g. 9876543210"
              keyboardType="number-pad"
              icon="phone-outline"
              style={styles.inputField}
            />

            {/* Password Input */}
            <View style={styles.passwordLabelRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Password</Text>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.toggleShowBtn}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.toggleShowText, { color: colors.primary }]}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (displayedError) {
                  setLocalError(null);
                  clearError();
                }
              }}
              placeholder="Enter password"
              secureTextEntry={!showPassword}
              icon="lock-outline"
              style={styles.inputField}
            />

            {/* Sign In Button */}
            <Button
              label={isLoading ? 'Verifying Credentials...' : 'Unlock POS Terminal'}
              variant="primary"
              icon="login"
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.submitBtn}
            />
          </View>

          {/* Quick Demo Accounts Switcher for instant testing */}
          <View style={[styles.demoAccountsSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.demoSectionTitle, { color: colors.textMuted }]}>
              QUICK TEST CREDENTIALS (CLICK TO FILL)
            </Text>

            <View style={styles.demoChipsRow}>
              {MOCK_CASHIER_CREDENTIALS.map((acc) => {
                const isSelected = mobileNumber === acc.mobileNumber;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => handleSelectQuickAccount(acc.mobileNumber, acc.password)}
                    activeOpacity={0.7}
                    style={[
                      styles.demoChip,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surfaceLight,
                        borderColor: isSelected
                          ? colors.primary
                          : acc.isActive
                          ? colors.border
                          : colors.error,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: acc.isActive ? colors.success : colors.error },
                      ]}
                    />
                    <View>
                      <Text
                        style={[
                          styles.chipName,
                          { color: isSelected ? colors.primary : colors.textPrimary },
                        ]}
                      >
                        {acc.cashierName} {acc.isActive ? '' : '(Revoked)'}
                      </Text>
                      <Text style={[styles.chipPhone, { color: colors.textSecondary }]}>
                        {acc.mobileNumber} • {acc.password}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Info */}
      <View style={styles.footerBar}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Sanwariya Cuisine POS v1.0.0 • Secured Cashier Terminal System
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconBg: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    marginLeft: 6,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  loginCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cardSub: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: SPACING.sm,
  },
  roleBadgeContainer: {
    marginTop: SPACING.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    width: '100%',
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  formContainer: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xxs,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleShowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleShowText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  inputField: {
    marginBottom: SPACING.md,
  },
  submitBtn: {
    width: '100%',
    minHeight: 54,
    marginTop: SPACING.xs,
  },
  demoAccountsSection: {
    width: '100%',
    borderTopWidth: 1,
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
  },
  demoSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  demoChipsRow: {
    width: '100%',
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  chipName: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: 'bold',
  },
  chipPhone: {
    fontSize: 11,
    marginTop: 1,
  },
  footerBar: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
  },
});
