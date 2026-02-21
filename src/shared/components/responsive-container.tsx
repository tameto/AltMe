import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '@/src/shared/hooks/use-responsive';
import { spacing } from '@/src/config/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  noPadding?: boolean;
};

export function ResponsiveContainer({ children, style, maxWidth, noPadding }: Props) {
  const { isMobile, isDesktop, isWide } = useResponsive();

  const containerMaxWidth = maxWidth ?? (isWide ? 1200 : isDesktop ? 960 : undefined);

  const Wrapper = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Wrapper style={[styles.container, style]}>
      <View style={[
        styles.inner,
        containerMaxWidth != null && { maxWidth: containerMaxWidth },
        !noPadding && !isMobile && styles.padding,
      ]}>
        {children}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
  padding: {
    paddingHorizontal: spacing.lg,
  },
});
