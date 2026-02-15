# サブスクリプション管理 仕様書

## 基本情報

| 項目 | 内容 |
|------|------|
| 機能名 | サブスクリプション管理 |
| 依存する機能 | 認証（Supabase Auth） |
| 依存される機能 | OpenClawプロビジョニング、チャット（Pro/Free判定） |
| 課金基盤 | RevenueCat |
| 対象プラットフォーム | iOS / Android / Web（課金のみ） |

---

## 課金体系

| プラン | ID | 価格 | 内容 |
|--------|----|------|------|
| Free | - | ¥0 | 初回10,000トークン（リセットなし、Supabase Edge Function経由）、基本機能のみ、コミュニティはプレビューのみ（ぼかし表示） |
| Pro Monthly | `pro_monthly` | ¥4,980/月 | 無制限チャット（専用OpenClawインスタンス）、日記、洞察、コミュニティ（AIツイン交流の閲覧）、全機能解放 |
| Pro Annual | `pro_annual` | ¥39,800/年 | Pro Monthly同等、月額換算 ¥3,317（33%OFF） |
| Pro Annual（初回限定） | `pro_annual_intro` | ¥29,800/年 | 初回限定、登録から24時間以内のみ表示、月額換算 ¥2,483（50%OFF） |

### 無料トライアル
- 期間: 3日間
- 対象: Pro Monthly / Pro Annual
- トライアル終了後に自動課金
- トライアル中も専用OpenClawインスタンスがプロビジョニングされる

### トークン追加購入（Consumable IAP）

| パッケージID | 名称 | 価格 | トークン数 | 単価 |
|-------------|------|------|-----------|------|
| `tokens_50k` | トークン50K | ¥500 | 50,000 | ¥0.01/token |
| `tokens_120k` | トークン120K | ¥1,000 | 120,000 | ¥0.0083/token |
| `tokens_400k` | トークン400K | ¥3,000 | 400,000 | ¥0.0075/token |

RevenueCat Offering: `token_packs`
- Package: `tokens_small` → `tokens_50k`
- Package: `tokens_medium` → `tokens_120k`
- Package: `tokens_large` → `tokens_400k`

---

## RevenueCat設定

### Entitlement
- 名前: `pro`
- すべてのProプランがこのEntitlementに紐付く

### Offering
- Offering ID: `default`
- パッケージ:
  - `monthly` → `pro_monthly`
  - `annual` → `pro_annual`
  - `intro_annual` → `pro_annual_intro`

### Webhook
- エンドポイント: `{SUPABASE_URL}/functions/v1/webhook-revenuecat`
- 認証: Webhook Authorization Header（Supabase Edge Function側で検証）
- 処理対象イベント:
  - `INITIAL_PURCHASE` — 初回購入
  - `RENEWAL` — 自動更新
  - `EXPIRATION` — 期限切れ（解約後の期間終了）
  - `CANCELLATION` — 即時解約（返金等）
  - `BILLING_ISSUE` — 決済エラー
  - `PRODUCT_CHANGE` — プラン変更

---

## 課金 → プロビジョニング連携フロー

### 購入時フロー
```
[ユーザー] → [RevenueCat SDK] → [App Store / Google Play]
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

### 解約時フロー
```
[ユーザー] → App Store/Google Playで解約
                    |
         サブスク期間終了時に EXPIRATION イベント発火
                    |
         [webhook-revenuecat] → [destroy-openclaw]
                    |
         Droplet削除 + openclaw_instances.status='stopped'
                    |
         ユーザーはFreeプランにダウングレード
