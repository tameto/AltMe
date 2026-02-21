/**
 * Auth Callback Screen Tests
 *
 * Web OAuth redirect コールバック画面のテスト
 * 仕様: specs/features/auth.md
 *
 * テストケース:
 * 1. ローディング状態の初期表示
 * 2. provider エラーパラメータ受信時のエラー表示
 * 3. セッション確立成功 + オンボーディング未完了 → welcome へ遷移
 * 4. セッション確立成功 + オンボーディング完了済み → tabs へ遷移
 * 5. getSession エラー時のエラー表示
 * 6. プロフィール取得失敗時のエラー表示
 * 7. エラー画面からログイン画面へ戻るリンク
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

// ---- モック定義（import より先に定義する必要がある） ----

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: jest.fn(() => ({})),
}));

const mockGetSession = jest.fn();
const mockGetCurrentProfile = jest.fn();

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

jest.mock('@/src/services/supabase/auth', () => ({
  getCurrentProfile: (...args: unknown[]) => mockGetCurrentProfile(...args),
}));

const mockCheckSubscriptionStatus = jest.fn();
jest.mock('@/src/services/revenuecat/client', () => ({
  checkSubscriptionStatus: (...args: unknown[]) => mockCheckSubscriptionStatus(...args),
}));

const mockSetUser = jest.fn();
jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: {
    getState: () => ({ setUser: mockSetUser }),
  },
}));

const mockSetEntitlement = jest.fn();
const mockSetLoading = jest.fn();
jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useSubscription: {
    getState: () => ({
      setEntitlement: mockSetEntitlement,
      setLoading: mockSetLoading,
    }),
  },
}));

jest.mock('@/src/features/auth/stores/auth-store', () => ({
  useAuthStore: {
    setState: jest.fn(),
  },
}));

// ---- テスト対象を import ----
import { useLocalSearchParams } from 'expo-router';
import AuthCallbackScreen from '@/app/auth/callback';

const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;

// ---- テストデータ ----

const MOCK_SESSION = {
  data: {
    session: {
      user: { id: 'user-123' },
      access_token: 'token-abc',
    },
  },
  error: null,
};

const MOCK_PROFILE_ONBOARDING_DONE = {
  id: 'user-123',
  displayName: 'テストユーザー',
  onboardingCompleted: true,
  avatarIcon: 'default' as const,
  speechTone: 'friendly' as const,
  locale: 'ja',
  timezone: 'Asia/Tokyo',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  avatarUrl: null,
  email: null,
  ageRange: null,
  twinName: null,
  mbtiType: null,
};

const MOCK_PROFILE_ONBOARDING_PENDING = {
  ...MOCK_PROFILE_ONBOARDING_DONE,
  onboardingCompleted: false,
};

const MOCK_ENTITLEMENT = {
  isPro: false,
  isTrialing: false,
  status: 'free' as const,
  planType: 'free' as const,
  expiresAt: null,
  trialDaysRemaining: null,
};

// ---- テスト ----

describe('AuthCallbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルト: エラーパラメータなし
    mockUseLocalSearchParams.mockReturnValue({});
    // デフォルト: 正常セッション
    mockGetSession.mockResolvedValue(MOCK_SESSION);
    // デフォルト: オンボーディング完了済みプロフィール
    mockGetCurrentProfile.mockResolvedValue(MOCK_PROFILE_ONBOARDING_DONE);
    // デフォルト: サブスク状態
    mockCheckSubscriptionStatus.mockResolvedValue(MOCK_ENTITLEMENT);
  });

  it('初期表示でローディングインジケーターが表示される', () => {
    // getSession を pending のままにする（resolveしない）
    mockGetSession.mockReturnValue(new Promise(() => {}));

    render(<AuthCallbackScreen />);

    expect(screen.getByText('ログイン処理中...')).toBeTruthy();
  });

  it('provider が error パラメータを返した場合にエラーUIを表示する', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      error: 'access_denied',
      error_description: 'User%20denied%20access',
    });

    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('ログインエラー')).toBeTruthy();
      expect(screen.getByText('User denied access')).toBeTruthy();
    });

    // エラー時は getSession を呼ばない
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('error_description がない場合にデフォルトエラーメッセージを表示する', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      error: 'server_error',
    });

    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('ログインに失敗しました')).toBeTruthy();
    });
  });

  it('セッション確立成功 + オンボーディング未完了 → welcome へ遷移する', async () => {
    mockGetCurrentProfile.mockResolvedValue(MOCK_PROFILE_ONBOARDING_PENDING);

    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/welcome');
    });

    expect(mockSetUser).toHaveBeenCalledWith(MOCK_PROFILE_ONBOARDING_PENDING);
  });

  it('セッション確立成功 + オンボーディング完了済み → tabs へ遷移する', async () => {
    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });

    expect(mockSetUser).toHaveBeenCalledWith(MOCK_PROFILE_ONBOARDING_DONE);
    expect(mockSetEntitlement).toHaveBeenCalledWith(MOCK_ENTITLEMENT);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('getSession がエラーを返した場合にエラーUIを表示する', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Session error'),
    });

    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('ログインエラー')).toBeTruthy();
      expect(screen.getByText('セッションの確立に失敗しました')).toBeTruthy();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('getCurrentProfile が null を返した場合にエラーUIを表示する', async () => {
    mockGetCurrentProfile.mockResolvedValue(null);

    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('ログインエラー')).toBeTruthy();
      expect(screen.getByText('プロフィールの取得に失敗しました')).toBeTruthy();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('エラー画面の「ログイン画面に戻る」リンクを押すとログイン画面へ遷移する', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      error: 'access_denied',
    });

    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('ログイン画面に戻る')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('ログイン画面に戻る'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('getSession が例外をスローした場合にエラーUIを表示する', async () => {
    mockGetSession.mockRejectedValue(new Error('Network error'));

    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('ログインエラー')).toBeTruthy();
      expect(screen.getByText('ログイン処理中にエラーが発生しました')).toBeTruthy();
    });
  });
});
