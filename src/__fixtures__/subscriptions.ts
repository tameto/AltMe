import type { Subscription, EntitlementInfo } from '@/src/shared/types/subscription';

export const mockFreeSubscription: Subscription = {
  id: 'sub-free-001',
  userId: 'user-free-001',
  revenuecatCustomerId: null,
  status: 'free',
  plan: 'free',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  trialEnd: null,
  cancelledAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const mockProSubscription: Subscription = {
  id: 'sub-pro-001',
  userId: 'user-pro-001',
  revenuecatCustomerId: 'rc-cust-001',
  status: 'active',
  plan: 'monthly',
  currentPeriodStart: '2026-01-01T00:00:00Z',
  currentPeriodEnd: '2026-02-01T00:00:00Z',
  trialEnd: null,
  cancelledAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-15T00:00:00Z',
};

export const mockTrialSubscription: Subscription = {
  ...mockProSubscription,
  id: 'sub-trial-001',
  status: 'trial',
  trialEnd: '2026-01-04T00:00:00Z',
};

export const mockFreeEntitlement: EntitlementInfo = {
  isPro: false,
  isTrialing: false,
  status: 'free',
  planType: 'free',
  expiresAt: null,
  trialDaysRemaining: null,
};

export const mockProEntitlement: EntitlementInfo = {
  isPro: true,
  isTrialing: false,
  status: 'active',
  planType: 'monthly',
  expiresAt: '2026-02-01T00:00:00Z',
  trialDaysRemaining: null,
};
