# AltMe 技術実装計画 (Step 4: Plan)

## 0. 現状分析

### 既存実装の棚卸

全仕様書（15ファイル）と既存コードベースの差分分析を行った。

**実装済み（仕様変更あり）:**

| 領域 | ファイル | 状態 | 仕様との乖離 |
|------|---------|------|-------------|
| 認証 | `src/features/auth/stores/auth-store.ts` | 動作 | signOutでWebSocket切断が未実装 |
| 認証画面 | `app/(auth)/login.tsx` | 動作 | 仕様と概ね一致 |
| オンボーディング | `app/(onboarding)/*.tsx` | 動作 | meet-twin.tsxのonboarding-chat EF連携が未実装 |
| ルーティング | `app/_layout.tsx` | 動作 | ペイウォールへの遷移ルート不足 |
| タブ構成 | `app/(tabs)/_layout.tsx` | **旧構成** | 3タブ(Chat/Journal/Insights)→4タブ(Chat/Community/Twin/Settings)に変更必要 |
| チャット画面 | `app/(tabs)/index.tsx` | 動作 | 日記統合UI未実装、WebSocket接続未統合 |
| 日記画面 | `app/(tabs)/journal.tsx` | **廃止対象** | チャットに統合される |
| 洞察画面 | `app/(tabs)/insights.tsx` | **廃止対象** | Twin Infoに置き換え |
| 設定画面 | `app/(tabs)/settings.tsx` | 動作 | アカウント削除、OpenClawインスタンス管理が未実装 |
| ペイウォール | `app/(paywall)/index.tsx` | 動作 | 初回限定オファー・カウントダウン未実装 |
| DB: 初期スキーマ | `supabase/migrations/20260214000001_initial_schema.sql` | 動作 | profiles.email/avatar_url欠落、credits構造が旧式 |
| DB: openclaw | `supabase/migrations/20260214000003_openclaw_instances.sql` | 動作 | 仕様と概ね一致 |
| 型定義 | `src/shared/types/*.ts` | 動作 | 複数の欠落フィールドあり |
| WebSocket | `src/services/openclaw/websocket-client.ts` | 動作 | ws://→wss://変更必要 |
| Webhook | `supabase/functions/webhook-revenuecat/index.ts` | 動作 | 冪等性チェック未実装 |

**未実装（新規作成必要）:**

| 領域 | 内容 |
|------|------|
| コミュニティ画面 | `app/(tabs)/community.tsx` |
| ツイン情報画面 | `app/(tabs)/twin.tsx` |
| ツイン会話詳細モーダル | `app/twin-conversation-detail.tsx` |
| アカウント削除確認モーダル | `app/account-delete-confirm.tsx` |
| コミュニティ feature | `src/features/community/` 全体 |
| ツイン情報 feature | `src/features/twin-info/` 全体 |
| DB: コミュニティテーブル | `twin_conversations`, `twin_profiles_public` VIEW |
| DB: webhook_events | 冪等性チェック用テーブル |
| Edge Function: onboarding-chat | オンボーディング初回チャット |
| Edge Function: generate-twin-conversation | AIツイン会話生成 |
| チャット日記統合 | journal-prompt, journal-entry hooks/components |

---

## 1. 実装フェーズ（Phase 0 -- 4）

### Phase 0: 基盤整備（3日）

**目的:** 仕様変更に伴うDB差分マイグレーション、型定義の更新、タブ構成の変更。全Phaseの前提。

含まれるタスク: T001 -- T006

### Phase 1: コア機能（7日）

**目的:** 認証フロー修正、オンボーディング完走、Free/Proチャット二層対応、課金フロー。ユーザーが「ログイン→オンボーディング→チャット→課金」の一連を完走できる状態。

含まれるタスク: T007 -- T018

### Phase 2: エンゲージメント機能（5日）

**目的:** ツイン情報（性格・気分・ステータス）、日記統合、設定画面の拡張。Proユーザーのリテンションに必要な機能。

含まれるタスク: T019 -- T027

### Phase 3: プレミアム機能（5日）

