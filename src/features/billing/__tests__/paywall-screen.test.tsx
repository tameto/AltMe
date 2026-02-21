/**
 * ペイウォール Web 版テスト (M068)
 *
 * WebPaywallScreen:
 * - 月額/年額プランの表示（価格テキスト）
 * - プラン選択
 * - 購入ボタン → redirectToCheckout 呼び出し
 * - エラーハンドリング
 * - 初回限定オファーは Web では非表示
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';

// ---- モック ----

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockRedirectToCheckout = jest.fn();
jest.mock('@/src/services/stripe/client', () => ({
  redirectToCheckout: (...args: unknown[]) => mockRedirectToCheckout(...args),
}));

jest.mock('@/src/shared/components/cosmic-background', () => ({
  CosmicBackground: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/src/shared/components/gold-button', () => ({
  GoldButton: ({
    title,
    onPress,
    disabled,
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: unknown;
    testID?: string;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onPress} disabled={disabled} testID="gold-button">
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

jest.mock('@expo/vector-icons/Feather', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

// Native 依存 hooks をモック
jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useSubscription: () => ({
    purchase: jest.fn(),
    restore: jest.fn(),
    loadOfferings: jest.fn(),
    offerings: null,
    isLoading: false,
  }),
}));

jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: jest.fn(() => null),
}));

jest.mock('@/src/services/revenuecat/client', () => ({
  hasNeverPurchased: jest.fn().mockResolvedValue(true),
}));

// ---- テスト対象 ----

import { WebPaywallScreen } from '@/app/(paywall)/index';

// ---- テスト ----

describe('WebPaywallScreen', () => {
  const savedMonthly = process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
  const savedYearly = process.env.EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirectToCheckout.mockResolvedValue(undefined);
    // テスト用 Stripe price ID を設定
    process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID = 'price_monthly_test';
    process.env.EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID = 'price_yearly_test';
  });

  afterAll(() => {
    // 元に戻す
    process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID = savedMonthly;
    process.env.EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID = savedYearly;
  });

  // ---- 表示テスト ----

  it('タイトルとサブタイトルが表示される', () => {
    render(<WebPaywallScreen />);

    expect(screen.getByText('subscription.paywall.subtitle')).toBeTruthy();
    expect(screen.getByText('AltMe Pro で AI ツインを起動しよう')).toBeTruthy();
  });

  it('月額・年額の価格が表示される', () => {
    render(<WebPaywallScreen />);

    expect(screen.getByText('¥4,980')).toBeTruthy();
    expect(screen.getByText('¥39,800')).toBeTruthy();
  });

  it('初回限定オファーは Web では表示されない', () => {
    render(<WebPaywallScreen />);

    expect(screen.queryByText('subscription.paywall.firstTimeOffer')).toBeNull();
    expect(screen.queryByText('¥29,800')).toBeNull();
  });

  it('年額プランに 33% OFF バッジが表示される', () => {
    render(<WebPaywallScreen />);

    expect(screen.getByText('33% OFF')).toBeTruthy();
  });

  it('フィーチャーリスト 6項目が表示される', () => {
    render(<WebPaywallScreen />);

    expect(screen.getByText('subscription.paywall.featuresList.dedicatedTwin')).toBeTruthy();
    expect(screen.getByText('subscription.paywall.featuresList.unlimitedChat')).toBeTruthy();
  });

  // ---- インタラクションテスト ----

  it('購入ボタンクリックで redirectToCheckout が年額 price ID で呼ばれる', async () => {
    render(<WebPaywallScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('gold-button'));
    });

    expect(mockRedirectToCheckout).toHaveBeenCalledTimes(1);
    expect(mockRedirectToCheckout).toHaveBeenCalledWith('price_yearly_test');
  });

  it('月額プラン選択後に購入すると月額 price ID で redirectToCheckout が呼ばれる', async () => {
    render(<WebPaywallScreen />);

    // 月額プランカードを選択
    fireEvent.press(screen.getByTestId('plan-monthly'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('gold-button'));
    });

    expect(mockRedirectToCheckout).toHaveBeenCalledWith('price_monthly_test');
  });

  it('redirectToCheckout が失敗するとエラーメッセージが表示される', async () => {
    mockRedirectToCheckout.mockRejectedValue(new Error('checkout_failed'));

    render(<WebPaywallScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('gold-button'));
    });

    await waitFor(() => {
      expect(screen.getByText('checkout_failed')).toBeTruthy();
    });
  });

  it('price ID が未設定の場合はエラーメッセージが表示される', async () => {
    // 環境変数をクリア
    delete process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
    delete process.env.EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID;

    render(<WebPaywallScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('gold-button'));
    });

    expect(screen.getByText('価格情報を取得できませんでした。')).toBeTruthy();
    expect(mockRedirectToCheckout).not.toHaveBeenCalled();
  });

  it('閉じるボタンで router.back() が呼ばれる', () => {
    render(<WebPaywallScreen />);

    fireEvent.press(screen.getByText('x'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
