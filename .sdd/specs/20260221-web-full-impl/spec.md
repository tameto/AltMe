# Web版フル実装 仕様書

## Feature ID: 20260221-web-full-impl
## Status: Implementation Complete（P1-P12 全フェーズ完了）
## Date: 2026-02-21

---

## 1. 概要

AltMe の Web 版をフル実装する。iOS/Android と同時に更新可能なクロスプラットフォームアーキテクチャを構築し、チャット・認証・課金・オンボーディング・コミュニティ・設定の全機能を Web で利用可能にする。

### 目的
- Web ブラウザで AltMe の全機能を利用可能にする
- Web/iOS/Android の3プラットフォームを単一コードベースで維持し、メンテナンスコストを最小化する
- テスト駆動開発（TDD）で品質を担保する

### 対象外
- PWA（Progressive Web App）対応（Phase 2）
- SSR/SSG（Static Site Generation）対応
- SEO 最適化（認証必須アプリのため不要）

---

## 2. 現状分析

### 2.1 既に Web 対応済み
| サービス | 方式 | 品質 |
|---------|------|------|
| Supabase Client | `.native.ts` / `.web.ts` 分離 | 完全対応（sessionStorage + in-memory） |
| Supabase Auth | `.native.ts` / `.web.ts` 分離 | 完全対応（OAuth redirect フロー） |
| RevenueCat | `.native.ts` / `.web.ts` 分離 | Stub（Web では no-op） |
| Notifications | `.native.ts` / `.web.ts` 分離 | Stub（Web push 非対応） |
| Analytics | `.native.ts` / `.web.ts` 分離 | 部分対応（console.log のみ） |
| OpenClaw WebSocket | 分離不要 | ブラウザ標準 WebSocket API で動作可能 |
| OpenClaw Connection Manager | 分離不要 | グローバル状態管理 |

### 2.2 Web 対応が必要な箇所

#### サービス層
| ファイル | 問題 | 対応方針 |
|---------|------|---------|
| `use-network.ts` | `expo-network` が Web で不完全 | `.web.ts` / `.native.ts` 分離、Web は `navigator.onLine` + `online/offline` イベント |
| `use-subscription.ts` | `react-native-purchases` 型 import | 型定義を `shared/types/subscription.ts` に移動、実装はプラットフォーム分離 |
| `glass-card.tsx` | `expo-blur` BlurView の Web 挙動 | `.web.tsx` で CSS `backdrop-filter` 使用、`.native.tsx` で BlurView 維持 |

#### UI/レイアウト層
| 項目 | 問題 | 対応方針 |
|------|------|---------|
| タブナビゲーション | モバイル＝ボトムタブ、Web＝サイドバー | `_layout.web.tsx` でサイドバー、`_layout.tsx` でボトムタブ |
| レスポンシブデザイン | 現在モバイルファーストのみ | ブレークポイント制御（768px / 1024px / 1440px） |
| キーボードショートカット | Web 固有 | Enter で送信、Shift+Enter で改行 等 |
| スクロール | `FlatList` / `FlashList` | Web では仮想リスト互換性確認、必要に応じて fallback |
| 画像・メディア | `expo-image-picker` | Web では `<input type="file">` |
| ハプティクス | `expo-haptics` | Web では no-op |
| セキュアストレージ | `expo-secure-store` | 既に対応済み（sessionStorage） |

#### 画面別 Web 対応
| 画面 | Web 固有の対応 |
|------|-------------|
| Login (auth) | OAuth redirect フロー（既に auth.web.ts で対応済み）、Web レイアウト調整 |
| Onboarding | 6画面のレスポンシブ対応、画像選択の Web 対応 |
| Chat | WebSocket（既に対応可能）、メディアアップロード Web 対応、キーボードショートカット |
| Community | レスポンシブレイアウト |
| Twin Info | レスポンシブレイアウト |
| Settings | Web 固有設定項目、サブスク管理の Web 対応（Stripe ポータルリンク） |
| Paywall | Stripe Checkout リダイレクト（モバイル＝RevenueCat、Web＝Stripe） |
| Token Purchase | Web では Stripe 決済 |
| Subscription Manage | Web では Stripe Customer Portal リンク |

---

## 3. クロスプラットフォーム アーキテクチャ設計

### 3.1 ファイル分離戦略

Codex (GPT-5.3) との相談結果に基づく方針：

#### 原則
1. **構造的な差異** → `.web.tsx` / `.native.tsx` 分離
2. **軽微な差異** → `Platform.select()` / `Platform.OS` 条件分岐
3. **app/ ルート** → 必ずベースファイル（`.tsx`）を維持 + プラットフォーム variant

