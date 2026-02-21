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
| 10 | **chat_topics** | チャットトピック管理（NEW） | profiles |
| 11 | **twin_profiles_public** | コミュニティ用公開プロフィール（VIEW） | profiles, personality_results, subscriptions |
| 12 | **twin_conversations** | AIツイン間の会話 | profiles |
| 13 | **webhook_events** | RevenueCat Webhook冪等性チェック（NEW） | — |
| 14 | **chat_attachments** | チャット添付ファイル（NEW） | chat_messages |
| 15 | **push_tokens** | プッシュ通知トークン（NEW） | profiles |
| 16 | **notification_settings** | 通知設定（NEW） | profiles |
| 17 | **communities** | コミュニティ（NEW） | profiles |
| 18 | **community_members** | コミュニティメンバー（NEW） | communities, profiles |
| 19 | **community_messages** | コミュニティメッセージ（NEW） | communities, profiles |
| 20 | **token_usage** | トークン使用量管理（NEW） | profiles |

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
  twin_name TEXT DEFAULT 'My Agent',
  avatar_icon TEXT DEFAULT 'default',
  speech_tone TEXT DEFAULT 'friendly',
  mbti_type TEXT,
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
| twin_name | TEXT | YES | 'My Agent' | AIツインの名前 |
| avatar_icon | TEXT | YES | 'default' | AIアバターアイコン（30種類: robot, cat, bunny, star, owl, fox, penguin, bear, dragon, unicorn, panda, dolphin, phoenix, deer, koala, wolf, hamster, butterfly, jellyfish, mushroom, crystal, cloud, moon, octopus, flower, ghost, slime, sakura, flame, alien）。レガシー値（geometric/cosmic/organic/tech/zen）はフォールバックマップで対応 |
| speech_tone | TEXT | YES | 'friendly' | 口調パターン（polite/friendly/intellectual/mentor/tsundere） |
| mbti_type | TEXT | YES | NULL | MBTI 16タイプ（NULL = 未設定） |
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
  personality_traits JSONB NOT NULL,
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
| personality_traits | JSONB | NO | - | Big Fiveスコア `{"openness": 0-100, "conscientiousness": 0-100, "extraversion": 0-100, "agreeableness": 0-100, "neuroticism": 0-100}` |
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
  session_id TEXT,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  source TEXT CHECK (source IN ('edge_function', 'openclaw')) DEFAULT 'edge_function',
  topic_id TEXT DEFAULT 'daily',
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  has_attachment BOOLEAN DEFAULT false,
  attachment_type TEXT CHECK (attachment_type IN ('image', 'video', 'audio', 'file')),
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_user_id_created ON chat_messages(user_id, created_at DESC);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー |
| session_id | TEXT | YES | NULL | チャットセッションID（nullable） |
| role | TEXT | NO | - | メッセージの送信者（user/assistant/system） |
| content | TEXT | NO | - | メッセージ本文 |
| source | TEXT | YES | 'edge_function' | メッセージの生成元 |
| topic_id | TEXT | YES | 'daily' | トピックID（daily/work/reflection/consultation） |
| metadata | JSONB | YES | '{}' | 追加メタデータ（トークン数、モデル名等） |
| tokens_used | INTEGER | YES | NULL | 消費したトークン数 |
| has_attachment | BOOLEAN | NO | false | 添付ファイルの有無 |
| attachment_type | TEXT | YES | NULL | 添付種別（image/video/audio/file） |
| attachment_url | TEXT | YES | NULL | 添付ファイルURL |
| is_read | BOOLEAN | NO | false | 既読フラグ |
| read_at | TIMESTAMPTZ | YES | NULL | 既読日時 |
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
  ai_reflection TEXT,
  tags JSONB DEFAULT '[]',
  chat_session_id TEXT,
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
| ai_reflection | TEXT | YES | NULL | AIによる振り返りコメント |
| tags | JSONB | YES | '[]' | タグ配列 |
| chat_session_id | TEXT | YES | NULL | 関連するチャットセッションID |
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
  mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'terrible')) NOT NULL,
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
| mood | TEXT | NO | - | 気分ラベル（great/good/neutral/bad/terrible） |
| note | TEXT | YES | NULL | メモ |
| recorded_at | DATE | NO | CURRENT_DATE | 記録日 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**制約:**
- `mood` は 5種類のいずれか（CHECK制約）
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

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー（UNIQUE） |
| status | TEXT | NO | 'free' | サブスク状態（free/trial/active/grace_period/expired/cancelled） |
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

