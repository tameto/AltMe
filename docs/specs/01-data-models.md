# 01 -- データモデル仕様

## ステータス: APPROVED
- 作成日: 2026-02-14
- 最終更新: 2026-02-15
- 承認状態: 承認済み
- 担当: Agent A (Foundation)

---

## 1. データベース概要

Supabase (PostgreSQL) 上に構築するAltMeアプリのデータベース。
全テーブルでRow Level Security (RLS) を有効化し、ユーザーは自分のデータのみアクセス可能。

---

## 2. テーブル一覧

| # | テーブル名 | 種別 | 概要 | RLS | 主要な依存 |
|---|-----------|------|------|-----|-----------|
| 1 | profiles | TABLE | ユーザープロフィール | Yes | auth.users |
| 2 | personality_results | TABLE | 性格診断結果 | Yes | profiles |
| 3 | chat_messages | TABLE | チャット履歴 | Yes | profiles |
| 4 | journal_entries | TABLE | 日記エントリ | Yes | profiles |
| 5 | mood_records | TABLE | 気分記録 | Yes | profiles |
| 6 | subscriptions | TABLE | サブスクリプション状態 | Yes | profiles |
| 7 | credits | TABLE | クレジット残高 | Yes | profiles |
| 8 | credit_transactions | TABLE | クレジット取引履歴 | Yes | profiles |
| 9 | openclaw_instances | TABLE | OpenClawインスタンス管理 | Yes | profiles |
| 10 | chat_topics | TABLE | チャットトピック管理 | Yes | profiles |
| 11 | twin_profiles_public | VIEW | コミュニティ用公開プロフィール | -- | profiles, personality_results, subscriptions |
| 12 | twin_conversations | TABLE | AIツイン間の会話 | Yes | profiles |
| 13 | webhook_events | TABLE | Webhook冪等性チェック | No | -- |

---

## 3. ER図

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
    |--- 1:N --- chat_topics
    |--- 1:N --- journal_entries
    |--- 1:N --- mood_records
    |--- 1:N --- credit_transactions
    |--- 1:N --- twin_conversations (as initiator)
    |--- 1:N --- twin_conversations (as partner)

personality_results + subscriptions
    |
    | VIEW: twin_profiles_public
    v

webhook_events（独立テーブル、RLSなし）
```

---

## 4. テーブル定義

### 4.1 profiles

ユーザープロフィール。Supabase Authの `auth.users` と1:1で紐付く。

**DDL:**
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
  avatar_icon TEXT DEFAULT 'default',
  speech_tone TEXT DEFAULT 'friendly',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | -- | PK。auth.usersのIDと同一 |
| display_name | TEXT | YES | NULL | 表示名 |
| avatar_url | TEXT | YES | NULL | アバター画像URL |
| email | TEXT | YES | NULL | メールアドレス（auth.usersから同期） |
| age_range | TEXT | YES | NULL | 年齢層（18-24 / 25-34 / 35-44 / 45+） |
| locale | TEXT | YES | 'ja' | ロケール |
| timezone | TEXT | YES | 'Asia/Tokyo' | タイムゾーン |
| onboarding_completed | BOOLEAN | NO | false | オンボーディング完了フラグ |
| twin_name | TEXT | YES | NULL | AIツインの名前 |
| avatar_icon | TEXT | YES | 'default' | AIアバターアイコン種別（geometric / cosmic / organic / tech / zen） |
| speech_tone | TEXT | YES | 'friendly' | 口調パターン（polite / friendly / intellectual / mentor / tsundere） |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

**TypeScript型対応:** `src/shared/types/user.ts` -> `UserProfile`

---

### 4.2 personality_results

オンボーディング時の性格診断結果。ユーザーごとに複数レコード（やり直し対応）。

**DDL:**
```sql
CREATE TABLE personality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  raw_answers JSONB NOT NULL,
  personality_traits JSONB NOT NULL,
  summary TEXT,
  communication_style JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_personality_results_user_id ON personality_results(user_id);
