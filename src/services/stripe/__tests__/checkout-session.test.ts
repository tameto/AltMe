/**
 * M140: create-checkout-session Edge Function ロジックテスト
 *
 * Edge Function は Deno 環境で動作するため直接インポートできない。
 * ここでは EF のコアロジック（planType→priceId 解決、バリデーション）を
 * 同等のロジックで再現しテストする。
 *
 * テスト対象ロジック:
 * - planType → priceId 解決 (monthly, annual)
 * - 不正な planType の拒否
 * - 後方互換: priceId 直接指定
 * - planType も priceId もない場合のエラー
 * - ALLOWED_PRICE_IDS による不正 priceId 拒否
 */

// --- EF から抽出したコアロジック (supabase/functions/create-checkout-session/index.ts と同等) ---

const MONTHLY_PRICE_ID = 'price_monthly_test_123';
const YEARLY_PRICE_ID = 'price_yearly_test_456';

const PLAN_TO_PRICE: Record<string, string> = {
  monthly: MONTHLY_PRICE_ID,
  annual: YEARLY_PRICE_ID,
};

const ALLOWED_PRICE_IDS = new Set([MONTHLY_PRICE_ID, YEARLY_PRICE_ID]);

type ValidationResult =
  | { ok: true; priceId: string }
  | { ok: false; error: string; status: number };

/**
 * create-checkout-session EF のリクエストボディバリデーションロジック
 * (supabase/functions/create-checkout-session/index.ts L47-L73 と同等)
 */
function validateCheckoutRequest(body: Record<string, unknown>): ValidationResult {
  let priceId: string;

  if (body.planType && typeof body.planType === 'string') {
    const resolved = PLAN_TO_PRICE[body.planType];
    if (!resolved) {
      return { ok: false, error: 'invalid_plan_type', status: 400 };
    }
    priceId = resolved;
  } else if (body.priceId && typeof body.priceId === 'string') {
    priceId = body.priceId;
  } else {
    return { ok: false, error: 'plan_type_or_price_id_required', status: 400 };
  }

  if (!ALLOWED_PRICE_IDS.has(priceId)) {
    return { ok: false, error: 'invalid_price_id', status: 400 };
  }

  return { ok: true, priceId };
}

// --- テスト ---

describe('create-checkout-session バリデーションロジック', () => {
  describe('planType → priceId 解決', () => {
    it('monthly → MONTHLY_PRICE_ID に解決される', () => {
      const result = validateCheckoutRequest({ planType: 'monthly' });
      expect(result).toEqual({ ok: true, priceId: MONTHLY_PRICE_ID });
    });

    it('annual → YEARLY_PRICE_ID に解決される', () => {
      const result = validateCheckoutRequest({ planType: 'annual' });
      expect(result).toEqual({ ok: true, priceId: YEARLY_PRICE_ID });
    });

    it('不正な planType は invalid_plan_type エラーを返す', () => {
      const result = validateCheckoutRequest({ planType: 'weekly' });
      expect(result).toEqual({ ok: false, error: 'invalid_plan_type', status: 400 });
    });

    it('空文字列の planType は plan_type_or_price_id_required エラーを返す', () => {
      const result = validateCheckoutRequest({ planType: '' });
      expect(result).toEqual({ ok: false, error: 'plan_type_or_price_id_required', status: 400 });
    });

    it('数値の planType は plan_type_or_price_id_required エラーを返す', () => {
      const result = validateCheckoutRequest({ planType: 123 });
      expect(result).toEqual({ ok: false, error: 'plan_type_or_price_id_required', status: 400 });
    });
  });

  describe('後方互換: priceId 直接指定', () => {
    it('許可された priceId を直接指定できる', () => {
      const result = validateCheckoutRequest({ priceId: MONTHLY_PRICE_ID });
      expect(result).toEqual({ ok: true, priceId: MONTHLY_PRICE_ID });
    });

    it('許可された年額 priceId を直接指定できる', () => {
      const result = validateCheckoutRequest({ priceId: YEARLY_PRICE_ID });
      expect(result).toEqual({ ok: true, priceId: YEARLY_PRICE_ID });
    });

    it('不正な priceId は invalid_price_id エラーを返す', () => {
      const result = validateCheckoutRequest({ priceId: 'price_hacked_999' });
      expect(result).toEqual({ ok: false, error: 'invalid_price_id', status: 400 });
    });

    it('空文字列の priceId は plan_type_or_price_id_required エラーを返す', () => {
      const result = validateCheckoutRequest({ priceId: '' });
      expect(result).toEqual({ ok: false, error: 'plan_type_or_price_id_required', status: 400 });
    });
  });

  describe('planType も priceId もない場合', () => {
    it('空オブジェクトは plan_type_or_price_id_required エラーを返す', () => {
      const result = validateCheckoutRequest({});
      expect(result).toEqual({ ok: false, error: 'plan_type_or_price_id_required', status: 400 });
    });

    it('無関係なフィールドのみは plan_type_or_price_id_required エラーを返す', () => {
      const result = validateCheckoutRequest({ foo: 'bar', amount: 100 });
      expect(result).toEqual({ ok: false, error: 'plan_type_or_price_id_required', status: 400 });
    });
  });

  describe('planType が priceId より優先される', () => {
    it('両方指定された場合は planType が優先される', () => {
      const result = validateCheckoutRequest({
        planType: 'annual',
        priceId: MONTHLY_PRICE_ID,
      });
      expect(result).toEqual({ ok: true, priceId: YEARLY_PRICE_ID });
    });

    it('不正な planType と有効な priceId の場合は planType のエラーが返る', () => {
      const result = validateCheckoutRequest({
        planType: 'invalid',
        priceId: MONTHLY_PRICE_ID,
      });
      expect(result).toEqual({ ok: false, error: 'invalid_plan_type', status: 400 });
    });
  });

  describe('PLAN_TO_PRICE マッピングの網羅性', () => {
    it('マッピングに monthly と annual のみ存在する', () => {
      expect(Object.keys(PLAN_TO_PRICE)).toEqual(['monthly', 'annual']);
    });

    it('ALLOWED_PRICE_IDS は PLAN_TO_PRICE の値と一致する', () => {
      const planPriceValues = new Set(Object.values(PLAN_TO_PRICE));
      expect(ALLOWED_PRICE_IDS).toEqual(planPriceValues);
    });
  });
});
