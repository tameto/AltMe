# 01 — データモデル仕様

## ステータス: DRAFT
- 作成日: 2026-02-14
- 最終更新: 2026-02-14
- 承認状態: 未承認
- 担当: Agent A (Foundation)

---

## 1. Supabase DB設計（PostgreSQL）

### 1.1 テーブル一覧

| テーブル名 | 説明 | RLS |
|-----------|------|-----|
| profiles | ユーザープロファイル | Yes |
| personality_results | 性格診断結果 | Yes |
| chat_messages | チャット履歴 | Yes |
| journal_entries | 日記エントリ | Yes |
| mood_records | 感情記録 | Yes |
| subscriptions | サブスクリプション状態 | Yes |
| credits | クレジット残高 | Yes |
| credit_transactions | クレジット使用履歴 | Yes |

### 1.2 テーブル定義

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  age_range TEXT, -- '18-24', '25-34', '35-44', '45+'
  locale TEXT DEFAULT 'ja',
  timezone TEXT DEFAULT 'Asia/Tokyo',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  twin_name TEXT, -- AI分身の名前
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### personality_results
```sql
CREATE TABLE personality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- オンボーディング回答 [{questionId, answer}]
  summary TEXT NOT NULL, -- AI生成のサマリー（無料で表示）
  detailed_analysis TEXT, -- AI生成の詳細分析（有料のみ表示）
  personality_traits JSONB, -- {openness, conscientiousness, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- ユーザーあたり1つ（再診断で上書き）
);
```

#### chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER, -- 使用トークン数（コスト計算用）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user_date ON chat_messages(user_id, created_at DESC);
```

#### journal_entries
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- ユーザーの日記本文
  ai_reflection TEXT, -- AI分析・振り返りコメント
  mood TEXT, -- 'great', 'good', 'neutral', 'bad', 'terrible'
  tags JSONB DEFAULT '[]', -- ['仕事', '健康', ...]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, created_at DESC);
```

#### mood_records
```sql
CREATE TABLE mood_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'terrible')),
  note TEXT, -- 任意のメモ
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recorded_at) -- 1日1レコード
);

CREATE INDEX idx_mood_records_user_date ON mood_records(user_id, recorded_at DESC);
```

#### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  revenuecat_id TEXT, -- RevenueCatのapp_user_id
  status TEXT NOT NULL DEFAULT 'free'
    CHECK (status IN ('free', 'trial', 'active', 'expired', 'cancelled', 'grace_period')),
  plan_type TEXT -- 'monthly', 'annual', 'intro_annual'
    CHECK (plan_type IS NULL OR plan_type IN ('monthly', 'annual', 'intro_annual')),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### credits
```sql
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### credit_transactions
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 正: 購入, 負: 消費
  type TEXT NOT NULL CHECK (type IN ('purchase', 'consume', 'bonus')),
  description TEXT, -- 'deep_analysis', 'monthly_report', ...
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);
```

### 1.3 RLS ポリシー

全テーブル共通で以下のRLSポリシーを適用:

```sql
-- ユーザーは自分のデータのみ参照・更新可能
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON {table_name}
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON {table_name}
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON {table_name}
  FOR UPDATE USING (auth.uid() = user_id);
```

例外: `subscriptions` テーブルはWebhookからの更新用にservice_role keyでのアクセスを許可。

---

## 2. TypeScript 型定義

### 2.1 src/shared/types/user.ts

```typescript
export type AgeRange = '18-24' | '25-34' | '35-44' | '45+';

export type UserProfile = {
  id: string;
  displayName: string;
  ageRange: AgeRange | null;
  locale: string;
  timezone: string;
  onboardingCompleted: boolean;
  twinName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonalityTraits = {
  openness: number;       // 0-100
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

export type PersonalityResult = {
  id: string;
  userId: string;
  answers: Array<{ questionId: string; answer: string }>;
  summary: string;
  detailedAnalysis: string | null;
  personalityTraits: PersonalityTraits | null;
  createdAt: string;
};
```

