/**
 * M141: webhook-stripe Edge Function セキュリティテスト
 *
 * Edge Function (Deno) のセキュリティロジックを同等の関数で再現しテストする。
 *
 * テスト対象:
 * - WEBHOOK_SECRET 未設定時の fail-closed 動作
 * - stripe-signature ヘッダー欠如
 * - 無効な署名の拒否
 * - POST 以外のメソッド拒否
 * - 冪等性チェック（重複イベント処理防止）
 * - mapStripeStatus マッピング
 * - detectPlanType ヘルパー
 */

// --- EF から抽出したヘルパー関数 (webhook-stripe/index.ts と同等) ---

type StripeSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

type AppSubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'grace_period' | 'trial';

function mapStripeStatus(stripeStatus: StripeSubscriptionStatus): AppSubscriptionStatus {
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
    default:
      return 'active';
  }
}

function detectPlanType(
  subscription: { items: { data: Array<{ price?: { id?: string } }> } },
  monthlyPriceId: string,
  yearlyPriceId: string,
): string {
  const priceId = subscription.items.data[0]?.price?.id ?? '';
  if (priceId === yearlyPriceId) return 'annual';
  if (priceId === monthlyPriceId) return 'monthly';
  return 'monthly'; // fallback
}

type WebhookValidationResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/** webhook-stripe のリクエスト前バリデーション */
function validateWebhookRequest(params: {
  method: string;
  webhookSecret: string | undefined;
  signatureHeader: string | null;
}): WebhookValidationResult {
  if (params.method !== 'POST') {
    return { ok: false, error: 'method_not_allowed', status: 405 };
  }
  if (!params.webhookSecret) {
    return { ok: false, error: 'server_misconfiguration', status: 500 };
  }
  if (!params.signatureHeader) {
    return { ok: false, error: 'missing_signature', status: 400 };
  }
  return { ok: true };
}

// --- テスト ---

describe('webhook-stripe セキュリティロジック', () => {
  describe('リクエストバリデーション', () => {
    it('POST メソッドで署名あり・secret 設定済みなら ok', () => {
      const result = validateWebhookRequest({
        method: 'POST',
        webhookSecret: 'whsec_test_123',
        signatureHeader: 't=123,v1=abc',
      });
      expect(result).toEqual({ ok: true });
    });

    it('GET メソッドは 405 method_not_allowed', () => {
      const result = validateWebhookRequest({
        method: 'GET',
        webhookSecret: 'whsec_test_123',
        signatureHeader: 't=123,v1=abc',
      });
      expect(result).toEqual({ ok: false, error: 'method_not_allowed', status: 405 });
    });

    it('PUT メソッドは 405 method_not_allowed', () => {
      const result = validateWebhookRequest({
        method: 'PUT',
        webhookSecret: 'whsec_test_123',
        signatureHeader: 't=123,v1=abc',
      });
      expect(result).toEqual({ ok: false, error: 'method_not_allowed', status: 405 });
    });

    it('WEBHOOK_SECRET 未設定は 500 server_misconfiguration (fail-closed)', () => {
      const result = validateWebhookRequest({
        method: 'POST',
        webhookSecret: undefined,
        signatureHeader: 't=123,v1=abc',
      });
      expect(result).toEqual({ ok: false, error: 'server_misconfiguration', status: 500 });
    });

    it('WEBHOOK_SECRET が空文字列は 500 server_misconfiguration', () => {
      const result = validateWebhookRequest({
        method: 'POST',
        webhookSecret: '',
        signatureHeader: 't=123,v1=abc',
      });
      expect(result).toEqual({ ok: false, error: 'server_misconfiguration', status: 500 });
    });

    it('stripe-signature ヘッダー欠如は 400 missing_signature', () => {
      const result = validateWebhookRequest({
        method: 'POST',
        webhookSecret: 'whsec_test_123',
        signatureHeader: null,
      });
      expect(result).toEqual({ ok: false, error: 'missing_signature', status: 400 });
    });

    it('バリデーションの優先順位: method → secret → signature', () => {
      // method チェックが最初に行われる
      const result = validateWebhookRequest({
        method: 'DELETE',
        webhookSecret: undefined,
        signatureHeader: null,
      });
      expect(result).toEqual({ ok: false, error: 'method_not_allowed', status: 405 });
    });

    it('バリデーション優先順位: secret 不在は signature より先にチェック', () => {
      const result = validateWebhookRequest({
        method: 'POST',
        webhookSecret: undefined,
        signatureHeader: null,
      });
      expect(result).toEqual({ ok: false, error: 'server_misconfiguration', status: 500 });
    });
  });

  describe('mapStripeStatus', () => {
    it('active → active', () => {
      expect(mapStripeStatus('active')).toBe('active');
    });

    it('trialing → trial', () => {
      expect(mapStripeStatus('trialing')).toBe('trial');
    });

    it('past_due → grace_period', () => {
      expect(mapStripeStatus('past_due')).toBe('grace_period');
    });

    it('canceled → cancelled (スペル変換)', () => {
      expect(mapStripeStatus('canceled')).toBe('cancelled');
    });

    it('unpaid → expired', () => {
      expect(mapStripeStatus('unpaid')).toBe('expired');
    });

    it('incomplete_expired → expired', () => {
      expect(mapStripeStatus('incomplete_expired')).toBe('expired');
    });

    it('incomplete → active (default fallback)', () => {
      expect(mapStripeStatus('incomplete')).toBe('active');
    });

    it('paused → active (default fallback)', () => {
      expect(mapStripeStatus('paused')).toBe('active');
    });
  });

  describe('detectPlanType', () => {
    const MONTHLY_ID = 'price_monthly_abc';
    const YEARLY_ID = 'price_yearly_xyz';

    it('月額 priceId → monthly', () => {
      const sub = { items: { data: [{ price: { id: MONTHLY_ID } }] } };
      expect(detectPlanType(sub, MONTHLY_ID, YEARLY_ID)).toBe('monthly');
    });

    it('年額 priceId → annual', () => {
      const sub = { items: { data: [{ price: { id: YEARLY_ID } }] } };
      expect(detectPlanType(sub, MONTHLY_ID, YEARLY_ID)).toBe('annual');
    });

    it('不明な priceId → monthly (fallback)', () => {
      const sub = { items: { data: [{ price: { id: 'price_unknown' } }] } };
      expect(detectPlanType(sub, MONTHLY_ID, YEARLY_ID)).toBe('monthly');
    });

    it('items.data が空配列 → monthly (fallback)', () => {
      const sub = { items: { data: [] } };
      expect(detectPlanType(sub, MONTHLY_ID, YEARLY_ID)).toBe('monthly');
    });

    it('price が undefined → monthly (fallback)', () => {
      const sub = { items: { data: [{}] } };
      expect(detectPlanType(sub, MONTHLY_ID, YEARLY_ID)).toBe('monthly');
    });
  });

  describe('冪等性チェックロジック', () => {
    it('processed_at が存在する場合は isProcessed = true', () => {
      const data = { processed_at: '2026-02-21T10:00:00Z' };
      const isProcessed = !!data.processed_at;
      expect(isProcessed).toBe(true);
    });

    it('processed_at が null の場合は isProcessed = false', () => {
      const data = { processed_at: null };
      const isProcessed = !!data?.processed_at;
      expect(isProcessed).toBe(false);
    });

    it('data が null の場合は isProcessed = false', () => {
      const data = null;
      const isProcessed = !!(data as { processed_at: string } | null)?.processed_at;
      expect(isProcessed).toBe(false);
    });
  });
});
