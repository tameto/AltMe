# AltMe — AI Personal Twin App (powered by OpenClaw)

## プロジェクト概要
「もう一人の自分」AIツインを構築するアプリ。
課金ユーザーごとにDigitalOcean上にOpenClawインスタンスをデプロイし、
パーソナライズされたAIツインとの会話・日記・自己分析を提供する。

マネタイズ目標：6ヶ月後に月間MRR ¥200,000〜500,000。

## 技術スタック
- React Native (Expo SDK 54) + Expo Router v3
- Zustand 5.x（状態管理、persist middleware使用）
- Supabase（BaaS: Auth + PostgreSQL + Edge Functions）
- OpenClaw（パーソナルAIエージェント、ユーザーごとにDigitalOcean Dropletへデプロイ）
- DigitalOcean（インフラプロビジョニング）
- RevenueCat SDK 8.x（課金管理）
- Expo Notifications（プッシュ通知）

## アーキテクチャ
- モバイルアプリ → Supabase Backend → DigitalOcean API → OpenClawデプロイ
- Freeチャット: App → Supabase Edge Function → OpenAI API（SSE、1日3回制限）
- Proチャット: App → WebSocket → ユーザー専用OpenClaw Gateway (port 18789)
- 課金後にDroplet自動プロビジョニング → OpenClaw Docker起動 → SOUL.md設定

## 課金体系
- 月額: ¥4,980
- 年額: ¥39,800（月額換算 ¥3,317、33%OFF）
- 初回限定年額: ¥29,800（50%OFF、24時間限定）
- 3日間無料トライアル

---

## 開発方法論：仕様駆動開発（Spec-Driven Development）

### 原則
- **仕様書が正（Single Source of Truth）** — 実装は仕様書に従う。仕様にないものは作らない
- **型が契約（Contract）** — `src/shared/types/` の型定義がAgent間の契約
- **仕様変更は仕様書から** — コードだけ変えず、まず仕様書を更新してから実装
- **テストは仕様の検証** — テストケースは仕様書の受け入れ条件から導出

### 仕様書一覧（specs/）
| No. | ファイル | 内容 | 担当Agent |
|-----|---------|------|----------|
| 00 | specs/overview.md | プロジェクト概要・アーキテクチャ | 全体 |
| 01 | specs/features/auth.md | 認証仕様（Apple/Google + devLogin） | Agent A |
| 02 | specs/features/onboarding.md | オンボーディング + SOUL.md生成 | Agent C |
| 03 | specs/features/openclaw-provisioning.md | OpenClawプロビジョニング | Agent A/C |
| 04 | specs/features/chat.md | AIチャット（Free: SSE / Pro: WebSocket） | Agent C |
| 05 | specs/features/subscription.md | 課金管理（RevenueCat） | Agent B |
| 06 | specs/features/journal.md | 日記 + AI振り返り | Agent D |
| 07 | specs/features/insights.md | 感情トラッキング | Agent D |
| 08 | specs/features/settings.md | 設定 + インスタンス管理 | Agent D |
| 09 | specs/api/database.md | DBスキーマ（9テーブル + RLS） | Agent A |
| 10 | specs/api/external-services.md | 外部サービス連携（DO/OpenClaw/Edge Functions） | Agent A/C |
| 11 | specs/shared/navigation.md | ナビゲーション構造・ルーティングガード | Agent A |
| 12 | specs/shared/error-handling.md | エラーハンドリングパターン | 全体 |

---

## ディレクトリ構成ルール
- `app/` — Expo Routerのルーティング。画面コンポーネントのみ配置
- `src/features/` — 機能ごとのモジュール（AgentTeam分割単位）
- `src/shared/` — 共通コンポーネント・hooks・types（変更時はAgent間調整必要）
- `src/services/` — 外部サービス連携（supabase, revenuecat, openclaw, digitalocean）
- `src/config/` — 環境変数、定数、テーマ
- `specs/` — 仕様書（Single Source of Truth）
- `supabase/functions/` — Edge Functions
- `supabase/migrations/` — DBマイグレーション

