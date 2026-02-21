# Codex Review: 20260221-web-full-impl

**日時**: 2026-02-21
**モデル**: gpt-5.3-codex（フォーカスレビュー×3並列）+ 自己検証
**対象**: Web 対応追加（Platform-specific splitting, Stripe Checkout, Edge Functions）
**規模**: 156ファイル変更、~14,700行差分

---

## Critical（必ず修正）

### C1: `subscriptions` テーブルのカラム名不一致（DBクエリ失敗）
**ファイル**: `src/shared/hooks/use-platform-subscription.web.ts:136`, `src/shared/hooks/use-subscription.web.ts:143,211`
**確認**: DBスキーマ `supabase/migrations/20260214000001_initial_schema.sql:160` は `plan_type`

```ts
// 現状（誤）
.select('status, plan, current_period_end, trial_end')
// 修正
.select('status, plan_type, current_period_end, trial_end')
// mapDbSubscription の row.plan も row.plan_type に変更
```

### C2: `credits` テーブルの `balance` カラムは削除済み
**ファイル**: `supabase/functions/webhook-revenuecat/index.ts:144-156`
**確認**: `supabase/migrations/20260215000002_credits_restructure.sql:16` で `balance` カラムを DROP
**現状**: `NON_RENEWING_PURCHASE` の処理が `balance` を SELECT/UPSERT しており、DB エラーで毎回失敗する

```ts
// 現状（誤）
.select('balance')
// DB構造から credits テーブルの正しいカラムを確認して修正
// 現在のカラム: daily_remaining, last_reset_at, created_at
```

### C3: `payment/success.tsx` で Web の課金確認が常に `free` を返す
**ファイル**: `app/payment/success.tsx:6,29`
**確認**: `src/services/revenuecat/client.web.ts:16` の `checkSubscriptionStatus` は Web stub で常に `freeEntitlement` を返す

```ts
// 現状（誤）: RevenueCat stub を呼んでいる
import { checkSubscriptionStatus } from '@/src/services/revenuecat/client';
const entitlement = await checkSubscriptionStatus(); // Web では常に free

// 修正: Web では Supabase から直接確認する
import { usePlatformSubscriptionStore } from '@/src/shared/hooks/use-platform-subscription';
await usePlatformSubscriptionStore.getState().refreshStatus();
```

### C4: `plan_type` の値が3箇所で不一致（DB制約違反の可能性）
**ファイル**:
- `supabase/migrations/20260214000001_initial_schema.sql:160`: `CHECK IN ('monthly', 'annual', 'intro_annual')`
- `src/shared/types/subscription.ts:9`: `'free' | 'monthly' | 'annual' | 'annual_intro'`
- `supabase/functions/webhook-revenuecat/index.ts:241`: `return 'intro_annual'`
- `supabase/functions/_shared/webhook-utils.ts:111`: `'annual_intro'`

`intro_annual` と `annual_intro` が混在。DB CHECK 制約は `intro_annual` のみ許可。
TypeScript 型 `annual_intro` を UPSERT すると DB エラー。

**修正**: DB CHECK 制約を正とし、TypeScript 型・webhook-utils を `intro_annual` に統一。または DB 制約を `annual_intro` に変更（要合意）。

---

## High（修正推奨）

### H1: TOCTOU による冪等性の不完全性（並列 webhook での二重処理リスク）
**ファイル**: `supabase/functions/webhook-stripe/index.ts:44-47`, `supabase/functions/webhook-revenuecat/index.ts:35-41`
**確認**: `claimWebhookEvent`（INSERT + UNIQUE 制約で原子的クレーム）は `_shared/webhook-utils.ts` に定義済みだが未使用

`checkIdempotency`（SELECT）→ ビジネスロジック → `markEventProcessed`（UPSERT）パターンは、
同一イベントが並列で届いた場合に両方が `isProcessed=false` を取得して二重処理する可能性がある。

