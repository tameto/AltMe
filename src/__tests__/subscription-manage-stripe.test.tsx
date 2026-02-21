/**
 * M071: subscription-manage Web 対応テスト
 * Platform.OS === 'web' 時に Stripe Portal リダイレクトが呼ばれることを検証
 */

// Mock dependencies before imports
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'subscription.manage.title': 'サブスクリプション管理',
        'subscription.manage.currentPlan': '現在のプラン',
        'subscription.manage.proPlan': 'Pro プラン',
        'subscription.manage.planMonthly': '月額プラン',
        'subscription.manage.statusActive': 'アクティブ',
        'subscription.manage.statusFree': 'Free',
        'subscription.manage.manageOnStripe': 'Stripeで管理',
        'subscription.manage.changePlan': 'プラン変更',
        'subscription.manage.paymentMethod': 'お支払い方法',
        'subscription.manage.cancelSubscription': '解約',
        'subscription.manage.upgradeButton': 'Pro にアップグレード',
        'subscription.manage.statsTitle': 'あなたの記録',
        'subscription.manage.statChat': 'チャット',
        'subscription.manage.statJournal': '日記',
        'subscription.manage.statMood': '気分記録',
        'subscription.manage.statDays': '日間',
        'subscription.manage.noStripeCustomer': 'Stripe の顧客情報が見つかりません。',
        'subscription.manage.portalError': '管理ページの読み込みに失敗しました。',
        'subscription.manage.cancelConfirmTitle': '本当に解約しますか？',
        'subscription.manage.renewsOn': '次回更新日',
      };
      return translations[key] ?? key;
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: unknown }) =>
      require('react').createElement(RN.View, null, children),
  };
});

jest.mock('@expo/vector-icons/Feather', () => 'Feather');

jest.mock('@/src/shared/components/cosmic-background', () => {
  const RN = require('react-native');
  return {
    CosmicBackground: ({ children }: { children: unknown }) =>
      require('react').createElement(RN.View, null, children),
  };
});

const mockRedirectToPortal = jest.fn();
jest.mock('@/src/services/stripe/client', () => ({
  redirectToPortal: (...args: unknown[]) => mockRedirectToPortal(...args),
}));

jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useSubscription: () => ({
    entitlement: {
      isPro: true,
      isTrialing: false,
      status: 'active',
      planType: 'monthly',
      expiresAt: '2026-03-21T00:00:00Z',
      trialDaysRemaining: null,
    },
  }),
}));

jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: (selector: (s: { user: unknown }) => unknown) =>
    selector({
      user: {
        id: 'test-user-id',
        displayName: 'テスト',
        twinName: 'AltMe',
        createdAt: '2026-01-01T00:00:00Z',
      },
    }),
}));

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ count: 10, data: null, error: null }),
      }),
    }),
  },
}));

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform, Alert } from 'react-native';

// Set Platform.OS to 'web' for these tests
Object.defineProperty(Platform, 'OS', { get: () => 'web', configurable: true });

import SubscriptionManageScreen from '@/app/subscription-manage';

describe('SubscriptionManageScreen Web', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirectToPortal.mockResolvedValue(undefined);
  });

  test('renders manage plan button with testID', () => {
    const { getByTestId } = render(<SubscriptionManageScreen />);
    const button = getByTestId('manage-plan-button');
    expect(button).toBeTruthy();
  });

  test('calls redirectToPortal when manage plan button is pressed', async () => {
    const { getByTestId } = render(<SubscriptionManageScreen />);
    const button = getByTestId('manage-plan-button');

    await act(async () => {
      fireEvent.press(button);
    });

    await waitFor(() => {
      expect(mockRedirectToPortal).toHaveBeenCalledTimes(1);
    });
  });

  test('shows error alert when redirectToPortal fails with customer_not_found', async () => {
    mockRedirectToPortal.mockRejectedValue(new Error('customer_not_found'));
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByTestId } = render(<SubscriptionManageScreen />);
    const button = getByTestId('manage-plan-button');

    await act(async () => {
      fireEvent.press(button);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'サブスクリプション管理',
        'Stripe の顧客情報が見つかりません。',
      );
    });
  });

  test('shows generic error alert when redirectToPortal fails', async () => {
    mockRedirectToPortal.mockRejectedValue(new Error('portal_session_failed'));
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByTestId } = render(<SubscriptionManageScreen />);
    const button = getByTestId('manage-plan-button');

    await act(async () => {
      fireEvent.press(button);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'サブスクリプション管理',
        '管理ページの読み込みに失敗しました。',
      );
    });
  });
});
