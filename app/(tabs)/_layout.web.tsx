import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';

import { colors } from '@/src/config/theme';
import { useResponsive } from '@/src/shared/hooks/use-responsive';
import { WebSidebar } from '@/src/shared/components/web-sidebar';
import { MobileBottomTabs } from '@/src/shared/components/mobile-bottom-tabs';

export default function TabLayoutWeb() {
  const { isMobile, isTablet } = useResponsive();

  // Mobile: bottom tabs (same as native)
  // Tablet: collapsed sidebar (icons only)
  // Desktop/Wide: expanded sidebar
  if (isMobile) {
    return (
      <View style={styles.mobileContainer}>
        <View style={styles.mobileContent}>
          <Slot />
        </View>
        <MobileBottomTabs />
      </View>
    );
  }

  return (
    <View style={styles.desktopContainer} testID="web-tabs-layout">
      <WebSidebar collapsed={isTablet} />
      <View style={[styles.desktopContent, { marginLeft: 0 }]}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mobileContent: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  desktopContent: {
    flex: 1,
  },
});
