import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import 'react-native-reanimated';
import '@/src/shared/i18n';

import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useUser } from '@/src/shared/hooks/use-user';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  clearBadgeCount,
} from '@/src/services/notifications/client';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
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

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Register push notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !user?.onboardingCompleted) return;

    registerForPushNotifications(user.id).catch((err) => {
      console.warn('Push notification registration failed:', err);
    });

    clearBadgeCount();

    const subscription = addNotificationResponseListener((response) => {
      // Navigate to chat when notification is tapped
      router.push('/(tabs)');
    });

    return () => subscription.remove();
  }, [isAuthenticated, user?.id, user?.onboardingCompleted]);

  // Routing guard
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabGroup = segments[0] === '(tabs)';

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
      // Authenticated but onboarding not done -> go to onboarding
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/welcome');
      }
    } else {
      // Authenticated and onboarding done -> go to tabs
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isGuest, authLoading, user?.onboardingCompleted, segments]);

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar barStyle="light-content" />
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
