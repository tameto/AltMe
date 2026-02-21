# Web版フル実装 統合タスク一覧

## Feature ID: 20260221-web-full-impl
## Total Milestone Tasks: 156
## Date: 2026-02-21
## Based on: Codex Review Feedback

---

## Phase 順序（Codex推奨に基づく調整）

```
P0: Foundation (基盤設定) — Agent A
  ↓
P1: Shared Components (共通基盤) — Agent A
  ↓ (並列開始)
P2: Auth Web — Agent A     |  P2b: CORS — Agent C
  ↓                        |    ↓
P3: Web Layout — Agent A   |  P4: Stripe — Agent B
  ↓                        |    ↓
P5: Chat Web — Agent C     |  P6: Onboarding Web — Agent C (並列)
P7: Community — Agent D    |  P8: Twin Info — Agent D (並列)
P9: Settings — Agent D     |  P10: Analytics — Agent A
  ↓
P11: Regression Hardening — 全Agent
P12: A11y + Performance + Security — Agent A
P13: Final Integration + Codex Review — 全Agent
```

---

## P0: Foundation（基盤設定）— Agent A — 20タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M001 | Jest クロスプラットフォーム設定（ios/android/web projects） | M | `npx jest --projects` で3プラットフォーム並列テスト実行可能 |
| M002 | Web テスト用グローバルモック一式 | M | `window.matchMedia`, `navigator.onLine`, `IntersectionObserver`, `ResizeObserver`, `WebSocket`, `sessionStorage`, `URL.createObjectURL`, `visibilityState` が全てモック済み |
| M003 | Native テスト用グローバルモック一式 | M | `expo-network`, `expo-secure-store`, `expo-haptics`, `expo-image-picker`, `react-native-purchases`, `react-native-onesignal` が全てモック済み |
| M004 | 共通テストモック（Supabase, Zustand, Router） | M | Supabase クライアント, Zustand ストアリセットヘルパー, Expo Router モックが使用可能 |
| M005 | MSW (Mock Service Worker) セットアップ + ハンドラー | L | Supabase Auth/DB/Edge Functions + OpenClaw WebSocket のMSWハンドラーが全て動作 |
| M006 | Playwright E2E テスト基盤 | M | Playwright セットアップ + ログイン/ナビゲーション テストヘルパー + CI連携 |
| M007 | @testing-library/react-native + renderWithProviders ヘルパー | S | `renderWithProviders()` で全Provider(Auth, Theme, Navigation)ラップ済みレンダリング可能 |
| M008 | テストカバレッジレポート設定（istanbul） | S | `--coverage` でHTML/テキストレポート生成、閾値80%設定 |
| M009 | CI/CD パイプライン: Web テスト + ビルド自動実行 | M | GitHub Actions で `tsc`, `jest --projects`, `expo export:web` が自動実行 |
| M010 | 型定義: Web/Native 共通インターフェース一式 | M | `ResponsiveInfo`, `PlatformSubscription`, `NetworkState`, `MediaPickerResult`, `FileDropEvent`, `StripeCheckoutSession`, `StripePortalSession`, `WebKeyboardShortcut` が `src/shared/types/` に定義済み |
| M011 | subscription.ts 型リファクタ（react-native-purchases 依存除去） | M | `PurchasesOfferings`, `PurchasesPackage` を独自型に置換、Web バンドルから除外確認 |
| M012 | スモークテスト: 全ルートの基本レンダリング確認（Web） | M | 全 `app/` 画面が Web プリセットでクラッシュせずレンダリング |
| M013 | スモークテスト: 全ルートの基本レンダリング確認（Native） | M | 全 `app/` 画面が iOS/Android プリセットでクラッシュせずレンダリング |
| M014 | エラーバウンダリ: Web 用グローバルエラーバウンダリ | M | 未キャッチエラーでクラッシュ画面表示 + エラーレポート（console.error / 将来的にSentry） |
| M015 | Web ビルド検証: `expo export:web` が成功 | S | 現時点のコードベースで Web 静的出力が正常に生成される |
| M016 | 共通 CORS ユーティリティ作成 | S | `corsHeaders()` ヘルパーで許可オリジン設定、全Edge Functionで共用可能 |
| M017 | Webhook 共通内部ライブラリ | M | 冪等性チェック、イベントログ、エラー報告、サブスク状態変換を共通化 |
| M018 | Feature Flag ユーティリティ | S | `Platform.OS` + 環境変数でプラットフォーム別機能フラグ管理 |
| M019 | 決済ステータス reconciliation ジョブ設計 | S | Web checkout 失敗時の同期パス設計（Edge Function cron or manual trigger） |
| M020 | Entitlement リフレッシュ（Web用ポーリング） | M | Web でサブスク状態を定期ポーリング（30秒間隔）で更新、Webhook 遅延をカバー |

