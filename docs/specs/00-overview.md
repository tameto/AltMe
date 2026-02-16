# 00 -- プロダクト概要・アーキテクチャ仕様

## ステータス: APPROVED
- 作成日: 2026-02-14
- 最終更新: 2026-02-15 (v2)
- 承認状態: 承認済み

---

## 1. プロダクト概要

### 1.1 アプリ名
**AltMe** -- Your AI Twin That Knows You

### 1.2 コンセプト
「もう一人の自分」AIツインを育てるパーソナルAIアプリ。
ユーザーの性格・思考・感情パターンを学習し、自己理解を深める。
課金ユーザーごとにDigitalOcean上にOpenClawインスタンスをデプロイし、
パーソナライズされたAIツインとの会話・日記・自己分析を提供する。

### 1.3 ターゲットユーザー
- **プライマリ**: 20〜35歳、自己成長・メンタルヘルスに関心がある層
- **セカンダリ**: 日記・振り返りの習慣をつけたいビジネスパーソン
- **市場**: 日本（初期） → グローバル展開

### 1.4 解決する課題
- 自己理解を深めたいが方法がわからない
- 日記・振り返りが続かない
- セルフケアにAIを活用したいが汎用チャットボットでは物足りない

### 1.5 マネタイズ目標
- 6ヶ月後 MRR: ¥200,000〜500,000
- 12ヶ月後 MRR: ¥500,000〜1,500,000

### 1.6 コアバリュー
1. **パーソナライズ** -- 使うほど「自分」を理解するAI
2. **即効性** -- インストール8分で「自分の分身」を体験
3. **習慣形成** -- 毎日の振り返りが自然とできるUX
4. **プライバシー** -- パーソナルデータはユーザーのもの

---

## 2. アーキテクチャ

### 2.1 システム構成図

```
┌─────────────────────────────────────────────────────────┐
│                       Mobile App                         │
│               React Native (Expo SDK 54)                 │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │   Auth    │  │  Paywall  │  │    Core Features     │  │
│  │  Screen   │  │  Screen   │  │ Chat/Community/Twin  │  │
│  └────┬─────┘  └─────┬─────┘  └──────────┬───────────┘  │
│       │              │                    │               │
│  ┌────┴──────────────┴────────────────────┴────────────┐ │
│  │                   Zustand Store                      │ │
│  │   (user, subscription, chat, community state)        │ │
│  └──────────────────────┬──────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────────┐ ┌──────────┐ ┌──────────────┐
│     Supabase     │ │RevenueCat│ │ Expo Push    │
│                  │ │          │ │ Notification │
│ ・Auth           │ │ ・SDK     │ │ Service      │
│ ・PostgreSQL     │ │ ・Webhook │ └──────────────┘
│ ・Edge Functions │ │ ・Paywall │
│   ↓              │ └──────────┘
│ DigitalOcean API │
│   ↓              │
│ Droplet          │
│ (OpenClaw)       │
│   ↓              │
│ OpenAI API       │
│ (GPT-4o mini)    │
└──────────────────┘
```

### 2.2 技術スタック

| レイヤー | 技術 | バージョン | 備考 |
|---------|------|----------|------|
| フロントエンド | React Native (Expo) | SDK 54 | Expo Router v3 |
| 状態管理 | Zustand | 5.x | persist middleware使用 |
| バックエンド | Supabase | - | Auth + PostgreSQL + Edge Functions |
| 認証 | Supabase Auth | - | Apple / Google Sign-In |
| AI基盤 | OpenClaw | - | ユーザーごとにDigitalOcean Dropletへデプロイ |
| AI API | OpenAI GPT-4o mini | - | Edge Function経由（Freeチャット・コミュニティ会話生成） |
| インフラ | DigitalOcean | - | Droplet自動プロビジョニング |
| 課金（モバイル） | RevenueCat | SDK 8.x | Paywalls SDK含む |
| 課金（Web） | Stripe | Checkout + Webhook | RevenueCat Stripe Provider統合 |
| 通知 | Expo Notifications | - | ローカル + プッシュ |

### 2.3 データフロー

