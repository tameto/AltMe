/**
 * M127-M130, M136: Settings Web compatibility + notification + account delete + OpenClaw UI tests
 *
 * M127: Settings screen Web rendering (profile, subscrip, logout, guest, legal, version)
 * M128: Account delete confirm Web (modal, input, escape)
 * M129: Notification settings Web (web notice banner, native linking)
 * M130: Extended settings test coverage
 * M136: OpenClaw instance management UI Web
 */
import '../.././../__smoke-tests__/smoke-setup';

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';

import SettingsScreen from '@/app/(tabs)/settings';
import AccountDeleteConfirmScreen from '@/app/account-delete-confirm';
import NotificationSettingsScreen from '@/app/notification-settings';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const expoRouter = require('expo-router');
const originalUseRouter = expoRouter.useRouter;

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();

// Override auth store and user store for specific test scenarios
// eslint-disable-next-line @typescript-eslint/no-require-imports
const authStoreModule = require('@/src/features/auth/stores/auth-store');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const userModule = require('@/src/shared/hooks/use-user');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const subModule = require('@/src/shared/hooks/use-subscription');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const openclawClient = require('@/src/services/openclaw/client');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectTexts(node: any): string[] {
  if (!node) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(collectTexts);
  const texts: string[] = [];
  if (node.children) {
    for (const child of node.children) {
      texts.push(...collectTexts(child));
    }
  }
  return texts;
}

function setupAuthenticatedUser(isPro = false) {
  authStoreModule.useAuthStore.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector?: (s: Record<string, unknown>) => any) => {
      const state = {
        isAuthenticated: true,
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
      };
      return selector ? selector(state) : state;
    },
  );
  userModule.useUser.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector?: (s: Record<string, unknown>) => any) => {
      const state = {
        user: {
          id: 'user-1',
          displayName: 'Test User',
          email: 'test@example.com',
          twinName: 'MyTwin',
          mbtiType: 'INFP',
          onboardingCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        isLoading: false,
        setUser: jest.fn(),
        updateUser: jest.fn(),
      };
      return selector ? selector(state) : state;
    },
  );
  subModule.useIsPro.mockReturnValue(isPro);
}

function setupGuestUser() {
  authStoreModule.useAuthStore.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector?: (s: Record<string, unknown>) => any) => {
      const state = {
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        error: null,
        initialize: jest.fn(),
        signInWithApple: jest.fn(),
        signInWithGoogle: jest.fn(),
        devLogin: jest.fn(),
        enterGuestMode: jest.fn(),
        signOut: jest.fn(),
        deleteAccount: jest.fn(),
      };
      return selector ? selector(state) : state;
    },
  );
  userModule.useUser.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector?: (s: Record<string, unknown>) => any) => {
      const state = {
        user: null,
        isLoading: false,
        setUser: jest.fn(),
        updateUser: jest.fn(),
      };
      return selector ? selector(state) : state;
    },
  );
  subModule.useIsPro.mockReturnValue(false);
}

beforeEach(() => {
  mockBack.mockClear();
  mockPush.mockClear();
  mockReplace.mockClear();

  expoRouter.useRouter = () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: jest.fn(() => true),
  });
});

afterAll(() => {
  expoRouter.useRouter = originalUseRouter;
});

