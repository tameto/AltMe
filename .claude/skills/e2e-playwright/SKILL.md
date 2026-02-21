---
description: Playwright E2Eテストパターン集。AltMe のオンボーディング・認証・チャット・課金フローのテストテンプレート、Supabase APIモック規約、認証ヘルパー使用法。
---

# Playwright E2E テストパターン集

## 設定

### playwright.config.ts

```typescript
import { defineConfig, devices } from "@playwright/test";
import path from "path";

const STORAGE_STATE_PATH = path.join(__dirname, "e2e", ".auth", "user.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:8081",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    storageState: STORAGE_STATE_PATH,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: "npx expo start --web --port 8081",
    port: 8081,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 実行コマンド

```bash
npx playwright test                          # 全テスト
npx playwright test e2e/onboarding.spec.ts   # 特定テスト
npx playwright test --project=chromium       # 特定ブラウザ
npx playwright test --headed                 # ブラウザ表示
npx playwright test --debug                  # デバッグモード
npx playwright test --ui                     # UIモード
npx playwright show-report                   # レポート表示
```

---

## ファイル構成

```
e2e/
├── .auth/
│   └── user.json              # globalSetup で保存される認証状態
├── helpers/
│   ├── auth.ts                # 認証ヘルパー（devLogin, guestLogin）
│   └── navigation.ts          # ナビゲーションヘルパー
├── auth.spec.ts               # 認証テスト
├── onboarding.spec.ts         # オンボーディングフローテスト
├── chat.spec.ts               # チャットテスト
├── community.spec.ts          # コミュニティテスト
├── navigation.spec.ts         # ナビゲーションテスト
├── stripe-checkout.spec.ts    # 課金テスト
├── twin-settings.spec.ts      # ツイン設定テスト
├── smoke.spec.ts              # スモークテスト
├── global-setup.ts            # グローバルセットアップ（devLogin）
├── global-teardown.ts         # グローバルティアダウン
└── tsconfig.json
```

---

## 認証

### globalSetup による自動認証

`globalSetup` が devLogin を実行し `storageState` を保存。
各テストは `playwright.config.ts` の `storageState` を継承するため、
認証済み状態で開始される。

### 手動認証が必要な場合

```typescript
import { loginAsDevUser, loginAsGuest } from "./helpers/auth";

test("認証が必要なテスト", async ({ page }) => {
  await loginAsDevUser(page);
  await page.goto("/chat");
});
```

### 未認証状態のテスト

```typescript
test.use({ storageState: { cookies: [], origins: [] } });

test("未認証でログイン画面にリダイレクト", async ({ page }) => {
  await page.goto("/chat");
  // Expo Router の認証ガードによりリダイレクト
  await expect(page).toHaveURL(/\/(auth|onboarding)/);
});
```

---

## 画面フロー別テストパターン

### 1. オンボーディングフロー

```typescript
import { test, expect } from "@playwright/test";

test.describe("Onboarding flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Welcome → 性格診断 → 結果", async ({ page }) => {
    // 認証後オンボーディング未完了のモック
    await page.goto("/");

    // Welcome画面
    await expect(page.getByText(/始めましょう|Get Started/)).toBeVisible();
    await page.getByRole("button", { name: /始める|Start/ }).click();

    // 性格診断（5問）
    for (let i = 0; i < 5; i++) {
      await page.getByText(/そう思う/).first().click();
      await page.getByRole("button", { name: /次へ|Next/ }).click();
    }

    // 結果画面
    await expect(page.getByText(/診断結果|Result/)).toBeVisible();
  });

  test("アバター選択 → トーン選択 → ツイン命名", async ({ page }) => {
    // アバター選択画面
    await page.goto("/(onboarding)/choose-avatar");

    // アバターをクリック
    const avatarGrid = page.getByRole("radio").first();
    await avatarGrid.click();
    await page.getByRole("button", { name: /次へ|Next/ }).click();

    // トーン選択画面
    await page.getByRole("radio", { name: /カジュアル|casual/ }).click();
    await page.getByRole("button", { name: /次へ|Next/ }).click();

    // ツイン命名
    await page.getByPlaceholder(/名前/).fill("テストツイン");
    await page.getByRole("button", { name: /決定|Confirm/ }).click();
  });
});
```

### 2. チャットフロー

```typescript
import { test, expect } from "@playwright/test";

test.describe("Chat", () => {
  test("Free チャットでメッセージ送信", async ({ page }) => {
    // SSE レスポンスモック
    await page.route("**/functions/v1/chat-free", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          'data: {"content":"こん"}',
          'data: {"content":"にちは"}',
          'data: {"content":"！"}',
          "data: [DONE]",
        ].join("\n\n") + "\n\n",
      })
    );

    await page.goto("/chat");

    // メッセージ入力・送信
    await page.getByPlaceholder(/メッセージ|message/i).fill("テストメッセージ");
    await page.getByRole("button", { name: /送信|send/i }).click();

    // AI応答表示を確認
    await expect(page.getByText("こんにちは！")).toBeVisible();
  });

  test("Free チャット制限表示", async ({ page }) => {
    await page.goto("/chat");
    // 残り回数カウンターが表示されること
    await expect(page.getByText(/残り|remaining/i)).toBeVisible();
  });
});
```

### 3. 課金フロー（Stripe）

```typescript
import { test, expect } from "@playwright/test";

