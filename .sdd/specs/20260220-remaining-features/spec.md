# SDD Spec: Remaining Features Completion

## Overview
OpenClaw統合完了後の残作業を仕様駆動開発（SDD）→テスト駆動開発（TDD）で完成させる。

## Scope

### Feature 1: Dead Code Cleanup — OpenAI Client
**Priority**: S | **Agent**: A (Foundation)

`src/services/openai/client.ts` は未使用の死コード。チャットは Edge Function `chat/index.ts` 経由で直接動作している（Task #19/#21 は Edge Function で実装済み）。

#### Acceptance Criteria
- AC-1.1: `src/services/openai/client.ts` が削除されている
- AC-1.2: 同ファイルへの import が存在しない
- AC-1.3: `tsc --noEmit` がエラーなしで通る

---

### Feature 2: Twin Screen — Real Data Integration
**Priority**: M | **Agent**: D (Engagement)

Twin画面 `app/(tabs)/twin.tsx` が `MOCK_BIG_FIVE` ハードコードではなく、Supabase `personality_results` テーブルから実データを取得して表示する。

#### Acceptance Criteria
- AC-2.1: `personality_results` テーブルからユーザーのBig Fiveスコアを取得する
- AC-2.2: データ未取得時はローディングスピナーを表示する
- AC-2.3: `personality_results` が存在しない場合、「性格診断を受けてください」メッセージを表示する
- AC-2.4: SOUL.md ボタン押下時、OpenClawインスタンスの `soul_md` を取得して表示する（Alert → モーダル）
- AC-2.5: Big Fiveスコアは 0-100 の数値をパーセンテージバーで表示する

#### TDD Test Cases
```
describe('Twin Screen - Real Data')
  it('fetches personality_results from Supabase on mount')
  it('displays loading spinner while fetching')
  it('displays real Big Five scores from personality_results')
  it('shows prompt when no personality_results exist')
  it('displays SOUL.md content in modal when button pressed')
```

---

### Feature 3: Community Feature — Full Implementation
**Priority**: L | **Agent**: A (Foundation) + D (Engagement)

コミュニティ機能のDB→バックエンド→フロントエンド完全実装。
仕様書 `specs/api/database.md` #17-#19 で定義済みの communities/community_members/community_messages テーブルを作成し、MOCK データを実データに置き換える。

#### 3a. DB Migration
- AC-3.1: `communities` テーブルが作成される（specs/api/database.md #17 準拠）
- AC-3.2: `community_members` テーブルが作成される（#18 準拠）
- AC-3.3: `community_messages` テーブルが作成される（#19 準拠）
- AC-3.4: 全テーブルに RLS ポリシーが適用される
- AC-3.5: `updated_at` トリガーが `communities` に適用される
- AC-3.6: デフォルトコミュニティ3件がシードされる

#### 3b. Community Service Client
- AC-3.7: `src/services/community/client.ts` が作成される
- AC-3.8: `listCommunities()` — コミュニティ一覧取得（member_count 付き）
- AC-3.9: `createCommunity()` — コミュニティ作成
- AC-3.10: `joinCommunity()` — コミュニティ参加
- AC-3.11: `leaveCommunity()` — コミュニティ退出
- AC-3.12: `getCommunityMessages()` — メッセージ取得

#### 3c. Community UI
- AC-3.13: Community画面が実データで表示される（MOCK_COMMUNITIES 削除）
- AC-3.14: community-create.tsx の handleCreate が Supabase に保存する
- AC-3.15: コミュニティカードタップで詳細/会話画面に遷移する
- AC-3.16: Pull-to-refresh で一覧を再取得できる

