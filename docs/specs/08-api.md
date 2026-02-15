# 08 --- API設計（Supabase Edge Functions + 外部サービス連携）

## ステータス: DRAFT v2
- 作成日: 2026-02-14
- 最終更新: 2026-02-15
- 承認状態: 未承認
- 担当: Agent A (Foundation) / Agent B (Subscription) / Agent C (Core AI) / Agent D (Engagement)

---

## 1. 概要

バックエンドAPIはSupabase Edge Functions（Deno）で実装する。
OpenAI APIキーやDigitalOcean APIトークンをクライアントに露出させないため、AI関連・インフラ関連の呼び出しは全てEdge Function経由で行う。

外部サービスは以下の4つと連携する:
- **Supabase** --- BaaS (Auth + PostgreSQL + Realtime + Edge Functions)
- **OpenAI** --- AI応答生成 (GPT-4o-mini)
- **DigitalOcean** --- OpenClawインスタンスのインフラ管理
- **RevenueCat** --- 課金管理 (Webhook + SDK)

---

## 2. Edge Function一覧（13個）

| # | Function名 | メソッド | 認証 | 担当Agent | 状態 | 説明 |
|---|-----------|---------|------|----------|------|------|
| 1 | `chat` | POST | JWT | C | 既存 | FreeユーザーAIチャット（SSE） |
| 2 | `personality-analyze` | POST | JWT | C | 既存 | 性格診断AI分析 |
| 3 | `webhook-revenuecat` | POST | Webhook Secret | B | 更新 | RevenueCat Webhook受信 |
| 4 | `journal-reflect` | POST | JWT | D | 既存 | 日記AI振り返り生成 |
| 5 | `generate-insight` | POST | JWT / Cron | D | 既存 | ユーザー洞察生成 |
| 6 | `daily-notification` | POST | service_role | D | 更新 | 朝のPush通知送信（Cron） |
| 7 | `provision-openclaw` | POST | service_role | C | NEW | OpenClawインスタンス作成 |
| 8 | `destroy-openclaw` | POST | service_role | C | NEW | OpenClawインスタンス削除 |
| 9 | `health-check-openclaw` | POST | service_role | C | NEW | ヘルスチェック（Cron 5分） |
| 10 | `update-soul-md` | POST | JWT | C | NEW | SOUL.md再生成・更新 |
| 11 | `restart-openclaw` | POST | JWT | C | NEW | OpenClawインスタンス再起動 |
| 12 | `onboarding-chat` | POST | JWT | C | NEW | オンボーディング初回チャット |
| 13 | `generate-twin-conversation` | POST | JWT + Pro | C | NEW | AIツイン間会話生成 |

---

## 3. 共通仕様

### 3.1 認証パターン

3種類の認証パターンが存在する:

| パターン | 対象Function | ヘッダー |
|---------|-------------|---------|
| JWT認証 | chat, personality-analyze, journal-reflect, generate-insight, update-soul-md, restart-openclaw, onboarding-chat, generate-twin-conversation | `Authorization: Bearer {supabase_jwt}` |
| service_role認証 | provision-openclaw, destroy-openclaw, health-check-openclaw, daily-notification | `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}` |
| Webhook認証 | webhook-revenuecat | `Authorization: Bearer {REVENUECAT_WEBHOOK_SECRET}` |

```typescript
// JWT認証の共通パターン
const supabase = createSupabaseClient(req);
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) return unauthorized();
```

### 3.2 CORS設定

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

全Edge Functionの先頭で OPTIONS リクエストを処理:
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

### 3.3 エラーレスポンス形式

```json
{
  "error": "error_code",
  "message": "Human-readable error description",
  "details": "Optional technical details"
}
```

共通HTTPステータスコード:

| ステータス | 意味 | 使用場面 |
|-----------|------|---------|
| 200 | 成功 | 通常のレスポンス |
| 201 | 作成成功 | provision-openclaw |
| 400 | バリデーションエラー | リクエストボディ不正 |
| 401 | 認証失敗 | JWT/Secret不正 |
| 403 | 権限不足 | Proチェック失敗 |
| 404 | リソース未検出 | ユーザー/インスタンス不在 |
| 429 | レート制限 | restart-openclaw等 |
| 500 | 内部エラー | DB操作失敗等 |
| 502 | 外部APIエラー | DigitalOcean/OpenAI障害 |

### 3.4 レート制限

| Function | リミット |
|----------|---------|
| chat | 5 req/分/user |
| personality-analyze | 1 req/分/user |
| journal-reflect | 3 req/分/user |
| generate-insight | 2 req/分/user |
| restart-openclaw | 3 req/5分/user |
| onboarding-chat | 10 req/分/user |
| generate-twin-conversation | 5 req/時/user |

