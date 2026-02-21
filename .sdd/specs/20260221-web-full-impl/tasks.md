# Web版フル実装 タスク一覧

## Feature ID: 20260221-web-full-impl
## Total Tasks: 520+
## Date: 2026-02-21

---

## Phase 0: 基盤設定（ブロッカーなし）— Agent A

### P0-A: プロジェクト設定・テスト基盤

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T001 | Jest クロスプラットフォーム設定（projects: ios/android/web） | S | - | - |
| T002 | jest.setup.web.js 作成（Web 固有のグローバルモック） | S | - | T001 |
| T003 | Web テスト用モック: `window.matchMedia` | S | - | T002 |
| T004 | Web テスト用モック: `navigator.onLine` | S | - | T002 |
| T005 | Web テスト用モック: `IntersectionObserver` | S | - | T002 |
| T006 | Web テスト用モック: `ResizeObserver` | S | - | T002 |
| T007 | Web テスト用モック: `WebSocket` | S | - | T002 |
| T008 | Web テスト用モック: `sessionStorage` / `localStorage` | S | - | T002 |
| T009 | Web テスト用モック: `URL.createObjectURL` / `revokeObjectURL` | S | - | T002 |
| T010 | Web テスト用モック: `document.visibilityState` / `visibilitychange` | S | - | T002 |
| T011 | Native テスト用モック: `expo-network` | S | - | T001 |
| T012 | Native テスト用モック: `expo-secure-store` | S | - | T001 |
| T013 | Native テスト用モック: `expo-haptics` | S | - | T001 |
| T014 | Native テスト用モック: `expo-image-picker` | S | - | T001 |
| T015 | Native テスト用モック: `react-native-purchases` | S | - | T001 |
| T016 | Native テスト用モック: `react-native-onesignal` | S | - | T001 |
| T017 | 共通テスト用モック: Supabase クライアント | S | - | T001 |
| T018 | 共通テスト用モック: Zustand ストアリセットヘルパー | S | - | T001 |
| T019 | 共通テスト用モック: React Navigation / Expo Router | S | - | T001 |
| T020 | MSW (Mock Service Worker) セットアップ | M | - | T001 |
| T021 | MSW ハンドラー: Supabase Auth API | S | - | T020 |
| T022 | MSW ハンドラー: Supabase Database API | S | - | T020 |
| T023 | MSW ハンドラー: Supabase Edge Functions | S | - | T020 |
| T024 | MSW ハンドラー: OpenClaw WebSocket | S | - | T020 |
| T025 | Playwright セットアップ（E2E テスト基盤） | M | - | - |
| T026 | Playwright: テストヘルパー（ログイン、ナビゲーション） | S | - | T025 |
| T027 | テストカバレッジレポート設定（istanbul） | S | - | T001 |
| T028 | CI/CD パイプライン: テスト自動実行（GitHub Actions） | M | - | T001 |
| T029 | `@testing-library/react-native` セットアップ | S | - | T001 |
| T030 | テストユーティリティ: `renderWithProviders()` ヘルパー | S | - | T029 |

### P0-B: 型定義・共通インターフェース

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T031 | 型定義: `ResponsiveInfo` インターフェース | S | RED | - |
| T032 | 型定義: `PlatformSubscription` インターフェース（Web/Native 共通） | S | RED | - |
| T033 | 型定義: `NetworkState` インターフェース（Web/Native 共通） | S | RED | - |
| T034 | 型定義: `MediaPickerResult` インターフェース（Web/Native 共通） | S | RED | - |
| T035 | 型定義: `FileDropEvent` インターフェース（Web 固有） | S | RED | - |
| T036 | 型定義: `StripeCheckoutSession` インターフェース | S | RED | - |
| T037 | 型定義: `StripePortalSession` インターフェース | S | RED | - |
| T038 | 型定義: `WebKeyboardShortcut` インターフェース | S | RED | - |
| T039 | 型定義: `BrowserInfo` インターフェース | S | RED | - |
| T040 | `subscription.ts` 型リファクタ: `react-native-purchases` 型 import を独自型に置換 | M | RED→GREEN | - |

---

## Phase 1: 共通基盤実装 — Agent A

### P1-A: useResponsive hook

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T041 | テスト: `useResponsive` — mobile breakpoint (< 768px) | S | RED | T031 |
| T042 | テスト: `useResponsive` — tablet breakpoint (768-1023px) | S | RED | T031 |
| T043 | テスト: `useResponsive` — desktop breakpoint (1024-1439px) | S | RED | T031 |
| T044 | テスト: `useResponsive` — wide breakpoint (>= 1440px) | S | RED | T031 |
| T045 | テスト: `useResponsive` — リサイズ時の更新 | S | RED | T031 |
| T046 | テスト: `useResponsive` — SSR 安全（初期値） | S | RED | T031 |
| T047 | 実装: `useResponsive` hook 本体 | M | GREEN | T041-T046 |
| T048 | テスト: `useResponsive` — Native では常に mobile | S | RED | T047 |
| T049 | リファクタ: `useResponsive` — debounce 最適化 | S | REFACTOR | T047 |

### P1-B: useNetwork hook（プラットフォーム分離）

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T050 | テスト: `useNetwork.web` — navigator.onLine true | S | RED | T033, T004 |
| T051 | テスト: `useNetwork.web` — navigator.onLine false | S | RED | T033, T004 |
| T052 | テスト: `useNetwork.web` — online イベントで状態更新 | S | RED | T033, T004 |
| T053 | テスト: `useNetwork.web` — offline イベントで状態更新 | S | RED | T033, T004 |
| T054 | テスト: `useNetwork.web` — cleanup（イベントリスナー除去） | S | RED | T033, T004 |
| T055 | 実装: `use-network.web.ts` | M | GREEN | T050-T054 |
| T056 | テスト: `useNetwork.native` — expo-network connected | S | RED | T033, T011 |
| T057 | テスト: `useNetwork.native` — expo-network disconnected | S | RED | T033, T011 |
| T058 | テスト: `useNetwork.native` — listener 状態変更 | S | RED | T033, T011 |
| T059 | 実装: `use-network.native.ts` | M | GREEN | T056-T058 |
| T060 | 既存 `use-network.ts` を re-export に変更 | S | GREEN | T055, T059 |
| T061 | 統合テスト: `useNetwork` が全プラットフォームで動作 | S | GREEN | T060 |

### P1-C: GlassCard コンポーネント（プラットフォーム分離）

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T062 | テスト: `GlassCard.web` — default variant レンダリング | S | RED | - |
| T063 | テスト: `GlassCard.web` — ai-bubble variant | S | RED | - |
| T064 | テスト: `GlassCard.web` — user-bubble variant | S | RED | - |
| T065 | テスト: `GlassCard.web` — input variant | S | RED | - |
| T066 | テスト: `GlassCard.web` — backdrop-filter CSS 適用確認 | S | RED | - |
| T067 | テスト: `GlassCard.web` — backdrop-filter 非対応ブラウザフォールバック | S | RED | - |
| T068 | 実装: `glass-card.web.tsx` (CSS backdrop-filter) | M | GREEN | T062-T067 |
| T069 | テスト: `GlassCard.native` — BlurView レンダリング | S | RED | - |
| T070 | テスト: `GlassCard.native` — experimentalBlurMethod Android ガード | S | RED | - |
| T071 | 実装: `glass-card.native.tsx` (expo-blur BlurView) | M | GREEN | T069-T070 |
| T072 | 既存 `glass-card.tsx` を re-export に変更 | S | GREEN | T068, T071 |
| T073 | スナップショットテスト: `GlassCard` 各 variant（Web） | S | GREEN | T072 |
| T074 | スナップショットテスト: `GlassCard` 各 variant（Native） | S | GREEN | T072 |

