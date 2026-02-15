# Auth 機能 — タスク一覧（tasks.md）

## Phase 1: 基盤（Setup）

### T001: SecureStore トークン永続化
- [x] Supabase client に SecureStore adapter を設定
- **agent**: supabase-backend
- **story**: AC-4 (セッショントークン自動リフレッシュ)
- **parallel**: no
- **blockedBy**: なし
- **files**:
  - `src/services/supabase/client.ts` — SecureStore adapter 追加
- **acceptance**:
  - Supabase client の auth.storage が ExpoSecureStoreAdapter を使用している
  - アプリ再起動後もセッションが維持される
  - SecureStore からトークンが取得・保存・削除できる

### T002: AppState フォアグラウンド復帰時トークンチェック
- [x] AppState リスナーでフォアグラウンド復帰時に autoRefresh 制御
- **agent**: rn-mobile-dev
- **story**: AC-4 (セッショントークン自動リフレッシュ)
- **parallel**: yes (T001と並列可)
- **blockedBy**: なし
- **files**:
  - `src/services/supabase/client.ts` — AppState listener 追加
- **acceptance**:
  - バックグラウンド→フォアグラウンド復帰時に startAutoRefresh() が呼ばれる
  - バックグラウンド移行時に stopAutoRefresh() が呼ばれる
  - トークン期限切れ後のフォアグラウンド復帰でセッションがリフレッシュされる

---

## Phase 2: 認証フロー改善

### T003: Google Sign-In Native SDK 移行
- [x] @react-native-google-signin/google-signin 導入 + signInWithGoogle 書き換え
- **agent**: rn-mobile-dev
- **story**: US-2 / AC-2 (Google Sign-In)
- **parallel**: no
- **blockedBy**: T001
- **files**:
  - `src/services/supabase/auth.ts` — signInWithGoogle を Native SDK 方式に全面書き換え
  - `src/config/constants.ts` — GOOGLE_WEB_CLIENT_ID 定数追加
  - `app.json` または `app.config.ts` — google-signin plugin 設定
- **acceptance**:
  - Google ログインでブラウザが開かず、ネイティブ UI が表示される
  - idToken を signInWithIdToken に渡してセッションが開始される
  - ユーザーキャンセル時にエラーが表示されない（サイレント処理）
  - Android で hasPlayServices() チェックが行われる
  - RevenueCat に identify される

### T004: Apple Sign-In エラーハンドリング強化
- [x] Apple Sign-In のエラーハンドリングを仕様に合わせて強化
- **agent**: rn-mobile-dev
- **story**: US-1 / AC-1 (Apple Sign-In)
- **parallel**: yes (T003と並列可)
- **blockedBy**: T001
- **files**:
  - `src/services/supabase/auth.ts` — エラーハンドリング改善
  - `src/features/auth/stores/auth-store.ts` — Apple キャンセルコード判定改善
- **acceptance**:
  - Apple 認証キャンセル（ERR_CANCELED）でエラー非表示
  - 「メールを隠す」選択時に正常にアカウント作成される
  - ネットワークエラー時にリトライ可能なメッセージが表示される
  - iOS のみ表示（Platform.OS === 'ios'）

---

## Phase 3: ゲストモード

### T005: ルーティングガード拡張（ゲストブラウズ対応）
- [x] _layout.tsx のルーティングガードをゲストモード対応に拡張
- **agent**: rn-mobile-dev
- **story**: US-4 / AC-6 (ゲストブラウズ)
- **parallel**: no
- **blockedBy**: T001, T002
- **files**:
  - `app/_layout.tsx` — ゲストモード時もタブ表示を許可するガードロジック
  - `src/features/auth/stores/auth-store.ts` — isGuest 状態追加
- **acceptance**:
  - 未認証ユーザーがアプリ起動時にタブ画面が表示される（ログイン強制なし）
  - ゲストモードでコミュニティタブが閲覧可能
  - ゲストモードでチャット/ツイン/設定タブにゲスト促進UIが表示される
  - ディープリンクからのアクセス時もゲストガードが動作する

### T006: GuestPromptOverlay コンポーネント
- [x] ゲストユーザー向けのログイン促進オーバーレイUI作成
- **agent**: rn-mobile-dev
- **story**: US-4 / AC-6 (ゲストブラウズ)
- **parallel**: yes (T005と並列可)
- **blockedBy**: なし
- **files**:
  - `src/shared/components/guest-prompt-overlay.tsx` — 新規コンポーネント
- **acceptance**:
  - 「ログインして始めよう」テキスト表示
  - 「AIツインがあなたを待っています」サブテキスト
  - Apple/Google ログインボタン（ログイン画面と同じ機能）
  - 機能プレビュー（グレーアウト、タップ不可）: AIチャット、性格診断、日記+AI振り返り、感情トラッキング

