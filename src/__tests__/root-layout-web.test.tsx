/**
 * M057: Root _layout.tsx Web compatibility tests
 *
 * Verifies that the root layout renders safely on Web:
 * - SplashScreen calls don't throw
 * - StatusBar is not rendered on Web
 * - Notification stubs (client.web.ts) are no-ops
 * - Analytics stubs (tracker.web.ts) are no-ops
 * - Routing guard logic works correctly
 */
import '../__smoke-tests__/smoke-setup';

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';

// Access mocked modules for assertions
import * as SplashScreen from 'expo-splash-screen';
import {
  initializeOneSignal,
  loginOneSignal,
  logoutOneSignal,
} from '@/src/services/notifications/client';
import { initializeAnalytics } from '@/src/services/analytics/tracker';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useUser } from '@/src/shared/hooks/use-user';

// Import the component under test
import RootLayout from '@/app/_layout';

// Grab the mocked expo-router module that smoke-setup created
// and override useRouter/useSegments with controllable jest.fn()
const mockReplace = jest.fn();
const mockPush = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const expoRouter = require('expo-router');
const originalUseRouter = expoRouter.useRouter;
const originalUseSegments = expoRouter.useSegments;

// Helper to override auth store state for specific tests
function setAuthState(overrides: Record<string, unknown>) {
  const baseState = {
    isAuthenticated: false,
    isGuest: false,
    isLoading: false,
    error: null,
    initialize: jest.fn(),
    signInWithApple: jest.fn(),
    signInWithGoogle: jest.fn(),
    devLogin: jest.fn(),
    enterGuestMode: jest.fn(),
    signOut: jest.fn(),
    deleteAccount: jest.fn(),
    ...overrides,
  };
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector?: (s: Record<string, unknown>) => unknown) =>
      selector ? selector(baseState) : baseState,
  );
}

function setUserState(overrides: Record<string, unknown>) {
  const baseState = {
    user: null,
    isLoading: false,
    setUser: jest.fn(),
    ...overrides,
  };
  (useUser as unknown as jest.Mock).mockImplementation(
    (selector?: (s: Record<string, unknown>) => unknown) =>
      selector ? selector(baseState) : baseState,
  );
}

let mockSegments: string[] = ['(tabs)'];

beforeEach(() => {
  mockReplace.mockClear();
  mockPush.mockClear();
  mockSegments = ['(tabs)'];

  // Override useRouter to return controllable mocks
  expoRouter.useRouter = () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  });
  expoRouter.useSegments = () => mockSegments;

  // Reset store mocks to default unauthenticated state
  setAuthState({});
  setUserState({});
  // Clear service mocks
  (initializeOneSignal as jest.Mock).mockClear();
  (loginOneSignal as jest.Mock).mockClear();
  (logoutOneSignal as jest.Mock).mockClear();
  (initializeAnalytics as jest.Mock).mockClear();
  (SplashScreen.hideAsync as jest.Mock).mockClear();
});

afterAll(() => {
  // Restore original mock functions
  expoRouter.useRouter = originalUseRouter;
  expoRouter.useSegments = originalUseSegments;
});

describe('M057: Root _layout.tsx Web compatibility', () => {
  it('renders without crashing on Web (Platform.OS === "web")', () => {
    expect(Platform.OS).toBe('web');
    expect(() => {
      const { unmount } = render(<RootLayout />);
      unmount();
    }).not.toThrow();
  });

  it('SplashScreen.hideAsync is called when fonts are loaded', () => {
    render(<RootLayout />);
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('does not render StatusBar on Web (Platform.OS !== "web" guard)', () => {
    const { toJSON } = render(<RootLayout />);
    const tree = JSON.stringify(toJSON());
    expect(tree).not.toContain('"StatusBar"');
  });

  it('calls initializeOneSignal on mount (web stub is a no-op)', () => {
    render(<RootLayout />);
    expect(initializeOneSignal).toHaveBeenCalled();
  });

  it('calls initializeAnalytics on mount (web stub is a no-op)', () => {
    render(<RootLayout />);
    expect(initializeAnalytics).toHaveBeenCalled();
  });

  describe('routing guard on Web', () => {
    it('redirects to login when not authenticated and not guest', () => {
      mockSegments = ['(tabs)'];
      setAuthState({ isAuthenticated: false, isGuest: false, isLoading: false });

      render(<RootLayout />);
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });

    it('redirects guest to tabs if not already in tabs', () => {
      mockSegments = ['(auth)'];
      setAuthState({ isAuthenticated: false, isGuest: true, isLoading: false });

      render(<RootLayout />);
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('redirects to onboarding when authenticated but onboarding not completed', () => {
      mockSegments = ['(tabs)'];
      setAuthState({ isAuthenticated: true, isGuest: false, isLoading: false });
      setUserState({
        user: { id: 'user-1', onboardingCompleted: false },
      });

      render(<RootLayout />);
      expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/welcome');
    });

    it('redirects authenticated+onboarded user from auth group to tabs', () => {
      mockSegments = ['(auth)'];
      setAuthState({ isAuthenticated: true, isGuest: false, isLoading: false });
      setUserState({
        user: { id: 'user-1', onboardingCompleted: true },
      });

      render(<RootLayout />);
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('does not redirect when auth is still loading', () => {
      setAuthState({ isAuthenticated: false, isGuest: false, isLoading: true });

      render(<RootLayout />);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does not call loginOneSignal for unauthenticated user on Web', () => {
      setAuthState({ isAuthenticated: false, isGuest: false, isLoading: false });
      render(<RootLayout />);
      expect(loginOneSignal).not.toHaveBeenCalled();
    });

    it('calls logoutOneSignal when not authenticated and not guest', () => {
      setAuthState({ isAuthenticated: false, isGuest: false, isLoading: false });
      render(<RootLayout />);
      expect(logoutOneSignal).toHaveBeenCalled();
    });

    it('does not call logoutOneSignal when in guest mode', () => {
      setAuthState({ isAuthenticated: false, isGuest: true, isLoading: false });
      render(<RootLayout />);
      expect(logoutOneSignal).not.toHaveBeenCalled();
    });
  });
});
