# 03 — サブスクリプション・課金仕様

## ステータス: APPROVED
- 作成日: 2026-02-14
- 最終更新: 2026-02-15
- 担当: Agent B (Subscription)

---

## 1. 概要

RevenueCat SDKを使用したサブスクリプション課金モデル。
初日課金（Day 0 Revenue）を最大化する設計を最優先とする。
課金後、ユーザー専用のOpenClawインスタンスがDigitalOcean上にプロビジョニングされる。

---

## 2. 課金体系

### 2.1 サブスクリプションプラン

| プランID | 名称 | 価格 | 月額換算 | トライアル | 備考 |
|---------|------|------|---------|----------|------|
| `pro_monthly` | Pro Monthly | ¥4,980/月 | ¥4,980 | 3日間無料 | 標準月額プラン |
| `pro_annual` | Pro Annual | ¥39,800/年 | ¥3,317 (33%OFF) | 3日間無料 | 年額プラン（推奨） |
| `pro_annual_intro` | Pro Intro Annual | ¥29,800/年 | ¥2,483 (50%OFF) | なし | 初回限定、登録から24時間以内のみ表示 |

**価格定数**: `src/config/constants.ts` の `PRICING` オブジェクトで管理

```typescript
export const PRICING = {
  MONTHLY: 4980,
  ANNUAL: 39800,
  ANNUAL_INTRO: 29800,
  CURRENCY: 'JPY',
  INTRO_OFFER_HOURS: 24,
  TRIAL_DAYS: 3,
} as const;
```

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

## 3. Free vs Pro 機能比較

| 機能 | Free | Pro | 備考 |
|------|------|-----|------|
| AIチャット | 1日3回（Supabase Edge Function経由、SSE） | 無制限（専用OpenClawインスタンス、WebSocket） | 日付変更でリセット |
| 日記 + AI振り返り | 利用不可 | 無制限 | Pro専用機能 |
| 感情トラッキング | 利用不可 | 週次/月次レポート | Pro専用機能 |
| AI洞察レポート | 利用不可 | デイリー配信 | Pro専用機能 |
| コミュニティ | プレビューのみ（ぼかし表示） | AIツイン交流の閲覧 | Pro特典 |
| 性格診断 | サマリーのみ | 詳細レポート | 詳細はブラー解除 |
| SOUL.md サマリー | 利用不可 | 閲覧可能 | ツイン情報タブ |
| OpenClawステータス | 利用不可 | 表示のみ | ツイン情報タブ |
| 過去データ | 直近7日 | 全期間 | Free制限 |

---

## 4. RevenueCat設定

### 4.1 Entitlement

```
Entitlement: "pro"
  +-- pro_monthly が有効な場合
  +-- pro_annual が有効な場合
  +-- pro_annual_intro が有効な場合
```

定数: `REVENUECAT.entitlement = 'pro'`（`src/config/constants.ts`）

### 4.2 Offering構成

```
Offering: "default"
  +-- Package: "$rc_annual"     --> pro_annual (¥39,800/年)
  +-- Package: "$rc_monthly"    --> pro_monthly (¥4,980/月)
  +-- Package: "intro_annual"   --> pro_annual_intro (¥29,800/年)

Offering: "credit_packs"
  +-- Package: "credits_small"  --> credits_50 (¥300)
  +-- Package: "credits_medium" --> credits_150 (¥800)
  +-- Package: "credits_large"  --> credits_500 (¥2,400)
```

### 4.3 無料トライアル

- 対象: Pro Monthly / Pro Annual（初回限定プランは対象外）
- 期間: 3日間
- トライアル中もOpenClawインスタンスがプロビジョニングされる（Pro機能フル利用可）
- トライアル終了後に自動課金

---

## 5. ペイウォール画面

### 5.1 画面ファイル

`app/(paywall)/index.tsx`

### 5.2 レイアウト