ALTER TABLE personality_results ENABLE ROW LEVEL SECURITY;
```

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | -- | FK -> profiles.id |
| raw_answers | JSONB | NO | -- | 質問と回答のペア `[{questionId, answer}]` |
| personality_traits | JSONB | NO | -- | Big Fiveスコア `{openness: 0-100, conscientiousness: 0-100, extraversion: 0-100, agreeableness: 0-100, neuroticism: 0-100}` |
| summary | TEXT | YES | NULL | AI生成の性格サマリーテキスト |
| communication_style | JSONB | YES | NULL | コミュニケーションスタイル `{tone, formality, emoji_usage, response_length}` |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own personality results"
  ON personality_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personality results"
  ON personality_results FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**最新レコードの取得:** `ORDER BY created_at DESC LIMIT 1` で統一。

**TypeScript型対応:** `src/shared/types/user.ts` -> `PersonalityResult`, `PersonalityTraits`, `CommunicationStyle`

---

### 4.3 chat_messages

チャット履歴。FreeユーザーはEdge Function経由、ProユーザーはOpenClaw経由。

**DDL:**
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  source TEXT CHECK (source IN ('edge_function', 'openclaw')) DEFAULT 'edge_function',
  topic_id TEXT DEFAULT 'daily',
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_user_id_created ON chat_messages(user_id, created_at DESC);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
```

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | -- | FK -> profiles.id |
| session_id | TEXT | YES | NULL | チャットセッションID |
| role | TEXT | NO | -- | メッセージ送信者（user / assistant / system） |
| content | TEXT | NO | -- | メッセージ本文 |
| source | TEXT | YES | 'edge_function' | メッセージ生成元（edge_function / openclaw） |
| topic_id | TEXT | YES | 'daily' | トピックID（daily / work / reflection / consultation） |
| metadata | JSONB | YES | '{}' | 追加メタデータ（日記フラグ等） |
| tokens_used | INTEGER | YES | NULL | 消費トークン数 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**metadata JSONB構造:**
```json
{
  "isJournalPrompt": true,
  "isJournalEntry": false,
  "isJournalReflection": false,
  "journalEntryId": "uuid",
  "toolExecutionResult": null
}
```

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**TypeScript型対応:** `src/shared/types/chat.ts` -> `ChatMessage`, `ChatMessageSource`, `ChatMessageMetadata`

---

### 4.4 journal_entries

日記エントリ。Proユーザーのみ利用可能。チャットとの統合あり。

**DDL:**
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  ai_reflection TEXT,
  tags JSONB DEFAULT '[]',
  chat_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_journal_entries_user_id_created ON journal_entries(user_id, created_at DESC);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
```

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | -- | FK -> profiles.id |
| title | TEXT | YES | NULL | タイトル |
| content | TEXT | NO | -- | 日記本文（最大3,000文字） |
| ai_reflection | TEXT | YES | NULL | AIによる振り返りコメント |
| tags | JSONB | YES | '[]' | タグ配列 |
| chat_session_id | TEXT | YES | NULL | 関連チャットセッションID |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE USING (auth.uid() = user_id);
```

**TypeScript型対応:** `src/shared/types/journal.ts` -> `JournalEntry`

---

### 4.5 mood_records

気分記録。日次の気分トラッキング。気分データのSSoT（Single Source of Truth）。

**DDL:**
```sql
CREATE TABLE mood_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'terrible')) NOT NULL,
  note TEXT,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_mood_records_user_date ON mood_records(user_id, recorded_at);
ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;
```

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | -- | FK -> profiles.id |
| mood | TEXT | NO | -- | 気分ラベル（great / good / neutral / bad / terrible） |
| note | TEXT | YES | NULL | メモ |
| recorded_at | DATE | NO | CURRENT_DATE | 記録日 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**制約:**
- `mood` は5種類のいずれか（CHECK制約）
- ユーザーごとに1日1レコード（UNIQUE INDEX on user_id + recorded_at）
- 同日の2回目記録はUPSERTで上書き

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own mood records"
  ON mood_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood records"
  ON mood_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood records"
  ON mood_records FOR UPDATE USING (auth.uid() = user_id);
