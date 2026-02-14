# UX Researcher & Designer Toolkit

> Source: https://github.com/alirezarezvani/claude-skills/tree/main/product-team/ux-researcher-designer
> References: persona-methodology.md, journey-mapping-guide.md, example-personas.md, usability-testing-frameworks.md
> Scripts: persona_generator.py

ユーザーリサーチとデザイン意思決定のための包括的ツールキット。
データ駆動型ペルソナ生成、ジャーニーマッピング、ユーザビリティテスト設計、リサーチ統合の4ワークフローを提供。

---

## Workflow 1: Generate User Persona

### 入力データフォーマット
```json
[
  {
    "user_id": "user_1",
    "age": 32,
    "usage_frequency": "daily",
    "features_used": ["dashboard", "reports", "export"],
    "primary_device": "desktop",
    "usage_context": "work",
    "tech_proficiency": 7,
    "pain_points": ["slow loading", "confusing UI"]
  }
]
```

### ペルソナコンポーネント

| Component | Description | Source |
|-----------|-------------|--------|
| Name & Photo | 記憶に残る識別子 | ストック写真, AI生成 |
| Tagline | 1行サマリー | データから合成 |
| Quote | 本物の声 | インタビュー直接引用 |
| Demographics | 年齢, 役職, 地域 | CRM, 調査 |
| Psychographics | 動機, 価値観, 態度 | インタビュー |
| Goals | 達成したいこと | インタビュー |
| Frustrations | ペインポイント | インタビュー, サポート |
| Behaviors | 行動パターン | 分析, 観察 |
| Scenarios | 利用コンテキスト | インタビュー, ログ |
| Design Implications | アクション可能な推奨 | 全データ |

### Archetype 分類

| Archetype | Identifying Signals | Design Focus |
|-----------|--------------------| -------------|
| Power User | 日次利用, 10+機能, ショートカット | 効率, カスタマイズ |
| Casual User | 週次利用, 3-5機能, シンプル | 簡潔さ, ガイダンス |
| Business User | 業務コンテキスト, チーム機能, ROI | コラボレーション, レポート |
| Mobile-First | モバイル主体, クイックアクション | タッチ, オフライン, スピード |

### バリデーションチェックリスト
- [ ] 20+ ユーザーのデータに基づく（最低）
- [ ] 2+ データソース（定量 + 定性）
- [ ] 具体的でアクション可能なゴール
- [ ] フラストレーションに頻度カウントを含む
- [ ] デザインインプリケーションが具体的
- [ ] 信頼度レベルが明記

### Persona Confidence Levels

| Sample Size | Confidence | Use Case |
|-------------|------------|----------|
| 5-10 users | Low | Exploratory（探索的） |
| 11-30 users | Medium | Directional（方向性） |
| 31+ users | High | Production（本番） |

---

## Workflow 2: Create Journey Map

### ジャーニーマップの構造
```
STAGES:    Awareness -> Consideration -> Acquisition ->
           Onboarding -> Regular Use -> Advocacy

LAYERS:    +-----------------------------------------+
           | Actions: ユーザーが何をするか             |
           +-----------------------------------------+
           | Touchpoints: どこでインタラクションするか  |
           +-----------------------------------------+
           | Emotions: どう感じるか (1-5)             |
           +-----------------------------------------+
           | Pain Points: 何にフラストレーションを感じるか |
           +-----------------------------------------+
           | Opportunities: どこを改善できるか         |
           +-----------------------------------------+
```

### スコープ定義テンプレート
```
Persona: [ペルソナライブラリから名前]
Goal: [達成したい具体的なアウトカム]
Start: [ジャーニーを開始するトリガー]
End: [成功基準またはエグジットポイント]
Timeframe: [時間/日/週]
```

### ステージ詳細テンプレート

各ステージに以下を記録:
1. **Actions**: ユーザーが何をするか
2. **Touchpoints**: どこでインタラクションするか
3. **Thoughts**: 何を考えているか
4. **Emotions**: どう感じるか（1-5）
5. **Pain Points**: 何にフラストレーションを感じるか
6. **Opportunities**: どこを改善できるか

### 機会の優先順位付け

| Factor | Score (1-5) |
|--------|-------------|
| Frequency | どのくらいの頻度で発生するか |
| Severity | どれほど痛みがあるか |
| Breadth | どれだけのユーザーに影響するか |
| Solvability | 修正可能か |

**Priority Score = (Frequency + Severity + Breadth) x Solvability**

### ジャーニーマップ品質チェック
- [ ] スコープが明確（ペルソナ、ゴール、タイムフレーム）
- [ ] 実際のユーザーデータに基づく（仮定ではない）
- [ ] 全レイヤーが埋まっている（アクション、タッチポイント、感情）
- [ ] ステージごとにペインポイントを特定
- [ ] 機会の優先順位付け済み

---

## Workflow 3: Plan Usability Test

### リサーチ質問の設計

