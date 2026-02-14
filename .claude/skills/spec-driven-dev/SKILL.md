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

> GitHub spec-kit のメソドロジーを統合した仕様駆動開発ワークフロー。

**核心原則：仕様書がコードに仕えるのではない。コードが仕様書に仕える。**
- 仕様書に書かれていないものは作らない
- 仕様書に書かれているものは必ず作る
- 曖昧さはコードを書く前に解消する

```
monetize-app-plan → agent-team-design → [このスキル] → AgentTeam実装
 企画・設計        チーム設計          仕様書→tasks    並列開発
```

※ 単体でも使用可能。前段スキルなしでも、機能リストさえあれば仕様書を生成できる。

## ワークフロー全体像

```
Step 1: Constitution（原則定義）
  ↓
Step 2: Specify（仕様書作成）+ UI/UX設計
  ↓
Step 3: Clarify（曖昧解消・質問フェーズ）← ここが最重要
  ↓
Step 4: Plan（技術計画・リサーチ）
  ↓
Step 5: Tasks（タスク生成・Agent配分）
  ↓ (optional)
  ├→ Analyze（整合性分析 — 仕様↔計画↔タスク間の矛盾検出）
  ├→ Checklist（要件品質チェック — 「要件のユニットテスト」）
  ↓
Step 6: Implement（AgentTeam実装）
  ↓
Step 6.5: Review（コードレビュー・セキュリティ・QA）
  ↓
Step 7: Reconcile（仕様書同期）← 実装後に仕様書を最新化
```

---

## Step 1: Constitution（プロジェクト原則の定義）

プロジェクトの「建築DNA」を定義する。全ステップでこの原則に照らしてゲートチェックする。

### インプット確認

以下が揃っているか確認する：

**必須：**
- プロダクト定義（MVP機能リスト、やること/やらないこと）
- 技術スタック・ディレクトリ構成

**推奨（あればより良い仕様書になる）：**
- 課金設計（`monetize-app-plan` の出力）
- AgentTeam構成（`agent-team-design` の出力）
- CLAUDE.md

前段スキルを経由せず直接呼ばれた場合：
- 「何を作りますか？」「主要機能は？」を聞く
- 最低限の機能リストを整理してから進む

### 原則の定義

`specs/constitution.md` に以下を記載：
- プロジェクトのアーキテクチャ原則（5〜7項目）
- やること/やらないことの明確な線引き
- 品質基準（パフォーマンス、セキュリティ、アクセシビリティ）
- 命名規則、コーディング規約への参照

### Constitution Check テンプレート
```markdown
## Constitution Check
*GATE: 仕様書作成前に通過必須。技術計画後に再チェック。*

| 原則 | 状態 | 備考 |
|------|------|------|
| [原則1] | PASS/FAIL | ... |
| [原則2] | PASS/FAIL | ... |
```

---

## Step 2: Specify（仕様書の作成）

`references/spec-format.md` のフォーマットに従って仕様書を生成する。

### 仕様書の階層構造

```
specs/
├── constitution.md          # プロジェクト原則（Step 1で作成）
├── overview.md              # プロジェクト概要・全体仕様
├── features/                # 機能別仕様
│   ├── auth.md
│   ├── onboarding.md
│   ├── [core-feature].md
│   ├── subscription.md
│   └── settings.md
├── screens/                 # 画面仕様（ui-designerスキル連携）
│   ├── screen-list.md       # 全画面一覧
│   └── [screen-name].md     # 各画面の詳細
├── api/                     # API・データ仕様
│   ├── database.md          # DB スキーマ
│   ├── api-endpoints.md     # APIエンドポイント一覧
│   └── external-services.md # 外部サービス連携
└── shared/                  # 横断仕様
    ├── navigation.md        # ナビゲーション構造
    ├── error-handling.md    # エラーハンドリング方針
    └── analytics-events.md  # イベントトラッキング定義
```

