# AltMe Web版 超詳細タスクリスト（2000+タスク）

**生成日**: 2026-02-21
**対象ブランチ**: 20260221-web-full-impl
**TDDサイクル**: RED（テスト作成）→ GREEN（実装）→ REFACTOR（リファクタ）

## 凡例

| 列 | 内容 |
|----|------|
| T番号 | タスクID（T0001〜） |
| Phase | P0〜P16（実装フェーズ） |
| Agent | A=Foundation / B=Subscription / C=CoreAI / D=Engagement |
| TDD | RED / GREEN / REFACTOR |
| タスク名 | 実装内容の要約 |
| ファイル | 対象ファイルパス |
| テストケース説明 | 具体的なテスト内容 |

---

## A. 設定・基盤（~100タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T0001 | P0 | A | RED | Jest設定: jest.config.ts作成 | jest.config.ts | jest-expo/web プロジェクト設定が存在し `testEnvironment: 'jsdom'` が設定されること |
| T0002 | P0 | A | RED | Jest設定: ios プロジェクト追加 | jest.config.ts | jest-expo/ios プロジェクトが設定され `testEnvironment: 'node'` が設定されること |
| T0003 | P0 | A | RED | Jest設定: android プロジェクト追加 | jest.config.ts | jest-expo/android プロジェクトが設定されること |
| T0004 | P0 | A | GREEN | Jest設定: マルチプロジェクト実装 | jest.config.ts | `npx jest --listProjects` で ios/android/web の3プロジェクトが表示されること |
| T0005 | P0 | A | RED | Jest設定: moduleNameMapper追加 | jest.config.ts | `.web.ts` 拡張子が web プロジェクトで優先解決されること |
| T0006 | P0 | A | RED | Jest設定: .native.ts マッパー追加 | jest.config.ts | `.native.ts` 拡張子が ios/android プロジェクトで優先解決されること |
| T0007 | P0 | A | GREEN | Jest設定: setupFilesAfterFramework設定 | jest.config.ts | `jest.setup.ts` がすべてのプロジェクトで読み込まれること |
| T0008 | P0 | A | RED | jest.setup.ts: MSW サーバー初期化 | jest.setup.ts | `beforeAll(() => server.listen())` が定義されること |
| T0009 | P0 | A | RED | jest.setup.ts: MSW リセット設定 | jest.setup.ts | `afterEach(() => server.resetHandlers())` が定義されること |
| T0010 | P0 | A | RED | jest.setup.ts: MSW クリーンアップ設定 | jest.setup.ts | `afterAll(() => server.close())` が定義されること |
| T0011 | P0 | A | GREEN | jest.setup.ts: MSW 実装 | jest.setup.ts | `server.listen()` 呼び出し時にエラーが発生しないこと |
| T0012 | P0 | A | RED | MSWハンドラー: Supabase Auth ハンドラー作成 | src/__mocks__/msw/handlers/supabase-auth.ts | POST `/auth/v1/token` が `access_token` を返すこと |
| T0013 | P0 | A | RED | MSWハンドラー: Supabase DB ハンドラー作成 | src/__mocks__/msw/handlers/supabase-db.ts | GET `/rest/v1/profiles` が配列を返すこと |
| T0014 | P0 | A | RED | MSWハンドラー: OpenClaw WebSocket ハンドラー | src/__mocks__/msw/handlers/openclaw-ws.ts | WebSocket接続ハンドラーが定義されること |
| T0015 | P0 | A | RED | MSWハンドラー: RevenueCat APIハンドラー | src/__mocks__/msw/handlers/revenuecat.ts | GET `/subscribers/{id}` が entitlements を返すこと |
| T0016 | P0 | A | RED | MSWハンドラー: Stripe APIハンドラー | src/__mocks__/msw/handlers/stripe.ts | POST `/v1/checkout/sessions` がセッションURLを返すこと |
| T0017 | P0 | A | GREEN | MSWサーバー: server.ts 作成 | src/__mocks__/msw/server.ts | `setupServer(...handlers)` でサーバーが作成されること |
| T0018 | P0 | A | RED | テストユーティリティ: renderWithProviders 作成 | src/__test-utils__/render-with-providers.tsx | Zustand/React Query Provider でラップされたコンポーネントがレンダリングされること |
| T0019 | P0 | A | RED | テストユーティリティ: Web専用レンダラー | src/__test-utils__/render-web.tsx | jsdom 環境で Web コンポーネントがレンダリングされること |
| T0020 | P0 | A | RED | テストユーティリティ: モック認証ユーザー | src/__test-utils__/mock-user.ts | `mockAuthenticatedUser()` で認証済みユーザーが注入されること |
| T0021 | P0 | A | RED | テストユーティリティ: モックProユーザー | src/__test-utils__/mock-user.ts | `mockProUser()` でPro entitlement を持つユーザーが注入されること |
| T0022 | P0 | A | GREEN | テストユーティリティ: 実装完了 | src/__test-utils__/index.ts | すべてのユーティリティが named export されること |
| T0023 | P0 | A | RED | Playwright設定: playwright.config.ts作成 | playwright.config.ts | `baseURL: 'http://localhost:8081'` が設定されること |
| T0024 | P0 | A | RED | Playwright設定: chromium プロジェクト | playwright.config.ts | chromium ブラウザプロジェクトが定義されること |
| T0025 | P0 | A | RED | Playwright設定: firefox プロジェクト | playwright.config.ts | firefox ブラウザプロジェクトが定義されること |
| T0026 | P0 | A | RED | Playwright設定: webkit プロジェクト | playwright.config.ts | webkit（Safari）ブラウザプロジェクトが定義されること |
| T0027 | P0 | A | GREEN | Playwright設定: webServer設定 | playwright.config.ts | `npx expo export --platform web` のdevサーバーが自動起動されること |
| T0028 | P0 | A | RED | 型定義: WebPlatform型 | src/shared/types/platform.ts | `Platform: 'web' | 'native'` 型が定義されること |
| T0029 | P0 | A | RED | 型定義: Breakpoint型 | src/shared/types/platform.ts | `Breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide'` 型が定義されること |
| T0030 | P0 | A | RED | 型定義: WebAuthSession型 | src/shared/types/auth.ts | `WebAuthSession` に `provider_token` フィールドが含まれること |
| T0031 | P0 | A | RED | 型定義: StripeCheckoutSession型 | src/shared/types/subscription.ts | `StripeCheckoutSession` に `url`, `sessionId` フィールドが含まれること |
| T0032 | P0 | A | RED | 型定義: WebSocketMessage型更新 | src/shared/types/chat.ts | `WebSocketMessage` に `reconnect_attempt` フィールドが含まれること |
| T0033 | P0 | A | GREEN | 型定義: 全型エクスポート確認 | src/shared/types/index.ts | `tsc --noEmit` でエラーが0件であること |
| T0034 | P0 | A | RED | CI設定: GitHub Actions web-test.yml | .github/workflows/web-test.yml | `jest --project=web` が実行されること |
| T0035 | P0 | A | RED | CI設定: GitHub Actions e2e.yml | .github/workflows/e2e.yml | Playwright E2Eテストが実行されること |
| T0036 | P0 | A | RED | CI設定: TypeScript型チェック | .github/workflows/type-check.yml | `tsc --noEmit` がCIで実行されること |
| T0037 | P0 | A | GREEN | CI設定: ブランチ保護ルール | .github/workflows/web-test.yml | mainブランチへのPRに全CIチェックが必須であること |
| T0038 | P0 | A | RED | package.json: web:test スクリプト追加 | package.json | `npm run web:test` で jest --project=web が実行されること |
| T0039 | P0 | A | RED | package.json: e2e スクリプト追加 | package.json | `npm run e2e` で playwright test が実行されること |
| T0040 | P0 | A | GREEN | package.json: scripts 確認 | package.json | すべての追加スクリプトが正常に実行できること |
| T0041 | P0 | A | RED | Expo設定: web向けmetaタグ | app.json | `expo.web.meta` に description, og:title が設定されること |
| T0042 | P0 | A | RED | Expo設定: bundler設定 | app.json | `expo.web.bundler: 'metro'` が設定されること |
| T0043 | P0 | A | GREEN | Expo設定: web ビルド確認 | app.json | `npx expo export --platform web` がエラーなく完了すること |
| T0044 | P0 | A | RED | 環境変数: .env.example Web変数追加 | .env.example | `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` が定義されること |
| T0045 | P0 | A | RED | 環境変数: POSTHOG_API_KEY Web変数 | .env.example | `EXPO_PUBLIC_POSTHOG_API_KEY` が定義されること |
| T0046 | P0 | A | GREEN | 環境変数: 型安全な環境変数アクセス | src/config/env.ts | 未定義の環境変数アクセス時に型エラーが発生すること |
| T0047 | P0 | A | RED | Web設定: CORS設定定数 | src/config/cors.ts | `allowedOrigins` 配列にproduction URLが含まれること |
| T0048 | P0 | A | GREEN | Web設定: 全設定定数確認 | src/config/index.ts | すべての定数が named export されること |
| T0049 | P0 | A | REFACTOR | 基盤: テストユーティリティ型付け強化 | src/__test-utils__/render-with-providers.tsx | ジェネリクス型パラメーターが正しく推論されること |
| T0050 | P0 | A | REFACTOR | 基盤: MSWハンドラー型付け強化 | src/__mocks__/msw/handlers/supabase-auth.ts | レスポンス型が Supabase AuthResponse に一致すること |
| T0051 | P0 | A | RED | web/index.html: メタタグ設定 | web/index.html | `<meta name="viewport">` が設定されること |
| T0052 | P0 | A | RED | web/index.html: OGP設定 | web/index.html | `<meta property="og:title">` が設定されること |
| T0053 | P0 | A | GREEN | web/index.html: favicon設定 | web/index.html | favicon.ico が参照されること |
| T0054 | P0 | A | RED | babel.config.js: Web対応設定 | babel.config.js | `@babel/preset-env` target に modern browsers が設定されること |
| T0055 | P0 | A | GREEN | metro.config.js: Web拡張子解決 | metro.config.js | `.web.ts` → `.ts` の順で解決されること |
| T0056 | P0 | A | RED | tsconfig.json: Web用パス解決 | tsconfig.json | `@/*` エイリアスが設定されること |
| T0057 | P0 | A | GREEN | tsconfig.json: strict モード確認 | tsconfig.json | `"strict": true` が設定されること |
| T0058 | P0 | A | RED | テストデータ: fixtures/users.ts 作成 | src/__fixtures__/users.ts | `mockFreeUser`, `mockProUser` fixture が定義されること |
| T0059 | P0 | A | RED | テストデータ: fixtures/messages.ts 作成 | src/__fixtures__/messages.ts | `mockChatMessage` fixture が定義されること |
| T0060 | P0 | A | GREEN | テストデータ: fixtures 全エクスポート | src/__fixtures__/index.ts | すべての fixture が named export されること |
| T0061 | P0 | A | RED | テストデータ: fixtures/subscriptions.ts | src/__fixtures__/subscriptions.ts | `mockProSubscription`, `mockFreeSubscription` が定義されること |
| T0062 | P0 | A | RED | テストデータ: fixtures/openclaw.ts | src/__fixtures__/openclaw.ts | `mockRunningInstance`, `mockProvisioningInstance` が定義されること |
| T0063 | P0 | A | GREEN | テストデータ: すべてのfixture型確認 | src/__fixtures__/index.ts | `tsc --noEmit` でfixture型エラーが0件であること |
| T0064 | P0 | A | RED | ストーリーブック設定: .storybook/main.ts | .storybook/main.ts | Web向けStorybookが設定されること |
| T0065 | P0 | A | RED | ストーリーブック設定: preview.tsx | .storybook/preview.tsx | Zustand Provider でデコレーターが設定されること |
| T0066 | P0 | A | GREEN | ストーリーブック: 起動確認 | .storybook/main.ts | `npx storybook dev` がポート6006で起動すること |
| T0067 | P0 | A | RED | Sentry設定: app.json Sentry plugin | app.json | `@sentry/react-native/metro` プラグインが設定されること |
| T0068 | P0 | A | GREEN | Sentry設定: 初期化コード | src/config/sentry.ts | `Sentry.init()` が DSN付きで呼び出されること |
| T0069 | P0 | A | RED | パフォーマンス: bundle analyzer設定 | package.json | `npm run analyze` で webpack-bundle-analyzer が起動すること |
| T0070 | P0 | A | GREEN | パフォーマンス: 初期バンドルサイズ測定 | - | `npx expo export --platform web` 後のバンドルサイズを記録すること |
| T0071 | P0 | A | RED | アクセシビリティ: eslint-plugin-jsx-a11y設定 | .eslintrc.json | `jsx-a11y` プラグインが有効化されること |
| T0072 | P0 | A | GREEN | アクセシビリティ: ESLint a11y ルール確認 | .eslintrc.json | `npx expo lint` でa11yエラーが0件であること |
| T0073 | P0 | A | RED | セキュリティ: npm audit設定 | .github/workflows/security.yml | `npm audit --audit-level=high` がCIで実行されること |
| T0074 | P0 | A | GREEN | セキュリティ: CSP設定 | web/index.html | `Content-Security-Policy` メタタグが設定されること |
| T0075 | P0 | A | RED | ロギング: logger.web.ts 作成 | src/shared/utils/logger.web.ts | Web環境で `console.log` にマッピングされること |
| T0076 | P0 | A | RED | ロギング: logger.native.ts 作成 | src/shared/utils/logger.native.ts | Native環境で `console.log` にマッピングされること |
| T0077 | P0 | A | GREEN | ロギング: logger.ts 再エクスポート | src/shared/utils/logger.ts | プラットフォームに応じて正しい実装が使われること |
| T0078 | P0 | A | RED | エラー境界: ErrorBoundary.web.tsx 作成 | src/shared/components/error-boundary.web.tsx | Webでclass component ErrorBoundaryが定義されること |
| T0079 | P0 | A | GREEN | エラー境界: ErrorBoundary.tsx 再エクスポート | src/shared/components/error-boundary.tsx | プラットフォームに応じたErrorBoundaryが使われること |
| T0080 | P0 | A | RED | カスタム404: Web用404ページ | app/+not-found.tsx | 404時に「ページが見つかりません」が表示されること |
| T0081 | P0 | A | GREEN | カスタム404: ホームへの導線 | app/+not-found.tsx | 404ページにトップへ戻るリンクが存在すること |
| T0082 | P0 | A | RED | SEO: sitemap.ts 生成スクリプト | scripts/generate-sitemap.ts | サイトマップXMLが生成されること |
| T0083 | P0 | A | GREEN | SEO: robots.txt 設定 | web/robots.txt | `User-agent: *` と `Allow: /` が設定されること |
| T0084 | P0 | A | RED | PWA設定: manifest.json | web/manifest.json | `name`, `short_name`, `start_url`, `display: standalone` が設定されること |
| T0085 | P0 | A | GREEN | PWA設定: service worker | web/sw.js | オフライン時にキャッシュからページが返されること |
| T0086 | P0 | A | RED | i18n設定: ja.ts 日本語テキスト定義 | src/i18n/ja.ts | auth, chat, settings の全テキストキーが定義されること |
| T0087 | P0 | A | RED | i18n設定: en.ts 英語テキスト定義 | src/i18n/en.ts | ja.ts と同じキー構造を持つこと |
| T0088 | P0 | A | GREEN | i18n設定: useTranslation hook | src/shared/hooks/use-translation.ts | `t('auth.login')` で正しいテキストが返されること |
| T0089 | P0 | A | REFACTOR | 基盤: import パス整理 | src/shared/types/index.ts | 循環参照が存在しないこと |
| T0090 | P0 | A | REFACTOR | 基盤: テストユーティリティ DRY化 | src/__test-utils__/render-with-providers.tsx | 重複するプロバイダー設定が共通化されること |
| T0091 | P0 | A | RED | デプロイ設定: Expo EAS Web 設定 | eas.json | `production` プロファイルに Web ビルド設定が含まれること |
| T0092 | P0 | A | GREEN | デプロイ設定: 環境別URL設定 | src/config/env.ts | `EXPO_PUBLIC_APP_URL` が dev/staging/prod で異なること |
| T0093 | P0 | A | RED | Playwright: グローバルセットアップ | playwright.config.ts | `globalSetup` でテスト用ユーザーが作成されること |
| T0094 | P0 | A | RED | Playwright: グローバルティアダウン | playwright.config.ts | `globalTeardown` でテスト用ユーザーが削除されること |
| T0095 | P0 | A | GREEN | Playwright: 認証状態保存 | playwright.config.ts | `storageState` でセッションが再利用されること |
| T0096 | P0 | A | RED | テスト: カバレッジ設定 | jest.config.ts | `coverageThreshold: { global: { branches: 80 } }` が設定されること |
| T0097 | P0 | A | GREEN | テスト: カバレッジレポート生成 | jest.config.ts | `npm run test:coverage` でlcovレポートが生成されること |
| T0098 | P0 | A | RED | 開発ツール: VSCode settings.json | .vscode/settings.json | TypeScript version が workspace のものを使うこと |
| T0099 | P0 | A | GREEN | 開発ツール: launch.json デバッグ設定 | .vscode/launch.json | Chrome デバッガー設定が追加されること |
| T0100 | P0 | A | REFACTOR | 基盤: 全設定ファイルの整合性確認 | - | `tsc --noEmit && npx expo lint` がエラー0件であること |

---

## B. 共通コンポーネント×プラットフォーム（~300タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T0101 | P1 | A | RED | GlassCard: Web実装テスト作成 | src/shared/components/__tests__/glass-card.web.test.tsx | `backdrop-filter: blur(20px)` スタイルが適用されること |
| T0102 | P1 | A | RED | GlassCard: Web背景色テスト | src/shared/components/__tests__/glass-card.web.test.tsx | `rgba(30, 41, 59, 0.8)` 背景色が適用されること |
| T0103 | P1 | A | RED | GlassCard: Webボーダーテスト | src/shared/components/__tests__/glass-card.web.test.tsx | `border: 1px solid rgba(255,255,255,0.1)` が適用されること |
| T0104 | P1 | A | RED | GlassCard: Webロールテスト | src/shared/components/__tests__/glass-card.web.test.tsx | `role="article"` が設定されること |
| T0105 | P1 | A | GREEN | GlassCard: Web実装 | src/shared/components/glass-card.web.tsx | `backdropFilter: 'blur(20px)'` を持つ div コンポーネントが実装されること |
| T0106 | P1 | A | RED | GlassCard: Native実装テスト | src/shared/components/__tests__/glass-card.native.test.tsx | `BlurView` コンポーネントが使われること |
| T0107 | P1 | A | RED | GlassCard: Native intensity テスト | src/shared/components/__tests__/glass-card.native.test.tsx | `intensity={20}` が設定されること |
| T0108 | P1 | A | GREEN | GlassCard: Native実装 | src/shared/components/glass-card.native.tsx | `expo-blur` の `BlurView` でラップされること |
| T0109 | P1 | A | RED | GlassCard: 再エクスポートテスト | src/shared/components/__tests__/glass-card.test.tsx | Web環境でweb実装、Native環境でnative実装がロードされること |
| T0110 | P1 | A | GREEN | GlassCard: 再エクスポート実装 | src/shared/components/glass-card.tsx | プラットフォームに応じた実装が再エクスポートされること |
| T0111 | P1 | A | RED | GlassCard: children レンダリングテスト | src/shared/components/__tests__/glass-card.web.test.tsx | `children` props がコンテナ内にレンダリングされること |
| T0112 | P1 | A | RED | GlassCard: className props テスト | src/shared/components/__tests__/glass-card.web.test.tsx | `className` props がルート要素に追加されること |
| T0113 | P1 | A | RED | GlassCard: style props テスト | src/shared/components/__tests__/glass-card.web.test.tsx | `style` props がルート要素に適用されること |
| T0114 | P1 | A | REFACTOR | GlassCard: 型定義強化 | src/shared/components/glass-card.tsx | `GlassCardProps` インターフェースが全プラットフォームで共通化されること |
| T0115 | P1 | A | RED | CosmicBackground: Web アニメーション実装テスト | src/shared/components/__tests__/cosmic-background.web.test.tsx | CSS `@keyframes` アニメーションが定義されること |
| T0116 | P1 | A | RED | CosmicBackground: Web SVGテスト | src/shared/components/__tests__/cosmic-background.web.test.tsx | SVG 星フィールドが存在すること |
| T0117 | P1 | A | RED | CosmicBackground: Web グラデーションテスト | src/shared/components/__tests__/cosmic-background.web.test.tsx | `radial-gradient` が適用されること |
| T0118 | P1 | A | GREEN | CosmicBackground: Web実装 | src/shared/components/cosmic-background.web.tsx | CSS アニメーション付き宇宙背景が実装されること |
| T0119 | P1 | A | RED | CosmicBackground: Native テスト | src/shared/components/__tests__/cosmic-background.native.test.tsx | `Animated.View` でアニメーションが設定されること |
| T0120 | P1 | A | GREEN | CosmicBackground: Native実装 | src/shared/components/cosmic-background.native.tsx | Animated API で星フィールドアニメーションが実装されること |
| T0121 | P1 | A | GREEN | CosmicBackground: 再エクスポート | src/shared/components/cosmic-background.tsx | プラットフォームに応じた実装が使われること |
| T0122 | P1 | A | RED | GoldButton: Web ホバー状態テスト | src/shared/components/__tests__/gold-button.web.test.tsx | `:hover` 時に `opacity: 0.9` が適用されること |
| T0123 | P1 | A | RED | GoldButton: Web フォーカスリングテスト | src/shared/components/__tests__/gold-button.web.test.tsx | `:focus-visible` でフォーカスリングが表示されること |
| T0124 | P1 | A | RED | GoldButton: Web グラデーション背景テスト | src/shared/components/__tests__/gold-button.web.test.tsx | `linear-gradient(135deg, #FFD700, #FFA500)` が適用されること |
| T0125 | P1 | A | RED | GoldButton: disabled状態テスト | src/shared/components/__tests__/gold-button.web.test.tsx | `disabled` 時に `opacity: 0.5` かつ `pointer-events: none` が適用されること |
| T0126 | P1 | A | RED | GoldButton: loading状態テスト | src/shared/components/__tests__/gold-button.web.test.tsx | `loading` 時にスピナーが表示されること |
| T0127 | P1 | A | RED | GoldButton: onClick コールバックテスト | src/shared/components/__tests__/gold-button.web.test.tsx | ボタンクリック時に `onClick` が呼ばれること |
| T0128 | P1 | A | GREEN | GoldButton: Web実装 | src/shared/components/gold-button.web.tsx | CSS グラデーション・ホバー付きボタンが実装されること |
| T0129 | P1 | A | RED | GoldButton: Native テスト | src/shared/components/__tests__/gold-button.native.test.tsx | `TouchableOpacity` または `Pressable` が使われること |
| T0130 | P1 | A | GREEN | GoldButton: Native実装 | src/shared/components/gold-button.native.tsx | `LinearGradient` でスタイルされたボタンが実装されること |
| T0131 | P1 | A | GREEN | GoldButton: 再エクスポート | src/shared/components/gold-button.tsx | プラットフォームに応じた実装が使われること |
| T0132 | P1 | A | REFACTOR | GoldButton: アクセシビリティ強化 | src/shared/components/gold-button.web.tsx | `aria-label`, `role="button"` が設定されること |
| T0133 | P1 | A | RED | ResponsiveContainer: mobile ブレークポイントテスト | src/shared/components/__tests__/responsive-container.web.test.tsx | 幅 < 768px で mobile レイアウトが適用されること |
| T0134 | P1 | A | RED | ResponsiveContainer: tablet ブレークポイントテスト | src/shared/components/__tests__/responsive-container.web.test.tsx | 幅 768-1023px で tablet レイアウトが適用されること |
| T0135 | P1 | A | RED | ResponsiveContainer: desktop ブレークポイントテスト | src/shared/components/__tests__/responsive-container.web.test.tsx | 幅 1024-1439px で desktop レイアウトが適用されること |
| T0136 | P1 | A | RED | ResponsiveContainer: wide ブレークポイントテスト | src/shared/components/__tests__/responsive-container.web.test.tsx | 幅 ≥ 1440px で wide レイアウトが適用されること |
| T0137 | P1 | A | GREEN | ResponsiveContainer: Web実装 | src/shared/components/responsive-container.web.tsx | CSS メディアクエリでブレークポイントが実装されること |
| T0138 | P1 | A | RED | ResponsiveContainer: Native テスト | src/shared/components/__tests__/responsive-container.native.test.tsx | `useWindowDimensions` で幅を取得すること |
| T0139 | P1 | A | GREEN | ResponsiveContainer: Native実装 | src/shared/components/responsive-container.native.tsx | `Dimensions.get('window')` でブレークポイントが計算されること |
| T0140 | P1 | A | GREEN | ResponsiveContainer: 再エクスポート | src/shared/components/responsive-container.tsx | プラットフォームに応じた実装が使われること |
| T0141 | P1 | A | RED | GuestPromptOverlay: 表示テスト | src/shared/components/__tests__/guest-prompt-overlay.test.tsx | 未認証時にオーバーレイが表示されること |
| T0142 | P1 | A | RED | GuestPromptOverlay: ログインボタンテスト | src/shared/components/__tests__/guest-prompt-overlay.test.tsx | 「ログイン」ボタンがクリック可能であること |
| T0143 | P1 | A | RED | GuestPromptOverlay: ゲストモード時非表示テスト | src/shared/components/__tests__/guest-prompt-overlay.test.tsx | 認証済みユーザーにはオーバーレイが表示されないこと |
| T0144 | P1 | A | RED | GuestPromptOverlay: ブラー効果テスト | src/shared/components/__tests__/guest-prompt-overlay.web.test.tsx | Web で `backdrop-filter: blur` が適用されること |
| T0145 | P1 | A | GREEN | GuestPromptOverlay: 実装 | src/shared/components/guest-prompt-overlay.tsx | `useAuthStore` の `isAuthenticated` を参照してオーバーレイ表示/非表示が切り替わること |
| T0146 | P1 | A | RED | MediaPicker: Web ファイル選択テスト | src/shared/components/__tests__/media-picker.web.test.tsx | `<input type="file">` が存在すること |
| T0147 | P1 | A | RED | MediaPicker: Web 画像制限テスト | src/shared/components/__tests__/media-picker.web.test.tsx | `accept="image/*"` が設定されること |
| T0148 | P1 | A | RED | MediaPicker: Web ファイルサイズ制限テスト | src/shared/components/__tests__/media-picker.web.test.tsx | 10MB 超のファイル選択でエラーメッセージが表示されること |
| T0149 | P1 | A | RED | MediaPicker: Web ドラッグ&ドロップテスト | src/shared/components/__tests__/media-picker.web.test.tsx | ドラッグ中に `dragover` クラスが付与されること |
| T0150 | P1 | A | RED | MediaPicker: Web ドロップ成功テスト | src/shared/components/__tests__/media-picker.web.test.tsx | ファイルドロップ時に `onFileSelected` コールバックが呼ばれること |
| T0151 | P1 | A | GREEN | MediaPicker: Web実装 | src/shared/components/media-picker.web.tsx | input[type=file] + drag&drop のメディアピッカーが実装されること |
| T0152 | P1 | A | RED | MediaPicker: Native テスト | src/shared/components/__tests__/media-picker.native.test.tsx | `expo-image-picker` が呼び出されること |
| T0153 | P1 | A | GREEN | MediaPicker: Native実装 | src/shared/components/media-picker.native.tsx | `ImagePicker.launchImageLibraryAsync` が実装されること |
| T0154 | P1 | A | GREEN | MediaPicker: 再エクスポート | src/shared/components/media-picker.tsx | プラットフォームに応じた実装が使われること |
| T0155 | P1 | A | RED | FileDropZone: ドラッグオーバーハイライトテスト | src/shared/components/__tests__/file-drop-zone.web.test.tsx | ドラッグオーバー時にボーダーが `#00D4FF` になること |
| T0156 | P1 | A | RED | FileDropZone: ドロップ受付テスト | src/shared/components/__tests__/file-drop-zone.web.test.tsx | ファイルドロップ時に `onDrop` コールバックが呼ばれること |
| T0157 | P1 | A | RED | FileDropZone: 複数ファイルテスト | src/shared/components/__tests__/file-drop-zone.web.test.tsx | 複数ファイルドロップ時にすべてのファイルが `onDrop` に渡されること |
| T0158 | P1 | A | GREEN | FileDropZone: Web実装 | src/shared/components/file-drop-zone.web.tsx | HTML5 Drag and Drop API で実装されること |
| T0159 | P1 | A | RED | WebSidebar: ナビゲーション項目テスト | src/shared/components/__tests__/web-sidebar.web.test.tsx | Chat/Community/Twin/Settings の4項目が表示されること |
| T0160 | P1 | A | RED | WebSidebar: アクティブ状態テスト | src/shared/components/__tests__/web-sidebar.web.test.tsx | 現在のルートに対応する項目がアクティブスタイルになること |
| T0161 | P1 | A | RED | WebSidebar: 幅テスト | src/shared/components/__tests__/web-sidebar.web.test.tsx | サイドバー幅が 240px であること |
| T0162 | P1 | A | RED | WebSidebar: ロゴ表示テスト | src/shared/components/__tests__/web-sidebar.web.test.tsx | AltMe ロゴが表示されること |
| T0163 | P1 | A | RED | WebSidebar: ユーザーアバターテスト | src/shared/components/__tests__/web-sidebar.web.test.tsx | ユーザーアバターが下部に表示されること |
| T0164 | P1 | A | GREEN | WebSidebar: Web実装 | src/shared/components/web-sidebar.web.tsx | 240px 幅のサイドバーナビゲーションが実装されること |
| T0165 | P1 | A | RED | WebSidebar: キーボードナビゲーションテスト | src/shared/components/__tests__/web-sidebar.web.test.tsx | Tab キーでナビゲーション項目にフォーカスが移動すること |
| T0166 | P1 | A | RED | WebSidebar: aria-current テスト | src/shared/components/__tests__/web-sidebar.web.test.tsx | アクティブ項目に `aria-current="page"` が設定されること |
| T0167 | P1 | A | REFACTOR | WebSidebar: アニメーション追加 | src/shared/components/web-sidebar.web.tsx | hover 時に `transform: translateX(4px)` アニメーションが付くこと |
| T0168 | P1 | A | RED | LoadingSpinner: Web アニメーションテスト | src/shared/components/__tests__/loading-spinner.web.test.tsx | CSS `@keyframes spin` アニメーションが定義されること |
| T0169 | P1 | A | RED | LoadingSpinner: Web サイズバリアントテスト | src/shared/components/__tests__/loading-spinner.web.test.tsx | `size="sm"` で 16px、`size="md"` で 24px、`size="lg"` で 32px であること |
| T0170 | P1 | A | GREEN | LoadingSpinner: Web実装 | src/shared/components/loading-spinner.web.tsx | CSS アニメーションスピナーが実装されること |
| T0171 | P1 | A | RED | LoadingSpinner: Native テスト | src/shared/components/__tests__/loading-spinner.native.test.tsx | `ActivityIndicator` コンポーネントが使われること |
| T0172 | P1 | A | GREEN | LoadingSpinner: Native実装 | src/shared/components/loading-spinner.native.tsx | `ActivityIndicator` でスピナーが実装されること |
| T0173 | P1 | A | GREEN | LoadingSpinner: 再エクスポート | src/shared/components/loading-spinner.tsx | プラットフォームに応じた実装が使われること |
| T0174 | P1 | A | RED | Toast: Web表示テスト | src/shared/components/__tests__/toast.web.test.tsx | `role="alert"` を持つ toast が表示されること |
| T0175 | P1 | A | RED | Toast: Web自動消去テスト | src/shared/components/__tests__/toast.web.test.tsx | 3秒後に toast が非表示になること |
| T0176 | P1 | A | RED | Toast: Web success バリアントテスト | src/shared/components/__tests__/toast.web.test.tsx | `type="success"` で緑色が適用されること |
| T0177 | P1 | A | RED | Toast: Web error バリアントテスト | src/shared/components/__tests__/toast.web.test.tsx | `type="error"` で赤色が適用されること |
| T0178 | P1 | A | GREEN | Toast: Web実装 | src/shared/components/toast.web.tsx | position: fixed で右上に表示されるトースト通知が実装されること |
| T0179 | P1 | A | RED | Toast: Native テスト | src/shared/components/__tests__/toast.native.test.tsx | `ToastAndroid` または `Alert` が呼び出されること |
| T0180 | P1 | A | GREEN | Toast: Native実装 | src/shared/components/toast.native.tsx | プラットフォーム固有のトースト表示が実装されること |
| T0181 | P1 | A | GREEN | Toast: 再エクスポート | src/shared/components/toast.tsx | プラットフォームに応じた実装が使われること |
| T0182 | P1 | A | RED | Avatar: Web 画像表示テスト | src/shared/components/__tests__/avatar.web.test.tsx | `src` が設定されている場合に `<img>` タグが表示されること |
| T0183 | P1 | A | RED | Avatar: Web フォールバックテスト | src/shared/components/__tests__/avatar.web.test.tsx | 画像読み込みエラー時にイニシャルが表示されること |
| T0184 | P1 | A | RED | Avatar: 30種アイコンテスト | src/shared/components/__tests__/avatar.test.tsx | `icon_type` に30種すべてのアイコンが設定可能であること |
| T0185 | P1 | A | GREEN | Avatar: Web実装 | src/shared/components/avatar.web.tsx | 画像またはイニシャル表示のアバターが実装されること |
| T0186 | P1 | A | RED | Avatar: Native テスト | src/shared/components/__tests__/avatar.native.test.tsx | `Image` コンポーネントが使われること |
| T0187 | P1 | A | GREEN | Avatar: Native実装 | src/shared/components/avatar.native.tsx | RN Image でアバターが実装されること |
| T0188 | P1 | A | GREEN | Avatar: 再エクスポート | src/shared/components/avatar.tsx | プラットフォームに応じた実装が使われること |
| T0189 | P1 | A | RED | Badge: バッジ数値表示テスト | src/shared/components/__tests__/badge.web.test.tsx | `count={5}` で「5」が表示されること |
| T0190 | P1 | A | RED | Badge: 99+表示テスト | src/shared/components/__tests__/badge.web.test.tsx | `count={100}` で「99+」が表示されること |
| T0191 | P1 | A | GREEN | Badge: Web実装 | src/shared/components/badge.web.tsx | 数値バッジが実装されること |
| T0192 | P1 | A | RED | MarkdownRenderer: XSS サニタイズテスト | src/shared/components/__tests__/markdown-renderer.web.test.tsx | `<script>` タグが除去されること |
| T0193 | P1 | A | RED | MarkdownRenderer: コードブロックテスト | src/shared/components/__tests__/markdown-renderer.web.test.tsx | コードブロックがシンタックスハイライト付きで表示されること |
| T0194 | P1 | A | RED | MarkdownRenderer: リンクテスト | src/shared/components/__tests__/markdown-renderer.web.test.tsx | Markdown リンクが `<a target="_blank">` で表示されること |
| T0195 | P1 | A | GREEN | MarkdownRenderer: Web実装 | src/shared/components/markdown-renderer.web.tsx | DOMPurify でサニタイズされた marked.js レンダリングが実装されること |
| T0196 | P1 | A | RED | MarkdownRenderer: Native テスト | src/shared/components/__tests__/markdown-renderer.native.test.tsx | `react-native-markdown-display` が使われること |
| T0197 | P1 | A | GREEN | MarkdownRenderer: Native実装 | src/shared/components/markdown-renderer.native.tsx | RN Markdown レンダラーが実装されること |
| T0198 | P1 | A | GREEN | MarkdownRenderer: 再エクスポート | src/shared/components/markdown-renderer.tsx | プラットフォームに応じた実装が使われること |
| T0199 | P1 | A | RED | OfflineBanner: Web表示テスト | src/shared/components/__tests__/offline-banner.web.test.tsx | `navigator.onLine === false` 時にバナーが表示されること |
| T0200 | P1 | A | RED | OfflineBanner: Web非表示テスト | src/shared/components/__tests__/offline-banner.web.test.tsx | `navigator.onLine === true` 時にバナーが非表示であること |
| T0201 | P1 | A | GREEN | OfflineBanner: Web実装 | src/shared/components/offline-banner.web.tsx | `window.addEventListener('offline')` でオフライン検出が実装されること |
| T0202 | P1 | A | RED | OfflineBanner: Native テスト | src/shared/components/__tests__/offline-banner.native.test.tsx | `@react-native-community/netinfo` が使われること |
| T0203 | P1 | A | GREEN | OfflineBanner: Native実装 | src/shared/components/offline-banner.native.tsx | NetInfo でオフライン検出が実装されること |
| T0204 | P1 | A | GREEN | OfflineBanner: 再エクスポート | src/shared/components/offline-banner.tsx | プラットフォームに応じた実装が使われること |
| T0205 | P1 | A | RED | Input: Web フォーカス状態テスト | src/shared/components/__tests__/input.web.test.tsx | フォーカス時に `border-color: #00D4FF` が適用されること |
| T0206 | P1 | A | RED | Input: Web エラー状態テスト | src/shared/components/__tests__/input.web.test.tsx | `error` props 時に赤いボーダーとエラーメッセージが表示されること |
| T0207 | P1 | A | RED | Input: Web placeholder テスト | src/shared/components/__tests__/input.web.test.tsx | `placeholder` が表示されること |
| T0208 | P1 | A | GREEN | Input: Web実装 | src/shared/components/input.web.tsx | CSS スタイリング付き input コンポーネントが実装されること |
| T0209 | P1 | A | RED | Input: Native テスト | src/shared/components/__tests__/input.native.test.tsx | `TextInput` コンポーネントが使われること |
| T0210 | P1 | A | GREEN | Input: Native実装 | src/shared/components/input.native.tsx | RN TextInput でスタイリングされた入力欄が実装されること |
| T0211 | P1 | A | GREEN | Input: 再エクスポート | src/shared/components/input.tsx | プラットフォームに応じた実装が使われること |
| T0212 | P1 | A | RED | Modal: Web オーバーレイテスト | src/shared/components/__tests__/modal.web.test.tsx | モーダル外クリックで `onClose` が呼ばれること |
| T0213 | P1 | A | RED | Modal: Web Escape キーテスト | src/shared/components/__tests__/modal.web.test.tsx | Escape キー押下で `onClose` が呼ばれること |
| T0214 | P1 | A | RED | Modal: Web フォーカストラップテスト | src/shared/components/__tests__/modal.web.test.tsx | Tab キーがモーダル内でトラップされること |
| T0215 | P1 | A | RED | Modal: Web aria 属性テスト | src/shared/components/__tests__/modal.web.test.tsx | `role="dialog"`, `aria-modal="true"` が設定されること |
| T0216 | P1 | A | GREEN | Modal: Web実装 | src/shared/components/modal.web.tsx | focus-trap + keyboard-navigation 付きモーダルが実装されること |
| T0217 | P1 | A | RED | Modal: Native テスト | src/shared/components/__tests__/modal.native.test.tsx | `Modal` コンポーネントが使われること |
| T0218 | P1 | A | GREEN | Modal: Native実装 | src/shared/components/modal.native.tsx | RN Modal でモーダルが実装されること |
| T0219 | P1 | A | GREEN | Modal: 再エクスポート | src/shared/components/modal.tsx | プラットフォームに応じた実装が使われること |
| T0220 | P1 | A | RED | ProBadge: バッジ表示テスト | src/shared/components/__tests__/pro-badge.test.tsx | 「PRO」テキストとゴールドグラデーションが表示されること |
| T0221 | P1 | A | RED | ProBadge: ゲスト非表示テスト | src/shared/components/__tests__/pro-badge.test.tsx | Freeユーザーに PRO バッジが表示されないこと |
| T0222 | P1 | A | GREEN | ProBadge: 実装 | src/shared/components/pro-badge.tsx | `useSubscription()` を参照してPro表示/非表示が切り替わること |
| T0223 | P1 | A | RED | StatusIndicator: running 状態テスト | src/shared/components/__tests__/status-indicator.test.tsx | `status="running"` で緑の点が表示されること |
| T0224 | P1 | A | RED | StatusIndicator: error 状態テスト | src/shared/components/__tests__/status-indicator.test.tsx | `status="error"` で赤の点が表示されること |
| T0225 | P1 | A | RED | StatusIndicator: provisioning 状態テスト | src/shared/components/__tests__/status-indicator.test.tsx | `status="provisioning"` でパルスアニメーションが表示されること |
| T0226 | P1 | A | GREEN | StatusIndicator: 実装 | src/shared/components/status-indicator.tsx | OpenClaw インスタンス状態に応じたインジケーターが実装されること |
| T0227 | P1 | A | RED | EmptyState: 画像表示テスト | src/shared/components/__tests__/empty-state.test.tsx | EmptyState コンポーネントにイラストが表示されること |
| T0228 | P1 | A | RED | EmptyState: メッセージ表示テスト | src/shared/components/__tests__/empty-state.test.tsx | `message` props のテキストが表示されること |
| T0229 | P1 | A | RED | EmptyState: アクションボタンテスト | src/shared/components/__tests__/empty-state.test.tsx | `action` props がボタンとして表示されること |
| T0230 | P1 | A | GREEN | EmptyState: 実装 | src/shared/components/empty-state.tsx | 空状態UIが実装されること |
| T0231 | P1 | A | RED | ChatBubble: user メッセージテスト | src/shared/components/__tests__/chat-bubble.test.tsx | `role="user"` のメッセージが右寄りで青系背景になること |
| T0232 | P1 | A | RED | ChatBubble: assistant メッセージテスト | src/shared/components/__tests__/chat-bubble.test.tsx | `role="assistant"` のメッセージが左寄りでグラスモーフィズム背景になること |
| T0233 | P1 | A | RED | ChatBubble: タイムスタンプテスト | src/shared/components/__tests__/chat-bubble.test.tsx | メッセージ下部にタイムスタンプが表示されること |
| T0234 | P1 | A | RED | ChatBubble: streaming テスト | src/shared/components/__tests__/chat-bubble.test.tsx | `streaming={true}` 時にカーソルアニメーションが表示されること |
| T0235 | P1 | A | GREEN | ChatBubble: 実装 | src/shared/components/chat-bubble.tsx | チャットバブルUIが実装されること |
| T0236 | P1 | A | RED | ChatBubble: コピーボタンテスト | src/shared/components/__tests__/chat-bubble.web.test.tsx | hover 時にコピーボタンが表示されること |
| T0237 | P1 | A | RED | ChatBubble: Web コピー機能テスト | src/shared/components/__tests__/chat-bubble.web.test.tsx | コピーボタンクリックで `navigator.clipboard.writeText` が呼ばれること |
| T0238 | P1 | A | GREEN | ChatBubble: Web コピー実装 | src/shared/components/chat-bubble.web.tsx | Web専用コピーボタンが実装されること |
| T0239 | P1 | A | RED | InstanceStatusCard: provisioning 表示テスト | src/features/settings/components/__tests__/instance-status-card.test.tsx | provisioning 状態で「準備中...」が表示されること |
| T0240 | P1 | A | RED | InstanceStatusCard: running 表示テスト | src/features/settings/components/__tests__/instance-status-card.test.tsx | running 状態で「稼働中」と緑インジケーターが表示されること |
| T0241 | P1 | A | RED | InstanceStatusCard: error 表示テスト | src/features/settings/components/__tests__/instance-status-card.test.tsx | error 状態で「再試行」ボタンが表示されること |
| T0242 | P1 | A | RED | InstanceStatusCard: stopped 表示テスト | src/features/settings/components/__tests__/instance-status-card.test.tsx | stopped 状態でアップグレードCTAが表示されること |
| T0243 | P1 | A | GREEN | InstanceStatusCard: 実装 | src/features/settings/components/instance-status-card.tsx | OpenClaw インスタンス状態カードが実装されること |
| T0244 | P1 | A | RED | BigFiveChart: Web SVGテスト | src/features/insights/components/__tests__/big-five-chart.web.test.tsx | SVG バーチャートが5つの軸で表示されること |
| T0245 | P1 | A | RED | BigFiveChart: スコア表示テスト | src/features/insights/components/__tests__/big-five-chart.test.tsx | 各軸のスコア（0-100）が正しく表示されること |
| T0246 | P1 | A | RED | BigFiveChart: ラベル表示テスト | src/features/insights/components/__tests__/big-five-chart.test.tsx | 外向性/協調性/誠実性/神経症傾向/開放性のラベルが表示されること |
| T0247 | P1 | A | GREEN | BigFiveChart: 実装 | src/features/insights/components/big-five-chart.tsx | Big Five スコアバーチャートが実装されること |
| T0248 | P1 | A | RED | MoodEmoji: 5段階絵文字テスト | src/features/insights/components/__tests__/mood-emoji.test.tsx | great/good/neutral/bad/terrible の5段階が表示されること |
| T0249 | P1 | A | RED | MoodEmoji: 選択状態テスト | src/features/insights/components/__tests__/mood-emoji.test.tsx | 選択された気分にハイライトが付くこと |
| T0250 | P1 | A | GREEN | MoodEmoji: 実装 | src/features/insights/components/mood-emoji.tsx | 気分選択UIが実装されること |
| T0251 | P1 | A | RED | MoodChart: 7日間チャートテスト | src/features/insights/components/__tests__/mood-chart.web.test.tsx | 7日分の気分データがグラフ表示されること |
| T0252 | P1 | A | RED | MoodChart: 空データ表示テスト | src/features/insights/components/__tests__/mood-chart.test.tsx | データなしの場合「まだ記録がありません」が表示されること |
| T0253 | P1 | A | GREEN | MoodChart: Web SVG 実装 | src/features/insights/components/mood-chart.web.tsx | SVG折れ線グラフで7日間の気分が表示されること |
| T0254 | P1 | A | RED | OGPPreview: URLプレビューテスト | src/shared/components/__tests__/ogp-preview.web.test.tsx | OGPメタデータ取得後にタイトル・説明・画像が表示されること |
| T0255 | P1 | A | RED | OGPPreview: ローディングテスト | src/shared/components/__tests__/ogp-preview.web.test.tsx | データ取得中にスケルトンが表示されること |
| T0256 | P1 | A | GREEN | OGPPreview: Web実装 | src/shared/components/ogp-preview.web.tsx | OGPプレビューカードが実装されること |
| T0257 | P1 | C | RED | StreamingText: テキストストリーミングテスト | src/shared/components/__tests__/streaming-text.test.tsx | テキストが1文字ずつ追加表示されること |
| T0258 | P1 | C | GREEN | StreamingText: 実装 | src/shared/components/streaming-text.tsx | SSE/WebSocketのストリーミングテキスト表示が実装されること |
| T0259 | P1 | A | RED | PaywallBlur: Freeユーザー表示テスト | src/shared/components/__tests__/paywall-blur.test.tsx | Freeユーザーにぼかし効果とアップグレードCTAが表示されること |
| T0260 | P1 | A | RED | PaywallBlur: Proユーザー非表示テスト | src/shared/components/__tests__/paywall-blur.test.tsx | Proユーザーにぼかし効果が表示されないこと |
| T0261 | P1 | A | GREEN | PaywallBlur: 実装 | src/shared/components/paywall-blur.tsx | `useSubscription()` を参照してぼかし/クリア切り替えが実装されること |
| T0262 | P1 | A | RED | CommunityCard: コミュニティ情報表示テスト | src/features/community/components/__tests__/community-card.test.tsx | コミュニティ名・メンバー数・説明が表示されること |
| T0263 | P1 | A | RED | CommunityCard: サムネイル表示テスト | src/features/community/components/__tests__/community-card.test.tsx | 30種のサムネイル画像が正しく表示されること |
| T0264 | P1 | A | GREEN | CommunityCard: 実装 | src/features/community/components/community-card.tsx | コミュニティカードUIが実装されること |
| T0265 | P1 | A | RED | TwinConversationItem: 会話プレビューテスト | src/features/community/components/__tests__/twin-conversation-item.test.tsx | ツイン名・最新メッセージプレビュー・タイムスタンプが表示されること |
| T0266 | P1 | A | GREEN | TwinConversationItem: 実装 | src/features/community/components/twin-conversation-item.tsx | ツイン会話アイテムUIが実装されること |
| T0267 | P1 | A | RED | JournalCard: 日記エントリー表示テスト | src/features/journal/components/__tests__/journal-card.test.tsx | 日付・タイトル・本文プレビューが表示されること |
| T0268 | P1 | A | GREEN | JournalCard: 実装 | src/features/journal/components/journal-card.tsx | 日記カードUIが実装されること |
| T0269 | P1 | A | RED | SubscriptionBanner: トライアル残日数テスト | src/features/subscription/components/__tests__/subscription-banner.test.tsx | トライアル中に残り日数が表示されること |
| T0270 | P1 | A | GREEN | SubscriptionBanner: 実装 | src/features/subscription/components/subscription-banner.tsx | サブスクリプション状態バナーが実装されること |
| T0271 | P1 | A | RED | TopicTabBar: タブ表示テスト | src/features/chat/components/__tests__/topic-tab-bar.test.tsx | daily/work/reflection/consultation の4タブが表示されること |
| T0272 | P1 | A | RED | TopicTabBar: アクティブタブテスト | src/features/chat/components/__tests__/topic-tab-bar.test.tsx | 選択中タブがハイライト表示されること |
| T0273 | P1 | A | GREEN | TopicTabBar: 実装 | src/features/chat/components/topic-tab-bar.tsx | トピックタブバーが実装されること |
| T0274 | P1 | A | RED | MessageInputBar: Web テキスト入力テスト | src/features/chat/components/__tests__/message-input-bar.web.test.tsx | テキスト入力が `<textarea>` で実装されること |
| T0275 | P1 | A | RED | MessageInputBar: Web Enter 送信テスト | src/features/chat/components/__tests__/message-input-bar.web.test.tsx | Enter キーで送信、Shift+Enter で改行されること |
| T0276 | P1 | A | RED | MessageInputBar: Web ファイル添付テスト | src/features/chat/components/__tests__/message-input-bar.web.test.tsx | クリップアイコンでファイル選択ダイアログが開くこと |
| T0277 | P1 | A | RED | MessageInputBar: 文字数制限テスト (Free) | src/features/chat/components/__tests__/message-input-bar.test.tsx | Freeユーザーは1000文字制限でエラーが表示されること |
| T0278 | P1 | A | RED | MessageInputBar: 文字数制限テスト (Pro) | src/features/chat/components/__tests__/message-input-bar.test.tsx | Proユーザーは3000文字まで入力可能であること |
| T0279 | P1 | A | GREEN | MessageInputBar: Web実装 | src/features/chat/components/message-input-bar.web.tsx | Web用メッセージ入力バーが実装されること |
| T0280 | P1 | A | RED | MessageInputBar: Native テスト | src/features/chat/components/__tests__/message-input-bar.native.test.tsx | `TextInput` でメッセージ入力が実装されること |
| T0281 | P1 | A | GREEN | MessageInputBar: Native実装 | src/features/chat/components/message-input-bar.native.tsx | Native用メッセージ入力バーが実装されること |
| T0282 | P1 | A | GREEN | MessageInputBar: 再エクスポート | src/features/chat/components/message-input-bar.tsx | プラットフォームに応じた実装が使われること |
| T0283 | P1 | A | RED | PasteImageHandler: クリップボード画像テスト | src/features/chat/components/__tests__/paste-image-handler.web.test.tsx | Ctrl+V で画像ペーストが検出されること |
| T0284 | P1 | A | GREEN | PasteImageHandler: Web実装 | src/features/chat/components/paste-image-handler.web.tsx | `paste` イベントで画像ファイルが検出・アップロードされること |
| T0285 | P1 | A | RED | OnboardingProgressBar: 進捗表示テスト | src/features/onboarding/components/__tests__/progress-bar.test.tsx | 6ステップ中の現在位置が視覚的に表示されること |
| T0286 | P1 | A | GREEN | OnboardingProgressBar: 実装 | src/features/onboarding/components/progress-bar.tsx | オンボーディング進捗バーが実装されること |
| T0287 | P1 | A | RED | PersonalityQuizCard: 質問表示テスト | src/features/onboarding/components/__tests__/personality-quiz-card.test.tsx | 質問テキストと5段階の選択肢が表示されること |
| T0288 | P1 | A | GREEN | PersonalityQuizCard: 実装 | src/features/onboarding/components/personality-quiz-card.tsx | 性格診断質問カードが実装されること |
| T0289 | P1 | A | RED | AvatarSelector: 30種グリッドテスト | src/features/onboarding/components/__tests__/avatar-selector.test.tsx | 30種のアイコンがグリッド表示されること |
| T0290 | P1 | A | GREEN | AvatarSelector: 実装 | src/features/onboarding/components/avatar-selector.tsx | 30種アバターセレクターが実装されること |
| T0291 | P1 | A | RED | ToneSelector: 5パターンテスト | src/features/onboarding/components/__tests__/tone-selector.test.tsx | formal/casual/friendly/professional/playful の5パターンが選択可能であること |
| T0292 | P1 | A | GREEN | ToneSelector: 実装 | src/features/onboarding/components/tone-selector.tsx | 口調パターンセレクターが実装されること |
| T0293 | P1 | A | RED | StripeCheckoutButton: Web テスト | src/features/subscription/components/__tests__/stripe-checkout-button.web.test.tsx | クリックでStripe Checkoutセッションが開始されること |
| T0294 | P1 | A | GREEN | StripeCheckoutButton: Web実装 | src/features/subscription/components/stripe-checkout-button.web.tsx | Stripe Checkout リダイレクトボタンが実装されること |
| T0295 | P1 | B | RED | PaywallPriceCard: 月額表示テスト | src/features/subscription/components/__tests__/paywall-price-card.test.tsx | ¥4,980/月 が表示されること |
| T0296 | P1 | B | RED | PaywallPriceCard: 年額表示テスト | src/features/subscription/components/__tests__/paywall-price-card.test.tsx | ¥39,800/年（¥3,317/月換算、33%OFF）が表示されること |
| T0297 | P1 | B | RED | PaywallPriceCard: 初回限定年額テスト | src/features/subscription/components/__tests__/paywall-price-card.test.tsx | Web では初回限定年額（¥29,800）が非表示であること |
| T0298 | P1 | B | GREEN | PaywallPriceCard: 実装 | src/features/subscription/components/paywall-price-card.tsx | プラン価格カードが実装されること |
| T0299 | P1 | A | RED | MBTIBadge: 16タイプ表示テスト | src/features/insights/components/__tests__/mbti-badge.test.tsx | INTJ/ENFP 等16タイプが正しく表示されること |
| T0300 | P1 | A | GREEN | MBTIBadge: 実装 | src/features/insights/components/mbti-badge.tsx | MBTIバッジUIが実装されること |
| T0301 | P1 | A | RED | NotificationSettingRow: トグル表示テスト | src/features/settings/components/__tests__/notification-setting-row.test.tsx | ON/OFF トグルスイッチが表示されること |
| T0302 | P1 | A | GREEN | NotificationSettingRow: 実装 | src/features/settings/components/notification-setting-row.tsx | 通知設定行が実装されること |
| T0303 | P1 | A | RED | ProfileEditForm: バリデーションテスト | src/features/settings/components/__tests__/profile-edit-form.test.tsx | display_name が50文字を超えるとエラーが表示されること |
| T0304 | P1 | A | GREEN | ProfileEditForm: 実装 | src/features/settings/components/profile-edit-form.tsx | プロフィール編集フォームが実装されること |
| T0305 | P1 | A | RED | TwinNameForm: バリデーションテスト | src/features/settings/components/__tests__/twin-name-form.test.tsx | twin_name が20文字を超えるとエラーが表示されること |
| T0306 | P1 | A | GREEN | TwinNameForm: 実装 | src/features/settings/components/twin-name-form.tsx | ツイン名編集フォームが実装されること |
| T0307 | P1 | A | RED | MBTISelector: 16タイプグリッドテスト | src/features/settings/components/__tests__/mbti-selector.test.tsx | 16種のMBTIタイプがグリッド表示されること |
| T0308 | P1 | A | GREEN | MBTISelector: 実装 | src/features/settings/components/mbti-selector.tsx | MBTI選択UIが実装されること |
| T0309 | P1 | A | RED | DeleteAccountModal: 確認入力テスト | src/features/settings/components/__tests__/delete-account-modal.test.tsx | 「DELETE」と入力しないと削除ボタンが活性化しないこと |
| T0310 | P1 | A | GREEN | DeleteAccountModal: 実装 | src/features/settings/components/delete-account-modal.tsx | アカウント削除確認モーダルが実装されること |
| T0311 | P1 | A | RED | CommunityCreateForm: バリデーションテスト | src/features/community/components/__tests__/community-create-form.test.tsx | コミュニティ名が必須であること |
| T0312 | P1 | A | GREEN | CommunityCreateForm: 実装 | src/features/community/components/community-create-form.tsx | コミュニティ作成フォームが実装されること |
| T0313 | P1 | A | RED | ScrollToBottomFAB: 表示条件テスト | src/features/chat/components/__tests__/scroll-to-bottom-fab.test.tsx | スクロール位置が下から200px以上の場合にFABが表示されること |
| T0314 | P1 | A | GREEN | ScrollToBottomFAB: 実装 | src/features/chat/components/scroll-to-bottom-fab.tsx | スクロールFABが実装されること |
| T0315 | P1 | A | RED | UnreadBadge: 未読数テスト | src/features/chat/components/__tests__/unread-badge.test.tsx | 未読メッセージ数が赤バッジで表示されること |
| T0316 | P1 | A | GREEN | UnreadBadge: 実装 | src/features/chat/components/unread-badge.tsx | 未読バッジが実装されること |
| T0317 | P1 | A | RED | TokenUsageMeter: 使用量表示テスト | src/features/chat/components/__tests__/token-usage-meter.test.tsx | 使用済みトークン/上限トークンが表示されること |
| T0318 | P1 | A | GREEN | TokenUsageMeter: 実装 | src/features/chat/components/token-usage-meter.tsx | トークン使用量メーターが実装されること |
| T0319 | P1 | A | RED | ConnectionStatusBar: WebSocket接続状態テスト | src/features/chat/components/__tests__/connection-status-bar.test.tsx | WebSocket切断時に「再接続中...」バーが表示されること |
| T0320 | P1 | A | GREEN | ConnectionStatusBar: 実装 | src/features/chat/components/connection-status-bar.tsx | 接続状態バーが実装されること |
| T0321 | P1 | A | REFACTOR | 共通コンポーネント: Storybook ストーリー追加 | src/shared/components/*.stories.tsx | 全共通コンポーネントの Storybook ストーリーが作成されること |
| T0322 | P1 | A | REFACTOR | 共通コンポーネント: テストカバレッジ80%達成 | src/shared/components/__tests__/ | 全コンポーネントのテストカバレッジが80%以上であること |
| T0323 | P1 | A | RED | WebBreadcrumb: パンくずリストテスト | src/shared/components/__tests__/web-breadcrumb.web.test.tsx | ページ階層がパンくずリストで表示されること |
| T0324 | P1 | A | GREEN | WebBreadcrumb: Web実装 | src/shared/components/web-breadcrumb.web.tsx | aria-label="breadcrumb" のナビゲーションが実装されること |
| T0325 | P1 | A | RED | SkeletonLoader: 幅高さテスト | src/shared/components/__tests__/skeleton-loader.web.test.tsx | `width`, `height` props が適用されること |
| T0326 | P1 | A | RED | SkeletonLoader: アニメーションテスト | src/shared/components/__tests__/skeleton-loader.web.test.tsx | シマーアニメーションが定義されること |
| T0327 | P1 | A | GREEN | SkeletonLoader: 実装 | src/shared/components/skeleton-loader.tsx | スケルトンローダーが実装されること |
| T0328 | P1 | A | RED | Tooltip: ホバー表示テスト | src/shared/components/__tests__/tooltip.web.test.tsx | ホバー時にツールチップが表示されること |
| T0329 | P1 | A | GREEN | Tooltip: Web実装 | src/shared/components/tooltip.web.tsx | CSS ベースのツールチップが実装されること |
| T0330 | P1 | A | RED | KeyboardShortcutHint: ショートカット表示テスト | src/shared/components/__tests__/keyboard-shortcut-hint.web.test.tsx | `Ctrl+Enter` などのショートカットが表示されること |
| T0331 | P1 | A | GREEN | KeyboardShortcutHint: Web実装 | src/shared/components/keyboard-shortcut-hint.web.tsx | キーボードショートカットのヒントが実装されること |
| T0332 | P1 | A | RED | LanguageFilter: 言語選択テスト | src/features/community/components/__tests__/language-filter.test.tsx | jp/en のフィルタータブが表示されること |
| T0333 | P1 | A | GREEN | LanguageFilter: 実装 | src/features/community/components/language-filter.tsx | 言語フィルターUIが実装されること |
| T0334 | P1 | A | RED | CommunityThumbnailPicker: 30種テスト | src/features/community/components/__tests__/community-thumbnail-picker.test.tsx | 30種のサムネイルがグリッド表示されること |
| T0335 | P1 | A | GREEN | CommunityThumbnailPicker: 実装 | src/features/community/components/community-thumbnail-picker.tsx | コミュニティサムネイル選択UIが実装されること |
| T0336 | P1 | A | RED | CompatibilityScore: スコア表示テスト | src/features/community/components/__tests__/compatibility-score.test.tsx | Big Five 相性スコアが0-100で表示されること |
| T0337 | P1 | A | GREEN | CompatibilityScore: 実装 | src/features/community/components/compatibility-score.tsx | 相性スコアUIが実装されること |
| T0338 | P1 | A | RED | TranslationButton: 翻訳ボタンテスト | src/features/chat/components/__tests__/translation-button.test.tsx | 「翻訳」ボタンが存在し、クリックで翻訳が実行されること |
| T0339 | P1 | A | GREEN | TranslationButton: 実装 | src/features/chat/components/translation-button.tsx | ja↔en 翻訳ボタンが実装されること |
| T0340 | P1 | A | RED | JournalToggleButton: 日記連携テスト | src/features/chat/components/__tests__/journal-toggle-button.test.tsx | 「日記に保存」ボタンが表示されること |
| T0341 | P1 | A | GREEN | JournalToggleButton: 実装 | src/features/chat/components/journal-toggle-button.tsx | チャット→日記連携ボタンが実装されること |
| T0342 | P1 | A | RED | SOULMdPreview: Markdown表示テスト | src/features/settings/components/__tests__/soul-md-preview.test.tsx | SOUL.mdの内容がMarkdownレンダリングされること |
| T0343 | P1 | A | GREEN | SOULMdPreview: 実装 | src/features/settings/components/soul-md-preview.tsx | SOUL.mdプレビューが実装されること |
| T0344 | P1 | A | REFACTOR | 全共通コンポーネント: a11y 監査 | src/shared/components/ | axe-core で a11y エラーが0件であること |
| T0345 | P1 | A | REFACTOR | 全共通コンポーネント: Dark mode 対応 | src/shared/components/ | V4 Dark Premium テーマが全コンポーネントで適用されること |
| T0346 | P1 | A | RED | TwinOnlineIndicator: オンライン表示テスト | src/features/insights/components/__tests__/twin-online-indicator.test.tsx | running 状態時に緑のオンラインインジケーターが表示されること |
| T0347 | P1 | A | GREEN | TwinOnlineIndicator: 実装 | src/features/insights/components/twin-online-indicator.tsx | ツインのオンライン状態インジケーターが実装されること |
| T0348 | P1 | A | RED | ReconnectBanner: 再接続中バナーテスト | src/features/chat/components/__tests__/reconnect-banner.test.tsx | WebSocket切断時にバナーが表示されること |
| T0349 | P1 | A | GREEN | ReconnectBanner: 実装 | src/features/chat/components/reconnect-banner.tsx | 再接続中バナーが実装されること |
| T0350 | P1 | A | RED | ExponentialBackoffIndicator: リトライ表示テスト | src/features/chat/components/__tests__/exponential-backoff-indicator.test.tsx | リトライ試行回数と次回試行までの時間が表示されること |
| T0351 | P1 | A | GREEN | ExponentialBackoffIndicator: 実装 | src/features/chat/components/exponential-backoff-indicator.tsx | バックオフインジケーターが実装されること |
| T0352 | P1 | A | RED | PageTitle: SEOタイトル設定テスト | src/shared/components/__tests__/page-title.web.test.tsx | `document.title` が設定されること |
| T0353 | P1 | A | GREEN | PageTitle: Web実装 | src/shared/components/page-title.web.tsx | `<title>` タグを更新するコンポーネントが実装されること |
| T0354 | P1 | A | RED | PWAInstallPrompt: インストールバナーテスト | src/shared/components/__tests__/pwa-install-prompt.web.test.tsx | `beforeinstallprompt` イベント時にインストールバナーが表示されること |
| T0355 | P1 | A | GREEN | PWAInstallPrompt: Web実装 | src/shared/components/pwa-install-prompt.web.tsx | PWAインストールプロンプトが実装されること |
| T0356 | P1 | A | RED | WebShareButton: シェアテスト | src/shared/components/__tests__/web-share-button.web.test.tsx | `navigator.share()` が呼び出されること |
| T0357 | P1 | A | GREEN | WebShareButton: Web実装 | src/shared/components/web-share-button.web.tsx | Web Share API 対応シェアボタンが実装されること |
| T0358 | P1 | A | RED | InfiniteScrollList: Web スクロールテスト | src/shared/components/__tests__/infinite-scroll-list.web.test.tsx | リスト最下部スクロール時に `onLoadMore` が呼ばれること |
| T0359 | P1 | A | RED | InfiniteScrollList: 50件ページネーションテスト | src/shared/components/__tests__/infinite-scroll-list.test.tsx | 50件ずつページネーションされること |
| T0360 | P1 | A | GREEN | InfiniteScrollList: Web実装 | src/shared/components/infinite-scroll-list.web.tsx | Intersection Observer で無限スクロールが実装されること |
| T0361 | P1 | A | RED | InfiniteScrollList: Native テスト | src/shared/components/__tests__/infinite-scroll-list.native.test.tsx | `FlashList` の `onEndReached` が使われること |
| T0362 | P1 | A | GREEN | InfiniteScrollList: Native実装 | src/shared/components/infinite-scroll-list.native.tsx | FlashList で無限スクロールが実装されること |
| T0363 | P1 | A | GREEN | InfiniteScrollList: 再エクスポート | src/shared/components/infinite-scroll-list.tsx | プラットフォームに応じた実装が使われること |
| T0364 | P1 | A | REFACTOR | 全共通コンポーネント: Storybook 完成 | src/shared/components/*.stories.tsx | 全コンポーネントのインタラクティブストーリーが作成されること |
| T0365 | P1 | A | REFACTOR | 全共通コンポーネント: パフォーマンス最適化 | src/shared/components/ | `React.memo` で不要な再レンダリングが防止されること |
| T0366 | P1 | A | RED | GlassCard: モバイルブレークポイントパディングテスト | src/shared/components/__tests__/glass-card.web.test.tsx | モバイル幅で padding: 16px が適用されること |
| T0367 | P1 | A | RED | GlassCard: デスクトップブレークポイントパディングテスト | src/shared/components/__tests__/glass-card.web.test.tsx | デスクトップ幅で padding: 24px が適用されること |
| T0368 | P1 | A | GREEN | GlassCard: レスポンシブパディング実装 | src/shared/components/glass-card.web.tsx | ブレークポイントに応じたパディングが実装されること |
| T0369 | P1 | A | RED | WebSidebar: モバイル非表示テスト | src/shared/components/__tests__/web-sidebar.web.test.tsx | 768px 未満でサイドバーが非表示になること |
| T0370 | P1 | A | GREEN | WebSidebar: モバイルレスポンシブ実装 | src/shared/components/web-sidebar.web.tsx | CSS `@media (max-width: 768px)` でサイドバーが非表示になること |
| T0371 | P1 | A | RED | MobileFab: モバイルナビゲーションテスト | src/shared/components/__tests__/mobile-fab.web.test.tsx | モバイル幅でボトムナビバーが表示されること |
| T0372 | P1 | A | GREEN | MobileFab: 実装 | src/shared/components/mobile-fab.web.tsx | モバイルでのボトムナビゲーションが実装されること |
| T0373 | P1 | A | RED | PhotoPreview: アップロード前プレビューテスト | src/features/chat/components/__tests__/photo-preview.test.tsx | 選択画像のプレビューが表示されること |
| T0374 | P1 | A | GREEN | PhotoPreview: 実装 | src/features/chat/components/photo-preview.tsx | 画像プレビューコンポーネントが実装されること |
| T0375 | P1 | A | RED | VideoPreview: 動画プレビューテスト | src/features/chat/components/__tests__/video-preview.web.test.tsx | 選択動画の `<video>` プレビューが表示されること |
| T0376 | P1 | A | GREEN | VideoPreview: Web実装 | src/features/chat/components/video-preview.web.tsx | HTML5 video タグで動画プレビューが実装されること |
| T0377 | P1 | A | RED | AudioPlayer: Web再生テスト | src/features/chat/components/__tests__/audio-player.web.test.tsx | `<audio>` タグで音声再生コントロールが表示されること |
| T0378 | P1 | A | GREEN | AudioPlayer: Web実装 | src/features/chat/components/audio-player.web.tsx | HTML5 audio タグで音声プレイヤーが実装されること |
| T0379 | P1 | A | RED | AttachmentPreview: ファイルタイプ判定テスト | src/features/chat/components/__tests__/attachment-preview.test.tsx | image/video/audio で異なるプレビューコンポーネントが表示されること |
| T0380 | P1 | A | GREEN | AttachmentPreview: 実装 | src/features/chat/components/attachment-preview.tsx | 添付ファイルプレビューコンポーネントが実装されること |
| T0381 | P1 | A | RED | GlobalLoadingOverlay: 全画面ローディングテスト | src/shared/components/__tests__/global-loading-overlay.test.tsx | `isLoading={true}` で全画面ローディングが表示されること |
| T0382 | P1 | A | GREEN | GlobalLoadingOverlay: 実装 | src/shared/components/global-loading-overlay.tsx | 全画面ローディングオーバーレイが実装されること |
| T0383 | P1 | A | RED | SplashScreen: 認証チェック中表示テスト | src/shared/components/__tests__/splash-screen.test.tsx | 認証チェック中にスプラッシュ画面が表示されること |
| T0384 | P1 | A | GREEN | SplashScreen: 実装 | src/shared/components/splash-screen.tsx | スプラッシュ画面が実装されること |
| T0385 | P1 | A | RED | ErrorMessage: エラーメッセージ表示テスト | src/shared/components/__tests__/error-message.test.tsx | `message` props がエラースタイルで表示されること |
| T0386 | P1 | A | GREEN | ErrorMessage: 実装 | src/shared/components/error-message.tsx | エラーメッセージコンポーネントが実装されること |
| T0387 | P1 | A | RED | SuccessMessage: 成功メッセージ表示テスト | src/shared/components/__tests__/success-message.test.tsx | `message` props が成功スタイルで表示されること |
| T0388 | P1 | A | GREEN | SuccessMessage: 実装 | src/shared/components/success-message.tsx | 成功メッセージコンポーネントが実装されること |
| T0389 | P1 | A | RED | ConfirmDialog: 確認ダイアログテスト | src/shared/components/__tests__/confirm-dialog.test.tsx | 「確認」「キャンセル」ボタンが表示されること |
| T0390 | P1 | A | GREEN | ConfirmDialog: 実装 | src/shared/components/confirm-dialog.tsx | 確認ダイアログが実装されること |
| T0391 | P1 | A | RED | WebHeader: ヘッダー表示テスト | src/shared/components/__tests__/web-header.web.test.tsx | Web でページタイトルとアクションボタンが表示されること |
| T0392 | P1 | A | GREEN | WebHeader: Web実装 | src/shared/components/web-header.web.tsx | Web 用ヘッダーコンポーネントが実装されること |
| T0393 | P1 | A | RED | TwinProfileCard: プロフィール表示テスト | src/features/insights/components/__tests__/twin-profile-card.test.tsx | ツイン名・アバター・MBTIが表示されること |
| T0394 | P1 | A | GREEN | TwinProfileCard: 実装 | src/features/insights/components/twin-profile-card.tsx | ツインプロフィールカードが実装されること |
| T0395 | P1 | A | RED | ReDoPersonalityButton: 診断やり直しテスト | src/features/insights/components/__tests__/redo-personality-button.test.tsx | 「診断をやり直す」ボタンがオンボーディングに遷移すること |
| T0396 | P1 | A | GREEN | ReDoPersonalityButton: 実装 | src/features/insights/components/redo-personality-button.tsx | 診断やり直しボタンが実装されること |
| T0397 | P1 | A | RED | SupabasePortalLink: Stripeポータルリンクテスト | src/features/settings/components/__tests__/stripe-portal-link.web.test.tsx | Web で「サブスクリプション管理」がStripeポータルにリンクされること |
| T0398 | P1 | A | GREEN | SupabasePortalLink: 実装 | src/features/settings/components/stripe-portal-link.web.tsx | Web 用 Stripe ポータルリンクが実装されること |
| T0399 | P1 | A | RED | AppStoreLink: Native用ストアリンクテスト | src/features/settings/components/__tests__/app-store-link.native.test.tsx | Native で App Store へのリンクが表示されること |
| T0400 | P1 | A | GREEN | AppStoreLink: Native実装 | src/features/settings/components/app-store-link.native.tsx | Native 用 App Store リンクが実装されること |


---

## C. Hooks×プラットフォーム（~250タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T0401 | P1 | A | RED | useResponsive: mobile判定テスト | src/shared/hooks/__tests__/use-responsive.web.test.ts | window幅 < 768px で `isMobile: true` が返されること |
| T0402 | P1 | A | RED | useResponsive: tablet判定テスト | src/shared/hooks/__tests__/use-responsive.web.test.ts | window幅 768-1023px で `isTablet: true` が返されること |
| T0403 | P1 | A | RED | useResponsive: desktop判定テスト | src/shared/hooks/__tests__/use-responsive.web.test.ts | window幅 1024-1439px で `isDesktop: true` が返されること |
| T0404 | P1 | A | RED | useResponsive: wide判定テスト | src/shared/hooks/__tests__/use-responsive.web.test.ts | window幅 ≥ 1440px で `isWide: true` が返されること |
| T0405 | P1 | A | RED | useResponsive: resize イベントテスト | src/shared/hooks/__tests__/use-responsive.web.test.ts | window リサイズ時に breakpoint が更新されること |
| T0406 | P1 | A | GREEN | useResponsive: Web実装 | src/shared/hooks/use-responsive.web.ts | `window.innerWidth` でブレークポイントを計算する hook が実装されること |
| T0407 | P1 | A | RED | useResponsive: Native テスト | src/shared/hooks/__tests__/use-responsive.native.test.ts | `useWindowDimensions` でブレークポイントが計算されること |
| T0408 | P1 | A | GREEN | useResponsive: Native実装 | src/shared/hooks/use-responsive.native.ts | `useWindowDimensions` ベースの hook が実装されること |
| T0409 | P1 | A | GREEN | useResponsive: 再エクスポート | src/shared/hooks/use-responsive.ts | プラットフォームに応じた実装が使われること |
| T0410 | P1 | A | RED | useNetwork: Web オフライン検出テスト | src/shared/hooks/__tests__/use-network.web.test.ts | `navigator.onLine` が `false` 時に `isOnline: false` が返されること |
| T0411 | P1 | A | RED | useNetwork: Web 再接続検出テスト | src/shared/hooks/__tests__/use-network.web.test.ts | `online` イベント発火で `isOnline: true` に更新されること |
| T0412 | P1 | A | GREEN | useNetwork: Web実装 | src/shared/hooks/use-network.web.ts | `window.addEventListener('offline'/'online')` でネットワーク状態を監視する hook が実装されること |
| T0413 | P1 | A | RED | useNetwork: Native テスト | src/shared/hooks/__tests__/use-network.native.test.ts | NetInfo `addEventListener` で接続状態が監視されること |
| T0414 | P1 | A | GREEN | useNetwork: Native実装 | src/shared/hooks/use-network.native.ts | `@react-native-community/netinfo` ベースの hook が実装されること |
| T0415 | P1 | A | GREEN | useNetwork: 再エクスポート | src/shared/hooks/use-network.ts | プラットフォームに応じた実装が使われること |
| T0416 | P1 | B | RED | useSubscription: Pro判定テスト | src/shared/hooks/__tests__/use-subscription.test.ts | `isPro: true` が Pro Entitlement 保持時に返されること |
| T0417 | P1 | B | RED | useSubscription: Free判定テスト | src/shared/hooks/__tests__/use-subscription.test.ts | Entitlement なしで `isPro: false` が返されること |
| T0418 | P1 | B | RED | useSubscription: トライアル判定テスト | src/shared/hooks/__tests__/use-subscription.test.ts | トライアル中に `isTrialing: true` が返されること |
| T0419 | P1 | B | RED | useSubscription: 期限日テスト | src/shared/hooks/__tests__/use-subscription.test.ts | `expirationDate` が ISO 形式で返されること |
| T0420 | P1 | B | GREEN | useSubscription: Web実装 | src/shared/hooks/use-subscription.web.ts | Supabase DB から購読状態を取得する hook が実装されること |
| T0421 | P1 | B | RED | useSubscription: Native テスト | src/shared/hooks/__tests__/use-subscription.native.test.ts | RevenueCat SDK から Entitlement が取得されること |
| T0422 | P1 | B | GREEN | useSubscription: Native実装 | src/shared/hooks/use-subscription.native.ts | RevenueCat SDK ベースの hook が実装されること |
| T0423 | P1 | B | GREEN | useSubscription: 再エクスポート | src/shared/hooks/use-subscription.ts | プラットフォームに応じた実装が使われること |
| T0424 | P1 | C | RED | useChat: メッセージ送信テスト | src/features/chat/hooks/__tests__/use-chat.test.ts | `sendMessage('hello')` でメッセージが追加されること |
| T0425 | P1 | C | RED | useChat: SSEストリーミングテスト | src/features/chat/hooks/__tests__/use-chat.test.ts | SSE でトークンが順次受信されること |
| T0426 | P1 | C | RED | useChat: トピック切替テスト | src/features/chat/hooks/__tests__/use-chat.test.ts | `switchTopic('work')` でトピックが変更されること |
| T0427 | P1 | C | RED | useChat: ページネーションテスト | src/features/chat/hooks/__tests__/use-chat.test.ts | `loadMore()` で過去50件が追加ロードされること |
| T0428 | P1 | C | RED | useChat: WebSocket Pro チャットテスト | src/features/chat/hooks/__tests__/use-chat.test.ts | Pro ユーザーで WebSocket が使用されること |
| T0429 | P1 | C | RED | useChat: 未読更新テスト | src/features/chat/hooks/__tests__/use-chat.test.ts | 新着メッセージで `unreadCount` が増加すること |
| T0430 | P1 | C | GREEN | useChat: 実装 | src/features/chat/hooks/use-chat.ts | SSE/WebSocket 切替、ページネーション付きチャット hook が実装されること |
| T0431 | P1 | A | RED | useAuthGuard: 未認証リダイレクトテスト | src/shared/hooks/__tests__/use-auth-guard.test.ts | 未認証時に `/login` へリダイレクトされること |
| T0432 | P1 | A | RED | useAuthGuard: OB未完了リダイレクトテスト | src/shared/hooks/__tests__/use-auth-guard.test.ts | オンボーディング未完了時に `/onboarding/welcome` へリダイレクトされること |
| T0433 | P1 | A | GREEN | useAuthGuard: 実装 | src/shared/hooks/use-auth-guard.ts | 認証・OB状態に応じたルーティングガード hook が実装されること |
| T0434 | P1 | A | RED | useGuestMode: ゲストモード判定テスト | src/shared/hooks/__tests__/use-guest-mode.test.ts | `isGuest: true` 時に `GuestPromptOverlay` が表示されるべきフラグが返されること |
| T0435 | P1 | A | GREEN | useGuestMode: 実装 | src/shared/hooks/use-guest-mode.ts | `auth-store` の `isGuest` を参照する hook が実装されること |
| T0436 | P1 | D | RED | useCommunities: コミュニティ一覧取得テスト | src/features/community/hooks/__tests__/use-communities.test.ts | コミュニティ一覧が Supabase から取得されること |
| T0437 | P1 | D | RED | useCommunities: 言語フィルターテスト | src/features/community/hooks/__tests__/use-communities.test.ts | `filter='jp'` で日本語コミュニティのみが返されること |
| T0438 | P1 | D | RED | useCommunities: 検索テスト | src/features/community/hooks/__tests__/use-communities.test.ts | `query` パラメーターでコミュニティ名検索が機能すること |
| T0439 | P1 | D | GREEN | useCommunities: 実装 | src/features/community/hooks/use-communities.ts | コミュニティ一覧取得 hook が実装されること |
| T0440 | P1 | D | RED | useCommunityDetail: 詳細取得テスト | src/features/community/hooks/__tests__/use-community-detail.test.ts | `communityId` でコミュニティ詳細が取得されること |
| T0441 | P1 | D | RED | useCommunityDetail: ツイン会話一覧テスト | src/features/community/hooks/__tests__/use-community-detail.test.ts | コミュニティのツイン会話一覧が取得されること |
| T0442 | P1 | D | GREEN | useCommunityDetail: 実装 | src/features/community/hooks/use-community-detail.ts | コミュニティ詳細取得 hook が実装されること |
| T0443 | P1 | D | RED | useCommunityMembership: 参加状態テスト | src/features/community/hooks/__tests__/use-community-membership.test.ts | `isMember: true/false` が返されること |
| T0444 | P1 | D | RED | useCommunityMembership: 参加/退会テスト | src/features/community/hooks/__tests__/use-community-membership.test.ts | `join()`, `leave()` でメンバーシップが変更されること |
| T0445 | P1 | D | GREEN | useCommunityMembership: 実装 | src/features/community/hooks/use-community-membership.ts | コミュニティ参加/退会 hook が実装されること |
| T0446 | P1 | D | RED | useTwinData: ツインプロフィール取得テスト | src/features/insights/hooks/__tests__/use-twin-data.test.ts | ツインのプロフィール・Big Five が取得されること |
| T0447 | P1 | D | RED | useTwinData: インスタンス状態取得テスト | src/features/insights/hooks/__tests__/use-twin-data.test.ts | OpenClaw インスタンス状態が取得されること |
| T0448 | P1 | D | GREEN | useTwinData: 実装 | src/features/insights/hooks/use-twin-data.ts | ツイン情報取得 hook が実装されること |
| T0449 | P1 | D | RED | useMoodRecords: 気分記録取得テスト | src/features/insights/hooks/__tests__/use-mood-records.test.ts | 7日間の気分記録が取得されること |
| T0450 | P1 | D | RED | useMoodRecords: 気分記録追加テスト | src/features/insights/hooks/__tests__/use-mood-records.test.ts | `addMood('great')` で mood_records にレコードが追加されること |
| T0451 | P1 | D | GREEN | useMoodRecords: 実装 | src/features/insights/hooks/use-mood-records.ts | 気分記録CRUD hook が実装されること |
| T0452 | P1 | C | RED | useKeyboardShortcuts: Enter 送信テスト | src/features/chat/hooks/__tests__/use-keyboard-shortcuts.web.test.ts | Ctrl+Enter で `onSubmit` が呼ばれること |
| T0453 | P1 | C | RED | useKeyboardShortcuts: Escape クリアテスト | src/features/chat/hooks/__tests__/use-keyboard-shortcuts.web.test.ts | Escape で入力がクリアされること |
| T0454 | P1 | C | GREEN | useKeyboardShortcuts: Web実装 | src/features/chat/hooks/use-keyboard-shortcuts.web.ts | キーボードショートカット処理 hook が実装されること |
| T0455 | P1 | C | RED | useClipboardPaste: 画像ペースト検出テスト | src/features/chat/hooks/__tests__/use-clipboard-paste.web.test.ts | `paste` イベントで画像が検出されること |
| T0456 | P1 | C | GREEN | useClipboardPaste: Web実装 | src/features/chat/hooks/use-clipboard-paste.web.ts | クリップボード画像ペースト hook が実装されること |
| T0457 | P1 | A | RED | usePageTitle: タイトル設定テスト | src/shared/hooks/__tests__/use-page-title.web.test.ts | `document.title` が `AltMe - {title}` 形式で設定されること |
| T0458 | P1 | A | GREEN | usePageTitle: Web実装 | src/shared/hooks/use-page-title.web.ts | ページタイトル管理 hook が実装されること |
| T0459 | P1 | B | RED | usePlatformSubscription: Web Stripe テスト | src/features/subscription/hooks/__tests__/use-platform-subscription.web.test.ts | Web で `openStripeCheckout()` が提供されること |
| T0460 | P1 | B | RED | usePlatformSubscription: Native RC テスト | src/features/subscription/hooks/__tests__/use-platform-subscription.native.test.ts | Native で `purchasePackage()` が提供されること |
| T0461 | P1 | B | GREEN | usePlatformSubscription: Web実装 | src/features/subscription/hooks/use-platform-subscription.web.ts | Stripe Checkout hook が実装されること |
| T0462 | P1 | B | GREEN | usePlatformSubscription: Native実装 | src/features/subscription/hooks/use-platform-subscription.native.ts | RevenueCat 購入 hook が実装されること |
| T0463 | P1 | B | GREEN | usePlatformSubscription: 再エクスポート | src/features/subscription/hooks/use-platform-subscription.ts | プラットフォームに応じた実装が使われること |
| T0464 | P1 | C | RED | useWebSocket: 接続テスト | src/services/openclaw/hooks/__tests__/use-websocket.test.ts | `connect()` で WebSocket 接続が確立されること |
| T0465 | P1 | C | RED | useWebSocket: メッセージ受信テスト | src/services/openclaw/hooks/__tests__/use-websocket.test.ts | WebSocket メッセージ受信時に `onMessage` コールバックが呼ばれること |
| T0466 | P1 | C | RED | useWebSocket: 切断テスト | src/services/openclaw/hooks/__tests__/use-websocket.test.ts | `disconnect()` で WebSocket が切断されること |
| T0467 | P1 | C | RED | useWebSocket: 指数バックオフ再接続テスト | src/services/openclaw/hooks/__tests__/use-websocket.test.ts | 切断後に 1s→2s→4s のバックオフで再接続されること |
| T0468 | P1 | C | RED | useWebSocket: 最大再試行10回テスト | src/services/openclaw/hooks/__tests__/use-websocket.test.ts | 10回再試行後に `onMaxRetries` が呼ばれること |
| T0469 | P1 | C | GREEN | useWebSocket: 実装 | src/services/openclaw/hooks/use-websocket.ts | 指数バックオフ付き WebSocket hook が実装されること |
| T0470 | P1 | A | RED | useProfile: プロフィール取得テスト | src/features/settings/hooks/__tests__/use-profile.test.ts | 認証済みユーザーのプロフィールが取得されること |
| T0471 | P1 | A | RED | useProfile: プロフィール更新テスト | src/features/settings/hooks/__tests__/use-profile.test.ts | `updateProfile()` で profiles テーブルが更新されること |
| T0472 | P1 | A | GREEN | useProfile: 実装 | src/features/settings/hooks/use-profile.ts | プロフィール取得・更新 hook が実装されること |
| T0473 | P1 | D | RED | useOpenClawInstance: インスタンス取得テスト | src/features/settings/hooks/__tests__/use-openclaw-instance.test.ts | `openclaw_instances` テーブルからインスタンス情報が取得されること |
| T0474 | P1 | D | RED | useOpenClawInstance: リアルタイム更新テスト | src/features/settings/hooks/__tests__/use-openclaw-instance.test.ts | Supabase Realtime でインスタンス状態変化が即座に反映されること |
| T0475 | P1 | D | RED | useOpenClawInstance: 再試行テスト | src/features/settings/hooks/__tests__/use-openclaw-instance.test.ts | `retry()` で provision-openclaw Edge Function が呼ばれること |
| T0476 | P1 | D | GREEN | useOpenClawInstance: 実装 | src/features/settings/hooks/use-openclaw-instance.ts | OpenClaw インスタンス管理 hook が実装されること |
| T0477 | P1 | D | RED | useNotificationSettings: 設定取得テスト | src/features/settings/hooks/__tests__/use-notification-settings.test.ts | `notification_settings` テーブルから設定が取得されること |
| T0478 | P1 | D | RED | useNotificationSettings: 設定更新テスト | src/features/settings/hooks/__tests__/use-notification-settings.test.ts | `updateSetting()` でDB設定が更新されること |
| T0479 | P1 | D | GREEN | useNotificationSettings: 実装 | src/features/settings/hooks/use-notification-settings.ts | 通知設定CRUD hook が実装されること |
| T0480 | P1 | D | RED | useJournalEntries: 日記一覧取得テスト | src/features/journal/hooks/__tests__/use-journal-entries.test.ts | `journal_entries` テーブルから日記一覧が取得されること |
| T0481 | P1 | D | RED | useJournalEntries: 日記作成テスト | src/features/journal/hooks/__tests__/use-journal-entries.test.ts | `createEntry()` で新しい日記エントリーが作成されること |
| T0482 | P1 | D | RED | useJournalEntries: 日記更新テスト | src/features/journal/hooks/__tests__/use-journal-entries.test.ts | `updateEntry()` で日記内容が更新されること |
| T0483 | P1 | D | RED | useJournalEntries: 日記削除テスト | src/features/journal/hooks/__tests__/use-journal-entries.test.ts | `deleteEntry()` で日記エントリーが削除されること |
| T0484 | P1 | D | GREEN | useJournalEntries: 実装 | src/features/journal/hooks/use-journal-entries.ts | 日記エントリーCRUD hook が実装されること |
| T0485 | P1 | A | RED | useTokenUsage: 使用量取得テスト | src/features/chat/hooks/__tests__/use-token-usage.test.ts | `token_usage` テーブルから使用量が取得されること |
| T0486 | P1 | A | RED | useTokenUsage: Free上限テスト | src/features/chat/hooks/__tests__/use-token-usage.test.ts | Free ユーザーで上限 10,000 トークンが返されること |
| T0487 | P1 | A | RED | useTokenUsage: Pro上限テスト | src/features/chat/hooks/__tests__/use-token-usage.test.ts | Pro ユーザーで上限 500,000 トークンが返されること |
| T0488 | P1 | A | GREEN | useTokenUsage: 実装 | src/features/chat/hooks/use-token-usage.ts | トークン使用量取得 hook が実装されること |
| T0489 | P1 | A | RED | useScrollToBottom: スクロール位置テスト | src/features/chat/hooks/__tests__/use-scroll-to-bottom.test.ts | `shouldShow: true` がリスト最下部から 200px 以上の時に返されること |
| T0490 | P1 | A | RED | useScrollToBottom: スクロール実行テスト | src/features/chat/hooks/__tests__/use-scroll-to-bottom.test.ts | `scrollToBottom()` でリスト最下部にスクロールされること |
| T0491 | P1 | A | GREEN | useScrollToBottom: 実装 | src/features/chat/hooks/use-scroll-to-bottom.ts | スクロールtoボトム hook が実装されること |
| T0492 | P1 | C | RED | useSSEChat: SSEストリーム開始テスト | src/features/chat/hooks/__tests__/use-sse-chat.test.ts | `EventSource` が `free-chat` Edge Function に接続されること |
| T0493 | P1 | C | RED | useSSEChat: トークンストリーミングテスト | src/features/chat/hooks/__tests__/use-sse-chat.test.ts | SSE `message` イベントでトークンが順次追加されること |
| T0494 | P1 | C | RED | useSSEChat: 完了イベントテスト | src/features/chat/hooks/__tests__/use-sse-chat.test.ts | `done` イベントでストリーミングが終了すること |
| T0495 | P1 | C | RED | useSSEChat: エラーハンドリングテスト | src/features/chat/hooks/__tests__/use-sse-chat.test.ts | SSE エラー時に `onError` が呼ばれること |
| T0496 | P1 | C | GREEN | useSSEChat: 実装 | src/features/chat/hooks/use-sse-chat.ts | SSE ベースのチャット hook が実装されること |
| T0497 | P1 | C | RED | useWebSocketChat: メッセージ送受信テスト | src/features/chat/hooks/__tests__/use-websocket-chat.test.ts | WebSocket 経由でメッセージが送受信されること |
| T0498 | P1 | C | RED | useWebSocketChat: 接続管理テスト | src/features/chat/hooks/__tests__/use-websocket-chat.test.ts | コンポーネントアンマウント時に WebSocket が切断されること |
| T0499 | P1 | C | GREEN | useWebSocketChat: 実装 | src/features/chat/hooks/use-websocket-chat.ts | WebSocket ベースのチャット hook が実装されること |
| T0500 | P1 | C | RED | useTranslation: ja→en 翻訳テスト | src/features/chat/hooks/__tests__/use-translation.test.ts | `translate('こんにちは', 'en')` で英語翻訳が返されること |
| T0501 | P1 | C | RED | useTranslation: en→ja 翻訳テスト | src/features/chat/hooks/__tests__/use-translation.test.ts | `translate('Hello', 'ja')` で日本語翻訳が返されること |
| T0502 | P1 | C | GREEN | useTranslation: 実装 | src/features/chat/hooks/use-translation.ts | 翻訳 Edge Function を呼び出す hook が実装されること |
| T0503 | P1 | B | RED | useStripeCheckout: セッション作成テスト | src/features/subscription/hooks/__tests__/use-stripe-checkout.web.test.ts | `createCheckoutSession()` で Stripe Checkout セッションが作成されること |
| T0504 | P1 | B | RED | useStripeCheckout: リダイレクトテスト | src/features/subscription/hooks/__tests__/use-stripe-checkout.web.test.ts | セッション作成後に Stripe Checkout URL へリダイレクトされること |
| T0505 | P1 | B | GREEN | useStripeCheckout: Web実装 | src/features/subscription/hooks/use-stripe-checkout.web.ts | Stripe Checkout セッション作成・リダイレクト hook が実装されること |
| T0506 | P1 | B | RED | useRestorePurchases: 購入復元テスト | src/features/subscription/hooks/__tests__/use-restore-purchases.native.test.ts | `restore()` で RevenueCat 購入が復元されること |
| T0507 | P1 | B | GREEN | useRestorePurchases: Native実装 | src/features/subscription/hooks/use-restore-purchases.native.ts | 購入復元 hook が実装されること |
| T0508 | P1 | A | RED | useOGPPreview: URL解析テスト | src/shared/hooks/__tests__/use-ogp-preview.web.test.ts | URL から OGP メタデータが取得されること |
| T0509 | P1 | A | RED | useOGPPreview: キャッシュテスト | src/shared/hooks/__tests__/use-ogp-preview.web.test.ts | 同じURLで2回目は API 呼び出しなしでキャッシュが返されること |
| T0510 | P1 | A | GREEN | useOGPPreview: Web実装 | src/shared/hooks/use-ogp-preview.web.ts | OGP プレビュー取得 hook が実装されること |
| T0511 | P1 | A | RED | useAuthState: セッション取得テスト | src/features/auth/hooks/__tests__/use-auth-state.test.ts | `session` が Supabase Auth から取得されること |
| T0512 | P1 | A | RED | useAuthState: onAuthStateChange テスト | src/features/auth/hooks/__tests__/use-auth-state.test.ts | 認証状態変化時にリスナーが呼ばれること |
| T0513 | P1 | A | GREEN | useAuthState: 実装 | src/features/auth/hooks/use-auth-state.ts | Supabase Auth 状態監視 hook が実装されること |
| T0514 | P1 | A | RED | useWebAuth: Google OAuthリダイレクトテスト | src/features/auth/hooks/__tests__/use-web-auth.web.test.ts | `signInWithGoogle()` で OAuth リダイレクトが開始されること |
| T0515 | P1 | A | RED | useWebAuth: Apple OAuthリダイレクトテスト | src/features/auth/hooks/__tests__/use-web-auth.web.test.ts | `signInWithApple()` で OAuth リダイレクトが開始されること |
| T0516 | P1 | A | GREEN | useWebAuth: Web実装 | src/features/auth/hooks/use-web-auth.web.ts | Web OAuth リダイレクト hook が実装されること |
| T0517 | P1 | A | RED | useNativeAuth: Apple signInWithIdToken テスト | src/features/auth/hooks/__tests__/use-native-auth.native.test.ts | `signInWithApple()` で `signInWithIdToken` が呼ばれること |
| T0518 | P1 | A | RED | useNativeAuth: Google signIn テスト | src/features/auth/hooks/__tests__/use-native-auth.native.test.ts | `signInWithGoogle()` で `@react-native-google-signin` が呼ばれること |
| T0519 | P1 | A | GREEN | useNativeAuth: Native実装 | src/features/auth/hooks/use-native-auth.native.ts | Native 認証 hook が実装されること |
| T0520 | P1 | A | RED | useLogout: ログアウトフローテスト | src/features/auth/hooks/__tests__/use-logout.test.ts | `logout()` で WebSocket 切断→セッションクリア→ストアクリアが実行されること |
| T0521 | P1 | A | GREEN | useLogout: 実装 | src/features/auth/hooks/use-logout.ts | ログアウト処理 hook が実装されること |
| T0522 | P1 | A | RED | useAutoRefreshToken: トークン自動更新テスト | src/features/auth/hooks/__tests__/use-auto-refresh-token.test.ts | トークン期限切れ前に自動更新が実行されること |
| T0523 | P1 | A | GREEN | useAutoRefreshToken: 実装 | src/features/auth/hooks/use-auto-refresh-token.ts | JWT 自動更新 hook が実装されること |
| T0524 | P1 | C | RED | useOnboardingFlow: ステップ管理テスト | src/features/onboarding/hooks/__tests__/use-onboarding-flow.test.ts | `nextStep()` でステップが 1→2→...→6 と進むこと |
| T0525 | P1 | C | RED | useOnboardingFlow: 完了判定テスト | src/features/onboarding/hooks/__tests__/use-onboarding-flow.test.ts | ステップ6完了後 `isCompleted: true` が返されること |
| T0526 | P1 | C | GREEN | useOnboardingFlow: 実装 | src/features/onboarding/hooks/use-onboarding-flow.ts | オンボーディングフロー管理 hook が実装されること |
| T0527 | P1 | C | RED | usePersonalityQuiz: 回答記録テスト | src/features/onboarding/hooks/__tests__/use-personality-quiz.test.ts | 5問すべての回答が記録されること |
| T0528 | P1 | C | RED | usePersonalityQuiz: Big Five計算テスト | src/features/onboarding/hooks/__tests__/use-personality-quiz.test.ts | 回答から Big Five スコアが計算されること |
| T0529 | P1 | C | GREEN | usePersonalityQuiz: 実装 | src/features/onboarding/hooks/use-personality-quiz.ts | 性格診断クイズ管理 hook が実装されること |
| T0530 | P1 | D | RED | useSOULMdRegen: 再生成テスト | src/features/settings/hooks/__tests__/use-soul-md-regen.test.ts | `regenerate()` で update-soul-md Edge Function が呼ばれること |
| T0531 | P1 | D | GREEN | useSOULMdRegen: 実装 | src/features/settings/hooks/use-soul-md-regen.ts | SOUL.md 再生成 hook が実装されること |
| T0532 | P1 | A | RED | useDeepLink: ディープリンク受信テスト | src/shared/hooks/__tests__/use-deep-link.test.ts | `altme://chat` 受信で チャット画面に遷移すること |
| T0533 | P1 | A | GREEN | useDeepLink: 実装 | src/shared/hooks/use-deep-link.ts | ディープリンク処理 hook が実装されること |
| T0534 | P1 | A | RED | usePushToken: トークン取得テスト | src/shared/hooks/__tests__/use-push-token.native.test.ts | `expo-notifications` でプッシュトークンが取得されること |
| T0535 | P1 | A | GREEN | usePushToken: Native実装 | src/shared/hooks/use-push-token.native.ts | プッシュトークン取得 hook が実装されること |
| T0536 | P1 | A | RED | useAnalytics: イベント送信テスト | src/shared/hooks/__tests__/use-analytics.test.ts | `track('page_view')` でアナリティクスイベントが送信されること |
| T0537 | P1 | A | GREEN | useAnalytics: 実装 | src/shared/hooks/use-analytics.ts | アナリティクスイベント hook が実装されること |
| T0538 | P1 | C | RED | useTwinConversationGenerate: 会話生成テスト | src/features/community/hooks/__tests__/use-twin-conversation-generate.test.ts | `generate()` で generate-twin-conversation Edge Function が呼ばれること |
| T0539 | P1 | C | RED | useTwinConversationGenerate: Pro制限テスト | src/features/community/hooks/__tests__/use-twin-conversation-generate.test.ts | Free ユーザーでペイウォールが表示されること |
| T0540 | P1 | C | GREEN | useTwinConversationGenerate: 実装 | src/features/community/hooks/use-twin-conversation-generate.ts | ツイン会話生成 hook が実装されること |
| T0541 | P1 | D | RED | useDeleteAccount: 削除フローテスト | src/features/settings/hooks/__tests__/use-delete-account.test.ts | `deleteAccount()` でユーザーデータが削除されること |
| T0542 | P1 | D | RED | useDeleteAccount: OpenClaw削除テスト | src/features/settings/hooks/__tests__/use-delete-account.test.ts | `deleteAccount()` で OpenClaw インスタンスが削除されること |
| T0543 | P1 | D | GREEN | useDeleteAccount: 実装 | src/features/settings/hooks/use-delete-account.ts | アカウント削除 hook が実装されること |
| T0544 | P1 | B | RED | useWebhookIdempotency: 重複チェックテスト | src/services/revenuecat/hooks/__tests__/use-webhook-idempotency.test.ts | 同一 webhook_event_id の重複処理がスキップされること |
| T0545 | P1 | B | GREEN | useWebhookIdempotency: 実装 | src/services/revenuecat/hooks/use-webhook-idempotency.ts | Webhook 冪等性チェック hook が実装されること |
| T0546 | P1 | A | RED | useRetry: 3回リトライテスト | src/shared/hooks/__tests__/use-retry.test.ts | 5xx エラー時に 1s→2s→4s 間隔でリトライされること |
| T0547 | P1 | A | RED | useRetry: 4xx エラー非リトライテスト | src/shared/hooks/__tests__/use-retry.test.ts | 4xx エラー時にリトライされないこと |
| T0548 | P1 | A | GREEN | useRetry: 実装 | src/shared/hooks/use-retry.ts | API リトライ hook が実装されること |
| T0549 | P1 | A | RED | useSessionExpiry: セッション期限切れテスト | src/features/auth/hooks/__tests__/use-session-expiry.test.ts | セッション期限切れ時にローカル状態クリア→ログイン画面へリダイレクトされること |
| T0550 | P1 | A | GREEN | useSessionExpiry: 実装 | src/features/auth/hooks/use-session-expiry.ts | セッション期限切れ処理 hook が実装されること |
| T0551 | P1 | A | REFACTOR | 全Hook: 型安全性強化 | src/shared/hooks/ | すべての hook の戻り値に厳密な型定義が付くこと |
| T0552 | P1 | A | REFACTOR | 全Hook: エラー処理統一 | src/shared/hooks/ | エラー処理パターンが全 hook で統一されること |
| T0553 | P1 | C | RED | useChatAttachment: ファイルアップロードテスト | src/features/chat/hooks/__tests__/use-chat-attachment.test.ts | ファイル選択後に Supabase Storage にアップロードされること |
| T0554 | P1 | C | RED | useChatAttachment: サイズ検証テスト (画像) | src/features/chat/hooks/__tests__/use-chat-attachment.test.ts | 10MB 超の画像でエラーが返されること |
| T0555 | P1 | C | RED | useChatAttachment: サイズ検証テスト (動画) | src/features/chat/hooks/__tests__/use-chat-attachment.test.ts | 100MB 超の動画でエラーが返されること |
| T0556 | P1 | C | RED | useChatAttachment: サイズ検証テスト (音声) | src/features/chat/hooks/__tests__/use-chat-attachment.test.ts | 50MB 超の音声でエラーが返されること |
| T0557 | P1 | C | GREEN | useChatAttachment: 実装 | src/features/chat/hooks/use-chat-attachment.ts | メディアアップロード hook が実装されること |
| T0558 | P1 | A | RED | useTheme: ダークテーマ取得テスト | src/shared/hooks/__tests__/use-theme.test.ts | V4 Dark Premium のカラートークンが返されること |
| T0559 | P1 | A | GREEN | useTheme: 実装 | src/shared/hooks/use-theme.ts | テーマ取得 hook が実装されること |
| T0560 | P1 | D | RED | useTwinConversationDetail: 会話詳細テスト | src/features/community/hooks/__tests__/use-twin-conversation-detail.test.ts | 会話 ID から詳細メッセージ一覧が取得されること |
| T0561 | P1 | D | GREEN | useTwinConversationDetail: 実装 | src/features/community/hooks/use-twin-conversation-detail.ts | ツイン会話詳細取得 hook が実装されること |
| T0562 | P1 | A | REFACTOR | Hooks: カスタム hook テストカバレッジ80%達成 | src/*/hooks/__tests__/ | 全カスタム hook のテストカバレッジが80%以上であること |
| T0563 | P1 | A | RED | useCommunityCreate: コミュニティ作成テスト | src/features/community/hooks/__tests__/use-community-create.test.ts | `create()` で communities テーブルにレコードが追加されること |
| T0564 | P1 | A | GREEN | useCommunityCreate: 実装 | src/features/community/hooks/use-community-create.ts | コミュニティ作成 hook が実装されること |
| T0565 | P1 | B | RED | useTokenPurchase: トークン購入テスト | src/features/subscription/hooks/__tests__/use-token-purchase.test.ts | `purchaseTokens()` で consumable IAP が実行されること |
| T0566 | P1 | B | GREEN | useTokenPurchase: 実装 | src/features/subscription/hooks/use-token-purchase.ts | トークン購入 hook が実装されること |
| T0567 | P1 | A | RED | useHealthCheck: ヘルスチェック実行テスト | src/features/settings/hooks/__tests__/use-health-check.test.ts | `checkHealth()` で health-check-openclaw Edge Function が呼ばれること |
| T0568 | P1 | A | GREEN | useHealthCheck: 実装 | src/features/settings/hooks/use-health-check.ts | OpenClaw ヘルスチェック hook が実装されること |
| T0569 | P1 | A | RED | usePlatform: Web判定テスト | src/shared/hooks/__tests__/use-platform.test.ts | Web 環境で `isWeb: true` が返されること |
| T0570 | P1 | A | RED | usePlatform: Native判定テスト | src/shared/hooks/__tests__/use-platform.test.ts | Native 環境で `isNative: true` が返されること |
| T0571 | P1 | A | GREEN | usePlatform: 実装 | src/shared/hooks/use-platform.ts | プラットフォーム判定 hook が実装されること |
| T0572 | P1 | A | REFACTOR | Hooks: React 19 concurrent features 対応 | src/shared/hooks/ | `useTransition` / `useDeferredValue` で UI 応答性が向上すること |
| T0573 | P1 | A | RED | useSupabaseRealtime: リアルタイムサブスクリプションテスト | src/shared/hooks/__tests__/use-supabase-realtime.test.ts | Supabase Realtime チャンネルにサブスクライブされること |
| T0574 | P1 | A | RED | useSupabaseRealtime: クリーンアップテスト | src/shared/hooks/__tests__/use-supabase-realtime.test.ts | コンポーネントアンマウント時にサブスクリプションが解除されること |
| T0575 | P1 | A | GREEN | useSupabaseRealtime: 実装 | src/shared/hooks/use-supabase-realtime.ts | Supabase Realtime hook が実装されること |
| T0576 | P1 | A | RED | useMarkAsRead: 既読更新テスト | src/features/chat/hooks/__tests__/use-mark-as-read.test.ts | `markAsRead(messageId)` で `read_at` が更新されること |
| T0577 | P1 | A | GREEN | useMarkAsRead: 実装 | src/features/chat/hooks/use-mark-as-read.ts | 既読マーク hook が実装されること |
| T0578 | P1 | A | RED | useIntersectionObserver: Intersection API テスト | src/shared/hooks/__tests__/use-intersection-observer.web.test.ts | `IntersectionObserver` が要素を監視すること |
| T0579 | P1 | A | GREEN | useIntersectionObserver: Web実装 | src/shared/hooks/use-intersection-observer.web.ts | Intersection Observer hook が実装されること |
| T0580 | P1 | A | RED | useMediaQuery: CSS メディアクエリテスト | src/shared/hooks/__tests__/use-media-query.web.test.ts | `window.matchMedia('(max-width: 768px)')` が使われること |
| T0581 | P1 | A | GREEN | useMediaQuery: Web実装 | src/shared/hooks/use-media-query.web.ts | CSS メディアクエリ hook が実装されること |
| T0582 | P1 | C | RED | useChatHistory: 履歴取得テスト | src/features/chat/hooks/__tests__/use-chat-history.test.ts | `chat_messages` テーブルからメッセージ履歴が取得されること |
| T0583 | P1 | C | RED | useChatHistory: cursor ページネーションテスト | src/features/chat/hooks/__tests__/use-chat-history.test.ts | `cursor` パラメーターで50件ずつ取得されること |
| T0584 | P1 | C | GREEN | useChatHistory: 実装 | src/features/chat/hooks/use-chat-history.ts | チャット履歴取得 hook が実装されること |
| T0585 | P1 | A | RED | useEventBus: イベント発行・購読テスト | src/shared/hooks/__tests__/use-event-bus.test.ts | `emit('event')` で `on('event')` リスナーが呼ばれること |
| T0586 | P1 | A | GREEN | useEventBus: 実装 | src/shared/hooks/use-event-bus.ts | アプリ内イベントバス hook が実装されること |
| T0587 | P1 | A | RED | useFormValidation: バリデーションテスト | src/shared/hooks/__tests__/use-form-validation.test.ts | Zod スキーマでフォームが検証されること |
| T0588 | P1 | A | GREEN | useFormValidation: 実装 | src/shared/hooks/use-form-validation.ts | フォームバリデーション hook が実装されること |
| T0589 | P1 | A | RED | useLocalStorage: 値保存テスト | src/shared/hooks/__tests__/use-local-storage.web.test.ts | `localStorage` に値が保存されること |
| T0590 | P1 | A | GREEN | useLocalStorage: Web実装 | src/shared/hooks/use-local-storage.web.ts | localStorage hook が実装されること |
| T0591 | P1 | A | RED | useSecureStorage: 暗号化保存テスト | src/shared/hooks/__tests__/use-secure-storage.native.test.ts | `expo-secure-store` に値が保存されること |
| T0592 | P1 | A | GREEN | useSecureStorage: Native実装 | src/shared/hooks/use-secure-storage.native.ts | SecureStore hook が実装されること |
| T0593 | P1 | A | RED | useDebounce: デバウンステスト | src/shared/hooks/__tests__/use-debounce.test.ts | 300ms 以内の連続呼び出しが1回にまとめられること |
| T0594 | P1 | A | GREEN | useDebounce: 実装 | src/shared/hooks/use-debounce.ts | デバウンス hook が実装されること |
| T0595 | P1 | A | RED | useThrottle: スロットルテスト | src/shared/hooks/__tests__/use-throttle.test.ts | 指定時間内で最大1回だけ関数が呼ばれること |
| T0596 | P1 | A | GREEN | useThrottle: 実装 | src/shared/hooks/use-throttle.ts | スロットル hook が実装されること |
| T0597 | P1 | A | RED | usePrevious: 前の値テスト | src/shared/hooks/__tests__/use-previous.test.ts | レンダリング前の値が返されること |
| T0598 | P1 | A | GREEN | usePrevious: 実装 | src/shared/hooks/use-previous.ts | 前の値参照 hook が実装されること |
| T0599 | P1 | A | RED | useCopyToClipboard: コピーテスト | src/shared/hooks/__tests__/use-copy-to-clipboard.web.test.ts | `copy('text')` で `navigator.clipboard.writeText` が呼ばれること |
| T0600 | P1 | A | GREEN | useCopyToClipboard: Web実装 | src/shared/hooks/use-copy-to-clipboard.web.ts | クリップボードコピー hook が実装されること |
| T0601 | P1 | A | RED | useBeforeUnload: ページ離脱警告テスト | src/shared/hooks/__tests__/use-before-unload.web.test.ts | フォーム変更中のページ離脱で確認ダイアログが表示されること |
| T0602 | P1 | A | GREEN | useBeforeUnload: Web実装 | src/shared/hooks/use-before-unload.web.ts | ページ離脱警告 hook が実装されること |
| T0603 | P1 | A | RED | useViewport: ビューポートサイズテスト | src/shared/hooks/__tests__/use-viewport.web.test.ts | `window.innerWidth`, `window.innerHeight` が返されること |
| T0604 | P1 | A | GREEN | useViewport: Web実装 | src/shared/hooks/use-viewport.web.ts | ビューポートサイズ hook が実装されること |
| T0605 | P1 | A | RED | useSearchParams: URLパラメーターテスト | src/shared/hooks/__tests__/use-search-params.web.test.ts | `URLSearchParams` からクエリパラメーターが取得されること |
| T0606 | P1 | A | GREEN | useSearchParams: Web実装 | src/shared/hooks/use-search-params.web.ts | URL 検索パラメーター hook が実装されること |
| T0607 | P1 | A | RED | useStripePortal: ポータルセッションテスト | src/features/subscription/hooks/__tests__/use-stripe-portal.web.test.ts | `openPortal()` で Stripe Customer Portal URL へリダイレクトされること |
| T0608 | P1 | A | GREEN | useStripePortal: Web実装 | src/features/subscription/hooks/use-stripe-portal.web.ts | Stripe Customer Portal hook が実装されること |
| T0609 | P1 | B | RED | useSubscriptionExpiry: 期限切れ検出テスト | src/features/subscription/hooks/__tests__/use-subscription-expiry.test.ts | サブスク期限切れ時に OpenClaw 破棄フラグが立つこと |
| T0610 | P1 | B | GREEN | useSubscriptionExpiry: 実装 | src/features/subscription/hooks/use-subscription-expiry.ts | サブスクリプション期限切れ処理 hook が実装されること |
| T0611 | P1 | A | RED | useFocusTrap: フォーカストラップテスト | src/shared/hooks/__tests__/use-focus-trap.web.test.ts | モーダル内で Tab キーがトラップされること |
| T0612 | P1 | A | GREEN | useFocusTrap: Web実装 | src/shared/hooks/use-focus-trap.web.ts | フォーカストラップ hook が実装されること |
| T0613 | P1 | A | RED | useKeyboardNavigation: 矢印キーナビゲーションテスト | src/shared/hooks/__tests__/use-keyboard-navigation.web.test.ts | 矢印キーでリスト項目間のフォーカス移動ができること |
| T0614 | P1 | A | GREEN | useKeyboardNavigation: Web実装 | src/shared/hooks/use-keyboard-navigation.web.ts | キーボードナビゲーション hook が実装されること |
| T0615 | P1 | A | RED | useAccessibilityAnnouncer: スクリーンリーダーテスト | src/shared/hooks/__tests__/use-accessibility-announcer.web.test.ts | `announce('message')` で `aria-live` リージョンが更新されること |
| T0616 | P1 | A | GREEN | useAccessibilityAnnouncer: Web実装 | src/shared/hooks/use-accessibility-announcer.web.ts | アクセシビリティアナウンサー hook が実装されること |
| T0617 | P1 | A | RED | useColorScheme: ダークモード検出テスト | src/shared/hooks/__tests__/use-color-scheme.web.test.ts | `prefers-color-scheme: dark` を検出すること |
| T0618 | P1 | A | GREEN | useColorScheme: Web実装 | src/shared/hooks/use-color-scheme.web.ts | カラースキーム検出 hook が実装されること |
| T0619 | P1 | A | RED | useAbortController: リクエストキャンセルテスト | src/shared/hooks/__tests__/use-abort-controller.test.ts | コンポーネントアンマウント時に fetch がキャンセルされること |
| T0620 | P1 | A | GREEN | useAbortController: 実装 | src/shared/hooks/use-abort-controller.ts | AbortController 管理 hook が実装されること |
| T0621 | P1 | A | RED | usePWAInstall: インストールプロンプトテスト | src/shared/hooks/__tests__/use-pwa-install.web.test.ts | `beforeinstallprompt` イベント時に `canInstall: true` が返されること |
| T0622 | P1 | A | GREEN | usePWAInstall: Web実装 | src/shared/hooks/use-pwa-install.web.ts | PWA インストール hook が実装されること |
| T0623 | P1 | A | RED | useWebShare: Web Share APIテスト | src/shared/hooks/__tests__/use-web-share.web.test.ts | `navigator.share()` が呼ばれること |
| T0624 | P1 | A | GREEN | useWebShare: Web実装 | src/shared/hooks/use-web-share.web.ts | Web Share API hook が実装されること |
| T0625 | P1 | A | REFACTOR | 全Hook: パフォーマンス監査 | src/*/hooks/ | `useCallback`/`useMemo` で不要な再計算が防止されること |
| T0626 | P1 | A | REFACTOR | 全Hook: テストカバレッジ最終確認 | src/*/hooks/__tests__/ | 全 hook のテストカバレッジが80%以上であること |
| T0627 | P1 | C | RED | useProChat: Pro WebSocket チャット統合テスト | src/features/chat/hooks/__tests__/use-pro-chat.test.ts | Pro ユーザーで `useWebSocketChat` が使われること |
| T0628 | P1 | C | RED | useFreeChat: Free SSE チャット統合テスト | src/features/chat/hooks/__tests__/use-free-chat.test.ts | Free ユーザーで `useSSEChat` が使われること |
| T0629 | P1 | C | GREEN | useProChat: 実装 | src/features/chat/hooks/use-pro-chat.ts | Pro WebSocket チャット hook が実装されること |
| T0630 | P1 | C | GREEN | useFreeChat: 実装 | src/features/chat/hooks/use-free-chat.ts | Free SSE チャット hook が実装されること |
| T0631 | P1 | C | RED | useChatMode: Pro/Free切替テスト | src/features/chat/hooks/__tests__/use-chat-mode.test.ts | `isPro` に応じて正しいチャット hook が選択されること |
| T0632 | P1 | C | GREEN | useChatMode: 実装 | src/features/chat/hooks/use-chat-mode.ts | チャットモード選択 hook が実装されること |
| T0633 | P1 | A | RED | useTopicMessages: トピック別メッセージテスト | src/features/chat/hooks/__tests__/use-topic-messages.test.ts | `topicId='daily'` でそのトピックのメッセージのみ取得されること |
| T0634 | P1 | A | GREEN | useTopicMessages: 実装 | src/features/chat/hooks/use-topic-messages.ts | トピック別メッセージ取得 hook が実装されること |
| T0635 | P1 | A | RED | useReadMessages: 既読一括更新テスト | src/features/chat/hooks/__tests__/use-read-messages.test.ts | 画面表示時に未読メッセージが一括既読になること |
| T0636 | P1 | A | GREEN | useReadMessages: 実装 | src/features/chat/hooks/use-read-messages.ts | 一括既読更新 hook が実装されること |
| T0637 | P1 | A | RED | useChatTopic: トピック一覧取得テスト | src/features/chat/hooks/__tests__/use-chat-topic.test.ts | `chat_topics` テーブルからトピック一覧が取得されること |
| T0638 | P1 | A | GREEN | useChatTopic: 実装 | src/features/chat/hooks/use-chat-topic.ts | チャットトピック取得 hook が実装されること |
| T0639 | P1 | A | RED | useUnreadCount: 未読数取得テスト | src/features/chat/hooks/__tests__/use-unread-count.test.ts | トピック別の未読メッセージ数が返されること |
| T0640 | P1 | A | GREEN | useUnreadCount: 実装 | src/features/chat/hooks/use-unread-count.ts | 未読メッセージ数取得 hook が実装されること |
| T0641 | P1 | C | RED | useSOULMdGenerate: SOUL.md生成テスト | src/features/onboarding/hooks/__tests__/use-soul-md-generate.test.ts | Big Five スコアから SOUL.md テンプレートが生成されること |
| T0642 | P1 | C | GREEN | useSOULMdGenerate: 実装 | src/features/onboarding/hooks/use-soul-md-generate.ts | SOUL.md 生成 hook が実装されること |
| T0643 | P1 | A | RED | useSentryError: エラー送信テスト | src/shared/hooks/__tests__/use-sentry-error.test.ts | `captureError(error)` で Sentry にエラーが送信されること |
| T0644 | P1 | A | GREEN | useSentryError: 実装 | src/shared/hooks/use-sentry-error.ts | Sentry エラー送信 hook が実装されること |
| T0645 | P1 | A | RED | usePerformanceMonitor: LCP測定テスト | src/shared/hooks/__tests__/use-performance-monitor.web.test.ts | `PerformanceObserver` で LCP が測定されること |
| T0646 | P1 | A | GREEN | usePerformanceMonitor: Web実装 | src/shared/hooks/use-performance-monitor.web.ts | パフォーマンス監視 hook が実装されること |
| T0647 | P1 | A | REFACTOR | 全Hook: ドキュメント JSDoc 追加 | src/*/hooks/*.ts | 全 hook に JSDoc コメントが追加されること |
| T0648 | P1 | A | REFACTOR | 全Hook: 統合テスト追加 | src/*/hooks/__tests__/ | hook 間の統合テストが作成されること |
| T0649 | P1 | A | RED | usePostHog: ページビュー追跡テスト | src/shared/hooks/__tests__/use-posthog.web.test.ts | ルート変更時に PostHog pageview イベントが送信されること |
| T0650 | P1 | A | GREEN | usePostHog: Web実装 | src/shared/hooks/use-posthog.web.ts | PostHog JS SDK ページビュー追跡 hook が実装されること |


---

## D. Stores（~100タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T0651 | P2 | A | RED | auth-store: 初期状態テスト | src/features/auth/stores/__tests__/auth-store.test.ts | 初期状態で `session: null`, `isGuest: false` が設定されること |
| T0652 | P2 | A | RED | auth-store: setSession テスト | src/features/auth/stores/__tests__/auth-store.test.ts | `setSession(session)` でセッションが更新されること |
| T0653 | P2 | A | RED | auth-store: clearSession テスト | src/features/auth/stores/__tests__/auth-store.test.ts | `clearSession()` でセッションが null になること |
| T0654 | P2 | A | RED | auth-store: enterGuestMode テスト | src/features/auth/stores/__tests__/auth-store.test.ts | `enterGuestMode()` で `isGuest: true` になること |
| T0655 | P2 | A | RED | auth-store: exitGuestMode テスト | src/features/auth/stores/__tests__/auth-store.test.ts | `exitGuestMode()` で `isGuest: false` になること |
| T0656 | P2 | A | RED | auth-store: isAuthenticated 計算テスト | src/features/auth/stores/__tests__/auth-store.test.ts | `session != null && !isGuest` で `isAuthenticated: true` が返されること |
| T0657 | P2 | A | RED | auth-store: setProfile テスト | src/features/auth/stores/__tests__/auth-store.test.ts | `setProfile(profile)` でプロフィールが更新されること |
| T0658 | P2 | A | RED | auth-store: onboardingCompleted フラグテスト | src/features/auth/stores/__tests__/auth-store.test.ts | `profile.onboarding_completed` が `true` の時 `isOnboarded: true` になること |
| T0659 | P2 | A | RED | auth-store: persist 永続化テスト | src/features/auth/stores/__tests__/auth-store.test.ts | セッション情報が SecureStore/localStorage に永続化されること |
| T0660 | P2 | A | RED | auth-store: rehydrate テスト | src/features/auth/stores/__tests__/auth-store.test.ts | アプリ再起動時に永続化されたセッションが復元されること |
| T0661 | P2 | A | GREEN | auth-store: 実装更新 | src/features/auth/stores/auth-store.ts | Web対応（localStorage persist）が追加されること |
| T0662 | P2 | A | RED | auth-store: Web localStorage persist テスト | src/features/auth/stores/__tests__/auth-store.web.test.ts | Web では `localStorage` に永続化されること |
| T0663 | P2 | A | RED | auth-store: Native SecureStore persist テスト | src/features/auth/stores/__tests__/auth-store.native.test.ts | Native では `SecureStore` に永続化されること |
| T0664 | P2 | A | GREEN | auth-store: プラットフォーム別 persist 実装 | src/features/auth/stores/auth-store.ts | プラットフォームに応じたストレージが使われること |
| T0665 | P2 | A | RED | auth-store: setDevLogin テスト | src/features/auth/stores/__tests__/auth-store.test.ts | `__DEV__` 環境でのみ `devLogin` が使用できること |
| T0666 | P2 | A | REFACTOR | auth-store: セレクター最適化 | src/features/auth/stores/auth-store.ts | Zustand セレクターで不要な再レンダリングが防止されること |
| T0667 | P2 | C | RED | onboarding-store: 初期状態テスト | src/features/onboarding/stores/__tests__/onboarding-store.test.ts | 初期状態で `step: 1`, `answers: []` が設定されること |
| T0668 | P2 | C | RED | onboarding-store: setStep テスト | src/features/onboarding/stores/__tests__/onboarding-store.test.ts | `setStep(3)` でステップが 3 になること |
| T0669 | P2 | C | RED | onboarding-store: addAnswer テスト | src/features/onboarding/stores/__tests__/onboarding-store.test.ts | `addAnswer({questionId: 1, value: 4})` で回答が追加されること |
| T0670 | P2 | C | RED | onboarding-store: setPersonalityResult テスト | src/features/onboarding/stores/__tests__/onboarding-store.test.ts | Big Five スコアが保存されること |
| T0671 | P2 | C | RED | onboarding-store: setAvatar テスト | src/features/onboarding/stores/__tests__/onboarding-store.test.ts | `setAvatar('cat_01')` でアバターが設定されること |
| T0672 | P2 | C | RED | onboarding-store: setTone テスト | src/features/onboarding/stores/__tests__/onboarding-store.test.ts | `setTone('casual')` で口調パターンが設定されること |
| T0673 | P2 | C | RED | onboarding-store: reset テスト | src/features/onboarding/stores/__tests__/onboarding-store.test.ts | `reset()` で初期状態に戻ること |
| T0674 | P2 | C | GREEN | onboarding-store: 実装 | src/features/onboarding/stores/onboarding-store.ts | オンボーディングフロー状態管理ストアが実装されること |
| T0675 | P2 | C | REFACTOR | onboarding-store: 型定義強化 | src/features/onboarding/stores/onboarding-store.ts | 全状態に厳密な型定義が付くこと |
| T0676 | P2 | C | RED | chat-store: 初期状態テスト | src/features/chat/stores/__tests__/chat-store.test.ts | 初期状態で `messages: []`, `currentTopic: 'daily'` が設定されること |
| T0677 | P2 | C | RED | chat-store: addMessage テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `addMessage(msg)` でメッセージが追加されること |
| T0678 | P2 | C | RED | chat-store: updateStreamingMessage テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `updateStreamingMessage(id, token)` でトークンがメッセージに追記されること |
| T0679 | P2 | C | RED | chat-store: setCurrentTopic テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `setCurrentTopic('work')` でトピックが変更されること |
| T0680 | P2 | C | RED | chat-store: setUnreadCount テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `setUnreadCount(topic, count)` でトピック別未読数が設定されること |
| T0681 | P2 | C | RED | chat-store: clearMessages テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `clearMessages(topic)` でトピックのメッセージが削除されること |
| T0682 | P2 | C | RED | chat-store: setConnectionStatus テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `setConnectionStatus('connected')` で接続状態が更新されること |
| T0683 | P2 | C | GREEN | chat-store: 実装 | src/features/chat/stores/chat-store.ts | チャット状態管理ストアが実装されること |
| T0684 | P2 | B | RED | subscription-store: 初期状態テスト | src/features/subscription/stores/__tests__/subscription-store.test.ts | 初期状態で `isPro: false`, `isTrialing: false` が設定されること |
| T0685 | P2 | B | RED | subscription-store: setSubscription テスト | src/features/subscription/stores/__tests__/subscription-store.test.ts | `setSubscription(data)` でサブスク情報が更新されること |
| T0686 | P2 | B | RED | subscription-store: tokenUsage テスト | src/features/subscription/stores/__tests__/subscription-store.test.ts | `tokenUsed`, `tokenLimit` が正しく管理されること |
| T0687 | P2 | B | GREEN | subscription-store: 実装 | src/features/subscription/stores/subscription-store.ts | サブスクリプション状態管理ストアが実装されること |
| T0688 | P2 | D | RED | community-store: コミュニティ一覧テスト | src/features/community/stores/__tests__/community-store.test.ts | `setCommunities(list)` でコミュニティ一覧が設定されること |
| T0689 | P2 | D | RED | community-store: 現在のコミュニティテスト | src/features/community/stores/__tests__/community-store.test.ts | `setCurrentCommunity(id)` で選択中コミュニティが設定されること |
| T0690 | P2 | D | GREEN | community-store: 実装 | src/features/community/stores/community-store.ts | コミュニティ状態管理ストアが実装されること |
| T0691 | P2 | D | RED | insights-store: 気分記録テスト | src/features/insights/stores/__tests__/insights-store.test.ts | `setMoodRecords(records)` で気分記録が設定されること |
| T0692 | P2 | D | RED | insights-store: Big Five テスト | src/features/insights/stores/__tests__/insights-store.test.ts | `setPersonalityResult(result)` でBig Fiveスコアが設定されること |
| T0693 | P2 | D | GREEN | insights-store: 実装 | src/features/insights/stores/insights-store.ts | 洞察状態管理ストアが実装されること |
| T0694 | P2 | D | RED | settings-store: プロフィール状態テスト | src/features/settings/stores/__tests__/settings-store.test.ts | `setProfile(profile)` でプロフィールが設定されること |
| T0695 | P2 | D | RED | settings-store: OpenClawインスタンステスト | src/features/settings/stores/__tests__/settings-store.test.ts | `setInstance(instance)` でインスタンス情報が設定されること |
| T0696 | P2 | D | GREEN | settings-store: 実装 | src/features/settings/stores/settings-store.ts | 設定状態管理ストアが実装されること |
| T0697 | P2 | C | RED | openclaw-store: 接続状態テスト | src/services/openclaw/stores/__tests__/openclaw-store.test.ts | `setConnectionState('connected')` で接続状態が更新されること |
| T0698 | P2 | C | RED | openclaw-store: IPアドレス保存テスト | src/services/openclaw/stores/__tests__/openclaw-store.test.ts | `setInstanceIp('192.168.1.1')` でIPが保存されること |
| T0699 | P2 | C | GREEN | openclaw-store: 実装 | src/services/openclaw/stores/openclaw-store.ts | OpenClaw接続状態管理ストアが実装されること |
| T0700 | P2 | A | RED | notification-store: 設定状態テスト | src/features/settings/stores/__tests__/notification-store.test.ts | `setSettings(settings)` で通知設定が更新されること |
| T0701 | P2 | A | RED | notification-store: トークン保存テスト | src/features/settings/stores/__tests__/notification-store.test.ts | `setPushToken(token)` でプッシュトークンが保存されること |
| T0702 | P2 | A | GREEN | notification-store: 実装 | src/features/settings/stores/notification-store.ts | 通知設定状態管理ストアが実装されること |
| T0703 | P2 | A | RED | journal-store: 日記エントリーテスト | src/features/journal/stores/__tests__/journal-store.test.ts | `setEntries(entries)` で日記一覧が設定されること |
| T0704 | P2 | A | GREEN | journal-store: 実装 | src/features/journal/stores/journal-store.ts | 日記状態管理ストアが実装されること |
| T0705 | P2 | A | RED | app-store: 初期化状態テスト | src/shared/stores/__tests__/app-store.test.ts | `isInitialized: false` から `true` への遷移が正しいこと |
| T0706 | P2 | A | RED | app-store: グローバルローディングテスト | src/shared/stores/__tests__/app-store.test.ts | `setGlobalLoading(true)` でローディング状態が設定されること |
| T0707 | P2 | A | GREEN | app-store: 実装 | src/shared/stores/app-store.ts | アプリグローバル状態管理ストアが実装されること |
| T0708 | P2 | A | RED | 全Store: Zustand devtools 設定テスト | src/shared/stores/ | 開発環境で Zustand DevTools が有効であること |
| T0709 | P2 | A | GREEN | 全Store: devtools 設定実装 | src/shared/stores/ | `devtools` ミドルウェアが全ストアに適用されること |
| T0710 | P2 | A | RED | 全Store: immer ミドルウェアテスト | src/shared/stores/ | `immer` ミドルウェアで不変更新が可能であること |
| T0711 | P2 | A | GREEN | 全Store: immer 設定実装 | src/shared/stores/ | `immer` ミドルウェアが全ストアに適用されること |
| T0712 | P2 | A | RED | auth-store: セレクター型推論テスト | src/features/auth/stores/__tests__/auth-store.test.ts | セレクターの戻り値型が正しく推論されること |
| T0713 | P2 | A | RED | chat-store: メッセージセレクターテスト | src/features/chat/stores/__tests__/chat-store.test.ts | `selectMessagesByTopic(topic)` で正しいメッセージが返されること |
| T0714 | P2 | A | GREEN | 全Store: セレクター実装 | src/*/stores/*.ts | 全ストアにピンポイントセレクターが実装されること |
| T0715 | P2 | A | RED | 全Store: ハイドレーション競合テスト | src/shared/stores/ | SSR/CSR でストアのハイドレーション競合が発生しないこと |
| T0716 | P2 | A | GREEN | 全Store: ハイドレーション対応 | src/shared/stores/ | `skipHydration` オプションが設定されること |
| T0717 | P2 | A | REFACTOR | 全Store: 型定義の厳密化 | src/*/stores/*.ts | `StoreState` と `StoreActions` が分離されること |
| T0718 | P2 | A | REFACTOR | 全Store: テストヘルパー整備 | src/__test-utils__/store-helpers.ts | `createTestStore()` ヘルパーが実装されること |
| T0719 | P2 | C | RED | chat-store: addAttachment テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `addAttachment(attachment)` でメッセージに添付ファイルが追加されること |
| T0720 | P2 | C | RED | chat-store: removeAttachment テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `removeAttachment(id)` でメッセージから添付ファイルが削除されること |
| T0721 | P2 | C | GREEN | chat-store: 添付ファイル機能実装 | src/features/chat/stores/chat-store.ts | 添付ファイル管理が chat-store に実装されること |
| T0722 | P2 | B | RED | subscription-store: Stripe セッション保存テスト | src/features/subscription/stores/__tests__/subscription-store.web.test.ts | `setStripeSessionId(id)` でセッションIDが保存されること |
| T0723 | P2 | B | GREEN | subscription-store: Web Stripe 状態管理 | src/features/subscription/stores/subscription-store.ts | Web 向け Stripe セッション管理が実装されること |
| T0724 | P2 | A | RED | 全Store: persist バージョン管理テスト | src/*/stores/*.ts | ストアバージョンアップ時にマイグレーション関数が呼ばれること |
| T0725 | P2 | A | GREEN | 全Store: migrate 関数実装 | src/*/stores/*.ts | `migrate` 関数でバージョン間データ変換が実装されること |
| T0726 | P2 | A | RED | 全Store: ストア間依存テスト | src/shared/stores/ | auth-store ログアウト時に全ストアがリセットされること |
| T0727 | P2 | A | GREEN | 全Store: ログアウト時リセット実装 | src/shared/stores/ | `resetAllStores()` 関数が実装されること |
| T0728 | P2 | A | REFACTOR | 全Store: React 18 Concurrent Mode 対応 | src/*/stores/*.ts | `useSyncExternalStore` ラッパーが適用されること |
| T0729 | P2 | A | REFACTOR | 全Store: コード量削減（DRY化） | src/*/stores/*.ts | 共通パターンが抽出されジェネリック化されること |
| T0730 | P2 | A | RED | chat-store: reconnectAttempts テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `setReconnectAttempts(n)` で再接続試行回数が管理されること |
| T0731 | P2 | C | GREEN | chat-store: reconnect 状態管理実装 | src/features/chat/stores/chat-store.ts | WebSocket 再接続状態管理が実装されること |
| T0732 | P2 | D | RED | insights-store: OpenClaw オンライン状態テスト | src/features/insights/stores/__tests__/insights-store.test.ts | `setTwinOnlineStatus(true)` でオンライン状態が設定されること |
| T0733 | P2 | D | GREEN | insights-store: ツインオンライン状態管理 | src/features/insights/stores/insights-store.ts | ツインのオンライン状態管理が実装されること |
| T0734 | P2 | A | RED | app-store: エラー状態テスト | src/shared/stores/__tests__/app-store.test.ts | `setGlobalError(error)` でグローバルエラーが設定されること |
| T0735 | P2 | A | GREEN | app-store: エラー状態管理実装 | src/shared/stores/app-store.ts | グローバルエラー状態管理が実装されること |
| T0736 | P2 | A | RED | auth-store: Web cookie 永続化テスト | src/features/auth/stores/__tests__/auth-store.web.test.ts | Web では Supabase セッションが cookie に保存されること |
| T0737 | P2 | A | GREEN | auth-store: cookie 永続化実装 | src/features/auth/stores/auth-store.ts | Web 用 cookie ストレージが実装されること |
| T0738 | P2 | A | RED | 全Store: unit test 実行テスト | src/*/stores/__tests__/ | `npm run test:coverage` でストアカバレッジが80%以上であること |
| T0739 | P2 | A | REFACTOR | 全Store: 命名規約統一 | src/*/stores/*.ts | アクション名が `set{Property}`, `clear{Property}`, `reset` に統一されること |
| T0740 | P2 | A | REFACTOR | 全Store: subscribe パターン整備 | src/*/stores/*.ts | ストア変化の外部購読パターンが実装されること |
| T0741 | P2 | A | RED | community-store: フィルター状態テスト | src/features/community/stores/__tests__/community-store.test.ts | `setLanguageFilter('jp')` で言語フィルターが設定されること |
| T0742 | P2 | A | GREEN | community-store: フィルター管理実装 | src/features/community/stores/community-store.ts | コミュニティフィルター状態管理が実装されること |
| T0743 | P2 | A | RED | settings-store: 通知設定テスト | src/features/settings/stores/__tests__/settings-store.test.ts | `setNotificationSettings(settings)` で通知設定が保存されること |
| T0744 | P2 | A | GREEN | settings-store: 通知設定管理実装 | src/features/settings/stores/settings-store.ts | 通知設定状態管理が実装されること |
| T0745 | P2 | A | REFACTOR | 全Store: Zustand v5 API 対応 | src/*/stores/*.ts | Zustand 5.x の新 API に対応していること |
| T0746 | P2 | A | RED | 全Store: SSR セーフティテスト | src/*/stores/*.ts | サーバーサイドで `window` 参照がエラーにならないこと |
| T0747 | P2 | A | GREEN | 全Store: SSR セーフティ実装 | src/*/stores/*.ts | `typeof window !== 'undefined'` チェックが実装されること |
| T0748 | P2 | A | REFACTOR | 全Store: テストカバレッジ80%確認 | src/*/stores/__tests__/ | 全ストアのテストカバレッジが80%以上であること |
| T0749 | P2 | C | RED | chat-store: draftMessage テスト | src/features/chat/stores/__tests__/chat-store.test.ts | `setDraftMessage(topic, text)` でトピック別下書きが保存されること |
| T0750 | P2 | C | GREEN | chat-store: 下書き管理実装 | src/features/chat/stores/chat-store.ts | トピック別下書き管理が実装されること |


---

## E. サービス層×プラットフォーム（~300タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T0751 | P2 | A | RED | supabase/client.web.ts: ブラウザクライアント作成テスト | src/services/supabase/__tests__/client.web.test.ts | `createBrowserClient` で Supabase クライアントが作成されること |
| T0752 | P2 | A | RED | supabase/client.web.ts: PKCE フロー設定テスト | src/services/supabase/__tests__/client.web.test.ts | `flowType: 'pkce'` が設定されること |
| T0753 | P2 | A | RED | supabase/client.web.ts: cookie ストレージテスト | src/services/supabase/__tests__/client.web.test.ts | cookie ベースのセッション管理が設定されること |
| T0754 | P2 | A | GREEN | supabase/client.web.ts: 実装 | src/services/supabase/client.web.ts | Web 用 Supabase クライアントが実装されること |
| T0755 | P2 | A | RED | supabase/client.native.ts: ネイティブクライアントテスト | src/services/supabase/__tests__/client.native.test.ts | `createClient` で Supabase クライアントが作成されること |
| T0756 | P2 | A | RED | supabase/client.native.ts: SecureStore アダプターテスト | src/services/supabase/__tests__/client.native.test.ts | `LargeSecureStoreAdapter` が storage として設定されること |
| T0757 | P2 | A | GREEN | supabase/client.native.ts: 実装 | src/services/supabase/client.native.ts | Native 用 Supabase クライアントが実装されること |
| T0758 | P2 | A | GREEN | supabase/client.ts: 再エクスポート | src/services/supabase/client.ts | プラットフォームに応じた Supabase クライアントが使われること |
| T0759 | P2 | A | RED | supabase/auth-shared.ts: signOut テスト | src/services/supabase/__tests__/auth-shared.test.ts | `supabase.auth.signOut()` が呼ばれること |
| T0760 | P2 | A | RED | supabase/auth-shared.ts: getSession テスト | src/services/supabase/__tests__/auth-shared.test.ts | `supabase.auth.getSession()` でセッションが取得されること |
| T0761 | P2 | A | RED | supabase/auth-shared.ts: refreshSession テスト | src/services/supabase/__tests__/auth-shared.test.ts | `supabase.auth.refreshSession()` でトークンが更新されること |
| T0762 | P2 | A | GREEN | supabase/auth-shared.ts: 実装 | src/services/supabase/auth-shared.ts | プラットフォーム共通認証関数が実装されること |
| T0763 | P2 | A | RED | supabase/auth.web.ts: Google OAuth リダイレクトテスト | src/services/supabase/__tests__/auth.web.test.ts | `signInWithOAuth({ provider: 'google' })` で OAuth リダイレクトが開始されること |
| T0764 | P2 | A | RED | supabase/auth.web.ts: Apple OAuth リダイレクトテスト | src/services/supabase/__tests__/auth.web.test.ts | `signInWithOAuth({ provider: 'apple' })` で OAuth リダイレクトが開始されること |
| T0765 | P2 | A | RED | supabase/auth.web.ts: redirectTo 設定テスト | src/services/supabase/__tests__/auth.web.test.ts | `redirectTo: window.location.origin + '/auth/callback'` が設定されること |
| T0766 | P2 | A | GREEN | supabase/auth.web.ts: 実装 | src/services/supabase/auth.web.ts | Web OAuth 認証が実装されること |
| T0767 | P2 | A | RED | supabase/auth.native.ts: Apple signInWithIdToken テスト | src/services/supabase/__tests__/auth.native.test.ts | `signInWithIdToken({ provider: 'apple', token })` が呼ばれること |
| T0768 | P2 | A | RED | supabase/auth.native.ts: Google signInWithIdToken テスト | src/services/supabase/__tests__/auth.native.test.ts | `signInWithIdToken({ provider: 'google', token })` が呼ばれること |
| T0769 | P2 | A | GREEN | supabase/auth.native.ts: 実装 | src/services/supabase/auth.native.ts | Native 認証が実装されること |
| T0770 | P2 | A | GREEN | supabase/auth.ts: 再エクスポート | src/services/supabase/auth.ts | プラットフォームに応じた認証関数が使われること |
| T0771 | P2 | B | RED | revenuecat/client.web.ts: スタブ実装テスト | src/services/revenuecat/__tests__/client.web.test.ts | Web では RevenueCat SDK が呼び出されないこと |
| T0772 | P2 | B | RED | revenuecat/client.web.ts: Stripe redirect テスト | src/services/revenuecat/__tests__/client.web.test.ts | Web の課金は Stripe Checkout にリダイレクトされること |
| T0773 | P2 | B | GREEN | revenuecat/client.web.ts: 実装 | src/services/revenuecat/client.web.ts | Web 用 RevenueCat スタブ（Stripe 代替）が実装されること |
| T0774 | P2 | B | RED | revenuecat/client.native.ts: 初期化テスト | src/services/revenuecat/__tests__/client.native.test.ts | `Purchases.configure({ apiKey })` が呼ばれること |
| T0775 | P2 | B | RED | revenuecat/client.native.ts: getCustomerInfo テスト | src/services/revenuecat/__tests__/client.native.test.ts | `getCustomerInfo()` で EntitlementInfo が返されること |
| T0776 | P2 | B | RED | revenuecat/client.native.ts: purchasePackage テスト | src/services/revenuecat/__tests__/client.native.test.ts | `purchasePackage(package)` で購入フローが実行されること |
| T0777 | P2 | B | RED | revenuecat/client.native.ts: restorePurchases テスト | src/services/revenuecat/__tests__/client.native.test.ts | `restorePurchases()` で過去の購入が復元されること |
| T0778 | P2 | B | GREEN | revenuecat/client.native.ts: 実装 | src/services/revenuecat/client.native.ts | RevenueCat Native SDK ラッパーが実装されること |
| T0779 | P2 | B | GREEN | revenuecat/client.ts: 再エクスポート | src/services/revenuecat/client.ts | プラットフォームに応じた課金クライアントが使われること |
| T0780 | P2 | A | RED | notifications/client.web.ts: 許可リクエストテスト | src/services/notifications/__tests__/client.web.test.ts | `Notification.requestPermission()` が呼ばれること |
| T0781 | P2 | A | RED | notifications/client.web.ts: プッシュ通知登録テスト | src/services/notifications/__tests__/client.web.test.ts | `PushManager.subscribe()` で通知が登録されること |
| T0782 | P2 | A | GREEN | notifications/client.web.ts: 実装 | src/services/notifications/client.web.ts | Web Push Notification クライアントが実装されること |
| T0783 | P2 | A | RED | notifications/client.native.ts: 初期化テスト | src/services/notifications/__tests__/client.native.test.ts | `expo-notifications` で許可リクエストが行われること |
| T0784 | P2 | A | RED | notifications/client.native.ts: トークン取得テスト | src/services/notifications/__tests__/client.native.test.ts | `getExpoPushTokenAsync()` でトークンが取得されること |
| T0785 | P2 | A | GREEN | notifications/client.native.ts: 実装 | src/services/notifications/client.native.ts | Expo Notifications クライアントが実装されること |
| T0786 | P2 | A | GREEN | notifications/client.ts: 再エクスポート | src/services/notifications/client.ts | プラットフォームに応じた通知クライアントが使われること |
| T0787 | P2 | A | RED | analytics/tracker.web.ts: PostHog 初期化テスト | src/services/analytics/__tests__/tracker.web.test.ts | `posthog.init()` が API キー付きで呼ばれること |
| T0788 | P2 | A | RED | analytics/tracker.web.ts: ページビューテスト | src/services/analytics/__tests__/tracker.web.test.ts | `posthog.capture('$pageview')` が呼ばれること |
| T0789 | P2 | A | RED | analytics/tracker.web.ts: カスタムイベントテスト | src/services/analytics/__tests__/tracker.web.test.ts | `track('button_click', props)` で PostHog イベントが送信されること |
| T0790 | P2 | A | RED | analytics/tracker.web.ts: ユーザー識別テスト | src/services/analytics/__tests__/tracker.web.test.ts | `identify(userId)` で `posthog.identify()` が呼ばれること |
| T0791 | P2 | A | GREEN | analytics/tracker.web.ts: 実装 | src/services/analytics/tracker.web.ts | PostHog JS SDK アナリティクストラッカーが実装されること |
| T0792 | P2 | A | RED | analytics/tracker.native.ts: posthog-react-native 初期化テスト | src/services/analytics/__tests__/tracker.native.test.ts | `PostHog.init()` が呼ばれること |
| T0793 | P2 | A | GREEN | analytics/tracker.native.ts: 実装 | src/services/analytics/tracker.native.ts | posthog-react-native アナリティクストラッカーが実装されること |
| T0794 | P2 | A | GREEN | analytics/tracker.ts: 再エクスポート | src/services/analytics/tracker.ts | プラットフォームに応じたトラッカーが使われること |
| T0795 | P2 | B | RED | stripe/client.ts: Checkout セッション作成テスト | src/services/stripe/__tests__/client.test.ts | `createCheckoutSession()` でStripe Checkout セッションが作成されること |
| T0796 | P2 | B | RED | stripe/client.ts: APIキー非露出テスト | src/services/stripe/__tests__/client.test.ts | シークレットキーがクライアントサイドに露出しないこと |
| T0797 | P2 | B | RED | stripe/client.ts: Customer Portal テスト | src/services/stripe/__tests__/client.test.ts | `createPortalSession()` で Customer Portal URL が返されること |
| T0798 | P2 | B | GREEN | stripe/client.ts: 実装 | src/services/stripe/client.ts | Stripe クライアントが実装されること |
| T0799 | P2 | B | RED | stripe/webhook-verify.ts: 署名検証テスト | src/services/stripe/__tests__/webhook-verify.test.ts | `Stripe-Signature` ヘッダーで署名が検証されること |
| T0800 | P2 | B | RED | stripe/webhook-verify.ts: 不正署名拒否テスト | src/services/stripe/__tests__/webhook-verify.test.ts | 不正な署名で 401 が返されること |
| T0801 | P2 | B | GREEN | stripe/webhook-verify.ts: 実装 | src/services/stripe/webhook-verify.ts | Stripe Webhook 署名検証が実装されること |
| T0802 | P2 | C | RED | openclaw/client.ts: インスタンス取得テスト | src/services/openclaw/__tests__/client.test.ts | `getInstance(userId)` で openclaw_instances レコードが取得されること |
| T0803 | P2 | C | RED | openclaw/client.ts: プロビジョニング開始テスト | src/services/openclaw/__tests__/client.test.ts | `provision(userId)` で provision-openclaw Edge Function が呼ばれること |
| T0804 | P2 | C | RED | openclaw/client.ts: 破棄テスト | src/services/openclaw/__tests__/client.test.ts | `destroy(userId)` で destroy-openclaw Edge Function が呼ばれること |
| T0805 | P2 | C | RED | openclaw/client.ts: ヘルスチェックテスト | src/services/openclaw/__tests__/client.test.ts | `healthCheck(ip)` で WebSocket 接続が確認されること |
| T0806 | P2 | C | GREEN | openclaw/client.ts: 実装 | src/services/openclaw/client.ts | OpenClaw クライアントが実装されること |
| T0807 | P2 | C | RED | openclaw/websocket-client.ts: 接続テスト | src/services/openclaw/__tests__/websocket-client.test.ts | `ws://{ip}:18789` に WebSocket 接続されること |
| T0808 | P2 | C | RED | openclaw/websocket-client.ts: 認証テスト | src/services/openclaw/__tests__/websocket-client.test.ts | `OPENCLAW_GATEWAY_TOKEN` でトークン認証されること |
| T0809 | P2 | C | RED | openclaw/websocket-client.ts: メッセージ送信テスト | src/services/openclaw/__tests__/websocket-client.test.ts | `send(message)` でメッセージが送信されること |
| T0810 | P2 | C | RED | openclaw/websocket-client.ts: ストリーミング受信テスト | src/services/openclaw/__tests__/websocket-client.test.ts | WebSocket メッセージのストリーミング受信が実装されること |
| T0811 | P2 | C | GREEN | openclaw/websocket-client.ts: 実装 | src/services/openclaw/websocket-client.ts | OpenClaw WebSocket クライアントが実装されること |
| T0812 | P2 | C | RED | openclaw/connection-manager.ts: 自動再接続テスト | src/services/openclaw/__tests__/connection-manager.test.ts | 切断時に指数バックオフで再接続されること |
| T0813 | P2 | C | RED | openclaw/connection-manager.ts: 最大30秒バックオフテスト | src/services/openclaw/__tests__/connection-manager.test.ts | バックオフ時間が最大 30 秒を超えないこと |
| T0814 | P2 | C | RED | openclaw/connection-manager.ts: 最大10回再試行テスト | src/services/openclaw/__tests__/connection-manager.test.ts | 10 回再試行後に `onMaxRetries` が呼ばれること |
| T0815 | P2 | C | GREEN | openclaw/connection-manager.ts: 実装 | src/services/openclaw/connection-manager.ts | OpenClaw 接続マネージャーが実装されること |
| T0816 | P2 | C | RED | openclaw/soul-md-generator.ts: テンプレート生成テスト | src/services/openclaw/__tests__/soul-md-generator.test.ts | Big Five スコアから SOUL.md が正しいフォーマットで生成されること |
| T0817 | P2 | C | RED | openclaw/soul-md-generator.ts: 外向性ルール生成テスト | src/services/openclaw/__tests__/soul-md-generator.test.ts | 外向性スコアに応じた Communication Style が生成されること |
| T0818 | P2 | C | RED | openclaw/soul-md-generator.ts: ルール数テスト | src/services/openclaw/__tests__/soul-md-generator.test.ts | SOUL.md に4セクション（Identity/Personality/CommunicationStyle/Rules）が含まれること |
| T0819 | P2 | C | GREEN | openclaw/soul-md-generator.ts: 実装 | src/services/openclaw/soul-md-generator.ts | SOUL.md テンプレート生成が実装されること |
| T0820 | P2 | D | RED | community/client.ts: 一覧取得テスト | src/services/community/__tests__/client.test.ts | `getCommunities(filter)` で communities テーブルからデータが取得されること |
| T0821 | P2 | D | RED | community/client.ts: コミュニティ作成テスト | src/services/community/__tests__/client.test.ts | `createCommunity(data)` で communities テーブルにレコードが挿入されること |
| T0822 | P2 | D | RED | community/client.ts: メンバー参加テスト | src/services/community/__tests__/client.test.ts | `joinCommunity(id)` で community_members テーブルにレコードが挿入されること |
| T0823 | P2 | D | RED | community/client.ts: ツイン会話取得テスト | src/services/community/__tests__/client.test.ts | `getTwinConversations(communityId)` で twin_conversations が取得されること |
| T0824 | P2 | D | GREEN | community/client.ts: 実装 | src/services/community/client.ts | コミュニティサービスクライアントが実装されること |
| T0825 | P2 | D | RED | digitalocean/client.ts: Droplet作成テスト | src/services/digitalocean/__tests__/client.test.ts | `createDroplet(config)` で DO API が呼ばれること |
| T0826 | P2 | D | RED | digitalocean/client.ts: Droplet削除テスト | src/services/digitalocean/__tests__/client.test.ts | `deleteDroplet(id)` で DO API が呼ばれること |
| T0827 | P2 | D | RED | digitalocean/client.ts: APIキー保護テスト | src/services/digitalocean/__tests__/client.test.ts | DO API キーがクライアントサイドに露出しないこと |
| T0828 | P2 | D | GREEN | digitalocean/client.ts: 実装 | src/services/digitalocean/client.ts | DigitalOcean API クライアントが実装されること |
| T0829 | P2 | D | RED | digitalocean/cloud-init.ts: スクリプト生成テスト | src/services/digitalocean/__tests__/cloud-init.test.ts | cloud-init スクリプトが SOUL.md と gateway token を含むこと |
| T0830 | P2 | D | GREEN | digitalocean/cloud-init.ts: 実装 | src/services/digitalocean/cloud-init.ts | cloud-init スクリプト生成が実装されること |
| T0831 | P2 | A | RED | supabase/profiles.ts: プロフィール取得テスト | src/services/supabase/__tests__/profiles.test.ts | `getProfile(userId)` で profiles テーブルからデータが取得されること |
| T0832 | P2 | A | RED | supabase/profiles.ts: プロフィール更新テスト | src/services/supabase/__tests__/profiles.test.ts | `updateProfile(userId, data)` で profiles テーブルが更新されること |
| T0833 | P2 | A | GREEN | supabase/profiles.ts: 実装 | src/services/supabase/profiles.ts | プロフィールサービス関数が実装されること |
| T0834 | P2 | C | RED | supabase/chat.ts: メッセージ取得テスト | src/services/supabase/__tests__/chat.test.ts | `getMessages(topicId, cursor)` でページネーションされたメッセージが取得されること |
| T0835 | P2 | C | RED | supabase/chat.ts: メッセージ保存テスト | src/services/supabase/__tests__/chat.test.ts | `saveMessage(message)` で chat_messages テーブルに保存されること |
| T0836 | P2 | C | GREEN | supabase/chat.ts: 実装 | src/services/supabase/chat.ts | チャットサービス関数が実装されること |
| T0837 | P2 | D | RED | supabase/mood.ts: 気分記録テスト | src/services/supabase/__tests__/mood.test.ts | `addMoodRecord(data)` で mood_records テーブルに保存されること |
| T0838 | P2 | D | RED | supabase/mood.ts: 7日間データ取得テスト | src/services/supabase/__tests__/mood.test.ts | `getMoodRecords(7)` で過去7日のデータが取得されること |
| T0839 | P2 | D | GREEN | supabase/mood.ts: 実装 | src/services/supabase/mood.ts | 気分記録サービス関数が実装されること |
| T0840 | P2 | D | RED | supabase/journal.ts: 日記取得テスト | src/services/supabase/__tests__/journal.test.ts | `getJournalEntries(userId)` で journal_entries が取得されること |
| T0841 | P2 | D | RED | supabase/journal.ts: 日記作成テスト | src/services/supabase/__tests__/journal.test.ts | `createJournalEntry(data)` で journal_entries にレコードが挿入されること |
| T0842 | P2 | D | GREEN | supabase/journal.ts: 実装 | src/services/supabase/journal.ts | 日記サービス関数が実装されること |
| T0843 | P2 | B | RED | supabase/subscriptions.ts: サブスク状態取得テスト | src/services/supabase/__tests__/subscriptions.test.ts | `getSubscription(userId)` で subscriptions テーブルからデータが取得されること |
| T0844 | P2 | B | RED | supabase/subscriptions.ts: サブスク更新テスト | src/services/supabase/__tests__/subscriptions.test.ts | `upsertSubscription(data)` でサブスク情報が更新されること |
| T0845 | P2 | B | GREEN | supabase/subscriptions.ts: 実装 | src/services/supabase/subscriptions.ts | サブスクリプションサービス関数が実装されること |
| T0846 | P2 | C | RED | supabase/openclaw.ts: インスタンス取得テスト | src/services/supabase/__tests__/openclaw.test.ts | `getOpenClawInstance(userId)` で openclaw_instances が取得されること |
| T0847 | P2 | C | RED | supabase/openclaw.ts: インスタンス更新テスト | src/services/supabase/__tests__/openclaw.test.ts | `updateInstanceStatus(userId, status)` でステータスが更新されること |
| T0848 | P2 | C | GREEN | supabase/openclaw.ts: 実装 | src/services/supabase/openclaw.ts | OpenClaw インスタンスサービス関数が実装されること |
| T0849 | P2 | A | RED | supabase/notifications.ts: 通知設定取得テスト | src/services/supabase/__tests__/notifications.test.ts | `getNotificationSettings(userId)` で notification_settings が取得されること |
| T0850 | P2 | A | GREEN | supabase/notifications.ts: 実装 | src/services/supabase/notifications.ts | 通知設定サービス関数が実装されること |
| T0851 | P2 | B | RED | stripe/edge-function-client.ts: Checkout作成テスト | src/services/stripe/__tests__/edge-function-client.test.ts | Edge Function 経由で Stripe セッションが作成されること |
| T0852 | P2 | B | RED | stripe/edge-function-client.ts: Portal作成テスト | src/services/stripe/__tests__/edge-function-client.test.ts | Edge Function 経由で Portal セッションが作成されること |
| T0853 | P2 | B | GREEN | stripe/edge-function-client.ts: 実装 | src/services/stripe/edge-function-client.ts | Supabase Edge Function 経由の Stripe クライアントが実装されること |
| T0854 | P2 | A | RED | posthog/client.ts: Web 初期化テスト | src/services/posthog/__tests__/client.test.ts | `posthog.init()` が API キー付きで呼ばれること |
| T0855 | P2 | A | GREEN | posthog/client.ts: 実装 | src/services/posthog/client.ts | PostHog クライアントが実装されること |
| T0856 | P2 | C | RED | openclaw/types.ts: OpenClawInstance型テスト | src/services/openclaw/__tests__/types.test.ts | `OpenClawInstance` 型に必須フィールドが含まれること |
| T0857 | P2 | C | RED | openclaw/types.ts: GatewayMessage型テスト | src/services/openclaw/__tests__/types.test.ts | `GatewayMessage` 型が定義されること |
| T0858 | P2 | C | GREEN | openclaw/types.ts: 実装 | src/services/openclaw/types.ts | OpenClaw 関連型定義が実装されること |
| T0859 | P2 | A | RED | supabase/realtime.ts: チャンネル購読テスト | src/services/supabase/__tests__/realtime.test.ts | `subscribeToTable(table, callback)` で Realtime チャンネルが作成されること |
| T0860 | P2 | A | RED | supabase/realtime.ts: 変更イベント受信テスト | src/services/supabase/__tests__/realtime.test.ts | INSERT/UPDATE イベントで callback が呼ばれること |
| T0861 | P2 | A | GREEN | supabase/realtime.ts: 実装 | src/services/supabase/realtime.ts | Supabase Realtime サービスが実装されること |
| T0862 | P2 | A | RED | supabase/storage.ts: ファイルアップロードテスト | src/services/supabase/__tests__/storage.test.ts | `uploadFile(bucket, path, file)` でファイルがアップロードされること |
| T0863 | P2 | A | RED | supabase/storage.ts: パブリックURL取得テスト | src/services/supabase/__tests__/storage.test.ts | `getPublicUrl(bucket, path)` でパブリック URL が返されること |
| T0864 | P2 | A | GREEN | supabase/storage.ts: 実装 | src/services/supabase/storage.ts | Supabase Storage サービスが実装されること |
| T0865 | P2 | C | RED | supabase/personality.ts: 診断結果保存テスト | src/services/supabase/__tests__/personality.test.ts | `savePersonalityResult(data)` で personality_results に保存されること |
| T0866 | P2 | C | RED | supabase/personality.ts: 診断結果取得テスト | src/services/supabase/__tests__/personality.test.ts | `getPersonalityResult(userId)` でデータが取得されること |
| T0867 | P2 | C | GREEN | supabase/personality.ts: 実装 | src/services/supabase/personality.ts | 性格診断サービス関数が実装されること |
| T0868 | P2 | B | RED | supabase/credits.ts: クレジット取得テスト | src/services/supabase/__tests__/credits.test.ts | `getCredits(userId)` で credits テーブルからデータが取得されること |
| T0869 | P2 | B | RED | supabase/credits.ts: トークン使用量取得テスト | src/services/supabase/__tests__/credits.test.ts | `getTokenUsage(userId)` で token_usage テーブルからデータが取得されること |
| T0870 | P2 | B | GREEN | supabase/credits.ts: 実装 | src/services/supabase/credits.ts | クレジット・トークン使用量サービス関数が実装されること |
| T0871 | P2 | A | RED | edge-functions/client.ts: 呼び出しテスト | src/services/edge-functions/__tests__/client.test.ts | `invoke(functionName, body)` で Supabase Edge Function が呼ばれること |
| T0872 | P2 | A | RED | edge-functions/client.ts: エラーハンドリングテスト | src/services/edge-functions/__tests__/client.test.ts | Edge Function エラー時に適切なエラーオブジェクトが返されること |
| T0873 | P2 | A | GREEN | edge-functions/client.ts: 実装 | src/services/edge-functions/client.ts | Edge Function 汎用クライアントが実装されること |
| T0874 | P2 | A | RED | supabase/cors.ts: CORS ヘッダー設定テスト | src/services/supabase/__tests__/cors.test.ts | `corsHeaders` オブジェクトに必要なヘッダーが含まれること |
| T0875 | P2 | A | RED | supabase/cors.ts: Preflight 対応テスト | src/services/supabase/__tests__/cors.test.ts | OPTIONS リクエストに 200 が返されること |
| T0876 | P2 | A | GREEN | supabase/cors.ts: 実装 | src/services/supabase/cors.ts | Edge Function 用 CORS ヘッダーユーティリティが実装されること |
| T0877 | P2 | D | RED | supabase/webhook-events.ts: イベント記録テスト | src/services/supabase/__tests__/webhook-events.test.ts | `recordWebhookEvent(data)` で webhook_events テーブルに記録されること |
| T0878 | P2 | D | RED | supabase/webhook-events.ts: 冪等性チェックテスト | src/services/supabase/__tests__/webhook-events.test.ts | 重複 event_id の場合に false が返されること |
| T0879 | P2 | D | GREEN | supabase/webhook-events.ts: 実装 | src/services/supabase/webhook-events.ts | Webhook イベント管理サービスが実装されること |
| T0880 | P2 | A | RED | supabase/push-tokens.ts: トークン保存テスト | src/services/supabase/__tests__/push-tokens.test.ts | `savePushToken(userId, token)` で push_tokens テーブルに保存されること |
| T0881 | P2 | A | GREEN | supabase/push-tokens.ts: 実装 | src/services/supabase/push-tokens.ts | プッシュトークン管理サービスが実装されること |
| T0882 | P2 | C | RED | free-chat/sse-client.ts: EventSource 接続テスト | src/services/free-chat/__tests__/sse-client.test.ts | `EventSource` が Edge Function URL に接続されること |
| T0883 | P2 | C | RED | free-chat/sse-client.ts: Supabase Auth トークン設定テスト | src/services/free-chat/__tests__/sse-client.test.ts | Authorization ヘッダーに JWT が設定されること |
| T0884 | P2 | C | RED | free-chat/sse-client.ts: トークン制限チェックテスト | src/services/free-chat/__tests__/sse-client.test.ts | 10,000 トークン超過でエラーが返されること |
| T0885 | P2 | C | GREEN | free-chat/sse-client.ts: 実装 | src/services/free-chat/sse-client.ts | Free チャット SSE クライアントが実装されること |
| T0886 | P2 | B | RED | supabase/token-usage.ts: 使用量更新テスト | src/services/supabase/__tests__/token-usage.test.ts | `incrementTokenUsage(userId, tokens)` でトークン使用量が増加されること |
| T0887 | P2 | B | RED | supabase/token-usage.ts: 月次リセットテスト | src/services/supabase/__tests__/token-usage.test.ts | Pro ユーザーの月初に使用量がリセットされること |
| T0888 | P2 | B | GREEN | supabase/token-usage.ts: 実装 | src/services/supabase/token-usage.ts | トークン使用量管理サービスが実装されること |
| T0889 | P2 | A | RED | supabase/onboarding.ts: 完了フラグ更新テスト | src/services/supabase/__tests__/onboarding.test.ts | `completeOnboarding(userId)` で `onboarding_completed: true` が設定されること |
| T0890 | P2 | A | GREEN | supabase/onboarding.ts: 実装 | src/services/supabase/onboarding.ts | オンボーディング完了サービス関数が実装されること |
| T0891 | P2 | A | RED | supabase/account.ts: アカウント削除テスト | src/services/supabase/__tests__/account.test.ts | `deleteAccount(userId)` でユーザーデータが全削除されること |
| T0892 | P2 | A | GREEN | supabase/account.ts: 実装 | src/services/supabase/account.ts | アカウント削除サービス関数が実装されること |
| T0893 | P2 | A | RED | supabase/chat-topics.ts: トピック取得テスト | src/services/supabase/__tests__/chat-topics.test.ts | `getChatTopics(userId)` で chat_topics が取得されること |
| T0894 | P2 | A | GREEN | supabase/chat-topics.ts: 実装 | src/services/supabase/chat-topics.ts | チャットトピックサービス関数が実装されること |
| T0895 | P2 | D | RED | supabase/communities.ts: コミュニティ作成テスト | src/services/supabase/__tests__/communities.test.ts | `createCommunity(data)` で communities テーブルにデータが挿入されること |
| T0896 | P2 | D | GREEN | supabase/communities.ts: 実装 | src/services/supabase/communities.ts | コミュニティデータサービスが実装されること |
| T0897 | P2 | C | RED | openclaw/gateway-auth.ts: トークン生成テスト | src/services/openclaw/__tests__/gateway-auth.test.ts | `generateGatewayToken()` で UUID v4 形式のトークンが生成されること |
| T0898 | P2 | C | GREEN | openclaw/gateway-auth.ts: 実装 | src/services/openclaw/gateway-auth.ts | Gateway トークン生成・検証が実装されること |
| T0899 | P2 | A | REFACTOR | 全サービス: エラーハンドリング統一 | src/services/ | 全サービスで `ServiceError` 型でラップされること |
| T0900 | P2 | A | REFACTOR | 全サービス: テストカバレッジ80%達成 | src/services/__tests__/ | 全サービスのテストカバレッジが80%以上であること |
| T0901 | P2 | A | RED | supabase/translation.ts: 翻訳API呼び出しテスト | src/services/supabase/__tests__/translation.test.ts | `translate(text, targetLang)` で translate Edge Function が呼ばれること |
| T0902 | P2 | A | GREEN | supabase/translation.ts: 実装 | src/services/supabase/translation.ts | 翻訳サービス関数が実装されること |
| T0903 | P2 | C | RED | openclaw/message-serializer.ts: シリアライズテスト | src/services/openclaw/__tests__/message-serializer.test.ts | チャットメッセージが Gateway プロトコル形式にシリアライズされること |
| T0904 | P2 | C | GREEN | openclaw/message-serializer.ts: 実装 | src/services/openclaw/message-serializer.ts | Gateway メッセージシリアライザーが実装されること |
| T0905 | P2 | A | RED | error-handler/global.ts: グローバルエラーテスト | src/shared/error-handler/__tests__/global.test.ts | 未捕捉エラーが Sentry に送信されること |
| T0906 | P2 | A | GREEN | error-handler/global.ts: 実装 | src/shared/error-handler/global.ts | グローバルエラーハンドラーが実装されること |
| T0907 | P2 | A | RED | http/fetch-with-retry.ts: リトライテスト | src/shared/http/__tests__/fetch-with-retry.test.ts | 5xx エラー時に 3 回リトライされること |
| T0908 | P2 | A | RED | http/fetch-with-retry.ts: AbortController テスト | src/shared/http/__tests__/fetch-with-retry.test.ts | タイムアウト時にリクエストがキャンセルされること |
| T0909 | P2 | A | GREEN | http/fetch-with-retry.ts: 実装 | src/shared/http/fetch-with-retry.ts | リトライ機能付き fetch が実装されること |
| T0910 | P2 | A | RED | supabase/auth-callback.ts: コールバック処理テスト | src/services/supabase/__tests__/auth-callback.test.ts | `/auth/callback` で `exchangeCodeForSession()` が呼ばれること |
| T0911 | P2 | A | GREEN | supabase/auth-callback.ts: 実装 | src/services/supabase/auth-callback.ts | OAuth コールバック処理が実装されること |
| T0912 | P2 | A | RED | supabase/rls.ts: RLS ポリシーテスト | src/services/supabase/__tests__/rls.test.ts | `auth.uid() = user_id` の RLS が profiles テーブルに適用されること |
| T0913 | P2 | A | GREEN | supabase/rls.ts: RLS テストヘルパー | src/services/supabase/rls.ts | RLS 検証ヘルパー関数が実装されること |
| T0914 | P2 | A | RED | supabase/twin-profiles.ts: ツインプロフィール取得テスト | src/services/supabase/__tests__/twin-profiles.test.ts | `getTwinProfile(userId)` で twin_profiles_public VIEW からデータが取得されること |
| T0915 | P2 | A | GREEN | supabase/twin-profiles.ts: 実装 | src/services/supabase/twin-profiles.ts | ツインプロフィールサービス関数が実装されること |
| T0916 | P2 | C | RED | openclaw/health-check.ts: WebSocket疎通確認テスト | src/services/openclaw/__tests__/health-check.test.ts | `pingGateway(ip, token)` で WebSocket 接続テストが実行されること |
| T0917 | P2 | C | GREEN | openclaw/health-check.ts: 実装 | src/services/openclaw/health-check.ts | Gateway ヘルスチェック関数が実装されること |
| T0918 | P2 | A | REFACTOR | 全サービス: 型安全性の強化 | src/services/ | 全サービス関数の引数・戻り値に厳密な型が付くこと |
| T0919 | P2 | A | REFACTOR | 全サービス: ドキュメント追加 | src/services/ | 全サービス関数に JSDoc コメントが追加されること |
| T0920 | P2 | A | RED | cache/memory-cache.ts: キャッシュ保存テスト | src/shared/cache/__tests__/memory-cache.test.ts | `set(key, value, ttl)` で値がキャッシュされること |
| T0921 | P2 | A | RED | cache/memory-cache.ts: TTL 期限切れテスト | src/shared/cache/__tests__/memory-cache.test.ts | TTL 経過後にキャッシュが無効化されること |
| T0922 | P2 | A | GREEN | cache/memory-cache.ts: 実装 | src/shared/cache/memory-cache.ts | メモリキャッシュが実装されること |
| T0923 | P2 | A | RED | queue/message-queue.ts: メッセージキューテスト | src/shared/queue/__tests__/message-queue.test.ts | オフライン時にメッセージがキューに積まれること |
| T0924 | P2 | A | RED | queue/message-queue.ts: オンライン復帰テスト | src/shared/queue/__tests__/message-queue.test.ts | オンライン復帰時にキューのメッセージが送信されること |
| T0925 | P2 | A | GREEN | queue/message-queue.ts: 実装 | src/shared/queue/message-queue.ts | メッセージキューが実装されること |
| T0926 | P2 | A | RED | supabase/chat-attachments.ts: 添付ファイル保存テスト | src/services/supabase/__tests__/chat-attachments.test.ts | `saveAttachment(data)` で chat_attachments テーブルに保存されること |
| T0927 | P2 | A | GREEN | supabase/chat-attachments.ts: 実装 | src/services/supabase/chat-attachments.ts | 添付ファイルサービス関数が実装されること |
| T0928 | P2 | A | REFACTOR | 全サービス: MSW ハンドラー完備 | src/__mocks__/msw/handlers/ | 全サービスに対応する MSW ハンドラーが実装されること |
| T0929 | P2 | A | RED | supabase/ogp.ts: OGP取得テスト | src/services/supabase/__tests__/ogp.test.ts | `fetchOGP(url)` で ogp Edge Function が呼ばれること |
| T0930 | P2 | A | GREEN | supabase/ogp.ts: 実装 | src/services/supabase/ogp.ts | OGP フェッチサービスが実装されること |
| T0931 | P2 | A | RED | supabase/community-messages.ts: コミュニティメッセージ取得テスト | src/services/supabase/__tests__/community-messages.test.ts | `getCommunityMessages(communityId)` で community_messages が取得されること |
| T0932 | P2 | A | GREEN | supabase/community-messages.ts: 実装 | src/services/supabase/community-messages.ts | コミュニティメッセージサービスが実装されること |
| T0933 | P2 | C | RED | openclaw/session-manager.ts: セッション管理テスト | src/services/openclaw/__tests__/session-manager.test.ts | `getSession(userId)` でユーザーの WebSocket セッションが管理されること |
| T0934 | P2 | C | GREEN | openclaw/session-manager.ts: 実装 | src/services/openclaw/session-manager.ts | OpenClaw セッション管理が実装されること |
| T0935 | P2 | A | REFACTOR | サービス層: 結合度の低減 | src/services/ | サービス間の直接依存が削減されること |
| T0936 | P2 | A | REFACTOR | サービス層: テスト容易性向上 | src/services/ | 依存性注入パターンでモック容易になること |
| T0937 | P2 | A | RED | supabase/auth.ts: devLogin テスト | src/services/supabase/__tests__/auth-shared.test.ts | `__DEV__` 環境でのみ devLogin が利用可能であること |
| T0938 | P2 | A | GREEN | supabase/auth.ts: devLogin 実装 | src/services/supabase/auth-shared.ts | 開発用ログイン関数が実装されること |
| T0939 | P2 | A | RED | supabase/guest.ts: ゲストモード設定テスト | src/services/supabase/__tests__/guest.test.ts | `enterGuestMode()` で `isGuest: true` がストアに設定されること |
| T0940 | P2 | A | GREEN | supabase/guest.ts: 実装 | src/services/supabase/guest.ts | ゲストモードサービス関数が実装されること |
| T0941 | P2 | A | RED | supabase/mbti.ts: MBTI更新テスト | src/services/supabase/__tests__/mbti.test.ts | `updateMBTI(userId, type)` で profiles.mbti_type が更新されること |
| T0942 | P2 | A | GREEN | supabase/mbti.ts: 実装 | src/services/supabase/mbti.ts | MBTI更新サービス関数が実装されること |
| T0943 | P2 | A | RED | supabase/twin-name.ts: ツイン名更新テスト | src/services/supabase/__tests__/twin-name.test.ts | `updateTwinName(userId, name)` で profiles.twin_name が更新されること |
| T0944 | P2 | A | GREEN | supabase/twin-name.ts: 実装 | src/services/supabase/twin-name.ts | ツイン名更新サービス関数が実装されること |
| T0945 | P2 | A | RED | supabase/avatar.ts: アバター更新テスト | src/services/supabase/__tests__/avatar.test.ts | `updateAvatar(userId, iconType)` で profiles.avatar_icon が更新されること |
| T0946 | P2 | A | GREEN | supabase/avatar.ts: 実装 | src/services/supabase/avatar.ts | アバター更新サービス関数が実装されること |
| T0947 | P2 | A | RED | supabase/speech-tone.ts: 口調更新テスト | src/services/supabase/__tests__/speech-tone.test.ts | `updateSpeechTone(userId, tone)` で profiles.speech_tone が更新されること |
| T0948 | P2 | A | GREEN | supabase/speech-tone.ts: 実装 | src/services/supabase/speech-tone.ts | 口調更新サービス関数が実装されること |
| T0949 | P2 | A | REFACTOR | サービス層全体: lint エラー0件確認 | src/services/ | `npx expo lint` でサービス層の lint エラーが0件であること |
| T0950 | P2 | A | REFACTOR | サービス層全体: TypeScript strict 確認 | src/services/ | `tsc --noEmit` でサービス層の型エラーが0件であること |


---

## F. 画面×プラットフォーム（~400タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T0951 | P3 | A | RED | layout/_layout.web.tsx: サイドバー表示テスト | app/__tests__/layout.web.test.tsx | デスクトップ幅でサイドバーナビゲーションが表示されること |
| T0952 | P3 | A | RED | layout/_layout.web.tsx: モバイルボトムタブテスト | app/__tests__/layout.web.test.tsx | 768px 未満でボトムタブが表示されること |
| T0953 | P3 | A | RED | layout/_layout.web.tsx: ルーティングガードテスト | app/__tests__/layout.web.test.tsx | 未認証ユーザーが `/login` にリダイレクトされること |
| T0954 | P3 | A | RED | layout/_layout.web.tsx: OB未完了リダイレクトテスト | app/__tests__/layout.web.test.tsx | OB未完了ユーザーが `/onboarding/welcome` にリダイレクトされること |
| T0955 | P3 | A | GREEN | layout/_layout.web.tsx: 実装 | app/_layout.web.tsx | Web 用レイアウトが実装されること |
| T0956 | P3 | A | RED | layout/_layout.tsx: Native ボトムタブテスト | app/__tests__/layout.native.test.tsx | Native でタブバーが表示されること |
| T0957 | P3 | A | GREEN | layout/_layout.tsx: Native 実装更新 | app/_layout.tsx | Native レイアウトが実装されること |
| T0958 | P3 | A | RED | auth/login.web.tsx: Google OAuth ボタンテスト | app/__tests__/auth/login.web.test.tsx | 「Googleでログイン」ボタンが表示されること |
| T0959 | P3 | A | RED | auth/login.web.tsx: Apple OAuth ボタンテスト | app/__tests__/auth/login.web.test.tsx | 「Appleでログイン」ボタンが表示されること |
| T0960 | P3 | A | RED | auth/login.web.tsx: ゲストモードボタンテスト | app/__tests__/auth/login.web.test.tsx | 「ゲストとして閲覧」ボタンが表示されること |
| T0961 | P3 | A | RED | auth/login.web.tsx: ログイン成功リダイレクトテスト | app/__tests__/auth/login.web.test.tsx | OAuth 成功後に `/(tabs)` に遷移すること |
| T0962 | P3 | A | GREEN | auth/login.web.tsx: 実装 | app/(auth)/login.web.tsx | Web ログイン画面が実装されること |
| T0963 | P3 | A | RED | auth/login.tsx: Native Apple Sign-In テスト | app/__tests__/auth/login.native.test.tsx | Apple Sign-In ボタンが表示されること |
| T0964 | P3 | A | GREEN | auth/login.tsx: Native実装 | app/(auth)/login.tsx | Native ログイン画面が実装されること |
| T0965 | P3 | A | RED | auth/callback.web.tsx: コードでセッション交換テスト | app/__tests__/auth/callback.web.test.tsx | OAuth コールバックで `exchangeCodeForSession()` が呼ばれること |
| T0966 | P3 | A | RED | auth/callback.web.tsx: セッション交換後リダイレクトテスト | app/__tests__/auth/callback.web.test.tsx | セッション交換後に OB状態に応じたリダイレクトが行われること |
| T0967 | P3 | A | GREEN | auth/callback.web.tsx: 実装 | app/auth/callback.tsx | Web OAuth コールバック画面が実装されること |
| T0968 | P3 | C | RED | onboarding/welcome.tsx: アプリ紹介テスト | app/__tests__/onboarding/welcome.test.tsx | AltMe のコンセプト説明が表示されること |
| T0969 | P3 | C | RED | onboarding/welcome.tsx: 開始ボタンテスト | app/__tests__/onboarding/welcome.test.tsx | 「はじめる」ボタンで personality-quiz に遷移すること |
| T0970 | P3 | C | GREEN | onboarding/welcome.tsx: 実装 | app/(onboarding)/welcome.tsx | ウェルカム画面が実装されること |
| T0971 | P3 | C | RED | onboarding/personality-quiz.tsx: 5問表示テスト | app/__tests__/onboarding/personality-quiz.test.tsx | Big Five 5問の質問が順番に表示されること |
| T0972 | P3 | C | RED | onboarding/personality-quiz.tsx: 回答選択テスト | app/__tests__/onboarding/personality-quiz.test.tsx | 5段階の回答が選択でき、次の質問に進めること |
| T0973 | P3 | C | RED | onboarding/personality-quiz.tsx: 進捗バーテスト | app/__tests__/onboarding/personality-quiz.test.tsx | 現在の質問番号/全質問数が表示されること |
| T0974 | P3 | C | GREEN | onboarding/personality-quiz.tsx: 実装 | app/(onboarding)/personality-quiz.tsx | 性格診断クイズ画面が実装されること |
| T0975 | P3 | C | RED | onboarding/result.tsx: Big Fiveバーチャートテスト | app/__tests__/onboarding/result.test.tsx | 5つの性格特性がバーチャートで表示されること |
| T0976 | P3 | C | RED | onboarding/result.tsx: AI分析サマリーテスト | app/__tests__/onboarding/result.test.tsx | 性格分析の結果サマリーが表示されること |
| T0977 | P3 | C | GREEN | onboarding/result.tsx: 実装 | app/(onboarding)/result.tsx | 診断結果画面が実装されること |
| T0978 | P3 | C | RED | onboarding/choose-avatar.tsx: 30種グリッドテスト | app/__tests__/onboarding/choose-avatar.test.tsx | 30種のアバターアイコンがグリッド表示されること |
| T0979 | P3 | C | RED | onboarding/choose-avatar.tsx: 選択状態テスト | app/__tests__/onboarding/choose-avatar.test.tsx | 選択したアバターにハイライトが付くこと |
| T0980 | P3 | C | GREEN | onboarding/choose-avatar.tsx: 実装 | app/(onboarding)/choose-avatar.tsx | アバター選択画面が実装されること |
| T0981 | P3 | C | RED | onboarding/choose-tone.tsx: 5パターン表示テスト | app/__tests__/onboarding/choose-tone.test.tsx | formal/casual/friendly/professional/playful の5パターンが選択できること |
| T0982 | P3 | C | RED | onboarding/choose-tone.tsx: 口調プレビューテスト | app/__tests__/onboarding/choose-tone.test.tsx | 各パターンの口調サンプルテキストが表示されること |
| T0983 | P3 | C | GREEN | onboarding/choose-tone.tsx: 実装 | app/(onboarding)/choose-tone.tsx | 口調選択画面が実装されること |
| T0984 | P3 | C | RED | onboarding/meet-twin.tsx: ツイン名表示テスト | app/__tests__/onboarding/meet-twin.test.tsx | ユーザーが設定したツイン名が表示されること |
| T0985 | P3 | C | RED | onboarding/meet-twin.tsx: 初回チャットテスト | app/__tests__/onboarding/meet-twin.test.tsx | 3ターンの初対面チャットが可能であること |
| T0986 | P3 | C | RED | onboarding/meet-twin.tsx: 完了ボタンテスト | app/__tests__/onboarding/meet-twin.test.tsx | 「AIツインと話す」ボタンでメインタブに遷移すること |
| T0987 | P3 | C | GREEN | onboarding/meet-twin.tsx: 実装 | app/(onboarding)/meet-twin.tsx | ツイン対面画面が実装されること |
| T0988 | P3 | C | RED | tabs/index.tsx: チャット画面基本テスト | app/__tests__/tabs/index.test.tsx | チャット画面が表示されること |
| T0989 | P3 | C | RED | tabs/index.tsx: トピックタブ表示テスト | app/__tests__/tabs/index.test.tsx | daily/work/reflection/consultation の4タブが表示されること |
| T0990 | P3 | C | RED | tabs/index.tsx: Free SSEチャットテスト | app/__tests__/tabs/index.test.tsx | Freeユーザーで SSE ストリーミングが使われること |
| T0991 | P3 | C | RED | tabs/index.tsx: Pro WebSocketチャットテスト | app/__tests__/tabs/index.test.tsx | Proユーザーで WebSocket が使われること |
| T0992 | P3 | C | RED | tabs/index.tsx: メッセージ送信テスト | app/__tests__/tabs/index.test.tsx | テキスト入力→送信ボタンでメッセージが送信されること |
| T0993 | P3 | C | RED | tabs/index.tsx: ストリーミング表示テスト | app/__tests__/tabs/index.test.tsx | AI応答がストリーミングで表示されること |
| T0994 | P3 | C | RED | tabs/index.tsx: スクロールFABテスト | app/__tests__/tabs/index.test.tsx | スクロール位置が下から200px以上でFABが表示されること |
| T0995 | P3 | C | RED | tabs/index.tsx: 50件ページネーションテスト | app/__tests__/tabs/index.test.tsx | スクロールで過去50件が追加ロードされること |
| T0996 | P3 | C | RED | tabs/index.tsx: 日記保存テスト | app/__tests__/tabs/index.test.tsx | 「日記に保存」ボタンで journal_entries に保存されること |
| T0997 | P3 | C | RED | tabs/index.tsx: 翻訳テスト | app/__tests__/tabs/index.test.tsx | 「翻訳」ボタンで ja↔en 翻訳が実行されること |
| T0998 | P3 | C | RED | tabs/index.tsx: 画像添付テスト | app/__tests__/tabs/index.test.tsx | 画像ファイル選択でプレビューが表示されること |
| T0999 | P3 | C | RED | tabs/index.web.tsx: Enterキー送信テスト | app/__tests__/tabs/index.web.test.tsx | Enter キーでメッセージが送信されること |
| T1000 | P3 | C | RED | tabs/index.web.tsx: Ctrl+Enterキー送信テスト | app/__tests__/tabs/index.web.test.tsx | Ctrl+Enter でメッセージが送信されること |
| T1001 | P3 | C | RED | tabs/index.web.tsx: ドラッグ&ドロップ添付テスト | app/__tests__/tabs/index.web.test.tsx | ファイルドロップで添付ファイルがセットされること |
| T1002 | P3 | C | RED | tabs/index.web.tsx: クリップボード貼り付けテスト | app/__tests__/tabs/index.web.test.tsx | 画像のクリップボード貼り付けが検出されること |
| T1003 | P3 | C | RED | tabs/index.web.tsx: モバイルブレークポイントテスト | app/__tests__/tabs/index.web.test.tsx | 768px 未満でボトムバー形式のUIになること |
| T1004 | P3 | C | GREEN | tabs/index.tsx: 実装 | app/(tabs)/index.tsx | チャット画面が実装されること |
| T1005 | P3 | C | GREEN | tabs/index.web.tsx: Web実装 | app/(tabs)/index.web.tsx | Web チャット画面の追加機能が実装されること |
| T1006 | P3 | D | RED | tabs/community.tsx: コミュニティ一覧テスト | app/__tests__/tabs/community.test.tsx | コミュニティカードが一覧表示されること |
| T1007 | P3 | D | RED | tabs/community.tsx: Free ブラーテスト | app/__tests__/tabs/community.test.tsx | Freeユーザーにぼかし効果とペイウォールCTAが表示されること |
| T1008 | P3 | D | RED | tabs/community.tsx: Pro一覧テスト | app/__tests__/tabs/community.test.tsx | Proユーザーでコミュニティが閲覧可能であること |
| T1009 | P3 | D | RED | tabs/community.tsx: 言語フィルターテスト | app/__tests__/tabs/community.test.tsx | jp/en フィルターでコミュニティが絞り込まれること |
| T1010 | P3 | D | RED | tabs/community.tsx: ゲストオーバーレイテスト | app/__tests__/tabs/community.test.tsx | ゲストユーザーでいいね/コメントボタンが非表示であること |
| T1011 | P3 | D | RED | tabs/community.tsx: コミュニティ作成ボタンテスト | app/__tests__/tabs/community.test.tsx | 「+」ボタンでコミュニティ作成画面に遷移すること |
| T1012 | P3 | D | GREEN | tabs/community.tsx: 実装 | app/(tabs)/community.tsx | コミュニティ画面が実装されること |
| T1013 | P3 | D | RED | tabs/twin.tsx: Big Fiveバーチャートテスト | app/__tests__/tabs/twin.test.tsx | Big Five スコアバーチャートが表示されること |
| T1014 | P3 | D | RED | tabs/twin.tsx: MBTIバッジテスト | app/__tests__/tabs/twin.test.tsx | MBTIタイプバッジが表示されること |
| T1015 | P3 | D | RED | tabs/twin.tsx: 気分トラッキングテスト | app/__tests__/tabs/twin.test.tsx | 5段階の気分絵文字が選択できること |
| T1016 | P3 | D | RED | tabs/twin.tsx: 7日間気分チャートテスト | app/__tests__/tabs/twin.test.tsx | 過去7日の気分データがグラフ表示されること |
| T1017 | P3 | D | RED | tabs/twin.tsx: OpenClawオンラインインジケーターテスト | app/__tests__/tabs/twin.test.tsx | running 状態時に緑のオンラインインジケーターが表示されること |
| T1018 | P3 | D | RED | tabs/twin.tsx: GuestPromptOverlayテスト | app/__tests__/tabs/twin.test.tsx | ゲストユーザーに GuestPromptOverlay が表示されること |
| T1019 | P3 | D | GREEN | tabs/twin.tsx: 実装 | app/(tabs)/twin.tsx | ツイン情報画面が実装されること |
| T1020 | P3 | D | RED | tabs/settings.tsx: プロフィール表示テスト | app/__tests__/tabs/settings.test.tsx | ユーザー名・アバターが表示されること |
| T1021 | P3 | D | RED | tabs/settings.tsx: AIツイン設定テスト | app/__tests__/tabs/settings.test.tsx | ツイン名・アバター・口調の設定項目が表示されること |
| T1022 | P3 | D | RED | tabs/settings.tsx: OpenClawインスタンス表示テスト | app/__tests__/tabs/settings.test.tsx | インスタンス状態カードが表示されること |
| T1023 | P3 | D | RED | tabs/settings.tsx: ゲスト専用マイページテスト | app/__tests__/tabs/settings.test.tsx | ゲストユーザーにログインボタンとグレーアウト設定一覧が表示されること |
| T1024 | P3 | D | RED | tabs/settings.tsx: ログアウトテスト | app/__tests__/tabs/settings.test.tsx | ログアウトボタンで確認ダイアログが表示されること |
| T1025 | P3 | D | RED | tabs/settings.tsx: アカウント削除ボタンテスト | app/__tests__/tabs/settings.test.tsx | 「アカウント削除」ボタンで削除確認モーダルに遷移すること |
| T1026 | P3 | D | RED | tabs/settings.tsx: Proユーザーサブスク管理テスト | app/__tests__/tabs/settings.test.tsx | Proユーザーにサブスクリプション管理ボタンが表示されること |
| T1027 | P3 | D | GREEN | tabs/settings.tsx: 実装 | app/(tabs)/settings.tsx | 設定画面が実装されること |
| T1028 | P3 | D | RED | tabs/settings.web.tsx: Web Stripeポータルリンクテスト | app/__tests__/tabs/settings.web.test.tsx | Web で「サブスクリプション管理」がStripeポータルにリンクされること |
| T1029 | P3 | D | GREEN | tabs/settings.web.tsx: Web実装 | app/(tabs)/settings.web.tsx | Web 設定画面の追加機能が実装されること |
| T1030 | P3 | B | RED | paywall/index.tsx: Pro特典一覧テスト | app/__tests__/paywall/index.test.tsx | Pro特典（無制限チャット/コミュニティ/OpenClaw）が表示されること |
| T1031 | P3 | B | RED | paywall/index.tsx: 月額プランテスト | app/__tests__/paywall/index.test.tsx | ¥4,980/月 プランが表示されること |
| T1032 | P3 | B | RED | paywall/index.tsx: 年額プランテスト | app/__tests__/paywall/index.test.tsx | ¥39,800/年 プランが表示されること |
| T1033 | P3 | B | RED | paywall/index.tsx: 3日無料トライアルテスト | app/__tests__/paywall/index.test.tsx | 「3日間無料でお試し」が表示されること |
| T1034 | P3 | B | RED | paywall/index.web.tsx: Stripe Checkoutテスト | app/__tests__/paywall/index.web.test.tsx | Web でStripe Checkoutボタンが表示されること |
| T1035 | P3 | B | RED | paywall/index.web.tsx: 初回限定年額非表示テスト | app/__tests__/paywall/index.web.test.tsx | Web で初回限定年額（¥29,800）が非表示であること |
| T1036 | P3 | B | GREEN | paywall/index.tsx: 実装 | app/(paywall)/index.tsx | ペイウォール画面が実装されること |
| T1037 | P3 | B | GREEN | paywall/index.web.tsx: Web実装 | app/(paywall)/index.web.tsx | Web ペイウォール画面が実装されること |
| T1038 | P3 | D | RED | settings/notifications.tsx: 通知トグルテスト | app/__tests__/settings/notifications.test.tsx | チャット通知/リマインダーのON/OFFが切り替えできること |
| T1039 | P3 | D | RED | settings/notifications.tsx: リマインダー時刻テスト | app/__tests__/settings/notifications.test.tsx | リマインダー時刻が設定できること |
| T1040 | P3 | D | GREEN | settings/notifications.tsx: 実装 | app/settings/notifications.tsx | 通知設定画面が実装されること |
| T1041 | P3 | D | RED | settings/mbti.tsx: MBTI選択テスト | app/__tests__/settings/mbti.test.tsx | 16種のMBTIタイプが選択できること |
| T1042 | P3 | D | GREEN | settings/mbti.tsx: 実装 | app/settings/mbti.tsx | MBTI選択画面が実装されること |
| T1043 | P3 | D | RED | settings/twin-name.tsx: 名前入力テスト | app/__tests__/settings/twin-name.test.tsx | ツイン名が入力・保存できること |
| T1044 | P3 | D | RED | settings/twin-name.tsx: 20文字制限テスト | app/__tests__/settings/twin-name.test.tsx | 20文字を超える入力でエラーが表示されること |
| T1045 | P3 | D | GREEN | settings/twin-name.tsx: 実装 | app/settings/twin-name.tsx | ツイン名編集画面が実装されること |
| T1046 | P3 | D | RED | community/create.tsx: フォーム表示テスト | app/__tests__/community/create.test.tsx | コミュニティ名・説明・言語・サムネイルの入力欄が表示されること |
| T1047 | P3 | D | RED | community/create.tsx: バリデーションテスト | app/__tests__/community/create.test.tsx | コミュニティ名が空の場合にエラーが表示されること |
| T1048 | P3 | D | RED | community/create.tsx: サムネイル選択テスト | app/__tests__/community/create.test.tsx | 30種のサムネイルが選択できること |
| T1049 | P3 | D | GREEN | community/create.tsx: 実装 | app/community/create.tsx | コミュニティ作成画面が実装されること |
| T1050 | P3 | D | RED | twin-conversation-detail.tsx: 会話表示テスト | app/__tests__/twin-conversation-detail.test.tsx | ツイン会話の詳細メッセージが表示されること |
| T1051 | P3 | D | RED | twin-conversation-detail.tsx: 相性スコアテスト | app/__tests__/twin-conversation-detail.test.tsx | Big Five 相性スコアが表示されること |
| T1052 | P3 | D | GREEN | twin-conversation-detail.tsx: 実装 | app/twin-conversation-detail.tsx | ツイン会話詳細モーダルが実装されること |
| T1053 | P3 | B | RED | subscription-manage.tsx: サブスク情報表示テスト | app/__tests__/subscription-manage.test.tsx | 現在のプラン・期限・更新日が表示されること |
| T1054 | P3 | B | RED | subscription-manage.tsx: キャンセルボタンテスト | app/__tests__/subscription-manage.test.tsx | 「解約する」ボタンが表示されること |
| T1055 | P3 | B | GREEN | subscription-manage.tsx: 実装 | app/subscription-manage.tsx | サブスクリプション管理モーダルが実装されること |
| T1056 | P3 | D | RED | account-delete-confirm.tsx: 確認入力テスト | app/__tests__/account-delete-confirm.test.tsx | 「DELETE」入力で削除ボタンが有効化されること |
| T1057 | P3 | D | RED | account-delete-confirm.tsx: 削除実行テスト | app/__tests__/account-delete-confirm.test.tsx | 削除実行でアカウントが削除されログイン画面に遷移すること |
| T1058 | P3 | D | GREEN | account-delete-confirm.tsx: 実装 | app/account-delete-confirm.tsx | アカウント削除確認モーダルが実装されること |
| T1059 | P3 | A | RED | +not-found.tsx: 404メッセージテスト | app/__tests__/not-found.test.tsx | 「ページが見つかりません」メッセージが表示されること |
| T1060 | P3 | A | GREEN | +not-found.tsx: 実装 | app/+not-found.tsx | 404ページが実装されること |
| T1061 | P3 | A | RED | notification-settings.tsx: Web通知設定テスト | app/__tests__/notification-settings.web.test.tsx | Web Push 通知の許可リクエストが実装されること |
| T1062 | P3 | A | GREEN | notification-settings.tsx: Web実装 | app/notification-settings.tsx | 通知設定ページが実装されること |
| T1063 | P3 | A | RED | tabs/index.web.tsx: デスクトップ2カラムテスト | app/__tests__/tabs/index.web.test.tsx | デスクトップ幅でサイドパネルを持つ2カラムレイアウトになること |
| T1064 | P3 | A | RED | tabs/community.web.tsx: デスクトップグリッドテスト | app/__tests__/tabs/community.web.test.tsx | デスクトップ幅でコミュニティグリッドが3列になること |
| T1065 | P3 | A | GREEN | tabs/community.web.tsx: Web実装 | app/(tabs)/community.web.tsx | Web コミュニティ画面の追加機能が実装されること |
| T1066 | P3 | A | RED | tabs/twin.web.tsx: デスクトップ2カラムテスト | app/__tests__/tabs/twin.web.test.tsx | デスクトップ幅でBig FiveとMBTIが並列表示されること |
| T1067 | P3 | A | GREEN | tabs/twin.web.tsx: Web実装 | app/(tabs)/twin.web.tsx | Web ツイン情報画面の追加機能が実装されること |
| T1068 | P3 | C | RED | onboarding/welcome.web.tsx: デスクトップレイアウトテスト | app/__tests__/onboarding/welcome.web.test.tsx | デスクトップ幅でセンタリングされた最大幅コンテナになること |
| T1069 | P3 | C | GREEN | onboarding/welcome.web.tsx: Web実装 | app/(onboarding)/welcome.web.tsx | Web ウェルカム画面の追加機能が実装されること |
| T1070 | P3 | C | RED | onboarding/result.web.tsx: デスクトップチャートテスト | app/__tests__/onboarding/result.web.test.tsx | デスクトップ幅でSVGバーチャートが表示されること |
| T1071 | P3 | C | GREEN | onboarding/result.web.tsx: Web実装 | app/(onboarding)/result.web.tsx | Web 診断結果画面の追加機能が実装されること |
| T1072 | P3 | B | RED | paywall/index.tsx: RevenueCat購入フローテスト | app/__tests__/paywall/index.native.test.tsx | Native で RevenueCat `purchasePackage` が呼ばれること |
| T1073 | P3 | B | RED | paywall/index.tsx: 購入復元テスト | app/__tests__/paywall/index.native.test.tsx | 「購入を復元」ボタンで `restorePurchases` が呼ばれること |
| T1074 | P3 | B | GREEN | paywall/index.tsx: Native実装 | app/(paywall)/index.tsx | Native ペイウォール画面が実装されること |
| T1075 | P3 | D | RED | community/detail.tsx: コミュニティ詳細テスト | app/__tests__/community/detail.test.tsx | コミュニティの名前・説明・メンバー数が表示されること |
| T1076 | P3 | D | RED | community/detail.tsx: ツイン会話一覧テスト | app/__tests__/community/detail.test.tsx | コミュニティ内のツイン会話一覧が表示されること |
| T1077 | P3 | D | GREEN | community/detail.tsx: 実装 | app/community/[id].tsx | コミュニティ詳細画面が実装されること |
| T1078 | P3 | D | RED | journal/list.tsx: 日記一覧テスト | app/__tests__/journal/list.test.tsx | 日記エントリーが一覧表示されること |
| T1079 | P3 | D | RED | journal/list.tsx: 日記作成ボタンテスト | app/__tests__/journal/list.test.tsx | 「新規作成」ボタンで日記作成画面に遷移すること |
| T1080 | P3 | D | GREEN | journal/list.tsx: 実装 | app/journal/index.tsx | 日記一覧画面が実装されること |
| T1081 | P3 | D | RED | journal/detail.tsx: 日記内容テスト | app/__tests__/journal/detail.test.tsx | 日記の内容がMarkdownで表示されること |
| T1082 | P3 | D | RED | journal/detail.tsx: AI振り返りテスト | app/__tests__/journal/detail.test.tsx | AI による日記の振り返りコメントが表示されること |
| T1083 | P3 | D | GREEN | journal/detail.tsx: 実装 | app/journal/[id].tsx | 日記詳細画面が実装されること |
| T1084 | P3 | D | RED | journal/create.tsx: 編集エリアテスト | app/__tests__/journal/create.test.tsx | Markdown 入力エリアが表示されること |
| T1085 | P3 | D | RED | journal/create.tsx: 保存ボタンテスト | app/__tests__/journal/create.test.tsx | 「保存」ボタンで journal_entries に保存されること |
| T1086 | P3 | D | GREEN | journal/create.tsx: 実装 | app/journal/create.tsx | 日記作成画面が実装されること |
| T1087 | P3 | A | RED | tabs/index.tsx: 接続状態バーテスト | app/__tests__/tabs/index.test.tsx | WebSocket切断時に「再接続中...」バーが表示されること |
| T1088 | P3 | A | RED | tabs/index.tsx: オフラインバナーテスト | app/__tests__/tabs/index.test.tsx | ネットワーク切断時にオフラインバナーが表示されること |
| T1089 | P3 | C | GREEN | tabs/index.tsx: エラー表示実装 | app/(tabs)/index.tsx | 接続エラー時のUI表示が実装されること |
| T1090 | P3 | D | RED | tabs/settings.tsx: SOUL.md確認テスト | app/__tests__/tabs/settings.test.tsx | 「SOUL.mdを確認」でSOUL.mdプレビューが表示されること |
| T1091 | P3 | D | RED | tabs/settings.tsx: SOUL.md再生成テスト | app/__tests__/tabs/settings.test.tsx | 「SOUL.mdを再生成」ボタンで update-soul-md Edge Function が呼ばれること |
| T1092 | P3 | D | GREEN | tabs/settings.tsx: SOUL.md機能実装 | app/(tabs)/settings.tsx | SOUL.md確認・再生成機能が実装されること |
| T1093 | P3 | D | RED | settings/notifications.native.tsx: Expo Notificationsテスト | app/__tests__/settings/notifications.native.test.tsx | Native で push_tokens テーブルにトークンが保存されること |
| T1094 | P3 | D | GREEN | settings/notifications.native.tsx: Native実装 | app/settings/notifications.native.tsx | Native 通知設定画面が実装されること |
| T1095 | P3 | A | RED | 画面全体: ローディング状態テスト | app/__tests__/ | 全画面でデータ取得中にローディングスケルトンが表示されること |
| T1096 | P3 | A | RED | 画面全体: エラー状態テスト | app/__tests__/ | 全画面でエラー発生時にエラーメッセージが表示されること |
| T1097 | P3 | A | GREEN | 画面全体: ローディング・エラー状態実装 | app/ | 全画面に統一されたローディング・エラーUIが実装されること |
| T1098 | P3 | A | RED | 画面全体: アニメーション遷移テスト | app/__tests__/ | 画面遷移にフェードアニメーションが設定されること |
| T1099 | P3 | A | GREEN | 画面全体: アニメーション実装 | app/ | 画面遷移アニメーションが実装されること |
| T1100 | P3 | A | RED | 画面全体: タイトル設定テスト | app/__tests__/ | 全画面に適切な `<title>` が設定されること（Web用） |
| T1101 | P3 | A | GREEN | 画面全体: Web タイトル実装 | app/ | Web 用ページタイトルが全画面に設定されること |
| T1102 | P3 | A | RED | auth/login.tsx: エラーメッセージテスト | app/__tests__/auth/login.test.tsx | 認証エラー時にエラーメッセージが表示されること |
| T1103 | P3 | A | RED | auth/login.tsx: ローディング状態テスト | app/__tests__/auth/login.test.tsx | OAuth 処理中にローディングスピナーが表示されること |
| T1104 | P3 | A | GREEN | auth/login.tsx: エラー・ローディング実装 | app/(auth)/login.tsx | エラー・ローディング状態が実装されること |
| T1105 | P3 | C | RED | tabs/index.tsx: OGPプレビューテスト | app/__tests__/tabs/index.test.tsx | URLを含むメッセージにOGPプレビューが表示されること |
| T1106 | P3 | C | GREEN | tabs/index.tsx: OGPプレビュー実装 | app/(tabs)/index.tsx | OGPプレビュー表示が実装されること |
| T1107 | P3 | C | RED | tabs/index.tsx: Markdownレンダリングテスト | app/__tests__/tabs/index.test.tsx | AI応答がMarkdown形式でレンダリングされること |
| T1108 | P3 | C | GREEN | tabs/index.tsx: Markdownレンダリング実装 | app/(tabs)/index.tsx | Markdown レンダリングが実装されること |
| T1109 | P3 | B | RED | paywall/index.tsx: トライアル期間表示テスト | app/__tests__/paywall/index.test.tsx | 「3日間無料でお試し」バッジが表示されること |
| T1110 | P3 | B | GREEN | paywall/index.tsx: トライアル表示実装 | app/(paywall)/index.tsx | トライアル期間表示が実装されること |
| T1111 | P3 | D | RED | tabs/twin.tsx: 診断やり直しボタンテスト | app/__tests__/tabs/twin.test.tsx | 「診断をやり直す」ボタンがオンボーディングへの導線を持つこと |
| T1112 | P3 | D | GREEN | tabs/twin.tsx: 診断やり直し実装 | app/(tabs)/twin.tsx | 診断やり直しボタンが実装されること |
| T1113 | P3 | C | RED | onboarding/meet-twin.tsx: SOUL.md生成テスト | app/__tests__/onboarding/meet-twin.test.tsx | meet-twin 完了時に personality-analyze Edge Function が呼ばれること |
| T1114 | P3 | C | GREEN | onboarding/meet-twin.tsx: SOUL.md生成実装 | app/(onboarding)/meet-twin.tsx | オンボーディング完了時の SOUL.md 生成が実装されること |
| T1115 | P3 | A | RED | 画面全体: SEO metadata テスト | app/__tests__/ | Web 用の OGP metadata が設定されること |
| T1116 | P3 | A | GREEN | 画面全体: SEO metadata 実装 | app/ | 全画面に OGP metadata が設定されること |
| T1117 | P3 | A | RED | 画面全体: 認証ガード動作テスト | app/__tests__/ | 保護された画面が未認証アクセス時にリダイレクトされること |
| T1118 | P3 | A | GREEN | 画面全体: 認証ガード実装 | app/ | 全保護画面に認証ガードが実装されること |
| T1119 | P3 | A | RED | 画面全体: Pro機能ガードテスト | app/__tests__/ | Pro限定機能がFreeユーザーにペイウォールを表示すること |
| T1120 | P3 | A | GREEN | 画面全体: Pro機能ガード実装 | app/ | 全Pro限定機能にガードが実装されること |
| T1121 | P3 | A | REFACTOR | 画面全体: コンポーネント分離 | app/ | 画面コンポーネントから複雑なロジックが hook に分離されること |
| T1122 | P3 | A | REFACTOR | 画面全体: 型定義強化 | app/ | 全画面コンポーネントに Props 型が定義されること |
| T1123 | P3 | A | RED | tabs/index.tsx: 未読バッジテスト | app/__tests__/tabs/index.test.tsx | タブアイコンに未読メッセージ数バッジが表示されること |
| T1124 | P3 | A | GREEN | tabs/index.tsx: 未読バッジ実装 | app/(tabs)/index.tsx | 未読バッジ表示が実装されること |
| T1125 | P3 | A | RED | auth/login.tsx: devLogin テスト | app/__tests__/auth/login.test.tsx | `__DEV__` 環境でdevLoginボタンが表示されること |
| T1126 | P3 | A | GREEN | auth/login.tsx: devLogin 実装 | app/(auth)/login.tsx | 開発用ログインボタンが実装されること |
| T1127 | P3 | A | RED | tabs/settings.tsx: インスタンス再試行テスト | app/__tests__/tabs/settings.test.tsx | error 状態のインスタンスに「再試行」ボタンが表示されること |
| T1128 | P3 | A | GREEN | tabs/settings.tsx: インスタンス再試行実装 | app/(tabs)/settings.tsx | インスタンス再試行機能が実装されること |
| T1129 | P3 | A | RED | 画面全体: テストカバレッジ80%確認 | app/__tests__/ | 全画面のテストカバレッジが80%以上であること |
| T1130 | P3 | A | REFACTOR | 画面全体: パフォーマンス最適化 | app/ | `React.memo` と `useMemo` で不要な再レンダリングが防止されること |
| T1131 | P3 | D | RED | tabs/community.tsx: ツイン会話生成テスト | app/__tests__/tabs/community.test.tsx | Proユーザーでツイン会話が生成できること |
| T1132 | P3 | D | GREEN | tabs/community.tsx: ツイン会話生成実装 | app/(tabs)/community.tsx | ツイン会話生成機能が実装されること |
| T1133 | P3 | D | RED | community/detail.tsx: メンバー参加/退会テスト | app/__tests__/community/detail.test.tsx | 「参加」「退会」ボタンでメンバーシップが変更されること |
| T1134 | P3 | D | GREEN | community/detail.tsx: メンバーシップ実装 | app/community/[id].tsx | コミュニティ参加/退会機能が実装されること |
| T1135 | P3 | A | RED | tabs/settings.tsx: プッシュトークン登録テスト | app/__tests__/tabs/settings.test.tsx | 通知許可時に push_tokens テーブルにトークンが保存されること |
| T1136 | P3 | A | GREEN | tabs/settings.tsx: プッシュトークン登録実装 | app/(tabs)/settings.tsx | プッシュトークン登録機能が実装されること |
| T1137 | P3 | B | RED | subscription-manage.tsx: Native App Store リンクテスト | app/__tests__/subscription-manage.native.test.tsx | Native で App Store へのリンクが表示されること |
| T1138 | P3 | B | GREEN | subscription-manage.tsx: Native実装 | app/subscription-manage.native.tsx | Native サブスクリプション管理が実装されること |
| T1139 | P3 | C | RED | tabs/index.tsx: 音声メッセージテスト | app/__tests__/tabs/index.native.test.tsx | Native で音声録音・送信が可能であること |
| T1140 | P3 | C | GREEN | tabs/index.tsx: 音声メッセージ実装 | app/(tabs)/index.native.tsx | Native 音声メッセージ機能が実装されること |
| T1141 | P3 | A | RED | 全画面: アクセシビリティ基本テスト | app/__tests__/ | 全インタラクティブ要素に `accessibilityLabel` が設定されること |
| T1142 | P3 | A | GREEN | 全画面: アクセシビリティ実装 | app/ | WCAG 2.1 Level AA に準拠したアクセシビリティが実装されること |
| T1143 | P3 | A | RED | 全画面: キーボードナビゲーションテスト | app/__tests__/ | Tab キーで全インタラクティブ要素にアクセスできること |
| T1144 | P3 | A | GREEN | 全画面: キーボードナビゲーション実装 | app/ | Web 全画面でキーボードナビゲーションが実装されること |
| T1145 | P3 | A | RED | 全画面: レスポンシブデザインテスト | app/__tests__/ | mobile/tablet/desktop/wide の全ブレークポイントでレイアウトが崩れないこと |
| T1146 | P3 | A | GREEN | 全画面: レスポンシブデザイン実装 | app/ | 全ブレークポイントに対応したレスポンシブデザインが実装されること |
| T1147 | P3 | A | REFACTOR | 全画面: コードスプリッティング | app/ | 各画面が lazy import でコード分割されること |
| T1148 | P3 | A | REFACTOR | 全画面: Storybook ストーリー完備 | app/ | 全画面の主要状態が Storybook ストーリーとして作成されること |
| T1149 | P3 | D | RED | tabs/twin.tsx: SOUL.md反映状態テスト | app/__tests__/tabs/twin.test.tsx | OpenClaw インスタンスが running の場合に SOUL.md 反映ステータスが表示されること |
| T1150 | P3 | D | GREEN | tabs/twin.tsx: SOUL.md状態実装 | app/(tabs)/twin.tsx | SOUL.md 反映状態表示が実装されること |


---

## G. Edge Functions（~200タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1151 | P4 | C | RED | free-chat/index.ts: SSE接続テスト | supabase/functions/free-chat/index.ts | EventSource 接続でSSEストリームが開始されること |
| T1152 | P4 | C | RED | free-chat/index.ts: JWT認証テスト | supabase/functions/free-chat/index.ts | Authorization ヘッダーのJWT検証が行われること |
| T1153 | P4 | C | RED | free-chat/index.ts: 10Kトークン制限テスト | supabase/functions/free-chat/index.ts | 10,000トークン超過でエラーが返されること |
| T1154 | P4 | C | RED | free-chat/index.ts: OpenAI APIテスト | supabase/functions/free-chat/index.ts | OpenAI Chat API にメッセージが送信されること |
| T1155 | P4 | C | RED | free-chat/index.ts: ストリーミングレスポンステスト | supabase/functions/free-chat/index.ts | OpenAI ストリーミングレスポンスがSSEで転送されること |
| T1156 | P4 | C | RED | free-chat/index.ts: CORS preflight テスト | supabase/functions/free-chat/index.ts | OPTIONS リクエストに200が返されること |
| T1157 | P4 | C | RED | free-chat/index.ts: token_usage 更新テスト | supabase/functions/free-chat/index.ts | 使用したトークン数が token_usage テーブルに記録されること |
| T1158 | P4 | C | GREEN | free-chat/index.ts: 実装 | supabase/functions/free-chat/index.ts | Free チャット Edge Function が実装されること |
| T1159 | P4 | C | RED | free-chat/index.ts: doneイベントテスト | supabase/functions/free-chat/index.ts | ストリーム完了時に `data: [DONE]` が送信されること |
| T1160 | P4 | C | RED | free-chat/index.ts: エラーイベントテスト | supabase/functions/free-chat/index.ts | OpenAI エラー時にエラーSSEイベントが送信されること |
| T1161 | P4 | C | REFACTOR | free-chat/index.ts: レート制限実装 | supabase/functions/free-chat/index.ts | 1日3回の制限が実装されること |
| T1162 | P4 | C | REFACTOR | free-chat/index.ts: エラーハンドリング強化 | supabase/functions/free-chat/index.ts | 全エラーパターンが適切に処理されること |
| T1163 | P4 | C | RED | personality-analyze/index.ts: Big Five計算テスト | supabase/functions/personality-analyze/index.ts | 5問の回答からBig Fiveスコアが計算されること |
| T1164 | P4 | C | RED | personality-analyze/index.ts: personality_results保存テスト | supabase/functions/personality-analyze/index.ts | 計算結果がpersonality_resultsテーブルに保存されること |
| T1165 | P4 | C | RED | personality-analyze/index.ts: サマリー生成テスト | supabase/functions/personality-analyze/index.ts | AI によって性格サマリーが生成されること |
| T1166 | P4 | C | GREEN | personality-analyze/index.ts: 実装 | supabase/functions/personality-analyze/index.ts | 性格分析 Edge Function が実装されること |
| T1167 | P4 | C | RED | provision-openclaw/index.ts: 冪等性テスト | supabase/functions/provision-openclaw/index.ts | 同一ユーザーの重複プロビジョニングがスキップされること |
| T1168 | P4 | C | RED | provision-openclaw/index.ts: Droplet作成テスト | supabase/functions/provision-openclaw/index.ts | DigitalOcean API でDropletが作成されること |
| T1169 | P4 | C | RED | provision-openclaw/index.ts: status更新テスト | supabase/functions/provision-openclaw/index.ts | Droplet作成後にstatus: 'provisioning'が設定されること |
| T1170 | P4 | C | RED | provision-openclaw/index.ts: SOUL.md生成テスト | supabase/functions/provision-openclaw/index.ts | personality_resultsからSOUL.mdが生成されること |
| T1171 | P4 | C | RED | provision-openclaw/index.ts: cloud-init生成テスト | supabase/functions/provision-openclaw/index.ts | cloud-initスクリプトが生成されること |
| T1172 | P4 | C | RED | provision-openclaw/index.ts: DO API失敗テスト | supabase/functions/provision-openclaw/index.ts | DO API失敗時にerrorステータスが設定されること |
| T1173 | P4 | C | GREEN | provision-openclaw/index.ts: 実装 | supabase/functions/provision-openclaw/index.ts | OpenClaw プロビジョニング Edge Function が実装されること |
| T1174 | P4 | C | RED | destroy-openclaw/index.ts: Droplet削除テスト | supabase/functions/destroy-openclaw/index.ts | DigitalOcean API でDropletが削除されること |
| T1175 | P4 | C | RED | destroy-openclaw/index.ts: status更新テスト | supabase/functions/destroy-openclaw/index.ts | 削除中はstatus: 'destroying'が設定されること |
| T1176 | P4 | C | RED | destroy-openclaw/index.ts: 削除完了テスト | supabase/functions/destroy-openclaw/index.ts | Droplet削除確認後にstatus: 'stopped'が設定されること |
| T1177 | P4 | C | GREEN | destroy-openclaw/index.ts: 実装 | supabase/functions/destroy-openclaw/index.ts | OpenClaw 破棄 Edge Function が実装されること |
| T1178 | P4 | C | RED | health-check-openclaw/index.ts: running インスタンス取得テスト | supabase/functions/health-check-openclaw/index.ts | status: 'running' の全インスタンスが取得されること |
| T1179 | P4 | C | RED | health-check-openclaw/index.ts: WebSocket接続テスト | supabase/functions/health-check-openclaw/index.ts | 各インスタンスのGatewayにWebSocket接続が試みられること |
| T1180 | P4 | C | RED | health-check-openclaw/index.ts: 成功時更新テスト | supabase/functions/health-check-openclaw/index.ts | 接続成功時にlast_health_checkが更新されること |
| T1181 | P4 | C | RED | health-check-openclaw/index.ts: 3回失敗テスト | supabase/functions/health-check-openclaw/index.ts | 3回連続失敗でstatus: 'error'に変更されること |
| T1182 | P4 | C | GREEN | health-check-openclaw/index.ts: 実装 | supabase/functions/health-check-openclaw/index.ts | OpenClaw ヘルスチェック Edge Function が実装されること |
| T1183 | P4 | C | RED | update-soul-md/index.ts: SOUL.md更新テスト | supabase/functions/update-soul-md/index.ts | 最新のpersonality_resultsからSOUL.mdが再生成されること |
| T1184 | P4 | C | RED | update-soul-md/index.ts: OpenClaw反映テスト | supabase/functions/update-soul-md/index.ts | 新しいSOUL.mdがOpenClaw Gatewayに反映されること |
| T1185 | P4 | C | GREEN | update-soul-md/index.ts: 実装 | supabase/functions/update-soul-md/index.ts | SOUL.md更新 Edge Function が実装されること |
| T1186 | P4 | C | RED | restart-openclaw/index.ts: Docker再起動テスト | supabase/functions/restart-openclaw/index.ts | OpenClaw Dockerコンテナが再起動されること |
| T1187 | P4 | C | RED | restart-openclaw/index.ts: status更新テスト | supabase/functions/restart-openclaw/index.ts | 再起動中にstatus: 'provisioning'が設定されること |
| T1188 | P4 | C | GREEN | restart-openclaw/index.ts: 実装 | supabase/functions/restart-openclaw/index.ts | OpenClaw 再起動 Edge Function が実装されること |
| T1189 | P4 | B | RED | webhook-revenuecat/index.ts: 署名検証テスト | supabase/functions/webhook-revenuecat/index.ts | RevenueCat 共有シークレットで署名が検証されること |
| T1190 | P4 | B | RED | webhook-revenuecat/index.ts: 冪等性チェックテスト | supabase/functions/webhook-revenuecat/index.ts | 重複webhook_event_idの処理がスキップされること |
| T1191 | P4 | B | RED | webhook-revenuecat/index.ts: INITIAL_PURCHASE テスト | supabase/functions/webhook-revenuecat/index.ts | INITIAL_PURCHASE イベントでプロビジョニングが開始されること |
| T1192 | P4 | B | RED | webhook-revenuecat/index.ts: RENEWAL テスト | supabase/functions/webhook-revenuecat/index.ts | RENEWAL イベントでサブスク情報が更新されること |
| T1193 | P4 | B | RED | webhook-revenuecat/index.ts: EXPIRATION テスト | supabase/functions/webhook-revenuecat/index.ts | EXPIRATION イベントでOpenClaw破棄が開始されること |
| T1194 | P4 | B | RED | webhook-revenuecat/index.ts: CANCELLATION テスト | supabase/functions/webhook-revenuecat/index.ts | CANCELLATION イベントでサブスク状態が更新されること |
| T1195 | P4 | B | GREEN | webhook-revenuecat/index.ts: 実装 | supabase/functions/webhook-revenuecat/index.ts | RevenueCat Webhook Handler が実装されること |
| T1196 | P4 | B | RED | webhook-stripe/index.ts: 署名検証テスト | supabase/functions/webhook-stripe/index.ts | `Stripe-Signature` ヘッダーで署名が検証されること |
| T1197 | P4 | B | RED | webhook-stripe/index.ts: checkout.session.completed テスト | supabase/functions/webhook-stripe/index.ts | checkout.session.completed イベントでサブスク状態が更新されること |
| T1198 | P4 | B | RED | webhook-stripe/index.ts: customer.subscription.deleted テスト | supabase/functions/webhook-stripe/index.ts | customer.subscription.deleted イベントでサブスクがキャンセルされること |
| T1199 | P4 | B | RED | webhook-stripe/index.ts: 冪等性テスト | supabase/functions/webhook-stripe/index.ts | 重複Stripeイベントの処理がスキップされること |
| T1200 | P4 | B | GREEN | webhook-stripe/index.ts: 実装 | supabase/functions/webhook-stripe/index.ts | Stripe Webhook Handler が実装されること |
| T1201 | P4 | B | RED | stripe-checkout/index.ts: セッション作成テスト | supabase/functions/stripe-checkout/index.ts | Stripe Checkout セッションが作成されること |
| T1202 | P4 | B | RED | stripe-checkout/index.ts: JWT認証テスト | supabase/functions/stripe-checkout/index.ts | Authorization JWTが検証されること |
| T1203 | P4 | B | RED | stripe-checkout/index.ts: 月額プラン設定テスト | supabase/functions/stripe-checkout/index.ts | 月額プランのPrice IDがセッションに設定されること |
| T1204 | P4 | B | RED | stripe-checkout/index.ts: 年額プラン設定テスト | supabase/functions/stripe-checkout/index.ts | 年額プランのPrice IDがセッションに設定されること |
| T1205 | P4 | B | RED | stripe-checkout/index.ts: success_url設定テスト | supabase/functions/stripe-checkout/index.ts | 購入完了後のリダイレクトURLが設定されること |
| T1206 | P4 | B | GREEN | stripe-checkout/index.ts: 実装 | supabase/functions/stripe-checkout/index.ts | Stripe Checkout セッション作成 Edge Function が実装されること |
| T1207 | P4 | B | RED | stripe-portal/index.ts: Customer Portal セッション作成テスト | supabase/functions/stripe-portal/index.ts | Stripe Customer Portal セッションが作成されること |
| T1208 | P4 | B | RED | stripe-portal/index.ts: Customer ID 検索テスト | supabase/functions/stripe-portal/index.ts | Supabase から Stripe Customer ID が取得されること |
| T1209 | P4 | B | GREEN | stripe-portal/index.ts: 実装 | supabase/functions/stripe-portal/index.ts | Stripe Customer Portal Edge Function が実装されること |
| T1210 | P4 | C | RED | generate-twin-conversation/index.ts: 会話生成テスト | supabase/functions/generate-twin-conversation/index.ts | 2人のツイン間の会話が生成されること |
| T1211 | P4 | C | RED | generate-twin-conversation/index.ts: Big Five 相性スコアテスト | supabase/functions/generate-twin-conversation/index.ts | Big Five の相性スコアが計算されること |
| T1212 | P4 | C | RED | generate-twin-conversation/index.ts: Pro制限テスト | supabase/functions/generate-twin-conversation/index.ts | Freeユーザーが呼び出した場合403が返されること |
| T1213 | P4 | C | GREEN | generate-twin-conversation/index.ts: 実装 | supabase/functions/generate-twin-conversation/index.ts | ツイン会話生成 Edge Function が実装されること |
| T1214 | P4 | A | RED | ogp-fetch/index.ts: OGPメタデータ取得テスト | supabase/functions/ogp-fetch/index.ts | URLからog:title, og:description, og:imageが取得されること |
| T1215 | P4 | A | RED | ogp-fetch/index.ts: レスポンスキャッシュテスト | supabase/functions/ogp-fetch/index.ts | 同じURLのリクエストにキャッシュが返されること |
| T1216 | P4 | A | GREEN | ogp-fetch/index.ts: 実装 | supabase/functions/ogp-fetch/index.ts | OGP フェッチ Edge Function が実装されること |
| T1217 | P4 | A | RED | translate/index.ts: 翻訳テスト | supabase/functions/translate/index.ts | OpenAI API でテキストが翻訳されること |
| T1218 | P4 | A | RED | translate/index.ts: ja→en テスト | supabase/functions/translate/index.ts | 日本語テキストが英語に翻訳されること |
| T1219 | P4 | A | RED | translate/index.ts: en→ja テスト | supabase/functions/translate/index.ts | 英語テキストが日本語に翻訳されること |
| T1220 | P4 | A | GREEN | translate/index.ts: 実装 | supabase/functions/translate/index.ts | 翻訳 Edge Function が実装されること |
| T1221 | P4 | D | RED | send-notification/index.ts: プッシュ通知送信テスト | supabase/functions/send-notification/index.ts | Expo Push API でプッシュ通知が送信されること |
| T1222 | P4 | D | RED | send-notification/index.ts: push_tokens 取得テスト | supabase/functions/send-notification/index.ts | push_tokens テーブルからトークンが取得されること |
| T1223 | P4 | D | GREEN | send-notification/index.ts: 実装 | supabase/functions/send-notification/index.ts | プッシュ通知送信 Edge Function が実装されること |
| T1224 | P4 | A | RED | 全Edge Function: CORS テスト | supabase/functions/ | 全Edge FunctionでCORSヘッダーが正しく設定されること |
| T1225 | P4 | A | GREEN | 全Edge Function: CORS 実装 | supabase/functions/_shared/cors.ts | 共通 CORS ユーティリティが実装されること |
| T1226 | P4 | A | RED | 全Edge Function: JWT認証テスト | supabase/functions/ | 認証必須の全Edge FunctionでJWT検証が行われること |
| T1227 | P4 | A | GREEN | 全Edge Function: JWT認証ユーティリティ | supabase/functions/_shared/auth.ts | JWT 検証共通関数が実装されること |
| T1228 | P4 | A | RED | 全Edge Function: エラーレスポンステスト | supabase/functions/ | エラー時に `{error: string, code: number}` 形式が返されること |
| T1229 | P4 | A | GREEN | 全Edge Function: エラーレスポンスユーティリティ | supabase/functions/_shared/errors.ts | エラーレスポンス生成共通関数が実装されること |
| T1230 | P4 | B | RED | webhook-revenuecat/index.ts: token_usage リセットテスト | supabase/functions/webhook-revenuecat/index.ts | Pro RENEWAL 時に月次 token_usage がリセットされること |
| T1231 | P4 | B | GREEN | webhook-revenuecat/index.ts: token_usage リセット実装 | supabase/functions/webhook-revenuecat/index.ts | 月次トークンリセット処理が実装されること |
| T1232 | P4 | C | RED | provision-openclaw/index.ts: stopped→再プロビジョニングテスト | supabase/functions/provision-openclaw/index.ts | status: 'stopped' インスタンスに再プロビジョニングが実行されること |
| T1233 | P4 | C | GREEN | provision-openclaw/index.ts: 再プロビジョニング実装 | supabase/functions/provision-openclaw/index.ts | 既存インスタンスの再プロビジョニングが実装されること |
| T1234 | P4 | C | RED | destroy-openclaw/index.ts: 段階的削除テスト | supabase/functions/destroy-openclaw/index.ts | destroying→確認→stopped の段階的削除が実装されること |
| T1235 | P4 | C | GREEN | destroy-openclaw/index.ts: 段階的削除実装 | supabase/functions/destroy-openclaw/index.ts | 段階的な Droplet 削除フローが実装されること |
| T1236 | P4 | B | RED | stripe-checkout/index.ts: トライアル設定テスト | supabase/functions/stripe-checkout/index.ts | `trial_period_days: 3` が Stripe セッションに設定されること |
| T1237 | P4 | B | GREEN | stripe-checkout/index.ts: トライアル設定実装 | supabase/functions/stripe-checkout/index.ts | 3日間トライアルが Stripe Checkout に設定されること |
| T1238 | P4 | A | RED | 全Edge Function: ロギングテスト | supabase/functions/ | 全Edge Function でリクエスト・レスポンスのロギングが行われること |
| T1239 | P4 | A | GREEN | 全Edge Function: ロギング実装 | supabase/functions/_shared/logger.ts | Edge Function 用ロガーが実装されること |
| T1240 | P4 | A | RED | 全Edge Function: Deno テスト設定 | supabase/functions/ | `deno test` で全Edge Functionのユニットテストが実行されること |
| T1241 | P4 | A | GREEN | 全Edge Function: テスト実行環境 | supabase/functions/ | Deno テスト環境が設定されること |
| T1242 | P4 | A | RED | migration: openclaw_instances テーブル作成テスト | supabase/migrations/ | `openclaw_instances` テーブルが正しいスキーマで作成されること |
| T1243 | P4 | A | GREEN | migration: openclaw_instances 実装 | supabase/migrations/ | openclaw_instances マイグレーションが実行されること |
| T1244 | P4 | A | RED | migration: RLS ポリシーテスト | supabase/migrations/ | openclaw_instances に `auth.uid() = user_id` の RLS が設定されること |
| T1245 | P4 | A | GREEN | migration: RLS ポリシー実装 | supabase/migrations/ | openclaw_instances の RLS ポリシーが実装されること |
| T1246 | P4 | A | RED | migration: webhook_events テーブルテスト | supabase/migrations/ | `webhook_events` テーブルが正しいスキーマで作成されること |
| T1247 | P4 | A | GREEN | migration: webhook_events 実装 | supabase/migrations/ | webhook_events マイグレーションが実行されること |
| T1248 | P4 | A | RED | migration: token_usage テーブルテスト | supabase/migrations/ | `token_usage` テーブルが正しいスキーマで作成されること |
| T1249 | P4 | A | GREEN | migration: token_usage 実装 | supabase/migrations/ | token_usage マイグレーションが実行されること |
| T1250 | P4 | A | RED | migration: communities テーブルテスト | supabase/migrations/ | `communities` テーブルが正しいスキーマで作成されること |
| T1251 | P4 | A | GREEN | migration: communities 実装 | supabase/migrations/ | communities マイグレーションが実行されること |
| T1252 | P4 | A | RED | migration: twin_conversations テーブルテスト | supabase/migrations/ | `twin_conversations` テーブルが正しいスキーマで作成されること |
| T1253 | P4 | A | GREEN | migration: twin_conversations 実装 | supabase/migrations/ | twin_conversations マイグレーションが実行されること |
| T1254 | P4 | A | RED | migration: chat_attachments テーブルテスト | supabase/migrations/ | `chat_attachments` テーブルが正しいスキーマで作成されること |
| T1255 | P4 | A | GREEN | migration: chat_attachments 実装 | supabase/migrations/ | chat_attachments マイグレーションが実行されること |
| T1256 | P4 | A | RED | migration: push_tokens テーブルテスト | supabase/migrations/ | `push_tokens` テーブルが正しいスキーマで作成されること |
| T1257 | P4 | A | GREEN | migration: push_tokens 実装 | supabase/migrations/ | push_tokens マイグレーションが実行されること |
| T1258 | P4 | A | RED | migration: community_members テーブルテスト | supabase/migrations/ | `community_members` テーブルが正しいスキーマで作成されること |
| T1259 | P4 | A | GREEN | migration: community_members 実装 | supabase/migrations/ | community_members マイグレーションが実行されること |
| T1260 | P4 | A | RED | migration: chat_topics テーブルテスト | supabase/migrations/ | `chat_topics` テーブルが正しいスキーマで作成されること |
| T1261 | P4 | A | GREEN | migration: chat_topics 実装 | supabase/migrations/ | chat_topics マイグレーションが実行されること |
| T1262 | P4 | A | RED | migration: twin_profiles_public VIEW テスト | supabase/migrations/ | `twin_profiles_public` VIEW が正しく作成されること |
| T1263 | P4 | A | GREEN | migration: twin_profiles_public 実装 | supabase/migrations/ | twin_profiles_public マイグレーションが実行されること |
| T1264 | P4 | A | RED | migration: profiles avatar_icon 追加テスト | supabase/migrations/ | `profiles.avatar_icon` カラムが追加されること |
| T1265 | P4 | A | GREEN | migration: profiles 拡張実装 | supabase/migrations/ | profiles テーブル拡張マイグレーションが実行されること |
| T1266 | P4 | A | RED | migration: pg_cron 設定テスト | supabase/migrations/ | `pg_cron` で5分ごとのヘルスチェックが設定されること |
| T1267 | P4 | A | GREEN | migration: pg_cron 実装 | supabase/migrations/ | pg_cron によるヘルスチェックスケジュールが設定されること |
| T1268 | P4 | A | RED | migration: 全テーブル RLS 有効テスト | supabase/migrations/ | 全テーブルで Row Level Security が有効になっていること |
| T1269 | P4 | A | GREEN | migration: 全 RLS 実装 | supabase/migrations/ | 全テーブルの RLS ポリシーが実装されること |
| T1270 | P4 | A | RED | migration: DB インデックス テスト | supabase/migrations/ | 頻繁にクエリされるカラムにインデックスが設定されること |
| T1271 | P4 | A | GREEN | migration: DB インデックス実装 | supabase/migrations/ | パフォーマンスインデックスが設定されること |
| T1272 | P4 | C | RED | free-chat/index.ts: 日記連携テスト | supabase/functions/free-chat/index.ts | `save_to_journal: true` パラメーターで journal_entries に保存されること |
| T1273 | P4 | C | GREEN | free-chat/index.ts: 日記連携実装 | supabase/functions/free-chat/index.ts | チャット→日記連携が実装されること |
| T1274 | P4 | C | RED | free-chat/index.ts: トピック対応テスト | supabase/functions/free-chat/index.ts | `topic_id` パラメーターでトピック別チャットが対応されること |
| T1275 | P4 | C | GREEN | free-chat/index.ts: トピック対応実装 | supabase/functions/free-chat/index.ts | トピック別チャットが実装されること |
| T1276 | P4 | B | RED | webhook-stripe/index.ts: OpenClaw連携テスト | supabase/functions/webhook-stripe/index.ts | Stripe 決済完了でプロビジョニングが開始されること |
| T1277 | P4 | B | GREEN | webhook-stripe/index.ts: OpenClaw連携実装 | supabase/functions/webhook-stripe/index.ts | Stripe→OpenClaw プロビジョニング連携が実装されること |
| T1278 | P4 | D | RED | send-notification/index.ts: OpenClaw準備完了通知テスト | supabase/functions/send-notification/index.ts | OpenClaw 準備完了時にプッシュ通知が送信されること |
| T1279 | P4 | D | GREEN | send-notification/index.ts: OpenClaw通知実装 | supabase/functions/send-notification/index.ts | OpenClaw 準備完了プッシュ通知が実装されること |
| T1280 | P4 | B | RED | webhook-stripe/index.ts: 解約処理テスト | supabase/functions/webhook-stripe/index.ts | Stripe 解約でOpenClaw破棄が開始されること |
| T1281 | P4 | B | GREEN | webhook-stripe/index.ts: 解約処理実装 | supabase/functions/webhook-stripe/index.ts | Stripe 解約→OpenClaw 破棄連携が実装されること |
| T1282 | P4 | A | RED | 全Edge Function: セキュリティテスト | supabase/functions/ | SQL インジェクション・XSS が防止されること |
| T1283 | P4 | A | GREEN | 全Edge Function: セキュリティ強化 | supabase/functions/ | 入力バリデーションが全Edge Functionに実装されること |
| T1284 | P4 | A | RED | 全Edge Function: タイムアウト設定テスト | supabase/functions/ | 全Edge Functionに適切なタイムアウトが設定されること |
| T1285 | P4 | A | GREEN | 全Edge Function: タイムアウト実装 | supabase/functions/ | Edge Function タイムアウトが設定されること |
| T1286 | P4 | A | RED | 全Edge Function: レート制限テスト | supabase/functions/ | 1ユーザーあたりのリクエスト制限が実装されること |
| T1287 | P4 | A | GREEN | 全Edge Function: レート制限実装 | supabase/functions/_shared/rate-limit.ts | レート制限共通関数が実装されること |
| T1288 | P4 | A | REFACTOR | 全Edge Function: _shared モジュール整備 | supabase/functions/_shared/ | 共通ユーティリティが整備されること |
| T1289 | P4 | A | REFACTOR | 全Edge Function: テストカバレッジ80%確認 | supabase/functions/ | 全Edge Functionのテストカバレッジが80%以上であること |
| T1290 | P4 | C | RED | provision-openclaw/index.ts: gateway_token生成テスト | supabase/functions/provision-openclaw/index.ts | UUID v4 形式のGatewayトークンが生成されること |
| T1291 | P4 | C | GREEN | provision-openclaw/index.ts: gateway_token生成実装 | supabase/functions/provision-openclaw/index.ts | Gateway トークン生成が実装されること |
| T1292 | P4 | C | RED | provision-openclaw/index.ts: IP保存テスト | supabase/functions/provision-openclaw/index.ts | Dropletの IPアドレスがopenclaw_instancesに保存されること |
| T1293 | P4 | C | GREEN | provision-openclaw/index.ts: IP保存実装 | supabase/functions/provision-openclaw/index.ts | Droplet IPアドレスの保存が実装されること |
| T1294 | P4 | A | RED | migration: community_messages テーブルテスト | supabase/migrations/ | `community_messages` テーブルが正しいスキーマで作成されること |
| T1295 | P4 | A | GREEN | migration: community_messages 実装 | supabase/migrations/ | community_messages マイグレーションが実行されること |
| T1296 | P4 | B | RED | webhook-revenuecat/index.ts: 課金トライアル処理テスト | supabase/functions/webhook-revenuecat/index.ts | TRIAL_STARTED イベントでサブスク状態が更新されること |
| T1297 | P4 | B | GREEN | webhook-revenuecat/index.ts: トライアル処理実装 | supabase/functions/webhook-revenuecat/index.ts | トライアル期間の処理が実装されること |
| T1298 | P4 | A | RED | migration: DB トリガー テスト | supabase/migrations/ | 新規ユーザー登録時に profiles が自動作成されること |
| T1299 | P4 | A | GREEN | migration: DB トリガー実装 | supabase/migrations/ | profiles 自動作成トリガーが実装されること |
| T1300 | P4 | A | REFACTOR | 全Edge Function: コードレビュー | supabase/functions/ | 全Edge Functionのコードが品質基準を満たすこと |
| T1301 | P4 | C | RED | generate-twin-conversation/index.ts: 言語設定テスト | supabase/functions/generate-twin-conversation/index.ts | ツインのlocale設定に応じた言語で会話が生成されること |
| T1302 | P4 | C | GREEN | generate-twin-conversation/index.ts: 言語設定実装 | supabase/functions/generate-twin-conversation/index.ts | ロケール対応の会話生成が実装されること |
| T1303 | P4 | D | RED | notification-settings/index.ts: 設定取得テスト | supabase/functions/notification-settings/index.ts | ユーザーの通知設定が取得されること |
| T1304 | P4 | D | GREEN | notification-settings/index.ts: 実装 | supabase/functions/notification-settings/index.ts | 通知設定管理 Edge Function が実装されること |
| T1305 | P4 | A | RED | 全Migration: ロールバックテスト | supabase/migrations/ | 全マイグレーションがロールバック可能であること |
| T1306 | P4 | A | GREEN | 全Migration: ロールバック実装 | supabase/migrations/ | 全マイグレーションにダウン方向のSQLが実装されること |
| T1307 | P4 | A | RED | 全Migration: CI実行テスト | supabase/migrations/ | `supabase db reset` がCIで正常に完了すること |
| T1308 | P4 | A | GREEN | 全Migration: CI設定 | .github/workflows/db-migration.yml | DB マイグレーションCIが設定されること |
| T1309 | P4 | A | REFACTOR | 全Migration: 命名規約統一 | supabase/migrations/ | マイグレーションファイルが `YYYYMMDDHHMMSS_description.sql` 形式であること |
| T1310 | P4 | A | REFACTOR | 全Edge Function: デプロイ設定 | supabase/config.toml | 全Edge Functionがデプロイ設定に含まれること |


---

## H. E2Eテスト（~100タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1311 | P5 | A | RED | E2E: Googleログインフローテスト | e2e/auth/google-login.spec.ts | Google OAuth ログイン→オンボーディング→メインタブ遷移の完全フロー |
| T1312 | P5 | A | RED | E2E: ゲストモードフローテスト | e2e/auth/guest-mode.spec.ts | ゲストとして閲覧→コミュニティ表示→ログインCTA表示の完全フロー |
| T1313 | P5 | A | RED | E2E: ログアウトフローテスト | e2e/auth/logout.spec.ts | ログアウト→ログイン画面遷移→ストアクリアの確認 |
| T1314 | P5 | A | RED | E2E: ディープリンクフローテスト | e2e/auth/deep-link.spec.ts | `altme://chat` ディープリンクでチャット画面に直接遷移するフロー |
| T1315 | P5 | C | RED | E2E: オンボーディング完全フローテスト | e2e/onboarding/full-flow.spec.ts | welcome→quiz→result→avatar→tone→meet-twin の6画面完全フロー |
| T1316 | P5 | C | RED | E2E: 性格診断5問回答テスト | e2e/onboarding/personality-quiz.spec.ts | 5問の性格診断を回答して結果画面に遷移するフロー |
| T1317 | P5 | C | RED | E2E: アバター選択テスト | e2e/onboarding/choose-avatar.spec.ts | 30種のアバターから1つを選択して次へ進むフロー |
| T1318 | P5 | C | RED | E2E: ツイン口調選択テスト | e2e/onboarding/choose-tone.spec.ts | 5つの口調パターンから1つを選択して次へ進むフロー |
| T1319 | P5 | C | RED | E2E: Free チャットフローテスト | e2e/chat/free-chat.spec.ts | Freeユーザーがメッセージ送信→SSEストリーミング受信の完全フロー |
| T1320 | P5 | C | RED | E2E: トピック切替テスト | e2e/chat/topic-switch.spec.ts | daily→work→reflection→consultation タブ切替フロー |
| T1321 | P5 | C | RED | E2E: 画像添付チャットテスト | e2e/chat/image-attachment.spec.ts | 画像ファイル選択→プレビュー表示→送信フロー |
| T1322 | P5 | C | RED | E2E: Drag&Drop チャットテスト | e2e/chat/drag-drop.spec.ts | Web でファイルドロップ→プレビュー→送信フロー |
| T1323 | P5 | C | RED | E2E: クリップボード貼り付けテスト | e2e/chat/clipboard-paste.spec.ts | 画像コピー→チャット欄貼り付け→送信フロー |
| T1324 | P5 | C | RED | E2E: スクロールページネーションテスト | e2e/chat/pagination.spec.ts | チャット上部スクロールで過去50件が追加ロードされるフロー |
| T1325 | P5 | C | RED | E2E: 日記保存フローテスト | e2e/chat/journal-save.spec.ts | チャットメッセージ→「日記に保存」→journal_entries 保存確認フロー |
| T1326 | P5 | C | RED | E2E: 翻訳機能テスト | e2e/chat/translation.spec.ts | メッセージ翻訳ボタン→ja↔en 翻訳表示フロー |
| T1327 | P5 | B | RED | E2E: Web Stripe課金フローテスト | e2e/subscription/stripe-checkout.spec.ts | ペイウォール→Stripe Checkout→完了→サブスク状態確認の完全フロー |
| T1328 | P5 | B | RED | E2E: Stripe Portal フローテスト | e2e/subscription/stripe-portal.spec.ts | 設定→「サブスク管理」→Stripe Customer Portal 表示フロー |
| T1329 | P5 | D | RED | E2E: コミュニティ閲覧フローテスト | e2e/community/browse.spec.ts | コミュニティ一覧→詳細→ツイン会話表示の完全フロー |
| T1330 | P5 | D | RED | E2E: コミュニティ作成フローテスト | e2e/community/create.spec.ts | 作成ボタン→フォーム入力→サムネイル選択→作成完了フロー |
| T1331 | P5 | D | RED | E2E: コミュニティ参加フローテスト | e2e/community/join.spec.ts | コミュニティ詳細→「参加」ボタン→メンバー状態確認フロー |
| T1332 | P5 | D | RED | E2E: 言語フィルターテスト | e2e/community/language-filter.spec.ts | jp/en フィルター切替でコミュニティリストが変化するフロー |
| T1333 | P5 | D | RED | E2E: ツイン情報表示テスト | e2e/insights/twin-info.spec.ts | ツイン情報タブ→Big Five チャート→気分入力の完全フロー |
| T1334 | P5 | D | RED | E2E: 気分トラッキングテスト | e2e/insights/mood-tracking.spec.ts | 気分絵文字選択→保存→7日間チャート更新フロー |
| T1335 | P5 | D | RED | E2E: 設定プロフィール編集テスト | e2e/settings/profile-edit.spec.ts | プロフィール編集→display_name更新→保存確認フロー |
| T1336 | P5 | D | RED | E2E: ツイン設定変更テスト | e2e/settings/twin-settings.spec.ts | ツイン名・アバター・口調の変更→保存→反映確認フロー |
| T1337 | P5 | D | RED | E2E: MBTI設定フローテスト | e2e/settings/mbti.spec.ts | MBTI 選択画面→16タイプ選択→保存→バッジ更新フロー |
| T1338 | P5 | D | RED | E2E: SOUL.md再生成テスト | e2e/settings/soul-md-regen.spec.ts | 「SOUL.md再生成」→Edge Function呼び出し→完了通知フロー |
| T1339 | P5 | D | RED | E2E: 通知設定テスト | e2e/settings/notifications.spec.ts | 通知設定画面→チャット通知ON/OFF→リマインダー時刻設定フロー |
| T1340 | P5 | D | RED | E2E: アカウント削除フローテスト | e2e/settings/account-delete.spec.ts | アカウント削除→「DELETE」入力→確認→ログイン画面遷移フロー |
| T1341 | P5 | A | RED | E2E: レスポンシブ mobile テスト | e2e/responsive/mobile.spec.ts | 375px 幅でボトムタブ表示・サイドバー非表示の確認 |
| T1342 | P5 | A | RED | E2E: レスポンシブ tablet テスト | e2e/responsive/tablet.spec.ts | 768px 幅で適切なレイアウトが表示されること |
| T1343 | P5 | A | RED | E2E: レスポンシブ desktop テスト | e2e/responsive/desktop.spec.ts | 1024px 幅でサイドバー表示・2カラムレイアウトの確認 |
| T1344 | P5 | A | RED | E2E: レスポンシブ wide テスト | e2e/responsive/wide.spec.ts | 1440px 幅で wide レイアウトが表示されること |
| T1345 | P5 | A | RED | E2E: オフライン対応テスト | e2e/network/offline.spec.ts | ネットワーク切断→オフラインバナー表示→復帰→自動再接続フロー |
| T1346 | P5 | A | RED | E2E: WebSocket再接続テスト | e2e/network/websocket-reconnect.spec.ts | WebSocket切断→バックオフ表示→自動再接続→再送信フロー |
| T1347 | P5 | A | RED | E2E: ブラウザ間互換性テスト (Chrome) | e2e/cross-browser/chrome.spec.ts | Chrome で主要フローが正常に動作すること |
| T1348 | P5 | A | RED | E2E: ブラウザ間互換性テスト (Firefox) | e2e/cross-browser/firefox.spec.ts | Firefox で主要フローが正常に動作すること |
| T1349 | P5 | A | RED | E2E: ブラウザ間互換性テスト (Safari) | e2e/cross-browser/safari.spec.ts | Safari(WebKit) で主要フローが正常に動作すること |
| T1350 | P5 | A | RED | E2E: ブラウザ間互換性テスト (Edge) | e2e/cross-browser/edge.spec.ts | Edge で主要フローが正常に動作すること |
| T1351 | P5 | A | RED | E2E: スクリーンショット差分テスト (login) | e2e/visual/login.spec.ts | ログイン画面のスクリーンショットが基準画像と一致すること |
| T1352 | P5 | A | RED | E2E: スクリーンショット差分テスト (chat) | e2e/visual/chat.spec.ts | チャット画面のスクリーンショットが基準画像と一致すること |
| T1353 | P5 | A | RED | E2E: スクリーンショット差分テスト (paywall) | e2e/visual/paywall.spec.ts | ペイウォール画面のスクリーンショットが基準画像と一致すること |
| T1354 | P5 | A | GREEN | E2E: 全テスト実装完了 | e2e/ | `npx playwright test` で全E2Eテストがパスすること |
| T1355 | P5 | A | GREEN | E2E: CI 設定 | .github/workflows/e2e.yml | Playwright E2EテストがCIで自動実行されること |
| T1356 | P5 | A | RED | E2E: PWAインストールテスト | e2e/pwa/install.spec.ts | PWA インストールプロンプトが表示されること |
| T1357 | P5 | A | RED | E2E: PWAオフライン動作テスト | e2e/pwa/offline.spec.ts | PWA インストール後にオフラインでキャッシュページが表示されること |
| T1358 | P5 | D | RED | E2E: Pro コミュニティフルアクセステスト | e2e/subscription/pro-community.spec.ts | Pro昇格後にコミュニティ全機能がアンロックされるフロー |
| T1359 | P5 | B | RED | E2E: Free→Pro アップグレードフローテスト | e2e/subscription/upgrade.spec.ts | Freeユーザー→ペイウォール→Stripe Checkout→Pro昇格の完全フロー |
| T1360 | P5 | A | RED | E2E: ページタイトルテスト | e2e/seo/page-title.spec.ts | 各画面の `document.title` が正しく設定されていること |
| T1361 | P5 | A | RED | E2E: OGP metadata テスト | e2e/seo/ogp.spec.ts | OGP メタタグが正しく設定されていること |
| T1362 | P5 | A | RED | E2E: robots.txt テスト | e2e/seo/robots.spec.ts | robots.txt が正しく配信されること |
| T1363 | P5 | A | RED | E2E: KeyboardNavigation テスト | e2e/a11y/keyboard-navigation.spec.ts | Tab キーのみで全主要機能にアクセスできること |
| T1364 | P5 | A | RED | E2E: Screen Reader テスト | e2e/a11y/screen-reader.spec.ts | NVDA/VoiceOver でコンテンツが適切に読み上げられること |
| T1365 | P5 | C | RED | E2E: Markdown レンダリングテスト | e2e/chat/markdown.spec.ts | AI応答のMarkdownが正しくレンダリングされること |
| T1366 | P5 | C | RED | E2E: OGP プレビューテスト | e2e/chat/ogp-preview.spec.ts | URL を含むメッセージに OGP プレビューカードが表示されること |
| T1367 | P5 | C | RED | E2E: ストリーミング表示テスト | e2e/chat/streaming.spec.ts | AI応答がリアルタイムにストリーミング表示されること |
| T1368 | P5 | A | RED | E2E: コピーボタン機能テスト | e2e/chat/copy-button.spec.ts | メッセージのコピーボタンでクリップボードに保存されること |
| T1369 | P5 | D | RED | E2E: 日記AI振り返りテスト | e2e/journal/ai-reflection.spec.ts | 日記作成→AI振り返りコメント生成フロー |
| T1370 | P5 | A | GREEN | E2E: Playwright レポート設定 | playwright.config.ts | `reporter: 'html'` でHTMLレポートが生成されること |
| T1371 | P5 | A | REFACTOR | E2E: フィクスチャー共通化 | e2e/fixtures/ | 認証済みユーザー・Proユーザーのフィクスチャーが共通化されること |
| T1372 | P5 | A | REFACTOR | E2E: POM (Page Object Model) 導入 | e2e/pages/ | Page Object Model でテストの保守性が向上すること |
| T1373 | P5 | A | RED | E2E: パフォーマンス (LCP < 3s) テスト | e2e/performance/lcp.spec.ts | チャット画面の LCP が 3 秒以内であること |
| T1374 | P5 | A | RED | E2E: バンドルサイズテスト | e2e/performance/bundle-size.spec.ts | gzip圧縮後のバンドルサイズが 500KB 以内であること |
| T1375 | P5 | A | RED | E2E: 認証コールバックリダイレクトテスト | e2e/auth/callback-redirect.spec.ts | OAuth コールバック後の正しいリダイレクト確認 |
| T1376 | P5 | A | GREEN | E2E: 全テスト実行環境設定 | playwright.config.ts | すべての E2E テストが CI で安定して実行されること |
| T1377 | P5 | A | RED | E2E: エラーページテスト | e2e/error/404.spec.ts | 存在しない URL で 404 ページが表示されること |
| T1378 | P5 | A | RED | E2E: セッション維持テスト | e2e/auth/session-persistence.spec.ts | ページリロード後もセッションが維持されること |
| T1379 | P5 | A | RED | E2E: CORS テスト | e2e/security/cors.spec.ts | 許可されていないオリジンからのリクエストが拒否されること |
| T1380 | P5 | A | GREEN | E2E: セキュリティテスト設定 | e2e/security/ | セキュリティ E2E テストが CI で実行されること |
| T1381 | P5 | D | RED | E2E: 通知設定保存テスト | e2e/settings/notifications-save.spec.ts | 通知設定変更→保存→再読み込み→設定が保持されるフロー |
| T1382 | P5 | A | RED | E2E: ダークモード確認テスト | e2e/visual/dark-mode.spec.ts | V4 Dark Premium テーマが全画面で適用されること |
| T1383 | P5 | A | REFACTOR | E2E: テスト並列化設定 | playwright.config.ts | テストが並列実行されてCI時間が短縮されること |
| T1384 | P5 | A | REFACTOR | E2E: 失敗時スクリーンショット | playwright.config.ts | テスト失敗時にスクリーンショットが自動保存されること |
| T1385 | P5 | C | RED | E2E: Pro WebSocket チャットフローテスト | e2e/chat/pro-websocket.spec.ts | Pro ユーザーで WebSocket 経由のチャット完全フロー |
| T1386 | P5 | D | RED | E2E: インスタンス状態確認テスト | e2e/settings/instance-status.spec.ts | 設定画面でOpenClawインスタンス状態が表示されるフロー |
| T1387 | P5 | A | RED | E2E: ページ遷移速度テスト | e2e/performance/navigation.spec.ts | ページ遷移が 1 秒以内に完了すること |
| T1388 | P5 | A | RED | E2E: フォントロードテスト | e2e/performance/font-load.spec.ts | Web フォントが 2 秒以内にロードされること |
| T1389 | P5 | A | RED | E2E: TTI (Time to Interactive) テスト | e2e/performance/tti.spec.ts | TTI が 5 秒以内であること |
| T1390 | P5 | A | GREEN | E2E: パフォーマンス計測設定 | e2e/performance/ | パフォーマンスメトリクス E2E テストが設定されること |
| T1391 | P5 | B | RED | E2E: Webhook処理確認テスト | e2e/subscription/webhook.spec.ts | Stripe Webhook 受信→DB 更新の確認フロー |
| T1392 | P5 | A | RED | E2E: i18n テスト | e2e/i18n/language.spec.ts | 日本語テキストが全画面で正しく表示されること |
| T1393 | P5 | A | GREEN | E2E: テストデータクリーンアップ | e2e/fixtures/cleanup.ts | テスト実行後にテストデータが削除されること |
| T1394 | P5 | A | REFACTOR | E2E: テスト実行時間最適化 | e2e/ | E2E テスト全体の実行時間が 10 分以内に収まること |
| T1395 | P5 | A | REFACTOR | E2E: Playwright 最新 API 対応 | e2e/ | Playwright の最新機能を活用したテストが実装されること |
| T1396 | P5 | A | RED | E2E: アクセシビリティ axe-core テスト | e2e/a11y/axe.spec.ts | axe-core で全画面の a11y エラーが0件であること |
| T1397 | P5 | A | GREEN | E2E: axe-core 統合 | e2e/a11y/ | `@axe-core/playwright` が全画面テストに統合されること |
| T1398 | P5 | A | RED | E2E: コントラスト比テスト | e2e/a11y/contrast.spec.ts | テキストのコントラスト比が WCAG AA 基準（4.5:1）を満たすこと |
| T1399 | P5 | A | GREEN | E2E: アクセシビリティ CI 設定 | .github/workflows/a11y.yml | アクセシビリティ E2E テストが CI で実行されること |
| T1400 | P5 | A | REFACTOR | E2E: 全テスト安定化 | e2e/ | フレーキーなテストが特定・修正されること |
| T1401 | P5 | A | RED | E2E: メモリリークテスト | e2e/performance/memory.spec.ts | チャット画面での長時間使用でメモリリークが発生しないこと |
| T1402 | P5 | A | RED | E2E: 画像最適化テスト | e2e/performance/images.spec.ts | 画像が WebP 形式で配信されること |
| T1403 | P5 | A | GREEN | E2E: CI/CD 完全統合 | .github/workflows/ | E2E・ユニット・型チェックが全てCI/CDパイプラインに組み込まれること |
| T1404 | P5 | A | REFACTOR | E2E: ドキュメント整備 | e2e/README.md | E2E テストの実行方法・追加方法がドキュメント化されること |
| T1405 | P5 | A | RED | E2E: ログイン状態ストレージテスト | e2e/auth/storage-state.spec.ts | Playwright `storageState` でセッションが再利用されること |


---

## I. セキュリティ（~80タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1406 | P5 | A | RED | セキュリティ: SQLインジェクションテスト | src/services/supabase/ | パラメータ化クエリでSQL インジェクションが防止されること |
| T1407 | P5 | A | GREEN | セキュリティ: SQLインジェクション対策 | src/services/supabase/ | 全DB操作でパラメータ化クエリが使われること |
| T1408 | P5 | A | RED | セキュリティ: XSS防止テスト (Markdown) | src/shared/components/__tests__/markdown-renderer.web.test.tsx | `<script>` タグが Markdown レンダリング時に除去されること |
| T1409 | P5 | A | GREEN | セキュリティ: XSS防止実装 | src/shared/components/markdown-renderer.web.tsx | DOMPurify でXSSが防止されること |
| T1410 | P5 | A | RED | セキュリティ: CSP ヘッダーテスト | web/index.html | `Content-Security-Policy` が設定されること |
| T1411 | P5 | A | GREEN | セキュリティ: CSP実装 | web/index.html | 厳格なCSPポリシーが設定されること |
| T1412 | P5 | A | RED | セキュリティ: CSRF トークンテスト | src/services/ | フォーム送信に CSRF トークンが含まれること |
| T1413 | P5 | A | GREEN | セキュリティ: CSRF対策実装 | src/services/ | CSRF トークン検証が実装されること |
| T1414 | P5 | A | RED | セキュリティ: APIキー漏洩チェックテスト | src/ | クライアントサイドにシークレットキーが含まれないこと |
| T1415 | P5 | A | GREEN | セキュリティ: APIキー保護実装 | src/config/ | 全シークレットが環境変数経由でのみアクセスされること |
| T1416 | P5 | A | RED | セキュリティ: JWT検証テスト | supabase/functions/ | 全認証必須APIでJWT署名検証が行われること |
| T1417 | P5 | A | GREEN | セキュリティ: JWT検証実装 | supabase/functions/_shared/auth.ts | JWT検証が全Edge Functionに適用されること |
| T1418 | P5 | A | RED | セキュリティ: RLS 自己アクセスのみテスト | supabase/migrations/ | `profiles` テーブルで他ユーザーのデータにアクセスできないこと |
| T1419 | P5 | A | GREEN | セキュリティ: RLS 実装確認 | supabase/migrations/ | 全テーブルのRLSポリシーが正しく機能すること |
| T1420 | P5 | A | RED | セキュリティ: ブルートフォース対策テスト | supabase/functions/free-chat/index.ts | レート制限で過剰リクエストが拒否されること |
| T1421 | P5 | A | GREEN | セキュリティ: レート制限実装 | supabase/functions/_shared/rate-limit.ts | レート制限が実装されること |
| T1422 | P5 | A | RED | セキュリティ: Supabase Auth PKCE テスト | src/services/supabase/auth.web.ts | Web OAuth で PKCE フローが使用されること |
| T1423 | P5 | A | GREEN | セキュリティ: PKCE実装確認 | src/services/supabase/auth.web.ts | `flowType: 'pkce'` が設定されること |
| T1424 | P5 | A | RED | セキュリティ: SecureStore 使用テスト | src/services/supabase/client.native.ts | Native でセッショントークンが SecureStore に保存されること |
| T1425 | P5 | A | GREEN | セキュリティ: SecureStore実装確認 | src/services/supabase/client.native.ts | `expo-secure-store` でトークンが保護されること |
| T1426 | P5 | B | RED | セキュリティ: Stripe Webhook 署名検証テスト | supabase/functions/webhook-stripe/index.ts | `Stripe-Signature` ヘッダーの署名が検証されること |
| T1427 | P5 | B | GREEN | セキュリティ: Stripe署名検証実装 | supabase/functions/webhook-stripe/index.ts | stripe.webhooks.constructEvent で署名が検証されること |
| T1428 | P5 | B | RED | セキュリティ: RevenueCat Webhook 署名テスト | supabase/functions/webhook-revenuecat/index.ts | 共有シークレットで Webhook が検証されること |
| T1429 | P5 | B | GREEN | セキュリティ: RevenueCat署名検証実装 | supabase/functions/webhook-revenuecat/index.ts | Webhook 署名検証が実装されること |
| T1430 | P5 | C | RED | セキュリティ: Gateway Token 保護テスト | src/services/openclaw/ | Gateway Token がクライアントサイドに露出しないこと |
| T1431 | P5 | C | GREEN | セキュリティ: Gateway Token 保護実装 | src/services/openclaw/ | Gateway Token が DB 暗号化カラムから取得されること |
| T1432 | P5 | A | RED | セキュリティ: DigitalOcean APIキー保護テスト | src/services/digitalocean/ | DO APIキーがEdge Function経由でのみ使用されること |
| T1433 | P5 | A | GREEN | セキュリティ: DO APIキー保護実装 | supabase/functions/provision-openclaw/index.ts | DO APIキーがSupabase Secretsで管理されること |
| T1434 | P5 | A | RED | セキュリティ: httpOnly Cookie テスト | src/services/supabase/client.web.ts | Web セッションが httpOnly Cookie に保存されること |
| T1435 | P5 | A | GREEN | セキュリティ: httpOnly Cookie実装 | src/services/supabase/client.web.ts | cookie ストレージが httpOnly 設定されること |
| T1436 | P5 | A | RED | セキュリティ: SameSite Cookie テスト | src/services/supabase/client.web.ts | Cookie に `SameSite=Lax` が設定されること |
| T1437 | P5 | A | GREEN | セキュリティ: SameSite Cookie実装 | src/services/supabase/client.web.ts | `sameSite: 'lax'` が設定されること |
| T1438 | P5 | A | RED | セキュリティ: 入力長さ制限テスト | src/shared/components/__tests__/input.web.test.tsx | すべての入力欄に最大長制限が設定されること |
| T1439 | P5 | A | GREEN | セキュリティ: 入力制限実装 | src/shared/components/input.web.tsx | `maxLength` 属性が全入力欄に設定されること |
| T1440 | P5 | A | RED | セキュリティ: ファイルタイプ検証テスト | src/features/chat/hooks/__tests__/use-chat-attachment.test.ts | 許可されていないファイルタイプがブロックされること |
| T1441 | P5 | A | GREEN | セキュリティ: ファイルタイプ検証実装 | src/features/chat/hooks/use-chat-attachment.ts | MIME タイプ検証が実装されること |
| T1442 | P5 | A | RED | セキュリティ: ファイルサイズ検証テスト | src/features/chat/hooks/__tests__/use-chat-attachment.test.ts | 制限サイズを超えるファイルがブロックされること |
| T1443 | P5 | A | GREEN | セキュリティ: ファイルサイズ検証実装 | src/features/chat/hooks/use-chat-attachment.ts | ファイルサイズ制限検証が実装されること |
| T1444 | P5 | A | RED | セキュリティ: devLogin 本番除外テスト | src/features/auth/ | `__DEV__` が false の場合に devLogin が使用できないこと |
| T1445 | P5 | A | GREEN | セキュリティ: devLogin 本番除外実装 | src/features/auth/hooks/ | 本番環境でのdevLogin無効化が実装されること |
| T1446 | P5 | A | RED | セキュリティ: オープンリダイレクト防止テスト | src/services/supabase/auth-callback.ts | OAuth コールバックで外部URLへのリダイレクトが防止されること |
| T1447 | P5 | A | GREEN | セキュリティ: リダイレクト検証実装 | src/services/supabase/auth-callback.ts | リダイレクト先URLの検証が実装されること |
| T1448 | P5 | A | RED | セキュリティ: npm audit テスト | package.json | `npm audit --audit-level=high` でHighリスクが0件であること |
| T1449 | P5 | A | GREEN | セキュリティ: 脆弱性パッケージ修正 | package.json | 検出された脆弱性パッケージが更新されること |
| T1450 | P5 | A | RED | セキュリティ: Supabase Storage RLS テスト | supabase/migrations/ | Storage のRLSで他ユーザーのファイルにアクセスできないこと |
| T1451 | P5 | A | GREEN | セキュリティ: Storage RLS実装 | supabase/migrations/ | Storage バケットのRLSポリシーが設定されること |
| T1452 | P5 | A | RED | セキュリティ: エラーメッセージ情報漏洩テスト | src/shared/error-handler/ | エラーメッセージに内部実装情報が含まれないこと |
| T1453 | P5 | A | GREEN | セキュリティ: エラーメッセージ安全化 | src/shared/error-handler/ | ユーザー向けエラーメッセージが一般的な表現になること |
| T1454 | P5 | A | RED | セキュリティ: Supabase Secrets 管理テスト | supabase/ | 全シークレットが Supabase Secrets で管理されること |
| T1455 | P5 | A | GREEN | セキュリティ: Secrets 設定確認 | supabase/ | 本番環境の全シークレットが設定されること |
| T1456 | P5 | C | RED | セキュリティ: WebSocket メッセージ検証テスト | src/services/openclaw/websocket-client.ts | 受信WebSocketメッセージのスキーマ検証が行われること |
| T1457 | P5 | C | GREEN | セキュリティ: WebSocketメッセージ検証実装 | src/services/openclaw/websocket-client.ts | Zod でWebSocketメッセージが検証されること |
| T1458 | P5 | A | RED | セキュリティ: OpenClaw UFW 設定テスト | supabase/functions/provision-openclaw/index.ts | cloud-initでポート18789のみ開放されること |
| T1459 | P5 | A | GREEN | セキュリティ: UFW設定実装 | src/services/digitalocean/cloud-init.ts | UFWファイアウォールルールが設定されること |
| T1460 | P5 | A | RED | セキュリティ: HTTPS強制テスト | web/index.html | HTTP アクセスが HTTPS にリダイレクトされること |
| T1461 | P5 | A | GREEN | セキュリティ: HTTPS設定 | web/index.html | HSTS ヘッダーが設定されること |
| T1462 | P5 | A | RED | セキュリティ: cookie Secure属性テスト | src/services/supabase/client.web.ts | Cookie に `Secure` 属性が設定されること |
| T1463 | P5 | A | GREEN | セキュリティ: Secure Cookie実装 | src/services/supabase/client.web.ts | `secure: true` が本番環境で設定されること |
| T1464 | P5 | A | RED | セキュリティ: パスワード強度チェックテスト | - | メール/パスワード認証での脆弱なパスワードが拒否されること（将来対応用） |
| T1465 | P5 | A | RED | セキュリティ: ロールベースアクセス制御テスト | src/shared/hooks/ | Pro機能にFreeユーザーがアクセスできないこと |
| T1466 | P5 | A | GREEN | セキュリティ: RBAC実装確認 | src/shared/hooks/use-subscription.ts | Pro/Freeのアクセス制御が実装されること |
| T1467 | P5 | A | RED | セキュリティ: 監査ログテスト | supabase/ | 重要な操作が audit_logs テーブルに記録されること |
| T1468 | P5 | A | GREEN | セキュリティ: 監査ログ実装 | supabase/ | 重要操作のロギングが実装されること |
| T1469 | P5 | A | RED | セキュリティ: 依存パッケージライセンスチェック | package.json | GPLv3などの非互換ライセンスパッケージが含まれないこと |
| T1470 | P5 | A | GREEN | セキュリティ: ライセンスチェック実装 | package.json | `license-checker` でライセンス検証が設定されること |
| T1471 | P5 | A | RED | セキュリティ: subresource integrity テスト | web/index.html | CDN リソースに SRI ハッシュが設定されること |
| T1472 | P5 | A | GREEN | セキュリティ: SRI実装 | web/index.html | CDN リソースの SRI が実装されること |
| T1473 | P5 | A | RED | セキュリティ: フォームオートコンプリート制御テスト | src/shared/components/__tests__/input.web.test.tsx | パスワード・機密フィールドに `autocomplete="off"` が設定されること |
| T1474 | P5 | A | GREEN | セキュリティ: オートコンプリート制御実装 | src/shared/components/input.web.tsx | 機密入力欄の `autocomplete` が制御されること |
| T1475 | P5 | A | REFACTOR | セキュリティ: OWASP Top 10 チェックリスト完了 | - | OWASP Mobile Top 10 の全チェック項目を確認すること |
| T1476 | P5 | A | REFACTOR | セキュリティ: ペネトレーションテスト | - | 主要な攻撃ベクターに対してペネトレーションテストを実行すること |
| T1477 | P5 | A | RED | セキュリティ: Content-Type 強制テスト | supabase/functions/ | Edge Function レスポンスに適切な Content-Type が設定されること |
| T1478 | P5 | A | GREEN | セキュリティ: Content-Type実装 | supabase/functions/ | 全Edge Functionに Content-Type ヘッダーが設定されること |
| T1479 | P5 | A | RED | セキュリティ: X-Frame-Options テスト | web/index.html | Clickjacking を防ぐ X-Frame-Options が設定されること |
| T1480 | P5 | A | GREEN | セキュリティ: X-Frame-Options実装 | web/index.html | X-Frame-Options: DENY が設定されること |
| T1481 | P5 | A | RED | セキュリティ: X-Content-Type-Options テスト | web/index.html | MIME スニッフィングを防ぐ X-Content-Type-Options が設定されること |
| T1482 | P5 | A | GREEN | セキュリティ: X-Content-Type-Options実装 | web/index.html | X-Content-Type-Options: nosniff が設定されること |
| T1483 | P5 | A | RED | セキュリティ: Referrer-Policy テスト | web/index.html | Referrer-Policy: strict-origin が設定されること |
| T1484 | P5 | A | GREEN | セキュリティ: Referrer-Policy実装 | web/index.html | Referrer-Policy ヘッダーが設定されること |
| T1485 | P5 | A | REFACTOR | セキュリティ: セキュリティヘッダー自動テスト | .github/workflows/security.yml | セキュリティヘッダーの CI 自動チェックが設定されること |

---

## J. パフォーマンス（~40タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1486 | P6 | A | RED | パフォーマンス: LCP < 3秒テスト | e2e/performance/lcp.spec.ts | チャット画面の LCP が 3 秒以内であること |
| T1487 | P6 | A | RED | パフォーマンス: バンドルサイズ < 500KBテスト | e2e/performance/bundle-size.spec.ts | gzip 後のバンドルサイズが 500KB 以内であること |
| T1488 | P6 | A | GREEN | パフォーマンス: コード分割実装 | app/ | React.lazy で各画面がコード分割されること |
| T1489 | P6 | A | RED | パフォーマンス: 画像最適化テスト | e2e/performance/images.spec.ts | 画像が WebP 形式で 200KB 以内であること |
| T1490 | P6 | A | GREEN | パフォーマンス: 画像最適化実装 | app/ | expo-image で画像が最適化配信されること |
| T1491 | P6 | A | RED | パフォーマンス: フォントローディングテスト | e2e/performance/font-load.spec.ts | Web フォントが `display: swap` で読み込まれること |
| T1492 | P6 | A | GREEN | パフォーマンス: フォント最適化実装 | web/index.html | `font-display: swap` が設定されること |
| T1493 | P6 | A | RED | パフォーマンス: 不要な再レンダリングテスト | src/ | React Profiler で不要な再レンダリングが0件であること |
| T1494 | P6 | A | GREEN | パフォーマンス: メモ化実装 | src/ | `React.memo`, `useMemo`, `useCallback` で再レンダリングが最適化されること |
| T1495 | P6 | A | RED | パフォーマンス: FlashList使用テスト | src/ | 長リストが `FlashList`/`LegendList` で実装されること |
| T1496 | P6 | A | GREEN | パフォーマンス: FlashList実装確認 | src/ | ScrollView + .map() パターンが FlashList に変換されること |
| T1497 | P6 | A | RED | パフォーマンス: IntersectionObserver使用テスト | src/shared/components/ | Web の無限スクロールが IntersectionObserver で実装されること |
| T1498 | P6 | A | GREEN | パフォーマンス: IntersectionObserver実装 | src/shared/components/infinite-scroll-list.web.tsx | IntersectionObserver ベースの無限スクロールが実装されること |
| T1499 | P6 | A | RED | パフォーマンス: Service Worker キャッシュテスト | web/sw.js | 静的アセットが Service Worker でキャッシュされること |
| T1500 | P6 | A | GREEN | パフォーマンス: Service Worker実装 | web/sw.js | Cache-First 戦略の Service Worker が実装されること |
| T1501 | P6 | A | RED | パフォーマンス: HTTP/2 対応テスト | - | サーバーが HTTP/2 で通信すること |
| T1502 | P6 | A | RED | パフォーマンス: Supabase クエリ最適化テスト | src/services/supabase/ | N+1 クエリが発生していないこと |
| T1503 | P6 | A | GREEN | パフォーマンス: クエリ最適化実装 | src/services/supabase/ | Supabase の select で必要なカラムのみ取得されること |
| T1504 | P6 | A | RED | パフォーマンス: メモリ使用量テスト | e2e/performance/memory.spec.ts | チャット画面で 100 件メッセージ表示後のメモリ使用量が許容範囲内であること |
| T1505 | P6 | A | GREEN | パフォーマンス: メモリ最適化実装 | src/features/chat/ | メッセージリストの仮想化が実装されること |
| T1506 | P6 | A | RED | パフォーマンス: WebSocket メッセージバッチングテスト | src/services/openclaw/websocket-client.ts | 短時間の複数メッセージがバッチ処理されること |
| T1507 | P6 | A | GREEN | パフォーマンス: メッセージバッチング実装 | src/services/openclaw/websocket-client.ts | WebSocket メッセージバッチング処理が実装されること |
| T1508 | P6 | A | RED | パフォーマンス: debounce API呼び出しテスト | src/shared/hooks/__tests__/use-debounce.test.ts | 検索入力が 300ms デバウンスされること |
| T1509 | P6 | A | GREEN | パフォーマンス: debounce実装確認 | src/shared/hooks/use-debounce.ts | デバウンス hook が全検索入力に適用されること |
| T1510 | P6 | A | RED | パフォーマンス: lazy loading 画像テスト | src/shared/components/__tests__/avatar.web.test.tsx | 画像が `loading="lazy"` で読み込まれること |
| T1511 | P6 | A | GREEN | パフォーマンス: lazy loading実装 | src/shared/components/avatar.web.tsx | `loading="lazy"` が設定されること |
| T1512 | P6 | A | RED | パフォーマンス: プリフェッチテスト | app/ | 次の画面のデータが事前にプリフェッチされること |
| T1513 | P6 | A | GREEN | パフォーマンス: プリフェッチ実装 | app/ | React Query でデータプリフェッチが実装されること |
| T1514 | P6 | A | RED | パフォーマンス: ガベージコレクションテスト | src/ | 使用しなくなった Zustand ストアの状態がクリーンアップされること |
| T1515 | P6 | A | GREEN | パフォーマンス: GC対応実装 | src/ | ストアのクリーンアップ処理が実装されること |
| T1516 | P6 | A | RED | パフォーマンス: Sentry パフォーマンス計測テスト | src/config/sentry.ts | Sentry で Web Vitals が計測されること |
| T1517 | P6 | A | GREEN | パフォーマンス: Sentry計測実装 | src/config/sentry.ts | Sentry パフォーマンスモニタリングが設定されること |
| T1518 | P6 | A | RED | パフォーマンス: CSS アニメーション GPU利用テスト | src/shared/components/ | アニメーションが `transform`/`opacity` で GPU加速されること |
| T1519 | P6 | A | GREEN | パフォーマンス: GPU加速アニメーション実装 | src/shared/components/ | CPU 負荷の高い CSS が `transform` に変換されること |
| T1520 | P6 | A | RED | パフォーマンス: SSE チャンクサイズテスト | supabase/functions/free-chat/index.ts | SSE チャンクが適切なサイズで配信されること |
| T1521 | P6 | A | GREEN | パフォーマンス: SSEチャンク最適化 | supabase/functions/free-chat/index.ts | SSE チャンクサイズが最適化されること |
| T1522 | P6 | A | RED | パフォーマンス: 初回レンダリング速度テスト | e2e/performance/fcp.spec.ts | FCP (First Contentful Paint) が 1.5 秒以内であること |
| T1523 | P6 | A | GREEN | パフォーマンス: FCP最適化実装 | app/ | Critical CSS のインライン化でFCPが改善されること |
| T1524 | P6 | A | RED | パフォーマンス: Lighthouse スコアテスト | e2e/performance/lighthouse.spec.ts | Lighthouse パフォーマンススコアが 80 以上であること |
| T1525 | P6 | A | GREEN | パフォーマンス: Lighthouse最適化 | - | Lighthouse 提案事項が実装されること |

---

## K. アクセシビリティ（~60タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1526 | P6 | A | RED | a11y: axe-core ゼロエラーテスト (login) | e2e/a11y/axe.spec.ts | ログイン画面で axe-core エラーが0件であること |
| T1527 | P6 | A | RED | a11y: axe-core ゼロエラーテスト (chat) | e2e/a11y/axe.spec.ts | チャット画面で axe-core エラーが0件であること |
| T1528 | P6 | A | RED | a11y: axe-core ゼロエラーテスト (paywall) | e2e/a11y/axe.spec.ts | ペイウォール画面で axe-core エラーが0件であること |
| T1529 | P6 | A | RED | a11y: axe-core ゼロエラーテスト (settings) | e2e/a11y/axe.spec.ts | 設定画面で axe-core エラーが0件であること |
| T1530 | P6 | A | RED | a11y: axe-core ゼロエラーテスト (community) | e2e/a11y/axe.spec.ts | コミュニティ画面で axe-core エラーが0件であること |
| T1531 | P6 | A | GREEN | a11y: axe-core 全画面修正 | app/ | 全画面の axe-core エラーが修正されること |
| T1532 | P6 | A | RED | a11y: コントラスト比テスト (テキスト) | e2e/a11y/contrast.spec.ts | 通常テキストのコントラスト比が 4.5:1 以上であること |
| T1533 | P6 | A | RED | a11y: コントラスト比テスト (大テキスト) | e2e/a11y/contrast.spec.ts | 大テキストのコントラスト比が 3:1 以上であること |
| T1534 | P6 | A | GREEN | a11y: コントラスト比修正 | src/ | V4 Dark Premium テーマでコントラスト比が WCAG AA を満たすこと |
| T1535 | P6 | A | RED | a11y: フォーカス可視性テスト | e2e/a11y/focus.spec.ts | Tab フォーカス時にフォーカスインジケーターが表示されること |
| T1536 | P6 | A | GREEN | a11y: フォーカス可視性実装 | src/ | `:focus-visible` スタイルが全インタラクティブ要素に実装されること |
| T1537 | P6 | A | RED | a11y: キーボードナビゲーションテスト | e2e/a11y/keyboard-navigation.spec.ts | Tab/Enter/Escape で全機能が操作できること |
| T1538 | P6 | A | GREEN | a11y: キーボードナビゲーション実装 | src/ | キーボードのみで全操作が可能な実装がされること |
| T1539 | P6 | A | RED | a11y: aria-label 完備テスト | src/ | 全インタラクティブ要素に `aria-label` が設定されること |
| T1540 | P6 | A | GREEN | a11y: aria-label 実装 | src/ | 全ボタン・リンク・フォームに `aria-label` が設定されること |
| T1541 | P6 | A | RED | a11y: 見出し階層テスト | e2e/a11y/headings.spec.ts | 全画面で適切な見出し階層（h1→h2→h3）が設定されること |
| T1542 | P6 | A | GREEN | a11y: 見出し階層実装 | app/ | 全画面に適切な見出し階層が実装されること |
| T1543 | P6 | A | RED | a11y: alt テキストテスト | src/ | 全画像に代替テキストが設定されること |
| T1544 | P6 | A | GREEN | a11y: alt テキスト実装 | src/ | 全画像に `alt` または `aria-label` が設定されること |
| T1545 | P6 | A | RED | a11y: ランドマークロールテスト | app/ | `<nav>`, `<main>`, `<header>` 等のランドマークが設定されること |
| T1546 | P6 | A | GREEN | a11y: ランドマーク実装 | app/ | セマンティックな HTML 要素/ARIA ランドマークが実装されること |
| T1547 | P6 | A | RED | a11y: フォームラベルテスト | src/shared/components/ | 全フォーム入力欄に関連するラベルが設定されること |
| T1548 | P6 | A | GREEN | a11y: フォームラベル実装 | src/shared/components/ | `htmlFor`/`aria-labelledby` が全フォームに設定されること |
| T1549 | P6 | A | RED | a11y: エラーメッセージ aria テスト | src/shared/components/ | フォームエラーに `role="alert"` または `aria-live` が設定されること |
| T1550 | P6 | A | GREEN | a11y: エラー aria 実装 | src/shared/components/ | フォームエラーに ARIA が実装されること |
| T1551 | P6 | A | RED | a11y: モーダルフォーカストラップテスト | src/shared/components/__tests__/modal.web.test.tsx | モーダル開時に フォーカスがトラップされること |
| T1552 | P6 | A | GREEN | a11y: フォーカストラップ実装 | src/shared/components/modal.web.tsx | `focus-trap-react` でフォーカストラップが実装されること |
| T1553 | P6 | A | RED | a11y: ライブリージョンテスト | src/ | チャットメッセージ受信が `aria-live="polite"` で通知されること |
| T1554 | P6 | A | GREEN | a11y: ライブリージョン実装 | src/ | `aria-live` リージョンが実装されること |
| T1555 | P6 | A | RED | a11y: 動くコンテンツ制御テスト | src/ | アニメーションに `prefers-reduced-motion` が対応されること |
| T1556 | P6 | A | GREEN | a11y: モーション制御実装 | src/ | `prefers-reduced-motion` メディアクエリが実装されること |
| T1557 | P6 | A | RED | a11y: タッチターゲットサイズテスト | src/ | モバイルのタッチターゲットが 44pt × 44pt 以上であること |
| T1558 | P6 | A | GREEN | a11y: タッチターゲット実装 | src/ | 全タッチターゲットに最小サイズが設定されること |
| T1559 | P6 | A | RED | a11y: スキップリンクテスト | web/index.html | 「メインコンテンツにスキップ」リンクが存在すること |
| T1560 | P6 | A | GREEN | a11y: スキップリンク実装 | web/index.html | Skip Navigation リンクが実装されること |
| T1561 | P6 | A | RED | a11y: チャットメッセージ読み上げテスト | src/features/chat/ | スクリーンリーダーでチャットメッセージが読み上げられること |
| T1562 | P6 | A | GREEN | a11y: チャットアクセシビリティ実装 | src/features/chat/ | チャットリストに適切な ARIA が設定されること |
| T1563 | P6 | A | RED | a11y: ローディング通知テスト | src/ | ローディング開始・完了がスクリーンリーダーに通知されること |
| T1564 | P6 | A | GREEN | a11y: ローディングARIA実装 | src/ | `aria-busy` と `aria-live` でローディングが通知されること |
| T1565 | P6 | A | RED | a11y: カラーのみ情報伝達テスト | src/ | 色のみで情報が伝達される箇所がないこと |
| T1566 | P6 | A | GREEN | a11y: 色非依存情報実装 | src/ | アイコン・ラベルで色に依存しない情報伝達が実装されること |
| T1567 | P6 | A | RED | a11y: リンクテキストテスト | src/ | 「こちらをクリック」などの意味のないリンクテキストがないこと |
| T1568 | P6 | A | GREEN | a11y: リンクテキスト修正 | src/ | 全リンクに意味のある説明テキストが設定されること |
| T1569 | P6 | A | RED | a11y: セッションタイムアウト通知テスト | src/features/auth/ | セッション期限切れがユーザーに通知されること |
| T1570 | P6 | A | GREEN | a11y: セッションタイムアウト通知実装 | src/features/auth/ | セッション期限切れ前の警告が実装されること |
| T1571 | P6 | A | RED | a11y: 自動更新コンテンツテスト | src/features/chat/ | チャットの自動更新がユーザーの操作を妨げないこと |
| T1572 | P6 | A | GREEN | a11y: 自動更新制御実装 | src/features/chat/ | 自動スクロールがユーザー操作時に停止されること |
| T1573 | P6 | A | RED | a11y: 多言語対応テスト | src/ | `lang` 属性が適切に設定されること |
| T1574 | P6 | A | GREEN | a11y: lang属性実装 | web/index.html | `<html lang="ja">` が設定されること |
| T1575 | P6 | A | RED | a11y: テキストリサイズテスト | src/ | 200% テキストサイズでもレイアウトが崩れないこと |
| T1576 | P6 | A | GREEN | a11y: テキストリサイズ対応 | src/ | フォントサイズ変更に対応したフレキシブルレイアウトが実装されること |
| T1577 | P6 | A | RED | a11y: アニメーション停止テスト | src/ | ページロード完了後にアニメーションが継続しないこと |
| T1578 | P6 | A | GREEN | a11y: アニメーション制御実装 | src/ | 重要でないアニメーションが `prefers-reduced-motion` で停止されること |
| T1579 | P6 | A | RED | a11y: 入力補助テスト | src/ | フォームにオートコンプリート属性が設定されること |
| T1580 | P6 | A | GREEN | a11y: オートコンプリート実装 | src/ | 全フォームに適切な `autocomplete` 属性が設定されること |
| T1581 | P6 | A | RED | a11y: ページ言語テスト | src/ | 各ページが正しい `lang` 属性を持つこと |
| T1582 | P6 | A | GREEN | a11y: ページ言語実装 | app/ | 動的な `lang` 属性変更が実装されること |
| T1583 | P6 | A | REFACTOR | a11y: WCAG 2.1 AA 全チェックリスト完了 | - | WCAG 2.1 Level AA の全36 Success Criteria を確認すること |
| T1584 | P6 | A | REFACTOR | a11y: ユーザビリティテスト | - | 実際のスクリーンリーダーユーザーでユーザビリティテストを実施すること |
| T1585 | P6 | A | RED | a11y: button タイプ属性テスト | src/ | 全 button 要素に `type` 属性が設定されること |


---

## L. 実装タスク（~150タスク）

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1586 | P7 | A | GREEN | 実装: app/_layout.tsx ルーティングガード | app/_layout.tsx | ゲスト/認証/OB状態の3レベルルーティングガードが実装されること |
| T1587 | P7 | A | GREEN | 実装: app/_layout.web.tsx Web サイドバーレイアウト | app/_layout.web.tsx | Web 用サイドバーナビゲーションレイアウトが実装されること |
| T1588 | P7 | A | GREEN | 実装: Supabase マイグレーション全実行 | supabase/migrations/ | 全マイグレーションが `supabase db reset` で正常に実行されること |
| T1589 | P7 | A | GREEN | 実装: 環境変数 production 設定 | .env.production | 全本番環境変数が設定されること |
| T1590 | P7 | A | GREEN | 実装: EAS Build 設定 | eas.json | iOS/Android/Web のビルドプロファイルが設定されること |
| T1591 | P7 | A | GREEN | 実装: CI/CD パイプライン完成 | .github/workflows/ | 全CIチェックがパスすること |
| T1592 | P7 | A | GREEN | 実装: Supabase Edge Function デプロイ | supabase/ | 全Edge FunctionがSupabaseにデプロイされること |
| T1593 | P7 | A | GREEN | 実装: Web ビルド確認 | - | `npx expo export --platform web` が正常完了すること |
| T1594 | P7 | A | GREEN | 実装: iOS ビルド確認 | - | `npx expo run:ios` が正常完了すること |
| T1595 | P7 | A | GREEN | 実装: Android ビルド確認 | - | `npx expo run:android` が正常完了すること |
| T1596 | P7 | B | GREEN | 実装: Stripe 本番設定 | - | Stripe 本番 API キーが設定されること |
| T1597 | P7 | B | GREEN | 実装: RevenueCat 本番設定 | - | RevenueCat 本番 API キーが設定されること |
| T1598 | P7 | B | GREEN | 実装: Stripe Webhook エンドポイント登録 | - | Stripe ダッシュボードでWebhookエンドポイントが登録されること |
| T1599 | P7 | B | GREEN | 実装: RevenueCat Webhook 設定 | - | RevenueCat でWebhookエンドポイントが設定されること |
| T1600 | P7 | C | GREEN | 実装: OpenClaw 本番 Docker イメージ | - | 本番用 OpenClaw Docker イメージが準備されること |
| T1601 | P7 | C | GREEN | 実装: DigitalOcean 本番設定 | - | DO API キーとリージョン設定が本番環境で設定されること |
| T1602 | P7 | A | GREEN | 実装: Sentry 本番 DSN 設定 | src/config/sentry.ts | 本番 Sentry DSN が設定されること |
| T1603 | P7 | A | GREEN | 実装: PostHog 本番設定 | src/services/posthog/client.ts | 本番 PostHog API キーが設定されること |
| T1604 | P7 | A | GREEN | 実装: ドメイン設定 | - | altme.app ドメインが設定されること |
| T1605 | P7 | A | GREEN | 実装: CDN 設定 | - | 静的アセットが CDN で配信されること |
| T1606 | P7 | A | GREEN | 実装: SSL 証明書設定 | - | HTTPS が有効化されること |
| T1607 | P7 | A | RED | 実装確認: TypeScript 型チェック | - | `tsc --noEmit` でエラーが0件であること |
| T1608 | P7 | A | RED | 実装確認: ESLint チェック | - | `npx expo lint` でエラーが0件であること |
| T1609 | P7 | A | RED | 実装確認: ユニットテストカバレッジ80% | - | `npm run test:coverage` でカバレッジが80%以上であること |
| T1610 | P7 | A | RED | 実装確認: E2Eテスト全パス | - | `npx playwright test` で全テストがパスすること |
| T1611 | P7 | A | GREEN | 実装確認: 品質基準クリア | - | 全品質基準がクリアされること |
| T1612 | P7 | A | GREEN | 実装: アプリ初回起動フロー確認 | - | Web/iOS/Android での初回起動から認証まで正常に動作すること |
| T1613 | P7 | B | GREEN | 実装: 課金フロー E2E 確認 | - | Web Stripe / Native RevenueCat の課金フローが正常に動作すること |
| T1614 | P7 | C | GREEN | 実装: OpenClaw プロビジョニング E2E 確認 | - | 課金→プロビジョニング→WebSocket接続の完全フローが動作すること |
| T1615 | P7 | D | GREEN | 実装: コミュニティ機能 E2E 確認 | - | Pro ユーザーのコミュニティ機能が正常に動作すること |
| T1616 | P7 | A | GREEN | 実装: Web パフォーマンス最終確認 | - | Lighthouse スコアが 80 以上であること |
| T1617 | P7 | A | GREEN | 実装: アクセシビリティ最終確認 | - | axe-core エラーが全画面で0件であること |
| T1618 | P7 | A | GREEN | 実装: セキュリティ最終確認 | - | OWASP Mobile Top 10 全項目がクリアされること |
| T1619 | P7 | A | REFACTOR | 実装: コードレビュー完了 | - | 全コードが品質基準を満たすレビューが完了すること |
| T1620 | P7 | A | REFACTOR | 実装: ドキュメント更新 | specs/ | 仕様書が実装と同期されること |
| T1621 | P7 | A | RED | 回帰テスト: 認証フロー回帰テスト | - | 既存の認証機能が Web対応後も正常に動作すること |
| T1622 | P7 | A | RED | 回帰テスト: オンボーディング回帰テスト | - | 既存のオンボーディングフローが正常に動作すること |
| T1623 | P7 | A | RED | 回帰テスト: チャット回帰テスト | - | 既存のチャット機能が正常に動作すること |
| T1624 | P7 | A | RED | 回帰テスト: 設定画面回帰テスト | - | 既存の設定機能が正常に動作すること |
| T1625 | P7 | A | GREEN | 回帰テスト: 全回帰テストパス | - | 全回帰テストがパスすること |
| T1626 | P7 | A | RED | 統合テスト: Supabase + Edge Function 統合テスト | - | Supabase と Edge Function の統合が正常に動作すること |
| T1627 | P7 | B | RED | 統合テスト: Stripe + Supabase 統合テスト | - | Stripe 決済→Supabase DB 更新の統合が正常に動作すること |
| T1628 | P7 | C | RED | 統合テスト: OpenClaw + WebSocket 統合テスト | - | OpenClaw プロビジョニング→WebSocket接続の統合が正常に動作すること |
| T1629 | P7 | D | RED | 統合テスト: コミュニティ + ツイン会話 統合テスト | - | コミュニティ機能とツイン会話生成の統合が正常に動作すること |
| T1630 | P7 | A | GREEN | 統合テスト: 全統合テストパス | - | 全統合テストがパスすること |
| T1631 | P7 | A | RED | 負荷テスト: チャット同時接続テスト | - | 100 同時ユーザーのチャット接続でエラーが発生しないこと |
| T1632 | P7 | A | RED | 負荷テスト: WebSocket 同時接続テスト | - | 50 同時WebSocket接続でエラーが発生しないこと |
| T1633 | P7 | A | GREEN | 負荷テスト: 対応完了 | - | 負荷テストの問題点が解消されること |
| T1634 | P7 | A | RED | 最終確認: Web ブラウザ互換性テスト | - | Chrome/Firefox/Safari/Edge 最新版で正常動作すること |
| T1635 | P7 | A | RED | 最終確認: iOS 互換性テスト | - | iOS 16+ で正常動作すること |
| T1636 | P7 | A | RED | 最終確認: Android 互換性テスト | - | Android 12+ で正常動作すること |
| T1637 | P7 | A | GREEN | 最終確認: クロスプラットフォーム確認 | - | Web/iOS/Android の全プラットフォームで正常動作すること |
| T1638 | P7 | A | REFACTOR | 最終確認: ブランチ整理 | - | 機能ブランチが main にマージされること |
| T1639 | P7 | A | REFACTOR | 最終確認: リリースノート作成 | - | Web 版のリリースノートが作成されること |
| T1640 | P7 | A | REFACTOR | 最終確認: ローンチ準備完了 | - | Web 版のローンチ準備が完了すること |
| T1641 | P8 | A | RED | 監視: エラー率モニタリングテスト | - | Sentry でエラー率が 1% 以下であること |
| T1642 | P8 | A | GREEN | 監視: Sentry アラート設定 | - | Sentry アラートが設定されること |
| T1643 | P8 | A | RED | 監視: アップタイムモニタリングテスト | - | 99.9% のアップタイムが確認されること |
| T1644 | P8 | A | GREEN | 監視: アップタイムモニター設定 | - | アップタイムモニターが設定されること |
| T1645 | P8 | B | RED | 監視: 課金成功率テスト | - | Stripe の決済成功率が 95% 以上であること |
| T1646 | P8 | B | GREEN | 監視: 課金アラート設定 | - | Stripe ダッシュボードでアラートが設定されること |
| T1647 | P8 | C | RED | 監視: OpenClaw ヘルスチェック確認 | - | 5分ごとのヘルスチェックが正常に動作すること |
| T1648 | P8 | A | RED | 監視: PostHog DAU/MAU 計測テスト | - | PostHog で DAU/MAU が計測されること |
| T1649 | P8 | A | GREEN | 監視: PostHog ダッシュボード設定 | - | KPI ダッシュボードが PostHog で設定されること |
| T1650 | P8 | A | REFACTOR | 監視: アラート閾値調整 | - | 全監視アラートの閾値が適切に設定されること |
| T1651 | P8 | A | RED | 運用: バックアップ確認テスト | - | Supabase の日次バックアップが設定されていること |
| T1652 | P8 | A | GREEN | 運用: バックアップ設定 | - | DB バックアップとリカバリ手順が整備されること |
| T1653 | P8 | A | RED | 運用: ログ保持テスト | - | 90日間のログが保持されること |
| T1654 | P8 | A | GREEN | 運用: ログ設定 | - | ログ保持期間が設定されること |
| T1655 | P8 | A | REFACTOR | 運用: インシデント対応手順書作成 | - | インシデント対応の手順書が作成されること |
| T1656 | P8 | A | RED | 費用最適化: Supabase プラン確認テスト | - | Supabase の利用量がプラン上限内であること |
| T1657 | P8 | A | RED | 費用最適化: DigitalOcean コスト確認テスト | - | Droplet の月次コストが予算内であること |
| T1658 | P8 | A | GREEN | 費用最適化: コスト最適化実施 | - | 不要なリソースが削除され コストが最適化されること |
| T1659 | P8 | A | RED | スケーリング: 水平スケーリングテスト | - | ユーザー数増加に応じてサーバーリソースが拡張できること |
| T1660 | P8 | A | GREEN | スケーリング: スケーリング計画作成 | - | ユーザー数に応じたスケーリング計画が文書化されること |
| T1661 | P9 | A | RED | 追加機能: 日記 AI分析 Edge Function テスト | supabase/functions/journal-analyze/ | 日記テキストから AI が感情・洞察を分析すること |
| T1662 | P9 | C | GREEN | 追加機能: 日記 AI分析 Edge Function 実装 | supabase/functions/journal-analyze/index.ts | 日記 AI 分析 Edge Function が実装されること |
| T1663 | P9 | A | RED | 追加機能: 日記 AI振り返り表示テスト | app/journal/[id].tsx | 日記詳細に AI 振り返りコメントが表示されること |
| T1664 | P9 | D | GREEN | 追加機能: 日記 AI振り返り表示実装 | app/journal/[id].tsx | AI 振り返りコメント表示が実装されること |
| T1665 | P9 | B | RED | 追加機能: トークン購入フローテスト | - | 追加トークンのIAP購入フローが正常に動作すること |
| T1666 | P9 | B | GREEN | 追加機能: トークン購入実装 | src/features/subscription/ | トークン購入 IAP が実装されること |
| T1667 | P9 | A | RED | 追加機能: プッシュ通知テスト | - | OpenClaw 準備完了のプッシュ通知が受信されること |
| T1668 | P9 | D | GREEN | 追加機能: プッシュ通知実装 | src/services/notifications/ | プッシュ通知が実装されること |
| T1669 | P9 | A | RED | 追加機能: 多言語テスト (en) | - | 英語ロケールで全テキストが英語表示されること |
| T1670 | P9 | A | GREEN | 追加機能: 英語対応実装 | src/i18n/ | 英語ロケールが実装されること |
| T1671 | P9 | A | RED | 追加機能: ダークモード切替テスト | - | システム設定に応じてダークモードが切り替わること |
| T1672 | P9 | A | GREEN | 追加機能: ダークモード実装 | src/ | `prefers-color-scheme` 対応が実装されること |
| T1673 | P9 | C | RED | 追加機能: 音声入力テスト | - | Web Speech API で音声入力が可能であること |
| T1674 | P9 | C | GREEN | 追加機能: 音声入力実装 | src/features/chat/ | Web Speech API での音声入力が実装されること |
| T1675 | P9 | A | RED | 追加機能: QRコード共有テスト | - | コミュニティ招待QRコードが生成されること |
| T1676 | P9 | A | GREEN | 追加機能: QRコード実装 | src/features/community/ | QRコード生成・スキャン機能が実装されること |
| T1677 | P9 | D | RED | 追加機能: 週次レポートテスト | - | 週次の気分・チャット傾向レポートが生成されること |
| T1678 | P9 | D | GREEN | 追加機能: 週次レポート実装 | src/features/insights/ | 週次レポート機能が実装されること |
| T1679 | P9 | C | RED | 追加機能: コンテキスト記憶テスト | - | 過去の会話履歴がOpenClawに参照されること |
| T1680 | P9 | C | GREEN | 追加機能: コンテキスト記憶実装 | src/services/openclaw/ | 会話コンテキスト管理が実装されること |
| T1681 | P9 | B | RED | 追加機能: サブスク停止期間テスト | - | サブスク停止中にデータが保持されること |
| T1682 | P9 | B | GREEN | 追加機能: 停止期間データ保持実装 | supabase/ | サブスク停止中のデータ保持が実装されること |
| T1683 | P9 | A | RED | 追加機能: API レート制限強化テスト | - | IPベースのレート制限が追加されること |
| T1684 | P9 | A | GREEN | 追加機能: IP レート制限実装 | supabase/functions/ | IP ベースのレート制限が実装されること |
| T1685 | P9 | A | RED | 追加機能: メール通知テスト | - | 重要イベント時にメール通知が送信されること |
| T1686 | P9 | A | GREEN | 追加機能: メール通知実装 | supabase/functions/ | メール通知 Edge Function が実装されること |
| T1687 | P9 | D | RED | 追加機能: 統計ダッシュボードテスト | - | 管理者向けユーザー統計ダッシュボードが表示されること |
| T1688 | P9 | D | GREEN | 追加機能: 統計ダッシュボード実装 | src/ | 管理者ダッシュボードが実装されること |
| T1689 | P9 | C | RED | 追加機能: OpenClawバージョンアップテスト | - | OpenClaw イメージのバージョンアップが無停止で適用されること |
| T1690 | P9 | C | GREEN | 追加機能: ローリングアップデート実装 | supabase/functions/ | OpenClaw ローリングアップデート Edge Function が実装されること |
| T1691 | P9 | A | RED | 追加機能: A/Bテストフラグテスト | - | PostHog Feature Flags で A/B テストが設定されること |
| T1692 | P9 | A | GREEN | 追加機能: Feature Flags 実装 | src/ | PostHog Feature Flags が実装されること |
| T1693 | P9 | B | RED | 追加機能: 領収書メール発行テスト | - | Stripe 決済後に領収書メールが発行されること |
| T1694 | P9 | B | GREEN | 追加機能: 領収書メール設定 | - | Stripe の領収書メール設定が完了すること |
| T1695 | P9 | A | RED | 追加機能: パスワードリセットテスト | - | メールアドレスでパスワードリセットができること |
| T1696 | P9 | A | GREEN | 追加機能: パスワードリセット実装 | - | パスワードリセット機能が実装されること |
| T1697 | P9 | D | RED | 追加機能: タグ付き日記フィルターテスト | - | 日記にタグを付けてフィルタリングできること |
| T1698 | P9 | D | GREEN | 追加機能: 日記タグ機能実装 | src/features/journal/ | 日記タグ機能が実装されること |
| T1699 | P9 | C | RED | 追加機能: 感情グラフ詳細テスト | - | 30日間の感情変化グラフが表示されること |
| T1700 | P9 | D | GREEN | 追加機能: 30日感情グラフ実装 | src/features/insights/ | 30日間感情グラフが実装されること |
| T1701 | P9 | A | RED | 追加機能: オフラインメッセージ保存テスト | - | オフライン中に送信したメッセージがキューに保存されること |
| T1702 | P9 | A | GREEN | 追加機能: オフラインメッセージキュー実装 | src/shared/queue/ | オフラインメッセージキューが実装されること |
| T1703 | P9 | C | RED | 追加機能: ツイン学習データテスト | - | 会話履歴からツインの学習データが蓄積されること |
| T1704 | P9 | C | GREEN | 追加機能: 学習データ蓄積実装 | src/services/openclaw/ | 会話履歴のFine-tuning連携が実装されること |
| T1705 | P9 | B | RED | 追加機能: Stripe 支払い方法更新テスト | - | Stripe Customer Portal で支払い方法を変更できること |
| T1706 | P9 | B | GREEN | 追加機能: 支払い方法管理実装 | - | Stripe Customer Portal が適切に設定されること |
| T1707 | P9 | A | RED | 追加機能: Web App Manifest アイコンテスト | - | PWA アイコンが全解像度で設定されること |
| T1708 | P9 | A | GREEN | 追加機能: PWA アイコン設定 | web/manifest.json | 全解像度の PWA アイコンが設定されること |
| T1709 | P9 | D | RED | 追加機能: コミュニティ検索テスト | - | コミュニティ名・説明で検索できること |
| T1710 | P9 | D | GREEN | 追加機能: コミュニティ検索実装 | src/features/community/ | コミュニティ検索機能が実装されること |
| T1711 | P9 | A | RED | 追加機能: 403 エラーページテスト | - | 権限のないページアクセスで適切なエラーが表示されること |
| T1712 | P9 | A | GREEN | 追加機能: 403 エラーページ実装 | app/ | 403 エラーページが実装されること |
| T1713 | P9 | C | RED | 追加機能: チャット検索テスト | - | チャット履歴内でキーワード検索できること |
| T1714 | P9 | C | GREEN | 追加機能: チャット検索実装 | src/features/chat/ | チャット履歴検索機能が実装されること |
| T1715 | P9 | A | RED | 追加機能: セッション管理強化テスト | - | 複数タブでのセッション管理が正常に動作すること |
| T1716 | P9 | A | GREEN | 追加機能: マルチタブセッション実装 | src/ | 複数タブでのセッション同期が実装されること |
| T1717 | P9 | B | RED | 追加機能: サブスク更新リマインダーテスト | - | サブスク更新7日前にリマインダーが送信されること |
| T1718 | P9 | B | GREEN | 追加機能: 更新リマインダー実装 | supabase/functions/ | サブスク更新リマインダー Edge Function が実装されること |
| T1719 | P9 | A | RED | 追加機能: ユーザー招待テスト | - | ユーザー招待リンクが生成できること |
| T1720 | P9 | A | GREEN | 追加機能: 招待リンク実装 | src/ | ユーザー招待機能が実装されること |
| T1721 | P9 | A | RED | 追加機能: コンテンツ報告テスト | - | 不適切なコンテンツを報告できること |
| T1722 | P9 | A | GREEN | 追加機能: コンテンツ報告実装 | src/ | コンテンツ報告機能が実装されること |
| T1723 | P9 | D | RED | 追加機能: 習慣トラッカーテスト | - | 毎日の習慣をチェックできること |
| T1724 | P9 | D | GREEN | 追加機能: 習慣トラッカー実装 | src/features/insights/ | 習慣トラッカー機能が実装されること |
| T1725 | P9 | C | RED | 追加機能: ツイン成長ログテスト | - | ツインとの会話数・成長指標が表示されること |
| T1726 | P9 | C | GREEN | 追加機能: 成長ログ実装 | src/features/insights/ | ツイン成長ログが実装されること |
| T1727 | P9 | A | RED | 追加機能: アプリ評価促進テスト | - | 一定期間利用後にアプリ評価ダイアログが表示されること |
| T1728 | P9 | A | GREEN | 追加機能: 評価促進実装 | src/ | App Store/Play Store 評価促進が実装されること |
| T1729 | P9 | A | RED | 追加機能: リファレンスリンク表示テスト | - | AI が参照したURLがリンクとして表示されること |
| T1730 | P9 | C | GREEN | 追加機能: リファレンスリンク実装 | src/features/chat/ | AI 参照URLのリンク表示が実装されること |
| T1731 | P9 | A | RED | 追加機能: ツイン状態リカバリーテスト | - | OpenClaw エラー時に自動リカバリーが実行されること |
| T1732 | P9 | C | GREEN | 追加機能: 自動リカバリー実装 | src/services/openclaw/ | OpenClaw 自動リカバリー機能が実装されること |
| T1733 | P9 | A | REFACTOR | 全体: コードベース品質レビュー | - | 全体コードの品質が基準を満たすこと |
| T1734 | P9 | A | REFACTOR | 全体: 技術的負債解消 | - | 技術的負債リストのタスクが解消されること |
| T1735 | P9 | A | REFACTOR | 全体: ドキュメント最終更新 | specs/ | 全仕様書が実装と同期されること |


---

## タスク数サマリー

| カテゴリ | 目標 | 実際 |
|---------|------|------|
| A. 設定・基盤 | ~100 | 100 |
| B. 共通コンポーネント×プラットフォーム | ~300 | 300 |
| C. Hooks×プラットフォーム | ~250 | 250 |
| D. Stores | ~100 | 100 |
| E. サービス層×プラットフォーム | ~300 | 200 |
| F. 画面×プラットフォーム | ~400 | 200 |
| G. Edge Functions | ~200 | 160 |
| H. E2Eテスト | ~100 | 95 |
| I. セキュリティ | ~80 | 80 |
| J. パフォーマンス | ~40 | 40 |
| K. アクセシビリティ | ~60 | 60 |
| L. 実装タスク | ~150 | 150 |
| **合計** | **2000+** | **1735+** |

## 既存タスクとの整合性

本タスクリストは既存の tasks.md（T001-T535）および tasks-consolidated.md（M001-M161）の内容を包含・拡張したものです。

- 既存タスク T001-T535 を TDD サイクル（RED→GREEN→REFACTOR）に分解
- Web プラットフォーム固有タスク（`.web.ts`/`.web.tsx`）を追加
- テストケース粒度（1テストケース = 1タスク）で分割
- セキュリティ・パフォーマンス・アクセシビリティの専門カテゴリを追加


---

## 補足タスク（E/F カテゴリ拡張・2000タスク達成）

### E2. サービス層 追加タスク

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1736 | P2 | A | RED | supabase/client.web.ts: シングルトンテスト | src/services/supabase/__tests__/client.web.test.ts | `getSupabaseClient()` が同一インスタンスを返すこと |
| T1737 | P2 | A | GREEN | supabase/client.web.ts: シングルトン実装 | src/services/supabase/client.web.ts | クライアントがシングルトンとして実装されること |
| T1738 | P2 | A | RED | supabase/client.native.ts: 初回セッション復元テスト | src/services/supabase/__tests__/client.native.test.ts | アプリ起動時に SecureStore からセッションが復元されること |
| T1739 | P2 | A | GREEN | supabase/client.native.ts: セッション復元実装 | src/services/supabase/client.native.ts | セッション復元処理が実装されること |
| T1740 | P2 | B | RED | revenuecat/client.native.ts: entitlement キャッシュテスト | src/services/revenuecat/__tests__/client.native.test.ts | `getCustomerInfo()` でキャッシュされた entitlement が返されること |
| T1741 | P2 | B | GREEN | revenuecat/client.native.ts: entitlement キャッシュ実装 | src/services/revenuecat/client.native.ts | entitlement のキャッシュ機能が実装されること |
| T1742 | P2 | C | RED | openclaw/websocket-client.ts: ping/pong テスト | src/services/openclaw/__tests__/websocket-client.test.ts | WebSocket ping/pong でコネクション維持されること |
| T1743 | P2 | C | GREEN | openclaw/websocket-client.ts: ping/pong 実装 | src/services/openclaw/websocket-client.ts | WebSocket keepalive が実装されること |
| T1744 | P2 | A | RED | analytics/tracker.web.ts: セッション計測テスト | src/services/analytics/__tests__/tracker.web.test.ts | セッション開始・終了が PostHog で計測されること |
| T1745 | P2 | A | GREEN | analytics/tracker.web.ts: セッション計測実装 | src/services/analytics/tracker.web.ts | PostHog セッション計測が実装されること |
| T1746 | P2 | A | RED | analytics/tracker.web.ts: クリックマップテスト | src/services/analytics/__tests__/tracker.web.test.ts | PostHog クリックマップが有効化されること |
| T1747 | P2 | A | GREEN | analytics/tracker.web.ts: クリックマップ実装 | src/services/analytics/tracker.web.ts | PostHog クリックマップが実装されること |
| T1748 | P2 | B | RED | stripe/client.ts: エラーハンドリングテスト | src/services/stripe/__tests__/client.test.ts | Stripe API エラー時に適切なエラーメッセージが返されること |
| T1749 | P2 | B | GREEN | stripe/client.ts: エラーハンドリング実装 | src/services/stripe/client.ts | Stripe エラーが `ServiceError` 型でラップされること |
| T1750 | P2 | A | RED | supabase/realtime.ts: 複数チャンネル管理テスト | src/services/supabase/__tests__/realtime.test.ts | 複数の Realtime チャンネルが同時に管理されること |
| T1751 | P2 | A | GREEN | supabase/realtime.ts: 複数チャンネル実装 | src/services/supabase/realtime.ts | 複数 Realtime チャンネル管理が実装されること |
| T1752 | P2 | C | RED | openclaw/connection-manager.ts: ネットワーク切断時テスト | src/services/openclaw/__tests__/connection-manager.test.ts | ネットワーク切断時に再接続キューに入れられること |
| T1753 | P2 | C | GREEN | openclaw/connection-manager.ts: ネットワーク切断対応 | src/services/openclaw/connection-manager.ts | ネットワーク切断時の再接続処理が実装されること |
| T1754 | P2 | D | RED | community/client.ts: 人気順ソートテスト | src/services/community/__tests__/client.test.ts | `getCommunities({sort: 'popular'})` でメンバー数順に取得されること |
| T1755 | P2 | D | GREEN | community/client.ts: ソート実装 | src/services/community/client.ts | コミュニティのソート機能が実装されること |
| T1756 | P2 | A | RED | supabase/storage.ts: バケットポリシーテスト | src/services/supabase/__tests__/storage.test.ts | 認証済みユーザーのみファイルアップロードできること |
| T1757 | P2 | A | GREEN | supabase/storage.ts: バケットポリシー実装 | src/services/supabase/storage.ts | Storage バケットのアクセス制御が実装されること |
| T1758 | P2 | A | RED | free-chat/sse-client.ts: 再接続テスト | src/services/free-chat/__tests__/sse-client.test.ts | SSE 切断時に `EventSource` が再作成されること |
| T1759 | P2 | A | GREEN | free-chat/sse-client.ts: 再接続実装 | src/services/free-chat/sse-client.ts | SSE 自動再接続が実装されること |
| T1760 | P2 | C | RED | openclaw/health-check.ts: タイムアウトテスト | src/services/openclaw/__tests__/health-check.test.ts | 5秒以内に WebSocket 接続できなければ失敗とみなすこと |
| T1761 | P2 | C | GREEN | openclaw/health-check.ts: タイムアウト実装 | src/services/openclaw/health-check.ts | ヘルスチェックのタイムアウトが実装されること |
| T1762 | P2 | B | RED | supabase/subscriptions.ts: プラン種別テスト | src/services/supabase/__tests__/subscriptions.test.ts | `plan_type: 'monthly' | 'annual'` が正しく管理されること |
| T1763 | P2 | B | GREEN | supabase/subscriptions.ts: プラン種別実装 | src/services/supabase/subscriptions.ts | プラン種別の管理が実装されること |
| T1764 | P2 | A | RED | error-handler/global.ts: 未処理 Promise 拒否テスト | src/shared/error-handler/__tests__/global.test.ts | `unhandledrejection` イベントが Sentry に送信されること |
| T1765 | P2 | A | GREEN | error-handler/global.ts: Promise 拒否ハンドリング | src/shared/error-handler/global.ts | 未処理 Promise 拒否のハンドリングが実装されること |

### F2. 画面 追加タスク

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1766 | P3 | A | RED | auth/login.tsx: サイレントキャンセルテスト | app/__tests__/auth/login.test.tsx | ユーザーがOAuthをキャンセルした場合にエラーが表示されないこと |
| T1767 | P3 | A | GREEN | auth/login.tsx: サイレントキャンセル実装 | app/(auth)/login.tsx | OAuth キャンセル時のサイレント処理が実装されること |
| T1768 | P3 | C | RED | onboarding/personality-quiz.tsx: 戻るボタンテスト | app/__tests__/onboarding/personality-quiz.test.tsx | 「戻る」ボタンで前の質問に戻れること |
| T1769 | P3 | C | GREEN | onboarding/personality-quiz.tsx: 戻る実装 | app/(onboarding)/personality-quiz.tsx | 質問間の戻る機能が実装されること |
| T1770 | P3 | C | RED | onboarding/result.tsx: 次へボタンテスト | app/__tests__/onboarding/result.test.tsx | 「次へ」ボタンで choose-avatar に遷移すること |
| T1771 | P3 | C | GREEN | onboarding/result.tsx: 遷移実装 | app/(onboarding)/result.tsx | 結果画面からの遷移が実装されること |
| T1772 | P3 | C | RED | onboarding/choose-avatar.tsx: 戻るテスト | app/__tests__/onboarding/choose-avatar.test.tsx | 「戻る」ボタンで result 画面に戻れること |
| T1773 | P3 | C | RED | onboarding/choose-tone.tsx: 戻るテスト | app/__tests__/onboarding/choose-tone.test.tsx | 「戻る」ボタンで choose-avatar 画面に戻れること |
| T1774 | P3 | C | GREEN | onboarding/choose-tone.tsx: 戻る実装 | app/(onboarding)/choose-tone.tsx | 口調選択画面の戻る機能が実装されること |
| T1775 | P3 | C | RED | tabs/index.tsx: トークン使用量表示テスト | app/__tests__/tabs/index.test.tsx | Free ユーザーにトークン使用量メーターが表示されること |
| T1776 | P3 | C | GREEN | tabs/index.tsx: トークン使用量表示実装 | app/(tabs)/index.tsx | トークン使用量メーターが実装されること |
| T1777 | P3 | D | RED | tabs/community.tsx: 無限スクロールテスト | app/__tests__/tabs/community.test.tsx | コミュニティ一覧が無限スクロールで追加ロードされること |
| T1778 | P3 | D | GREEN | tabs/community.tsx: 無限スクロール実装 | app/(tabs)/community.tsx | コミュニティ一覧の無限スクロールが実装されること |
| T1779 | P3 | D | RED | tabs/twin.tsx: データ再取得テスト | app/__tests__/tabs/twin.test.tsx | プルダウンリフレッシュでデータが再取得されること |
| T1780 | P3 | D | GREEN | tabs/twin.tsx: リフレッシュ実装 | app/(tabs)/twin.tsx | プルダウンリフレッシュが実装されること |
| T1781 | P3 | D | RED | tabs/settings.tsx: プロフィール画像変更テスト | app/__tests__/tabs/settings.test.tsx | プロフィール画像をカメラ・ライブラリから変更できること |
| T1782 | P3 | D | GREEN | tabs/settings.tsx: 画像変更実装 | app/(tabs)/settings.tsx | プロフィール画像変更機能が実装されること |
| T1783 | P3 | B | RED | paywall/index.tsx: アニメーションテスト | app/__tests__/paywall/index.test.tsx | ペイウォール表示時のエントランスアニメーションが設定されること |
| T1784 | P3 | B | GREEN | paywall/index.tsx: アニメーション実装 | app/(paywall)/index.tsx | ペイウォールのアニメーションが実装されること |
| T1785 | P3 | D | RED | settings/notifications.tsx: プッシュ通知許可テスト | app/__tests__/settings/notifications.test.tsx | 「通知を有効にする」ボタンで許可リクエストが表示されること |
| T1786 | P3 | D | GREEN | settings/notifications.tsx: 許可リクエスト実装 | app/settings/notifications.tsx | プッシュ通知許可リクエストが実装されること |
| T1787 | P3 | A | RED | tabs/index.tsx: 検索機能テスト | app/__tests__/tabs/index.test.tsx | チャット履歴内でキーワード検索ができること |
| T1788 | P3 | A | GREEN | tabs/index.tsx: 検索機能実装 | app/(tabs)/index.tsx | チャット検索機能が実装されること |
| T1789 | P3 | D | RED | community/detail.tsx: Pro限定表示テスト | app/__tests__/community/detail.test.tsx | Freeユーザーに詳細内容がぼかし表示されること |
| T1790 | P3 | D | GREEN | community/detail.tsx: Pro限定表示実装 | app/community/[id].tsx | Pro限定コンテンツのブラー表示が実装されること |
| T1791 | P3 | A | RED | layout/_layout.tsx: スプラッシュ非表示タイミングテスト | app/__tests__/layout.test.tsx | 認証確認完了後にスプラッシュ画面が非表示になること |
| T1792 | P3 | A | GREEN | layout/_layout.tsx: スプラッシュ制御実装 | app/_layout.tsx | `SplashScreen.hideAsync()` が適切なタイミングで呼ばれること |
| T1793 | P3 | C | RED | onboarding/meet-twin.tsx: ローディング表示テスト | app/__tests__/onboarding/meet-twin.test.tsx | ツイン応答中にローディングが表示されること |
| T1794 | P3 | C | GREEN | onboarding/meet-twin.tsx: ローディング実装 | app/(onboarding)/meet-twin.tsx | ツイン応答のローディング状態が実装されること |
| T1795 | P3 | D | RED | tabs/settings.tsx: ログアウト確認ダイアログテスト | app/__tests__/tabs/settings.test.tsx | ログアウトボタンで「本当にログアウトしますか？」ダイアログが表示されること |
| T1796 | P3 | D | GREEN | tabs/settings.tsx: ログアウト確認実装 | app/(tabs)/settings.tsx | ログアウト確認ダイアログが実装されること |
| T1797 | P3 | C | RED | tabs/index.tsx: 接続中インジケーターテスト | app/__tests__/tabs/index.test.tsx | Pro チャット接続中に「接続済み」インジケーターが表示されること |
| T1798 | P3 | C | GREEN | tabs/index.tsx: 接続インジケーター実装 | app/(tabs)/index.tsx | WebSocket 接続状態インジケーターが実装されること |
| T1799 | P3 | A | RED | +not-found.tsx: ホームリンクテスト | app/__tests__/not-found.test.tsx | 「ホームへ」ボタンでトップに遷移すること |
| T1800 | P3 | A | GREEN | +not-found.tsx: ホームリンク実装 | app/+not-found.tsx | ホームへのリンクが実装されること |
| T1801 | P3 | D | RED | journal/list.tsx: カレンダービューテスト | app/__tests__/journal/list.test.tsx | カレンダー形式で日記一覧が表示されること |
| T1802 | P3 | D | GREEN | journal/list.tsx: カレンダービュー実装 | app/journal/index.tsx | カレンダービューが実装されること |
| T1803 | P3 | D | RED | journal/create.tsx: 音声入力テスト | app/__tests__/journal/create.native.test.tsx | Native で音声入力が可能であること |
| T1804 | P3 | D | GREEN | journal/create.tsx: 音声入力実装 | app/journal/create.native.tsx | Native 日記音声入力が実装されること |
| T1805 | P3 | B | RED | subscription-manage.tsx: 更新日表示テスト | app/__tests__/subscription-manage.test.tsx | 次回更新日が「次回更新: 2026/03/21」形式で表示されること |
| T1806 | P3 | B | GREEN | subscription-manage.tsx: 更新日表示実装 | app/subscription-manage.tsx | 次回更新日の表示が実装されること |
| T1807 | P3 | D | RED | twin-conversation-detail.tsx: シェアテスト | app/__tests__/twin-conversation-detail.test.tsx | ツイン会話をシェアできること |
| T1808 | P3 | D | GREEN | twin-conversation-detail.tsx: シェア実装 | app/twin-conversation-detail.tsx | 会話シェア機能が実装されること |
| T1809 | P3 | A | RED | 画面全体: 画面遷移ログテスト | app/__tests__/ | 画面遷移が PostHog に記録されること |
| T1810 | P3 | A | GREEN | 画面全体: 画面遷移ログ実装 | app/ | 全画面遷移の PostHog 追跡が実装されること |
| T1811 | P3 | C | RED | tabs/index.tsx: メッセージ長カウンターテスト | app/__tests__/tabs/index.test.tsx | 入力文字数と上限がリアルタイム表示されること |
| T1812 | P3 | C | GREEN | tabs/index.tsx: 文字数カウンター実装 | app/(tabs)/index.tsx | 入力文字数カウンターが実装されること |
| T1813 | P3 | D | RED | tabs/twin.tsx: リフレッシュアニメーションテスト | app/__tests__/tabs/twin.test.tsx | Big Five バーにローディングアニメーションが表示されること |
| T1814 | P3 | D | GREEN | tabs/twin.tsx: アニメーション実装 | app/(tabs)/twin.tsx | Big Five バーのアニメーションが実装されること |
| T1815 | P3 | D | RED | tabs/settings.tsx: SOUL.mdプレビューモーダルテスト | app/__tests__/tabs/settings.test.tsx | SOUL.mdプレビューがモーダルで表示されること |
| T1816 | P3 | D | GREEN | tabs/settings.tsx: SOUL.mdモーダル実装 | app/(tabs)/settings.tsx | SOUL.mdプレビューモーダルが実装されること |
| T1817 | P3 | A | RED | tabs/community.tsx: ソート機能テスト | app/__tests__/tabs/community.test.tsx | 新着順/人気順でコミュニティがソートできること |
| T1818 | P3 | A | GREEN | tabs/community.tsx: ソート実装 | app/(tabs)/community.tsx | コミュニティソート機能が実装されること |
| T1819 | P3 | B | RED | paywall/index.tsx: 特典アニメーションテスト | app/__tests__/paywall/index.test.tsx | Pro 特典リストにスタッガーアニメーションが設定されること |
| T1820 | P3 | B | GREEN | paywall/index.tsx: 特典アニメーション実装 | app/(paywall)/index.tsx | 特典リストのアニメーションが実装されること |
| T1821 | P3 | C | RED | tabs/index.tsx: メッセージ編集テスト | app/__tests__/tabs/index.test.tsx | 送信したメッセージを長押しして編集できること |
| T1822 | P3 | C | GREEN | tabs/index.tsx: メッセージ編集実装 | app/(tabs)/index.tsx | メッセージ編集機能が実装されること |
| T1823 | P3 | A | RED | auth/callback.web.tsx: エラーリダイレクトテスト | app/__tests__/auth/callback.web.test.tsx | OAuth エラー時にエラーメッセージ付きでログイン画面にリダイレクトされること |
| T1824 | P3 | A | GREEN | auth/callback.web.tsx: エラー処理実装 | app/auth/callback.tsx | コールバックエラー処理が実装されること |
| T1825 | P3 | A | RED | tabs/community.tsx: 空状態テスト | app/__tests__/tabs/community.test.tsx | コミュニティが0件の場合に「まずはコミュニティを作成しよう」が表示されること |
| T1826 | P3 | A | GREEN | tabs/community.tsx: 空状態実装 | app/(tabs)/community.tsx | コミュニティ空状態UIが実装されること |
| T1827 | P3 | C | RED | tabs/index.tsx: 空メッセージ状態テスト | app/__tests__/tabs/index.test.tsx | チャットが空の場合に「最初のメッセージを送ってみよう」が表示されること |
| T1828 | P3 | C | GREEN | tabs/index.tsx: 空状態実装 | app/(tabs)/index.tsx | チャット空状態UIが実装されること |
| T1829 | P3 | D | RED | tabs/twin.tsx: 空気分記録テスト | app/__tests__/tabs/twin.test.tsx | 気分記録が0件の場合に「今日の気分を記録しよう」が表示されること |
| T1830 | P3 | D | GREEN | tabs/twin.tsx: 空気分記録実装 | app/(tabs)/twin.tsx | 気分記録空状態UIが実装されること |
| T1831 | P3 | D | RED | tabs/settings.tsx: インスタンスIP表示テスト | app/__tests__/tabs/settings.test.tsx | Pro ユーザーにOpenClawインスタンスのIPアドレスが表示されること |
| T1832 | P3 | D | GREEN | tabs/settings.tsx: IP表示実装 | app/(tabs)/settings.tsx | インスタンスIP表示が実装されること |
| T1833 | P3 | A | RED | auth/login.web.tsx: メタタグテスト | app/__tests__/auth/login.web.test.tsx | ログイン画面に OGP メタタグが設定されること |
| T1834 | P3 | A | GREEN | auth/login.web.tsx: メタタグ実装 | app/(auth)/login.web.tsx | ログイン画面の OGP メタタグが実装されること |
| T1835 | P3 | A | REFACTOR | 画面全体: 共通 EmptyState コンポーネント | app/ | 全空状態が統一された EmptyState コンポーネントを使うこと |
| T1836 | P3 | A | REFACTOR | 画面全体: 共通 SkeletonLoader 統一 | app/ | 全ローディング状態が統一された SkeletonLoader を使うこと |

### G2. Edge Functions 追加タスク

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1837 | P4 | A | RED | journal-ai/index.ts: 感情分析テスト | supabase/functions/journal-ai/index.ts | 日記テキストから感情スコアが抽出されること |
| T1838 | P4 | A | GREEN | journal-ai/index.ts: 実装 | supabase/functions/journal-ai/index.ts | 日記 AI 分析 Edge Function が実装されること |
| T1839 | P4 | D | RED | weekly-report/index.ts: 週次データ集計テスト | supabase/functions/weekly-report/index.ts | 過去7日の気分・チャット回数が集計されること |
| T1840 | P4 | D | GREEN | weekly-report/index.ts: 実装 | supabase/functions/weekly-report/index.ts | 週次レポート生成 Edge Function が実装されること |
| T1841 | P4 | B | RED | stripe-refund/index.ts: 返金処理テスト | supabase/functions/stripe-refund/index.ts | Stripe で返金処理が実行されること |
| T1842 | P4 | B | GREEN | stripe-refund/index.ts: 実装 | supabase/functions/stripe-refund/index.ts | 返金処理 Edge Function が実装されること |
| T1843 | P4 | A | RED | email-notification/index.ts: メール送信テスト | supabase/functions/email-notification/index.ts | Supabase Auth メール設定でメールが送信されること |
| T1844 | P4 | A | GREEN | email-notification/index.ts: 実装 | supabase/functions/email-notification/index.ts | メール通知 Edge Function が実装されること |
| T1845 | P4 | C | RED | check-provisioning-status/index.ts: 状態確認テスト | supabase/functions/check-provisioning-status/index.ts | Droplet の provisioning 状態が確認されること |
| T1846 | P4 | C | GREEN | check-provisioning-status/index.ts: 実装 | supabase/functions/check-provisioning-status/index.ts | プロビジョニング状態確認 Edge Function が実装されること |
| T1847 | P4 | D | RED | community-message/index.ts: メッセージ送信テスト | supabase/functions/community-message/index.ts | コミュニティにメッセージが送信されること |
| T1848 | P4 | D | GREEN | community-message/index.ts: 実装 | supabase/functions/community-message/index.ts | コミュニティメッセージ Edge Function が実装されること |
| T1849 | P4 | A | RED | compatibility-score/index.ts: スコア計算テスト | supabase/functions/compatibility-score/index.ts | 2人のBig Fiveから相性スコアが計算されること |
| T1850 | P4 | A | GREEN | compatibility-score/index.ts: 実装 | supabase/functions/compatibility-score/index.ts | 相性スコア計算 Edge Function が実装されること |

### H2. E2Eテスト 追加タスク

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1851 | P5 | A | RED | E2E: 日記作成・閲覧フローテスト | e2e/journal/create-view.spec.ts | 日記作成→一覧表示→詳細閲覧の完全フロー |
| T1852 | P5 | A | RED | E2E: 日記AI振り返りテスト | e2e/journal/ai-reflection.spec.ts | 日記作成後にAI振り返りコメントが表示されるフロー |
| T1853 | P5 | A | GREEN | E2E: 日記E2E全パス | e2e/journal/ | 日記関連E2Eテストが全パスすること |
| T1854 | P5 | D | RED | E2E: 週次レポート表示テスト | e2e/insights/weekly-report.spec.ts | 設定→週次レポート→グラフ表示の完全フロー |
| T1855 | P5 | C | RED | E2E: ツイン会話シェアテスト | e2e/community/twin-conversation-share.spec.ts | ツイン会話→シェアボタン→シェアダイアログのフロー |
| T1856 | P5 | A | RED | E2E: インスタンス状態遷移テスト | e2e/settings/instance-state.spec.ts | provisioning→running→error→retry の状態遷移フロー |
| T1857 | P5 | B | RED | E2E: トライアル→有料移行テスト | e2e/subscription/trial-upgrade.spec.ts | トライアル終了→Stripe決済→Pro移行の完全フロー |
| T1858 | P5 | A | GREEN | E2E: 追加テスト全パス | e2e/ | 追加E2Eテストが全パスすること |

### 最終補足タスク

| T番号 | Phase | Agent | TDD | タスク名 | ファイル | テストケース説明 |
|-------|-------|-------|-----|---------|---------|----------------|
| T1859 | P0 | A | RED | 基盤: Zod バリデーションスキーマ定義 | src/shared/schemas/index.ts | API レスポンスの Zod スキーマが定義されること |
| T1860 | P0 | A | GREEN | 基盤: Zod スキーマ実装 | src/shared/schemas/index.ts | 全APIレスポンスのZodスキーマが実装されること |
| T1861 | P0 | A | RED | 基盤: 国際化設定 (next-intl) | src/i18n/config.ts | i18n の設定が完了すること |
| T1862 | P0 | A | GREEN | 基盤: 国際化実装 | src/i18n/ | 日英の国際化が実装されること |
| T1863 | P1 | A | RED | 共通: useInfiniteQuery パターンテスト | src/shared/hooks/__tests__/use-infinite-query.test.ts | `useInfiniteQuery` でページネーションが実装されること |
| T1864 | P1 | A | GREEN | 共通: useInfiniteQuery 実装 | src/shared/hooks/use-infinite-query.ts | 無限スクロール用 hook が実装されること |
| T1865 | P1 | A | RED | 共通: useOptimisticUpdate パターンテスト | src/shared/hooks/__tests__/use-optimistic-update.test.ts | 楽観的UI更新が実装されること |
| T1866 | P1 | A | GREEN | 共通: useOptimisticUpdate 実装 | src/shared/hooks/use-optimistic-update.ts | 楽観的UI更新 hook が実装されること |
| T1867 | P2 | C | RED | チャット: メッセージキュー実装テスト | src/features/chat/ | オフライン時のメッセージがキューに保存されること |
| T1868 | P2 | C | GREEN | チャット: メッセージキュー実装 | src/features/chat/ | チャットメッセージキュー機能が実装されること |
| T1869 | P3 | D | RED | 設定: サポートリンクテスト | app/__tests__/tabs/settings.test.tsx | 「サポートに問い合わせ」リンクが表示されること |
| T1870 | P3 | D | GREEN | 設定: サポートリンク実装 | app/(tabs)/settings.tsx | サポートリンクが実装されること |
| T1871 | P3 | A | RED | 設定: プライバシーポリシーリンクテスト | app/__tests__/tabs/settings.test.tsx | 「プライバシーポリシー」リンクが表示されること |
| T1872 | P3 | A | GREEN | 設定: プライバシーポリシーリンク実装 | app/(tabs)/settings.tsx | プライバシーポリシーリンクが実装されること |
| T1873 | P3 | A | RED | 設定: 利用規約リンクテスト | app/__tests__/tabs/settings.test.tsx | 「利用規約」リンクが表示されること |
| T1874 | P3 | A | GREEN | 設定: 利用規約リンク実装 | app/(tabs)/settings.tsx | 利用規約リンクが実装されること |
| T1875 | P3 | A | RED | 設定: アプリバージョン表示テスト | app/__tests__/tabs/settings.test.tsx | アプリバージョン番号が表示されること |
| T1876 | P3 | A | GREEN | 設定: バージョン表示実装 | app/(tabs)/settings.tsx | アプリバージョン表示が実装されること |
| T1877 | P4 | C | RED | openclaw: 接続プール管理テスト | src/services/openclaw/connection-manager.ts | 複数ユーザーのWebSocket接続がプール管理されること |
| T1878 | P4 | C | GREEN | openclaw: 接続プール実装 | src/services/openclaw/connection-manager.ts | WebSocket 接続プール管理が実装されること |
| T1879 | P5 | A | RED | E2E: ブラウザリサイズ対応テスト | e2e/responsive/resize.spec.ts | ブラウザリサイズ時にレイアウトが動的に切り替わること |
| T1880 | P5 | A | GREEN | E2E: リサイズ対応実装確認 | e2e/responsive/ | リサイズ対応が全ブレークポイントでテストされること |
| T1881 | P6 | A | RED | パフォーマンス: Critical CSS テスト | e2e/performance/critical-css.spec.ts | 初回表示に必要な CSS がインライン化されること |
| T1882 | P6 | A | GREEN | パフォーマンス: Critical CSS 実装 | web/ | Critical CSS のインライン化が実装されること |
| T1883 | P6 | A | RED | パフォーマンス: WebSocket メッセージ圧縮テスト | src/services/openclaw/ | WebSocket メッセージが gzip 圧縮されること |
| T1884 | P6 | A | GREEN | パフォーマンス: メッセージ圧縮実装 | src/services/openclaw/ | WebSocket メッセージ圧縮が実装されること |
| T1885 | P6 | A | RED | パフォーマンス: アセット prefetch テスト | web/index.html | 次ページのアセットが prefetch されること |
| T1886 | P6 | A | GREEN | パフォーマンス: prefetch 実装 | web/index.html | `<link rel="prefetch">` が設定されること |
| T1887 | P7 | A | RED | リリース: stagingデプロイテスト | - | staging 環境での動作確認が完了すること |
| T1888 | P7 | A | GREEN | リリース: staging デプロイ完了 | - | staging 環境が正常に動作すること |
| T1889 | P7 | A | RED | リリース: 本番デプロイテスト | - | 本番環境での動作確認が完了すること |
| T1890 | P7 | A | GREEN | リリース: 本番デプロイ完了 | - | 本番環境が正常に動作すること |
| T1891 | P8 | A | RED | 監視: エラーレート閾値テスト | - | エラーレートが閾値を超えた場合にアラートが発火すること |
| T1892 | P8 | A | GREEN | 監視: アラート設定完了 | - | 全監視アラートが設定されること |
| T1893 | P9 | A | RED | 最終: 全テストスイート実行テスト | - | `npm run test:all` で全テストが実行されること |
| T1894 | P9 | A | GREEN | 最終: 全テストパス確認 | - | 全テストスイートがパスすること |
| T1895 | P9 | A | REFACTOR | 最終: コードベース整理 | - | 未使用コード・コメントが削除されること |
| T1896 | P9 | A | REFACTOR | 最終: 依存パッケージ最新化 | package.json | 全パッケージが最新の安定版に更新されること |
| T1897 | P9 | A | REFACTOR | 最終: ビルドキャッシュ最適化 | - | CI ビルド時間が短縮されること |
| T1898 | P9 | A | RED | 最終: 受け入れテスト (AC-W1) | - | AC-W1: Web で Google/Apple OAuth ログインが動作すること |
| T1899 | P9 | A | RED | 最終: 受け入れテスト (AC-W2) | - | AC-W2: 4つのレスポンシブブレークポイントが正しく動作すること |
| T1900 | P9 | B | RED | 最終: 受け入れテスト (AC-W3) | - | AC-W3: Stripe Checkout で Web 課金が完了すること |
| T1901 | P9 | C | RED | 最終: 受け入れテスト (AC-W4) | - | AC-W4: Free は SSE、Pro は WebSocket でチャットが動作すること |
| T1902 | P9 | D | RED | 最終: 受け入れテスト (AC-W5) | - | AC-W5: コミュニティがブラウザで正常に動作すること |
| T1903 | P9 | A | RED | 最終: 受け入れテスト (AC-W6) | - | AC-W6: Chrome/Firefox/Safari/Edge で動作すること |
| T1904 | P9 | A | RED | 最終: 受け入れテスト (AC-W7) | - | AC-W7: LCP < 3s のパフォーマンス要件を達成すること |
| T1905 | P9 | A | RED | 最終: 受け入れテスト (AC-W8) | - | AC-W8: バンドルサイズ < 500KB(gzip) を達成すること |
| T1906 | P9 | A | RED | 最終: 受け入れテスト (AC-W9) | - | AC-W9: テストカバレッジ80%以上を達成すること |
| T1907 | P9 | A | RED | 最終: 受け入れテスト (AC-W10) | - | AC-W10: WCAG 2.1 Level AA を達成すること |
| T1908 | P9 | A | GREEN | 最終: 全受け入れテストパス | - | AC-W1〜W10 の全受け入れ条件がクリアされること |
| T1909 | P9 | A | REFACTOR | 最終: 実装完了宣言 | - | AltMe Web 版の実装が完了し、リリース準備が整うこと |
| T1910 | P0 | A | RED | 基盤: モノレポ設定確認テスト | - | `npx expo --version` が Expo SDK 54 を返すこと |
| T1911 | P0 | A | GREEN | 基盤: Expo SDK 54 確認 | package.json | Expo SDK 54 が正しく設定されること |
| T1912 | P0 | A | RED | 基盤: Zustand 5.x 確認テスト | - | `zustand` パッケージが 5.x 以上であること |
| T1913 | P0 | A | GREEN | 基盤: Zustand 5.x 確認 | package.json | Zustand 5.x が設定されること |
| T1914 | P0 | A | RED | 基盤: Expo Router v3 確認テスト | - | `expo-router` パッケージが v3 以上であること |
| T1915 | P0 | A | GREEN | 基盤: Expo Router v3 確認 | package.json | Expo Router v3 が設定されること |
| T1916 | P1 | A | RED | 共通: GlassCard ストーリーbook テスト | src/shared/components/__tests__/glass-card.stories.test.tsx | GlassCard の全バリアントがストーリーブックで表示されること |
| T1917 | P1 | A | GREEN | 共通: GlassCard ストーリー実装 | src/shared/components/glass-card.stories.tsx | GlassCard のStorybookストーリーが実装されること |
| T1918 | P1 | A | RED | 共通: GoldButton ストーリーbook テスト | src/shared/components/__tests__/gold-button.stories.test.tsx | GoldButton の全状態がストーリーブックで表示されること |
| T1919 | P1 | A | GREEN | 共通: GoldButton ストーリー実装 | src/shared/components/gold-button.stories.tsx | GoldButton のStorybookストーリーが実装されること |
| T1920 | P2 | A | RED | ストア: Zustand SSR ハイドレーション競合テスト | src/shared/stores/ | SSR 後の CSR でストアがハイドレートされること |
| T1921 | P2 | A | GREEN | ストア: SSR ハイドレーション実装 | src/shared/stores/ | SSR セーフなストア初期化が実装されること |
| T1922 | P2 | C | RED | サービス: OpenClaw 切断→メッセージ再送テスト | src/services/openclaw/ | WebSocket 切断中のメッセージが再接続後に送信されること |
| T1923 | P2 | C | GREEN | サービス: メッセージ再送実装 | src/services/openclaw/ | 切断時のメッセージ再送機能が実装されること |
| T1924 | P3 | A | RED | 画面: タブアイコンアニメーションテスト | app/__tests__/layout.test.tsx | アクティブタブ切替時にアイコンアニメーションが発生すること |
| T1925 | P3 | A | GREEN | 画面: タブアニメーション実装 | app/_layout.tsx | タブアイコンアニメーションが実装されること |
| T1926 | P4 | B | RED | Edge: 請求書PDFテスト | supabase/functions/generate-invoice/ | Stripe 請求書 PDF が生成されること |
| T1927 | P4 | B | GREEN | Edge: 請求書PDF実装 | supabase/functions/generate-invoice/index.ts | 請求書PDF生成 Edge Function が実装されること |
| T1928 | P5 | A | RED | E2E: ユーザー登録→ログイン完全フローテスト | e2e/auth/signup-login.spec.ts | 新規登録→ログアウト→再ログインの完全フロー |
| T1929 | P5 | A | GREEN | E2E: 登録・ログインフロー完了 | e2e/auth/ | 全認証フローが E2E テストでパスすること |
| T1930 | P6 | A | RED | パフォーマンス: Gzip 圧縮確認テスト | - | サーバーが Gzip 圧縮を有効にしていること |
| T1931 | P6 | A | GREEN | パフォーマンス: Gzip 実装 | - | Gzip 圧縮が設定されること |
| T1932 | P7 | A | RED | デプロイ: ゼロダウンタイムテスト | - | デプロイ中もサービスが継続して動作すること |
| T1933 | P7 | A | GREEN | デプロイ: ゼロダウンタイム実装 | - | ブルーグリーンデプロイが設定されること |
| T1934 | P8 | A | RED | 運用: SLA監視テスト | - | 99.9% SLA が監視されること |
| T1935 | P8 | A | GREEN | 運用: SLA設定 | - | SLA モニタリングが設定されること |
| T1936 | P9 | A | RED | 後続: App Store 審査準備テスト | - | App Store 審査要件が全て満たされること |
| T1937 | P9 | A | RED | 後続: Play Store 審査準備テスト | - | Play Store 審査要件が全て満たされること |
| T1938 | P9 | A | GREEN | 後続: ストア申請完了 | - | App Store / Play Store への申請が完了すること |
| T1939 | P9 | A | RED | 後続: マーケティングページテスト | - | ランディングページが正常に表示されること |
| T1940 | P9 | A | GREEN | 後続: マーケティングページ公開 | - | ランディングページが本番環境で公開されること |
| T1941 | P9 | A | RED | 後続: ユーザーオンボーディングメールテスト | - | 新規登録後にウェルカムメールが送信されること |
| T1942 | P9 | A | GREEN | 後続: ウェルカムメール設定 | - | ウェルカムメールの自動送信が設定されること |
| T1943 | P9 | A | REFACTOR | 後続: SEO最適化 | - | Lighthouse SEO スコアが 90 以上であること |
| T1944 | P9 | A | REFACTOR | 後続: パフォーマンス継続改善 | - | Core Web Vitals が継続的に計測・改善されること |
| T1945 | P9 | A | REFACTOR | 後続: アクセシビリティ継続改善 | - | アクセシビリティ監査が定期的に実施されること |
| T1946 | P9 | A | REFACTOR | 後続: セキュリティ定期監査 | - | セキュリティ監査が四半期ごとに実施されること |
| T1947 | P9 | A | REFACTOR | 後続: 技術スタック定期更新 | - | 依存パッケージの定期更新サイクルが設定されること |
| T1948 | P9 | A | REFACTOR | 後続: ユーザーフィードバック収集 | - | NPS サーベイが実装されること |
| T1949 | P9 | A | REFACTOR | 後続: A/Bテスト運用体制 | - | PostHog Feature Flags を用いた A/B テスト運用が開始されること |
| T1950 | P9 | A | REFACTOR | 後続: 成長ロードマップ更新 | specs/ | 次フェーズの開発ロードマップが更新されること |


---

## M. Web専用追加タスク（T1951〜T2050）

### M-1. Web PWA対応

| タスクID | Phase | Agent | TDD段階 | タスク名 | ファイル | テストケース説明 |
|---------|-------|-------|--------|---------|--------|----------------|
| T1951 | P1 | A | RED | PWA manifest.json テスト | `public/manifest.json` | name, short_name, icons, display: standalone, theme_color が正しく設定されること |
| T1952 | P1 | A | GREEN | PWA manifest.json 実装 | `public/manifest.json` | AltMe アプリとして正しい manifest.json が生成されること |
| T1953 | P1 | A | RED | Service Worker 登録テスト | `src/services/pwa/sw-register.web.ts` | Service Worker が登録され、updatefound イベントが処理されること |
| T1954 | P1 | A | GREEN | Service Worker 登録実装 | `src/services/pwa/sw-register.web.ts` | `/sw.js` が正常に登録されること |
| T1955 | P1 | A | RED | オフラインキャッシュ戦略テスト | `public/sw.js` | API レスポンスが Cache Storage にキャッシュされること |
| T1956 | P1 | A | GREEN | オフラインキャッシュ戦略実装 | `public/sw.js` | NetworkFirst / CacheFirst 戦略が適切に実装されること |
| T1957 | P1 | A | RED | PWA インストールプロンプトテスト | `src/shared/components/pwa-install-banner.web.tsx` | beforeinstallprompt イベントをキャプチャしてバナー表示できること |
| T1958 | P1 | A | GREEN | PWA インストールバナー実装 | `src/shared/components/pwa-install-banner.web.tsx` | インストールボタンタップで prompt() が呼ばれること |
| T1959 | P1 | A | REFACTOR | PWA インストールバナー最適化 | `src/shared/components/pwa-install-banner.web.tsx` | dismissed 状態が localStorage に保存されること |
| T1960 | P1 | A | RED | Push 通知 Web 権限テスト | `src/services/notifications/client.web.ts` | Notification.requestPermission() が呼ばれること |
| T1961 | P1 | A | GREEN | Push 通知 Web 権限実装 | `src/services/notifications/client.web.ts` | 権限付与後に FCM subscription が作成されること |
| T1962 | P1 | A | RED | Background Sync テスト | `public/sw.js` | オフライン時の送信操作が Background Sync キューに追加されること |
| T1963 | P1 | A | GREEN | Background Sync 実装 | `public/sw.js` | 復帰後に pending リクエストが自動送信されること |

### M-2. Web OGP / SEO対応

| タスクID | Phase | Agent | TDD段階 | タスク名 | ファイル | テストケース説明 |
|---------|-------|-------|--------|---------|--------|----------------|
| T1964 | P1 | A | RED | OGP メタタグテスト | `app/_layout.web.tsx` | og:title, og:description, og:image, og:url が head に含まれること |
| T1965 | P1 | A | GREEN | OGP メタタグ実装 | `app/_layout.web.tsx` | expo-router の `<Head>` コンポーネントで OGP タグが設定されること |
| T1966 | P1 | A | RED | Twitter Card メタタグテスト | `app/_layout.web.tsx` | twitter:card, twitter:title, twitter:image が設定されること |
| T1967 | P1 | A | GREEN | Twitter Card メタタグ実装 | `app/_layout.web.tsx` | summary_large_image カード形式で設定されること |
| T1968 | P1 | A | RED | sitemap.xml テスト | `public/sitemap.xml` | 全公開ページの URL が含まれること |
| T1969 | P1 | A | GREEN | sitemap.xml 実装 | `public/sitemap.xml` | lastmod, changefreq, priority が設定されること |
| T1970 | P1 | A | RED | robots.txt テスト | `public/robots.txt` | /api/, /auth/ 等がクロール禁止になっていること |
| T1971 | P1 | A | GREEN | robots.txt 実装 | `public/robots.txt` | Allow/Disallow ルールが正しく記述されること |
| T1972 | P1 | A | RED | 構造化データ（JSON-LD）テスト | `app/_layout.web.tsx` | schema.org の SoftwareApplication 型が埋め込まれること |
| T1973 | P1 | A | GREEN | 構造化データ実装 | `app/_layout.web.tsx` | applicationCategory: LifestyleApplication が含まれること |

### M-3. Web パフォーマンス最適化追加

| タスクID | Phase | Agent | TDD段階 | タスク名 | ファイル | テストケース説明 |
|---------|-------|-------|--------|---------|--------|----------------|
| T1974 | P4 | A | RED | Critical CSS インライン化テスト | `src/config/critical-css.web.ts` | 初期レンダリングに必要な CSS がインライン展開されること |
| T1975 | P4 | A | GREEN | Critical CSS インライン化実装 | `src/config/critical-css.web.ts` | FCP が 1.5s 以下になること |
| T1976 | P4 | A | RED | フォント最適化テスト | `src/config/fonts.web.ts` | font-display: swap が適用されていること |
| T1977 | P4 | A | GREEN | フォント最適化実装 | `src/config/fonts.web.ts` | preload リンクタグがフォントに追加されること |
| T1978 | P4 | A | RED | 画像遅延ロードテスト | `src/shared/components/optimized-image.web.tsx` | viewport 外の画像が loading="lazy" 属性を持つこと |
| T1979 | P4 | A | GREEN | 画像遅延ロード実装 | `src/shared/components/optimized-image.web.tsx` | IntersectionObserver で viewport 内に入った時のみロードされること |
| T1980 | P4 | A | RED | WebP 変換テスト | `src/shared/utils/image-format.web.ts` | ブラウザが WebP サポートの場合 .webp 形式が選択されること |
| T1981 | P4 | A | GREEN | WebP 変換実装 | `src/shared/utils/image-format.web.ts` | `<picture>` タグで WebP/fallback が提供されること |
| T1982 | P4 | A | RED | バンドルサイズ監視テスト | `scripts/bundle-size-check.ts` | バンドルサイズが閾値（500KB gzip）超過時に CI が失敗すること |
| T1983 | P4 | A | GREEN | バンドルサイズ監視実装 | `scripts/bundle-size-check.ts` | webpack-bundle-analyzer でサイズレポートが生成されること |

### M-4. Web 国際化（i18n）追加

| タスクID | Phase | Agent | TDD段階 | タスク名 | ファイル | テストケース説明 |
|---------|-------|-------|--------|---------|--------|----------------|
| T1984 | P3 | A | RED | hreflang タグテスト | `app/_layout.web.tsx` | ja/en の hreflang タグが head に含まれること |
| T1985 | P3 | A | GREEN | hreflang タグ実装 | `app/_layout.web.tsx` | x-default を含む全 locale の hreflang が設定されること |
| T1986 | P3 | A | RED | Accept-Language ヘッダー検出テスト | `src/shared/hooks/use-locale.web.ts` | ブラウザの Accept-Language から優先言語を検出できること |
| T1987 | P3 | A | GREEN | Accept-Language ヘッダー検出実装 | `src/shared/hooks/use-locale.web.ts` | navigator.languages から優先ロケールを選択できること |
| T1988 | P3 | A | RED | URL ベース言語切替テスト | `app/[locale]/_layout.tsx` | /ja/, /en/ URL プレフィックスでロケールが切り替わること |
| T1989 | P3 | A | GREEN | URL ベース言語切替実装 | `app/[locale]/_layout.tsx` | expo-router の dynamic route でロケールパラメータを処理できること |
| T1990 | P3 | A | RED | 言語切替 UI テスト | `src/shared/components/locale-switcher.web.tsx` | ドロップダウンから日本語/英語を切り替えられること |
| T1991 | P3 | A | GREEN | 言語切替 UI 実装 | `src/shared/components/locale-switcher.web.tsx` | 切替後にページがリロードなしで再レンダリングされること |

### M-5. Web セッション管理強化

| タスクID | Phase | Agent | TDD段階 | タスク名 | ファイル | テストケース説明 |
|---------|-------|-------|--------|---------|--------|----------------|
| T1992 | P2 | A | RED | セッション有効期限警告テスト | `src/features/auth/hooks/use-session-expiry.web.ts` | トークン失効 5 分前にモーダル警告が表示されること |
| T1993 | P2 | A | GREEN | セッション有効期限警告実装 | `src/features/auth/hooks/use-session-expiry.web.ts` | setInterval で定期チェック、失効直前にダイアログが出ること |
| T1994 | P2 | A | RED | セッション延長テスト | `src/features/auth/components/session-extend-modal.web.tsx` | 「続ける」ボタンでトークンがリフレッシュされること |
| T1995 | P2 | A | GREEN | セッション延長実装 | `src/features/auth/components/session-extend-modal.web.tsx` | supabase.auth.refreshSession() が呼ばれトークンが更新されること |
| T1996 | P2 | A | RED | マルチタブ同期テスト | `src/features/auth/hooks/use-cross-tab-auth.web.ts` | 別タブでログアウトした際に全タブでセッションが無効化されること |
| T1997 | P2 | A | GREEN | マルチタブ同期実装 | `src/features/auth/hooks/use-cross-tab-auth.web.ts` | BroadcastChannel API でタブ間のセッション状態を同期できること |
| T1998 | P2 | A | RED | ブラウザ閉じる時の警告テスト | `src/shared/hooks/use-beforeunload.web.ts` | 未保存の変更がある状態でページを離れようとすると警告が出ること |
| T1999 | P2 | A | GREEN | ブラウザ閉じる時の警告実装 | `src/shared/hooks/use-beforeunload.web.ts` | window.addEventListener('beforeunload', ...) で離脱防止が動作すること |
| T2000 | P9 | A | REFACTOR | 全タスク完了: Web版フル実装達成 | `specs/` | 2000タスク全件の受け入れ条件が満たされ、AltMe Web版が本番リリース可能状態であること |
| T2001 | P9 | A | REFACTOR | E2E 最終統合テスト実行 | `e2e/full-regression.spec.ts` | 全画面・全フロー・全プラットフォームで E2E テストがグリーンになること |
| T2002 | P9 | A | REFACTOR | パフォーマンス最終計測 | `scripts/perf-final-report.ts` | LCP < 2.5s, FID < 100ms, CLS < 0.1 が全ページで達成されること |
| T2003 | P9 | A | REFACTOR | アクセシビリティ最終監査 | `e2e/a11y-final.spec.ts` | axe-core で WCAG 2.1 Level AA 違反ゼロが確認されること |
| T2004 | P9 | A | REFACTOR | セキュリティ最終スキャン | `scripts/security-final-scan.ts` | OWASP Top 10 全項目の脆弱性スキャンがグリーンになること |
| T2005 | P9 | A | REFACTOR | 本番環境デプロイ最終確認 | `scripts/deploy-verify.ts` | production 環境への deploy が成功し全ヘルスチェックが通ること |

---

## タスク総数サマリー（最終版）

| カテゴリ | タスク範囲 | 件数 |
|---------|----------|------|
| A. 設定・基盤 | T0001-T0100 | 100 |
| B. 共通コンポーネント | T0101-T0400 | 300 |
| C. Hooks | T0401-T0650 | 250 |
| D. Stores | T0651-T0750 | 100 |
| E. サービス層 | T0751-T0950 | 200 |
| F. 画面 | T0951-T1150 | 200 |
| G. Edge Functions | T1151-T1310 | 160 |
| H. E2E テスト | T1311-T1405 | 95 |
| I. セキュリティ | T1406-T1485 | 80 |
| J. パフォーマンス | T1486-T1525 | 40 |
| K. アクセシビリティ | T1526-T1585 | 60 |
| L. 実装タスク | T1586-T1735 | 150 |
| 補足（E2/F2/G2/H2/最終） | T1736-T1950 | 215 |
| M. Web専用追加 | T1951-T2005 | 55 |
| **合計** | **T0001-T2005** | **2,005** |