```

**TypeScript型対応:** `src/shared/types/journal.ts` -> `MoodRecord`, `Mood`

---

### 4.6 subscriptions

サブスクリプション状態。ユーザーごとに1レコード。

**DDL:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('free', 'trial', 'active', 'grace_period', 'expired', 'cancelled')) DEFAULT 'free',
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

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | -- | FK -> profiles.id（UNIQUE） |
| status | TEXT | NO | 'free' | サブスク状態（free / trial / active / grace_period / expired / cancelled） |
| plan | TEXT | NO | 'free' | プラン種別（free / monthly / annual / annual_intro） |
| revenuecat_customer_id | TEXT | YES | NULL | RevenueCatの顧客ID |
| current_period_start | TIMESTAMPTZ | YES | NULL | 課金期間開始日 |
| current_period_end | TIMESTAMPTZ | YES | NULL | 課金期間終了日 |
| trial_end | TIMESTAMPTZ | YES | NULL | トライアル終了日 |
| cancelled_at | TIMESTAMPTZ | YES | NULL | 解約日時 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**RLSポリシー:**
```sql
-- ユーザーは自分のサブスク状態のみ参照可能
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 更新はEdge Function（service_role）経由のみ
-- ユーザー自身はUPDATE不可
```

**TypeScript型対応:** `src/shared/types/subscription.ts` -> `Subscription`, `SubscriptionStatus`, `PlanType`

---

### 4.7 credits

チャットクレジット残高。Freeユーザーの1日3回制限管理。

**DDL:**
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

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | -- | FK -> profiles.id（UNIQUE） |
| daily_remaining | INTEGER | NO | 3 | 当日残りクレジット数 |
| last_reset_at | DATE | NO | CURRENT_DATE | 最終リセット日 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**日次リセットロジック（Edge Function内で実行）:**
```sql
IF credits.last_reset_at < CURRENT_DATE THEN
  UPDATE credits SET daily_remaining = 3, last_reset_at = CURRENT_DATE WHERE user_id = ?;
END IF;
```

**並行制御:** チャット送信時のクレジット消費は `SELECT ... FOR UPDATE` でロックし、レースコンディションを防止。

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own credits"
  ON credits FOR SELECT USING (auth.uid() = user_id);

-- 更新はEdge Function（service_role）経由のみ
```

**TypeScript型対応:** `src/shared/types/subscription.ts` -> `CreditBalance`

---

### 4.8 credit_transactions

クレジット取引履歴。消費・リセットの記録。

**DDL:**
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

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | -- | FK -> profiles.id |
| type | TEXT | NO | -- | 取引種別（consume / reset / bonus） |
| amount | INTEGER | NO | -- | 増減数（consumeは負値） |
| balance_after | INTEGER | NO | -- | 取引後の残高 |
| description | TEXT | YES | NULL | 取引の説明 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- insertはEdge Function（service_role）経由のみ
```

**TypeScript型対応:** `src/shared/types/subscription.ts` -> `CreditTransaction`

---

### 4.9 openclaw_instances

OpenClawインスタンス管理。Proユーザーごとに最大1つのDropletを管理。

**DDL:**
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

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | YES | -- | FK -> profiles.id（UNIQUE） |
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

**status遷移図:**
```
provisioning → running（セットアップ完了）
provisioning → error（セットアップ失敗）
running → destroying（解約/停止リクエスト）
running → error（ヘルスチェック失敗）
destroying → stopped（Droplet削除完了）
error → provisioning（リトライ）
stopped → provisioning（再課金）
```

**排他制御:** provision/destroy が同時実行されるレースコンディションを防ぐため、status が `provisioning` または `destroying` の場合は他の操作を拒否。Edge Function側で `SELECT ... FOR UPDATE` を使用。

**セキュリティ:**
- `gateway_token` は機密情報。クライアントから直接参照させない
- WebSocket接続時はEdge Functionを経由してトークンを取得
- クライアント向けビュー（gateway_tokenを除外）:

```sql
CREATE VIEW openclaw_instances_public AS
  SELECT id, user_id, status, region, last_health_check, error_message, created_at, updated_at
  FROM openclaw_instances;
```

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own openclaw instance"
  ON openclaw_instances FOR SELECT USING (auth.uid() = user_id);

-- insert/update/deleteはEdge Function（service_role）経由のみ
```

**TypeScript型対応:** `src/shared/types/openclaw.ts` -> `OpenClawInstance`, `OpenClawStatus`

---

### 4.10 chat_topics

チャットのトピック（話題）管理。

**DDL:**
```sql
CREATE TABLE chat_topics (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_topics_user_id ON chat_topics(user_id);
ALTER TABLE chat_topics ENABLE ROW LEVEL SECURITY;
```

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | TEXT | NO | -- | PK。トピックID（daily / work / reflection / consultation等） |
| user_id | UUID | NO | -- | FK -> profiles.id |
| name | TEXT | NO | -- | トピック名（「日常」「仕事」「振り返り」「相談」等） |
| icon | TEXT | YES | NULL | トピックアイコン |
| sort_order | INTEGER | YES | 0 | ソート順序 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**デフォルトトピック（ユーザー作成時に自動作成）:**