```
1. 認証フロー:
   App → Supabase Auth → JWT Token → App State

2. OpenClawプロビジョニングフロー（課金後）:
   App → Supabase Edge Function → DigitalOcean API
     → Droplet作成 → OpenClaw Docker起動 → SOUL.md設定
     → Gateway URL をDB保存

3. AIチャットフロー（Proユーザー）:
   App → WebSocket (wss://{ip}:18789) → ユーザー専用OpenClaw Gateway
     → Response → App State → DB保存

4. AIチャットフロー（無料ユーザー）:
   App → Supabase Edge Function → OpenAI API → SSE Response（1日3回制限）

5. 課金フロー:
   App → RevenueCat SDK → App Store / Google Play → Webhook → Supabase DB

6. コミュニティ会話生成フロー:
   App → Supabase Edge Function (generate-twin-conversation)
     → OpenAI GPT-4o mini → twin_conversations テーブル保存

7. 通知フロー:
   Supabase Edge Function (cron) → Expo Push API → Device

8. Web課金フロー:
   Web App → Edge Function (create-checkout-session) → Stripe Checkout
     → Webhook (webhook-stripe) → Supabase DB + RevenueCat同期

9. ゲストブラウズフロー:
   未認証ユーザー → コミュニティ一覧/詳細（閲覧のみ）
     → チャット/ツイン情報/設定はログイン促進UI表示
```

### 2.4 OpenClaw Gateway通信仕様
- プロトコル: WebSocket（セキュア: wss://）
- エンドポイント: `wss://{droplet_ip}:18789`
- TLS: nginx reverse proxy + 自己署名証明書（初期運用）
- 認証: トークン認証（JWT）
- フレーム形式: JSON Schema WebSocketフレーム
- SOUL.md: オンボーディング結果から自動生成し、OpenClawインスタンスに設定

---

## 3. 課金体系

### 3.1 プラン一覧

| プラン | 価格 | 備考 |
|--------|------|------|
| 月額 | ¥4,980 | 標準プラン |
| 年額 | ¥39,800 | 月額換算¥3,317、33%OFF |
| 初回限定年額 | ¥29,800 | 50%OFF、24時間限定 |
| 無料トライアル | 3日間 | 全機能開放 |

### 3.2 Free vs Pro 機能比較

| 機能 | Free | Pro |
|------|------|-----|
| AIチャット | 1日3回まで（SSE経由） | 無制限（WebSocket経由） |
| AI基盤 | Supabase Edge Function → OpenAI API | 専用OpenClawインスタンス（DigitalOcean Droplet） |
| SOUL.mdパーソナライズ | なし | あり（性格診断結果から自動生成） |
| 日記統合（振り返りプロンプト） | なし | あり（6時間経過後に自動） |
| コミュニティ | ぼかしプレビュー + ペイウォール誘導 | フルアクセス（AIツイン同士の会話） |
| ツイン情報: Big Five | 閲覧可 | 閲覧可 |
| ツイン情報: 気分トラッキング | 記録可 | 記録可 + 週次グラフ |
| ツイン情報: SOUL.mdサマリー | なし | 閲覧可 |
| ツイン情報: OpenClawステータス | なし | 閲覧可 |
| インスタンス管理 | なし | 再起動・SOUL.md更新・ステータス確認 |
| 性格診断やり直し | 可 | 可 + SOUL.md自動更新 |

### 3.3 RevenueCat設定
- Entitlement名: `pro`
- 課金状態管理: `useSubscription()` hook
- Webhook: Supabase Edge Functionで受信 → DB更新 + プロビジョニングトリガー

---

## 4. 画面一覧

### 4.1 全画面マップ

```
                    ┌─────────┐
                    │ App起動  │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │スプラッシュ│
                    │認証チェック │
                    └────┬────┘
            ┌────────────┼────────────┬──────────────┐
            ▼            ▼            ▼              ▼
       ┌─────────┐  ┌──────────┐  ┌────────────┐ ┌──────────────────────────────────┐
       │ 認証    │  │ゲスト    │  │オンボーディング│ │         メインタブ                │
       │ (auth)  │  │ブラウズ  │  │(onboarding)│ │ Chat / Community / Twin / Settings │
       └─────────┘  │(閲覧のみ)│  └──────────┘ └──────────────────────────────────┘
                     └────────────┘
```

### 4.2 認証グループ (auth) -- 1画面

