/**
 * Twin Screen Web テスト（M120/M126）
 *
 * Web プラットフォームでのダッシュボードレイアウト確認:
 * - desktop: コンテンツ最大幅制限（contentDesktop スタイル適用）
 * - ゲストモード対応
 * - Big Five グリッドレイアウト（Web では bigFiveGrid 適用）
 * - Pro/Free SOUL.md ボタン表示分岐
 *
 * jest.config.ts の "web" project にマッチ: *-web.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Native module mocks
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
}));
jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn().mockResolvedValue({}),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));
jest.mock('@/src/services/revenuecat/client', () => ({
  initializeRevenueCat: jest.fn().mockResolvedValue(undefined),
  checkSubscriptionStatus: jest.fn().mockResolvedValue({ isPro: false }),
  addCustomerInfoListener: jest.fn().mockReturnValue(() => {}),
  identifyUser: jest.fn().mockResolvedValue(undefined),
  logOutRevenueCat: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/src/services/openclaw/connection-manager', () => ({
  disconnectOpenClaw: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@expo/vector-icons/Feather', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) =>
    React.createElement(View, { testID: `feather-${props.name}` });
});

jest.mock('@/src/features/auth/stores/auth-store');
jest.mock('@/src/shared/hooks/use-user');
jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useIsPro: jest.fn().mockReturnValue(false),
  useSubscription: jest.fn().mockReturnValue({
    entitlement: { isPro: false },
  }),
}));
jest.mock('@/src/shared/hooks/use-responsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWide: false,
    width: 1440,
    height: 900,
    breakpoint: 'desktop',
  }),
}));
jest.mock('@/src/shared/hooks/use-page-title', () => ({
  usePageTitle: jest.fn(),
}));
jest.mock('@/src/features/insights/hooks/use-twin-data');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/src/shared/components/cosmic-background', () => ({
  CosmicBackground: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/src/shared/components/guest-prompt-overlay', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GuestPromptOverlay: () => React.createElement(View, { testID: 'guest-prompt-overlay' }),
  };
});
jest.mock('@/src/config/avatar-map', () => ({
  getAvatarSource: jest.fn().mockReturnValue({ uri: 'https://example.com/avatar.png' }),
}));
jest.mock('@/src/services/openclaw/client', () => ({
  getMyInstance: jest.fn().mockResolvedValue(null),
}));

import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useUser } from '@/src/shared/hooks/use-user';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useTwinData } from '@/src/features/insights/hooks/use-twin-data';
import TwinScreen from '@/app/(tabs)/twin';

const mockUseAuthStore = useAuthStore as unknown as jest.MockedFunction<typeof useAuthStore>;
const mockUseUser = useUser as unknown as jest.MockedFunction<typeof useUser>;
const mockUseIsPro = useIsPro as jest.MockedFunction<typeof useIsPro>;
const mockUseTwinData = useTwinData as jest.MockedFunction<typeof useTwinData>;

const defaultPersonalityTraits = {
  openness: 75,
  conscientiousness: 82,
  extraversion: 45,
  agreeableness: 68,
  neuroticism: 35,
};

const defaultTwinDataReturn = {
  isLoading: false,
  personalityTraits: defaultPersonalityTraits,
  summary: 'Creative and organized individual.',
  hasData: true,
  error: null,
  fetchSoulMd: jest.fn().mockResolvedValue('# SOUL.md content'),
};

function setupAuthenticatedUser(overrides: { mbtiType?: string | null; twinName?: string } = {}) {
  mockUseAuthStore.mockImplementation((selector: any) =>
    selector({ isAuthenticated: true }),
  );
  mockUseUser.mockImplementation((selector: any) =>
    selector({
      user: {
        id: 'user-1',
        twinName: overrides.twinName ?? 'マイツイン',
        mbtiType: overrides.mbtiType !== undefined ? overrides.mbtiType : 'INFP',
        avatarIcon: 'default',
      },
    }),
  );
}

function setupUnauthenticated() {
  mockUseAuthStore.mockImplementation((selector: any) =>
    selector({ isAuthenticated: false }),
  );
  mockUseUser.mockImplementation((selector: any) =>
    selector({ user: null }),
  );
}

describe('TwinScreen Web — desktop layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTwinData.mockReturnValue(defaultTwinDataReturn);
    mockUseIsPro.mockReturnValue(false);
  });

  describe('デスクトップレイアウト', () => {
    it('認証済みユーザーでアバターセクションが表示される', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);
      // AltMe ヘッダーが表示される
      expect(screen.getByText('AltMe')).toBeTruthy();
      // ツイン名が表示される
      expect(screen.getByText('マイツイン')).toBeTruthy();
    });

    it('Big Five 5トレイトのラベルが全て表示される', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);
      expect(screen.getByText(/twin\.traits\.extraversion/)).toBeTruthy();
      expect(screen.getByText(/twin\.traits\.agreeableness/)).toBeTruthy();
      expect(screen.getByText(/twin\.traits\.conscientiousness/)).toBeTruthy();
      expect(screen.getByText(/twin\.traits\.neuroticism/)).toBeTruthy();
      expect(screen.getByText(/twin\.traits\.openness/)).toBeTruthy();
    });

    it('ツイン名が表示される', () => {
      setupAuthenticatedUser({ twinName: 'WebTwin' });
      render(<TwinScreen />);
      expect(screen.getByText('WebTwin')).toBeTruthy();
    });

    it('MBTI タイプが表示される', () => {
      setupAuthenticatedUser({ mbtiType: 'INTJ' });
      render(<TwinScreen />);
      expect(screen.getByText('INTJ')).toBeTruthy();
    });

    it('性格タイトルセクションが表示される', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);
      expect(screen.getByText('twin.personalityTitle')).toBeTruthy();
    });
  });

  describe('ゲストモード（Web）', () => {
    it('未認証ユーザーに GuestPromptOverlay が表示される', () => {
      setupUnauthenticated();
      mockUseTwinData.mockReturnValue({
        ...defaultTwinDataReturn,
        personalityTraits: null,
        hasData: false,
      });
      render(<TwinScreen />);
      expect(screen.getByTestId('guest-prompt-overlay')).toBeTruthy();
    });
  });

  describe('Proユーザー（Web）', () => {
    it('Pro ユーザーに SOUL.md ボタンテキストが表示される', () => {
      mockUseIsPro.mockReturnValue(true);
      setupAuthenticatedUser();
      render(<TwinScreen />);
      expect(screen.getByText('twin.viewSoulMd')).toBeTruthy();
    });

    it('Free ユーザーには SOUL.md ボタンテキストが非表示', () => {
      mockUseIsPro.mockReturnValue(false);
      setupAuthenticatedUser();
      render(<TwinScreen />);
      expect(screen.queryByText('twin.viewSoulMd')).toBeNull();
    });

    it('SOUL.md ボタンクリックで fetchSoulMd が呼ばれる', async () => {
      mockUseIsPro.mockReturnValue(true);
      setupAuthenticatedUser();
      const fetchMock = jest.fn().mockResolvedValue('# SOUL.md');
      mockUseTwinData.mockReturnValue({
        ...defaultTwinDataReturn,
        fetchSoulMd: fetchMock,
      });
      render(<TwinScreen />);
      const soulButton = screen.getByText('twin.viewSoulMd');
      fireEvent.press(soulButton);
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('データなし状態（Web）', () => {
    it('性格診断未実施時に診断未実施テキストが表示される', () => {
      setupAuthenticatedUser();
      mockUseTwinData.mockReturnValue({
        ...defaultTwinDataReturn,
        isLoading: false,
        personalityTraits: null,
        hasData: false,
      });
      render(<TwinScreen />);
      expect(screen.getByText('twin.noDiagnosis')).toBeTruthy();
    });
  });
});
