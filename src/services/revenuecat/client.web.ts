import type { EntitlementInfo, SubscriptionOfferings, SubscriptionPackage } from '@/src/shared/types/subscription';

const freeEntitlement: EntitlementInfo = {
  isPro: false,
  isTrialing: false,
  status: 'free',
  planType: 'free',
  expiresAt: null,
  trialDaysRemaining: null,
};

export const initializeRevenueCat = async (_userId?: string): Promise<void> => {};

export const mapCustomerInfo = (_info: unknown): EntitlementInfo => freeEntitlement;

export const checkSubscriptionStatus = async (): Promise<EntitlementInfo> => freeEntitlement;

export const getOfferings = async (): Promise<SubscriptionOfferings | null> => null;

export const purchasePackage = async (_pkg: SubscriptionPackage): Promise<EntitlementInfo> => {
  throw new Error('In-app purchases are not supported on web. Please use the mobile app.');
};

export const restorePurchases = async (): Promise<EntitlementInfo> => freeEntitlement;

export const identifyUser = async (_userId: string): Promise<void> => {};

export const logOutRevenueCat = async (): Promise<void> => {};

export const addCustomerInfoListener = (
  _callback: (info: EntitlementInfo) => void,
): (() => void) => {
  return () => {};
};

export const hasNeverPurchased = async (): Promise<boolean> => true;
