# AIチャット機能仕様書

## 基本情報

| 項目 | 内容 |
|------|------|
| 機能名 | AIチャット |
| 関連画面 | `app/(tabs)/index.tsx`（チャット画面）、`app/(onboarding)/meet-twin.tsx`（初回チャット） |
| 依存する機能 | 認証、OpenClawプロビジョニング、課金 |
| 依存される機能 | ツイン情報（気分データ連携） |

## 目的

ユーザーがAIツイン（OpenClaw）とリアルタイムでチャットできる。
Proユーザーは自分専用のOpenClawインスタンスとWebSocketで直接通信する。
Freeユーザーは Supabase Edge Function 経由で制限付きチャットを利用する。

**日記統合**: Proユーザーのチャット内で日記（振り返り）機能を統合。
AIツインが定期的に「今日はどうだった？」と聞き、ユーザーの回答をジャーナルエントリーとして保存し、振り返りコメントを生成する。
チャット履歴 = 日記履歴として統合ビューで表示。

---

## 二層アーキテクチャ

### Freeユーザー（初回10Kトークン制限、リセットなし）

- Supabase Edge Function `chat` 経由
- OpenAI GPT-4o mini 直接呼び出し
- SSE ストリーミング
- システムプロンプトに基本的なAIツインペルソナを埋め込み
- 既存実装をそのまま利用

```
[モバイルアプリ] --HTTPS/SSE--> [Supabase Edge Function `chat`] --API--> [OpenAI GPT-4o mini]
```

### Proユーザー（無制限）

- ユーザー専用 OpenClaw Gateway (`wss://{ip}:443`) にWebSocket接続
- トークン認証 (`gateway_token`)
- OpenClawの SOUL.md に基づくパーソナライズされた応答
- リッチなコンテキスト管理（OpenClawが会話履歴を管理）
- ツール実行可能（将来拡張: メール作成、タスク自動化等）

```
[モバイルアプリ] --WebSocket(wss)--> [nginx reverse proxy :443] --WebSocket--> [OpenClaw Gateway :18789] --内部--> [OpenClaw Agent + SOUL.md]
```

---

## WebSocket接続仕様

### 接続フロー

1. アプリ起動時、`openclaw_instances` テーブルから `ip_address`, `gateway_token` を取得
2. WebSocket接続を開始: `wss://{ip_address}:443`（nginx経由、TLS暗号化）
3. connect ハンドシェイクを送信
4. 接続成功レスポンスを受信
5. チャットメッセージ送受信を開始

### ハンドシェイク（connect）

**送信:**

```json
{
  "type": "connect",
  "params": {
    "auth": { "token": "{gateway_token}" },
    "deviceId": "{device_uuid}",
    "clientType": "mobile"
  }
}
```

**受信（成功）:**

```json
{
  "type": "connected",
  "sessionId": "{session_id}",
  "serverVersion": "1.0.0"
}
```

**受信（失敗）:**

```json
{
  "type": "error",
  "code": "AUTH_FAILED",
  "message": "Invalid gateway token"
}
```

### メッセージ送信

```json
{
  "type": "message",
  "content": "今日はこんなことがあったよ",
  "sessionId": "{current_session_id}"
}
```

### メッセージ受信（ストリーミング）

**テキストデルタ（部分受信）:**

```json
{
  "type": "agent",
  "event": "text_delta",
  "delta": "今日も",
  "sessionId": "{session_id}"
}
```

**テキスト完了:**

```json
{
  "type": "agent",
  "event": "text_done",
  "content": "今日も頑張ったね！どんなことがあったか教えて。",
  "sessionId": "{session_id}"
}
```

### エラーイベント

```json
{
  "type": "error",
  "code": "RATE_LIMITED",
  "message": "Please wait before sending another message",
  "retryAfter": 10
}
```

### 再接続ポリシー

- WebSocket切断時は自動再接続を実行
- Exponential backoff: 1s -> 2s -> 4s -> 8s -> 最大30s
- 再接続時はセッション復元を試みる
- 最大再接続試行回数: 10回
- 10回失敗後はフォールバックモード（Edge Function経由）に切り替え

### フォールバック後のWebSocket復帰

- Edge Functionフォールバックモード中もバックグラウンドで5分間隔のWebSocket再接続を試行
- WebSocket再接続に成功した場合、自動的にWebSocketモードに復帰
- 復帰時に「接続が回復しました」のトーストを表示
- フォールバック中の会話はEdge Function経由で保存され、復帰後もシームレスに継続

---

## トピックタブ機能（V3 Liquid Glass新機能）

### コンセプト
チャット画面の上部にトピックタブを配置し、ユーザーが話題別にメッセージを分類・管理できる。
Slackライクな複数ジャーナルセッション管理。

### トピック一覧
- **daily（#日常）**: 日常の出来事、雑談
- **work（#仕事）**: 仕事・キャリア関連
- **reflection（#振り返り）**: 1日の振り返り（Pro限定で自動生成も可）
- **consultation（#相談）**: 悩み相談、メンタル系