---

## 4. 各Function詳細

### 4.1 chat --- FreeユーザーAIチャット

FreeユーザーのAIチャット。OpenAI API経由でSSEストリーミング配信する。

```
POST /functions/v1/chat
Authorization: Bearer {jwt}
Content-Type: application/json
```

**リクエスト:**
```json
{
  "message": "こんにちは",
  "conversation_history": [
    { "role": "user", "content": "前のメッセージ" },
    { "role": "assistant", "content": "前の応答" }
  ]
}
```

**レスポンス（SSE text/event-stream）:**
```
data: {"type": "text_delta", "delta": "こん"}
data: {"type": "text_delta", "delta": "にちは！"}
data: {"type": "text_done", "content": "こんにちは！今日はどんなお手伝いができますか？"}
data: {"type": "usage", "remaining": 2}
data: [DONE]
```

**処理フロー:**
```
1. JWT認証チェック
2. メッセージバリデーション（1〜1,000文字）
3. サブスクチェック（Proの場合はOpenClaw WebSocket経由を案内）
4. クレジット残高チェック（Free: 1日3回制限、日次リセット）
5. クレジット消費（残高0なら拒否）
6. コンテキスト構築（profiles + personality_results + 直近20件chat_messages）
7. OpenAI API呼出（GPT-4o-mini, temperature: 0.8, max_tokens: 500, stream: true）
8. SSE形式でストリーミング配信
9. chat_messagesにuser/assistant両方を保存
```

### 4.2 personality-analyze --- 性格診断AI分析

```
POST /functions/v1/personality-analyze
Authorization: Bearer {jwt}
```

**リクエスト:**
```json
{
  "answers": [
    { "questionId": "q1", "answer": "A" },
    { "questionId": "q2", "answer": "B" },
    { "questionId": "q3", "answer": "A" },
    { "questionId": "q4", "answer": "B" },
    { "questionId": "q5", "answer": "C" }
  ]
}
```

**レスポンス:**
```json
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

### 4.3 webhook-revenuecat --- RevenueCat Webhook（更新済み）

RevenueCat Webhookを受信し、サブスク状態を更新する。OpenClawプロビジョニング/破棄トリガーを含む。

```
POST /functions/v1/webhook-revenuecat
Authorization: Bearer {REVENUECAT_WEBHOOK_SECRET}
```

**処理フロー（イベント別）:**
```
INITIAL_PURCHASE / TRIAL_STARTED:
  1. subscriptions テーブルを active/trial に更新
  2. provision-openclaw を非同期呼出

TRIAL_CONVERTED:
  1. subscriptions.status を active に更新

RENEWAL:
  1. subscriptions テーブルを active に更新
  2. provision-openclaw を非同期呼出（stoppedの場合のみ再作成）

CANCELLATION:
  1. subscriptions.status を cancelled に更新
  （OpenClawインスタンスは期限まで維持）

EXPIRATION:
  1. subscriptions.status を expired に更新
  2. destroy-openclaw を非同期呼出

BILLING_ISSUE:
  1. subscriptions.status を grace_period に更新
  （OpenClawインスタンスは維持）

NON_RENEWING_PURCHASE:
  1. クレジットパック購入処理
  2. credits テーブル残高加算
  3. credit_transactions に記録
```

**レスポンス:** 常に HTTP 200（RevenueCatのリトライ防止のため）

### 4.4 journal-reflect --- 日記AI振り返り

```
POST /functions/v1/journal-reflect
Authorization: Bearer {jwt}
```

**リクエスト:**
```json
{
  "entryId": "uuid",
  "content": "今日はバレンタインデー..."
}
```

**レスポンス:**
```json
{
  "reflection": "プレゼンお疲れ様でした。準備の過程で..."
}
```

振り返り文字数上限: 3,000文字

### 4.5 generate-insight --- ユーザー洞察生成

```
POST /functions/v1/generate-insight
Authorization: Bearer {jwt}
```

**トリガー:** 週次Cron or ユーザー手動リクエスト

### 4.6 daily-notification --- 朝のPush通知（更新済み）

```
POST /functions/v1/daily-notification
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
```

**トリガー:** Cron（毎朝9:00 JST）

**処理フロー:**
```
1. 現在UTC時刻で各タイムゾーンの朝9:00のユーザーを取得
2. ユーザーごとの通知設定（時間帯、On/Off）を考慮
3. Pro/Freeで通知内容を出し分け
4. Expo Push APIで通知送信
```

### 4.7 provision-openclaw --- OpenClawプロビジョニング（NEW）

OpenClawインスタンス（DigitalOcean Droplet）を作成し、起動する。

```
POST /functions/v1/provision-openclaw
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
```

**リクエスト:**
```json
{
  "user_id": "uuid"
}
```

**処理フロー:**
```
1. 入力バリデーション
2. 冪等性チェック（openclaw_instances で既存レコード確認）
   - running → 早期リターン（no-op）
   - provisioning → 早期リターン（二重作成防止）
   - stopped/error → 既存Droplet削除後、新規作成
