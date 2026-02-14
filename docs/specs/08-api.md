# 08 — API設計（Supabase Edge Functions）

## ステータス: DRAFT
- 作成日: 2026-02-14
- 最終更新: 2026-02-14
- 承認状態: 未承認
- 担当: Agent A (Foundation) / Agent C (Core AI)

---

## 1. 概要

バックエンドAPIはSupabase Edge Functions（Deno）で実装。
OpenAI APIキーをクライアントに露出させないため、AI関連の呼び出しは全てEdge Function経由。

---

## 2. Edge Function一覧

| Function名 | メソッド | 認証 | 担当Agent | 説明 |
|------------|---------|------|----------|------|
| `chat` | POST | 必須 | Agent C | AIチャット（ストリーミング） |
| `personality-analyze` | POST | 必須 | Agent C | 性格診断分析 |
| `journal-reflect` | POST | 必須 | Agent D | 日記のAI振り返り生成 |
| `generate-insight` | POST | 必須 | Agent D | デイリー/月次洞察生成 |
| `webhook-revenuecat` | POST | Webhook Secret | Agent B | RevenueCat Webhook受信 |
| `daily-notification` | POST | Cron(内部) | Agent D | 朝の通知送信（cron） |

---

## 3. 共通仕様

### 3.1 認証

```typescript
// 全Edge Function共通の認証チェック（webhook除く）
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const getUserFromRequest = async (req: Request): Promise<string> => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('unauthorized');

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) throw new Error('unauthorized');
  return user.id;
};
```

### 3.2 エラーレスポンス形式

```json
{
  "error": {
    "code": "chat_limit_reached",
    "message": "Daily chat limit reached. Upgrade to Pro for unlimited chats."
  }
}
```

### 3.3 レートリミット

| Function | リミット |
|----------|---------|
| chat | 5 req/min/user |
| personality-analyze | 1 req/min/user |
| journal-reflect | 3 req/min/user |
| generate-insight | 2 req/min/user |

---

## 4. 各Function詳細

### 4.1 `chat` — AIチャット

```
POST /functions/v1/chat

Headers:
  Authorization: Bearer {jwt}
  Content-Type: application/json

Request Body:
{
  "message": string  // 1〜1,000文字
}

Response: text/event-stream (SSE)
data: {"delta":"こん","isComplete":false}
data: {"delta":"にちは","isComplete":false}
data: {"delta":"！","isComplete":false}
data: {"delta":"","isComplete":true,"messageId":"uuid","tokensUsed":150}
```

#### 内部処理フロー

```
1. 認証チェック
2. メッセージバリデーション（1〜1,000文字）
3. Entitlementチェック
   - Free: 当日のチャット回数 < 3 を確認
   - Pro: スキップ
4. ユーザーメッセージをchat_messagesに保存
5. コンテキスト構築
   a. profiles取得
   b. personality_results取得
   c. 直近20件のchat_messages取得
6. OpenAI API呼び出し（stream: true）
   - Model: gpt-4o-mini
   - Temperature: 0.8
   - Max tokens: 500
7. SSEでクライアントにストリーミング
8. 完了後、AIレスポンスをchat_messagesに保存
9. tokens_usedを記録
```

### 4.2 `personality-analyze` — 性格診断

```
POST /functions/v1/personality-analyze

Headers:
  Authorization: Bearer {jwt}
  Content-Type: application/json

Request Body:
{
  "answers": [
    { "questionId": "q1", "answer": "A" },
    { "questionId": "q2", "answer": "B" },
    { "questionId": "q3", "answer": "A" },
    { "questionId": "q4", "answer": "B" },
    { "questionId": "q5", "answer": "C" }
  ]
}

Response:
{
  "summary": "好奇心旺盛で...",
  "detailedAnalysis": "あなたのBig Five分析では...",
  "personalityTraits": {
    "openness": 85,
    "conscientiousness": 60,
    "extraversion": 70,
    "agreeableness": 75,
    "neuroticism": 40
  },
  "twinPersonality": "あなたの分身は好奇心旺盛で温かみのある性格..."
}
```

#### OpenAIプロンプト

```
以下の性格診断の回答を分析し、JSON形式で結果を返してください。

回答:
{answers}

出力形式:
{
  "summary": "3〜5文の性格サマリー（無料ユーザーに表示）",
  "detailedAnalysis": "10〜15文の詳細分析（有料ユーザーに表示）",
  "personalityTraits": {
    "openness": 0-100,
    "conscientiousness": 0-100,
    "extraversion": 0-100,
    "agreeableness": 0-100,
    "neuroticism": 0-100
  },
  "twinPersonality": "AI分身の性格設定（3〜5文）"
}
```

