/**
 * @jest-environment jsdom
 */
import type { EntitlementInfo } from '@/src/shared/types/subscription';

// Mock supabase client
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      getSession: () => mockGetSession(),
    },
    from: () => {
      mockFrom();
      return {
        select: (...args: unknown[]) => {
          mockSelect(...args);
          return {
            eq: (...eqArgs: unknown[]) => {
              mockEq(...eqArgs);
              return { single: () => mockSingle() };
            },
          };
        },
      };
    },
  },
}));

// Mock fetch for Stripe checkout
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock revenuecat client (not used in web, but module resolution)
jest.mock('@/src/services/revenuecat/client', () => ({
  checkSubscriptionStatus: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
}));

import { useSubscription } from '../use-subscription.web';

describe('useSubscription (Web)', () => {
  beforeEach(() => {
    useSubscription.getState().reset();
    jest.clearAllMocks();
  });

  it('starts with free entitlement and loading true', () => {
    const state = useSubscription.getState();
    expect(state.entitlement.isPro).toBe(false);
    expect(state.entitlement.status).toBe('free');
    expect(state.isLoading).toBe(true);
    expect(state.offerings).toBeNull();
  });

  it('setEntitlement updates entitlement partially', () => {
    useSubscription.getState().setEntitlement({ isPro: true, status: 'active' });
    const state = useSubscription.getState();
    expect(state.entitlement.isPro).toBe(true);
    expect(state.entitlement.status).toBe('active');
    expect(state.entitlement.planType).toBe('free'); // unchanged
  });

  it('refreshStatus fetches from Supabase DB and updates entitlement', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-001' } } });
    mockSingle.mockResolvedValue({
      data: {
        status: 'active',
        plan_type: 'monthly',
        current_period_end: '2026-02-01T00:00:00Z',
        trial_end: null,
      },
      error: null,
    });

    await useSubscription.getState().refreshStatus();

    const state = useSubscription.getState();
    expect(state.entitlement.isPro).toBe(true);
    expect(state.entitlement.status).toBe('active');
    expect(state.entitlement.planType).toBe('monthly');
    expect(state.entitlement.expiresAt).toBe('2026-02-01T00:00:00Z');
    expect(state.isLoading).toBe(false);
  });

  it('refreshStatus returns free entitlement when no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await useSubscription.getState().refreshStatus();

    const state = useSubscription.getState();
    expect(state.entitlement.isPro).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('refreshStatus handles DB errors gracefully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-001' } } });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    await useSubscription.getState().refreshStatus();

    const state = useSubscription.getState();
    expect(state.entitlement.isPro).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('refreshStatus maps trial status with trialDaysRemaining', async () => {
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-001' } } });
    mockSingle.mockResolvedValue({
      data: {
        status: 'trial',
        plan_type: 'monthly',
        current_period_end: futureDate,
        trial_end: futureDate,
      },
      error: null,
    });

    await useSubscription.getState().refreshStatus();

    const state = useSubscription.getState();
    expect(state.entitlement.isPro).toBe(true);
    expect(state.entitlement.isTrialing).toBe(true);
    expect(state.entitlement.trialDaysRemaining).toBeGreaterThanOrEqual(1);
    expect(state.entitlement.trialDaysRemaining).toBeLessThanOrEqual(3);
  });

  it('loadOfferings returns web pricing packages', async () => {
    const result = await useSubscription.getState().loadOfferings();

    expect(result).not.toBeNull();
    expect(result?.current?.packages).toHaveLength(3);
    const identifiers = result?.current?.packages.map((p) => p.identifier);
    expect(identifiers).toContain('monthly');
    expect(identifiers).toContain('annual');
    expect(identifiers).toContain('annual_intro');
  });

  it('loadOfferings packages have correct price data', async () => {
    const result = await useSubscription.getState().loadOfferings();
    const monthly = result?.current?.packages.find((p) => p.identifier === 'monthly');

    expect(monthly?.price).toBe(4980);
    expect(monthly?.currencyCode).toBe('JPY');
    expect(monthly?.planType).toBe('monthly');
  });

  it('purchase redirects to Stripe checkout URL', async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: { ...originalLocation, href: '', origin: 'https://altme.app' },
    });

    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/test' }),
    });

    const pkg = { identifier: 'monthly', planType: 'monthly' as const, localizedPriceString: '¥4,980', price: 4980, currencyCode: 'JPY' };
    await useSubscription.getState().purchase(pkg);

    expect(window.location.href).toBe('https://checkout.stripe.com/test');

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: originalLocation,
    });
  });

  it('purchase throws on non-auth errors', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const pkg = { identifier: 'monthly', planType: 'monthly' as const, localizedPriceString: '¥4,980', price: 4980, currencyCode: 'JPY' };
    await expect(useSubscription.getState().purchase(pkg)).rejects.toThrow('Not authenticated');
  });

  it('restore re-fetches subscription from DB', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-001' } } });
    mockSingle.mockResolvedValue({
      data: {
        status: 'active',
        plan_type: 'annual',
        current_period_end: '2027-01-01T00:00:00Z',
        trial_end: null,
      },
      error: null,
    });

    const result = await useSubscription.getState().restore();

    expect(result).toBe(true);
    expect(useSubscription.getState().entitlement.isPro).toBe(true);
  });

  it('restore returns false when no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await useSubscription.getState().restore();
    expect(result).toBe(false);
  });

  it('restore returns false on DB error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-001' } } });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const result = await useSubscription.getState().restore();
    expect(result).toBe(false);
  });

  it('reset returns to initial state', () => {
    useSubscription.getState().setEntitlement({ isPro: true, status: 'active' });
    useSubscription.getState().setLoading(false);
    useSubscription.getState().reset();

    const state = useSubscription.getState();
    expect(state.entitlement.isPro).toBe(false);
    expect(state.entitlement.status).toBe('free');
    expect(state.isLoading).toBe(true);
    expect(state.offerings).toBeNull();
  });

  it('maps grace_period status as isPro=true', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-001' } } });
    mockSingle.mockResolvedValue({
      data: {
        status: 'grace_period',
        plan_type: 'monthly',
        current_period_end: '2026-02-01T00:00:00Z',
        trial_end: null,
      },
      error: null,
    });

    await useSubscription.getState().refreshStatus();

    expect(useSubscription.getState().entitlement.isPro).toBe(true);
    expect(useSubscription.getState().entitlement.status).toBe('grace_period');
  });
});
