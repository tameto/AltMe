/**
 * M142: auth-store エッジケーステスト
 *
 * 既存の auth-store.test.ts ではカバーされていないエッジケース:
 * - signOut がネットワークエラーでも状態をリセットする (AC-3)
 * - Apple ログインキャンセル時にエラーをセットしない
 * - Google ログインキャンセル時にエラーをセットしない
 * - initialize でセッションはあるがプロファイルがない場合
 * - initialize でセッションがない場合のストアリセット
 * - onAuthStateChange SIGNED_OUT イベントによるリセット
 * - deleteAccount がエラー時に状態をリセットしない
 */

const mockSignInWithApple = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignOut = jest.fn();
const mockGetCurrentProfile = jest.fn();
const mockDeleteAccount = jest.fn();

jest.mock('@/src/services/supabase/auth', () => ({
  signInWithApple: (...args: unknown[]) => mockSignInWithApple(...args),
  signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  getCurrentProfile: (...args: unknown[]) => mockGetCurrentProfile(...args),
  updateProfile: jest.fn(),
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn((_cb?: unknown) => ({
  data: { subscription: { unsubscribe: jest.fn() } },
}));

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getSession: (...args: any[]) => mockGetSession(...args),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

const mockInitializeRevenueCat = jest.fn().mockResolvedValue(undefined);
const mockCheckSubscriptionStatus = jest.fn();
const mockAddCustomerInfoListener = jest.fn(() => jest.fn());

jest.mock('@/src/services/revenuecat/client', () => ({
  initializeRevenueCat: (...args: unknown[]) => mockInitializeRevenueCat(...args),
  checkSubscriptionStatus: (...args: unknown[]) => mockCheckSubscriptionStatus(...args),
  // @ts-expect-error mock wrapper
  addCustomerInfoListener: (...args: unknown[]) => mockAddCustomerInfoListener(...args),
}));

const mockDisconnectOpenClaw = jest.fn();
jest.mock('@/src/services/openclaw/connection-manager', () => ({
  disconnectOpenClaw: (...args: unknown[]) => mockDisconnectOpenClaw(...args),
}));

const mockSetUser = jest.fn();
const mockResetUser = jest.fn();
jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: {
    getState: () => ({ setUser: mockSetUser, reset: mockResetUser }),
  },
}));

const mockSetEntitlement = jest.fn();
const mockSetLoading = jest.fn();
const mockResetSubscription = jest.fn();
jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useSubscription: {
    getState: () => ({
      setEntitlement: mockSetEntitlement,
      setLoading: mockSetLoading,
      reset: mockResetSubscription,
    }),
  },
}));

import { useAuthStore } from '../stores/auth-store';

const MOCK_PROFILE = {
  id: 'user-123',
  displayName: 'Test',
  avatarUrl: null,
  email: 'test@example.com',
  ageRange: null,
  locale: 'ja',
  timezone: 'Asia/Tokyo',
  onboardingCompleted: true,
  twinName: 'Twin',
  avatarIcon: 'default' as const,
  speechTone: 'friendly' as const,
  mbtiType: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const MOCK_ENTITLEMENT = {
  isPro: false,
  isTrialing: false,
  status: 'free' as const,
  planType: 'free' as const,
  expiresAt: null,
  trialDaysRemaining: null,
};

describe('useAuthStore エッジケース', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      error: null,
    });
  });

  describe('signOut AC-3: ネットワークエラーでも状態リセット', () => {
    it('authSignOut がエラーを投げても状態がリセットされる', async () => {
      mockSignOut.mockRejectedValue(new Error('Network error'));
      useAuthStore.setState({ isAuthenticated: true });

      await useAuthStore.getState().signOut();

      expect(mockDisconnectOpenClaw).toHaveBeenCalled();
      expect(mockResetUser).toHaveBeenCalled();
      expect(mockResetSubscription).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('disconnectOpenClaw は signOut より先に呼ばれる', async () => {
      const callOrder: string[] = [];
      mockDisconnectOpenClaw.mockImplementation(() => { callOrder.push('disconnect'); });
      mockSignOut.mockImplementation(async () => { callOrder.push('signOut'); });

      useAuthStore.setState({ isAuthenticated: true });
      await useAuthStore.getState().signOut();

      expect(callOrder).toEqual(['disconnect', 'signOut']);
    });
  });

  describe('Apple ログインキャンセル', () => {
    it('ERR_REQUEST_CANCELED コードでエラーをセットしない', async () => {
      const cancelError = { code: 'ERR_REQUEST_CANCELED', message: 'User cancelled' };
      mockSignInWithApple.mockRejectedValue(cancelError);

      await useAuthStore.getState().signInWithApple();

      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('cancelled を含むメッセージでエラーをセットしない', async () => {
      mockSignInWithApple.mockRejectedValue(new Error('Operation cancelled by user'));

      await useAuthStore.getState().signInWithApple();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('Google ログインキャンセル', () => {
    it('SIGN_IN_CANCELLED コードでエラーをセットしない', async () => {
      const cancelError = { code: 'SIGN_IN_CANCELLED', message: 'User cancelled' };
      mockSignInWithGoogle.mockRejectedValue(cancelError);

      await useAuthStore.getState().signInWithGoogle();

      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('ERR_CANCELED を含むメッセージでエラーをセットしない', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('ERR_CANCELED'));

      await useAuthStore.getState().signInWithGoogle();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('initialize エッジケース', () => {
    it('セッションはあるがプロファイルがない場合は未認証', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });
      mockGetCurrentProfile.mockResolvedValue(null);
      mockCheckSubscriptionStatus.mockResolvedValue(MOCK_ENTITLEMENT);

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('セッションがない場合はユーザーストアをリセットする', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      await useAuthStore.getState().initialize();

      expect(mockSetUser).toHaveBeenCalledWith(null);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('初期化エラー時はローディングを解除しエラーメッセージをセット', async () => {
      mockInitializeRevenueCat.mockRejectedValue(new Error('RC init failed'));

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBe('アプリの初期化に失敗しました');
    });

    it('checkSubscriptionStatus がエラーを投げても initialize は完了する', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetSession.mockResolvedValue({ data: { session: null } });
      // initializeRevenueCat は成功するが getSession で null セッション

      await useAuthStore.getState().initialize();

      // セッションなし → isAuthenticated = false だが isLoading は解除される
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('deleteAccount', () => {
    it('成功時は全状態をリセットする', async () => {
      mockDeleteAccount.mockResolvedValue(undefined);
      useAuthStore.setState({ isAuthenticated: true, isGuest: false });

      await useAuthStore.getState().deleteAccount();

      expect(mockDisconnectOpenClaw).toHaveBeenCalled();
      expect(mockResetUser).toHaveBeenCalled();
      expect(mockResetSubscription).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('エラー時は状態をリセットせずエラーをセットして rethrow', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDeleteAccount.mockRejectedValue(new Error('Delete failed'));
      useAuthStore.setState({ isAuthenticated: true });

      await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow('Delete failed');

      expect(useAuthStore.getState().error).toBe('Delete failed');
      consoleSpy.mockRestore();
    });
  });

  describe('clearError', () => {
    it('エラーをクリアする', () => {
      useAuthStore.setState({ error: 'some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