### P1-D: CosmicBackground Web 対応

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T075 | テスト: `CosmicBackground` — Web で ImageBackground レンダリング | S | RED | - |
| T076 | テスト: `CosmicBackground` — Web でオーバーレイカラー適用 | S | RED | - |
| T077 | テスト: `CosmicBackground` — フォールバック背景色 | S | RED | - |
| T078 | 実装: `cosmic-background.tsx` Web 対応修正 | S | GREEN | T075-T077 |

### P1-E: GoldButton Web 対応

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T079 | テスト: `GoldButton` — Web で LinearGradient レンダリング | S | RED | - |
| T080 | テスト: `GoldButton` — Web でタッチ/クリックハンドラー動作 | S | RED | - |
| T081 | テスト: `GoldButton` — disabled 状態 | S | RED | - |
| T082 | テスト: `GoldButton` — loading 状態 | S | RED | - |
| T083 | 実装: `gold-button.tsx` Web 対応修正 | S | GREEN | T079-T082 |

### P1-F: ResponsiveContainer コンポーネント

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T084 | テスト: `ResponsiveContainer` — mobile: 100% 幅 | S | RED | T047 |
| T085 | テスト: `ResponsiveContainer` — desktop: 最大 960px centered | S | RED | T047 |
| T086 | テスト: `ResponsiveContainer` — wide: 最大 1200px centered | S | RED | T047 |
| T087 | 実装: `responsive-container.tsx` | M | GREEN | T084-T086 |
| T088 | テスト: `ResponsiveContainer` — SafeAreaView 内包（Native） | S | GREEN | T087 |

### P1-G: GuestPromptOverlay レスポンシブ対応

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T089 | テスト: `GuestPromptOverlay` — Web レイアウト | S | RED | T047 |
| T090 | テスト: `GuestPromptOverlay` — Platform.OS === 'web' 分岐 | S | RED | - |
| T091 | 実装: `guest-prompt-overlay.tsx` Web/レスポンシブ対応 | S | GREEN | T089-T090 |

---

## Phase 2: Web レイアウト・ナビゲーション — Agent A

### P2-A: サイドバーナビゲーション（Web）

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T092 | テスト: `WebSidebar` — 4つのナビアイテム表示 | S | RED | - |
| T093 | テスト: `WebSidebar` — アクティブ状態のハイライト | S | RED | - |
| T094 | テスト: `WebSidebar` — ナビアイテムクリックでルート遷移 | S | RED | - |
| T095 | テスト: `WebSidebar` — アイコン + ラベル表示 | S | RED | - |
| T096 | テスト: `WebSidebar` — ユーザーアバター表示 | S | RED | - |
| T097 | テスト: `WebSidebar` — Pro/Free バッジ表示 | S | RED | - |
| T098 | テスト: `WebSidebar` — collapse/expand（tablet） | S | RED | T047 |
| T099 | 実装: `web-sidebar.web.tsx` | L | GREEN | T092-T098 |
| T100 | テスト: `WebSidebar` — 未読バッジ表示 | S | GREEN | T099 |
| T101 | スナップショットテスト: `WebSidebar` | S | GREEN | T099 |

### P2-B: Web タブレイアウト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T102 | テスト: `_layout.web.tsx` — headless tabs レンダリング | S | RED | T099 |
| T103 | テスト: `_layout.web.tsx` — サイドバー + コンテンツエリア構造 | S | RED | T099 |
| T104 | テスト: `_layout.web.tsx` — レスポンシブ切り替え（mobile → ボトムタブ） | S | RED | T047, T099 |
| T105 | テスト: `_layout.web.tsx` — ルートパス同期 | S | RED | T099 |
| T106 | 実装: `app/(tabs)/_layout.web.tsx` | L | GREEN | T102-T105 |
| T107 | テスト: 既存 `_layout.tsx` が iOS/Android で壊れていない | S | GREEN | T106 |

### P2-C: Root レイアウト Web 対応

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T108 | テスト: `app/_layout.tsx` — Web で SplashScreen が無害 | S | RED | - |
| T109 | テスト: `app/_layout.tsx` — Web で認証ガード動作 | S | RED | - |
| T110 | テスト: `app/_layout.tsx` — Web で OneSignal 初期化が no-op | S | RED | - |
| T111 | テスト: `app/_layout.tsx` — Web で StatusBar が無害 | S | RED | - |
| T112 | 実装: `app/_layout.tsx` Web 互換性修正 | M | GREEN | T108-T111 |

### P2-D: Head / SEO メタタグ

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T113 | テスト: `usePageTitle` hook — タイトル設定 | S | RED | - |
| T114 | 実装: `usePageTitle` hook（Web: document.title、Native: no-op） | S | GREEN | T113 |
| T115 | 各画面に `usePageTitle` 適用（Chat/Community/Twin/Settings） | S | GREEN | T114 |
| T116 | `<Head>` コンポーネントで favicon / theme-color 設定 | S | GREEN | - |

---

## Phase 3: 認証 Web 対応 — Agent A

### P3-A: OAuth コールバック

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T117 | テスト: `auth/callback` — 成功時のリダイレクト先決定 | S | RED | - |
| T118 | テスト: `auth/callback` — オンボーディング未完了 → onboarding | S | RED | - |
| T119 | テスト: `auth/callback` — オンボーディング完了 → tabs | S | RED | - |
| T120 | テスト: `auth/callback` — エラーパラメータ処理 | S | RED | - |
| T121 | テスト: `auth/callback` — ローディング表示 | S | RED | - |
| T122 | 実装: `app/auth/callback.tsx` | M | GREEN | T117-T121 |

### P3-B: ログイン画面 Web 対応

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T123 | テスト: `login.tsx` — Web で Google OAuth ボタン表示 | S | RED | - |
| T124 | テスト: `login.tsx` — Web で Apple OAuth ボタン表示 | S | RED | - |
| T125 | テスト: `login.tsx` — Web で Google OAuth クリック → リダイレクト | S | RED | - |
| T126 | テスト: `login.tsx` — Web で Apple OAuth クリック → リダイレクト | S | RED | - |
| T127 | テスト: `login.tsx` — Web でゲストモード開始 | S | RED | - |
| T128 | テスト: `login.tsx` — Web でdevLogin（__DEV__モード） | S | RED | - |
| T129 | テスト: `login.tsx` — Web レスポンシブレイアウト（desktop） | S | RED | T047 |
| T130 | テスト: `login.tsx` — Web レスポンシブレイアウト（mobile） | S | RED | T047 |
| T131 | 実装: `login.tsx` Web 対応修正 | M | GREEN | T123-T130 |

### P3-C: auth-store Web 対応

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T132 | テスト: `auth-store` — signInWithOAuth (Web) | S | RED | - |
| T133 | テスト: `auth-store` — signOut (Web: sessionStorage クリア) | S | RED | - |
| T134 | テスト: `auth-store` — セッション復元 (Web: sessionStorage) | S | RED | - |
| T135 | テスト: `auth-store` — onAuthStateChange (Web) | S | RED | - |
| T136 | テスト: `auth-store` — enterGuestMode (Web) | S | RED | - |
| T137 | 実装: `auth-store.ts` Web 対応修正 | M | GREEN | T132-T136 |

