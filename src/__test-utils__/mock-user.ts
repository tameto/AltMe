import { useUser } from '@/src/shared/hooks/use-user';
import { useSubscription } from '@/src/shared/hooks/use-subscription';
import type { UserProfile } from '@/src/shared/types/user';
import type { EntitlementInfo } from '@/src/shared/types/subscription';

const defaultUser: UserProfile = {
  id: 'test-user-id',
  displayName: 'Test User',
  avatarUrl: null,
  email: 'test@example.com',
  ageRange: '25-34',
  locale: 'ja',
  timezone: 'Asia/Tokyo',
  onboardingCompleted: true,
  twinName: 'AltMe',
  avatarIcon: 'default',
  speechTone: 'friendly',
  mbtiType: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const freeEntitlement: EntitlementInfo = {
  isPro: false,
  isTrialing: false,
  status: 'free',
  planType: 'free',
  expiresAt: null,
  trialDaysRemaining: null,
};

const proEntitlement: EntitlementInfo = {
  isPro: true,
  isTrialing: false,
  status: 'active',
  planType: 'monthly',
  expiresAt: '2027-01-01T00:00:00.000Z',
  trialDaysRemaining: null,
};

/**
 * Set up stores to simulate an authenticated free user.
 * Returns the user profile for further assertions.
 */
export const mockAuthenticatedUser = (
  overrides?: Partial<UserProfile>,
): UserProfile => {
  const user = { ...defaultUser, ...overrides };
  useUser.setState({ user, isLoading: false });
  useSubscription.setState({
    entitlement: freeEntitlement,
    isLoading: false,
  });
  return user;
};

/**
 * Set up stores to simulate an authenticated Pro subscriber.
 * Returns the user profile for further assertions.
 */
export const mockProUser = (
  userOverrides?: Partial<UserProfile>,
  entitlementOverrides?: Partial<EntitlementInfo>,
): UserProfile => {
  const user = { ...defaultUser, ...userOverrides };
  useUser.setState({ user, isLoading: false });
  useSubscription.setState({
    entitlement: { ...proEntitlement, ...entitlementOverrides },
    isLoading: false,
  });
  return user;
};
