import { act } from '@testing-library/react-native';
import { usePlatformSubscriptionStore } from '../use-platform-subscription';

// Mock RevenueCat client
const mockCheckSubscriptionStatus = jest.fn();
const mockGetOfferings = jest.fn();
const mockPurchasePackage = jest.fn();
const mockRestorePurchases = jest.fn();
const mockAddCustomerInfoListener = jest.fn().mockReturnValue(jest.fn());

jest.mock('@/src/services/revenuecat/client', () => ({
  checkSubscriptionStatus: () => mockCheckSubscriptionStatus(),
  getOfferings: () => mockGetOfferings(),
  purchasePackage: (pkg: unknown) => mockPurchasePackage(pkg),
  restorePurchases: () => mockRestorePurchases(),
  addCustomerInfoListener: (cb: unknown) => mockAddCustomerInfoListener(cb),
}));

const freeEntitlement = {
  isPro: false,
  isTrialing: false,
  status: 'free' as const,
  planType: 'free' as const,
  expiresAt: null,
  trialDaysRemaining: null,
};

const proEntitlement = {
  isPro: true,
  isTrialing: false,
  status: 'active' as const,
  planType: 'monthly' as const,
  expiresAt: '2026-03-21T00:00:00Z',
  trialDaysRemaining: null,
};

const trialEntitlement = {
  isPro: true,
  isTrialing: true,
  status: 'trial' as const,
  planType: 'monthly' as const,
  expiresAt: '2026-02-24T00:00:00Z',
  trialDaysRemaining: 3,
};

describe('usePlatformSubscription (native)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePlatformSubscriptionStore.setState({
      entitlement: freeEntitlement,
      isLoading: true,
      offerings: null,
    });
  });

  describe('store initial state', () => {
    it('should have free entitlement by default', () => {
      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(false);
      expect(state.entitlement.status).toBe('free');
      expect(state.isLoading).toBe(true);
    });
  });

  describe('refreshStatus', () => {
    it('should fetch status from RevenueCat', async () => {
      mockCheckSubscriptionStatus.mockResolvedValue(proEntitlement);

      await act(async () => {
        await usePlatformSubscriptionStore.getState().refreshStatus();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(true);
      expect(state.entitlement.status).toBe('active');
      expect(state.entitlement.planType).toBe('monthly');
      expect(state.isLoading).toBe(false);
    });

    it('should handle trial entitlement', async () => {
      mockCheckSubscriptionStatus.mockResolvedValue(trialEntitlement);

      await act(async () => {
        await usePlatformSubscriptionStore.getState().refreshStatus();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(true);
      expect(state.entitlement.isTrialing).toBe(true);
      expect(state.entitlement.trialDaysRemaining).toBe(3);
    });

    it('should handle errors gracefully', async () => {
      mockCheckSubscriptionStatus.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await usePlatformSubscriptionStore.getState().refreshStatus();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('loadOfferings', () => {
    it('should load offerings from RevenueCat', async () => {
      const mockOfferings = {
        current: {
          identifier: 'default',
          packages: [
            {
              identifier: 'monthly',
              planType: 'monthly',
              localizedPriceString: '\u00A54,980',
              price: 4980,
              currencyCode: 'JPY',
              introPrice: null,
            },
          ],
        },
      };
      mockGetOfferings.mockResolvedValue(mockOfferings);

      await act(async () => {
        await usePlatformSubscriptionStore.getState().loadOfferings();
      });

      const state = usePlatformSubscriptionStore.getState();
      expect(state.offerings).toEqual(mockOfferings);
    });

    it('should handle offerings load error', async () => {
      mockGetOfferings.mockRejectedValue(new Error('Offerings error'));

      await act(async () => {
        const result = await usePlatformSubscriptionStore.getState().loadOfferings();
        expect(result).toBeNull();
      });
    });
  });

  describe('purchase', () => {
    it('should purchase via RevenueCat and update state', async () => {
      mockPurchasePackage.mockResolvedValue(proEntitlement);

      const pkg = {
        identifier: 'monthly',
        planType: 'monthly' as const,
        localizedPriceString: '\u00A54,980',
        price: 4980,
        currencyCode: 'JPY',
        introPrice: null,
      };

      let result: boolean | undefined;
      await act(async () => {
        result = await usePlatformSubscriptionStore.getState().purchase(pkg);
      });

      expect(result).toBe(true);
      expect(mockPurchasePackage).toHaveBeenCalledWith(pkg);
      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(true);
    });

    it('should return false on user cancellation', async () => {
      mockPurchasePackage.mockRejectedValue(new Error('PURCHASE_CANCELLED'));

      const pkg = {
        identifier: 'monthly',
        planType: 'monthly' as const,
        localizedPriceString: '\u00A54,980',
        price: 4980,
        currencyCode: 'JPY',
        introPrice: null,
      };

      let result: boolean | undefined;
      await act(async () => {
        result = await usePlatformSubscriptionStore.getState().purchase(pkg);
      });

      expect(result).toBe(false);
    });

    it('should re-throw non-cancellation errors', async () => {
      mockPurchasePackage.mockRejectedValue(new Error('Payment failed'));

      const pkg = {
        identifier: 'monthly',
        planType: 'monthly' as const,
        localizedPriceString: '\u00A54,980',
        price: 4980,
        currencyCode: 'JPY',
        introPrice: null,
      };

      await expect(
        usePlatformSubscriptionStore.getState().purchase(pkg),
      ).rejects.toThrow('Payment failed');
    });
  });

  describe('restore', () => {
    it('should restore purchases from RevenueCat', async () => {
      mockRestorePurchases.mockResolvedValue(proEntitlement);

      let result: boolean | undefined;
      await act(async () => {
        result = await usePlatformSubscriptionStore.getState().restore();
      });

      expect(result).toBe(true);
      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(true);
    });

    it('should return false when no purchases to restore', async () => {
      mockRestorePurchases.mockResolvedValue(freeEntitlement);

      let result: boolean | undefined;
      await act(async () => {
        result = await usePlatformSubscriptionStore.getState().restore();
      });

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRestorePurchases.mockRejectedValue(new Error('Restore error'));

      let result: boolean | undefined;
      await act(async () => {
        result = await usePlatformSubscriptionStore.getState().restore();
      });

      expect(result).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      usePlatformSubscriptionStore.getState().setEntitlement(proEntitlement);
      usePlatformSubscriptionStore.getState().setLoading(false);

      usePlatformSubscriptionStore.getState().reset();

      const state = usePlatformSubscriptionStore.getState();
      expect(state.entitlement.isPro).toBe(false);
      expect(state.entitlement.status).toBe('free');
      expect(state.isLoading).toBe(true);
      expect(state.offerings).toBeNull();
    });
  });
});
