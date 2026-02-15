# Auth 機能 SDD 仕様書

## 基本情報

| 項目 | 内容 |
|------|------|
| 機能名 | 認証（Auth） |
| ブランチ | `20260215-auth` |
| ベース仕様 | `specs/features/auth.md` |
| 依存する機能 | なし |
| 依存される機能 | 全機能（オンボーディング、チャット、課金、設定） |
| 担当Agent | Agent A (Foundation) |

---

## 目的

Apple/Google Sign-In を通じて Supabase Auth と連携し、ユーザーの認証・セッション管理を行う。
全ての機能の前提となる基盤機能であり、安全かつシームレスなログイン体験を提供する。
加えて、ゲストブラウズモード・アカウント削除も Auth ドメインの責務として含む。

---

## ユーザーストーリー

### US-1: Apple Sign-In ログイン
ユーザーとして、Apple ID でワンタップログインしたい。なぜならパスワードを覚えたくないから。

### US-2: Google Sign-In ログイン
ユーザーとして、Google アカウントでログインしたい。なぜなら既存のアカウントを活用したいから。

### US-3: ログアウト
ユーザーとして、安全にログアウトしたい。なぜなら他人にアカウントを使われたくないから。

### US-4: ゲストブラウズ
ユーザーとして、ログインせずにアプリの一部を閲覧したい。なぜならログイン前にアプリの雰囲気を確認したいから。

### US-5: アカウント削除
ユーザーとして、アカウントを完全に削除したい。なぜなら自分のデータを管理する権利があるから。

### US-6: devLogin（開発用）
開発者として、DEV モードで仮ログインしたい。なぜなら認証フローを毎回通らずに開発を進めたいから。

---

## 受け入れ条件

### AC-1: Apple Sign-In でアカウント作成・ログインできる
- **Given**: 未認証のユーザーがログイン画面を表示している
- **When**: 「Apple でサインイン」ボタンをタップし、Apple 認証フローを完了する
- **Then**:
  - Supabase Auth にユーザーが作成される（初回）またはセッションが開始される（2回目以降）
  - アクセストークンとリフレッシュトークンが SecureStore に保存される
  - RevenueCat にユーザーが identify される
  - 初回の場合はオンボーディング画面へ、2回目以降はメインタブへ遷移する
- **エッジケース**:
  - Apple 認証をキャンセルした場合、ログイン画面に戻りエラーは表示しない
  - Apple 側で「メールを隠す」を選択した場合でも正常にアカウント作成される
  - ネットワークエラー時にリトライ可能なエラーメッセージが表示される

### AC-2: Google Sign-In でアカウント作成・ログインできる
- **Given**: 未認証のユーザーがログイン画面を表示している
- **When**: 「Google でサインイン」ボタンをタップし、Google 認証フローを完了する
- **Then**:
  - Supabase Auth にユーザーが作成される（初回）またはセッションが開始される（2回目以降）
  - アクセストークンとリフレッシュトークンが SecureStore に保存される
  - RevenueCat にユーザーが identify される
  - 初回の場合はオンボーディング画面へ、2回目以降はメインタブへ遷移する
- **エッジケース**:
  - Google 認証をキャンセルした場合、ログイン画面に戻りエラーは表示しない
  - 同一メールで Apple/Google 両方でサインインした場合、アカウントがリンクされる
  - Google Play Services 未インストール環境（Android）でエラーメッセージを表示

### AC-3: ログアウトできる（OpenClaw との接続も切断）
- **Given**: 認証済みのユーザーがアプリを使用している
- **When**: 設定画面で「ログアウト」をタップし、確認ダイアログで「ログアウト」を選択する
- **Then**:
  - OpenClaw との WebSocket 接続が切断される
  - Supabase セッションが無効化される
  - SecureStore からトークンが削除される
  - Zustand のユーザー状態がリセットされる
  - RevenueCat からログアウトされる
  - ログイン画面にリダイレクトされる
- **エッジケース**:
  - ログアウト中にネットワークエラーが発生した場合でも、ローカルのセッションは必ず削除される
  - 確認ダイアログでキャンセルした場合、何も起こらない

### AC-4: セッショントークンが自動リフレッシュされる
- **Given**: 認証済みのユーザーがアプリを使用している
- **When**: アクセストークンの有効期限が近づく（期限の5分前）
- **Then**:
  - リフレッシュトークンを使って Supabase Auth から新しいアクセストークンを取得する
  - 新しいトークンが SecureStore に保存される
  - ユーザー操作は中断されない
