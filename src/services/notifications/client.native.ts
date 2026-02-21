import { OneSignal, NotificationClickEvent } from 'react-native-onesignal';
import { env } from '@/src/config/env';

/**
 * Initialize OneSignal SDK (call once in RootLayout)
 */
export const initializeOneSignal = (): void => {
  OneSignal.initialize(env.onesignalAppId);
  // iOS ではプロンプトを自動表示しない（後で明示的に呼ぶ）
};

/**
 * Request notification permission
 * Returns true if granted
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  return OneSignal.Notifications.requestPermission(true);
};

/**
 * Login user to OneSignal (set External User ID)
 * Call when user is authenticated
 */
export const loginOneSignal = (userId: string): void => {
  OneSignal.login(userId);
};

/**
 * Logout from OneSignal
 * Call when user signs out
 */
export const logoutOneSignal = (): void => {
  OneSignal.logout();
};

/**
 * Add click listener (when user taps notification)
 * Returns cleanup function
 */
export const addNotificationClickListener = (
  callback: (event: NotificationClickEvent) => void,
): (() => void) => {
  OneSignal.Notifications.addEventListener('click', callback);
  return () => {
    OneSignal.Notifications.removeEventListener('click', callback);
  };
};

/**
 * Check if notifications are enabled
 */
export const getNotificationPermissionStatus = async (): Promise<boolean> => {
  return OneSignal.Notifications.getPermissionAsync();
};
