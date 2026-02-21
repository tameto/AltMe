/**
 * Supabase Auth Web テスト (M042)
 *
 * テストケース:
 * 1. signInWithApple が signInWithOAuth を apple provider で呼ぶ
 * 2. signInWithGoogle が signInWithOAuth を google provider で呼ぶ
 * 3. signInWithOAuth エラー時にスローする
 * 4. signOut が RevenueCat logOut + supabase signOut を呼ぶ
 * 5. getCurrentProfile がプロフィールを返す
 * 6. getCurrentProfile がエラー時に null を返す
 * 7. mapDbProfile が DB レコードを UserProfile に変換する
 */

// Define window.location for node environment
if (typeof window !== 'undefined' && !window.location) {
  Object.defineProperty(window, 'location', {
    value: { origin: 'http://localhost:3000' },
    writable: true,
    configurable: true,
  });
}

const mockSignInWithOAuth = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    functions: { invoke: jest.fn() },
  },
}));

jest.mock('@/src/services/revenuecat/client', () => ({
  identifyUser: jest.fn(),
  logOutRevenueCat: jest.fn().mockResolvedValue(undefined),
}));

import { signInWithApple, signInWithGoogle } from '@/src/services/supabase/auth.web';
import { signOut, getCurrentProfile, mapDbProfile } from '@/src/services/supabase/auth-shared';

describe('auth.web.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signInWithApple calls signInWithOAuth with apple provider', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    // signInWithApple returns a never-resolving promise on success (browser redirects)
    // Use Promise.race to avoid hanging
    const result = Promise.race([
      signInWithApple(),
      new Promise<string>((resolve) => setTimeout(() => resolve('timeout'), 50)),
    ]);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'apple',
      }),
    );

    await expect(result).resolves.toBe('timeout');
  });

  it('signInWithGoogle calls signInWithOAuth with google provider', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    const result = Promise.race([
      signInWithGoogle(),
      new Promise<string>((resolve) => setTimeout(() => resolve('timeout'), 50)),
    ]);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
      }),
    );

    await expect(result).resolves.toBe('timeout');
  });

  it('signInWithOAuth error causes throw', async () => {
    const authError = new Error('OAuth failed');
    mockSignInWithOAuth.mockResolvedValue({ error: authError });

    await expect(signInWithApple()).rejects.toThrow(authError);
  });
});

describe('auth-shared.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signOut calls RevenueCat logOut and supabase signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    await signOut();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { logOutRevenueCat } = require('@/src/services/revenuecat/client');
    expect(logOutRevenueCat).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('getCurrentProfile returns profile when found', async () => {
    const mockDbData = {
      id: 'user-123',
      display_name: 'Test User',
      avatar_url: null,
      email: 'test@example.com',
      age_range: '25-34',
      locale: 'ja',
      timezone: 'Asia/Tokyo',
      onboarding_completed: true,
      twin_name: 'MyTwin',
      avatar_icon: 'default',
      speech_tone: 'friendly',
      mbti_type: 'INFP',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockDbData, error: null }),
        }),
      }),
    });

    const profile = await getCurrentProfile('user-123');
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe('user-123');
    expect(profile?.displayName).toBe('Test User');
    expect(profile?.onboardingCompleted).toBe(true);
  });

  it('getCurrentProfile returns null on error', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
        }),
      }),
    });

    const profile = await getCurrentProfile('nonexistent');
    expect(profile).toBeNull();
  });

  it('mapDbProfile converts DB record to UserProfile', () => {
    const dbRecord = {
      id: 'user-456',
      display_name: 'Jane',
      avatar_url: 'https://example.com/avatar.png',
      email: 'jane@example.com',
      age_range: '35-44',
      locale: 'en',
      timezone: 'America/New_York',
      onboarding_completed: false,
      twin_name: null,
      avatar_icon: 'cosmic',
      speech_tone: 'intellectual',
      mbti_type: null,
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-15T00:00:00Z',
    };

    const profile = mapDbProfile(dbRecord);
    expect(profile).toEqual({
      id: 'user-456',
      displayName: 'Jane',
      avatarUrl: 'https://example.com/avatar.png',
      email: 'jane@example.com',
      ageRange: '35-44',
      locale: 'en',
      timezone: 'America/New_York',
      onboardingCompleted: false,
      twinName: null,
      avatarIcon: 'cosmic',
      speechTone: 'intellectual',
      mbtiType: null,
      createdAt: '2025-06-01T00:00:00Z',
      updatedAt: '2025-06-15T00:00:00Z',
    });
  });
});
