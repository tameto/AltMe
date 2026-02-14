# spec-kit ワークフロー統合ガイド

> Source: https://github.com/github/spec-kit (GitHub Spec-Driven Development)

## 哲学

- **仕様書がコードに仕えるのではない。コードが仕様書に仕える**
- PRDは実装のガイドではなく、実装を**生成する**ソース
- 仕様書は開発の「共通言語（lingua franca）」であり、コードに代わるコミュニケーション媒体

## 8ステップワークフロー（Review + Reconcile 拡張）

```
constitution → specify → clarify → plan → tasks → implement → review → reconcile
   原則定義     仕様作成    曖昧解消   技術計画   タスク化    実装      品質検証   仕様同期
```

---

## Step 1: Constitution（プロジェクト原則）

プロジェクトの「建築DNA」を定義する。全フェーズでこの原則に照らしてゲートチェックする。

### 原則の例（spec-kit標準）
1. **Library-First**: すべての機能はまずスタンドアロンなライブラリとして始める
2. **CLI Interfaces**: すべての機能をテキストベースCLIで公開
3. **Test-First**: テストを実装コードより先に書き、承認を得る
4. **Simplicity**: 初期は最大3プロジェクト。複雑さの追加には正当化が必要
5. **Anti-Abstraction**: フレームワークを直接使い、ラッパーを作らない

### AltMe向けの原則（カスタマイズ例）
1. **課金ファースト**: 全機能は課金エンティティ（`pro` Entitlement）との関係を明記
2. **仕様書ファースト**: コードを書く前に仕様書を書く
3. **Agent分離**: 各Agentは自分の`features/`ディレクトリのみ変更可能
4. **型安全**: `shared/types/` の型定義を契約として扱う
5. **ユーザーストーリー独立**: 各ストーリーは独立して開発・テスト・デプロイ可能

### Constitution Check
```markdown
## Constitution Check
*GATE: Phase 0 リサーチ前に通過必須。Phase 1 設計後に再チェック。*

| 原則 | 状態 | 備考 |
|------|------|------|
| 課金ファースト | PASS/FAIL | ... |
| 仕様書ファースト | PASS/FAIL | ... |
| Agent分離 | PASS/FAIL | ... |
| 型安全 | PASS/FAIL | ... |
```

---

## Step 2: Specify（仕様書作成）

### 品質基準
- **「WHATとWHY」に集中**し、実装詳細（HOW）を避ける
- ビジネスステークホルダーが読めるレベルで記述
- **[NEEDS CLARIFICATION]** マーカーは最大3つまで（影響度順に優先）
- 成功基準は**測定可能・技術非依存・ユーザー中心**

### ユーザーシナリオ形式
ストーリーは優先度順（P1, P2, P3...）で並べ、各ストーリーは以下を満たす：
- 独立して開発可能
- 独立してテスト可能
- 独立してデプロイ可能
- 単独でMVPとしての価値を提供

### 受け入れシナリオ（Given-When-Then）
```markdown
### AC-1: [条件名] (P1, US1)
- Given: [前提条件]
- When: [操作]
- Then: [期待結果]
```

### バリデーションチェックリスト
仕様書生成後に `checklists/requirements.md` を生成：
- コンテンツ品質（WHATとWHY中心か、実装詳細が混入していないか）
- 要件完全性（ユーザーストーリー、AC、エッジケースが揃っているか）
- 機能準備度（[NEEDS CLARIFICATION] が3個以下か）

---

## Step 3: Clarify（曖昧解消）

### 9つの分類カテゴリ
以下のカテゴリで仕様書の曖昧さをスキャン：

1. **機能スコープ** — 機能の境界は明確か
2. **データモデル** — エンティティ、リレーション、制約が定義されているか
3. **UXフロー** — ユーザーの操作パスが明確か
4. **品質特性** — パフォーマンス、セキュリティ、信頼性の基準
5. **統合** — 外部サービスとの連携ポイント
6. **エッジケース** — 境界条件、エラーシナリオ
7. **制約** — 技術的・ビジネス的な制約
8. **用語** — 曖昧な用語の定義
9. **完了シグナル** — いつ「完了」と判断するか

### 質問ルール
- 1セッション最大**5問**まで
- **影響度順**に優先（実装・テスト・アーキテクチャ・コンプライアンスに影響するもののみ）
- 各質問に**推奨オプション**と理由、代替案テーブルを添える
- 回答ごとに仕様書を**即座に更新**
- 低影響の曖昧さはスキップ
- 技術的な質問は機能的明確性をブロックする場合のみ

### 質問テンプレート
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

### 完了レポート
```markdown
## Clarification Summary
- 質問数: X/5
- 更新された仕様書: specs/features/[name].md
- 影響セクション: [リスト]

| カテゴリ | ステータス |
|---------|-----------|
| 機能スコープ | Resolved / Deferred / Clear / Outstanding |
| データモデル | ... |
| UXフロー | ... |
| ... | ... |
```

---

## Step 4: Plan（技術計画）