3. ユーザーデータ取得
   - personality_results から Big Five スコア + サマリー
   - profiles から display_name, twin_name, locale
4. SOUL.md 生成 + gateway_token 生成（crypto.randomUUID）
5. DigitalOcean API: POST /v2/droplets
   - name: altme-{userId先頭8文字}
   - region: sgp1, size: s-1vcpu-1gb, image: docker-20-04
   - user_data: cloud-init スクリプト（Docker + OpenClaw自動起動）
6. openclaw_instances レコード挿入（status: provisioning）
7. health-check-openclaw が後続で running に遷移させる
```

**レスポンス（201）:**
```json
{
  "success": true,
  "instance_id": "uuid",
  "droplet_id": 123456789,
  "status": "provisioning"
}
```

### 4.8 destroy-openclaw --- OpenClawインスタンス削除（NEW）

```
POST /functions/v1/destroy-openclaw
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
```

**リクエスト:**
```json
{
  "user_id": "uuid"
}
```

**処理フロー:**
```
1. 入力バリデーション
2. openclaw_instances からレコード取得
   - レコードなし or destroying/stopped → 早期リターン（冪等性）
3. status を destroying に更新
4. DigitalOcean API: DELETE /v2/droplets/{droplet_id}
   - 404 = 既に削除済み → 成功扱い
5. openclaw_instances を更新:
   - status = stopped
   - ip_address = NULL, gateway_token = NULL
   - soul_md は保持（再プロビジョニング用）
```

### 4.9 health-check-openclaw --- ヘルスチェック（NEW）

全アクティブOpenClawインスタンスのヘルスチェックを実行する。

```
POST /functions/v1/health-check-openclaw
トリガー: Cron（5分間隔）
```

**処理フロー:**
```
1. openclaw_instances から status IN ('running', 'provisioning') を全件取得
2. 各インスタンスに対して並列実行:
   [provisioning の場合]
   a. 経過時間チェック（15分超 → status=error, error_message='Provisioning timeout'）
   b. DigitalOcean API でDroplet状態確認（IPアドレス解決含む）
   c. Droplet active → WebSocket接続テスト → 成功なら status=running

   [running の場合]
   a. WebSocket接続テスト（ws://{ip}:18789, タイムアウト5秒）
   b. 成功 → last_health_check 更新
   c. 15分以上連続失敗 → status=error
3. レスポンスに checked/healthy/unhealthy/transitioned を返却
```

**レスポンス:**
```json
{
  "checked": 15,
  "healthy": 13,
  "unhealthy": 1,
  "transitioned": 1,
  "results": [...]
}
```

### 4.10 update-soul-md --- SOUL.md更新（NEW）

ツイン名変更・性格診断やり直し時にSOUL.mdを再生成する。

```
POST /functions/v1/update-soul-md
Authorization: Bearer {jwt}
```

**処理フロー:**
```
1. JWT認証チェック（auth.uid() で本人確認）
2. profiles から display_name, twin_name, locale 取得
3. personality_results から最新の Big Five スコア取得
4. SOUL.md 再生成
5. openclaw_instances.soul_md を更新
6. インスタンスが running の場合:
   - restart-openclaw を呼出（SOUL.md 反映のため再起動）
7. インスタンスが存在しない場合:
   - upsert で soul_md を保存（次回プロビジョニング時に使用）
```

**レスポンス:**
```json
{
  "success": true,
  "message": "SOUL.md updated",
  "instanceStatus": "running"
}
```

### 4.11 restart-openclaw --- インスタンス再起動（NEW）

```
POST /functions/v1/restart-openclaw
Authorization: Bearer {jwt}
```

**処理フロー:**
```
1. JWT認証チェック
2. openclaw_instances からレコード取得
   - レコードなし → 404
   - stopped → 400（サブスク切れ）
   - provisioning / destroying → 400（操作不可）
