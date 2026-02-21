/**
 * Web stub for OneSignal notifications.
 * Web push notifications are not supported in this version.
 */

export const initializeOneSignal = (): void => {};

export const requestNotificationPermission = async (): Promise<boolean> => false;

export const loginOneSignal = (_userId: string): void => {};

export const logoutOneSignal = (): void => {};

export const addNotificationClickListener = (
  _callback: (event: unknown) => void,
): (() => void) => {
  return () => {};
};

export const getNotificationPermissionStatus = async (): Promise<boolean> => false;