### 生成順序（依存関係順）
1. `constitution.md` — プロジェクト原則
2. `overview.md` — 全体像の確定
3. `screens/screen-list.md` — 全画面の洗い出し
4. `api/database.md` — データモデルの確定
5. `features/*.md` — 機能別仕様（**最重要**）
6. `screens/*.md` — 各画面の詳細仕様
7. `api/*.md` — API仕様
8. `shared/*.md` — 横断仕様

### 仕様書の品質基準（spec-kit準拠）
- **「WHATとWHY」に集中**し、実装詳細（HOW）を避ける
- ビジネスステークホルダーが読めるレベルで記述
- **[NEEDS CLARIFICATION]** マーカーは最大3つまで（影響度順）
- 成功基準は**測定可能・技術非依存・ユーザー中心**

### 各仕様書に必須の要素
- 目的（なぜこの機能が必要か）
- ユーザーストーリー（優先度順: P1, P2, P3...、各ストーリーは独立して開発・テスト可能）
- 受け入れ条件（Given-When-Then形式）
- 画面仕様（入力/出力、状態遷移、全状態: normal/loading/empty/error）
- エッジケース・エラーケース
- 担当Agent

### 画面設計の連携
画面仕様の作成時は `ui-designer` スキルを参照：
- 情報アーキテクチャ（プライマリ/セカンダリコンテンツの優先順位）
- コンポーネント状態マトリクス（Default/Loading/Empty/Error/Disabled/Pressed）
- アクセシビリティ要件（タップターゲット44px以上、コントラスト比4.5:1以上）
- スペーシング・タイポグラフィのスケール準拠

---

## Step 3: Clarify（曖昧解消 — 質問フェーズ）

**このステップが仕様品質の要。徹底的に質問して曖昧さを排除する。**

`references/spec-kit-workflow.md` と `references/doc-coauthoring.md` を参照。

### 9つの曖昧さスキャンカテゴリ
仕様書全体を以下のカテゴリでスキャンし、曖昧な箇所を特定：

1. **機能スコープ** — 機能の境界は明確か
2. **データモデル** — エンティティ、リレーション、制約が定義されているか
3. **UXフロー** — ユーザーの操作パスが明確か（画面遷移、エッジケース含む）
4. **品質特性** — パフォーマンス、セキュリティ、信頼性の基準
5. **統合** — 外部サービスとの連携ポイント
6. **エッジケース** — 境界条件、エラーシナリオ
7. **制約** — 技術的・ビジネス的な制約
8. **用語** — 曖昧な用語の定義
9. **完了シグナル** — いつ「完了」と判断するか

### 質問の進め方
- 1セッション最大 **5問** まで（影響度順に優先）
- 各質問に**推奨オプション**と理由を添える
- 代替案をテーブルで提示

```markdown
**Q1: [質問]**

推奨: [Option A]
理由: [なぜこれが最善か]

| オプション | 説明 | 影響 |
|-----------|------|------|
| A (推奨) | ... | ... |
| B | ... | ... |
| C | ... | ... |
```

- 回答ごとに仕様書を **即座に更新**
- 低影響の曖昧さはスキップ
- ユーザーが「done」「proceed」と言ったら即座に次のステップへ

### Clarify完了レポート
```markdown
## Clarification Summary
- 質問数: X/5
- 更新セクション: [リスト]

| カテゴリ | ステータス |
|---------|-----------|
| 機能スコープ | Resolved / Clear |
| データモデル | Resolved / Deferred |
| UXフロー | ... |
```

### 複数ラウンドの質問

仕様書が大きい場合、機能ごとにClarifyを繰り返す：
1. `overview.md` → 全体像の質問
2. `features/auth.md` → 認証の質問
3. `features/[core].md` → コア機能の質問
4. ...

---

## Step 4: Plan（技術計画）

Clarifyで仕様が確定したら、技術計画を策定する。