チャットクレジット残高。**廃止予定**: token_usageテーブルに移行（Freeは初回10Kトークン、リセットなし）。

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

**並行制御:** チャット送信時のクレジット消費は `SELECT ... FOR UPDATE` でロックし、同時リクエストのレースコンディションを防ぐ。

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
  transaction_type TEXT CHECK (transaction_type IN ('subscription', 'consumable', 'bonus')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  token_amount INTEGER,
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
| transaction_type | TEXT | YES | NULL | 課金種別（subscription/consumable/bonus）消費IAP対応 |
| amount | INTEGER | NO | - | 増減数（consumeは負値） |
| balance_after | INTEGER | NO | - | 取引後の残高 |
| token_amount | INTEGER | YES | NULL | 購入トークン数 |
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

**排他制御:** provision/destroy が同時実行されるレースコンディションを防ぐため、status が `provisioning` または `destroying` の場合は他の操作を拒否する。Edge Function側で `SELECT ... FOR UPDATE` を使用。

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

### 10. chat_topics（NEW）

チャットのトピック（話題）管理。ユーザーがメッセージを話題別に分類するためのテーブル。

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

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | TEXT | NO | - | トピックID（daily/work/reflection/consultation等） |
| user_id | UUID | NO | - | profiles.id への外部キー |
| name | TEXT | NO | - | トピック名（「日常」「仕事」「振り返り」「相談」等） |
| icon | TEXT | YES | NULL | トピックアイコン |
| sort_order | INTEGER | YES | 0 | ソート順序 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own chat topics"
  ON chat_topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat topics"
  ON chat_topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat topics"
  ON chat_topics FOR UPDATE
  USING (auth.uid() = user_id);
```

**デフォルトトピック:**
ユーザー作成時にEdge Functionで以下を自動作成:
- id: `daily`, name: `日常`, icon: `sun`
- id: `work`, name: `仕事`, icon: `briefcase`
- id: `reflection`, name: `振り返り`, icon: `book`
- id: `consultation`, name: `相談`, icon: `speech-bubble`

---

### 11. twin_profiles_public（VIEW）（NEW）

コミュニティ用の公開プロフィール。他のProユーザーのツインと会話するための情報を提供するVIEW。
ベースとなるprofiles、personality_results、subscriptionsテーブルのデータを結合した読み取り専用ビュー。

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

**RLSポリシー:**

ビュー自体がフィルタ済みのため追加のRLSは不要。ベースとなるprofiles、personality_results、subscriptionsテーブルのRLSで制御される。

---

### 12. twin_conversations（NEW）

AIツイン間の会話記録。ユーザーが他のツインとの会話を開始すると生成される。

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

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| initiator_user_id | UUID | NO | - | 会話を開始したユーザー |
| partner_user_id | UUID | NO | - | 相手ユーザー |
| status | TEXT | NO | 'generating' | 会話生成状態（generating/completed/error） |
| messages | JSONB | NO | '[]' | メッセージ配列 `[{role: 'twin_a'\|'twin_b', content: '...', timestamp: '...'}]` |
| compatibility_score | INTEGER | YES | NULL | 相性スコア（0-100） |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**status の遷移:**
```
generating → completed（会話生成完了）
generating → error（生成失敗）
```

**RLSポリシー:**
```sql
-- 自分が開始した会話のみ参照可能
CREATE POLICY "Users can view own initiated conversations"
  ON twin_conversations FOR SELECT
  USING (auth.uid() = initiator_user_id);

-- insertはEdge Function（service_role）経由のみ
-- 会話生成はバックエンドで実行
```

---

### 13. webhook_events（NEW）

RevenueCat Webhookの冪等性チェック用。

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

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| event_id | TEXT | NO | - | RevenueCatのイベントID（UNIQUE） |
| event_type | TEXT | NO | - | イベントタイプ（INITIAL_PURCHASE等） |
| payload | JSONB | YES | NULL | Webhookペイロード全体 |
| processed_at | TIMESTAMPTZ | NO | now() | 処理日時 |

---

### 14. chat_attachments（NEW）

チャットメッセージの添付ファイル管理。画像・動画・音声・ファイルの詳細情報を保持する。

```sql
CREATE TABLE chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'file')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_attachments_message_id ON chat_attachments(message_id);
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| message_id | UUID | NO | - | chat_messages.id への外部キー |
| type | TEXT | NO | - | 添付種別（image/video/audio/file） |
| url | TEXT | NO | - | ファイルURL |
| thumbnail_url | TEXT | YES | NULL | サムネイルURL（動画の場合） |
| file_size | INTEGER | NO | - | ファイルサイズ（バイト） |
| mime_type | TEXT | NO | - | MIMEタイプ |
| duration_seconds | INTEGER | YES | NULL | 再生時間（動画/音声の場合） |
| width | INTEGER | YES | NULL | 画像/動画の幅（px） |
| height | INTEGER | YES | NULL | 画像/動画の高さ（px） |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**RLSポリシー:**
```sql
-- ユーザー本人のメッセージの添付のみCRUD可能
CREATE POLICY "Users can view own chat attachments"
  ON chat_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_messages cm WHERE cm.id = message_id AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own chat attachments"
  ON chat_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_messages cm WHERE cm.id = message_id AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own chat attachments"
  ON chat_attachments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM chat_messages cm WHERE cm.id = message_id AND cm.user_id = auth.uid()
  ));
```

