---
description: Playwright でE2Eテストを実行する（画面遷移、フォーム操作、エラーハンドリング検証）
---

# E2E テスト実行

Playwright（`@playwright/test`）を使用して画面のE2Eテストを実行します。

## 引数

- `$ARGUMENTS` : テスト対象の画面パスまたは機能名（例: `/(onboarding)/welcome`、`オンボーディング`、`chat`、`認証`）

## 実行手順

1. **仕様書の確認**: `specs/features/` から対象画面の仕様書を読み込み

2. **テストシナリオ設計**: 仕様書に基づき以下を計画
   - 正常系フロー（画面遷移、データ表示）
   - ユーザー操作（フォーム入力、ボタンクリック、選択）
   - エラーハンドリング（Supabase 401/500、ネットワーク切断）
   - レスポンシブ対応（デスクトップ/タブレット/モバイル）

3. **テストコード作成**: `e2e/` にテストファイルを作成
   ```typescript
   import { test, expect } from "@playwright/test";

   test.describe("機能名", () => {
     test("テストケース名", async ({ page }) => {
       await page.goto("/path");
       await expect(page.getByText("期待するテキスト")).toBeVisible();
     });
   });
   ```

4. **テスト実行**:
   ```bash
   npx playwright test e2e/{feature}.spec.ts
   npx playwright test e2e/{feature}.spec.ts --headed  # ブラウザ表示
   npx playwright test e2e/{feature}.spec.ts --debug    # デバッグモード
   ```

5. **テストレポート確認**: `npx playwright show-report`

## エージェント

`e2e-tester` エージェントを使用してE2Eテストを実行します。

対象: $ARGUMENTS