**目的:** OpenClawプロビジョニングの完成、コミュニティ機能、WebSocket再接続パターンの堅牢化。Proの差別化価値を実現。

含まれるタスク: T028 -- T036

### Phase 4: 統合テスト + 最適化（4日）

**目的:** E2Eテスト、課金フロー検証、パフォーマンス最適化、Apple審査準備。

含まれるタスク: T037 -- T042

**合計所要期間: 24日（約5週間）**

---

## 2. Agent別タスク割り当て

### Phase 0: 基盤整備

| ID | タスク名 | Agent | サイズ | ブロッカー | 関連仕様書 | 完了条件 |
|----|---------|-------|-------|-----------|-----------|---------|
| T001 | DBマイグレーション差分: profiles拡張（email, avatar_url追加） | A | S | なし | `database.md` | profilesテーブルにemail, avatar_urlカラムが存在。handle_new_user()がemailを保存。 |
| T002 | DBマイグレーション差分: credits構造変更（daily_remaining + last_reset_at方式） | A | S | なし | `database.md` | creditsがdaily_remaining(DEFAULT 3), last_reset_at(DATE)を持つ。 |
| T003 | DBマイグレーション差分: personality_results拡張 + UNIQUE制約除去 | A | S | なし | `database.md` | communication_style(JSONB), raw_answers(JSONB)追加。UNIQUE制約DROP。 |
| T004 | DBマイグレーション: webhook_events + twin_conversations + twin_profiles_public VIEW | A | M | なし | `database.md`, `community.md` | 3オブジェクト全て作成、RLS適用済み。 |
| T005 | 共有型定義の仕様合致更新 | A | M | なし | 全仕様書 | `src/shared/types/` 全ファイルが仕様と完全一致。 |
| T006 | タブ構成変更（3タブ→4タブ）+ モーダルルート追加 | A | M | なし | `navigation.md`, `screen-list.md` | 4タブ(Chat/Community/Twin/Settings)。モーダルルート追加。 |

### Phase 1: コア機能

| ID | タスク名 | Agent | サイズ | ブロッカー | 関連仕様書 | 完了条件 |
|----|---------|-------|-------|-----------|-----------|---------|
| T007 | 認証ストア修正: signOutにWebSocket切断追加 | A | S | T005 | `auth.md` AC-3 | signOut時にWebSocket切断。Zustand全状態リセット。 |
| T008 | constants.ts更新: 価格定数・チャット定数の仕様合致 | A | S | なし | `overview.md`, `chat.md` | journalMaxLength: 3000追加。不要定数削除。 |
| T009 | Edge Function: onboarding-chat 新規実装 | C | M | T003 | `external-services.md` 3-12, `onboarding.md` AC-6 | OpenAI呼出動作。reply + turn_count返却。 |
| T010 | オンボーディング: personality-quiz → personality-analyze EF連携 | C | M | T003 | `onboarding.md` AC-2,3,4 | personality_traitsにJSONB保存。フォールバック実装。 |
| T011 | オンボーディング: meet-twin → onboarding-chat EF連携 | C | M | T009 | `onboarding.md` AC-5,6,7 | 初回チャット3往復→ペイウォール遷移。 |
| T012 | ペイウォール: 初回限定オファー + カウントダウンタイマー | B | M | T008 | `subscription.md` AC-3 | 24時間以内にintro_annualプラン表示。 |
| T013 | useSubscription hook: RevenueCat SDK統合完成 | B | M | T005 | `subscription.md` | isPro, isTrialing, expiresAt等が正しく動作。 |
| T014 | Freeチャット: chat EF修正（daily_remaining + SSE） | C | M | T002 | `chat.md` AC-1, `external-services.md` 3-1 | SSEストリーミング。HTTP 429で上限到達。 |
| T015 | チャット画面: Free/Pro二層対応の基盤 | C | L | T005, T014 | `chat.md` AC-1,2,3 | 接続モード切替。残り回数バッジ(Free)。 |
| T016 | チャット画面: 履歴読み込み + ページネーション(50件) | C | M | T015 | `chat.md` AC-5 | 上方向スクロールで追加ロード。 |
| T017 | チャット画面: ストリーミング応答表示 | C | M | T015 | `chat.md` AC-6 | text_deltaリアルタイム表示。 |
| T018 | Webhook修正: 冪等性チェック + PRODUCT_CHANGE対応 | B | M | T004 | `subscription.md` AC-8, `external-services.md` 3-3 | event.id重複排除。全イベントHTTP 200。 |