---

## P1: Shared Components（共通基盤実装）— Agent A — 18タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M021 | useResponsive hook 実装 + テスト | M | 4ブレークポイント（mobile/tablet/desktop/wide）検出、リサイズ対応、SSR安全、Native=常にmobile。テスト6件以上 |
| M022 | useNetwork hook プラットフォーム分離 | M | `.web.ts`: `navigator.onLine` + events、`.native.ts`: `expo-network`、共通インターフェース。テスト9件以上 |
| M023 | GlassCard プラットフォーム分離（Web: CSS backdrop-filter / Native: BlurView） | L | 4 variant（default/ai-bubble/user-bubble/input）が両プラットフォームで正常表示。`.web.tsx` は CSS backdrop-filter、`.native.tsx` は expo-blur。テスト12件以上 |
| M024 | CosmicBackground Web 対応 | S | Web で ImageBackground + オーバーレイが正常表示、フォールバック背景色動作。テスト3件以上 |
| M025 | GoldButton Web 対応 | S | Web で LinearGradient + クリックハンドラー動作、disabled/loading 状態対応。テスト4件以上 |
| M026 | ResponsiveContainer コンポーネント | M | mobile: 100%幅、desktop: max 960px centered、wide: max 1200px。SafeAreaView 内包（Native）。テスト4件以上 |
| M027 | GuestPromptOverlay レスポンシブ対応 | S | Web レイアウト + Platform.OS === 'web' 分岐。テスト2件以上 |
| M028 | usePageTitle hook（Web: document.title / Native: no-op） | S | Web で画面タイトルが反映される。テスト1件以上 |
| M029 | Head コンポーネント（favicon / theme-color） | S | Web で `<head>` メタタグが設定される |
| M030 | MediaPicker プラットフォーム分離 | L | `.web.tsx`: `<input type="file">`、`.native.tsx`: `expo-image-picker`。ファイルタイプフィルター、サイズバリデーション。テスト8件以上 |
| M031 | FileDropZone（Web 固有） | M | dragover/dragleave/drop イベント、ハイライト、複数ファイル（最大5件）、非対応ファイル拒否。テスト6件以上 |
| M032 | useClipboardPaste hook（Web: Ctrl+V 画像ペースト） | S | Ctrl+V で画像検出、テキスト無視、プレビュー生成。テスト3件以上 |
| M033 | useKeyboardShortcuts hook（Web 固有） | M | Enter送信/Shift+Enter改行/Escape閉じる。IME確定中の送信防止。テスト4件以上 |
| M034 | usePlatformSubscription hook プラットフォーム分離 | L | `.web.ts`: Supabase DB 参照 + Stripe redirect、`.native.ts`: RevenueCat SDK。共通インターフェース（isPro/planType/expiresAt/isTrialing/purchase/restore）。テスト12件以上 |
| M035 | 既存 use-subscription.ts を usePlatformSubscription に統合 | M | 既存の useSubscription() 呼び出し箇所を全て更新、iOS/Android 動作確認 |
| M036 | Web 用ネットワークリトライ + オフラインUX | M | `navigator.onLine` + `fetch` 失敗検出、オフラインバナー表示、再接続時自動リトライ |
| M037 | reduced-motion 対応ユーティリティ | S | `prefers-reduced-motion` メディアクエリ検出、アニメーション無効化フラグ |
| M038 | スナップショットテスト: 全共通コンポーネント（Web + Native） | M | GlassCard/CosmicBackground/GoldButton/ResponsiveContainer のスナップショット |

---

