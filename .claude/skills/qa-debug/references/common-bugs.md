# AltMe 頻出バグパターン集

このセッションで実際に発見・修正したバグをもとに記録。

## 1. useEffect 無限ループ（CRITICAL）

**発生箇所**: `app/(tabs)/index.tsx` チャット画面
**原因**: `connectionMode` state を useEffect の deps に含み、同 effect 内で `setConnectionMode` を呼んでいた
**症状**: アプリがフリーズ、CPU 100%

**修正パターン**:
```tsx
// ref で安定化
const connectionModeRef = useRef<ConnectionMode>('edge_function');
const updateConnectionMode = useCallback((mode: ConnectionMode) => {
  connectionModeRef.current = mode;
  setConnectionMode(mode);
}, []);

// useEffect では ref を参照
useEffect(() => {
  if (connectionModeRef.current !== 'websocket') { ... }
}, [isPro, user?.id, connectToWebSocket, updateConnectionMode]);
```

## 2. Stale Closure（CRITICAL）

**発生箇所**: `app/(tabs)/index.tsx` sendViaEdgeFunction
**原因**: `messages` 配列を useCallback の deps に含めていた → messages 更新のたびに新しい関数生成
**症状**: メッセージ重複、古いメッセージ参照

**修正パターン**:
```tsx
// prev パターンで state 更新
const send = useCallback(async (content: string) => {
  setMessages(prev => [...prev, newMessage]);
  // messages を直接参照しない
}, []); // deps から messages を削除
```

## 3. UUID 形式不正（HIGH）

**発生箇所**: 開発用ダミーユーザーID
**原因**: `'dev-user-001'` は UUID 形式ではない → PostgreSQL の uuid 型カラムでエラー
**症状**: `invalid input syntax for type uuid: "dev-user-001"`

**修正**: `'00000000-0000-0000-0000-000000000001'` に変更、最終的には real Supabase auth に移行

## 4. ネイティブモジュール未インストール（HIGH）

**発生箇所**: expo-network
**原因**: npm install したが iOS Pod がビルドされていない
**症状**: `Cannot find native module 'ExpoNetwork'`

**修正**: `cd ios && pod install` → `npx expo run:ios`

## 5. devLogin の偽セッション（HIGH）

**発生箇所**: auth-store.ts devLogin
**原因**: Supabase Auth を通さず偽ユーザーオブジェクトを作成 → Edge Functions で認証チェックに失敗
**症状**: `Chat error: Not authenticated`

**修正**: `supabase.auth.signInWithPassword` / `signUp` で real session を作成

## 6. ポーリングによるパフォーマンス劣化（MEDIUM）

**発生箇所**: `src/shared/hooks/use-network.ts`
**原因**: 5秒間隔の setInterval でネットワーク状態をポーリング
**症状**: 不要な CPU 使用、バッテリー消費

**修正**: `Network.addNetworkStateListener` でイベント駆動に変更

## 7. Heredoc エスケープの過剰処理（MEDIUM）

**発生箇所**: `supabase/functions/provision-openclaw/index.ts`
**原因**: quoted heredoc `<< 'SOULEOF'` はシェル変数展開を無効にするため、`\` / `'` のエスケープが不要
**症状**: SOUL.md にバックスラッシュが残る

**修正**: エスケープ処理を削除

## 8. SSR 環境での Web API 使用（MEDIUM）

**発生箇所**: `expo start --dev-client` で Web バンドル生成時
**原因**: AsyncStorage が `window` オブジェクトを参照 → SSR 環境で `window is not defined`
**症状**: Metro ビルドクラッシュ

**回避**: `npx expo run:ios` を使用（SSR なし）

## 9. Supabase ポートコンフリクト（LOW）

**発生箇所**: supabase start
**原因**: 別プロジェクトがデフォルトポート (54322) を使用中
**症状**: `supabase start` が失敗

**修正**: config.toml で全ポートを変更（54321→54351 等）