### データモデル
- `chat_topics` テーブル参照（database.md で定義）
- `chat_messages.topic_id` TEXT DEFAULT 'daily' で管理
- ユーザーごとに4つのデフォルトトピックを自動作成

### UI仕様
- **ヘッダー下**に glass pill スタイルのタブバー配置
- **タブ間隔**: 8pt
- **タブサイズ**: 動的（テキスト長に応じて）
- **アクティブタブ**: 背景色変更 + 下部アンダーライン
- **タップアクション**: タブ切替 → メッセージフィルタ更新（スムーズスクロール）

### テスト観点
- [ ] 4つのトピックタブが表示される
- [ ] タブタップで対応トピックのメッセージのみ表示される
- [ ] `chat_messages.topic_id` が正しく保存される
- [ ] トピック間の遷移がスムーズである

---

## Freeチャット（Edge Function）仕様

### エンドポイント

```
POST /functions/v1/chat
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

### リクエスト

```json
{
  "message": "こんにちは",
  "conversationId": "{conversation_id}"
}
```

### レスポンス（SSE）

```
data: {"type": "text_delta", "delta": "こん"}
data: {"type": "text_delta", "delta": "にちは！"}
data: {"type": "text_done", "content": "こんにちは！今日はどんな一日でしたか？"}
data: {"type": "usage", "remaining": 2}
data: [DONE]
```

### トークン制限

- Free: 初回10,000トークン（リセットなし、使い切りで終了）
- Pro: 月間500,000トークン（毎月1日 UTC 00:00 リセット）
- `usage` イベントで残りトークン数を通知
- 上限到達時は HTTP 429 を返却 + アップグレード/追加購入CTA

---

## ユーザーストーリー

| ID | ストーリー |
|----|-----------|
| US-1 | Freeユーザーとして、初回10Kトークンの範囲でAIツインと会話したい |
| US-2 | Proユーザーとして、無制限にAIツインと会話したい |
| US-3 | ユーザーとして、リアルタイムでストリーミング応答を見たい |
| US-4 | ユーザーとして、過去のチャット履歴を見返したい |
| US-5 | Proユーザーとして、ネットワーク切断時に自動再接続してほしい |
| US-6 | Proユーザーとして、チャット内で日々の振り返りを記録したい |
| US-7 | Proユーザーとして、AIツインから振り返りのフィードバックを受けたい |
| US-8 | Proユーザーとして、過去の振り返り履歴をチャット内で見返したい |
| US-9 | ユーザーとして、チャットで画像を送信してAIに見せたい |
| US-10 | ユーザーとして、AIの応答をマークダウン形式で読みやすく表示してほしい |
| US-11 | ユーザーとして、マークダウン記法を使ってメッセージを書きたい |
| US-12 | ユーザーとして、メッセージを簡単にコピー・選択したい |
| US-13 | ユーザーとして、動画や音声をチャットで送信したい |
| US-14 | ユーザーとして、未読メッセージがあることを把握したい |
| US-15 | ユーザーとして、過去メッセージ閲覧中に最新メッセージに素早く戻りたい |
| US-16 | ユーザーとして、URLのプレビュー（OGP）をチャット内で確認したい |
| US-17 | ユーザーとして、メッセージを翻訳したい |

---

## 受け入れ条件

### AC-1: Freeユーザーが初回10Kトークンの範囲でチャットできる

- **Given:** 未課金ユーザーがチャット画面を開いている
- **When:** メッセージを送信
- **Then:** Supabase Edge Function 経由でAI応答がSSEストリーミングで表示される。トークン上限到達後はペイウォールへ誘導

### 上限到達後のUX（Freeユーザー）
1. トークン残量が0になった送信後、レスポンスに `remaining: 0` が含まれる
2. チャット画面上部に「無料トークンを使い切りました」バナー表示
3. 送信ボタンは無効化（グレーアウト）されるが、チャット画面自体は閲覧可能
4. バナー内に「Proにアップグレード」ボタンを配置
5. ボタンタップでペイウォール画面に遷移
6. Freeユーザーのトークンはリセットされない（一回限り）

### AC-2: ProユーザーがWebSocket経由で無制限チャットできる

- **Given:** 課金済みユーザーで OpenClaw インスタンスが running
- **When:** メッセージを送信
- **Then:** WebSocket経由で OpenClaw Gateway に送信、ストリーミング応答がリアルタイム表示

### AC-3: OpenClawインスタンス未起動時のフォールバック

- **Given:** Proユーザーだがインスタンスが provisioning / error 状態
- **When:** チャット画面を開く
- **Then:** 「AIツインを準備中です」のステータス表示。Freeユーザーと同じ Edge Function 経由のフォールバックチャットを提供

### AC-4: WebSocket再接続

- **Given:** Proユーザーがチャット中
- **When:** ネットワーク切断が発生
- **Then:** 自動再接続（exponential backoff）、再接続成功時に中断メッセージなく会話継続

### AC-5: チャット履歴の保存と表示

- **Given:** ユーザーがチャット画面を開く
- **When:** 画面が表示される
- **Then:** 直近50件のメッセージが時系列で表示される

**ページネーション:**
- 初回読み込み: 直近50件
- 追加読み込み: 上方向スクロールで50件ずつ追加ロード
- 最古のメッセージに到達した場合「これ以上メッセージはありません」表示

### AC-6: ストリーミング応答の表示

- **Given:** ユーザーがメッセージを送信
- **When:** AIが応答を生成中
- **Then:** テキストがdelta単位でリアルタイム表示、タイピングカーソル表示

### AC-7: メッセージ長制限

- **Given:** ユーザーがメッセージを入力中
- **When:** 文字数上限を超える入力
- **Then:** 入力が制限される

**文字数制限:**
- 通常チャット: 1,000文字
- 振り返り回答（isJournalEntry）: 3,000文字（振り返りはより長い記述を許容）
- 入力時にモードに応じた制限値を動的に適用

### AC-8: AIツインが振り返りを促す会話を開始できる（Proのみ）

- **Given:** Proユーザーが最後のチャットから6時間以上経過している
- **When:** チャット画面を開く
- **Then:** AIツインから「今日はどうだった？」等の振り返り促進メッセージが表示され、`metadata.isJournalPrompt: true` がセットされている

### AC-9: チャットメッセージをトピック別に分類できる

- **Given:** ユーザーがチャット画面を開いている
- **When:** トピックタブ（#日常、#仕事、#振り返り、#相談）から1つをタップ
- **Then:**
  - 選択したトピックのメッセージのみがメッセージリストに表示される
  - メッセージ送信時のデフォルトトピックは前回選択したタブが適用される
  - 新規メッセージの `chat_messages.topic_id` が正しく保存される
  - タブ間の遷移がスムーズ（スクロール位置も保持）

### AC-10: 振り返り回答がジャーナルエントリーとして保存される（Proのみ）

- **Given:** AIツインが振り返りを促し、ユーザーが回答した
- **When:** ユーザーの回答が送信される
- **Then:**
  1. `chat_messages` に `metadata.isJournalEntry: true` で保存
  2. `chat_messages.topic_id` が 'reflection' で保存
  3. `journal_entries` テーブルに同じ内容が保存される
  4. `journal-reflect` Edge Function が呼ばれAI振り返りコメントが生成される
  5. AI振り返りコメントが `chat_messages` と `journal_entries.ai_reflection` の両方に保存される
  6. チャット画面に📝バッジ付きで振り返りメッセージが表示される

### AC-11: 画像を送信できる

- **Given:** ユーザーがチャット画面を開いている
- **When:** 入力エリアの「+」ボタンをタップし、写真を選択してプレビュー確認後に送信
- **Then:**
  1. 画像が Supabase Storage にアップロードされる
  2. `chat_messages` に画像URLが `metadata.attachments` として保存される
  3. チャット画面にサムネイル（最大幅70%、アスペクト比維持）が表示される
  4. サムネイルタップで全画面プレビュー（ピンチズーム対応）
  5. アップロード中はプログレスインジケーター表示

### AC-12: AIメッセージがマークダウンとしてレンダリングされる

- **Given:** AIからマークダウン形式のレスポンスを受信
- **When:** メッセージが表示される
- **Then:**
  1. 見出し（h1〜h3）、リスト（ol/ul）、コードブロック、インラインコード、太字、イタリック、リンクが正しくレンダリングされる
  2. ユーザーメッセージはプレーンテキストとして表示される（マークダウン解釈しない）
  3. リンクタップで外部ブラウザが開く

### AC-13: ユーザーがマークダウン記法で入力できる

- **Given:** ユーザーがメッセージ入力欄にマークダウン記法を入力
- **When:** メッセージを送信
- **Then:**
  1. `**太字**`、`*イタリック*`、`` `コード` ``、` ```コードブロック``` `、`- リスト` が送信後にレンダリングされる
  2. 入力中はプレーンテキストとして表示（リアルタイムプレビューなし）
  3. 送信後のユーザーメッセージバブル内でマークダウンがレンダリングされる

### AC-14: メッセージをコピー・選択できる

- **Given:** ユーザーがチャット画面でメッセージを閲覧している
- **When:** メッセージバブルを長押し
- **Then:**
  1. コンテキストメニューが表示される（コピー、返信、翻訳）
  2. 「コピー」でメッセージ全文がクリップボードにコピーされる
  3. テキスト選択してコピーも可能
  4. コードブロックには右上に「コピー」ボタンが表示される
  5. コードブロックの「コピー」ボタンタップでコード内容のみがクリップボードにコピーされる

### AC-15: 動画・音声をアップロードできる

- **Given:** ユーザーがチャット画面を開いている
- **When:** 入力エリアの「+」ボタンをタップ
- **Then:**
  1. アクションシートが表示される: 写真（カメラロール/カメラ）、ビデオ（カメラロール/カメラ）、音声（録音/ファイル選択）
  2. 選択したメディアが Supabase Storage にアップロードされる
  3. 動画: サムネイル + 再生ボタンで表示、タップでインラインプレビュー再生
  4. 音声: 波形 + 再生ボタンで表示、タップでインライン再生
  5. ファイルサイズ制限: 画像10MB、動画100MB、音声50MB
  6. 制限超過時はエラートースト「ファイルサイズが上限を超えています」表示

### AC-16: 未読/既読ステータスが表示される

- **Given:** AIからメッセージが届いている
- **When:** ユーザーがチャット画面を開いていない
- **Then:**
  1. タブバーのチャットアイコンに未読メッセージ数がバッジ表示される
  2. `chat_messages.is_read` が `false` のメッセージがカウントされる
  3. チャット画面を表示すると、表示範囲内のメッセージが自動的に既読（`is_read = true`, `read_at = NOW()`）に更新される
  4. バッジが未読数に応じてリアルタイム更新される

### AC-17: 最新メッセージに戻るボタンが表示される

- **Given:** ユーザーが過去のメッセージを閲覧するため上方向にスクロールしている
- **When:** 最新メッセージから一定距離（500px以上）スクロールした
- **Then:**
  1. 画面右下に「↓」FABボタンが表示される（フェードインアニメーション）
  2. 未読メッセージがある場合、FABにバッジ（未読数）が表示される
  3. FABタップで最新メッセージまでスムーズスクロール
  4. 最新メッセージ付近（500px以内）に戻るとFABが非表示になる

### AC-18: URLのOGPプレビューが表示される

- **Given:** メッセージ内にURLが含まれている
- **When:** メッセージが表示される
- **Then:**
  1. `fetch-ogp` Edge Function でURLのメタデータ（title, description, image）を取得
  2. メッセージバブルの下にOGPプレビューカード（タイトル、説明文、サムネイル画像）が表示される
  3. OGPカードタップで外部ブラウザでURLが開く
  4. OGP取得失敗時はURLをリンクテキストとして表示（カードなし）
  5. OGP取得結果はキャッシュされる（同一URLの再取得を防止）

### AC-19: メッセージを翻訳できる

- **Given:** ユーザーがチャット画面でメッセージを閲覧している
- **When:** メッセージバブルを長押しし、コンテキストメニューから「翻訳」を選択
- **Then:**
  1. `translate-message` Edge Function で翻訳が実行される
  2. 翻訳結果がメッセージバブルの下に折りたたみセクションとして表示される
  3. 対応言語: 日本語 ↔ 英語（ソース言語を自動検出）
  4. 翻訳済みのメッセージには「翻訳済み」ラベルが表示される
  5. 折りたたみをタップで開閉できる
  6. 将来的に対応言語を拡張可能な設計とする

---

## エッジケース

| ケース | 期待される動作 |
|--------|--------------|
| OpenClawインスタンスがダウン | フォールバック Edge Function チャット + 「ツイン再起動中」表示 |
| WebSocket接続タイムアウト (10s) | フォールバックモードに切替 + リトライをバックグラウンド継続 |
| Freeユーザーが上限到達 | ペイウォール表示、送信ボタン無効化 |
| 深夜のレート制限 | 連続送信10秒間隔制限（Free/Pro共通） |
| 長文AI応答 (3000文字超) | スクロール自動追従 |
| アプリがバックグラウンドに移行 | WebSocket切断、フォアグラウンド復帰時に再接続 |
| 複数デバイスから同時接続 | 最新のデバイスのみアクティブ、他は通知で案内 |
| gateway_token の期限切れ | Supabase から新しいトークンを再取得して再接続 |
| 画像アップロード中にネットワーク切断 | アップロード失敗トースト表示、リトライボタン付き |
| 動画ファイルサイズ超過（100MB超） | エラートースト「ファイルサイズが上限を超えています」、送信不可 |
| OGP取得対象URLがタイムアウト | URLをリンクテキストのみ表示（OGPカードなし） |
| 翻訳Edge Functionがタイムアウト | 「翻訳に失敗しました」表示、リトライボタン |
| 未対応の音声フォーマット | エラートースト「このファイル形式は対応していません」 |
| マークダウンのXSS攻撃パターン | サニタイズ処理でスクリプトタグ等を除去 |

---

## データ仕様

### chat_messages テーブル（Supabase）

Free/Pro どちらもメッセージを保存する。

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | PK |
| user_id | uuid | FK -> auth.users |
| role | text | `user` / `assistant` |
| content | text | メッセージ本文 |
| source | text | `edge_function` / `openclaw` |
| session_id | text | チャットセッションID |
| topic_id | text | トピックID（`daily`, `work`, `reflection`, `consultation`, DEFAULT: `daily`） |
| metadata | jsonb | ツール実行結果等の付加情報（nullable） |
| is_read | boolean | 既読フラグ（DEFAULT: false） |
| read_at | timestamptz | 既読日時（nullable） |
| created_at | timestamptz | 作成日時 |

**RLS ポリシー:** `user_id = auth.uid()` で本人のみアクセス可能。

### credits テーブル（Supabase）

Freeユーザーの日次チャット回数を管理する。`database.md` の `credits` テーブルを参照。

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | PK |
| user_id | uuid | FK -> profiles.id（UNIQUE） |
| daily_remaining | integer | 当日残りチャット回数（デフォルト3） |
| last_reset_at | date | 最終リセット日（日付変更時に3にリセット） |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

**日次リセット:** Edge Function内でチャット送信前に `last_reset_at < CURRENT_DATE` を判定し、リセット実行。

### OpenClawのメモリ

- OpenClaw 自体が会話コンテキストを管理
- Supabase 保存はメッセージのバックアップ・分析用途

---

## 日記統合仕様（Proユーザーのみ）

### コンセプト
チャット画面内で日記機能を統合。
日記は独立したタブではなく、**チャット履歴 = 日記履歴**として管理。
AIツインがチャット内で「今日はどうだった？」と定期的に聞き、その回答がジャーナルエントリーとして保存される。

### トリガー
AIツインが振り返りを促すタイミング:
1. **1日1回**: 最後のチャットから6時間以上経過している場合
2. **ユーザーの開始**: ユーザーが明示的に「振り返りしたい」等のキーワードを入力した場合
3. **定時**: 毎日22:00（ローカルタイム）にプッシュ通知で促す（オプション設定で有効化）

### データフロー

#### 振り返り開始
1. AIツインがチャット内で「今日はどうだった？」とメッセージを送る
2. このメッセージには `metadata.isJournalPrompt: true` フラグをセット
3. UIに📝バッジを表示（通常チャットと区別）

#### ユーザー回答
1. ユーザーが回答を入力（例: 「今日は仕事で成果が出て嬉しかった」）
2. `chat_messages` テーブルに通常通り保存、`metadata.isJournalEntry: true` フラグをセット
3. **同時に `journal_entries` テーブルにも保存**:
   ```sql
   INSERT INTO journal_entries (user_id, content, created_at)
   VALUES (auth.uid(), '[回答内容]', NOW());
   ```

#### AI振り返りコメント生成
1. ユーザー回答が保存されたら、`journal-reflect` Edge Function を呼び出し
2. Edge Function がAI振り返りコメントを生成（80〜150文字）
3. 生成された振り返りコメントを:
   - `chat_messages` に追加（`role: assistant`, `metadata.isJournalReflection: true`）
   - `journal_entries.ai_reflection` カラムに保存
4. チャット画面に振り返りコメントが表示される

### chat_messages のメタデータ拡張

```typescript
interface ChatMessageMetadata {
  isJournalPrompt?: boolean;      // AIがジャーナルを促すメッセージ
  isJournalEntry?: boolean;       // ユーザーのジャーナル回答
  isJournalReflection?: boolean;  // AIの振り返りコメント
  journalEntryId?: string;        // 対応する journal_entries.id
  // メディア添付
  attachments?: ChatAttachment[];
  // OGPプレビュー
  ogp?: OGPData[];
  // 翻訳
  translation?: {
    text: string;
    sourceLang: string;
    targetLang: string;
  };
  // 既存フィールド
  toolExecutionResult?: any;
}

