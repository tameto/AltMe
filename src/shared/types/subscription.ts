export type SubscriptionStatus =
  | 'free'
  | 'trial'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'grace_period';

export type PlanType = 'free' | 'monthly' | 'annual' | 'annual_intro';

export type Subscription = {
  id: string;
  userId: string;
  revenuecatCustomerId: string | null;
  status: SubscriptionStatus;
  plan: PlanType;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreditBalance = {
  id: string;
  userId: string;
  dailyRemaining: number;
  lastResetAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreditTransaction = {
  id: string;
  userId: string;
  type: 'consume' | 'reset' | 'bonus';
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

export type EntitlementInfo = {
  isPro: boolean;
  isTrialing: boolean;
  status: SubscriptionStatus;
  planType: PlanType;
  expiresAt: string | null;
  trialDaysRemaining: number | null;
};

// Platform-agnostic offering/package types (abstracts RevenueCat/Stripe)
export type SubscriptionPackage = {
  identifier: string;
  planType: PlanType;
  localizedPriceString: string;
  price: number;
  currencyCode: string;
  introPrice?: {
    priceString: string;
    price: number;
    period: string;
    periodUnit: string;
    cycles: number;
  } | null;
};

export type SubscriptionOfferings = {
  current: {
    identifier: string;
    packages: SubscriptionPackage[];
  } | null;
};

// Stripe Checkout (Web)
export type StripeCheckoutSession = {
  url: string;
  sessionId: string;
};

export type StripePortalSession = {
  url: string;
};

// Platform-agnostic subscription interface
export type PlatformSubscription = {
  isPro: boolean;
  isTrialing: boolean;
  status: SubscriptionStatus;
  planType: PlanType;
  expiresAt: string | null;
  trialDaysRemaining: number | null;
  purchase: (planType: PlanType) => Promise<void>;
  restore: () => Promise<void>;
  manage: () => Promise<void>;
};

// Stripe-specific Subscription info
export type StripeSubscriptionInfo = {
  customerId: string;
  subscriptionId: string;
  priceId: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
};
