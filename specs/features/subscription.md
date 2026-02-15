# サブスクリプション管理 仕様書

## 基本情報

| 項目 | 内容 |
|------|------|
| 機能名 | サブスクリプション管理 |
| 依存する機能 | 認証（Supabase Auth） |
| 依存される機能 | OpenClawプロビジョニング、チャット（Pro/Free判定） |
| 課金基盤 | RevenueCat |
| 対象プラットフォーム | iOS / Android |

---

## 課金体系

| プラン | ID | 価格 | 内容 |
|--------|----|------|------|
| Free | - | ¥0 | 1日3回チャット（Supabase Edge Function経由）、基本機能のみ、コミュニティはプレビューのみ（ぼかし表示） |
| Pro Monthly | `pro_monthly` | ¥4,980/月 | 無制限チャット（専用OpenClawインスタンス）、日記、洞察、コミュニティ（AIツイン交流の閲覧）、全機能解放 |
| Pro Annual | `pro_annual` | ¥39,800/年 | Pro Monthly同等、月額換算 ¥3,317（33%OFF） |
| Pro Annual（初回限定） | `pro_annual_intro` | ¥29,800/年 | 初回限定、登録から24時間以内のみ表示、月額換算 ¥2,483（50%OFF） |

### 無料トライアル
- 期間: 3日間
- 対象: Pro Monthly / Pro Annual
- トライアル終了後に自動課金
- トライアル中も専用OpenClawインスタンスがプロビジョニングされる

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
- ユーザーはFreeプランにダウングレードされ、チャットが1日3回制限に戻る

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

## 変更履歴

| 日付 | 変更内容 | 理由 | 関連タスク |
|------|---------|------|-----------|
| 2026-02-14 | Free/Pro比較テーブルにコミュニティ機能を追加 | コミュニティ機能のPro特典化 | - |
| 2026-02-14 | AC-1, AC-2の内容更新（コミュニティ、ツイン情報の詳細分析を追記） | Pro機能の明確化 | - |
| 2026-02-14 | trialing → trial（全箇所） | RevenueCat用語統一（Clarify Phase） | - |
| 2026-02-14 | cancelled ステータス追加 | 解約済み期間内ユーザーの状態管理 | - |
