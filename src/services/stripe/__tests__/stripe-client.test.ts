/**
 * Stripe クライアントサービスのテスト (M067)
 */

// ---- モック ----

const mockGetSession = jest.fn();
const mockFunctionsInvoke = jest.fn();

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
  },
}));

// ---- テスト対象 ----
import {
  createCheckoutSession,
  createPortalSession,
} from '../client';

// ---- テストデータ ----

const MOCK_SESSION = {
  data: { session: { access_token: 'token-abc' } },
};
const MOCK_CHECKOUT_URL = 'https://checkout.stripe.com/pay/cs_test_xxx';
const MOCK_PORTAL_URL = 'https://billing.stripe.com/p/session/xxx';
const MOCK_MONTHLY_PRICE_ID = 'price_monthly_test';

// ---- createCheckoutSession テスト ----

describe('createCheckoutSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(MOCK_SESSION);
  });

  it('正常系: Checkout URL を返す', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { url: MOCK_CHECKOUT_URL },
      error: null,
    });

    const result = await createCheckoutSession(MOCK_MONTHLY_PRICE_ID);

    expect(result.url).toBe(MOCK_CHECKOUT_URL);
    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      'create-checkout-session',
      expect.objectContaining({
        body: { priceId: MOCK_MONTHLY_PRICE_ID },
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
      }),
    );
  });

  it('未認証の場合は unauthenticated エラーをスローする', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(createCheckoutSession(MOCK_MONTHLY_PRICE_ID)).rejects.toThrow('unauthenticated');
    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
  });

  it('Edge Function がエラーを返した場合はスローする', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { message: 'invalid_price_id' },
    });

    await expect(createCheckoutSession('price_bad')).rejects.toThrow('invalid_price_id');
  });

  it('url が含まれないレスポンスの場合は invalid_response をスローする', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { sessionId: 'cs_xxx' }, // url なし
      error: null,
    });

    await expect(createCheckoutSession(MOCK_MONTHLY_PRICE_ID)).rejects.toThrow('invalid_response');
  });
});

// ---- createPortalSession テスト ----

describe('createPortalSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(MOCK_SESSION);
  });

  it('正常系: Portal URL を返す', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { url: MOCK_PORTAL_URL },
      error: null,
    });

    const result = await createPortalSession();

    expect(result.url).toBe(MOCK_PORTAL_URL);
    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      'create-portal-session',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
      }),
    );
  });

  it('未認証の場合は unauthenticated エラーをスローする', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(createPortalSession()).rejects.toThrow('unauthenticated');
  });

  it('Customer 未存在の場合は customer_not_found エラーをスローする', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { message: 'customer_not_found', status: 404 },
    });

    await expect(createPortalSession()).rejects.toThrow('customer_not_found');
  });

  it('url が含まれないレスポンスの場合は invalid_response をスローする', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {},
      error: null,
    });

    await expect(createPortalSession()).rejects.toThrow('invalid_response');
  });
});
