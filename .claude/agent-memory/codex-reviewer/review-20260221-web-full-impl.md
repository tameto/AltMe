# Codex Review: 20260221-web-full-impl
Date: 2026-02-21
Reviewer: codex-reviewer (gpt-5.3-codex x3 parallel focus reviews + Claude manual verification)

## Critical（必ず修正）

### C1: claimWebhookEvent の `claimed_at` カラムがスキーマに存在しない
- File: `supabase/functions/_shared/webhook-utils.ts:43-47`
- File: `supabase/migrations/20260215000004_new_tables.sql:10-16`
- 問題: `claimWebhookEvent` は `claimed_at` カラムに INSERT しているが、webhook_events テーブルには `id, event_id, event_type, payload, processed_at` しかない。マイグレーション 20260221000001 で `source` カラムを追加したが `claimed_at` は未追加。
- 影響: claimWebhookEvent を呼び出すコードは全て PostgreSQL エラー（column "claimed_at" does not exist）で fail-closed される。ただし、現時点で claimWebhookEvent はどの webhook handler からも呼ばれていないため、即時の本番影響はゼロ。しかし将来使用時に無言で失敗する。
- 修正案: マイグレーションで `claimed_at TIMESTAMPTZ` カラムを追加するか、claimWebhookEvent 関数を削除する（未使用のため）。

```sql
-- 修正: マイグレーション追加
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
```

または webhook-utils.ts から `claimWebhookEvent` を削除。

### C2: webhook-stripe と webhook-revenuecat の TOCTOU 冪等性設計
- File: `supabase/functions/webhook-stripe/index.ts:44-47` と `:175`
- File: `supabase/functions/webhook-revenuecat/index.ts:35-41` と `:176`
- 問題: `checkIdempotency`（SELECT）→ 処理 → `markEventProcessed`（UPSERT）のパターンは TOCTOU レースコンディションがある。高負荷時またはリトライ時に2つのリクエストが同時に `checkIdempotency` を通過して二重処理が起きる可能性がある。
- 影響: 二重課金・二重プロビジョニングのリスク。Stripe は通常60秒以内にリトライするため、タイムアウト環境では現実的リスク。
- 現状評価: `claimWebhookEvent` 関数が用意されているが実際には使われていない。より安全なパターンに移行すべき。
- 修正案:

```typescript
// webhook-stripe/index.ts（webhook-revenuecat も同様）
// checkIdempotency の代わりに claimWebhookEvent を使う
const { claimed } = await claimWebhookEvent(supabase, event.id, 'stripe');
if (!claimed) {
  return new Response(JSON.stringify({ message: 'Already claimed' }), { status: 200 });
}
// ... 処理後に markEventProcessed
await markEventProcessed(supabase, event.id, 'stripe');
```

## Warning（修正推奨）

### W1: webhook-revenuecat が wildcard CORS ヘッダーを使用している
- File: `supabase/functions/webhook-revenuecat/index.ts:1,9,17,27,39,180,186`
- 問題: `import { corsHeaders } from '../_shared/cors.ts'` で取得した `corsHeaders` は `Access-Control-Allow-Origin: *` のワイルドカード。webhook はサーバー→サーバー通信なので CORS 不要だが、OPTIONS レスポンスと全エラーレスポンスにワイルドカードが付与されている。
- 影響: セキュリティ上の問題は軽微（webhook はクライアントから直接呼ばれない設計）だが、一貫性の問題。webhook-stripe は CORS なしで正しく実装されている。
- 修正案: webhook-revenuecat から CORS ヘッダーを削除するか、webhook-stripe と同じく CORS なしに統一。

```typescript
// 修正: corsHeaders import を削除
// OPTIONS ハンドラーを削除（webhook はサーバー→サーバー）
// 全レスポンスから { ...corsHeaders, ... } を削除
```

### W2: reconcile-stripe のページネーション漏れ
- File: `supabase/functions/reconcile-stripe/index.ts:35-42`
- 問題: `stripe.checkout.sessions.list({ limit: 100 })` の結果は最大 100 件。`has_more` が true の場合に次ページを取得しないため、24時間で 100 件を超える expired セッションがある場合に修正漏れが発生する。
- 修正案:

