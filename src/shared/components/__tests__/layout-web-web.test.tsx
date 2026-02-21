import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => require('@/src/__mocks__/router').expoRouterMock);

// Mock @expo/vector-icons to avoid font loading in tests
jest.mock('@expo/vector-icons/Feather', () => {
  const { Text } = require('react-native');
  const MockFeather = (props: { name: string }) => <Text>{props.name}</Text>;
  MockFeather.font = {};
  return { __esModule: true, default: MockFeather };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock useResponsive — control breakpoint per test
const mockResponsive = {
  breakpoint: 'desktop' as const,
  width: 1200,
  height: 800,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isWide: false,
};
jest.mock('@/src/shared/hooks/use-responsive', () => ({
  useResponsive: () => mockResponsive,
  BREAKPOINTS: { tablet: 768, desktop: 1024, wide: 1440 },
}));

jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: (selector: (s: { user: null }) => unknown) => selector({ user: null }),
}));

jest.mock('@/src/shared/hooks/use-platform-subscription', () => ({
  useIsPro: () => false,
}));

import { resetRouterMocks } from '@/src/__mocks__/router';
import TabLayoutWeb from '@/app/(tabs)/_layout.web';

type JsonNode = {
  type: string;
  props?: Record<string, unknown>;
  children?: (JsonNode | string)[] | null;
};

const collectTexts = (node: JsonNode | string | null): string[] => {
  if (!node) return [];
  if (typeof node === 'string') return [node];
  const texts: string[] = [];
  if (node.children) {
    for (const child of node.children) {
      texts.push(...collectTexts(child));
    }
  }
  return texts;
};

const getTree = (element: React.ReactElement): JsonNode => {
  const tree = render(element).toJSON();
  return (Array.isArray(tree) ? tree[0] : tree) as JsonNode;
};

describe('_layout.web.tsx (TabLayoutWeb)', () => {
  beforeEach(() => {
    resetRouterMocks();
    mockResponsive.isMobile = false;
    mockResponsive.isTablet = false;
    mockResponsive.isDesktop = true;
    mockResponsive.isWide = false;
  });

  it('should render sidebar layout on desktop', () => {
    const tree = getTree(<TabLayoutWeb />);
    expect(tree).toBeTruthy();
    // Desktop layout should contain sidebar icon names (from Feather mock)
    const texts = collectTexts(tree);
    expect(texts).toContain('message-circle');
    expect(texts).toContain('users');
    expect(texts).toContain('cpu');
    // Should contain sidebar nav labels
    expect(texts).toContain('tabs.chat');
    // Should contain brand name
    expect(texts).toContain('AltMe');
  });

  it('should render bottom tabs on mobile', () => {
    mockResponsive.isMobile = true;
    mockResponsive.isDesktop = false;
    const tree = getTree(<TabLayoutWeb />);
    const texts = collectTexts(tree);
    // Mobile bottom tabs show tab labels
    expect(texts).toContain('tabs.chat');
    expect(texts).toContain('tabs.community');
    expect(texts).toContain('tabs.myAgent');
    expect(texts).toContain('tabs.myPage');
  });

  it('should not show nav labels on tablet (collapsed sidebar)', () => {
    mockResponsive.isTablet = true;
    mockResponsive.isDesktop = false;
    mockResponsive.isMobile = false;
    const tree = getTree(<TabLayoutWeb />);
    const texts = collectTexts(tree);
    // Collapsed sidebar should not contain tab labels
    expect(texts).not.toContain('tabs.chat');
  });

  it('should render on wide screen', () => {
    mockResponsive.isWide = true;
    mockResponsive.isDesktop = false;
    mockResponsive.isMobile = false;
    mockResponsive.isTablet = false;
    const tree = getTree(<TabLayoutWeb />);
    expect(tree).toBeTruthy();
  });

  it('should switch from desktop to mobile correctly', () => {
    // First render as desktop
    const { unmount } = render(<TabLayoutWeb />);
    unmount();

    // Then render as mobile
    mockResponsive.isMobile = true;
    mockResponsive.isDesktop = false;
    const tree = getTree(<TabLayoutWeb />);
    const texts = collectTexts(tree);
    expect(texts).toContain('tabs.chat');
  });
});
