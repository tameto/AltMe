# 02 — 認証仕様

## ステータス: APPROVED
- 作成日: 2026-02-14
- 最終更新: 2026-02-15 (v2)
- 担当: Agent A (Foundation)

---

## 1. 概要

Supabase Authを使用したソーシャルログイン認証。メールアドレス/パスワード認証は提供しない（UXの簡素化のため）。
開発環境（`__DEV__`）ではemail/password方式のdevLoginが利用可能。

### 1.1 対応認証プロバイダー

| プロバイダー | 方式 | 優先度 | 備考 |
|-------------|------|--------|------|
| Apple Sign-In | `signInWithIdToken` (native) | Must | iOS App Store審査で必須 |
| Google Sign-In | `signInWithOAuth` (redirect) | Must | iOS/Android両対応 |
| devLogin | `signInWithPassword` | DEVのみ | `dev@altme.test` / `devpassword123` |

### 1.2 認証フロー図

```
アプリ起動
  |
  +-- 未認証 --> (auth)/login.tsx
  |               |
  |               +-- Apple Sign-In --> signInWithIdToken --> Supabase Auth
  |               |                                              |
  |               +-- Google Sign-In --> signInWithOAuth --> Supabase Auth
  |               |                                              |
  |               +-- devLogin (__DEV__) --> signInWithPassword --+
  |                                                               |
  |                                      JWT Token発行 + Session開始
  |                                                               |
  |                              +--------------------------------+
  |                              |
  |                              +-- profiles未作成 --> DB Trigger で自動作成
  |                              |
  |                              +-- onboarding未完了 --> (onboarding)/welcome
  |                              |
  |                              +-- onboarding完了 --> (tabs)/
  |
  +-- 認証済み
       |
       +-- トークン有効 --> 上記分岐
       |
       +-- トークン期限切れ --> Supabase SDK 自動リフレッシュ --> 上記分岐
       |
       +-- リフレッシュ失敗 --> (auth)/login にリダイレクト
```

---

## 2. 画面仕様

### 2.1 ログイン画面 -- `app/(auth)/login.tsx`

#### レイアウト
```
+-------------------------------+
|          SafeArea Top          |
|                                |
|          [AltMe Logo]          |
|       "AltMe" (Display 32pt)  |
|  "Your AI Twin That Knows You" |
|  "もう一人の自分と、毎日を振り返る"  |
|                                |
|  +---------------------------+ |
|  | [Apple] Appleでサインイン   | |  <-- iOS のみ表示
|  +---------------------------+ |
|                                |
|  +---------------------------+ |
|  | [Google] Googleでサインイン | |
|  +---------------------------+ |
|                                |
|  +---------------------------+ |
|  | Dev Login (オンボーディングから) | |  <-- __DEV__ のみ
|  +---------------------------+ |
|  +---------------------------+ |
|  | Dev Login (ホームへ直接)     | |  <-- __DEV__ のみ
|  +---------------------------+ |
|                                |
|  続行することで、利用規約と        |
|  プライバシーポリシーに同意します   |
|                                |
|          SafeArea Bottom       |
+-------------------------------+
```

#### ボタン仕様

| ボタン | 高さ | スタイル | 条件 |
|--------|------|---------|------|
| Appleでサインイン | 52pt | 黒背景/白文字、Apple アイコン | `Platform.OS === 'ios'` のみ |
| Googleでサインイン | 52pt | 白背景/1pt border/黒文字、Google アイコン | 常時表示 |
| Dev Login (2種) | 各ボタン | グレー背景/白文字 | `__DEV__` のみ |

#### 状態

| 状態 | 表示 |
|------|------|
| Default | ロゴ + ボタン群 |
| Loading | タップしたボタンにスピナー、他ボタン無効化 |
| Error | `Alert.alert` でエラーダイアログ表示 |

---

## 3. 実装仕様

### 3.1 認証サービス -- `src/services/supabase/auth.ts`