## P2: Auth Web 対応 — Agent A — 10タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M039 | OAuth コールバックルート（app/auth/callback.tsx） | M | リダイレクト後にセッション確立、オンボーディング判定、エラーパラメータ処理。テスト5件以上 |
| M040 | ログイン画面 Web 対応 | M | Google/Apple OAuth redirect、ゲストモード、devLogin、レスポンシブレイアウト（desktop/mobile）。テスト8件以上 |
| M041 | auth-store Web 対応 | M | signInWithOAuth/signOut/sessionStorage/onAuthStateChange/enterGuestMode。テスト5件以上 |
| M042 | Supabase Auth Web テスト拡充 | M | `auth.web.ts` の signInWithOAuth(Google/Apple)、`auth-shared.ts` の signOut/getProfile/updateProfile。テスト7件以上 |
| M043 | Supabase Client Web テスト拡充 | M | `client.web.ts` の createClient/sessionStorage/visibilitychange。テスト3件以上 |
| M044 | E2E: Web Google ログイン → メインタブ遷移 | M | Playwright で OAuth フロー（モック）→ メインタブ表示確認 |
| M045 | E2E: Web ゲストモード → コミュニティ閲覧 | M | ゲストモード開始 → コミュニティ一覧表示確認 |
| M046 | E2E: Web devLogin → メインタブ遷移 | S | devLogin → メインタブ表示確認 |
| M047 | E2E: Web ログアウト → ログイン画面遷移 | S | ログアウト → sessionStorage クリア → ログイン画面 |
| M048 | 認証セキュリティテスト（Web固有） | M | セッション固定攻撃対策、Open Redirect防止、CSP ヘッダー確認 |

---

## P2b: Edge Functions CORS 対応 — Agent C — 5タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M049 | chat Edge Function CORS 対応 | S | OPTIONS preflight + CORS headers。テスト2件 |
| M050 | personality-analyze Edge Function CORS 対応 | S | OPTIONS preflight + CORS headers。テスト1件 |
| M051 | journal-reflect Edge Function CORS 対応 | S | OPTIONS preflight + CORS headers。テスト1件 |
| M052 | fetch-ogp Edge Function CORS 対応 | S | OPTIONS preflight + CORS headers。テスト1件 |
| M053 | translate-message Edge Function CORS 対応 | S | OPTIONS preflight + CORS headers。テスト1件 |

---

## P3: Web Layout（サイドバー + レスポンシブ）— Agent A — 10タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M054 | WebSidebar コンポーネント | L | 4ナビアイテム、アクティブハイライト、ルート遷移、アイコン+ラベル、ユーザーアバター、Pro/Freeバッジ、未読バッジ、tablet collapse。`usePathname()` でアクティブ状態管理。テスト10件以上 |
| M055 | _layout.web.tsx（tabs サイドバーレイアウト） | L | headless tabs + サイドバー + コンテンツエリア、レスポンシブ切替（desktop→サイドバー、mobile→ボトムタブ）、ルートパス同期。テスト4件以上 |
| M056 | 既存 _layout.tsx の iOS/Android リグレッション確認 | M | ボトムタブ4タブが正常動作、アイコン/バッジ表示 |
| M057 | Root _layout.tsx Web 互換性確認・修正 | M | SplashScreen/StatusBar/OneSignal が Web で無害、認証ガード動作。テスト4件以上 |
| M058 | 各画面に usePageTitle 適用 | S | Chat/Community/Twin/Settings の4画面で document.title が設定される |
| M059 | Deep linking テスト（Web直接URL入力） | M | `/`, `/community`, `/twin`, `/settings` + `/community/[id]` が直接アクセスで正常表示 |
| M060 | ブラウザバック/フォワード テスト | S | 戻る/進むボタンで正しい画面に遷移 |
| M061 | 404 ページ Web 対応 | S | 存在しないURLで `+not-found.tsx` が表示される |
| M062 | モーダル画面の Web 対応（Stack presentation） | M | subscription-manage, token-purchase, mbti-select, notification-settings, account-delete-confirm がWebでモーダル風に表示 |
| M063 | Web レスポンシブ統合テスト | M | desktop/tablet/mobile の3サイズでレイアウト切替が正常 |

---

