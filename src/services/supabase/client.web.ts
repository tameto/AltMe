import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/src/config/env';

/**
 * In-memory fallback storage for SSR (Node.js) environments
 * where sessionStorage is not available.
 */
const memoryStore = new Map<string, string>();

const isSessionStorageAvailable =
  typeof sessionStorage !== 'undefined';

/**
 * SessionStorage adapter for Supabase Auth token persistence on web.
 * Uses sessionStorage when available (browser), falls back to in-memory storage (SSR).
 */
const WebStorageAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (isSessionStorageAvailable) {
      return Promise.resolve(sessionStorage.getItem(key));
    }
    return Promise.resolve(memoryStore.get(key) ?? null);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (isSessionStorageAvailable) {
      sessionStorage.setItem(key, value);
    } else {
      memoryStore.set(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    if (isSessionStorageAvailable) {
      sessionStorage.removeItem(key);
    } else {
      memoryStore.delete(key);
    }
    return Promise.resolve();
  },
};

const createSupabaseClient = (): SupabaseClient => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: WebStorageAdapter,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: true,
      },
    });
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: WebStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
};

export const supabase = createSupabaseClient();

/**
 * visibilitychange listener for token refresh management on web.
 * Starts auto-refresh when tab becomes visible, stops when hidden.
 */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
