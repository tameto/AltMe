import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';
import type {
  EntitlementInfo,
  SubscriptionOfferings,
  SubscriptionPackage,
  SubscriptionStatus,
  PlanType,
  PlatformSubscription,
} from '../types/subscription';
import { supabase } from '@/src/services/supabase/client';
import { env } from '@/src/config/env';
import { PRICING } from '@/src/config/constants';
import { isFeatureEnabled } from '@/src/config/feature-flags';
import {
  startEntitlementPoller,
  stopEntitlementPoller,
} from '@/src/services/subscription/entitlement-poller';

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
  manage: () => Promise<void>;
};

const initialEntitlement: EntitlementInfo = {
  isPro: false,
  isTrialing: false,
  status: 'free' as SubscriptionStatus,
  planType: 'free',
  expiresAt: null,
  trialDaysRemaining: null,
};

const mapDbSubscription = (row: {
  status: string;
  plan_type: string;
  current_period_end: string | null;
  trial_end: string | null;
}): EntitlementInfo => {
  const status = row.status as SubscriptionStatus;
  const planType = row.plan_type as PlanType;
  const isPro = status === 'active' || status === 'trial' || status === 'grace_period';
  const isTrialing = status === 'trial';

  let trialDaysRemaining: number | null = null;
  if (isTrialing && row.trial_end) {
    const now = new Date();
    const trialEnd = new Date(row.trial_end);
    trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return {
    isPro,
    isTrialing,
    status,
    planType,
    expiresAt: row.current_period_end,
    trialDaysRemaining,
  };
};

const buildWebOfferings = (): SubscriptionOfferings => ({
  current: {
    identifier: 'default',
    packages: [
      {
        identifier: 'monthly',
        planType: 'monthly',
        localizedPriceString: `\u00A5${PRICING.MONTHLY.toLocaleString()}`,
        price: PRICING.MONTHLY,
        currencyCode: PRICING.CURRENCY,
        introPrice: null,
      },
      {
        identifier: 'annual',
        planType: 'annual',
        localizedPriceString: `\u00A5${PRICING.ANNUAL.toLocaleString()}`,
        price: PRICING.ANNUAL,
        currencyCode: PRICING.CURRENCY,
        introPrice: null,
      },
      {
        identifier: 'annual_intro',
        planType: 'annual_intro',
        localizedPriceString: `\u00A5${PRICING.ANNUAL_INTRO.toLocaleString()}`,
        price: PRICING.ANNUAL_INTRO,
        currencyCode: PRICING.CURRENCY,
        introPrice: {
          priceString: `\u00A5${PRICING.ANNUAL_INTRO.toLocaleString()}`,
          price: PRICING.ANNUAL_INTRO,
          period: '1',
          periodUnit: 'year',
          cycles: 1,
        },
      },
    ],
  },
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const POLLER_INTERVAL_MS = 30000;

const fetchWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw new Error('Unreachable');
};

const fetchSubscriptionFromDb = async (): Promise<EntitlementInfo> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return initialEntitlement;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan_type, current_period_end, trial_end')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return initialEntitlement;
  return mapDbSubscription(data);
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
      const entitlement = await fetchWithRetry(fetchSubscriptionFromDb);
      set({ entitlement, isLoading: false });
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
      set({ isLoading: false });
    }
  },

  loadOfferings: async () => {
    const offerings = buildWebOfferings();
    set({ offerings });
    return offerings;
  },

  purchase: async (pkg: SubscriptionPackage) => {
    if (!isFeatureEnabled('stripeCheckout')) {
      throw new Error('Stripe Checkout is not enabled on this platform');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetchWithRetry(async () => {
      const res = await fetch(`${env.supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          // annual_intro は Stripe 側では annual として扱う
          planType: pkg.planType === 'annual_intro' ? 'annual' : pkg.planType,
          successUrl: `${window.location.origin}/subscription-manage?success=true`,
          cancelUrl: `${window.location.origin}/(paywall)`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      return res.json();
    });

    if (response.url) {
      window.location.href = response.url;
    }
    return false;
  },

  restore: async () => {
    try {
      const entitlement = await fetchWithRetry(fetchSubscriptionFromDb);
      set({ entitlement });
      return entitlement.isPro;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    }
  },

  manage: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${env.supabaseUrl}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        returnUrl: `${window.location.origin}/settings`,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create portal session');
    }

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  },
}));

export const usePlatformSubscription = (): PlatformSubscription & { isLoading: boolean } => {
  const store = usePlatformSubscriptionStore();
  const pollerStartedRef = useRef(false);

  useEffect(() => {
    store.refreshStatus();
    store.loadOfferings();
  }, []);

  // Start entitlement poller for background sync
  useEffect(() => {
    if (pollerStartedRef.current) return;
    pollerStartedRef.current = true;

    startEntitlementPoller(
      { intervalMs: POLLER_INTERVAL_MS, enabled: true },
      {
        onEntitlementUpdate: (isPro) => {
          const current = usePlatformSubscriptionStore.getState().entitlement;
          if (current.isPro !== isPro) {
            usePlatformSubscriptionStore.getState().refreshStatus();
          }
        },
        onError: (error) => {
          console.error('Entitlement poller error:', error);
        },
      },
    );

    return () => {
      pollerStartedRef.current = false;
      stopEntitlementPoller();
    };
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
    await store.manage();
  }, [store]);

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