### P3-D: 認証 E2E テスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T138 | E2E: Web Google ログイン → メインタブ遷移 | M | RED | T025, T131 |
| T139 | E2E: Web ゲストモード → コミュニティ閲覧 | M | RED | T025, T131 |
| T140 | E2E: Web devLogin → メインタブ遷移 | M | RED | T025, T131 |
| T141 | E2E: Web ログアウト → ログイン画面遷移 | M | RED | T025, T131 |

---

## Phase 4: Stripe 課金 — Agent B

### P4-A: Stripe Edge Functions

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T142 | テスト: `create-checkout-session` — 正常系（月額） | S | RED | T036 |
| T143 | テスト: `create-checkout-session` — 正常系（年額） | S | RED | T036 |
| T144 | テスト: `create-checkout-session` — 未認証リクエスト拒否 | S | RED | T036 |
| T145 | テスト: `create-checkout-session` — 不正な priceId | S | RED | T036 |
| T146 | テスト: `create-checkout-session` — 既存 Stripe Customer の再利用 | S | RED | T036 |
| T147 | テスト: `create-checkout-session` — 新規 Stripe Customer 作成 | S | RED | T036 |
| T148 | テスト: `create-checkout-session` — success_url / cancel_url 設定 | S | RED | T036 |
| T149 | 実装: `create-checkout-session` Edge Function | L | GREEN | T142-T148 |
| T150 | テスト: `create-portal-session` — 正常系 | S | RED | T037 |
| T151 | テスト: `create-portal-session` — 未認証リクエスト拒否 | S | RED | T037 |
| T152 | テスト: `create-portal-session` — Stripe Customer 未存在 | S | RED | T037 |
| T153 | 実装: `create-portal-session` Edge Function | M | GREEN | T150-T152 |
| T154 | テスト: `webhook-stripe` — checkout.session.completed | S | RED | - |
| T155 | テスト: `webhook-stripe` — invoice.paid | S | RED | - |
| T156 | テスト: `webhook-stripe` — invoice.payment_failed | S | RED | - |
| T157 | テスト: `webhook-stripe` — customer.subscription.deleted | S | RED | - |
| T158 | テスト: `webhook-stripe` — customer.subscription.updated | S | RED | - |
| T159 | テスト: `webhook-stripe` — Webhook 署名検証 | S | RED | - |
| T160 | テスト: `webhook-stripe` — 冪等性（重複イベント） | S | RED | - |
| T161 | テスト: `webhook-stripe` — RevenueCat 同期（Stripe Provider） | S | RED | - |
| T162 | テスト: `webhook-stripe` — provision-openclaw トリガー | S | RED | - |
| T163 | テスト: `webhook-stripe` — destroy-openclaw トリガー | S | RED | - |
| T164 | 実装: `webhook-stripe` Edge Function | L | GREEN | T154-T163 |

### P4-B: Stripe クライアント

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T165 | テスト: `stripe/client.ts` — checkout セッション作成 API 呼び出し | S | RED | T036 |
| T166 | テスト: `stripe/client.ts` — portal セッション作成 API 呼び出し | S | RED | T037 |
| T167 | テスト: `stripe/client.ts` — リダイレクト実行 | S | RED | - |
| T168 | テスト: `stripe/client.ts` — エラーハンドリング | S | RED | - |
| T169 | 実装: `src/services/stripe/client.ts` | M | GREEN | T165-T168 |

### P4-C: usePlatformSubscription hook

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T170 | テスト: `usePlatformSubscription.web` — isPro 判定（Supabase DB） | S | RED | T032 |
| T171 | テスト: `usePlatformSubscription.web` — purchase → Stripe redirect | S | RED | T032 |
| T172 | テスト: `usePlatformSubscription.web` — restore (no-op on Web) | S | RED | T032 |
| T173 | テスト: `usePlatformSubscription.web` — planType 取得 | S | RED | T032 |
| T174 | テスト: `usePlatformSubscription.web` — expiresAt 取得 | S | RED | T032 |
| T175 | テスト: `usePlatformSubscription.web` — isTrialing 判定 | S | RED | T032 |
| T176 | 実装: `use-platform-subscription.web.ts` | M | GREEN | T170-T175 |
| T177 | テスト: `usePlatformSubscription.native` — RevenueCat Entitlement | S | RED | T032 |
| T178 | テスト: `usePlatformSubscription.native` — purchase → RevenueCat SDK | S | RED | T032 |
| T179 | テスト: `usePlatformSubscription.native` — restore → RevenueCat SDK | S | RED | T032 |
| T180 | 実装: `use-platform-subscription.native.ts` | M | GREEN | T177-T179 |
| T181 | 既存 `use-subscription.ts` を `usePlatformSubscription` に統合 | M | GREEN | T176, T180 |

### P4-D: ペイウォール Web 版

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T182 | テスト: `paywall` — Web で Stripe 価格表示（月額 / 年額） | S | RED | T176 |
| T183 | テスト: `paywall` — Web で初回限定オファー非表示 | S | RED | T176 |
| T184 | テスト: `paywall` — Web で購入ボタン → Stripe Checkout リダイレクト | S | RED | T169, T176 |
| T185 | テスト: `paywall` — Web でレスポンシブレイアウト | S | RED | T047, T176 |
| T186 | テスト: `paywall` — Native で RevenueCat Offering 表示（既存） | S | RED | T180 |
| T187 | テスト: `paywall` — Native で初回限定オファー表示 | S | RED | T180 |
| T188 | 実装: `app/(paywall)/index.tsx` Web/Native 対応 | L | GREEN | T182-T187 |

### P4-E: 決済結果画面

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T189 | テスト: `payment/success` — 成功メッセージ表示 | S | RED | - |
| T190 | テスト: `payment/success` — サブスク状態更新確認 | S | RED | - |
| T191 | テスト: `payment/success` — メインタブへのリダイレクト | S | RED | - |
| T192 | テスト: `payment/cancel` — キャンセルメッセージ表示 | S | RED | - |
| T193 | テスト: `payment/cancel` — ペイウォールへの再遷移 | S | RED | - |
| T194 | 実装: `app/payment/success.tsx` | M | GREEN | T189-T191 |
| T195 | 実装: `app/payment/cancel.tsx` | S | GREEN | T192-T193 |

### P4-F: サブスクリプション管理 Web 版

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T196 | テスト: `subscription-manage` — Web で Stripe Portal リンク表示 | S | RED | T169 |
| T197 | テスト: `subscription-manage` — Web で Portal リンククリック → リダイレクト | S | RED | T169 |
| T198 | テスト: `subscription-manage` — Native で App Store / Play Store リンク | S | RED | - |
| T199 | テスト: `subscription-manage` — プラン情報表示 | S | RED | T181 |
| T200 | 実装: `app/subscription-manage.tsx` Web/Native 対応 | M | GREEN | T196-T199 |

### P4-G: トークン購入 Web 版

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T201 | テスト: `token-purchase` — Web で Stripe 決済パッケージ表示 | S | RED | T169 |
| T202 | テスト: `token-purchase` — Web で購入ボタン → Stripe Checkout | S | RED | T169 |
| T203 | テスト: `token-purchase` — Native で RevenueCat Consumable IAP | S | RED | - |
| T204 | 実装: `app/token-purchase.tsx` Web/Native 対応 | M | GREEN | T201-T203 |