### Phase 0: リサーチ
- 残りの [NEEDS CLARIFICATION] を解消
- 依存技術の調査
- リサーチ結果を `specs/research.md` に集約

### Phase 1: 設計・契約
- データモデルを `specs/api/database.md` に確定
- API契約を `specs/api/api-endpoints.md` に確定
- Agent別の担当範囲を最終確定

### Constitution Check（ゲート）
技術計画がプロジェクト原則に準拠しているか再チェック。

### レビュー
生成した仕様書・技術計画をユーザーに提示し、レビューを受ける。

**レビューのポイント：**
- 機能の抜け漏れがないか
- 受け入れ条件が明確か
- 優先順位は正しいか
- 「やらないこと」が明記されているか
- 画面設計に漏れがないか

ユーザーのフィードバックを反映して仕様書を更新する。

---

## Step 5: Tasks（タスク生成）

確定した仕様書からタスクを生成する。

`references/task-conversion.md` と `references/spec-kit-workflow.md` を参照。

### タスクIDフォーマット（spec-kit準拠）
```
- [ ] T001 [P?] [Story?] タスク説明 (file: path/to/file)
```

- **T001**: 連番ID
- **[P]**: 並列実行可能マーカー（異なるファイル、依存なし）
- **[US1]**: ユーザーストーリー紐付け
- **file path**: 実装対象ファイル

### タスク情報
- タスク名（動詞で始める：「実装する」「設定する」「テストする」）
- 参照する仕様書のパス
- 担当Agent
- 依存タスク（ブロッカー）
- 完了条件（仕様書の受け入れ条件から転記）
- 推定サイズ（S/M/L）

### フェーズ構成
```
Phase 0: Setup (共有インフラ) — Foundation Agent
Phase 1: Foundational (認証・課金・ナビゲーション) — 並列開始可能
  ⚠️ CRITICAL: Phase 1完了までコア機能の作業は開始不可
Phase 2: コア機能 (ストーリー別に並列) — 各Agent並行
Phase 3: 統合・最適化
Phase 4: リリース準備
```

### 実装戦略
1. **MVP First**: Setup → Foundational → US1（最重要ストーリー）→ STOP & VALIDATE
2. **Incremental**: ストーリーを1つずつ追加、各ストーリーは独立テスト
3. **Parallel Team**: Foundational後に各AgentがUS別に並行作業

---

## Step 6: Implement（AgentTeamへの引き渡し）

tasksの登録が完了したら、以下を出力：

1. **Agent別タスク一覧** — 各Agentが何をやるか一目でわかる表
2. **実行順序図** — どのタスクから着手すべきか（[P]マーカーで並列可視化）
3. **CLAUDE.md 最終更新** — 仕様書パス、タスク管理ルールを追記

### 実装時のルール
- TDDパターンに従う（テスト→実装の順）
- ファイルレベル依存を尊重（同一ファイルを複数Agentが同時に変更しない）
- [P]タスクは並列実行可能
- チェックリストに未完了項目がある場合は一時停止

```
✅ 完了：仕様書生成 + tasks登録
→ AgentTeamで実装開始！
  各AgentはCLAUDE.mdと自分の担当仕様書を参照して実装する
```

---

## Step 6.5: Review（レビュー）

実装完了後、コード品質・セキュリティ・動作を検証する。

### レビュー担当Agent
- **code-reviewer**: コード品質、パフォーマンス、ベストプラクティス
- **security-auditor**: OWASP Mobile Top 10、RLS監査、シークレット検出
- **qa-debugger**: バグ検出、クロスバウンダリテスト、E2E検証

### レビュー観点
- [ ] 型安全性（`npx tsc --noEmit` パス）
- [ ] テスト通過（`npx jest` パス）
- [ ] セキュリティ（ハードコードシークレットなし、RLSポリシー適切）
- [ ] パフォーマンス（不要な再レンダリング、リスト仮想化）
- [ ] アクセシビリティ（タップターゲット、コントラスト比）

レビューで発見した問題は修正後、次のステップへ進む。