#### サービス層（既存パターン踏襲）
```
src/services/{service}/
  client.ts          # TypeScript 解決用ダミー（re-export）
  client.native.ts   # ネイティブ実装
  client.web.ts      # Web 実装
```

#### コンポーネント層（新規パターン）
```
src/shared/components/
  glass-card.tsx        # 共通インターフェース（re-export）
  glass-card.native.tsx # BlurView 使用
  glass-card.web.tsx    # CSS backdrop-filter 使用
```

#### hooks 層
```
src/shared/hooks/
  use-network.ts         # 共通インターフェース
  use-network.native.ts  # expo-network / @react-native-community/netinfo
  use-network.web.ts     # navigator.onLine + online/offline events
```

#### レイアウト層（Expo Router プラットフォーム specific layouts）
```
app/(tabs)/
  _layout.tsx      # モバイル：ボトムタブ（Tabs コンポーネント）
  _layout.web.tsx  # Web：サイドバーナビゲーション（headless tabs）
```

### 3.2 レスポンシブデザイン

#### ブレークポイント
| 名称 | 幅 | 対象 |
|------|-----|------|
| `mobile` | < 768px | スマホ Web |
| `tablet` | 768px - 1023px | タブレット、小型 PC |
| `desktop` | 1024px - 1439px | デスクトップ |
| `wide` | >= 1440px | ワイドスクリーン |

#### useResponsive hook
```typescript
interface ResponsiveInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide';
  width: number;
  height: number;
}
```

### 3.3 ナビゲーション

#### モバイル（iOS/Android）
- ボトムタブ 4タブ（チャット / コミュニティ / マイエージェント / マイページ）
- Stack ナビゲーション（モーダル含む）

#### Web
- サイドバーナビゲーション（左側固定、幅 240px）
- コンテンツ最大幅 960px（centered）
- レスポンシブ: mobile ではボトムタブに fallback
- headless tabs（`expo-router/ui`）を使用してルート構造を共有

### 3.4 Web 固有の UX

#### キーボードショートカット
| ショートカット | アクション |
|-------------|---------|
| `Enter` | メッセージ送信（チャット） |
| `Shift + Enter` | 改行（チャット） |
| `Escape` | モーダルクローズ |
| `Ctrl/Cmd + K` | コマンドパレット（将来） |

#### ブラウザバック/フォワード
- Expo Router が自動でブラウザ履歴を管理
- 追加対応不要（ルーティングは同一構造）

#### タブタイトル
- 各画面に `<Head>` で `<title>` を設定

---

## 4. 機能別 Web 対応仕様

### 4.1 認証（Auth）

#### Web 認証フロー
- **Google**: `supabase.auth.signInWithOAuth({ provider: 'google' })` → リダイレクト
- **Apple**: `supabase.auth.signInWithOAuth({ provider: 'apple' })` → リダイレクト
- **devLogin**: email/password 認証（既存と同じ）
- **ゲストモード**: 既存ロジックがそのまま動作

#### セッション管理
- Web: `sessionStorage` + in-memory fallback（既に auth.web.ts で対応済み）
- `visibilitychange` イベントで auto-refresh（既に client.web.ts で対応済み）

#### Web 固有の認証 UI
- OAuth リダイレクト後のコールバック処理（`/auth/callback` ルート）
- リダイレクト中のローディング画面

### 4.2 課金（Subscription）

#### モバイル → RevenueCat
既存実装を維持。

#### Web → Stripe Checkout
1. ユーザーが「Proにアップグレード」をクリック
2. `create-checkout-session` Edge Function を呼び出し
3. 返却された Stripe Checkout URL に `window.location.href` でリダイレクト
4. 決済完了後、success URL（`/payment/success`）にリダイレクト
5. Stripe Webhook → `webhook-stripe` Edge Function → DB 更新 + RevenueCat 同期

#### Web サブスクリプション管理
- Stripe Customer Portal リンクを設定画面に表示
- `create-portal-session` Edge Function で Customer Portal URL を取得

#### ペイウォール Web 版
- RevenueCat Offering の代わりに Stripe Price を表示
- 初回限定オファーは Web では非表示（モバイル限定）
- Stripe Checkout へのリダイレクトボタン

### 4.3 チャット（Chat）

#### WebSocket 接続
- ブラウザ標準 `WebSocket` API → 既存 `websocket-client.ts` がそのまま動作
- `wss://` プロトコル使用

