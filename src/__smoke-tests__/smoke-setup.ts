/**
 * Shared mock setup for smoke tests.
 * Mocks all external services and feature modules so that
 * screen components can be rendered without side effects.
 */

// --- expo modules ---

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
  useSegments: () => ['(tabs)'],
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: Object.assign(
    ({ children }: { children?: React.ReactNode }) => children ?? null,
    { Screen: () => null },
  ),
  Tabs: Object.assign(
    ({ children }: { children?: React.ReactNode }) => children ?? null,
    { Screen: () => null },
  ),
  Href: String,
  Slot: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.0',
      extra: {},
    },
    manifest: { version: '1.0.0' },
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'ja' }]),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => children ?? null,
  SafeAreaProvider: ({ children }: { children?: React.ReactNode }) => children ?? null,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => ({
  DarkTheme: { dark: true, colors: { primary: '#fff', background: '#000', card: '#000', text: '#fff', border: '#333', notification: '#ff0' } },
  ThemeProvider: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    createAnimatedComponent: (c: unknown) => c,
  },
  useSharedValue: jest.fn((v: unknown) => ({ value: v })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((v: unknown) => v),
  withSpring: jest.fn((v: unknown) => v),
  FadeIn: { duration: jest.fn().mockReturnThis() },
  FadeOut: { duration: jest.fn().mockReturnThis() },
  SlideInRight: { duration: jest.fn().mockReturnThis() },
  SlideOutLeft: { duration: jest.fn().mockReturnThis() },
  Easing: { bezier: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => {
  const MockIcon = ({ children }: { children?: React.ReactNode }) => children ?? null;
  return {
    __esModule: true,
    Feather: MockIcon,
    Ionicons: MockIcon,
    FontAwesome: Object.assign(MockIcon, { font: {} }),
    MaterialCommunityIcons: MockIcon,
  };
});

jest.mock('@expo/vector-icons/Feather', () => {
  const MockIcon = () => null;
  return { __esModule: true, default: MockIcon };
});

jest.mock('@expo/vector-icons/FontAwesome', () => {
  const MockIcon = Object.assign(
    () => null,
    { font: {} },
  );
  return { __esModule: true, default: MockIcon };
});

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const MockIcon = () => null;
  return { __esModule: true, default: MockIcon };
});

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

// --- i18n ---

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ja', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  Trans: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('@/src/shared/i18n', () => ({}));

// --- services ---

jest.mock('@/src/services/notifications/client', () => ({
  initializeOneSignal: jest.fn(),
  loginOneSignal: jest.fn(),
  logoutOneSignal: jest.fn(),
  requestNotificationPermission: jest.fn().mockResolvedValue(true),
  addNotificationClickListener: jest.fn(() => jest.fn()),
  getNotificationPermissionStatus: jest.fn().mockResolvedValue('granted'),
}));

jest.mock('@/src/services/analytics/tracker', () => ({
  initializeAnalytics: jest.fn(),
  trackEvent: jest.fn(),
}));

jest.mock('@/src/services/revenuecat/client', () => ({
  hasNeverPurchased: jest.fn().mockResolvedValue(true),
  initializeRevenueCat: jest.fn(),
}));

jest.mock('@/src/services/openclaw/client', () => ({
  getMyInstance: jest.fn().mockResolvedValue(null),
  updateSoulMd: jest.fn().mockResolvedValue(undefined),
  subscribeToInstanceChanges: jest.fn(() => jest.fn()),
  getWebSocketUrl: jest.fn().mockReturnValue(null),
  restartInstance: jest.fn().mockResolvedValue({ success: true }),
  getGatewayToken: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/src/services/community/client', () => ({
  createCommunity: jest.fn().mockResolvedValue({}),
  getCommunities: jest.fn().mockResolvedValue([]),
}));

// --- feature stores ---

jest.mock('@/src/features/auth/stores/auth-store', () => ({
  useAuthStore: Object.assign(
    jest.fn((selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
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
      };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({
        isAuthenticated: false,
        isGuest: false,
        isLoading: false,
      }),
      setState: jest.fn(),
      subscribe: jest.fn(),
    },
  ),
}));

