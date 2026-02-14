import { supabase } from './client';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { identifyUser, logOutRevenueCat } from '../revenuecat/client';
import type { UserProfile } from '@/src/shared/types/user';

/**
 * Sign in with Apple
 * Uses native Apple Authentication on iOS
 */
export const signInWithApple = async (): Promise<UserProfile> => {
  const nonce = Math.random().toString(36).substring(2, 15);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce,
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In failed: no identity token');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce,
  });

  if (error) throw error;
  if (!data.user) throw new Error('No user returned from Supabase');

  // Identify with RevenueCat
  await identifyUser(data.user.id);

  // Fetch or create profile
  return fetchOrCreateProfile(data.user.id, {
    displayName: credential.fullName
      ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
      : undefined,
  });
};

/**
 * Sign in with Google
 * Uses Supabase OAuth flow
 */
export const signInWithGoogle = async (): Promise<UserProfile> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'altme://auth/callback',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;

  // Note: OAuth redirects, so actual profile fetch happens in auth state listener
  // This is a placeholder - the actual flow uses onAuthStateChange
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) {
    throw new Error('No session after Google Sign-In');
  }

  await identifyUser(sessionData.session.user.id);

  return fetchOrCreateProfile(sessionData.session.user.id, {
    displayName: sessionData.session.user.user_metadata?.full_name ?? undefined,
  });
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
  await logOutRevenueCat();
  await supabase.auth.signOut();
};

/**
 * Get current session
 */
export const getCurrentSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

/**
 * Get current user profile
 */
export const getCurrentProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return mapDbProfile(data);
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'ageRange' | 'twinName' | 'onboardingCompleted'>>,
): Promise<UserProfile> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.ageRange !== undefined) dbUpdates.age_range = updates.ageRange;
  if (updates.twinName !== undefined) dbUpdates.twin_name = updates.twinName;
  if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapDbProfile(data);
};

// -- Internal helpers --

const fetchOrCreateProfile = async (
  userId: string,
  meta?: { displayName?: string },
): Promise<UserProfile> => {
  // Profile is auto-created by DB trigger, just fetch it
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('Profile not found after sign-in');
  }

  // Update display_name if provided and it was set to default
  if (meta?.displayName && data.display_name === 'User') {
    const { data: updated } = await supabase
      .from('profiles')
      .update({ display_name: meta.displayName })
      .eq('id', userId)
      .select()
      .single();
    if (updated) return mapDbProfile(updated);
  }

  return mapDbProfile(data);
};

const mapDbProfile = (data: Record<string, unknown>): UserProfile => ({
  id: data.id as string,
  displayName: data.display_name as string,
  ageRange: (data.age_range as UserProfile['ageRange']) ?? null,
  locale: (data.locale as string) ?? 'ja',
  timezone: (data.timezone as string) ?? 'Asia/Tokyo',
  onboardingCompleted: (data.onboarding_completed as boolean) ?? false,
  twinName: (data.twin_name as string) ?? null,
  createdAt: data.created_at as string,
  updatedAt: data.updated_at as string,
});
