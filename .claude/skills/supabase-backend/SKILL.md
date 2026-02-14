---
name: supabase-backend
description: |
  Supabase バックエンド開発の専門サブエージェント。
  DB設計（PostgreSQL）、認証、Edge Functions、RLS ポリシー、マイグレーションを担当。
  トリガー: Supabase, PostgreSQL, DB設計, マイグレーション, Edge Function, RLS, Auth
---

# Supabase Backend Sub-Agent

Supabase バックエンド開発の専門サブエージェント。
PostgreSQL データベース設計、認証フロー、Edge Functions、行レベルセキュリティ（RLS）を担当。

## コア能力

### 1. データベース設計
- PostgreSQL スキーマ設計（正規化、インデックス最適化）
- マイグレーションファイル管理
- RLS ポリシー設計・実装
- トリガー・関数の設計

### 2. 認証 (Supabase Auth)
- Apple Sign-In / Google Sign-In 統合
- セッション管理
- JWT カスタムクレーム
- ユーザーメタデータ管理

### 3. Edge Functions
- Deno ランタイムでのサーバーサイドロジック
- 外部API連携（OpenAI, DigitalOcean）
- CORS 設定
- エラーハンドリング・レスポンス設計

### 4. リアルタイム
- Realtime サブスクリプション設計
- チャンネル管理
- ブロードキャスト vs DB 変更通知の使い分け

## データベース設計原則

### テーブル設計ルール

1. **UUID を主キーに使用**
   ```sql
   id uuid default gen_random_uuid() primary key
   ```

2. **タイムスタンプは必ず付与**
   ```sql
   created_at timestamptz default now() not null,
   updated_at timestamptz default now() not null
   ```

3. **ソフトデリートを基本とする**
   ```sql
   deleted_at timestamptz default null
   ```

4. **外部キー制約を必ず設定**
   ```sql
   user_id uuid references auth.users(id) on delete cascade not null
   ```

5. **インデックスは WHERE 句の頻出カラムに**
   ```sql
   create index idx_messages_user_id on messages(user_id);
   create index idx_messages_created_at on messages(created_at desc);
   ```

### RLS ポリシー設計パターン

> **CRITICAL**: `auth.uid()` は必ず `(select auth.uid())` でラップする（5-10x高速化）
> 詳細は `references/security-rls.md` を参照

**基本パターン: ユーザーは自分のデータのみアクセス**
```sql
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on profiles for update
  using ((select auth.uid()) = id);
```

**サービスロール用ポリシー（Edge Functions から使用）**
```sql
create policy "Service role can manage all"
  on instances for all
  using (auth.role() = 'service_role');
```

**複合条件パターン（security definer 関数で最適化）**
```sql
-- 関数でカプセル化（RLS内のサブクエリを高速化）
create or replace function has_active_subscription(uid uuid)
returns boolean as $$
  select exists (
    select 1 from subscriptions
    where user_id = uid and status = 'active'
  );
$$ language sql security definer stable;

create policy "Pro users can access insights"
  on insights for select
  using (has_active_subscription((select auth.uid())));
```

### マイグレーション管理

```bash
# 新規マイグレーション作成
supabase migration new <name>

# ローカルで適用
supabase db reset

# リモートに適用
supabase db push
```

**命名規則**: `YYYYMMDDHHMMSS_descriptive_name.sql`

**マイグレーションのベストプラクティス**:
- 1マイグレーション1変更（テーブル追加、カラム追加などを分割）
- 破壊的変更は段階的に（新カラム追加 → データ移行 → 旧カラム削除）
- `IF NOT EXISTS` / `IF EXISTS` で冪等性を確保

## Edge Functions 設計

### 基本テンプレート

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 認証チェック
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ビジネスロジック
    const body = await req.json();
    // ...

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### ストリーミングレスポンス（AI チャット用）

```typescript
const stream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();
    // AI API からのストリームを中継
    for await (const chunk of aiStream) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }
    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    controller.close();
  },
});

return new Response(stream, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  },
});
```

## AltMe 固有テーブル

```
profiles          — ユーザープロファイル
instances         — OpenClaw インスタンス管理
subscriptions     — サブスクリプション状態
chat_messages     — チャット履歴
journal_entries   — 日記エントリ
mood_logs         — 感情ログ
personality_results — 性格診断結果
```

## 実装チェックリスト

```
[ ] 全テーブルに RLS が有効化されているか
[ ] RLS ポリシーが auth.uid() でユーザー分離されているか
[ ] マイグレーションが冪等か（再実行可能か）
[ ] Edge Functions で認証チェックがあるか
[ ] CORS ヘッダーが設定されているか
[ ] サービスロールキーがクライアントに露出していないか
[ ] インデックスが適切に設定されているか
[ ] 外部キー制約が設定されているか
[ ] タイムスタンプカラムがあるか
[ ] エラーレスポンスが統一フォーマットか
```

## 参照

### AltMe 固有パターン
- `references/schema-patterns.md` — AltMe 固有スキーマパターン集

### PostgreSQL Best Practices（28ルール、supabase/agent-skills 由来）
- `references/query-performance.md` — クエリパフォーマンス（5ルール: インデックス戦略、コンポジット、カバリング、インデックスタイプ、部分インデックス）
- `references/connection-management.md` — 接続管理（4ルール: プーリング、接続制限、アイドルタイムアウト、Prepared Statements）
- `references/security-rls.md` — セキュリティ & RLS（3ルール: RLS基礎、RLSパフォーマンス、最小権限の原則）
- `references/schema-design.md` — スキーマ設計（6ルール: 主キー戦略、データ型、FK インデックス、制約、パーティション、小文字識別子）
- `references/concurrency-locking.md` — 並行処理 & ロック（4ルール: デッドロック防止、短いトランザクション、SKIP LOCKED、Advisory Lock）
- `references/data-access-patterns.md` — データアクセスパターン（4ルール: N+1排除、カーソルページネーション、バッチINSERT、UPSERT）
- `references/monitoring.md` — 監視・診断（3ルール: EXPLAIN ANALYZE、pg_stat_statements、VACUUM/ANALYZE）
- `references/advanced-features.md` — 高度な機能（2ルール: 全文検索、JSONB インデックス）

### 外部ドキュメント
- Supabase 公式ドキュメント: https://supabase.com/docs
- PostgreSQL ドキュメント: https://www.postgresql.org/docs/
