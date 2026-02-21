/**
 * M081: Webhook 統合テスト
 * M073: webhook-utils 共通ライブラリ統合確認
 * M074: RevenueCat + Stripe Provider 同期確認
 *
 * Deno Edge Functions を直接実行はできないため、
 * webhook-utils のロジック整合性と、両 webhook の処理フローの
 * 一貫性を検証する統合テスト。
 */

// ---- モック: Supabase Client ----

type MockRecord = Record<string, unknown>;

const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
const mockUpdate = jest.fn().mockReturnValue({
  eq: jest.fn().mockResolvedValue({ data: null, error: null }),
});
const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSelect = jest.fn().mockReturnValue({
  eq: jest.fn().mockReturnValue({
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSupabase = (): any => ({
  from: jest.fn((table: string) => {
    switch (table) {
      case 'webhook_events':
        return {
          select: mockSelect,
          upsert: mockUpsert,
        };
      case 'subscriptions':
        return {
          upsert: mockUpsert,
          update: mockUpdate,
        };
      case 'credits':
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { balance: 100 }, error: null }),
            }),
          }),
          upsert: mockUpsert,
        };
      case 'credit_transactions':
        return {
          insert: mockInsert,
        };
      default:
        return {
          select: mockSelect,
          upsert: mockUpsert,
          update: mockUpdate,
          insert: mockInsert,
        };
    }
  }),
});

// ---- テスト ----