interface ChatAttachment {
  type: 'image' | 'video' | 'audio';
  url: string;                     // Supabase Storage URL
  thumbnailUrl?: string;           // 動画サムネイルURL
  fileName: string;
  fileSize: number;                // バイト
  mimeType: string;
  duration?: number;               // 秒（動画・音声のみ）
  width?: number;                  // ピクセル（画像・動画のみ）
  height?: number;                 // ピクセル（画像・動画のみ）
}

interface OGPData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}
```

### journal_entries テーブルの役割

チャットから抽出されたジャーナルデータを保存。振り返りコメント・統計分析に使用。

| カラム | 内容 |
|--------|------|
| user_id | ユーザーID |
| content | ユーザーの振り返り回答（chat_messagesから複製） |
| ai_reflection | AIの振り返りコメント |
| created_at | 作成日時 |

### UI仕様

#### チャット画面の統合ビュー
- 通常のチャットメッセージと振り返りメッセージが混在
- 振り返り関連メッセージには📝バッジを左上に表示
- 振り返りメッセージのバブル背景色を薄いアクセントカラーに変更（視覚的区別）

#### 振り返り履歴の表示
- チャット履歴をスクロールすることで過去の振り返りも見返せる
- 振り返りメッセージのみフィルター表示する機能は Phase 2 で検討

#### Twin Info との連携
- Twin Info 画面（`app/(tabs)/twin.tsx`）で気分を記録すると、最新の `journal_entries.mood` が更新される
- チャット画面には反映されない（journal_entries のみ更新）

### Edge Function 連携

`supabase/functions/journal-reflect/index.ts` はチャット内でAIが振り返りを生成する際に内部的に呼び出される。
ユーザーから直接呼ぶことはない。

**入力:**
```json
{
  "userId": "uuid",
  "journalContent": "今日は仕事で成果が出て嬉しかった",
  "conversationHistory": [...] // 最近10件のチャット履歴
}
```

**出力:**
```json
{
  "reflection": "今日は成果が出て良かったね。達成感を感じられたのは、あなたの努力の証だよ。",
  "journalEntryId": "uuid"
}
```

### エッジケース

| ケース | 期待される動作 |
|--------|--------------|
| ユーザーが振り返りをスキップ | AIは再度促さない（その日は振り返りなし） |
| 振り返りプロンプトに対して短い回答（数文字） | AIは短い振り返りコメントを生成、journal_entries には保存される |
| 振り返りプロンプトに対して質問で返答 | AIは会話を続け、最終的な振り返りを抽出してジャーナル化 |
| Edge Function がタイムアウト | チャットには「振り返りを生成できませんでした」と表示、リトライボタン表示 |
| Proから Freeにダウングレード後 | 過去の振り返り履歴は読み取り専用で閲覧可能、新規作成は不可 |

---

## 状態管理（Zustand Store）

### chatStore

```typescript
interface ChatState {
  // メッセージ
  messages: ChatMessage[];
  isLoading: boolean;
  streamingContent: string;

