import {
  trackEvent,
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
} from '../tracker';

describe('Analytics Tracker', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('trackEvent', () => {
    it('logs event name and properties', () => {
      trackEvent({ name: 'test_event', properties: { key: 'value' } });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] test_event',
        { key: 'value' },
      );
    });

    it('logs empty object when no properties provided', () => {
      trackEvent({ name: 'test_event' });

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] test_event', {});
    });
  });

  describe('event helpers', () => {
    it('trackPaywallViewed sends correct event', () => {
      trackPaywallViewed();
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.PAYWALL_VIEWED}`,
        {},
      );
    });

    it('trackPaywallPlanSelected sends plan type', () => {
      trackPaywallPlanSelected('monthly');
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.PAYWALL_PLAN_SELECTED}`,
        { planType: 'monthly' },
      );
    });

    it('trackPurchaseStarted sends plan type', () => {
      trackPurchaseStarted('annual');
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.PURCHASE_STARTED}`,
        { planType: 'annual' },
      );
    });

    it('trackPurchaseCompleted sends plan type and price', () => {
      trackPurchaseCompleted('monthly', 980);
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.PURCHASE_COMPLETED}`,
        { planType: 'monthly', price: 980 },
      );
    });

    it('trackPurchaseFailed sends error', () => {
      trackPurchaseFailed('NETWORK_ERROR');
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.PURCHASE_FAILED}`,
        { error: 'NETWORK_ERROR' },
      );
    });

    it('trackTrialStarted sends correct event', () => {
      trackTrialStarted();
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.TRIAL_STARTED}`,
        {},
      );
    });

    it('trackOnboardingStarted sends correct event', () => {
      trackOnboardingStarted();
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.ONBOARDING_STARTED}`,
        {},
      );
    });

    it('trackOnboardingCompleted sends correct event', () => {
      trackOnboardingCompleted();
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.ONBOARDING_COMPLETED}`,
        {},
      );
    });

    it('trackPersonalityQuizCompleted sends correct event', () => {
      trackPersonalityQuizCompleted();
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.PERSONALITY_QUIZ_COMPLETED}`,
        {},
      );
    });

    it('trackChatSent sends correct event', () => {
      trackChatSent();
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.CHAT_SENT}`,
        {},
      );
    });

    it('trackJournalCreated sends correct event', () => {
      trackJournalCreated();
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.JOURNAL_CREATED}`,
        {},
      );
    });

    it('trackMoodRecorded sends mood', () => {
      trackMoodRecorded('happy');
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Analytics] ${EVENT_NAMES.MOOD_RECORDED}`,
        { mood: 'happy' },
      );
    });
  });
});
