# 02 — 認証仕様

## ステータス: DRAFT
- 作成日: 2026-02-14
- 最終更新: 2026-02-14
- 承認状態: 未承認
- 担当: Agent A (Foundation)

---

## 1. 概要

Supabase Authを使用したソーシャルログイン認証。メールアドレス/パスワード認証は提供しない（UXの簡素化のため）。

### 1.1 対応認証プロバイダー

| プロバイダー | 優先度 | 備考 |
|-------------|--------|------|
| Apple Sign-In | Must | iOS App Store審査で必須 |
| Google Sign-In | Must | Android + iOS両方 |

### 1.2 認証フロー図

```
アプリ起動
  │
  ├─ 未認証 ──→ (auth)/login.tsx
  │               │
  │               ├─ Apple Sign-In ──→ Supabase Auth
  │               │                        │
  │               └─ Google Sign-In ─→ Supabase Auth
  │                                        │
  │                                   JWT Token発行
  │                                        │
  │               ┌───────────────────────┘
  │               │
  │               ├─ profiles未作成 ──→ (onboarding)/welcome.tsx
  │               │
  │               └─ profiles作成済み
  │                    │
  │                    ├─ onboarding未完了 ──→ (onboarding)/
  │                    │
  │                    └─ onboarding完了 ──→ (tabs)/
  │
  └─ 認証済み
       │
       ├─ トークン有効 ──→ 上記の分岐
       │
       └─ トークン期限切れ ──→ 自動リフレッシュ ──→ 上記の分岐
```

---

## 2. 画面仕様

### 2.1 ログイン画面 — `(auth)/login.tsx`

#### レイアウト
```
┌──────────────────────────────┐
│                              │
│         [AltMe Logo]         │
│                              │
│    "Your AI Twin That        │
│         Knows You"           │
│                              │
│                              │
│  ┌──────────────────────┐    │
│  │  Continue with Apple  │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │  Continue with Google │    │
│  └──────────────────────┘    │
│                              │
│  By continuing, you agree    │
│  to our Terms and Privacy    │
│  Policy.                     │
│                              │
└──────────────────────────────┘
```

#### 動作仕様
| アクション | 動作 |
|-----------|------|
| Apple Sign-In タップ | Apple認証シート表示 → Supabase Auth → 認証完了 |
| Google Sign-In タップ | Google認証画面表示 → Supabase Auth → 認証完了 |
| Terms タップ | 利用規約のWebView表示 |
| Privacy Policy タップ | プライバシーポリシーのWebView表示 |
| 認証成功 | profiles存在チェック → ルーティング分岐 |
| 認証失敗 | エラーメッセージ表示（Toast） |

---

## 3. 実装仕様

### 3.1 Supabase Auth設定

```typescript
// src/services/supabase/auth.ts

import { supabase } from './client';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';

export const signInWithApple = async (): Promise<void> => {
  // 1. Apple認証
  // 2. Supabase signInWithIdToken
  // 3. profiles作成（なければ）
};

export const signInWithGoogle = async (): Promise<void> => {
  // 1. Google OAuth
  // 2. Supabase signInWithIdToken
  // 3. profiles作成（なければ）
};

export const signOut = async (): Promise<void> => {
  // 1. Supabase signOut
  // 2. ローカルストア初期化
  // 3. RevenueCat logOut
};

export const getCurrentSession = async () => {
  // Supabase getSession
};
```

### 3.2 認証状態管理 — useAuthStore

```typescript
// src/features/auth/stores/auth-store.ts

type AuthState = {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};
```

### 3.3 ルーティングガード — app/_layout.tsx

```
ルーティング判定ロジック:
1. isLoading === true → スプラッシュ画面維持
2. isAuthenticated === false → (auth)/login にリダイレクト
3. profile.onboardingCompleted === false → (onboarding)/ にリダイレクト
4. それ以外 → (tabs)/ に遷移
```

### 3.4 RevenueCat連携

認証成功時にRevenueCatのユーザーIDを設定:

```typescript
// 認証成功後
await Purchases.logIn(supabaseUserId);
```

ログアウト時:
```typescript
await Purchases.logOut();
```

---

## 4. セキュリティ要件

- JWTトークンはSecureStore（Expo SecureStore）に保存
- リフレッシュトークンの自動更新（Supabase SDKが処理）
- ログアウト時にローカルデータを完全消去
- 認証なしでアクセスできる画面は `(auth)/login.tsx` のみ

---

## 5. エラーハンドリング

| エラー | ユーザーへの表示 | 内部処理 |
|--------|---------------|---------|
| Apple認証キャンセル | なし（静かに閉じる） | ログ記録 |
| Google認証キャンセル | なし | ログ記録 |
| ネットワークエラー | 「接続できません。ネットワークを確認してください」 | リトライ可能 |
| Supabase Auth エラー | 「ログインに失敗しました。もう一度お試しください」 | ログ + エラー報告 |
| 既存アカウント衝突 | 「このメールアドレスは既に使用されています」 | - |

---

## 6. 検証条件

- [ ] Apple Sign-Inでログインし、profilesテーブルにレコードが作成されること
- [ ] Google Sign-Inでログインし、profilesテーブルにレコードが作成されること
- [ ] ログアウト後、(auth)/login画面にリダイレクトされること
- [ ] ログアウト後、ローカルのZustandストアがクリアされること
- [ ] トークン期限切れ時に自動リフレッシュされること
- [ ] 未認証状態で(tabs)/にアクセスできないこと
- [ ] 認証成功時にRevenueCatのユーザーIDが設定されること
- [ ] ログアウト時にRevenueCatがlogOutされること
