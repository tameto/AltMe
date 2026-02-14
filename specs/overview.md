# AltMe 全体仕様

## プロジェクト概要
- 一言説明: 自分の分身AIを育てて、日記・振り返り・自己分析をしてくれるパーソナルAI。課金ユーザーごとにDigitalOcean上にOpenClawインスタンスをデプロイし、AIツインが代行する。
- サブタイトル: Your AI Twin That Knows You
- ターゲットユーザー: 日本+グローバル（セルフケア x AI x ジャーナリング層）
  - プライマリ: 20〜35歳、自己成長・メンタルヘルスに関心がある層
  - セカンダリ: 日記・振り返りの習慣をつけたいビジネスパーソン
- 解決する課題:
  - 自己理解を深めたいが方法がわからない
  - 日記・振り返りが続かない
  - セルフケアにAIを活用したいが汎用チャットボットでは物足りない
- マネタイズモデル: サブスクリプション（RevenueCat）+ 無料トライアル
  - 6ヶ月後 MRR目標: ¥200,000〜500,000
  - 12ヶ月後 MRR目標: ¥500,000〜1,500,000

---

## 技術スタック

| レイヤー | 技術 | バージョン | 備考 |
|---------|------|----------|------|
| フロントエンド | React Native (Expo) | SDK 54 | Expo Router |
| 状態管理 | Zustand | 5.x | persist middleware使用 |
| バックエンド | Supabase | - | PostgreSQL + Auth + Edge Functions |
| 認証 | Supabase Auth | - | Apple / Google Sign-In |
| AI基盤 | OpenClaw | - | ユーザーごとにDigitalOcean Dropletへデプロイ |
| インフラ | DigitalOcean | - | Droplet自動プロビジョニング |
| 課金 | RevenueCat | SDK 8.x | Paywalls SDK含む |
| 通知 | Expo Notifications | - | ローカル + プッシュ |

---

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────┐
│                     Mobile App                       │
│             React Native (Expo SDK 54)               │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │   Auth    │  │  Paywall  │  │  Core Features   │  │
│  │  Screen   │  │  Screen   │  │ Chat/Journal/etc │  │
│  └────┬─────┘  └─────┬─────┘  └────────┬─────────┘  │
│       │              │                  │             │
│  ┌────┴──────────────┴──────────────────┴──────────┐ │
│  │                Zustand Store                     │ │
│  │  (user, subscription, chat, journal state)       │ │
│  └──────────────────┬──────────────────────────────┘ │
└─────────────────────┼────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   Supabase   │ │RevenueCat│ │ Expo Push    │
│              │ │          │ │ Notification │
│ ・Auth       │ │ ・SDK     │ │ Service      │
│ ・PostgreSQL │ │ ・Webhook │ └──────────────┘
│ ・Edge Func  │ │ ・Paywall │
│   ↓          │ └──────────┘
│ DigitalOcean │
│ API          │
│   ↓          │
│ Droplet      │
│ (OpenClaw)   │
└──────────────┘
```

### データフロー

```
1. 認証フロー:
   App → Supabase Auth → JWT Token → App State

2. OpenClawプロビジョニングフロー（課金後）:
   App → Supabase Edge Function → DigitalOcean API
     → Droplet作成 → OpenClaw Docker起動 → SOUL.md設定
     → Gateway URL をDB保存

