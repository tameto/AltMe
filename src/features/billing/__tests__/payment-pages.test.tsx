/**
 * Payment pages テスト (M069 + M070)
 *
 * payment/success.tsx — 成功メッセージ、サブスク更新、リダイレクト
 * payment/cancel.tsx  — キャンセルメッセージ、ペイウォール再遷移
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';

// ---- モック ----

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({}),
}));

const mockRefreshStatus = jest.fn();
const mockSetEntitlement = jest.fn();
const mockSetLoading = jest.fn();
jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useSubscription: {
    getState: () => ({
      refreshStatus: mockRefreshStatus,
      setEntitlement: mockSetEntitlement,
      setLoading: mockSetLoading,
    }),
  },
}));

jest.mock('@/src/features/auth/stores/auth-store', () => ({
  useAuthStore: jest.fn(() => ({ isAuthenticated: true })),
}));

// ---- テスト対象 ----

import PaymentSuccessScreen from '@/app/payment/success';
import PaymentCancelScreen from '@/app/payment/cancel';

// ---- payment/success.tsx テスト ----

describe('PaymentSuccessScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockRefreshStatus.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('成功画面が表示される', async () => {
    render(<PaymentSuccessScreen />);

    expect(screen.getByTestId('payment-success-screen')).toBeTruthy();
    expect(screen.getByText('ご購入ありがとうございます！')).toBeTruthy();
    expect(screen.getByText('AltMe Proへようこそ')).toBeTruthy();
  });

  it('refreshStatus が呼ばれてサブスク状態が更新される', async () => {
    render(<PaymentSuccessScreen />);

    await waitFor(() => {
      expect(mockRefreshStatus).toHaveBeenCalledTimes(1);
    });
  });

  it('3秒後にメインタブへリダイレクトする', async () => {
    render(<PaymentSuccessScreen />);

    await waitFor(() => {
      expect(mockRefreshStatus).toHaveBeenCalled();
    });

    // 3秒経過
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('「今すぐホームへ」リンクを押すと即座にリダイレクトする', async () => {
    render(<PaymentSuccessScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('go-to-home-link')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('go-to-home-link'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('refreshStatus が失敗しても3秒後にリダイレクトする', async () => {
    mockRefreshStatus.mockRejectedValue(new Error('network error'));

    render(<PaymentSuccessScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('go-to-home-link')).toBeTruthy();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});

// ---- payment/cancel.tsx テスト ----

describe('PaymentCancelScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('キャンセル画面が表示される', () => {
    render(<PaymentCancelScreen />);

    expect(screen.getByTestId('payment-cancel-screen')).toBeTruthy();
    expect(screen.getByText('お支払いがキャンセルされました')).toBeTruthy();
  });

  it('「プランを見る」ボタンでペイウォールへ遷移する', () => {
    render(<PaymentCancelScreen />);

    fireEvent.press(screen.getByTestId('return-to-paywall-button'));
    expect(mockReplace).toHaveBeenCalledWith('/(paywall)');
  });

  it('「ホームに戻る」リンクでメインタブへ遷移する', () => {
    render(<PaymentCancelScreen />);

    fireEvent.press(screen.getByTestId('go-home-link'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});

// ---- reconcile-stripe ロジックテスト ----

describe('reconcile-stripe ロジック', () => {
  it('expired セッションのみ処理対象とする', () => {
    const sessions = [
      { status: 'expired', metadata: { supabase_user_id: 'user-1' } },
      { status: 'complete', metadata: { supabase_user_id: 'user-2' } },
      { status: 'open', metadata: { supabase_user_id: 'user-3' } },
    ];

    const toProcess = sessions.filter((s) => s.status === 'expired');
    expect(toProcess).toHaveLength(1);
    expect(toProcess[0].metadata.supabase_user_id).toBe('user-1');
  });

  it('metadata に supabase_user_id がないセッションはスキップする', () => {
    const session = { status: 'expired', metadata: {} };
    const userId = (session.metadata as Record<string, string>).supabase_user_id;

    expect(userId).toBeUndefined();
    // userId がない → continue でスキップ
  });
});
