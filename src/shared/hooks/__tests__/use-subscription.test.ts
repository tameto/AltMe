import { useSubscription } from '../use-subscription';
import {
  checkSubscriptionStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '@/src/services/revenuecat/client';

// Mock the revenuecat client
jest.mock('@/src/services/revenuecat/client', () => ({
  checkSubscriptionStatus: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
}));

const checkSubscriptionStatusMock = checkSubscriptionStatus as jest.Mock;
const getOfferingsMock = getOfferings as jest.Mock;
const purchasePackageMock = purchasePackage as jest.Mock;
const restorePurchasesMock = restorePurchases as jest.Mock;

describe('useSubscription store', () => {
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

  it('refreshStatus fetches and updates entitlement', async () => {
    checkSubscriptionStatusMock.mockResolvedValue({
      isPro: true,
      isTrialing: false,
      status: 'active',
      planType: 'monthly',
      expiresAt: null,
      trialDaysRemaining: null,
    });

    await useSubscription.getState().refreshStatus();

    const state = useSubscription.getState();
    expect(state.entitlement.isPro).toBe(true);
    expect(state.entitlement.status).toBe('active');
    expect(state.entitlement.planType).toBe('monthly');
    expect(state.isLoading).toBe(false);
  });

  it('refreshStatus handles errors gracefully', async () => {
    checkSubscriptionStatusMock.mockRejectedValue(new Error('Network error'));

    await useSubscription.getState().refreshStatus();

    const state = useSubscription.getState();
    expect(state.entitlement.isPro).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('loadOfferings fetches offerings', async () => {
    const mockOfferings = { current: { identifier: 'default', availablePackages: [] } };
    getOfferingsMock.mockResolvedValue(mockOfferings);

    const result = await useSubscription.getState().loadOfferings();

    expect(result).toEqual(mockOfferings);
    expect(useSubscription.getState().offerings).toEqual(mockOfferings);
  });

  it('purchase updates entitlement on success', async () => {
    const mockEntitlement = {
      isPro: true,
      isTrialing: false,
      status: 'active' as const,
      planType: 'monthly' as const,
      expiresAt: null,
      trialDaysRemaining: null,
    };
    purchasePackageMock.mockResolvedValue(mockEntitlement);

    const mockPkg = { identifier: '$rc_monthly' } as never;
    const result = await useSubscription.getState().purchase(mockPkg);

    expect(result).toBe(true);
    expect(useSubscription.getState().entitlement.isPro).toBe(true);
  });

  it('purchase returns false when user cancels', async () => {
    purchasePackageMock.mockRejectedValue(new Error('PURCHASE_CANCELLED'));

    const mockPkg = { identifier: '$rc_monthly' } as never;
    const result = await useSubscription.getState().purchase(mockPkg);

    expect(result).toBe(false);
  });

  it('purchase throws on non-cancellation errors', async () => {
    purchasePackageMock.mockRejectedValue(new Error('PAYMENT_FAILED'));

    const mockPkg = { identifier: '$rc_monthly' } as never;
    await expect(useSubscription.getState().purchase(mockPkg)).rejects.toThrow('PAYMENT_FAILED');
  });

  it('restore updates entitlement on success', async () => {
    const mockEntitlement = {
      isPro: true,
      isTrialing: false,
      status: 'active' as const,
      planType: 'annual' as const,
      expiresAt: null,
      trialDaysRemaining: null,
    };
    restorePurchasesMock.mockResolvedValue(mockEntitlement);

    const result = await useSubscription.getState().restore();

    expect(result).toBe(true);
    expect(useSubscription.getState().entitlement.isPro).toBe(true);
  });

  it('restore returns false on error', async () => {
    restorePurchasesMock.mockRejectedValue(new Error('Restore failed'));

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
});