#### Web 固有のチャット UX
- `Enter` で送信、`Shift+Enter` で改行
- `onbeforeunload` でユーザーに離脱確認（送信中のメッセージがある場合）
- ドラッグ&ドロップでファイルアップロード
- クリップボードからの画像ペースト（Ctrl+V）
- テキスト選択 → 右クリックでコピー（ブラウザネイティブ）

#### メディアアップロード Web 版
- `expo-image-picker` → Web では `<input type="file" accept="image/*,video/*,audio/*">`
- ファイル選択ダイアログ（ネイティブのアクションシートの代わり）
- ドラッグ&ドロップエリア（チャット入力欄）
- プレビュー: `URL.createObjectURL()` で即時プレビュー

### 4.4 オンボーディング

#### Web 対応
- 6画面のステップフォーム（レスポンシブ対応）
- アバター選択: 画像グリッド（タッチ → クリック）
- パーソナリティクイズ: ラジオボタン / カード選択
- meet-twin: チャット UI（WebSocket or Edge Function）

### 4.5 コミュニティ

#### Web 対応
- カード一覧 → デスクトップではグリッドレイアウト（2-3カラム）
- モバイルでは既存の縦スクロールリスト

### 4.6 ツイン情報（Twin Info）

#### Web 対応
- ダッシュボードスタイルのレイアウト（デスクトップ）
- モバイルでは既存の縦スクロール

### 4.7 設定

#### Web 固有設定
- 「サブスクリプション管理」→ Stripe Customer Portal リンク（Web）/ App Store 設定リンク（iOS）/ Play Store 設定リンク（Android）
- 「通知設定」→ Web Push 対応（Phase 2、現在は非表示）
- 「アプリ情報」→ バージョン表示

---

## 5. テスト戦略

### 5.1 Jest 構成（クロスプラットフォーム）

```javascript
// jest.config.js
module.exports = {
  projects: [
    { preset: "jest-expo/ios", displayName: "ios" },
    { preset: "jest-expo/android", displayName: "android" },
    { preset: "jest-expo/web", displayName: "web" }
  ]
};
```

### 5.2 テストカテゴリ

| カテゴリ | 説明 | 数量目安 |
|---------|------|---------|
| Unit Tests (Services) | サービス層のユニットテスト（各プラットフォーム別） | 120+ |
| Unit Tests (Hooks) | カスタム hooks のユニットテスト | 80+ |
| Unit Tests (Stores) | Zustand ストアのユニットテスト | 40+ |
| Component Tests | コンポーネントのレンダリング・インタラクションテスト | 100+ |
| Integration Tests | 機能間の結合テスト | 60+ |
| Platform Tests | プラットフォーム固有のテスト（.web.test.ts / .native.test.ts） | 80+ |
| E2E Tests | エンドツーエンドテスト（Playwright for Web） | 40+ |
| Edge Function Tests | Supabase Edge Function のユニットテスト | 30+ |

### 5.3 TDD ワークフロー
1. 仕様書の受け入れ条件からテストケースを導出
2. テストファイルを先に作成（RED）
3. 最小限の実装でテストをパス（GREEN）
4. リファクタリング（REFACTOR）

### 5.4 テスト命名規約
```
{feature}/
  __tests__/
    {module}.test.ts          # 共通テスト（全プラットフォーム）
    {module}.web.test.ts      # Web 固有テスト
    {module}.native.test.ts   # Native 固有テスト
```

---

## 6. 実装ファイル一覧

### 6.1 新規作成ファイル

#### プラットフォーム分離（コンポーネント）
- `src/shared/components/glass-card.native.tsx`
- `src/shared/components/glass-card.web.tsx`
- `src/shared/components/media-picker.native.tsx`
- `src/shared/components/media-picker.web.tsx`
- `src/shared/components/file-drop-zone.web.tsx`

#### プラットフォーム分離（hooks）
- `src/shared/hooks/use-network.native.ts`
- `src/shared/hooks/use-network.web.ts`
- `src/shared/hooks/use-responsive.ts`
- `src/shared/hooks/use-keyboard-shortcuts.web.ts`
- `src/shared/hooks/use-platform-subscription.ts`
- `src/shared/hooks/use-platform-subscription.native.ts`
- `src/shared/hooks/use-platform-subscription.web.ts`

#### Web レイアウト
- `app/(tabs)/_layout.web.tsx`
- `app/_layout.web.tsx` (必要に応じて)
- `src/shared/components/web-sidebar.web.tsx`
- `src/shared/components/responsive-container.tsx`

#### Web 課金
- `src/services/stripe/client.ts`
- `src/services/stripe/checkout.ts`
- `supabase/functions/create-portal-session/index.ts`

#### Web 認証
- `app/auth/callback.tsx` (OAuth コールバック)

