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
- マネタイズモデル: サブスクリプション（RevenueCat / Stripe）+ 無料トライアル + トークン追加購入（Consumable IAP）
  - 6ヶ月後 MRR目標: ¥200,000〜500,000
  - 12ヶ月後 MRR目標: ¥500,000〜1,500,000

---

## 技術スタック

| レイヤー | 技術 | バージョン | 備考 |
|---------|------|----------|------|
| フロントエンド | React Native (Expo) + Web | SDK 54 | Expo Router（クロスプラットフォーム対応） |
| 状態管理 | Zustand | 5.x | persist middleware使用 |
| バックエンド | Supabase | - | PostgreSQL + Auth + Edge Functions |
| 認証 | Supabase Auth | - | Apple / Google Sign-In（Web/Native共通） |
| AI基盤 | OpenClaw | - | ユーザーごとにDigitalOcean Dropletへデプロイ |
| インフラ | DigitalOcean | - | Droplet自動プロビジョニング |
| 課金（モバイル） | RevenueCat | SDK 8.x | Paywalls SDK含む |
| 課金（Web） | Stripe | Checkout + Webhook | RevenueCat Stripe Provider統合 |
| 通知 | Expo Notifications（Native）/ Web Push（計画中） | - | ローカル + プッシュ |
| Web プラットフォーム | `.web.ts` / `.native.ts` 分離 | Metro resolution | 単一コードベース |

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
   App/Web → Supabase Auth → JWT Token → App State

2. OpenClawプロビジョニングフロー（課金後）:
   App/Web → Supabase Edge Function → DigitalOcean API
     → Droplet作成 → OpenClaw Docker起動 → SOUL.md設定
     → Gateway URL をDB保存

