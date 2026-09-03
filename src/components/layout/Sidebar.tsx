import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

interface MenuItem {
  route: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const { themeMode, isSidebarCollapsed, toggleSidebar } = useSettingsStore();
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();

  // Auto collapse on displays narrower than 1280px. Force expand on 1600px+ (22" terminals)
  const isLargeScreen = screenWidth >= 1600;
  const collapsed = screenWidth < 1280 ? true : isLargeScreen ? false : isSidebarCollapsed;

  const menuItems: MenuItem[] = [
    { route: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline' },
    { route: 'floor', label: 'Floor Map', icon: 'floor-plan' },
    { route: 'menu', label: 'Product Menu', icon: 'food-fork-drink' },
    { route: 'orders', label: 'Active Orders', icon: 'clipboard-text-clock-outline' },
    { route: 'billing', label: 'Quick Billing', icon: 'cash-register' },
    { route: 'reports', label: 'Reports & Stats', icon: 'chart-box-outline' },
    { route: 'settings', label: 'Settings', icon: 'cog-outline' },
  ];

  const sidebarWidth = collapsed ? 76 : isLargeScreen ? 260 : 220;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          width: sidebarWidth,
        },
      ]}
    >
      {/* Brand Header */}
      <View style={[styles.brandContainer, { borderBottomColor: colors.border }]}>
        <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#FFFFFF" />
        </View>
        {!collapsed && (
          <View style={styles.brandTextContainer}>
            <Text style={[styles.brandName, { color: colors.textPrimary }]}>SANWARIYA</Text>
            <Text style={[styles.brandTagline, { color: colors.primary }]}>KITCHEN POS</Text>
          </View>
        )}
      </View>

      {/* Menu Links */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => {
          const isActive = currentRoute === item.route;
          const bgActiveColor = colors.primaryLight;
          const textActiveColor = colors.primary;

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => onNavigate(item.route)}
              activeOpacity={0.7}
              style={[
                styles.menuItem,
                isActive && { backgroundColor: bgActiveColor },
                collapsed && { justifyContent: 'center' },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={isActive ? textActiveColor : colors.textSecondary}
              />
              {!collapsed && (
                <Text
                  style={[
                    styles.menuLabel,
                    { color: isActive ? textActiveColor : colors.textPrimary },
                    isActive && { fontWeight: TYPOGRAPHY.weights.semibold },
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Collapse Toggle Footer (Hidden if forced expand or forced collapse via screen width) */}
      {screenWidth >= 1280 && !isLargeScreen ? (
        <TouchableOpacity
          onPress={toggleSidebar}
          activeOpacity={0.7}
          style={[
            styles.collapseButton,
            { borderTopColor: colors.border },
            collapsed && { justifyContent: 'center' },
          ]}
        >
          <MaterialCommunityIcons
            name={collapsed ? 'chevron-right' : 'chevron-left'}
            size={24}
            color={colors.textSecondary}
          />
          {!collapsed && (
            <Text style={[styles.collapseLabel, { color: colors.textSecondary }]}>
              Collapse Menu
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.footerSpacer, { borderTopColor: colors.border }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    borderRightWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    height: 70,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTextContainer: {
    marginLeft: SPACING.sm,
  },
  brandName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.5,
  },
  menuContainer: {
    flex: 1,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    height: 56,
  },
  menuLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    marginLeft: SPACING.md,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginHorizontal: SPACING.sm,
    borderTopWidth: 1,
    height: 56,
    paddingHorizontal: SPACING.md,
  },
  collapseLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginLeft: SPACING.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  footerSpacer: {
    height: 56,
    borderTopWidth: 1,
    marginHorizontal: SPACING.sm,
  },
});
