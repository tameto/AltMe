# データベーススキーマ仕様書

## 概要

Supabase (PostgreSQL) 上に構築するAltMeアプリのデータベーススキーマ定義。
全テーブルでRow Level Security (RLS) を有効化し、ユーザーは自分のデータのみアクセス可能とする。

---

## テーブル一覧

| # | テーブル名 | 概要 | 主要な依存 |
|---|-----------|------|-----------|
| 1 | profiles | ユーザープロフィール | auth.users |
| 2 | personality_results | 性格診断結果 | profiles |
| 3 | chat_messages | チャット履歴 | profiles |
| 4 | journal_entries | 日記エントリ | profiles |
| 5 | mood_records | 気分記録 | profiles |
| 6 | subscriptions | サブスクリプション状態 | profiles |
| 7 | credits | クレジット残高 | profiles |
| 8 | credit_transactions | クレジット取引履歴 | profiles, credits |
| 9 | **openclaw_instances** | OpenClawインスタンス管理（NEW） | profiles |

---

## テーブル定義

### 1. profiles

ユーザープロフィール。Supabase Authの `auth.users` と1:1で紐付く。

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  age_range TEXT CHECK (age_range IN ('18-24', '25-34', '35-44', '45+')),
  locale TEXT DEFAULT 'ja',
  timezone TEXT DEFAULT 'Asia/Tokyo',
  onboarding_completed BOOLEAN DEFAULT false,
  twin_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | - | auth.usersのIDと同一 |
| display_name | TEXT | YES | NULL | 表示名 |
| avatar_url | TEXT | YES | NULL | アバター画像URL |
| email | TEXT | YES | NULL | メールアドレス（auth.usersから同期） |
| age_range | TEXT | YES | NULL | 年齢層（18-24/25-34/35-44/45+） |
| locale | TEXT | YES | 'ja' | ロケール |
| timezone | TEXT | YES | 'Asia/Tokyo' | タイムゾーン |
| onboarding_completed | BOOLEAN | NO | false | オンボーディング完了フラグ |
| twin_name | TEXT | YES | NULL | AIツインの名前 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**RLSポリシー:**
```sql
-- 自分のプロフィールのみ参照可能
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- auth.usersへのinsertトリガーで自動作成（ユーザー自身はinsertしない）
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

### 2. personality_results

オンボーディング時の性格診断結果。

```sql
CREATE TABLE personality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  raw_answers JSONB NOT NULL,
  openness INTEGER CHECK (openness >= 0 AND openness <= 100),
  conscientiousness INTEGER CHECK (conscientiousness >= 0 AND conscientiousness <= 100),
  extraversion INTEGER CHECK (extraversion >= 0 AND extraversion <= 100),
  agreeableness INTEGER CHECK (agreeableness >= 0 AND agreeableness <= 100),
  neuroticism INTEGER CHECK (neuroticism >= 0 AND neuroticism <= 100),
  summary TEXT,
  communication_style JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_personality_results_user_id ON personality_results(user_id);
ALTER TABLE personality_results ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー |
| raw_answers | JSONB | NO | - | 質問と回答のペア（`[{questionId, answer}]`） |
| openness | INTEGER | YES | NULL | 開放性スコア（0-100） |
| conscientiousness | INTEGER | YES | NULL | 誠実性スコア（0-100） |
| extraversion | INTEGER | YES | NULL | 外向性スコア（0-100） |
| agreeableness | INTEGER | YES | NULL | 協調性スコア（0-100） |
| neuroticism | INTEGER | YES | NULL | 神経症傾向スコア（0-100） |
| summary | TEXT | YES | NULL | AI生成の性格サマリーテキスト |
| communication_style | JSONB | YES | NULL | コミュニケーションスタイル指示JSON |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own personality results"
  ON personality_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personality results"
  ON personality_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 3. chat_messages

