import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/src/services/supabase/client';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and save token to Supabase
 */
export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });
  const token = tokenData.data;

  // Save token to Supabase profile
  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);

  // Set up notification channel (non-iOS platforms)
  if (Platform.OS !== 'ios') {
    await Notifications.setNotificationChannelAsync('morning', {
      name: '朝の挨拶',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  return token;
};

/**
 * Schedule a local notification (for testing)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  triggerSeconds?: number,
): Promise<string> => {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: triggerSeconds
      ? { seconds: triggerSeconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL }
      : null,
  });
};

/**
 * Add notification response listener (when user taps notification)
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Add notification received listener (when app is in foreground)
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Get current badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  return Notifications.getBadgeCountAsync();
};

/**
 * Clear badge count
 */
export const clearBadgeCount = async (): Promise<void> => {
  await Notifications.setBadgeCountAsync(0);
};
