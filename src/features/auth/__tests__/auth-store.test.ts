/**
 * Auth Store テスト (M041)
 *
 * テストケース:
 * 1. signInWithApple が auth service を呼び、認証状態を更新する
 * 2. signInWithGoogle が auth service を呼び、認証状態を更新する
 * 3. signOut がローカルステートをリセットする
 * 4. enterGuestMode がゲスト状態をセットする
 * 5. initialize が既存セッションを復元する
 */

const mockSignInWithApple = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignOut = jest.fn();
const mockGetCurrentProfile = jest.fn();

jest.mock('@/src/services/supabase/auth', () => ({
  signInWithApple: (...args: unknown[]) => mockSignInWithApple(...args),
  signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  getCurrentProfile: (...args: unknown[]) => mockGetCurrentProfile(...args),
  updateProfile: jest.fn(),
  deleteAccount: jest.fn(),
}));

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: jest.fn() } },
}));

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getSession: (...args: any[]) => mockGetSession(...args),
      // @ts-expect-error mock wrapper
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeRevenueCat: (...args: any[]) => mockInitializeRevenueCat(...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkSubscriptionStatus: (...args: any[]) => mockCheckSubscriptionStatus(...args),
  // @ts-expect-error mock wrapper
  addCustomerInfoListener: (...args: any[]) => mockAddCustomerInfoListener(...args),
}));

jest.mock('@/src/services/openclaw/connection-manager', () => ({
  disconnectOpenClaw: jest.fn(),
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
const mockRefreshStatus = jest.fn().mockResolvedValue(undefined);
jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useSubscription: {
    getState: () => ({
      setEntitlement: mockSetEntitlement,
      setLoading: mockSetLoading,
      reset: mockResetSubscription,
      refreshStatus: mockRefreshStatus,
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

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      error: null,
    });
  });

  it('signInWithApple calls auth service and updates state', async () => {
    mockSignInWithApple.mockResolvedValue(MOCK_PROFILE);

    await useAuthStore.getState().signInWithApple();

    expect(mockSignInWithApple).toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith(MOCK_PROFILE);
    expect(mockRefreshStatus).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isGuest).toBe(false);
  });

  it('signInWithGoogle calls auth service and updates state', async () => {
    mockSignInWithGoogle.mockResolvedValue(MOCK_PROFILE);

    await useAuthStore.getState().signInWithGoogle();

    expect(mockSignInWithGoogle).toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith(MOCK_PROFILE);
    expect(mockRefreshStatus).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('signOut resets local state', async () => {
    mockSignOut.mockResolvedValue(undefined);

    // First set authenticated
    useAuthStore.setState({ isAuthenticated: true });

    await useAuthStore.getState().signOut();

    expect(mockResetUser).toHaveBeenCalled();
    expect(mockResetSubscription).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('enterGuestMode sets guest state', () => {
    useAuthStore.getState().enterGuestMode();

    expect(useAuthStore.getState().isGuest).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('initialize restores existing session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });
    mockGetCurrentProfile.mockResolvedValue(MOCK_PROFILE);

    await useAuthStore.getState().initialize();

    expect(mockInitializeRevenueCat).toHaveBeenCalled();
    expect(mockGetCurrentProfile).toHaveBeenCalledWith('user-123');
    expect(mockSetUser).toHaveBeenCalledWith(MOCK_PROFILE);
    expect(mockRefreshStatus).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
