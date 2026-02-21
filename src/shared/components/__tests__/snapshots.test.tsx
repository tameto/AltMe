import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Mock expo-blur
jest.mock('expo-blur', () => {
  const RN = require('react-native');
  return {
    BlurView: (props: Record<string, unknown>) => <RN.View testID="blur-view" {...props} />,
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const RN = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: { children: React.ReactNode }) => (
      <RN.View testID="linear-gradient" {...props}>
        {children}
      </RN.View>
    ),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => (
      <RN.View testID="safe-area-view" {...props}>
        {children}
      </RN.View>
    ),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock use-responsive hook
jest.mock('@/src/shared/hooks/use-responsive', () => ({
  useResponsive: () => ({
    breakpoint: 'mobile',
    width: 375,
    height: 812,
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isWide: false,
  }),
}));

import { GlassCard } from '../glass-card';
import { GoldButton } from '../gold-button';
import { ErrorBoundary } from '../error-boundary';
import { ResponsiveContainer } from '../responsive-container';

describe('Shared component snapshots', () => {
  describe('GlassCard', () => {
    it('matches snapshot with default variant', () => {
      const tree = render(
        <GlassCard>
          <Text>Card content</Text>
        </GlassCard>,
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('matches snapshot with bubble-ai variant', () => {
      const tree = render(
        <GlassCard variant="bubble-ai">
          <Text>AI message</Text>
        </GlassCard>,
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('matches snapshot with bubble-user variant', () => {
      const tree = render(
        <GlassCard variant="bubble-user">
          <Text>User message</Text>
        </GlassCard>,
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('matches snapshot with input variant', () => {
      const tree = render(
        <GlassCard variant="input">
          <Text>Input area</Text>
        </GlassCard>,
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('GoldButton', () => {
    it('matches snapshot in default state', () => {
      const tree = render(
        <GoldButton title="Subscribe" onPress={() => {}} />,
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('matches snapshot in disabled state', () => {
      const tree = render(
        <GoldButton title="Subscribe" onPress={() => {}} disabled />,
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('matches snapshot in loading state', () => {
      const tree = render(
        <GoldButton title="Subscribe" onPress={() => {}} loading />,
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('ErrorBoundary', () => {
    it('matches snapshot with children', () => {
      const tree = render(
        <ErrorBoundary>
          <Text>Normal content</Text>
        </ErrorBoundary>,
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('ResponsiveContainer', () => {
    it('matches snapshot on mobile', () => {
      const tree = render(
        <ResponsiveContainer>
          <View>
            <Text>Page content</Text>
          </View>
        </ResponsiveContainer>,
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