### Phase 2: エンゲージメント機能

| ID | タスク名 | Agent | サイズ | ブロッカー | 関連仕様書 | 完了条件 |
|----|---------|-------|-------|-----------|-----------|---------|
| T019 | ツイン情報画面: Big Five性格プロフィール表示 | D | M | T006, T005 | `insights.md` AC-1 | 5トレイト棒グラフ+スコア+サマリー表示。 |
| T020 | ツイン情報画面: 気分トラッキング + 週次グラフ | D | M | T006 | `insights.md` AC-3,4,5 | 5絵文字選択。直近7日間グラフ。 |
| T021 | ツイン情報画面: Pro限定セクション | D | M | T006, T005 | `insights.md` AC-6,7 | SOUL.mdサマリー。ステータスバッジ。30秒ポーリング。 |
| T022 | 性格診断やり直しフロー | D | M | T003, T019 | `insights.md` AC-2 | 確認ダイアログ→新レコード追加→SOUL.md更新。 |
| T023 | 日記統合: 振り返りプロンプト判定ロジック | C | M | T015 | `chat.md` AC-8, `journal.md` AC-1 | 6時間経過→isJournalPrompt送信。1日1回。Proのみ。 |
| T024 | 日記統合: ジャーナルエントリー保存 + AI振り返り | C | M | T023 | `chat.md` AC-9, `journal.md` AC-2,3 | chat_messages + journal_entries両方保存。 |
| T025 | 日記統合: UIバッジ + 背景色変更 | C | S | T024 | `journal.md` AC-4 | 📝バッジ。アクセントカラー背景。 |
| T026 | 設定画面拡張: プロフィール・ツイン名編集 | D | M | T005 | `settings.md` AC-1,2 | 表示名/ツイン名編集。SOUL.md更新連携。 |
| T027 | 設定画面拡張: アカウント削除機能 | D | M | T005 | `settings.md` AC-7 | 確認→OpenClaw destroy→全データ削除→ログイン遷移。 |

### Phase 3: プレミアム機能

