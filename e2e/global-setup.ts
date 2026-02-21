import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';

const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

/**
 * Global setup for Playwright E2E tests.
 * Logs in as the dev user via the app's devLogin flow and saves storageState
 * so that subsequent tests can reuse the authenticated session.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:8081';

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // Wait for the app to be interactive
    await page.waitForTimeout(3000);

    // The devLogin button is only visible in __DEV__ mode.
    // Look for a dev login trigger (button or text).
    const devLoginButton = page.getByText(/dev.*login|テスト.*ログイン/i).first();

    if (await devLoginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await devLoginButton.click();
      // Wait for authentication to complete and navigation to happen
      await page.waitForTimeout(5000);
    }

    // Save storage state for session reuse
    await context.storageState({ path: STORAGE_STATE_PATH });
  } finally {
    await browser.close();
  }
}

export default globalSetup;
export { STORAGE_STATE_PATH };