---

### 15. push_tokens（NEW）

プッシュ通知トークン管理。ユーザーのデバイスごとにExpo Push Tokenを保持する。

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー |
| expo_push_token | TEXT | NO | - | Expo Push Token |
| device_id | TEXT | NO | - | デバイス識別子 |
| platform | TEXT | NO | - | プラットフォーム（ios/android） |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**制約:** ユーザーごとにデバイスIDはユニーク（UNIQUE(user_id, device_id)）

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own push tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 16. notification_settings（NEW）

ユーザーの通知設定。ユーザーごとに1レコード。

```sql
CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  chat_enabled BOOLEAN DEFAULT true,
  journal_reminder_enabled BOOLEAN DEFAULT true,
  journal_reminder_time TIME DEFAULT '21:00',
  community_enabled BOOLEAN DEFAULT true,
  marketing_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| user_id | UUID | NO | - | profiles.id への外部キー（PK） |
| chat_enabled | BOOLEAN | NO | true | チャット通知のOn/Off |
| journal_reminder_enabled | BOOLEAN | NO | true | 日記リマインダーのOn/Off |
| journal_reminder_time | TIME | NO | '21:00' | 日記リマインダー時刻 |
| community_enabled | BOOLEAN | NO | true | コミュニティ通知のOn/Off |
| marketing_enabled | BOOLEAN | NO | false | マーケティング通知のOn/Off |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**RLSポリシー:**
```sql
CREATE POLICY "Users can view own notification settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### 17. communities（NEW）

コミュニティ管理。ユーザーが作成したコミュニティの情報を保持する。

```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  description TEXT CHECK (char_length(description) <= 200),
  language TEXT NOT NULL DEFAULT 'jp' CHECK (language IN ('jp', 'en')),
  category TEXT NOT NULL CHECK (category IN ('info', 'business', 'hobby', 'casual', 'other')),
  thumbnail_url TEXT,
  is_default_thumbnail BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_communities_creator_id ON communities(creator_id);
CREATE INDEX idx_communities_category ON communities(category);
CREATE INDEX idx_communities_is_active ON communities(is_active);
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| creator_id | UUID | NO | - | profiles.id への外部キー（作成者） |
| name | TEXT | NO | - | コミュニティ名（最大50文字） |
| description | TEXT | YES | NULL | 説明（最大200文字） |
| language | TEXT | NO | 'jp' | 言語（jp/en） |
| category | TEXT | NO | - | カテゴリ（info/business/hobby/casual/other） |
| thumbnail_url | TEXT | YES | NULL | サムネイルURL |
| is_default_thumbnail | BOOLEAN | NO | true | デフォルトサムネイル使用フラグ |
| member_count | INTEGER | NO | 0 | メンバー数（キャッシュ） |
| is_active | BOOLEAN | NO | true | アクティブフラグ |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**RLSポリシー:**
```sql
-- 全員が閲覧可能
CREATE POLICY "Anyone can view communities"
  ON communities FOR SELECT
  USING (true);

