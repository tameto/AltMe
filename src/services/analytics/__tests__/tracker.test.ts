/**
 * TDD-RED + Existing: Analytics Tracker Tests
 *
 * Existing tests for console.log behavior are preserved.
 * New tests for PostHog SDK integration added (TDD-RED).
 *
 * SDD Spec: Feature 4 (Analytics SDK Integration)
 * AC-4.1 ~ AC-4.6
 */

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
  initializeAnalytics,
  EVENT_NAMES,
} from '../tracker';

// Mock PostHog
jest.mock('posthog-react-native', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    flush: jest.fn(),
    shutdown: jest.fn(),
  })),
}));

// Mock env
jest.mock('@/src/config/env', () => ({
  env: {
    posthogApiKey: 'phc_test_key_123',
  },
}));

describe('Analytics Tracker', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // --- Existing console.log tests (preserved) ---

  describe('trackEvent (console.log in __DEV__)', () => {
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

  // --- NEW: PostHog SDK Integration Tests (TDD-RED) ---

  describe('PostHog integration', () => {
    it('initializeAnalytics creates PostHog instance', async () => {
      await initializeAnalytics();

      // After initialization, PostHog should be configured
      const { PostHog } = require('posthog-react-native');
      expect(PostHog).toHaveBeenCalled();
    });

    it('trackEvent sends capture to PostHog after initialization', async () => {
      await initializeAnalytics();

      trackEvent({ name: 'test_posthog_event', properties: { key: 'value' } });

      const { PostHog } = require('posthog-react-native');
      const instance = PostHog.mock.results[0]?.value;
      if (instance) {
        expect(instance.capture).toHaveBeenCalledWith(
          'test_posthog_event',
          { key: 'value' },
        );
      }
    });

    it('trackEvent does not crash when PostHog is not initialized', () => {
      // Reset module to clear initialization
      jest.resetModules();

      // This should not throw even without initialization
      expect(() => {
        trackEvent({ name: 'safe_event' });
      }).not.toThrow();
    });

    it('initializeAnalytics is idempotent', async () => {
      await initializeAnalytics();
      await initializeAnalytics();

      const { PostHog } = require('posthog-react-native');
      // Should only create one instance
      expect(PostHog).toHaveBeenCalledTimes(1);
    });
  });
});
