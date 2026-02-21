---
description: Playwright によるブラウザ自動化・E2Eテスト・デバッグ。テスト実行、コード生成、トレース分析、スクリーンショット取得に対応。
allowed-tools: Bash(npx playwright:*),Bash(npx playwright test:*),Bash(npx playwright codegen:*),Bash(npx playwright show-report:*),Bash(npx playwright screenshot:*),Bash(npx playwright show-trace:*)
---

# Browser Automation & E2E Testing with Playwright

AltMe（React Native Expo Web）向けのブラウザ自動化・E2Eテストスキル。

## プロジェクト設定

プロジェクトの `playwright.config.ts` に基づく設定:

- **testDir**: `./e2e`
- **baseURL**: `http://localhost:8081`（Expo Web）
- **ブラウザ**: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 7), Mobile Safari (iPhone 14)
- **ヘッドレス**: デフォルト有効
- **トレース**: 初回リトライ時に記録
- **スクリーンショット**: 失敗時のみ
- **認証**: globalSetup で devLogin → storageState 保存
- **Webサーバー**: `npx expo start --web --port 8081`（自動起動、タイムアウト120秒）

## セットアップ

```bash
# Playwright とブラウザのインストール
npx playwright install

# 特定ブラウザのみインストール
npx playwright install chromium
```

## テスト実行

```bash
# 全テスト実行
npx playwright test

# 特定ファイルのテスト実行
npx playwright test e2e/onboarding.spec.ts

# 特定テスト名でフィルタ
npx playwright test -g "Welcome"

# 特定ブラウザで実行
npx playwright test --project=chromium
npx playwright test --project=mobile-safari

# ヘッド付き（ブラウザ表示）で実行
npx playwright test --headed

# デバッグモード（ステップ実行）
npx playwright test --debug

# UI モードで実行（インタラクティブ）
npx playwright test --ui

# リトライ回数指定
npx playwright test --retries=2

# 並列数指定（シリアル実行）
npx playwright test --workers=1
```

## テストコード生成（codegen）

```bash
# ブラウザを開いて操作を記録 → テストコード自動生成
npx playwright codegen http://localhost:8081

# モバイルデバイスでコード生成
npx playwright codegen --device="iPhone 14" http://localhost:8081

# 特定ビューポートでコード生成
npx playwright codegen --viewport-size=375,812 http://localhost:8081
```

## テストレポート

```bash
# HTML レポートを表示
npx playwright show-report

# レポートの出力先を指定
npx playwright show-report playwright-report
```

## トレース分析

```bash
# トレースファイルをビューアで開く
npx playwright show-trace trace.zip

# テスト実行時にトレースを強制記録
npx playwright test --trace=on
```

## スクリーンショット

```bash
# ページのスクリーンショットを取得
npx playwright screenshot http://localhost:8081 screenshot.png

# フルページスクリーンショット
npx playwright screenshot --full-page http://localhost:8081 full.png
```

## テストコードの書き方

### 基本構造

```typescript
import { test, expect } from "@playwright/test";

test.describe("機能名", () => {
  test.beforeEach(async ({ page }) => {
    // セットアップ
  });

  test("テストケース名", async ({ page }) => {
    await page.goto("/path");

    // 要素の取得と操作
    await page.getByText("テキスト").click();
    await page.getByRole("button", { name: "ボタン名" }).click();

    // アサーション
    await expect(page.getByText("期待するテキスト")).toBeVisible();
    await expect(page.getByRole("button", { name: "送信" })).toBeEnabled();
  });
});
```

### Supabase APIモックパターン

```typescript
// Supabase Auth API
await page.route("**/auth/v1/**", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ access_token: "mock", user: { id: "uid" } }),
  })
);

// Supabase REST API (PostgREST)
await page.route("**/rest/v1/profiles**", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ id: "uid", display_name: "Test" }]),
  })
);

// Edge Functions
await page.route("**/functions/v1/chat-free", (route) =>
  route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    body: 'data: {"content":"Hello"}\n\ndata: [DONE]\n\n',
  })
);

// エラーレスポンス
await page.route("**/rest/v1/**", (route) =>
  route.fulfill({
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({ message: "Internal Server Error" }),
  })
);
```

### 認証ヘルパー

```typescript
import { loginAsDevUser, loginAsGuest } from "./helpers/auth";

// devLogin による認証
await loginAsDevUser(page);

// ゲストログイン
await loginAsGuest(page);
```

### 要素取得の優先順位

1. `page.getByRole()` - ロールベース（推奨）
2. `page.getByLabel()` - ラベルベース
3. `page.getByPlaceholder()` - プレースホルダーベース
4. `page.getByText()` - テキストベース
5. `page.getByTestId()` - テストID（最終手段）

### React Native Web 固有の注意

- `accessibilityRole` → HTML `role` にマッピング
- `Pressable` → `role="button"` で取得可能
- `TextInput` → `placeholder` で取得可能
- `accessibilityLabel` → `aria-label` にマッピング
- `CosmicBackground` のオーバーレイに `pointerEvents="none"` が必要

### テスト内でのスクリーンショット

```typescript
test("テスト名", async ({ page }) => {
  await page.goto("/path");
  await page.screenshot({ path: "e2e/screenshots/test-result.png" });
  await page.screenshot({ path: "e2e/screenshots/full.png", fullPage: true });
});
```

## デバッグワークフロー

### 1. テスト失敗時の調査

```bash
# デバッグモードで失敗テストを再実行
npx playwright test --debug e2e/failing-test.spec.ts

# トレース付きで再実行
npx playwright test --trace=on e2e/failing-test.spec.ts

# トレースを確認
npx playwright show-trace test-results/*/trace.zip
```

### 2. 新しいテストの作成

```bash
# codegen でブラウザ操作を記録
npx playwright codegen http://localhost:8081

# 生成されたコードを e2e/ に保存して調整
```

## 制約

- Expo Web 開発サーバーが起動している必要がある（config で自動起動設定あり）
- テストファイルは `e2e/` ディレクトリに配置する
- テストデータはAPIモック（`page.route()`）で提供する
- テスト結果のスクリーンショットは `e2e/screenshots/` に保存