-- 認証済みユーザーのみ作成可能
CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 作成者のみ更新可能
CREATE POLICY "Creators can update own communities"
  ON communities FOR UPDATE
  USING (auth.uid() = creator_id);

-- 作成者のみ削除可能
CREATE POLICY "Creators can delete own communities"
  ON communities FOR DELETE
  USING (auth.uid() = creator_id);
```

---

### 18. community_members（NEW）

コミュニティのメンバーシップ管理。

```sql
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_community_members_user_id ON community_members(user_id);
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| community_id | UUID | NO | - | communities.id への外部キー |
| user_id | UUID | NO | - | profiles.id への外部キー |
| joined_at | TIMESTAMPTZ | NO | now() | 参加日時 |

**制約:** 同一コミュニティに同一ユーザーは1回のみ参加可能（UNIQUE(community_id, user_id)）

**RLSポリシー:**
```sql
-- 全員が閲覧可能
CREATE POLICY "Anyone can view community members"
  ON community_members FOR SELECT
  USING (true);

-- 認証済みユーザーが自分自身のみ参加可能
CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分自身のみ退出可能
CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 19. community_messages（NEW）

コミュニティ内のメッセージ。AIエージェントによる自律会話を含む。

```sql
CREATE TABLE community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  agent_user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_autonomous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_community_messages_community_id ON community_messages(community_id, created_at DESC);
CREATE INDEX idx_community_messages_agent_user_id ON community_messages(agent_user_id);
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| community_id | UUID | NO | - | communities.id への外部キー |
| agent_user_id | UUID | NO | - | profiles.id への外部キー（エージェントの所有者） |
| content | TEXT | NO | - | メッセージ本文 |
| is_autonomous | BOOLEAN | NO | false | 自律会話フラグ（Cronで生成された場合true） |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**RLSポリシー:**
```sql
-- 全員が閲覧可能
CREATE POLICY "Anyone can view community messages"
  ON community_messages FOR SELECT
  USING (true);

-- 認証済みユーザーが自分のエージェントとしてのみ投稿可能
CREATE POLICY "Users can post as own agent"
  ON community_messages FOR INSERT
  WITH CHECK (auth.uid() = agent_user_id);
```

---

### 20. token_usage（NEW）

トークン使用量管理。Free/Proプランごとのトークン上限と消費量を追跡する。

```sql
CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tokens_used INTEGER DEFAULT 0,
  tokens_limit INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_start)
);

CREATE INDEX idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX idx_token_usage_period ON token_usage(user_id, period_start);
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | profiles.id への外部キー |
| tokens_used | INTEGER | NO | 0 | 使用済みトークン数 |
| tokens_limit | INTEGER | NO | - | トークン上限（Free: 10,000, Pro: 500,000） |
| period_start | DATE | NO | - | 期間開始日 |
| period_end | DATE | NO | - | 期間終了日 |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**制約:** ユーザーごとに同一開始日のレコードは1つのみ（UNIQUE(user_id, period_start)）

**トークン上限:**
| プラン | tokens_limit |
|--------|-------------|
| Free | 10,000 |
| Pro | 500,000 |

**RLSポリシー:**
```sql
-- ユーザー本人のみ参照可能
CREATE POLICY "Users can view own token usage"
  ON token_usage FOR SELECT
  USING (auth.uid() = user_id);

-- 更新はEdge Function（service_role）経由のみ
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

  -- notification_settingsにデフォルトレコード作成
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id);

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

CREATE TRIGGER set_updated_at BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON token_usage
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

