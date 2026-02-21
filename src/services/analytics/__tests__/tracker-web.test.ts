/**
 * Analytics tracker.web.ts テスト（Web プロジェクト対象）
 *
 * M137: tracker.web.ts の API 検証
 * - initializeAnalytics, trackEvent, identifyUser, resetUser, trackScreen
 */

import {
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
  EVENT_NAMES,
} from '../tracker.web';

describe('Analytics tracker.web', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // ---- initializeAnalytics ----

  it('initializeAnalytics resolves without error', async () => {
    await expect(initializeAnalytics()).resolves.toBeUndefined();
  });

  // ---- trackEvent ----

  it('trackEvent logs event name and properties in DEV', () => {
    trackEvent({ name: 'test_event', properties: { key: 'value' } });
    expect(consoleSpy).toHaveBeenCalledWith('[Analytics:web] test_event', { key: 'value' });
  });

  it('trackEvent logs empty object when no properties provided', () => {
    trackEvent({ name: 'no_props_event' });
    expect(consoleSpy).toHaveBeenCalledWith('[Analytics:web] no_props_event', {});
  });

  // ---- identifyUser ----

  it('identifyUser is callable and does not throw', () => {
    expect(() => identifyUser('user-123')).not.toThrow();
  });

  it('identifyUser is a no-op stub (returns undefined)', () => {
    const result = identifyUser('user-456');
    expect(result).toBeUndefined();
  });

  // ---- resetUser ----

  it('resetUser is callable and does not throw', () => {
    expect(() => resetUser()).not.toThrow();
  });

  it('resetUser is a no-op stub (returns undefined)', () => {
    const result = resetUser();
    expect(result).toBeUndefined();
  });

  // ---- trackScreen ----

  it('trackScreen sends screen_viewed event', () => {
    trackScreen('HomeScreen');
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Analytics:web] screen_viewed',
      { screen: 'HomeScreen' },
    );
  });

  it('trackScreen passes screenName as property', () => {
    trackScreen('PaywallScreen');
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Analytics:web] screen_viewed',
      { screen: 'PaywallScreen' },
    );
  });

  // ---- イベントヘルパー ----

  it('trackPaywallViewed sends paywall_viewed event', () => {
    trackPaywallViewed();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.PAYWALL_VIEWED}`,
      {},
    );
  });

  it('trackPaywallPlanSelected sends plan type', () => {
    trackPaywallPlanSelected('monthly');
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.PAYWALL_PLAN_SELECTED}`,
      { planType: 'monthly' },
    );
  });

  it('trackPurchaseStarted sends plan type', () => {
    trackPurchaseStarted('annual');
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.PURCHASE_STARTED}`,
      { planType: 'annual' },
    );
  });

  it('trackPurchaseCompleted sends plan type and price', () => {
    trackPurchaseCompleted('monthly', 980);
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.PURCHASE_COMPLETED}`,
      { planType: 'monthly', price: 980 },
    );
  });

  it('trackPurchaseFailed sends error message', () => {
    trackPurchaseFailed('NETWORK_ERROR');
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.PURCHASE_FAILED}`,
      { error: 'NETWORK_ERROR' },
    );
  });

  it('trackTrialStarted sends trial_started event', () => {
    trackTrialStarted();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.TRIAL_STARTED}`,
      {},
    );
  });

  it('trackOnboardingStarted sends onboarding_started event', () => {
    trackOnboardingStarted();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.ONBOARDING_STARTED}`,
      {},
    );
  });

  it('trackOnboardingCompleted sends onboarding_completed event', () => {
    trackOnboardingCompleted();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.ONBOARDING_COMPLETED}`,
      {},
    );
  });

  it('trackPersonalityQuizCompleted sends personality_quiz_completed event', () => {
    trackPersonalityQuizCompleted();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.PERSONALITY_QUIZ_COMPLETED}`,
      {},
    );
  });

  it('trackChatSent sends chat_sent event', () => {
    trackChatSent();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.CHAT_SENT}`,
      {},
    );
  });

  it('trackJournalCreated sends journal_created event', () => {
    trackJournalCreated();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.JOURNAL_CREATED}`,
      {},
    );
  });

  it('trackMoodRecorded sends mood', () => {
    trackMoodRecorded('happy');
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Analytics:web] ${EVENT_NAMES.MOOD_RECORDED}`,
      { mood: 'happy' },
    );
  });
});
