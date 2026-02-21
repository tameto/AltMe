import fs from 'fs';
import path from 'path';

const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

/**
 * Global teardown for Playwright E2E tests.
 * Cleans up the saved storage state file after test runs.
 */
async function globalTeardown() {
  try {
    if (fs.existsSync(STORAGE_STATE_PATH)) {
      fs.unlinkSync(STORAGE_STATE_PATH);
    }

    const authDir = path.dirname(STORAGE_STATE_PATH);
    if (fs.existsSync(authDir) && fs.readdirSync(authDir).length === 0) {
      fs.rmdirSync(authDir);
    }
  } catch {
    // Cleanup is best-effort; ignore errors
  }
}

export default globalTeardown;