### AC-5: twin_profiles_publicはPro認証ユーザーのみSELECT可能

**Given** ユーザーAがProサブスクリプション（trial/active/grace_period）を持っている
**When** ユーザーAが `twin_profiles_public` テーブルをSELECTする
**Then**
- `is_visible = true` の全公開プロフィールが返される
- 自分のプロフィールも含まれる

**Given** ユーザーBがFreeプラン（status = 'free'）である
**When** ユーザーBが `twin_profiles_public` テーブルをSELECTする
**Then**
- RLSポリシーにより空の結果セットが返される
- エラーは発生しない（SELECT自体は実行可能）

**テスト観点:**
- Pro/Freeの状態でSELECT結果が異なることを確認
- サブスクリプション状態の変化（Pro → Free）でアクセス権が即座に失われることを確認
- is_visible = false のプロフィールがPro認証ユーザーにも返されないことを確認

---

### AC-6: twin_conversationsはinitiatorのみSELECT可能

**Given** ユーザーAがユーザーBのツインとの会話を開始した（initiator_user_id = A）
**When** ユーザーAが `twin_conversations` テーブルをSELECTする
**Then**
- 自分が開始した会話（initiator_user_id = auth.uid()）のみが返される
- ユーザーBの会話は返されない

**Given** ユーザーBが自分のツインと会話されたレコードを参照しようとする
**When** ユーザーBが `twin_conversations` テーブルをSELECTする（partner_user_id = B）
**Then**
- RLSポリシーによりそのレコードは返されない
- ユーザーBは他のユーザーが自分のツインと会話したことを知ることができない

**テスト観点:**
- initiator/partner の立場でアクセス権が異なることを確認
- initiatorのみが会話履歴にアクセスできることを確認
- partnerは通知等を受け取らないことを確認（プライバシー保護）

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
    |--- 1:1 --- notification_settings
    |--- 1:N --- personality_results
    |--- 1:N --- chat_messages -------- 1:N --- chat_attachments
    |--- 1:N --- chat_topics
    |--- 1:N --- journal_entries
    |--- 1:N --- mood_records
    |--- 1:N --- credit_transactions
    |--- 1:N --- twin_conversations (as initiator)
    |--- 1:N --- twin_conversations (as partner)
    |--- 1:N --- push_tokens
    |--- 1:N --- token_usage
    |--- 1:N --- communities (as creator)
    |--- 1:N --- community_members
    |--- 1:N --- community_messages (as agent owner)

communities
    |--- 1:N --- community_members
    |--- 1:N --- community_messages

personality_results + subscriptions
    |
    | VIEW: twin_profiles_public (VIEW)
    |

