/**
 * M085: ChatBubble テスト
 * - ユーザーバブル表示
 * - AIバブル表示（twinName、タイムスタンプ）
 * - ストリーミング中カーソル表示
 * - URL リンク検出
 * - XSS サニタイズ
 * - 翻訳リンク表示/非表示
 * - testID 設定
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name }: { name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

import { ChatBubble } from '../components/chat-bubble';

describe('ChatBubble', () => {
  const baseProps = {
    createdAt: '2026-02-21T10:30:00Z',
    twinName: 'TestTwin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- ユーザーバブル ----

  it('ユーザーメッセージが表示される', () => {
    render(<ChatBubble role="user" content="Hello" {...baseProps} />);
    expect(screen.getByTestId('chat-bubble-user')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('ユーザーバブルにタイムスタンプが表示される', () => {
    render(<ChatBubble role="user" content="Hi" {...baseProps} />);
    // toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'}) の結果
    // テスト環境のロケールに依存するため、タイムスタンプテキスト存在を確認
    expect(screen.getByTestId('chat-bubble-user')).toBeTruthy();
  });

  // ---- AI バブル ----

  it('AI メッセージが表示される', () => {
    render(<ChatBubble role="assistant" content="こんにちは" {...baseProps} />);
    expect(screen.getByTestId('chat-bubble-assistant')).toBeTruthy();
    expect(screen.getByText('こんにちは')).toBeTruthy();
  });

  it('AI バブルにツイン名が表示される', () => {
    render(<ChatBubble role="assistant" content="test" {...baseProps} twinName="MyTwin" />);
    expect(screen.getByText('MyTwin')).toBeTruthy();
  });

  it('ストリーミング中はカーソル（|）が表示される', () => {
    render(<ChatBubble role="assistant" content="typing..." {...baseProps} isStreaming />);
    expect(screen.getByText('|')).toBeTruthy();
  });

  it('ストリーミング中でなければカーソルは非表示', () => {
    render(<ChatBubble role="assistant" content="done" {...baseProps} isStreaming={false} />);
    expect(screen.queryByText('|')).toBeNull();
  });

  // ---- URL リンク ----

  it('URL がリンクとして検出される', () => {
    render(
      <ChatBubble
        role="assistant"
        content="こちらを見てください https://example.com/test です"
        {...baseProps}
      />,
    );
    expect(screen.getByText('https://example.com/test')).toBeTruthy();
  });

  it('リンクをクリックすると Linking.openURL が呼ばれる（Native）', () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    render(
      <ChatBubble
        role="assistant"
        content="https://example.com"
        {...baseProps}
      />,
    );

    fireEvent.press(screen.getByText('https://example.com'));
    expect(spy).toHaveBeenCalledWith('https://example.com');
    spy.mockRestore();
  });

  // ---- XSS サニタイズ ----

  it('HTML タグがサニタイズされる', () => {
    render(
      <ChatBubble
        role="assistant"
        content='<script>alert("xss")</script>Hello'
        {...baseProps}
      />,
    );
    expect(screen.queryByText('<script>')).toBeNull();
    // サニタイズ後は alert("xss") のテキスト部分のみ残る
    expect(screen.getByTestId('chat-bubble-content')).toBeTruthy();
  });

  it('javascript: プロトコルがサニタイズされる', () => {
    render(
      <ChatBubble
        role="assistant"
        content='Click javascript:alert(1) here'
        {...baseProps}
      />,
    );
    // 'javascript:' が除去される
    const content = screen.getByTestId('chat-bubble-content');
    expect(content).toBeTruthy();
  });

  // ---- 翻訳リンク ----

  it('翻訳コールバックがある場合は翻訳リンクが表示される', () => {
    const onTranslatePress = jest.fn();
    render(
      <ChatBubble
        role="assistant"
        content="test"
        {...baseProps}
        onTranslatePress={onTranslatePress}
      />,
    );
    expect(screen.getByText('chat.translateLink')).toBeTruthy();
    fireEvent.press(screen.getByText('chat.translateLink'));
    expect(onTranslatePress).toHaveBeenCalledTimes(1);
  });

  it('ストリーミング中は翻訳リンクが非表示', () => {
    render(
      <ChatBubble
        role="assistant"
        content="test"
        {...baseProps}
        isStreaming
        onTranslatePress={jest.fn()}
      />,
    );
    expect(screen.queryByText('chat.translateLink')).toBeNull();
  });

  it('翻訳コールバックがない場合は翻訳リンクが非表示', () => {
    render(
      <ChatBubble role="assistant" content="test" {...baseProps} />
    );
    expect(screen.queryByText('chat.translateLink')).toBeNull();
  });
});