| # | 画面名 | ファイル | 説明 |
|---|--------|---------|------|
| A-1 | ログイン | `app/(auth)/login.tsx` | Apple/Google Sign-In |

### 4.3 オンボーディンググループ (onboarding) -- 6画面

| # | 画面名 | ファイル | 説明 | 課金接点 |
|---|--------|---------|------|---------|
| O-1 | ウェルカム | `app/(onboarding)/welcome.tsx` | アプリ紹介・価値訴求 | なし |
| O-2 | 性格診断 | `app/(onboarding)/personality-quiz.tsx` | Big Five 5問タップ式 | なし |
| O-3 | 診断結果 | `app/(onboarding)/result.tsx` | AI分析結果（詳細はブラー → 課金誘導） | 詳細分析ブラー |
| O-4 | AIアイコン選択 | `app/(onboarding)/choose-avatar.tsx` | AIツインのアイコンを選択 | なし |
| O-5 | 口調パターン | `app/(onboarding)/choose-tone.tsx` | AIの話し方を選択 | なし |
| O-6 | ツイン対面 | `app/(onboarding)/meet-twin.tsx` | 名前設定 + 初回チャット3往復 | チャット制限 |

### 4.4 ペイウォールグループ (paywall) -- 1画面

| # | 画面名 | ファイル | 説明 | 課金接点 |
|---|--------|---------|------|---------|
| P-1 | ペイウォール | `app/(paywall)/index.tsx` | フルスクリーン課金画面 | **主要課金ポイント** |

### 4.5 メインタブグループ (tabs) -- 4画面（4タブ構成）

| # | 画面名 | ファイル | タブアイコン | 説明 | 課金接点 |
|---|--------|---------|-----------|------|---------|
| T-1 | チャット | `app/(tabs)/index.tsx` | MessageCircle | AIツインとの1:1チャット + 日記統合 | Free: 3回制限 → ペイウォール |
| T-2 | コミュニティ | `app/(tabs)/community.tsx` | Users | AIツイン同士の会話を観察 | **Pro限定** |
| T-3 | ツイン情報 | `app/(tabs)/twin.tsx` | User | 性格データ + 気分 + OpenClawステータス | 一部Pro限定 |
| T-4 | 設定 | `app/(tabs)/settings.tsx` | Settings | アカウント・サブスク管理 | アップグレードCTA |

### 4.6 モーダル -- 4画面

| # | 画面名 | ファイル | 表示トリガー | 説明 |
|---|--------|---------|------------|------|
| M-1 | ペイウォール | `app/(paywall)/index.tsx` | 各画面のPro誘導ボタン | Pro課金誘導モーダル |
| M-2 | サブスク管理 | `subscription-manage.tsx` | 設定 → サブスク管理 | サブスクリプション管理 |
| M-3 | ツイン会話詳細 | `twin-conversation-detail.tsx` | コミュニティ → 会話タップ | AIツイン同士の会話詳細 |
| M-4 | アカウント削除確認 | `account-delete-confirm.tsx` | 設定 → アカウント削除 | 最終確認ダイアログ |

### 4.7 画面総数: 16画面

| グループ | 画面数 |
|---------|--------|
| auth | 1 |
| onboarding | 6 |
| paywall | 1 |
| tabs | 4 |
| modals | 4 |
| **合計** | **16** |

---

## 5. ユーザーフロー（課金導線）

### 5.1 新規ユーザーフロー（Day 0 課金導線: 約8分）

```
[A-1 ログイン] ─── 0:00
      │ Apple/Google Sign-In
      ▼
[O-1 ウェルカム] ─── 0:30
      │ 「始める」タップ
      ▼
[O-2 性格診断] ─── 1:00〜3:00
      │ 5問回答
      ▼
[O-3 診断結果] ─── 3:00〜3:30
      │ ★ 詳細分析ブラー表示（課金欲求 UP）
      ▼
[O-4 AIアイコン選択] ─── 3:30〜4:00
      │ アイコン選択
      ▼
[O-5 口調パターン] ─── 4:00〜4:30
      │ 口調選択
      ▼
[O-6 ツイン対面] ─── 4:30〜7:00
      │ 名前設定 → 3往復チャット
      │ ★ AIが「もっと話したい？」（課金欲求 UP）
      ▼
[P-1 ペイウォール] ─── 7:00〜8:00
      │ ★★★ フルスクリーン
      │ 初回限定¥29,800（50%OFF）+ 3日間無料トライアル
      ├── 課金 → [T-1 チャット]（Pro体験開始）
      └── スキップ → [T-1 チャット]（Free制限付き）
```