#### Web 固有画面
- `app/payment/success.tsx`
- `app/payment/cancel.tsx`

#### テスト設定
- `jest.config.js` (更新: projects 構成)
- `jest.setup.web.js`
- `__mocks__/` (プラットフォーム別モック)

### 6.2 変更が必要な既存ファイル

#### 共通コンポーネント
- `src/shared/components/glass-card.tsx` → re-export に変更
- `src/shared/components/guest-prompt-overlay.tsx` → レスポンシブ対応
- `src/shared/components/cosmic-background.tsx` → Web 背景対応
- `src/shared/components/gold-button.tsx` → Web グラデーション対応

#### hooks
- `src/shared/hooks/use-network.ts` → re-export に変更
- `src/shared/hooks/use-subscription.ts` → 型 import の Web 対応

#### 画面ファイル
- `app/(tabs)/index.tsx` → キーボードショートカット、ファイル D&D
- `app/(tabs)/community.tsx` → レスポンシブグリッド
- `app/(tabs)/twin.tsx` → レスポンシブダッシュボード
- `app/(tabs)/settings.tsx` → Web 固有設定
- `app/(paywall)/index.tsx` → Stripe Checkout 対応
- `app/subscription-manage.tsx` → Stripe Portal 対応
- `app/token-purchase.tsx` → Web 決済対応
- `app/notification-settings.tsx` → Web Push 非表示

#### 設定
- `app.json` / `app.config.ts` → Web 設定追加
- `package.json` → Web 依存関係追加
- `tsconfig.json` → Web 型定義追加

---

## 7. 依存関係

### 7.1 新規パッケージ
| パッケージ | 用途 | プラットフォーム |
|-----------|------|---------------|
| `@stripe/stripe-js` | Stripe JS SDK（optional、Checkout redirect なら不要） | Web |
| `posthog-js` | PostHog Web SDK（Analytics） | Web |
| `jest-expo` | テストプリセット（projects 対応） | Dev |
| `@testing-library/react-native` | コンポーネントテスト | Dev |
| `@playwright/test` | E2E テスト（Web） | Dev |
| `msw` | API モック（Mock Service Worker） | Dev |

### 7.2 Edge Functions 新規/更新
| 関数名 | 状態 | 内容 |
|--------|------|------|
| `create-checkout-session` | 新規 | Stripe Checkout セッション作成 |
| `create-portal-session` | 新規 | Stripe Customer Portal セッション作成 |
| `webhook-stripe` | 新規 | Stripe Webhook 処理 |
| `chat` | 更新 | Web クライアント対応（CORS） |
| `webhook-revenuecat` | 更新 | Stripe Provider 連携 |

---

## 8. 受け入れ条件

### AC-W1: Web ブラウザでログインできる
- **Given**: ユーザーが Web ブラウザで AltMe を開く
- **When**: Google/Apple ログインボタンをクリック
- **Then**: OAuth リダイレクトで認証完了、メイン画面に遷移する

### AC-W2: Web でチャットが動作する
- **Given**: 認証済みユーザーが Web でチャット画面を開く
- **When**: メッセージを入力して Enter で送信
- **Then**: Free は SSE、Pro は WebSocket でストリーミング応答が表示される

### AC-W3: Web で Stripe 決済ができる
- **Given**: Free ユーザーが Web でペイウォール画面を開く
- **When**: プランを選択して「購入」をクリック
- **Then**: Stripe Checkout にリダイレクト、決済完了後に Pro 機能が有効になる

### AC-W4: Web レイアウトがレスポンシブに動作する
- **Given**: ユーザーがデスクトップブラウザで AltMe を開く
- **When**: ブラウザ幅を変更する
- **Then**: 1024px 以上でサイドバーナビ、768px 未満でボトムタブに切り替わる

### AC-W5: Web でメディアアップロードができる
- **Given**: ユーザーが Web でチャット画面を開く
- **When**: ファイル選択 or ドラッグ&ドロップで画像を添付
- **Then**: プレビュー表示 → 送信 → Supabase Storage にアップロード

### AC-W6: 全テストが3プラットフォームでパスする
- **Given**: 全テストスイートが実行される
- **When**: `jest --projects` で iOS/Android/Web を同時テスト
- **Then**: 全テストがパスし、カバレッジが 80% 以上

### AC-W7: iOS/Android の既存機能が壊れない
- **Given**: Web 対応の変更をマージする
- **When**: iOS/Android でアプリを起動し全機能をテスト
- **Then**: 既存の全機能が正常に動作する

