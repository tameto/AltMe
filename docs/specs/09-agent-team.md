# 09 --- AgentTeam構成・SDD・ワークフロー

## ステータス: DRAFT v2
- 作成日: 2026-02-14
- 最終更新: 2026-02-15
- 承認状態: 未承認
- 担当: 全体

---

## 1. 開発チーム構成

### 1.1 実装Agent（4体）

| Agent ID | 名称 | 担当範囲 |
|---------|------|---------|
| **A** | Foundation | shared/, services/, config/, auth, レイアウト, DBマイグレーション, OpenClawサービスクライアント |
| **B** | Subscription | subscription/, (paywall)/, RevenueCat全般, Webhook, 課金→プロビジョニング連携 |
| **C** | Core AI | chat/, onboarding/, openclaw/, Edge Functions(chat, provision, destroy, health-check, update-soul-md, restart), WebSocketクライアント |
| **D** | Engagement | journal/, insights/, settings/(OpenClawインスタンス管理UI含む), 通知 |

### 1.2 Claude Code エージェント（16体）

Claude Code Agent Teamsの全エージェント構成:

#### 計画・設計（Opus, Read-only）

| Agent | 用途 | Tools |
|-------|------|-------|
| planner | 実装計画。複雑な機能実装前に使用 | R/G/Gl |
| architect | アーキテクチャ設計・技術選定 | R/G/Gl |

#### 実装（Sonnet, Write権限あり）

| Agent | 用途 | 搭載スキル |
|-------|------|-----------|
| rn-mobile-dev | React Native/Expo 開発 | rn-mobile-dev |
| supabase-backend | DB/Edge Functions/RLS | supabase-backend |
| digitalocean-infra | DigitalOcean/Docker/ネットワーク | digitalocean-infra |
| openclaw-specialist | SOUL.md設計、Gateway API連携、パーソナリティ | openclaw |
| billing-specialist | RevenueCat 課金・ペイウォール | revenuecat |
| screen-designer | 画面設計・UI | ui-designer + pencil-design |
| brand-designer | ブランドアイデンティティ設計 | brand-identity + pencil-design + ui-designer |
| twin-interviewer | 性格診断・SOUL.md 生成 | - |

#### レビュー・監査（Sonnet, Read-only+Bash）

| Agent | 用途 | 搭載スキル |
|-------|------|-----------|
| code-reviewer | コードレビュー | rn-mobile-dev |
| security-auditor | OWASP Mobile Top 10 + RLS 監査 | security-audit |
| qa-debugger | バグ検出・テスト（Write権限あり） | qa-debug |
| design-reviewer | デザインレビュー | design-review + pencil-design + ui-designer |

#### ドキュメント（Haiku, 低コスト）

| Agent | 用途 | 搭載スキル |
|-------|------|-----------|
| doc-updater | 仕様書・ドキュメント更新 | - |
| task-refiner | タスク粒度・仕様整合性 | task-refinement |

---

## 2. スキル一覧（15個）

### 企画〜仕様パイプライン

| スキル | 内容 | ファイル数 |
|--------|------|-----------|
| monetize-app-plan | マネタイズ設計 | 4 |
| agent-team-design | チーム設計 | 2 |
| spec-driven-dev | 仕様駆動開発 9ステップパイプライン | 7 |

### 技術スキル

| スキル | ソース | ルール数 |
|--------|--------|---------|
| rn-mobile-dev | vercel-react-native-skills | 36 |
| supabase-backend | supabase/agent-skills | 28 |
| digitalocean-infra | do-app-platform-skills | 6カテゴリ |
| openclaw | openclaw/openclaw | 4カテゴリ |
| revenuecat | jeiting/revenuecat | SDK+API+Webhook |

### デザイン・品質

| スキル | 内容 | ファイル数 |
|--------|------|-----------|
| ui-designer | mae616 + frontend-design + ui-ux-pro-max + ux-research + design-review 統合 | 11 |
| pencil-design | Pencil デザインツール統合（.pen, MCP, コンポーネント） | 4 |
| design-review | 12+1視点デザインレビュー、Phase 0-4 ワークフロー | 5 |
| brand-identity | ブランドアイデンティティ設計 4フェーズパイプライン | 7 |
| task-refinement | タスク精査（INVEST基準） | 2 |
| security-audit | OWASP Mobile Top 10 セキュリティ監査 | 2 |
| qa-debug | QA・デバッグ | 2 |

---

## 3. ファイル所有権ルール

### 3.1 Agent別担当ファイル

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

