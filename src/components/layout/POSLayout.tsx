import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RightPanel } from './RightPanel';

interface POSLayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  onNavigate: (route: string) => void;
  showRightPanel?: boolean;
  onNavigateToBilling?: () => void;
  onNavigateToFloor?: () => void;
  showToastMessage: (msg: string) => void;
}

export const POSLayout: React.FC<POSLayoutProps> = ({
  children,
  currentRoute,
  onNavigate,
  showRightPanel = false,
  onNavigateToBilling,
  onNavigateToFloor,
  showToastMessage,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
        {/* Left Navigation Sidebar */}
        <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />

        {/* Right workspace: Header + Content row */}
        <View style={styles.workspace}>
          <Header showToastMessage={showToastMessage} />

          {/* Core content and Cart right-panel */}
          <View style={styles.contentRow}>
            <View style={styles.mainContent}>{children}</View>

            {showRightPanel && (
              <RightPanel
                onNavigateToBilling={onNavigateToBilling}
                onNavigateToFloor={onNavigateToFloor}
                showToastMessage={showToastMessage}
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  rootContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  workspace: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  mainContent: {
    flex: 1,
    height: '100%',
  },
});