| Vague Goal | Testable Question |
|------------|-------------------|
| "使いやすいか?" | "ユーザーは3分以内にチェックアウトを完了できるか?" |
| "ユーザーは好むか?" | "Design A と B でどちらを選ぶか?" |
| "理解できるか?" | "ヒントなしで設定を見つけられるか?" |

### テスト方法の選択

| Method | Participants | Duration | Best For |
|--------|--------------|----------|----------|
| Moderated remote | 5-8 | 45-60 min | 深い洞察 |
| Unmoderated remote | 10-20 | 15-20 min | クイック検証 |
| Guerrilla | 3-5 | 5-10 min | 迅速フィードバック |
| In-person | 5-10 | 60-90 min | 非常にリッチな定性 |
| A/B testing | 100+ | Varies | 統計データ |

### タスク設計

良いタスクフォーマット:
```
SCENARIO: "パリ旅行を計画していると想像してください..."
GOAL: "予算内で3泊のホテルを予約してください"
SUCCESS: "確認ページが表示されたら成功"
```

タスク進行:
1. Warm-up（簡単、自信構築）
2. Core（メイン機能）
3. Secondary（重要だが頻度低い）
4. Edge case（ストレステスト）
5. Free exploration（オープンエンド）

### 成功メトリクス

| Metric | Target |
|--------|--------|
| Completion rate | >80% |
| Time on task | <2x expected |
| Error rate | <15% |
| Satisfaction | >4/5 |

### Usability Issue Severity

| Severity | Definition | Action |
|----------|------------|--------|
| 4 - Critical | タスク完了を阻止 | 即座に修正 |
| 3 - Major | 著しい困難 | リリース前に修正 |
| 2 - Minor | 躊躇を引き起こす | 可能な時に修正 |
| 1 - Cosmetic | 気づくが問題なし | 低優先度 |

### テスト品質チェック
- [ ] リサーチ質問がテスト可能
- [ ] タスクが現実的なシナリオ（指示ではない）
- [ ] デザインごとに 5+ 参加者
- [ ] 成功メトリクスが定義済み
- [ ] 発見に重要度評価を含む

---

## Workflow 4: Synthesize Research

### データコーディング

各データポイントにタグ付け:
- `[GOAL]` — 達成したいこと
- `[PAIN]` — フラストレーション
- `[BEHAVIOR]` — 実際の行動
- `[CONTEXT]` — いつ/どこで製品を使うか
- `[QUOTE]` — ユーザーの直接引用

### クラスタリング
```
User A: 日次利用, 高度な機能, ショートカット
User B: 日次利用, 複雑なワークフロー, 自動化
User C: 週次利用, 基本ニーズ, 時々

Cluster 1: A, B (Power Users)
Cluster 2: C (Casual User)
```

### セグメントサイズの算出

| Cluster | Users | % | Viability |
|---------|-------|---|-----------|
| Power Users | 18 | 36% | Primary persona |
| Business Users | 15 | 30% | Primary persona |
| Casual Users | 12 | 24% | Secondary persona |

### キーファインディングの抽出

各テーマについて:
- Finding statement（発見の記述）
- Supporting evidence（裏付けるエビデンス: 引用, データ）
- Frequency（頻度: X/Y 参加者）
- Business impact（ビジネスインパクト）
- Recommendation（推奨）

### Research Method Selection

| Question Type | Best Method | Sample Size |
|---------------|-------------|-------------|
| "ユーザーは何をするか?" | 分析, 観察 | 100+ events |
| "なぜそうするのか?" | インタビュー | 8-15 users |
| "どれだけうまくできるか?" | ユーザビリティテスト | 5-8 users |
| "何を好むか?" | 調査, A/B テスト | 50+ users |
| "何を感じるか?" | ダイアリースタディ, インタビュー | 10-15 users |

### リサーチ統合品質チェック
- [ ] データが一貫してコーディング済み
- [ ] パターンが 3+ データポイントに基づく
- [ ] 発見にエビデンスを含む
- [ ] 推奨がアクション可能
- [ ] 優先順位が正当化済み

---

## persona_generator.py の概要

データ駆動型ペルソナジェネレーター。ユーザーリサーチデータからペルソナを自動生成する。

### サポートするアーキタイプ
- **power_user**: 日次利用, 10+ 機能, 効率重視
- **casual_user**: 週次利用, 基本ニーズ, シンプルさ重視
- **business_user**: 業務コンテキスト, チームコラボ, ROI 重視
- **mobile_first**: モバイル主体, 移動中, クイックインタラクション

### 出力コンポーネント
- name, archetype, tagline, quote
- demographics: age, location, occupation, education, tech_proficiency
- psychographics: motivations, values, attitudes, lifestyle
- behaviors: usage_patterns, feature_preferences, interaction_style
- needs_and_goals: primary, secondary, functional, emotional
- frustrations: ペインポイント（頻度付き）
- scenarios: コンテキスト付き利用シナリオ
- data_points: sample_size, confidence_level, validation_method
- design_implications: アクション可能な推奨

