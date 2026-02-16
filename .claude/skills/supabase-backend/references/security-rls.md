# Security & RLS（セキュリティと行レベルセキュリティ）

> Source: supabase/agent-skills (supabase-postgres-best-practices)
> 3 rules | Impact: CRITICAL - MEDIUM

---

## 1. Enable Row Level Security for Multi-Tenant Data

**Impact**: CRITICAL — Database-enforced tenant isolation, prevent data leaks

Row Level Security (RLS) enforces data access at the database level, ensuring users only see their own data.

**Incorrect (application-level filtering only):**

```sql
-- Relying only on application to filter
select * from orders where user_id = $current_user_id;

-- Bug or bypass means all data is exposed!
select * from orders;  -- Returns ALL orders
```

**Correct (database-enforced RLS):**

```sql
-- Enable RLS on the table
alter table orders enable row level security;

-- Create policy for users to see only their orders
create policy orders_user_policy on orders
  for all
  using (user_id = current_setting('app.current_user_id')::bigint);

-- Force RLS even for table owners
alter table orders force row level security;

-- Set user context and query
set app.current_user_id = '123';
select * from orders;  -- Only returns orders for user 123
```

Policy for authenticated role (Supabase パターン):

```sql
create policy orders_user_policy on orders
  for all
  to authenticated
  using (user_id = (select auth.uid()));
```

> **CRITICAL**: `auth.uid()` は必ず `(select auth.uid())` でラップする（後述のパフォーマンスルール参照）

**AltMe 適用例:**

```sql
-- 全テーブルに RLS を有効化
alter table profiles enable row level security;
alter table chat_messages enable row level security;
alter table mood_logs enable row level security;
alter table instances enable row level security;
alter table subscriptions enable row level security;

-- profiles: id = auth.uid()
create policy "Users can view own profile" on profiles
  for select using ((select auth.uid()) = id);

create policy "Users can update own profile" on profiles
  for update using ((select auth.uid()) = id);

-- chat_messages: user_id = auth.uid()
create policy "Users can view own messages" on chat_messages
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert own messages" on chat_messages
  for insert with check ((select auth.uid()) = user_id);

-- mood_logs: user_id = auth.uid()
create policy "Users can manage own mood logs" on mood_logs
  for all using ((select auth.uid()) = user_id);
```

Reference: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## 2. Optimize RLS Policies for Performance

**Impact**: HIGH — 5-10x faster RLS queries with proper patterns

Poorly written RLS policies can cause severe performance issues. Use subqueries and indexes strategically.

**Incorrect (function called for every row):**

```sql
create policy orders_policy on orders
  using (auth.uid() = user_id);  -- auth.uid() called per row!

-- With 1M rows, auth.uid() is called 1M times
```

**Correct (wrap functions in SELECT):**

```sql
create policy orders_policy on orders
  using ((select auth.uid()) = user_id);  -- Called once, cached

-- 100x+ faster on large tables
```

Use security definer functions for complex checks:

```sql
-- Create helper function (runs as definer, bypasses RLS)
create or replace function is_team_member(team_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = $1 and user_id = (select auth.uid())
  );
$$;

-- Use in policy (indexed lookup, not per-row check)
create policy team_orders_policy on orders
  using ((select is_team_member(team_id)));
```

Always add indexes on columns used in RLS policies:

```sql
create index orders_user_id_idx on orders (user_id);
```

**AltMe 適用例:**

```sql
-- 課金チェック関数（security definer で最適化）
create or replace function has_active_subscription(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid and status in ('active', 'trial')
  );
$$;

-- Pro ユーザーのみアクセス可能な機能
create policy "Pro users can access insights" on insights
  for select using (has_active_subscription((select auth.uid())));

-- RLS 用インデックス
create index idx_chat_messages_user_id on chat_messages (user_id);
create index idx_mood_logs_user_id on mood_logs (user_id);
create index idx_instances_user_id on instances (user_id);
create index idx_subscriptions_user_id on subscriptions (user_id);
```

Reference: [RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)

---

## 3. Apply Principle of Least Privilege

**Impact**: MEDIUM — Reduced attack surface, better audit trail

Grant only the minimum permissions required. Never use superuser for application queries.

**Incorrect (overly broad permissions):**

```sql
-- Application uses superuser connection
-- Or grants ALL to application role
grant all privileges on all tables in schema public to app_user;
grant all privileges on all sequences in schema public to app_user;

-- Any SQL injection becomes catastrophic
-- drop table users; cascades to everything
```

**Correct (minimal, specific grants):**

```sql
-- Create role with no default privileges
create role app_readonly nologin;

-- Grant only SELECT on specific tables
grant usage on schema public to app_readonly;
grant select on public.products, public.categories to app_readonly;

-- Create role for writes with limited scope
create role app_writer nologin;
grant usage on schema public to app_writer;
grant select, insert, update on public.orders to app_writer;
grant usage on sequence orders_id_seq to app_writer;
-- No DELETE permission

-- Login role inherits from these
create role app_user login password 'xxx';
grant app_writer to app_user;
```

Revoke public defaults:

```sql
-- Revoke default public access
revoke all on schema public from public;
revoke all on all tables in schema public from public;
```

**AltMe 適用:**
- Supabase は `anon`, `authenticated`, `service_role` の3ロールを提供
- `anon` — 未認証ユーザー（最小限の権限）
- `authenticated` — 認証済みユーザー（RLS で制限）
- `service_role` — Edge Functions からのサーバーサイド操作（RLS バイパス可能）
- クライアントに `service_role` キーを絶対に露出させないこと

Reference: [Roles and Privileges](https://supabase.com/blog/postgres-roles-and-privileges)
