import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('ルートページが読み込まれる', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    // ページが何かしらのコンテンツを持つことを確認
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