3. AIチャットフロー（Proユーザー）:
   App → WebSocket (ws://{ip}:18789) → ユーザー専用OpenClaw Gateway
     → Response → App State → DB保存

4. AIチャットフロー（無料ユーザー）:
   App → Supabase Edge Function → OpenAI API → Response（1日3回制限）

5. 課金フロー:
   App → RevenueCat SDK → App Store / Google Play → Webhook → Supabase DB

6. 通知フロー:
   Supabase Edge Function (cron) → Expo Push API → Device
```

### OpenClaw Gateway通信仕様
- プロトコル: WebSocket
- エンドポイント: `ws://{droplet_ip}:18789`
- 認証: トークン認証（JWT）
- フレーム形式: JSON Schema WebSocketフレーム
- SOUL.md: オンボーディング結果から自動生成し、OpenClawインスタンスに設定

---

## MVP機能一覧

| # | 機能名 | 優先度 | 担当Agent | 仕様書 |
|---|--------|--------|----------|--------|
| 1 | 認証（Apple / Google Sign-In） | Must | Agent A | features/auth.md |
| 2 | オンボーディング + SOUL.md生成 | Must | Agent C | features/onboarding.md |
| 3 | OpenClawプロビジョニング | Must | Agent A/C | features/openclaw-provisioning.md |
| 4 | AIチャット（WebSocket） | Must | Agent C | features/chat.md |
| 5 | 日記 + AI振り返り | Should | Agent D | features/journal.md |
| 6 | 洞察 + 感情トラッキング | Should | Agent D | features/insights.md |
| 7 | 課金（RevenueCat） | Must | Agent B | features/subscription.md |
| 8 | 設定 + インスタンス管理 | Should | Agent D | features/settings.md |

---

## やらないこと（スコープ外）

- 画像生成（コスト高）
- 音声チャット（Phase 2以降）
- ソーシャル機能
- マルチエージェント（1ユーザー1インスタンス）
- Web版（モバイルアプリのみ）
- 多言語対応（Phase 2以降、MVP時点では日本語+英語）

---

## 課金体系

| プラン | 価格 | 備考 |
|--------|------|------|
| 月額 | ¥4,980 | 標準プラン |
| 年額 | ¥39,800 | 月額換算¥3,317、33%OFF |
| 初回限定年額 | ¥29,800 | 50%OFF、24時間限定 |
| 無料トライアル | 3日間 | 全機能開放 |

### 無料ユーザー制限
- 1日3回までチャット可能
- Supabase Edge Function経由でAI応答（OpenClawなし）
- 日記・洞察機能は閲覧のみ
- OpenClawインスタンスはデプロイされない

### Proユーザー特典
- チャット無制限
- 専用OpenClawインスタンス（DigitalOcean Droplet）
- 全機能フルアクセス
- SOUL.mdによるパーソナライズAI

### RevenueCat設定
- Entitlement名: `pro`
- 課金状態管理: `useSubscription()` hook
- Webhook: Supabase Edge Functionで受信 → DB更新 + プロビジョニングトリガー

---

## 画面一覧

> screens/ は後で定義

### ナビゲーション構造

#### 認証前
1. スプラッシュ画面
2. ログイン / サインアップ (`app/(auth)/`)

#### オンボーディング
1. ウェルカム (`app/(onboarding)/welcome.tsx`)
2. パーソナリティクイズ (`app/(onboarding)/personality-quiz.tsx`)
3. 結果表示 (`app/(onboarding)/result.tsx`)
4. ツインと対面 (`app/(onboarding)/meet-twin.tsx`)

#### ペイウォール
1. ペイウォール (`app/(paywall)/index.tsx`)

#### メインタブ（認証後）
1. チャット（ホーム） (`app/(tabs)/index.tsx`)
2. 日記履歴 (`app/(tabs)/history.tsx`)
3. 設定 (`app/(tabs)/settings.tsx`)

---

## 非機能要件

### パフォーマンス
- アプリ起動: 2秒以内（Cold Start）
- チャット初回応答: 3秒以内（ストリーミング表示でUX補完）
- 画面遷移: 300ms以内

### 対応OS/バージョン
- iOS 16.0+
- Android 13+ (API 33+)

### オフライン対応
- 部分対応
- チャット履歴キャッシュ（ローカルストレージ）
- 過去の日記・洞察データは閲覧可能
- オフライン時の新規チャット・日記作成は不可（エラーメッセージ表示）

### セキュリティ
- APIキーは環境変数管理、クライアントに露出させない
- OpenClaw通信はトークン認証付きWebSocket
- チャット履歴はSupabase RLS（Row Level Security）で保護
- 個人情報の暗号化保存
- SOUL.mdはユーザー専用Droplet内に保持

### 可用性
- API障害時: グレースフルデグラデーション（エラーメッセージ表示）
- Droplet障害時: ヘルスチェック + 自動再起動

---

## ディレクトリ構成

```
altme/
├── app/                          # Expo Router（画面のみ）
│   ├── _layout.tsx               # Root Layout
│   ├── +not-found.tsx
│   ├── (auth)/                   # 認証グループ
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (onboarding)/             # オンボーディンググループ
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── personality-quiz.tsx
│   │   ├── result.tsx
│   │   └── meet-twin.tsx
│   ├── (paywall)/                # ペイウォール
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── (tabs)/                   # メインタブ（3タブ）
│       ├── _layout.tsx
│       ├── index.tsx             # チャット（ホーム）
│       ├── history.tsx           # 日記履歴 + 気分トラッキング
│       └── settings.tsx          # 設定 + サブスク + インスタンス管理
├── src/
│   ├── features/                 # 機能モジュール
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── __tests__/
│   │   ├── subscription/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── __tests__/
│   │   ├── onboarding/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── constants/
│   │   │   └── __tests__/
│   │   ├── chat/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── utils/
│   │   │   └── __tests__/
│   │   ├── journal/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── __tests__/
│   │   ├── insights/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── __tests__/
│   │   └── settings/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── __tests__/
│   ├── shared/                   # 共通モジュール
│   │   ├── components/           # 共通UIコンポーネント
│   │   ├── hooks/                # 共通hooks
│   │   ├── utils/                # ユーティリティ
│   │   └── types/                # 型定義（Agent間の契約）
│   ├── services/                 # 外部サービス連携
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   └── database.ts
│   │   ├── revenuecat/
│   │   │   ├── client.ts
│   │   │   └── offerings.ts
│   │   ├── openclaw/
│   │   │   └── client.ts         # OpenClawインスタンス管理
│   │   └── digitalocean/
│   │       └── client.ts         # Dropletプロビジョニング
│   └── config/
│       ├── env.ts                # 環境変数
│       ├── constants.ts          # 定数
│       └── theme.ts              # テーマ定義
├── supabase/                     # Supabase設定
│   ├── migrations/               # DBマイグレーション
│   └── functions/                # Edge Functions
│       ├── chat/                 # 無料ユーザー用AIチャット
│       ├── provision-openclaw/   # OpenClawプロビジョニング
│       ├── personality-analyze/  # パーソナリティ分析
│       └── webhook-revenuecat/   # RevenueCat Webhook
├── specs/                        # 仕様書（本ドキュメント）
│   └── overview.md
├── docs/                         # その他ドキュメント
├── CLAUDE.md
├── .env.example
├── app.json
├── package.json
└── tsconfig.json
```

---

## 開発方法論: 仕様駆動開発（Spec-Driven Development）

### 原則
1. **仕様が正（Single Source of Truth）** -- 実装は仕様書に従う。仕様にないものは作らない
2. **型が契約（Contract）** -- `src/shared/types/` の型定義がAgent間の契約。変更は全Agent合意が必要
3. **仕様変更は仕様書から** -- コードだけ変えず、まず仕様書を更新してから実装
4. **テストは仕様の検証** -- テストケースは仕様書の受け入れ条件から導出

### 開発フロー

```
仕様書作成 → 仕様レビュー・承認 → 型定義・インターフェース作成
  → AgentTeam並列実装 → テスト → 統合テスト → リリース
```

### 仕様書一覧

| No. | ファイル | 内容 | 担当Agent |
|-----|---------|------|----------|
| 00 | specs/overview.md | 本ドキュメント（概要・アーキテクチャ） | 全体 |
| 01 | specs/features/auth.md | 認証仕様 | Agent A |
| 02 | specs/features/onboarding.md | オンボーディング仕様 | Agent C |
| 03 | specs/features/openclaw-provisioning.md | OpenClawプロビジョニング仕様 | Agent A/C |
| 04 | specs/features/chat.md | AIチャット仕様 | Agent C |
| 05 | specs/features/journal.md | 日記機能仕様 | Agent D |
| 06 | specs/features/insights.md | 洞察・レポート仕様 | Agent D |
| 07 | specs/features/subscription.md | 課金仕様（RevenueCat） | Agent B |
| 08 | specs/features/settings.md | 設定・インスタンス管理仕様 | Agent D |

### AgentTeam構成

| Agent | 名称 | 担当範囲 |
|-------|------|---------|
| A | Foundation | shared/, services/, config/, auth, レイアウト, DBマイグレーション |
| B | Subscription | subscription/, (paywall)/, RevenueCat全般, Webhook |
| C | Core AI | chat/, onboarding/, openclaw/, Edge Functions(chat, provision) |
| D | Engagement | journal/, insights/, settings/, 通知, Edge Functions(journal, insight) |

### Agent間ルール
- `features/` は担当Agentのみ変更可
- `shared/` の変更はAgent Aが管理。他AgentはPR/提案として依頼
- `services/` は担当APIのみ変更可
- 型定義（`shared/types/`）の変更は全Agent合意が必要

---

## テスト方針

- 課金フローのE2Eテストは必須
- 各feature内にunit testを配置（`__tests__/`）
- OpenClaw APIのモックを用意（テスト時は実サーバーに接続しない）
- テストケースは仕様書の受け入れ条件から導出する
- RevenueCat: サンドボックスアカウントで必ず課金フローをテスト
