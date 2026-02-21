import { supabase } from './client';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { identifyUser, logOutRevenueCat } from '../revenuecat/client';
import { env } from '@/src/config/env';
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

// Configure Google Sign-In once at module load
GoogleSignin.configure({
  webClientId: env.googleWebClientId,
});

/**
 * Sign in with Apple
 * Uses native Apple Authentication on iOS
 */
export const signInWithApple = async (): Promise<UserProfile> => {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
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

  // v16.x SDK returns { type: 'cancelled' } instead of throwing
  if ('type' in signInResult && signInResult.type === 'cancelled') {
    const err = new Error('Google sign-in cancelled');
    (err as { code?: string }).code = 'SIGN_IN_CANCELLED';
    throw err;
  }

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

export { signOut, getCurrentSession, getCurrentProfile, updateProfile, deleteAccount, mapDbProfile };