  // 接続状態
  connectionMode: 'websocket' | 'edge_function' | 'disconnected';
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  reconnectAttempt: number;

  // Freeユーザー制限
  dailyUsage: number;
  dailyLimit: number;

  // 未読管理
  unreadCount: number;

  // スクロール
  showScrollToBottom: boolean;

  // アクション
  sendMessage: (content: string, attachments?: ChatAttachment[]) => Promise<void>;
  loadHistory: (limit?: number, offset?: number) => Promise<void>;
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  resetDailyUsage: () => void;
  markAsRead: (messageIds: string[]) => Promise<void>;
  translateMessage: (messageId: string) => Promise<void>;
  fetchOGP: (url: string) => Promise<OGPData | null>;
}
```

---

## 実装ファイル構成

```
src/
  features/
    chat/
      components/
        chat-message-list.tsx    # メッセージ一覧
        chat-input.tsx           # 入力欄
        chat-bubble.tsx          # メッセージバブル
        markdown-renderer.tsx    # マークダウンレンダリング
        media-attachment.tsx     # メディア添付表示（画像/動画/音声）
        media-picker.tsx         # メディア選択アクションシート
        ogp-preview-card.tsx     # OGPプレビューカード
        message-context-menu.tsx # 長押しコンテキストメニュー
        translation-view.tsx     # 翻訳結果折りたたみ表示
        scroll-to-bottom-fab.tsx # 最新メッセージに戻るFAB
        typing-indicator.tsx     # タイピング中表示
        connection-status.tsx    # WebSocket接続状態表示
      hooks/
        use-chat.ts              # チャット操作のメインhook
        use-websocket.ts         # WebSocket接続管理
        use-chat-history.ts      # 履歴読み込み
        use-streaming.ts         # ストリーミング応答処理
      stores/
        chat-store.ts            # Zustand store
      services/
        websocket-client.ts      # WebSocketクライアント
        edge-function-chat.ts    # Edge Function経由チャット
        chat-message-repo.ts     # メッセージの永続化
        media-upload.ts          # Supabase Storageへのメディアアップロード
        ogp-fetcher.ts           # OGPデータ取得・キャッシュ
      types/
        chat.ts                  # チャット関連の型定義
      __tests__/
        use-chat.test.ts
        websocket-client.test.ts
        edge-function-chat.test.ts