## P4: Stripe 課金 — Agent B — 18タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M064 | create-checkout-session Edge Function | L | 月額/年額セッション作成、認証チェック、不正priceId拒否、既存Customer再利用、success/cancel URL設定。テスト7件以上 |
| M065 | create-portal-session Edge Function | M | ポータルセッション作成、認証チェック、Customer未存在エラー。テスト3件以上 |
| M066 | webhook-stripe Edge Function | L | checkout.session.completed/invoice.paid/invoice.payment_failed/subscription.deleted/subscription.updated、署名検証、冪等性、RevenueCat同期、provision/destroy トリガー。テスト10件以上 |
| M067 | Stripe クライアント（src/services/stripe/client.ts） | M | checkout/portal セッション作成API呼び出し、リダイレクト実行、エラーハンドリング。テスト4件以上 |
| M068 | ペイウォール Web 版 | L | Stripe価格表示（月額/年額）、初回限定非表示、購入→Stripe Checkout リダイレクト、レスポンシブ。Native はRevenueCat維持。テスト6件以上 |
| M069 | payment/success ページ | M | 成功メッセージ、サブスク状態更新確認、メインタブリダイレクト。テスト3件以上 |
| M070 | payment/cancel ページ | S | キャンセルメッセージ、ペイウォール再遷移。テスト2件以上 |
| M071 | subscription-manage Web 対応 | M | Stripe Portal リンク（Web）/ App Store・Play Store リンク（Native）。テスト4件以上 |
| M072 | token-purchase Web 対応 | M | Stripe決済パッケージ表示（Web）/ RevenueCat Consumable（Native）。テスト3件以上 |
| M073 | Webhook共通ライブラリ統合（webhook-revenuecat更新） | M | 冪等性チェック/エラー報告/サブスク変換の共通化。テスト3件以上 |
| M074 | RevenueCat + Stripe Provider 同期確認 | M | Stripe 決済後に RevenueCat の `pro` Entitlement が有効化。テスト2件以上 |
| M075 | 決済ステータス reconciliation Edge Function | M | Checkout セッション期限切れ検出、未完了セッション処理。テスト2件以上 |
| M076 | Entitlement リフレッシュ（Web ポーリング） | M | 30秒間隔でサブスク状態確認、Webhook遅延カバー。テスト2件以上 |
| M077 | E2E: Web Stripe Checkout → 月額購入 → Pro 有効化 | L | Playwright + Stripe テストモードで決済フロー完走 |
| M078 | E2E: Web Stripe Checkout → 年額購入 → Pro 有効化 | L | 同上（年額） |
| M079 | E2E: Web Stripe Portal → サブスク管理 | M | Portal リダイレクト + 操作確認 |
| M080 | E2E: Web 決済キャンセル → Free のまま | M | Checkout 離脱 → 状態不変確認 |
| M081 | E2E: Stripe Webhook → DB更新 + プロビジョニングトリガー | M | Webhook送信 → subscriptions + openclaw_instances 更新確認 |

---