### 4.3 `journal-reflect` — 日記振り返り

```
POST /functions/v1/journal-reflect

Headers:
  Authorization: Bearer {jwt}
  Content-Type: application/json

Request Body:
{
  "entryId": "uuid",
  "content": "今日はバレンタインデー...",
  "mood": "good",
  "tags": ["恋愛", "イベント"]
}

Response:
{
  "reflection": "小さな幸せに気づけるの、素敵だね..."
}
```

#### Entitlementチェック
- Proユーザーのみ利用可能
- Freeユーザーは403エラー

### 4.4 `generate-insight` — 洞察生成

```
POST /functions/v1/generate-insight

Headers:
  Authorization: Bearer {jwt}
  Content-Type: application/json

Request Body:
{
  "type": "daily" | "monthly"
}

Response (daily):
{
  "insight": "今週は仕事関連の話題が多かったね...",
  "topics": [
    { "name": "仕事", "percentage": 45 },
    { "name": "健康", "percentage": 20 }
  ]
}

Response (monthly):
{
  "report": "2月のあなたは... (500〜800文字)",
  "creditsConsumed": 20
}
```

#### monthlyの場合のクレジットチェック
```
1. credits.balance >= 20 を確認
2. 足りなければ 402 Payment Required
3. 足りれば credit_transactions に消費記録 + balance減算
4. レポート生成
```

### 4.5 `webhook-revenuecat` — Webhook受信

```
POST /functions/v1/webhook-revenuecat

Headers:
  Authorization: Bearer {REVENUECAT_WEBHOOK_SECRET}
  Content-Type: application/json

Request Body: RevenueCat Webhook Event
  （イベント型の詳細は03-subscription.md セクション7を参照）

Response:
  200 OK
```

#### 処理フロー
```
1. Authorization headerでWebhook Secretを検証
2. イベントタイプで分岐
3. subscriptionsテーブルを更新
4. クレジット購入イベントの場合、creditsテーブルを更新
5. 200を返す（エラー時も200を返し、内部でログ記録）
```

### 4.6 `daily-notification` — 朝の通知

```
POST /functions/v1/daily-notification

Headers:
  Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}

（Supabase Cron Jobsから呼び出し、外部からは呼べない）
```

#### 処理フロー
```
1. 現在UTC時刻で各タイムゾーンの朝9:00のユーザーを取得
2. Proユーザーのみ対象（通知はPro特典）
3. 各ユーザーにパーソナライズされた朝メッセージを生成（短い）
4. Expo Push APIで通知送信
```

---

## 5. OpenAI API共通設定

```typescript
// supabase/functions/_shared/openai.ts

import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

export const DEFAULT_MODEL = 'gpt-4o-mini';
export const DEFAULT_TEMPERATURE = 0.8;
export const MAX_TOKENS_CHAT = 500;
export const MAX_TOKENS_ANALYSIS = 1000;
export const MAX_TOKENS_REFLECTION = 300;
export const MAX_TOKENS_INSIGHT = 800;
```

---

## 6. 環境変数

| 変数名 | 説明 | 設定場所 |
|--------|------|---------|
| `SUPABASE_URL` | Supabase URL | 自動設定 |
| `SUPABASE_SERVICE_ROLE_KEY` | サービスロールキー | Supabase Secrets |
| `OPENAI_API_KEY` | OpenAI APIキー | Supabase Secrets |
| `REVENUECAT_WEBHOOK_SECRET` | Webhook署名シークレット | Supabase Secrets |
| `EXPO_ACCESS_TOKEN` | Expo Push通知用トークン | Supabase Secrets |

---

## 7. 検証条件

- [ ] 全Edge Functionが認証なしでアクセスできないこと（webhook除く）
- [ ] chat Functionがストリーミングレスポンスを返すこと
- [ ] personality-analyze がJSON形式の分析結果を返すこと
- [ ] journal-reflect がFreeユーザーを拒否すること
- [ ] generate-insight の monthly がクレジットを消費すること
- [ ] クレジット不足時に402エラーが返ること
- [ ] webhook-revenuecat が正しいSecretでのみアクセス可能なこと
- [ ] Webhookイベントがsubscriptionsテーブルに反映されること
- [ ] レートリミットが正しく動作すること
- [ ] OpenAI APIエラー時にグレースフルなエラーレスポンスが返ること