### Phase 0: リサーチ
- [NEEDS CLARIFICATION] マークの解消
- 依存技術の調査タスク生成
- リサーチ結果を `research.md` に集約（決定事項、根拠、却下した代替案）

### Phase 1: 設計・契約
- データエンティティを `data-model.md` に抽出
- 要件からAPI契約を `contracts/` に生成
- Agent別コンテキストファイルを更新
- `quickstart.md` を含む設計成果物を生成

### Constitution Check（ゲート）
Phase 0 前と Phase 1 後に原則チェックを実施。違反がある場合は正当化が必要。

### 計画テンプレート構造
```markdown
# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

## Summary
[仕様書から抽出: 主要要件 + リサーチからの技術アプローチ]

## Technical Context
- Language/Version:
- Primary Dependencies:
- Storage:
- Testing:
- Target Platform:
- Performance Goals:
- Constraints:
- Scale/Scope:

## Constitution Check
| 原則 | 状態 | 備考 |
|------|------|------|

## Project Structure
### Documentation
specs/[###-feature]/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md

### Source Code
[ディレクトリ構成]

## Complexity Tracking
> Constitution Check に違反がある場合のみ記入
| 違反 | 必要な理由 | 却下したシンプルな代替 |
```

---

## Step 5: Tasks（タスク生成）

### タスクIDフォーマット（spec-kit標準）
```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

- **チェックボックス**: 進捗トラッキング
- **連番ID**: T001, T002... 順序保証
- **[P]**: 並列実行可能マーカー（異なるファイル、依存なし）
- **[Story]**: ユーザーストーリー紐付け（US1, US2...）
- **ファイルパス**: 実装対象の明確化

### フェーズ構成
```markdown
## Phase 1: Setup (共有インフラ)
- [ ] T001 プロジェクト構造を作成
- [ ] T002 依存関係をインストール
- [ ] T003 [P] リンター・フォーマッター設定

## Phase 2: Foundational (ブロッキング前提条件)
⚠️ CRITICAL: このフェーズ完了までユーザーストーリー作業は開始不可
- [ ] T004 DBスキーマ・マイグレーション構築
- [ ] T005 [P] 認証・認可フレームワーク実装
- [ ] T006 [P] APIルーティング・ミドルウェア構築

## Phase 3: User Story 1 - [Title] (Priority: P1) MVP
### テスト (US1)
- [ ] T010 [P] [US1] コントラクトテスト
- [ ] T011 [P] [US1] 統合テスト

### 実装 (US1)
- [ ] T012 [P] [US1] [Entity1] モデル作成
- [ ] T013 [P] [US1] [Entity2] モデル作成
- [ ] T014 [US1] [Service] 実装 (depends: T012, T013)

