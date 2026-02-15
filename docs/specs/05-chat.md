# 05 --- AIチャット仕様

## ステータス: DRAFT
- 作成日: 2026-02-14
- 最終更新: 2026-02-15
- 承認状態: 未承認
- 担当: Agent C (Core AI)

---

## 1. 概要

AIチャットはAltMeのコア機能。ユーザーの「もう一人の自分」として振る舞うAI分身との対話。
チャットを重ねるほどAI分身がユーザーを理解し、スイッチングコストが上がる設計。

**日記統合**: Proユーザーのチャット内で日記（振り返り）機能を統合。
AIツインが定期的に「今日はどうだった？」と聞き、回答をジャーナルエントリーとして保存し、AI振り返りコメントを生成する。

### 1.1 二層アーキテクチャ

```
[Freeユーザー]
  App --HTTPS/SSE--> Supabase Edge Function `chat` --API--> OpenAI GPT-4o mini

[Proユーザー]
  App --WebSocket(wss)--> nginx reverse proxy :443 --WebSocket--> OpenClaw Gateway :18789 --> Agent + SOUL.md
```

| 項目 | Free | Pro |
|------|------|-----|
| 通信方式 | Supabase Edge Function (SSE) | WebSocket (OpenClaw Gateway wss://) |
| チャット回数 | 1日3回まで | 無制限 |
| AIモデル | OpenAI GPT-4o mini | OpenClaw Agent + SOUL.md |
| 日記統合 | なし | あり |
| 文字数制限 | 1,000文字 | 1,000文字（通常）/ 3,000文字（振り返り回答） |

---

## 2. チャット画面 --- `(tabs)/index.tsx`

### 2.1 レイアウト

```
+------------------------------+
|  {ツイン名}           [状態]  |
|------------------------------|
|  [#日常] [#仕事] [#振り返り]  |  <-- トピックタブ
|  [#相談]                      |
|------------------------------|
|                              |
|  +------------------------+  |
|  | [AI]                    |  |
|  | おはよう！今日はどんな   |  |
|  | 1日にしたい？            |  |
|  +------------------------+  |
|                              |
|         +----------------+   |
|         | 今日は会議が     |   |
|         | 多くて大変かも...|   |
|         +----------------+   |
|                              |
|  +------------------------+  |
|  | [AI]                    |  |
|  | 会議が多い日は疲れるよ  |  |
|  | ね。合間に少し深呼吸す  |  |
|  | る時間を作ってみたら？  |  |
|  +------------------------+  |
|                              |
|  [残り2回] (Freeのみ)        |
|                              |
|  +--------------------+ [>]  |
|  | メッセージを入力...  |     |
|  +--------------------+      |
|  文字数: 245/1000            |
+------------------------------+
```

### 2.2 UI要素

| 要素 | 仕様 |
|------|------|
| ヘッダー | ツイン名 + 接続状態ドット（緑: connected / 黄: reconnecting / 赤: disconnected） |
| トピックタブ | `#日常` `#仕事` `#振り返り` `#相談` のglass pillタブ |
| メッセージリスト | FlatList (inverted)、下方向スクロール、最新メッセージが下 |
| AIメッセージ | 左寄せ、Surface背景、ストリーミング表示 |
| ユーザーメッセージ | 右寄せ、Primary背景 |
| 振り返りメッセージ | アクセント背景 + 左上に日記バッジ |
| 日付セパレーター | メッセージ間に日付変更時に表示 |
| 入力欄 | TextInput (multiline, 最大3行) + 送信ボタン |
| 文字数カウンター | 入力中のモードに応じて動的に変更（1000 or 3000） |
| 残り回数 | Freeユーザーのみ表示（「残り2/3」） |
| Freeバナー | 上限到達時「本日の無料チャットを使い切りました」+ 「Proにアップグレード」ボタン |

### 2.3 トピックタブ

Slackライクな複数セッション管理。

| トピック | キー | 説明 |
|---------|------|------|
| #日常 | `daily` | 日常の出来事、雑談（デフォルト） |
| #仕事 | `work` | 仕事・キャリア関連 |
| #振り返り | `reflection` | 1日の振り返り（Pro限定で自動生成も可） |
| #相談 | `consultation` | 悩み相談、メンタル系 |

- `chat_messages.topic_id` TEXT DEFAULT `'daily'` で管理
- タブ切替でメッセージフィルタ更新
- 新規メッセージのデフォルトトピックは前回選択したタブ

### 2.4 メッセージバブル仕様

| タイプ | 配置 | 背景色 | テキスト色 | 角丸 | 最大幅 |
|--------|------|--------|----------|------|--------|
| ユーザー（通常） | 右寄せ | #6C63FF | #FFFFFF | 16pt（左上左下右下）、4pt（右上） | 70% |
| AI（通常） | 左寄せ | #F8F9FA | #1A1A2E | 16pt（右上右下左下）、4pt（左上） | 70% |
| ユーザー（振り返り） | 右寄せ | #E8F4F8 | #1A1A2E | 同上 | 70% |
| AI（振り返り） | 左寄せ | #E8F4F8 | #1A1A2E | 同上 | 70% |

連続同一送信者のメッセージ間隔は4ptに縮小（コンパクトモード）。

---

## 3. Freeチャット（Edge Function）

### 3.1 エンドポイント

```
POST /functions/v1/chat
Authorization: Bearer {supabase_jwt}
Content-Type: application/json
```

### 3.2 リクエスト / レスポンス

```json
// Request
{ "message": "こんにちは" }

// Response (SSE stream)
data: {"delta": "こん", "isComplete": false}
data: {"delta": "にちは！", "isComplete": false}
data: {"delta": "", "isComplete": true}
```

### 3.3 内部処理フロー

```
1. JWT検証 -> ユーザーID取得
2. メッセージバリデーション（1,000文字上限）
3. レート制限チェック（1分5回）
4. Entitlementチェック（Freeなら日次上限チェック）
   - ユーザーのタイムゾーンで「今日」を判定
   - chat_messages テーブルで role='user' の当日カウント
5. ユーザーメッセージをDBに保存
6. 性格プロファイル取得（personality_results）
7. ユーザープロファイル取得（profiles: display_name, twin_name, timezone）
8. 直近20件のチャット履歴取得
9. システムプロンプト + コンテキスト構築
10. OpenAI API呼び出し（streaming）
11. ストリーミングレスポンスをクライアントに中継
12. 完了後、AIレスポンスをDBに保存
```

### 3.4 エラーレスポンス

| HTTPステータス | エラーコード | 説明 |
|-------------|-----------|------|
| 401 | `unauthorized` | 未認証 |
| 400 | `message_required` | メッセージ未入力 |
| 400 | `message_too_long` | 1,000文字超 |
| 403 | `chat_limit_reached` | 無料チャット上限到達 |
| 429 | `rate_limited` | レートリミット（1分5回） |
| 500 | `ai_error` | OpenAI API エラー |

### 3.5 レート制限

- Freeユーザー: 1日3回（ユーザーのタイムゾーンで日次リセット）
- 全ユーザー: 1分5回（連続送信防止）
- 上限到達時: HTTP 403 / HTTP 429 を返却

---

## 4. Proチャット（WebSocket / OpenClaw）

### 4.1 接続フロー

```
1. openclaw_instances テーブルから ip_address, gateway_token を取得
2. WebSocket接続開始: wss://{ip_address}:443（nginx経由、TLS暗号化）
3. connect ハンドシェイク送信
4. 接続成功レスポンス受信
5. メッセージ送受信開始
```

### 4.2 プロトコル

**ハンドシェイク（connect）:**
```json
// 送信
{
  "type": "connect",
  "params": {
    "auth": { "token": "{gateway_token}" },
    "deviceId": "{device_uuid}",
    "clientType": "mobile"
  }
}

// 受信（成功）
{
  "type": "connected",
  "sessionId": "{session_id}",
  "serverVersion": "1.0.0"
}

// 受信（失敗）
{
  "type": "error",
  "code": "AUTH_FAILED",
  "message": "Invalid gateway token"
}
```

**メッセージ送信:**
```json
{
  "type": "message",
  "content": "今日はこんなことがあったよ",
  "sessionId": "{current_session_id}"
}
```

**メッセージ受信（ストリーミング）:**
```json
// テキストデルタ（部分受信）
{
  "type": "agent",
  "event": "text_delta",
  "delta": "今日も",
  "sessionId": "{session_id}"
}

// テキスト完了
{
  "type": "agent",
  "event": "text_done",
  "content": "今日も頑張ったね！どんなことがあったか教えて。",
  "sessionId": "{session_id}"
}
```

### 4.3 再接続ポリシー

| 項目 | 値 |
|------|-----|
| 再接続方式 | Exponential backoff |
| 初回待機 | 1秒 |
| 最大待機 | 30秒 |
| 最大試行回数 | 10回 |
| 10回失敗後 | Edge Function フォールバックモードに切替 |

### 4.4 フォールバック復帰

- フォールバック中もバックグラウンドで5分間隔のWebSocket再接続を試行
- 再接続成功時、自動的にWebSocketモードに復帰
- 復帰時に「接続が回復しました」トースト表示
- フォールバック中の会話はEdge Function経由で保存、復帰後もシームレスに継続

---

## 5. AIシステムプロンプト

### 5.1 ベースプロンプト

```
あなたは「{twinName}」。{displayName}さんのAI分身です。

## あなたの性格
{personalitySummary}

性格特性スコア:
- 開放性: {openness}/100
- 誠実性: {conscientiousness}/100
- 外向性: {extraversion}/100
- 協調性: {agreeableness}/100
- 神経症傾向: {neuroticism}/100

## 振る舞いのルール
1. {displayName}さんの「もう一人の自分」として話す。他人ではなく分身
2. 共感と理解を最優先。アドバイスは求められた時だけ
3. 過去の会話を覚えていて、それを踏まえて話す
4. 1回のレスポンスは100〜200文字程度。短く温かく
5. 質問を投げかけて会話を続ける
6. 感情に名前をつけてあげる（「それは悔しかったね」等）
7. ユーザーの成長や変化に気づいたらポジティブに伝える

## やってはいけないこと
- 医療・法律・金融のアドバイス
- 自殺・自傷に関する相談への直接対応（適切な相談窓口を案内）
- ネガティブな評価や批判
- 過度に長い返答

## 現在の日時
{dateStr} {timeStr}
```

### 5.2 コンテキスト上限

| 項目 | 値 |
|------|-----|
| コンテキストに含める過去メッセージ | 直近20件 |
| 1メッセージあたりの最大文字数 | 1,000文字（通常）/ 3,000文字（振り返り） |
| システムプロンプト + コンテキスト上限 | 約2,000 tokens |
| AI応答の最大トークン | 500 tokens |

---

## 6. 日記統合仕様（Proユーザーのみ）

### 6.1 コンセプト

チャット画面内で日記機能を統合。
日記は独立したタブではなく、**チャット履歴 = 日記履歴**として管理。

### 6.2 振り返りトリガー

| トリガー | 条件 |
|---------|------|
| 時間経過 | 最後のチャットから6時間以上経過（1日1回まで） |
| ユーザー開始 | 「振り返りしたい」等のキーワード入力 |
| 定時通知 | 毎日22:00（ローカルタイム）プッシュ通知（オプション） |

### 6.3 データフロー

```
1. AIツインが「今日はどうだった？」とメッセージ送信
   -> chat_messages に metadata.isJournalPrompt: true で保存
   -> UIに日記バッジ表示

2. ユーザーが回答（文字数制限: 3,000文字）
   -> chat_messages に metadata.isJournalEntry: true で保存
   -> chat_messages.topic_id = 'reflection' で保存
   -> journal_entries テーブルにも同じ内容を保存

3. journal-reflect Edge Function を呼び出し
   -> AI振り返りコメント生成（80〜150文字）
   -> chat_messages に metadata.isJournalReflection: true で追加
   -> journal_entries.ai_reflection カラムに保存
```

### 6.4 メタデータ拡張

```typescript
interface ChatMessageMetadata {
  isJournalPrompt?: boolean;      // AIがジャーナルを促すメッセージ
  isJournalEntry?: boolean;       // ユーザーのジャーナル回答
  isJournalReflection?: boolean;  // AIの振り返りコメント
  journalEntryId?: string;        // 対応する journal_entries.id
}
```

### 6.5 journal-reflect Edge Function

```
POST /functions/v1/journal-reflect (内部呼び出し)

Request:
{
  "userId": "uuid",
  "journalContent": "今日は仕事で成果が出て嬉しかった",
  "conversationHistory": [...] // 最近10件
}

Response:
{
  "reflection": "今日は成果が出て良かったね。...",
  "journalEntryId": "uuid"
}
```

---

## 7. チャット履歴

### 7.1 ページネーション

| 項目 | 値 |
|------|-----|
| 初回ロード | 直近50件 |
| 追加ロード | 上方向スクロールで50件ずつ |
| 最古メッセージ到達 | 「これ以上メッセージはありません」表示 |
| 実装 | FlatList の `onEndReached`（inverted: true のため上方向） |

### 7.2 ローカルキャッシュ

- Zustand persist middleware で直近50件をキャッシュ
- オフライン時はキャッシュを表示（送信は不可）
- 未送信メッセージをローカルキューに保持、復帰時に自動送信

---

## 8. ストリーミング表示

### 8.1 UX仕様

- AIのレスポンスは文字が流れるように表示（タイプライター効果）
- レスポンス生成中はタイピングインジケーター（点滅カーソル、500ms間隔）表示
- ストリーミング中もユーザーはスクロール可能
- ストリーミング完了後にタイムスタンプ表示

### 8.2 実装方針

```
SSE（Free）: text_delta イベント受信 -> バブル内テキストに追加
WebSocket（Pro）: agent.text_delta イベント受信 -> バブル内テキストに追加
完了処理: text_done イベント受信 -> タイピングインジケーター消失 -> タイムスタンプ表示
```

---

## 9. チャット上限管理

### 9.1 Freeユーザーの日次チャット上限

```
日次チャット回数のカウント:
1. ユーザーのタイムゾーンで「今日」の開始時刻を計算
2. chat_messages テーブルで role='user' かつ created_at >= 今日開始 をカウント
3. カウント >= 3 で上限到達
```

### 9.2 上限到達後のUX

```
1. 3回目送信後、チャット画面上部に Freeバナー表示
   「本日の無料チャットを使い切りました」
2. 送信ボタン無効化（グレーアウト）
3. バナー内に「Proにアップグレード」ボタン配置
4. ボタンタップで (paywall)/ へ遷移
5. 翌日（ユーザーのタイムゾーンで0:00）にリセット、送信ボタン有効化
```

---

## 10. データ仕様

### 10.1 chat_messages テーブル

Free/Pro どちらもメッセージを保存する。

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | 主キー |
| user_id | UUID (FK) | auth.users 参照 |
| role | TEXT | `user` / `assistant` |
| content | TEXT | メッセージ本文 |
| source | TEXT | `edge_function` / `openclaw` |
| session_id | TEXT | チャットセッションID |
| topic_id | TEXT | トピックID（`daily`/`work`/`reflection`/`consultation`、DEFAULT: `daily`） |
| metadata | JSONB | 付加情報（nullable） |
| created_at | TIMESTAMPTZ | 作成日時 |

**RLS**: `user_id = auth.uid()` で本人のみアクセス可能。

### 10.2 credits テーブル

Freeユーザーの日次チャット回数管理。

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | 主キー |
| user_id | UUID (FK, UNIQUE) | profiles.id 参照 |
| daily_remaining | INTEGER | 当日残りチャット回数（デフォルト3） |
| last_reset_at | DATE | 最終リセット日 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**注意**: 実装上は `chat_messages` のカウントで上限判定しており、`credits` テーブルは使用していない。

---

## 11. 状態管理（Zustand Store）

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

## 12. エッジケース

| ケース | 期待される動作 |
|--------|--------------|
| OpenClawインスタンスダウン | フォールバックEdge Functionチャット + 「ツイン再起動中」表示 |
| WebSocket接続タイムアウト (10s) | フォールバックモード切替 + リトライをバックグラウンド継続 |
| Freeユーザー上限到達 | Freeバナー表示、送信ボタン無効化、ペイウォールボタン |
| 深夜のレート制限 | 連続送信10秒間隔制限（Free/Pro共通） |
| 長文AI応答 (3000文字超) | スクロール自動追従 |
| アプリバックグラウンド移行 | WebSocket切断、フォアグラウンド復帰時に再接続 |
| 複数デバイスから同時接続 | 最新のデバイスのみアクティブ、他は通知で案内 |
| gateway_token 期限切れ | Supabaseから新しいトークン再取得 → 再接続 |
| 振り返りプロンプトをスキップ | AIは再度促さない（その日は振り返りなし） |
| 振り返り回答が質問形式 | AIは会話を続け、最終的な振り返りを抽出してジャーナル化 |
| Pro → Free ダウングレード | 過去の振り返り履歴は読み取り専用で閲覧可能、新規作成不可 |

---

## 13. Free / Pro 差分まとめ

| 機能 | Free | Pro |
|------|------|-----|
| チャット回数 | 1日3回まで | 無制限 |
| 通信方式 | Edge Function (SSE) | WebSocket (OpenClaw) |
| 接続状態表示 | なし | 接続ドット（緑/黄/赤） |
| 残り回数バッジ | 表示 | 非表示 |
| 上限到達時 | Freeバナー + ペイウォールボタン | なし |
| 振り返り機能 | なし | あり（日記バッジ + 日記統合） |
| AI振り返りコメント | なし | あり（80〜150文字） |
| 文字数制限 | 1,000文字 | 1,000文字（通常）/ 3,000文字（振り返り） |
| 過去の振り返り閲覧 | 読み取り専用（Proで作成分） | 全て閲覧・作成可能 |
| トピックタブ | 全表示 | 全表示 |

---

## 14. 非機能要件

| 項目 | 要件 |
|------|------|
| レスポンス速度 | 初回トークン表示まで 2秒以内（WebSocket）、3秒以内（Edge Function） |
| 再接続時間 | 初回再接続試行まで 1秒以内 |
| メッセージ保存 | 送受信完了後 1秒以内に Supabase へ保存 |
| オフライン対応 | 未送信メッセージをローカルキューに保持、復帰時に自動送信 |
| メモリ使用量 | 表示メッセージ100件超はリスト仮想化で対応 |

---

## 15. 実装ファイル構成

```
app/
  (tabs)/
    index.tsx                    # チャット画面

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

supabase/
  functions/
    chat/
      index.ts                   # Freeチャット Edge Function
    journal-reflect/
      index.ts                   # 振り返りコメント生成 Edge Function
```

---

## 16. 検証条件

### チャット基本機能
- [ ] メッセージを送信するとAIが応答すること
- [ ] AIの応答がストリーミング表示されること
- [ ] 1,000文字超のメッセージが拒否されること
- [ ] チャット履歴が50件ずつページネーションで読み込まれること
- [ ] オフライン時に過去のチャットが閲覧できること

### Free制限
- [ ] Freeユーザーが1日3回まで送信できること
- [ ] 4回目の送信でFreeバナー + ペイウォールボタンが表示されること
- [ ] 翌日に回数がリセットされること

### Pro機能
- [ ] WebSocket経由でリアルタイム送受信できること
- [ ] ネットワーク切断 → 自動再接続が動作すること
- [ ] 10回再接続失敗 → Edge Functionフォールバックに切替ること
- [ ] フォールバック中のバックグラウンド再接続が5分間隔で試行されること

### トピックタブ
- [ ] 4つのトピックタブが表示されること
- [ ] タブタップで対応トピックのメッセージのみ表示されること
- [ ] `chat_messages.topic_id` が正しく保存されること

### 日記統合（Pro）
- [ ] 6時間経過後にAIが振り返りプロンプトを表示すること
- [ ] 振り返り回答が `chat_messages` と `journal_entries` 両方に保存されること
- [ ] AI振り返りコメントが生成されること
- [ ] 振り返りメッセージに日記バッジが表示されること
- [ ] Pro → Free ダウングレード後も過去の振り返りが読み取り専用で閲覧可能なこと

---

## 17. 変更履歴

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| 2026-02-14 | 初版作成 | --- |
| 2026-02-14 | ws:// -> wss:// 全箇所変更。フォールバック復帰ポリシー追加。ページネーション仕様追加。Free上限到達UX詳細化。振り返り回答文字数制限3,000文字 | セキュリティ + UX明確化 |
| 2026-02-15 | トピックタブ機能追加（#日常, #仕事, #振り返り, #相談）。chat_messages.topic_id カラム追記。Slackライクメッセージ構造・日付セパレーター仕様追加。日記統合仕様の詳細化 | V3 Liquid Glass: トピックタブ・メッセージ構造リデザイン |
| 2026-02-15 | 実装コードとの差分反映（Edge Function内部処理フロー、エラーコード、システムプロンプト構造） | Reconcile: 実装との同期 |
