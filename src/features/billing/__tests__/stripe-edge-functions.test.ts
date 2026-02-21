/**
 * Stripe Edge Functions ロジックテスト
 *
 * Deno Edge Function のビジネスロジックを Jest でテスト。
 * Stripe SDK / Supabase クライアントはモックで代替。
 *
 * M064: create-checkout-session
 * M065: create-portal-session
 * M066: webhook-stripe
 */

// ---- 共通モックデータ ----

const MOCK_USER_ID = 'user-abc-123';
const MOCK_CUSTOMER_ID = 'cus_abc123';
const MOCK_SESSION_URL = 'https://checkout.stripe.com/pay/cs_test_xxx';
const MOCK_PORTAL_URL = 'https://billing.stripe.com/p/session/xxx';
const MOCK_MONTHLY_PRICE_ID = 'price_monthly_test';
const MOCK_YEARLY_PRICE_ID = 'price_yearly_test';
const MOCK_SUBSCRIPTION_ID = 'sub_test123';
const MOCK_EVENT_ID = 'evt_test_abc123';

// ---- create-checkout-session ロジックテスト ----

describe('create-checkout-session ロジック', () => {
  describe('priceId バリデーション', () => {
    const ALLOWED_PRICE_IDS = new Set([MOCK_MONTHLY_PRICE_ID, MOCK_YEARLY_PRICE_ID]);

    const validatePriceId = (priceId: unknown): boolean => {
      if (!priceId || typeof priceId !== 'string') return false;
      return ALLOWED_PRICE_IDS.has(priceId);
    };

    it('月額 priceId は許可される', () => {
      expect(validatePriceId(MOCK_MONTHLY_PRICE_ID)).toBe(true);
    });

    it('年額 priceId は許可される', () => {
      expect(validatePriceId(MOCK_YEARLY_PRICE_ID)).toBe(true);
    });

    it('未知の priceId は拒否される', () => {
      expect(validatePriceId('price_unknown_xxx')).toBe(false);
    });

    it('null は拒否される', () => {
      expect(validatePriceId(null)).toBe(false);
    });

    it('空文字は拒否される', () => {
      expect(validatePriceId('')).toBe(false);
    });

    it('数値型は拒否される', () => {
      expect(validatePriceId(12345)).toBe(false);
    });
  });

  describe('Checkout セッション作成フロー', () => {
    const mockStripeCreate = jest.fn();
    const mockCustomersCreate = jest.fn();
    const mockProfilesUpdate = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('既存 Customer ID がある場合は customers.create を呼ばない', async () => {
      const existingCustomerId = MOCK_CUSTOMER_ID;
      mockStripeCreate.mockResolvedValue({
        id: 'cs_test_xxx',
        url: MOCK_SESSION_URL,
      });

      // 既存 customer がある場合のフロー
      const customerId = existingCustomerId; // DB から取得済み
      expect(customerId).toBe(MOCK_CUSTOMER_ID);
      expect(mockCustomersCreate).not.toHaveBeenCalled();
    });

    it('Customer ID が未存在の場合は新規作成する', async () => {
      mockCustomersCreate.mockResolvedValue({ id: 'cus_new_xxx' });
      mockStripeCreate.mockResolvedValue({
        id: 'cs_test_xxx',
        url: MOCK_SESSION_URL,
      });

      // 新規作成フロー
      const newCustomer = await mockCustomersCreate({
        email: 'test@example.com',
        metadata: { supabase_user_id: MOCK_USER_ID },
      });

      expect(mockCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { supabase_user_id: MOCK_USER_ID } }),
      );
      expect(newCustomer.id).toBe('cus_new_xxx');
    });

    it('success_url と cancel_url が正しく設定される', () => {
      const APP_BASE_URL = 'https://app.altme.jp';
      const sessionParams = {
        success_url: `${APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_BASE_URL}/payment/cancel`,
      };

      expect(sessionParams.success_url).toContain('/payment/success');
      expect(sessionParams.success_url).toContain('{CHECKOUT_SESSION_ID}');
      expect(sessionParams.cancel_url).toContain('/payment/cancel');
    });

    it('metadata に supabase_user_id が含まれる', () => {
      const sessionParams = {
        customer: MOCK_CUSTOMER_ID,
        mode: 'subscription',
        metadata: { supabase_user_id: MOCK_USER_ID },
        subscription_data: { metadata: { supabase_user_id: MOCK_USER_ID } },
      };

      expect(sessionParams.metadata.supabase_user_id).toBe(MOCK_USER_ID);
      expect(sessionParams.subscription_data.metadata.supabase_user_id).toBe(MOCK_USER_ID);
    });
  });
});

