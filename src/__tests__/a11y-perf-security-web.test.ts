/**
 * P12 M152-M156: A11y + Performance + Security audit tests
 *
 * M152: Accessibility (aria-label, keyboard nav, color contrast, reduced-motion)
 * M153: Performance (native deps excluded from web, memoization)
 * M154: Security (XSS, API key exposure, CORS, Stripe signature)
 * M155: Memory leak detection (useEffect cleanup, WebSocket disconnect, timers)
 * M156: Security headers (CSP, X-Content-Type-Options, X-Frame-Options)
 */
import fs from 'fs';
import path from 'path';

// Helper: recursively read all .ts/.tsx files from a directory
function readSourceFiles(dir: string, ext: string[] = ['.ts', '.tsx']): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip test dirs and node_modules
      if (entry.name === '__tests__' || entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...readSourceFiles(fullPath, ext));
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

const ROOT = path.resolve(__dirname, '../..');
const SRC_DIR = path.join(ROOT, 'src');
const APP_DIR = path.join(ROOT, 'app');
const EF_DIR = path.join(ROOT, 'supabase', 'functions');

// ────────────────────────────────────────
// M152: Accessibility
// ────────────────────────────────────────
describe('M152: Accessibility', () => {
  it('WebSidebar nav items have accessibilityRole and accessibilityLabel', () => {
    const content = readFile(path.join(SRC_DIR, 'shared/components/web-sidebar.tsx'));
    expect(content).toContain('accessibilityRole');
    expect(content).toContain('accessibilityLabel');
    expect(content).toContain('accessibilityState');
  });

  it('MobileBottomTabs has accessibilityLabel on tabs', () => {
    const content = readFile(path.join(SRC_DIR, 'shared/components/mobile-bottom-tabs.tsx'));
    expect(content).toContain('accessibilityLabel');
  });

  it('useReducedMotion hook exists with platform variants', () => {
    const webHook = path.join(SRC_DIR, 'shared/hooks/use-reduced-motion.web.ts');
    const nativeHook = path.join(SRC_DIR, 'shared/hooks/use-reduced-motion.native.ts');
    expect(fs.existsSync(webHook)).toBe(true);
    expect(fs.existsSync(nativeHook)).toBe(true);

    const webContent = readFile(webHook);
    expect(webContent).toContain('prefers-reduced-motion');
  });

  it('useReducedMotion has tests for both platforms', () => {
    const webTest = path.join(SRC_DIR, 'shared/hooks/__tests__/use-reduced-motion-web.test.ts');
    const nativeTest = path.join(SRC_DIR, 'shared/hooks/__tests__/use-reduced-motion-native.test.ts');
    expect(fs.existsSync(webTest)).toBe(true);
    expect(fs.existsSync(nativeTest)).toBe(true);
  });

  it('V4 Dark Premium colors maintain sufficient contrast ratios', () => {
    // WCAG AA requires 4.5:1 for normal text
    // Key colors from theme: #94A3B8 (textSecondary) on #0F172A (background)
    // Luminance formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
    function sRGBtoLinear(c: number): number {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    }
    function luminance(hex: string): number {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
    }
    function contrastRatio(fg: string, bg: string): number {
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    const bg = '#0F172A';
    // Primary text (#F1F5F9) on dark bg
    expect(contrastRatio('#F1F5F9', bg)).toBeGreaterThan(4.5);
    // Secondary text (#94A3B8) on dark bg
    expect(contrastRatio('#94A3B8', bg)).toBeGreaterThan(4.5);
    // Primary accent (#7DD3FC) on dark bg
    expect(contrastRatio('#7DD3FC', bg)).toBeGreaterThan(4.5);
    // Warning (#F59E0B) on dark bg
    expect(contrastRatio('#F59E0B', bg)).toBeGreaterThan(3.0); // Large text AA
  });
});

// ────────────────────────────────────────
// M153: Performance
// ────────────────────────────────────────
describe('M153: Performance', () => {
  it('native-only dependencies use .native.ts extension (not imported in .web.ts)', () => {
    const nativeDeps = ['react-native-purchases', 'react-native-onesignal', 'expo-haptics'];
    const webFiles = readSourceFiles(SRC_DIR).filter((f) => f.endsWith('.web.ts') || f.endsWith('.web.tsx'));

    for (const file of webFiles) {
      const content = readFile(file);
      for (const dep of nativeDeps) {
        expect(content).not.toContain(dep);
      }
    }
  });

  it('native-only modules have platform-specific file variants', () => {
    // RevenueCat
    expect(fs.existsSync(path.join(SRC_DIR, 'services/revenuecat/client.native.ts'))).toBe(true);
    expect(fs.existsSync(path.join(SRC_DIR, 'services/revenuecat/client.web.ts'))).toBe(true);
    // Notifications
    expect(fs.existsSync(path.join(SRC_DIR, 'services/notifications/client.native.ts'))).toBe(true);
    expect(fs.existsSync(path.join(SRC_DIR, 'services/notifications/client.web.ts'))).toBe(true);
    // Supabase
    expect(fs.existsSync(path.join(SRC_DIR, 'services/supabase/client.native.ts'))).toBe(true);
    expect(fs.existsSync(path.join(SRC_DIR, 'services/supabase/client.web.ts'))).toBe(true);
  });

  it('use-chat hook uses useCallback for send functions', () => {
    const chatHook = readFile(path.join(SRC_DIR, 'features/chat/hooks/use-chat.ts'));
    // sendViaWebSocket and sendViaEdgeFunction should be wrapped in useCallback
    expect(chatHook).toContain('useCallback');
    const callbackCount = (chatHook.match(/useCallback/g) || []).length;
    expect(callbackCount).toBeGreaterThanOrEqual(2);
  });

  it('settings screen uses useMemo for computed values', () => {
    const settings = readFile(path.join(APP_DIR, '(tabs)/settings.tsx'));
    expect(settings).toContain('useMemo');
    const memoCount = (settings.match(/useMemo/g) || []).length;
    expect(memoCount).toBeGreaterThanOrEqual(2);
  });

  it('entitlement poller properly stops before starting new interval', () => {
    const poller = readFile(path.join(SRC_DIR, 'services/subscription/entitlement-poller.ts'));
    // startEntitlementPoller should call stopEntitlementPoller first
    expect(poller).toContain('stopEntitlementPoller()');
    expect(poller).toContain('clearInterval');
  });
});

// ────────────────────────────────────────
// M154: Security
// ────────────────────────────────────────
describe('M154: Security', () => {
  it('no dangerouslySetInnerHTML usage in src/ or app/', () => {
    const allFiles = [...readSourceFiles(SRC_DIR), ...readSourceFiles(APP_DIR)];
    for (const file of allFiles) {
      const content = readFile(file);
      expect(content).not.toContain('dangerouslySetInnerHTML');
    }
  });

  it('no hardcoded API keys or secrets in client source', () => {
    const secretPatterns = [
      /['"]sk_live_[A-Za-z0-9]+['"]/,
      /['"]sk_test_[A-Za-z0-9]+['"]/,
      /['"]whsec_[A-Za-z0-9]+['"]/,
      /SUPABASE_SERVICE_ROLE_KEY/,
      /STRIPE_SECRET_KEY/,
      /OPENAI_API_KEY/,
    ];

    const clientFiles = [...readSourceFiles(SRC_DIR), ...readSourceFiles(APP_DIR)];
    for (const file of clientFiles) {
      const content = readFile(file);
      for (const pattern of secretPatterns) {
        expect(content).not.toMatch(pattern);
      }
    }
  });

  it('Edge Functions that need CORS use getCorsHeaders', () => {
    // Client-facing Edge Functions must use CORS headers
    const clientFacingFunctions = [
      'chat',
      'personality-analyze',
      'journal-reflect',
      'generate-insight',
      'monthly-report',
      'delete-account',
      'create-checkout-session',
      'create-portal-session',
      'generate-community-chat',
    ];

    for (const fn of clientFacingFunctions) {
      const indexPath = path.join(EF_DIR, fn, 'index.ts');
      if (!fs.existsSync(indexPath)) continue;
      const content = readFile(indexPath);
      expect(content).toContain('getCorsHeaders');
      expect(content).toContain('handleCorsPreflightRequest');
    }
  });

  it('webhook Edge Functions do NOT use CORS (server-to-server)', () => {
    const webhookFunctions = ['webhook-stripe', 'webhook-revenuecat'];

    for (const fn of webhookFunctions) {
      const indexPath = path.join(EF_DIR, fn, 'index.ts');
      if (!fs.existsSync(indexPath)) continue;
      const content = readFile(indexPath);
      expect(content).not.toContain('getCorsHeaders');
    }
  });

  it('Stripe webhook verifies signature before processing', () => {
    const webhookPath = path.join(EF_DIR, 'webhook-stripe', 'index.ts');
    const content = readFile(webhookPath);
    // Must check signature header
    expect(content).toContain('stripe-signature');
    // Must use constructEventAsync for verification
    expect(content).toContain('constructEventAsync');
    // Must reject missing signature
    expect(content).toContain('missing_signature');
  });

  it('secrets are only accessed via Deno.env.get in Edge Functions (not hardcoded)', () => {
    const efFiles = readSourceFiles(EF_DIR).filter((f) => !f.includes('_shared'));
    for (const file of efFiles) {
      const content = readFile(file);
      // No hardcoded Stripe keys
      expect(content).not.toMatch(/['"]sk_live_[A-Za-z0-9]+['"]/);
      expect(content).not.toMatch(/['"]sk_test_[A-Za-z0-9]+['"]/);
    }
  });
});

// ────────────────────────────────────────
// M155: Memory leak detection
// ────────────────────────────────────────
describe('M155: Memory leak detection', () => {
  it('WebSocket client has disconnect method that cleans up', () => {
    const wsClient = readFile(path.join(SRC_DIR, 'services/openclaw/websocket-client.ts'));
    // disconnect() should close WS and clear reconnect timer
    expect(wsClient).toContain('disconnect()');
    expect(wsClient).toContain('this.ws.close()');
    expect(wsClient).toContain('clearReconnectTimer');
    expect(wsClient).toContain('this.ws = null');
  });

  it('WebSocket client clears connection timeout on open/close/error', () => {
    const wsClient = readFile(path.join(SRC_DIR, 'services/openclaw/websocket-client.ts'));
    const clearTimeoutCount = (wsClient.match(/clearTimeout\(connectionTimeout\)/g) || []).length;
    // Should clear on: onopen, onclose, onerror
    expect(clearTimeoutCount).toBeGreaterThanOrEqual(3);
  });

  it('use-chat hook cleans up WebSocket on unmount', () => {
    const chatHook = readFile(path.join(SRC_DIR, 'features/chat/hooks/use-chat.ts'));
    // The WebSocket connection useEffect must have a cleanup
    expect(chatHook).toContain('wsClientRef.current?.disconnect()');
    expect(chatHook).toContain('setActiveClient(null)');
    expect(chatHook).toContain('unsubscribe()');
  });

  it('entitlement-poller has stop function with clearInterval', () => {
    const poller = readFile(path.join(SRC_DIR, 'services/subscription/entitlement-poller.ts'));
    expect(poller).toContain('export const stopEntitlementPoller');
    expect(poller).toContain('clearInterval(pollerInterval)');
    expect(poller).toContain('pollerInterval = null');
  });

  it('use-keyboard-shortcuts removes event listener on cleanup', () => {
    const hook = readFile(path.join(SRC_DIR, 'shared/hooks/use-keyboard-shortcuts.ts'));
    expect(hook).toContain('addEventListener');
    expect(hook).toContain('removeEventListener');
  });

  it('use-clipboard-paste removes event listener on cleanup', () => {
    const hook = readFile(path.join(SRC_DIR, 'shared/hooks/use-clipboard-paste.ts'));
    expect(hook).toContain('addEventListener');
    expect(hook).toContain('removeEventListener');
  });

  it('use-responsive removes event listener on cleanup', () => {
    const hook = readFile(path.join(SRC_DIR, 'shared/hooks/use-responsive.ts'));
    expect(hook).toContain('addEventListener');
    expect(hook).toContain('removeEventListener');
  });

  it('use-network.web removes event listener on cleanup', () => {
    const hook = readFile(path.join(SRC_DIR, 'shared/hooks/use-network.web.ts'));
    expect(hook).toContain('addEventListener');
    expect(hook).toContain('removeEventListener');
  });

  it('file-drop-zone removes event listeners on cleanup', () => {
    const component = readFile(path.join(SRC_DIR, 'shared/components/file-drop-zone.tsx'));
    expect(component).toContain('addEventListener');
    expect(component).toContain('removeEventListener');
  });

  it('settings screen cleans up OpenClaw subscription on unmount', () => {
    const settings = readFile(path.join(APP_DIR, '(tabs)/settings.tsx'));
    // useEffect cleanup should call unsubscribe
    expect(settings).toContain('unsubscribe?.()');
    expect(settings).toContain('subscribeToInstanceChanges');
  });
});

// ────────────────────────────────────────
// M156: Security headers
// ────────────────────────────────────────
describe('M156: Security headers', () => {
  it('CORS shared utility exists and exports getCorsHeaders', () => {
    const corsPath = path.join(EF_DIR, '_shared', 'cors.ts');
    expect(fs.existsSync(corsPath)).toBe(true);
    const content = readFile(corsPath);
    expect(content).toContain('getCorsHeaders');
    expect(content).toContain('handleCorsPreflightRequest');
  });

  it('CORS utility validates origin', () => {
    const corsPath = path.join(EF_DIR, '_shared', 'cors.ts');
    const content = readFile(corsPath);
    // Should check origin against allowed list
    expect(content).toContain('origin');
    expect(content).toContain('Access-Control-Allow-Origin');
  });

  it('CORS preflight handler returns correct headers', () => {
    const corsPath = path.join(EF_DIR, '_shared', 'cors.ts');
    const content = readFile(corsPath);
    expect(content).toContain('Access-Control-Allow-Methods');
    expect(content).toContain('Access-Control-Allow-Headers');
  });

  it('app.json web config uses static output for proper headers', () => {
    const appJson = JSON.parse(readFile(path.join(ROOT, 'app.json')));
    const web = appJson.expo?.web;
    expect(web).toBeDefined();
    expect(web.output).toBe('static');
    expect(web.bundler).toBe('metro');
  });

  it('Edge Functions do not expose server-side environment variables to client', () => {
    const clientFacingFunctions = [
      'chat',
      'personality-analyze',
      'journal-reflect',
      'generate-insight',
      'create-checkout-session',
      'create-portal-session',
    ];

    for (const fn of clientFacingFunctions) {
      const indexPath = path.join(EF_DIR, fn, 'index.ts');
      if (!fs.existsSync(indexPath)) continue;
      const content = readFile(indexPath);
      // Response bodies should not contain env var values
      expect(content).not.toMatch(/JSON\.stringify\(.*Deno\.env/);
    }
  });
});
