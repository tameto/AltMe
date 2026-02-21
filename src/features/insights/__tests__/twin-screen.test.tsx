/**
 * TDD-RED: Twin Screen Rendering Tests
 *
 * These tests define the expected rendering behavior of twin.tsx screen
 * BEFORE full implementation. Tests should FAIL if functionality is missing.
 *
 * SDD Spec: specs/features/insights.md
 * AC-1 (Big Five性格プロフィール), AC-6 (SOUL.md), AC-7 (OpenClawステータス)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Native module mocks (must be first)
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
jest.mock('@expo/vector-icons/Feather', () => 'Feather');

// Module mocks (must be before imports that use them)
jest.mock('@/src/features/auth/stores/auth-store');
jest.mock('@/src/shared/hooks/use-user');
jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useIsPro: jest.fn().mockReturnValue(false),
  useSubscription: jest.fn().mockReturnValue({
    entitlement: { isPro: false },
  }),
}));
const mockResponsiveValues = {
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  isWide: false,
  width: 375,
  height: 812,
  breakpoint: 'mobile' as 'mobile' | 'tablet' | 'desktop',
};
jest.mock('@/src/shared/hooks/use-responsive', () => ({
  useResponsive: () => mockResponsiveValues,
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
  getAvatarSource: jest.fn().mockReturnValue(1),
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

describe('TwinScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTwinData.mockReturnValue(defaultTwinDataReturn);
    mockUseIsPro.mockReturnValue(true);
  });

  describe('認証済みユーザー', () => {
    it('アバター画像が表示されること', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);

      // アバターコンテナが表示される
      const avatar = screen.getByTestId('twin-avatar');
      expect(avatar).toBeTruthy();
    });

    it('ツイン名が表示されること', () => {
      setupAuthenticatedUser({ twinName: 'テストツイン' });
      render(<TwinScreen />);

      expect(screen.getByText('テストツイン')).toBeTruthy();
    });

    it('MBTI設定済み時にMBTIバッジが表示されること', () => {
      setupAuthenticatedUser({ mbtiType: 'INTJ' });
      render(<TwinScreen />);

      expect(screen.getByTestId('mbti-badge')).toBeTruthy();
      expect(screen.getByText('INTJ')).toBeTruthy();
    });

    it('MBTI未設定時にMBTIバッジが非表示であること', () => {
      setupAuthenticatedUser({ mbtiType: null });
      render(<TwinScreen />);

      expect(screen.queryByTestId('mbti-badge')).toBeNull();
    });

    it('Big Five 5トレイトがプログレスバーで表示されること', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);

      // 5トレイトのプログレスバーが表示される
      const progressBars = screen.getAllByTestId('trait-progress-bar');
      expect(progressBars).toHaveLength(5);
    });

    it('各トレイトのパーセンテージが正しく表示されること', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);

      // 各トレイトの値が `label X%` 形式で表示される
      expect(screen.getByText(/75%/)).toBeTruthy(); // openness
      expect(screen.getByText(/82%/)).toBeTruthy(); // conscientiousness
      expect(screen.getByText(/45%/)).toBeTruthy(); // extraversion
      expect(screen.getByText(/68%/)).toBeTruthy(); // agreeableness
      expect(screen.getByText(/35%/)).toBeTruthy(); // neuroticism
    });

    it('SOUL.md閲覧ボタンが表示されること', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);

      const soulButton = screen.getByTestId('view-soul-md-button');
      expect(soulButton).toBeTruthy();
    });

    it('SOUL.md閲覧ボタンをタップするとfetchSoulMdが呼ばれること', async () => {
      setupAuthenticatedUser();
      const fetchMock = jest.fn().mockResolvedValue('# SOUL.md');
      mockUseTwinData.mockReturnValue({
        ...defaultTwinDataReturn,
        fetchSoulMd: fetchMock,
      });

      render(<TwinScreen />);

      const soulButton = screen.getByTestId('view-soul-md-button');
      fireEvent.press(soulButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('未認証ユーザー', () => {
    it('GuestPromptOverlayが表示されること', () => {
      setupUnauthenticated();
      mockUseTwinData.mockReturnValue({
        ...defaultTwinDataReturn,
        personalityTraits: null,
        hasData: false,
      });

      render(<TwinScreen />);

      // GuestPromptOverlayが表示される（ゲスト状態）
      const guestOverlay = screen.getByTestId('guest-prompt-overlay');
      expect(guestOverlay).toBeTruthy();
    });
  });

  describe('ローディング状態', () => {
    it('データ取得中にローディングインジケーターが表示されること', () => {
      setupAuthenticatedUser();
      mockUseTwinData.mockReturnValue({
        ...defaultTwinDataReturn,
        isLoading: true,
        personalityTraits: null,
        hasData: false,
      });

      render(<TwinScreen />);

      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('データなし状態', () => {
    it('性格診断未実施時に空状態メッセージが表示されること', () => {
      setupAuthenticatedUser();
      mockUseTwinData.mockReturnValue({
        ...defaultTwinDataReturn,
        isLoading: false,
        personalityTraits: null,
        hasData: false,
      });

      render(<TwinScreen />);

      expect(screen.getByTestId('no-data-message')).toBeTruthy();
    });
  });

  describe('Web Desktop レイアウト (M126)', () => {
    beforeEach(() => {
      // Desktop breakpoint に切り替え
      mockResponsiveValues.isMobile = false;
      mockResponsiveValues.isDesktop = true;
      mockResponsiveValues.width = 1280;
      mockResponsiveValues.breakpoint = 'desktop' as const;
    });

    afterEach(() => {
      // モバイルにリセット
      mockResponsiveValues.isMobile = true;
      mockResponsiveValues.isDesktop = false;
      mockResponsiveValues.width = 375;
      mockResponsiveValues.breakpoint = 'mobile' as const;
    });

    it('Desktop時にBig Five 5トレイトが全て表示されること', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);

      const progressBars = screen.getAllByTestId('trait-progress-bar');
      expect(progressBars).toHaveLength(5);
    });

    it('Desktop時にアバターとツイン名が表示されること', () => {
      setupAuthenticatedUser({ twinName: 'デスクトップツイン' });
      render(<TwinScreen />);

      expect(screen.getByTestId('twin-avatar')).toBeTruthy();
      expect(screen.getByText('デスクトップツイン')).toBeTruthy();
    });

    it('Desktop時にMBTIバッジが表示されること', () => {
      setupAuthenticatedUser({ mbtiType: 'ENFP' });
      render(<TwinScreen />);

      expect(screen.getByTestId('mbti-badge')).toBeTruthy();
      expect(screen.getByText('ENFP')).toBeTruthy();
    });

    it('Desktop時にSOUL.mdボタンが表示されること', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);

      expect(screen.getByTestId('view-soul-md-button')).toBeTruthy();
    });

    it('Desktop時にローディング表示が正常に動作すること', () => {
      setupAuthenticatedUser();
      mockUseTwinData.mockReturnValue({
        ...defaultTwinDataReturn,
        isLoading: true,
        personalityTraits: null,
        hasData: false,
      });

      render(<TwinScreen />);

      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('Desktop時に各トレイトのパーセンテージが表示されること', () => {
      setupAuthenticatedUser();
      render(<TwinScreen />);

      expect(screen.getByText(/75%/)).toBeTruthy();
      expect(screen.getByText(/82%/)).toBeTruthy();
      expect(screen.getByText(/45%/)).toBeTruthy();
      expect(screen.getByText(/68%/)).toBeTruthy();
      expect(screen.getByText(/35%/)).toBeTruthy();
    });
  });

  describe('Pro/Free 表示分岐', () => {
    it('Free ユーザーはSOUL.mdボタンが非表示であること', () => {
      setupAuthenticatedUser();
      mockUseIsPro.mockReturnValue(false);

      render(<TwinScreen />);

      expect(screen.queryByTestId('view-soul-md-button')).toBeNull();
    });

    it('Pro ユーザーはSOUL.mdボタンが表示されること', () => {
      setupAuthenticatedUser();
      mockUseIsPro.mockReturnValue(true);

      render(<TwinScreen />);

      expect(screen.getByTestId('view-soul-md-button')).toBeTruthy();
    });
  });
});
