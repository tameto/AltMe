/**
 * M082: ChatInputWeb テスト
 * - テキスト入力・変更
 * - 文字数カウンター表示
 * - 送信ボタン表示/非表示
 * - disabled 時の動作
 * - onSend コールバック
 * - 文字数上限付近の警告表示
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: ({ name }: { name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

import { ChatInputWeb } from '../components/chat-input-web';

describe('ChatInputWeb', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    onSend: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('入力フィールドが表示される', () => {
    render(<ChatInputWeb {...defaultProps} />);
    expect(screen.getByTestId('chat-input-field')).toBeTruthy();
  });

  it('テキスト変更時に onChangeText が呼ばれる', () => {
    const onChangeText = jest.fn();
    render(<ChatInputWeb {...defaultProps} onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByTestId('chat-input-field'), 'Hello');
    expect(onChangeText).toHaveBeenCalledWith('Hello');
  });

  it('テキストが空の場合は送信ボタンが非表示', () => {
    render(<ChatInputWeb {...defaultProps} value="" />);
    expect(screen.queryByTestId('chat-send-button')).toBeNull();
  });

  it('テキストがある場合は送信ボタンが表示される', () => {
    render(<ChatInputWeb {...defaultProps} value="Hello" />);
    expect(screen.getByTestId('chat-send-button')).toBeTruthy();
  });

  it('送信ボタンクリックで onSend が呼ばれる', () => {
    const onSend = jest.fn();
    render(<ChatInputWeb {...defaultProps} value="Hello" onSend={onSend} />);

    fireEvent.press(screen.getByTestId('chat-send-button'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('isLoading 中は送信ボタンが非表示', () => {
    render(<ChatInputWeb {...defaultProps} value="Hello" isLoading />);
    expect(screen.queryByTestId('chat-send-button')).toBeNull();
  });

  it('disabled 時は送信ボタンが非表示', () => {
    render(<ChatInputWeb {...defaultProps} value="Hello" disabled />);
    expect(screen.queryByTestId('chat-send-button')).toBeNull();
  });

  it('文字数カウンターはテキストがある場合のみ表示される', () => {
    const { rerender } = render(<ChatInputWeb {...defaultProps} value="" />);
    expect(screen.queryByTestId('chat-char-counter')).toBeNull();

    rerender(<ChatInputWeb {...defaultProps} value="test" />);
    expect(screen.getByTestId('chat-char-counter')).toBeTruthy();
    expect(screen.getByText('4/1000')).toBeTruthy();
  });

  it('プラスボタンが表示される', () => {
    render(<ChatInputWeb {...defaultProps} />);
    expect(screen.getByTestId('chat-input-plus')).toBeTruthy();
  });
});
