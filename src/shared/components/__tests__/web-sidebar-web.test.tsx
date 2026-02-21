import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => require('@/src/__mocks__/router').expoRouterMock);

// Mock @expo/vector-icons to avoid font loading in tests
jest.mock('@expo/vector-icons/Feather', () => {
  const { Text: RNText } = require('react-native');
  const MockFeather = (props: { name: string; size?: number; color?: string }) => (
    <RNText>{props.name}</RNText>
  );
  MockFeather.font = {};
  return { __esModule: true, default: MockFeather };
});

import {
  mockRouter,
  mockUsePathname,
  resetRouterMocks,
} from '@/src/__mocks__/router';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tabs.chat': 'Chat',
        'tabs.community': 'Community',
        'tabs.myAgent': 'My Agent',
        'tabs.myPage': 'My Page',
        'settings.guest': 'Guest',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useResponsive
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
}));

// Mock useUser
const mockUserState = {
  user: {
    id: 'user-1',
    displayName: 'Test User',
    twinName: 'AltMe',
    avatarIcon: 'default' as const,
    speechTone: 'polite' as const,
    onboardingCompleted: true,
    email: 'test@example.com',
    avatarUrl: null,
    ageRange: null,
    locale: 'ja',
    timezone: 'Asia/Tokyo',
    mbtiType: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
};
jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: (selector: (s: typeof mockUserState) => unknown) => selector(mockUserState),
}));

// Mock useIsPro
let mockIsPro = false;
jest.mock('@/src/shared/hooks/use-platform-subscription', () => ({
  useIsPro: () => mockIsPro,
}));

import { WebSidebar } from '../web-sidebar';

// Utility: collect all text content from JSON tree
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

describe('WebSidebar', () => {
  beforeEach(() => {
    resetRouterMocks();
    mockIsPro = false;
    mockResponsive.isDesktop = true;
    mockResponsive.isTablet = false;
    mockResponsive.isWide = false;
    mockUsePathname.mockReturnValue('/');
  });

  it('should render without crashing', () => {
    const tree = getTree(<WebSidebar />);
    expect(tree).toBeTruthy();
  });

  it('should render 4 navigation labels when expanded', () => {
    const tree = getTree(<WebSidebar />);
    const texts = collectTexts(tree);
    expect(texts).toContain('Chat');
    expect(texts).toContain('Community');
    expect(texts).toContain('My Agent');
    expect(texts).toContain('My Page');
  });

  it('should not show labels when collapsed', () => {
    const tree = getTree(<WebSidebar collapsed />);
    const texts = collectTexts(tree);
    expect(texts).not.toContain('Chat');
    expect(texts).not.toContain('Community');
    expect(texts).not.toContain('My Agent');
    expect(texts).not.toContain('My Page');
  });

  it('should navigate on Community press', () => {
    const { getByLabelText } = render(<WebSidebar />);
    fireEvent.press(getByLabelText('Community'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/community');
  });

  it('should navigate on Chat press', () => {
    const { getByLabelText } = render(<WebSidebar />);
    fireEvent.press(getByLabelText('Chat'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)');
  });

  it('should navigate to settings', () => {
    const { getByLabelText } = render(<WebSidebar />);
    fireEvent.press(getByLabelText('My Page'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/settings');
  });

  it('should navigate to twin', () => {
    const { getByLabelText } = render(<WebSidebar />);
    fireEvent.press(getByLabelText('My Agent'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/twin');
  });

  it('should display user name when expanded', () => {
    const tree = getTree(<WebSidebar />);
    const texts = collectTexts(tree);
    expect(texts).toContain('Test User');
  });

  it('should show Free badge for free users', () => {
    mockIsPro = false;
    const tree = getTree(<WebSidebar />);
    const texts = collectTexts(tree);
    expect(texts).toContain('Free');
  });

  it('should show Pro badge for pro users', () => {
    mockIsPro = true;
    const tree = getTree(<WebSidebar />);
    const texts = collectTexts(tree);
    expect(texts).toContain('Pro');
  });

  it('should auto-collapse on tablet (no labels)', () => {
    mockResponsive.isTablet = true;
    mockResponsive.isDesktop = false;
    const tree = getTree(<WebSidebar />);
    const texts = collectTexts(tree);
    expect(texts).not.toContain('Chat');
    expect(texts).not.toContain('Community');
  });

  it('should show brand name AltMe when expanded', () => {
    const tree = getTree(<WebSidebar />);
    const texts = collectTexts(tree);
    expect(texts).toContain('AltMe');
  });

  it('should hide brand name when collapsed but show logo initial', () => {
    const tree = getTree(<WebSidebar collapsed />);
    const texts = collectTexts(tree);
    expect(texts).not.toContain('AltMe');
    expect(texts).toContain('A');
  });

  it('should show avatar initial from display name', () => {
    const tree = getTree(<WebSidebar />);
    const texts = collectTexts(tree);
    expect(texts).toContain('T');
  });

  it('should hide user info when collapsed', () => {
    const tree = getTree(<WebSidebar collapsed />);
    const texts = collectTexts(tree);
    expect(texts).not.toContain('Test User');
    expect(texts).not.toContain('Free');
  });
});