### 5.2 既存ユーザーフロー（継続課金誘導 -- 4つの課金導線）

```
[T-1 チャット]
      │ Free: 3回上限到達
      │ ★ 「もっと話したい？ Proにアップグレード」
      └──→ [P-1 ペイウォール]

[T-2 コミュニティ] ★★ 最強の課金導線
      │ Freeユーザーがタブをタップ
      │ ★ 他のツインたちのプレビュー（ぼかし表示）
      │ 「Proになってツイン同士の交流を楽しもう」
      └──→ [P-1 ペイウォール]

[T-3 ツイン情報]
      │ Pro限定セクション（SOUL.md、OpenClawステータス）
      │ ★ Pro機能制限表示
      └──→ [P-1 ペイウォール]

[T-4 設定]
      │ 「Proにアップグレード」CTA
      └──→ [P-1 ペイウォール]
```

---

## 6. ディレクトリ構成

```
altme/
├── app/                          # Expo Router（画面のみ）
│   ├── _layout.tsx               # Root Layout
│   ├── +not-found.tsx
│   ├── (auth)/                   # 認証グループ
│   │   ├── _layout.tsx
│   │   └── login.tsx
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
│       ├── chat/                 # 無料ユーザー用AIチャット（SSE）
│       ├── provision-openclaw/   # OpenClawプロビジョニング
│       ├── destroy-openclaw/     # OpenClaw破棄
│       ├── health-check-openclaw/ # ヘルスチェック
│       ├── update-soul-md/       # SOUL.md更新
│       ├── restart-openclaw/     # インスタンス再起動
│       ├── onboarding-chat/      # オンボーディング初回チャット
│       ├── personality-analyze/  # パーソナリティ分析
│       ├── generate-twin-conversation/ # AIツイン会話生成
│       ├── webhook-revenuecat/   # RevenueCat Webhook
│       ├── create-checkout-session/  # Stripe Checkout Session作成
│       └── webhook-stripe/       # Stripe Webhook
├── specs/                        # 仕様書（Single Source of Truth）
│   ├── overview.md
│   ├── constitution.md
│   ├── plan.md
│   ├── features/
│   ├── api/
│   ├── shared/
│   └── screens/
├── docs/                         # ドキュメント
│   └── specs/                    # 仕様書ドキュメント版
├── designs/                      # デザインファイル (.pen)
├── CLAUDE.md
├── .env.example
├── app.json
├── package.json
└── tsconfig.json
```

---

## 7. コーディング規約

| ルール | 説明 |
|--------|------|
| TypeScript strict mode | 全ファイル必須 |
| コンポーネント | 関数コンポーネント + hooks |
| 変数・関数名 | camelCase |
| コンポーネント・型名 | PascalCase |
| ファイル名 | kebab-case.ts / kebab-case.tsx |
| 1ファイル1コンポーネント | 単一責任 |
| export | named export のみ（Expo Router画面は例外で export default 許可） |
| 状態管理 | Zustand セレクタでピンポイント購読 |
| リスト表示 | FlashList / LegendList 使用（ScrollView + .map() 禁止） |

---

## 8. 開発方法論: 仕様駆動開発（Spec-Driven Development）

### 8.1 原則
1. **仕様が正（Single Source of Truth）** -- 実装は仕様書に従う。仕様にないものは作らない
2. **型が契約（Contract）** -- `src/shared/types/` の型定義がAgent間の契約。変更は全Agent合意が必要
3. **仕様変更は仕様書から** -- コードだけ変えず、まず仕様書を更新してから実装
4. **テストは仕様の検証** -- テストケースは仕様書の受け入れ条件から導出

### 8.2 Constitution（アーキテクチャ原則）

