# Query Performance（クエリパフォーマンス）

> Source: supabase/agent-skills (supabase-postgres-best-practices)
> 5 rules | Impact: CRITICAL - HIGH

---

## 1. Add Indexes on WHERE and JOIN Columns

**Impact**: CRITICAL — 100-1000x faster queries on large tables

Queries filtering or joining on unindexed columns cause full table scans, which become exponentially slower as tables grow.

**Incorrect (sequential scan on large table):**

```sql
-- No index on customer_id causes full table scan
select * from orders where customer_id = 123;

-- EXPLAIN shows: Seq Scan on orders (cost=0.00..25000.00 rows=100 width=85)
```

**Correct (index scan):**

```sql
-- Create index on frequently filtered column
create index orders_customer_id_idx on orders (customer_id);

select * from orders where customer_id = 123;

-- EXPLAIN shows: Index Scan using orders_customer_id_idx (cost=0.42..8.44 rows=100 width=85)
```

For JOIN columns, always index the foreign key side:

```sql
-- Index the referencing column
create index orders_customer_id_idx on orders (customer_id);

select c.name, o.total
from customers c
join orders o on o.customer_id = c.id;
```

**AltMe 適用例:**

```sql
-- chat_messages のユーザー別取得を高速化
create index idx_chat_messages_user_id on chat_messages (user_id);

-- instances のユーザー別取得
create index idx_instances_user_id on instances (user_id);
```

