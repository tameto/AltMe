import Stripe from 'npm:stripe';
import { createServiceClient } from '../_shared/supabase.ts';
import { claimWebhookEvent, markEventProcessed, releaseWebhookClaim } from '../_shared/webhook-utils.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

// webhook はサーバー→サーバー通信なので CORS 不要

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
  }

  // Webhook secret 未設定時は安全に拒否（fail-closed）
  if (!WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return new Response(JSON.stringify({ error: 'server_misconfiguration' }), { status: 500 });
  }

  // 1. Stripe 署名検証
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'missing_signature' }), { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 400 });
  }

  const supabase = createServiceClient();

  // 2. 原子的冪等性チェック（UNIQUE 制約で二重処理を防止）
  const { claimed } = await claimWebhookEvent(supabase, event.id, 'stripe', event.type);
  if (!claimed) {
    return new Response(JSON.stringify({ message: 'Already claimed' }), { status: 200 });
  }

  console.log(`Stripe webhook: ${event.type} (${event.id})`);

  try {
    // 3. イベント処理
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          console.error('checkout.session.completed: missing supabase_user_id in metadata');
          break;
        }

        // サブスクリプション情報を取得して DB を更新
        const subscriptionId = session.subscription as string;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const planType = detectPlanType(subscription);

          const status = mapStripeStatus(subscription.status);

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            status,
            plan_type: planType,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, { onConflict: 'user_id' });

          // OpenClaw プロビジョニングをトリガー
          await triggerProvision(userId);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          console.error('invoice.paid: missing supabase_user_id in subscription metadata');
          break;
        }

        await supabase.from('subscriptions').update({
          status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('user_id', userId);

        // 停止されていた場合は再プロビジョニング
        await triggerProvision(userId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          console.error('invoice.payment_failed: missing supabase_user_id in subscription metadata');
          break;
        }

        await supabase.from('subscriptions').update({
          status: 'grace_period',
        }).eq('user_id', userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          console.error('customer.subscription.deleted: missing supabase_user_id in subscription metadata');
          break;
        }

        await supabase.from('subscriptions').update({
          status: 'expired',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('user_id', userId);

        // OpenClaw インスタンスを停止
        await triggerDestroy(userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          console.error('customer.subscription.updated: missing supabase_user_id in subscription metadata');
          break;
        }

        const planType = detectPlanType(subscription);
        const status = mapStripeStatus(subscription.status);

        await supabase.from('subscriptions').update({
          status,
          plan_type: planType,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('user_id', userId);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    // 4. 処理完了をマーク
    await markEventProcessed(supabase, event.id, 'stripe', event.type);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Stripe webhook handler error for ${event.type}:`, error);
    // 処理失敗時はクレームを解放してStripeの再試行を受け入れる
    await releaseWebhookClaim(supabase, event.id, 'stripe');
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
  }
});

// -- ヘルパー関数 --

function detectPlanType(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price?.id ?? '';
  const monthlyPriceId = Deno.env.get('STRIPE_MONTHLY_PRICE_ID') ?? '';
  const yearlyPriceId = Deno.env.get('STRIPE_YEARLY_PRICE_ID') ?? '';

  if (priceId === yearlyPriceId) return 'annual';
  if (priceId === monthlyPriceId) return 'monthly';
  return 'monthly'; // fallback
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status,
): 'active' | 'cancelled' | 'expired' | 'grace_period' | 'trial' {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trial';
    case 'past_due':
      return 'grace_period';
    case 'canceled':
      return 'cancelled';
    case 'unpaid':
    case 'incomplete_expired':
      return 'expired';
    case 'incomplete':
    case 'paused':
      return 'expired';
    default:
      return 'expired';
  }
}

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
      console.error(`provision-openclaw failed for ${userId}: ${res.status}`);
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
      console.error(`destroy-openclaw failed for ${userId}: ${res.status}`);
    } else {
      console.log(`destroy-openclaw triggered for ${userId}`);
    }
  } catch (err) {
    console.error(`Failed to trigger destroy-openclaw for ${userId}:`, err);
  }
}