- **エッジケース**:
  - リフレッシュトークン自体が期限切れの場合、ログイン画面にリダイレクトされる
  - リフレッシュ中にネットワークエラーが発生した場合、オフラインバナーを表示し再接続時にリトライ
  - バックグラウンドからフォアグラウンドに復帰した際にもトークンチェックが行われる

### AC-5: 初回ログイン時に profile が自動作成される
- **Given**: ユーザーが Apple または Google で初回サインインを完了した
- **When**: Supabase Auth にユーザーが作成される
- **Then**:
  - Supabase Database Trigger により `profiles` テーブルにレコードが自動作成される
  - `id` は auth.users.id と一致する
  - `display_name` はプロバイダから取得した名前（取得できない場合は null）
  - `onboarding_completed` は false で初期化される
- **エッジケース**:
  - トリガーが失敗した場合、アプリ側で profile の存在チェックを行い、なければ手動作成する
  - 同一ユーザーの重複作成は `id` の PK 制約で防止される

### AC-6: ゲストブラウズモードでアプリの一部を閲覧できる
- **Given**: 未認証のユーザーがアプリを起動する
- **When**: ログインせずにアプリを閲覧する
- **Then**:
  - コミュニティ一覧（`(tabs)/community.tsx`）が閲覧できる（閲覧のみ、いいね・コメント不可）
  - チャット、ツイン情報タブにはログイン促進 UI（guest-prompt）が表示される
  - 設定タブにはゲスト専用マイページ（ログインボタン + グレーアウト機能一覧）が表示される
- **エッジケース**:
  - ゲスト状態でログイン後、通常の画面に切り替わること
  - ゲストがアクセス不可の機能をディープリンクで開こうとした場合、ログイン促進 UI が表示されること
  - Apple 審査: ログインなしでアプリの一部を閲覧できること（App Store Review Guideline 5.1.1 準拠）

### AC-7: アカウントを削除できる
- **Given**: 認証済みのユーザーが設定画面を表示している
- **When**: 「アカウント削除」をタップする
- **Then**:
  - 確認ダイアログが表示される
  - 確認テキスト入力を求める（「削除」と入力）
  - 「削除を確定」をタップすると:
    - OpenClaw インスタンスが存在する場合、destroy-openclaw が呼び出される
    - Supabase の全ユーザーデータが CASCADE 削除される
    - auth.users からユーザーが削除される
    - RevenueCat でサブスクキャンセル処理
    - ログイン画面にリダイレクトされる
- **エッジケース**:
  - 削除処理中にネットワークエラーが発生した場合、リトライまたはサポート連絡を案内
  - OpenClaw インスタンスの削除が失敗した場合でも、ユーザーアカウントの削除は続行
  - トライアル中のユーザーの場合、RevenueCat でキャンセルも実行
  - Apple 審査基準: 削除ボタンは設定画面内で容易に見つかる位置に配置

### AC-8: DEV モードで devLogin が使える
- **Given**: アプリが `__DEV__` モードで起動している
- **When**: ログイン画面で開発用ログインボタンをタップする
- **Then**:
  - 環境変数 `DEV_USER_EMAIL`/`DEV_USER_PASSWORD` を使って Supabase Auth に email/password ログインする
  - 通常のログインと同じフローでセッションが開始される
  - オンボーディング完了済みの場合はメインタブへ、未完了の場合はオンボーディングへ遷移する
- **エッジケース**:
  - 本番ビルドでは devLogin ボタンが表示されない（`__DEV__` ガード）
  - DEV_USER_EMAIL/DEV_USER_PASSWORD が未設定の場合、エラーメッセージを表示

---

## 技術仕様

### Apple Sign-In 実装
- ライブラリ: `expo-apple-authentication`
- フロー: Native → `signInAsync` → `identityToken` 取得 → `supabase.auth.signInWithIdToken`
- nonce: `expo-crypto` で SHA256 ハッシュ生成
- iOS のみ表示（`Platform.OS === 'ios'`）

### Google Sign-In 実装（Native SDK 移行）
- ライブラリ: `@react-native-google-signin/google-signin`
- フロー: `GoogleSignin.signIn()` → `idToken` 取得 → `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`
- 移行理由: signInWithOAuth（リダイレクト方式）はブラウザが開くためUXが劣る。Apple と同じ signInWithIdToken パターンに統一。
- Android: Google Play Services 必須チェック（`GoogleSignin.hasPlayServices()`）
- Web Client ID: Supabase ダッシュボードで設定
- 設定: `GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID })`

### セッション管理
- `supabase.auth.onAuthStateChange` でセッション状態を監視
- SecureStore（`expo-secure-store`）でトークン永続化
- Supabase SDK の自動リフレッシュ機能を活用
- AppState リスナーでフォアグラウンド復帰時にトークンチェック

