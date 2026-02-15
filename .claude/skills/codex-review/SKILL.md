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

## いつ使うか

| シーン | 説明 |
|--------|------|
| Phase 完了後 | Agent Team の Phase 完了時にクロスレビュー |
| PR 作成前 | マージ前の最終チェック |
| SDD Step 8: Review | code-reviewer / security-auditor / qa-debugger と**並列**実行 |
| 重要な変更後 | 課金フロー、認証、RLS 等のセキュリティクリティカルな変更 |

## ワークフロー

### Step 1: 対象の特定

```bash
# 直近の変更
git diff --stat HEAD~1

# または特定ブランチとの差分
git diff main...HEAD --stat
```

### Step 2: ファイル分割戦略

| 差分サイズ | 戦略 |
|-----------|------|
| ~200行 | 1回のCodexセッションで全体レビュー |
| 200-500行 | 機能単位で2-3回に分割 |
| 500行超 | ファイル単位で分割、各セッションにコンテキストを付与 |

### Step 3: Codex セッション実行

`mcp__codex__codex` ツールを使用:

```json
{
  "prompt": "以下のコード変更をレビューしてください...",
  "model": "gpt-5.3-codex",
  "cwd": "/Users/tm/work/AltMe",
  "approval-policy": "never",
  "sandbox": "read-only"
}
```

**プロンプト構成テンプレート**:

```
あなたはシニアコードレビュアーです。以下の変更をレビューしてください。

## プロジェクト概要
- React Native (Expo SDK 54) + TypeScript strict mode
- Supabase (Auth + PostgreSQL + Edge Functions)
- Zustand 5.x (状態管理)
- 命名規約: camelCase(変数), PascalCase(コンポーネント), kebab-case(ファイル)

## 変更の目的
[タスクIDと説明]

## 仕様書（受け入れ条件）
[specs/ から AC を抜粋]

## コード差分
[git diff の内容]

## チェック項目
1. バグ・ロジックエラー（特にエッジケース）
2. TypeScript 型安全性（any の使用、型アサーション）
3. React hooks ルール違反（条件付きhook呼び出し、依存配列漏れ）
4. メモリリーク（useEffect のクリーンアップ漏れ）
5. セキュリティ（XSS, インジェクション, シークレット漏洩）
6. Supabase RLS との整合性
7. 仕様書の AC を全て満たしているか
8. パフォーマンス（不要な再レンダリング、大量データ処理）

80%以上の確信がある問題のみ報告してください。
スタイル的な好みはスキップしてください。
```

### Step 4: 結果の検証と統合

Codex の指摘を以下で検証:
1. **指摘箇所のコードを実際に読む** — hallucination でないか確認
2. **仕様書と照合** — 仕様に基づいた正当な指摘か確認
3. **Claude code-reviewer の結果と比較** — 両方が検出した問題は信頼度が高い

## SDD Step 8 への統合

Step 8: Review では以下の4レビュアーを**並列実行**:

```
Step 8: Review（並列）
  ├─ code-reviewer (Claude Sonnet) — コード品質
  ├─ security-auditor (Claude Sonnet) — セキュリティ
  ├─ qa-debugger (Claude Sonnet) — QA・バグ検出
  └─ codex-reviewer (GPT-5.3-Codex) — クロスモデル視点 ★NEW
```

### 統合レポートフォーマット

```markdown
## Cross-Model Review Summary

### 全レビュアー一致（高信頼度）
- [問題] — code-reviewer + codex-reviewer 両方が検出

### Codex 固有の発見
- [問題] — Codex のみが検出。検証結果: [確認済み/誤検出]

### Claude 固有の発見
- [問題] — Claude レビュアーのみが検出

### 統計
| レビュアー | Critical | Warning | Info |
|-----------|----------|---------|------|
| code-reviewer | X | X | X |
| security-auditor | X | X | X |
| qa-debugger | X | X | X |
| codex-reviewer | X | X | X |
```

## コスト考慮

| モデル | コスト | 推奨用途 |
|--------|-------|---------|
| gpt-5.3-codex | 標準 | デフォルト。最も高精度なコーディングレビュー |
| gpt-5.3-codex-spark | 低い | リアルタイムフィードバック、1000 tok/s |
| gpt-5.1-codex-max | 高い | 長期的・複雑なレビュー（大規模リファクタリング等） |
| gpt-5-codex-mini | 最も低い | コスト重視の軽微な変更レビュー |

**デフォルト: gpt-5.3-codex**。コスト重視なら `gpt-5-codex-mini`。