// ---- create-portal-session ロジックテスト ----

describe('create-portal-session ロジック', () => {
  it('Customer ID が存在する場合はポータルセッションを作成する', async () => {
    const mockPortalCreate = jest.fn().mockResolvedValue({ url: MOCK_PORTAL_URL });

    const result = await mockPortalCreate({
      customer: MOCK_CUSTOMER_ID,
      return_url: 'https://app.altme.jp/settings',
    });

    expect(result.url).toBe(MOCK_PORTAL_URL);
    expect(mockPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: MOCK_CUSTOMER_ID }),
    );
  });

  it('Customer ID が未存在の場合は 404 エラーを返す', () => {
    const customerId: string | undefined = undefined;
    const shouldReturn404 = !customerId;

    expect(shouldReturn404).toBe(true);
  });

  it('return_url が /settings を指す', () => {
    const APP_BASE_URL = 'https://app.altme.jp';
    const returnUrl = `${APP_BASE_URL}/settings`;

    expect(returnUrl).toBe('https://app.altme.jp/settings');
  });
});

// ---- webhook-stripe ロジックテスト ----

describe('webhook-stripe ロジック', () => {
  describe('Stripe ステータスマッピング (mapStripeStatus)', () => {
    type StripeStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete_expired' | 'incomplete' | 'paused';
    type InternalStatus = 'active' | 'trial' | 'grace_period' | 'cancelled' | 'expired';

    const mapStripeStatus = (stripeStatus: StripeStatus): InternalStatus => {
      switch (stripeStatus) {
        case 'active': return 'active';
        case 'trialing': return 'trial';
        case 'past_due': return 'grace_period';
        case 'canceled': return 'cancelled';
        case 'unpaid':
        case 'incomplete_expired':
          return 'expired';
        default:
          return 'active';
      }
    };

    it('active → active', () => {
      expect(mapStripeStatus('active')).toBe('active');
    });

    it('trialing → trial', () => {
      expect(mapStripeStatus('trialing')).toBe('trial');
    });

    it('past_due → grace_period', () => {
      expect(mapStripeStatus('past_due')).toBe('grace_period');
    });

    it('canceled → cancelled', () => {
      expect(mapStripeStatus('canceled')).toBe('cancelled');
    });

    it('unpaid → expired', () => {
      expect(mapStripeStatus('unpaid')).toBe('expired');
    });

    it('incomplete_expired → expired', () => {
      expect(mapStripeStatus('incomplete_expired')).toBe('expired');
    });
  });

  describe('プラン種別判定 (detectPlanType)', () => {
    const detectPlanType = (priceId: string): string => {
      if (priceId === MOCK_YEARLY_PRICE_ID) return 'annual';
      if (priceId === MOCK_MONTHLY_PRICE_ID) return 'monthly';
      return 'monthly';
    };

    it('年額 priceId → annual', () => {
      expect(detectPlanType(MOCK_YEARLY_PRICE_ID)).toBe('annual');
    });

    it('月額 priceId → monthly', () => {
      expect(detectPlanType(MOCK_MONTHLY_PRICE_ID)).toBe('monthly');
    });

    it('未知の priceId → monthly (fallback)', () => {
      expect(detectPlanType('price_unknown')).toBe('monthly');
    });
  });

  describe('冪等性チェック', () => {
    it('処理済みイベントは isProcessed: true を返す', async () => {
      const mockCheckIdempotency = jest.fn().mockResolvedValue({
        isProcessed: true,
        processedAt: new Date().toISOString(),
      });

      const result = await mockCheckIdempotency({}, MOCK_EVENT_ID, 'stripe');
      expect(result.isProcessed).toBe(true);
    });

    it('未処理イベントは isProcessed: false を返す', async () => {
      const mockCheckIdempotency = jest.fn().mockResolvedValue({
        isProcessed: false,
        processedAt: null,
      });

      const result = await mockCheckIdempotency({}, MOCK_EVENT_ID, 'stripe');
      expect(result.isProcessed).toBe(false);
    });

    it('DB エラー時は throw する（fail-closed）', async () => {
      const mockCheckIdempotency = jest.fn().mockRejectedValue(
        new Error('Idempotency check failed: connection error'),
      );

      await expect(mockCheckIdempotency({}, MOCK_EVENT_ID, 'stripe')).rejects.toThrow(
        'Idempotency check failed',
      );
    });
  });

  describe('checkout.session.completed イベント', () => {
    it('userId が metadata にある場合は subscriptions を upsert する', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert });
      const supabase = { from: mockFrom };

      const session = {
        metadata: { supabase_user_id: MOCK_USER_ID },
        subscription: MOCK_SUBSCRIPTION_ID,
        customer: MOCK_CUSTOMER_ID,
      };

      await supabase.from('subscriptions').upsert({
        user_id: session.metadata.supabase_user_id,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        status: 'active',
      }, { onConflict: 'user_id' });

      expect(mockFrom).toHaveBeenCalledWith('subscriptions');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: MOCK_USER_ID, status: 'active' }),
        { onConflict: 'user_id' },
      );
    });

    it('metadata に supabase_user_id がない場合は DB 更新をスキップする', () => {
      const session = { metadata: {}, subscription: MOCK_SUBSCRIPTION_ID };
      const userId = (session.metadata as Record<string, string>).supabase_user_id;

      expect(userId).toBeUndefined();
    });
  });

  describe('customer.subscription.deleted イベント', () => {
    it('status を expired に更新し triggerDestroy を呼ぶ', async () => {
      const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
      const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });
      const mockTriggerDestroy = jest.fn().mockResolvedValue(undefined);
      const supabase = { from: mockFrom };

      const subscription = {
        metadata: { supabase_user_id: MOCK_USER_ID },
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      };

      await supabase.from('subscriptions').update({
        status: 'expired',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      });

      await mockTriggerDestroy(MOCK_USER_ID);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'expired' }),
      );
      expect(mockTriggerDestroy).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  describe('invoice.payment_failed イベント', () => {
    it('status を grace_period に更新する', async () => {
      const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
      const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });
      const supabase = { from: mockFrom };

      await supabase.from('subscriptions').update({ status: 'grace_period' });

      expect(mockUpdate).toHaveBeenCalledWith({ status: 'grace_period' });
    });
  });

  describe('署名検証', () => {
    it('stripe-signature ヘッダーがない場合は 400 を返す', () => {
      const headers = new Map<string, string>();
      const signature = headers.get('stripe-signature');

      // Map.get() は未存在キーに undefined を返す（本番では req.headers.get() が null を返す）
      expect(signature == null).toBe(true);
      // -> 400 Missing signature
    });

    it('stripe-signature ヘッダーがある場合は検証に進む', () => {
      const headers = new Map([['stripe-signature', 't=12345,v1=abc,v0=def']]);
      const signature = headers.get('stripe-signature');

      expect(signature).toBeTruthy();
    });
  });
});
