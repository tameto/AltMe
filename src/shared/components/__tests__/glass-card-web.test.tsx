/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Mock expo-blur (not used in web)
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

import { GlassCard } from '../glass-card.web';
import { glassmorphism } from '@/src/config/theme';

type JsonNode = {
  type: string;
  props: {
    style?: Record<string, string>;
    className?: string;
    [key: string]: unknown;
  };
  children: (JsonNode | string)[] | null;
};

const getRootNode = (component: React.ReactElement): JsonNode => {
  const tree = render(component).toJSON();
  return (Array.isArray(tree) ? tree[0] : tree) as JsonNode;
};

describe('GlassCard (Web)', () => {
  it('renders children correctly', () => {
    const root = getRootNode(
      <GlassCard>
        <Text>Hello</Text>
      </GlassCard>,
    );

    // Children should contain a text node div with "Hello"
    expect(root.children).not.toBeNull();
    const textNode = root.children?.find(
      (c) => typeof c !== 'string' && c.children?.includes('Hello'),
    );
    expect(textNode).toBeTruthy();
  });

  it('renders as div element on web', () => {
    const root = getRootNode(
      <GlassCard>
        <Text>Content</Text>
      </GlassCard>,
    );

    expect(root.type).toBe('div');
  });

  it('applies backdrop-filter CSS for blur effect', () => {
    const root = getRootNode(
      <GlassCard>
        <Text>Content</Text>
      </GlassCard>,
    );

    expect(root.props.style?.backdropFilter).toBe(`blur(${glassmorphism.card.blur}px)`);
    expect(root.props.style?.WebkitBackdropFilter).toBe(`blur(${glassmorphism.card.blur}px)`);
  });

  it('applies default "card" variant border and background colors', () => {
    const root = getRootNode(
      <GlassCard>
        <Text>Content</Text>
      </GlassCard>,
    );

    // react-native-web converts hex+alpha to rgba and splits borderColor into 4 sides
    const style = root.props.style ?? {};
    expect(style.borderTopColor).toBeDefined();
    expect(style.backgroundColor).toBeDefined();
    // Verify it's the card variant (bg = #FFFFFF12 = rgba(255,255,255,0.07))
    expect(style.backgroundColor).toContain('rgba(255,255,255,');
  });

  it('applies "bubble-ai" variant colors', () => {
    const root = getRootNode(
      <GlassCard variant="bubble-ai">
        <Text>AI Message</Text>
      </GlassCard>,
    );

    const style = root.props.style ?? {};
    // bubble-ai bg = #FFFFFF4D = rgba(255,255,255,0.30)
    expect(style.backgroundColor).toContain('rgba(255,255,255,');
    // Verify it's a different opacity than card variant
    expect(style.backgroundColor).not.toBe('rgba(255,255,255,0.07)');
  });

  it('applies "bubble-user" variant colors', () => {
    const root = getRootNode(
      <GlassCard variant="bubble-user">
        <Text>User Message</Text>
      </GlassCard>,
    );

    const style = root.props.style ?? {};
    // bubble-user bg = #7DD3FC4D => contains "125,211,252" (RGB of #7DD3FC)
    expect(style.backgroundColor).toContain('125,211,252');
  });

  it('applies "input" variant colors', () => {
    const root = getRootNode(
      <GlassCard variant="input">
        <Text>Input</Text>
      </GlassCard>,
    );

    const style = root.props.style ?? {};
    // input bg = #FFFFFF0D = rgba(255,255,255,0.05)
    expect(style.backgroundColor).toContain('rgba(255,255,255,');
  });

  it('applies custom style prop', () => {
    const root = getRootNode(
      <GlassCard style={{ marginTop: 20, padding: 10 }}>
        <Text>Content</Text>
      </GlassCard>,
    );

    const style = root.props.style ?? {};
    // react-native-web adds "px" suffix to numeric styles
    expect(style.marginTop).toBe('20px');
    // react-native-web expands padding into individual sides
    expect(style.paddingTop).toBe('10px');
  });

  it('does not render BlurView component on web', () => {
    const root = getRootNode(
      <GlassCard>
        <Text>Content</Text>
      </GlassCard>,
    );

    const jsonStr = JSON.stringify(root);
    expect(jsonStr).not.toContain('BlurView');
    expect(jsonStr).not.toContain('"intensity"');
  });

  it('has CSS classes for overflow, borderRadius, and borderWidth', () => {
    const root = getRootNode(
      <GlassCard>
        <Text>Content</Text>
      </GlassCard>,
    );

    // react-native-web moves overflow/borderRadius/borderWidth into CSS classes
    const className = root.props.className ?? '';
    expect(className).toContain('r-overflow-');
    expect(className).toContain('r-borderRadius-');
    expect(className).toContain('r-borderWidth-');
  });

  it('renders all four variants without errors', () => {
    const variants = ['card', 'bubble-ai', 'bubble-user', 'input'] as const;

    for (const variant of variants) {
      expect(() =>
        render(
          <GlassCard variant={variant}>
            <Text>{variant}</Text>
          </GlassCard>,
        ),
      ).not.toThrow();
    }
  });

  it('each variant has a distinct backgroundColor', () => {
    const variants = ['card', 'bubble-ai', 'bubble-user', 'input'] as const;
    const bgColors = new Set<string>();

    for (const variant of variants) {
      const root = getRootNode(
        <GlassCard variant={variant}>
          <Text>{variant}</Text>
        </GlassCard>,
      );
      bgColors.add(root.props.style?.backgroundColor ?? '');
    }

    // All 4 variants should have distinct background colors
    expect(bgColors.size).toBe(4);
  });
});