---

## Step 7: Reconcile（仕様書同期）

**実装が完了した後、仕様書をコードの実態に合わせて更新する。**

これにより、仕様書が常に「真の仕様」として信頼できる状態を維持する。
ドキュメントの更新漏れを防ぎ、次の開発サイクルの品質を保証する。

### 担当Agent
`doc-updater`（haiku、spec-driven-devスキル内蔵）

### Reconcileプロセス

1. **差分検出**: 実装されたコードと `specs/` の仕様書を比較
   - 仕様にあるが未実装の項目 → 意図的スコープカットか確認、仕様書に「Phase 2へ延期」等を明記
   - 実装済みだが仕様にない項目 → 仕様書に追記
   - 仕様と異なる実装 → 仕様書を実態に更新（理由を変更履歴に記録）

2. **影響範囲チェック**: 変更が他の仕様書に波及するか確認
   - `overview.md` の機能一覧を更新
   - `screens/screen-list.md` の画面一覧を更新
   - `api/database.md` のスキーマを実態に同期
   - `shared/navigation.md` のナビゲーション構造を更新

3. **Constitution整合性**: 実装がプロジェクト原則に準拠しているか再チェック

4. **変更履歴記録**: 各仕様書に変更ログを追記
```markdown
## 変更履歴
| 日付 | 変更内容 | 理由 | 関連タスク |
|------|---------|------|-----------|
| YYYY-MM-DD | [変更内容] | Reconcile: 実装との同期 | T0XX |
```

5. **CLAUDE.md 更新**: 必要に応じてプロジェクト設定を反映

### Reconcile完了チェックリスト
```
[ ] 全features/*.mdの受け入れ条件が実装と一致
[ ] screens/*.mdの画面仕様が実際のUIと一致
[ ] api/database.mdのスキーマが実DBと一致
[ ] api/api-endpoints.mdのエンドポイントが実装と一致
[ ] shared/navigation.mdの画面遷移が実装と一致
[ ] overview.mdの機能一覧が最新
[ ] 変更履歴が全ての変更箇所に記録済み
[ ] CLAUDE.mdが最新
```

### 完了報告
```
✅ Reconcile完了
- 更新した仕様書: X件
- 追記した項目: X件
- 修正した項目: X件
- 延期としてマークした項目: X件
→ 仕様書は実装と完全に同期しています
```

---

## 仕様書更新ルール

実装**中**に仕様変更が必要になった場合：
1. まず仕様書を更新する（コードより先に）
2. 変更の影響範囲を確認（他Agentに影響するか）
3. 影響がある場合はユーザーに相談
4. 仕様書の変更履歴を記録する

実装**後**の仕様書更新：
1. Step 7: Reconcile で `doc-updater` が自動的に差分検出
2. コードの実態を正として仕様書を更新
3. 全変更に変更履歴を付与

---

## AgentTeam ワークフローマッピング

各ステップで動くエージェントの全体像：

```
Step 1: Constitution
  └─ architect (Opus, Read-only) — アーキテクチャ原則策定

Step 2: Specify
  ├─ screen-designer (Sonnet) — 画面仕様・UI設計
  ├─ twin-interviewer (Sonnet) — 性格診断・SOUL.md仕様
  └─ [ユーザーと対話しながら仕様書を生成]

Step 3: Clarify
  └─ [ユーザーと対話] — 9カテゴリの曖昧さ解消

Step 4: Plan
  ├─ planner (Opus, Read-only) — 実装計画作成
  └─ architect (Opus, Read-only) — 技術選定・データフロー設計

Step 5: Tasks
  └─ task-refiner (Haiku, Read-only) — タスク品質検証

Step 6: Implement（並列）
  ├─ rn-mobile-dev (Sonnet) — React Native コンポーネント
  ├─ supabase-backend (Sonnet) — DB/Edge Functions/RLS
  ├─ billing-specialist (Sonnet) — RevenueCat/ペイウォール
  ├─ openclaw-specialist (Sonnet) — Gateway API/SOUL.md連携
  ├─ digitalocean-infra (Sonnet) — Droplet/Docker/ヘルスチェック
  ├─ twin-interviewer (Sonnet) — 性格診断実装
  └─ screen-designer (Sonnet) — UI実装

Step 6.5: Review（並列）
  ├─ code-reviewer (Sonnet, Read-only) — コード品質
  ├─ security-auditor (Sonnet, Read-only) — セキュリティ監査
  └─ qa-debugger (Sonnet) — QA/バグ検出/E2E

Step 7: Reconcile
  └─ doc-updater (Haiku) — 仕様書を実装と同期
```