チャット履歴。FreeユーザーはEdge Function経由、ProユーザーはOpenClaw経由。

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  source TEXT CHECK (source IN ('edge_function', 'openclaw')) DEFAULT 'edge_function',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_user_id_created ON chat_messages(user_id, created_at DESC);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー |
| role | TEXT | NO | - | メッセージの送信者（user/assistant/system） |
| content | TEXT | NO | - | メッセージ本文 |
| source | TEXT | YES | 'edge_function' | メッセージの生成元 |
| metadata | JSONB | YES | '{}' | 追加メタデータ（トークン数、モデル名等） |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 4. journal_entries

日記エントリ。Proユーザーのみ利用可能。

```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  ai_reflection TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_journal_entries_user_id_created ON journal_entries(user_id, created_at DESC);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー |
| title | TEXT | YES | NULL | タイトル |
| content | TEXT | NO | - | 日記本文 |
| mood | TEXT | YES | NULL | その時の気分 |
| ai_reflection | TEXT | YES | NULL | AIによる振り返りコメント |
| tags | TEXT[] | YES | '{}' | タグ配列 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 5. mood_records

気分記録。日次の気分トラッキング。

```sql
CREATE TABLE mood_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'sad', 'angry', 'tired')) NOT NULL,
  note TEXT,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_mood_records_user_date ON mood_records(user_id, recorded_at);
ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー |
| mood | TEXT | NO | - | 気分ラベル（great/good/neutral/sad/angry/tired） |
| note | TEXT | YES | NULL | メモ |
| recorded_at | DATE | NO | CURRENT_DATE | 記録日 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**制約:**
- `mood` は 6種類のいずれか（CHECK制約）
- ユーザーごとに1日1レコード（UNIQUE INDEX on user_id + recorded_at）

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own mood records"
  ON mood_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood records"
  ON mood_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood records"
  ON mood_records FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### 6. subscriptions

サブスクリプション状態。ユーザーごとに1レコード。

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('free', 'trialing', 'active', 'grace_period', 'expired')) DEFAULT 'free',
  plan TEXT CHECK (plan IN ('free', 'monthly', 'annual', 'annual_intro')) DEFAULT 'free',
  revenuecat_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー（UNIQUE） |
| status | TEXT | NO | 'free' | サブスク状態 |
| plan | TEXT | NO | 'free' | 現在のプラン種別 |
| revenuecat_customer_id | TEXT | YES | NULL | RevenueCatの顧客ID |
| current_period_start | TIMESTAMPTZ | YES | NULL | 現在の課金期間開始日 |
| current_period_end | TIMESTAMPTZ | YES | NULL | 現在の課金期間終了日 |
| trial_end | TIMESTAMPTZ | YES | NULL | トライアル終了日 |
| cancelled_at | TIMESTAMPTZ | YES | NULL | 解約日時 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**RLSポリシー:**
```sql
-- ユーザーは自分のサブスク状態のみ参照可能
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 更新はEdge Function（service_role）経由のみ
-- ユーザー自身はUPDATE不可
```

---

### 7. credits

チャットクレジット残高。Freeユーザーの1日3回制限管理。

```sql
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  daily_remaining INTEGER DEFAULT 3,
  last_reset_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー（UNIQUE） |
| daily_remaining | INTEGER | NO | 3 | 当日残りクレジット数 |
| last_reset_at | DATE | NO | CURRENT_DATE | 最終リセット日 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**日次リセットロジック（Edge Function内で実行）:**
```sql
-- チャット送信前にリセット判定
IF credits.last_reset_at < CURRENT_DATE THEN
  UPDATE credits SET daily_remaining = 3, last_reset_at = CURRENT_DATE WHERE user_id = ?;
END IF;
```

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own credits"
  ON credits FOR SELECT
  USING (auth.uid() = user_id);

-- 更新はEdge Function（service_role）経由のみ
```

---

### 8. credit_transactions

