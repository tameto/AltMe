# Auth Implementation Review — 2026-02-21

## レビュー設定
- モデル: gpt-5.3-codex
- 方式: codex exec (focus review) + Claude 自己検証
- 対象: 認証フロー (Apple/Google Sign-In、アカウント削除、auth store)
- 対象ファイル: 6ファイル

---

## Critical（必ず修正）

### C-1: Apple nonce が暗号学的に弱い
- **ファイル**: `src/services/supabase/auth.ts:19`
- **問題**: `Math.random()` はCSPRNG（暗号学的疑似乱数生成器）ではない。nonce の衝突耐性が低く、リプレイ攻撃耐性の前提を破る。
- **修正**:
```ts
const bytes = await Crypto.getRandomBytesAsync(32);
const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const hashedNonce = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  nonce,
);
```

### C-2: 型定義と実行時ガード集合の不一致（型安全性破綻）
- **ファイル**: `src/services/supabase/auth.ts:198-204` vs `src/shared/types/user.ts:34,67`
- **問題**:
  - `AVATAR_ICONS` に `'techno'` が含まれるが TypeScript 型 `AvatarIcon` は `'tech'`（`'techno'` は存在しない）
  - `SPEECH_TONES` に `'casual'` が含まれるが TypeScript 型 `SpeechTone` に `'casual'` は存在しない
  - 型ガード `isAvatarIcon` / `isSpeechTone` は型的に偽陽性を起こし、`as` キャストで型安全性が崩壊している
- **修正**: `AVATAR_ICONS` と `SPEECH_TONES` を型から導出し、旧値のマイグレーションマップを追加:
```ts
import type { AvatarIcon, SpeechTone } from '@/src/shared/types/user';

const AVATAR_ICONS: readonly AvatarIcon[] = [
  'default', 'geometric', 'cosmic', 'organic', 'tech', 'zen',
  'robot', 'cat', 'bunny', 'star', 'owl', 'fox', 'penguin', 'bear', 'dragon', 'unicorn',
  'panda', 'dolphin', 'phoenix', 'deer', 'koala', 'wolf', 'hamster', 'butterfly',
  'jellyfish', 'mushroom', 'crystal', 'cloud', 'moon', 'octopus', 'flower', 'ghost',
  'slime', 'sakura', 'flame', 'alien',
];
const SPEECH_TONES: readonly SpeechTone[] = ['polite', 'friendly', 'intellectual', 'mentor', 'tsundere'];

// マイグレーションマップ（旧DB値 → 新型値）
const AVATAR_MIGRATION: Record<string, AvatarIcon> = { techno: 'tech' };
const TONE_MIGRATION: Record<string, SpeechTone> = { casual: 'friendly' };

// mapDbProfile 内で使用
const rawAvatar = asStr(data.avatar_icon);
const avatarIcon: AvatarIcon = rawAvatar
  ? AVATAR_MIGRATION[rawAvatar] ?? ((AVATAR_ICONS as readonly string[]).includes(rawAvatar) ? rawAvatar as AvatarIcon : 'default')
  : 'default';

const rawTone = asStr(data.speech_tone);
const speechTone: SpeechTone = rawTone
  ? TONE_MIGRATION[rawTone] ?? ((SPEECH_TONES as readonly string[]).includes(rawTone) ? rawTone as SpeechTone : 'friendly')
  : 'friendly';
```

### C-3: アカウント削除後にローカルセッションが残存
- **ファイル**: `src/services/supabase/auth.ts:149-158`
- **問題**: Edge Function 呼び出し成功後に `supabase.auth.signOut()` と `logOutRevenueCat()` が呼ばれない。SecureStore に無効なトークンが残り、次回起動時にゾンビセッションが発生する。
- **修正**:
```ts
export const deleteAccount = async (): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const { error } = await supabase.functions.invoke('delete-account', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw error;

  // セッションとRevenueCat状態を確実にクリア
  await Promise.allSettled([
    supabase.auth.signOut({ scope: 'local' }),
    logOutRevenueCat(),
  ]);
};
```

---

## Warning（修正推奨）

### W-1: onAuthStateChange サブスクリプションのリーク
- **ファイル**: `src/features/auth/stores/auth-store.ts:78`
- **問題**: `onAuthStateChange` の戻り値（`{ data: { subscription } }`）を保持せず、`subscription.unsubscribe()` が呼ばれない。`initialize()` を複数回呼ぶと（Fast Refresh 含む）リスナーが累積する。
- **修正**:
```ts
// モジュールスコープ
let authUnsubscribe: (() => void) | null = null;

// initialize 内
authUnsubscribe?.();
const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    useUser.getState().reset();
    useSubscription.getState().reset();
    set({ isAuthenticated: false });
  }
});
authUnsubscribe = () => subscription.unsubscribe();
```

