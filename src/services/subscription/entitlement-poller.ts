import { Platform } from 'react-native';
import { supabase } from '@/src/services/supabase/client';
import type { SubscriptionStatus } from '@/src/shared/types/subscription';

export type EntitlementPollerConfig = {
  intervalMs: number; // default: 30000 (30秒)
  enabled: boolean;
};

export type EntitlementPollerCallbacks = {
  onEntitlementUpdate: (isPro: boolean) => void;
  onError: (error: Error) => void;
};

let pollerInterval: ReturnType<typeof setInterval> | null = null;

const PRO_STATUSES: SubscriptionStatus[] = ['active', 'trial', 'grace_period'];

export const startEntitlementPoller = (
  config: EntitlementPollerConfig,
  callbacks: EntitlementPollerCallbacks,
): void => {
  // Web のみ有効（Native は RevenueCat SDK が状態管理を担当）
  if (Platform.OS !== 'web' || !config.enabled) return;

  stopEntitlementPoller();

  pollerInterval = setInterval(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        callbacks.onEntitlementUpdate(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        callbacks.onEntitlementUpdate(false);
        return;
      }

      const isPro = PRO_STATUSES.includes(data.status as SubscriptionStatus);
      callbacks.onEntitlementUpdate(isPro);
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, config.intervalMs);
};

export const stopEntitlementPoller = (): void => {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }
};