3. レート制限チェック（5分間に3回以上 → 429）
4. status を provisioning に更新
5. DigitalOcean API: POST /v2/droplets/{id}/actions → type: reboot
6. health-check-openclaw が後続で running に遷移させる
```

**レスポンス:**
```json
{
  "success": true,
  "message": "OpenClaw instance restart initiated",
  "instance": { "status": "provisioning" }
}
```

### 4.12 onboarding-chat --- オンボーディング初回チャット（NEW）

OpenClawインスタンスがまだ存在しないオンボーディング中のチャット用。

```
POST /functions/v1/onboarding-chat
Authorization: Bearer {jwt}
```

**リクエスト:**
```json
{
  "message": "ユーザーのメッセージ",
  "twin_name": "ツイン名",
  "personality_data": {
    "personality_type": "INTJ",
    "traits": { ... }
  }
}
```

**レスポンス:**
```json
{
  "reply": "AIツインの応答",
  "turn_count": 1
}
```

**制限:** 最大メッセージ長500文字、レート制限10req/分、会話履歴はクライアント管理（最大5ターン）

### 4.13 generate-twin-conversation --- AIツイン間会話生成（NEW）

コミュニティ機能用。2つのAIツインの性格に基づいた会話を生成する。

```
POST /functions/v1/generate-twin-conversation
Authorization: Bearer {jwt}
Proチェック: 必須（Freeは403）
```

**リクエスト:**
```json
{
  "partner_user_id": "uuid"
}
```

**レスポンス:**
```json
{
  "conversation_id": "uuid",
  "messages": [
    { "role": "twin_a", "content": "こんにちは！", "timestamp": "..." },
    { "role": "twin_b", "content": "はじめまして！", "timestamp": "..." }
  ],
  "compatibility_score": 75
}
```

**制限:** 同じペアは24時間に1回のみ生成可能、最大10ターン

---

## 5. 外部サービス連携

### 5.1 DigitalOcean API

| 項目 | 内容 |
|------|------|
| ベースURL | `https://api.digitalocean.com/v2/` |
| 認証方式 | `Authorization: Bearer {DIGITALOCEAN_API_TOKEN}` |
| レート制限 | 5,000 req/hour |
| 環境変数 | `DIGITALOCEAN_API_TOKEN` |

**使用エンドポイント:**

| エンドポイント | 用途 | 呼出元 |
|--------------|------|--------|
| POST /v2/droplets | Droplet作成 | provision-openclaw |
| GET /v2/droplets/{id} | 状態確認 | health-check-openclaw |
| DELETE /v2/droplets/{id} | Droplet削除 | destroy-openclaw |
| POST /v2/droplets/{id}/actions | 再起動等 | restart-openclaw |

**Droplet仕様:**
- サイズ: `s-1vcpu-1gb`（$6/月）
- リージョン: `sgp1`（シンガポール）
- イメージ: `docker-20-04`
- 命名規則: `altme-{userId先頭8文字}`
- タグ: `altme`, `user-{userId}`

### 5.2 OpenClaw Gateway API

| 項目 | 内容 |
|------|------|
| プロトコル | WebSocket（TLS: wss://） |
| エンドポイント | `wss://{ip_address}:443`（nginx reverse proxy経由） |
| 内部ポート | 18789（OpenClaw Gateway） |
| 認証方式 | ハンドシェイク時 gateway_token 送信 |
| メッセージフォーマット | JSON |

**WebSocketメッセージ型:**

| メッセージ | 方向 | 説明 |
|-----------|------|------|
| connect | Client->Server | 接続ハンドシェイク（gateway_token送信） |
| connected | Server->Client | 接続成功（sessionId発行） |
| message | Client->Server | ユーザーメッセージ送信 |
| agent.text_delta | Server->Client | AI応答ストリーミング断片 |
| agent.text_done | Server->Client | AI応答完了 |
| health | 双方向 | ヘルスチェック |
| presence | Server->Client | オンライン状態通知 |
| error | Server->Client | エラー通知 |

**接続管理:**

| 項目 | 値 |
|------|-----|
| 接続タイムアウト | 10秒 |
| Ping間隔 | 30秒 |
| 再接続戦略 | Exponential backoff（1s -> 2s -> 4s -> ... -> 30s max） |
| 最大再接続回数 | 10回 |
| メッセージサイズ上限 | 64KB |

**エラーコード:**

| コード | 意味 |
|--------|------|
| AUTH_FAILED | 認証失敗 → トークン再取得 |
| RATE_LIMITED | レート制限 → 待機後リトライ |
| AGENT_ERROR | エージェントエラー → ユーザーに通知 |
| INTERNAL_ERROR | 内部エラー → 再接続 |
| SESSION_EXPIRED | セッション期限切れ → 再接続 |
| CONNECTION_TIMEOUT | 接続タイムアウト → 再接続スケジュール |
| MAX_RECONNECT | 最大再接続回数到達 → エラー画面表示 |

