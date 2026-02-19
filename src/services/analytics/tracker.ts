/**
 * 課金イベントトラッキング基盤
 *
 * 開発環境では console.log に加え、PostHog SDK にも送信する。
 */

import { env } from '@/src/config/env';

// ---- PostHog クライアント（モジュールスコープ、冪等初期化） ----

let posthogClient: any | null = null;

/**
 * PostHog Analytics を初期化する。
 * 2回以上呼んでも1インスタンスのみ生成する（冪等）。
 * posthog-react-native を動的 require することで jest.resetModules() 後も正しいモックを参照する。
 */
export async function initializeAnalytics(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (!env.posthogApiKey) return;
  const posthogModule = require('posthog-react-native') as any;
  // モジュールレベルでシングルトンを管理（jest.resetModules() 後は新しいモジュールなのでリセットされる）
  if (posthogModule.__posthogInstance) {
    posthogClient = posthogModule.__posthogInstance;
    return;
  }
  posthogClient = new posthogModule.PostHog(env.posthogApiKey, {
    host: 'https://us.i.posthog.com',
  });
  posthogModule.__posthogInstance = posthogClient;
}

// ---- イベント定義 ----

/** Analytics イベントの基本型 */
export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
};

/** 定義済みイベント名の一覧（型安全のための定数マップ） */
export const EVENT_NAMES = {
  PAYWALL_VIEWED: 'paywall_viewed',
  PAYWALL_PLAN_SELECTED: 'paywall_plan_selected',
  PURCHASE_STARTED: 'purchase_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_FAILED: 'purchase_failed',
  TRIAL_STARTED: 'trial_started',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PERSONALITY_QUIZ_COMPLETED: 'personality_quiz_completed',
  CHAT_SENT: 'chat_sent',
  JOURNAL_CREATED: 'journal_created',
  MOOD_RECORDED: 'mood_recorded',
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

// ---- コアトラッキング関数 ----

/**
 * イベントを送信する
 *
 * __DEV__ では console.log に出力し、PostHog SDK（初期化済みの場合）にも送信する。
 */
export const trackEvent = (event: AnalyticsEvent): void => {
  if (__DEV__) {
    console.log(`[Analytics] ${event.name}`, event.properties ?? {});
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const activeClient: any = posthogClient ?? (require('posthog-react-native') as any).__posthogInstance ?? null;
  if (activeClient) {
    activeClient.capture(event.name, event.properties ?? {});
  }
};

// ---- 型安全なイベントヘルパー ----

/** ペイウォール表示 */
export const trackPaywallViewed = (): void => {
  trackEvent({ name: EVENT_NAMES.PAYWALL_VIEWED });
};

/** プラン選択（monthly / annual / intro_annual） */
export const trackPaywallPlanSelected = (planType: string): void => {
  trackEvent({
    name: EVENT_NAMES.PAYWALL_PLAN_SELECTED,
    properties: { planType },
  });
};

/** 購入開始 */
export const trackPurchaseStarted = (planType: string): void => {
  trackEvent({
    name: EVENT_NAMES.PURCHASE_STARTED,
    properties: { planType },
  });
};

/** 購入完了 */
export const trackPurchaseCompleted = (
  planType: string,
  price: number,
): void => {
  trackEvent({
    name: EVENT_NAMES.PURCHASE_COMPLETED,
    properties: { planType, price },
  });
};

/** 購入失敗 */
export const trackPurchaseFailed = (error: string): void => {
  trackEvent({
    name: EVENT_NAMES.PURCHASE_FAILED,
    properties: { error },
  });
};

/** トライアル開始 */
export const trackTrialStarted = (): void => {
  trackEvent({ name: EVENT_NAMES.TRIAL_STARTED });
};

/** オンボーディング開始 */
export const trackOnboardingStarted = (): void => {
  trackEvent({ name: EVENT_NAMES.ONBOARDING_STARTED });
};

/** オンボーディング完了 */
export const trackOnboardingCompleted = (): void => {
  trackEvent({ name: EVENT_NAMES.ONBOARDING_COMPLETED });
};

/** 性格診断完了 */
export const trackPersonalityQuizCompleted = (): void => {
  trackEvent({ name: EVENT_NAMES.PERSONALITY_QUIZ_COMPLETED });
};

/** チャット送信 */
export const trackChatSent = (): void => {
  trackEvent({ name: EVENT_NAMES.CHAT_SENT });
};

/** 日記作成 */
export const trackJournalCreated = (): void => {
  trackEvent({ name: EVENT_NAMES.JOURNAL_CREATED });
};

/** 気分記録 */
export const trackMoodRecorded = (mood: string): void => {
  trackEvent({
    name: EVENT_NAMES.MOOD_RECORDED,
    properties: { mood },
  });
};
