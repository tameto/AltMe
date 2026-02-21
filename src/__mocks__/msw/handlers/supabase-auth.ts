import { http, HttpResponse } from 'msw';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';

export const supabaseAuthHandlers = [
  // POST /auth/v1/token — sign in with password or refresh token
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'authenticated',
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    });
  }),

  // POST /auth/v1/signup — sign up
  http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'authenticated',
        aud: 'authenticated',
      },
    });
  }),

  // POST /auth/v1/logout — sign out
  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
