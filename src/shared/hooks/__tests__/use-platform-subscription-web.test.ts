import { act } from '@testing-library/react-native';
import { usePlatformSubscriptionStore, usePlatformSubscription, useIsPro } from '../use-platform-subscription';

// Mock supabase
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      getSession: () => mockGetSession(),
    },
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return { single: () => mockSingle() };
          },
        };
      },
    }),
  },
}));

// Mock feature flags
jest.mock('@/src/config/feature-flags', () => ({
  isFeatureEnabled: jest.fn((flag: string) => flag === 'stripeCheckout'),
}));

// Mock entitlement poller
const mockStartPoller = jest.fn();
const mockStopPoller = jest.fn();
jest.mock('@/src/services/subscription/entitlement-poller', () => ({
  startEntitlementPoller: (...args: unknown[]) => mockStartPoller(...args),
  stopEntitlementPoller: () => mockStopPoller(),
}));

// Mock fetch for Stripe checkout
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:8081',
    origin: 'http://localhost:8081',
  },
});

describe('usePlatformSubscription (web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    usePlatformSubscriptionStore.setState({
      entitlement: {
        isPro: false,
        isTrialing: false,
        status: 'free',
        planType: 'free',
        expiresAt: null,
        trialDaysRemaining: null,
      },
      isLoading: true,
      offerings: null,
    });
  });

  describe('store initial state', () => {
    it('should have free entitlement by default', () => {
      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(false);
      expect(state.entitlement.status).toBe('free');
      expect(state.entitlement.planType).toBe('free');
      expect(state.isLoading).toBe(true);
    });
  });

  describe('refreshStatus', () => {
    it('should fetch subscription from Supabase DB', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSingle.mockResolvedValue({
        data: {
          status: 'active',
          plan_type: 'monthly',
          current_period_end: '2026-03-21T00:00:00Z',
          trial_end: null,
        },
        error: null,
      });

      await act(async () => {
        await usePlatformSubscriptionStore.getState().refreshStatus();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(true);
      expect(state.entitlement.status).toBe('active');
      expect(state.entitlement.planType).toBe('monthly');
      expect(state.entitlement.expiresAt).toBe('2026-03-21T00:00:00Z');
      expect(state.isLoading).toBe(false);
    });

    it('should return free entitlement when no user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      await act(async () => {
        await usePlatformSubscriptionStore.getState().refreshStatus();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(false);
      expect(state.entitlement.status).toBe('free');
      expect(state.isLoading).toBe(false);
    });

    it('should return free entitlement on DB error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await act(async () => {
        await usePlatformSubscriptionStore.getState().refreshStatus();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should handle trial status with remaining days', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSingle.mockResolvedValue({
        data: {
          status: 'trial',
          plan_type: 'monthly',
          current_period_end: futureDate.toISOString(),
          trial_end: futureDate.toISOString(),
        },
        error: null,
      });

      await act(async () => {
        await usePlatformSubscriptionStore.getState().refreshStatus();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(true);
      expect(state.entitlement.isTrialing).toBe(true);
      expect(state.entitlement.trialDaysRemaining).toBeGreaterThan(0);
    });

    it('should handle grace_period as isPro', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSingle.mockResolvedValue({
        data: {
          status: 'grace_period',
          plan_type: 'annual',
          current_period_end: '2026-04-01T00:00:00Z',
          trial_end: null,
        },
        error: null,
      });

      await act(async () => {
        await usePlatformSubscriptionStore.getState().refreshStatus();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(true);
      expect(state.entitlement.status).toBe('grace_period');
    });
  });

  describe('loadOfferings', () => {
    it('should build web offerings from PRICING constants', async () => {
      await act(async () => {
        await usePlatformSubscriptionStore.getState().loadOfferings();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.offerings).not.toBeNull();
      expect(state.offerings?.current?.packages).toHaveLength(3);

      const monthly = state.offerings?.current?.packages.find((p) => p.planType === 'monthly');
      expect(monthly).toBeDefined();
      expect(monthly?.price).toBe(4980);
      expect(monthly?.currencyCode).toBe('JPY');

      const annual = state.offerings?.current?.packages.find((p) => p.planType === 'annual');
      expect(annual).toBeDefined();
      expect(annual?.price).toBe(39800);

      const introAnnual = state.offerings?.current?.packages.find((p) => p.planType === 'annual_intro');
      expect(introAnnual).toBeDefined();
      expect(introAnnual?.price).toBe(29800);
      expect(introAnnual?.introPrice).not.toBeNull();
    });
  });

  describe('purchase', () => {
    it('should create Stripe checkout session and redirect', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
      });

      // First load offerings
      await act(async () => {
        await usePlatformSubscriptionStore.getState().loadOfferings();
      });

      const monthly = usePlatformSubscriptionStore.getState().offerings?.current?.packages.find(
        (p) => p.planType === 'monthly',
      );

      await act(async () => {
        await usePlatformSubscriptionStore.getState().purchase(monthly!);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/create-checkout-session'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should throw when not authenticated', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      await act(async () => {
        await usePlatformSubscriptionStore.getState().loadOfferings();
      });

      const monthly = usePlatformSubscriptionStore.getState().offerings?.current?.packages.find(
        (p) => p.planType === 'monthly',
      );

      await expect(
        usePlatformSubscriptionStore.getState().purchase(monthly!),
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('restore', () => {
    it('should re-fetch from DB and update state', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSingle.mockResolvedValue({
        data: {
          status: 'active',
          plan_type: 'annual',
          current_period_end: '2027-02-21T00:00:00Z',
          trial_end: null,
        },
        error: null,
      });

      let result: boolean | undefined;
      await act(async () => {
        result = await usePlatformSubscriptionStore.getState().restore();
      });

      expect(result).toBe(true);
      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(true);
      expect(state.entitlement.planType).toBe('annual');
    });

    it('should return false when no subscription found', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      let result: boolean | undefined;
      await act(async () => {
        result = await usePlatformSubscriptionStore.getState().restore();
      });

      expect(result).toBe(false);
    });
  });

  describe('manage', () => {
    it('should create Stripe portal session and redirect', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/portal/test' }),
      });

      const store = usePlatformSubscriptionStore.getState() as unknown as { manage: () => Promise<void> };
      await act(async () => {
        await store.manage();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/create-portal-session'),
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should throw when not authenticated', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      const store = usePlatformSubscriptionStore.getState() as unknown as { manage: () => Promise<void> };
      await expect(store.manage()).rejects.toThrow('Not authenticated');
    });
  });

  describe('setEntitlement', () => {
    it('should partially update entitlement', () => {
      usePlatformSubscriptionStore.getState().setEntitlement({ isPro: true, status: 'active' });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(true);
      expect(state.entitlement.status).toBe('active');
      // Other fields unchanged
      expect(state.entitlement.planType).toBe('free');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      usePlatformSubscriptionStore.getState().setEntitlement({ isPro: true, status: 'active' });
      usePlatformSubscriptionStore.getState().setLoading(false);

      usePlatformSubscriptionStore.getState().reset();

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(false);
      expect(state.entitlement.status).toBe('free');
      expect(state.isLoading).toBe(true);
      expect(state.offerings).toBeNull();
    });
  });

  describe('useIsPro', () => {
    it('should return false for free user', () => {
      expect(usePlatformSubscriptionStore.getState().entitlement.isPro).toBe(false);
    });

    it('should return true for pro user', () => {
      usePlatformSubscriptionStore.getState().setEntitlement({ isPro: true });
      expect(usePlatformSubscriptionStore.getState().entitlement.isPro).toBe(true);
    });
  });
});
