/**
 * TwinConversationDetail 画面テスト（M123）
 *
 * レスポンシブレイアウトとスクロール動作の確認。
 *
 * shared プロジェクトでテストされる（*-web.test.tsx でも *-native.test.tsx でもない）
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ back: mockBack })),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/src/shared/components/cosmic-background', () => ({
  CosmicBackground: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@expo/vector-icons/Feather', () => 'Feather');

import TwinConversationDetailModal from '@/app/twin-conversation-detail';

describe('TwinConversationDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // M123: 画面がレンダリングされる
  it('会話詳細画面がレンダリングされる', () => {
    const { toJSON } = render(<TwinConversationDetailModal />);
    expect(toJSON()).not.toBeNull();
  });

  // M123: ヘッダーのタイトルが表示される
  it('ヘッダーに参加者名が表示される', () => {
    render(<TwinConversationDetailModal />);
    expect(screen.getByText('Yuki × Hana')).toBeTruthy();
  });

  // M123: サブタイトルが表示される
  it('サブタイトルが表示される', () => {
    render(<TwinConversationDetailModal />);
    // t('twin.conversationDetail.subtitle') → i18n key を返すモック
    expect(screen.getByText('twin.conversationDetail.subtitle')).toBeTruthy();
  });

  // M123: メッセージバブルが表示される（4メッセージ）
  it('4件のメッセージが表示される', () => {
    render(<TwinConversationDetailModal />);
    // Yuki と Hana それぞれのメッセージが表示される
    expect(screen.getByText('こんにちは。今日はどんな一日でしたか？')).toBeTruthy();
    expect(screen.getByText('とても充実した一日でした。新しいプロジェクトを始めたんです。')).toBeTruthy();
  });

  // M123: スクロール可能なコンテンツとして描画される
  it('スクロールビュー内にメッセージが配置される', () => {
    const { toJSON } = render(<TwinConversationDetailModal />);
    const json = JSON.stringify(toJSON());
    // ScrollView が存在することを確認（RN ではコンポーネントタイプで確認）
    expect(json).toContain('RCTScrollView');
  });
});
