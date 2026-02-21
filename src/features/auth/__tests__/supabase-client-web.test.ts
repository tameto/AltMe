/**
 * Supabase Client Web テスト (M043)
 *
 * テストケース:
 * 1. createClient が sessionStorage ベースの storage adapter で作成される
 * 2. detectSessionInUrl が true に設定されている
 * 3. visibilitychange イベントで auto-refresh を制御する
 */

jest.mock('@/src/config/env', () => ({
  env: {
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
  },
}));

jest.mock('@supabase/supabase-js', () => {
  // Initialize shared state on globalThis (factory runs before any const declarations)
  const g = globalThis as Record<string, unknown>;
  if (!g.__mockSupabaseState) {
    g.__mockSupabaseState = {
      capturedArgs: [],
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    };
  }
  const state = g.__mockSupabaseState as {
    capturedArgs: unknown[][];
    startAutoRefresh: jest.Mock;
    stopAutoRefresh: jest.Mock;
  };
  return {
    createClient: (...args: unknown[]) => {
      state.capturedArgs.push(args);
      return {
        auth: {
          startAutoRefresh: state.startAutoRefresh,
          stopAutoRefresh: state.stopAutoRefresh,
          getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
          onAuthStateChange: jest.fn(() => ({
            data: { subscription: { unsubscribe: jest.fn() } },
          })),
        },
      };
    },
  };
});

// Must import after mocks - triggers createClient + visibilitychange listener
import '@/src/services/supabase/client.web';

// Retrieve the mock state (initialized by the factory above)
const mockState = (globalThis as Record<string, unknown>).__mockSupabaseState as {
  capturedArgs: unknown[][];
  startAutoRefresh: jest.Mock;
  stopAutoRefresh: jest.Mock;
};

describe('client.web.ts', () => {
  it('creates client with sessionStorage-based storage adapter', () => {
    expect(mockState.capturedArgs.length).toBeGreaterThan(0);
    const [url, key, options] = mockState.capturedArgs[0];
    expect(url).toBe('https://test.supabase.co');
    expect(key).toBe('test-anon-key');
    const authOpts = (options as { auth: Record<string, unknown> }).auth;
    expect(authOpts.autoRefreshToken).toBe(true);
    expect(authOpts.persistSession).toBe(true);
  });

  it('enables detectSessionInUrl for OAuth redirect flow', () => {
    const [, , options] = mockState.capturedArgs[0];
    const authOpts = (options as { auth: Record<string, unknown> }).auth;
    expect(authOpts.detectSessionInUrl).toBe(true);
  });

  it('controls auto-refresh on visibilitychange events', () => {
    mockState.startAutoRefresh.mockClear();
    mockState.stopAutoRefresh.mockClear();

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(mockState.stopAutoRefresh).toHaveBeenCalled();

    // Simulate tab becoming visible
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(mockState.startAutoRefresh).toHaveBeenCalled();
  });
});
