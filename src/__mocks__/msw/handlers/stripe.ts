import { http, HttpResponse } from 'msw';

const STRIPE_API_URL = 'https://api.stripe.com';

export const stripeHandlers = [
  // POST /v1/checkout/sessions — create checkout session
  http.post(`${STRIPE_API_URL}/v1/checkout/sessions`, () => {
    return HttpResponse.json({
      id: 'cs_test_mock_session_id',
      object: 'checkout.session',
      url: 'https://checkout.stripe.com/pay/cs_test_mock_session_id',
      status: 'open',
      mode: 'subscription',
      success_url: 'https://altme.app/success',
      cancel_url: 'https://altme.app/cancel',
    });
  }),
];
