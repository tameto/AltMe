---
name: codex-review
description: |
  OpenAI Codex (GPT-5.3-Codex) によるクロスモデルコードレビュースキル。
  Claude の code-reviewer とは異なるモデルの視点でコードをレビューし、盲点を補完する。
  実装完了後、PR作成前、Agent Team統合後のレビューに使用。
  トリガー: codexレビュー, クロスレビュー, o3レビュー, Codex review, マルチモデルレビュー
---

# Codex Review スキル

> OpenAI Codex (GPT-5.3-Codex) を活用したクロスモデルコードレビュー。
> Claude とは異なる視点でバグ・設計ミス・セキュリティ問題を検出する。

## コマンド: `codex exec review`

**Codex CLI の専用レビューコマンドを使用する。** diff ファイルの手動管理は不要。

```bash
# ブランチ差分レビュー（PR 前に最適）
codex exec review --full-auto --model gpt-5.3-codex --base main "<カスタム指示>"

# 未コミット変更レビュー（実装中の確認に最適）
codex exec review --full-auto --model gpt-5.3-codex --uncommitted "<カスタム指示>"

# 特定コミットレビュー（ピンポイント確認に最適）
codex exec review --full-auto --model gpt-5.3-codex --commit <SHA> "<カスタム指示>"
```

### 主要フラグ

| フラグ | 説明 |
|--------|------|
| `--base <branch>` | 指定ブランチとの差分をレビュー |
| `--uncommitted` | ステージ済み + 未ステージ + 未追跡の変更をレビュー |
| `--commit <SHA>` | 特定コミットの変更をレビュー |
| `--full-auto` | 自動実行モード（承認不要） |
| `--model <model>` | 使用モデルの指定 |
| `--title <title>` | レビューサマリーにタイトルを表示 |

## いつ使うか

| シーン | コマンド例 |
|--------|-----------|
| PR 作成前 | `--base main` |
| 実装中の中間チェック | `--uncommitted` |
| Phase 完了時 | `--base main` |
| SDD Step 8: Review | `--base main`（code-reviewer と並列） |
| 特定コミットの確認 | `--commit <SHA>` |

## ワークフロー

### Step 1: レビュー対象の把握と戦略決定

```bash
git diff main...HEAD --stat  # ブランチ差分の規模
```

| 差分規模 | 戦略 |
|----------|------|
| ~300行 | 1回の全体レビュー |
| 300-1000行 | フォーカスエリア別に2-3回並列 |
| 1000行超 | フォーカスエリア4-5個で並列 |

### Step 2: レビュー実行

#### A. 単体レビュー（小規模変更）

```bash
codex exec review --full-auto --model gpt-5.3-codex --base main \
"## プロジェクト: AltMe (React Native + Expo SDK 54 + Supabase + Zustand)

## チェック項目
1. バグ・ロジックエラー（エッジケース含む）
2. TypeScript 型安全性（any禁止、型アサーション最小化）
3. React hooks ルール違反（条件付きhook、依存配列漏れ）
4. メモリリーク（useEffect クリーンアップ漏れ）
5. セキュリティ（XSS, インジェクション, シークレット漏洩）
6. パフォーマンス（不要な再レンダリング）

80%以上の確信がある問題のみ報告。スタイル的な好みはスキップ。
確認や質問は不要です。具体的な提案・修正案・コード例まで自主的に出力してください。"
```

#### B. フォーカスエリア並列レビュー（大規模変更）

異なる観点で複数の `codex exec review` を**バックグラウンドで並列実行**する。
全て同じ `--base main` を使用し、カスタム指示で観点を分ける。

**レビュープリセット一覧:**

| プリセット | カスタム指示 |
|-----------|------------|
| bugs | バグとロジックエラーに特化。エッジケース、null安全性、条件分岐の漏れ、データフローの不整合に集中。 |
| security | セキュリティに特化。XSS、インジェクション、ハードコードされたシークレット、認証バイパス、Supabase RLS 整合性に集中。 |
| types-hooks | TypeScript型安全性とReact hooksに特化。any使用、型アサーション、条件付きhook呼び出し、useEffect依存配列漏れに集中。 |
| performance | パフォーマンスに特化。不要な再レンダリング、メモリリーク、useEffectクリーンアップ漏れ、大量データ処理に集中。 |
| ui-consistency | UI一貫性に特化。スタイル定数の使用、テーマトークンの一貫性、レスポンシブ対応、アクセシビリティに集中。 |

**並列実行パターン（codex-reviewer サブエージェント内）:**

