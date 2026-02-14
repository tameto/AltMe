# 05 — AIチャット仕様

## ステータス: DRAFT
- 作成日: 2026-02-14
- 最終更新: 2026-02-14
- 承認状態: 未承認
- 担当: Agent C (Core AI)

---

## 1. 概要

AIチャットはAltMeのコア機能。ユーザーの「もう一人の自分」として振る舞うAI分身との対話。
チャットを重ねるほどAI分身がユーザーを理解し、スイッチングコストが上がる設計。

---

## 2. チャット画面 — `(tabs)/index.tsx`

### 2.1 レイアウト

```
┌──────────────────────────────┐
│  {twinName}           ⚙️    │
│──────────────────────────────│
│                              │
│  ┌──────────────────┐        │
│  │ 🤖 おはよう！       │        │
│  │ 今日はどんな1日に   │        │
│  │ したい？             │        │
│  └──────────────────┘        │
│                              │
│         ┌──────────────────┐ │
│         │ 今日は会議が      │ │
│         │ 多くて大変かも... │ │
│         └──────────────────┘ │
│                              │
│  ┌──────────────────┐        │
│  │ 🤖 会議が多い日は    │        │
│  │ 疲れるよね。合間に   │        │
│  │ 少し深呼吸する時間   │        │
│  │ を作ってみたら？     │        │
│  └──────────────────┘        │
│                              │
│  [残り2回]  (Freeユーザー)   │
│                              │
│  ┌──────────────────────┐    │
│  │ メッセージを入力...    │ ➤ │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

### 2.2 UI要素

| 要素 | 仕様 |
|------|------|
| ヘッダー | AI分身の名前 + 設定アイコン |
| メッセージリスト | FlatList、新しいメッセージで自動スクロール |
| AIメッセージ | 左寄せ、アイコン付き、ストリーミング表示 |
| ユーザーメッセージ | 右寄せ、背景色付き |
| 入力欄 | TextInput + 送信ボタン。改行対応（3行まで拡張） |
| 残り回数表示 | Freeユーザーのみ表示。残り0で入力欄を無効化 |
| 上限到達時 | ペイウォール表示ボタンに切り替え |

---

## 3. AIチャットのシステムプロンプト

### 3.1 ベースプロンプト

```
あなたは「{twinName}」。{displayName}さんのAI分身です。

## あなたの性格
{personalityDescription}（性格診断結果から動的に生成）

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
```

### 3.2 コンテキスト構築

各チャットリクエストに以下のコンテキストを付与:

```typescript
const buildContext = (user: UserProfile, personality: PersonalityResult, recentMessages: ChatMessage[]): string => {
  return `
## ユーザー情報
- 名前: ${user.displayName}
- 年齢層: ${user.ageRange}

## 性格プロファイル
${personality.summary}

## 最近の会話（直近20件）
${formatMessages(recentMessages)}

## 今日の日付・時間帯
${getCurrentDatetime(user.timezone)}
  `;
};
```

### 3.3 会話コンテキストの上限

| 項目 | 値 |
|------|-----|
| コンテキストに含める過去メッセージ | 直近20件 |
| 1メッセージあたりの最大文字数 | 1,000文字 |
| システムプロンプト + コンテキスト上限 | 約2,000 tokens |
| AI応答の最大トークン | 500 tokens |

---

## 4. API仕様

### 4.1 チャット送信

```
POST /functions/v1/chat

Headers:
  Authorization: Bearer {supabase_jwt}

Request:
{
  "message": "今日は会議が多くて大変かも..."
}

