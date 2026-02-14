# 03 — 課金仕様（RevenueCat）

## ステータス: DRAFT
- 作成日: 2026-02-14
- 最終更新: 2026-02-14
- 承認状態: 未承認
- 担当: Agent B (Subscription)

---

## 1. 概要

RevenueCat SDKを使用したサブスクリプション + クレジット制のハイブリッド課金モデル。
初日課金（Day 0 Revenue）を最大化する設計を最優先とする。

---

## 2. プラン構成

### 2.1 サブスクリプションプラン

| プランID | 名称 | 価格 | トライアル | 備考 |
|---------|------|------|----------|------|
| `pro_monthly` | Pro Monthly | ¥980/月 | 3日間無料 | 月額プラン |
| `pro_annual` | Pro Annual | ¥5,800/年（¥483/月相当） | 3日間無料 | 年額プラン（推奨） |
| `pro_intro_annual` | Pro Intro Annual | ¥3,800/年（¥317/月相当） | なし | 初回限定・24時間以内（35%OFF） |

### 2.2 クレジットパック（消耗品）

| プランID | 名称 | 価格 | クレジット数 | 単価 |
|---------|------|------|------------|------|
| `credits_50` | クレジット50 | ¥300 | 50 | ¥6/cr |
| `credits_150` | クレジット150 | ¥800 | 150 | ¥5.3/cr |
| `credits_500` | クレジット500 | ¥2,400 | 500 | ¥4.8/cr |

### 2.3 クレジット消費表

| アクション | 消費クレジット |
|-----------|-------------|
| 深層性格分析（再分析） | 10 |
| 月次成長レポート生成 | 20 |
| 過去チャットの洞察分析 | 5 |

---

## 3. RevenueCat設定

### 3.1 Offering構成

```
Offering: "default"
├── Package: "$rc_annual"     → pro_annual (¥5,800/年)
├── Package: "$rc_monthly"    → pro_monthly (¥980/月)
└── Package: "intro_annual"   → pro_intro_annual (¥3,800/年)

Offering: "credit_packs"
├── Package: "credits_small"  → credits_50 (¥300)
├── Package: "credits_medium" → credits_150 (¥800)
└── Package: "credits_large"  → credits_500 (¥2,400)
```

### 3.2 Entitlement

```
Entitlement: "pro"
  ├── pro_monthly が有効な場合
  ├── pro_annual が有効な場合
  └── pro_intro_annual が有効な場合
```

### 3.3 Experiments（A/Bテスト）

| テスト名 | 対照群 | 実験群 | 主要指標 |
|---------|-------|--------|---------|
| intro_price_test | ¥3,800 | ¥2,800 | Day 0 課金率 |
| trial_length_test | 3日 | 7日 | Trial→有料転換率 |
| paywall_design_test | フルスクリーン | ボトムシート | 購入率 |

---

## 4. 無料 vs 有料の機能マトリクス

| 機能 | Free | Pro | 備考 |
|------|------|-----|------|
| AIチャット | 3回/日 | 無制限 | 日付変更でリセット |
| 性格診断 | サマリーのみ | 詳細レポート | 詳細はブラー解除 |
| 日記 | 利用不可 | 無制限 | Pro専用機能 |
| 感情トラッキング | 利用不可 | 週次/月次レポート | Pro専用機能 |
| AI洞察 | 利用不可 | デイリー配信 | Pro専用機能 |
| 過去データ | 直近7日 | 全期間 | Free制限 |
| AI分身カスタマイズ | 不可 | 3種類まで | Phase 2以降 |
| クレジット消費機能 | 利用不可 | 利用可能 | クレジット別途必要 |

---

## 5. ペイウォール仕様

### 5.1 表示タイミング

| トリガー | 画面 | タイプ |
|---------|------|--------|
| オンボーディング完了直後 | フルスクリーン | ハード（初回） |
| 無料チャット3回到達時 | ボトムシート | ソフト |
| 日記機能タップ時（Free） | ボトムシート | ソフト |
| 洞察タブタップ時（Free） | ボトムシート | ソフト |
| 設定画面「Proにアップグレード」 | フルスクリーン | ソフト |

