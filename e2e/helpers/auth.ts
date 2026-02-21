import { type Page } from '@playwright/test';
import path from 'path';

/** Path to the saved storageState created by global-setup */
export const STORAGE_STATE_PATH = path.join(__dirname, '..', '.auth', 'user.json');

/**
 * Login as the dev user via the UI devLogin button.
 * For most tests, prefer using storageState from globalSetup instead.
 * This helper is for tests that need a fresh login within the test itself.
 */
export const loginAsDevUser = async (page: Page): Promise<void> => {
  await page.goto('/');

  const devLoginButton = page.getByText(/dev.*login|テスト.*ログイン/i).first();
  if (await devLoginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await devLoginButton.click();
    await page.waitForTimeout(3000);
  }
};

/**
 * Login as a guest user via the UI.
 */
export const loginAsGuest = async (page: Page): Promise<void> => {
  await page.goto('/');

  const guestButton = page.getByText(/guest|ゲスト/i).first();
  if (await guestButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await guestButton.click();
    await page.waitForTimeout(3000);
  }
};
