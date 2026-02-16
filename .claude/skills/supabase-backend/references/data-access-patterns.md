# Data Access Patterns（データアクセスパターン）

> Source: supabase/agent-skills (supabase-postgres-best-practices)
> 4 rules | Impact: MEDIUM-HIGH - MEDIUM

---

## 1. Eliminate N+1 Queries with Batch Loading

**Impact**: MEDIUM-HIGH — 10-100x fewer database round trips

N+1 queries execute one query per item in a loop. Batch them into a single query using arrays or JOINs.

**Incorrect (N+1 queries):**

```sql
-- First query: get all users
select id from users where active = true;  -- Returns 100 IDs

-- Then N queries, one per user
select * from orders where user_id = 1;
select * from orders where user_id = 2;
select * from orders where user_id = 3;
-- ... 97 more queries!

-- Total: 101 round trips to database
```

**Correct (single batch query):**

```sql
-- Collect IDs and query once with ANY
select * from orders where user_id = any(array[1, 2, 3, ...]);

-- Or use JOIN instead of loop
select u.id, u.name, o.*
from users u
left join orders o on o.user_id = u.id
where u.active = true;

-- Total: 1 round trip
```

Application pattern:

```sql
-- Instead of looping in application code:
-- for user in users: db.query("SELECT * FROM orders WHERE user_id = $1", user.id)

-- Pass array parameter:
select * from orders where user_id = any($1::bigint[]);
-- Application passes: [1, 2, 3, 4, 5, ...]
```

**AltMe 適用例:**

```sql
-- Supabase JS での正しいパターン
-- BAD: ループ内で個別取得
-- for (const userId of userIds) {
--   await supabase.from('chat_messages').select('*').eq('user_id', userId);
-- }

-- GOOD: 一括取得
-- await supabase.from('chat_messages').select('*').in('user_id', userIds);
```

Reference: [N+1 Query Problem](https://supabase.com/docs/guides/database/query-optimization)

---

## 2. Use Cursor-Based Pagination Instead of OFFSET

**Impact**: MEDIUM-HIGH — Consistent O(1) performance regardless of page depth

OFFSET-based pagination scans all skipped rows, getting slower on deeper pages. Cursor pagination is O(1).

**Incorrect (OFFSET pagination):**

```sql
-- Page 1: scans 20 rows
select * from products order by id limit 20 offset 0;

-- Page 100: scans 2000 rows to skip 1980
select * from products order by id limit 20 offset 1980;

-- Page 10000: scans 200,000 rows!
select * from products order by id limit 20 offset 199980;
```

**Correct (cursor/keyset pagination):**

```sql
-- Page 1: get first 20
select * from products order by id limit 20;
-- Application stores last_id = 20

-- Page 2: start after last ID
select * from products where id > 20 order by id limit 20;
-- Uses index, always fast regardless of page depth

-- Page 10000: same speed as page 1
select * from products where id > 199980 order by id limit 20;
```

For multi-column sorting:

```sql
-- Cursor must include all sort columns
select * from products
where (created_at, id) > ('2024-01-15 10:00:00', 12345)
order by created_at, id
limit 20;
```

**AltMe 適用例:**

```sql
-- chat_messages: カーソルベースのページネーション
-- 初回ロード
select * from chat_messages
where user_id = $1
order by created_at desc
limit 20;

-- 次ページ（スクロールで古いメッセージを読み込む）
select * from chat_messages
where user_id = $1 and created_at < $last_seen_created_at
order by created_at desc
limit 20;

-- Supabase JS:
-- const { data } = await supabase
--   .from('chat_messages')
--   .select('*')
--   .eq('user_id', userId)
--   .lt('created_at', lastSeenCreatedAt)
--   .order('created_at', { ascending: false })
--   .limit(20);
```

Reference: [Pagination](https://supabase.com/docs/guides/database/pagination)

---

## 3. Batch INSERT Statements for Bulk Data

**Impact**: MEDIUM — 10-50x faster bulk inserts

Individual INSERT statements have high overhead. Batch multiple rows in single statements or use COPY.

**Incorrect (individual inserts):**

```sql
-- Each insert is a separate transaction and round trip
insert into events (user_id, action) values (1, 'click');
insert into events (user_id, action) values (1, 'view');
insert into events (user_id, action) values (2, 'click');
-- ... 1000 more individual inserts

-- 1000 inserts = 1000 round trips = slow
```

**Correct (batch insert):**

```sql
-- Multiple rows in single statement
insert into events (user_id, action) values
  (1, 'click'),
  (1, 'view'),
  (2, 'click'),
  -- ... up to ~1000 rows per batch
  (999, 'view');

-- One round trip for 1000 rows
```

For large imports, use COPY:

```sql
-- COPY is fastest for bulk loading
copy events (user_id, action, created_at)
from '/path/to/data.csv'
with (format csv, header true);

-- Or from stdin in application
copy events (user_id, action) from stdin with (format csv);
1,click
1,view
2,click
\.
```

**AltMe 適用:**
- チャット履歴のインポート時にバッチ INSERT を使用
- Supabase JS: `supabase.from('table').insert([...rows])` で自動バッチ化

Reference: [COPY](https://www.postgresql.org/docs/current/sql-copy.html)

---

## 4. Use UPSERT for Insert-or-Update Operations

**Impact**: MEDIUM — Atomic operation, eliminates race conditions

Using separate SELECT-then-INSERT/UPDATE creates race conditions. Use INSERT ... ON CONFLICT for atomic upserts.

**Incorrect (check-then-insert race condition):**

```sql
-- Race condition: two requests check simultaneously
select * from settings where user_id = 123 and key = 'theme';
-- Both find nothing

-- Both try to insert
insert into settings (user_id, key, value) values (123, 'theme', 'dark');
-- One succeeds, one fails with duplicate key error!
```

**Correct (atomic UPSERT):**

```sql
-- Single atomic operation
insert into settings (user_id, key, value)
values (123, 'theme', 'dark')
on conflict (user_id, key)
do update set value = excluded.value, updated_at = now();

-- Returns the inserted/updated row
insert into settings (user_id, key, value)
values (123, 'theme', 'dark')
on conflict (user_id, key)
do update set value = excluded.value
returning *;
```

Insert-or-ignore pattern:

```sql
-- Insert only if not exists (no update)
insert into page_views (page_id, user_id)
values (1, 123)
on conflict (page_id, user_id) do nothing;
```

**AltMe 適用例:**

```sql
-- mood_logs: ユーザーごと1日1レコードの更新
insert into mood_logs (user_id, mood, note, logged_at)
values ($1, $2, $3, current_date)
on conflict (user_id, logged_at)
do update set mood = excluded.mood, note = excluded.note, updated_at = now();

-- subscriptions: RevenueCat Webhook からの更新
insert into subscriptions (user_id, revenuecat_customer_id, status, plan_type)
values ($1, $2, $3, $4)
on conflict (user_id)
do update set
  status = excluded.status,
  plan_type = excluded.plan_type,
  updated_at = now();
```

Reference: [INSERT ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)