## Phase N: Polish & 横断的関心事
- [ ] TXXX [P] ドキュメント更新
- [ ] TXXX コードクリーンアップ
```

### 組織原則
- ユーザーストーリー単位で主要な組織化
- 各ストーリーフェーズにモデル、サービス、エンドポイント、テスト
- Setup/Foundational フェーズで横断インフラを先行
- 依存チェーンを尊重しつつ各ストーリーの独立テストを実現

### 実装戦略
1. **MVP First**: Setup → Foundational → US1 → STOP & VALIDATE
2. **Incremental Delivery**: ストーリーを1つずつ追加、独立テスト
3. **Parallel Team**: Foundational後に複数AgentがUS別に並行作業

---

## Step 6: Implement（実装）

### 9ステップ実行フレームワーク
1. **前提チェック**: スクリプト実行、ドキュメントパス特定
2. **チェックリスト検証**: 未完了項目がある場合はユーザー確認で一時停止
3. **コンテキスト読込**: tasks.md, plan.md + オプショナル参照ファイル
4. **プロジェクト設定検証**: .gitignore等の生成/検証
5. **タスクパース**: フェーズ、依存、実行順序の抽出
6. **フェーズ別実行**: setup → tests → core → integration → polish
7. **実装ルール**: TDD、ファイルレベル依存尊重、競合タスクは逐次実行
8. **進捗トラッキング**: タスク完了状態の更新、エラー処理、[P]タスクの並列実行
9. **完了検証**: 全タスク完了確認、仕様適合性、テスト通過

### ゲートコントロール
チェックリストに未完了項目がある場合は実装を**一時停止**し、ユーザーの明示的確認が必要。

---

## Step 7: Review（品質検証）

実装完了後にコード品質・セキュリティ・動作を多層的に検証する。

### 検証レイヤー
1. **コード品質** — code-reviewer: 可読性、命名、重複、パフォーマンス
2. **セキュリティ** — security-auditor: OWASP Top 10、RLS、シークレット検出
3. **QA** — qa-debugger: バグ検出、クロスバウンダリテスト、E2E

### ゲート
レビューで CRITICAL な問題が見つかった場合は修正後にReconcileへ進む。

---

## Step 8: Reconcile（仕様書同期）

**実装完了後に、仕様書をコードの実態に合わせて更新する。**
これにより仕様書が常に「真の仕様」として信頼でき、次の開発サイクルの品質を保証する。

### 担当
`doc-updater`（Haiku、spec-driven-dev スキル内蔵）

### プロセス
1. **差分検出**: コードと `specs/` を比較
   - 仕様にあるが未実装 → スコープカットか確認、「Phase 2へ延期」明記
   - 実装済みだが仕様にない → 仕様書に追記
   - 仕様と異なる実装 → 仕様書を実態に更新
2. **影響範囲チェック**: 他の仕様書への波及確認
3. **Constitution整合性**: 原則違反がないか再チェック
4. **変更履歴記録**: 各仕様書に変更ログを追記
5. **CLAUDE.md更新**: 必要に応じてプロジェクト設定を反映

### 完了チェックリスト
```
[ ] features/*.md の AC が実装と一致
[ ] screens/*.md が実際の UI と一致
[ ] api/database.md が実 DB と一致
[ ] api/api-endpoints.md が実装と一致
[ ] shared/navigation.md が実装と一致
[ ] overview.md の機能一覧が最新
[ ] 全変更に変更履歴が記録済み
[ ] CLAUDE.md が最新
```

---

## 補助コマンド

### Analyze（整合性分析）

タスク生成後、実装前に仕様書・計画書・タスク間の整合性を検証する**読み取り専用**のチェック。

**6つの検出パス：**
1. **重複検出** — 重複する要件やタスク
2. **曖昧さ検出** — 曖昧な形容詞、未解決プレースホルダー
3. **不十分な仕様** — 欠落しているオブジェクト/結果
4. **Constitution整合性** — 原則違反 → CRITICAL
5. **カバレッジギャップ** — タスクのない要件、要件のないタスク
6. **不整合** — 用語のドリフト、データエンティティの不一致、タスク順序の矛盾

**出力：**
- 発見事項テーブル（最大50件、ID/カテゴリ/重大度/場所/推奨事項）
- カバレッジサマリー（要件→タスクマッピング）
- Constitution整合性の問題点
- メトリクス（総要件数、タスク数、カバレッジ%、クリティカル問題数）

### Checklist（要件品質チェック）

**コンセプト：「要件のユニットテスト」**

チェックリストは実装の検証ではなく、**要件記述の品質を検証する**もの。
- NG: 「ログインが動作することを確認」（実装検証）
- OK: 「認証要件にタイムアウトポリシーが定義されているか？」（品質検証）

**チェック項目フォーマット：**
```
- [ ] CHK001 [質問形式の項目]
  品質次元: [Completeness/Clarity/Consistency/...]
  追跡: [Spec セクション参照 or Gap マーカー]
```

### TasksToIssues（GitHub Issue化）

tasks.md の各タスクを GitHub Issue に変換する。リモートURLが GitHub リポジトリの場合のみ実行。

---

## AgentTeam との統合

### spec-kit → AgentTeam マッピング

| spec-kit概念 | AgentTeamでの対応 |
|-------------|------------------|
| Constitution | `CLAUDE.md` + `specs/overview.md` |
| Specify | `specs/features/*.md` (Agent別に分割) |
| Clarify | スキル実行時の質問フェーズ |
| Plan | `specs/*/plan.md` + `specs/*/research.md` |
| Tasks | TaskCreate/TaskUpdate API |
| Implement | Agent別の並列実装 |
| [P] マーカー | 異なるAgentに割り当て可能なタスク |
| [Story] ラベル | Agent担当範囲に対応 |

### Agent別タスク配分の考え方
1. Setupフェーズ: Foundation Agent（1名）が完了
2. Foundationalフェーズ: 認証Agent + 課金Agent が並行
3. Storyフェーズ: 各Agentが担当ストーリーを並行実装
4. Polishフェーズ: 全Agentが横断テスト・統合

---

## 品質チェックリスト一覧

### 仕様書品質チェック
```
[ ] WHATとWHYに集中しているか（HOWが混入していないか）
[ ] ビジネスステークホルダーが読めるレベルか
[ ] [NEEDS CLARIFICATION] が3個以下か
[ ] 成功基準が測定可能・技術非依存・ユーザー中心か
[ ] 各ストーリーが独立して開発・テスト・デプロイ可能か
[ ] エッジケース・エラーケースが網羅されているか
[ ] 受け入れ条件がGiven-When-Then形式か
```

### 計画品質チェック
```
[ ] Constitution Checkに全項目パスか
[ ] 技術コンテキストが完全に記述されているか
[ ] リサーチで未解決の[NEEDS CLARIFICATION]がないか
[ ] データモデルが仕様書の全エンティティをカバーしているか
[ ] API契約が全エンドポイントを定義しているか
```

### タスク品質チェック
```
[ ] 全タスクにID・優先度・ストーリーラベルがあるか
[ ] 依存関係が正確か（循環依存なし）
[ ] [P]マーカーが正しいか（本当に並列可能か）
[ ] 各タスクにファイルパスが含まれているか
[ ] MVPストーリーが最初に来ているか
```
