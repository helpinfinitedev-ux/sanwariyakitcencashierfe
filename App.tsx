import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useFloorStore } from '@/stores/useFloorStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useReportStore } from '@/stores/useReportStore';
import { socketService } from '@/services/socket';
import { COLORS } from '@/theme/theme';
import { POSLayout } from '@/components/layout/POSLayout';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { FloorScreen } from '@/screens/FloorScreen';
import { MenuScreen } from '@/screens/MenuScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { BillingScreen } from '@/screens/BillingScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { Toast } from '@/components/ui/Dialog';

export default function App() {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const { isAuthenticated, token, checkAuthSession } = useAuthStore();
  const [sessionChecking, setSessionChecking] = useState(true);

  // Check stored session on startup
  useEffect(() => {
    const initAuth = async () => {
      await checkAuthSession();
      setSessionChecking(false);
    };
    initAuth();
  }, [checkAuthSession]);

  // Synchronize REST orders and WebSocket connectivity
  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect to Socket.IO room with user's JWT token
      socketService.connect(token, triggerToast);
      // Fetch initial live data from the backend
      useOrderStore.getState().fetchOrders();
      useMenuStore.getState().fetchMenu();
      useFloorStore.getState().fetchTables();
      useCustomerStore.getState().fetchCustomers();
      useReportStore.getState().fetchReport();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, token]);

  // Simple state router
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');

  // Toast notifier states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  // If initial session verification is in progress
  if (sessionChecking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Render matching route screen
  const renderScreen = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setCurrentRoute} />;
      case 'floor':
        return <FloorScreen onNavigate={setCurrentRoute} showToastMessage={triggerToast} />;
      case 'menu':
        return <MenuScreen />;
      case 'orders':
        return <OrdersScreen onNavigate={setCurrentRoute} showToastMessage={triggerToast} />;
      case 'billing':
        return <BillingScreen onNavigate={setCurrentRoute} showToastMessage={triggerToast} />;
      case 'settings':
        return <SettingsScreen showToastMessage={triggerToast} />;
      case 'reports':
        return <ReportsScreen />;
      default:
        return <DashboardScreen onNavigate={setCurrentRoute} />;
    }
  };

  return (
    <View style={[styles.appContainer, { backgroundColor: colors.background }]}>
      {/* Dynamic Toast popup notifier */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />

      {!isAuthenticated ? (
        <LoginScreen />
      ) : (
        <POSLayout
          currentRoute={currentRoute}
          onNavigate={setCurrentRoute}
          showRightPanel={currentRoute === 'menu'} // show cart only on Menu Screen
          onNavigateToBilling={() => setCurrentRoute('billing')}
          onNavigateToFloor={() => setCurrentRoute('floor')}
          showToastMessage={triggerToast}
        >
          {renderScreen()}
        </POSLayout>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