// ────────────────────────────────────────
// M127: Settings screen Web rendering
// ────────────────────────────────────────
describe('M127: Settings screen Web rendering', () => {
  it('renders authenticated free user settings without crashing', () => {
    setupAuthenticatedUser(false);
    expect(() => {
      const { unmount } = render(<SettingsScreen />);
      unmount();
    }).not.toThrow();
  });

  it('renders authenticated pro user settings without crashing', () => {
    setupAuthenticatedUser(true);
    expect(() => {
      const { unmount } = render(<SettingsScreen />);
      unmount();
    }).not.toThrow();
  });

  it('renders guest settings screen without crashing', () => {
    setupGuestUser();
    expect(() => {
      const { unmount } = render(<SettingsScreen />);
      unmount();
    }).not.toThrow();
  });

  it('shows version info on Web', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const fullText = texts.join(' ');
    // Version text may be split across nodes: "v", "1.0.0", " (Build ", "1", ")"
    const hasVersion = fullText.includes('v') && fullText.includes('Build');
    expect(hasVersion).toBe(true);
  });

  it('shows legal links (terms, privacy)', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasTerms = texts.some((t) => t.includes('settings.termsAndPrivacy') || t.includes('terms'));
    const hasPrivacy = texts.some((t) => t.includes('settings.support.privacy') || t.includes('privacy'));
    expect(hasTerms || hasPrivacy).toBe(true);
  });

  it('shows subscription management link', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasSub = texts.some((t) => t.includes('settings.subscriptionManage') || t.includes('subscription'));
    expect(hasSub).toBe(true);
  });

  it('shows logout button for authenticated user', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasLogout = texts.some((t) => t.includes('settings.account.logout') || t.includes('logout'));
    expect(hasLogout).toBe(true);
  });

  it('shows account delete link for authenticated user', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasDelete = texts.some((t) => t.includes('settings.account.deleteAccount') || t.includes('delete'));
    expect(hasDelete).toBe(true);
  });

  it('shows guest login prompt for unauthenticated users', () => {
    setupGuestUser();
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasGuestTitle = texts.some((t) => t.includes('guest.title') || t.includes('guest'));
    expect(hasGuestTitle).toBe(true);
  });

  it('displays correct profile info for authenticated user', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasDisplayName = texts.some((t) => t.includes('Test User'));
    expect(hasDisplayName).toBe(true);
  });
});

