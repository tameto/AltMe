import { create } from 'zustand';
import type { UserProfile } from '../types/user';

type UserStore = {
  user: UserProfile | null;
  isLoading: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  reset: () => void;
};

export const useUser = create<UserStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  reset: () => set({ user: null, isLoading: true }),
}));