| # | 原則 | 内容 |
|---|------|------|
| 1 | Revenue First | 全てのUI/UX判断は「課金につながるか」で優先順位を決める |
| 2 | Addiction by Personalization | データ蓄積 = スイッチングコスト。使うほど手放せないプロダクト |
| 3 | Paywall Before Value | 価値を見せてから壁を立てる。最も欲求が高まった瞬間にペイウォール |
| 4 | Spec Drives Code | 仕様がコードに先行する。仕様書がSingle Source of Truth |
| 5 | Ship Fast, Measure, Iterate | 4週間でMVP。完璧を求めず最速リリース |
| 6 | Minimal Viable Cost | GPT-4o miniでテキストベース。粗利率95%+ |
| 7 | Agent-Parallel Architecture | features/ を機能単位で分離し、4 Agentが同時開発可能 |

### 8.3 開発フロー

```
仕様書作成 → 仕様レビュー・承認 → 型定義・インターフェース作成
     → AgentTeam並列実装 → テスト → 統合テスト → リリース
```

### 8.4 仕様書一覧

| No. | ファイル | 内容 | 担当Agent |
|-----|---------|------|----------|
| 00 | specs/overview.md | プロジェクト概要・アーキテクチャ | 全体 |
| 01 | specs/constitution.md | アーキテクチャ原則・スコープ | 全体 |
| 02 | specs/plan.md | 技術実装計画（Phase 0-4） | 全体 |
| 03 | specs/features/auth.md | 認証仕様（Apple/Google + devLogin） | Agent A |
| 04 | specs/features/onboarding.md | オンボーディング + SOUL.md生成 | Agent C |
| 05 | specs/features/openclaw-provisioning.md | OpenClawプロビジョニング | Agent A/C |
| 06 | specs/features/chat.md | AIチャット（Free: SSE / Pro: WebSocket）+ 日記統合 | Agent C |
| 07 | specs/features/community.md | コミュニティ（AIツイン同士の会話、Pro限定） | Agent D |
| 08 | specs/features/insights.md | ツイン情報（性格 + 気分 + OpenClawステータス） | Agent D |
| 09 | specs/features/subscription.md | 課金管理（RevenueCat） | Agent B |
| 10 | specs/features/journal.md | 日記 + AI振り返り（チャット統合） | Agent C |
| 11 | specs/features/settings.md | 設定 + インスタンス管理 + アカウント削除 | Agent D |
| 12 | specs/api/database.md | DBスキーマ（13テーブル + VIEW + RLS） | Agent A |
| 13 | specs/api/external-services.md | 外部サービス連携（DO/OpenClaw/Edge Functions） | Agent A/C |
| 14 | specs/shared/navigation.md | ナビゲーション構造・ルーティングガード | Agent A |

---

## 9. AgentTeam構成

### 9.1 Agent一覧

| Agent | 名称 | 担当範囲 |
|-------|------|---------|
| A | Foundation | shared/, services/, config/, auth, レイアウト, DBマイグレーション, OpenClawサービスクライアント |
| B | Subscription | subscription/, (paywall)/, RevenueCat全般, Webhook, 課金 → プロビジョニング連携 |
| C | Core AI | chat/, onboarding/, openclaw/, Edge Functions(chat, provision, destroy, health-check, update-soul-md, restart, onboarding-chat), WebSocketクライアント |
| D | Engagement | community/, twin-info/, settings/(OpenClawインスタンス管理UI含む), 通知, Edge Functions(generate-twin-conversation) |

### 9.2 Agent間ルール
- `features/` は担当Agentのみ変更可
- `shared/` の変更はAgent Aが管理。他AgentはPR/提案として依頼
- `services/` は担当APIのみ変更可
- 型定義（`shared/types/`）の変更は全Agent合意が必要
- Edge Functions（`supabase/functions/`）は担当機能のみ変更可

---

## 10. スコープ内（追加機能）

| 機能 | 概要 | 追加日 |
|------|------|--------|
| ゲストブラウズモード | ログインなしでコミュニティ一覧・詳細を閲覧可能（Apple審査準拠） | 2026-02-15 |
| Web版課金（Stripe） | Stripe Checkout + Webhook + RevenueCat Stripe Provider統合 | 2026-02-15 |
| トークン管理 | OpenAIトークン消費量の追跡・制限（Free: 10K / Pro: 500K / 追加購入対応） | 2026-02-15 |
| API Key保護 | 全外部APIキーをEdge Function経由でのみ使用、クライアント非露出 | 2026-02-15 |
| Googleロゴ規約準拠 | Googleブランドガイドラインに準拠したログインボタン | 2026-02-15 |