```typescript
// autoPagingToArray または has_more チェックを追加
const allSessions = await stripe.checkout.sessions.list({
  limit: 100,
  created: { gte: oneDayAgo },
}).autoPagingToArray({ limit: 500 });

for (const session of allSessions) {
  // ...
}
```

### W3: ALLOWED_PRICE_IDS に空文字列が含まれる可能性
- File: `supabase/functions/create-checkout-session/index.ts:10-20`
- 問題: `STRIPE_MONTHLY_PRICE_ID` / `STRIPE_YEARLY_PRICE_ID` が未設定の場合、`?? ''` によって空文字列 `''` が `ALLOWED_PRICE_IDS` セットに追加される。その後 `body.priceId = ''` を POST すると検証をバイパスして Stripe API 呼び出しが走る（Stripe 側でエラーになるが）。
- 影響: 軽微。Stripe API がエラーを返して 500 になるため、悪用はできない。しかし環境変数設定ミスの早期検出ができない。
- 修正案: 起動時に必須環境変数をチェックする。

```typescript
// 起動時チェック
if (!MONTHLY_PRICE_ID || !YEARLY_PRICE_ID) {
  throw new Error('STRIPE price IDs are not configured');
}
```

### W4: invoice.paid で checkout.session.completed と二重処理される可能性
- File: `supabase/functions/webhook-stripe/index.ts:85-107`
- 問題: `checkout.session.completed` + `invoice.paid` は新規サブスクリプション時に両方届く。`invoice.paid` でも `triggerProvision` を呼ぶため、初回プロビジョニングが二重実行される（冪等でない場合問題）。
- 影響: `provision-openclaw` 関数が冪等に設計されていれば問題なし。設計次第。

## Info（検討事項）

### I1: detectPlanType の文字列マッチング依存性
- File: `supabase/functions/webhook-revenuecat/index.ts:239-245`
- 問題: `productId.includes('intro')` が先にマッチするため、`annual_intro` のような ID でも正しく `intro_annual` に分類される。判定順序は現在は正しい。ただし RevenueCat の product ID 命名規則に依存しているため、将来の ID 変更時に壊れやすい。
- 推奨: product ID を環境変数で明示的に管理する方式への移行を検討。

### I2: use-chat-hook.test.ts のテストパターン
- File: `src/features/chat/__tests__/use-chat-hook.test.ts`
- `act(() => { void result.current.handleSend(); })` パターンは非同期処理を即時 fire-and-forget する。副作用が完了する前に assertion が走る場合があるが、`waitFor` で補完されているため現状は機能している。
- `afterEach` でのフック unmount は適切。

### I3: webhook_event_logs テーブルが未定義
- File: `supabase/functions/_shared/webhook-utils.ts:93`
- `logWebhookEvent` 関数は `webhook_event_logs` テーブルに INSERT するが、このテーブルのマイグレーションが見当たらない。ただしこの関数も実際には呼ばれていないため即時影響はなし。

## 統計
- 総指摘数: 7件（検証済み）
- 除外数: 0件（hallucination なし）
- Codex とClaudeの合意: C1、C2、W1、W2、W3 で一致
- 優先度: C1（スキーマ不整合）、C2（冪等性 TOCTOU）を先行対処推奨

---

# 最終レビュー（2026-02-21 夕方）— 前回修正確認 + 新たな指摘

## 前回指摘の修正確認
- C1: plan → plan_type 修正済み （OK）
- C2: TOCTOU → claimWebhookEvent 切替済み （OK）
- C3: RevenueCat → refreshStatus 切替済み （OK）
- C4: intro_annual → annual_intro + migration 済み （OK）
- H2: event_type パラメータ追加済み （OK）
- H5: stripe_customer_id error logging 追加済み （OK）
- W1: webhook-revenuecat CORS 削除済み （OK）
- W3: create-checkout-session ENV assertion 追加済み （OK）

## 新規 Critical

### NC1: auth-store.ts で Web 用に checkSubscriptionStatus（stub）を呼んでいる
- `/Users/tm/work/AltMe/src/features/auth/stores/auth-store.ts:73-74`
- `checkSubscriptionStatus()` は `client.web.ts` のスタブで常に free エンティトルメントを返す
- 認証後、Web ユーザーは常に free 扱いになり Pro 機能が使えない
- 修正: `usePlatformSubscriptionStore.getState().refreshStatus()` を呼ぶか、
  use-subscription.web.ts の refreshStatus を呼ぶ

