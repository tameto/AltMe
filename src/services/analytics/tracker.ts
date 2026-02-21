// This file exists for TypeScript resolution only.
// Metro bundler resolves imports to tracker.native.ts (iOS/Android)
// or tracker.web.ts (web) automatically based on platform.
export {
  initializeAnalytics,
  trackEvent,
  identifyUser,
  resetUser,
  trackScreen,
  trackPaywallViewed,
  trackPaywallPlanSelected,
  trackPurchaseStarted,
  trackPurchaseCompleted,
  trackPurchaseFailed,
  trackTrialStarted,
  trackOnboardingStarted,
  trackOnboardingCompleted,
  trackPersonalityQuizCompleted,
  trackChatSent,
  trackJournalCreated,
  trackMoodRecorded,
} from './tracker.native';
export type { AnalyticsEvent, EventName } from './tracker.native';
export { EVENT_NAMES } from './tracker.native';
