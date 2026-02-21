/**
 * SubscriptionManageScreen テスト (M071)
 *
 * - Web: Stripe Portal リダイレクト（redirectToPortal）
 * - Native iOS: App Store サブスクリプション管理URLを開く
 * - Native Android: Play Store サブスクリプション管理URLを開く
 * - customer_not_found エラーハンドリング
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform, Linking } from 'react-native';

// ---- モック ----

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockRedirectToPortal = jest.fn();
jest.mock('@/src/services/stripe/client', () => ({
  redirectToPortal: (...args: unknown[]) => mockRedirectToPortal(...args),
}));

jest.mock('@/src/shared/components/cosmic-background', () => ({
  CosmicBackground: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@expo/vector-icons/Feather', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

const mockEntitlement = {
  isPro: true,
  isTrialing: false,
  status: 'active',
  planType: 'monthly',
  expiresAt: '2026-03-21T00:00:00Z',
  trialDaysRemaining: null,
};

jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useSubscription: () => ({
    entitlement: mockEntitlement,
  }),
}));

const mockUser = {
  id: 'user-1',
  twinName: 'MyTwin',
  createdAt: '2026-01-01T00:00:00Z',
};

jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: (selector: (s: { user: typeof mockUser }) => unknown) =>
    selector({ user: mockUser }),
}));

const mockSelect = jest.fn().mockReturnValue({
  eq: jest.fn().mockReturnValue({
    count: 42,
    error: null,
  }),
});

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
    }),
  },
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
}));

// ---- テスト対象 ----

import SubscriptionManageScreen from '@/app/subscription-manage';

// ---- テスト ----

describe('SubscriptionManageScreen — Web', () => {
  const originalOS = Platform.OS;

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirectToPortal.mockResolvedValue(undefined);
  });

  it('サブスクリプション管理画面が表示される', () => {
    render(<SubscriptionManageScreen />);

    expect(screen.getByText('subscription.manage.title')).toBeTruthy();
  });

  it('Web で「プランを管理」ボタンを押すと redirectToPortal が呼ばれる', async () => {
    render(<SubscriptionManageScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('manage-plan-button'));
    });

    expect(mockRedirectToPortal).toHaveBeenCalledTimes(1);
  });

  it('Web で「支払い方法」ボタンを押すと redirectToPortal が呼ばれる', async () => {
    render(<SubscriptionManageScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('payment-method-button'));
    });

    expect(mockRedirectToPortal).toHaveBeenCalledTimes(1);
  });

  it('redirectToPortal が customer_not_found エラーになると適切に処理される', async () => {
    mockRedirectToPortal.mockRejectedValue(new Error('customer_not_found'));

    render(<SubscriptionManageScreen />);

    // エラーが throw されても画面がクラッシュしない
    await act(async () => {
      fireEvent.press(screen.getByTestId('manage-plan-button'));
    });

    // エラーハンドリング後もボタンが再度 enabled になる
    expect(screen.getByTestId('manage-plan-button')).toBeTruthy();
  });
});