| 関数 | 引数 | 戻り値 | 説明 |
|------|------|--------|------|
| `signInWithApple()` | なし | `Promise<UserProfile>` | Apple native認証 --> `signInWithIdToken` --> profile取得 |
| `signInWithGoogle()` | なし | `Promise<UserProfile>` | Google OAuth --> `signInWithOAuth` (redirect: `altme://auth/callback`) --> profile取得 |
| `signOut()` | なし | `Promise<void>` | RevenueCat logOut --> Supabase signOut |
| `getCurrentSession()` | なし | `Session \| null` | 現在のセッション取得 |
| `getCurrentProfile(userId)` | `string` | `UserProfile \| null` | profilesテーブルから取得 |
| `updateProfile(userId, updates)` | `string`, `Partial<...>` | `Promise<UserProfile>` | profilesテーブル更新 |

#### Apple Sign-In フロー詳細

1. `expo-apple-authentication` でnonce生成 + Apple認証シート表示
2. `identityToken` 取得
3. `supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce })` でSupabase認証
4. `identifyUser(userId)` でRevenueCatにユーザーID設定
5. `fetchOrCreateProfile()` でprofile取得（DB Triggerで自動作成済み）
6. Apple提供の`fullName`がある場合、`display_name`を更新

#### Google Sign-In フロー詳細

1. `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: 'altme://auth/callback' })` 呼び出し
2. ブラウザでGoogle認証完了後、アプリにリダイレクト
3. `onAuthStateChange` リスナーでセッション確立を検知
4. `identifyUser(userId)` でRevenueCatにユーザーID設定
5. `fetchOrCreateProfile()` でprofile取得

### 3.2 認証状態管理 -- `src/features/auth/stores/auth-store.ts`

Zustand store（`useAuthStore`）で認証状態を管理する。

```typescript
type AuthStore = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
  devLogin: (skipOnboarding?: boolean) => Promise<void>;
};
```

#### `initialize()` の処理フロー

1. `initializeRevenueCat()` でRevenueCat SDK初期化
2. `supabase.auth.getSession()` で既存セッション確認
3. セッションがある場合:
   - `getCurrentProfile()` でprofile取得
   - `useUser.setUser(profile)` でユーザーストア設定
   - `checkSubscriptionStatus()` でサブスク状態取得
   - `addCustomerInfoListener()` でリアルタイム更新リスナー登録
   - `isAuthenticated = true`
4. セッションがない場合:
   - `isAuthenticated = false`
5. `onAuthStateChange` リスナー登録（`SIGNED_OUT` イベント時にストアリセット）

#### `devLogin(skipOnboarding?)` の処理

- `__DEV__` ガードあり（本番ビルドでは実行不可）
- `dev@altme.test` / `devpassword123` でemail/password認証
- ユーザー未存在時は `signUp` で自動作成
- `skipOnboarding = true` の場合、`onboardingCompleted = true` / `twinName = 'AltMe'` で初期化
- Freeプラン（`isPro: false`）で開始

### 3.3 ルーティングガード -- `app/_layout.tsx`

```
判定ロジック:
1. isLoading === true --> スプラッシュ画面維持
2. isAuthenticated === false --> ゲストブラウズモード（閲覧のみ）
   2a. ゲストがアクセスできる画面 --> そのまま表示
   2b. ゲストがアクセスできない画面 --> ログイン促進UI表示
3. profile.onboardingCompleted === false --> (onboarding)/welcome にリダイレクト
4. それ以外 --> (tabs)/ に遷移
```

### 3.4 ゲストブラウズモード

Apple App Store審査ガイドラインに準拠するため、ログインせずにアプリの一部を閲覧できるゲストブラウズモードを提供する。

#### ゲストがアクセスできる画面

| 画面 | アクセス範囲 | 備考 |
|------|------------|------|
| コミュニティ一覧 `(tabs)/community.tsx` | 閲覧のみ | 会話リストの表示。いいね・コメント不可 |
| コミュニティ詳細 `twin-conversation-detail.tsx` | 閲覧のみ | 会話内容の閲覧 |

#### ゲストがアクセスできない画面