### 3.2 コード所有権ルール

| ルール | 説明 |
|--------|------|
| features/ は担当Agentのみ変更可 | Agent Cが features/journal/ を変更してはいけない |
| shared/ の変更はAgent Aが管理 | 他AgentはPR/提案としてAgent Aに依頼 |
| services/ は担当APIのみ | Agent Bが services/openai/ を触ってはいけない |
| 型定義の変更は全Agent合意 | shared/types/ の変更は全Agentに影響するため事前確認 |
| Edge Functionsは担当機能のみ | supabase/functions/ は機能単位で所有権分離 |

### 3.3 共有リソースの変更プロトコル

```
1. 変更が必要なAgentが変更提案を記述
2. Agent A が影響範囲を確認
3. 影響を受けるAgent全員が合意
4. Agent A が変更を実施
5. 全Agentに変更を通知
```

---

## 4. 仕様駆動開発（SDD）ワークフロー

### 4.1 原則

- **仕様書が正（Single Source of Truth）** --- 実装は仕様書に従う。仕様にないものは作らない
- **型が契約（Contract）** --- `src/shared/types/` の型定義がAgent間の契約
- **仕様変更は仕様書から** --- コードだけ変えず、まず仕様書を更新してから実装
- **テストは仕様の検証** --- テストケースは仕様書の受け入れ条件から導出

### 4.2 SDDパイプライン（9ステップ）

```
Step 1: Constitution --- 指針策定（specs/constitution.md）
Step 2: Specify --- 仕様書生成（specs/features/*.md）
Step 3: Clarify --- 曖昧点解消（9カテゴリ自動スキャン → 質問 → specs更新）
Step 4: Plan --- 実装計画（specs/plan.md）
Step 5: Design --- Pencil .pen デザイン作成 + 画面仕様書生成
Step 6: Tasks --- TaskCreate API でタスク登録 + 粒度チェック
Step 7: Implement --- Agent Team で並列実装
Step 8: Review --- コードレビュー + セキュリティ監査 + QA
Step 9: Reconcile --- 仕様書 + デザインを実装に同期（doc-updater担当）
```

### 4.3 Step別Agent対応

| Step | 担当Agent |
|------|----------|
| 1 Constitution | planner / architect |
| 2 Specify | planner |
| 3 Clarify | planner + ユーザー |
| 4 Plan | planner / architect |
| 5 Design | screen-designer + design-reviewer |
| 6 Tasks | task-refiner |
| 7 Implement | rn-mobile-dev, supabase-backend, billing-specialist, etc. |
| 8 Review | code-reviewer, security-auditor, qa-debugger |
| 9 Reconcile | doc-updater |

### 4.4 SDD適用基準

| 基準 | 質問 |
|------|------|
| 1 | 新しい Supabase テーブル / マイグレーションが必要か？ |
| 2 | 3ファイル以上の新規作成が必要か？ |
| 3 | 複数 Agent で並行作業する可能性があるか？ |
| 4 | ビジネスルールの確認・仕様整理が必要か？ |
| 5 | QA やステークホルダーのレビューが必要か？ |

- **0個該当 -> S**: 直接修正
- **1個該当 -> M**: ブランチ + PR
- **2個以上 -> L**: `/sdd-specify` で SDD フロー開始

### 4.5 specs/ と .sdd/specs/ の関係

- `specs/` = **Single Source of Truth**（永続的な仕様書）
- `.sdd/specs/` = **作業用アーティファクト**（機能開発中の一時的な設計文書）
- 実装完了後、Step 9 Reconcile で `specs/` を同期更新

---

## 5. ワークフロー一覧（6パターン）

### 5.1 新機能開発

```
Leader -> planner（計画） -> 承認
  |
並列実行:
  +-- rn-mobile-dev（フロント実装）
  +-- supabase-backend（バックエンド実装）
  +-- screen-designer（画面設計）
  |
統合後:
  +-- code-reviewer（レビュー）
  +-- security-auditor（監査）
  +-- qa-debugger（テスト）
  |
doc-updater（仕様書更新）
```

### 5.2 バグ修正

```
Leader -> qa-debugger（原因特定）
  |
修正Agent（バグ箇所に応じて選択）:
  +-- rn-mobile-dev（フロントバグ）
  +-- supabase-backend（バックエンドバグ）
  +-- billing-specialist（課金バグ）
  |
qa-debugger（修正検証）
```

### 5.3 画面実装

```
Leader -> screen-designer（画面設計）
  |
rn-mobile-dev（コンポーネント実装）
  |
billing-specialist（課金ゲート追加、必要な場合）
  |
code-reviewer（レビュー）
```

