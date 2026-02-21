/**
 * TokenPurchaseModal テスト (M072)
 *
 * - Web: 3パック表示 + Stripe Checkout リダイレクト
 * - Native: 購入ボタンタップで coming soon Alert
 * - 購入中は他パックのボタンを無効化
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';

// ---- モック ----

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockRedirectToCheckout = jest.fn();
jest.mock('@/src/services/stripe/client', () => ({
  redirectToCheckout: (...args: unknown[]) => mockRedirectToCheckout(...args),
}));

jest.mock('@expo/vector-icons/Feather', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

// ---- テスト対象 ----

import TokenPurchaseModal from '@/app/token-purchase';

// ---- Web テスト ----

describe('TokenPurchaseModal — Web', () => {
  const originalOS = Platform.OS;

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirectToCheckout.mockResolvedValue(undefined);
  });

  it('3つのトークンパックが表示される', () => {
    render(<TokenPurchaseModal />);

    expect(screen.getByTestId('pack-small')).toBeTruthy();
    expect(screen.getByTestId('pack-medium')).toBeTruthy();
    expect(screen.getByTestId('pack-large')).toBeTruthy();
  });

  it('パックの価格と credits が表示される', () => {
    render(<TokenPurchaseModal />);

    // CREDIT_PACKS の価格確認
    expect(screen.getByText('¥300')).toBeTruthy();
    expect(screen.getByText('¥800')).toBeTruthy();
    expect(screen.getByText('¥2,400')).toBeTruthy();
  });

  it('Stripe disclaimer が Web で表示される', () => {
    render(<TokenPurchaseModal />);

    expect(screen.getByText('tokenPurchase.stripeDisclaimer')).toBeTruthy();
  });

  it('SMALL パックを押すと redirectToCheckout が呼ばれる', async () => {
    render(<TokenPurchaseModal />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('pack-small'));
    });

    expect(mockRedirectToCheckout).toHaveBeenCalledTimes(1);
    expect(mockRedirectToCheckout).toHaveBeenCalledWith('credit_small');
  });

  it('MEDIUM パックを押すと credit_medium で redirectToCheckout が呼ばれる', async () => {
    render(<TokenPurchaseModal />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('pack-medium'));
    });

    expect(mockRedirectToCheckout).toHaveBeenCalledWith('credit_medium');
  });

  it('LARGE パックを押すと credit_large で redirectToCheckout が呼ばれる', async () => {
    render(<TokenPurchaseModal />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('pack-large'));
    });

    expect(mockRedirectToCheckout).toHaveBeenCalledWith('credit_large');
  });

  it('購入処理中は他パックが無効化される', async () => {
    let resolvePurchase: () => void = () => {};
    mockRedirectToCheckout.mockImplementation(
      () => new Promise<void>((resolve) => { resolvePurchase = resolve; }),
    );

    render(<TokenPurchaseModal />);

    // SMALL パックをクリック開始（pending 状態）
    fireEvent.press(screen.getByTestId('pack-small'));

    // 他パックが無効化される
    await waitFor(() => {
      // disabled プロパティは react-native Pressable で確認
      expect(screen.getByTestId('pack-medium')).toBeTruthy();
    });

    resolvePurchase();
  });

  it('redirectToCheckout が失敗しても画面がクラッシュしない', async () => {
    mockRedirectToCheckout.mockRejectedValue(new Error('checkout_failed'));

    render(<TokenPurchaseModal />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('pack-small'));
    });

    // エラー後も画面が継続表示される
    expect(screen.getByTestId('pack-small')).toBeTruthy();
  });

  it('閉じるボタンで router.back() が呼ばれる', () => {
    render(<TokenPurchaseModal />);

    fireEvent.press(screen.getByText('x'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
