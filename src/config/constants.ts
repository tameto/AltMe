export const APP_NAME = 'AltMe';
export const APP_SUBTITLE = 'Your AI Twin That Knows You';
export const APP_TAGLINE = 'もう一人の自分と、毎日を振り返る';

export const FREE_DAILY_CHAT_LIMIT = 3;

export const PRICING = {
  MONTHLY: 4980,
  ANNUAL: 39800,
  ANNUAL_INTRO: 29800,
  CURRENCY: 'JPY',
  INTRO_OFFER_HOURS: 24,
  TRIAL_DAYS: 3,
} as const;

export const CREDIT_PACKS = {
  SMALL: { credits: 50, price: 300 },
  MEDIUM: { credits: 150, price: 800 },
  LARGE: { credits: 500, price: 2400 },
} as const;

export const CREDIT_COSTS = {
  DEEP_ANALYSIS: 10,
  MONTHLY_REPORT: 20,
  CHAT_INSIGHT: 5,
} as const;

export const REVENUECAT = {
  entitlement: 'pro',
  offerings: {
    default: 'default',
    credits: 'credit_packs',
  },
} as const;

export const CHAT = {
  maxMessageLength: 1000,
  contextMessageCount: 20,
  historyPageSize: 50,
  rateLimitPerMinute: 5,
} as const;

export const ONBOARDING_QUESTION_COUNT = 5;

export const OPENCLAW = {
  gatewayPort: 18789,
  defaultRegion: 'sgp1',
  defaultDropletSize: 's-1vcpu-1gb',
  healthCheckIntervalMs: 5 * 60 * 1000,
  reconnect: {
    maxAttempts: 10,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
  },
  connectionTimeoutMs: 10000,
} as const;
