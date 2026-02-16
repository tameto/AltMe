---
name: spec-driven-dev
description: |
  仕様駆動開発スキル（spec-kit統合版）。「仕様書を書きたい」「スペックを作成」「仕様駆動で開発」「specを書いて」「実装を始めたい」「tasksに落としたい」「要件定義したい」「PRD作成」などのリクエスト時に使用。
  GitHub spec-kit のワークフロー（constitution → specify → clarify → plan → tasks → implement）を採用。
  徹底した質問フェーズで要件を明確化し、仕様書を生成→tasksに変換→AgentTeamで実装開始する。
  仕様書はAgent別に分割され、各Agentが自分の担当仕様だけを見て実装できる形にする。
  画面設計・UI/UXもこのフェーズで考慮する（ui-designerスキルと連携）。
---

# 仕様駆動開発スキル (Spec-Driven Development)

> spec-kit + Agent Team 最適化 + デザイン統合。9ステップの自動実行パイプライン。

**核心原則：仕様書がコードに仕えるのではない。コードが仕様書に仕える。**

## パイプライン全体像

```
Step 1: Constitution ── 原則定義          ── specs/constitution.md 生成
  ↓
Step 2: Specify     ── 仕様書自動生成     ── specs/features/*.md, api/*.md 生成
  ↓
Step 3: Clarify     ── 曖昧さ自動スキャン ── specs/ を即時更新
  ↓
Step 4: Plan        ── 技術計画生成       ── specs/plan.md 生成
  ↓
Step 5: Design      ── 画面設計・デザイン ── designs/*.pen, specs/screens/*.md 生成
  ↓
Step 6: Tasks       ── タスク自動生成     ── TaskCreate API で登録
  ↓
Step 7: Implement   ── Agent Team 並列実装 ── コード生成
  ↓
Step 8: Review      ── 多層品質検証       ── レビュー報告
  ↓
Step 9: Reconcile   ── 仕様書同期        ── specs/ を実装に同期
```

### spec-kit との差分（AltMe 拡張）

| spec-kit (6ステップ) | AltMe (9ステップ) | 拡張内容 |
|---------------------|------------------|---------|
| constitution | Step 1: Constitution | 同等 |
| specify | Step 2: Specify | テンプレートから**自動生成** |
| clarify | Step 3: Clarify | 9カテゴリ**自動スキャン**→質問生成 |
| plan | Step 4: Plan | Constitution Check ゲート付き |
| — | **Step 5: Design** | Pencil .pen デザイン + 画面仕様 |
| tasks | Step 6: Tasks | TaskCreate API で**自動登録** + 粒度チェック |
| implement | Step 7: Implement | **Agent Team 並列**実行 |
| — | **Step 8: Review** | 3層レビュー（コード/セキュリティ/QA） |
| — | **Step 9: Reconcile** | 仕様書を実装に自動同期 |

---

## Step 1: Constitution（原則定義）

> プロジェクトの「建築DNA」を定義する。全ステップでこの原則に照らしてゲートチェックする。

### Entry Gate
- なし（最初のステップ）

### DO: 自動実行アクション

1. **CLAUDE.md を読む** → プロジェクト概要・技術スタック・コーディング規約を抽出
2. **既存の specs/ を読む** → 既にある場合はスキップ判定
3. **ユーザーに確認**:
   - 「プロジェクトの最も重要な原則は？」（5〜7個）
   - 前段スキル（monetize-app-plan, agent-team-design）の出力があれば取り込む
4. **`specs/constitution.md` を生成**:

```markdown
# Constitution — [プロジェクト名]

## 作成日: [YYYY-MM-DD]

## アーキテクチャ原則

### 1. [原則名]
[説明: なぜこの原則が必要か]

### 2. [原則名]
...

## スコープ
### やること
- ...

### やらないこと
- ...

## 品質基準
- パフォーマンス: [目標]
- セキュリティ: [基準]
- アクセシビリティ: [基準]

## 命名規約・コーディング規約
→ CLAUDE.md を参照
```

### Output
- `specs/constitution.md`

### Exit Gate
- ユーザーが原則を承認
- 5〜7個の原則が定義されている
- やること/やらないことが明記されている

---

## Step 2: Specify（仕様書自動生成）