## コーディング規約
- TypeScript strict mode
- 関数コンポーネント + hooks
- 命名: camelCase（変数・関数）、PascalCase（コンポーネント・型）
- ファイル名: kebab-case.ts / kebab-case.tsx
- 1ファイル1コンポーネント
- `export default` 禁止、named export のみ（Expo Routerの画面ファイルは例外）

## RevenueCat実装ルール
- Entitlement名: `pro`
- 課金状態の型: `src/shared/types/subscription.ts` に定義
- 課金チェック: `useSubscription()` hook を必ず使う
- テスト: サンドボックスアカウントで必ず課金フローをテスト

## OpenClaw関連
- インスタンス管理: `src/services/openclaw/client.ts`
- プロビジョニング: Supabase Edge Function → DigitalOcean API
- Gateway接続: WebSocket (`ws://{ip}:18789`)
- ユーザーごとのSOUL.md: オンボーディング結果から自動生成
- 型定義: `src/shared/types/openclaw.ts`

---

## AgentTeam構成

| Agent | 名称 | 担当範囲 |
|-------|------|---------|
| A | Foundation | shared/, services/, config/, auth, レイアウト, DBマイグレーション, OpenClawサービスクライアント |
| B | Subscription | subscription/, (paywall)/, RevenueCat全般, Webhook, 課金→プロビジョニング連携 |
| C | Core AI | chat/, onboarding/, openclaw/, Edge Functions(chat, provision, destroy, health-check, update-soul-md, restart), WebSocketクライアント |
| D | Engagement | journal/, insights/, settings/(OpenClawインスタンス管理UI含む), 通知 |

### Agent間ルール
- `features/` は担当Agentのみ変更可
- `shared/` の変更はAgent Aが管理。他AgentはPR/提案として依頼
- `services/` は担当APIのみ変更可
- 型定義（`shared/types/`）の変更は全Agent合意が必要
- Edge Functions（`supabase/functions/`）は担当機能のみ変更可

---

## 現在の開発フェーズ：OpenClaw統合

### タスク概要（13タスク）
既存のMVP機能（認証、オンボーディング、Freeチャット、日記、洞察、設定、ペイウォール）は実装済み。
以下はOpenClaw統合に必要な追加タスク。

#### Phase 0: 基盤（ブロッカーなし）
- #40 [S] openclaw_instancesテーブル + マイグレーション — Agent A
- #41 [S] 価格定数 + OpenClaw型定義更新 — Agent A

#### Phase 1: OpenClawバックエンド（Phase 0完了後）
- #42 [L] provision-openclaw Edge Function — Agent C
- #43 [M] destroy-openclaw Edge Function — Agent C
- #44 [M] health-check-openclaw Edge Function — Agent C
- #45 [M] webhook-revenuecat更新（OpenClawトリガー追加）— Agent B
- #46 [M] update-soul-md + restart-openclaw Edge Functions — Agent C

#### Phase 2: OpenClawフロントエンド（Phase 0-1完了後）
- #47 [L] WebSocketクライアント実装 — Agent C
- #48 [L] チャット画面Pro/Free二層対応 — Agent C
- #49 [M] 設定画面にOpenClawインスタンス管理UI追加 — Agent D
- #50 [M] OpenClawサービスクライアント実装 — Agent A

#### Phase 3: 統合（Phase 1-2完了後）
- #51 [L] 課金→OpenClawプロビジョニングE2Eフロー統合 — Agent B+C
- #52 [M] エラーハンドリング + WebSocket再接続パターン — Agent C

### 実行順序
```
Phase 0: #40 + #41（並列）
           ↓
Phase 1: #42, #43, #44, #46（並列） → #45（#42,#43完了後）
Phase 2: #47 → #48, #49, #50（並列）
           ↓
Phase 3: #51, #52（並列）
```

---

## テスト方針
- 課金フローのE2Eテストは必須
- 各feature内にunit testを配置（`__tests__/`）
- OpenClaw APIのモックを用意（テスト時は実サーバーに接続しない）
- DigitalOcean APIのモックを用意
- テストケースは仕様書の受け入れ条件から導出する
- RevenueCat: サンドボックスアカウントで必ず課金フローをテスト
