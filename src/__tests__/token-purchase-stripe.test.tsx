/**
 * M072: token-purchase Web 対応テスト
 * Platform.OS === 'web' 時に Stripe Checkout リダイレクトが呼ばれることを検証
 */

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
        'common.close': '閉じる',
        'tokenPurchase.title': 'トークン購入',
        'tokenPurchase.subtitle': 'トークンの購入と管理',
        'tokenPurchase.credits': 'クレジット',
        'tokenPurchase.purchaseError': '購入処理中にエラーが発生しました。',
        'tokenPurchase.nativeComingSoon': 'アプリ内購入は近日公開予定です。',
        'tokenPurchase.stripeDisclaimer': '決済はStripeにより安全に処理されます。',
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

const mockRedirectToCheckout = jest.fn();
jest.mock('@/src/services/stripe/client', () => ({
  redirectToCheckout: (...args: unknown[]) => mockRedirectToCheckout(...args),
}));

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform, Alert } from 'react-native';

// Set Platform.OS to 'web' for these tests
Object.defineProperty(Platform, 'OS', { get: () => 'web', configurable: true });

import TokenPurchaseModal from '@/app/token-purchase';

describe('TokenPurchaseModal Web', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirectToCheckout.mockResolvedValue(undefined);
  });

  test('renders three credit pack options', () => {
    const { getByTestId } = render(<TokenPurchaseModal />);
    expect(getByTestId('pack-small')).toBeTruthy();
    expect(getByTestId('pack-medium')).toBeTruthy();
    expect(getByTestId('pack-large')).toBeTruthy();
  });

  test('calls redirectToCheckout when a pack is pressed on web', async () => {
    const { getByTestId } = render(<TokenPurchaseModal />);
    const smallPack = getByTestId('pack-small');

    await act(async () => {
      fireEvent.press(smallPack);
    });

    await waitFor(() => {
      expect(mockRedirectToCheckout).toHaveBeenCalledWith('credit_small');
    });
  });

  test('shows error alert when redirectToCheckout fails', async () => {
    mockRedirectToCheckout.mockRejectedValue(new Error('checkout_session_failed'));
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByTestId } = render(<TokenPurchaseModal />);
    const largePack = getByTestId('pack-large');

    await act(async () => {
      fireEvent.press(largePack);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'トークン購入',
        '購入処理中にエラーが発生しました。',
      );
    });
  });

  test('displays Stripe disclaimer text on web', () => {
    const { getByText } = render(<TokenPurchaseModal />);
    expect(getByText('決済はStripeにより安全に処理されます。')).toBeTruthy();
  });
});
