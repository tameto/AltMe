import { create } from 'zustand';
import { supabase } from '@/src/services/supabase/client';
import {
  signInWithApple as authSignInWithApple,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  getCurrentProfile,
  updateProfile as authUpdateProfile,
  deleteAccount as authDeleteAccount,
} from '@/src/services/supabase/auth';
import { initializeRevenueCat, checkSubscriptionStatus, addCustomerInfoListener } from '@/src/services/revenuecat/client';
import { disconnectOpenClaw } from '@/src/services/openclaw/connection-manager';
import { useUser } from '@/src/shared/hooks/use-user';
import { useSubscription } from '@/src/shared/hooks/use-subscription';
import type { UserProfile, AgeRange } from '@/src/shared/types/user';

type AuthStore = {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  enterGuestMode: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
  devLogin: (skipOnboarding?: boolean) => Promise<void>;
};

// Single RC listener unsubscribe handle (module-level to survive re-renders)
let rcListenerUnsubscribe: (() => void) | null = null;

const bindRcListener = () => {
  if (rcListenerUnsubscribe) {
    rcListenerUnsubscribe();
    rcListenerUnsubscribe = null;
  }
  rcListenerUnsubscribe = addCustomerInfoListener((info) => {
    useSubscription.getState().setEntitlement(info);
  });
};

// Auth state change unsubscribe handle
let authStateUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Initialize RevenueCat
      await initializeRevenueCat();

      // Check existing session
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        const profile = await getCurrentProfile(data.session.user.id);

        if (profile) {
          useUser.getState().setUser(profile);

          // Check subscription status
          const entitlement = await checkSubscriptionStatus();
          useSubscription.getState().setEntitlement(entitlement);
          useSubscription.getState().setLoading(false);

          // Listen for subscription updates (deduplicated)
          bindRcListener();

          set({ isAuthenticated: true, isLoading: false });
        } else {
          set({ isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ isAuthenticated: false, isLoading: false });
        useUser.getState().setUser(null);
        useSubscription.getState().setLoading(false);
      }

      // Listen for auth state changes (unsubscribe previous before re-subscribing)
      if (authStateUnsubscribe) {
        authStateUnsubscribe();
      }
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_OUT') {
          useUser.getState().reset();
          useSubscription.getState().reset();
          set({ isAuthenticated: false });
        }
      });
      authStateUnsubscribe = () => subscription.unsubscribe();
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, error: 'アプリの初期化に失敗しました' });
    }
  },

  signInWithApple: async () => {
    try {
      set({ isLoading: true, error: null });
      const profile = await authSignInWithApple();
      useUser.getState().setUser(profile);

      const entitlement = await checkSubscriptionStatus();
      useSubscription.getState().setEntitlement(entitlement);
      useSubscription.getState().setLoading(false);

      // Listen for subscription updates (deduplicated)
      bindRcListener();

      set({ isAuthenticated: true, isGuest: false });
    } catch (error: unknown) {
      // Silent handling for Apple user cancellation (AC-1 edge case)
      if (
        error != null &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        return;
      }
      const message = error instanceof Error ? error.message : 'ログインに失敗しました';
      if (message.includes('cancelled') || message.includes('ERR_CANCELED')) return;
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      const profile = await authSignInWithGoogle();
      useUser.getState().setUser(profile);

      const entitlement = await checkSubscriptionStatus();
      useSubscription.getState().setEntitlement(entitlement);
      useSubscription.getState().setLoading(false);

      // Listen for subscription updates (deduplicated)
      bindRcListener();

      set({ isAuthenticated: true, isGuest: false });
    } catch (error: unknown) {
      // Silent handling for user cancellation (works across native SDK and OAuth redirect)
      if (error != null && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'SIGN_IN_CANCELLED') return;
      }
      const message = error instanceof Error ? error.message : 'ログインに失敗しました';
      if (message.includes('cancelled') || message.includes('ERR_CANCELED')) return;
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      // 1. Disconnect OpenClaw WebSocket (AC-3)
      disconnectOpenClaw();

      // 2. Sign out from Supabase + RevenueCat
      await authSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // 3. Always reset local state (even on network error per AC-3 edge case)
      useUser.getState().reset();
      useSubscription.getState().reset();
      set({ isAuthenticated: false, error: null });
    }
  },

  deleteAccount: async () => {
    try {
      // 1. Disconnect OpenClaw WebSocket
      disconnectOpenClaw();

      // 2. Call delete-account Edge Function (handles OpenClaw destroy + RevenueCat + auth deletion)
      await authDeleteAccount();

      // 3. Reset local state only on success
      useUser.getState().reset();
      useSubscription.getState().reset();
      set({ isAuthenticated: false, isGuest: false, error: null });
    } catch (error) {
      console.error('Account deletion error:', error);
      set({ error: error instanceof Error ? error.message : 'Account deletion failed' });
      throw error;
    }
  },

  enterGuestMode: () => {
    set({ isAuthenticated: false, isGuest: true, isLoading: false });
  },

  updateProfile: async (updates) => {
    const user = useUser.getState().user;
    if (!user) return;

    const updated = await authUpdateProfile(user.id, updates);
    useUser.getState().setUser(updated);
  },

  clearError: () => set({ error: null }),

  devLogin: async (skipOnboarding = false) => {
    if (!__DEV__) return;

    const devEmail = 'dev@altme.test';
    const devPassword = 'devpassword123';

    // Try sign in first, then sign up if not exists
    let session: { user: { id: string } } | null = null;
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword,
    });

    if (signInError) {
      // User doesn't exist yet, create
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: devEmail,
        password: devPassword,
      });
      if (signUpError) {
        console.error('Dev sign up failed:', signUpError);
        return;
      }
      session = signUpData.session;
    } else {
      session = signInData.session;
    }

    if (!session?.user) {
      console.error('Dev login: no session');
      return;
    }

    // Fetch or update profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const profileData = profile as Record<string, unknown> | null;
    const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
    const bool = (v: unknown, fb = false): boolean => (typeof v === 'boolean' ? v : fb);
    const devUser: UserProfile = {
      id: session.user.id,
      displayName: str(profileData?.display_name) ?? 'テストユーザー',
      avatarUrl: str(profileData?.avatar_url),
      email: str(profileData?.email) ?? str((session.user as Record<string, unknown>).email),
      ageRange: (['18-24', '25-34', '35-44', '45+'].includes(str(profileData?.age_range) ?? '')
        ? str(profileData?.age_range) as AgeRange : '25-34'),
      locale: str(profileData?.locale) ?? 'ja',
      timezone: str(profileData?.timezone) ?? 'Asia/Tokyo',
      onboardingCompleted: skipOnboarding || bool(profileData?.onboarding_completed),
      twinName: str(profileData?.twin_name) ?? (skipOnboarding ? 'AltMe' : null),
      avatarIcon: (str(profileData?.avatar_icon) as UserProfile['avatarIcon']) ?? 'default',
      speechTone: (str(profileData?.speech_tone) as UserProfile['speechTone']) ?? 'friendly',
      mbtiType: str(profileData?.mbti_type),
      createdAt: str(profileData?.created_at) ?? new Date().toISOString(),
      updatedAt: str(profileData?.updated_at) ?? new Date().toISOString(),
    };

    useUser.getState().setUser(devUser);
    useSubscription.getState().setEntitlement({
      isPro: false,
      isTrialing: false,
      status: 'free',
      planType: 'free',
      expiresAt: null,
      trialDaysRemaining: null,
    });
    useSubscription.getState().setLoading(false);
    set({ isAuthenticated: true, isLoading: false });
  },
}));
