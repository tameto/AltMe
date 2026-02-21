import { http, HttpResponse } from 'msw';

const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';

export const revenuecatHandlers = [
  // GET /subscribers/{id} — fetch subscriber info
  http.get(`${REVENUECAT_API_URL}/subscribers/:userId`, ({ params }) => {
    const { userId } = params;
    return HttpResponse.json({
      request_date: new Date().toISOString(),
      request_date_ms: Date.now(),
      subscriber: {
        original_app_user_id: userId,
        first_seen: '2026-01-01T00:00:00Z',
        entitlements: {
          pro: {
            expires_date: null,
            product_identifier: 'altme_monthly',
            purchase_date: '2026-01-01T00:00:00Z',
          },
        },
        subscriptions: {},
        non_subscriptions: {},
      },
    });
  }),
];