```
+-------------------------------+
| [x]          SafeArea Top     |
|                                |
|   "AIツインの全機能を解放"      |
|                                |
|  +---------------------------+ |
|  | 専用AIツイン（無制限チャット） | |
|  | 詳細性格分析                | |
|  | 日記 + AI振り返り           | |
|  | 感情トラッキング            | |
|  | AI洞察レポート              | |
|  +---------------------------+ |
|                                |
|  +---------------------------+ |
|  | [FIRST TIME OFFER]         | |
|  | (o) ¥29,800/年             | |  <-- 24時間以内のみ
|  |     (¥2,483/月) XX% OFF    | |
|  |     [timer] 23:45:12       | |
|  +---------------------------+ |
|                                |
|  +---------------------------+ |
|  | ( ) 年額                    | |
|  |     ¥39,800/年 (¥3,317/月) | |
|  +---------------------------+ |
|                                |
|  +---------------------------+ |
|  | ( ) 月額                    | |
|  |     ¥4,980/月              | |
|  +---------------------------+ |
|                                |
|     3日間無料トライアル          |
|                                |
|  +---------------------------+ |
|  |   無料トライアルを開始       | |
|  +---------------------------+ |
|                                |
|     購入を復元                  |
|                                |
|   利用規約 | プライバシー        |
|                                |
|          SafeArea Bottom       |
+-------------------------------+
```

### 5.3 表示タイミング

| トリガー | 表示タイプ |
|---------|----------|
| オンボーディング完了直後 | フルスクリーン（ハード） |
| 無料チャット3回到達時 | ボトムシート（ソフト） |
| 日記機能タップ時（Free） | ボトムシート（ソフト） |
| 洞察タブタップ時（Free） | ボトムシート（ソフト） |
| コミュニティタブ（Free） | ブラー表示 + ペイウォール誘導 |
| 設定画面「Proにアップグレード」 | フルスクリーン（ソフト） |

### 5.4 初回限定オファーのロジック

表示条件:
1. インストールから24時間以内（`AsyncStorage` の `install_time` で管理）
2. かつ過去にProプランを購入したことがない

```
タイマー計算: 24時間 - (現在時刻 - installTime)
更新頻度: setInterval 1秒
期限到達時: 初回限定カード fade out --> selectedPlan を 'annual' に切り替え
```

注意: 現在の実装では `AsyncStorage` のインストール時刻を基準としている。仕様書 `specs/features/subscription.md` では `profiles.created_at`（サーバー時刻）を基準と定義しており、今後サーバー時刻ベースに移行予定。

### 5.5 プラン選択UI

- ラジオボタン形式（3択/2択）
- 初回限定オファー表示時: デフォルト選択 = `intro_annual`
- 通常表示時: デフォルト選択 = `annual`
- 選択中のカードは紫ボーダー + 薄い背景色

### 5.6 状態

| 状態 | 表示 |
|------|------|
| Default (初回限定あり) | 3プラン表示 + カウントダウンタイマー |
| Default (通常) | 2プラン表示 |
| Loading (購入処理中) | CTAボタンに「処理中...」、ボタン無効化 |
| Error | `Alert.alert` でエラーダイアログ表示 |
| Success | 購入完了 --> `router.back()` で前画面に戻る |

### 5.7 閉じるボタン（Apple審査準拠）

- 位置: 左上固定（`top: 56, left: spacing.md`）
- サイズ: 36x36pt（hitSlop: 12）
- スタイル: 「x」テキスト、グレー色
- 動作: `router.back()` でフリープランで継続
- **App Store Review Guideline 3.1.1 準拠**: フルスクリーンペイウォールでも課金せずに閉じられること

---

## 6. 実装仕様

### 6.1 RevenueCat SDK初期化 -- `src/services/revenuecat/client.ts`

| 関数 | 説明 |
|------|------|
| `initializeRevenueCat(userId?)` | SDK初期化。Platform別APIキー設定 |
| `checkSubscriptionStatus()` | 現在のEntitlement情報取得 --> `EntitlementInfo` |
| `getOfferings()` | 利用可能なOffering取得 |
| `purchasePackage(pkg)` | パッケージ購入実行 |
| `restorePurchases()` | 購入復元 |
| `identifyUser(userId)` | ユーザーID設定 (`Purchases.logIn()`) |
| `logOutRevenueCat()` | ログアウト (`Purchases.logOut()`) |
| `addCustomerInfoListener(callback)` | リアルタイム更新リスナー登録 |

#### mapCustomerInfo ロジック

RevenueCatの `CustomerInfo` を `EntitlementInfo` にマッピング:

```
1. pro Entitlement が無効 --> isPro: false, status: 'free'
2. pro Entitlement が有効:
   a. periodType === 'TRIAL' --> status: 'trial', trialDaysRemaining 計算
   b. willRenew === false --> status: 'cancelled'
   c. それ以外 --> status: 'active'
3. productIdentifier からplanType判定:
   - 'annual' + 'intro' を含む --> 'intro_annual'
   - 'annual' / 'yearly' を含む --> 'annual'
   - 'monthly' を含む --> 'monthly'
```