```ts
// 修正: checkIdempotency の代わりに claimWebhookEvent を使う
const { claimed } = await claimWebhookEvent(supabase, event.id, 'stripe');
if (!claimed) {
  return new Response(JSON.stringify({ message: 'Already claimed' }), { status: 200 });
}
// ビジネスロジック後に markEventProcessed は不要（INSERT が既に記録している）
```

ただし `claimWebhookEvent` の INSERT には `event_type NOT NULL` 制約がある `webhook_events` テーブルに対して `event_type` を省略しているため、採用前にスキーマ修正も必要。

### H2: `markEventProcessed` / `claimWebhookEvent` が `event_type NOT NULL` に違反
**ファイル**: `supabase/functions/_shared/webhook-utils.ts:43,68`
**確認**: `webhook_events` テーブルの `event_type TEXT NOT NULL`（`supabase/migrations/20260215000004_new_tables.sql:12`）

`markEventProcessed` の UPSERT と `claimWebhookEvent` の INSERT は `event_type` を渡していないため、初回 INSERT 時に DB エラー。

```ts
// 修正: event_type パラメータを追加
export const markEventProcessed = async (
  supabase: SupabaseClient,
  eventId: string,
  source: 'stripe' | 'revenuecat',
  eventType: string,  // 追加
): Promise<void> => {
  await supabase.from('webhook_events').upsert({
    event_id: eventId,
    source,
    event_type: eventType,  // 追加
    processed_at: new Date().toISOString(),
  }, { onConflict: 'event_id,source' });
};
```

### H3: Web OAuth redirect 中に `isLoading` が永続的に `true` になる
**ファイル**: `src/features/auth/stores/auth-store.ts:136-138`, `src/services/supabase/auth.web.ts:33`
**確認**: `auth.web.ts` の `signInWithApple/signInWithGoogle` は `return new Promise(() => {})` で never-resolve。
auth-store の `finally { set({ isLoading: false }) }` は never-resolving promise に対して実行されない。
OAuth redirect でページが離れるため実害は通常ないが、redirect がキャンセルされた場合（ブラウザバック）に UI がスピナーのまま固まる。

```ts
// 修正案: Web では redirect 前に isLoading を false にする
export const signInWithApple = async (): Promise<UserProfile> => {
  const { error } = await supabase.auth.signInWithOAuth({ ... });
  if (error) throw error;
  // redirect が始まる前に isLoading を落とす
  // (store が直接ここで操作できないため、エラーをスローして finally で落とすか、
  //  コールバックパターンに変更する)
  return new Promise(() => {});
};
```

### H4: `NON_RENEWING_PURCHASE` の credits 加算が非 atomic
**ファイル**: `supabase/functions/webhook-revenuecat/index.ts:143-156`

SELECT → 計算 → UPDATE の非 atomic パターンは並列 webhook でのレースコンディションリスクがある。
現状 C2（balance カラム削除）の問題で動作していないが、修正後は atomic にする。

```sql
-- Edge Function ではなく DB RPC で atomic 加算
UPDATE credits SET balance = balance + ${creditAmount} WHERE user_id = '${userId}'
-- または Supabase の RPC
```

### H5: `create-checkout-session` の `stripe_customer_id` 保存失敗を無視
**ファイル**: `supabase/functions/create-checkout-session/index.ts:95-98`

```ts
await serviceClient.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
// エラーチェックなし → 失敗しても処理続行
```

保存失敗すると次回 Checkout 時に Stripe Customer が重複作成され続ける。
エラーをログに出力するか、失敗時はロールバック（Customer 削除）する。

---

## Warning（修正推奨）

### W1: `webhook-revenuecat` に CORS ヘッダーが不要
**ファイル**: `supabase/functions/webhook-revenuecat/index.ts:1,8-9`
Webhook はサーバー間通信のため CORS は不要。`corsHeaders`（wildcard `*`）を返しているのはセキュリティ的には問題なし（Supabase が JWT 認証で保護）だが、意図しない混入のリスクがある。