| 画面 | 動作 |
|------|------|
| チャット `(tabs)/index.tsx` | ログイン促進UI表示 |
| ツイン情報 `(tabs)/twin.tsx` | ログイン促進UI表示 |
| 設定 `(tabs)/settings.tsx` | ゲスト専用マイページ表示（後述） |

#### ゲスト時のマイページ（設定タブ）

ゲストユーザーが設定タブをタップした場合、通常の設定画面の代わりにログイン促進画面を表示する。

```
+-------------------------------+
|          SafeArea Top          |
|                                |
|          [AltMe Logo]          |
|                                |
|   "ログインして始めよう"         |
|   "AIツインがあなたを待っています" |
|                                |
|  +---------------------------+ |
|  | [Apple] Appleでサインイン   | |  <-- iOS のみ
|  +---------------------------+ |
|                                |
|  +---------------------------+ |
|  | [Google] Googleでサインイン | |
|  +---------------------------+ |
|                                |
|  機能プレビュー（グレーアウト）    |
|  +---------------------------+ |
|  | [x] AIチャット              | |
|  | [x] 性格診断               | |
|  | [x] 日記 + AI振り返り       | |
|  | [x] 感情トラッキング        | |
|  +---------------------------+ |
|                                |
|          SafeArea Bottom       |
+-------------------------------+
```

- 機能一覧はグレーアウト表示（タップ不可）
- Apple/Googleログインボタンは `(auth)/login.tsx` と同じ仕様
- ログイン成功後、通常の設定画面に切り替わる

#### ゲスト状態の管理

```typescript
// auth-store.ts への追加
type AuthStore = {
  // 既存フィールド...
  isGuest: boolean; // 未認証でアプリを閲覧中
  enterGuestMode: () => void;
  exitGuestMode: () => void; // ログイン成功時に呼ばれる
};
```

### 3.5 RevenueCat連携

認証状態変更時にRevenueCat SDKと同期する。

| タイミング | 処理 |
|-----------|------|
| 認証成功時 | `identifyUser(supabaseUserId)` -- RevenueCat `Purchases.logIn()` |
| ログアウト時 | `logOutRevenueCat()` -- RevenueCat `Purchases.logOut()` |
| アプリ起動時 | `initializeRevenueCat()` --> `checkSubscriptionStatus()` |

---

## 4. 外部認証ブランドガイドライン

### 4.1 Google Sign-In ボタン

Googleのブランドガイドラインに厳密に準拠する。

| 項目 | 仕様 |
|------|------|
| アイコン | 正式なGoogle Gアイコン（マルチカラー版） |
| テキスト | "Sign in with Google"（英語） または "Googleでサインイン"（日本語） |
| ボタン背景 | ライトモード: 白 (`#FFFFFF`) + 1pt border (`#747775`) |
| ボタン背景 | ダークモード: `#131314` + 1pt border (`#8E918F`) |
| テキスト色 | ライトモード: `#1F1F1F` / ダークモード: `#E3E3E3` |
| フォント | Roboto Medium, 14sp |
| ボタン高さ | 40dp以上（AltMeでは52pt） |
| 角丸 | 20dp（pill shape推奨）または 4dp |
| アイコンサイズ | 18x18dp |
| パディング | 左: 12dp（アイコン前）、アイコン-テキスト間: 12dp |

#### 禁止事項
- Googleアイコンの色やプロポーションを変更しない
- ボタンテキストを独自のものに変更しない（例: "Continue with Google" は可）
- アイコンなしでGoogleボタンを表示しない
- Googleブランドカラーをボタン背景に使用しない

### 4.2 Apple Sign-In ボタン

AppleのHuman Interface Guidelinesに準拠（既存実装通り）。

| 項目 | 仕様 |
|------|------|
| スタイル | 黒背景/白文字（ASAuthorizationAppleIDButton 標準） |
| テキスト | "Appleでサインイン" |
| 高さ | 52pt |
| 表示条件 | `Platform.OS === 'ios'` のみ |

---

## 5. profile自動作成

