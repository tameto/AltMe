/**
 * Analytics API 統合テスト（M138）
 *
 * Web と Native で同一の API サーフェスが公開されているか確認する。
 * tracker.ts barrel ファイル経由でのインポート（TypeScript 解決パス）を検証。
 */

// tracker.native.ts が共有プロジェクト（node env / iOS preset）でテストされる
import * as trackerNative from '../tracker.native';
import * as trackerWeb from '../tracker.web';

describe('Analytics API surface — Web と Native で一致', () => {
  const requiredExports = [
    'initializeAnalytics',
    'trackEvent',
    'identifyUser',
    'resetUser',
    'trackScreen',
    'trackPaywallViewed',
    'trackPaywallPlanSelected',
    'trackPurchaseStarted',
    'trackPurchaseCompleted',
    'trackPurchaseFailed',
    'trackTrialStarted',
    'trackOnboardingStarted',
    'trackOnboardingCompleted',
    'trackPersonalityQuizCompleted',
    'trackChatSent',
    'trackJournalCreated',
    'trackMoodRecorded',
    'EVENT_NAMES',
  ];

  it.each(requiredExports)('%s は Native に存在する', (exportName) => {
    expect(trackerNative).toHaveProperty(exportName);
  });

  it.each(requiredExports)('%s は Web に存在する', (exportName) => {
    expect(trackerWeb).toHaveProperty(exportName);
  });

  it('Native と Web で同じ EVENT_NAMES キーを持つ', () => {
    expect(Object.keys(trackerNative.EVENT_NAMES).sort()).toEqual(
      Object.keys(trackerWeb.EVENT_NAMES).sort(),
    );
  });

  it('Native と Web で EVENT_NAMES の値が一致する', () => {
    expect(trackerNative.EVENT_NAMES).toEqual(trackerWeb.EVENT_NAMES);
  });

  it('initializeAnalytics は両プラットフォームで Promise を返す', async () => {
    await expect(trackerNative.initializeAnalytics()).resolves.not.toThrow();
    await expect(trackerWeb.initializeAnalytics()).resolves.not.toThrow();
  });

  it('identifyUser は両プラットフォームで関数として存在する', () => {
    expect(typeof trackerNative.identifyUser).toBe('function');
    expect(typeof trackerWeb.identifyUser).toBe('function');
  });

  it('resetUser は両プラットフォームで関数として存在する', () => {
    expect(typeof trackerNative.resetUser).toBe('function');
    expect(typeof trackerWeb.resetUser).toBe('function');
  });

  it('trackScreen は両プラットフォームで関数として存在する', () => {
    expect(typeof trackerNative.trackScreen).toBe('function');
    expect(typeof trackerWeb.trackScreen).toBe('function');
  });

  it('trackEvent は両プラットフォームでクラッシュしない', () => {
    expect(() =>
      trackerNative.trackEvent({ name: 'test_native', properties: { x: 1 } }),
    ).not.toThrow();
    expect(() =>
      trackerWeb.trackEvent({ name: 'test_web', properties: { x: 1 } }),
    ).not.toThrow();
  });

  it('trackScreen は両プラットフォームでクラッシュしない', () => {
    expect(() => trackerNative.trackScreen('TestScreen')).not.toThrow();
    expect(() => trackerWeb.trackScreen('TestScreen')).not.toThrow();
  });
});