### 5.2 ペイウォール画面 — `(paywall)/index.tsx`

#### フルスクリーンペイウォール（オンボーディング後）

```
┌──────────────────────────────┐
│ [×]                          │
│                              │
│     ✨ Unlock Your           │
│     AI Twin's Full Power     │
│                              │
│  ┌──────────────────────┐    │
│  │ ☑ Unlimited Chat      │    │
│  │ ☑ Deep Personality    │    │
│  │ ☑ Daily Journal       │    │
│  │ ☑ Mood Tracking       │    │
│  │ ☑ AI Insights         │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │ ⭐ FIRST TIME OFFER   │    │
│  │ ¥3,800/year           │    │
│  │ (¥317/month) 35% OFF  │    │
│  │ ⏰ Expires in 23:42   │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │ Annual ¥5,800/year    │    │
│  │ (¥483/month)          │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │ Monthly ¥980/month    │    │
│  └──────────────────────┘    │
│                              │
│  3-day free trial, then      │
│  auto-renews. Cancel anytime.│
│                              │
│  ┌──────────────────────┐    │
│  │   Start Free Trial    │    │
│  └──────────────────────┘    │
│                              │
│  Restore purchases           │
│  Terms | Privacy             │
└──────────────────────────────┘
```

#### 動作仕様

| 要素 | 動作 |
|------|------|
| [×] ボタン | ペイウォールを閉じてFreeプランで継続 |
| FIRST TIME OFFER | 選択状態→Start Free Trialで初回限定年額購入 |
| Annual | 選択状態→Start Free Trialで通常年額+3日トライアル |
| Monthly | 選択状態→Start Free Trialで月額+3日トライアル |
| Start Free Trial | RevenueCat purchasePackage実行 |
| Restore purchases | RevenueCat restorePurchases実行 |
| カウントダウン | インストール時刻から24時間のリアルタイムカウントダウン |

### 5.3 初回限定オファーのロジック

```typescript
// 初回限定オファーの表示条件
const showIntroOffer = (): boolean => {
  const installTime = getInstallTime(); // AsyncStorage
  const now = Date.now();
  const hoursSinceInstall = (now - installTime) / (1000 * 60 * 60);
  const hasEverPurchased = getHasEverPurchased(); // RevenueCat

  return hoursSinceInstall <= 24 && !hasEverPurchased;
};
```

---

## 6. 実装仕様

### 6.1 RevenueCat初期化

```typescript
// src/services/revenuecat/client.ts

import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

export const initializeRevenueCat = async (): Promise<void> => {
  Purchases.configure({
    apiKey: Platform.select({
      ios: REVENUECAT_IOS_API_KEY,
      android: REVENUECAT_ANDROID_API_KEY,
    }),
  });
};
```

### 6.2 useSubscription hook

```typescript
// src/shared/hooks/use-subscription.ts

type UseSubscriptionReturn = {
  entitlement: EntitlementInfo;
  isLoading: boolean;
  purchase: (packageId: string) => Promise<void>;
  restore: () => Promise<void>;
  getOfferings: () => Promise<Offerings>;
};

// このhookは以下を提供:
// 1. 現在のEntitlement状態（isPro, status, planType等）
// 2. 購入実行関数
// 3. リストア関数
// 4. Offering取得関数
```

### 6.3 usePaywall hook

```typescript
// src/features/subscription/hooks/use-paywall.ts

type UsePaywallReturn = {
  offerings: Offerings | null;
  selectedPackage: Package | null;
  selectPackage: (pkg: Package) => void;
  purchaseSelected: () => Promise<boolean>;
  showIntroOffer: boolean;
  introCountdown: string; // "23:42:15"
  isLoading: boolean;
  error: string | null;
};
```

### 6.4 無料チャット上限チェック

```typescript
// src/features/chat/hooks/use-chat-limit.ts

type UseChatLimitReturn = {
  remainingChats: number;    // 残りチャット回数
  isLimitReached: boolean;   // 上限到達
  dailyLimit: number;        // 1日の上限（FREE_DAILY_CHAT_LIMIT = 3）
  resetTime: string;         // リセット時刻（翌日0:00）
};

// チャット回数のカウント方法:
// - ユーザーのrole='user'のメッセージを当日分カウント
// - タイムゾーンはprofiles.timezoneを使用
// - Entitlement 'pro' が有効なら上限なし
```

