# Supabase Backend Agent Memory

## Key Project Patterns

### updated_at Function Name
This project uses `update_updated_at()` (NOT `update_updated_at_column()`).
Defined in `supabase/migrations/20260214000001_initial_schema.sql`.

### RLS Policy Pattern
Always use `(select auth.uid())` not bare `auth.uid()` for performance (5-10x faster).
Use DO $$ BEGIN IF NOT EXISTS ... END $$ for idempotent policy creation.

### Trigger Idempotency
Use `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER` for idempotency.
Use `CREATE OR REPLACE FUNCTION` for trigger functions.

### service_role Auth Pattern (Edge Functions)
Internal-only functions check: `authHeader === 'Bearer ${serviceRoleKey}'`
See `supabase/functions/provision-openclaw/index.ts` as reference.

### Shared Modules
- `../_shared/cors.ts` — corsHeaders export
- `../_shared/supabase.ts` — createSupabaseClient(req), createServiceClient()
- `../_shared/openai.ts` — OpenAI client

### Existing Tables (as of 2026-02-20)
profiles, personality_results, chat_messages, journal_entries, mood_records,
subscriptions, credits, credit_transactions, openclaw_instances,
communities, community_members, community_messages, notification_settings

### OneSignal Integration Pattern
- `include_external_user_ids` for user targeting
- `headings`/`contents` both `en` and `ja` keys
- Auth header: `Key ${ONESIGNAL_REST_API_KEY}` (not Bearer)
- Env vars: ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY

### notification_settings Category → Column Map
chat → chat_enabled
journal_reminder → journal_reminder_enabled
community → community_enabled
marketing → marketing_enabled

### Stripe Integration (as of 2026-02-21)
- `profiles.stripe_customer_id TEXT` — migration: 20260221000002
- `webhook_events` に `source` カラム追加 + `(event_id, source)` 複合ユニーク制約 — migration: 20260221000001
- Stripe Edge Functions: `create-checkout-session`, `create-portal-session`, `webhook-stripe` (all use `npm:stripe`)
- `reconcile-stripe` — INTERNAL_FUNCTION_TOKEN で認証、毎時 cron 用
- Stripe クライアントサービス: `src/services/stripe/client.ts`
- payment pages: `app/payment/success.tsx`, `app/payment/cancel.tsx`

### Webhook Idempotency Pattern (fail-closed)
- `checkIdempotency(supabase, eventId, source)` — DB エラー時は throw（fail-closed、二重処理防止）
- `markEventProcessed(supabase, eventId, source)` — 処理完了後に呼ぶ
- source: 'revenuecat' or 'stripe'
- See `supabase/functions/_shared/webhook-utils.ts`

### CORS Pattern (origin-specific)
- `getCorsHeaders(origin)` + `handleCorsPreflightRequest(req)` を全 Edge Functions に適用
- ワイルドカード `*` は使わない
- See `supabase/functions/_shared/cors.ts`

### Jest Timer Test Pattern
- `useFakeTimers()` 使用時は `afterEach` に `jest.clearAllTimers()` + `jest.useRealTimers()` を両方呼ぶ
- `--forceExit` で "Jest did not exit" 警告を回避可能（CI では推奨）
