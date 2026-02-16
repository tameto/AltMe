# Monitoring（監視・診断）

> Source: supabase/agent-skills (supabase-postgres-best-practices)
> 3 rules | Impact: LOW-MEDIUM

---

## 1. Use EXPLAIN ANALYZE to Diagnose Slow Queries

**Impact**: LOW-MEDIUM — Identify exact bottlenecks in query execution

EXPLAIN ANALYZE executes the query and shows actual timings, revealing the true performance bottlenecks.

**Incorrect (guessing at performance issues):**

```sql
-- Query is slow, but why?
select * from orders where customer_id = 123 and status = 'pending';
-- "It must be missing an index" - but which one?
```

**Correct (use EXPLAIN ANALYZE):**

```sql
explain (analyze, buffers, format text)
select * from orders where customer_id = 123 and status = 'pending';

-- Output reveals the issue:
-- Seq Scan on orders (cost=0.00..25000.00 rows=50 width=100) (actual time=0.015..450.123 rows=50 loops=1)
--   Filter: ((customer_id = 123) AND (status = 'pending'::text))
--   Rows Removed by Filter: 999950
--   Buffers: shared hit=5000 read=15000
-- Planning Time: 0.150 ms
-- Execution Time: 450.500 ms
```

Key things to look for:

| シグナル | 意味 | 対処法 |
|----------|------|--------|
| Seq Scan on large tables | インデックスが不足 | インデックス追加 |
| Rows Removed by Filter が多い | 選択性が低い / インデックス不足 | WHERE 条件の最適化 |
| Buffers: read >> hit | データがキャッシュされていない | shared_buffers 増加検討 |
| Nested Loop with high loops | JOIN 戦略が非効率 | インデックス追加 or JOIN 方式変更 |
| Sort Method: external merge | work_mem が不足 | work_mem 増加 |

**AltMe 適用例:**

```sql
-- chat_messages のクエリ診断
explain (analyze, buffers, format text)
select * from chat_messages
where user_id = $1
order by created_at desc
limit 20;
-- Seq Scan → idx_chat_messages_user_created インデックス追加が必要
-- Index Scan → OK、パフォーマンス良好
```

Reference: [EXPLAIN](https://supabase.com/docs/guides/database/inspect)

---

## 2. Enable pg_stat_statements for Query Analysis

**Impact**: LOW-MEDIUM — Identify top resource-consuming queries

pg_stat_statements tracks execution statistics for all queries, helping identify slow and frequent queries.

**Incorrect (no visibility into query patterns):**

```sql
-- Database is slow, but which queries are the problem?
-- No way to know without pg_stat_statements
```

**Correct (enable and query pg_stat_statements):**

```sql
-- Enable the extension
create extension if not exists pg_stat_statements;

-- Find slowest queries by total time
select
  calls,
  round(total_exec_time::numeric, 2) as total_time_ms,
  round(mean_exec_time::numeric, 2) as mean_time_ms,
  query
from pg_stat_statements
order by total_exec_time desc
limit 10;

-- Find most frequent queries
select calls, query
from pg_stat_statements
order by calls desc
limit 10;

-- Reset statistics after optimization
select pg_stat_statements_reset();
```

Key metrics to monitor:

```sql
-- Queries with high mean time (candidates for optimization)
select query, mean_exec_time, calls
from pg_stat_statements
where mean_exec_time > 100  -- > 100ms average
order by mean_exec_time desc;
```

**AltMe 適用:**
- Supabase Dashboard で pg_stat_statements を確認可能
- 定期的にスロークエリを確認し、インデックス追加やクエリ最適化を実施

Reference: [pg_stat_statements](https://supabase.com/docs/guides/database/extensions/pg_stat_statements)

---

## 3. Maintain Table Statistics with VACUUM and ANALYZE

**Impact**: MEDIUM — 2-10x better query plans with accurate statistics

Outdated statistics cause the query planner to make poor decisions. VACUUM reclaims space, ANALYZE updates statistics.

**Incorrect (stale statistics):**

```sql
-- Table has 1M rows but stats say 1000
-- Query planner chooses wrong strategy
explain select * from orders where status = 'pending';
-- Shows: Seq Scan (because stats show small table)
-- Actually: Index Scan would be much faster
```

**Correct (maintain fresh statistics):**

```sql
-- Manually analyze after large data changes
analyze orders;

-- Analyze specific columns used in WHERE clauses
analyze orders (status, created_at);

-- Check when tables were last analyzed
select
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
from pg_stat_user_tables
order by last_analyze nulls first;
```

Autovacuum tuning for busy tables:

```sql
-- Increase frequency for high-churn tables
alter table orders set (
  autovacuum_vacuum_scale_factor = 0.05,     -- Vacuum at 5% dead tuples (default 20%)
  autovacuum_analyze_scale_factor = 0.02     -- Analyze at 2% changes (default 10%)
);

-- Check autovacuum status
select * from pg_stat_progress_vacuum;
```

**AltMe 適用:**
- `chat_messages` — 高頻度書き込みテーブル、autovacuum の頻度を上げる

```sql
alter table chat_messages set (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);
```

- Supabase は autovacuum がデフォルト有効
- 大量データ投入後は手動 `ANALYZE` を実行

Reference: [VACUUM](https://supabase.com/docs/guides/database/database-size#vacuum-operations)
