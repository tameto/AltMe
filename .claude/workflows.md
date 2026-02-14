# AltMe Agent Teams ワークフロー

> 前提: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` を `~/.claude/settings.json` の env に設定すること

## エージェント一覧（13体）

| Agent | Model | Tools | 用途 |
|-------|-------|-------|------|
| planner | opus | R/G/Gl | 実装計画（Read-only） |
| architect | opus | R/G/Gl | アーキテクチャ設計（Read-only） |
| rn-mobile-dev | sonnet | R/W/E/B/G/Gl | React Native 実装 |
| supabase-backend | sonnet | R/W/E/B/G/Gl | Supabase DB/Edge Functions |
| digitalocean-infra | sonnet | R/W/E/B/G/Gl | DigitalOcean インフラ |
| billing-specialist | sonnet | R/W/E/B/G/Gl | RevenueCat 課金 |
| screen-designer | sonnet | R/W/E/G/Gl | 画面設計・UI |
| twin-interviewer | sonnet | R/W/E/B/G/Gl | 性格診断・SOUL.md |
| code-reviewer | sonnet | R/B/G/Gl | コードレビュー（Read-only） |
| security-auditor | sonnet | R/B/G/Gl | セキュリティ監査（Read-only） |
| qa-debugger | sonnet | R/W/E/B/G/Gl | QA・デバッグ |
| doc-updater | haiku | R/W/E/G/Gl | ドキュメント更新 |
| task-refiner | haiku | R/G/Gl | タスク精査（Read-only） |

R=Read, W=Write, E=Edit, B=Bash, G=Grep, Gl=Glob

## ワークフロー1: 新機能開発

```
Leader → planner（計画） → 承認
  ↓
並列実行:
  ├─ rn-mobile-dev（フロント実装）
  ├─ supabase-backend（バックエンド実装）
  └─ screen-designer（画面設計）
  ↓
統合後:
  ├─ code-reviewer（レビュー）
  ├─ security-auditor（監査）
  └─ qa-debugger（テスト）
  ↓
doc-updater（仕様書更新）
```

### 実行例
```
1. Leader: task-refiner で仕様書→タスク変換を検証
2. Leader: TaskCreate で機能別タスクを作成
3. Team spawn: rn-mobile-dev, supabase-backend, screen-designer
4. 各メンバー: TaskList → 自分の担当タスクを取得 → 実装
5. 統合: Leader が code-reviewer, security-auditor, qa-debugger を順次実行
6. 完了: doc-updater で仕様書・CLAUDE.md を更新
```

## ワークフロー2: バグ修正

```
Leader → qa-debugger（原因特定）
  ↓
修正Agent（バグ箇所に応じて選択）:
  ├─ rn-mobile-dev（フロントバグ）
  ├─ supabase-backend（バックエンドバグ）
  └─ billing-specialist（課金バグ）
  ↓
qa-debugger（修正検証）
```

## ワークフロー3: 画面実装

```
Leader → screen-designer（画面設計）
  ↓
rn-mobile-dev（コンポーネント実装）
  ↓
billing-specialist（課金ゲート追加、必要な場合）
  ↓
code-reviewer（レビュー）
```

## ワークフロー4: オンボーディング改善

```
Leader → twin-interviewer（質問設計・SOUL.md改善）
  ↓
並列:
  ├─ screen-designer（UI改善）
  └─ supabase-backend（データモデル調整）
  ↓
billing-specialist（ペイウォール導線最適化）
  ↓
qa-debugger（フロー全体テスト）
```

## ワークフロー5: インフラデプロイ

```
Leader → architect（設計レビュー）
  ↓
digitalocean-infra（プロビジョニング実装）
  ↓
supabase-backend（Edge Function連携）
  ↓
security-auditor（セキュリティ確認）
  ↓
qa-debugger（E2Eテスト）
```

## ワークフロー6: リリース前チェック

```
Leader → 全チーム並列:
  ├─ code-reviewer（全体レビュー）
  ├─ security-auditor（セキュリティ監査）
  ├─ qa-debugger（E2Eテスト）
  └─ task-refiner（仕様カバレッジ確認）
  ↓
doc-updater（リリースノート作成）
```

## タスク粒度ガイド

| サイズ | 目安時間 | 例 |
|--------|---------|-----|
| S | 1-2h | 型定義追加、hook作成、小さなUI修正 |
| M | 2-4h | 画面1つ実装、Edge Function作成、テスト追加 |
| L | 4-8h | 機能一式実装、DB設計+マイグレーション |
| XL | 8h+ | 分割が必要。L以下に分解する |

## ファイル競合回避ルール

各 Agent の担当ファイル範囲を明確にする：

| Agent | 変更可能な範囲 |
|-------|-------------|
| rn-mobile-dev | `app/`, `src/features/*/components/`, `src/shared/components/` |
| supabase-backend | `supabase/`, `src/services/supabase/`, `src/shared/types/` |
| digitalocean-infra | `src/services/digitalocean/`, `src/services/openclaw/` |
| billing-specialist | `src/features/subscription/`, `src/services/revenuecat/`, `app/(paywall)/` |
| screen-designer | `app/`, `src/features/*/components/`, `src/config/theme.ts` |
| twin-interviewer | `app/(onboarding)/`, `src/features/onboarding/`, `src/features/chat/` |
| qa-debugger | すべて（テスト・修正目的） |
| doc-updater | `specs/`, `docs/`, `CLAUDE.md` |

**共有ファイル**（`src/shared/`）を変更する場合は Leader を通じて調整すること。
