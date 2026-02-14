# 00 — プロダクト概要・アーキテクチャ仕様

## ステータス: DRAFT
- 作成日: 2026-02-14
- 最終更新: 2026-02-14
- 承認状態: 未承認

---

## 1. プロダクト概要

### 1.1 アプリ名
**AltMe** — Your AI Twin That Knows You

### 1.2 コンセプト
「もう一人の自分」AIツインを育てるパーソナルAIアプリ。
ユーザーの性格・思考・感情パターンを学習し、自己理解を深める。

### 1.3 ターゲットユーザー
- **プライマリ**: 20〜35歳、自己成長・メンタルヘルスに関心がある層
- **セカンダリ**: 日記・振り返りの習慣をつけたいビジネスパーソン
- **市場**: 日本（初期）→ グローバル展開

### 1.4 マネタイズ目標
- 6ヶ月後 MRR: ¥200,000〜500,000
- 12ヶ月後 MRR: ¥500,000〜1,500,000

### 1.5 コアバリュー
1. **パーソナライズ** — 使うほど「自分」を理解するAI
2. **即効性** — インストール8分で「自分の分身」を体験
3. **習慣形成** — 毎日の振り返りが自然とできるUX
4. **プライバシー** — パーソナルデータはユーザーのもの

---

## 2. アーキテクチャ

### 2.1 システム構成図

```
┌─────────────────────────────────────────────────┐
│                    Mobile App                     │
│            React Native (Expo) + Router           │
│                                                   │
│  ┌──────────┐ ┌───────────┐ ┌──────────────────┐ │
│  │   Auth    │ │  Paywall  │ │   Core Features  │ │
│  │  Screen   │ │  Screen   │ │ Chat/Journal/etc │ │
│  └────┬─────┘ └─────┬─────┘ └────────┬─────────┘ │
│       │             │                │             │
│  ┌────┴─────────────┴────────────────┴──────────┐ │
│  │              Zustand Store                    │ │
│  │  (user, subscription, chat, journal state)    │ │
│  └──────────────────┬───────────────────────────┘ │
└─────────────────────┼─────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
┌──────────────┐ ┌─────────┐ ┌──────────────┐
│   Supabase   │ │RevenueCat│ │ Expo Push    │
│              │ │         │ │ Notification │
│ ・Auth       │ │ ・SDK    │ │ Service      │
│ ・PostgreSQL │ │ ・Webhook│ │              │
│ ・Edge Func  │ │ ・Paywall│ └──────────────┘
│   ↓          │ └─────────┘
│ OpenAI API   │
│ (GPT-4o mini)│
└──────────────┘
```

### 2.2 技術スタック

| レイヤー | 技術 | バージョン | 備考 |
|---------|------|----------|------|
| フロントエンド | React Native (Expo) | SDK 52+ | Expo Router v3 |
| 状態管理 | Zustand | 5.x | persist middleware使用 |
| バックエンド | Supabase | - | Auth + DB + Edge Functions |
| 認証 | Supabase Auth | - | Apple/Google Sign-In |
| AI API | OpenAI GPT-4o mini | - | Edge Function経由 |
| 課金 | RevenueCat | SDK 8.x | Paywalls SDK含む |
| 通知 | Expo Notifications | - | ローカル + プッシュ |
| アナリティクス | PostHog | - | イベントトラッキング |

### 2.3 データフロー

```
1. 認証フロー:
   App → Supabase Auth → JWT Token → App State

2. AIチャットフロー:
   App → Supabase Edge Function → OpenAI API → Response → App State → DB保存

3. 課金フロー:
   App → RevenueCat SDK → App Store/Google Play → Webhook → Supabase DB

4. 通知フロー:
   Supabase Edge Function (cron) → Expo Push API → Device
```

---

## 3. ディレクトリ構成

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
│   └── (tabs)/                   # メインタブ
│       ├── _layout.tsx
│       ├── index.tsx             # チャット（ホーム）
│       ├── journal.tsx           # 日記
│       ├── insights.tsx          # 洞察
│       └── settings.tsx          # 設定
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
│   │   └── types/                # 型定義
│   ├── services/                 # 外部サービス連携
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   └── database.ts
│   │   ├── revenuecat/
│   │   │   ├── client.ts
│   │   │   └── offerings.ts
│   │   ├── openai/
│   │   │   └── client.ts
│   │   └── analytics/
│   │       └── client.ts
│   └── config/
│       ├── env.ts                # 環境変数
│       ├── constants.ts          # 定数
│       └── theme.ts              # テーマ定義
├── supabase/                     # Supabase設定
│   ├── migrations/               # DBマイグレーション
│   └── functions/                # Edge Functions
│       ├── chat/
│       ├── personality-analyze/
│       └── webhook-revenuecat/
├── docs/
│   └── specs/                    # 仕様書
├── CLAUDE.md
├── .env.example
├── app.json
├── package.json
└── tsconfig.json
```

---

## 4. 開発方法論：仕様駆動開発（Spec-Driven Development）

### 4.1 開発フロー

```
仕様書作成 → 仕様レビュー・承認 → 型定義・インターフェース作成
     → AgentTeam並列実装 → テスト → 統合テスト → リリース
```

### 4.2 ルール
1. **仕様が正（Single Source of Truth）** — 実装は仕様書に従う。仕様にないものは作らない
2. **型が契約（Contract）** — `src/shared/types/` の型定義がAgent間の契約。変更は全Agent合意が必要
3. **仕様変更は仕様書から** — コードだけ変えず、まず仕様書を更新してから実装
4. **テストは仕様の検証** — テストケースは仕様書の「検証条件」から導出

### 4.3 仕様書一覧

| No. | ファイル | 内容 | 担当Agent |
|-----|---------|------|----------|
| 00 | overview.md | 本ドキュメント（概要・アーキテクチャ） | 全体 |
| 01 | data-models.md | DB設計・型定義 | Agent A |
| 02 | auth.md | 認証仕様 | Agent A |
| 03 | subscription.md | 課金仕様（RevenueCat） | Agent B |
| 04 | onboarding.md | オンボーディング仕様 | Agent C |
| 05 | chat.md | AIチャット仕様 | Agent C |
| 06 | journal.md | 日記機能仕様 | Agent D |
| 07 | insights.md | 洞察・レポート仕様 | Agent D |
| 08 | api.md | API設計（Edge Functions） | Agent A/C |
| 09 | agent-team.md | AgentTeam構成・分担 | 全体 |

---

## 5. 非機能要件

### 5.1 パフォーマンス
- アプリ起動: 2秒以内（Cold Start）
- AIレスポンス: 3秒以内（ストリーミング表示でUX補完）
- 画面遷移: 300ms以内

### 5.2 セキュリティ
- APIキーは環境変数管理、クライアントに露出させない
- OpenAI呼び出しはSupabase Edge Function経由（サーバーサイド）
- チャット履歴はSupabase RLS（Row Level Security）で保護
- 個人情報の暗号化保存

### 5.3 可用性
- オフライン時: ローカルキャッシュで過去データ閲覧可能
- API障害時: グレースフルデグラデーション（エラーメッセージ表示）

### 5.4 対応プラットフォーム
- iOS 16.0+
- Android 10+ (API 29+)
