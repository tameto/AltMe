import { create } from 'zustand';
import type {
  EntitlementInfo,
  SubscriptionOfferings,
  SubscriptionPackage,
  SubscriptionStatus,
  PlanType,
} from '../types/subscription';
import { supabase } from '@/src/services/supabase/client';
import { env } from '@/src/config/env';
import { PRICING } from '@/src/config/constants';

type SubscriptionStore = {
  entitlement: EntitlementInfo;
  isLoading: boolean;
  offerings: SubscriptionOfferings | null;

  // Actions
  setEntitlement: (info: Partial<EntitlementInfo>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;

  // Web operations (Supabase + Stripe)
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
        localizedPriceString: `¥${PRICING.MONTHLY.toLocaleString()}`,
        price: PRICING.MONTHLY,
        currencyCode: PRICING.CURRENCY,
        introPrice: null,
      },
      {
        identifier: 'annual',
        planType: 'annual',
        localizedPriceString: `¥${PRICING.ANNUAL.toLocaleString()}`,
        price: PRICING.ANNUAL,
        currencyCode: PRICING.CURRENCY,
        introPrice: null,
      },
      {
        identifier: 'annual_intro',
        planType: 'annual_intro',
        localizedPriceString: `¥${PRICING.ANNUAL_INTRO.toLocaleString()}`,
        price: PRICING.ANNUAL_INTRO,
        currencyCode: PRICING.CURRENCY,
        introPrice: {
          priceString: `¥${PRICING.ANNUAL_INTRO.toLocaleString()}`,
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

export const useSubscription = create<SubscriptionStore>((set) => ({
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
      const entitlement = await fetchWithRetry(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return initialEntitlement;

        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, plan_type, current_period_end, trial_end')
          .eq('user_id', user.id)
          .single();

        if (error || !data) return initialEntitlement;
        return mapDbSubscription(data);
      });
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
    try {
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

      // Redirect to Stripe Checkout
      if (response.url) {
        window.location.href = response.url;
      }
      return false; // Will redirect, so return false
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('PURCHASE_CANCELLED')) {
        return false;
      }
      throw error;
    }
  },

  restore: async () => {
    // Web: just re-fetch from DB (no purchase restoration needed)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_type, current_period_end, trial_end')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return false;

      const entitlement = mapDbSubscription(data);
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
