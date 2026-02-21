import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import type {
  EntitlementInfo,
  SubscriptionOfferings,
  SubscriptionPackage,
  SubscriptionStatus,
  PlanType,
  PlatformSubscription,
} from '../types/subscription';
import {
  checkSubscriptionStatus,
  getOfferings as rcGetOfferings,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  addCustomerInfoListener,
} from '@/src/services/revenuecat/client';

type PlatformSubscriptionStore = {
  entitlement: EntitlementInfo;
  isLoading: boolean;
  offerings: SubscriptionOfferings | null;

  setEntitlement: (info: Partial<EntitlementInfo>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;

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

export const usePlatformSubscriptionStore = create<PlatformSubscriptionStore>((set) => ({
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

export const usePlatformSubscription = (): PlatformSubscription & { isLoading: boolean } => {
  const store = usePlatformSubscriptionStore();

  useEffect(() => {
    store.refreshStatus();
    store.loadOfferings();

    // RevenueCat リアルタイムリスナー
    const removeListener = addCustomerInfoListener((entitlement) => {
      usePlatformSubscriptionStore.getState().setEntitlement(entitlement);
    });

    return removeListener;
  }, []);

  const purchase = useCallback(async (planType: PlanType) => {
    const offerings = usePlatformSubscriptionStore.getState().offerings;
    const pkg = offerings?.current?.packages.find((p) => p.planType === planType);
    if (!pkg) throw new Error(`Package not found for plan: ${planType}`);
    await store.purchase(pkg);
  }, [store]);

  const restore = useCallback(async () => {
    await store.restore();
  }, [store]);

  const manage = useCallback(async () => {
    // Native: App Store/Play Store の subscription 管理画面へ遷移
    // react-native-purchases の showManageSubscriptions は SDK 内部で処理
    const { Linking } = await import('react-native');
    const { Platform } = await import('react-native');
    if (Platform.OS === 'ios') {
      await Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      await Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }, []);

  return {
    isPro: store.entitlement.isPro,
    isTrialing: store.entitlement.isTrialing,
    status: store.entitlement.status,
    planType: store.entitlement.planType,
    expiresAt: store.entitlement.expiresAt,
    trialDaysRemaining: store.entitlement.trialDaysRemaining,
    purchase,
    restore,
    manage,
    isLoading: store.isLoading,
  };
};

export const useIsPro = (): boolean => {
  return usePlatformSubscriptionStore((s) => s.entitlement.isPro);
};
