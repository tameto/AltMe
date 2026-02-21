---
description: Playwright でブラウザデバッグを実行する（コンソールログ、ネットワーク、ステート確認）
---

# ブラウザデバッグ

Playwright（`@playwright/test`）を使用してブラウザ上の問題を診断します。

## 引数

- `$ARGUMENTS` : デバッグ対象のURL（例: `/chat`、`/(onboarding)/welcome`）またはデバッグ内容の説明

## 実行手順

1. **Playwright の確認**: `npx playwright --version` でインストール確認。未インストールなら `npx playwright install chromium` を実行

2. **Expo Web 開発サーバー確認**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081` で起動確認。未起動なら `npx expo start --web --port 8081` を案内

3. **デバッグ方法**:

   **方法A: codegen でインタラクティブデバッグ**
   ```bash
   npx playwright codegen http://localhost:8081{target-path}
   ```
   ブラウザが開き、操作を記録しながらDOM検査が可能。

   **方法B: テストコードでデバッグ**
   ```bash
   npx playwright test e2e/{target}.spec.ts --debug
   ```
   ステップ実行でコンソール・ネットワーク・DOMを確認。

   **方法C: トレース付きテスト実行**
   ```bash
   npx playwright test e2e/{target}.spec.ts --trace=on
   npx playwright show-trace test-results/*/trace.zip
   ```
   操作のタイムライン、スクリーンショット、ネットワーク、コンソールログを事後分析。

4. **問題が特定できたら**: ソースコードを修正して再検証

5. **スクリーンショット取得**:
   ```bash
   npx playwright screenshot http://localhost:8081{target-path} evidence.png
   ```

## エージェント

`browser-debugger` エージェントを使用してデバッグを実行します。

対象: $ARGUMENTS