### 4.1 Supabase Database Trigger

`auth.users` にレコード作成時、`profiles` テーブルにレコードを自動作成するトリガー。

| カラム | 初期値 |
|--------|--------|
| `id` | `auth.users.id` と一致 |
| `display_name` | プロバイダから取得した名前（取得不可の場合 `'User'`） |
| `onboarding_completed` | `false` |
| `locale` | `'ja'` |
| `timezone` | `'Asia/Tokyo'` |

### 4.2 フォールバック

トリガー失敗時、アプリ側の `fetchOrCreateProfile()` でprofileの存在チェックを行い、存在しなければエラーをthrowする。

---

## 5. セッション管理

### 5.1 トークン保存

| 項目 | 保存先 | 管理者 |
|------|--------|--------|
| アクセストークン (JWT) | Expo SecureStore | Supabase SDK |
| リフレッシュトークン | Expo SecureStore | Supabase SDK |

### 5.2 トークンリフレッシュ

- Supabase SDKが自動的にアクセストークンの有効期限を監視
- 期限の5分前にリフレッシュトークンで新しいアクセストークンを取得
- リフレッシュトークン自体が期限切れの場合、ログイン画面にリダイレクト

### 5.3 バックグラウンド復帰時

- フォアグラウンド復帰時にトークンの有効性をチェック
- 無効な場合は自動リフレッシュを試行

---

## 6. ログアウトフロー

```
設定画面 「ログアウト」タップ
  |
  v
確認ダイアログ「ログアウトしますか？」
  |
  +-- キャンセル --> 何もしない
  |
  +-- ログアウト
       |
       v
  1. logOutRevenueCat()          -- RevenueCatセッション切断
  2. supabase.auth.signOut()     -- Supabaseセッション無効化
  3. useUser.reset()             -- ユーザーストアリセット
  4. useSubscription.reset()     -- サブスクストアリセット
  5. isAuthenticated = false     -- 認証状態リセット
  6. (auth)/login にリダイレクト
```

ネットワークエラー時でもローカルのセッション（ストア、SecureStore）は必ず削除される。

---

## 7. アカウント削除

設定画面からアカウント削除が可能。詳細は `12-settings.md` を参照。

---

## 8. エラーハンドリング

| エラー | ユーザーへの表示 | 内部処理 |
|--------|---------------|---------|
| Apple認証キャンセル | なし（静かに閉じる） | `cancelled` / `ERR_CANCELED` を検出してreturn |
| Google認証キャンセル | なし | 同上 |
| ネットワークエラー | `Alert`: 「ログインに失敗しました。もう一度お試しください」 | エラーログ |
| Supabase Auth エラー | `Alert`: 「ログインに失敗しました。もう一度お試しください」 | エラーログ + throw |
| devLogin失敗 | コンソールエラーのみ | `console.error` |
| Profile取得失敗 | throw Error | 上位でキャッチ |

---

## 9. セキュリティ要件

### 9.1 認証トークン管理
- JWTトークンはExpo SecureStoreに保存（平文でAsyncStorageに保存しない）
- リフレッシュトークンの自動更新はSupabase SDKが処理
- ログアウト時にローカルデータを完全消去（SecureStore + Zustand Store）
- 認証なしでアクセスできる画面はゲストブラウズ対象画面のみ（セクション3.4参照）
- `devLogin` は `__DEV__` ガードで本番ビルドでは絶対に実行されない

### 9.2 API Key保護

全てのAPIキーはクライアントに露出させない。Edge Function経由でのみ外部APIを呼び出す。

| キー | 保管場所 | クライアントからの露出 |
|------|---------|-------------------|
| OpenAI API Key | Supabase Edge Function環境変数 | 不可（Edge Function経由のみ） |
| Supabase Service Role Key | Supabase Edge Function環境変数 | 不可（Edge Function経由のみ） |
| Supabase Anon Key | クライアントアプリ（`src/config/env.ts`） | 許可（RLSで保護） |
| DigitalOcean API Token | Supabase Edge Function環境変数 | 不可（Edge Function経由のみ） |
| RevenueCat API Key | クライアントアプリ（SDK初期化用） | 許可（SDK仕様上必須） |
| RevenueCat Webhook Secret | Supabase Edge Function環境変数 | 不可 |
| Stripe Secret Key | Supabase Edge Function環境変数 | 不可（Edge Function経由のみ） |