### P4-H: 課金 E2E テスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T205 | E2E: Web Stripe Checkout → 月額購入 → Pro 有効化 | L | RED | T025, T188 |
| T206 | E2E: Web Stripe Checkout → 年額購入 → Pro 有効化 | L | RED | T025, T188 |
| T207 | E2E: Web Stripe Portal → サブスク管理 | M | RED | T025, T200 |
| T208 | E2E: Web 決済キャンセル → Free のまま | M | RED | T025, T188 |
| T209 | E2E: Stripe Webhook → subscriptions 更新確認 | M | RED | T164 |
| T210 | E2E: Stripe Webhook → OpenClaw プロビジョニングトリガー | M | RED | T164 |

---

## Phase 5: チャット Web 対応 — Agent C

### P5-A: チャット入力 Web 対応

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T211 | テスト: チャット入力 — Enter で送信（Web） | S | RED | T038 |
| T212 | テスト: チャット入力 — Shift+Enter で改行（Web） | S | RED | T038 |
| T213 | テスト: チャット入力 — IME 確定中は送信しない | S | RED | - |
| T214 | テスト: チャット入力 — 文字数カウンター表示 | S | RED | - |
| T215 | テスト: チャット入力 — 文字数上限（1000 文字） | S | RED | - |
| T216 | テスト: チャット入力 — 振り返りモード上限（3000 文字） | S | RED | - |
| T217 | テスト: チャット入力 — disabled 状態（トークン上限） | S | RED | - |
| T218 | テスト: チャット入力 — placeholder テキスト | S | RED | - |
| T219 | 実装: `useKeyboardShortcuts.web.ts` hook | M | GREEN | T211-T213 |
| T220 | 実装: チャット入力コンポーネント Web 対応 | M | GREEN | T214-T218 |

### P5-B: メディアピッカー Web 版

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T221 | テスト: `MediaPicker.web` — ファイル選択ダイアログ表示 | S | RED | T034 |
| T222 | テスト: `MediaPicker.web` — 画像フィルター（accept属性） | S | RED | T034 |
| T223 | テスト: `MediaPicker.web` — 動画フィルター | S | RED | T034 |
| T224 | テスト: `MediaPicker.web` — 音声フィルター | S | RED | T034 |
| T225 | テスト: `MediaPicker.web` — ファイルサイズバリデーション | S | RED | T034 |
| T226 | テスト: `MediaPicker.web` — プレビュー生成（URL.createObjectURL） | S | RED | T034, T009 |
| T227 | 実装: `media-picker.web.tsx` | M | GREEN | T221-T226 |
| T228 | テスト: `MediaPicker.native` — ImagePicker 連携 | S | RED | T014, T034 |
| T229 | テスト: `MediaPicker.native` — カメラ / カメラロール選択 | S | RED | T014 |
| T230 | 実装: `media-picker.native.tsx` | M | GREEN | T228-T229 |

### P5-C: ドラッグ&ドロップ（Web 固有）

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T231 | テスト: `FileDropZone` — dragover イベントでハイライト | S | RED | T035 |
| T232 | テスト: `FileDropZone` — dragleave でハイライト解除 | S | RED | T035 |
| T233 | テスト: `FileDropZone` — drop でファイル取得 | S | RED | T035 |
| T234 | テスト: `FileDropZone` — 複数ファイルドロップ（最大5件） | S | RED | T035 |
| T235 | テスト: `FileDropZone` — 非対応ファイル拒否 | S | RED | T035 |
| T236 | テスト: `FileDropZone` — ファイルサイズ超過拒否 | S | RED | T035 |
| T237 | 実装: `file-drop-zone.web.tsx` | M | GREEN | T231-T236 |

### P5-D: クリップボード画像ペースト（Web 固有）

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T238 | テスト: `useClipboardPaste` — Ctrl+V で画像ペースト検出 | S | RED | - |
| T239 | テスト: `useClipboardPaste` — テキストペーストは無視 | S | RED | - |
| T240 | テスト: `useClipboardPaste` — ペースト画像のプレビュー生成 | S | RED | - |
| T241 | 実装: `use-clipboard-paste.web.ts` hook | M | GREEN | T238-T240 |

### P5-E: チャット WebSocket Web 確認

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T242 | テスト: `websocket-client` — ブラウザ WebSocket API で接続 | S | RED | T007 |
| T243 | テスト: `websocket-client` — ハンドシェイク送信 | S | RED | T007 |
| T244 | テスト: `websocket-client` — テキストデルタ受信 | S | RED | T007 |
| T245 | テスト: `websocket-client` — テキスト完了受信 | S | RED | T007 |
| T246 | テスト: `websocket-client` — エラー受信 | S | RED | T007 |
| T247 | テスト: `websocket-client` — 再接続（exponential backoff） | S | RED | T007 |
| T248 | テスト: `websocket-client` — 最大再接続試行（10回） | S | RED | T007 |
| T249 | テスト: `websocket-client` — フォールバックモード切替 | S | RED | T007 |
| T250 | テスト: `websocket-client` — visibilitychange でバックグラウンド処理 | S | RED | T007, T010 |
| T251 | テスト: `websocket-client` — beforeunload 処理 | S | RED | T007 |
| T252 | 実装: `websocket-client.ts` Web 対応修正（visibilitychange/beforeunload） | M | GREEN | T242-T251 |

### P5-F: チャット SSE (Free) Web 確認

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T253 | テスト: `edge-function-chat` — fetch + ReadableStream (Web) | S | RED | - |
| T254 | テスト: `edge-function-chat` — SSE パーシング | S | RED | - |
| T255 | テスト: `edge-function-chat` — トークン使用量レスポンス | S | RED | - |
| T256 | テスト: `edge-function-chat` — CORS 対応 | S | RED | - |
| T257 | 実装: Edge Function `chat` CORS 対応 | S | GREEN | T256 |

### P5-G: チャット画面 Web レイアウト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T258 | テスト: チャット画面 — Web レスポンシブレイアウト（desktop） | S | RED | T047 |
| T259 | テスト: チャット画面 — Web レスポンシブレイアウト（mobile） | S | RED | T047 |
| T260 | テスト: チャット画面 — メッセージリスト仮想化（Web） | S | RED | - |
| T261 | テスト: チャット画面 — Web スクロール動作 | S | RED | - |
| T262 | テスト: チャット画面 — Web ヘッダー（AIツイン名 + 接続状態） | S | RED | - |
| T263 | テスト: チャット画面 — トピックタブ Web 表示 | S | RED | - |
| T264 | 実装: `app/(tabs)/index.tsx` Web レイアウト対応 | L | GREEN | T258-T263, T219, T220, T237, T241 |