### 5.4 オンボーディング改善

```
Leader -> twin-interviewer（質問設計・SOUL.md改善）
  |
並列:
  +-- screen-designer（UI改善）
  +-- supabase-backend（データモデル調整）
  |
billing-specialist（ペイウォール導線最適化）
  |
qa-debugger（フロー全体テスト）
```

### 5.5 インフラデプロイ

```
Leader -> architect（設計レビュー）
  |
digitalocean-infra（プロビジョニング実装）
  |
supabase-backend（Edge Function連携）
  |
security-auditor（セキュリティ確認）
  |
qa-debugger（E2Eテスト）
```

### 5.6 リリース前チェック

```
Leader -> 全チーム並列:
  +-- code-reviewer（全体レビュー）
  +-- security-auditor（セキュリティ監査）
  +-- qa-debugger（E2Eテスト）
  +-- task-refiner（仕様カバレッジ確認）
  |
doc-updater（リリースノート作成）
```

---

## 6. Hooks（プロジェクトレベル、9個）

### PreToolUse --- 実行前チェック（6個）

| Hook | 対象Tool | 内容 |
|------|---------|------|
| protect-files.sh | Write/Edit | `.env`, `package-lock.json` 変更ブロック |
| secret-detect.sh | Write/Edit | APIキー/トークン/JWT ハードコード検出 -> ブロック |
| shared-guard.sh | Write/Edit | shared/types/, hooks/, components/, config/ 変更警告 |
| file-naming.sh | Write | 新規ファイルの kebab-case 命名規約チェック -> ブロック |
| spec-check.sh | Write | src/features/ 新規ファイル作成時の仕様書存在確認 -> 警告 |
| bash-guard.sh | Bash | `rm -rf /`, `git push --force main` 等ブロック |

### PostToolUse --- 実行後チェック（3個）

| Hook | 対象Tool | 内容 |
|------|---------|------|
| format-on-save.sh | Write/Edit | prettier 自動フォーマット |
| export-default-check.sh | Write/Edit | export default 検出 -> 警告（app/ は例外） |
| task-size-check.sh | TaskCreate | タスク粒度チェック（文字数/ファイル数/アクション数/複合名） -> 警告 |

---

## 7. タスク粒度ガイド

| サイズ | 目安時間 | 例 |
|--------|---------|-----|
| S | 1-2h | 型定義追加、hook作成、小さなUI修正 |
| M | 2-4h | 画面1つ実装、Edge Function作成、テスト追加 |
| L | 4-8h | 機能一式実装、DB設計+マイグレーション |
| XL | 8h+ | 分割が必要。L以下に分解する |

---

## 8. 開発フェーズとAgent稼働

### 8.1 フェーズ構成

```
Phase 0: 基盤（Agent A）
  |
Phase 1: 認証 + 課金基盤（Agent A + B + C 並列）
  |
Phase 2: コア機能MVP（Agent C + D 並列）
  |
Phase 3: OpenClaw統合（全Agent）
  |
Phase 4: 課金最適化 + リリース準備
```

### 8.2 インターフェース凍結タイミング

| フェーズ | 凍結対象 |
|---------|---------|
| Phase 0 完了時 | shared/types/ 全型定義 |
| Phase 1 中盤 | shared/hooks/ インターフェース |
| Phase 2 開始時 | Edge Function のリクエスト/レスポンス型 |

### 8.3 各フェーズの完了条件

| フェーズ | 完了条件 |
|---------|---------|
| Phase 0 | 型定義・空hookが定義済み、Expo起動成功 |
| Phase 1 | 認証動作、ペイウォール表示、Entitlementチェック動作 |
| Phase 2 | オンボーディング -> チャット -> 日記 -> 洞察の一連フロー動作 |
| Phase 3 | OpenClawプロビジョニング -> WebSocketチャット -> ヘルスチェックのE2E動作 |
| Phase 4 | 課金最適化、E2Eテスト通過、ストア申請準備完了 |

---

## 9. 検証条件

- [ ] 全Agentが担当ファイル以外を変更していないこと
- [ ] shared/types/ の型定義がPhase 0で凍結されていること
- [ ] Agent間の依存関係が正しく管理されていること
- [ ] 各Phaseの完了条件が満たされていること
- [ ] SDDパイプラインの各ステップが正しく実行されること
- [ ] Hooksが意図通りに動作すること（ブロック/警告）
- [ ] 統合テストで全機能が連携動作すること