```

---

## 画面仕様

### チャット画面 (`app/(tabs)/index.tsx`)

- ヘッダー: AIツイン名 + 接続状態インジケーター
- メッセージ一覧: FlatList、下方向スクロール、最新メッセージが下
  - **日記統合ビュー**: 通常チャットと振り返りメッセージが混在
  - 振り返りメッセージには📝バッジを左上に表示
  - 振り返りメッセージのバブル背景色を薄いアクセントカラーに変更
- 入力欄: TextInput + 送信ボタン + 「+」メディアボタン、文字数カウンター（1000文字制限）
  - 「+」ボタン: メディア添付アクションシート（写真/ビデオ/音声）
  - マークダウン記法対応（送信後レンダリング、入力中はプレーンテキスト）
- メッセージバブル長押し: コンテキストメニュー（コピー、返信、翻訳）
  - コードブロック内に「コピー」ボタン
  - テキスト選択コピー対応
- AIメッセージ: マークダウンレンダリング（見出し、リスト、コードブロック、太字、リンク等）
- ユーザーメッセージ: マークダウンレンダリング（送信後）
- メディア表示:
  - 画像: サムネイル表示（タップで全画面プレビュー、ピンチズーム）
  - 動画: サムネイル + 再生ボタン（タップでインライン再生）
  - 音声: 波形 + 再生ボタン（タップでインライン再生）
- OGPプレビュー: URLを含むメッセージにカード表示（タイトル、説明、サムネイル）
- 翻訳: コンテキストメニューから翻訳 → メッセージ下に折りたたみ表示
- 最新メッセージに戻るFAB: 上方向スクロール時に「↓」ボタン表示（未読バッジ付き）
- 未読バッジ: タブバーに未読数表示、画面表示時に自動既読
- Freeユーザー: 残り回数バッジ表示
- ストリーミング中: タイピングインジケーター + deltaテキスト表示

### 初回チャット (`app/(onboarding)/meet-twin.tsx`)

- オンボーディング完了後に表示
- AIツインとの初めての会話を体験
- Edge Function 経由（この時点ではインスタンス未作成の可能性あり）

---

## メディアアップロード仕様

### Supabase Storage バケット

| バケット名 | 用途 | アクセス |
|-----------|------|---------|
| `chat-media` | チャット添付メディア（画像/動画/音声） | RLS: 本人のみ読み書き |

### ファイルパス規則

```
chat-media/{user_id}/{message_id}/{filename}
```

### ファイルサイズ制限

| 種類 | 上限 | 対応フォーマット |
|------|------|----------------|
| 画像 | 10MB | JPEG, PNG, GIF, WebP, HEIC |
| 動画 | 100MB | MP4, MOV, WebM |
| 音声 | 50MB | M4A, MP3, WAV, AAC |

### アップロードフロー

1. ユーザーが「+」ボタンからメディア選択
2. 選択後にプレビュー表示（画像: サムネイル、動画: 先頭フレーム、音声: 波形）
3. サイズチェック（超過時はエラートースト表示、送信不可）
4. Supabase Storage にアップロード（プログレスバー表示）
5. アップロード完了後、メッセージの `metadata.attachments` にURL等を格納して送信

---

## OGPプレビュー仕様

### fetch-ogp Edge Function

```
POST /functions/v1/fetch-ogp
Authorization: Bearer {supabase_jwt}
Content-Type: application/json
```

**リクエスト:**
```json
{
  "url": "https://example.com/article"
}
```

**レスポンス:**
```json
{
  "title": "記事タイトル",
  "description": "記事の説明文...",
  "image": "https://example.com/ogp.jpg",
  "url": "https://example.com/article"
}
```

**エラー:**
| HTTPステータス | 説明 |
|-------------|------|
| 400 | URLが不正 |
| 408 | OGP取得タイムアウト（5秒） |
| 500 | 内部エラー |

### キャッシュ

- OGP取得結果はSupabase `ogp_cache` テーブルにキャッシュ（TTL: 24時間）
- 同一URLの再取得を防止

---

## 翻訳仕様

### translate-message Edge Function

```
POST /functions/v1/translate-message
Authorization: Bearer {supabase_jwt}
Content-Type: application/json
```

**リクエスト:**
```json
{
  "messageId": "uuid",
  "text": "Hello, how are you?",
  "targetLang": "ja"
}
```

**レスポンス:**
```json
{
  "translatedText": "こんにちは、お元気ですか？",
  "sourceLang": "en",
  "targetLang": "ja"
}
```

### 対応言語

| 言語 | コード |
|------|--------|
| 日本語 | `ja` |
| 英語 | `en` |

- ソース言語は自動検出
- 将来的に対応言語を拡張可能な設計

### UI表示

- 翻訳結果はメッセージバブルの下に折りたたみセクションとして表示
- 初回表示時は展開状態、以降は折りたたみ
- 翻訳済みメッセージには「翻訳済み」ラベル表示
- 翻訳結果は `chat_messages.metadata.translation` に保存（再取得不要）

---

## テスト観点

### チャット機能
- [ ] Freeチャット: Edge Function 経由SSEストリーミング正常動作
- [ ] Proチャット: WebSocket接続 -> メッセージ送受信 -> ストリーミング表示
- [ ] 再接続: ネットワーク切断 -> 自動再接続 -> セッション復元
- [ ] フォールバック: OpenClaw 未起動時の Edge Function 切替
- [ ] 履歴: 50件読み込み -> スクロール -> 追加読み込み
- [ ] レート制限: Freeユーザー3回制限の正確なカウント
- [ ] メッセージ長制限: 1000文字超の入力が制限される
- [ ] バックグラウンド復帰: WebSocket再接続が正常に動作
- [ ] トークン期限切れ: 新トークン取得 -> 再接続

### 画像・メディア送信
- [ ] 画像選択: カメラロール/カメラから画像を選択できる
- [ ] 画像アップロード: Supabase Storage にアップロードされプログレス表示される
- [ ] 画像表示: サムネイル表示 -> タップで全画面プレビュー（ピンチズーム）
- [ ] 動画選択: カメラロール/カメラから動画を選択できる
- [ ] 動画表示: サムネイル + 再生ボタン -> タップでインライン再生
- [ ] 音声選択: 録音/ファイル選択で音声を添付できる
- [ ] 音声表示: 波形 + 再生ボタン -> タップでインライン再生
- [ ] サイズ制限: 画像10MB / 動画100MB / 音声50MB 超過でエラー
- [ ] アップロード失敗: エラートースト + リトライボタン

### マークダウン
- [ ] AIメッセージ: 見出し、リスト、コードブロック、太字、リンク等が正しくレンダリング
- [ ] ユーザーメッセージ: マークダウン記法が送信後にレンダリング
- [ ] コードブロック: 「コピー」ボタンでコード内容がコピーされる
- [ ] XSS対策: スクリプトタグ等がサニタイズされる

### コピー・コンテキストメニュー
- [ ] 長押し: コンテキストメニュー（コピー、返信、翻訳）が表示される
- [ ] コピー: メッセージ全文がクリップボードにコピーされる
- [ ] テキスト選択: 部分選択してコピーできる

### 未読/既読
- [ ] 未読バッジ: タブバーに未読メッセージ数が表示される
- [ ] 自動既読: チャット画面表示時に表示範囲のメッセージが既読になる
- [ ] バッジ更新: 既読後にバッジがリアルタイム更新される

### 最新メッセージに戻るボタン
- [ ] FAB表示: 上方向500px以上スクロールで「↓」ボタンが表示される
- [ ] FAB非表示: 最新メッセージ付近に戻ると非表示
- [ ] スクロール: FABタップで最新メッセージまでスムーズスクロール
- [ ] 未読バッジ: FABに未読数が表示される

### OGPプレビュー
- [ ] OGPカード: URLを含むメッセージにOGPプレビューカードが表示される
- [ ] OGPタップ: カードタップで外部ブラウザが開く
- [ ] OGP失敗: 取得失敗時はURLリンクテキストのみ表示
- [ ] OGPキャッシュ: 同一URLの再取得が防止される

### 翻訳
- [ ] 翻訳実行: コンテキストメニューから「翻訳」で翻訳結果が表示される
- [ ] 折りたたみ: 翻訳結果が折りたたみセクションで表示・開閉できる
- [ ] 言語自動検出: ソース言語が自動検出される
- [ ] 翻訳失敗: タイムアウト時に「翻訳に失敗しました」+ リトライボタン

### 日記統合機能（Proのみ）
- [ ] 振り返りプロンプト: 6時間経過後にAIが「今日はどうだった？」と聞く
- [ ] ジャーナル保存: 振り返り回答が `chat_messages` と `journal_entries` 両方に保存される
- [ ] AI振り返り生成: `journal-reflect` Edge Function が呼ばれ、振り返りコメントが生成される
- [ ] UIバッジ: 振り返りメッセージに📝バッジが表示される
- [ ] 統合ビュー: 通常チャットと振り返りが混在表示される
- [ ] 過去の振り返り: スクロールで過去の振り返り履歴が見返せる
- [ ] Freeダウングレード: Pro→Freeダウングレード後も過去の振り返りは読み取り専用で閲覧可能

---

## 非機能要件

| 項目 | 要件 |
|------|------|
| レスポンス速度 | 初回トークン表示まで 2秒以内（WebSocket）、3秒以内（Edge Function） |
| 再接続時間 | 初回再接続試行まで 1秒以内 |
| メッセージ保存 | 送受信完了後 1秒以内に Supabase へ保存 |
| オフライン対応 | 未送信メッセージをローカルキューに保持、復帰時に自動送信 |
| メモリ使用量 | 表示メッセージ100件超はリスト仮想化で対応 |

---

## 変更履歴

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| 2026-02-14 | ws:// → wss:// 全箇所変更 | セキュリティ: MVPでもTLS必須（Clarify Phase Q5決定）|
| 2026-02-14 | フォールバック復帰ポリシー追加 | エラーハンドリング明確化 |
| 2026-02-14 | ページネーション仕様追加（50件ずつ）| パフォーマンス |
| 2026-02-14 | Free上限到達UX詳細化 | UX曖昧さ解消 |
| 2026-02-14 | 振り返り回答文字数制限3,000文字 | スコープ明確化 |
| 2026-02-14 | journal_entries.mood参照削除 | mood_recordsがSSoT（Clarify Phase Q3決定）|
| 2026-02-15 | トピックタブ機能追加（#日常, #仕事, #振り返り, #相談）<br>chat_messages.topic_id カラム追記（DEFAULT: 'daily'）<br>AC-9→AC-10に変更、AC-9にトピック機能を追加<br>Slackライクメッセージ構造・日付セパレーター仕様追加 | V3 Liquid Glass: トピックタブ・メッセージ構造リデザイン | — |
| 2026-02-15 | 9要件追加: 画像送信(AC-11)、マークダウン表示(AC-12)、マークダウン入力(AC-13)、コピペ(AC-14)、動画・音声(AC-15)、未読/既読(AC-16)、最新メッセージFAB(AC-17)、OGP表示(AC-18)、翻訳(AC-19)。chat_messages に is_read/read_at カラム追加。メタデータに attachments/ogp/translation 追加。fetch-ogp/translate-message Edge Function追加。メディアアップロード仕様追加 | チャットリッチ化 | — |
