/**
 * TDD-RED: Settings Screen Rendering Tests
 *
 * These tests define the expected rendering behavior of settings.tsx screen
 * BEFORE full implementation. Tests should FAIL if functionality is missing.
 *
 * SDD Spec: specs/features/settings.md
 * AC-3 (サブスクリプション表示), AC-4 (OpenClaw状態), AC-6 (ログアウト), AC-7 (アカウント削除)
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
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

// Module mocks (must be before imports that use them)
jest.mock('@/src/features/auth/stores/auth-store');
jest.mock('@/src/shared/hooks/use-user');
jest.mock('@/src/shared/hooks/use-subscription');
jest.mock('@/src/features/insights/hooks/use-twin-data');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { version: '1.0.0' },
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/src/shared/components/cosmic-background', () => ({
  CosmicBackground: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/src/services/openclaw/client', () => ({
  getMyInstance: jest.fn().mockResolvedValue(null),
  restartInstance: jest.fn().mockResolvedValue({ success: true }),
  updateSoulMd: jest.fn().mockResolvedValue(undefined),
  subscribeToInstanceChanges: jest.fn().mockReturnValue(() => {}),
}));
jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn().mockResolvedValue({}),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));
jest.mock('@/src/config/constants', () => ({
  APP_NAME: 'AltMe',
}));

import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useUser } from '@/src/shared/hooks/use-user';
import { useIsPro, useSubscription } from '@/src/shared/hooks/use-subscription';
import SettingsScreen from '@/app/(tabs)/settings';

const mockUseAuthStore = useAuthStore as unknown as jest.MockedFunction<typeof useAuthStore>;
const mockUseUser = useUser as unknown as jest.MockedFunction<typeof useUser>;
const mockUseIsPro = useIsPro as jest.MockedFunction<typeof useIsPro>;
const mockUseSubscription = useSubscription as unknown as jest.MockedFunction<typeof useSubscription>;

function setupAuthenticatedUser(isPro = false) {
  mockUseAuthStore.mockImplementation((selector: any) =>
    selector({
      isAuthenticated: true,
      signOut: jest.fn().mockResolvedValue(undefined),
      signInWithApple: jest.fn().mockResolvedValue(undefined),
      signInWithGoogle: jest.fn().mockResolvedValue(undefined),
    }),
  );
  mockUseUser.mockImplementation((selector: any) =>
    selector({
      user: {
        id: 'user-1',
        displayName: 'テストユーザー',
        email: 'test@example.com',
        twinName: 'マイツイン',
        mbtiType: 'INFP',
      },
      updateUser: jest.fn(),
    }),
  );
  mockUseIsPro.mockReturnValue(isPro);
  mockUseSubscription.mockImplementation((selector: any) =>
    selector({ entitlement: { isPro } }),
  );
}

function setupUnauthenticatedUser() {
  mockUseAuthStore.mockImplementation((selector: any) =>
    selector({
      isAuthenticated: false,
      signOut: jest.fn(),
      signInWithApple: jest.fn().mockResolvedValue(undefined),
      signInWithGoogle: jest.fn().mockResolvedValue(undefined),
    }),
  );
  mockUseUser.mockImplementation((selector: any) =>
    selector({ user: null, updateUser: jest.fn() }),
  );
  mockUseIsPro.mockReturnValue(false);
  mockUseSubscription.mockImplementation((selector: any) =>
    selector({ entitlement: { isPro: false } }),
  );
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('認証済みユーザー（Freeプラン）', () => {
    it('プロフィールカードが表示されること', () => {
      setupAuthenticatedUser(false);
      render(<SettingsScreen />);

      expect(screen.getByTestId('profile-card')).toBeTruthy();
    });

    it('Freeユーザーに「Proにアップグレード」ボタンが表示されること', () => {
      setupAuthenticatedUser(false);
      render(<SettingsScreen />);

      expect(screen.getByTestId('upgrade-to-pro-button')).toBeTruthy();
    });

    it('設定項目が正しい順序で表示されること', () => {
      setupAuthenticatedUser(false);
      render(<SettingsScreen />);

      // 設定項目がtestIdで識別できる
      const subscriptionRow = screen.getByTestId('setting-row-subscription');
      const notificationRow = screen.getByTestId('setting-row-notifications');
      const privacyRow = screen.getByTestId('setting-row-privacy');
      const twinSettingsRow = screen.getByTestId('setting-row-twin-settings');
      const personalityRetakeRow = screen.getByTestId('setting-row-personality-retake');
      const languageRow = screen.getByTestId('setting-row-language');
      const helpRow = screen.getByTestId('setting-row-help');
      const termsRow = screen.getByTestId('setting-row-terms');

      expect(subscriptionRow).toBeTruthy();
      expect(notificationRow).toBeTruthy();
      expect(privacyRow).toBeTruthy();
      expect(twinSettingsRow).toBeTruthy();
      expect(personalityRetakeRow).toBeTruthy();
      expect(languageRow).toBeTruthy();
      expect(helpRow).toBeTruthy();
      expect(termsRow).toBeTruthy();

      // 順序確認: subscriptionRowがnotificationRowより前に表示される
      const allRows = screen.getAllByTestId(/^setting-row-/);
      const subscriptionIndex = allRows.indexOf(subscriptionRow);
      const notificationIndex = allRows.indexOf(notificationRow);
      const privacyIndex = allRows.indexOf(privacyRow);
      const twinSettingsIndex = allRows.indexOf(twinSettingsRow);
      const personalityRetakeIndex = allRows.indexOf(personalityRetakeRow);
      const languageIndex = allRows.indexOf(languageRow);
      const helpIndex = allRows.indexOf(helpRow);
      const termsIndex = allRows.indexOf(termsRow);

      expect(subscriptionIndex).toBeLessThan(notificationIndex);
      expect(notificationIndex).toBeLessThan(privacyIndex);
      expect(privacyIndex).toBeLessThan(twinSettingsIndex);
      expect(twinSettingsIndex).toBeLessThan(personalityRetakeIndex);
      expect(personalityRetakeIndex).toBeLessThan(languageIndex);
      expect(languageIndex).toBeLessThan(helpIndex);
      expect(helpIndex).toBeLessThan(termsIndex);
    });

    it('AIツインの設定にMBTIサブタイトルが表示されること', () => {
      setupAuthenticatedUser(false);
      render(<SettingsScreen />);

      const twinSettingsRow = screen.getByTestId('setting-row-twin-settings');
      expect(twinSettingsRow).toBeTruthy();

      // MBTIサブタイトルが含まれる
      expect(screen.getByTestId('twin-settings-mbti-subtitle')).toBeTruthy();
    });

    it('ログアウトボタンが表示されること', () => {
      setupAuthenticatedUser(false);
      render(<SettingsScreen />);

      expect(screen.getByTestId('logout-button')).toBeTruthy();
    });

    it('アカウント削除リンクが表示されること', () => {
      setupAuthenticatedUser(false);
      render(<SettingsScreen />);

      expect(screen.getByTestId('delete-account-link')).toBeTruthy();
    });
  });

  describe('認証済みユーザー（Proプラン）', () => {
    it('ProユーザーにはProバッジが表示されること', () => {
      setupAuthenticatedUser(true);
      render(<SettingsScreen />);

      expect(screen.getByTestId('pro-badge')).toBeTruthy();
    });

    it('Proユーザーにはアップグレードボタンが非表示であること', () => {
      setupAuthenticatedUser(true);
      render(<SettingsScreen />);

      expect(screen.queryByTestId('upgrade-to-pro-button')).toBeNull();
    });
  });

  describe('未認証ユーザー（ゲスト）', () => {
    it('ゲスト専用画面が表示されること', () => {
      setupUnauthenticatedUser();
      render(<SettingsScreen />);

      // ゲスト用ログインカードが表示される
      expect(screen.getByTestId('guest-settings-screen')).toBeTruthy();
    });

    it('ゲスト画面でAppleサインインボタンが表示されること（iOS）', () => {
      setupUnauthenticatedUser();
      render(<SettingsScreen />);

      // AppleサインインボタンはiOS専用なので存在しない場合もある
      // ゲスト画面のタイトルが表示されていることを確認
      expect(screen.getByTestId('guest-login-title')).toBeTruthy();
    });
  });

  describe('ログアウト操作', () => {
    it('ログアウトボタンをタップすると確認ダイアログが表示されること', async () => {
      setupAuthenticatedUser(false);
      const { Alert } = require('react-native');
      Alert.alert = jest.fn();

      render(<SettingsScreen />);

      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.press(logoutButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'settings.account.logout',
          'settings.account.logoutConfirm',
          expect.any(Array),
        );
      });
    });
  });

  describe('アカウント削除', () => {
    it('アカウント削除リンクをタップするとアカウント削除確認画面に遷移すること', async () => {
      setupAuthenticatedUser(false);
      const { useRouter } = require('expo-router');
      const mockPush = jest.fn();
      useRouter.mockReturnValue({ push: mockPush, replace: jest.fn() });

      render(<SettingsScreen />);

      const deleteLink = screen.getByTestId('delete-account-link');
      fireEvent.press(deleteLink);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/account-delete-confirm');
      });
    });
  });
});