### コスト最適化
| モデル | Agent数 | 用途 |
|--------|---------|------|
| Opus | 2 | 高度な計画・設計（planner, architect） |
| Sonnet | 10 | 実装・レビュー（バランス型） |
| Haiku | 2 | 軽量タスク（doc-updater, task-refiner） |

### Agent-Skill 対応表
| Agent | Skill | 役割 |
|-------|-------|------|
| rn-mobile-dev | rn-mobile-dev | React Native 36ルール |
| supabase-backend | supabase-backend | PostgreSQL 28ルール |
| billing-specialist | revenuecat | RevenueCat SDK/API |
| openclaw-specialist | openclaw | Gateway/SOUL.md |
| digitalocean-infra | digitalocean-infra | Droplet/Docker |
| screen-designer | ui-designer | 9デザインスキル統合 |
| twin-interviewer | openclaw | SOUL.mdフォーマット |
| security-auditor | security-audit | OWASP/RLS |
| qa-debugger | qa-debug | バグ検出/テスト |
| doc-updater | spec-driven-dev | 仕様書フォーマット |
| task-refiner | task-refinement | タスク品質 |
| planner | — | 汎用計画（Opus） |
| architect | — | 汎用設計（Opus） |
| code-reviewer | rn-mobile-dev | RNベストプラクティス |

---

## 参照

### コアリファレンス
- `references/spec-format.md`: 仕様書のフォーマット・テンプレート定義
- `references/task-conversion.md`: 仕様書→tasks変換のガイド
- `references/spec-kit-workflow.md`: spec-kit 6ステップワークフロー詳細（constitution, specify, clarify, plan, tasks, implement の完全仕様）

### 要件定義・PRDリファレンス
- `references/doc-coauthoring.md`: ドキュメント共同作成ワークフロー（Anthropic公式）— Context Gathering → Refinement → Reader Testing の3段階プロセス。仕様書レビューやPRD共同作成に活用。
- `references/product-requirements.md`: PRDテンプレート・バリデーション・タスク変換ガイド — 13項目の自動バリデーション、ディスカバリー質問、優先順位付け手法（MoSCoW/WSJF/RICE）を含む。
- `references/agile-product-owner.md`: アジャイルプロダクトオーナーツールキット — ユーザーストーリー生成（INVEST基準）、受け入れ基準パターン（Given-When-Then）、エピック分解、スプリント計画、ベロシティトラッキング。

### リファレンス間の関係
```
spec-kit-workflow.md ← 全体フレームワーク（6ステップ統括）
       ↕
spec-format.md ←→ product-requirements.md
  仕様書フォーマット    PRDテンプレート
       ↕                    ↕
task-conversion.md ←→ agile-product-owner.md
  タスク変換ガイド     スプリント計画・ストーリー
       ↕
doc-coauthoring.md
  品質向上ワークフロー（全フェーズで適用可能）
```

### 元ソース
- GitHub spec-kit: https://github.com/github/spec-kit
- Anthropic doc-coauthoring: https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring
- mcpmarket product-requirements: https://mcpmarket.com/skill/product-requirements
- alirezarezvani agile-product-owner: https://github.com/alirezarezvani/claude-skills/tree/main/product-team/agile-product-owner