```

---

## アプリ側の実装

### useSubscription() hook
- RevenueCat SDKから現在のEntitlement情報を取得
- `pro` Entitlementの有無で Pro/Free を判定
- 返却値:
  - `isPro: boolean`
  - `expiresAt: Date | null`
  - `isTrialing: boolean`
  - `planType: 'free' | 'monthly' | 'annual'`
  - `purchase: (packageId: string) => Promise<void>`
  - `restore: () => Promise<void>`

### Paywall画面
- 表示条件: `isPro === false` のとき
- 初回限定オファーの表示条件:
  - `profiles.created_at` から24時間以内
  - かつ過去に一度もProプランを購入していない
- カウントダウンタイマー表示（残り時間）

---

## 受け入れ条件

### AC-1: 月額プランを購入できる

**Given** ユーザーがFreeプランでログインしている
**When** Paywall画面で月額プラン（¥4,980/月）を選択し、App Store/Google Playの決済を完了する
**Then**
- RevenueCatの `pro` Entitlementが有効になる
- `subscriptions` テーブルの `status` が `active`、`plan` が `monthly` に更新される
- `provision-openclaw` Edge Functionが呼び出され、専用OpenClawインスタンスが作成される
- アプリ内でPro機能（無制限チャット、日記、洞察、コミュニティ、ツイン情報の詳細分析）が利用可能になる

**エッジケース:**
- 決済画面でキャンセルした場合、状態が変わらないこと
- ネットワークエラー時にリトライ可能であること
- 既にProユーザーの場合、重複購入が防止されること

**テスト観点:**
- サンドボックスアカウントで決済フローを通す
- RevenueCat Webhook受信後の `subscriptions` レコード更新を確認
- OpenClawインスタンスの `status` が `running` になることを確認

---

### AC-2: 年額プランを購入できる

**Given** ユーザーがFreeプランでログインしている
**When** Paywall画面で年額プラン（¥39,800/年）を選択し、決済を完了する
**Then**
- RevenueCatの `pro` Entitlementが有効になる
- `subscriptions` テーブルの `plan` が `annual` に更新される
- 専用OpenClawインスタンスが作成される
- アプリ内でPro機能（無制限チャット、日記、洞察、コミュニティ、ツイン情報の詳細分析）が利用可能になる
- 有効期限が購入日から1年後に設定される

**エッジケース:**
- 月額から年額へのプラン変更時、OpenClawインスタンスは維持されること（再作成しない）
- 年額の自動更新が正しく処理されること

**テスト観点:**
- 年額→月額、月額→年額のプラン変更を双方向で検証
- `PRODUCT_CHANGE` Webhookイベント時にインスタンスが維持されることを確認

---

### AC-3: 初回限定オファーが24時間で期限切れになる

**Given** ユーザーが新規登録してから24時間以内であり、過去にProプランを購入したことがない
**When** Paywall画面を表示する
**Then**
- 初回限定年額プラン（¥29,800/年、50%OFF）が表示される
- 残り時間のカウントダウンタイマーが表示される

**Given** ユーザーが新規登録してから24時間が経過した
**When** Paywall画面を表示する
**Then**
- 初回限定プランは表示されない
- 通常の月額・年額プランのみ表示される

**エッジケース:**
- 24時間ちょうどの境界値（タイムゾーン考慮）
- アプリをバックグラウンドにして24時間経過後に復帰した場合
- 端末の時刻を手動で変更した場合（サーバー側の `profiles.created_at` で判定するため影響なし）
- 過去にProプランを購入→解約→再登録したユーザーには表示しない

**テスト観点:**
- `profiles.created_at` の23時間59分後と24時間01分後で表示が切り替わることを確認
- RevenueCatのOffering取得時に `intro_annual` パッケージの表示/非表示をアプリ側で制御

---

### AC-4: トライアル開始 → 3日後に自動課金

**Given** ユーザーがFreeプランで、トライアルを開始する
**When** トライアル対象のプランを選択し、決済情報を登録する
**Then**
- 3日間の無料トライアルが開始される
- `subscriptions.status` が `trial` に設定される
- トライアル中もOpenClawインスタンスがプロビジョニングされる（Pro機能が使える）
- 3日後に自動的に課金が発生し、`status` が `active` に変わる

**エッジケース:**
- トライアル中に解約した場合、トライアル期間終了まではPro機能が使えること
- トライアル中に決済情報が無効になった場合（BILLING_ISSUE）
- トライアル→課金失敗時にOpenClawインスタンスが停止されること

**テスト観点:**
- サンドボックスで加速されたトライアル期間を利用してテスト
- トライアル中の `isTrialing` フラグが正しく返ることを確認
- トライアル終了後の `INITIAL_PURCHASE` イベントでインスタンスが維持されることを確認

---

### AC-5: 購入復元ができる

**Given** ユーザーが過去にProプランを購入しており、アプリを再インストールした
**When** 設定画面またはPaywall画面で「購入を復元」ボタンを押す
**Then**
- RevenueCat SDKの `restorePurchases()` が呼ばれる
- 有効なサブスクリプションが見つかった場合、`pro` Entitlementが復元される
- アプリ内でPro機能が利用可能になる
- OpenClawインスタンスが既に存在する場合はそのまま利用、存在しない場合は再プロビジョニング

**エッジケース:**
- サブスクが期限切れの場合、復元しても `isPro === false` のままであること
- 異なるApple ID / Google Playアカウントで復元を試みた場合
- 復元処理中のローディング表示とエラーハンドリング

**テスト観点:**
- サンドボックスアカウントで復元フローを検証
- 復元後に `openclaw_instances` の状態が正しいことを確認

---

### AC-6: 解約時にOpenClawインスタンスが停止される

**Given** ユーザーがProプランを利用中で、専用OpenClawインスタンスが `running` 状態である
**When** ユーザーがApp Store / Google Playでサブスクリプションを解約し、サブスク期間が終了する
**Then**
- RevenueCatから `EXPIRATION` Webhookイベントが送信される
- `webhook-revenuecat` Edge Functionが `destroy-openclaw` を呼び出す
- DigitalOcean上のDropletが削除される
- `openclaw_instances.status` が `stopped` に更新される
- `subscriptions.status` が `expired` に更新される
- ユーザーはFreeプランにダウングレードされ、残りトークンに基づくチャット制限に戻る

**エッジケース:**
- Droplet削除がDigitalOcean API障害で失敗した場合、リトライされること
- Dropletが既に存在しない場合（手動削除等）、エラーにならず正常終了すること
- 解約→即再課金の場合にインスタンスが重複作成されないこと（冪等性）

**テスト観点:**
- `EXPIRATION` Webhookを手動で送信し、Droplet削除とDB更新を確認
- DigitalOcean APIエラー時のリトライロジックを検証
- 解約後にアプリ側で `isPro === false` に切り替わることを確認

---

### AC-7: 再課金時に新規OpenClawインスタンスが作成される

**Given** ユーザーが過去にProプランを利用していたが、現在は解約済み（Freeプラン）である
**When** 再度Proプランを購入する
**Then**
- RevenueCatから `INITIAL_PURCHASE` または `RENEWAL` Webhookイベントが送信される
- `provision-openclaw` Edge Functionが呼び出される
- 新規DigitalOcean Dropletが作成される
- `openclaw_instances` テーブルに新しいレコードが作成される（または既存レコードの `status` が `provisioning` に更新される）
- OpenClawが起動し、過去のSOUL.md設定が復元される（`soul_md` カラムから）
- `openclaw_instances.status` が `running` に更新される

**エッジケース:**
- 前回のDroplet削除が完了していない状態で再課金した場合
- `openclaw_instances` レコードが既に存在する場合（UNIQUE制約）、UPSERTで処理すること
- SOUL.mdが未設定（オンボーディング未完了）の場合、デフォルトSOUL.mdを使用すること

**テスト観点:**
- 解約→再課金の一連のフローをE2Eで検証
- `soul_md` の復元が正しく行われることを確認
- Dropletの `user_data`（cloud-init）にSOUL.mdが含まれることを確認

---

### AC-8: Webhook処理が冪等である

**Given** RevenueCatから同一イベントが重複して送信される（ネットワークリトライ等）
**When** `webhook-revenuecat` Edge Functionが同じイベントを2回以上受信する
**Then**
- 2回目以降の処理はスキップされる、または同じ結果になる
- Dropletが重複作成されない
- `subscriptions` テーブルが不整合な状態にならない
- Edge FunctionはHTTP 200を返す（リトライを防止）

**実装方針:**
- RevenueCatのイベントに含まれる `id` をユニークキーとして利用
- `webhook_events` テーブル（またはキャッシュ）で処理済みイベントを管理
- 既に処理済みのイベントIDを受信した場合は早期リターン

**エッジケース:**
- 同一ユーザーの `INITIAL_PURCHASE` と `RENEWAL` が同時に到着した場合
- `provision-openclaw` が進行中に同じイベントが再送された場合
- Edge Functionがタイムアウトした後にリトライされた場合

**テスト観点:**
- 同一Webhookペイロードを2回送信し、DBレコードが1つだけであることを確認
- DigitalOcean APIのDroplet作成が1回だけ呼ばれることを確認（モック使用）
- 異なるイベントタイプの同時到着をシミュレート

---

## トークン管理

### トークン消費の追跡

全てのOpenAI APIコール（Edge Function経由・OpenClaw Gateway経由）のトークン消費量を記録・追跡する。

| プラン | トークン上限 | リセット |
|--------|------------|---------|
| Free | 10,000トークン | なし（一回限り） |
| Pro | 500,000トークン | 毎月1日 00:00 UTC |

### token_usage テーブル

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `input_tokens` | integer | 入力トークン数 |
| `output_tokens` | integer | 出力トークン数 |
| `total_tokens` | integer | 合計トークン数 |
| `model` | text | 使用モデル（例: `gpt-4o-mini`） |
| `source` | text | `'edge_function'` / `'openclaw_gateway'` |
| `created_at` | timestamptz | 使用日時 |

### 集計ビュー

```sql
-- Pro用: 月間集計（月次リセット対象）
CREATE VIEW monthly_token_usage AS
SELECT
  user_id,
  date_trunc('month', created_at) AS month,
  SUM(total_tokens) AS total_tokens_used
