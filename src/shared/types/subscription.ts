export type SubscriptionStatus =
  | 'free'
  | 'trial'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'grace_period';

export type PlanType = 'monthly' | 'annual' | 'intro_annual';

export type Subscription = {
  id: string;
  userId: string;
  revenuecatId: string | null;
  status: SubscriptionStatus;
  planType: PlanType | null;
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreditBalance = {
  userId: string;
  balance: number;
};

export type CreditTransaction = {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'consume' | 'bonus';
  description: string | null;
  createdAt: string;
};

export type EntitlementInfo = {
  isPro: boolean;
  status: SubscriptionStatus;
  planType: PlanType | null;
  trialDaysRemaining: number | null;
  credits: number;
};
