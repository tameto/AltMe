import { create } from 'zustand';
import { supabase } from '@/src/services/supabase/client';
import {
  signInWithApple as authSignInWithApple,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  getCurrentProfile,
  updateProfile as authUpdateProfile,
} from '@/src/services/supabase/auth';
import { initializeRevenueCat, checkSubscriptionStatus, addCustomerInfoListener } from '@/src/services/revenuecat/client';
import { useUser } from '@/src/shared/hooks/use-user';
import { useSubscription } from '@/src/shared/hooks/use-subscription';
import type { UserProfile } from '@/src/shared/types/user';

type AuthStore = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
  devLogin: (skipOnboarding?: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
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

          // Listen for subscription updates
          addCustomerInfoListener((info) => {
            useSubscription.getState().setEntitlement(info);
          });

          set({ isAuthenticated: true, isLoading: false });
        } else {
          set({ isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ isAuthenticated: false, isLoading: false });
        useUser.getState().setUser(null);
        useSubscription.getState().setLoading(false);
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          useUser.getState().reset();
          useSubscription.getState().reset();
          set({ isAuthenticated: false });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, error: 'アプリの初期化に失敗しました' });
    }
  },

  signInWithApple: async () => {
    try {
      set({ error: null });
      const profile = await authSignInWithApple();
      useUser.getState().setUser(profile);

      const entitlement = await checkSubscriptionStatus();
      useSubscription.getState().setEntitlement(entitlement);
      useSubscription.getState().setLoading(false);

      addCustomerInfoListener((info) => {
        useSubscription.getState().setEntitlement(info);
      });

      set({ isAuthenticated: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました';
      // Don't show error for user cancellation
      if (message.includes('cancelled') || message.includes('ERR_CANCELED')) return;
      set({ error: message });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ error: null });
      const profile = await authSignInWithGoogle();
      useUser.getState().setUser(profile);

      const entitlement = await checkSubscriptionStatus();
      useSubscription.getState().setEntitlement(entitlement);
      useSubscription.getState().setLoading(false);

      addCustomerInfoListener((info) => {
        useSubscription.getState().setEntitlement(info);
      });

      set({ isAuthenticated: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました';
      if (message.includes('cancelled') || message.includes('ERR_CANCELED')) return;
      set({ error: message });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await authSignOut();
      useUser.getState().reset();
      useSubscription.getState().reset();
      set({ isAuthenticated: false });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  updateProfile: async (updates) => {
    const user = useUser.getState().user;
    if (!user) return;

    const updated = await authUpdateProfile(user.id, updates);
    useUser.getState().setUser(updated);
  },

  clearError: () => set({ error: null }),

  devLogin: (skipOnboarding = false) => {
    if (!__DEV__) return;
    const devUser: UserProfile = {
      id: 'dev-user-001',
      displayName: 'テストユーザー',
      ageRange: '25-34',
      locale: 'ja',
      timezone: 'Asia/Tokyo',
      onboardingCompleted: skipOnboarding,
      twinName: skipOnboarding ? 'AltMe' : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useUser.getState().setUser(devUser);
    useSubscription.getState().setEntitlement({
      isPro: false,
      status: 'free',
      planType: null,
      trialDaysRemaining: null,
      credits: 0,
    });
    useSubscription.getState().setLoading(false);
    set({ isAuthenticated: true, isLoading: false });
  },
}));