### アカウント削除フロー（Edge Function 順序制御）
delete-account Edge Function（Service Role Key 使用）で以下を順序実行:
1. **OpenClaw 削除**: destroy-openclaw 呼び出し（インスタンス存在時のみ、失敗しても続行）
2. **RevenueCat キャンセル**: RevenueCat API で subscriber 削除/サブスクキャンセル
3. **auth.admin.deleteUser**: Supabase Admin API でユーザー削除（CASCADE で profiles 以下全テーブル連鎖削除）
4. **ログ記録**: 各ステップの成否をログに記録（リトライ判断用）

クライアント側:
1. 確認ダイアログ → テキスト入力（「削除」と入力）
2. delete-account Edge Function 呼び出し
3. 成功時: ローカル状態クリア → ログイン画面遷移
4. 失敗時: エラー表示 + サポート連絡案内

### ルーティングガード
- Root Layout (`app/_layout.tsx`) で条件分岐
- 3レベル: guest / authenticated / subscriber
- ゲスト → コミュニティのみ閲覧可能、他タブは guest-prompt 表示
- 認証済み + OB未完了 → オンボーディングへリダイレクト
- 認証済み + OB完了 → メインタブ

---

## データモデル

### 使用テーブル
- `auth.users` (Supabase 管理)
- `profiles` (ユーザープロフィール、auth.users トリガーで自動作成)

### 使用 API
- `supabase.auth.signInWithIdToken` (Apple/Google)
- `supabase.auth.signInWithPassword` (devLogin)
- `supabase.auth.signOut`
- `supabase.auth.onAuthStateChange`
- `supabase.auth.admin.deleteUser` (アカウント削除 — Edge Function 内)

---

## 現在の実装状況

### 実装済み
- [x] Apple Sign-In（`expo-apple-authentication` + `signInWithIdToken`）
- [x] Google Sign-In（`signInWithOAuth` — リダイレクト方式、改善必要）
- [x] devLogin（email/password）
- [x] ログアウト（OpenClaw 切断 + Supabase signOut + RevenueCat logout）
- [x] セッション初期化（`initialize` in auth-store）
- [x] ルーティングガード（`app/_layout.tsx`）— ゲストモード未対応
- [x] profiles テーブル + trigger
- [x] ログイン画面 UI

### 未実装
- [ ] ゲストブラウズモード（AC-6）
- [ ] アカウント削除（AC-7）+ delete-account Edge Function
- [ ] guest-prompt 画面
- [ ] Google Sign-In → Native SDK 移行
- [ ] SecureStore によるトークン永続化（明示的管理）
- [ ] アカウントリンク（同一メール Apple/Google）
- [ ] AppState フォアグラウンド復帰時トークンチェック

---

## 外部認証ブランドガイドライン

### Google Sign-In ボタン
| 項目 | 仕様 |
|------|------|
| アイコン | 正式な Google G アイコン（マルチカラー版） |
| テキスト | "Google でサインイン" |
| ボタン背景（ライト） | 白 (`#FFFFFF`) + 1pt border (`#747775`) |
| ボタン背景（ダーク） | `#131314` + 1pt border (`#8E918F`) |
| テキスト色 | ライト: `#1F1F1F` / ダーク: `#E3E3E3` |
| フォント | Roboto Medium, 14sp |
| 高さ | 50pt（最低40dp） |

### Apple Sign-In ボタン
- Apple Human Interface Guidelines 準拠
- `expo-apple-authentication` の `AppleAuthenticationButton` を使用

---

## Clarifications

### Session 2026-02-15

- Q: Google Sign-In実装方式 -> A: Native SDK移行（@react-native-google-signin/google-signin で idToken → signInWithIdToken）。ブラウザ不要でUX最良。
- Q: アカウント削除時のデータ削除戦略 -> A: Edge Function順序制御（1.OpenClaw削除 → 2.RevenueCatキャンセル → 3.auth.admin.deleteUser(CASCADE)）。ログ記録+リトライ可能。
- Q: 同一メールApple/Googleアカウントリンク -> A: Supabase自動リンクに任せる。実装コスト最小。
- Q: ゲストブラウズモードのルーティング実装 -> A: 条件付きレンダリング。既存_layout.tsxのガードを拡張し、タブ内で条件分岐（community=表示、他=guest-prompt）。
- Q: Apple Sign-InのAndroid対応 -> A: AndroidではApple非表示（Platform.OS === 'ios'のみ）。AndroidはGoogleのみ。MVP最シンプル。