### 6.2 型定義 -- `src/shared/types/subscription.ts`

```typescript
type SubscriptionStatus =
  | 'free'
  | 'trial'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'grace_period';

type PlanType = 'monthly' | 'annual' | 'intro_annual';

type Subscription = {
  id: string;
  userId: string;
  revenuecatId: string | null;
  status: SubscriptionStatus;
  planType: PlanType | null;
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

type EntitlementInfo = {
  isPro: boolean;
  status: SubscriptionStatus;
  planType: PlanType | null;
  trialDaysRemaining: number | null;
  credits: number;
};

type CreditBalance = { userId: string; balance: number };
type CreditTransaction = {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'consume' | 'bonus';
  description: string | null;
  createdAt: string;
};
```

### 6.3 useSubscription Store -- `src/shared/hooks/use-subscription.ts`

Zustand store で課金状態を管理。

```typescript
type SubscriptionStore = {
  entitlement: EntitlementInfo;
  isLoading: boolean;
  offerings: PurchasesOfferings | null;

  // Actions
  setEntitlement: (info: Partial<EntitlementInfo>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;

  // RevenueCat operations
  refreshStatus: () => Promise<void>;
  loadOfferings: () => Promise<PurchasesOfferings | null>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
};
```

#### Pro判定ヘルパー

```typescript
export const useIsPro = (): boolean => {
  return useSubscription((s) => s.entitlement.isPro);
};
```

### 6.4 無料チャット上限

| 項目 | 値 |
|------|-----|
| 1日の上限 | 3回（`FREE_DAILY_CHAT_LIMIT = 3`） |
| カウント対象 | ユーザーの `role='user'` メッセージ |
| リセット | 日付変更時（`profiles.timezone` 基準） |
| Pro判定 | `isPro === true` なら上限なし |

---

## 7. 課金 --> OpenClawプロビジョニング連携

### 7.1 購入時フロー

```
[ユーザー] --> [RevenueCat SDK] --> [App Store / Google Play]
                                         |
                                    購入成功
                                         |
                               [RevenueCat Webhook]
                                         |
                          [Supabase Edge Function: webhook-revenuecat]
                                         |
                            イベント種別を判定
                           /              \
                  INITIAL_PURCHASE     EXPIRATION
                  RENEWAL              CANCELLATION
                          |                    |
              [provision-openclaw]    [destroy-openclaw]
                          |                    |
              Droplet作成+起動        Droplet停止+削除
                          |                    |
              openclaw_instances      openclaw_instances
              status='running'        status='stopped'
```

### 7.2 解約時フロー

```
[ユーザー] --> App Store/Google Playで解約
                    |
         サブスク期間終了時に EXPIRATION イベント発火
                    |
         [webhook-revenuecat] --> [destroy-openclaw]
                    |
         Droplet削除 + openclaw_instances.status='stopped'
                    |
         ユーザーはFreeプランにダウングレード（1日3回チャット制限）
```

---

## 8. Webhook仕様

### 8.1 エンドポイント

`POST {SUPABASE_URL}/functions/v1/webhook-revenuecat`

### 8.2 認証

Authorization headerでRevenueCat Webhook Signing Secretを検証。

### 8.3 処理するイベント

| イベント | 処理 |
|---------|------|
| `INITIAL_PURCHASE` | `subscriptions.status = 'active'`、`plan_type`設定、`provision-openclaw` 呼び出し |
| `RENEWAL` | `current_period` 更新 |
| `EXPIRATION` | `subscriptions.status = 'expired'`、`destroy-openclaw` 呼び出し |
| `CANCELLATION` | `subscriptions.status = 'cancelled'`（期間満了まではPro利用可） |
| `BILLING_ISSUE` | `subscriptions.status = 'grace_period'` |
| `PRODUCT_CHANGE` | `plan_type` 更新（OpenClawインスタンスは維持） |

### 8.4 冪等性

- RevenueCatイベントの `id` をユニークキーとして使用
- 同一イベントIDの重複処理をスキップ
- Edge FunctionはHTTP 200を返してリトライ防止

---

## 9. サブスクリプション状態遷移

### 9.1 `subscriptions.status` の遷移

```
[free] ---(購入/トライアル開始)---> [trial / active]
  ^                                      |
  |                                      |
  +-------(期限切れ/解約)----------------+
  |                                      |
  +-------(決済エラー)--- [grace_period] -+
```

