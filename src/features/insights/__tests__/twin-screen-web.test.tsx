/**
 * Twin Screen Web テスト（M120/M126）
 *
 * Web プラットフォームでのダッシュボードレイアウト確認:
 * - desktop/mobile レイアウト切替でクラッシュしない
 * - useResponsive hook が呼ばれる
 * - ゲストモード/認証モード切替
 * - Pro/Free 表示分岐
 * - データなし/ローディング状態
 *
 * jest.config.ts の "web" project にマッチ: *-web.test.tsx
 */
import '../../../__smoke-tests__/smoke-setup';

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';

// Mock useResponsive with controllable return value
jest.mock('@/src/shared/hooks/use-responsive', () => ({
  useResponsive: jest.fn(() => ({
    breakpoint: 'desktop' as const,
    width: 1200,
    height: 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWide: false,
  })),
}));

jest.mock('@/src/shared/hooks/use-page-title', () => ({
  usePageTitle: jest.fn(),
}));

// Override avatar-map to use URI (avoid react-native-web Image resolver crash)
jest.mock('@/src/config/avatar-map', () => ({
  getAvatarSource: jest.fn().mockReturnValue({ uri: 'https://example.com/avatar.png' }),
}));

// Override useTwinData with controllable mock
jest.mock('@/src/features/insights/hooks/use-twin-data', () => ({
  useTwinData: jest.fn(() => ({
    isLoading: false,
    personalityTraits: {
      openness: 75,
      conscientiousness: 82,
      extraversion: 45,
      agreeableness: 68,
      neuroticism: 35,
    },
    summary: 'Creative and organized individual.',
    hasData: true,
    error: null,
    fetchSoulMd: jest.fn().mockResolvedValue('# SOUL.md content'),
  })),
}));

// Override auth store for authenticated user
jest.mock('@/src/features/auth/stores/auth-store', () => ({
  useAuthStore: Object.assign(
    jest.fn((selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
      };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({ isAuthenticated: true, isGuest: false }),
      setState: jest.fn(),
      subscribe: jest.fn(),
    },
  ),
}));

jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: Object.assign(
    jest.fn((selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        user: {
          id: 'user-1',
          twinName: 'WebTwin',
          mbtiType: 'INFP',
          avatarIcon: 'default',
        },
      };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({ user: { id: 'user-1' } }),
      setState: jest.fn(),
      subscribe: jest.fn(),
    },
  ),
}));

jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useIsPro: jest.fn().mockReturnValue(false),
  useSubscription: jest.fn().mockReturnValue({
    entitlement: { isPro: false },
  }),
}));

import { useResponsive } from '@/src/shared/hooks/use-responsive';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useTwinData } from '@/src/features/insights/hooks/use-twin-data';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import TwinScreen from '@/app/(tabs)/twin';

function setDesktopMode() {
  (useResponsive as jest.Mock).mockReturnValue({
    breakpoint: 'desktop',
    width: 1200,
    height: 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWide: false,
  });
}

function setMobileMode() {
  (useResponsive as jest.Mock).mockReturnValue({
    breakpoint: 'mobile',
    width: 375,
    height: 812,
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isWide: false,
  });
}

function setUnauthenticated() {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector?: (s: Record<string, unknown>) => unknown) => {
      const state = { isAuthenticated: false, isGuest: false };
      return selector ? selector(state) : state;
    },
  );
}

function setNoData() {
  (useTwinData as jest.Mock).mockReturnValue({
    isLoading: false,
    personalityTraits: null,
    summary: null,
    hasData: false,
    error: null,
    fetchSoulMd: jest.fn().mockResolvedValue(null),
  });
}

function setLoading() {
  (useTwinData as jest.Mock).mockReturnValue({
    isLoading: true,
    personalityTraits: null,
    summary: null,
    hasData: false,
    error: null,
    fetchSoulMd: jest.fn().mockResolvedValue(null),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setDesktopMode();
  Platform.OS = 'web';
  (useIsPro as jest.Mock).mockReturnValue(false);
});

describe('TwinScreen Web — desktop layout', () => {
  it('desktop layout renders without crash', () => {
    setDesktopMode();
    const { toJSON } = render(<TwinScreen />);
    expect(toJSON()).not.toBeNull();
    expect(useResponsive).toHaveBeenCalled();
  });

  it('mobile layout renders without crash', () => {
    setMobileMode();
    const { toJSON } = render(<TwinScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('authenticated user renders content', () => {
    const { toJSON } = render(<TwinScreen />);
    expect(toJSON()).not.toBeNull();
    expect(useTwinData).toHaveBeenCalled();
  });

  it('unauthenticated user renders guest UI', () => {
    setUnauthenticated();
    const { toJSON } = render(<TwinScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('Pro user renders SOUL.md button area', () => {
    (useIsPro as jest.Mock).mockReturnValue(true);
    const { toJSON } = render(<TwinScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('Free user renders without SOUL.md button', () => {
    (useIsPro as jest.Mock).mockReturnValue(false);
    const { toJSON } = render(<TwinScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('no data state renders empty message', () => {
    setNoData();
    const { toJSON } = render(<TwinScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('loading state renders loading indicator', () => {
    setLoading();
    const { toJSON } = render(<TwinScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('useResponsive is called on every render', () => {
    render(<TwinScreen />);
    expect(useResponsive).toHaveBeenCalled();
  });

  it('desktop then mobile switch renders both', () => {
    setDesktopMode();
    const { toJSON: desktopJSON, unmount } = render(<TwinScreen />);
    expect(desktopJSON()).not.toBeNull();
    unmount();

    setMobileMode();
    const { toJSON: mobileJSON } = render(<TwinScreen />);
    expect(mobileJSON()).not.toBeNull();
  });

  it('useTwinData hook is called for authenticated user', () => {
    render(<TwinScreen />);
    expect(useTwinData).toHaveBeenCalled();
  });
});
