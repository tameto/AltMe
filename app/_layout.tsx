import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import 'react-native-reanimated';
import '@/src/shared/i18n';

import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useUser } from '@/src/shared/hooks/use-user';
import {
  initializeOneSignal,
  loginOneSignal,
  logoutOneSignal,
  requestNotificationPermission,
  addNotificationClickListener,
} from '@/src/services/notifications/client';
import { initializeAnalytics } from '@/src/services/analytics/tracker';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// SplashScreen is a no-op on web but wrap in try-catch for safety
try {
  SplashScreen.preventAutoHideAsync();
} catch {
  // Silently ignore on platforms where SplashScreen is unavailable
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // Initialize OneSignal once at app startup
  useEffect(() => {
    initializeOneSignal();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {
        // Silently ignore on platforms where SplashScreen is unavailable
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();

  const { isAuthenticated, isGuest, isLoading: authLoading, initialize } = useAuthStore();
  const user = useUser((s) => s.user);

  // Initialize auth and analytics on mount
  useEffect(() => {
    initialize();
    initializeAnalytics();
  }, [initialize]);

  // Register OneSignal when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !user?.onboardingCompleted) return;

    loginOneSignal(user.id);
    requestNotificationPermission().catch((err) => {
      console.warn('Notification permission request failed:', err);
    });

    const cleanup = addNotificationClickListener(() => {
      router.push('/(tabs)');
    });

    return cleanup;
  }, [isAuthenticated, user?.id, user?.onboardingCompleted, router]);

  // Logout from OneSignal when user signs out (skip for guest mode)
  useEffect(() => {
    if (!isAuthenticated && !isGuest) {
      logoutOneSignal();
    }
  }, [isAuthenticated, isGuest]);

  // Routing guard
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabGroup = segments[0] === '(tabs)';
    const inPaywallGroup = segments[0] === '(paywall)';

    if (!isAuthenticated && !isGuest) {
      // Not authenticated and not guest -> go to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!isAuthenticated && isGuest) {
      // Guest mode -> show tabs (community visible, others show overlay)
      if (!inTabGroup) {
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && !user?.onboardingCompleted) {
      // Authenticated but onboarding not done -> go to onboarding or paywall
      if (!inOnboardingGroup && !inPaywallGroup) {
        router.replace('/(onboarding)/welcome');
      }
    } else {
      // Authenticated and onboarding done -> go to tabs
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isGuest, authLoading, user?.onboardingCompleted, segments, router]);

  return (
    <ThemeProvider value={DarkTheme}>
      {Platform.OS !== 'web' && <StatusBar barStyle="light-content" />}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(paywall)"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="subscription-manage"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="twin-conversation-detail"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="account-delete-confirm"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="token-purchase"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="mbti-select"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="notification-settings"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="community-create"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