> テンプレートから仕様書を**自動生成**する。手動コピーではない。

### Entry Gate
- `specs/constitution.md` が存在する

### DO: 自動実行アクション

#### 2-1. 全体仕様の生成
1. CLAUDE.md + constitution.md から機能リストを抽出
2. **`specs/overview.md` を生成** — `references/spec-format.md` の overview テンプレートを使用
3. ユーザーに機能リストを提示し確認

#### 2-2. 画面一覧の生成
1. 機能リストから必要な画面を洗い出す
2. **`specs/screens/screen-list.md` を生成** — ナビゲーション構造、画面遷移図を含む
3. ユーザーに画面一覧を提示し確認

#### 2-3. データベース仕様の生成
1. 機能・画面からエンティティを抽出
2. **`specs/api/database.md` を生成** — テーブル定義、RLS、インデックスを含む

#### 2-4. 機能別仕様の生成（最重要）
**各機能ごとに**以下を実行:
1. `references/spec-format.md` の features テンプレートを読む
2. **`specs/features/[name].md` を生成**:
   - 目的（WHY）
   - ユーザーストーリー（INVEST 準拠、優先度 P1/P2/P3）
   - 受け入れ条件（Given-When-Then 形式、各ストーリー 3〜6 個）
   - 画面仕様（入力/出力/状態遷移/全状態）
   - エッジケース・エラーケース
   - 担当 Agent
3. **品質チェック**:
   - WHATとWHY に集中しているか（HOW が混入していないか）
   - [NEEDS CLARIFICATION] マーカーは最大 3 つまで
   - 成功基準は測定可能・技術非依存・ユーザー中心か
   - 受け入れ条件は Given-When-Then 形式か

#### 2-5. API・横断仕様の生成
1. **`specs/api/api-endpoints.md`** — エンドポイント一覧
2. **`specs/api/external-services.md`** — 外部サービス連携
3. **`specs/shared/navigation.md`** — ナビゲーション構造
4. **`specs/shared/error-handling.md`** — エラーハンドリング方針

#### 生成順序（依存関係順）
```
1. constitution.md（Step 1 で完了済み）
2. overview.md
3. screens/screen-list.md
4. api/database.md
5. features/*.md（最重要 — ここに最も時間をかける）
6. api/*.md
7. shared/*.md
```

### Output
- `specs/overview.md`
- `specs/screens/screen-list.md`
- `specs/features/*.md`（機能数分）
- `specs/api/database.md`
- `specs/api/api-endpoints.md`
- `specs/api/external-services.md`
- `specs/shared/navigation.md`
- `specs/shared/error-handling.md`

### Exit Gate
- 全仕様書が生成されている
- [NEEDS CLARIFICATION] が合計 10 個以下
- 各機能仕様に受け入れ条件が 3 個以上ある
- ユーザーに仕様書一覧を提示し確認

---

## Step 3: Clarify（曖昧さ自動スキャン）

> **このステップが仕様品質の要。全仕様書を自動スキャンし、曖昧さを検出して質問を生成する。**

### Entry Gate
- Step 2 の仕様書が生成済み

### DO: 自動実行アクション

#### 3-1. 全仕様書の自動スキャン
**全 `specs/` ファイルを読み込み**、以下の 9 カテゴリで曖昧さを検出:

| # | カテゴリ | 検出パターン |
|---|---------|------------|
| 1 | 機能スコープ | 境界が不明確、「等」「など」で終わるリスト |
| 2 | データモデル | エンティティ間のリレーション未定義、制約なし |
| 3 | UXフロー | 画面遷移の分岐が不明、エラー時の動線なし |
| 4 | 品質特性 | 「速い」「良い」等の曖昧形容詞、数値基準なし |
| 5 | 統合 | 外部 API の失敗時の動作未定義 |
| 6 | エッジケース | 境界値未定義、同時操作の考慮なし |
| 7 | 制約 | 技術/ビジネス制約の暗黙の前提 |
| 8 | 用語 | 同じ概念に複数の用語が使われている |
| 9 | 完了シグナル | 「完了」の定義が曖昧 |

#### 3-2. 質問の生成と優先順位付け
検出した曖昧さを**影響度順**にソートし、**最大 5 問**を生成:

