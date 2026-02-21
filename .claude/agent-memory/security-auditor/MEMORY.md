# Security Auditor Memory - AltMe

## Audited Files (2026-02-21, updated final audit)

### Architecture Pattern
- Edge Functions use two CORS exports: `corsHeaders` (wildcard `*`) and `getCorsHeaders()` (origin-restricted)
- Webhook functions (stripe, revenuecat) are server-to-server — CORS not needed, correctly omitted
- User-facing functions should use `getCorsHeaders()` — currently inconsistent
- `reconcile-stripe` uses `INTERNAL_FUNCTION_TOKEN` Bearer auth (no CORS) — correct for cron/admin

### Known Issues (Active)

#### HIGH: SUPABASE_SERVICE_ROLE_KEY sent to external Cloudflare Worker
- `destroy-openclaw/index.ts` line 126-133: `stopCfContainer()` sends service_role key to CF Worker URL stored in DB (`cf_worker_url`)
- `restart-openclaw/index.ts` line 19-20: `callCFWorkerRestart()` sends service_role key to `CF_WORKER_URL` (env var — lower risk)
- `update-soul-md/index.ts` line 138-148: same issue via `callCFWorkerRestart()`
- Recommended fix: use a dedicated `CF_WORKER_INTERNAL_SECRET` env var instead of service_role key

#### HIGH: Wildcard CORS on internal Edge Functions
- `provision-openclaw`, `destroy-openclaw`, `restart-openclaw`, `update-soul-md` use `corsHeaders` (`*`)
- All have proper auth checks (service_role or JWT), so actual risk is limited
- Recommended fix: migrate to `getCorsHeaders()`

#### MEDIUM: stripe_customer_id RLS protection incomplete
- `profiles` UPDATE policy allows all columns; users can overwrite their own `stripe_customer_id`
- Could allow a user to associate another customer's Stripe ID to exploit billing
- Recommended fix: restrict `stripe_customer_id` writes to service role only via RLS or column-level security

#### MEDIUM: auth/callback.tsx uses getSession() instead of getUser()
- `app/auth/callback.tsx` line 56: `getSession()` does not re-verify JWT with Supabase server
- Risk is low here (fresh PKCE token exchange), but `getUser()` is more secure
- Recommended fix: call `getUser()` after session establishment

#### MEDIUM: npm audit - minimatch ReDoS in production dependencies
- `expo`, `expo-router`, `react-native`, `@react-native-google-signin/google-signin` transitively depend on vulnerable `minimatch`
- Runtime impact is limited (build tool path); will be resolved by Expo SDK upgrade

#### LOW: CORS getCorsHeaders() fallback returns localhost:8081
- Unknown origins get `Access-Control-Allow-Origin: http://localhost:8081`
- Browsers block mismatched Origin, so no real bypass possible
- Recommended fix: return empty string or omit header for unknown origins

#### LOW: triggerProvision failure silently consumed in webhook-stripe
- `webhook-stripe/index.ts` line 219-238: provision failure is logged but `markEventProcessed` still runs
- Provisioning failure after successful payment is not retried
- Recommended fix: use a failure queue or don't mark as processed on provision failure

### Resolved Issues (2026-02-21)
- SEV-002 RESOLVED: NON_RENEWING_PURCHASE is now a no-op (credit packs not supported)
- SEV-004 RESOLVED: Both webhook-stripe and webhook-revenuecat now use `claimWebhookEvent()` (atomic idempotency)

### Confirmed Clean
- No hardcoded secrets in src/ or app/
- .env properly in .gitignore, never committed
- All public tables have RLS enabled
- Stripe webhook signature verification correct (constructEventAsync)
- RevenueCat Bearer token check is constant-time string equality (acceptable)
- webhook_events has UNIQUE(event_id, source) constraint + claimed_at column
- `webhook_events` table: RLS enabled + REVOKE from anon/authenticated
- `provision-openclaw` verifies service_role key in Authorization header (internal-only)
- `reconcile-stripe` verifies INTERNAL_FUNCTION_TOKEN Bearer auth (internal-only, no CORS)
- ALLOWED_PRICE_IDS whitelist on checkout session creation
- No sensitive data in error responses (all return generic messages)
- `create-checkout-session`: JWT auth + ALLOWED_PRICE_IDS whitelist + getCorsHeaders()
- `create-portal-session`: JWT auth + customer_id from DB (not user-supplied) + getCorsHeaders()
- `src/config/env.ts`: only EXPO_PUBLIC_* vars exposed (no service_role key)
- updateProfile() in auth-shared.ts does not expose stripe_customer_id write path
