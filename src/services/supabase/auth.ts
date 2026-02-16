import { supabase } from './client';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { identifyUser, logOutRevenueCat } from '../revenuecat/client';
import { env } from '@/src/config/env';
import type { UserProfile } from '@/src/shared/types/user';

// Configure Google Sign-In once at module load
GoogleSignin.configure({
  webClientId: env.googleWebClientId,
});

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
 * Uses Native SDK → idToken → signInWithIdToken (same pattern as Apple)
 */
export const signInWithGoogle = async (): Promise<UserProfile> => {
  // Check Google Play Services (Android)
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const signInResult = await GoogleSignin.signIn();

  if (!signInResult.data?.idToken) {
    throw new Error('Google Sign-In failed: no ID token');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: signInResult.data.idToken,
  });

  if (error) throw error;
  if (!data.user) throw new Error('No user returned from Supabase');

  // Identify with RevenueCat
  await identifyUser(data.user.id);

  return fetchOrCreateProfile(data.user.id, {
    displayName: data.user.user_metadata?.full_name ?? undefined,
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
  updates: Partial<Pick<UserProfile, 'displayName' | 'ageRange' | 'twinName' | 'onboardingCompleted' | 'avatarIcon' | 'speechTone' | 'mbtiType'>>,
): Promise<UserProfile> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.ageRange !== undefined) dbUpdates.age_range = updates.ageRange;
  if (updates.twinName !== undefined) dbUpdates.twin_name = updates.twinName;
  if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
  if (updates.avatarIcon !== undefined) dbUpdates.avatar_icon = updates.avatarIcon;
  if (updates.speechTone !== undefined) dbUpdates.speech_tone = updates.speechTone;
  if (updates.mbtiType !== undefined) dbUpdates.mbti_type = updates.mbtiType;

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapDbProfile(data);
};

/**
 * Delete user account via Edge Function (AC-7).
 * Order: 1. OpenClaw destroy 2. RevenueCat cancel 3. auth.admin.deleteUser(CASCADE)
 */
export const deleteAccount = async (): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const { error } = await supabase.functions.invoke('delete-account', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw error;
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

const asStr = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const asBool = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : fallback);

const AGE_RANGES = new Set(['18-24', '25-34', '35-44', '45+']);
const isAgeRange = (v: unknown): v is UserProfile['ageRange'] =>
  typeof v === 'string' && AGE_RANGES.has(v);

const AVATAR_ICONS = new Set(['default', 'geometric', 'cosmic', 'organic', 'techno', 'zen']);
const isAvatarIcon = (v: unknown): v is UserProfile['avatarIcon'] =>
  typeof v === 'string' && AVATAR_ICONS.has(v);

const SPEECH_TONES = new Set(['polite', 'casual', 'intellectual', 'mentor', 'tsundere', 'friendly']);
const isSpeechTone = (v: unknown): v is UserProfile['speechTone'] =>
  typeof v === 'string' && SPEECH_TONES.has(v);

const mapDbProfile = (data: Record<string, unknown>): UserProfile => ({
  id: asStr(data.id) ?? '',
  displayName: asStr(data.display_name),
  avatarUrl: asStr(data.avatar_url),
  email: asStr(data.email),
  ageRange: isAgeRange(data.age_range) ? data.age_range : null,
  locale: asStr(data.locale) ?? 'ja',
  timezone: asStr(data.timezone) ?? 'Asia/Tokyo',
  onboardingCompleted: asBool(data.onboarding_completed),
  twinName: asStr(data.twin_name),
  avatarIcon: isAvatarIcon(data.avatar_icon) ? data.avatar_icon : 'default',
  speechTone: isSpeechTone(data.speech_tone) ? data.speech_tone : 'friendly',
  mbtiType: asStr(data.mbti_type),
  createdAt: asStr(data.created_at) ?? new Date().toISOString(),
  updatedAt: asStr(data.updated_at) ?? new Date().toISOString(),
});