test.describe("Stripe Checkout", () => {
  test("ペイウォールからチェックアウトセッション作成", async ({ page }) => {
    let checkoutPayload: Record<string, unknown> | null = null;

    // create-checkout-session Edge Function モック
    await page.route("**/functions/v1/create-checkout-session", async (route) => {
      checkoutPayload = route.request().postDataJSON?.() ?? null;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "https://checkout.stripe.com/mock-session",
        }),
      });
    });

    await page.goto("/(paywall)");

    // 月額プランを選択
    await page.getByText(/月額|Monthly/).click();
    await page.getByRole("button", { name: /購入|Subscribe/ }).click();

    // ペイロード検証
    expect(checkoutPayload).toMatchObject({
      planType: "monthly",
    });
  });
});
```

### 4. ナビゲーション

```typescript
import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("WebSidebar タブ切り替え", async ({ page }) => {
    // デスクトップビューポート
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/chat");

    // サイドバーが表示されること
    await expect(page.getByRole("navigation")).toBeVisible();

    // タブ切り替え
    await page.getByRole("link", { name: /日記|Journal/ }).click();
    await expect(page).toHaveURL(/\/journal/);

    await page.getByRole("link", { name: /設定|Settings/ }).click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test("モバイル ボトムタブ", async ({ page }) => {
    // モバイルビューポート
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/chat");

    // ボトムタブ切り替え
    await page.getByRole("link", { name: /チャット|Chat/ }).click();
    await expect(page).toHaveURL(/\/chat/);
  });
});
```

---

## エラーシナリオテスト

### 認証エラー（401）

```typescript
test("Supabase 401 で再ログイン促進", async ({ page }) => {
  await page.route("**/rest/v1/**", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "JWT expired" }),
    })
  );

  await page.goto("/chat");
  // エラーメッセージまたは再ログイン画面
  await expect(page.getByText(/ログイン|login/i)).toBeVisible();
});
```

### サーバーエラー（500）

```typescript
test("Edge Function 500 エラー表示", async ({ page }) => {
  await page.route("**/functions/v1/chat-free", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Internal Server Error" }),
    })
  );

  await page.goto("/chat");
  await page.getByPlaceholder(/メッセージ/).fill("test");
  await page.getByRole("button", { name: /送信/ }).click();

  await expect(page.getByText(/エラー|error/i)).toBeVisible();
});
```

### ネットワークエラー

```typescript
test("ネットワーク切断時のエラーハンドリング", async ({ page }) => {
  await page.route("**/rest/v1/**", (route) =>
    route.abort("internetdisconnected")
  );

  await page.goto("/chat");
  await expect(page.getByText(/接続|connection|error/i)).toBeVisible();
});
```

---

## レスポンシブテスト

```typescript
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 720 },
  { name: "wide", width: 1440, height: 900 },
];

for (const vp of viewports) {
  test(`${vp.name}: レイアウト確認`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/chat");

    if (vp.width >= 1024) {
      // デスクトップ: WebSidebar 表示
      await expect(page.getByRole("navigation")).toBeVisible();
    } else if (vp.width >= 768) {
      // タブレット: アイコンのみサイドバー
    } else {
      // モバイル: ボトムタブ
    }

    await page.screenshot({
      path: `e2e/screenshots/layout-${vp.name}.png`,
      fullPage: true,
    });
  });
}
```

---

## チェックリスト（テスト網羅性）

### オンボーディング
- [ ] Welcome画面表示
- [ ] 性格診断5問フロー
- [ ] 結果画面表示（Big Five）
- [ ] Pro解放ボタン → ペイウォール遷移
- [ ] アバター選択（30種グリッド）
- [ ] トーン選択（5種カード）
- [ ] ツイン命名 → チャット開始
- [ ] プログレスバー更新（6ステップ）

### 認証
- [ ] devLogin 成功
- [ ] 未認証リダイレクト
- [ ] セッション期限切れ

### チャット
- [ ] Free: メッセージ送受信（SSE）
- [ ] Free: 3回/日制限
- [ ] Pro: WebSocket接続（モック）

### 課金
- [ ] ペイウォール表示
- [ ] Stripe Checkout セッション作成
- [ ] プラン選択（月額/年額）

### ナビゲーション
- [ ] WebSidebar（デスクトップ）
- [ ] ボトムタブ（モバイル）
- [ ] タブ切り替え
- [ ] 認証ガード

### エラー
- [ ] 401 認証エラー
- [ ] 500 サーバーエラー
- [ ] ネットワーク切断