jest.mock('@/src/features/onboarding/stores/onboarding-store', () => ({
  useOnboardingStore: Object.assign(
    jest.fn((selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        step: 0,
        currentStep: 0,
        twinName: 'AltMe',
        speechTone: 'friendly',
        avatarIcon: 'default',
        quizAnswers: [],
        answers: [],
        mbtiType: null,
        setTwinName: jest.fn(),
        setSpeechTone: jest.fn(),
        setAvatarIcon: jest.fn(),
        setQuizAnswer: jest.fn(),
        setMbtiType: jest.fn(),
        nextStep: jest.fn(),
        prevStep: jest.fn(),
        goNext: jest.fn(),
        goPrev: jest.fn(),
        addAnswer: jest.fn(),
        setResult: jest.fn(),
        setAnalyzing: jest.fn(),
        reset: jest.fn(),
      };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({ step: 0, currentStep: 0 }),
      setState: jest.fn(),
      subscribe: jest.fn(),
    },
  ),
  PERSONALITY_QUESTIONS: [
    {
      id: 'q1',
      question: 'Mock question',
      options: [
        { label: 'Option A', value: 'a' },
        { label: 'Option B', value: 'b' },
      ],
    },
  ],
}));

// --- feature hooks ---

jest.mock('@/src/features/chat/hooks/use-chat', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    isLoading: false,
    isSending: false,
    sendMessage: jest.fn(),
    remainingCount: 3,
    error: null,
  })),
}));

jest.mock('@/src/features/chat/hooks/use-topics', () => ({
  useTopics: jest.fn(() => ({
    topics: [],
    selectTopic: jest.fn(),
  })),
}));

jest.mock('@/src/features/community/hooks/use-communities', () => ({
  useCommunities: jest.fn(() => ({
    communities: [],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

jest.mock('@/src/features/community/hooks/use-community-detail', () => ({
  useCommunityDetail: jest.fn(() => ({
    community: null,
    messages: [],
    members: [],
    isLoading: false,
    error: null,
    sendMessage: jest.fn(),
  })),
}));

jest.mock('@/src/features/community/hooks/use-community-membership', () => ({
  useCommunityMembership: jest.fn(() => ({
    isMember: false,
    isJoining: false,
    join: jest.fn(),
    leave: jest.fn(),
  })),
}));

jest.mock('@/src/features/insights/hooks/use-twin-data', () => ({
  useTwinData: jest.fn(() => ({
    twinData: null,
    isLoading: false,
    error: null,
  })),
}));

// --- feature components ---

jest.mock('@/src/features/chat/components/chat-header', () => ({
  ChatHeader: () => null,
}));

jest.mock('@/src/features/chat/components/topic-chips-row', () => ({
  TopicChipsRow: () => null,
}));

jest.mock('@/src/features/chat/components/chat-bubble', () => ({
  ChatBubble: () => null,
}));

jest.mock('@/src/features/chat/components/date-separator', () => ({
  DateSeparator: () => null,
}));

jest.mock('@/src/features/chat/components/remaining-counter', () => ({
  RemainingCounter: () => null,
}));

jest.mock('@/src/features/community/components/community-card', () => ({
  CommunityCard: () => null,
}));

jest.mock('@/src/features/community/components/message-item', () => ({
  MessageItem: () => null,
}));

jest.mock('@/src/features/community/components/join-button', () => ({
  JoinButton: () => null,
}));

// --- shared components ---

jest.mock('@/src/shared/components/cosmic-background', () => ({
  CosmicBackground: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('@/src/shared/components/glass-card', () => ({
  GlassCard: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('@/src/shared/components/gold-button', () => ({
  GoldButton: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('@/src/shared/components/guest-prompt-overlay', () => ({
  GuestPromptOverlay: () => null,
}));

// --- shared hooks ---

jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: Object.assign(
    jest.fn((selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        user: null,
        isLoading: false,
        setUser: jest.fn(),
      };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({ user: null, isLoading: false }),
      setState: jest.fn(),
      subscribe: jest.fn(),
    },
  ),
}));

jest.mock('@/src/shared/hooks/use-subscription', () => ({
  useSubscription: Object.assign(
    jest.fn(() => ({
      entitlement: {
        isPro: false,
        isTrialing: false,
        status: 'free',
        planType: 'free',
        expiresAt: null,
        trialDaysRemaining: null,
      },
      isLoading: false,
      purchase: jest.fn(),
      restore: jest.fn(),
      loadOfferings: jest.fn(),
      offerings: [],
    })),
    {
      getState: () => ({
        entitlement: { isPro: false, status: 'free', planType: 'free' },
        isLoading: false,
      }),
      setState: jest.fn(),
      subscribe: jest.fn(),
    },
  ),
  useIsPro: jest.fn(() => false),
}));

jest.mock('@/src/shared/hooks/use-network', () => ({
  useNetwork: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
}));

// Needed for React in mock factories
import React from 'react';
