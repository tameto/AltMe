import { http, HttpResponse } from 'msw';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';

export const supabaseDbHandlers = [
  // GET /rest/v1/profiles — fetch profiles
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([
      {
        id: 'test-user-id',
        display_name: 'Test User',
        avatar_url: null,
        email: 'test@example.com',
        age_range: '25-34',
        locale: 'ja',
        timezone: 'Asia/Tokyo',
        onboarding_completed: true,
        twin_name: 'AltMe',
        avatar_icon: 'default',
        speech_tone: 'friendly',
        mbti_type: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
  }),

  // GET /rest/v1/subscriptions — fetch subscriptions
  http.get(`${SUPABASE_URL}/rest/v1/subscriptions`, () => {
    return HttpResponse.json([
      {
        id: 'sub-1',
        user_id: 'test-user-id',
        revenuecat_customer_id: null,
        status: 'free',
        plan_type: 'free',
        current_period_start: null,
        current_period_end: null,
        trial_end: null,
        cancelled_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
  }),
];
