/**
 * M107: Onboarding _layout.tsx Web compatibility tests
 *
 * Verifies that the onboarding layout renders safely on Web:
 * - Stack navigation renders without crashing
 * - All 6 onboarding screens are registered
 * - headerShown: false and animation options don't cause Web errors
 */
import '../../../__smoke-tests__/smoke-setup';

import React from 'react';
import { render } from '@testing-library/react-native';

import OnboardingLayout from '@/app/(onboarding)/_layout';

// Access the mocked Stack from smoke-setup
// eslint-disable-next-line @typescript-eslint/no-require-imports
const expoRouter = require('expo-router');

describe('M107: Onboarding _layout.tsx Web compatibility', () => {
  it('renders without crashing on Web', () => {
    expect(() => {
      const { unmount } = render(<OnboardingLayout />);
      unmount();
    }).not.toThrow();
  });

  it('registers all 6 onboarding screens', () => {
    // Track Stack.Screen calls by spying on the mocked Screen component
    const screenCalls: Array<{ name: string }> = [];
    const OriginalScreen = expoRouter.Stack.Screen;
    expoRouter.Stack.Screen = (props: { name: string }) => {
      screenCalls.push({ name: props.name });
      return null;
    };

    render(<OnboardingLayout />);

    // Restore
    expoRouter.Stack.Screen = OriginalScreen;

    const screenNames = screenCalls.map((s) => s.name);
    expect(screenNames).toContain('welcome');
    expect(screenNames).toContain('personality-quiz');
    expect(screenNames).toContain('result');
    expect(screenNames).toContain('choose-avatar');
    expect(screenNames).toContain('choose-tone');
    expect(screenNames).toContain('meet-twin');
    expect(screenNames).toHaveLength(6);
  });

  it('Stack uses headerShown: false (no native header on Web)', () => {
    // Spy on Stack to capture screenOptions
    let capturedOptions: Record<string, unknown> | undefined;
    const OriginalStack = expoRouter.Stack;
    expoRouter.Stack = Object.assign(
      (props: { screenOptions?: Record<string, unknown>; children?: React.ReactNode }) => {
        capturedOptions = props.screenOptions;
        return props.children ?? null;
      },
      { Screen: () => null },
    );

    render(<OnboardingLayout />);

    // Restore
    Object.assign(expoRouter, { Stack: OriginalStack });

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions?.headerShown).toBe(false);
  });
});
