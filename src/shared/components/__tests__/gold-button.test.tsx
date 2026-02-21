import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GoldButton } from '../gold-button';

describe('GoldButton', () => {
  it('renders title text', () => {
    const { getByText } = render(
      <GoldButton title="Subscribe" onPress={jest.fn()} />,
    );
    expect(getByText('Subscribe')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <GoldButton title="Tap Me" onPress={onPress} testID="gold-btn" />,
    );
    fireEvent.press(getByText('Tap Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GoldButton title="Disabled" onPress={onPress} disabled testID="gold-btn" />,
    );
    fireEvent.press(getByTestId('gold-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { queryByText, toJSON } = render(
      <GoldButton title="Loading" onPress={jest.fn()} loading testID="gold-btn" />,
    );
    // Title should not be visible while loading
    expect(queryByText('Loading')).toBeNull();
    // ActivityIndicator should be rendered
    const tree = toJSON();
    const json = JSON.stringify(tree);
    expect(json).toContain('ActivityIndicator');
  });
});
