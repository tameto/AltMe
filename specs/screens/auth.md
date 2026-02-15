# 認証画面仕様 — Auth

## 参照仕様: specs/features/auth.md
## デザイン: designs/auth.pen (未作成)

---

## A-1: ログイン画面

### ファイル
`app/(auth)/login.tsx`

### レイアウト構成

```
┌─────────────────────────────────┐
│          SafeArea Top           │
│                                 │
│         ┌───────────┐           │
│         │  App Logo  │          │
│         │  (80x80)   │          │
│         └───────────┘           │
│                                 │
│        「AltMe」               │
│   Your AI Twin That Knows You   │
│                                 │
│   もう一人の自分と、毎日を振り返る   │
│                                 │
│                                 │
│  ┌─────────────────────────────┐│
│  │  Appleでサインイン           ││
│  │  (Apple標準スタイル / 黒)     ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  Googleでサインイン          ││
│  │  (白背景 / Googleロゴ)       ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  開発用ログイン (__DEV__のみ) ││
│  └─────────────────────────────┘│
│                                 │
│   利用規約 ・ プライバシーポリシー  │
│                                 │
│          SafeArea Bottom        │
└─────────────────────────────────┘
```

### コンポーネント構成

| # | コンポーネント | 種類 | 配置 | 備考 |
|---|--------------|------|------|------|
| 1 | AppLogo | Image | 上部中央 | 80x80pt、紫→青グラデーション |
| 2 | AppTitle | Text | ロゴ下 | "AltMe" Display 32pt Bold |
| 3 | AppSubtitle | Text | タイトル下 | "Your AI Twin That Knows You" Body 16pt |
| 4 | AppTagline | Text | サブタイトル下 | 「もう一人の自分と、毎日を振り返る」Caption 14pt |
| 5 | AppleSignInButton | Button | 中央下部 | iOS標準ASAuthorizationAppleIDButton、高さ50pt |
| 6 | GoogleSignInButton | Button | Apple下 | 白背景、Googleロゴ + テキスト、高さ50pt |
| 7 | DevLoginButton | Button | Google下 | __DEV__のみ表示、ゴーストスタイル |
| 8 | LegalLinks | Text | 最下部 | 利用規約・プライバシーポリシーリンク、Caption 12pt |

### スペーシング

| 区間 | 間隔 |
|------|------|
| SafeArea上端 → ロゴ | 80pt |
| ロゴ → タイトル | 24pt |
| タイトル → サブタイトル | 8pt |
| サブタイトル → タグライン | 4pt |
| タグライン → Appleボタン | 48pt |
| Appleボタン → Googleボタン | 12pt |
| Googleボタン → DevLoginボタン | 12pt |
| ボタン群 → 法的リンク | auto（下部固定） |
| 法的リンク → SafeArea下端 | 16pt |

### ボタン仕様

| ボタン | 幅 | 高さ | 角丸 | スタイル |
|--------|-----|------|------|---------|
| Appleでサインイン | fill - 32pt margin | 50pt | 12pt | Apple標準（黒背景/白文字） |
| Googleでサインイン | fill - 32pt margin | 50pt | 12pt | 白背景、1pt border #E0E0E0、黒文字 |
| 開発用ログイン | fill - 32pt margin | 44pt | 8pt | 透明背景、テキストのみ、グレー |

### 状態設計

| 状態 | 表示内容 |
|------|---------|
| **Default** | ロゴ + タイトル + ボタン群 |
| **Loading (認証中)** | タップしたボタンにスピナー表示、他ボタン無効化、背景を薄暗く |
| **Error** | ボタン下にインラインエラーメッセージ（赤テキスト + アイコン） |
| **Offline** | 画面上部にオフラインバナー「ネットワークに接続してください」 |

### インタラクション

| アクション | 動作 | アニメーション |
|-----------|------|------------|
| Apple Sign-In タップ | Apple認証シート表示 | ボタンpress state (opacity 0.7) |
| Google Sign-In タップ | Google認証ブラウザ起動 | ボタンpress state (opacity 0.7) |
| Dev Login タップ | 即時email/password認証 | ボタンpress state |
| 認証成功 | 画面遷移 | fade out → 次画面 fade in (300ms) |
| 認証失敗 | エラー表示 | shake animation (エラーメッセージ) |
| 認証キャンセル | 元に戻る | ボタン状態リセット |
| 法的リンクタップ | in-app browser で開く | — |

### アクセシビリティ

| 要素 | accessibilityLabel | accessibilityRole |
|------|-------------------|-------------------|
| Appleボタン | "Appleでサインイン" | button |
| Googleボタン | "Googleでサインイン" | button |
| DevLoginボタン | "開発用ログイン" | button |
| 法的リンク | "利用規約" / "プライバシーポリシー" | link |

### Free / Pro 差分
なし（認証画面は課金状態に依存しない）

---

## デザインノート

### ビジュアル方針
- ミニマルで洗練された印象
- 背景: グラデーション（薄い紫→白）またはソリッドホワイト
- ロゴ: ミラー/双子モチーフ、紫→青グラデーション
- ボタン: Apple標準ガイドラインに準拠（Sign in with Apple）
- テキスト: ダークグレー (#1A1A2E) 、サブテキストはミディアムグレー (#6B7280)

### Revenue First 判断
- 認証画面自体に課金接点はない
- **最小ステップで認証完了** → オンボーディング（課金導線）に最速で誘導
- ボタンは2つだけ（Apple + Google）で選択疲れを防ぐ
- 「アカウント作成」と「ログイン」を分けない（ワンタップで両方対応）