FROM token_usage
GROUP BY user_id, date_trunc('month', created_at);

-- Free用: 累計集計（リセットなし）
CREATE VIEW lifetime_token_usage AS
SELECT
  user_id,
  SUM(total_tokens) AS total_tokens_used
FROM token_usage
GROUP BY user_id;
```

### トークン残量表示

チャット画面にプログレスバーでトークン残量を表示。

- 残量80%以上: 緑色
- 残量50〜80%: 黄色
- 残量20%未満: 赤色

### トークン制限到達時

| 状態 | 表示 | アクション |
|------|------|----------|
| Free制限到達 | 「今月のトークンを使い切りました」 + 「Proにアップグレード」CTA | ペイウォール表示 |
| Pro制限到達 | 「今月のトークンを使い切りました」 + 「追加トークンを購入」CTA | Consumable IAP画面表示 |

### トークン消費順序
1. 月間基本トークン（Free: 10,000 / Pro: 500,000）を先に消費
2. 基本トークン消費後、購入トークンを古い順（FIFO）に消費
3. 有効期限切れの購入トークン（90日）は自動失効

### token_credits テーブル

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `amount` | integer | 購入トークン数 |
| `remaining` | integer | 残りトークン数 |
| `package_id` | text | 購入パッケージID |
| `purchased_at` | timestamptz | 購入日時 |
| `expires_at` | timestamptz | 有効期限（購入から90日） |

---

## Web版課金（Stripe）

### 概要

Web版ではApp Store / Google Playが利用できないため、Stripe Checkoutで課金を処理する。
RevenueCatのStripe Providerを使用し、モバイル・Web間でサブスクリプション状態を統合管理する。

### 対象プラン

| プラン | Stripe Price ID | 価格 |
|--------|---------------|------|
| Pro Monthly | `price_pro_monthly` | ¥4,980/月 |
| Pro Annual | `price_pro_annual` | ¥39,800/年 |

注: 初回限定年額（¥29,800）はWeb版では提供しない（モバイル限定プロモーション）。

### フロー

```
Web App → Edge Function (create-checkout-session) → Stripe Checkout
  → Webhook (webhook-stripe) → subscriptions更新 + RevenueCat同期
  → provision-openclaw（初回購入時）