| id | name | icon |
|----|------|------|
| daily | 日常 | sun |
| work | 仕事 | briefcase |
| reflection | 振り返り | book |
| consultation | 相談 | speech-bubble |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own chat topics"
  ON chat_topics FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat topics"
  ON chat_topics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat topics"
  ON chat_topics FOR UPDATE USING (auth.uid() = user_id);
```

---

### 4.11 twin_profiles_public (VIEW)

コミュニティ用の公開プロフィール。他のProユーザーのツインと会話するための情報を提供。
profiles、personality_results、subscriptionsテーブルのデータを結合した読み取り専用ビュー。

**DDL:**
```sql
CREATE OR REPLACE VIEW twin_profiles_public AS
SELECT
  p.id AS user_id,
  p.twin_name,
  pr.summary AS personality_summary,
  pr.personality_traits AS big_five_scores,
  p.created_at
FROM profiles p
INNER JOIN personality_results pr ON p.id = pr.user_id
WHERE
  p.onboarding_completed = true
  AND p.twin_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.id
    AND s.status IN ('trial', 'active', 'grace_period')
  );
```

**公開カラム:**

| カラム | 型 | 説明 |
|--------|-----|------|
| user_id | UUID | ユーザーID（会話生成時に必要） |
| twin_name | TEXT | ツイン名 |
| personality_summary | TEXT | 性格サマリー |
| big_five_scores | JSONB | Big FiveスコアのJSONB（相性計算用） |
| created_at | TIMESTAMPTZ | 作成日時 |

**非公開データ（ビューに含まれない）:**
- email, display_name, avatar_url（個人情報）
- soul_md（SOUL.md全文）
- raw_answers（性格診断の生回答）
- openclaw_instances の詳細情報

**RLS:** ビュー自体がフィルタ済みのため追加のRLSは不要。ベーステーブルのRLSで制御。

**TypeScript型対応:** `src/shared/types/community.ts` -> `TwinProfile`

---

### 4.12 twin_conversations

AIツイン間の会話記録。コミュニティ機能用。

**DDL:**
```sql
CREATE TABLE twin_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('generating', 'completed', 'error')) DEFAULT 'generating',
  messages JSONB DEFAULT '[]',
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_twin_conversations_initiator ON twin_conversations(initiator_user_id);
CREATE INDEX idx_twin_conversations_partner ON twin_conversations(partner_user_id);
CREATE INDEX idx_twin_conversations_status ON twin_conversations(status);
ALTER TABLE twin_conversations ENABLE ROW LEVEL SECURITY;
```

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| initiator_user_id | UUID | NO | -- | FK -> profiles.id。会話を開始したユーザー |
| partner_user_id | UUID | NO | -- | FK -> profiles.id。相手ユーザー |
| status | TEXT | NO | 'generating' | 会話生成状態（generating / completed / error） |
| messages | JSONB | NO | '[]' | メッセージ配列 |
| compatibility_score | INTEGER | YES | NULL | 相性スコア（0-100） |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**messages JSONB構造:**
```json
[
  {"role": "twin_a", "content": "...", "twinName": "ツインA"},
  {"role": "twin_b", "content": "...", "twinName": "ツインB"},
  ...
]
```

**status遷移:**
```
generating → completed（会話生成完了）
generating → error（生成失敗）
```

**RLSポリシー:**
```sql
-- 会話を開始したユーザー（initiator）のみ閲覧可能
CREATE POLICY "Users can view own initiated conversations"
  ON twin_conversations FOR SELECT
  USING (auth.uid() = initiator_user_id);

-- insertはEdge Function（service_role）経由のみ
```

**プライバシー:** partner_user_id のユーザーには、自分のツインが会話に使われたことは通知されない。

**TypeScript型対応:** `src/shared/types/community.ts` -> `TwinConversation`, `TwinConversationMessage`, `TwinConversationStatus`

---

### 4.13 webhook_events

RevenueCat Webhookの冪等性チェック用。RLSなし。

**DDL:**
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
```

**カラム定義:**

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| event_id | TEXT | NO | -- | RevenueCatのイベントID（UNIQUE） |
| event_type | TEXT | NO | -- | イベントタイプ（INITIAL_PURCHASE等） |
| payload | JSONB | YES | NULL | Webhookペイロード全体 |
| processed_at | TIMESTAMPTZ | NO | now() | 処理日時 |

**RLS:** なし。Edge Function（service_role）のみがアクセス。

---

## 5. トリガー

### 5.1 新規ユーザー作成トリガー