### AC-W8: Web でオンボーディングが完了できる
- **Given**: 新規ユーザーが Web で初回ログイン
- **When**: 6画面のオンボーディングフローを完了
- **Then**: パーソナリティ分析結果が表示され、meet-twin でチャットできる

### AC-W9: Web でコミュニティが閲覧できる
- **Given**: ユーザーが Web でコミュニティタブを開く
- **When**: コミュニティ一覧/詳細を表示
- **Then**: レスポンシブレイアウトで適切に表示される

### AC-W10: Web で設定画面が動作する
- **Given**: ユーザーが Web で設定画面を開く
- **When**: サブスクリプション管理をクリック
- **Then**: Stripe Customer Portal にリダイレクトされる

---

## 9. 非機能要件

| 項目 | 要件 |
|------|------|
| ブラウザ対応 | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| レスポンシブ | 320px - 2560px |
| 初回ロード | 3秒以内（LCP） |
| バンドルサイズ | 初回 JS: < 500KB (gzip) |
| テストカバレッジ | 行カバレッジ 80% 以上 |
| アクセシビリティ | WCAG 2.1 Level AA |
| SEO | 不要（認証必須アプリ） |

---

## 10. タスク分類（Agent Team 対応）

### Agent A: Foundation（基盤）
- プラットフォーム分離アーキテクチャ
- 共通 hooks（useResponsive, useNetwork 等）
- 共通コンポーネントの Web 対応
- Jest クロスプラットフォーム設定
- テスト基盤（モック、ヘルパー）
- Web レイアウト（サイドバー、レスポンシブ）
- 型定義の更新
- 認証 Web 対応

### Agent B: Subscription（課金）
- Stripe Checkout 統合
- Stripe Customer Portal
- Edge Functions（create-checkout-session, create-portal-session, webhook-stripe）
- ペイウォール Web 版
- トークン購入 Web 版
- サブスクリプション管理 Web 版
- RevenueCat + Stripe 同期

### Agent C: Core AI（チャット・オンボーディング）
- チャット Web 対応（キーボード、D&D、ファイルアップロード）
- メディアピッカー Web 版
- オンボーディング Web 対応
- WebSocket Web 対応確認
- Edge Functions CORS 対応

### Agent D: Engagement（コミュニティ・設定・ツイン情報）
- コミュニティ レスポンシブレイアウト
- ツイン情報 レスポンシブレイアウト
- 設定画面 Web 対応
- 通知設定 Web 対応

---

## Phase 別実装進捗

### Phase 0: 基盤テスト基盤 ✅ 完了
- M001-M009: Jest クロスプラットフォーム設定、モック基盤、テストユーティリティ
- M010-M011: 型定義リファクタ（RN Purchases 依存除去）
- M012-M013: スモークテスト

### Phase 1: Web 基盤アーキテクチャ ✅ 完了
- M014-M016: エラーバウンダリ、Web ビルド検証、CORS ユーティリティ
- M017-M020: Webhook 共通ライブラリ、Feature Flag、決済 reconciliation、Web設定
- M021-M029: useResponsive、useNetwork、GlassCard、共通コンポーネント Web 対応

### Phase 2: Web 入力系・通信 ✅ 完了
- M030-M033: MediaPicker、FileDropZone、usePlatformSubscription テスト
- M039-M043: OAuth コールバック、ログイン画面、Auth Web 対応
- M049-M063: Edge Functions CORS、WebSidebar、Deep linking、レスポンシブ

### Phase 3: Web 決済・オンボーディング ✅ 完了
- M064-M076: Stripe Edge Functions、ペイウォール、subscription管理
- M077-M081: Stripe 決済 E2E テスト
- M100-M109: Onboarding 全6画面 Web 対応

### Phase 4: Web チャット・コミュニティ ✅ 完了
- M082-M092: Chat Web UI、通信、hooks、テスト
- M093-M099: Chat Web E2E テスト
- M110-M119: Community Web UI、E2E テスト

### Phase 5: Web ツイン情報・設定 ✅ 完了
- M120-M126: Twin Info Web ダッシュボード
- M127-M136: Settings Web 対応、OpenClaw管理UI
- M137-M139: Analytics Web SDK

### Phase 6: テスト拡充・品質向上 ✅ 完了
- M140-M149: Regression Hardening テスト拡充
- M152-M156: A11y、パフォーマンス、セキュリティ
- テストスイート修正、Codex レビュー

## 変更履歴

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| 2026-02-21 | 初版作成 | Web 版フル実装 SDD |
| 2026-02-21 | Status を Implementation Complete に更新<br>Phase 別実装進捗を追記（P0-P6 全12フェーズ完了） | Reconcile: Web 版フル実装完了の仕様書同期 |
