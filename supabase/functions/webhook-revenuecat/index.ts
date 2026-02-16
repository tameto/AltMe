import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';

const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify webhook authenticity
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const event = await req.json();
    const supabase = createServiceClient();

    const appUserId = event.app_user_id;
    const eventType = event.type;

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
        // Credit pack purchase
        const creditAmount = detectCreditAmount(event.product_id);
        if (creditAmount > 0) {
          // Add credits
          const { data: currentCredits } = await supabase
            .from('credits')
            .select('balance')
            .eq('user_id', appUserId)
            .single();

          const newBalance = (currentCredits?.balance ?? 0) + creditAmount;

          await supabase
            .from('credits')
            .upsert({
              user_id: appUserId,
              balance: newBalance,
            }, { onConflict: 'user_id' });

          // Record transaction
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: appUserId,
              amount: creditAmount,
              type: 'purchase',
              description: `Credit pack: ${event.product_id}`,
            });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
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
  if (productId.includes('intro')) return 'intro_annual';
  if (productId.includes('annual') || productId.includes('yearly')) return 'annual';
  if (productId.includes('monthly')) return 'monthly';
  return null;
}

function detectCreditAmount(productId: string): number {
  if (!productId) return 0;
  if (productId.includes('500') || productId.includes('large')) return 500;
  if (productId.includes('150') || productId.includes('medium')) return 150;
  if (productId.includes('50') || productId.includes('small')) return 50;
  return 0;
}