`auth.users` へのINSERT時に profiles、subscriptions、credits を自動作成。

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO subscriptions (user_id, status, plan)
  VALUES (NEW.id, 'free', 'free');

  INSERT INTO credits (user_id, daily_remaining)
  VALUES (NEW.id, 3);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 5.2 updated_at 自動更新トリガー

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 適用テーブル:
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

## 6. インデックス一覧

| テーブル | インデックス名 | カラム | 種別 |
|---------|-------------|--------|------|
| personality_results | idx_personality_results_user_id | user_id | INDEX |
| chat_messages | idx_chat_messages_user_id_created | user_id, created_at DESC | INDEX |
| journal_entries | idx_journal_entries_user_id_created | user_id, created_at DESC | INDEX |
| mood_records | idx_mood_records_user_date | user_id, recorded_at | UNIQUE INDEX |
| subscriptions | idx_subscriptions_user_id | user_id | INDEX |
| subscriptions | idx_subscriptions_status | status | INDEX |
| credit_transactions | idx_credit_transactions_user_id | user_id | INDEX |
| openclaw_instances | idx_openclaw_instances_user_id | user_id | INDEX |
| openclaw_instances | idx_openclaw_instances_status | status | INDEX |
| chat_topics | idx_chat_topics_user_id | user_id | INDEX |
| twin_conversations | idx_twin_conversations_initiator | initiator_user_id | INDEX |
| twin_conversations | idx_twin_conversations_partner | partner_user_id | INDEX |
| twin_conversations | idx_twin_conversations_status | status | INDEX |
| webhook_events | idx_webhook_events_event_id | event_id | INDEX |

---

## 7. TypeScript型定義との対応

### 7.1 src/shared/types/user.ts

```typescript
export type AgeRange = '18-24' | '25-34' | '35-44' | '45+';

export type PersonalityTraits = {
  openness: number;         // 0-100
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

export type CommunicationStyle = {
  tone: string;
  formality: string;
  emoji_usage: string;
  response_length: string;
};

export type PersonalityResult = {
  id: string;
  userId: string;
  rawAnswers: Array<{ questionId: string; answer: string }>;
  personalityTraits: PersonalityTraits;
  summary: string;
  communicationStyle: CommunicationStyle | null;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  ageRange: AgeRange | null;
  locale: string;
  timezone: string;
  onboardingCompleted: boolean;
  twinName: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### 7.2 src/shared/types/subscription.ts

```typescript
export type SubscriptionStatus =
  | 'free'
  | 'trial'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'grace_period';

export type PlanType = 'free' | 'monthly' | 'annual' | 'annual_intro';

