// This file exists for TypeScript resolution only.
// Metro bundler resolves imports to client.native.ts (iOS/Android)
// or client.web.ts (web) automatically based on platform.
export {
  initializeOneSignal,
  requestNotificationPermission,
  loginOneSignal,
  logoutOneSignal,
  addNotificationClickListener,
  getNotificationPermissionStatus,
} from './client.native';