#### 設計原則
- クライアントアプリにはSupabase Anon KeyとRevenueCat API Keyのみ配置
- 外部API（OpenAI、DigitalOcean、Stripe）へのリクエストは全てEdge Functionを経由
- Edge Functionの環境変数はSupabase Dashboardまたは `supabase secrets set` で設定
- `.env` ファイルはgitignoreに含め、コードリポジトリにコミットしない

---

## 10. 関連ファイル

| ファイル | 説明 |
|---------|------|
| `app/(auth)/login.tsx` | ログイン画面 |
| `src/features/auth/stores/auth-store.ts` | 認証状態管理（Zustand） |
| `src/services/supabase/auth.ts` | Supabase Auth サービス |
| `src/services/supabase/client.ts` | Supabase クライアント |
| `src/services/revenuecat/client.ts` | RevenueCat 連携 |
| `src/shared/hooks/use-user.ts` | ユーザープロフィールStore |
| `src/shared/types/user.ts` | UserProfile 型定義 |

---

## 11. 検証条件

- [ ] Apple Sign-Inでログインし、profilesテーブルにレコードが作成されること
- [ ] Google Sign-Inでログインし、profilesテーブルにレコードが作成されること
- [ ] ログアウト後、(auth)/login画面にリダイレクトされること
- [ ] ログアウト後、Zustandストア（useUser, useSubscription）がリセットされること
- [ ] ログアウト後、RevenueCatがlogOutされること
- [ ] トークン期限切れ時にSupabase SDKが自動リフレッシュすること
- [ ] リフレッシュトークン期限切れ時にログイン画面にリダイレクトされること
- [ ] ゲストブラウズモードでコミュニティ一覧・詳細が閲覧できること
- [ ] ゲストブラウズモードでチャット・ツイン情報タブにログイン促進UIが表示されること
- [ ] ゲスト時マイページ（設定タブ）にログインボタンとグレーアウト機能一覧が表示されること
- [ ] ゲスト状態でログイン後、通常の画面に切り替わること
- [ ] 認証成功時にRevenueCatの `identifyUser()` が呼ばれること
- [ ] Apple認証キャンセル時にエラーが表示されないこと
- [ ] Google認証キャンセル時にエラーが表示されないこと
- [ ] `__DEV__` モードでdevLoginが動作すること（オンボーディングあり/なし両方）
- [ ] 本番ビルドでdevLoginボタンが表示されないこと
- [ ] バックグラウンド復帰時にトークン状態がチェックされること
- [ ] 同一メールで異なるプロバイダのアカウントがリンクされること
- [ ] GoogleログインボタンがGoogleブランドガイドラインに準拠していること（アイコン・色・テキスト）
- [ ] ダークモードでGoogleボタンのダークバリアントが表示されること
- [ ] クライアントアプリにOpenAI API Key、Supabase Service Role Key、DigitalOcean API Tokenが含まれていないこと
- [ ] 外部APIコールが全てEdge Function経由で行われること

---

## 変更履歴

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| 2026-02-14 | 初版作成 | ドキュメント初期作成 |
| 2026-02-15 | 実装コードに基づき全面書き換え | Reconcile: auth-store.ts, auth.ts, login.tsx の実態反映 |
| 2026-02-15 | ゲストブラウズモード追加 | Apple審査準拠: ログイン不要で一部閲覧可能 |
| 2026-02-15 | ゲスト時マイページ追加 | ゲストユーザー向けログイン促進UI |
| 2026-02-15 | 外部認証ブランドガイドライン追加 | Googleロゴ規約準拠 |
| 2026-02-15 | API Key保護セクション追加 | セキュリティ設計原則の明文化 |
