import { createServiceClient } from '../_shared/supabase.ts';
import { claimWebhookEvent, markEventProcessed, releaseWebhookClaim } from '../_shared/webhook-utils.ts';

const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

// webhook はサーバー→サーバー通信なので CORS 不要

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
  }

  // Webhook secret 未設定時は安全に拒否（fail-closed）
  if (!WEBHOOK_SECRET) {
    console.error('REVENUECAT_WEBHOOK_SECRET is not configured');
    return new Response(
      JSON.stringify({ error: 'server_misconfiguration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    // Verify webhook authenticity
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const event = await req.json();
    const supabase = createServiceClient();

    const eventType = event.type;

    // 原子的冪等性チェック（UNIQUE 制約で二重処理を防止）
    const { claimed } = await claimWebhookEvent(supabase, event.id, 'revenuecat', eventType);
    if (!claimed) {
      return new Response(
        JSON.stringify({ message: 'Already claimed' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const appUserId = event.app_user_id;

    console.log(`RevenueCat webhook: ${eventType} for user ${appUserId}`);

    switch (eventType) {
      case 'INITIAL_PURCHASE': {
        const planType = detectPlanType(event.product_id);
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: appUserId,
            revenuecat_id: event.original_app_user_id,
            status: 'active',
            plan_type: planType,
            current_period_start: event.purchase_date,
            current_period_end: event.expiration_date,
          }, { onConflict: 'user_id' });
        // Trigger OpenClaw provisioning
        await triggerProvision(appUserId);
        break;
      }

      case 'TRIAL_STARTED': {
        const planType = detectPlanType(event.product_id);
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: appUserId,
            revenuecat_id: event.original_app_user_id,
            status: 'trial',
            plan_type: planType,
            trial_start: event.purchase_date,
            trial_end: event.expiration_date,
          }, { onConflict: 'user_id' });
        // Trigger OpenClaw provisioning for trial users too
        await triggerProvision(appUserId);
        break;
      }

      case 'TRIAL_CONVERTED': {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: event.purchase_date,
            current_period_end: event.expiration_date,
          })
          .eq('user_id', appUserId);
        break;
      }

      case 'RENEWAL': {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: event.purchase_date,
            current_period_end: event.expiration_date,
          })
          .eq('user_id', appUserId);
        // Re-provision if instance was stopped
        await triggerProvision(appUserId);
        break;
      }

      case 'CANCELLATION': {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('user_id', appUserId);
        break;
      }

      case 'EXPIRATION': {
        await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            current_period_end: event.expiration_date,
          })
          .eq('user_id', appUserId);
        // Destroy OpenClaw instance
        await triggerDestroy(appUserId);
        break;
      }

      case 'BILLING_ISSUE': {
        await supabase
          .from('subscriptions')
          .update({ status: 'grace_period' })
          .eq('user_id', appUserId);
        break;
      }

      case 'NON_RENEWING_PURCHASE': {
        // Credit system was restructured to daily_remaining (not balance-based).
        // Credit pack purchases are not currently supported in the product.
        console.warn(
          `NON_RENEWING_PURCHASE received for ${appUserId} (product: ${event.product_id}). ` +
          'Credit packs are not currently supported - skipping.',
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // 処理完了をマーク（冪等性保証）
    await markEventProcessed(supabase, event.id, 'revenuecat', eventType);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Webhook error:', error);
    // 処理失敗時はクレームを解放してRevenueCatの再試行を受け入れる
    await releaseWebhookClaim(supabase, event.id, 'revenuecat');
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});

async function triggerProvision(userId: string): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const res = await fetch(`${supabaseUrl}/functions/v1/provision-openclaw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`provision-openclaw failed for ${userId}: ${res.status} ${body}`);
    } else {
      console.log(`provision-openclaw triggered for ${userId}`);
    }
  } catch (err) {
    console.error(`Failed to trigger provision-openclaw for ${userId}:`, err);
  }
}

async function triggerDestroy(userId: string): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const internalToken = Deno.env.get('INTERNAL_FUNCTION_TOKEN') ?? '';
    const res = await fetch(`${supabaseUrl}/functions/v1/destroy-openclaw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'x-internal-function-token': internalToken,
      },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`destroy-openclaw failed for ${userId}: ${res.status} ${body}`);
    } else {
      console.log(`destroy-openclaw triggered for ${userId}`);
    }
  } catch (err) {
    console.error(`Failed to trigger destroy-openclaw for ${userId}:`, err);
  }
}

function detectPlanType(productId: string): string | null {
  if (!productId) return null;
  if (productId.includes('intro')) return 'annual_intro';
  if (productId.includes('annual') || productId.includes('yearly')) return 'annual';
  if (productId.includes('monthly')) return 'monthly';
  return null;
}

