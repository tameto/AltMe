import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Mock expo-blur
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return {
    BlurView: (props: Record<string, unknown>) => <View testID="blur-view" {...props} />,
  };
});

import { GlassCard } from '../glass-card.native';
import { glassmorphism } from '@/src/config/theme';

describe('GlassCard (Native)', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Hello</Text>
      </GlassCard>,
    );

    expect(getByText('Hello')).toBeTruthy();
  });

  it('renders BlurView for blur effect', () => {
    const { getByTestId } = render(
      <GlassCard testID="glass-card">
        <Text>Content</Text>
      </GlassCard>,
    );

    const blurView = getByTestId('blur-view');
    expect(blurView).toBeTruthy();
    expect(blurView.props.intensity).toBe(glassmorphism.card.blur);
    expect(blurView.props.tint).toBe('dark');
  });

  it('renders with default "card" variant', () => {
    const { getByTestId } = render(
      <GlassCard testID="glass-card">
        <Text>Content</Text>
      </GlassCard>,
    );

    const card = getByTestId('glass-card');
    const flatStyle = Array.isArray(card.props.style)
      ? Object.assign({}, ...card.props.style.filter(Boolean))
      : card.props.style;

    expect(flatStyle.borderColor).toBe(glassmorphism.card.border);
  });

  it('renders with "bubble-ai" variant styles', () => {
    const { getByTestId } = render(
      <GlassCard testID="glass-card" variant="bubble-ai">
        <Text>AI</Text>
      </GlassCard>,
    );

    const card = getByTestId('glass-card');
    const flatStyle = Array.isArray(card.props.style)
      ? Object.assign({}, ...card.props.style.filter(Boolean))
      : card.props.style;

    expect(flatStyle.borderColor).toBe(glassmorphism.bubble.ai.border);
  });

  it('renders with "bubble-user" variant styles', () => {
    const { getByTestId } = render(
      <GlassCard testID="glass-card" variant="bubble-user">
        <Text>User</Text>
      </GlassCard>,
    );

    const card = getByTestId('glass-card');
    const flatStyle = Array.isArray(card.props.style)
      ? Object.assign({}, ...card.props.style.filter(Boolean))
      : card.props.style;

    expect(flatStyle.borderColor).toBe(glassmorphism.bubble.user.border);
  });

  it('renders with "input" variant styles', () => {
    const { getByTestId } = render(
      <GlassCard testID="glass-card" variant="input">
        <Text>Input</Text>
      </GlassCard>,
    );

    const card = getByTestId('glass-card');
    const flatStyle = Array.isArray(card.props.style)
      ? Object.assign({}, ...card.props.style.filter(Boolean))
      : card.props.style;

    expect(flatStyle.borderColor).toBe(glassmorphism.input.border);
  });

  it('applies custom style prop', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(
      <GlassCard testID="glass-card" style={customStyle}>
        <Text>Content</Text>
      </GlassCard>,
    );

    const card = getByTestId('glass-card');
    const flatStyle = Array.isArray(card.props.style)
      ? Object.assign({}, ...card.props.style.filter(Boolean))
      : card.props.style;

    expect(flatStyle.marginTop).toBe(20);
  });

  it('has overflow hidden and borderRadius on outer container', () => {
    const { getByTestId } = render(
      <GlassCard testID="glass-card">
        <Text>Content</Text>
      </GlassCard>,
    );

    const card = getByTestId('glass-card');
    const flatStyle = Array.isArray(card.props.style)
      ? Object.assign({}, ...card.props.style.filter(Boolean))
      : card.props.style;

    expect(flatStyle.overflow).toBe('hidden');
    expect(flatStyle.borderRadius).toBe(16);
    expect(flatStyle.borderWidth).toBe(1);
  });
});
