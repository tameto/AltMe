---
name: revenuecat
description: |
  RevenueCat サブスクリプション管理の専門スキル。
  SDK統合、Entitlementチェック、ペイウォール実装、Webhook処理、API v2操作を担当。
  トリガー: RevenueCat, サブスクリプション, 課金, ペイウォール, Entitlement, IAP, 購入
---

# RevenueCat Subscription Management

RevenueCat を使用したサブスクリプション・アプリ内課金の実装ガイド。
React Native (Expo) での統合に特化。

## SDK セットアップ（React Native）

### インストール

```bash
npx expo install react-native-purchases
npx expo install expo-dev-client  # カスタム dev client が必要
```

### 初期化

```typescript
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const configureRevenueCat = async (appUserId?: string) => {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({
    apiKey: Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
    })!,
    appUserID: appUserId ?? null, // null = 匿名ID自動生成
  });
};
```

**重要ルール:**
- SDK 初期化はアプリ起動時の早い段階で行う
- Public API Key のみ使用。Secret Key は絶対にクライアントに含めない
- `appUserID` に Supabase の `auth.uid()` を設定してユーザー紐付け

### Supabase Auth との連携

```typescript
// ログイン後に RevenueCat ユーザーIDを設定
const onLogin = async (supabaseUserId: string) => {
  const { customerInfo } = await Purchases.logIn(supabaseUserId);
  return customerInfo;
};

// ログアウト時
const onLogout = async () => {
  await Purchases.logOut(); // 匿名IDにリセット
};
```

## Entitlement チェック

```typescript
import Purchases, { CustomerInfo } from 'react-native-purchases';

const checkProAccess = async (): Promise<boolean> => {
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo.entitlements.active['pro'] !== undefined;
};

// リアルタイムリスナー
Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
  const isPro = customerInfo.entitlements.active['pro'] !== undefined;
  // Zustand store を更新
  useSubscriptionStore.getState().setIsPro(isPro);
});
```

## Offering & Package 取得

```typescript
const getOfferings = async () => {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return null;

  return {
    monthly: current.monthly,     // $rc_monthly パッケージ
    annual: current.annual,       // $rc_annual パッケージ
    // カスタムパッケージ
    introAnnual: current.availablePackages.find(
      (p) => p.identifier === 'intro_annual'
    ),
  };
};
```

## 購入フロー

```typescript
import Purchases, { PurchasesPackage } from 'react-native-purchases';

const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (customerInfo.entitlements.active['pro']) {
      // 購入成功 → ペイウォールを閉じる
      return { success: true };
    }
    return { success: false, error: 'Entitlement not active' };
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, cancelled: true };
    }
    return { success: false, error: e.message };
  }
};
```

## 購入復元

```typescript
// ユーザー操作（ボタンタップ）からのみ呼ぶこと
const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['pro'] !== undefined;
  } catch (e) {
    console.error('Restore failed:', e);
    return false;
  }
};
```

**重要:** `restorePurchases` は自動的に呼ばない。必ずユーザーのボタンタップから。

## AltMe 課金設計

### Offering 構成

```
Offering: default
├── $rc_monthly   → 月額 ¥4,980
├── $rc_annual    → 年額 ¥39,800（月換算 ¥3,317、33%OFF）
└── intro_annual  → 初回限定 ¥29,800（50%OFF、24時間限定）
```

### Entitlement

```
Entitlement: "pro"
├── OpenClaw インスタンスアクセス
├── 無制限チャット
├── 詳細性格分析
├── 日記機能
├── 感情トラッキング
└── 全期間データアクセス
```

### サブスクリプションステータス

| ステータス | 説明 |
|-----------|------|
| `trialing` | トライアル期間中 |
| `active` | 有効な課金中 |
| `expired` | 期限切れ |
| `in_grace_period` | 猶予期間（支払い失敗後16日間） |
| `in_billing_retry` | 支払いリトライ中 |
| `paused` | 一時停止中 |

### auto_renewal_status

| ステータス | 説明 |
|-----------|------|
| `will_renew` | 自動更新予定 |
| `will_not_renew` | 解約済み（期間終了まで有効） |
| `will_change_product` | プラン変更予定 |
| `will_pause` | 一時停止予定 |
| `requires_price_increase_consent` | 値上げ同意待ち |
| `has_already_renewed` | 既に更新済み |

## Day 0 課金ファネル

```
インストール → オンボーディング（性格診断）→ AI分身お披露目
  → チャット3回（無料制限） → フルスクリーンペイウォール
  → 3日間無料トライアル or 即時課金
```

### ペイウォール設計チェックリスト

```
[ ] 年額プランを先に表示（アンカリング効果）
[ ] 月額換算を表示（¥3,317/月）
[ ] 初回限定オファーのカウントダウンタイマー
[ ] 閉じるボタンは小さく配置（Apple審査基準に準拠）
[ ] 3日間無料トライアルを明記
[ ] 復元ボタンを必ず配置（App Store審査要件）
[ ] プライバシーポリシー・利用規約リンク
```

## Webhook イベント概要

RevenueCat → Supabase Edge Function でサブスクリプション状態を同期:

| イベント | トリガー | AltMe アクション |
|---------|---------|----------------|
| `INITIAL_PURCHASE` | 初回購入/トライアル開始 | subscriptions upsert, OpenClaw プロビジョニング |
| `RENEWAL` | サブスクリプション更新 | subscriptions upsert |
| `CANCELLATION` | 解約 | status → cancelled |
| `UNCANCELLATION` | 解約取り消し | status → active |
| `EXPIRATION` | 期限切れ | status → expired, OpenClaw 停止 |
| `BILLING_ISSUE` | 支払い失敗 | status → billing_issue, プッシュ通知 |
| `PRODUCT_CHANGE` | プラン変更 | plan_type 更新 |
| `TRANSFER` | アカウント間転送 | user_id 移行 |
| `SUBSCRIPTION_PAUSED` | 一時停止 | status → paused |

詳細: `references/webhook-events.md`

## レート制限

| API ドメイン | 制限 |
|-------------|------|
| Customer Information | 480 req/min |
| Charts & Metrics | 5 req/min |
| Project Configuration | 60 req/min |
| Virtual Currencies (Transaction) | 480 req/min |

## 参照ドキュメント

### SDK & 実装パターン
- `references/sdk-patterns.md` — SDK初期化全パターン、Zustand統合、購入フロー、復元、Supabase Auth連携、サンドボックステスト手順

### REST API v2
- `references/api-v2.md` — 全エンドポイント詳細（Projects, Customers 16EP, Subscriptions, Products, Offerings, Entitlements 8EP, Purchases, Paywalls, Integrations, Virtual Currencies, Charts & Metrics）

### Webhook
- `references/webhook-events.md` — 全17イベントタイプ、ペイロード例（JSON）、AltMe での処理パターン、OpenClaw インスタンス管理連動

### エラーハンドリング
- `references/error-handling.md` — HTTP エラーコード、PURCHASES_ERROR_CODE 全22コード、日本語エラーメッセージ、リトライ戦略、レート制限詳細

### メトリクス
- `references/metrics.md` — Charts & Metrics API、21種類のチャート、AltMe KPI（MRR, Day 0課金率, Trial転換率, 解約率, LTV）のAPI取得パターン

### ツール
- `scripts/rc-api.sh` — REST API v2 CLIラッパー（GET/POST/PUT/DELETE 対応）

### 外部リソース
- RevenueCat Docs: https://www.revenuecat.com/docs
- RevenueCat LLM Docs: https://www.revenuecat.com/docs/llms.txt
- Status Page: https://status.revenuecat.com
