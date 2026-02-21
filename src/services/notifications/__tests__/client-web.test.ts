/**
 * OneSignal notifications client.web.ts テスト（M139）
 *
 * Web プラットフォームでの no-op 動作を確認する。
 * Web プッシュ通知は未対応のため全て stub 実装。
 */

import {
  initializeOneSignal,
  requestNotificationPermission,
  loginOneSignal,
  logoutOneSignal,
  addNotificationClickListener,
  getNotificationPermissionStatus,
} from '../client.web';

describe('Notifications client.web — no-op stubs', () => {
  // ---- initializeOneSignal ----

  it('initializeOneSignal is callable and does not throw', () => {
    expect(() => initializeOneSignal()).not.toThrow();
  });

  it('initializeOneSignal returns undefined', () => {
    const result = initializeOneSignal();
    expect(result).toBeUndefined();
  });

  // ---- requestNotificationPermission ----

  it('requestNotificationPermission resolves to false on web', async () => {
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });

  it('requestNotificationPermission returns a Promise', () => {
    const result = requestNotificationPermission();
    expect(result).toBeInstanceOf(Promise);
  });

  // ---- loginOneSignal ----

  it('loginOneSignal is callable with userId and does not throw', () => {
    expect(() => loginOneSignal('user-123')).not.toThrow();
  });

  it('loginOneSignal returns undefined', () => {
    const result = loginOneSignal('user-456');
    expect(result).toBeUndefined();
  });

  // ---- logoutOneSignal ----

  it('logoutOneSignal is callable and does not throw', () => {
    expect(() => logoutOneSignal()).not.toThrow();
  });

  it('logoutOneSignal returns undefined', () => {
    const result = logoutOneSignal();
    expect(result).toBeUndefined();
  });

  // ---- addNotificationClickListener ----

  it('addNotificationClickListener returns an unsubscribe function', () => {
    const callback = jest.fn();
    const unsubscribe = addNotificationClickListener(callback);
    expect(typeof unsubscribe).toBe('function');
  });

  it('addNotificationClickListener unsubscribe does not throw', () => {
    const callback = jest.fn();
    const unsubscribe = addNotificationClickListener(callback);
    expect(() => unsubscribe()).not.toThrow();
  });

  it('callback is never called on web (no push events)', async () => {
    const callback = jest.fn();
    addNotificationClickListener(callback);
    await Promise.resolve();
    expect(callback).not.toHaveBeenCalled();
  });

  // ---- getNotificationPermissionStatus ----

  it('getNotificationPermissionStatus resolves to false on web', async () => {
    const result = await getNotificationPermissionStatus();
    expect(result).toBe(false);
  });

  it('getNotificationPermissionStatus returns a Promise', () => {
    const result = getNotificationPermissionStatus();
    expect(result).toBeInstanceOf(Promise);
  });

  // ---- API サーフェス確認 ----

  it('全エクスポートが関数として存在する', () => {
    expect(typeof initializeOneSignal).toBe('function');
    expect(typeof requestNotificationPermission).toBe('function');
    expect(typeof loginOneSignal).toBe('function');
    expect(typeof logoutOneSignal).toBe('function');
    expect(typeof addNotificationClickListener).toBe('function');
    expect(typeof getNotificationPermissionStatus).toBe('function');
  });
});
