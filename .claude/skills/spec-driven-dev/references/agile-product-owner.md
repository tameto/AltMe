# Agile Product Owner ツールキット

> ソース: [alirezarezvani/claude-skills - agile-product-owner](https://github.com/alirezarezvani/claude-skills/tree/main/product-team/agile-product-owner)

バックログ管理とスプリント実行のためのアジャイルプロダクトオーナーツールキット。
ユーザーストーリー生成、受け入れ基準パターン、スプリント計画、ベロシティトラッキングを含む。

---

## 目次

- [User Story Generation Workflow](#user-story-generation-workflow)
- [Acceptance Criteria Patterns](#acceptance-criteria-patterns)
- [Epic Breakdown Workflow](#epic-breakdown-workflow)
- [Sprint Planning Workflow](#sprint-planning-workflow)
- [Backlog Prioritization](#backlog-prioritization)
- [Sprint Metrics](#sprint-metrics)
- [Sprint Ceremonies](#sprint-ceremonies)
- [Tools](#tools)
- [AltMe向け適用](#altme向け適用)

---

## User Story Generation Workflow

INVEST準拠のユーザーストーリーを要件から作成する:

1. ペルソナを特定（この機能から恩恵を受けるのは誰か）
2. 必要なアクションまたは能力を定義
3. 提供する利益/価値を明確化
4. Given-When-Thenで受け入れ基準を記述
5. フィボナッチスケールでストーリーポイントを見積
6. INVEST基準に対して検証
7. 優先度付きでバックログに追加
8. **検証:** ストーリーが全INVEST基準をパス、受け入れ基準がテスト可能

### User Story テンプレート

```
As a [ペルソナ],
I want to [アクション/能力],
So that [利益/価値].
```

**例:**
```
As a マーケティングマネージャー,
I want to キャンペーンレポートをPDFにエクスポートする,
So that システムアクセスのないステークホルダーと結果を共有できる.
```

### Story Types

| タイプ | テンプレート | 例 |
|--------|-----------|-----|
| Feature | As a [ペルソナ], I want to [アクション] so that [利益] | As a ユーザー, I want to 検索結果をフィルター so that アイテムを速く見つけられる |
| Improvement | As a [ペルソナ], I need [能力] to [目標] | As a ユーザー, I need ページ読み込みの高速化 to フラストレーションなくタスクを完了する |
| Bug Fix | As a [ペルソナ], I expect [動作] when [条件] | As a ユーザー, I expect ページリフレッシュ時にカートが保持される when ブラウザを更新する |
| Enabler | As a 開発者, I need to [技術タスク] to enable [能力] | As a 開発者, I need to キャッシング実装 to enable 即座の検索結果 |

### Persona Reference

| ペルソナ | 典型的なニーズ | コンテキスト |
|---------|-------------|------------|
| End User | 効率性、シンプルさ、信頼性 | 日常的なコア機能使用 |
| Administrator | コントロール、可視性、セキュリティ | システム管理 |
| Power User | 自動化、カスタマイズ、ショートカット | エキスパートワークフロー |
| New User | ガイダンス、学習、安全性 | オンボーディング |
| Manager | レポーティング、監督、委任 | チーム調整 |
| External User | アクセス、セキュリティ、ドキュメント | 顧客/パートナー利用 |

---

## Acceptance Criteria Patterns

テスト可能な受け入れ基準をGiven-When-Thenフォーマットで記述する。

### Given-When-Then テンプレート

```
Given [前提条件/コンテキスト],
When [アクション/トリガー],
Then [期待される結果].
```

**例:**
```
Given ユーザーが有効な認証情報でログインしている,
When 「エクスポート」ボタンをクリックする,
Then 2秒以内にPDFダウンロードが開始される.

Given ユーザーが無効なメール形式を入力している,
When 登録フォームを送信する,
Then 「有効なメールアドレスを入力してください」というインラインエラーが表示される.

Given ショッピングカートにアイテムがある,
When ユーザーがブラウザをリフレッシュする,
Then カートの内容は変更されない.
```

### Should/Must/Can パターン

**Should（期待される動作）:**
```
Should [動作] when [条件].
例: Should API呼び出しが500msを超えたときローディングスピナーを表示する.
```

**Must（ハード要件）:**
```
Must [要件] to [結果達成].
例: Must コンプライアンス要件を満たすために保存時の全データを暗号化する.
```

**Can（能力）:**
```
Can [能力] without [ネガティブな結果].
例: Can 他の変更を失わずに最後のアクションを元に戻せる.
```

### Acceptance Criteria チェックリスト

各ストーリーに含めるべき基準のカテゴリ:

| カテゴリ | 例 |
|---------|-----|
| Happy Path | 有効な入力で送信 → 成功メッセージ表示 |
| Validation | 必須フィールドが空のとき入力を拒否 |
| Error Handling | APIが失敗したときユーザーフレンドリーなメッセージを表示 |
| Performance | 2秒以内に操作完了 |
| Accessibility | キーボードのみでナビゲーション可能 |
| Security | URLパラメータに機密データを公開しない |

### ストーリーサイズ別の最小基準数

| ストーリーポイント | 最小AC数 |
|-----------------|---------|
| 1-2 | 3-4基準 |
| 3-5 | 4-6基準 |
| 8 | 5-8基準 |
| 13+ | ストーリーを分割 |

---

## Epic Breakdown Workflow

エピックをスプリントサイズのストーリーに分解する:

1. エピックのスコープと成功基準を定義
2. エピックに影響される全ペルソナを特定
3. 各ペルソナに必要な全能力をリスト
4. 能力を論理的なストーリーにグループ化
5. 各ストーリーが8ポイント以下であることを検証
6. ストーリー間の依存関係を特定
7. インクリメンタルなデリバリーのためにストーリーを順序付け
8. **検証:** 各ストーリーが単体で価値を提供、合計がエピックスコープをカバー

### Splitting Techniques

| テクニック | 使用場面 | 例 |
|-----------|---------|-----|
| ワークフローステップ別 | 線形プロセス | "チェックアウト" → "カートに追加" + "支払い入力" + "注文確認" |
| ペルソナ別 | 複数ユーザータイプ | "ダッシュボード" → "管理者ダッシュボード" + "ユーザーダッシュボード" |
| データタイプ別 | 複数の入力 | "インポート" → "CSVインポート" + "Excelインポート" |
| 操作別 | CRUD機能 | "ユーザー管理" → "作成" + "編集" + "削除" |
| ハッピーパス優先 | リスク削減 | "機能" → "基本フロー" + "エラーハンドリング" + "エッジケース" |
| プラットフォーム別 | マルチプラットフォーム | "モバイル対応" → "iOS対応" + "Android対応" |

### Epic 例

**Epic:** User Dashboard

```
Epic: User Dashboard (34ポイント合計)
├── US-001: 主要指標の表示 (5 pts) - End User
├── US-002: レイアウトのカスタマイズ (5 pts) - Power User
├── US-003: CSVへのデータエクスポート (3 pts) - End User
├── US-004: チームへの共有 (5 pts) - End User
├── US-005: アラート設定 (5 pts) - Power User
├── US-006: 日付範囲フィルター (3 pts) - End User
├── US-007: 管理者オーバービュー (5 pts) - Admin
└── US-008: キャッシング有効化 (3 pts) - Enabler
```

---

## Sprint Planning Workflow

スプリントのキャパシティを計算し、ストーリーを選択する:

1. チームキャパシティを計算（ベロシティ x 稼働率）
2. ステークホルダーとスプリントゴールをレビュー
3. 優先順位付けされたバックログからストーリーを選択
4. キャパシティの80-85%まで充填（コミット分）
5. ストレッチゴールを追加（追加10-15%）
6. 依存関係とリスクを特定
7. 複雑なストーリーをタスクに分解
8. **検証:** コミットポイント <= キャパシティの85%、全ストーリーにACあり

### Capacity Calculation

```
Sprint Capacity = Average Velocity x Availability Factor

例:
Average Velocity: 30 points
Team availability: 90%（1メンバーが部分的に不在）
Adjusted Capacity: 27 points

Committed: 23 points (85% of 27)
Stretch: 4 points (15% of 27)
```

### Availability Factors

| シナリオ | ファクター | 例 |
|---------|----------|-----|
| フルスプリント、PTO無し | 1.0 | 30ポイント（velocity=30） |
| 1メンバー50%不在 | 0.9 | 27ポイント |
| スプリント中の祝日 | 0.8 | 24ポイント |
| 複数メンバー不在 | 0.7 | 21ポイント |
| メジャーリリース/オンコール | 0.75 | 22-23ポイント |

### Capacity Buffer Rules

| コミットレベル | ベロシティ% | 目的 |
|-------------|-----------|------|
| Committed | 80-85% | 高い確信度でのデリバリー |
| Stretch | 10-15% | 順調な場合のオプション |
| Buffer | 5-10% | 計画外の作業、バグ |

### Sprint Loading テンプレート

```
Sprint Capacity: 27 points
Sprint Goal: [明確で測定可能な目標]

COMMITTED (23 points):
[H] US-001: ユーザーダッシュボード (5 pts)
[H] US-002: エクスポート機能 (3 pts)
[H] US-003: 検索フィルター (5 pts)
[M] US-004: 設定ページ (5 pts)
[M] US-005: ヘルプツールチップ (3 pts)
[L] US-006: テーマオプション (2 pts)

STRETCH (4 points):
[L] US-007: ソートオプション (2 pts)
[L] US-008: 印刷ビュー (2 pts)
```

---

## Backlog Prioritization

### Priority Levels

| 優先度 | 定義 | スプリント目標 |
|--------|------|-------------|
| Critical | ユーザーブロック、セキュリティ、データ損失 | 即時 |
| High | コア機能、主要ユーザーニーズ | 今スプリント |
| Medium | 改善、エンハンスメント | 次2-3スプリント |
| Low | Nice-to-have、マイナー改善 | バックログ |

### Prioritization Factors

| ファクター | ウェイト | 質問 |
|-----------|--------|------|
| Business Value | 40% | 収益インパクト？ユーザー需要？戦略的整合性？ |
| User Impact | 30% | 何人のユーザー？どの頻度で使用？ |
| Risk/Dependencies | 15% | 技術的リスク？外部依存？ |
| Effort | 15% | サイズ？複雑性？不確実性？ |

### INVEST Criteria Validation

スプリントに追加する前に、各ストーリーを検証:

| 基準 | 質問 | パス条件 |
|------|------|---------|
| **I**ndependent | 他の未コミットストーリーなしで開発可能か？ | ブロッキング依存なし |
| **N**egotiable | 実装アプローチは柔軟か？ | 複数のアプローチが可能 |
| **V**aluable | ユーザーまたはビジネス価値を提供するか？ | 「so that」に明確な利益 |
| **E**stimable | チームが見積可能か？ | サイズ付けに十分な理解 |
| **S**mall | 1スプリントで完了可能か？ | 8ストーリーポイント以下 |
| **T**estable | 完了を検証可能か？ | 明確な受け入れ基準 |

### INVEST Failure Patterns

| 基準 | レッドフラグ | 修正 |
|------|-----------|------|
| Independent | 「ストーリーXの後で...」 | ストーリーを統合または再順序付け |
| Negotiable | ストーリー内に具体的な実装 | 結果にフォーカス |
| Valuable | 「so that」句がない | 利益ステートメントを追加 |
| Estimable | チームが「見当もつかない」 | スパイクを先に実施 |
| Small | 8ポイント超 | より小さなストーリーに分割 |
| Testable | 「システムが良くなるべき」 | 測定可能な基準を追加 |

### Backlog Organization

| セクション | 内容 | レビュー頻度 |
|-----------|------|------------|
| Sprint Backlog | 現スプリントにコミット済み | 毎日 |
| Ready | 精緻化済み、見積済み、優先順位付け済み | 各プランニング |
| Grooming | 精緻化が必要 | 毎週 |
| Icebox | 将来の検討 | 月次 |
| Archive | 完了または廃止 | 四半期 |

---

## Sprint Metrics

### Key Metrics

| メトリクス | 計算式 | 目標 |
|-----------|--------|------|
| Velocity | 完了ポイント / スプリント | 安定 +/-10% |
| Commitment Reliability | 完了 / コミット | >85% |
| Scope Change | スプリント中の追加/削除ポイント | <10% |
| Carryover | 未完了ポイント | <15% |
| Bug Ratio | バグポイント / 合計ポイント | <20% |

### Velocity Tracking

```
Sprint 1: 25 points
Sprint 2: 28 points
Sprint 3: 30 points
Sprint 4: 32 points
Sprint 5: 29 points
------------------------
Average: 28.8 points
Trend: Stable (+/-10%)

Planning Recommendation: 26-29ポイントをコミット
```

### Burndown Chart パターン

| パターン | 意味 | アクション |
|---------|------|----------|
| Flat start | 序盤に進捗なし | ブロッカーを確認 |
| Late drop | 最後の瞬間の完了 | WIP制限を改善 |
| Scope increase | ラインが上昇 | スコープクリープに対処 |
| Early completion | スプリント終了前に完了 | ストレッチアイテムを取り込む |

### Definition of Done

ストーリーは以下が全て満たされたときに完了:

- [ ] コード完了およびピアレビュー済み
- [ ] ユニットテスト作成済みかつパス
- [ ] 統合テストパス
- [ ] 受け入れ基準の検証済み
- [ ] ドキュメント更新済み
- [ ] ステージング環境にデプロイ済み
- [ ] プロダクトオーナーが承認
- [ ] クリティカルバグなし

---

## Sprint Ceremonies

### Daily Standup

**所要時間:** 最大15分

各メンバーが回答:
1. 昨日何を完了したか？
2. 今日何に取り組むか？
3. ブロッカーはあるか？

**PO の役割:**
- PO対応が必要なブロッカーを聴取
- 明確化の質問に回答
- スコープの懸念をオフラインで議論するようノート
- ステークホルダーに進捗を更新

### Backlog Refinement (Grooming)

**所要時間:** 週1-2時間
**タイミング:** スプリント中盤

| 時間 | 活動 |
|------|------|
| 0:00-0:15 | 今後の優先事項をレビュー |
| 0:15-0:45 | トップアイテムのAC詳細化 |
| 0:45-1:15 | 新ストーリーの見積 |
| 1:15-1:30 | 大きなストーリーの分割 |

**Ready 基準:**
- [ ] 明確なユーザーストーリーフォーマット（As a... I want... So that...）
- [ ] 受け入れ基準定義済み（Given-When-Then）
- [ ] ストーリーポイント見積合意済み
- [ ] 依存関係特定済み
- [ ] 1スプリントに収まる（8ポイント以下）

### Sprint Planning Meeting

**所要時間:** 2週間スプリントで2時間

| 時間 | 活動 | 参加者 |
|------|------|--------|
| 0:00-0:15 | スプリントゴールと優先事項レビュー | POが発表 |
| 0:15-0:45 | トップバックログアイテムの議論 | チームが質問 |
| 0:45-1:15 | チームがストーリーを選択 | チームが決定 |
| 1:15-1:45 | ストーリーをタスクに分解 | チーム協力 |
| 1:45-2:00 | コミット確認とリスク特定 | 全員 |

### Sprint Review (Demo)

**所要時間:** 2週間スプリントで1時間

| 時間 | 活動 | リード |
|------|------|--------|
| 0:00-0:05 | スプリントゴール振り返り | PO |
| 0:05-0:40 | 完了作業のデモ | チーム |
| 0:40-0:50 | ステークホルダーフィードバック | ステークホルダー |
| 0:50-1:00 | ロードマップ更新 | PO |

### Sprint Retrospective

**所要時間:** 2週間スプリントで1.5時間

**フォーマットオプション:**

| フォーマット | 構造 |
|------------|------|
| Start-Stop-Continue | 始めること、やめること、続けること |
| 4Ls | Liked, Learned, Lacked, Longed for |
| Sailboat | Wind（助け）、Anchors（ブロッカー）、Rocks（リスク） |
| Mad-Sad-Glad | スプリントイベントへの感情状態 |

**アクションアイテム:**
- レトロあたり最大2-3の改善アクション
- オーナーと期日を割り当て
- 次のレトロの冒頭で前回のアクションをレビュー

---

## Tools

### User Story Generator (user_story_generator.py)

INVEST準拠のユーザーストーリーを自動生成するPythonスクリプト。

**主な機能:**
- エピックからのストーリー分解
- Given-When-Then受け入れ基準の生成
- フィボナッチスケールでのストーリーポイント見積
- 優先度の自動割り当て
- INVEST基準のバリデーション
- スプリントロードの最適化

**使い方:**
```bash
# エピックからストーリーを生成
python scripts/user_story_generator.py

# キャパシティ指定でスプリント計画
python scripts/user_story_generator.py sprint 30
```

**出力例:**
```
USER STORY: USR-001
========================================
Title: View Key Metrics
Type: story
Priority: HIGH
Points: 5

Story:
As a End User, I want to view key metrics and KPIs
so that I can save time and work more efficiently

Acceptance Criteria:
  1. Given user has access, When they view key metrics, Then the result is displayed
  2. Should validate input before processing
  3. Must show clear error message when action fails
  4. Should complete within 2 seconds
  5. Must be accessible via keyboard navigation

INVEST Checklist:
  [pass] Independent
  [pass] Negotiable
  [pass] Valuable
  [pass] Estimable
  [pass] Small
  [pass] Testable
```

**スプリント計画出力例:**
```
SPRINT PLANNING
====================================
Sprint Capacity: 30 points
Committed: 23 points (76.7%)
Stories: 7 committed + 2 stretch

COMMITTED STORIES:
  [H] USR-001: View Key Metrics (5pts)
  [H] USR-002: Customize Layout (5pts)
  [L] USR-003: Export Data (3pts)
  ...

STRETCH GOALS:
  [L] USR-007: Sort Options (2pts)
  [L] USR-008: Print View (2pts)
```

### Story Point Estimation Guide

| ポイント | 複雑度 | 例 |
|---------|--------|-----|
| 1 | Trivial | タイポ修正、ラベル変更 |
| 2 | Simple | フィールド追加、単純なバリデーション |
| 3 | Small | 新フォーム、基本CRUD操作 |
| 5 | Medium | 複数コンポーネントの機能 |
| 8 | Large | 複雑な機能、複数の統合 |
| 13 | Very Large | 分割を検討 |
| 21+ | Epic | 必ず分割 |

### Estimation Factors

| ファクター | 低複雑度 | 高複雑度 |
|-----------|---------|---------|
| 未知数 | よく理解されている | 多くの未知数 |
| 依存関係 | なし | 複数システム |
| テスト | 単純なユニットテスト | 複雑な統合テスト |
| データ | 単純な構造 | 複雑な変換 |
| UI | マイナーな変更 | 新コンポーネント |

---

## Story Antipatterns

### ストーリーのアンチパターン

| アンチパターン | 例 | 修正 |
|--------------|-----|------|
| ソリューションストーリー | "Reactコンポーネントを実装" | "ユーザープロファイル情報を表示" |
| 複合ストーリー | "ユーザーの作成、編集、削除" | 3つのストーリーに分割 |
| ペルソナ欠如 | "システムは..." | "As an admin, I want to..." |
| 利益なし | "ボタンを見たい" | "so that [利益]"を追加 |
| 曖昧すぎ | "パフォーマンス改善" | "ページロードを2秒未満に" |
| 技術用語 | "Redisキャッシング実装" | "即座の検索結果を有効に" |

### Sprint Planning Antipatterns

| アンチパターン | 影響 | 修正 |
|--------------|------|------|
| 100%キャパシティ | 未知数に対するバッファなし | 80-85%で計画 |
| 全て大ストーリー | 未完了スプリントのリスク | サイズをミックス |
| 依存関係未マッピング | ブロックされた作業 | 事前に依存関係を特定 |
| ストレッチ=オーバーフロー | 過剰コミットの隠蔽 | ストレッチはオプション |

---

## AltMe向け適用

### 開発タスクのユーザーストーリー化

AltMeの各機能をINVEST準拠のユーザーストーリーに変換:

**例: AIツインチャット機能**

```
Epic: AIツインチャット (合計34ポイント)
├── US-001: テキストメッセージ送受信 (5 pts) - End User
│   As a 課金ユーザー,
│   I want to AIツインにテキストメッセージを送信して返答を受け取る,
│   So that ビジネスタスクの相談ができる.
│
│   AC:
│   - Given: ユーザーが課金済みでログイン済み
│     When: チャット画面でメッセージを入力して送信
│     Then: 1.5秒以内にAIツインからの返答が表示される
│   - Given: WebSocket接続が切断された
│     When: メッセージを送信
│     Then: 「再接続中」と表示され、3秒以内に自動再接続
│   - Given: OpenClawインスタンスが未起動
│     When: チャット画面を開く
│     Then: 「準備中」と表示され、バックグラウンドで起動開始
│
├── US-002: チャット履歴の表示 (3 pts) - End User
├── US-003: メッセージのコピー・共有 (2 pts) - End User
├── US-004: SOUL.md のカスタマイズ (5 pts) - Power User
├── US-005: チャット設定（トーン調整） (3 pts) - End User
├── US-006: チャットエクスポート (3 pts) - Power User
├── US-007: オンボーディングでの初期設定 (5 pts) - New User
├── US-008: 管理者ダッシュボード (5 pts) - Admin (将来)
└── US-009: OpenClaw接続マネージャー (3 pts) - Enabler
```

### AltMe ペルソナ定義

| ペルソナ | 典型的なニーズ | コンテキスト |
|---------|-------------|------------|
| 無料ユーザー | お試し、価値の理解 | トライアル期間（3日間） |
| 月額課金ユーザー | AIツインの日常利用、業務効率化 | ¥4,980/月 |
| 年額課金ユーザー | 長期利用、コスト最適化 | ¥39,800/年（33%OFF） |
| 初回限定ユーザー | 早期採用、コミュニティ参加 | ¥29,800/年（50%OFF） |
| パワーユーザー | SOUL.mdカスタマイズ、高度な自動化 | ヘビーユーザー |

### スプリント計画テンプレート（AltMe版）

```
Sprint #1: MVP基盤 (2週間)
Sprint Capacity: 30 points
Sprint Goal: 認証 + 課金基盤の完成

COMMITTED (25 points):
[H] US-AUTH-001: Supabase認証セットアップ (5 pts) - Agent A
[H] US-AUTH-002: メールサインアップ (3 pts) - Agent A
[H] US-PAY-001: RevenueCat SDK導入 (5 pts) - Agent B
[H] US-PAY-002: useSubscription hook (3 pts) - Agent B
[H] US-NAV-001: ナビゲーション骨格 (5 pts) - Agent C
[M] US-PAY-003: ペイウォール仮UI (4 pts) - Agent B

STRETCH (5 points):
[M] US-AUTH-003: ソーシャルログイン (5 pts) - Agent A

Dependencies:
  US-AUTH-002 → US-PAY-002（認証後に課金チェック）
  US-NAV-001 → US-PAY-003（ナビゲーション内にペイウォール配置）
```

### spec-driven-dev との連携

| agile-product-owner の役割 | spec-driven-dev の役割 | 連携ポイント |
|--------------------------|---------------------|------------|
| ユーザーストーリーテンプレート | features/*.md テンプレート | ストーリー → 仕様書変換 |
| INVEST基準検証 | 受け入れ条件（AC）定義 | 品質基準の統一 |
| エピック分解ワークフロー | Phase分けの基準 | 作業分割の一貫性 |
| スプリント計画テンプレート | Agent別タスク一覧 | リソース計画の統合 |
| ベロシティトラッキング | フェーズ別タスクサイズ | 進捗管理の統合 |
| Definition of Done | 完了条件 | 完了基準の統一 |

### task-conversion.md との補完関係

| agile-product-owner | task-conversion | 補完ポイント |
|--------------------|----------------|------------|
| ストーリーポイント見積（フィボナッチ） | サイズ目安（S/M/L + 時間） | 見積基準の相互変換 |
| Capacity Calculation | Phase分け | キャパシティ計画の精緻化 |
| Sprint Loading テンプレート | Agent別タスク一覧テンプレート | 出力フォーマットの統合 |
| INVEST + Splitting Techniques | 1AC≒1タスクルール | 粒度管理の統合 |
| Priority Levels | Must/Should/Nice to Have | 優先度定義の統一 |
