import { supabase } from './client';
import { logOutRevenueCat } from '../revenuecat/client';
import type { UserProfile } from '@/src/shared/types/user';

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

  await Promise.allSettled([
    supabase.auth.signOut({ scope: 'local' }),
    logOutRevenueCat(),
  ]);
};

// -- Internal helpers --

export const fetchOrCreateProfile = async (
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

const AVATAR_ICONS = new Set<UserProfile['avatarIcon']>([
  'default', 'geometric', 'cosmic', 'organic', 'tech', 'zen',
  'robot', 'cat', 'bunny', 'star', 'owl', 'fox', 'penguin', 'bear', 'dragon',
  'unicorn', 'panda', 'dolphin', 'phoenix', 'deer', 'koala', 'wolf', 'hamster',
  'butterfly', 'jellyfish', 'mushroom', 'crystal', 'cloud', 'moon', 'octopus',
  'flower', 'ghost', 'slime', 'sakura', 'flame', 'alien',
]);
// Migration map for legacy DB values that differ from current type
const AVATAR_ICON_MIGRATION: Record<string, UserProfile['avatarIcon']> = {
  techno: 'tech',
};
const isAvatarIcon = (v: unknown): v is UserProfile['avatarIcon'] =>
  typeof v === 'string' && AVATAR_ICONS.has(v as UserProfile['avatarIcon']);
const normalizeAvatarIcon = (v: unknown): UserProfile['avatarIcon'] => {
  if (typeof v !== 'string') return 'default';
  if (v in AVATAR_ICON_MIGRATION) return AVATAR_ICON_MIGRATION[v];
  return isAvatarIcon(v) ? v : 'default';
};

const SPEECH_TONES = new Set<UserProfile['speechTone']>(['polite', 'friendly', 'intellectual', 'mentor', 'tsundere']);
// Migration map for legacy DB values that differ from current type
const SPEECH_TONE_MIGRATION: Record<string, UserProfile['speechTone']> = {
  casual: 'friendly',
};
const isSpeechTone = (v: unknown): v is UserProfile['speechTone'] =>
  typeof v === 'string' && SPEECH_TONES.has(v as UserProfile['speechTone']);
const normalizeSpeechTone = (v: unknown): UserProfile['speechTone'] => {
  if (typeof v !== 'string') return 'friendly';
  if (v in SPEECH_TONE_MIGRATION) return SPEECH_TONE_MIGRATION[v];
  return isSpeechTone(v) ? v : 'friendly';
};

export const mapDbProfile = (data: Record<string, unknown>): UserProfile => ({
  id: asStr(data.id) ?? '',
  displayName: asStr(data.display_name),
  avatarUrl: asStr(data.avatar_url),
  email: asStr(data.email),
  ageRange: isAgeRange(data.age_range) ? data.age_range : null,
  locale: asStr(data.locale) ?? 'ja',
  timezone: asStr(data.timezone) ?? 'Asia/Tokyo',
  onboardingCompleted: asBool(data.onboarding_completed),
  twinName: asStr(data.twin_name),
  avatarIcon: normalizeAvatarIcon(data.avatar_icon),
  speechTone: normalizeSpeechTone(data.speech_tone),
  mbtiType: asStr(data.mbti_type),
  createdAt: asStr(data.created_at) ?? new Date().toISOString(),
  updatedAt: asStr(data.updated_at) ?? new Date().toISOString(),
});
