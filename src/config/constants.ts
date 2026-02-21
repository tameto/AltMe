export const APP_NAME = 'AltMe';
export const APP_SUBTITLE = 'Your AI Twin That Knows You';
export const APP_TAGLINE = 'もう一人の自分と、毎日を振り返る';

export const FREE_DAILY_LIMIT = 3;
export const JOURNAL_MAX_LENGTH = 3000;
export const CHAT_PAGE_SIZE = 50;

export const MONTHLY_PRICE = 4980;
export const ANNUAL_PRICE = 39800;
export const INTRO_ANNUAL_PRICE = 29800;
export const INTRO_OFFER_HOURS = 24;

export const TOKEN_SMALL = 50000;
export const TOKEN_MEDIUM = 120000;
export const TOKEN_LARGE = 400000;

export const RC_ENTITLEMENT_ID = 'pro';
export const RC_OFFERING_ID = 'default';

export const PRICING = {
  MONTHLY: MONTHLY_PRICE,
  ANNUAL: ANNUAL_PRICE,
  ANNUAL_INTRO: INTRO_ANNUAL_PRICE,
  CURRENCY: 'JPY',
  INTRO_OFFER_HOURS: INTRO_OFFER_HOURS,
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
  entitlement: RC_ENTITLEMENT_ID,
  offerings: {
    default: RC_OFFERING_ID,
    credits: 'credit_packs',
  },
} as const;

export const CHAT = {
  maxMessageLength: 1000,
  contextMessageCount: 20,
  historyPageSize: CHAT_PAGE_SIZE,
  rateLimitPerMinute: 5,
} as const;

export const ONBOARDING_QUESTION_COUNT = 5;

export const DEFAULT_TOPICS: { key: 'daily' | 'work' | 'reflection' | 'consultation'; name: string }[] = [
  { key: 'daily', name: '日常' },
  { key: 'work', name: '仕事' },
  { key: 'reflection', name: '振り返り' },
  { key: 'consultation', name: '相談' },
];

export const OPENCLAW = {
  gatewayPort: 18789,
  wsPort: 443,
  defaultRegion: 'sgp1',
  defaultDropletSize: 's-1vcpu-1gb',
  healthCheckIntervalMs: 5 * 60 * 1000,
  reconnect: {
    maxAttempts: 10,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
  },
  connectionTimeoutMs: 10000,
  // Cloudflare Container settings
  sleepAfterMs: 10 * 60 * 1000,
  coldStartTimeoutMs: 8000,
  coldStartWarningMs: 5000,
  wakingPollIntervalMs: 500,
} as const;