```

### Edge Function: create-checkout-session

| 項目 | 内容 |
|------|------|
| パス | `POST /functions/v1/create-checkout-session` |
| 認証 | Supabase Auth JWT（Authorization header） |
| リクエスト | `{ priceId: string }` |
| レスポンス | `{ url: string }` （Stripe Checkout URL） |
| 処理 | Stripe Customer作成/取得 → Checkout Session作成 → URL返却 |

### Stripe Webhook処理

エンドポイント: `POST {SUPABASE_URL}/functions/v1/webhook-stripe`

| イベント | 処理 |
|---------|------|
| `checkout.session.completed` | サブスク作成 + provision-openclaw |
| `invoice.paid` | current_period更新 |
| `invoice.payment_failed` | grace_period設定 |
| `customer.subscription.deleted` | expired設定 + destroy-openclaw |
| `customer.subscription.updated` | plan_type更新 |

### RevenueCat統合

- Stripe Providerを使用して、Stripe課金をRevenueCatのEntitlementに反映
- モバイル（App Store / Google Play）とWeb（Stripe）のサブスクリプション状態を `pro` Entitlementで統合
- アプリ側は `useSubscription()` hookでPro判定（課金元プラットフォームを意識しない）

---

## API Key保護

全てのAPIキー（OpenAI、Supabase Service Role、DigitalOcean、Stripe Secret）はクライアントに露出させない。

| キー | 保管場所 | クライアント露出 |
|------|---------|---------------|
| OpenAI API Key | Edge Function環境変数 | 不可 |
| Supabase Service Role Key | Edge Function環境変数 | 不可 |
| Supabase Anon Key | クライアントアプリ | 許可（RLS保護） |
| DigitalOcean API Token | Edge Function環境変数 | 不可 |
| RevenueCat API Key | クライアントアプリ | 許可（SDK仕様） |
| Stripe Secret Key | Edge Function環境変数 | 不可 |

---

### AC-9: トークン消費が正しく追跡される

**Given** ユーザーがチャットでメッセージを送信する
**When** OpenAI APIまたはOpenClaw Gatewayがレスポンスを返す
**Then**
- `token_usage` テーブルに入力/出力/合計トークン数が記録される
- チャット画面のトークン残量プログレスバーが更新される

**エッジケース:**
- トークン記録に失敗してもチャットは正常に動作すること（非同期記録）
- 月間リセット時に正しくカウントがリセットされること

---

### AC-10: トークン制限到達時にチャットが制限される

**Given** ユーザーの月間トークン消費量が上限に達している（Free: 10,000 / Pro: 500,000）
**When** チャット画面を表示する
**Then**
- チャット入力が無効化される
- 「今月のトークンを使い切りました」メッセージが表示される
- Free: 「Proにアップグレード」CTA表示
- Pro: 「追加トークンを購入」CTA表示

---

### AC-11: 追加トークンを購入できる

**Given** ユーザーのトークンが不足している
**When** トークン購入画面で¥500/¥1,000/¥3,000パッケージを選択し、決済を完了する
**Then**
- RevenueCat consumable purchaseが完了する
- `token_credits` テーブルに購入記録が追加される
- トークン残量が購入分だけ増加する
- 有効期限が購入から90日後に設定される

**テスト観点:**
- サンドボックスで3パッケージそれぞれの購入を検証
- 購入トークンの消費順序（FIFO）が正しいことを確認

---

### AC-12: Stripe Checkoutで課金できる（Web版）

**Given** Web版ユーザーがFreeプランでログインしている
**When** 「Proにアップグレード」ボタンをクリックし、Stripe Checkout画面で決済を完了する
**Then**
- Stripe Webhookが `subscriptions` テーブルを更新する
- RevenueCat Stripe Provider経由で `pro` Entitlementが有効になる
- OpenClawインスタンスがプロビジョニングされる
- モバイルアプリでも即座にPro機能が利用可能になる

**エッジケース:**
- Checkout画面で離脱した場合、状態が変わらないこと
- モバイルで既にPro契約中のユーザーがWebで再購入しようとした場合

**テスト観点:**
- Stripeテストモードで決済フローを検証
- Webhook受信後のDB更新とRevenueCat同期を確認

---

### AC-13: クライアントにAPIキーが露出していない

**Given** アプリのビルドが完了している
**When** ビルドアーティファクトを検査する
**Then**
- OpenAI API Key、Supabase Service Role Key、DigitalOcean API Token、Stripe Secret Keyがクライアントコードに含まれていないこと
- 外部APIコールは全てEdge Function経由で行われること
- クライアントに含まれるキーはSupabase Anon KeyとRevenueCat API Keyのみ

---

## 状態遷移図

```
[Free] ---(購入/トライアル開始)---> [Trial / Active]
  ^                                      |
  |                                      |
  +-------(期限切れ/解約)----------------+
  |                                      |
  +-------(決済エラー)--- [Grace Period] -+
