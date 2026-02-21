/**
 * RevenueCat client.web.ts テスト（M139）
 *
 * Web プラットフォームでの no-op 動作を確認する。
 * In-app purchases は Web 非対応のため全て stub 実装。
 */

import {
  initializeRevenueCat,
  checkSubscriptionStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
  identifyUser,
  logOutRevenueCat,
  addCustomerInfoListener,
  hasNeverPurchased,
  mapCustomerInfo,
} from '../client.web';
import type { SubscriptionPackage } from '@/src/shared/types/subscription';

const mockPackage: SubscriptionPackage = {
  identifier: 'altme_monthly_980',
  planType: 'monthly',
  localizedPriceString: '¥980',
  price: 980,
  currencyCode: 'JPY',
  introPrice: null,
};

describe('RevenueCat client.web — no-op stubs', () => {
  // ---- initializeRevenueCat ----

  it('initializeRevenueCat resolves without error', async () => {
    await expect(initializeRevenueCat()).resolves.toBeUndefined();
  });

  it('initializeRevenueCat accepts optional userId', async () => {
    await expect(initializeRevenueCat('user-123')).resolves.toBeUndefined();
  });

  // ---- checkSubscriptionStatus ----

  it('checkSubscriptionStatus returns free entitlement', async () => {
    const result = await checkSubscriptionStatus();
    expect(result.isPro).toBe(false);
    expect(result.status).toBe('free');
    expect(result.planType).toBe('free');
    expect(result.isTrialing).toBe(false);
    expect(result.expiresAt).toBeNull();
    expect(result.trialDaysRemaining).toBeNull();
  });

  // ---- getOfferings ----

  it('getOfferings returns null on web', async () => {
    const result = await getOfferings();
    expect(result).toBeNull();
  });

  // ---- purchasePackage ----

  it('purchasePackage throws on web', async () => {
    await expect(purchasePackage(mockPackage)).rejects.toThrow(
      'In-app purchases are not supported on web',
    );
  });

  it('purchasePackage error message mentions mobile app', async () => {
    await expect(purchasePackage(mockPackage)).rejects.toThrow(
      /mobile app/i,
    );
  });

  // ---- restorePurchases ----

  it('restorePurchases returns free entitlement on web', async () => {
    const result = await restorePurchases();
    expect(result.isPro).toBe(false);
    expect(result.status).toBe('free');
  });

  // ---- identifyUser ----

  it('identifyUser resolves without error', async () => {
    await expect(identifyUser('user-123')).resolves.toBeUndefined();
  });

  // ---- logOutRevenueCat ----

  it('logOutRevenueCat resolves without error', async () => {
    await expect(logOutRevenueCat()).resolves.toBeUndefined();
  });

  // ---- addCustomerInfoListener ----

  it('addCustomerInfoListener returns unsubscribe function', () => {
    const listener = jest.fn();
    const unsubscribe = addCustomerInfoListener(listener);
    expect(typeof unsubscribe).toBe('function');
  });

  it('addCustomerInfoListener unsubscribe does not throw', () => {
    const listener = jest.fn();
    const unsubscribe = addCustomerInfoListener(listener);
    expect(() => unsubscribe()).not.toThrow();
  });

  it('listener is never called (no-op)', async () => {
    const listener = jest.fn();
    addCustomerInfoListener(listener);
    // Web では購読イベントが発生しない
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
  });

  // ---- hasNeverPurchased ----

  it('hasNeverPurchased returns true on web', async () => {
    const result = await hasNeverPurchased();
    expect(result).toBe(true);
  });

  // ---- mapCustomerInfo ----

  it('mapCustomerInfo always returns free entitlement on web', () => {
    const result = mapCustomerInfo({});
    expect(result.isPro).toBe(false);
    expect(result.status).toBe('free');
  });
});