| ID | タスク名 | Agent | サイズ | ブロッカー | 関連仕様書 | 完了条件 |
|----|---------|-------|-------|-----------|-----------|---------|
| T028 | EF: provision-openclaw 仕様準拠実装 | C | L | T004 | `openclaw-provisioning.md`, `external-services.md` 3-7 | cloud-init(Docker+nginx+wss://+SOUL.md)。冪等性。 |
| T029 | EF: destroy-openclaw 仕様準拠実装 | C | M | T004 | `external-services.md` 3-8 | 404成功扱い。soul_md保持。 |
| T030 | EF: health-check-openclaw 仕様準拠実装 | C | M | T028 | `external-services.md` 3-9 | 3回連続失敗→error。10分超→error。 |
| T031 | EF: update-soul-md + restart-openclaw 実装 | C | M | T028 | `external-services.md` 3-10, 3-11 | レート制限。120秒ポーリング。 |
| T032 | WebSocketクライアント: wss:// + フォールバック復帰 | C | M | T005 | `chat.md` | wss://接続。5分間隔バックグラウンド再接続。 |
| T033 | コミュニティ画面: ツインプロフィール一覧 | D | L | T004, T006 | `community.md` AC-1,4 | 相性スコア計算。FlatList 20件ページネーション。 |
| T034 | EF: generate-twin-conversation 新規実装 | C | L | T004 | `community.md` AC-2, `external-services.md` 3-13 | GPT-4o mini 5往復生成。24時間レート制限。 |
| T035 | コミュニティ画面: 会話生成 + 詳細モーダル | D | M | T034 | `community.md` AC-2,3 | 左右吹き出し表示。 |
| T036 | コミュニティ画面: Freeユーザーぼかしプレビュー | D | S | T006 | `community.md` AC-5 | ブラー+アップグレード誘導。 |

### Phase 4: 統合テスト + 最適化

| ID | タスク名 | Agent | サイズ | ブロッカー | 関連仕様書 | 完了条件 |
|----|---------|-------|-------|-----------|-----------|---------|
| T037 | 課金→OpenClawプロビジョニングE2Eフロー | B+C | L | T028, T018 | `subscription.md`, `openclaw-provisioning.md` | 購入→provision→チャット可→解約→destroy。 |
| T038 | エラーハンドリング + WebSocket再接続テスト | C | M | T032 | `chat.md` | 切断→再接続→復帰。10回失敗→フォールバック。 |
| T039 | RLSセキュリティ監査テスト | A | M | T004 | `database.md` AC-1,5,6 | 全テーブルRLS有効。他ユーザーアクセス不可。 |
| T040 | パフォーマンス最適化 | A | M | T015, T033 | `overview.md` | リスト仮想化。Cold Start 2秒以内。 |
| T041 | プッシュ通知: 朝の挨拶 + 振り返り通知 | D | S | T024 | `journal.md` | 9:00挨拶。22:00振り返り促進。 |
| T042 | Apple審査準備 | A | S | T027 | `settings.md` AC-7 | 削除ボタン視認性。利用規約リンク。 |

---

## 3. 共有インターフェース定義（Agent間の契約）

### `src/shared/types/user.ts`（更新）

契約: Agent A <-> Agent C, D

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

### `src/shared/types/subscription.ts`（更新）

契約: Agent A <-> Agent B, C, D

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

### `src/shared/types/chat.ts`（更新）

契約: Agent A <-> Agent C

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

### `src/shared/types/community.ts`（新規）

契約: Agent A <-> Agent D

```typescript
import { PersonalityTraits } from './user';

export type TwinProfile = {
  userId: string;
  twinName: string;
  personalitySummary: string;
  bigFiveScores: PersonalityTraits;
  createdAt: string;
};

export type CompatibilityScore = {
  userId: string;
  score: number; // 0-100
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

### `src/shared/types/journal.ts`（更新）

契約: Agent A <-> Agent C, D

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
  recordedAt: string; // DATE
  createdAt: string;
};
```

### `src/shared/types/openclaw.ts`（変更なし）

契約: Agent A <-> Agent C — 既存の型定義は仕様と一致。

---

## 4. 技術的決定事項

| 決定事項 | 選択内容 | 理由 | 影響範囲 |
|---------|---------|------|---------|
| personality_results スコア格納 | `personality_traits` JSONB | スキーマの柔軟性 | DB, 型, オンボーディング, ツイン情報, コミュニティ |
| Free chat プロトコル | SSE (Server-Sent Events) | HTTP互換、Edge Functionとの相性 | chat EF, チャット画面 |
| 気分データのSSoT | `mood_records` テーブル | journal_entries.mood廃止 | ツイン情報, 日記統合 |
| twin_profiles_public | VIEW | 冗長データ排除、同期不要 | コミュニティ, DB |
| WebSocket | wss:// (nginx + 自己署名証明書) | MVPでもTLS必須 | websocket-client, cloud-init, provision EF |
| subscription status | `trial` + `cancelled` 追加 | RevenueCat用語統一 | subscriptions, useSubscription, Webhook |
| Community AI モデル | GPT-4o mini | コスト最適化 | generate-twin-conversation EF |

---

## 5. リスク・依存関係マトリクス

### 外部依存リスク

| 外部サービス | リスク | 影響度 | 軽減策 |
|------------|--------|--------|--------|
| DigitalOcean API | レート制限、リージョン容量枯渇 | 高 | Exponential backoff。代替リージョンフォールバック検討。 |
| OpenAI API | レート制限、API障害、コスト高騰 | 高 | フォールバックメッセージ、リトライ、トークン監視。GPT-4o mini。 |
| RevenueCat SDK | Webhook遅延、サンドボックス差異 | 中 | 冪等性チェック。サンドボックステスト必須。ローカルキャッシュ。 |
| Apple App Store | 審査リジェクト | 中 | アカウント削除要件遵守。利用規約・PP整備。 |
| Expo Push | トークン登録失敗、配信遅延 | 低 | サイレントリトライ。通知は補助機能。 |

### Agent間依存リスク

| 依存関係 | リスク | 軽減策 |
|---------|--------|--------|
| Agent A (型定義) → 全Agent | 型変更の波及 | Phase 0でT005を最優先 |
| Agent B (Webhook) → Agent C (provision/destroy) | ペイロード認識齟齬 | 仕様書定義を契約。モックテスト。 |
| Agent C (chat EF) → Agent D (日記統合UI) | Metadata形式不一致 | ChatMessageMetadata型を先に確定。 |
| Agent D (コミュニティUI) → Agent C (generate-twin-conversation) | レスポンス形式齟齬 | TwinConversation型を契約。モック先行開発。 |

### 技術リスク

| リスク | 影響度 | 軽減策 |
|--------|--------|--------|
| cloud-init失敗 | 高 | health-check 10分後にerror検出。設定画面から再起動可能。 |
| 自己署名証明書のiOS/Android拒否 | 高 | WebSocket証明書検証設定調査。nip.io+Let's Encrypt検討。 |
| personality_results重複データ | 低 | `ORDER BY created_at DESC LIMIT 1`で統一。 |
| Zustand persistとSupabaseの不整合 | 中 | タブ切替時に最新データ再取得。persist TTL 5分。 |

---

## 6. テスト戦略

### テストレベル定義

| レベル | ツール | 対象 | 実行タイミング |
|--------|-------|------|-------------|
| Unit Test | Jest + RNTL | Hook、Store、ユーティリティ | 各タスク完了時 |
| Integration Test | Supabase Local + Jest | Edge Function、DB、RLS | Phase完了時 |
| E2E Test | サンドボックス | 課金→プロビジョニング→チャット | Phase 4 |
| Manual Test | 実機 | UI/UX、Apple審査項目 | Phase 4 |

### Phase別テスト計画

#### Phase 0
- マイグレーション冪等性テスト（2回連続実行でエラーなし）
- RLS全テーブル検証

#### Phase 1
- `useSubscription` hook 各ステータステスト
- Freeチャットのクレジット消費・リセットロジック
- SSEストリーミングパーサー
- webhook冪等性チェック

#### Phase 2
- 相性スコア計算テスト
- use-journal-prompt: 6時間判定、1日1回制限
- 気分記録upsertロジック

#### Phase 3
- WebSocketクライアント: wss://接続、再接続、フォールバック
- provision-openclaw → DO APIモック → DB更新
- generate-twin-conversation → 24時間レート制限

#### Phase 4 (E2E)
- ログイン→オンボーディング→課金→OpenClaw→チャット（サンドボックス）
- 解約→destroy→Freeダウングレード
- アカウント削除→全データ消去
- 全13画面 × 7状態（Default/Loading/Empty/Error/Offline/Free/Pro）

### テストケース導出方針

全テストケースは仕様書のAcceptance Criteria（AC）の Given/When/Then から導出する。

---

## 7. 実行順序・並列度

```
Phase 0 (3日):
  T001 + T002 + T003 + T004 + T005 + T006（全Agent A、並列可能）
  ↓
Phase 1 (7日):
  Agent A: T007, T008
  Agent B: T012, T013, T018
  Agent C: T009, T010, T011, T014, T015, T016, T017
  （Agent B + C 並列、Agent A は完了後他Phaseを支援）
  ↓
Phase 2 (5日):
  Agent C: T023, T024, T025
  Agent D: T019, T020, T021, T022, T026, T027
  （Agent C + D 並列）
  ↓
Phase 3 (5日):
  Agent C: T028, T029, T030, T031, T032, T034
  Agent D: T033, T035, T036
  （Agent C + D 並列）
  ↓
Phase 4 (4日):
  Agent A: T039, T040, T042
  Agent B+C: T037, T038
  Agent D: T041
  （全Agent並列）
```

**最大並列度: Phase 1以降 3〜4 Agent同時稼働**

---

## 変更履歴

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| 2026-02-14 | 初版作成 | Step 4: Plan |