webhook_events（独立テーブル）
```

---

## 変更履歴

| 日付 | 変更内容 | 理由 | 関連タスク |
|------|---------|------|-----------|
| 2026-02-14 | personality_results: 個別カラム5個（openness, conscientiousness, extraversion, agreeableness, neuroticism）をJSON統一（personality_traitsカラムに） | Reconcile: Clarify Phase Q1決定 — スコア管理をJSON一括格納に統一 | — |
| 2026-02-14 | subscriptions.status: CHECK制約を('free', 'trial', 'active', 'grace_period', 'expired', 'cancelled')に更新（trialing→trial、cancelled追加） | Reconcile: RevenueCat用語統一 | — |
| 2026-02-14 | twin_profiles_public: TABLEからVIEWに変更（profiles + personality_results + subscriptionsの結合ビュー） | Reconcile: Clarify Phase Q4決定 — 冗長なテーブルを削除し、ビューで実装 | — |
| 2026-02-14 | journal_entries: moodカラムを削除（mood_recordsがSSoT） | Reconcile: Clarify Phase Q3決定 — 気分トラッキングはmood_recordsに統一 | — |
| 2026-02-14 | journal_entries: tags型をTEXT[]からJSONBに変更 | Reconcile: データ型統一（配列はJSON推奨） | — |
| 2026-02-14 | journal_entries: chat_session_idカラム追加（TEXT, nullable） | Reconcile: journal_entriesとchat_messagesのリンク用 | — |
| 2026-02-14 | chat_messages: tokens_usedカラム追加（INTEGER, nullable） | Reconcile: トークン消費量の追跡用 | — |
| 2026-02-14 | webhook_events テーブル追加（event_id, event_type, payload, processed_at） | 新テーブル: RevenueCat Webhookの冪等性チェック用 | — |
| 2026-02-14 | credits: 日次リセットロジックに並行制御の注記を追加（SELECT ... FOR UPDATEでロック） | Reconcile: レースコンディション対策 | — |
| 2026-02-14 | openclaw_instances: status遷移図の後に排他制御の注記を追加（provision/destroy時のロック） | Reconcile: 同時実行のレースコンディション対策 | — |
| 2026-02-14 | AC-5: twin_profiles_publicのRLSで'trialing'を'trial'に更新 | Reconcile: subscriptions.status更新に伴う整合性確保 | — |
| 2026-02-14 | handle_new_user()トリガー: twin_profiles_publicへのINSERTを削除（VIEWに変更したため） | Reconcile: twin_profiles_publicがVIEWになったため削除 | — |
| 2026-02-14 | updated_atトリガー: twin_profiles_publicへのトリガーを削除（VIEWのため不要） | Reconcile: twin_profiles_publicがVIEWになったため削除 | — |
| 2026-02-14 | テーブル一覧: twin_profiles_publicの説明をCHECK対象に変更、webhook_eventsテーブル（テーブル12）を追加 | Reconcile: スキーマ構成の更新を反映 | — |
| 2026-02-14 | ER図: twin_profiles_public (VIEW)表記、webhook_events（独立テーブル）の追加 | Reconcile: データモデルの可視化更新 | — |
| 2026-02-15 | profiles: avatar_icon, speech_tone カラム追加<br>chat_messages: topic_id カラム追加（DEFAULT: 'daily'）<br>新テーブル chat_topics 追加（user_id, name, icon, sort_order, created_at）<br>chat_topics RLSポリシー設定<br>デフォルトトピック自動作成仕様記載<br>テーブル番号更新（chat_topics #10, twin_profiles_public #11, twin_conversations #12, webhook_events #13） | V3 Liquid Glass: トピックタブ機能、avatar_icon/speech_tone追加 | — |
| 2026-02-15 | profiles: twin_name DEFAULT 'My Agent' に変更、mbti_type カラム追加<br>chat_messages: has_attachment, attachment_type, attachment_url, is_read, read_at カラム追加<br>credit_transactions: transaction_type, token_amount カラム追加<br>新テーブル7個追加: chat_attachments(#14), push_tokens(#15), notification_settings(#16), communities(#17), community_members(#18), community_messages(#19), token_usage(#20)<br>全新規テーブルにRLSポリシー設定<br>handle_new_user()トリガーにnotification_settings自動作成を追加<br>updated_atトリガーにpush_tokens, notification_settings, communities, token_usage追加<br>ER図更新 | 新機能対応: コミュニティ、プッシュ通知、添付ファイル、トークン管理 | — |
| 2026-02-16 | Auth SDD 実装完了に伴う実装詳細の追記:<br>`auth-store`: `isGuest`, `enterGuestMode()`, `deleteAccount()` 追加<br>`GuestPromptOverlay` コンポーネント新規作成（`src/shared/components/guest-prompt-overlay.tsx`）<br>`account-delete-confirm.tsx` モーダル新規作成（`app/account-delete-confirm.tsx`）<br>`delete-account` Edge Function 新規作成（OpenClaw→RevenueCat→auth.admin.deleteUser）<br>`supabase/client.ts`: AsyncStorage → SecureStore 移行 + AppState listener 追加<br>`supabase/auth.ts`: Google Sign-In Native SDK 移行（`@react-native-google-signin/google-signin`） | Reconcile: Auth SDD 実装完了後の仕様書同期 | T042-T052 |
| 2026-02-20 | profiles.avatar_icon: 説明を「5パターン（geometric/cosmic/organic/tech/zen）」から「30種類（robot, cat, bunny, star, owl...）+ レガシー値フォールバック」に更新 | Reconcile: マイエージェント UI 実装完了後の仕様書同期 | — |