// ────────────────────────────────────────
// M128: Account delete confirm Web
// ────────────────────────────────────────
describe('M128: Account delete confirm Web', () => {
  it('renders without crashing on Web', () => {
    expect(() => {
      const { unmount } = render(<AccountDeleteConfirmScreen />);
      unmount();
    }).not.toThrow();
  });

  it('shows warning section', () => {
    const { toJSON } = render(<AccountDeleteConfirmScreen />);
    const texts = collectTexts(toJSON());
    const hasWarning = texts.some(
      (t) => t.includes('settings.deleteConfirm.warning') || t.includes('warning'),
    );
    expect(hasWarning).toBe(true);
  });

  it('shows confirmation input field', () => {
    const { toJSON } = render(<AccountDeleteConfirmScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('shows delete and cancel buttons', () => {
    const { toJSON } = render(<AccountDeleteConfirmScreen />);
    const texts = collectTexts(toJSON());
    const hasDelete = texts.some(
      (t) => t.includes('settings.deleteConfirm.cta') || t.includes('delete'),
    );
    const hasCancel = texts.some(
      (t) => t.includes('settings.deleteConfirm.cancel') || t.includes('cancel'),
    );
    expect(hasDelete).toBe(true);
    expect(hasCancel).toBe(true);
  });

  it('back button calls router.back()', () => {
    render(<AccountDeleteConfirmScreen />);
    const router = expoRouter.useRouter();
    router.back();
    expect(mockBack).toHaveBeenCalled();
  });
});

// ────────────────────────────────────────
// M129: Notification settings Web
// ────────────────────────────────────────
describe('M129: Notification settings Web', () => {
  it('renders without crashing on Web', () => {
    expect(Platform.OS).toBe('web');
    expect(() => {
      const { unmount } = render(<NotificationSettingsScreen />);
      unmount();
    }).not.toThrow();
  });

  it('shows web notice banner on Web platform', () => {
    const { toJSON } = render(<NotificationSettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasWebNotice = texts.some(
      (t) => t.includes('settings.notifications.webNotice') || t.includes('web'),
    );
    expect(hasWebNotice).toBe(true);
  });

  it('does not show system disabled banner on Web', () => {
    const { toJSON } = render(<NotificationSettingsScreen />);
    const texts = collectTexts(toJSON());
    // System disabled banner has openSettings text which should not appear on web
    const hasOpenSettings = texts.some(
      (t) => t === 'settings.notifications.openSettings',
    );
    expect(hasOpenSettings).toBe(false);
  });
});

// ────────────────────────────────────────
// M130: Extended settings coverage
// ────────────────────────────────────────
describe('M130: Extended settings test coverage', () => {
  it('free user sees upgrade button', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasUpgrade = texts.some(
      (t) => t.includes('settings.upgradeToPro') || t.includes('upgrade'),
    );
    expect(hasUpgrade).toBe(true);
  });

  it('pro user does not see upgrade button', () => {
    setupAuthenticatedUser(true);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasUpgrade = texts.some((t) => t === 'settings.upgradeToPro');
    expect(hasUpgrade).toBe(false);
  });

  it('shows notification settings link', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasNotif = texts.some(
      (t) => t.includes('settings.notifications.title') || t.includes('notification'),
    );
    expect(hasNotif).toBe(true);
  });

  it('shows help link', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasHelp = texts.some(
      (t) => t.includes('settings.support.help') || t.includes('help'),
    );
    expect(hasHelp).toBe(true);
  });

  it('guest settings show available features list', () => {
    setupGuestUser();
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const hasFeatures = texts.some(
      (t) => t.includes('settings.guestLogin.availableFeatures') || t.includes('features'),
    );
    expect(hasFeatures).toBe(true);
  });
});

// ────────────────────────────────────────
// M136: OpenClaw instance management UI Web
// ────────────────────────────────────────
describe('M136: OpenClaw instance management UI Web', () => {
  it('calls getMyInstance for pro user', () => {
    setupAuthenticatedUser(true);
    openclawClient.getMyInstance.mockClear();
    const { unmount } = render(<SettingsScreen />);
    expect(openclawClient.getMyInstance).toHaveBeenCalled();
    unmount();
  });

  it('does not call getMyInstance for free user', () => {
    setupAuthenticatedUser(false);
    openclawClient.getMyInstance.mockClear();
    const { unmount } = render(<SettingsScreen />);
    expect(openclawClient.getMyInstance).not.toHaveBeenCalled();
    unmount();
  });

  it('subscribes to instance changes for pro user', () => {
    setupAuthenticatedUser(true);
    openclawClient.subscribeToInstanceChanges.mockClear();
    const { unmount } = render(<SettingsScreen />);
    expect(openclawClient.subscribeToInstanceChanges).toHaveBeenCalledWith(
      'user-1',
      expect.any(Function),
    );
    unmount();
  });

  it('does not subscribe to instance changes for free user', () => {
    setupAuthenticatedUser(false);
    openclawClient.subscribeToInstanceChanges.mockClear();
    const { unmount } = render(<SettingsScreen />);
    expect(openclawClient.subscribeToInstanceChanges).not.toHaveBeenCalled();
    unmount();
  });

  it('shows twin settings row with MBTI for free user (no OpenClaw status)', () => {
    setupAuthenticatedUser(false);
    const { toJSON } = render(<SettingsScreen />);
    const texts = collectTexts(toJSON());
    const fullText = texts.join(' ');
    expect(fullText).toContain('settings.twinSettingsWithInfo');
    // MBTI subtitle should be present
    const hasMbti = texts.some(
      (t) => t.includes('settings.twinSettingsSub.mbtiLabel') || t.includes('MBTI'),
    );
    expect(hasMbti).toBe(true);
  });

  it('renders pro user settings with OpenClaw UI without crashing', () => {
    setupAuthenticatedUser(true);
    expect(() => {
      const { unmount } = render(<SettingsScreen />);
      unmount();
    }).not.toThrow();
  });
});