### W-2: RevenueCat CustomerInfo リスナーの重複登録
- **ファイル**: `src/features/auth/stores/auth-store.ts:63, 101, 133`
- **問題**: `addCustomerInfoListener` を initialize・signInWithApple・signInWithGoogle の3か所で登録しているが、戻り値の unsubscribe 関数を一切保存していない。毎回のサインインでリスナーが追加され、重複通知とメモリリークが発生する。
- **修正**:
```ts
// モジュールスコープ
let rcUnsubscribe: (() => void) | null = null;

const bindRcListener = () => {
  rcUnsubscribe?.(); // 既存リスナーを解除してから再登録
  rcUnsubscribe = addCustomerInfoListener((info) => {
    useSubscription.getState().setEntitlement(info);
  });
};

// initialize / signIn* の各箇所で addCustomerInfoListener(...) の代わりに bindRcListener() を呼ぶ
```

### W-3: signInWithApple / signInWithGoogle が isLoading を更新しない（競合状態）
- **ファイル**: `src/features/auth/stores/auth-store.ts:91-153`
- **問題**: ストアの `isLoading` フラグがサインイン中に更新されないため、並行呼び出し時に排他制御がない。ログイン画面は `isSigningIn` ローカル state で防いでいるが、`settings.tsx` や `guest-prompt-overlay.tsx` からも呼ばれており、それらには排他がない。
- **修正**:
```ts
signInWithApple: async () => {
  if (get().isLoading) return; // 早期リターンで並行防止
  set({ isLoading: true, error: null });
  try {
    const profile = await authSignInWithApple();
    // ...
    set({ isAuthenticated: true, isGuest: false });
  } catch (error: unknown) {
    // キャンセル判定はそのまま
    // ...
  } finally {
    set({ isLoading: false });
  }
},
```

### W-4: SecureStore に対するエラーハンドリングがない
- **ファイル**: `src/services/supabase/client.ts:14-19`
- **問題**: expo-secure-store は iOS で値のサイズが大きい場合（Supabase セッション JSON が複数トークンを含む場合など）に書き込みエラーを起こすことがある。現在は例外がそのまま throw されるが、呼び出し元での対処が想定されていない。
- **修正**（最小限のエラーログ追加）:
```ts
setItem: async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.error(`SecureStore.setItem failed for key="${key}" (length=${value.length}):`, e);
    throw e;
  }
},
```

---

## Info（検討事項）

### I-1: RevenueCat DELETE API の userId が URL エンコードされていない
- **ファイル**: `supabase/functions/delete-account/index.ts:68`
- **問題**: `userId` は Supabase UUID（`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）なので実害はないが、ベストプラクティスとして `encodeURIComponent(userId)` を使うべき。
- **修正**: `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`

### I-2: OpenClaw/RevenueCat 失敗時でもアカウント削除が続行する
- **ファイル**: `supabase/functions/delete-account/index.ts:30-89`
- **問題**: コメントに「failure doesn't block」と明記されており意図的な設計。ただし RevenueCat 削除失敗（例: 有効なサブスクリプション中）のままアカウントを削除すると課金情報が孤立するリスクがある。
- **提案**: 少なくとも RevenueCat が `failed` の場合はアカウント削除を中断する（OpenClaw は非課金インフラなので継続は許容）:
```ts
if (steps.revenuecat === 'failed') {
  return new Response(
    JSON.stringify({ error: 'revenuecat_cleanup_failed', steps }),
    { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}
```

### I-3: Terms / Privacy が非タップのプレーンテキスト
- **ファイル**: `app/(auth)/login.tsx:117-120, 191-194`
- **問題**: 利用規約・プライバシーポリシーへのリンクがない。App Store 審査ガイドライン 5.1.1 で必須とされる場合がある。
- **修正**: `Linking.openURL(TERMS_URL)` / `Linking.openURL(PRIVACY_URL)` を持つ `Pressable` に変更。

### I-4: Apple ボタンの公式 UI コンポーネント未使用
- **ファイル**: `app/(auth)/login.tsx:141-159`
- **問題**: Apple Sign-In の HIG では `AppleAuthentication.AppleAuthenticationButton` の使用を推奨している。現在は `Pressable` + `FontAwesome` アイコンで独自実装。App Store 審査で指摘される可能性がある。
- **修正**:
```tsx
<AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
  cornerRadius={14}
  style={{ width: '100%', height: 54 }}
  onPress={handleAppleSignIn}
/>
```

### I-5: RevenueCat API バージョンのハードコード
- **ファイル**: `supabase/functions/delete-account/index.ts:68`
- **問題**: `v1` がハードコードされており、API バージョン変更時の対応が困難。
- **修正**: `REVENUECAT_API_VERSION` 環境変数で切り替え可能にする。

---

## 統計
- 総指摘数: 11件（検証済み）
- 除外数: 0件（hallucination なし）
- Critical: 3件 / Warning: 4件 / Info: 5件（I-4はI-4/I-5に分割）

---

## 補足（Claude による追加観察）

Codex の全指摘は実コードで検証済み。いずれも hallucination なし。

**最優先対応**: C-1（nonce 強度）と C-2（型定義不一致）は既存ユーザーにも影響するため即時修正を推奨。C-3（削除後セッション残存）は再現条件が限定的だが、次回起動時にクラッシュする可能性がある。

**W-1 / W-2**: Expo Go の Fast Refresh 環境でリスナーが累積するため、開発中も問題が顕在化しやすい。
