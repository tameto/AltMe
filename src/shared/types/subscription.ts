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
