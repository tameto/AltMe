// Base file for Metro platform resolution.
// Metro resolves:
//   .native.ts → iOS/Android (RevenueCat SDK)
//   .web.ts → Web (Supabase DB + Stripe + entitlement-poller)
//   .ts → fallback (native implementation)
export { usePlatformSubscription, usePlatformSubscriptionStore, useIsPro } from './use-platform-subscription.native';