export type Subscription = {
  id: string;
  userId: string;
  revenuecatCustomerId: string | null;
  status: SubscriptionStatus;
  plan: PlanType;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreditBalance = {
  id: string;
  userId: string;
  dailyRemaining: number;
  lastResetAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreditTransaction = {
  id: string;
  userId: string;
  type: 'consume' | 'reset' | 'bonus';
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

export type EntitlementInfo = {
  isPro: boolean;
  isTrialing: boolean;
  status: SubscriptionStatus;
  planType: PlanType;
  expiresAt: string | null;
  trialDaysRemaining: number | null;
  dailyCreditsRemaining: number;
};
```

### 7.3 src/shared/types/chat.ts

```typescript
export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMessageSource = 'edge_function' | 'openclaw';

export type ChatMessageMetadata = {
  isJournalPrompt?: boolean;
  isJournalEntry?: boolean;
  isJournalReflection?: boolean;
  journalEntryId?: string;
  toolExecutionResult?: unknown;
};

export type ChatMessage = {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  source: ChatMessageSource;
  sessionId: string | null;
  metadata: ChatMessageMetadata | null;
  tokensUsed: number | null;
  createdAt: string;
};

export type ChatStreamChunk = {
  type: 'text_delta' | 'text_done' | 'usage';
  delta?: string;
  content?: string;
  remaining?: number;
};

export const FREE_DAILY_CHAT_LIMIT = 3;
```

### 7.4 src/shared/types/journal.ts

```typescript
export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export type JournalEntry = {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  aiReflection: string | null;
  tags: string[];
  chatSessionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MoodRecord = {
  id: string;
  userId: string;
  mood: Mood;
  note: string | null;
  recordedAt: string;
  createdAt: string;
};
```

### 7.5 src/shared/types/openclaw.ts

```typescript
export type OpenClawStatus = 'provisioning' | 'running' | 'stopped' | 'error' | 'destroying';

export type OpenClawInstance = {
  id: string;
  userId: string;
  dropletId: number | null;
  ipAddress: string | null;
  status: OpenClawStatus;
  region: string;
  dropletSize: string;
  soulMd: string | null;
  lastHealthCheck: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
export type ConnectionMode = 'websocket' | 'edge_function' | 'disconnected';
```

### 7.6 src/shared/types/community.ts

```typescript
export type TwinProfile = {
  userId: string;
  twinName: string;
  personalitySummary: string;
  bigFiveScores: PersonalityTraits;
  createdAt: string;
};

export type TwinConversationMessage = {
  role: 'twin_a' | 'twin_b';
  content: string;
  twinName: string;
};

export type TwinConversationStatus = 'generating' | 'completed' | 'error';

export type TwinConversation = {
  id: string;
  initiatorUserId: string;
  partnerUserId: string;
  status: TwinConversationStatus;
  messages: TwinConversationMessage[];
  compatibilityScore: number | null;
  createdAt: string;
};
```

---

## 8. DB名 <-> TypeScript名 マッピング

| DBカラム（snake_case） | TypeScriptプロパティ（camelCase） | 型変換 |
|----------------------|-------------------------------|--------|
| user_id | userId | UUID -> string |
| display_name | displayName | TEXT -> string |
| avatar_url | avatarUrl | TEXT -> string |
| age_range | ageRange | TEXT -> AgeRange |
| onboarding_completed | onboardingCompleted | BOOLEAN -> boolean |
| twin_name | twinName | TEXT -> string |
| avatar_icon | avatarIcon | TEXT -> string |
| speech_tone | speechTone | TEXT -> string |
| raw_answers | rawAnswers | JSONB -> Array |
| personality_traits | personalityTraits | JSONB -> PersonalityTraits |
| communication_style | communicationStyle | JSONB -> CommunicationStyle |
| session_id | sessionId | TEXT -> string |
| topic_id | topicId | TEXT -> string |
| tokens_used | tokensUsed | INTEGER -> number |
| ai_reflection | aiReflection | TEXT -> string |
| chat_session_id | chatSessionId | TEXT -> string |
| recorded_at | recordedAt | DATE -> string |
| revenuecat_customer_id | revenuecatCustomerId | TEXT -> string |
| current_period_start | currentPeriodStart | TIMESTAMPTZ -> string |
| current_period_end | currentPeriodEnd | TIMESTAMPTZ -> string |
| trial_end | trialEnd | TIMESTAMPTZ -> string |
| cancelled_at | cancelledAt | TIMESTAMPTZ -> string |
| daily_remaining | dailyRemaining | INTEGER -> number |
| last_reset_at | lastResetAt | DATE -> string |
| balance_after | balanceAfter | INTEGER -> number |
| droplet_id | dropletId | BIGINT -> number |
| ip_address | ipAddress | INET -> string |
| gateway_token | gatewayToken | TEXT -> string |
| droplet_size | dropletSize | TEXT -> string |
| soul_md | soulMd | TEXT -> string |
| last_health_check | lastHealthCheck | TIMESTAMPTZ -> string |
| error_message | errorMessage | TEXT -> string |
| sort_order | sortOrder | INTEGER -> number |
| initiator_user_id | initiatorUserId | UUID -> string |
| partner_user_id | partnerUserId | UUID -> string |
| compatibility_score | compatibilityScore | INTEGER -> number |
| event_id | eventId | TEXT -> string |
| event_type | eventType | TEXT -> string |
| processed_at | processedAt | TIMESTAMPTZ -> string |
| created_at | createdAt | TIMESTAMPTZ -> string |
| updated_at | updatedAt | TIMESTAMPTZ -> string |

---

## 9. 検証条件

- [ ] 全テーブルのRLSポリシーが正しく動作すること
- [ ] 他ユーザーのデータにアクセスできないこと
- [ ] TypeScript型定義とDBスキーマの整合性があること
- [ ] マイグレーションが冪等に実行できること（2回連続でエラーなし）
- [ ] subscriptions テーブルがWebhookから正しく更新されること
- [ ] handle_new_user() トリガーで3テーブル（profiles, subscriptions, credits）が自動作成されること
- [ ] openclaw_instancesのUNIQUE制約が正しく動作すること（1ユーザー1インスタンス）
- [ ] service_roleキーでRLSバイパスが可能であること
- [ ] gateway_tokenがクライアントに露出しないこと
- [ ] twin_profiles_publicビューにProユーザーのみ表示されること
- [ ] twin_conversationsのinitiatorのみが会話を閲覧できること
