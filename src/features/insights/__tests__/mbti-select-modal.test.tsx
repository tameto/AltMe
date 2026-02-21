/**
 * MBTI 選択モーダルテスト（M122）
 *
 * モーダル表示の確認:
 * - タイトル/サブタイトル表示
 * - 閉じるボタンクリックで router.back() が呼ばれる
 * - レンダリング確認
 *
 * shared プロジェクト（iOS preset / node env）で実行される。
 * document.addEventListener は mbti-select.tsx で Platform.OS === 'web' 時のみ
 * 呼ばれるが、shared テストでは Platform.OS = 'ios' のためスキップされる。
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ back: mockBack, push: jest.fn() })),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import MbtiSelectModal from '@/app/mbti-select';

describe('MbtiSelectModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // M122: モーダルがレンダリングされる
  it('モーダルがレンダリングされる（toJSON が non-null）', () => {
    const { toJSON } = render(<MbtiSelectModal />);
    expect(toJSON()).not.toBeNull();
  });

  // M122: タイトルが表示される
  it('タイトルが表示される', () => {
    render(<MbtiSelectModal />);
    expect(screen.getByText('settings.mbti.title')).toBeTruthy();
  });

  // M122: サブタイトルが表示される
  it('サブタイトルが表示される', () => {
    const { toJSON } = render(<MbtiSelectModal />);
    const json = JSON.stringify(toJSON());
    expect(json).toContain('settings.mbti.subtitle');
  });

  // M122: 閉じるボタンで router.back() が呼ばれる
  it('閉じるボタンクリックで router.back() が呼ばれる', () => {
    render(<MbtiSelectModal />);
    fireEvent.press(screen.getByTestId('mbti-close-button'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // M122: close テキストが表示される
  it('閉じるテキスト（common.close）が表示される', () => {
    render(<MbtiSelectModal />);
    expect(screen.getByText('common.close')).toBeTruthy();
  });

  // M122: Native では document.addEventListener は呼ばれない
  it('Native（iOS/shared）ではドキュメントイベント登録なし', () => {
    // shared プロジェクトでは Platform.OS = 'ios' → useEffect 内の isWeb=false でスキップ
    // document は undefined (node env) のため addEventListener は呼ばれない
    expect(() => render(<MbtiSelectModal />)).not.toThrow();
  });

  // M122: レンダリングされるコンテンツの確認
  it('モーダルに title と subtitle コンテンツが含まれる', () => {
    const { toJSON } = render(<MbtiSelectModal />);
    const json = JSON.stringify(toJSON());
    expect(json).toContain('settings.mbti.title');
    expect(json).toContain('settings.mbti.subtitle');
    expect(json).toContain('common.close');
  });
});
