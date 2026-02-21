import { create } from 'zustand';
import type { EntitlementInfo, SubscriptionOfferings, SubscriptionPackage, SubscriptionStatus } from '../types/subscription';
import {
  checkSubscriptionStatus,
  getOfferings as rcGetOfferings,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
} from '@/src/services/revenuecat/client';

type SubscriptionStore = {
  entitlement: EntitlementInfo;
  isLoading: boolean;
  offerings: SubscriptionOfferings | null;

  // Actions
  setEntitlement: (info: Partial<EntitlementInfo>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;

  // RevenueCat operations
  refreshStatus: () => Promise<void>;
  loadOfferings: () => Promise<SubscriptionOfferings | null>;
  purchase: (pkg: SubscriptionPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
};

const initialEntitlement: EntitlementInfo = {
  isPro: false,
  isTrialing: false,
  status: 'free' as SubscriptionStatus,
  planType: 'free',
  expiresAt: null,
  trialDaysRemaining: null,
};

export const useSubscription = create<SubscriptionStore>((set, get) => ({
  entitlement: initialEntitlement,
  isLoading: true,
  offerings: null,

  setEntitlement: (partial) =>
    set((state) => ({
      entitlement: { ...state.entitlement, ...partial },
    })),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ entitlement: initialEntitlement, isLoading: true, offerings: null }),

  refreshStatus: async () => {
    try {
      const entitlement = await checkSubscriptionStatus();
      set({ entitlement, isLoading: false });
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
      set({ isLoading: false });
    }
  },

  loadOfferings: async () => {
    try {
      const offerings = await rcGetOfferings();
      set({ offerings });
      return offerings;
    } catch (error) {
      console.error('Failed to load offerings:', error);
      return null;
    }
  },

  purchase: async (pkg: SubscriptionPackage) => {
    try {
      const entitlement = await rcPurchasePackage(pkg);
      set({ entitlement });
      return entitlement.isPro;
    } catch (error: unknown) {
      // User cancelled
      if (error instanceof Error && error.message.includes('PURCHASE_CANCELLED')) {
        return false;
      }
      throw error;
    }
  },

  restore: async () => {
    try {
      const entitlement = await rcRestorePurchases();
      set({ entitlement });
      return entitlement.isPro;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    }
  },
}));

export const useIsPro = (): boolean => {
  return useSubscription((s) => s.entitlement.isPro);
};