詳細遷移:
- `free` --> `trial` --> `active` --> `expired` --> `free`
- `active` --> `grace_period` --> `active`（決済リトライ成功時）
- `active` --> `grace_period` --> `expired`（決済リトライ失敗時）
- `active` --> `cancelled`（ユーザー解約、`current_period_end` まで有効）
- `cancelled` --> `expired`（有効期限到達時）

### 9.2 cancelledステータスについて

`cancelled`: ユーザーが解約済みだが、`current_period_end` まではPro機能が利用可能。
期間満了後に `expired` に遷移し、OpenClawインスタンスが停止される。

---

## 10. 購入復元

| 項目 | 内容 |
|------|------|
| 復元関数 | `restorePurchases()` --> `Purchases.restorePurchases()` |
| 復元成功 | `Alert`: 「購入情報を復元しました」 --> 前画面に戻る |
| 復元なし | `Alert`: 「復元可能な購入情報が見つかりませんでした」 |
| 復元失敗 | `Alert`: 「復元処理中にエラーが発生しました」 |
| OpenClaw | 有効なサブスクがある場合、インスタンスが存在しなければ再プロビジョニング |

---

## 11. テスト方法

### 11.1 サンドボックステスト

- RevenueCatサンドボックス環境で全課金フローをテスト
- サンドボックスでは加速されたトライアル期間を利用
- テストアカウントでApp Store / Google Playの決済を通す

### 11.2 テスト確認項目

- 月額プラン購入 --> `pro` Entitlement が `true`
- 年額プラン購入 --> `pro` Entitlement が `true`
- 初回限定プラン購入 --> `pro` Entitlement が `true`
- トライアル開始 --> `isTrialing = true`、`trialDaysRemaining` が正しい値
- トライアル --> 有料転換 --> `status = 'active'`
- 解約 --> `status = 'cancelled'` --> 期間満了で `status = 'expired'`
- 購入復元 --> 有効なサブスクが復元される
- Webhook受信 --> `subscriptions` テーブルが正しく更新される
- Webhook冪等性 --> 同一イベント2回送信でDBレコードが1つ

---

## 12. 関連ファイル

| ファイル | 説明 |
|---------|------|
| `app/(paywall)/index.tsx` | ペイウォール画面 |
| `src/services/revenuecat/client.ts` | RevenueCat SDKラッパー |
| `src/shared/hooks/use-subscription.ts` | サブスクリプション状態Store（Zustand） |
| `src/shared/types/subscription.ts` | 課金関連の型定義 |
| `src/config/constants.ts` | 価格定数、RevenueCat設定 |
| `supabase/functions/webhook-revenuecat/` | Webhook Edge Function |
| `supabase/functions/provision-openclaw/` | プロビジョニング Edge Function |
| `supabase/functions/destroy-openclaw/` | 破棄 Edge Function |

---

## 13. 検証条件

- [ ] RevenueCat SDKが正常に初期化されること
- [ ] Offeringから全プラン（monthly, annual, intro_annual）が取得できること
- [ ] 月額プラン（¥4,980/月）の購入 --> `isPro = true` になること
- [ ] 年額プラン（¥39,800/年）の購入 --> `isPro = true` になること
- [ ] 初回限定プラン（¥29,800/年）が24時間以内にのみ表示されること
- [ ] 24時間経過後に初回限定カードが非表示になること
- [ ] カウントダウンタイマーがリアルタイムで動作すること
- [ ] 3日間トライアルが正常に開始されること（`isTrialing = true`）
- [ ] トライアル --> 有料への自動転換が動作すること
- [ ] 購入キャンセル時に状態が変わらないこと
- [ ] 購入復元が正常に動作すること
- [ ] 閉じるボタンでFreeプランとして継続できること（Apple審査準拠）
- [ ] Webhookで購入イベントがDBに反映されること
- [ ] Webhook冪等性: 同一イベントの重複処理がないこと
- [ ] 解約後にOpenClawインスタンスが停止されること
- [ ] 再課金時に新規OpenClawインスタンスが作成されること
- [ ] Free/Pro機能の切り替えが正しく動作すること

---

## 変更履歴

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| 2026-02-14 | 初版作成 | ドキュメント初期作成 |
| 2026-02-15 | 実装コードに基づき全面書き換え | Reconcile: 価格体系を実装に合わせて修正（¥980-->¥4,980、¥5,800-->¥39,800、¥3,800-->¥29,800）、型定義・Store・画面実装の実態反映、OpenClawプロビジョニング連携追加 |
