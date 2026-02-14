# AIチャット機能仕様書

## 基本情報

| 項目 | 内容 |
|------|------|
| 機能名 | AIチャット |
| 関連画面 | `app/(tabs)/index.tsx`（チャット画面）、`app/(onboarding)/meet-twin.tsx`（初回チャット） |
| 依存する機能 | 認証、OpenClawプロビジョニング、課金 |
| 依存される機能 | 日記、洞察 |

## 目的

ユーザーがAIツイン（OpenClaw）とリアルタイムでチャットできる。
Proユーザーは自分専用のOpenClawインスタンスとWebSocketで直接通信する。
Freeユーザーは Supabase Edge Function 経由で制限付きチャットを利用する。

---

## 二層アーキテクチャ

### Freeユーザー（1日3回制限）

- Supabase Edge Function `chat` 経由
- OpenAI GPT-4o mini 直接呼び出し
- SSE ストリーミング
- システムプロンプトに基本的なAIツインペルソナを埋め込み
- 既存実装をそのまま利用

```
[モバイルアプリ] --HTTPS/SSE--> [Supabase Edge Function `chat`] --API--> [OpenAI GPT-4o mini]
```

### Proユーザー（無制限）

- ユーザー専用 OpenClaw Gateway (`ws://{ip}:18789`) にWebSocket接続
- トークン認証 (`gateway_token`)
- OpenClawの SOUL.md に基づくパーソナライズされた応答
- リッチなコンテキスト管理（OpenClawが会話履歴を管理）
- ツール実行可能（将来拡張: メール作成、タスク自動化等）

```
[モバイルアプリ] --WebSocket--> [OpenClaw Gateway :18789] --内部--> [OpenClaw Agent + SOUL.md]
```

---

## WebSocket接続仕様

### 接続フロー

1. アプリ起動時、`openclaw_instances` テーブルから `ip_address`, `gateway_token` を取得
2. WebSocket接続を開始: `ws://{ip_address}:18789`
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

### レート制限

- 1日3回まで（UTC 0:00 リセット）
- `usage` イベントで残り回数を通知
- 上限到達時は HTTP 429 を返却

---

## ユーザーストーリー

| ID | ストーリー |
|----|-----------|
| US-1 | Freeユーザーとして、1日3回までAIツインと会話したい |
| US-2 | Proユーザーとして、無制限にAIツインと会話したい |
| US-3 | ユーザーとして、リアルタイムでストリーミング応答を見たい |
| US-4 | ユーザーとして、過去のチャット履歴を見返したい |
| US-5 | Proユーザーとして、ネットワーク切断時に自動再接続してほしい |

---

## 受け入れ条件

### AC-1: Freeユーザーが1日3回までチャットできる

- **Given:** 未課金ユーザーがチャット画面を開いている
- **When:** メッセージを送信
- **Then:** Supabase Edge Function 経由でAI応答がSSEストリーミングで表示される。3回目以降はペイウォールへ誘導

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

### AC-6: ストリーミング応答の表示

- **Given:** ユーザーがメッセージを送信
- **When:** AIが応答を生成中
- **Then:** テキストがdelta単位でリアルタイム表示、タイピングカーソル表示

### AC-7: メッセージ長制限

- **Given:** ユーザーがメッセージを入力中
- **When:** 1000文字を超える入力
- **Then:** 入力が制限される（1000文字で打ち止め）

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
| metadata | jsonb | ツール実行結果等の付加情報（nullable） |
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

  // アクション
  sendMessage: (content: string) => Promise<void>;
  loadHistory: (limit?: number, offset?: number) => Promise<void>;
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  resetDailyUsage: () => void;
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
- 入力欄: TextInput + 送信ボタン、文字数カウンター（1000文字制限）
- Freeユーザー: 残り回数バッジ表示
- ストリーミング中: タイピングインジケーター + deltaテキスト表示

### 初回チャット (`app/(onboarding)/meet-twin.tsx`)

- オンボーディング完了後に表示
- AIツインとの初めての会話を体験
- Edge Function 経由（この時点ではインスタンス未作成の可能性あり）

---

## テスト観点

- [ ] Freeチャット: Edge Function 経由SSEストリーミング正常動作
- [ ] Proチャット: WebSocket接続 -> メッセージ送受信 -> ストリーミング表示
- [ ] 再接続: ネットワーク切断 -> 自動再接続 -> セッション復元
- [ ] フォールバック: OpenClaw 未起動時の Edge Function 切替
- [ ] 履歴: 50件読み込み -> スクロール -> 追加読み込み
- [ ] レート制限: Freeユーザー3回制限の正確なカウント
- [ ] メッセージ長制限: 1000文字超の入力が制限される
- [ ] バックグラウンド復帰: WebSocket再接続が正常に動作
- [ ] トークン期限切れ: 新トークン取得 -> 再接続

---

## 非機能要件

| 項目 | 要件 |
|------|------|
| レスポンス速度 | 初回トークン表示まで 2秒以内（WebSocket）、3秒以内（Edge Function） |
| 再接続時間 | 初回再接続試行まで 1秒以内 |
| メッセージ保存 | 送受信完了後 1秒以内に Supabase へ保存 |
| オフライン対応 | 未送信メッセージをローカルキューに保持、復帰時に自動送信 |
| メモリ使用量 | 表示メッセージ100件超はリスト仮想化で対応 |