### 5.3 OpenAI API

| 項目 | 内容 |
|------|------|
| ベースURL | OpenAI SDK経由 |
| 認証方式 | `OPENAI_API_KEY` |
| 使用モデル | gpt-4o-mini |

**共通設定:**
```typescript
export const DEFAULT_MODEL = 'gpt-4o-mini';
export const DEFAULT_TEMPERATURE = 0.8;
export const MAX_TOKENS_CHAT = 500;
export const MAX_TOKENS_ANALYSIS = 1000;
export const MAX_TOKENS_REFLECTION = 300;
export const MAX_TOKENS_INSIGHT = 800;
```

### 5.4 RevenueCat

| 項目 | 内容 |
|------|------|
| Webhook認証 | `Authorization: Bearer {REVENUECAT_WEBHOOK_SECRET}` |
| SDK | RevenueCat SDK 8.x（クライアント側） |
| Entitlement名 | `pro` |
| 対応イベント | INITIAL_PURCHASE, TRIAL_STARTED, TRIAL_CONVERTED, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE, NON_RENEWING_PURCHASE |

---

## 6. 環境変数一覧

| 変数名 | 用途 | 設定場所 |
|--------|------|---------|
| `SUPABASE_URL` | Supabase プロジェクトURL | 自動設定 |
| `SUPABASE_SERVICE_ROLE_KEY` | service_roleキー | Supabase Secrets |
| `SUPABASE_ANON_KEY` | anonキー | アプリ環境変数 |
| `OPENAI_API_KEY` | OpenAI APIキー | Supabase Secrets |
| `DIGITALOCEAN_API_TOKEN` | DigitalOcean PAT | Supabase Secrets |
| `DIGITALOCEAN_SSH_KEY_FINGERPRINT` | SSH鍵フィンガープリント | Edge Function環境変数 |
| `REVENUECAT_WEBHOOK_SECRET` | Webhook認証シークレット | Supabase Secrets |
| `REVENUECAT_API_KEY` | RevenueCat APIキー | アプリ環境変数 |
| `EXPO_ACCESS_TOKEN` | Expo Push通知用トークン | Supabase Secrets |

---

## 7. エラーハンドリング方針

### 7.1 ネットワークエラー

| 対象 | リトライ | 間隔 | 最大回数 |
|------|---------|------|---------|
| Edge Function (5xx) | あり | Exponential backoff (1s, 2s, 4s) | 3回 |
| Edge Function (4xx) | なし | - | - |
| DigitalOcean API | あり | Exponential backoff | 3回 |
| OpenAI API | あり | Exponential backoff | 2回 |
| WebSocket切断 | あり | Exponential backoff (1s -> 30s max) | 10回 |

### 7.2 フォールバック

| 状況 | フォールバック |
|------|--------------|
| OpenClawインスタンス未起動 | Edge Function chat でAI応答を提供 |
| Gateway接続失敗 | Edge Function chat にフォールバック |
| personality_results未取得 | デフォルトSOUL.md/性格データで続行 |
| SOUL.md更新後の再起動失敗 | DB更新は成功、次回起動時に反映 |

---

## 8. 検証条件

- [ ] 全Edge Functionが認証なしでアクセスできないこと（各認証パターンで確認）
- [ ] chat FunctionがSSEストリーミングレスポンスを返すこと
- [ ] personality-analyze がJSON形式の分析結果を返すこと
- [ ] webhook-revenuecat が正しいSecretでのみアクセス可能なこと
- [ ] Webhookイベントがsubscriptionsテーブルに反映されること
- [ ] INITIAL_PURCHASE でprovision-openclawが呼び出されること
- [ ] EXPIRATION でdestroy-openclawが呼び出されること
- [ ] provision-openclaw が冪等に動作すること（二重作成されないこと）
- [ ] destroy-openclaw が冪等に動作すること（404でもエラーにならないこと）
- [ ] health-check-openclaw がprovisioning -> runningの遷移を正しく行うこと
- [ ] restart-openclaw のレート制限が5分3回で動作すること
- [ ] onboarding-chat がOpenClawなしで動作すること
- [ ] generate-twin-conversation がFreeユーザーを403で拒否すること
- [ ] 全Edge Functionのレートリミットが正しく動作すること
- [ ] OpenAI APIエラー時にグレースフルなエラーレスポンスが返ること
- [ ] DigitalOcean APIエラー時に適切なステータスコードが返ること