### 2.2 src/shared/types/subscription.ts

```typescript
export type SubscriptionStatus =
  | 'free'
  | 'trial'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'grace_period';

export type PlanType = 'monthly' | 'annual' | 'intro_annual';

export type Subscription = {
  id: string;
  userId: string;
  revenuecatId: string | null;
  status: SubscriptionStatus;
  planType: PlanType | null;
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreditBalance = {
  userId: string;
  balance: number;
};

export type CreditTransaction = {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'consume' | 'bonus';
  description: string | null;
  createdAt: string;
};

// Entitlement チェック用
export type EntitlementInfo = {
  isPro: boolean;
  status: SubscriptionStatus;
  planType: PlanType | null;
  trialDaysRemaining: number | null;
  credits: number;
};
```

### 2.3 src/shared/types/chat.ts

```typescript
export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  tokensUsed: number | null;
  createdAt: string;
};

// 送信用（idは不要）
export type ChatMessageInput = {
  role: ChatRole;
  content: string;
};

// ストリーミング用
export type ChatStreamChunk = {
  delta: string;
  isComplete: boolean;
};

// 日次チャット上限
export const FREE_DAILY_CHAT_LIMIT = 3;
```

### 2.4 src/shared/types/journal.ts

```typescript
export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export type JournalEntry = {
  id: string;
  userId: string;
  content: string;
  aiReflection: string | null;
  mood: Mood | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type JournalEntryInput = {
  content: string;
  mood?: Mood;
  tags?: string[];
};

export type MoodRecord = {
  id: string;
  userId: string;
  mood: Mood;
  note: string | null;
  recordedAt: string;
  createdAt: string;
};

export type MoodRecordInput = {
  mood: Mood;
  note?: string;
};
```

### 2.5 src/shared/types/index.ts

```typescript
export type { UserProfile, AgeRange, PersonalityTraits, PersonalityResult } from './user';
export type {
  SubscriptionStatus,
  PlanType,
  Subscription,
  CreditBalance,
  CreditTransaction,
  EntitlementInfo,
} from './subscription';
export type {
  ChatRole,
  ChatMessage,
  ChatMessageInput,
  ChatStreamChunk,
} from './chat';
export { FREE_DAILY_CHAT_LIMIT } from './chat';
export type {
  Mood,
  JournalEntry,
  JournalEntryInput,
  MoodRecord,
  MoodRecordInput,
} from './journal';
```

---

## 3. Zustand Store 設計

### 3.1 Store一覧

| Store名 | ファイル | 管理する状態 |
|---------|---------|------------|
| useAuthStore | features/auth/stores/auth-store.ts | ユーザー認証状態、プロファイル |
| useSubscriptionStore | features/subscription/stores/subscription-store.ts | サブスク状態、Entitlement |
| useOnboardingStore | features/onboarding/stores/onboarding-store.ts | オンボーディング進捗 |
| useChatStore | features/chat/stores/chat-store.ts | チャット履歴、送信状態 |
| useJournalStore | features/journal/stores/journal-store.ts | 日記エントリ一覧 |
| useInsightsStore | features/insights/stores/insights-store.ts | 洞察・レポートデータ |

### 3.2 Store間の依存関係

```
useAuthStore ← useSubscriptionStore（ユーザーIDに依存）
useAuthStore ← useChatStore（ユーザーIDに依存）
useSubscriptionStore ← useChatStore（Entitlementに依存：チャット上限チェック）
useSubscriptionStore ← useJournalStore（Entitlementに依存：機能アクセス）
```

---

## 4. 検証条件

- [ ] 全テーブルのRLSポリシーが正しく動作すること
- [ ] 他ユーザーのデータにアクセスできないこと
- [ ] 型定義とDBスキーマの整合性があること
- [ ] マイグレーションが冪等に実行できること
- [ ] subscriptions テーブルがWebhookから正しく更新されること
