# 09 — AgentTeam構成・分担仕様

## ステータス: DRAFT
- 作成日: 2026-02-14
- 最終更新: 2026-02-14
- 承認状態: 未承認
- 担当: 全体

---

## 1. チーム構成

### 1.1 Agent一覧

| Agent ID | 名称 | 役割 | 担当範囲 |
|---------|------|------|---------|
| **A** | Foundation | 基盤構築 | shared/, services/, config/, auth, レイアウト |
| **B** | Subscription | 課金担当 | subscription/, (paywall)/, RevenueCat全般 |
| **C** | Core AI | AIコア機能 | chat/, onboarding/, openai/, Edge Functions(chat, personality) |
| **D** | Engagement | エンゲージメント | journal/, insights/, 通知, Edge Functions(journal, insight, notification) |

### 1.2 依存関係図

```
Phase 0 (Day 1-2)
┌─────────┐
│ Agent A  │ ← 全体の基盤を構築（他Agent全員がブロック）
│Foundation│
└────┬─────┘
     │
Phase 1 (Day 3-7)
     ├──────────────────┐
     ▼                  ▼
┌──────────┐     ┌──────────┐
│ Agent B   │     │ Agent C   │  ← 並列開始
│Subscription│    │ Core AI   │
└────┬──────┘     └────┬──────┘
     │                  │
Phase 2 (Day 8-18)      │
     │                  ├──────────────┐
     │                  │              ▼
     │                  │       ┌──────────┐
     │                  │       │ Agent D   │  ← Agent C完了後に開始
     │                  │       │Engagement │
     │                  │       └──────────┘
     │                  │
Phase 3 (Day 19-28)     │
     └──────────┬───────┘
                ▼
         統合テスト・リリース準備
```

---

## 2. 各Agentの詳細仕様

### 2.1 Agent A: Foundation

#### 担当ファイル
```
src/shared/                    # 全ファイル（作成・管理）
src/services/supabase/         # Supabase接続
src/services/analytics/        # アナリティクス
src/config/                    # 全ファイル
app/_layout.tsx                # Root Layout
app/+not-found.tsx
app/(auth)/                    # 全ファイル
supabase/migrations/           # DBマイグレーション
CLAUDE.md
```

#### 責務
1. Expoプロジェクト初期化
2. ディレクトリ構成構築
3. 共通型定義（types/）— **Agent間契約の管理者**
4. 共通hooks（useSubscription, useUser）の空実装
5. Supabase Auth + DB設定
6. 認証画面
7. ルーティングガード（_layout.tsx）
8. DBマイグレーション

#### 成果物（他Agentへの提供物）
- `src/shared/types/*.ts` — 全型定義
- `src/shared/hooks/use-subscription.ts` — Entitlementチェックインターフェース
- `src/shared/hooks/use-user.ts` — ユーザー情報取得インターフェース
- `src/services/supabase/client.ts` — Supabaseクライアント
- `src/config/env.ts` — 環境変数

### 2.2 Agent B: Subscription

#### 担当ファイル
```
src/features/subscription/     # 全ファイル
src/services/revenuecat/       # 全ファイル
app/(paywall)/                 # 全ファイル
supabase/functions/webhook-revenuecat/
```

#### 責務
1. RevenueCat SDK初期化
2. Offering取得・表示
3. ペイウォール画面実装
4. useSubscription hookの本実装
5. 初回限定オファーロジック
6. カウントダウンタイマー
7. Webhook Edge Function
8. 解約防止フロー
9. クレジットパック購入
10. 課金イベントトラッキング

#### 依存関係
- Agent A: `shared/types/subscription.ts`, `shared/hooks/use-subscription.ts`（インターフェース）
- Agent A: `services/supabase/client.ts`

### 2.3 Agent C: Core AI

#### 担当ファイル
```
src/features/chat/             # 全ファイル
src/features/onboarding/       # 全ファイル
src/services/openai/           # 全ファイル
app/(onboarding)/              # 全ファイル
app/(tabs)/index.tsx           # チャット画面
supabase/functions/chat/
supabase/functions/personality-analyze/
supabase/functions/_shared/openai.ts
```