### NC2: mapStripeStatus のデフォルトが 'active'
- `/Users/tm/work/AltMe/supabase/functions/webhook-stripe/index.ts:214-215`
- `incomplete`, `paused` など未処理の Stripe ステータスが `return 'active'` にフォールバック
- 未払い・未完了サブスクリプションが Pro 権限を得る
- 修正: `default: return 'expired'` または exhaustive に全ケースハンドル

### NC3: checkout.session.completed で status を 'active' に固定
- `/Users/tm/work/AltMe/supabase/functions/webhook-stripe/index.ts:73`
- 取得した `subscription.status` を `mapStripeStatus()` で変換せずに常に 'active' をセット
- SCA 待ち (incomplete) の subscription でも Pro 付与
- 修正: `status: mapStripeStatus(subscription.status)` に変更

### NC4: claimWebhookEvent 失敗時に claim が残り再試行が永久に 200 を返す
- `/Users/tm/work/AltMe/supabase/functions/_shared/webhook-utils.ts:36-61`
- claim 後にDB書き込みや外部API呼び出しが失敗してもクレームが残る
- Stripe の再試行が `Already claimed` で 200 を返し、イベントが永久に未処理になる
- 修正: try/catch で失敗時に `claimed_at` を NULL に戻す `releaseWebhookClaim` を実装

## 新規 High

### NH1: RevenueCat webhook署名検証が Bearer 比較のみ（HMAC-SHA256 未実装）
- `/Users/tm/work/AltMe/supabase/functions/webhook-revenuecat/index.ts:24-30`
- 現在は `Authorization: Bearer <secret>` の比較。RevenueCat は V2 signing key で
  `X-RevenueCat-Signature` HMAC-SHA256 を提供する場合がある
- RevenueCat コンソールで使用する認証方式を確認し、対応する方式に揃えること

### NH2: Stripe/RevenueCat webhook の DB update エラー未検証
- `/Users/tm/work/AltMe/supabase/functions/webhook-stripe/index.ts:69,99,124,139,161,166`
- `/Users/tm/work/AltMe/supabase/functions/webhook-revenuecat/index.ts:54-62,88-93,etc.`
- `supabase.from().update()` は throw しない。error チェックなしで markEventProcessed まで進む
- 修正: `const { error } = await ...; if (error) throw new Error(error.message);`

### NH3: annual_intro を create-checkout-session に送ると 400 エラー
- `/Users/tm/work/AltMe/src/shared/hooks/use-platform-subscription.web.ts:188`
- `/Users/tm/work/AltMe/src/shared/hooks/use-subscription.web.ts:176`
- `pkg.planType` をそのまま送信。EF の `PLAN_TO_PRICE` は `monthly|annual` のみ定義
- `annual_intro` 選択時に `invalid_plan_type` 400 で決済不可
- 修正: 送信前に `annual_intro` → `annual` に正規化

```ts
const checkoutPlanType = pkg.planType === 'annual_intro' ? 'annual' : pkg.planType;
body: JSON.stringify({ planType: checkoutPlanType, ... })
```

## 新規 Medium/Low

### NM1: DB の status/plan_type に型アサーション（ランタイムガードなし）
- `/Users/tm/work/AltMe/src/shared/hooks/use-platform-subscription.web.ts:51-52`
- `row.status as SubscriptionStatus` / `row.plan_type as PlanType`
- DB の不正値がランタイムエラーなく通過する
- 修正: 型ガード関数でバリデーション

### NL1: OAuth redirectTo が /auth/callback を経由しない
- `/Users/tm/work/AltMe/src/services/supabase/auth.web.ts:24,46`
- `window.location.origin` のみ → detectSessionInUrl で動作するが callback.tsx を経由しない
- 実害は軽微（detectSessionInUrl で補完）、改善推奨

### NL2: exhaustive-deps 警告
- `/Users/tm/work/AltMe/src/shared/hooks/use-platform-subscription.web.ts:253`
- `useEffect` の依存配列に `store` が欠如（ESLint warning）

## 今回の統計
- 新規指摘: 9件（検証済み）
- NC Critical: 4件
- NH High: 3件
- NM/NL Medium-Low: 2件
- 除外: 0件（hallucination なし）
