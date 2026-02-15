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

## コマンド体系

2つのコマンドを使い分ける:

### A. `codex exec review` — 標準レビュー（推奨）

diff 取得とレビューを自動で行う。**`--base`/`--uncommitted`/`--commit` はカスタムプロンプトと併用不可。**

```bash
# ブランチ差分レビュー（PR 前に最適）
codex exec review --full-auto --model gpt-5.3-codex --base main

# 未コミット変更レビュー（実装中の確認に最適）
codex exec review --full-auto --model gpt-5.3-codex --uncommitted

# 特定コミットレビュー（ピンポイント確認に最適）
codex exec review --full-auto --model gpt-5.3-codex --commit <SHA>
```

### B. `codex exec` — フォーカスレビュー（カスタム指示が必要な場合）

特定の観点に絞ったレビューや、カスタム指示を渡す場合。diff を手動で渡す。

```bash
# 事前準備: diff をファイルに書き出す
git diff main...HEAD > /tmp/codex-review-diff.txt

codex exec --full-auto --model gpt-5.3-codex \
"以下の差分ファイル /tmp/codex-review-diff.txt を読んでレビューしてください。
[フォーカス指示]
確認や質問は不要です。具体的な提案・修正案・コード例まで自主的に出力してください。"
```

### 主要フラグ（`codex exec review`）

| フラグ | 説明 | プロンプト併用 |
|--------|------|-------------|
| `--base <branch>` | 指定ブランチとの差分をレビュー | 不可 |
| `--uncommitted` | ステージ済み + 未ステージ + 未追跡の変更をレビュー | 不可 |
| `--commit <SHA>` | 特定コミットの変更をレビュー | 不可 |
| `--full-auto` | 自動実行モード（承認不要） | - |
| `--model <model>` | 使用モデルの指定 | - |
| `--title <title>` | レビューサマリーにタイトルを表示 | - |

## いつ使うか

| シーン | コマンド |
|--------|---------|
| PR 作成前（包括的レビュー） | `codex exec review --base main` |
| 実装中の中間チェック | `codex exec review --uncommitted` |
| 特定の観点でレビュー | `codex exec` + diff ファイル + カスタム指示 |
| SDD Step 8: Review | `codex exec review --base main`（code-reviewer と並列） |
| 大規模変更の並列レビュー | `codex exec review --base` + `codex exec` x N |

## ワークフロー

### Step 1: レビュー対象の把握と戦略決定

```bash
git diff main...HEAD --stat  # ブランチ差分の規模
```

| 差分規模 | 戦略 | コマンド |
|----------|------|---------|
| ~500行 | 標準レビュー1回 | `codex exec review --base main` |
| 500-2000行 | 標準 + フォーカス1-2個並列 | `review --base` + `exec` x1-2 |
| 2000行超 | 標準 + フォーカス3-5個並列 | `review --base` + `exec` x3-5 |

### Step 2: レビュー実行

#### A. 標準レビュー（常に実行）

```bash
codex exec review --full-auto --model gpt-5.3-codex --base main
```

#### B. フォーカスレビュー（大規模変更時に追加で並列実行）

diff をファイルに書き出してから、異なるフォーカスで `codex exec` を並列実行。
全て `run_in_background: true`, `timeout: 600000` で起動。

```bash
# 事前準備: diff を書き出す
git diff main...HEAD > /tmp/codex-review-diff.txt
```

**レビュープリセット一覧:**

| プリセット | カスタム指示 |
|-----------|------------|
| bugs | バグとロジックエラーに特化。エッジケース、null安全性、条件分岐の漏れ、データフローの不整合に集中。 |
| security | セキュリティに特化。XSS、インジェクション、ハードコードされたシークレット、認証バイパス、Supabase RLS 整合性に集中。 |
| types-hooks | TypeScript型安全性とReact hooksに特化。any使用、型アサーション、条件付きhook呼び出し、useEffect依存配列漏れに集中。 |
| performance | パフォーマンスに特化。不要な再レンダリング、メモリリーク、useEffectクリーンアップ漏れ、大量データ処理に集中。 |
| ui-consistency | UI一貫性に特化。スタイル定数の使用、テーマトークンの一貫性、レスポンシブ対応、アクセシビリティに集中。 |

```bash
# フォーカス1: バグ・ロジック
codex exec --full-auto --model gpt-5.3-codex \
"以下の差分ファイル /tmp/codex-review-diff.txt を読んでレビューしてください。
バグとロジックエラーに特化。エッジケース、null安全性、条件分岐の漏れに集中。
80%以上の確信がある問題のみ報告。
確認や質問は不要です。具体的な提案・修正案・コード例まで自主的に出力してください。"

# フォーカス2: セキュリティ
codex exec --full-auto --model gpt-5.3-codex \
"以下の差分ファイル /tmp/codex-review-diff.txt を読んでレビューしてください。
セキュリティに特化。XSS、インジェクション、ハードコードされたシークレットに集中。
80%以上の確信がある問題のみ報告。
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
- 方式: codex exec review --base main + codex exec (focus x N)
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
- **`codex exec review` は `--base`/`--uncommitted` とカスタムプロンプトの併用不可** -- フォーカスレビューは `codex exec` を使う
- **プロンプト末尾に必ず追記**: 「確認や質問は不要です。具体的な提案・修正案・コード例まで自主的に出力してください。」
- **Bash timeout: 600000** -- Codex の実行は最大10分

## トラブルシューティング

| 問題 | 対処 |
|------|------|
| `codex: command not found` | `npm install -g @openai/codex` でインストール |
| 認証エラー | `codex login` を実行して API キーを設定 |
| タイムアウト | Bash の `timeout` を 600000ms に設定 |
| レビューが空 | `--base` や `--uncommitted` フラグを確認。diff が空でないか `git diff --stat` で検証 |
| `--base` とプロンプト併用エラー | `codex exec review` の `--base`/`--uncommitted`/`--commit` はプロンプト引数と同時使用不可。フォーカスレビューは `codex exec` を使う |
| 大量の出力 | フォーカスエリア別に分割して並列実行 |
