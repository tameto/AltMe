# Auth 機能 — 実装計画（plan.md）

## 概要

Auth 機能の未実装部分を完成させる。既存コードベースを活用し、以下を追加実装する:

1. Google Sign-In を Native SDK に移行
2. ゲストブラウズモード
3. アカウント削除（Edge Function + クライアント）
4. SecureStore トークン永続化
5. フォアグラウンド復帰時トークンチェック

---

## アーキテクチャ決定

### AD-1: Google Sign-In — Native SDK

**現状**: `signInWithOAuth`（ブラウザリダイレクト方式）
**変更後**: `@react-native-google-signin/google-signin` → `signInWithIdToken`

```
[ユーザー] → Google Native UI → idToken取得
  → supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
  → セッション開始 → profile取得 → RevenueCat identify
```

**ファイル変更**:
- `src/services/supabase/auth.ts` — `signInWithGoogle` を全面書き換え
- `package.json` — `@react-native-google-signin/google-signin` 追加
- `app.json` — Google OAuth plugin 設定

### AD-2: ゲストブラウズ — 条件付きレンダリング

**方式**: 既存 `_layout.tsx` のルーティングガードを拡張。未認証時もタブ表示を許可し、各タブ内で条件分岐。

```
[未認証]
├── (tabs)/community → 通常表示（閲覧のみ）
├── (tabs)/index (Chat) → GuestPromptOverlay
├── (tabs)/twin → GuestPromptOverlay
└── (tabs)/settings → GuestSettingsScreen
```

**ファイル変更**:
- `app/_layout.tsx` — ゲストモード時もタブ表示を許可
- `src/shared/components/guest-prompt-overlay.tsx` — 新規（ログイン促進 UI）
- `app/(tabs)/index.tsx`, `app/(tabs)/twin.tsx` — ゲスト判定追加
- `app/(tabs)/settings.tsx` — ゲストモード表示分岐

### AD-3: アカウント削除 — Edge Function 順序制御

**フロー**:
```
[クライアント] → delete-account Edge Function
  1. OpenClaw削除（destroy-openclaw呼び出し、失敗しても続行）
  2. RevenueCatキャンセル（subscriber削除）
  3. auth.admin.deleteUser（CASCADE全テーブル連鎖削除）
  4. レスポンス返却
→ クライアント: ローカル状態クリア → ログイン画面
```

**ファイル変更**:
- `supabase/functions/delete-account/index.ts` — 新規 Edge Function
- `app/account-delete-confirm.tsx` — 新規モーダル画面
- `src/services/supabase/auth.ts` — `deleteAccount` 関数追加
- `src/features/auth/stores/auth-store.ts` — `deleteAccount` アクション追加

### AD-4: SecureStore トークン永続化

**方式**: Supabase JS Client のカスタム storage adapter として `expo-secure-store` を設定。

```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(URL, KEY, {
  auth: { storage: ExpoSecureStoreAdapter },
});
```

**ファイル変更**:
- `src/services/supabase/client.ts` — SecureStore adapter 追加

### AD-5: AppState フォアグラウンド復帰

**方式**: AppState リスナーでフォアグラウンド復帰時に `supabase.auth.startAutoRefresh()` / `stopAutoRefresh()` を制御。

**ファイル変更**:
- `src/services/supabase/client.ts` — AppState リスナー追加

---

## データモデル変更

### なし
既存の `profiles` テーブルで十分。アカウント削除は `auth.users` の CASCADE で処理。

---

## Edge Function

### delete-account

```
POST /functions/v1/delete-account
Authorization: Bearer {access_token}

Response 200:
{ "success": true, "steps": { "openclaw": "skipped|success|failed", "revenuecat": "success|failed", "auth": "success" } }

Response 500:
{ "success": false, "error": "...", "failedStep": "openclaw|revenuecat|auth" }
```

---

## リスク分析

| リスク | 影響度 | 対策 |
|--------|--------|------|
| Google Native SDK の設定ミス | 高 | Expo Config Plugin で自動設定。dev build で事前検証 |
| アカウント削除の途中失敗 | 中 | 各ステップをログ記録。失敗ステップ以降を報告し、手動対応可能に |
| SecureStore のサイズ制限 | 低 | Supabase トークンは 2KB 以内。制限（2048バイト iOS）に収まる |
| ゲストモードのルーティング競合 | 中 | テストでガード動作を網羅的に検証 |

---

## 実装順序

```
Phase 1: 基盤（SecureStore + AppState）
  T001: SecureStore adapter
  T002: AppState フォアグラウンド復帰

Phase 2: 認証フロー改善
  T003: Google Sign-In Native SDK 移行
  T004: Apple Sign-In 改善（エラーハンドリング強化）

Phase 3: ゲストモード
  T005: ルーティングガード拡張
  T006: GuestPromptOverlay コンポーネント
  T007: 各タブのゲスト対応

Phase 4: アカウント削除
  T008: delete-account Edge Function
  T009: account-delete-confirm モーダル
  T010: auth-store に deleteAccount 追加

Phase 5: ポリッシュ
  T011: Googleブランドガイドライン準拠
  T012: テスト・品質チェック
```