3. AIチャットフロー（Proユーザー）:
   App/Web → WebSocket (wss://{ip}:18789) → ユーザー専用OpenClaw Gateway
     → Response → App State → DB保存

4. AIチャットフロー（無料ユーザー）:
   App/Web → Supabase Edge Function → OpenAI API → Response（初回10Kトークン制限）

5. モバイル課金フロー:
   App → RevenueCat SDK → App Store / Google Play → Webhook → Supabase DB

6. Web課金フロー:
   Web App → Edge Function (create-checkout-session) → Stripe Checkout
     → Webhook (webhook-stripe) → Supabase DB + RevenueCat Stripe Provider 同期
     → Edge Function (provision-openclaw) → OpenClaw インスタンス作成

7. 通知フロー:
   Supabase Edge Function (cron) → Expo Push API / Web Push → Device

8. ゲストブラウズフロー:
   未認証ユーザー → コミュニティ一覧/詳細（閲覧のみ）
     → チャット/ツイン情報/設定はログイン促進UI表示

9. プラットフォーム分離フロー（内部）:
   [共有ビジネスロジック] → Metro resolver
     → iOS/Android: native.ts の実装
     → Web: web.ts の実装
```

### OpenClaw Gateway通信仕様
- プロトコル: WebSocket（セキュア: wss://）
- エンドポイント: `wss://{droplet_ip}:18789`
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
| 4 | AIチャット（WebSocket）+ 日記統合 | Must | Agent C | features/chat.md |
| 5 | コミュニティ（AIツイン同士の会話観察、Pro限定） | Should | Agent D | features/community.md |
| 6 | ツイン情報（性格データ + 洞察 + OpenClawステータス） | Should | Agent D | features/insights.md |
<!-- 注: 将来的にinsights.md→twin-info.mdへのリネームを検討 -->
| 7 | 課金（RevenueCat） | Must | Agent B | features/subscription.md |
| 8 | 設定 + インスタンス管理 + アカウント削除 | Should | Agent D | features/settings.md |

---

## スコープ内（追加機能）

| 機能 | 概要 | 追加日 |
|------|------|--------|
| ゲストブラウズモード | ログインなしでコミュニティ一覧・詳細を閲覧可能（Apple審査準拠） | 2026-02-15 |
| Web版課金（Stripe） | Stripe Checkout + Webhook + RevenueCat Stripe Provider統合 | 2026-02-15 |
| トークン管理 | OpenAIトークン消費量の追跡・制限（Free: 10K / Pro: 500K / 追加購入対応） | 2026-02-15 |
| API Key保護 | 全外部APIキーをEdge Function経由でのみ使用、クライアント非露出 | 2026-02-15 |
| Googleロゴ規約準拠 | Googleブランドガイドラインに準拠したログインボタン | 2026-02-15 |

---

## やらないこと（スコープ外）

- 画像生成（コスト高）
- 音声チャット（Phase 2以降）
- ユーザー同士のDM・フォロー（コミュニティはツイン交流のみ）
- マルチエージェント（1ユーザー1インスタンス）
- PWA（Progressive Web App）対応（Phase 2以降）
- 多言語対応（Phase 2以降、MVP時点では日本語+英語）

---

## Web 対応実装（2026-02-21 完了）

### Web プラットフォーム
- **対応ブラウザ**: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- **アーキテクチャ**: `.web.ts` / `.native.ts` プラットフォーム分離（Metro auto-resolution）
- **レスポンシブ**: モバイル < 768px / タブレット 768-1023px / デスクトップ >= 1024px / ワイド >= 1440px
- **ナビゲーション**: Web はサイドバー固定（240px）、モバイルはボトムタブ

### Web 機能一覧
| 機能 | Web実装 | 備考 |
|------|--------|------|
| 認証 | ✅ | Google / Apple / devLogin（OAuth redirect フロー） |
| チャット | ✅ | WebSocket (Pro) + SSE (Free)、キーボードショートカット |
| メディアアップロード | ✅ | ファイル選択 + ドラッグ&ドロップ |
| オンボーディング | ✅ | 6画面のステップフォーム |
| コミュニティ | ✅ | レスポンシブグリッドレイアウト |
| ツイン情報 | ✅ | ダッシュボードスタイル |
| 設定 | ✅ | Stripe Customer Portal 統合 |
| 課金（Stripe） | ✅ | Checkout → Webhook → DB同期 + RevenueCat同期 |

### テスト環境

#### Jest マルチプロジェクト設定（jest.config.ts）
```bash
# 共通テスト（全プラットフォーム対応）
npx jest --selectProjects shared

# Web 専用テスト
npx jest --selectProjects web

# ネイティブテスト
npx jest --selectProjects ios,android
```

- **Projects**: `shared` / `web` / `ios` / `android`
- **共有テスト**: プラットフォーム依存コードを除く
- **プラットフォーム特定テスト**: `.web.test.ts` / `.native.test.ts` パターン
- **カバレッジ目標**: 行カバレッジ 80% 以上（branches/functions/statements 含む）
- **テスト環境**:
  - `shared/ios/android`: `preset: 'jest-expo/*'` + `testEnvironment: 'node'`
  - `web`: `preset: 'jest-expo/web'` + `testEnvironment: 'jsdom'`

#### Playwright E2E テスト（e2e/）
```bash
# 全ブラウザで E2E テスト実行
npx playwright test

# 特定ブラウザのみ実行
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

- **5ブラウザプロジェクト**: Chrome, Firefox, Safari, Edge, WebKit
- **テストスイート**: 認証、チャット、課金フロー（Web専用）
- **CI 統合**: GitHub Actions で全ブラウザ並列実行

### 主要な Edge Functions（Stripe 連携）
- `create-checkout-session` — Stripe Checkout セッション作成（JWT認証、planType or priceId パラメータ）
- `create-portal-session` — Stripe Customer Portal セッション作成（既存顧客のサブスク管理）
- `webhook-stripe` — Stripe Webhook 処理（署名検証、冪等性チェック、DB更新）
- `reconcile-stripe` — セッション有効期限チェック（期限切れセッション検出・キャンセル）
- 全 Edge Functions CORS 対応（`getCorsHeaders(origin)` 使用、ワイルドカード禁止）

---

## 課金体系

| プラン | 価格 | 備考 |
|--------|------|------|
| 月額 | ¥4,980 | 標準プラン |
| 年額 | ¥39,800 | 月額換算¥3,317、33%OFF |
| 初回限定年額 | ¥29,800 | 50%OFF、24時間限定 |
| 無料トライアル | 3日間 | 全機能開放 |

### 無料ユーザー制限
- 初回10,000トークンのみ（月次リセットなし、使い切りで終了）
- Supabase Edge Function経由でAI応答（OpenClawなし）
- コミュニティ機能は利用不可（ブラー表示 + ペイウォール誘導）
- ツイン情報の基本データは閲覧可能
- OpenClawインスタンスはデプロイされない

### Proユーザー特典
- チャット無制限
- 専用OpenClawインスタンス（DigitalOcean Droplet）
- 全機能フルアクセス（コミュニティ・ツイン情報・インスタンス管理）
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
3. ゲストブラウズ（ログインせずにコミュニティ一覧・詳細を閲覧可能、他タブはログイン促進UI）

#### オンボーディング
1. ウェルカム (`app/(onboarding)/welcome.tsx`)
2. パーソナリティクイズ (`app/(onboarding)/personality-quiz.tsx`)
3. 結果表示 (`app/(onboarding)/result.tsx`)
4. AIアイコン選択 (`app/(onboarding)/choose-avatar.tsx`)
5. 口調パターン (`app/(onboarding)/choose-tone.tsx`)
6. ツインと対面 (`app/(onboarding)/meet-twin.tsx`)

#### ペイウォール
1. ペイウォール (`app/(paywall)/index.tsx`)

#### メインタブ（認証後、4タブ構成）
1. チャット（ホーム） (`app/(tabs)/index.tsx`) — AIツインとの1:1チャット + 日記統合
2. コミュニティ (`app/(tabs)/community.tsx`) — AIツイン同士の会話を観察（Pro限定）
3. ツイン情報 (`app/(tabs)/twin.tsx`) — 性格データ + 気分 + OpenClawステータス
4. 設定 (`app/(tabs)/settings.tsx`) — アカウント・サブスク管理 + インスタンス管理 + アカウント削除

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
- **API Key保護原則**: OpenAI / DigitalOcean / Stripe Secret Key は Edge Function 環境変数のみ。クライアントには Supabase Anon Key と RevenueCat API Key のみ許可
- OpenClaw通信はトークン認証付きWebSocket（wss://）
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
│   │   ├── choose-avatar.tsx
│   │   ├── choose-tone.tsx
│   │   └── meet-twin.tsx
│   ├── (paywall)/                # ペイウォール
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── (tabs)/                   # メインタブ（4タブ）
│       ├── _layout.tsx
│       ├── index.tsx             # チャット（ホーム）+ 日記統合
│       ├── community.tsx         # コミュニティ（AIツイン同士の会話、Pro限定）
│       ├── twin.tsx              # ツイン情報（性格 + 気分 + OpenClawステータス）
│       └── settings.tsx          # 設定 + サブスク + インスタンス管理 + アカウント削除
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
│   │   ├── community/              # AIツイン同士の会話（Pro限定）
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── __tests__/
│   │   ├── twin-info/              # 性格 + 気分 + OpenClawステータス
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── __tests__/
│   │   # 注: journal/ はチャットに統合、insights/ は twin-info/ に統合
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
│   │   │   ├── client.web.ts
│   │   │   ├── client.native.ts
│   │   │   ├── auth.web.ts
│   │   │   ├── auth.native.ts
│   │   │   ├── auth-shared.ts
│   │   │   └── database.ts
│   │   ├── stripe/
│   │   │   ├── client.ts         # Stripe API クライアント（Web課金）
│   │   │   └── __tests__/
│   │   ├── revenuecat/
│   │   │   ├── client.web.ts
│   │   │   ├── client.native.ts
│   │   │   ├── offerings.ts
│   │   │   └── __tests__/
│   │   ├── openclaw/
│   │   │   └── client.ts         # OpenClawインスタンス管理
│   │   ├── digitalocean/
│   │   │   └── client.ts         # Dropletプロビジョニング
│   │   ├── notifications/
│   │   │   ├── client.web.ts
│   │   │   ├── client.native.ts
│   │   │   └── __tests__/
│   │   └── analytics/
│   │       ├── tracker.web.ts
│   │       ├── tracker.native.ts
│   │       └── __tests__/
│   └── config/
│       ├── env.ts                # 環境変数
│       ├── constants.ts          # 定数
│       └── theme.ts              # テーマ定義
├── supabase/                     # Supabase設定
│   ├── migrations/               # DBマイグレーション
│   └── functions/                # Edge Functions
│       ├── _shared/              # 共有ユーティリティ
│       │   ├── cors.ts           # CORS ヘッダ処理
│       │   ├── supabase.ts       # Supabase クライアント（anon/service role）
│       │   └── webhook-utils.ts  # Webhook イベント冪等性管理
│       ├── chat/                 # 無料ユーザー用AIチャット
│       ├── provision-openclaw/   # OpenClawプロビジョニング
│       ├── destroy-openclaw/     # OpenClaw インスタンス削除
│       ├── personality-analyze/  # パーソナリティ分析
│       ├── webhook-revenuecat/   # RevenueCat Webhook（モバイル課金）
│       ├── create-checkout-session/   # Stripe Checkout Session作成
│       ├── create-portal-session/     # Stripe Customer Portal Session作成
│       ├── webhook-stripe/            # Stripe Webhook（Web課金）
│       └── reconcile-stripe/          # Stripe セッション有効期限チェック
├── specs/                        # 仕様書（本ドキュメント）
│   └── overview.md
├── docs/                         # その他ドキュメント
├── e2e/                          # Playwright E2E テスト（Web専用）
│   ├── auth.spec.ts
│   ├── chat.spec.ts
│   ├── subscription.spec.ts
│   └── playwright.config.ts
├── CLAUDE.md
├── .env.example
├── app.json
├── jest.config.ts                # Jest マルチプロジェクト設定
├── jest.setup.ts
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
| 04 | specs/features/chat.md | AIチャット仕様（日記統合） | Agent C |
| 05 | specs/features/community.md | コミュニティ仕様（AIツイン同士の会話、Pro限定） | Agent D |
| 06 | specs/features/twin-info.md | ツイン情報仕様（性格 + 気分 + OpenClawステータス） | Agent D |
| 07 | specs/features/subscription.md | 課金仕様（RevenueCat） | Agent B |
| 08 | specs/features/settings.md | 設定・インスタンス管理・アカウント削除仕様 | Agent D |

### AgentTeam構成

| Agent | 名称 | 担当範囲 |
|-------|------|---------|
| A | Foundation | shared/, services/, config/, auth, レイアウト, DBマイグレーション |
| B | Subscription | subscription/, (paywall)/, RevenueCat全般, Webhook |
| C | Core AI | chat/, onboarding/, openclaw/, Edge Functions(chat, provision) |
| D | Engagement | community/, twin-info/, settings/, 通知, Edge Functions(community) |

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

---

## デザインシステム（V4 Dark Premium）

### デザインコンセプト
V4 Dark Premium Redesign: ダークコスミックテーマ + glassmorphism + ゴールドCTA の統一されたデザインシステム。
全19画面（認証2、チャット3、タブ3、オンボーディング6、ペイウォール1、モーダル3、サブ1）に適用。

### カラートークン（src/config/theme.ts）

| トークン | 値 | 用途 |
|---------|-----|------|
| background | `#0F172A` | 全画面ベース背景 |
| backgroundSecondary | `#131C2E` | セカンダリ背景 |
| surface | `#1E293B` | カード・入力欄背景 |
| primary | `#7DD3FC` | アクティブ要素・リンク・インジケータ |
| primaryLight | `#BAE6FD` | ホバー・ライト |
| accent / gold | `#D4A853` | CTA ボタン・バッジ |
| text | `#F8FAFC` | プライマリテキスト |
| textSecondary | `#94A3B8` | セカンダリテキスト |
| textTertiary | `#64748B` | ターシャリテキスト |
| border | `#334155` | ボーダー |
| success | `#34D399` | 成功・オンライン |
| error | `#EF4444` | エラー・削除 |
| warning | `#F59E0B` | 警告 |

### 新規デザイントークン（src/config/theme.ts）

```typescript
glassmorphism: {
  card:       { bg: 'rgba(30, 41, 59, 0.6)', border: 'rgba(248, 250, 252, 0.1)', blur: 16 },
  bubbleAi:   { bg: 'rgba(30, 41, 59, 0.7)', border: 'rgba(248, 250, 252, 0.08)', blur: 12 },
  bubbleUser: { bg: 'rgba(125, 211, 252, 0.25)', border: 'rgba(125, 211, 252, 0.4)', blur: 8 },
  input:      { bg: 'rgba(30, 41, 59, 0.8)', border: 'rgba(248, 250, 252, 0.15)', blur: 10 },
}
goldGradient: ['#E8C567', '#C9A033', '#A07B1A']  // 3-stop
sendGradient: ['#7DD3FC', '#38BDF8']
tabBarColors: {
  background: '#0F172AEE',
  active: '#00D4FF',
  inactive: '#64748B',
  border: '#1E293B',
}
fontFamily: {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
}
```

### 新規共通コンポーネント（src/shared/components/）

| コンポーネント | ファイル | 用途 |
|--------------|---------|------|
| CosmicBackground | `cosmic-background.tsx` | 全画面共通の宇宙背景（ImageBackground + `#0F172ACC` オーバーレイ） |
| GlassCard | `glass-card.tsx` | BlurView glassmorphism カード（variants: default/ai-bubble/user-bubble/input） |
| GoldButton | `gold-button.tsx` | LinearGradient CTA ボタン（`#E8C567`→`#C9A033`→`#A07B1A`、高さ54px、角丸22px） |

### 追加パッケージ
- `expo-blur` — BlurView（glassmorphism エフェクト）
- `expo-linear-gradient` — LinearGradient（ゴールドCTA・センドグラデーション）
- `@expo-google-fonts/outfit` — Outfit フォントファミリー

### タイポグラフィスケール

| 用途 | サイズ | Weight |
|------|-------|--------|
| ヒーロータイトル | 40px | 700 (Bold) |
| セクションタイトル | 24px | 700 (Bold) |
| カードタイトル | 18px | 600 (SemiBold) |
| 本文 | 16px | 400 (Regular) |
| キャプション | 14px | 400 (Regular) |
| ラベル | 12px | 500 (Medium) |

### Cosmic背景
- 全画面共通の星空/ネビュラ背景画像
- オーバーレイ: `#0F172ACC`（80% opacity）
- フォールバック背景色: `#0F172A`

---

## 変更履歴
| 日付 | 変更内容 | 理由 | 関連タスク |
|------|---------|------|-----------|
| 2026-02-14 | タブ構成を3タブから4タブに変更（Chat/Community/Twin Info/Settings）<br>日記機能をチャットに統合<br>洞察機能をツイン情報に統合<br>コミュニティ機能追加（Pro限定、AIツイン同士の会話観察）<br>アカウント削除機能追加<br>ソーシャル機能方針変更（ユーザー同士のDM・フォローなし） | Reconcile: 製品方針の変更に伴う仕様更新 | — |
| 2026-02-15 | オンボーディング: 4画面→6画面に変更<br>新画面追加: choose-avatar.tsx (4), choose-tone.tsx (5)<br>画面一覧更新<br>ディレクトリ構成にchoose-avatar.tsx, choose-tone.tsx追記 | V3 Liquid Glass: AIアイコン・口調カスタマイズ機能追加 | — |
| 2026-02-15 | ゲストブラウズモード追加<br>Web版課金（Stripe）追加<br>トークン管理追加<br>API Key保護原則追加<br>Googleロゴ規約準拠追加<br>「やらないこと」からWeb版を変更（課金のみWeb対応） | 7新要件の反映 | — |
| 2026-02-16 | デザインシステムセクション追加（V4 Dark Premium）<br>カラートークン・glassmorphism・goldGradient・sendGradient・tabBarColors・fontFamily追記<br>新規共通コンポーネント（CosmicBackground/GlassCard/GoldButton）追記<br>追加パッケージ（expo-blur/expo-linear-gradient/@expo-google-fonts/outfit）追記<br>タイポグラフィスケール追記 | Reconcile: V4 Dark Premium UI 実装完了後の仕様書同期 | — |
| 2026-02-21 | 技術スタックに Web プラットフォーム対応を追記<br>「やらないこと」に PWA 対応を追加<br>新規「Web 対応実装」セクション追加（アーキテクチャ、機能一覧、テスト環境、Edge Functions）<br>データフロー図に Web課金・プラットフォーム分離フロー追加<br>ディレクトリ構成：stripe/, e2e/, supabase/functions/_shared/ 追加<br>Edge Functions 詳細化（_shared/, destroy-openclaw, create-portal-session, reconcile-stripe）<br>jest.config.ts + e2e/ テスト構成追記 | Reconcile: Web 版フル実装完了（Stripe決済、プラットフォーム分離、E2Eテスト）の仕様書同期 | 20260221-web-full-impl |