### P5-H: メッセージバブル Web 対応

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T265 | テスト: `ChatBubble` — Web でマークダウンレンダリング | S | RED | T072 |
| T266 | テスト: `ChatBubble` — Web でコードブロックコピーボタン | S | RED | - |
| T267 | テスト: `ChatBubble` — Web で右クリックコンテキストメニュー | S | RED | - |
| T268 | テスト: `ChatBubble` — Web でテキスト選択 | S | RED | - |
| T269 | テスト: `ChatBubble` — Web でリンククリック → 新タブ | S | RED | - |
| T270 | テスト: `ChatBubble` — Web で画像サムネイル表示 | S | RED | - |
| T271 | テスト: `ChatBubble` — Web で動画プレビュー | S | RED | - |
| T272 | テスト: `ChatBubble` — Web で音声プレイヤー | S | RED | - |
| T273 | テスト: `ChatBubble` — Web で OGP カード表示 | S | RED | - |
| T274 | テスト: `ChatBubble` — Web で翻訳折りたたみ | S | RED | - |
| T275 | テスト: `ChatBubble` — Web で日記バッジ表示 | S | RED | - |
| T276 | テスト: `ChatBubble` — XSS サニタイズ（Web） | S | RED | - |
| T277 | 実装: `chat-bubble.tsx` Web 対応修正 | L | GREEN | T265-T276 |

### P5-I: チャット E2E テスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T278 | E2E: Web Free チャット（SSE ストリーミング） | L | RED | T025, T264 |
| T279 | E2E: Web Pro チャット（WebSocket ストリーミング） | L | RED | T025, T264 |
| T280 | E2E: Web チャット — Enter 送信 | M | RED | T025, T264 |
| T281 | E2E: Web チャット — ファイルアップロード | M | RED | T025, T264 |
| T282 | E2E: Web チャット — ドラッグ&ドロップ | M | RED | T025, T264 |
| T283 | E2E: Web チャット — メッセージ履歴ページネーション | M | RED | T025, T264 |
| T284 | E2E: Web チャット — トピックタブ切り替え | M | RED | T025, T264 |
| T285 | E2E: Web チャット — マークダウンレンダリング | M | RED | T025, T264 |

---

## Phase 6: オンボーディング Web 対応 — Agent C

### P6-A: Welcome 画面 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T286 | テスト: `welcome.tsx` — Web レスポンシブレイアウト | S | RED | T047 |
| T287 | テスト: `welcome.tsx` — Web で CosmicBackground 表示 | S | RED | T078 |
| T288 | テスト: `welcome.tsx` — Web で GoldButton 動作 | S | RED | T083 |
| T289 | 実装: `welcome.tsx` Web 対応 | S | GREEN | T286-T288 |

### P6-B: Personality Quiz 画面 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T290 | テスト: `personality-quiz.tsx` — Web カード選択 UI | S | RED | - |
| T291 | テスト: `personality-quiz.tsx` — Web プログレスバー | S | RED | - |
| T292 | テスト: `personality-quiz.tsx` — Web キーボードナビゲーション | S | RED | - |
| T293 | テスト: `personality-quiz.tsx` — Web レスポンシブ（横並びカード） | S | RED | T047 |
| T294 | 実装: `personality-quiz.tsx` Web 対応 | M | GREEN | T290-T293 |

### P6-C: Choose Avatar 画面 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T295 | テスト: `choose-avatar.tsx` — Web 画像グリッド表示 | S | RED | - |
| T296 | テスト: `choose-avatar.tsx` — Web クリック選択 | S | RED | - |
| T297 | テスト: `choose-avatar.tsx` — Web レスポンシブグリッド | S | RED | T047 |
| T298 | 実装: `choose-avatar.tsx` Web 対応 | S | GREEN | T295-T297 |

### P6-D: Choose Tone 画面 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T299 | テスト: `choose-tone.tsx` — Web 口調カード表示 | S | RED | - |
| T300 | テスト: `choose-tone.tsx` — Web クリック選択 | S | RED | - |
| T301 | テスト: `choose-tone.tsx` — Web レスポンシブ | S | RED | T047 |
| T302 | 実装: `choose-tone.tsx` Web 対応 | S | GREEN | T299-T301 |

### P6-E: Result 画面 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T303 | テスト: `result.tsx` — Web パーソナリティ結果表示 | S | RED | - |
| T304 | テスト: `result.tsx` — Web アニメーション（reduced-motion対応） | S | RED | - |
| T305 | テスト: `result.tsx` — Web レスポンシブ | S | RED | T047 |
| T306 | 実装: `result.tsx` Web 対応 | S | GREEN | T303-T305 |

### P6-F: Meet Twin 画面 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T307 | テスト: `meet-twin.tsx` — Web チャット UI | S | RED | T264 |
| T308 | テスト: `meet-twin.tsx` — Web Enter 送信 | S | RED | T219 |
| T309 | テスト: `meet-twin.tsx` — Web KeyboardAvoidingView 不要確認 | S | RED | - |
| T310 | テスト: `meet-twin.tsx` — Web レスポンシブ | S | RED | T047 |
| T311 | 実装: `meet-twin.tsx` Web 対応 | M | GREEN | T307-T310 |

### P6-G: Onboarding Store Web テスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T312 | テスト: `onboarding-store` — Web で正常動作確認 | S | RED | - |
| T313 | テスト: `onboarding-store` — persist（Web: localStorage） | S | RED | - |
| T314 | テスト: `onboarding-store` — 全ステップ完了フロー | S | RED | - |

### P6-H: Onboarding E2E テスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T315 | E2E: Web 全6画面オンボーディングフロー | L | RED | T025, T289-T311 |
| T316 | E2E: Web オンボーディング途中離脱 → 再開 | M | RED | T025, T289-T311 |

---

## Phase 7: コミュニティ Web 対応 — Agent D

### P7-A: コミュニティ一覧 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T317 | テスト: `community.tsx` — Web グリッドレイアウト（desktop: 3列） | S | RED | T047 |
| T318 | テスト: `community.tsx` — Web グリッドレイアウト（tablet: 2列） | S | RED | T047 |
| T319 | テスト: `community.tsx` — Web グリッドレイアウト（mobile: 1列） | S | RED | T047 |
| T320 | テスト: `community.tsx` — Web カードホバーエフェクト | S | RED | - |
| T321 | テスト: `community.tsx` — Web ゲストモード表示 | S | RED | - |
| T322 | テスト: `community.tsx` — Web Pro/Free 表示分岐 | S | RED | - |
| T323 | 実装: `app/(tabs)/community.tsx` Web レスポンシブ対応 | M | GREEN | T317-T322 |

### P7-B: CommunityCard Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T324 | テスト: `CommunityCard` — Web レイアウト | S | RED | T072 |
| T325 | テスト: `CommunityCard` — Web クリックハンドラー | S | RED | - |
| T326 | テスト: `CommunityCard` — Web サムネイル表示 | S | RED | - |
| T327 | テスト: `CommunityCard` — Web ブラー表示（Free） | S | RED | - |
| T328 | 実装: `community-card.tsx` Web 対応 | S | GREEN | T324-T327 |

### P7-C: コミュニティ詳細 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T329 | テスト: `community/[id].tsx` — Web レスポンシブレイアウト | S | RED | T047 |
| T330 | テスト: `community/[id].tsx` — Web メッセージ一覧 | S | RED | - |
| T331 | テスト: `community/[id].tsx` — Web 参加ボタン（Pro） | S | RED | - |
| T332 | テスト: `community/[id].tsx` — Web ゲスト閲覧 | S | RED | - |
| T333 | 実装: `app/community/[id].tsx` Web 対応 | M | GREEN | T329-T332 |