### W2: CORS ヘッダーの二重実装（wildcard と allowlist の混在）
**ファイル**: `supabase/functions/_shared/cors.ts:1-26`
`getCorsHeaders`（allowlist）と `corsHeaders`（wildcard `*`）が共存。
`create-checkout-session` は `getCorsHeaders` を正しく使用。多くの既存 Function は `corsHeaders`（wildcard）を使用。新規 Function は `getCorsHeaders` に統一すべき。

### W3: `successUrl` / `cancelUrl` がフロントから送られても Edge Function が無視
**ファイル**: `supabase/functions/create-checkout-session/index.ts:106-107`、`src/shared/hooks/use-platform-subscription.web.ts:189-190`

フロントは `successUrl`、`cancelUrl` を JSON body に含めて送っているが Edge Function は `APP_BASE_URL` 環境変数から固定 URL を生成して使用する（フロントの値を無視）。
Staging/Production 環境で `APP_BASE_URL` を正しく設定しないと本番 URL へ誤リダイレクトが発生する。

### W4: `sessionStorage` 使用によるセッション揮発性
**ファイル**: `src/services/supabase/client.web.ts:11`
`sessionStorage` はタブを閉じるとクリアされるため、タブを閉じるたびに再ログインが必要になる。
UX 要件として意図的であれば問題ないが、`localStorage` または Supabase のデフォルトストレージへの変更を検討。

### W5: `use-platform-subscription.web.ts` の deps 漏れ
**ファイル**: `src/shared/hooks/use-platform-subscription.web.ts:250-254`

```ts
useEffect(() => {
  store.refreshStatus();
  store.loadOfferings();
}, []); // store が deps に含まれていない（eslint-disable が必要）
```

Zustand の `store` オブジェクトは毎回新しいので eslint の `react-hooks/exhaustive-deps` 警告が出る。
Zustand ストアの action を useEffect 内で呼ぶ場合は `usePlatformSubscriptionStore.getState().refreshStatus()` を直接呼ぶパターンに変更すると deps 問題を回避できる。

---

## Info（検討事項）

### I1: Stripe + RevenueCat 二重課金経路の subscriptions 上書き
Web（Stripe）とモバイル（RevenueCat）の両方で課金した場合、`subscriptions` テーブルは `user_id` をコンフリクトキーにして UPSERT するため、後から処理された webhook が前の課金情報を上書きする。
`webhook_source` カラムの追加マイグレーションはあるが `subscriptions` テーブルへの `webhook_source` 記録はない。
同一ユーザーが Web と Mobile 両方で課金する想定がないなら問題なし。

### I2: `reconcile-stripe` のカバレッジ
`reconcile-stripe` は `expired` セッションのみを対象にしているが、`session.status !== 'expired'` の場合は完全にスキップされる。
Webhook 配信失敗の典型ケース（`checkout.session.completed` 未着）では session が `complete` になっているため、このツールでは修正できない。手動確認フローとの組み合わせが必要。

### I3: `auth-store.ts` の Web 向け RevenueCat リスナー
Web では `addCustomerInfoListener` は no-op（`src/services/revenuecat/client.web.ts:30-34`）。
auth-store で `bindRcListener()` を呼んでいるが Web では何もしない。これ自体は問題ないが、Web の課金状態更新は entitlement-poller（30秒ポーリング）のみが担当している点は設計として明示するとよい。

---

## 統計
- **Critical**: 4件（C1, C2, C3, C4 — 全て自己検証済み）
- **High**: 5件（H1-H5 — 全て自己検証済み）
- **Warning**: 5件（W1-W5）
- **Info**: 3件（I1-I3）
- **除外**: Codex レビュー中の hallucination 候補は検証待ち

## 検証ソース
- `supabase/migrations/20260214000001_initial_schema.sql` — subscriptions スキーマ
- `supabase/migrations/20260215000002_credits_restructure.sql` — credits balance 削除
- `supabase/migrations/20260215000004_new_tables.sql` — webhook_events スキーマ
- `supabase/migrations/20260221000001_add_webhook_source_column.sql` — source カラム追加
- `src/services/revenuecat/client.web.ts` — Web RevenueCat stub
- `src/shared/hooks/use-platform-subscription.web.ts` — Web 課金フック