クレジット取引履歴。消費・リセットの記録。

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('consume', 'reset', 'bonus')) NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー |
| type | TEXT | NO | - | 取引種別（consume/reset/bonus） |
| amount | INTEGER | NO | - | 増減数（consumeは負値） |
| balance_after | INTEGER | NO | - | 取引後の残高 |
| description | TEXT | YES | NULL | 取引の説明 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- insertはEdge Function（service_role）経由のみ
```

---

### 9. openclaw_instances（NEW）

OpenClawインスタンス管理。ユーザーごとに最大1つのDropletを管理する。

```sql
CREATE TABLE openclaw_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  droplet_id BIGINT,
  ip_address INET,
  gateway_token TEXT,
  status TEXT CHECK (status IN ('provisioning', 'running', 'stopped', 'error', 'destroying')) DEFAULT 'provisioning',
  region TEXT DEFAULT 'sgp1',
  droplet_size TEXT DEFAULT 's-1vcpu-1gb',
  soul_md TEXT,
  last_health_check TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_openclaw_instances_user_id ON openclaw_instances(user_id);
CREATE INDEX idx_openclaw_instances_status ON openclaw_instances(status);
ALTER TABLE openclaw_instances ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | YES | - | profiles.id への外部キー（UNIQUE） |
| droplet_id | BIGINT | YES | NULL | DigitalOceanのDroplet ID |
| ip_address | INET | YES | NULL | DropletのIPアドレス |
| gateway_token | TEXT | YES | NULL | OpenClaw Gateway接続用トークン |
| status | TEXT | YES | 'provisioning' | インスタンス状態 |
| region | TEXT | YES | 'sgp1' | DigitalOceanリージョン |
| droplet_size | TEXT | YES | 's-1vcpu-1gb' | Dropletサイズ |
| soul_md | TEXT | YES | NULL | ユーザーのSOUL.md内容 |
| last_health_check | TIMESTAMPTZ | YES | NULL | 最終ヘルスチェック日時 |
| error_message | TEXT | YES | NULL | エラーメッセージ（status='error'時） |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**status の遷移:**
```
provisioning → running（セットアップ完了）
provisioning → error（セットアップ失敗）
running → destroying（解約/停止リクエスト）
running → error（ヘルスチェック失敗）
destroying → stopped（Droplet削除完了）
error → provisioning（リトライ）
stopped → provisioning（再課金）
```

**RLSポリシー:**
```sql
-- ユーザーは自分のインスタンス情報のみ参照可能（gateway_tokenは除外）
CREATE POLICY "Users can view own openclaw instance"
  ON openclaw_instances FOR SELECT
  USING (auth.uid() = user_id);

-- insert/update/deleteはEdge Function（service_role）経由のみ
-- gateway_tokenはservice_roleのみアクセス可能にするため、
-- SELECT時にカラムレベルで制限する場合はビューを使用する
```

**セキュリティ考慮:**
- `gateway_token` は機密情報のため、クライアントから直接参照させない
- アプリからのWebSocket接続時は、Edge Functionを経由してトークンを取得する
- または、gateway_tokenを除外したビューを作成して公開する

```sql
-- クライアント向けビュー（gateway_tokenを除外）
CREATE VIEW openclaw_instances_public AS
  SELECT id, user_id, status, region, last_health_check, error_message, created_at, updated_at
  FROM openclaw_instances;
```

---

## トリガー

### profiles作成時にsubscriptions/creditsを自動作成

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- profilesにレコード作成
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);

  -- subscriptionsにデフォルトレコード作成
  INSERT INTO subscriptions (user_id, status, plan)
  VALUES (NEW.id, 'free', 'free');

  -- creditsにデフォルトレコード作成
  INSERT INTO credits (user_id, daily_remaining)
  VALUES (NEW.id, 3);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersへのINSERT時にトリガー発火
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### updated_at 自動更新トリガー

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに適用
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON openclaw_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 受け入れ条件

