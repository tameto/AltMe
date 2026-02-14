# Advanced Features（高度な機能）

> Source: supabase/agent-skills (supabase-postgres-best-practices)
> 2 rules | Impact: MEDIUM

---

## 1. Use tsvector for Full-Text Search

**Impact**: MEDIUM — 100x faster than LIKE, with ranking support

LIKE with wildcards can't use indexes. Full-text search with tsvector is orders of magnitude faster.

**Incorrect (LIKE pattern matching):**

```sql
-- Cannot use index, scans all rows
select * from articles where content like '%postgresql%';

-- Case-insensitive makes it worse
select * from articles where lower(content) like '%postgresql%';
```

**Correct (full-text search with tsvector):**

```sql
-- Add tsvector column and index
alter table articles add column search_vector tsvector
  generated always as (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))) stored;

create index articles_search_idx on articles using gin (search_vector);

-- Fast full-text search
select * from articles
where search_vector @@ to_tsquery('english', 'postgresql & performance');

-- With ranking
select *, ts_rank(search_vector, query) as rank
from articles, to_tsquery('english', 'postgresql') query
where search_vector @@ query
order by rank desc;
```

Search multiple terms:

```sql
-- AND: both terms required
to_tsquery('postgresql & performance')

-- OR: either term
to_tsquery('postgresql | mysql')

-- Prefix matching
to_tsquery('post:*')
```

**AltMe 適用例:**

```sql
-- chat_messages の全文検索（日本語対応）
-- 注意: 日本語は pgroonga 拡張が推奨
-- Supabase では pgroonga が利用可能

-- 英語コンテンツの場合:
alter table chat_messages add column search_vector tsvector
  generated always as (to_tsvector('english', coalesce(content, ''))) stored;

create index idx_chat_messages_search on chat_messages using gin (search_vector);

-- 検索クエリ
select * from chat_messages
where user_id = $1
  and search_vector @@ to_tsquery('english', $2)
order by created_at desc
limit 20;
```

Reference: [Full Text Search](https://supabase.com/docs/guides/database/full-text-search)

---

## 2. Index JSONB Columns for Efficient Querying

**Impact**: MEDIUM — 10-100x faster JSONB queries with proper indexing

JSONB queries without indexes scan the entire table. Use GIN indexes for containment queries.

**Incorrect (no index on JSONB):**

```sql
create table products (
  id bigint primary key,
  attributes jsonb
);

-- Full table scan for every query
select * from products where attributes @> '{"color": "red"}';
select * from products where attributes->>'brand' = 'Nike';
```

**Correct (GIN index for JSONB):**

```sql
-- GIN index for containment operators (@>, ?, ?&, ?|)
create index products_attrs_gin on products using gin (attributes);

-- Now containment queries use the index
select * from products where attributes @> '{"color": "red"}';

-- For specific key lookups, use expression index
create index products_brand_idx on products ((attributes->>'brand'));
select * from products where attributes->>'brand' = 'Nike';
```

Choose the right operator class:

```sql
-- jsonb_ops (default): supports all operators, larger index
create index idx1 on products using gin (attributes);

-- jsonb_path_ops: only @> operator, but 2-3x smaller index
create index idx2 on products using gin (attributes jsonb_path_ops);
```

**AltMe 適用例:**

```sql
-- chat_messages の metadata (JSONB) にインデックス
create index idx_chat_messages_metadata on chat_messages using gin (metadata jsonb_path_ops);

-- metadata 内の特定キーで検索
-- 例: tool_calls を含むメッセージを取得
select * from chat_messages
where user_id = $1
  and metadata @> '{"has_tool_calls": true}'
order by created_at desc;

-- personality_results の JSONB データ
create index idx_personality_results on personality_results using gin (results jsonb_path_ops);
```

Reference: [JSONB Indexes](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING)