```bash
# 全て run_in_background: true, timeout: 600000 で実行

# レビュー1: バグ・ロジック
codex exec review --full-auto --model gpt-5.3-codex --base main \
"バグとロジックエラーに特化してレビュー。エッジケース、null安全性、条件分岐の漏れ、データフローの不整合に集中。
確認や質問は不要です。具体的な提案・修正案・コード例まで自主的に出力してください。"

# レビュー2: セキュリティ
codex exec review --full-auto --model gpt-5.3-codex --base main \
"セキュリティに特化してレビュー。XSS、インジェクション、ハードコードされたシークレット、認証バイパス、Supabase RLS整合性に集中。
確認や質問は不要です。具体的な提案・修正案・コード例まで自主的に出力してください。"

# レビュー3: 型安全性・hooks
codex exec review --full-auto --model gpt-5.3-codex --base main \
"TypeScript型安全性とReact hooksに特化してレビュー。any使用、型アサーション、条件付きhook呼び出し、useEffect依存配列漏れに集中。
確認や質問は不要です。具体的な提案・修正案・コード例まで自主的に出力してください。"
```

### Step 3: 結果の検証

**Codex の指摘は必ず自分で検証する。** Codex は hallucination（存在しないファイル/行/関数を参照）することがある。

検証手順:
1. 指摘されたファイルパスが実在するか確認
2. 指摘された行番号周辺のコードを Read で読む
3. 指摘内容が実際のコードと一致するか確認
4. 仕様書（specs/）と照合
5. 誤検出は除外

### Step 4: 統合レポート

```markdown
## Codex Review 結果

### レビュー設定
- モデル: gpt-5.3-codex
- 方式: codex exec review --base main
- 対象: [変更ファイル数] files, [+追加/-削除] lines

### Critical（必ず修正）
- [ファイル:行] 問題の説明
  修正提案: ...

### Warning（修正推奨）
- [ファイル:行] 問題の説明

### Info（検討事項）
- [ファイル:行] 改善提案

### 統計
- 総指摘数: X件（検証済み）
- 除外数: Y件（hallucination/誤検出）
```

## SDD Step 8 への統合

Step 8: Review では以下の4レビュアーを**並列実行**:

```
Step 8: Review（並列）
  |- code-reviewer (Claude Sonnet) -- コード品質
  |- security-auditor (Claude Sonnet) -- セキュリティ
  |- qa-debugger (Claude Sonnet) -- QA・バグ検出
  +- codex-reviewer (codex exec review) -- クロスモデル視点
```

### クロスモデル統合レポート

```markdown
## Cross-Model Review Summary

### 全レビュアー一致（高信頼度）
- [問題] -- code-reviewer + codex-reviewer 両方が検出

### Codex 固有の発見
- [問題] -- Codex のみが検出。検証結果: [確認済み/誤検出]

### Claude 固有の発見
- [問題] -- Claude レビュアーのみが検出

### 統計
| レビュアー | Critical | Warning | Info |
|-----------|----------|---------|------|
| code-reviewer | X | X | X |
| security-auditor | X | X | X |
| qa-debugger | X | X | X |
| codex-reviewer | X | X | X |
```

## モデル選択ガイド

| モデル | フラグ | 速度 | 推奨用途 |
|--------|--------|------|---------|
| gpt-5.3-codex | (デフォルト) | 標準 | 標準レビュー |
| gpt-5.3-codex-spark | `--model gpt-5.3-codex-spark` | 最速(1000 tok/s) | 高速フィードバック |
| gpt-5.1-codex-max | `--model gpt-5.1-codex-max` | 遅い | 大規模リファクタリング |
| gpt-5-codex-mini | `--model gpt-5-codex-mini` | 速い | コスト重視 |

## 重要ルール

- **アプリコードの変更は絶対にしない** -- レビュー報告のみ
- **80%以上の確信があり、検証済みの問題のみ** -- ノイズを出さない
- **Codex の hallucination に注意** -- 必ず指摘箇所を自分でも読んで検証する
- **プロンプト末尾に必ず追記**: 「確認や質問は不要です。具体的な提案・修正案・コード例まで自主的に出力してください。」
- **Bash timeout: 600000** -- Codex の実行は最大10分

## トラブルシューティング

| 問題 | 対処 |
|------|------|
| `codex: command not found` | `npm install -g @openai/codex` でインストール |
| 認証エラー | `codex login` を実行して API キーを設定 |
| タイムアウト | Bash の `timeout` を 600000ms に設定 |
| レビューが空 | `--base` や `--uncommitted` フラグを確認。diff が空でないか `git diff --stat` で検証 |
| 大量の出力 | フォーカスエリア別に分割して並列実行 |