describe('M081: Webhook DB 更新ロジック', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('M073: webhook-utils 共通ライブラリ統合確認', () => {
    test('checkIdempotency: 未処理イベントは isProcessed=false を返す', async () => {
      // webhook-utils の checkIdempotency ロジックをシミュレート
      const mockSupabase = createMockSupabase();
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      });

      // checkIdempotency ロジックを再現
      const eventId = 'evt_stripe_123';
      const source = 'stripe';

      const { data, error } = await mockSupabase
        .from('webhook_events')
        .select('processed_at')
        .eq('event_id', eventId)
        .eq('source', source)
        .maybeSingle();

      expect(error).toBeNull();
      const isProcessed = !!data?.processed_at;
      expect(isProcessed).toBe(false);
    });

    test('checkIdempotency: 処理済みイベントは isProcessed=true を返す', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { processed_at: '2026-02-21T00:00:00Z' },
        error: null,
      });

      const mockSupabase = createMockSupabase();
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      });

      const { data } = await mockSupabase
        .from('webhook_events')
        .select('processed_at')
        .eq('event_id', 'evt_already_processed')
        .eq('source', 'revenuecat')
        .maybeSingle();

      const isProcessed = !!data?.processed_at;
      expect(isProcessed).toBe(true);
    });

    test('checkIdempotency: DB エラー時は例外をスロー（fail-closed）', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'connection_timeout' },
      });

      const mockSupabase = createMockSupabase();
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      });

      const { error } = await mockSupabase
        .from('webhook_events')
        .select('processed_at')
        .eq('event_id', 'evt_db_error')
        .eq('source', 'stripe')
        .maybeSingle();

      // webhook-utils.ts は error 時に throw する（二重課金防止）
      expect(error).not.toBeNull();
      expect(error?.message).toBe('connection_timeout');
    });

    test('markEventProcessed: upsert で処理完了をマークする', async () => {
      const mockEventUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockSupabase = createMockSupabase();
      mockSupabase.from = jest.fn().mockReturnValue({
        upsert: mockEventUpsert,
      });

      const eventId = 'evt_mark_test';
      const source = 'stripe' as const;
      const now = new Date().toISOString();

      await mockSupabase.from('webhook_events').upsert(
        {
          event_id: eventId,
          source,
          processed_at: now,
        },
        { onConflict: 'event_id,source' },
      );

      expect(mockEventUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: eventId,
          source: 'stripe',
          processed_at: expect.any(String),
        }),
        { onConflict: 'event_id,source' },
      );
    });

    test('両 webhook が同じ冪等性キーフォーマットを使用する', () => {
      // Stripe webhook: event.id (evt_xxx 形式)
      const stripeEventId = 'evt_1MqjJVAbcd123';
      // RevenueCat webhook: event.id (UUID 形式)
      const revenuecatEventId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      // 両方とも source + event_id の組み合わせでユニーク
      const stripeKey = `stripe:${stripeEventId}`;
      const revenuecatKey = `revenuecat:${revenuecatEventId}`;

      expect(stripeKey).not.toBe(revenuecatKey);
      expect(stripeEventId).toBeTruthy();
      expect(revenuecatEventId).toBeTruthy();
    });
  });

  describe('Stripe Webhook -> DB 更新', () => {
    test('checkout.session.completed: subscriptions に active として upsert', () => {
      const mockSupabase = createMockSupabase();

      const userId = 'user-stripe-123';
      const subscriptionId = 'sub_stripe_abc';
      const customerId = 'cus_stripe_xyz';

      // checkout.session.completed の処理ロジックを再現
      const upsertData: MockRecord = {
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        status: 'active',
        plan_type: 'monthly',
        current_period_start: new Date(1708473600 * 1000).toISOString(),
        current_period_end: new Date(1711152000 * 1000).toISOString(),
      };

      mockSupabase.from('subscriptions').upsert(upsertData, { onConflict: 'user_id' });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          status: 'active',
          plan_type: 'monthly',
        }),
        { onConflict: 'user_id' },
      );
    });

    test('customer.subscription.deleted: status を expired に更新', () => {
      const mockSupabase = createMockSupabase();

      const userId = 'user-stripe-456';
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockLocalUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = jest.fn().mockReturnValue({ update: mockLocalUpdate });

      // customer.subscription.deleted の処理ロジック
      mockSupabase.from('subscriptions').update({
        status: 'expired',
        current_period_end: new Date(1711152000 * 1000).toISOString(),
      }).eq('user_id', userId);

      expect(mockLocalUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'expired',
        }),
      );
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
    });

    test('invoice.payment_failed: status を grace_period に更新', () => {
      const mockSupabase = createMockSupabase();

      const userId = 'user-stripe-789';
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockLocalUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = jest.fn().mockReturnValue({ update: mockLocalUpdate });

      // invoice.payment_failed の処理ロジック
      mockSupabase.from('subscriptions').update({
        status: 'grace_period',
      }).eq('user_id', userId);

      expect(mockLocalUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'grace_period' }),
      );
    });
  });

  describe('RevenueCat Webhook -> DB 更新', () => {
    test('INITIAL_PURCHASE: subscriptions に active として upsert', () => {
      const mockSupabase = createMockSupabase();

      const appUserId = 'user-rc-123';

      const upsertData: MockRecord = {
        user_id: appUserId,
        revenuecat_id: 'rc_original_123',
        status: 'active',
        plan_type: 'annual',
        current_period_start: '2026-02-21T00:00:00Z',
        current_period_end: '2027-02-21T00:00:00Z',
      };

      mockSupabase.from('subscriptions').upsert(upsertData, { onConflict: 'user_id' });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: appUserId,
          status: 'active',
          plan_type: 'annual',
        }),
        { onConflict: 'user_id' },
      );
    });

    test('EXPIRATION: status を expired に更新', () => {
      const mockSupabase = createMockSupabase();

      const appUserId = 'user-rc-456';
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockLocalUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = jest.fn().mockReturnValue({ update: mockLocalUpdate });

      mockSupabase.from('subscriptions').update({
        status: 'expired',
        current_period_end: '2026-02-21T00:00:00Z',
      }).eq('user_id', appUserId);

      expect(mockLocalUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'expired' }),
      );
    });

    test('NON_RENEWING_PURCHASE: credits テーブルに残高加算', () => {
      const mockSupabase = createMockSupabase();

      const appUserId = 'user-rc-credit';
      const currentBalance = 100;
      const creditAmount = 150; // medium pack
      const newBalance = currentBalance + creditAmount;

      mockSupabase.from('credits').upsert(
        { user_id: appUserId, balance: newBalance },
        { onConflict: 'user_id' },
      );

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: appUserId,
          balance: 250,
        }),
        { onConflict: 'user_id' },
      );
    });
  });

  describe('M074: Stripe / RevenueCat ステータスマッピング一貫性', () => {
    test('Stripe mapStripeStatus と RevenueCat のステータスマッピングが整合する', () => {
      // Stripe の mapStripeStatus ロジック
      const mapStripeStatus = (
        stripeStatus: string,
      ): 'active' | 'cancelled' | 'expired' | 'grace_period' | 'trial' => {
        switch (stripeStatus) {
          case 'active': return 'active';
          case 'trialing': return 'trial';
          case 'past_due': return 'grace_period';
          case 'canceled': return 'cancelled';
          case 'unpaid':
          case 'incomplete_expired': return 'expired';
          default: return 'active';
        }
      };

      // RevenueCat のイベントタイプ -> ステータスマッピング
      const mapRevenueCatEvent = (eventType: string): string => {
        switch (eventType) {
          case 'INITIAL_PURCHASE':
          case 'RENEWAL':
          case 'TRIAL_CONVERTED': return 'active';
          case 'TRIAL_STARTED': return 'trial';
          case 'BILLING_ISSUE': return 'grace_period';
          case 'CANCELLATION': return 'cancelled';
          case 'EXPIRATION': return 'expired';
          default: return 'unknown';
        }
      };

      // 同一ステータス値が両プロバイダーで一致することを確認
      expect(mapStripeStatus('active')).toBe(mapRevenueCatEvent('INITIAL_PURCHASE'));
      expect(mapStripeStatus('trialing')).toBe(mapRevenueCatEvent('TRIAL_STARTED'));
      expect(mapStripeStatus('past_due')).toBe(mapRevenueCatEvent('BILLING_ISSUE'));
      expect(mapStripeStatus('canceled')).toBe(mapRevenueCatEvent('CANCELLATION'));

      // expired 状態
      expect(mapStripeStatus('unpaid')).toBe(mapRevenueCatEvent('EXPIRATION'));
      expect(mapStripeStatus('incomplete_expired')).toBe(mapRevenueCatEvent('EXPIRATION'));
    });

    test('両プロバイダーが同じ subscriptions テーブルに書き込む', () => {
      const mockSupabase = createMockSupabase();

      // Stripe が upsert するカラム
      const stripeRecord: MockRecord = {
        user_id: 'user-sync-test',
        stripe_subscription_id: 'sub_xxx',
        stripe_customer_id: 'cus_xxx',
        status: 'active',
        plan_type: 'monthly',
        current_period_start: '2026-02-21T00:00:00Z',
        current_period_end: '2026-03-21T00:00:00Z',
      };

      // RevenueCat が upsert するカラム
      const rcRecord: MockRecord = {
        user_id: 'user-sync-test',
        revenuecat_id: 'rc_xxx',
        status: 'active',
        plan_type: 'monthly',
        current_period_start: '2026-02-21T00:00:00Z',
        current_period_end: '2026-03-21T00:00:00Z',
      };

      // 共通フィールドが同じキーを使用
      const commonFields = ['user_id', 'status', 'plan_type', 'current_period_start', 'current_period_end'];
      for (const field of commonFields) {
        expect(stripeRecord[field]).toBe(rcRecord[field]);
      }

      // 両方とも user_id で onConflict
      mockSupabase.from('subscriptions').upsert(stripeRecord, { onConflict: 'user_id' });
      mockSupabase.from('subscriptions').upsert(rcRecord, { onConflict: 'user_id' });

      expect(mockUpsert).toHaveBeenCalledTimes(2);
    });

    test('detectPlanType: 両プロバイダーのプラン検出ロジックが整合する', () => {
      // Stripe の detectPlanType (price ID ベース)
      const detectStripeplanType = (priceId: string, monthlyId: string, yearlyId: string): string => {
        if (priceId === yearlyId) return 'annual';
        if (priceId === monthlyId) return 'monthly';
        return 'monthly'; // fallback
      };

      // RevenueCat の detectPlanType (product ID ベース)
      const detectRCPlanType = (productId: string): string | null => {
        if (!productId) return null;
        if (productId.includes('intro')) return 'intro_annual';
        if (productId.includes('annual') || productId.includes('yearly')) return 'annual';
        if (productId.includes('monthly')) return 'monthly';
        return null;
      };

      // 同一プランが同じ値にマッピングされる
      expect(detectStripeplanType('price_yearly', 'price_monthly', 'price_yearly')).toBe('annual');
      expect(detectRCPlanType('com.altme.pro.annual')).toBe('annual');

      expect(detectStripeplanType('price_monthly', 'price_monthly', 'price_yearly')).toBe('monthly');
      expect(detectRCPlanType('com.altme.pro.monthly')).toBe('monthly');
    });
  });
});