### P7-D: コミュニティ作成 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T334 | テスト: `community-create.tsx` — Web フォームレイアウト | S | RED | - |
| T335 | テスト: `community-create.tsx` — Web バリデーション | S | RED | - |
| T336 | テスト: `community-create.tsx` — Web 画像アップロード | S | RED | T227 |
| T337 | 実装: `app/community-create.tsx` Web 対応 | M | GREEN | T334-T336 |

### P7-E: コミュニティ hooks Web テスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T338 | テスト: `useCommunities` — Web で正常動作 | S | RED | - |
| T339 | テスト: `useCommunityDetail` — Web で正常動作 | S | RED | - |
| T340 | テスト: `useCommunityMembership` — Web で正常動作 | S | RED | - |

### P7-F: コミュニティ E2E

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T341 | E2E: Web コミュニティ一覧閲覧 | M | RED | T025, T323 |
| T342 | E2E: Web コミュニティ詳細閲覧 | M | RED | T025, T333 |
| T343 | E2E: Web コミュニティ作成（Pro） | M | RED | T025, T337 |
| T344 | E2E: Web ゲストコミュニティブラウズ | M | RED | T025, T323 |

---

## Phase 8: ツイン情報 Web 対応 — Agent D

### P8-A: ツイン情報画面 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T345 | テスト: `twin.tsx` — Web ダッシュボードレイアウト（desktop） | S | RED | T047 |
| T346 | テスト: `twin.tsx` — Web カードグリッド | S | RED | T047, T072 |
| T347 | テスト: `twin.tsx` — Web パーソナリティ表示 | S | RED | - |
| T348 | テスト: `twin.tsx` — Web 気分チャート表示 | S | RED | - |
| T349 | テスト: `twin.tsx` — Web OpenClaw ステータス表示 | S | RED | - |
| T350 | テスト: `twin.tsx` — Web ゲストモード表示 | S | RED | - |
| T351 | テスト: `twin.tsx` — Web レスポンシブ（mobile → 縦スクロール） | S | RED | T047 |
| T352 | 実装: `app/(tabs)/twin.tsx` Web ダッシュボード対応 | L | GREEN | T345-T351 |

### P8-B: ツイン情報 hooks Web テスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T353 | テスト: `useTwinData` — Web で正常動作 | S | RED | - |
| T354 | テスト: `useTwinData` — Web で OpenClaw ステータス取得 | S | RED | - |
| T355 | テスト: `useTwinData` — Web でパーソナリティデータ取得 | S | RED | - |

### P8-C: MBTI 選択モーダル Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T356 | テスト: `mbti-select.tsx` — Web モーダルレイアウト | S | RED | - |
| T357 | テスト: `mbti-select.tsx` — Web カード選択 UI | S | RED | - |
| T358 | テスト: `mbti-select.tsx` — Escape キーでクローズ | S | RED | - |
| T359 | 実装: `app/mbti-select.tsx` Web 対応 | S | GREEN | T356-T358 |

### P8-D: ツイン情報 E2E

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T360 | E2E: Web ツイン情報ダッシュボード表示 | M | RED | T025, T352 |
| T361 | E2E: Web MBTI 選択 | M | RED | T025, T359 |

---

## Phase 9: 設定画面 Web 対応 — Agent D

### P9-A: 設定画面 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T362 | テスト: `settings.tsx` — Web レスポンシブレイアウト | S | RED | T047 |
| T363 | テスト: `settings.tsx` — Web ユーザープロフィール表示 | S | RED | - |
| T364 | テスト: `settings.tsx` — Web サブスクリプション状態表示 | S | RED | T181 |
| T365 | テスト: `settings.tsx` — Web サブスク管理リンク（Stripe Portal） | S | RED | T169 |
| T366 | テスト: `settings.tsx` — Web ログアウトボタン | S | RED | - |
| T367 | テスト: `settings.tsx` — Web ゲストモード表示 | S | RED | - |
| T368 | テスト: `settings.tsx` — Web 通知設定非表示（Web Push 未対応） | S | RED | - |
| T369 | テスト: `settings.tsx` — Web アカウント削除ボタン | S | RED | - |
| T370 | テスト: `settings.tsx` — Web 法的リンク | S | RED | - |
| T371 | テスト: `settings.tsx` — Web アプリバージョン表示 | S | RED | - |
| T372 | 実装: `app/(tabs)/settings.tsx` Web 対応 | L | GREEN | T362-T371 |

### P9-B: アカウント削除確認 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T373 | テスト: `account-delete-confirm.tsx` — Web モーダルレイアウト | S | RED | - |
| T374 | テスト: `account-delete-confirm.tsx` — Web 確認テキスト入力 | S | RED | - |
| T375 | テスト: `account-delete-confirm.tsx` — Web 削除実行 | S | RED | - |
| T376 | テスト: `account-delete-confirm.tsx` — Escape キーでクローズ | S | RED | - |
| T377 | 実装: `app/account-delete-confirm.tsx` Web 対応 | M | GREEN | T373-T376 |

### P9-C: 通知設定 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T378 | テスト: `notification-settings.tsx` — Web で Linking.openSettings 非表示 | S | RED | - |
| T379 | テスト: `notification-settings.tsx` — Web Push 将来対応メッセージ | S | RED | - |
| T380 | 実装: `app/notification-settings.tsx` Web 対応 | S | GREEN | T378-T379 |

### P9-D: 会話詳細 Web

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T381 | テスト: `twin-conversation-detail.tsx` — Web レイアウト | S | RED | - |
| T382 | テスト: `twin-conversation-detail.tsx` — Web スクロール | S | RED | - |
| T383 | 実装: `app/twin-conversation-detail.tsx` Web 対応 | S | GREEN | T381-T382 |

### P9-E: 設定 E2E テスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T384 | E2E: Web 設定画面表示 | M | RED | T025, T372 |
| T385 | E2E: Web ログアウト | M | RED | T025, T372 |
| T386 | E2E: Web アカウント削除フロー | M | RED | T025, T377 |
| T387 | E2E: Web サブスク管理リンク | M | RED | T025, T372 |

---

## Phase 10: Analytics Web 対応 — Agent A

### P10-A: PostHog Web SDK 統合

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T388 | テスト: `tracker.web` — initializeAnalytics（PostHog JS SDK） | S | RED | - |
| T389 | テスト: `tracker.web` — trackEvent（イベント名 + プロパティ） | S | RED | - |
| T390 | テスト: `tracker.web` — identifyUser | S | RED | - |
| T391 | テスト: `tracker.web` — resetUser | S | RED | - |
| T392 | テスト: `tracker.web` — trackScreen（ページビュー） | S | RED | - |
| T393 | 実装: `tracker.web.ts` PostHog JS SDK 統合 | M | GREEN | T388-T392 |

### P10-B: Analytics テスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T394 | テスト: `tracker.native` — posthog-react-native 動作確認 | S | RED | - |
| T395 | テスト: `tracker` — re-export 正常動作 | S | RED | T393 |
| T396 | 統合テスト: Analytics が全プラットフォームで動作 | S | GREEN | T393, T394 |

---

## Phase 11: Edge Functions CORS 対応 — Agent C

