import { mapCustomerInfo } from '../client';
import type { CustomerInfo } from 'react-native-purchases';

const makeCustomerInfo = (overrides: Record<string, unknown> = {}): CustomerInfo => ({
  entitlements: {
    active: {},
    all: {},
    verification: 'NOT_REQUESTED' as const,
  },
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
  firstSeen: '2026-01-01T00:00:00Z',
  latestExpirationDate: null,
  managementURL: null,
  nonSubscriptionTransactions: [],
  originalAppUserId: 'user-123',
  originalApplicationVersion: null,
  originalPurchaseDate: null,
  requestDate: '2026-02-14T00:00:00Z',
  allExpirationDates: {},
  allPurchaseDates: {},
  ...overrides,
} as unknown as CustomerInfo);

describe('mapCustomerInfo', () => {
  it('returns free entitlement when no pro entitlement exists', () => {
    const info = makeCustomerInfo();
    const result = mapCustomerInfo(info);

    expect(result.isPro).toBe(false);
    expect(result.status).toBe('free');
    expect(result.planType).toBeNull();
    expect(result.trialDaysRemaining).toBeNull();
    expect(result.credits).toBe(0);
  });

  it('returns active pro for monthly subscription', () => {
    const info = makeCustomerInfo({
      entitlements: {
        active: {
          pro: {
            identifier: 'pro',
            isActive: true,
            willRenew: true,
            periodType: 'NORMAL',
            productIdentifier: 'altme_monthly_980',
            isSandbox: false,
            latestPurchaseDate: '2026-02-01T00:00:00Z',
            originalPurchaseDate: '2026-02-01T00:00:00Z',
            expirationDate: '2026-03-01T00:00:00Z',
            store: 'APP_STORE',
            unsubscribeDetectedAt: null,
            billingIssueDetectedAt: null,
            ownershipType: 'PURCHASED',
            productPlanIdentifier: null,
            verification: 'NOT_REQUESTED',
          },
        },
        all: {},
        verification: 'NOT_REQUESTED',
      },
    });

    const result = mapCustomerInfo(info);

    expect(result.isPro).toBe(true);
    expect(result.status).toBe('active');
    expect(result.planType).toBe('monthly');
    expect(result.trialDaysRemaining).toBeNull();
  });

  it('returns active pro for annual subscription', () => {
    const info = makeCustomerInfo({
      entitlements: {
        active: {
          pro: {
            identifier: 'pro',
            isActive: true,
            willRenew: true,
            periodType: 'NORMAL',
            productIdentifier: 'altme_annual_5800',
            isSandbox: false,
            latestPurchaseDate: '2026-01-01T00:00:00Z',
            originalPurchaseDate: '2026-01-01T00:00:00Z',
            expirationDate: '2027-01-01T00:00:00Z',
            store: 'APP_STORE',
            unsubscribeDetectedAt: null,
            billingIssueDetectedAt: null,
            ownershipType: 'PURCHASED',
            productPlanIdentifier: null,
            verification: 'NOT_REQUESTED',
          },
        },
        all: {},
        verification: 'NOT_REQUESTED',
      },
    });

    const result = mapCustomerInfo(info);

    expect(result.isPro).toBe(true);
    expect(result.status).toBe('active');
    expect(result.planType).toBe('annual');
  });

  it('returns intro_annual for intro annual subscription', () => {
    const info = makeCustomerInfo({
      entitlements: {
        active: {
          pro: {
            identifier: 'pro',
            isActive: true,
            willRenew: true,
            periodType: 'NORMAL',
            productIdentifier: 'altme_intro_annual_3800',
            isSandbox: false,
            latestPurchaseDate: '2026-01-01T00:00:00Z',
            originalPurchaseDate: '2026-01-01T00:00:00Z',
            expirationDate: '2027-01-01T00:00:00Z',
            store: 'APP_STORE',
            unsubscribeDetectedAt: null,
            billingIssueDetectedAt: null,
            ownershipType: 'PURCHASED',
            productPlanIdentifier: null,
            verification: 'NOT_REQUESTED',
          },
        },
        all: {},
        verification: 'NOT_REQUESTED',
      },
    });

    const result = mapCustomerInfo(info);

    expect(result.isPro).toBe(true);
    expect(result.planType).toBe('intro_annual');
  });

  it('returns trial status with remaining days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);

    const info = makeCustomerInfo({
      entitlements: {
        active: {
          pro: {
            identifier: 'pro',
            isActive: true,
            willRenew: true,
            periodType: 'TRIAL',
            productIdentifier: 'altme_monthly_980',
            isSandbox: false,
            latestPurchaseDate: '2026-02-12T00:00:00Z',
            originalPurchaseDate: '2026-02-12T00:00:00Z',
            expirationDate: future.toISOString(),
            store: 'APP_STORE',
            unsubscribeDetectedAt: null,
            billingIssueDetectedAt: null,
            ownershipType: 'PURCHASED',
            productPlanIdentifier: null,
            verification: 'NOT_REQUESTED',
          },
        },
        all: {},
        verification: 'NOT_REQUESTED',
      },
    });

    const result = mapCustomerInfo(info);

    expect(result.isPro).toBe(true);
    expect(result.status).toBe('trial');
    expect(result.trialDaysRemaining).toBeGreaterThanOrEqual(1);
    expect(result.trialDaysRemaining).toBeLessThanOrEqual(3);
  });

  it('returns cancelled status when willRenew is false', () => {
    const info = makeCustomerInfo({
      entitlements: {
        active: {
          pro: {
            identifier: 'pro',
            isActive: true,
            willRenew: false,
            periodType: 'NORMAL',
            productIdentifier: 'altme_monthly_980',
            isSandbox: false,
            latestPurchaseDate: '2026-02-01T00:00:00Z',
            originalPurchaseDate: '2026-02-01T00:00:00Z',
            expirationDate: '2026-03-01T00:00:00Z',
            store: 'APP_STORE',
            unsubscribeDetectedAt: '2026-02-10T00:00:00Z',
            billingIssueDetectedAt: null,
            ownershipType: 'PURCHASED',
            productPlanIdentifier: null,
            verification: 'NOT_REQUESTED',
          },
        },
        all: {},
        verification: 'NOT_REQUESTED',
      },
    });

    const result = mapCustomerInfo(info);

    expect(result.isPro).toBe(true);
    expect(result.status).toBe('cancelled');
  });
});