---

## 7. Webhook仕様

### 7.1 RevenueCat → Supabase Edge Function

エンドポイント: `POST /functions/v1/webhook-revenuecat`

#### 処理するイベント

| イベント | 処理 |
|---------|------|
| INITIAL_PURCHASE | subscriptions.status = 'active', plan_type設定 |
| TRIAL_STARTED | subscriptions.status = 'trial', trial_start/end設定 |
| TRIAL_CONVERTED | subscriptions.status = 'active' |
| RENEWAL | current_period更新 |
| CANCELLATION | subscriptions.status = 'cancelled' |
| EXPIRATION | subscriptions.status = 'expired' |
| BILLING_ISSUE | subscriptions.status = 'grace_period' |
| NON_RENEWING_PURCHASE | クレジット購入→credits.balance加算 |

#### Webhook検証

```typescript
// Authorization headerでRevenueCatのWebhook Signing Secretを検証
const isValidWebhook = (req: Request): boolean => {
  const authHeader = req.headers.get('Authorization');
  return authHeader === `Bearer ${REVENUECAT_WEBHOOK_SECRET}`;
};
```

---

## 8. 解約防止フロー

### 8.1 解約検知

RevenueCat SDKのlistenerで解約意向を検知した場合:

```
解約ボタンタップ
  ↓
確認ダイアログ表示
  「AltMeを解約しますか？」
  「あなたのAI分身は{chatCount}回の会話を通じて
   あなたのことを学んできました」
  ↓
  ├── 「やっぱり続ける」→ 解約キャンセル
  ├── 「解約理由を教えてください」→ 理由選択画面
  │     ├── 「価格が高い」→ 月額プランへのダウングレード提案
  │     ├── 「あまり使わない」→ 使い方のヒント表示
  │     ├── 「他のアプリを使う」→ AltMeの強み表示
  │     └── 「その他」→ フリーテキスト
  └── 理由送信後→ Apple/Googleの管理画面へ遷移
```

---

## 9. KPI計測

### 9.1 トラッキングイベント

| イベント名 | タイミング | パラメータ |
|-----------|----------|----------|
| `paywall_shown` | ペイウォール表示時 | trigger, showIntroOffer |
| `paywall_closed` | ペイウォールを閉じた時 | trigger |
| `package_selected` | プラン選択時 | packageId, price |
| `purchase_started` | 購入開始時 | packageId |
| `purchase_completed` | 購入完了時 | packageId, revenue |
| `purchase_failed` | 購入失敗時 | packageId, error |
| `purchase_restored` | リストア実行時 | success |
| `trial_started` | トライアル開始時 | packageId |
| `intro_offer_shown` | 初回限定オファー表示時 | - |
| `intro_offer_expired` | 24時間経過時 | - |
| `chat_limit_reached` | チャット上限到達時 | - |
| `churn_dialog_shown` | 解約防止ダイアログ表示時 | - |
| `churn_prevented` | 解約キャンセル時 | - |
| `churn_reason` | 解約理由送信時 | reason |

---

## 10. 検証条件

- [ ] RevenueCat SDKが正常に初期化されること
- [ ] Offeringから全プランが取得できること
- [ ] 月額プランの購入→Entitlement 'pro' がtrueになること
- [ ] 年額プランの購入→Entitlement 'pro' がtrueになること
- [ ] 初回限定プランが24時間以内にのみ表示されること
- [ ] 3日トライアルが正常に開始されること
- [ ] トライアル→有料への自動転換が動作すること
- [ ] クレジットパック購入→残高が加算されること
- [ ] クレジット消費→残高が減算されること（残高不足時はエラー）
- [ ] 無料ユーザーのチャットが1日3回に制限されること
- [ ] Pro ユーザーのチャットが無制限であること
- [ ] Webhookで購入イベントがDBに反映されること
- [ ] リストアが正常に動作すること
- [ ] ペイウォールの閉じるボタンが動作すること（Apple審査対応）
- [ ] カウントダウンタイマーがリアルタイムで動作すること