```markdown
**Q1: [質問]** (影響度: HIGH)
カテゴリ: [9カテゴリのどれか]
影響する仕様書: specs/features/[name].md

推奨: [Option A]
理由: [なぜこれが最善か]

| オプション | 説明 | 影響 |
|-----------|------|------|
| A (推奨) | ... | ... |
| B | ... | ... |
| C | ... | ... |
```

#### 3-3. 回答の即時反映
- ユーザーの回答ごとに**該当する仕様書を即座に更新**
- [NEEDS CLARIFICATION] マーカーを解消
- 更新したセクションをユーザーに表示

#### 3-4. 複数ラウンド
仕様書が大きい場合、機能ごとに Clarify を繰り返す:
1. `overview.md` → 全体像の質問
2. `features/auth.md` → 認証の質問
3. `features/[core].md` → コア機能の質問
4. ...

ユーザーが「done」「proceed」「次へ」と言ったら即座に次のステップへ。

### Output
- 更新された `specs/` ファイル群
- Clarification Summary レポート

### Exit Gate
- 全カテゴリが Resolved / Clear / Deferred のいずれか
- [NEEDS CLARIFICATION] が 0 個
- Clarification Summary を出力

```markdown
## Clarification Summary
- 質問数: X/5 (Y ラウンド)
- 更新セクション: [リスト]

| カテゴリ | ステータス |
|---------|-----------|
| 機能スコープ | Resolved |
| データモデル | Clear |
| UXフロー | Resolved |
| 品質特性 | Resolved |
| 統合 | Deferred (Phase 2) |
| エッジケース | Resolved |
| 制約 | Clear |
| 用語 | Resolved |
| 完了シグナル | Resolved |
```

---

## Step 4: Plan（技術計画生成）

> 確定した仕様から技術計画を自動生成する。

### Entry Gate
- Step 3 完了（[NEEDS CLARIFICATION] = 0）

### DO: 自動実行アクション

#### 4-1. リサーチ（必要な場合）
- 依存技術の調査
- 外部 API の制約確認
- 結果を `specs/research.md` に集約

#### 4-2. 技術計画の生成
**`specs/plan.md` を生成**:

```markdown
# Implementation Plan

**日付:** [YYYY-MM-DD]
**ブランチ:** [branch-name]
**仕様書:** specs/

## サマリー
[主要要件 + 技術アプローチの要約]

## 技術コンテキスト
- 言語/フレームワーク: [...]
- 依存パッケージ: [...]
- ストレージ: [...]
- テスト: [...]
- ターゲットプラットフォーム: [...]
- パフォーマンス目標: [...]
- 制約: [...]

## Constitution Check
| 原則 | 状態 | 備考 |
|------|------|------|
| [原則1] | PASS | ... |
| [原則2] | PASS | ... |

## Agent 別設計

### Agent A: Foundation
- 担当: shared/, services/, config/
- 技術決定: [...]
- リスク: [...]

### Agent B: Subscription
- 担当: subscription/
- 技術決定: [...]
- リスク: [...]

### Agent C: Core AI
- 担当: chat/, onboarding/, openclaw/
- 技術決定: [...]
- リスク: [...]

### Agent D: Engagement
- 担当: journal/, insights/, settings/
- 技術決定: [...]
- リスク: [...]

## データモデル
→ specs/api/database.md を最終確定

## API 契約
→ specs/api/api-endpoints.md を最終確定

## リスクと緩和策
| リスク | 確率 | 影響 | 緩和策 |
|--------|------|------|--------|
| ... | ... | ... | ... |
```

#### 4-3. Constitution Check（ゲート）
技術計画が constitution.md の原則に準拠しているか再チェック。
違反がある場合はユーザーに正当化を求める。

#### 4-4. ユーザーレビュー
技術計画をユーザーに提示:
- 技術選定は妥当か
- Agent 別の設計は適切か
- リスクの見落としはないか

### Output
- `specs/plan.md`
- `specs/research.md`（必要な場合）
- 更新された `specs/api/database.md`, `specs/api/api-endpoints.md`

### Exit Gate
- Constitution Check 全項目 PASS
- ユーザーが技術計画を承認
- データモデルと API 契約が最終確定

