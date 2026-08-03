import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { COLORS } from '@/theme/theme';
import { POSLayout } from '@/components/layout/POSLayout';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { FloorScreen } from '@/screens/FloorScreen';
import { MenuScreen } from '@/screens/MenuScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { BillingScreen } from '@/screens/BillingScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { Toast } from '@/components/ui/Dialog';

export default function App() {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

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
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
});