### P11-A: 既存 Edge Functions の CORS 対応

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T397 | テスト: `chat` Edge Function — CORS preflight (OPTIONS) | S | RED | - |
| T398 | テスト: `chat` Edge Function — CORS headers レスポンス | S | RED | - |
| T399 | 実装: `chat` Edge Function CORS 対応 | S | GREEN | T397-T398 |
| T400 | テスト: `personality-analyze` Edge Function — CORS | S | RED | - |
| T401 | 実装: `personality-analyze` Edge Function CORS 対応 | S | GREEN | T400 |
| T402 | テスト: `journal-reflect` Edge Function — CORS | S | RED | - |
| T403 | 実装: `journal-reflect` Edge Function CORS 対応 | S | GREEN | T402 |
| T404 | テスト: `fetch-ogp` Edge Function — CORS | S | RED | - |
| T405 | 実装: `fetch-ogp` Edge Function CORS 対応 | S | GREEN | T404 |
| T406 | テスト: `translate-message` Edge Function — CORS | S | RED | - |
| T407 | 実装: `translate-message` Edge Function CORS 対応 | S | GREEN | T406 |
| T408 | 共通 CORS ユーティリティ作成（corsHeaders helper） | S | GREEN | - |
| T409 | テスト: CORS utility — 許可オリジン設定 | S | RED | T408 |
| T410 | テスト: CORS utility — 非許可オリジン拒否 | S | RED | T408 |

---

## Phase 12: 既存機能 Web テスト（リグレッション防止）— 全 Agent

### P12-A: Auth ストア テスト拡充

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T411 | テスト: `auth-store` — signIn 正常系 | S | RED | - |
| T412 | テスト: `auth-store` — signOut 正常系 | S | RED | - |
| T413 | テスト: `auth-store` — devLogin 正常系 | S | RED | - |
| T414 | テスト: `auth-store` — enterGuestMode 正常系 | S | RED | - |
| T415 | テスト: `auth-store` — セッション復元 | S | RED | - |
| T416 | テスト: `auth-store` — エラーハンドリング（ネットワークエラー） | S | RED | - |
| T417 | テスト: `auth-store` — エラーハンドリング（Supabase エラー） | S | RED | - |

### P12-B: Chat hooks テスト拡充

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T418 | テスト: `useChat` — Free SSE メッセージ送信 | S | RED | - |
| T419 | テスト: `useChat` — Pro WebSocket メッセージ送信 | S | RED | - |
| T420 | テスト: `useChat` — ストリーミングコンテンツ更新 | S | RED | - |
| T421 | テスト: `useChat` — 履歴読み込み（初回50件） | S | RED | - |
| T422 | テスト: `useChat` — 履歴ページネーション | S | RED | - |
| T423 | テスト: `useChat` — トピック切り替え | S | RED | - |
| T424 | テスト: `useChat` — メッセージ長制限（1000 / 3000 文字） | S | RED | - |
| T425 | テスト: `useChat` — 画像添付送信 | S | RED | - |
| T426 | テスト: `useChat` — マークダウンメッセージ | S | RED | - |
| T427 | テスト: `useChat` — 既読更新 | S | RED | - |
| T428 | テスト: `useChat` — 翻訳リクエスト | S | RED | - |
| T429 | テスト: `useChat` — OGP 取得 | S | RED | - |
| T430 | テスト: `useChat` — 日記統合（振り返りプロンプト） | S | RED | - |
| T431 | テスト: `useChat` — 日記統合（ジャーナルエントリ保存） | S | RED | - |
| T432 | テスト: `useChat` — Free トークン上限 | S | RED | - |
| T433 | テスト: `useChat` — Pro トークン上限 | S | RED | - |
| T434 | テスト: `useChat` — 接続モード切替 | S | RED | - |

### P12-C: Onboarding ストア テスト拡充

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T435 | テスト: `onboarding-store` — パーソナリティ回答保存 | S | RED | - |
| T436 | テスト: `onboarding-store` — アバター選択保存 | S | RED | - |
| T437 | テスト: `onboarding-store` — トーン選択保存 | S | RED | - |
| T438 | テスト: `onboarding-store` — 全ステップ完了判定 | S | RED | - |
| T439 | テスト: `onboarding-store` — リセット | S | RED | - |

### P12-D: Subscription hooks テスト拡充

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T440 | テスト: `useSubscription` — isPro true | S | RED | - |
| T441 | テスト: `useSubscription` — isPro false | S | RED | - |
| T442 | テスト: `useSubscription` — isTrialing | S | RED | - |
| T443 | テスト: `useSubscription` — planType monthly/annual/free | S | RED | - |
| T444 | テスト: `useSubscription` — expiresAt | S | RED | - |

### P12-E: Community hooks テスト拡充

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T445 | テスト: `useCommunities` — 一覧取得 | S | RED | - |
| T446 | テスト: `useCommunities` — ページネーション | S | RED | - |
| T447 | テスト: `useCommunities` — エラーハンドリング | S | RED | - |
| T448 | テスト: `useCommunityDetail` — 詳細取得 | S | RED | - |
| T449 | テスト: `useCommunityDetail` — メッセージ一覧 | S | RED | - |
| T450 | テスト: `useCommunityMembership` — 参加/退出 | S | RED | - |

### P12-F: Settings テスト拡充

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T451 | テスト: 設定画面 — プロフィール表示 | S | RED | - |
| T452 | テスト: 設定画面 — サブスク状態表示 | S | RED | - |
| T453 | テスト: 設定画面 — ログアウト実行 | S | RED | - |
| T454 | テスト: 設定画面 — アカウント削除フロー | S | RED | - |
| T455 | テスト: 設定画面 — ゲストモード表示 | S | RED | - |

### P12-G: OpenClaw サービステスト拡充

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T456 | テスト: `openclaw/client` — インスタンス状態取得 | S | RED | - |
| T457 | テスト: `openclaw/client` — ヘルスチェック | S | RED | - |
| T458 | テスト: `openclaw/client` — SOUL.md 更新 | S | RED | - |
| T459 | テスト: `openclaw/client` — 再起動リクエスト | S | RED | - |
| T460 | テスト: `websocket-client` — 接続ライフサイクル | S | RED | - |
| T461 | テスト: `websocket-client` — メッセージ送受信 | S | RED | - |
| T462 | テスト: `websocket-client` — 再接続ロジック | S | RED | - |
| T463 | テスト: `connection-manager` — 接続状態管理 | S | RED | - |
| T464 | テスト: `connection-manager` — フォールバック切替 | S | RED | - |

### P12-H: Supabase サービステスト拡充

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T465 | テスト: `supabase/client.web` — createClient 正常 | S | RED | - |
| T466 | テスト: `supabase/client.web` — sessionStorage トークン保存 | S | RED | - |
| T467 | テスト: `supabase/client.web` — visibilitychange auto-refresh | S | RED | - |
| T468 | テスト: `supabase/client.native` — SecureStore トークン保存 | S | RED | - |
| T469 | テスト: `supabase/client.native` — AppState auto-refresh | S | RED | - |
| T470 | テスト: `supabase/auth.web` — signInWithOAuth (Google) | S | RED | - |
| T471 | テスト: `supabase/auth.web` — signInWithOAuth (Apple) | S | RED | - |
| T472 | テスト: `supabase/auth.native` — signInWithIdToken (Google) | S | RED | - |
| T473 | テスト: `supabase/auth.native` — signInWithApple | S | RED | - |
| T474 | テスト: `supabase/auth-shared` — signOut | S | RED | - |
| T475 | テスト: `supabase/auth-shared` — getProfile | S | RED | - |
| T476 | テスト: `supabase/auth-shared` — updateProfile | S | RED | - |

