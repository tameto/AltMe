import Stripe from 'npm:stripe';
import { createServiceClient } from '../_shared/supabase.ts';

/**
 * Stripe Checkout セッション reconciliation
 *
 * 未完了（expired）の Checkout セッションを検出し、
 * 対応する subscriptions レコードが誤ったステータスで残っていないか確認して修正する。
 *
 * Trigger: cron（毎時）または管理者による手動呼び出し
 * Auth: service_role のみ（INTERNAL_FUNCTION_TOKEN で検証）
 */

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const INTERNAL_TOKEN = Deno.env.get('INTERNAL_FUNCTION_TOKEN') ?? '';

Deno.serve(async (req: Request) => {
  // 内部呼び出しのみ許可
  const authHeader = req.headers.get('Authorization');
  if (!INTERNAL_TOKEN || authHeader !== `Bearer ${INTERNAL_TOKEN}`) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const supabase = createServiceClient();
  const results = { checked: 0, fixed: 0, errors: 0 };

  try {
    // 1. Stripe で直近24時間の expired セッションを取得
    const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: oneDayAgo },
    });

    for (const session of sessions.data) {
      if (session.status !== 'expired') continue;

      const userId = session.metadata?.supabase_user_id;
      if (!userId) continue;

      results.checked++;

      try {
        // 2. DB 上のサブスクリプション状態を確認
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', userId)
          .single();

        // セッションが expired なのに active になっていれば修正
        // （checkout.session.completed webhook が届かなかったケース）
        if (!sub) {
          // サブスクリプションレコードが存在しない → 正常（未決済）
          continue;
        }

        // Stripe の実際のサブスクリプション状態を確認
        if (session.subscription) {
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);

          const expectedStatus = stripeSub.status === 'active' ? 'active'
            : stripeSub.status === 'canceled' ? 'cancelled'
            : stripeSub.status === 'past_due' ? 'grace_period'
            : 'expired';

          if (sub.status !== expectedStatus) {
            await supabase
              .from('subscriptions')
              .update({ status: expectedStatus })
              .eq('user_id', userId);

            console.log(`reconcile-stripe: fixed user ${userId} status ${sub.status} → ${expectedStatus}`);
            results.fixed++;
          }
        }
      } catch (err) {
        console.error(`reconcile-stripe: error for session ${session.id}:`, err);
        results.errors++;
      }
    }

    console.log('reconcile-stripe complete:', results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('reconcile-stripe error:', error);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
  }
});
