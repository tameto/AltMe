import { supabase } from './client';
import { identifyUser } from '../revenuecat/client';
import type { UserProfile } from '@/src/shared/types/user';
import {
  signOut,
  getCurrentSession,
  getCurrentProfile,
  updateProfile,
  deleteAccount,
  fetchOrCreateProfile,
  mapDbProfile,
} from './auth-shared';

/**
 * Sign in with Apple (web: OAuth redirect)
 * On web, Apple Sign-In is handled via Supabase OAuth redirect flow.
 * After signInWithOAuth, the browser redirects to the provider.
 * On return, initialize() picks up the session via detectSessionInUrl.
 */
export const signInWithApple = async (): Promise<UserProfile> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });

  if (error) throw error;

  // Browser will redirect to provider. Return a never-resolving promise
  // to prevent auth-store from processing a non-existent response.
  // On redirect back, the app reloads and initialize() handles the session.
  return new Promise(() => {});
};

/**
 * Sign in with Google (web: OAuth redirect)
 * On web, Google Sign-In is handled via Supabase OAuth redirect flow.
 * After signInWithOAuth, the browser redirects to the provider.
 * On return, initialize() picks up the session via detectSessionInUrl.
 */
export const signInWithGoogle = async (): Promise<UserProfile> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });

  if (error) throw error;

  // Browser will redirect to provider. Return a never-resolving promise
  // to prevent auth-store from processing a non-existent response.
  // On redirect back, the app reloads and initialize() handles the session.
  return new Promise(() => {});
};

export { signOut, getCurrentSession, getCurrentProfile, updateProfile, deleteAccount, mapDbProfile };