### P12-I: RevenueCat サービステスト拡充

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T477 | テスト: `revenuecat/client.web` — 全関数 no-op 確認 | S | RED | - |
| T478 | テスト: `revenuecat/client.web` — purchasePackage throws | S | RED | - |
| T479 | テスト: `revenuecat/client.native` — initialize | S | RED | - |
| T480 | テスト: `revenuecat/client.native` — getOfferings | S | RED | - |
| T481 | テスト: `revenuecat/client.native` — purchasePackage | S | RED | - |
| T482 | テスト: `revenuecat/client.native` — restorePurchases | S | RED | - |
| T483 | テスト: `revenuecat/client.native` — getCustomerInfo | S | RED | - |

### P12-J: Notifications サービステスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T484 | テスト: `notifications/client.web` — 全関数 no-op 確認 | S | RED | - |
| T485 | テスト: `notifications/client.native` — initialize | S | RED | - |
| T486 | テスト: `notifications/client.native` — requestPermission | S | RED | - |
| T487 | テスト: `notifications/client.native` — setExternalUserId | S | RED | - |

### P12-K: Community サービステスト

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T488 | テスト: `community/client` — getCommunities | S | RED | - |
| T489 | テスト: `community/client` — getCommunityById | S | RED | - |
| T490 | テスト: `community/client` — joinCommunity | S | RED | - |
| T491 | テスト: `community/client` — leaveCommunity | S | RED | - |
| T492 | テスト: `community/client` — createCommunity | S | RED | - |
| T493 | テスト: `community/client` — getMessages | S | RED | - |

---

## Phase 13: アクセシビリティ — Agent A/D

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T494 | テスト: 全ボタン — `aria-label` 設定 | S | RED | - |
| T495 | テスト: 全入力 — `aria-label` / `placeholder` 設定 | S | RED | - |
| T496 | テスト: キーボードナビゲーション — Tab 順序 | S | RED | - |
| T497 | テスト: キーボードナビゲーション — Enter でアクション実行 | S | RED | - |
| T498 | テスト: フォーカスインジケーター — 全インタラクティブ要素 | S | RED | - |
| T499 | テスト: スクリーンリーダー — ライブリージョン（チャットメッセージ） | S | RED | - |
| T500 | テスト: カラーコントラスト — WCAG AA (4.5:1 テキスト) | S | RED | - |
| T501 | テスト: reduced-motion — アニメーション無効化 | S | RED | - |
| T502 | 実装: アクセシビリティ修正（全コンポーネント） | L | GREEN | T494-T501 |
| T503 | テスト: Lighthouse アクセシビリティスコア >= 90 | M | GREEN | T502 |

---

## Phase 14: パフォーマンス・最適化 — Agent A

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T504 | テスト: Web バンドルサイズ < 500KB (gzip) | S | RED | - |
| T505 | テスト: Web LCP < 3秒 | S | RED | - |
| T506 | テスト: Web FID < 100ms | S | RED | - |
| T507 | テスト: Web CLS < 0.1 | S | RED | - |
| T508 | バンドル分析: 不要な native 依存の除外確認 | M | RED | - |
| T509 | コード分割: 各ルートの遅延ロード確認 | M | RED | - |
| T510 | 画像最適化: WebP 変換 + lazy loading | S | GREEN | - |
| T511 | フォント最適化: Outfit フォントのサブセット化 | S | GREEN | - |
| T512 | テスト: メモリリーク検出（Web DevTools） | M | RED | - |
| T513 | テスト: WebSocket 接続のメモリリーク | S | RED | - |

---

## Phase 15: セキュリティ — Agent A

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T514 | テスト: XSS — マークダウン入力サニタイズ | S | RED | - |
| T515 | テスト: XSS — メッセージ表示サニタイズ | S | RED | - |
| T516 | テスト: CSRF — Edge Function トークン検証 | S | RED | - |
| T517 | テスト: CSP — Content Security Policy ヘッダー | S | RED | - |
| T518 | テスト: APIキー非露出 — Web バンドル内検索 | S | RED | - |
| T519 | テスト: Stripe Webhook 署名検証 | S | RED | T164 |
| T520 | テスト: CORS — 許可オリジンのみアクセス可能 | S | RED | T408 |
| T521 | テスト: セッション固定攻撃対策 | S | RED | - |
| T522 | テスト: Open Redirect 防止 | S | RED | - |
| T523 | 実装: セキュリティヘッダー設定 | M | GREEN | T514-T522 |

---

## Phase 16: 最終統合・リグレッション — 全 Agent

| ID | タスク | サイズ | TDD | 依存 |
|----|-------|--------|-----|------|
| T524 | 統合テスト: Web 認証 → オンボーディング → チャット E2E | L | RED | 全Phase |
| T525 | 統合テスト: Web 認証 → ペイウォール → Stripe 決済 → Pro 有効化 E2E | L | RED | 全Phase |
| T526 | 統合テスト: Web Pro チャット → WebSocket → ストリーミング E2E | L | RED | 全Phase |
| T527 | リグレッション: iOS ビルド確認（tsc + expo run:ios） | M | - | 全Phase |
| T528 | リグレッション: Android ビルド確認（tsc + expo run:android） | M | - | 全Phase |
| T529 | リグレッション: Web ビルド確認（tsc + expo export:web） | M | - | 全Phase |
| T530 | テストカバレッジ確認: 全プラットフォーム >= 80% | S | - | 全Phase |
| T531 | Codex レビュー: クロスプラットフォームアーキテクチャ | M | - | 全Phase |
| T532 | Codex レビュー: セキュリティ監査 | M | - | 全Phase |
| T533 | ドキュメント更新: CLAUDE.md Web 対応セクション追加 | S | - | 全Phase |
| T534 | ドキュメント更新: specs/overview.md Web 対応反映 | S | - | 全Phase |
| T535 | PR 作成: 20260221-web-full-impl → main | M | - | 全Phase |

---

## サマリー

| Phase | タスク数 | 担当 Agent |
|-------|---------|-----------|
| P0: 基盤設定 | 40 | Agent A |
| P1: 共通基盤実装 | 51 | Agent A |
| P2: Web レイアウト | 25 | Agent A |
| P3: 認証 Web | 25 | Agent A |
| P4: Stripe 課金 | 69 | Agent B |
| P5: チャット Web | 78 | Agent C |
| P6: オンボーディング Web | 31 | Agent C |
| P7: コミュニティ Web | 28 | Agent D |
| P8: ツイン情報 Web | 17 | Agent D |
| P9: 設定 Web | 26 | Agent D |
| P10: Analytics Web | 9 | Agent A |
| P11: Edge Functions CORS | 14 | Agent C |
| P12: リグレッションテスト | 83 | 全Agent |
| P13: アクセシビリティ | 10 | Agent A/D |
| P14: パフォーマンス | 10 | Agent A |
| P15: セキュリティ | 10 | Agent A |
| P16: 最終統合 | 12 | 全Agent |
| **合計** | **538** | |

---

## Agent 別担当タスク数

| Agent | タスク数 | Phase |
|-------|---------|-------|
| Agent A (Foundation) | ~210 | P0, P1, P2, P3, P10, P13, P14, P15, P16 |
| Agent B (Subscription) | ~69 | P4 |
| Agent C (Core AI) | ~123 | P5, P6, P11 |
| Agent D (Engagement) | ~71 | P7, P8, P9 |
| 全Agent共有 | ~65 | P12, P16 |
