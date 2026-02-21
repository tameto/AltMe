# Codex Review: 20260220-remaining-features

**日時**: 2026-02-20
**モデル**: gpt-5.3-codex
**方式**: codex exec (focus x3 並列) + 自己検証
**対象**: Feature 1-5（デッドコード削除、Twin実データ、Community, Analytics, Feature extraction）

## レビュー結果

### Critical（必ず修正）

**[C1] SSE二重メッセージ防止ロジックが不安定**
- `src/features/chat/hooks/use-chat.ts:326-353`
- `isComplete`受信済みフラグを持たず`prev.find(m => m.content === fullResponse)`でガードしているため、
  履歴に同文のメッセージが存在するケースで正当な新規返信が消える
- 修正: `finalized`フラグで制御

```ts
let fullResponse = '';
let finalized = false;

const finalize = () => {
  if (finalized || !fullResponse) return;
  finalized = true;
  setMessages((prev) => [...prev, {
    id: `ai-${Date.now()}`,
    role: 'assistant',
    content: fullResponse,
    createdAt: new Date().toISOString(),
  }]);
  setStreamingText('');
};

// parsed.isComplete時
if (parsed.isComplete) finalize();

// whileループ後（isCompleteなし終端）
finalize();
```

**[C2] WebSocket onError / onStatusChange で isLoading がクリアされない**
- `src/features/chat/hooks/use-chat.ts:186-197`
- WebSocket送信中（isLoading=true）にエラーや切断が発生した場合、onTextDoneが呼ばれず
  UIがローディング状態で永続的にスタックする
- 修正:

```ts
onError: (code, message) => {
  console.error(`OpenClaw error: ${code} - ${message}`);
  setIsLoading(false);        // 追加
  setStreamingText('');       // 追加
  streamingTextRef.current = ''; // 追加
  if (code === 'AUTH_FAILED') {
    updateConnectionMode('edge_function');
  }
},
onStatusChange: (status) => {
  setWsStatus(status);
  if (status === 'disconnected' && !cancelled.current) {
    updateConnectionMode('edge_function');
    setIsLoading(false);        // 追加
    setStreamingText('');       // 追加
    streamingTextRef.current = ''; // 追加
  }
},
```

### Warning（修正推奨）

**[W1] PostHog 初期化の冪等性が jest.resetModules() と整合していない**
- `src/services/analytics/tracker.ts:71`
- `trackEvent`が`posthogClient`（モジュールスコープ変数）を最優先するため、
  `jest.resetModules()`後にSDK側の`__posthogInstance`がリセットされても
  古い`posthogClient`を参照し続ける
- また、サードパーティモジュールへの`__posthogInstance`追加はSDKがfreeze/Proxy化した場合に壊れる
- 推奨: `globalThis`シングルトンに変更

```ts
const POSTHOG_KEY = '__altme_posthog_client__';

function getStore(): { client: any | null } {
  const g = globalThis as any;
  g[POSTHOG_KEY] ??= { client: null };
  return g[POSTHOG_KEY];
}

export function initializeAnalytics(): void {
  const store = getStore();
  if (store.client) return;
  const { PostHog } = require('posthog-react-native') as any;
  store.client = new PostHog(env.posthogApiKey, { host: 'https://us.i.posthog.com' });
}

export function trackEvent(event: AnalyticsEvent): void {
  if (__DEV__) console.log(`[Analytics] ${event.name}`, event.properties ?? {});
  getStore().client?.capture(event.name, event.properties ?? {});
}
```

**[W2] WebSocket接続中に subscribeToInstanceChanges が重複接続を起こし得る**
- `src/features/chat/hooks/use-chat.ts:223`
- `connectionModeRef.current`は`onConnected`まで`edge_function`のままなので、
  接続処理中に`running`更新が来ると`connectToWebSocket`が重複実行される
- 修正: `wsConnectingRef`フラグを追加

```ts
const wsConnectingRef = useRef(false);

const connectToWebSocket = useCallback(async (cancelled: { current: boolean }) => {
  if (wsConnectingRef.current || connectionModeRef.current === 'websocket') return;
  wsConnectingRef.current = true;
  try {
    // 既存処理...
  } finally {
    wsConnectingRef.current = false;
  }
}, [updateConnectionMode]);
```

**[W3] useTwinData の useEffect に cancelled フラグがない**
- `src/features/insights/hooks/use-twin-data.ts:49`
- unmount後やユーザー切替後に`setIsLoading(false)` / `setHasData` / `setError`が
  走り、古い結果で状態が上書きされる
- 修正: cancelledフラグを追加し、await後にチェック

```ts
useEffect(() => {
  let cancelled = false;
  // ... 既存fetchPersonalityResults ...
  // await後に cancelled チェックを追加
  if (cancelled) return;
  setIsLoading(false);
  // ...
  return () => { cancelled = true; };
}, [user?.id]);
```

### Info（検討事項）

**[I1] trackEvent の properties に PII/機密情報が混入するリスク**
- `src/services/analytics/tracker.ts:65-75`
- `trackPurchaseFailed(error: string)` で生エラー文字列をそのままPostHogに送信している
- 改善: イベントごとに許可キーのみフィルタリング、文字列長制限

**[I2] community service が boolean を返すことで失敗の種類を区別できない**
- `src/services/community/client.ts:126,142`
- 重複参加・未認証・ネットワーク失敗を区別できずUXエラーメッセージの出し分けが困難
- 改善: `Result<T, CommunityError>` 型への変更（後方互換のため段階的に対応可）

## 統計

- 総指摘数: 7件（検証済み）
- 除外数: 1件（community user?.id undefined — 既にガード実装済みと確認）
- Critical: 2件 / Warning: 3件 / Info: 2件

## アーキテクチャ相談サマリ

- WebSocket→Edge Functionフォールバックの `connectionModeRef + connectionMode` 二重管理は妥当な実装
- PostHog `require()` + module拡張は意図は成立しているが設計としてはハック寄り（globalThis推奨）
- Community毎回 `getUser()` は安全側の設計として妥当だが、boolean返却は将来の拡張で制約になる
- 両モデルが一致した高優先度指摘: WebSocket切断時のisLoading詰まり防止