Response (streaming):
data: {"delta": "会議", "isComplete": false}
data: {"delta": "が多い日", "isComplete": false}
data: {"delta": "は疲れるよね。", "isComplete": false}
...
data: {"delta": "", "isComplete": true, "tokensUsed": 150}
```

### 4.2 Edge Function内部処理

```
1. JWT検証 → ユーザーID取得
2. Entitlementチェック（Freeなら日次上限チェック）
3. ユーザーメッセージをDBに保存
4. 性格プロファイル取得
5. 直近20件のチャット履歴取得
6. システムプロンプト + コンテキスト構築
7. OpenAI API呼び出し（streaming）
8. ストリーミングレスポンスをクライアントに中継
9. 完了後、AIレスポンスをDBに保存
10. 使用トークン数を記録
```

### 4.3 エラーレスポンス

| HTTPステータス | エラーコード | 説明 |
|-------------|-----------|------|
| 401 | `unauthorized` | 未認証 |
| 403 | `chat_limit_reached` | 無料チャット上限到達 |
| 400 | `message_too_long` | メッセージが1,000文字超 |
| 429 | `rate_limited` | レートリミット（1分5回） |
| 500 | `ai_error` | OpenAI API エラー |
| 503 | `service_unavailable` | OpenAI APIダウン |

---

## 5. ストリーミング表示

### 5.1 UX仕様

- AIのレスポンスは文字が流れるように表示（タイプライター効果）
- レスポンス生成中はAIメッセージに「...」アニメーション表示
- ストリーミング中もユーザーはスクロール可能
- ストリーミング完了後にメッセージが確定

### 5.2 実装方針

```typescript
// Server-Sent Events (SSE) を使用
// Supabase Edge Function → EventSource → React Native

// React Nativeでの受信
const eventSource = new EventSource(url, { headers });
eventSource.onmessage = (event) => {
  const chunk: ChatStreamChunk = JSON.parse(event.data);
  appendToCurrentMessage(chunk.delta);
  if (chunk.isComplete) {
    finalizeMessage();
    eventSource.close();
  }
};
```

---

## 6. チャット上限管理

### 6.1 Freeユーザーの上限ロジック

```typescript
// 日次チャット回数のカウント
const getTodayChatCount = async (userId: string, timezone: string): Promise<number> => {
  // 1. ユーザーのタイムゾーンで「今日」の開始時刻を計算
  // 2. chat_messages テーブルから role='user' かつ created_at >= 今日開始 をカウント
  // 3. カウントを返す
};

// 上限チェック
const canSendMessage = (chatCount: number, isPro: boolean): boolean => {
  if (isPro) return true;
  return chatCount < FREE_DAILY_CHAT_LIMIT; // 3
};
```

### 6.2 上限到達時のUI

```
┌──────────────────────────────┐
│                              │
│  今日のチャットは終了です      │
│  明日またお話ししましょう！    │
│                              │
│  ┌──────────────────────┐    │
│  │ 🔓 無制限にする →     │    │
│  └──────────────────────┘    │
│                              │
│  次のリセット: あと {HH:MM}   │
│                              │
└──────────────────────────────┘
```

---

## 7. チャット履歴

### 7.1 データ取得

- 初回ロード: 直近50件
- スクロールで追加ロード: 50件ずつ（ページネーション）
- Freeユーザー: 直近7日分のみ表示

### 7.2 ローカルキャッシュ

- Zustand persist middleware で直近50件をキャッシュ
- オフライン時はキャッシュを表示（送信は不可）

---

## 8. 検証条件

- [ ] メッセージを送信するとAIが応答すること
- [ ] AIの応答がストリーミング表示されること
- [ ] Freeユーザーが1日3回まで送信できること
- [ ] 4回目の送信でエラー + ペイウォール表示されること
- [ ] Proユーザーが無制限に送信できること
- [ ] 日付変更後にFreeユーザーの回数がリセットされること
- [ ] AIの応答が性格診断結果を反映していること
- [ ] 過去の会話内容を踏まえた応答が返ること
- [ ] 1,000文字超のメッセージが拒否されること
- [ ] ネットワークエラー時にリトライ可能であること
- [ ] チャット履歴がスクロールで追加ロードされること
- [ ] オフライン時に過去のチャットが閲覧できること
