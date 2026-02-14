import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';

import { env } from '@/src/config/env';
import { REVENUECAT } from '@/src/config/constants';
import type { EntitlementInfo, SubscriptionStatus, PlanType } from '@/src/shared/types/subscription';

let isRevenueCatConfigured = false;

/**
 * Initialize RevenueCat SDK
 * Must be called at app startup in _layout.tsx
 */
export const initializeRevenueCat = async (userId?: string): Promise<void> => {
  const apiKey = Platform.select({
    ios: env.revenuecatIosKey,
    android: env.revenuecatAndroidKey,
  });

  if (!apiKey) {
    console.warn('RevenueCat API key not set. Subscription features disabled.');
    return;
  }

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  await Purchases.configure({ apiKey, appUserID: userId ?? null });
  isRevenueCatConfigured = true;
};

/**
 * Map RevenueCat CustomerInfo to our EntitlementInfo type
 */
export const mapCustomerInfo = (info: CustomerInfo): EntitlementInfo => {
  const proEntitlement = info.entitlements.active[REVENUECAT.entitlement];

  if (!proEntitlement) {
    return {
      isPro: false,
      status: 'free' as SubscriptionStatus,
      planType: null,
      trialDaysRemaining: null,
      credits: 0,
    };
  }

  const now = new Date();
  let status: SubscriptionStatus = 'active';
  let trialDaysRemaining: number | null = null;

  if (proEntitlement.periodType === 'TRIAL') {
    status = 'trial';
    if (proEntitlement.expirationDate) {
      const expDate = new Date(proEntitlement.expirationDate);
      trialDaysRemaining = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
  } else if (proEntitlement.willRenew === false) {
    status = 'cancelled';
  }

  let planType: PlanType | null = null;
  const productId = proEntitlement.productIdentifier;
  if (productId.includes('annual') || productId.includes('yearly')) {
    planType = productId.includes('intro') ? 'intro_annual' : 'annual';
  } else if (productId.includes('monthly')) {
    planType = 'monthly';
  }

  return {
    isPro: true,
    status,
    planType,
    trialDaysRemaining,
    credits: 0, // Credits managed separately in Supabase
  };
};

const freeEntitlement: EntitlementInfo = {
  isPro: false,
  status: 'free' as SubscriptionStatus,
  planType: null,
  trialDaysRemaining: null,
  credits: 0,
};

/**
 * Get current customer info and map to EntitlementInfo
 */
export const checkSubscriptionStatus = async (): Promise<EntitlementInfo> => {
  if (!isRevenueCatConfigured) return freeEntitlement;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return mapCustomerInfo(customerInfo);
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return freeEntitlement;
  }
};

/**
 * Get available offerings
 */
export const getOfferings = async (): Promise<PurchasesOfferings | null> => {
  if (!isRevenueCatConfigured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

/**
 * Purchase a package
 */
export const purchasePackage = async (pkg: PurchasesPackage): Promise<EntitlementInfo> => {
  if (!isRevenueCatConfigured) throw new Error('RevenueCat not configured');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return mapCustomerInfo(customerInfo);
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async (): Promise<EntitlementInfo> => {
  if (!isRevenueCatConfigured) return freeEntitlement;
  const customerInfo = await Purchases.restorePurchases();
  return mapCustomerInfo(customerInfo);
};

/**
 * Identify user with RevenueCat (call after auth)
 */
export const identifyUser = async (userId: string): Promise<void> => {
  if (!isRevenueCatConfigured) return;
  await Purchases.logIn(userId);
};

/**
 * Log out from RevenueCat (call on sign out)
 */
export const logOutRevenueCat = async (): Promise<void> => {
  if (!isRevenueCatConfigured) return;
  await Purchases.logOut();
};

/**
 * Listen for customer info updates
 */
export const addCustomerInfoListener = (
  callback: (info: EntitlementInfo) => void,
): (() => void) => {
  if (!isRevenueCatConfigured) return () => {};
  const listener = (info: CustomerInfo) => {
    callback(mapCustomerInfo(info));
  };
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
};
