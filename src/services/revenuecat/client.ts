// This file exists for TypeScript resolution only.
// Metro bundler resolves imports to client.native.ts (iOS/Android)
// or client.web.ts (web) automatically based on platform.
export {
  initializeRevenueCat,
  mapCustomerInfo,
  checkSubscriptionStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
  identifyUser,
  logOutRevenueCat,
  addCustomerInfoListener,
  hasNeverPurchased,
} from './client.native';