Reference: [Query Optimization](https://supabase.com/docs/guides/database/query-optimization)

---

## 2. Create Composite Indexes for Multi-Column Queries

**Impact**: HIGH — 5-10x faster multi-column queries

When queries filter on multiple columns, a composite index is more efficient than separate single-column indexes.

**Incorrect (separate indexes require bitmap scan):**

```sql
-- Two separate indexes
create index orders_status_idx on orders (status);
create index orders_created_idx on orders (created_at);

-- Query must combine both indexes (slower)
select * from orders where status = 'pending' and created_at > '2024-01-01';
```

**Correct (composite index):**

```sql
-- Single composite index (leftmost column first for equality checks)
create index orders_status_created_idx on orders (status, created_at);

-- Query uses one efficient index scan
select * from orders where status = 'pending' and created_at > '2024-01-01';
```

**Column order matters** — place equality columns first, range columns last:

```sql
-- Good: status (=) before created_at (>)
create index idx on orders (status, created_at);

-- Works for: WHERE status = 'pending'
-- Works for: WHERE status = 'pending' AND created_at > '2024-01-01'
-- Does NOT work for: WHERE created_at > '2024-01-01' (leftmost prefix rule)
```

**AltMe 適用例:**

```sql
-- chat_messages: ユーザーごとの時系列クエリに最適
create index idx_chat_messages_user_created
  on chat_messages (user_id, created_at desc);

-- mood_logs: ユーザーごとの日付範囲クエリ
create index idx_mood_logs_user_logged
  on mood_logs (user_id, logged_at desc);
```

Reference: [Multicolumn Indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)

---

## 3. Use Covering Indexes to Avoid Table Lookups

**Impact**: MEDIUM-HIGH — 2-5x faster queries by eliminating heap fetches

Covering indexes include all columns needed by a query, enabling index-only scans that skip the table entirely.

**Incorrect (index scan + heap fetch):**

```sql
create index users_email_idx on users (email);

-- Must fetch name and created_at from table heap
select email, name, created_at from users where email = 'user@example.com';
```

**Correct (index-only scan with INCLUDE):**

```sql
-- Include non-searchable columns in the index
create index users_email_idx on users (email) include (name, created_at);

-- All columns served from index, no table access needed
select email, name, created_at from users where email = 'user@example.com';
```

Use INCLUDE for columns you SELECT but don't filter on:

```sql
-- Searching by status, but also need customer_id and total
create index orders_status_idx on orders (status) include (customer_id, total);

select status, customer_id, total from orders where status = 'shipped';
```

**AltMe 適用例:**

```sql
-- subscriptions: ステータスチェック時に plan_type も一緒に取得
create index idx_subscriptions_status on subscriptions (status)
  include (user_id, plan_type, current_period_end);
```

Reference: [Index-Only Scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html)

---

## 4. Choose the Right Index Type for Your Data

**Impact**: HIGH — 10-100x improvement with correct index type

Different index types excel at different query patterns. The default B-tree isn't always optimal.

**Incorrect (B-tree for JSONB containment):**

```sql
-- B-tree cannot optimize containment operators
create index products_attrs_idx on products (attributes);
select * from products where attributes @> '{"color": "red"}';
-- Full table scan - B-tree doesn't support @> operator
```

**Correct (GIN for JSONB):**

```sql
-- GIN supports @>, ?, ?&, ?| operators
create index products_attrs_idx on products using gin (attributes);
select * from products where attributes @> '{"color": "red"}';
```

Index type guide:

```sql
-- B-tree (default): =, <, >, BETWEEN, IN, IS NULL
create index users_created_idx on users (created_at);

-- GIN: arrays, JSONB, full-text search
create index posts_tags_idx on posts using gin (tags);

-- GiST: geometric data, range types, nearest-neighbor (KNN) queries
create index locations_idx on places using gist (location);

-- BRIN: large time-series tables (10-100x smaller index)
create index events_time_idx on events using brin (created_at);

-- Hash: equality-only (slightly faster than B-tree for =)
create index sessions_token_idx on sessions using hash (token);
```

| タイプ | 用途 | 演算子 | インデックスサイズ |
|--------|------|--------|--------------------|
| B-tree（デフォルト）| 等値・範囲比較 | `=`, `<`, `>`, `BETWEEN`, `IN` | 標準 |
| GIN | 配列, JSONB, 全文検索 | `@>`, `?`, `@@` | 大 |
| GiST | 幾何データ, 範囲型 | `&&`, `@>`, KNN | 中 |
| BRIN | 大規模時系列テーブル | 範囲 | 10-100x小 |
| Hash | 等値のみ | `=` | 標準 |

**AltMe 適用例:**

```sql
-- chat_messages の metadata (JSONB) に GIN インデックス
create index idx_chat_messages_metadata on chat_messages using gin (metadata);

-- chat_messages の時系列に BRIN（データ量が大きくなった場合）
create index idx_chat_messages_created_brin on chat_messages using brin (created_at);
```

Reference: [Index Types](https://www.postgresql.org/docs/current/indexes-types.html)

---

## 5. Use Partial Indexes for Filtered Queries

**Impact**: HIGH — 5-20x smaller indexes, faster writes and queries

Partial indexes only include rows matching a WHERE condition, making them smaller and faster when queries consistently filter on the same condition.

**Incorrect (full index includes irrelevant rows):**

```sql
-- Index includes all rows, even soft-deleted ones
create index users_email_idx on users (email);

-- Query always filters active users
select * from users where email = 'user@example.com' and deleted_at is null;
```

**Correct (partial index matches query filter):**

```sql
-- Index only includes active users
create index users_active_email_idx on users (email)
where deleted_at is null;

-- Query uses the smaller, faster index
select * from users where email = 'user@example.com' and deleted_at is null;
```

Common use cases for partial indexes:

```sql
-- Only pending orders (status rarely changes once completed)
create index orders_pending_idx on orders (created_at)
where status = 'pending';

-- Only non-null values
create index products_sku_idx on products (sku)
where sku is not null;
```

**AltMe 適用例:**

```sql
-- instances: アクティブなインスタンスのみインデックス
create index idx_instances_active on instances (user_id)
  where status = 'active';

-- subscriptions: アクティブなサブスクリプションのみ
create index idx_subscriptions_active on subscriptions (user_id)
  where status in ('active', 'trial');
```

Reference: [Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)

---

## 不足インデックスの検出クエリ

```sql
-- シーケンシャルスキャンが多すぎるテーブルを検出
select
  schemaname, relname, seq_scan, idx_scan,
  seq_scan - idx_scan as too_many_seq_scans
from pg_stat_user_tables
where seq_scan - idx_scan > 0
order by too_many_seq_scans desc;
```