---

## Step 5: Design（画面設計・デザイン）

> **spec-kit にはないステップ。** 仕様書と技術計画が確定した状態でビジュアルデザインを作成する。

### Entry Gate
- Step 4 完了（技術計画承認済み）
- `specs/screens/screen-list.md` が存在する

### DO: 自動実行アクション

#### 5-1. デザイントークンの定義
1. constitution.md のブランドカラー・デザイン方針を確認
2. **`designs/variables.pen` を作成** — Pencil MCP の `set_variables` で:
   - カラーパレット（primary, secondary, background, surface, text, error, success, warning）
   - スペーシングスケール（4/8/12/16/24/32/40/48）
   - タイポグラフィスケール（Display 32, Heading 24, Title 20, Body 16, Caption 14, Small 12）
   - ダーク/ライトテーマ対応

#### 5-2. 共通コンポーネントの設計
1. 仕様書から必要なコンポーネントを抽出（Button, Input, Card, Modal, etc.）
2. **`designs/components.pen` を作成** — `reusable: true` で定義
3. 各コンポーネントの状態を設計（Default/Pressed/Disabled/Loading）

#### 5-3. 画面デザインの作成
**`specs/screens/screen-list.md` の各画面について**:
1. 対応する `specs/features/[name].md` を読む
2. 情報アーキテクチャを設計（プライマリ/セカンダリコンテンツの優先順位）
3. **`designs/[name].pen` を作成** — Pencil MCP の `batch_design` で:
   - Default 状態フレーム
   - Loading 状態フレーム（スケルトン）
   - Empty 状態フレーム（イラスト + CTA）
   - Error 状態フレーム（エラーメッセージ + リトライ）
4. **`specs/screens/[name].md` を生成** — 画面仕様書:
   - レイアウト構成
   - コンポーネント構成
   - 状態管理
   - インタラクション
   - アクセシビリティ要件

#### 5-4. デザインレビュー
以下のチェックリストで検証:

**ビジュアル:**
- [ ] カラーがデザイントークンを使用しているか
- [ ] タイポグラフィスケールに準拠しているか
- [ ] スペーシングスケールに準拠しているか

**レイアウト:**
- [ ] レスポンシブ対応（iPhone SE〜iPhone 15 Pro Max）
- [ ] セーフエリアが考慮されているか
- [ ] キーボード表示時のレイアウト

**アクセシビリティ:**
- [ ] コントラスト比 4.5:1 以上
- [ ] タップターゲット 44pt 以上
- [ ] テキスト最小サイズ 12pt

**状態網羅:**
- [ ] Default / Loading / Empty / Error の全状態
- [ ] オフライン時の表示

**仕様書整合:**
- [ ] 仕様書の全要素がデザインに含まれているか
- [ ] ナビゲーション遷移が仕様書と一致しているか
- [ ] 受け入れ条件の UI 要素が全てデザインに存在するか

#### 5-5. ユーザーレビュー
デザインのスクリーンショット（`get_screenshot`）をユーザーに提示:
- 全体の印象
- 情報の優先順位
- 足りない要素
- 変更したい箇所

フィードバックを反映してデザインを更新。

### Output
- `designs/variables.pen`
- `designs/components.pen`
- `designs/[screen-name].pen`（画面数分）
- `specs/screens/[screen-name].md`（画面数分）

