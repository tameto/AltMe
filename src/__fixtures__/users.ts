import type { UserProfile } from '@/src/shared/types/user';

export const mockFreeUser: UserProfile = {
  id: 'user-free-001',
  displayName: 'テストユーザー',
  avatarUrl: null,
  email: 'free@test.com',
  ageRange: '25-34',
  locale: 'ja',
  timezone: 'Asia/Tokyo',
  onboardingCompleted: true,
  twinName: 'AltMe',
  avatarIcon: 'default',
  speechTone: 'friendly',
  mbtiType: 'INFP',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const mockProUser: UserProfile = {
  ...mockFreeUser,
  id: 'user-pro-001',
  email: 'pro@test.com',
  displayName: 'Proユーザー',
};

export const mockGuestUser: Partial<UserProfile> = {
  id: 'guest-001',
  displayName: null,
  onboardingCompleted: false,
};