### AC-1: RLSで自分のデータのみアクセス可能

**Given** ユーザーAとユーザーBがそれぞれ認証済みである
**When** ユーザーAが `profiles`、`chat_messages`、`journal_entries`、`subscriptions`、`credits`、`openclaw_instances` テーブルをSELECTする
**Then**
- ユーザーAのデータのみが返される
- ユーザーBのデータは一切返されない

**Given** ユーザーAが認証済みである
**When** ユーザーAがユーザーBの `user_id` を指定してINSERT/UPDATE/DELETEを試みる
**Then**
- RLSポリシーにより拒否される
- エラーが返される

**テスト観点:**
- 全テーブルでRLSが有効であることを確認（`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`）
- Supabase Clientの `anon` キーで他ユーザーのデータにアクセスできないことを確認
- `service_role` キーではRLSをバイパスしてアクセスできることを確認（Edge Function用）

---

### AC-2: profilesへのinsert時にsubscriptions/creditsが自動作成される

**Given** `handle_new_user` トリガーが `auth.users` に設定されている
**When** 新しいユーザーがSupabase Authでサインアップする
**Then**
- `profiles` テーブルに `id = auth.uid()` のレコードが自動作成される
- `subscriptions` テーブルに `user_id = auth.uid()`、`status = 'free'`、`plan = 'free'` のレコードが自動作成される
- `credits` テーブルに `user_id = auth.uid()`、`daily_remaining = 3` のレコードが自動作成される

**エッジケース:**
- トリガー内でいずれかのINSERTが失敗した場合、全体がロールバックされること
- 同じユーザーIDで2回トリガーが発火した場合（UNIQUE制約エラーで適切にハンドリング）

**テスト観点:**
- サインアップ後に3テーブルすべてにレコードが存在することを確認
- 作成されたレコードのデフォルト値が正しいことを確認

---

### AC-3: openclaw_instancesはユーザーごとに最大1レコード

**Given** `openclaw_instances` テーブルの `user_id` カラムにUNIQUE制約がある
**When** 同一ユーザーに対して2つ目のOpenClawインスタンスレコードをINSERTしようとする
**Then**
- UNIQUE制約違反エラーが発生する
- 既存レコードは影響を受けない

**Given** プロビジョニングEdge Functionが実行される
**When** 同一ユーザーの既存レコードが存在する場合
**Then**
- INSERT ... ON CONFLICT (user_id) DO UPDATE（UPSERT）で処理される
- 既存レコードのstatusが更新される

**テスト観点:**
- 直接INSERTで重複エラーが発生することを確認
- UPSERTで正しく更新されることを確認
- 1ユーザー1インスタンスの整合性が保たれることを確認

---

### AC-4: マイグレーションが冪等に実行できる

**Given** データベースマイグレーションファイルが用意されている
**When** マイグレーションを2回連続で実行する
**Then**
- 2回目の実行でエラーが発生しない
- テーブル、インデックス、トリガーが正しい状態で維持される

**実装方針:**
- `CREATE TABLE IF NOT EXISTS` を使用
- `CREATE INDEX IF NOT EXISTS` を使用
- `CREATE OR REPLACE FUNCTION` を使用
- `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...` パターンを使用

**テスト観点:**
- 空のDBに対してマイグレーションを実行し、全テーブルが作成されることを確認
- 既にテーブルが存在する状態で再実行し、エラーが発生しないことを確認
- マイグレーション後にアプリが正常に動作することを確認

---

## ER図（テキスト表現）

```
auth.users
    |
    | 1:1 (トリガーで自動作成)
    v
profiles
    |
    |--- 1:1 --- subscriptions
    |--- 1:1 --- credits
    |--- 1:1 --- openclaw_instances
    |--- 1:N --- personality_results
    |--- 1:N --- chat_messages
    |--- 1:N --- journal_entries
    |--- 1:N --- mood_records
    |--- 1:N --- credit_transactions
```
