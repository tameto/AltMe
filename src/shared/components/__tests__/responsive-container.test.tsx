import React from 'react';
import { Text, Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { ResponsiveContainer } from '../responsive-container';

jest.mock('@/src/shared/hooks/use-responsive', () => ({
  useResponsive: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useResponsive } = require('@/src/shared/hooks/use-responsive');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flattenStyle = (node: any) => {
  const style = node?.props?.style;
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean));
  }
  return style ?? {};
};

describe('ResponsiveContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children at full width on mobile', () => {
    useResponsive.mockReturnValue({ isMobile: true, isDesktop: false, isWide: false });

    const { getByText, toJSON } = render(
      <ResponsiveContainer>
        <Text>Hello</Text>
      </ResponsiveContainer>,
    );

    expect(getByText('Hello')).toBeTruthy();
    // Inner container should not have maxWidth
    const tree = toJSON();
    const innerView = tree?.children?.[0];
    const innerStyle = flattenStyle(innerView);
    expect(innerStyle.maxWidth).toBeUndefined();
  });

  it('applies maxWidth 960 on desktop', () => {
    useResponsive.mockReturnValue({ isMobile: false, isDesktop: true, isWide: false });

    const { toJSON } = render(
      <ResponsiveContainer>
        <Text>Content</Text>
      </ResponsiveContainer>,
    );

    const tree = toJSON();
    const innerView = tree?.children?.[0];
    const innerStyle = flattenStyle(innerView);
    expect(innerStyle.maxWidth).toBe(960);
  });

  it('applies maxWidth 1200 on wide', () => {
    useResponsive.mockReturnValue({ isMobile: false, isDesktop: false, isWide: true });

    const { toJSON } = render(
      <ResponsiveContainer>
        <Text>Content</Text>
      </ResponsiveContainer>,
    );

    const tree = toJSON();
    const innerView = tree?.children?.[0];
    const innerStyle = flattenStyle(innerView);
    expect(innerStyle.maxWidth).toBe(1200);
  });

  it('uses SafeAreaView wrapper on native', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true, configurable: true });
    useResponsive.mockReturnValue({ isMobile: true, isDesktop: false, isWide: false });

    const { toJSON } = render(
      <ResponsiveContainer>
        <Text>Native</Text>
      </ResponsiveContainer>,
    );

    const tree = toJSON();
    // SafeAreaView renders as RNCSafeAreaView on native
    expect(tree?.type).toBe('RNCSafeAreaView');

    // Reset
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true, configurable: true });
  });
});
