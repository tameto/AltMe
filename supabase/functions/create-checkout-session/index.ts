import Stripe from 'npm:stripe';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSupabaseClient, createServiceClient } from '../_shared/supabase.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const MONTHLY_PRICE_ID = Deno.env.get('STRIPE_MONTHLY_PRICE_ID');
const YEARLY_PRICE_ID = Deno.env.get('STRIPE_YEARLY_PRICE_ID');

if (!MONTHLY_PRICE_ID || !YEARLY_PRICE_ID) {
  console.error('STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID must be configured');
  Deno.exit(1);
}

/** planType → Stripe priceId マッピング */
const PLAN_TO_PRICE: Record<string, string> = {
  monthly: MONTHLY_PRICE_ID,
  annual: YEARLY_PRICE_ID,
};

/** 許可された priceId のセット（不正な priceId は拒否） */
const ALLOWED_PRICE_IDS = new Set([MONTHLY_PRICE_ID, YEARLY_PRICE_ID]);

const APP_BASE_URL = Deno.env.get('APP_BASE_URL') ?? 'https://app.altme.jp';

Deno.serve(async (req: Request) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  try {
    // 1. JWT 認証チェック
    const supabase = createSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. リクエストボディ検証
    // フロントエンドは planType ('monthly' | 'annual') または priceId を送信
    const body = await req.json();
    let priceId: string;

    if (body.planType && typeof body.planType === 'string') {
      // planType → priceId 解決
      const resolved = PLAN_TO_PRICE[body.planType];
      if (!resolved) {
        return new Response(
          JSON.stringify({ error: 'invalid_plan_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      priceId = resolved;
    } else if (body.priceId && typeof body.priceId === 'string') {
      // 後方互換: priceId 直接指定
      priceId = body.priceId;
    } else {
      return new Response(
        JSON.stringify({ error: 'plan_type_or_price_id_required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 不正な priceId を拒否
    if (!ALLOWED_PRICE_IDS.has(priceId)) {
      return new Response(
        JSON.stringify({ error: 'invalid_price_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. 既存の stripe_customer_id を取得（再利用）
    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('stripe_customer_id, display_name, email')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id as string | undefined;

    // Customer が未存在の場合は新規作成
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        name: profile?.display_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // stripe_customer_id を profiles に保存
      const { error: saveError } = await serviceClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (saveError) {
        console.error(`Failed to save stripe_customer_id for user ${user.id}:`, saveError);
        // Continue with checkout - customer ID is still valid for this session
      }
    }

    // 4. Checkout セッション作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/payment/cancel`,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('create-checkout-session error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
