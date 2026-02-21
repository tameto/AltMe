import { test, expect } from '@playwright/test';
import { navigateToTab } from './helpers/navigation';

/**
 * P3-prep E2E テスト: 404ページ + Deep Linking + ブラウザナビゲーション
 * devLogin 認証済み状態（global-setup.ts の storageState）を前提とする。
 *
 * Expo Router の Web ルート:
 *   / → (tabs)/index (チャット)
 *   /community → (tabs)/community
 *   /twin → (tabs)/twin
 *   /settings → (tabs)/settings
 *
 * +not-found.tsx の表示テキスト:
 *   タイトル: 「ページが見つかりません」
 *   リンク: 「ホームに戻る」 → href="/"
 */

// -------------------------------------------------------
// 404 Page
// -------------------------------------------------------
test.describe('404 Page', () => {
  test('shows not-found page for invalid URL', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    // +not-found.tsx の「ページが見つかりません」が表示されることを確認
    await expect(
      page.getByText('ページが見つかりません'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows not-found page for deeply nested invalid URL', async ({ page }) => {
    await page.goto('/some/deeply/nested/nonexistent/path');
    await expect(
      page.getByText('ページが見つかりません'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('can navigate home from 404 page', async ({ page }) => {
    await page.goto('/invalid-route');
    // 「ホームに戻る」リンクが表示される
    const homeLink = page.getByText('ホームに戻る');
    await expect(homeLink).toBeVisible({ timeout: 10000 });
    // クリックしてルートに遷移
    await homeLink.click();
    await expect(page).toHaveURL(/\/$/);
  });
});

// -------------------------------------------------------
// Deep Linking
// -------------------------------------------------------
test.describe('Deep Linking', () => {
  const routes = [
    { path: '/', label: 'ホーム' },
    { path: '/community', label: 'コミュニティ' },
    { path: '/twin', label: 'ツイン' },
    { path: '/settings', label: '設定' },
  ];

  for (const { path, label } of routes) {
    test(`direct access to ${path} works (${label})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page).toHaveURL(new RegExp(path === '/' ? '/$' : path));
    });
  }

  for (const { path, label } of routes) {
    test(`page reload preserves ${path} route (${label})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('body')).not.toBeEmpty();

      await page.reload();

      await expect(page).toHaveURL(new RegExp(path === '/' ? '/$' : path));
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }
});

// -------------------------------------------------------
// Browser Navigation
// -------------------------------------------------------
test.describe('Browser Navigation', () => {
  test('back button navigates to previous page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/community');
    await expect(page).toHaveURL(/\/community/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  });

  test('forward button navigates back to original page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);

    await page.goForward();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('back/forward buttons navigate correctly through multiple pages', async ({ page }) => {
    await page.goto('/');
    await page.goto('/community');
    await page.goto('/twin');
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);

    await page.goBack();
    await expect(page).toHaveURL(/\/twin/);

    await page.goBack();
    await expect(page).toHaveURL(/\/community/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);

    // forward で順に進む
    await page.goForward();
    await expect(page).toHaveURL(/\/community/);

    await page.goForward();
    await expect(page).toHaveURL(/\/twin/);
  });

  test('tab navigation updates URL and supports back/forward', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    await navigateToTab(page, 'コミュニティ');
    await expect(page).toHaveURL(/\/community/);

    await navigateToTab(page, 'ツイン');
    await expect(page).toHaveURL(/\/twin/);

    await page.goBack();
    await expect(page).toHaveURL(/\/community/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  });
});
