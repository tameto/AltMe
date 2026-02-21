/* eslint-disable @typescript-eslint/no-require-imports */

// ============================================================
// Native module mocks (shared across all platforms)
// ============================================================

// Mock react-native-purchases
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    setLogLevel: jest.fn(),
    configure: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 4 },
}));

// Mock react-native-onesignal
jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    initialize: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    Notifications: {
      requestPermission: jest.fn().mockResolvedValue(true),
      getPermissionAsync: jest.fn().mockResolvedValue(true),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    functions: {
      invoke: jest.fn(),
    },
  })),
}));

// Mock expo-apple-authentication
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'mock://redirect'),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mock-hash'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

// ============================================================
// Web globals (M002) — only defined when running in jsdom
// ============================================================

// Detect jsdom: jest-expo sets `window = global` even in node env,
// so check for `document` which only exists in jsdom.
const isJsdom = typeof document !== 'undefined' && typeof window !== 'undefined';

if (isJsdom) {
  // window.matchMedia
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  }

  // IntersectionObserver
  if (!window.IntersectionObserver) {
    class MockIntersectionObserver {
      readonly root: Element | null = null;
      readonly rootMargin: string = '';
      readonly thresholds: ReadonlyArray<number> = [];
      observe = jest.fn();
      unobserve = jest.fn();
      disconnect = jest.fn();
      takeRecords = jest.fn().mockReturnValue([]);
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: MockIntersectionObserver,
    });
  }

  // ResizeObserver
  if (!window.ResizeObserver) {
    class MockResizeObserver {
      observe = jest.fn();
      unobserve = jest.fn();
      disconnect = jest.fn();
    }
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: MockResizeObserver,
    });
  }

  // sessionStorage (jsdom usually has this, but just in case)
  if (!window.sessionStorage) {
    const store: Record<string, string> = {};
    Object.defineProperty(window, 'sessionStorage', {
      writable: true,
      value: {
        getItem: jest.fn((key: string) => store[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          Object.keys(store).forEach((k) => delete store[k]);
        }),
        get length() {
          return Object.keys(store).length;
        },
        key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
      },
    });
  }

  // URL.createObjectURL / revokeObjectURL
  if (!URL.createObjectURL) {
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = jest.fn();
  }

  // document.visibilityState
  if (!document.visibilityState) {
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
    });
  }
}

// navigator.onLine (works in both jsdom and node when navigator exists)
if (typeof navigator !== 'undefined' && navigator.onLine === undefined) {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
}

// ============================================================
// Native globals (M003) — expo modules for native tests
// ============================================================

// Mock expo-network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
  NetworkStateType: {
    NONE: 'NONE',
    WIFI: 'WIFI',
    CELLULAR: 'CELLULAR',
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}), { virtual: true });

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: [],
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: [],
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  MediaTypeOptions: {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images',
  },
}), { virtual: true });
