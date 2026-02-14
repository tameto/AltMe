# Supabase スキーマパターン集

## 1. ユーザープロファイル + Auth 連携

```sql
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  age_range text,
  locale text default 'ja',
  timezone text default 'Asia/Tokyo',
  onboarding_completed boolean default false,
  twin_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auth ユーザー作成時に自動でプロファイル作成
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

## 2. サブスクリプション管理（RevenueCat Webhook 連携）

```sql
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  revenuecat_customer_id text,
  status text not null default 'free' check (status in ('free', 'trial', 'active', 'expired', 'cancelled')),
  plan_type text check (plan_type in ('monthly', 'annual', 'annual_intro', null)),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_status on subscriptions(status);
```

## 3. チャットメッセージ（大量データ対応）

```sql
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now() not null
);

-- 複合インデックス（ユーザーごとの時系列クエリに最適）
create index idx_chat_messages_user_created
  on chat_messages(user_id, created_at desc);

-- パーティション検討: 月次でパーティション分割（データ量が増えた場合）
```

## 4. 感情ログ（時系列データ）

```sql
create table mood_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  mood integer not null check (mood between 1 and 5),
  note text,
  logged_at date default current_date not null,
  created_at timestamptz default now() not null
);

-- ユーザーごと1日1レコードの制約
create unique index idx_mood_logs_user_date
  on mood_logs(user_id, logged_at);
```

## 5. インスタンス管理（OpenClaw）

```sql
create table instances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  droplet_id bigint,
  ip_address inet,
  status text not null default 'pending'
    check (status in ('pending', 'provisioning', 'active', 'stopping', 'stopped', 'error', 'destroying')),
  region text default 'sgp1',
  size_slug text default 's-1vcpu-1gb',
  soul_md text,
  last_health_check timestamptz,
  error_message text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_instances_user_id on instances(user_id);
create index idx_instances_status on instances(status);
```

## 6. 更新日時の自動更新トリガー

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 各テーブルに適用
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger update_subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at();

create trigger update_instances_updated_at
  before update on instances
  for each row execute function update_updated_at();
```

## 7. RLS ポリシーテンプレート

> **CRITICAL**: `auth.uid()` は必ず `(select auth.uid())` でラップする（5-10x高速化）
> 詳細は `references/security-rls.md` を参照

```sql
-- 基本: 自分のデータのみ
create policy "own_data_select" on {table}
  for select using ((select auth.uid()) = user_id);

create policy "own_data_insert" on {table}
  for insert with check ((select auth.uid()) = user_id);

create policy "own_data_update" on {table}
  for update using ((select auth.uid()) = user_id);

-- profiles テーブル（id = user_id の場合）
create policy "own_profile_select" on profiles
  for select using ((select auth.uid()) = id);

-- サービスロール用（Edge Functions）
create policy "service_all" on {table}
  for all using (auth.role() = 'service_role');
```