```

### subscriptions.status の遷移
- `free` → `trial` → `active` → `expired` → `free`
- `active` → `grace_period` → `active`（決済リトライ成功時）
- `active` → `grace_period` → `expired`（決済リトライ失敗時）
- `active` → `cancelled`（ユーザーが解約、期間満了まで有効）
- `cancelled` → `expired`（有効期限到達時）

### cancelled ステータスについて
`cancelled`: ユーザーが解約済みだが、current_period_end まではPro機能が利用可能。期間満了後に `expired` に遷移。

---

## Clarifications

### Session 2026-02-15

- Q: Token使用量管理のリセット周期と上限到達時の動作 -> A: 月次リセット + 上限到達でチャット不可 + アップグレード誘導（既存仕様と整合確認）
- Q: Freeユーザーのトークンリセットポリシー -> A: Freeは10Kトークン一回限り（リセットなし）。Proのみ月次500Kリセット。「1日3回」制限は全仕様から削除。
- Q: chat.md 19ACのMVPスコープ -> A: 全19ACをMVPフルスコープに含める（Slackライク、メディア、OGP、翻訳、マークダウン、トピック、日記統合すべて初回リリース）
- Q: SOUL.mdテンプレート構造 -> A: 標準4セクション（identity/personality/communication_style/behavioral_guidelines）。テンプレートをonboarding.mdに追記済み。
- Q: OpenClaw Dropletスペックとプロビジョニング戦略 -> A: 最小構成（SGP1 / s-1vcpu-1gb / $6月 / 1ユーザー1Droplet）。コスト最小化優先、スケール時にサイズアップ。

---

## 変更履歴

| 日付 | 変更内容 | 理由 | 関連タスク |
|------|---------|------|-----------|
| 2026-02-14 | Free/Pro比較テーブルにコミュニティ機能を追加 | コミュニティ機能のPro特典化 | - |
| 2026-02-14 | AC-1, AC-2の内容更新（コミュニティ、ツイン情報の詳細分析を追記） | Pro機能の明確化 | - |
| 2026-02-14 | trialing → trial（全箇所） | RevenueCat用語統一（Clarify Phase） | - |
| 2026-02-14 | cancelled ステータス追加 | 解約済み期間内ユーザーの状態管理 | - |
| 2026-02-15 | トークン管理セクション追加 | OpenAIトークン消費量の追跡・制限（Free: 10K / Pro: 500K） | - |
| 2026-02-15 | Web版課金（Stripe）セクション追加 | Stripe Checkout + Webhook + RevenueCat統合 | - |
| 2026-02-15 | API Key保護セクション追加 | セキュリティ設計原則の明文化 | - |
| 2026-02-15 | AC-9〜AC-13追加 | トークン管理、Consumable IAP、Web課金、API Key保護の受け入れ条件 | - |
| 2026-02-15 | 対象プラットフォームにWeb追加 | Stripe Checkout対応 | - |
| 2026-02-15 | token_usage/token_creditsテーブルスキーマ追加 | データ仕様の充実化 | T12 |
| 2026-02-15 | create-checkout-session Edge Function詳細追加 | Web課金の実装仕様明確化 | T12 |
| 2026-02-15 | RevenueCat Stripe Provider統合仕様追加 | クロスプラットフォーム同期の明文化 | T12 |