#### 責務
1. オンボーディングフロー全画面
2. 性格診断ロジック
3. AI性格分析Edge Function
4. AIチャット画面
5. チャットEdge Function（ストリーミング）
6. システムプロンプト設計
7. チャット上限管理
8. コンテキスト構築ロジック

#### 依存関係
- Agent A: `shared/types/`, `shared/hooks/`, `services/supabase/`
- Agent B: `shared/hooks/use-subscription.ts`（Entitlementチェック、本実装）

### 2.4 Agent D: Engagement

#### 担当ファイル
```
src/features/journal/          # 全ファイル
src/features/insights/         # 全ファイル
src/features/settings/         # 全ファイル
app/(tabs)/journal.tsx
app/(tabs)/insights.tsx
app/(tabs)/settings.tsx
supabase/functions/journal-reflect/
supabase/functions/generate-insight/
supabase/functions/daily-notification/
```

#### 責務
1. 日記機能（CRUD + AI振り返り）
2. 感情トラッキング（mood_records）
3. 洞察タブ（気分グラフ、デイリー洞察、トピック分析）
4. 月次レポート生成（クレジット消費）
5. 設定画面
6. プッシュ通知Edge Function

#### 依存関係
- Agent A: `shared/types/`, `shared/hooks/`, `services/supabase/`
- Agent B: `shared/hooks/use-subscription.ts`（Entitlementチェック）
- Agent C: `services/openai/client.ts`（共有OpenAI設定）

---

## 3. Agent間のルール

### 3.1 コード所有権

| ルール | 説明 |
|--------|------|
| features/ は担当Agentのみ変更可 | Agent Cが features/journal/ を変更してはいけない |
| shared/ の変更はAgent Aが管理 | 他AgentはPR/提案としてAgent Aに依頼 |
| services/ は担当APIのみ | Agent Bが services/openai/ を触ってはいけない |
| 型定義の変更は全Agent合意 | shared/types/ の変更は全Agentに影響するため事前確認 |

### 3.2 共有リソースの変更プロトコル

```
1. 変更が必要なAgentが変更提案を記述
2. Agent A が影響範囲を確認
3. 影響を受けるAgent全員が合意
4. Agent A が変更を実施
5. 全Agentに変更を通知
```

### 3.3 インターフェース凍結タイミング

| フェーズ | 凍結対象 |
|---------|---------|
| Phase 0 完了時 | shared/types/ 全型定義 |
| Phase 1 中盤 | shared/hooks/ インターフェース |
| Phase 2 開始時 | Edge Function のリクエスト/レスポンス型 |

---

## 4. 開発フェーズとAgent稼働

### 4.1 ガントチャート

```
         Day1-2    Day3-7    Day8-14    Day15-18   Day19-24   Day25-28
Agent A  ████████  ████████  ░░░░░░░░   ░░░░░░░░   ████████   ████████
Agent B            ████████  ████████   ████████   ████████   ████████
Agent C            ████████  ████████   ████████   ░░░░░░░░   ████████
Agent D                      ████████   ████████   ████████   ████████

████ = アクティブ  ░░░░ = サポート/レビュー
```

### 4.2 各フェーズの完了条件

| フェーズ | 完了条件 |
|---------|---------|
| Phase 0 | 型定義・空hookが定義済み、Expo起動成功 |
| Phase 1 | 認証動作、ペイウォール表示、Entitlementチェック動作 |
| Phase 2 | オンボーディング→チャット→日記→洞察の一連フロー動作 |
| Phase 3 | 課金最適化、E2Eテスト通過、ストア申請準備完了 |

---

## 5. タスク一覧（tasksコマンド変換用）

### Phase 0: プロジェクト基盤（Day 1-2）

| ID | タスク | Agent | サイズ | ブロッカー | 完了条件 |
|----|-------|-------|--------|----------|---------|
| T001 | Expoプロジェクト初期化 + Router設定 | A | S | - | expo start成功 |
| T002 | ディレクトリ構成セットアップ | A | S | T001 | 全ディレクトリ作成済み |
| T003 | 共通型定義 | A | M | T002 | types/配下の全型定義完了 |
| T004 | shared hooks インターフェース定義 | A | M | T003 | useSubscription, useUser空実装 |
| T005 | CLAUDE.md配置 | A | S | T002 | ファイル配置済み |
| T006 | テーマ・定数・環境変数設定 | A | S | T002 | config/配下完了 |

