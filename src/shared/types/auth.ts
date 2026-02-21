// Auth types for Web/Native cross-platform support

export type AuthProvider = 'apple' | 'google' | 'guest' | 'dev';

export type WebAuthSession = {
  accessToken: string;
  refreshToken: string;
  providerToken: string | null;
  provider: AuthProvider;
  expiresAt: number;
};

export type AuthState = {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  userId: string | null;
  provider: AuthProvider | null;
};