### T007: 各タブのゲスト対応
- [x] チャット、ツイン情報、設定タブにゲスト判定を追加
- **agent**: rn-mobile-dev
- **story**: US-4 / AC-6 (ゲストブラウズ)
- **parallel**: no
- **blockedBy**: T005, T006
- **files**:
  - `app/(tabs)/index.tsx` — ゲスト判定 → GuestPromptOverlay
  - `app/(tabs)/twin.tsx` — ゲスト判定 → GuestPromptOverlay
  - `app/(tabs)/settings.tsx` — ゲストモード表示（ログインボタン + グレーアウト一覧）
  - `app/(tabs)/community.tsx` — ゲスト時は閲覧のみ（いいね/コメント非表示）
- **acceptance**:
  - ゲストがチャットタブを開くとGuestPromptOverlayが表示される
  - ゲストがツインタブを開くとGuestPromptOverlayが表示される
  - ゲストが設定タブを開くとゲスト専用マイページが表示される
  - ゲストがコミュニティを閲覧できる（操作は不可）
  - ゲストがログインすると通常画面に即座に切り替わる

---

## Phase 4: アカウント削除

### T008: delete-account Edge Function
- [x] アカウント削除の Edge Function を作成
- **agent**: supabase-backend
- **story**: US-5 / AC-7 (アカウント削除)
- **parallel**: no
- **blockedBy**: なし
- **files**:
  - `supabase/functions/delete-account/index.ts` — 新規 Edge Function
- **acceptance**:
  - Authorization ヘッダーから user_id を取得
  - OpenClaw インスタンス存在時に destroy-openclaw を呼び出し（失敗しても続行）
  - RevenueCat subscriber 削除/キャンセル処理
  - auth.admin.deleteUser() でユーザー完全削除（CASCADE）
  - 各ステップの成否をレスポンスに含める
  - 他ユーザーのアカウントは削除不可（自分のみ）

### T009: account-delete-confirm モーダル画面
- [x] アカウント削除確認モーダルの UI を作成
- **agent**: rn-mobile-dev
- **story**: US-5 / AC-7 (アカウント削除)
- **parallel**: yes (T008と並列可)
- **blockedBy**: なし
- **files**:
  - `app/account-delete-confirm.tsx` — モーダル画面
- **acceptance**:
  - 「アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。」テキスト
  - 「削除」テキスト入力フィールド（一致時のみ削除ボタン有効化）
  - 削除処理中はローディング表示
  - 成功時: ログイン画面にリダイレクト
  - 失敗時: エラーメッセージ + サポート案内
  - Apple 審査基準: 設定画面内から容易にアクセス可能

### T010: auth-store に deleteAccount アクション追加
- [x] auth-store にアカウント削除ロジックを追加
- **agent**: rn-mobile-dev
- **story**: US-5 / AC-7 (アカウント削除)
- **parallel**: no
- **blockedBy**: T008, T009
- **files**:
  - `src/features/auth/stores/auth-store.ts` — deleteAccount アクション
  - `src/services/supabase/auth.ts` — deleteAccount 関数追加
- **acceptance**:
  - delete-account Edge Function を呼び出す
  - 成功時: ローカル状態をすべてクリア（user, subscription, auth）
  - 失敗時: エラーを throw（UI 側でハンドリング）
  - OpenClaw 接続が切断される

---

## Phase 5: ポリッシュ

### T011: Google ブランドガイドライン準拠
- [x] Google Sign-In ボタンをブランドガイドラインに完全準拠させる
- **agent**: rn-mobile-dev
- **story**: US-2 / AC-2
- **parallel**: yes
- **blockedBy**: T003
- **files**:
  - `app/(auth)/login.tsx` — Google ボタンスタイル更新
  - `src/shared/components/guest-prompt-overlay.tsx` — 同上
- **acceptance**:
  - Google G アイコン（マルチカラー版）が表示される
  - ボタン背景: ライト=#FFFFFF+border #747775、ダーク=#131314+border #8E918F
  - テキスト色: ライト=#1F1F1F、ダーク=#E3E3E3
  - フォント: Roboto Medium, 14sp
  - 高さ: 50pt

### T012: テスト・品質ゲート
- [x] 全 AC のテスト観点を検証
- **agent**: qa-debugger
- **story**: 全 AC
- **parallel**: no
- **blockedBy**: T007, T010, T011
- **files**:
  - `src/features/auth/__tests__/auth-store.test.ts` — ストアテスト
  - `src/services/supabase/__tests__/auth.test.ts` — サービステスト
  - `supabase/functions/delete-account/__tests__/index.test.ts` — Edge Function テスト
- **acceptance**:
  - tsc --noEmit: PASS
  - npx jest --passWithNoTests: PASS
  - Apple Sign-In キャンセル → エラー非表示
  - Google Sign-In キャンセル → エラー非表示
  - ゲストモードでコミュニティ閲覧可能
  - アカウント削除後にログイン画面遷移
  - 本番ビルドで devLogin 非表示
  - SecureStore でトークン永続化
