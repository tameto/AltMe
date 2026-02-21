import { supabase } from '@/src/services/supabase/client';

export type CheckoutSessionResult = { url: string };
export type PortalSessionResult = { url: string };

/**
 * Stripe Checkout セッションを作成する
 * Edge Function (create-checkout-session) を呼び出して Stripe Checkout URL を取得する
 */
export const createCheckoutSession = async (
  priceId: string,
): Promise<CheckoutSessionResult> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('unauthenticated');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    throw new Error(error.message ?? 'checkout_session_failed');
  }

  if (!data?.url) {
    throw new Error('invalid_response');
  }

  return { url: data.url };
};

/**
 * Stripe Customer Portal セッションを作成する
 * Edge Function (create-portal-session) を呼び出して Portal URL を取得する
 */
export const createPortalSession = async (): Promise<PortalSessionResult> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('unauthenticated');
  }

  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    // Customer 未存在の場合は専用エラー
    if (error.message?.includes('customer_not_found') || (error as { status?: number }).status === 404) {
      throw new Error('customer_not_found');
    }
    throw new Error(error.message ?? 'portal_session_failed');
  }

  if (!data?.url) {
    throw new Error('invalid_response');
  }

  return { url: data.url };
};

/**
 * Stripe Checkout URL へリダイレクトする（Web 専用）
 */
export const redirectToCheckout = async (priceId: string): Promise<void> => {
  const { url } = await createCheckoutSession(priceId);
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
};

/**
 * Stripe Customer Portal へリダイレクトする（Web 専用）
 */
export const redirectToPortal = async (): Promise<void> => {
  const { url } = await createPortalSession();
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
};
