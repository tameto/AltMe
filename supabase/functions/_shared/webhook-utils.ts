import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type IdempotencyResult = {
  isProcessed: boolean;
  processedAt: string | null;
};

export const checkIdempotency = async (
  supabase: SupabaseClient,
  eventId: string,
  source: 'stripe' | 'revenuecat',
): Promise<IdempotencyResult> => {
  const { data, error } = await supabase
    .from('webhook_events')
    .select('processed_at')
    .eq('event_id', eventId)
    .eq('source', source)
    .maybeSingle();

  if (error) {
    // fail-closed: DB エラー時は処理を中断して二重課金を防ぐ
    throw new Error(`Idempotency check failed: ${error.message}`);
  }

  return {
    isProcessed: !!data?.processed_at,
    processedAt: data?.processed_at ?? null,
  };
};

/**
 * 原子的にイベントを予約する（レースコンディション防止）
 * INSERT で claimed_at を設定し、UNIQUE 制約で重複を防ぐ。
 * 既に存在する場合は false を返す。
 */
export const claimWebhookEvent = async (
  supabase: SupabaseClient,
  eventId: string,
  source: 'stripe' | 'revenuecat',
  eventType: string,
): Promise<{ claimed: boolean }> => {
  const { error } = await supabase
    .from('webhook_events')
    .insert({
      event_id: eventId,
      source,
      event_type: eventType,
      claimed_at: new Date().toISOString(),
    });

  if (error) {
    // UNIQUE 制約違反 (23505) = 既にクレーム済み
    if (error.code === '23505') {
      return { claimed: false };
    }
    // その他のDBエラーは fail-closed
    throw new Error(`claimWebhookEvent failed: ${error.message}`);
  }

  return { claimed: true };
};

/**
 * 処理失敗時にクレームを解放し、Stripe/RevenueCat の再試行を受け入れ可能にする。
 */
export const releaseWebhookClaim = async (
  supabase: SupabaseClient,
  eventId: string,
  source: 'stripe' | 'revenuecat',
): Promise<void> => {
  const { error } = await supabase
    .from('webhook_events')
    .delete()
    .eq('event_id', eventId)
    .eq('source', source);

  if (error) {
    console.error('releaseWebhookClaim error:', error);
  }
};

export const markEventProcessed = async (
  supabase: SupabaseClient,
  eventId: string,
  source: 'stripe' | 'revenuecat',
  eventType: string,
): Promise<void> => {
  const { error } = await supabase
    .from('webhook_events')
    .upsert(
      {
        event_id: eventId,
        source,
        event_type: eventType,
        processed_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,source' },
    );

  if (error) {
    console.error('markEventProcessed error:', error);
  }
};

export const logWebhookEvent = async (
  supabase: SupabaseClient,
  event: {
    source: 'stripe' | 'revenuecat';
    eventId: string;
    eventType: string;
    payload: unknown;
    status: 'received' | 'processed' | 'failed';
    errorMessage?: string;
  },
): Promise<void> => {
  const { error } = await supabase.from('webhook_event_logs').insert({
    source: event.source,
    event_id: event.eventId,
    event_type: event.eventType,
    payload: event.payload,
    status: event.status,
    error_message: event.errorMessage ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('logWebhookEvent error:', error);
  }
};

export type WebhookSubscriptionUpdate = {
  userId: string;
  status: 'free' | 'trial' | 'active' | 'expired' | 'cancelled' | 'grace_period';
  plan: 'free' | 'monthly' | 'annual' | 'annual_intro';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  cancelledAt?: string;
};

export const updateSubscriptionFromWebhook = async (
  supabase: SupabaseClient,
  update: WebhookSubscriptionUpdate,
): Promise<void> => {
  const record: Record<string, unknown> = {
    user_id: update.userId,
    status: update.status,
    plan_type: update.plan,
    updated_at: new Date().toISOString(),
  };

  if (update.currentPeriodStart !== undefined) {
    record['current_period_start'] = update.currentPeriodStart;
  }
  if (update.currentPeriodEnd !== undefined) {
    record['current_period_end'] = update.currentPeriodEnd;
  }
  if (update.trialEnd !== undefined) {
    record['trial_end'] = update.trialEnd;
  }
  if (update.cancelledAt !== undefined) {
    record['cancelled_at'] = update.cancelledAt;
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert(record, { onConflict: 'user_id' });

  if (error) {
    console.error('updateSubscriptionFromWebhook error:', error);
    throw error;
  }
};

export const webhookErrorResponse = (
  message: string,
  status: number = 400,
  corsHeadersArg: Record<string, string> = {},
): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeadersArg,
      'Content-Type': 'application/json',
    },
  });
};

export const webhookSuccessResponse = (
  data?: unknown,
  corsHeadersArg: Record<string, string> = {},
): Response => {
  return new Response(JSON.stringify(data ?? { success: true }), {
    status: 200,
    headers: {
      ...corsHeadersArg,
      'Content-Type': 'application/json',
    },
  });
};