### 主要メソッド
| Method | Purpose |
|--------|---------|
| `generate_persona_from_data()` | メイン: データからペルソナ生成 |
| `_analyze_user_patterns()` | 利用, デバイス, コンテキストパターン抽出 |
| `_identify_archetype()` | アーキタイプ分類 |
| `_aggregate_demographics()` | 年齢, 地域, テック習熟度算出 |
| `_extract_psychographics()` | 動機, 価値観, 態度抽出 |
| `_identify_needs()` | 一次/二次ゴール, 機能的/感情的ニーズ |
| `_extract_frustrations()` | ペインポイント抽出 |
| `_calculate_data_points()` | サンプルサイズと信頼度 |
| `_derive_design_implications()` | デザイン推奨生成 |

---

## AltMe 向けペルソナ例

### Persona: Kenji the Business Professional

AIツインアプリ「AltMe」のプライマリターゲットユーザー。

**Archetype**: Business User (mobile_first hybrid)

**Demographics**:
- Age Range: 30-45
- Location: 東京都市部
- Occupation: プロダクトマネージャー / 事業開発
- Tech Proficiency: Intermediate-Advanced

**Quote**: "もう一人の自分がいたら、メールの返信と議事録作成を任せたい"

**Goals & Needs**:
- メール作成・返信の自動化で1日30分節約
- ミーティングのブレストを AI と事前に実施
- タスクの優先順位付けを AI ツインに相談

**Frustrations**:
- 既存 AI アシスタントは汎用的すぎて自分のスタイルを理解しない
- セットアップが複雑すぎて途中で諦める
- 課金しても効果が実感できない

**Design Implications**:
- オンボーディングは 5 分以内に完了 + 即座に価値を体感
- パーソナライズの進捗を視覚的に表示
- 無料トライアルで「AI ツインの有用性」を体験させる

**Data Points**:
- Sample Size: 想定（プレローンチ段階）
- Confidence: Low (Exploratory)
- Validation: ターゲット層インタビュー + 競合分析

---

## AltMe 向けジャーニーマップ

### Persona: Kenji the Business Professional
### Goal: AI ツインを日常業務に統合

```
Stage 1: 認知 (Awareness)
+-- Actions: SNS/記事で AltMe を発見
+-- Touchpoints: Twitter, TechBlog, App Store
+-- Emotions: 3/5 (興味)
+-- Pain Points: "AI ツイン" が何をしてくれるか不明確
+-- Opportunities: LP で具体的なユースケースを3つ見せる

Stage 2: オンボーディング (Onboarding)
+-- Actions: アプリDL, サインアップ, 初期設定
+-- Touchpoints: App Store, アプリ内
+-- Emotions: 4/5 (ワクワク) -> 2/5 (面倒)
+-- Pain Points: 質問が多すぎる, 何のための設定かわからない
+-- Opportunities: ステップ数を最小化, 各質問の目的を説明

Stage 3: 初回体験 (First Value)
+-- Actions: AI ツインとの初チャット
+-- Touchpoints: チャット画面
+-- Emotions: 4/5 (感動) or 2/5 (がっかり)
+-- Pain Points: 応答が汎用的, 自分らしさを感じない
+-- Opportunities: 初回から名前を呼ぶ, 設定内容を反映した応答

Stage 4: 課金判断 (Conversion)
+-- Actions: トライアル終了, 課金判断
+-- Touchpoints: ペイウォール, 通知
+-- Emotions: 3/5 (迷い)
+-- Pain Points: 価格に見合う価値が不明, 年額は高く感じる
+-- Opportunities: 具体的な時間節約の実績表示, 限定オファー

Stage 5: 日常利用 (Regular Use)
+-- Actions: 毎日のメール作成, ブレスト, タスク管理
+-- Touchpoints: チャット, 通知, ウィジェット
+-- Emotions: 4/5 (依存, 便利)
+-- Pain Points: たまに的外れな応答, 学習の進捗が見えない
+-- Opportunities: AI の学習進捗ダッシュボード, フィードバック機能

Stage 6: 推奨 (Advocacy)
+-- Actions: 同僚に紹介, SNS共有
+-- Touchpoints: 共有機能, リファラル
+-- Emotions: 5/5 (満足)
+-- Pain Points: 紹介インセンティブがない
+-- Opportunities: リファラルプログラム, チーム向けプラン
```

---

## Interview Question Types (Quick Reference)

| Type | Example | Use For |
|------|---------|---------|
| Context | "普段の1日を教えてください" | 環境の理解 |
| Behavior | "Xをどうやっているか見せてください" | 実際の行動観察 |
| Goals | "何を達成しようとしていますか?" | 動機の発見 |
| Pain | "一番大変なことは?" | フラストレーション特定 |
| Reflection | "何を変えたいですか?" | アイデア生成 |