### Exit Gate
- 全画面のデザインが作成されている
- デザインレビューチェックリスト全項目 PASS
- ユーザーがデザインを承認
- 各画面の specs/screens/*.md が生成されている

---

## Step 6: Tasks（タスク自動生成）

> 仕様書 + デザインからタスクを**自動生成**し、TaskCreate API で登録する。

### Entry Gate
- Step 5 完了（デザイン承認済み）
- 全仕様書が確定（[NEEDS CLARIFICATION] = 0）

### DO: 自動実行アクション

#### 6-1. 仕様書パース
全 `specs/features/*.md` を読み込み、受け入れ条件（AC）を抽出:
- 1 AC ≒ 1 タスク（基本単位）
- AC が大きすぎる場合は分割、小さすぎる場合は統合

#### 6-2. タスク生成（TaskCreate API）
各タスクについて **TaskCreate** を実行:

```
subject: "[動詞]する - [対象]"
description: |
  参照仕様: specs/features/[name].md#AC-[N]
  デザイン: designs/[name].pen#[フレームID]
  担当Agent: Agent [X]
  依存: [タスクID]
  サイズ: S/M/L
  完了条件:
    - [仕様書の AC をそのまま転記]
    - [テストが通ること]
```

#### 6-3. フェーズ構成
```
Phase 0: Setup（共有インフラ）— Agent A
  ├── shared/types/ の型定義
  ├── config/ の環境設定
  └── ナビゲーション骨格

Phase 1: Foundation（認証・課金・データベース）— 並列
  ├── Agent A: 認証フロー、DB マイグレーション
  └── Agent B: RevenueCat SDK、ペイウォール

Phase 2: Core（機能実装）— 最大並列
  ├── Agent A: サービスクライアント
  ├── Agent B: 課金 → プロビジョニング連携
  ├── Agent C: チャット、オンボーディング、Edge Functions
  └── Agent D: 日記、洞察、設定

Phase 3: Integration（統合・最適化）— 順序付き
  ├── E2E フロー統合
  ├── エラーハンドリング統合
  └── パフォーマンス最適化

Phase 4: Polish（品質向上）
  ├── アニメーション・マイクロインタラクション
  ├── オフライン対応
  └── アナリティクス実装
```

#### 6-4. 粒度チェック（自動）
生成されたタスクを `task-refinement` の基準でチェック:
- **S (1-2h, 1ファイル)**: OK
- **M (半日, 2-3ファイル)**: OK
- **L (1-2日, 複数ファイル)**: 分割を検討
- **XL (2日以上)**: **必ず分割**

hooks/task-size-check.sh が PostToolUse で自動検出。

#### 6-5. 依存関係の設定
TaskUpdate で `addBlockedBy` / `addBlocks` を設定:
- Phase 0 → Phase 1（全タスク）
- DB マイグレーション → Edge Function → フロントエンド
- shared/types/ 変更 → 依存する全タスク

#### 6-6. Agent 割り当て
TaskUpdate で `owner` を設定:
- CLAUDE.md の Agent 担当範囲に基づく
- Agent 間のタスク量バランスを確認（±20%以内）
- ブロッカータスクが 1 Agent に集中していないか

#### 6-7. ユーザー確認
以下を提示:
```
━━━━━━━━━━━━━━━━━━━━━━
Agent A: Foundation — X tasks (S:x M:x L:x)
━━━━━━━━━━━━━━━━━━━━━━
Phase 0:
  [S] T001: 型定義の作成
  [M] T002: 認証フローの実装
Phase 1:
  [M] T003: ...

━━━━━━━━━━━━━━━━━━━━━━
Agent B: Subscription — X tasks (S:x M:x L:x)
━━━━━━━━━━━━━━━━━━━━━━
...

合計: X tasks (S: x, M: x, L: x)
クリティカルパス: T001 → T003 → T007 → T012
並列実行可能: {T003, T004} / {T007, T008, T009}
```

### Output
- TaskCreate で登録されたタスクリスト
- Agent 別タスク一覧
- 依存関係グラフ
- クリティカルパス

### Exit Gate
- 全 AC がタスクにマッピングされている
- タスクに XL サイズがない
- 依存関係に循環がない
- Agent 間のタスク量が ±20% 以内
- ユーザーがタスクリストを承認

---

## Step 7: Implement（Agent Team 並列実装）

> タスクリストを Agent Team で並列実行する。

### Entry Gate
- Step 6 完了（タスクリスト承認済み）

### DO: 自動実行アクション

1. **TeamCreate** でチームを作成
2. **Agent 別にタスクを配分**（TaskUpdate で owner 設定）
3. **Phase 順に実行**:
   - Phase 0: Agent A が単独実行
   - Phase 1: Agent A + B が並列
   - Phase 2: 全 Agent が並列
   - Phase 3: 統合タスクを順序実行
4. **各 Agent の実装ルール**:
   - 自分の担当仕様書（specs/features/[name].md）を読む
   - 対応するデザイン（designs/[name].pen）を参照
   - 受け入れ条件を完了条件として実装
   - テストを書く（仕様書の AC からテストケースを導出）
   - TaskUpdate で完了マーク
5. **shared/ 変更時のルール**:
   - Agent A のみが shared/ を変更可能
   - 他 Agent は PR/提案として Agent A に依頼
   - hooks/shared-guard.sh が自動警告

### Output
- 実装されたコード
- テスト

### Exit Gate
- 全タスクが completed
- `npx tsc --noEmit` パス
- テスト通過

---

## Step 8: Review（多層品質検証）

> 4つのレビュー Agent が並列で品質検証する。Claude 3モデル + OpenAI Codex のクロスモデルレビュー。

### Entry Gate
- Step 7 完了（全タスク completed）

### DO: 自動実行アクション

4 つのレビュー Agent を**並列起動**:

| Agent | モデル | 観点 | チェック内容 |
|-------|--------|------|------------|
| **code-reviewer** | Claude Sonnet | コード品質 | 可読性、命名、重複、パフォーマンス、ベストプラクティス |
| **security-auditor** | Claude Sonnet | セキュリティ | OWASP Mobile Top 10、RLS、シークレット検出、API 保護 |
| **qa-debugger** | Claude Sonnet | QA | バグ検出、クロスバウンダリテスト、E2E 検証、状態管理 |
| **codex-reviewer** | GPT-5.3-Codex | クロスモデル | Claude の盲点補完、異なる視点でのバグ・設計ミス検出 |

**クロスモデルレビューの利点**: 単一モデルでは見逃しやすいパターンを異なるモデルが検出する。
両モデルが一致して検出した問題は信頼度が特に高い。

追加チェック:
- [ ] 型安全性（`npx tsc --noEmit` パス）
- [ ] テスト通過（`npx jest` パス）
- [ ] **デザイン整合性**: 実装が designs/*.pen と一致しているか
- [ ] **仕様書整合性**: 実装が specs/features/*.md の AC を全て満たしているか

### 問題分類
| 深刻度 | 対応 |
|--------|------|
| CRITICAL | **ブロック** — 修正必須。Step 7 に戻る |
| HIGH | 修正推奨。可能なら修正してから Step 9 へ |
| MEDIUM | 記録して次フェーズで対応 |
| LOW | バックログに追加 |

### Output
- レビュー報告書
- 発見された問題リスト

### Exit Gate
- CRITICAL な問題が 0 件
- HIGH な問題が修正済みまたは正当化済み

---

## Step 9: Reconcile（仕様書同期）

> **実装完了後に、仕様書をコードの実態に合わせて更新する。**

### Entry Gate
- Step 8 完了（CRITICAL 問題 0 件）

### DO: 自動実行アクション

担当: **doc-updater** (Haiku, spec-driven-dev スキル内蔵)

1. **差分検出**: 実装コードと `specs/` を比較
   - 仕様にあるが未実装 → 「Phase 2 へ延期」明記
   - 実装済みだが仕様にない → 仕様書に追記
   - 仕様と異なる実装 → 仕様書を実態に更新（理由を変更履歴に記録）

2. **デザイン同期**: 実装と `designs/` を比較
   - 実装時に変更した UI 要素をデザインに反映
   - 新しく追加された画面・コンポーネントをデザインに追加

3. **影響範囲チェック**:
   - `overview.md` の機能一覧を更新
   - `screens/screen-list.md` の画面一覧を更新
   - `api/database.md` のスキーマを実態に同期
   - `shared/navigation.md` のナビゲーション構造を更新

4. **Constitution 整合性**: 原則違反がないか再チェック

5. **変更履歴記録**: 各仕様書に変更ログを追記:
```markdown
## 変更履歴
| 日付 | 変更内容 | 理由 | 関連タスク |
|------|---------|------|-----------|
| YYYY-MM-DD | [変更内容] | Reconcile: 実装との同期 | T0XX |
```

6. **CLAUDE.md 更新**: 必要に応じてプロジェクト設定を反映

### Output
- 更新された `specs/` ファイル群
- 更新された `designs/` ファイル群
- Reconcile 完了報告

### Exit Gate
```
✅ Reconcile 完了
- 更新した仕様書: X 件
- 更新したデザイン: X 件
- 追記した項目: X 件
- 修正した項目: X 件
- 延期としてマークした項目: X 件
→ 仕様書・デザインは実装と完全に同期しています
```

---

## AgentTeam ワークフローマッピング

### 各ステップの担当 Agent

```
Step 1: Constitution
  └─ architect (Opus) — アーキテクチャ原則策定

Step 2: Specify
  ├─ screen-designer (Sonnet) — 画面仕様・UI 設計
  ├─ twin-interviewer (Sonnet) — 性格診断・SOUL.md 仕様
  └─ [ユーザーと対話しながら仕様書を生成]

Step 3: Clarify
  └─ [ユーザーと対話] — 9 カテゴリの曖昧さ解消

Step 4: Plan
  ├─ planner (Opus) — 実装計画作成
  └─ architect (Opus) — 技術選定・データフロー設計

Step 5: Design ★NEW
  └─ screen-designer (Sonnet) — Pencil .pen デザイン作成・レビュー

Step 6: Tasks
  └─ task-refiner (Haiku) — タスク品質検証

Step 7: Implement（並列）
  ├─ rn-mobile-dev (Sonnet)
  ├─ supabase-backend (Sonnet)
  ├─ billing-specialist (Sonnet)
  ├─ openclaw-specialist (Sonnet)
  ├─ digitalocean-infra (Sonnet)
  ├─ twin-interviewer (Sonnet)
  └─ screen-designer (Sonnet)

Step 8: Review（並列）
  ├─ code-reviewer (Sonnet)
  ├─ security-auditor (Sonnet)
  ├─ qa-debugger (Sonnet)
  └─ codex-reviewer (GPT-5.3-Codex) ★NEW

Step 9: Reconcile
  └─ doc-updater (Haiku)
```

### コスト最適化
| モデル | Agent 数 | ステップ | 用途 |
|--------|---------|---------|------|
| Opus | 2 | 1, 4 | 高度な計画・設計 |
| Sonnet | 10 | 2, 5, 7, 8 | 実装・デザイン・レビュー |
| Haiku | 2 | 6, 9 | 軽量タスク |
| GPT-5.3-Codex | 1 | 8 | クロスモデルレビュー |

### Agent-Skill 対応表
| Agent | Skill | 役割 |
|-------|-------|------|
| rn-mobile-dev | rn-mobile-dev | React Native 36 ルール |
| supabase-backend | supabase-backend | PostgreSQL 28 ルール |
| billing-specialist | revenuecat | RevenueCat SDK/API |
| openclaw-specialist | openclaw | Gateway/SOUL.md |
| digitalocean-infra | digitalocean-infra | Droplet/Docker |
| screen-designer | ui-designer, pencil-design | デザイン + Pencil |
| twin-interviewer | openclaw | SOUL.md フォーマット |
| security-auditor | security-audit | OWASP/RLS |
| qa-debugger | qa-debug | バグ検出/テスト |
| doc-updater | spec-driven-dev | 仕様書フォーマット |
| task-refiner | task-refinement | タスク品質 |
| planner | — | 汎用計画（Opus） |
| architect | — | 汎用設計（Opus） |
| code-reviewer | rn-mobile-dev | RN ベストプラクティス |
| codex-reviewer | codex-review | クロスモデルレビュー（GPT-5.3-Codex） |

---

## 参照

### コアリファレンス
- `references/spec-format.md`: 仕様書テンプレート（overview, features, screens, api, shared）
- `references/task-conversion.md`: 仕様書→タスク変換ガイド（サイズ基準、フェーズ構成）
- `references/spec-kit-workflow.md`: spec-kit 全ステップ詳細（Constitution Check、Analyze、Checklist 等）

### 要件定義リファレンス
- `references/doc-coauthoring.md`: 3 段階ドキュメント共同作成（Context Gathering → Refinement → Reader Testing）
- `references/product-requirements.md`: PRD テンプレート・13 項目バリデーション・優先順位付け（MoSCoW/WSJF/RICE）
- `references/agile-product-owner.md`: INVEST ストーリー・Given-When-Then AC・スプリント計画・ベロシティ

### 元ソース
- GitHub spec-kit: https://github.com/github/spec-kit
- Anthropic doc-coauthoring
- mcpmarket product-requirements
- alirezarezvani agile-product-owner
