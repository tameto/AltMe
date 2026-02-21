# Codex Review: feat/web-support (2026-02-21)

## レビュー設定
- モデル: gpt-5.3-codex
- 方式: codex exec (focused, with context)
- 対象: 11 new files, 2 modified files (platform split for web)

## 変更概要
- supabase/client, auth, revenuecat/client, notifications/client, analytics/tracker を
  `.native.ts` / `.web.ts` に分割
- barrel ファイル (.ts) は TypeScript 解決用のみ (Metro が .native/.web を優先選択)
- auth-store.ts: GoogleStatusCodes import 削除、キャンセル判定をハードコード文字列に変更
- notification-settings.tsx: Linking.openSettings() を Platform.OS !== 'web' でガード

---

## Critical（必ず修正）

### [src/services/supabase/auth.web.ts:18-36 / :43-62] OAuth redirect 直後の getSession() が必ず失敗する

**問題**: `signInWithOAuth()` は即時ブラウザリダイレクトを開始する。
その直後に `supabase.auth.getSession()` を呼んでもセッションは未確立のため
`session === null` となり、常に "no session after redirect" エラーが発生する。

これは Apple / Google の両メソッド同様。

**修正案**: `auth.web.ts` の責務を「リダイレクト開始のみ」に限定し、
認証完了後の profile 取得は `onAuthStateChange('SIGNED_IN')` に委譲する。

```ts
// src/services/supabase/auth.web.ts
export const signInWithGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
  // リダイレクト開始。セッション確立後の処理は onAuthStateChange で行う
};

export const signInWithApple = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
};
```

```ts
// src/services/supabase/auth.ts (barrel) — 戻り型を変更
export { signInWithApple, signInWithGoogle, ... } from './auth.native'; // native: UserProfile
// web では void を返す — auth-store 側で型分岐が必要
```

**auth-store.ts での対応**:
```ts
// initialize() の onAuthStateChange に SIGNED_IN ハンドラを追加
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const profile = await getCurrentProfile(session.user.id);
    if (profile) {
      useUser.getState().setUser(profile);
      await identifyUser(session.user.id);
      const entitlement = await checkSubscriptionStatus();
      useSubscription.getState().setEntitlement(entitlement);
      useSubscription.getState().setLoading(false);
      bindRcListener();
      set({ isAuthenticated: true, isLoading: false });
    }
  }
  if (event === 'SIGNED_OUT') {
    useUser.getState().reset();
    useSubscription.getState().reset();
    set({ isAuthenticated: false });
  }
});
```

---

## Warning（修正推奨）

### [src/features/auth/stores/auth-store.ts:159] Google cancellation: '12501' ハードコードと型ミスマッチ

**問題**:
1. `@react-native-google-signin/google-signin` v16.x の `GoogleSignin.signIn()` は
   エラーを throw しない。キャンセル時は `{ type: 'cancelled', data: null }` を返す。
2. `auth.native.ts:77` では `signInResult.data?.idToken` のみチェックしており、
   `signInResult.type === 'cancelled'` を見ていない。
3. 結果としてキャンセルが `'Google Sign-In failed: no ID token'` エラーとして
   auth-store に伝わる。
4. `'12501'` は古いネイティブエラーコードで、現 SDK バージョンでは到達しない可能性がある。

**修正案** (`src/services/supabase/auth.native.ts`):
```ts
export const signInWithGoogle = async (): Promise<UserProfile> => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();

  // ユーザーによるキャンセル
  if (signInResult.type === 'cancelled') {
    const err = new Error('Google sign-in cancelled');
    (err as { code?: string }).code = 'SIGN_IN_CANCELLED';
    throw err;
  }

  if (!signInResult.data?.idToken) {
    throw new Error('Google Sign-In failed: no ID token');
  }
  // ... 以下同
};
```

**auth-store.ts のキャンセル判定** (併せて整理):
```ts
const code = (error as { code?: string }).code ?? '';
if (code === 'SIGN_IN_CANCELLED') return; // '12501' は不要
```

---

## 確認済み（問題なし）

| 観点 | 判定 | 根拠 |
|------|------|------|
| Platform file splitting | OK | app.json `web.bundler=metro` + 実 dist bundle で client.web.ts が採用されている |
| SSR safety (client.web.ts:10) | OK | `typeof sessionStorage !== 'undefined'` はモジュール評価時も安全 |
| No-op stubs completeness | OK | 各 barrel export が web stubs に全て実装済み |
| `__DEV__` in tracker.web.ts | OK | Expo Metro web bundle の先頭で定義済み |
| use-subscription.ts の RC 型 import | OK | `import type` のみ — 実行時 bundle 混入なし |

---

## 統計
- 総指摘数: 2 件（検証済み）
- Critical: 1 件（OAuth redirect バグ — 必ず修正）
- Warning: 1 件（Google cancel detection ズレ — 修正推奨）
- 除外数: 0 件