### Phase 1: 認証 + 課金基盤（Day 3-7）

| ID | タスク | Agent | サイズ | ブロッカー | 完了条件 |
|----|-------|-------|--------|----------|---------|
| T007 | Supabase プロジェクト作成 + マイグレーション | A | M | T003 | 全テーブル作成済み |
| T008 | Supabase Auth + 認証画面 | A | M | T007 | ソーシャルログイン動作 |
| T009 | ルーティングガード実装 | A | M | T008 | 認証状態による画面制御動作 |
| T010 | RevenueCat SDK導入 + 初期化 | B | M | T004 | SDK初期化成功 |
| T011 | useSubscription 本実装 | B | M | T010 | Entitlement状態取得動作 |
| T012 | ペイウォール画面実装 | B | L | T011 | フルスクリーンペイウォール動作 |
| T013 | 初回限定オファー + カウントダウン | B | M | T012 | 24時間タイマー動作 |

### Phase 2: コア機能MVP（Day 8-18）

| ID | タスク | Agent | サイズ | ブロッカー | 完了条件 |
|----|-------|-------|--------|----------|---------|
| T014 | OpenAI API共通設定 | C | S | T004 | Edge Function共通設定完了 |
| T015 | 性格診断Edge Function | C | M | T014 | API正常レスポンス |
| T016 | オンボーディング全画面 | C | L | T015, T009 | 4画面遷移動作 |
| T017 | チャットEdge Function（ストリーミング） | C | L | T014 | SSEストリーミング動作 |
| T018 | チャット画面 | C | L | T017, T011 | チャットUI + 上限制御動作 |
| T019 | システムプロンプト設計 | C | M | T015 | パーソナライズ応答確認 |
| T020 | オンボーディング→ペイウォール統合 | B+C | M | T012, T016 | 一連フロー動作 |
| T021 | 日記機能（CRUD + AI振り返り） | D | L | T014, T011 | 日記作成→AI振り返り表示 |
| T022 | 感情トラッキング | D | M | T021 | 気分記録→グラフ表示 |
| T023 | 洞察タブ（気分グラフ + デイリー洞察） | D | L | T022 | 洞察表示動作 |
| T024 | 設定画面 | D | M | T011 | プロフィール・サブスク情報表示 |
| T025 | プッシュ通知（朝の挨拶） | D | M | T008 | 通知受信確認 |

### Phase 3: 課金最適化 + リリース（Day 19-28）

| ID | タスク | Agent | サイズ | ブロッカー | 完了条件 |
|----|-------|-------|--------|----------|---------|
| T026 | ペイウォールUI最適化 | B | M | T020 | 比較表・タイマー実装 |
| T027 | RevenueCat Experiments設定 | B | S | T026 | A/Bテスト設定完了 |
| T028 | 課金イベントトラッキング | B | M | T026 | 全イベント計測可能 |
| T029 | Webhook Edge Function | B | M | T011 | イベント→DB反映動作 |
| T030 | 解約防止フロー | B | M | T011 | ダイアログ表示動作 |
| T031 | 月次レポート（クレジット消費） | D | M | T023 | レポート生成 + クレジット減算 |
| T032 | E2Eテスト（課金フロー） | 全 | L | T020 | 自動テスト通過 |
| T033 | E2Eテスト（コア機能） | 全 | M | T018, T021 | 自動テスト通過 |
| T034 | App Store申請準備 | A | M | T032 | 素材準備完了 |
| T035 | ASO基本設定 | A | S | T034 | キーワード・スクショ最適化 |

---

## 6. 検証条件

- [ ] 全Agentが担当ファイル以外を変更していないこと
- [ ] shared/types/ の型定義がPhase 0で凍結されていること
- [ ] Agent間の依存関係が正しく管理されていること
- [ ] 各Phaseの完了条件が満たされていること
- [ ] 統合テストで全機能が連携動作すること