## P5: Chat Web 対応 — Agent C — 18タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M082 | チャット入力 Web 対応（Enter送信 + Shift+Enter改行 + IME） | M | Enter=送信、Shift+Enter=改行、IME確定中は送信しない、文字数カウンター。テスト6件以上 |
| M083 | チャット画面 Web レスポンシブレイアウト | L | desktop: 最大幅960px centered + サイドバー、mobile: フルスクリーン。ヘッダー/トピックタブ/メッセージリスト/入力バー。テスト6件以上 |
| M084 | メッセージリスト Web 仮想化 + スクロール | M | FlatList/FlashList のWeb動作確認、スクロール位置維持、最新メッセージFAB。テスト3件以上 |
| M085 | ChatBubble Web 対応（マークダウン + メディア + OGP + 翻訳） | L | マークダウンレンダリング、コードブロックコピー、右クリックメニュー、テキスト選択、リンク→新タブ、画像/動画/音声表示、OGPカード、翻訳折りたたみ、日記バッジ、XSSサニタイズ。テスト12件以上 |
| M086 | WebSocket Web 動作確認 + 修正 | M | ブラウザWebSocket接続/ハンドシェイク/デルタ受信/完了受信/エラー/再接続/フォールバック/visibilitychange/beforeunload。テスト10件以上 |
| M087 | SSE (Free チャット) Web 動作確認 | M | fetch + ReadableStream でSSEパーシング、トークン使用量。テスト3件以上 |
| M088 | ファイルアップロード Web 対応（MediaPicker + FileDropZone 統合） | M | ファイル選択/D&D/クリップボードペースト → Supabase Storage アップロード → プレビュー。テスト5件以上 |
| M089 | チャット接続状態表示 Web 対応 | S | WebSocket接続インジケータ、接続中/接続済み/切断/再接続中の表示 |
| M090 | チャット トピックタブ Web 対応 | S | 4トピックタブ（日常/仕事/振り返り/相談）表示、切替、メッセージフィルタ |
| M091 | 日記統合 Web 対応 | M | 振り返りプロンプト、ジャーナルエントリ保存、AI振り返り生成、📝バッジ。テスト4件以上 |
| M092 | useChat hook Web テスト拡充 | L | Free SSE/Pro WebSocket/ストリーミング/履歴/ページネーション/トピック/メッセージ長/画像添付/マークダウン/既読/翻訳/OGP/日記/トークン上限/接続モード。テスト17件以上 |
| M093 | E2E: Web Free チャット（SSE ストリーミング） | L | ログイン → Free チャット → SSE ストリーミング表示 |
| M094 | E2E: Web Pro チャット（WebSocket ストリーミング） | L | Pro ログイン → WebSocket 接続 → ストリーミング表示 |
| M095 | E2E: Web チャット — ファイルアップロード | M | ファイル選択 → プレビュー → 送信 → 表示確認 |
| M096 | E2E: Web チャット — ドラッグ&ドロップ | M | D&D → プレビュー → 送信 → 表示確認 |
| M097 | E2E: Web チャット — メッセージ履歴 + ページネーション | M | 初回50件 → 上スクロール → 追加50件 |
| M098 | E2E: Web チャット — トピックタブ切替 | M | タブ切替 → フィルタ表示確認 |
| M099 | E2E: Web チャット — マークダウンレンダリング | M | マークダウン入力 → 送信 → レンダリング確認 |

---

## P6: Onboarding Web 対応 — Agent C — 10タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M100 | Welcome 画面 Web 対応 | S | レスポンシブ + CosmicBackground + GoldButton。テスト3件以上 |
| M101 | Personality Quiz 画面 Web 対応 | M | カード選択UI、プログレスバー、キーボードナビ、レスポンシブ（横並びカード）。テスト4件以上 |
| M102 | Choose Avatar 画面 Web 対応 | S | 画像グリッド、クリック選択、レスポンシブ。テスト3件以上 |
| M103 | Choose Tone 画面 Web 対応 | S | 口調カード、クリック選択、レスポンシブ。テスト3件以上 |
| M104 | Result 画面 Web 対応 | S | パーソナリティ結果表示、reduced-motion対応、レスポンシブ。テスト3件以上 |
| M105 | Meet Twin 画面 Web 対応 | M | チャットUI、Enter送信、KeyboardAvoidingView不要確認、レスポンシブ。テスト4件以上 |
| M106 | Onboarding Store Web テスト | S | persist(localStorage)、全ステップ完了フロー、リセット。テスト3件以上 |
| M107 | Onboarding _layout.tsx Web 互換性確認 | S | Stack ナビゲーションが Web で正常動作 |
| M108 | E2E: Web 全6画面オンボーディングフロー | L | Playwright で welcome → quiz → avatar → tone → result → meet-twin 完走 |
| M109 | E2E: Web オンボーディング途中離脱 → 再開 | M | 途中離脱 → 再アクセス → 続きから再開確認 |

---

## P7: Community Web 対応 — Agent D — 10タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M110 | コミュニティ一覧 Web レスポンシブ | M | desktop: 3列グリッド、tablet: 2列、mobile: 1列。ホバーエフェクト、ゲストモード、Pro/Free分岐。テスト6件以上 |
| M111 | CommunityCard Web 対応 | S | GlassCard レイアウト、クリック、サムネイル、ブラー表示（Free）。テスト4件以上 |
| M112 | コミュニティ詳細 Web レスポンシブ | M | レスポンシブ、メッセージ一覧、参加ボタン、ゲスト閲覧。テスト4件以上 |
| M113 | コミュニティ作成 Web 対応 | M | フォーム、バリデーション、画像アップロード（MediaPicker）。テスト3件以上 |
| M114 | Community hooks Web テスト | M | useCommunities/useCommunityDetail/useCommunityMembership。テスト6件以上 |
| M115 | Community service Web テスト | M | getCommunities/getById/join/leave/create/getMessages。テスト6件以上 |
| M116 | E2E: Web コミュニティ一覧閲覧 | M | ログイン → コミュニティ一覧 → カード表示確認 |
| M117 | E2E: Web コミュニティ詳細閲覧 | M | カードクリック → 詳細ページ → メッセージ表示 |
| M118 | E2E: Web コミュニティ作成（Pro） | M | 作成フォーム → 送信 → 一覧に反映 |
| M119 | E2E: Web ゲストコミュニティブラウズ | M | ゲスト → 一覧閲覧 → 詳細閲覧 → 操作不可確認 |

