import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCashierNotificationStore } from '@/stores/useCashierNotificationStore';
import { formatDate, formatTime } from '@/utils/formatters';
import { MOCK_RESTAURANT } from '@/mock/data';

export interface HeaderProps {
  showToastMessage?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate?: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { themeMode, toggleTheme } = useSettingsStore();
  const { user, currentUser } = useAuthStore();
  const colors = COLORS[themeMode];

  // Bell feed: ready-to-bill and new-order alerts (pushed from realtime socket
  // events) live here. In the current flow the cashier performs NO approval —
  // the waiter sends orders straight to the kitchen — so the bell is a pure
  // notification feed, not an approval queue.
  const notifications = useCashierNotificationStore((s) => s.notifications);
  const markAllRead = useCashierNotificationStore((s) => s.markAllRead);
  const clearAll = useCashierNotificationStore((s) => s.clearAll);
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  const openNotifications = () => {
    setShowNotifications(true);
    markAllRead();
  };

  const handleNotificationPress = (route?: string) => {
    setShowNotifications(false);
    if (route && onNavigate) onNavigate(route);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderBottomWidth: 1,
        },
      ]}
    >
      {/* Restaurant Details */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.restaurantName, { color: colors.primary }]}>
          {MOCK_RESTAURANT.name}
        </Text>
        <View style={styles.subDetailsRow}>
          <Text style={[styles.branchName, { color: colors.textPrimary }]}>
            {user?.role || 'Cashier'} Terminal
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textMuted }]}>•</Text>
          <Text style={[styles.branchDetail, { color: colors.textSecondary }]}>
            {MOCK_RESTAURANT.branch}
          </Text>
        </View>
      </View>

      {/* Clock and Calendar */}
      <View style={styles.clockContainer}>
        <View style={styles.clockItem}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
          <Text style={[styles.clockText, { color: colors.textPrimary }]}>{formatTime(time)}</Text>
        </View>
        <View style={styles.clockItem}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={18}
            color={colors.textMuted}
          />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(time)}</Text>
        </View>
      </View>

      {/* Cashier profile & Action keys */}
      <View style={styles.profileActions}>
        {/* Theme Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.7}
          style={[styles.actionIcon, { backgroundColor: colors.surfaceLight }]}
        >
          <MaterialCommunityIcons
            name={themeMode === 'dark' ? 'weather-sunny' : 'weather-night'}
            size={22}
            color={themeMode === 'dark' ? '#FBBF24' : colors.textPrimary}
          />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          onPress={openNotifications}
          activeOpacity={0.7}
          style={[styles.actionIcon, { backgroundColor: colors.surfaceLight }]}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
          {unreadNotifCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unreadNotifCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceLight }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(currentUser?.cashierName || user?.name || 'Cashier')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'CA'}
            </Text>
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {currentUser?.cashierName || user?.name || 'Cashier User'}
            </Text>
            <Text style={[styles.profileId, { color: colors.textMuted }]}>
              {currentUser?.employeeId || user?.employeeId || 'EMP-POS'}
            </Text>
          </View>
        </View>
      </View>

      {/* Right-Side Notification Drawer Modal */}
      <Modal
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
        transparent
        visible={showNotifications}
        onRequestClose={() => setShowNotifications(false)}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.drawerContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.drawerHeaderLeft}>
                <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary} />
                <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>
                  Notifications ({notifications.length})
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {notifications.length > 0 && (
                  <TouchableOpacity style={styles.clearBtn} onPress={() => clearAll()}>
                    <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>
                      Clear all
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowNotifications(false)}
                >
                  <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* List */}
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="bell-off-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No notifications
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  New order and ready-to-bill alerts will appear here.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.notifSection}
                showsVerticalScrollIndicator={true}
              >
                {notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    activeOpacity={0.7}
                    onPress={() => handleNotificationPress(n.route)}
                    style={[
                      styles.notifRow,
                      { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={n.type === 'new_order' ? 'receipt-text-outline' : 'cash-register'}
                      size={20}
                      color={colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notifRowTitle, { color: colors.textPrimary }]}>
                        {n.title}
                      </Text>
                      <Text style={[styles.notifRowDesc, { color: colors.textSecondary }]}>
                        {n.description}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  detailsContainer: {
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  subDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  branchName: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  bulletPoint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginHorizontal: 4,
  },
  branchDetail: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  clockText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
    fontFamily: 'System',
  },
  dateText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.xs,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    position: 'relative',
  },
  notifSection: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  notifRowTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  notifRowDesc: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginLeft: SPACING.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  profileTextContainer: {
    marginLeft: SPACING.sm,
  },
  profileName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  profileId: {
    fontSize: 10,
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    width: 450,
    height: '100%',
    boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)',
    borderLeftWidth: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  drawerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
  },
  clearBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginRight: SPACING.xs,
  },
  clearBtnText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  closeBtn: {
    padding: 4,
  },
  scrollList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textAlign: 'center',
    marginTop: 4,
  },
});