---

## 11. やらないこと（スコープ外）

- 画像生成（コスト高、Phase 2以降）
- 音声チャット（技術的に複雑、Phase 3以降）
- ユーザー同士のDM・フォロー（コミュニティはツイン交流のみ）
- マルチエージェント（1ユーザー1インスタンス）
- Web版フルアプリ（課金のみWeb対応、アプリ本体はモバイルのみ）
- 多言語対応（MVP時点では日本語 + 英語）
- Apple Watch / ウィジェット
- カスタムAIパーソナリティ（Phase 2以降）

---

## 12. 非機能要件

### 12.1 パフォーマンス
- アプリ起動（Cold Start）: 2秒以内
- チャット初回応答: 3秒以内（ストリーミング表示でUX補完）
- 画面遷移: 300ms以内
- オンボーディング完了: 8分以内（課金導線の最短化）

### 12.2 対応OS/バージョン
- iOS 16.0+
- Android 13+ (API 33+)

### 12.3 オフライン対応
- 部分対応
- チャット履歴キャッシュ（ローカルストレージ）
- 過去の日記・洞察データは閲覧可能
- オフライン時の新規チャット・日記作成は不可（エラーメッセージ表示）

### 12.4 セキュリティ
- APIキーは環境変数管理、クライアントに露出させない
- OpenClaw通信はトークン認証付きWebSocket（wss://）
- チャット履歴はSupabase RLS（Row Level Security）で保護
- 個人情報の暗号化保存
- SOUL.mdはユーザー専用Droplet内に保持
- SecureStoreでトークン管理

### 12.5 アクセシビリティ
- タップターゲット最小44pt
- テキスト最小サイズ12pt
- コントラスト比4.5:1以上

### 12.6 可用性
- API障害時: グレースフルデグラデーション（エラーメッセージ表示）
- Droplet障害時: ヘルスチェック + 自動再起動

---

## 13. 開発フェーズとロードマップ

### 13.1 フェーズ概要

| Phase | 名称 | 期間 | 目的 |
|-------|------|------|------|
| Phase 0 | 基盤整備 | 3日 | DB差分マイグレーション、型定義更新、タブ構成変更 |
| Phase 1 | コア機能 | 7日 | 認証・オンボーディング・Free/Proチャット・課金フロー |
| Phase 2 | エンゲージメント機能 | 5日 | ツイン情報、日記統合、設定画面拡張 |
| Phase 3 | プレミアム機能 | 5日 | OpenClawプロビジョニング完成、コミュニティ機能 |
| Phase 4 | 統合テスト + 最適化 | 4日 | E2Eテスト、課金フロー検証、Apple審査準備 |

**合計所要期間: 24日（約5週間）**

### 13.2 実行順序

```
Phase 0 (3日):
  T001〜T006（Agent A、全並列）
  ↓
Phase 1 (7日):
  Agent A: T007, T008
  Agent B: T012, T013, T018
  Agent C: T009〜T017
  ↓
Phase 2 (5日):
  Agent C: T023〜T025
  Agent D: T019〜T022, T026, T027
  ↓
Phase 3 (5日):
  Agent C: T028〜T032, T034
  Agent D: T033, T035, T036
  ↓
Phase 4 (4日):
  Agent A: T039, T040, T042
  Agent B+C: T037, T038
  Agent D: T041
```

---

## 14. テスト方針

| レベル | ツール | 対象 | 実行タイミング |
|--------|-------|------|-------------|
| Unit Test | Jest + RNTL | Hook、Store、ユーティリティ | 各タスク完了時 |
| Integration Test | Supabase Local + Jest | Edge Function、DB、RLS | Phase完了時 |
| E2E Test | サンドボックス | 課金 → プロビジョニング → チャット | Phase 4 |
| Manual Test | 実機 | UI/UX、Apple審査項目 | Phase 4 |

- 課金フローのE2Eテストは必須
- 各feature内にunit testを配置（`__tests__/`）
- OpenClaw APIのモックを用意（テスト時は実サーバーに接続しない）
- DigitalOcean APIのモックを用意
- テストケースは仕様書の受け入れ条件から導出する
- RevenueCat: サンドボックスアカウントで必ず課金フローをテスト