---

## P8: Twin Info Web 対応 — Agent D — 7タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M120 | ツイン情報画面 Web ダッシュボードレイアウト | L | desktop: カードグリッドダッシュボード、mobile: 縦スクロール。パーソナリティ/気分チャート/OpenClawステータス/ゲストモード。テスト7件以上 |
| M121 | Twin hooks Web テスト | M | useTwinData — OpenClawステータス/パーソナリティ/テスト3件以上 |
| M122 | MBTI選択モーダル Web 対応 | S | Web モーダル、カード選択、Escapeクローズ。テスト3件以上 |
| M123 | 会話詳細画面 Web 対応 | S | レスポンシブ、スクロール。テスト2件以上 |
| M124 | E2E: Web ツイン情報ダッシュボード表示 | M | ログイン → ツインタブ → ダッシュボード表示確認 |
| M125 | E2E: Web MBTI 選択 | S | MBTI選択 → 保存 → 反映確認 |
| M126 | Insights テスト拡充（既存 + Web） | M | twin-screen.test.tsx + use-twin-data.test.ts のWeb プリセット追加 |

---

## P9: Settings Web 対応 — Agent D — 10タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M127 | 設定画面 Web 対応 | L | レスポンシブ、プロフィール、サブスク状態、Stripe Portal リンク（Web）、ログアウト、ゲストモード、通知設定非表示、アカウント削除、法的リンク、バージョン。テスト10件以上 |
| M128 | アカウント削除確認 Web 対応 | M | モーダル、確認テキスト入力、削除実行、Escape。テスト4件以上 |
| M129 | 通知設定 Web 対応 | S | Web: Linking.openSettings非表示、Push将来対応メッセージ。テスト2件以上 |
| M130 | Settings テスト拡充 | M | プロフィール/サブスク/ログアウト/削除/ゲスト。テスト5件以上 |
| M131 | E2E: Web 設定画面表示 | M | ログイン → 設定タブ → 全セクション表示確認 |
| M132 | E2E: Web ログアウト | S | ログアウト → ログイン画面遷移確認 |
| M133 | E2E: Web アカウント削除フロー | M | 確認入力 → 削除 → ログイン画面遷移確認 |
| M134 | E2E: Web サブスク管理 Stripe Portal リンク | M | リンククリック → Portal リダイレクト確認 |
| M135 | OpenClaw サービステスト拡充 | M | client/websocket-client/connection-manager のテスト9件以上 |
| M136 | OpenClaw インスタンス管理UI Web 対応 | M | ステータス表示/再起動/SOUL.md更新 のWeb表示 |

---

## P10: Analytics Web 対応 — Agent A — 3タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M137 | PostHog Web SDK 統合（tracker.web.ts） | M | initializeAnalytics/trackEvent/identifyUser/resetUser/trackScreen。テスト5件以上 |
| M138 | Analytics 統合テスト（全プラットフォーム） | S | Web: PostHog JS、Native: posthog-react-native。re-export動作確認 |
| M139 | RevenueCat + Notifications サービステスト拡充 | M | Web no-op確認 + Native 動作確認。テスト10件以上 |

---