#### TDD Test Cases
```
describe('Community Service Client')
  it('lists communities with member count')
  it('creates a community with valid data')
  it('rejects community creation with empty name')
  it('allows user to join a community')
  it('prevents duplicate join')
  it('allows user to leave a community')
  it('fetches community messages in order')

describe('Community Screen')
  it('renders real communities from Supabase')
  it('navigates to create screen on plus button')
  it('shows pro upgrade banner for free users')

describe('Community Create Screen')
  it('submits form data to Supabase')
  it('disables submit when name is empty')
  it('navigates back after successful creation')
```

---

### Feature 4: Analytics SDK Integration
**Priority**: M | **Agent**: A (Foundation)

`src/services/analytics/tracker.ts` の console.log スタブを PostHog SDK に差し替え。
既存の型安全なイベントヘルパー関数はそのまま維持し、`trackEvent` 内部実装のみ変更。

#### Acceptance Criteria
- AC-4.1: `posthog-react-native` SDK がインストールされている
- AC-4.2: `trackEvent()` が PostHog にイベントを送信する
- AC-4.3: `__DEV__` 環境では PostHog + console.log 両方に送信
- AC-4.4: App Tracking Transparency (iOS) の許諾を取得してから初期化する
- AC-4.5: env.ts に `EXPO_PUBLIC_POSTHOG_API_KEY` が追加されている
- AC-4.6: 既存の EVENT_NAMES と型安全ヘルパーは変更しない

#### TDD Test Cases
```
describe('Analytics Tracker - PostHog')
  it('initializes PostHog with API key')
  it('sends event to PostHog on trackEvent call')
  it('includes event properties in PostHog call')
  it('does not crash when PostHog is not initialized')
  it('logs to console in __DEV__ mode')
```

---

### Feature 5: Feature Module Extraction
**Priority**: M | **Agent**: D (Engagement)

画面ファイル（`app/`）にインラインされているビジネスロジックを `src/features/` に抽出。

#### Acceptance Criteria
- AC-5.1: チャットの WebSocket/Edge Function ロジックが `src/features/chat/hooks/use-chat.ts` に抽出される
- AC-5.2: Twin画面のデータ取得ロジックが `src/features/insights/hooks/use-twin-data.ts` に抽出される
- AC-5.3: Community画面のロジックが `src/features/community/hooks/use-communities.ts` に抽出される
- AC-5.4: 各画面ファイルは hooks を呼び出すだけの薄いレイヤーになる
- AC-5.5: `tsc --noEmit` がエラーなしで通る
- AC-5.6: 既存の動作に変更がない（リグレッションなし）

#### TDD Test Cases
```
describe('useChat hook')
  it('manages message state')
  it('sends message via WebSocket when connected')
  it('falls back to Edge Function when WebSocket unavailable')
  it('handles streaming text updates')

describe('useTwinData hook')
  it('fetches personality results')
  it('returns loading state')
  it('returns null when no data')

describe('useCommunities hook')
  it('fetches community list')
  it('creates community')
  it('joins community')
```

---

## Execution Order (TDD Pipeline)

```
Phase 1 — Foundation (parallel, no dependencies)
  [T1] Dead code cleanup (S)
  [T2] Community DB migration (S)
  [T3] Analytics SDK install + config (S)

Phase 2 — TDD: Write Tests (parallel, blocked by Phase 1)
  [T4] Write tests: Twin real data
  [T5] Write tests: Community service
  [T6] Write tests: Analytics tracker

Phase 3 — TDD: Implementation (parallel, blocked by Phase 2)
  [T7] Implement: Twin real data (pass T4 tests)
  [T8] Implement: Community service + UI (pass T5 tests)
  [T9] Implement: Analytics PostHog (pass T6 tests)

Phase 4 — Refactoring (blocked by Phase 3)
  [T10] Feature module extraction (chat, twin, community hooks)

Phase 5 — Review (blocked by Phase 4)
  [T11] Code review
  [T12] Codex cross-model review
```

## Out of Scope
- E2E テストスイート（別SDD）
- WSS/TLS 本番設定（インフラタスク）
- テストカバレッジ拡大（別チケット）
