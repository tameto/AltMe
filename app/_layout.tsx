import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';

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
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const { isAuthenticated, isLoading: authLoading, initialize } = useAuthStore();
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

    if (!isAuthenticated) {
      // Not authenticated -> go to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!user?.onboardingCompleted) {
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
  }, [isAuthenticated, authLoading, user?.onboardingCompleted, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
      </Stack>
    </ThemeProvider>
  );
}