## P11: Regression Hardening — 全Agent — 12タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M140 | Auth Store 完全テスト（全プラットフォーム） | M | signIn/signOut/devLogin/guestMode/sessionRestore/errorHandling。テスト7件以上 |
| M141 | Chat hooks 完全テスト（全プラットフォーム） | L | Free SSE/Pro WS/streaming/history/pagination/topic/messageLen/media/markdown/read/translate/ogp/journal/tokenLimit/connectionMode。テスト17件以上 |
| M142 | Onboarding Store 完全テスト | S | 回答保存/アバター/トーン/完了判定/リセット。テスト5件以上 |
| M143 | Subscription hooks 完全テスト（全プラットフォーム） | M | isPro/isTrialing/planType/expiresAt。テスト5件以上 |
| M144 | Community hooks + service 完全テスト | M | 一覧/詳細/参加退出/メッセージ。テスト9件以上 |
| M145 | Supabase サービス完全テスト（Web + Native） | M | client.web/client.native/auth.web/auth.native/auth-shared。テスト12件以上 |
| M146 | RevenueCat サービステスト（Web no-op + Native） | M | 全関数テスト。テスト7件以上 |
| M147 | Notifications サービステスト | S | Web no-op + Native initialize/requestPermission/setExternalUserId。テスト4件以上 |
| M148 | フレイキーテスト修正 | M | 全テスト2回パスを確認、タイマー依存テストの安定化 |
| M149 | テストカバレッジ80%達成 | M | 各feature/service/hook で行カバレッジ80%以上 |
| M150 | iOS ビルドリグレッション | M | `tsc --noEmit && expo run:ios` 成功 |
| M151 | Android ビルドリグレッション | M | `tsc --noEmit && expo run:android` 成功 |

---

## P12: A11y + Performance + Security — Agent A — 5タスク

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M152 | アクセシビリティ対応 | L | aria-label/キーボードナビ/フォーカスインジケータ/ライブリージョン/カラーコントラスト/reduced-motion。Lighthouse A11y >= 90 |
| M153 | パフォーマンス最適化 | L | バンドルサイズ < 500KB gzip、LCP < 3s、FID < 100ms、CLS < 0.1、不要native依存除外、コード分割、画像WebP、フォントサブセット |
| M154 | セキュリティ対応 | L | XSSサニタイズ/CSRF/CSP/APIキー非露出/Stripe署名検証/CORS/セッション固定/OpenRedirect防止 |
| M155 | メモリリーク検出・修正 | M | Web DevTools で WebSocket/イベントリスナー/タイマーのリーク確認・修正 |
| M156 | セキュリティヘッダー設定 | S | Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security |

---

## P13: Final Integration + Codex Review — 全Agent — 5タスク（M156超過分は加算せず P12に含む）

| ID | タスク | サイズ | 受け入れ条件 |
|----|-------|--------|------------|
| M157 | 統合E2E: 認証 → オンボーディング → チャット | L | Web で新規ユーザーフロー完走 |
| M158 | 統合E2E: 認証 → ペイウォール → Stripe決済 → Pro有効化 | L | Web で課金フロー完走 |
| M159 | 統合E2E: Pro チャット → WebSocket → ストリーミング | L | Web で Pro チャット完走 |
| M160 | Codex レビュー: クロスプラットフォームアーキテクチャ + セキュリティ | L | Codex による包括レビュー + 指摘事項修正 |
| M161 | ドキュメント更新 + PR作成 | M | CLAUDE.md Web セクション、specs/overview.md 更新、PR作成 |

---

## サマリー

| Phase | マイルストーンタスク数 | 担当Agent |
|-------|---------------------|-----------|
| P0: Foundation | 20 | Agent A |
| P1: Shared Components | 18 | Agent A |
| P2: Auth Web | 10 | Agent A |
| P2b: CORS | 5 | Agent C |
| P3: Web Layout | 10 | Agent A |
| P4: Stripe 課金 | 18 | Agent B |
| P5: Chat Web | 18 | Agent C |
| P6: Onboarding Web | 10 | Agent C |
| P7: Community Web | 10 | Agent D |
| P8: Twin Info Web | 7 | Agent D |
| P9: Settings Web | 10 | Agent D |
| P10: Analytics Web | 3 | Agent A |
| P11: Regression | 12 | 全Agent |
| P12: A11y/Perf/Security | 5 | Agent A |
| P13: Integration/Review | 5 | 全Agent |
| **合計** | **161** | |

### Agent別担当数
| Agent | マイルストーン数 | サブタスク推定数 |
|-------|---------------|---------------|
| Agent A (Foundation) | ~70 | ~220 |
| Agent B (Subscription) | ~18 | ~70 |
| Agent C (Core AI) | ~33 | ~125 |
| Agent D (Engagement) | ~27 | ~75 |
| 全Agent共有 | ~13 | ~48 |
