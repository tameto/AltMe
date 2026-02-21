# 外部サービス連携仕様書

## 概要

AltMeアプリが連携する外部サービスのAPI仕様、認証方式、エンドポイント、データフォーマットを定義する。

---

## 1. DigitalOcean API

### 基本情報

| 項目 | 内容 |
|------|------|
| ベースURL | https://api.digitalocean.com/v2/ |
| 認証方式 | Bearer Token（Personal Access Token） |
| レート制限 | 5,000 req/hour |
| 環境変数 | `DIGITALOCEAN_API_TOKEN` |

### 認証ヘッダー
```
Authorization: Bearer {DIGITALOCEAN_API_TOKEN}
Content-Type: application/json
```

### 使用APIエンドポイント

#### POST /v2/droplets --- Droplet作成

Proユーザーの課金確認後に呼び出す。OpenClawインスタンス用のDropletを作成する。

**リクエスト:**
```json
{
  "name": "altme-{userIdの先頭8文字}",
  "region": "sgp1",
  "size": "s-1vcpu-1gb",
  "image": "docker-20-04",
  "ssh_keys": ["{SSH_KEY_FINGERPRINT}"],
  "user_data": "{cloud-initスクリプト}",
  "tags": ["altme", "user-{userId}"],
  "monitoring": true
}
```

**パラメータ詳細:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | YES | Droplet名。`altme-` + userIdの先頭8文字 |
| region | string | YES | リージョン。デフォルト `sgp1`（シンガポール） |
| size | string | YES | Dropletサイズ。`s-1vcpu-1gb`（$6/月） |
| image | string | YES | ベースイメージ。`docker-20-04` |
| ssh_keys | string[] | YES | SSH鍵フィンガープリント（管理用） |
| user_data | string | YES | cloud-initスクリプト（下記参照） |
| tags | string[] | YES | タグ。管理・検索用 |
| monitoring | boolean | NO | モニタリング有効化 |

**cloud-initスクリプト（user_data）:**
```yaml
#cloud-config
runcmd:
  - apt-get update -y
  - apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx
  - systemctl enable docker nginx
  - systemctl start docker nginx
  - mkdir -p /opt/openclaw
  - |
    cat > /opt/openclaw/docker-compose.yml << 'COMPOSE'
    version: '3.8'
    services:
      openclaw:
        image: openclaw/openclaw:latest
        ports:
          - "18789:18789"
        volumes:
          - ./SOUL.md:/app/SOUL.md
          - ./data:/app/data
        environment:
          - GATEWAY_TOKEN=${GATEWAY_TOKEN}
          - OPENAI_API_KEY=${OPENAI_API_KEY}
        restart: unless-stopped
    COMPOSE
  - echo "${SOUL_MD_CONTENT}" > /opt/openclaw/SOUL.md
  - export GATEWAY_TOKEN="${GATEWAY_TOKEN}"
  - export OPENAI_API_KEY="${OPENAI_API_KEY}"
  - cd /opt/openclaw && docker-compose up -d
  # nginx reverse proxy for wss://
  - |
    cat > /etc/nginx/sites-available/openclaw << 'NGINX'
    server {
      listen 443 ssl;
      server_name _;

      # Self-signed cert initially, replaced by Let's Encrypt later
      ssl_certificate /etc/nginx/ssl/selfsigned.crt;
      ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

      location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
      }
    }
    NGINX
  - mkdir -p /etc/nginx/ssl
  - openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/selfsigned.key -out /etc/nginx/ssl/selfsigned.crt -subj '/CN=localhost'
  - ln -sf /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/
  - rm -f /etc/nginx/sites-enabled/default
  - nginx -t && systemctl reload nginx
  # cloud-init スクリプト内の機密情報を削除
  - rm -f /var/lib/cloud/instance/user-data.txt
```

**レスポンス（201 Created）:**
```json
{
  "droplet": {
    "id": 123456789,
    "name": "altme-a1b2c3d4",
    "status": "new",
    "networks": {
      "v4": [
        {
          "ip_address": "203.0.113.1",
          "type": "public"
        }
      ]
    },
    "region": { "slug": "sgp1" },
    "size": { "slug": "s-1vcpu-1gb" },
    "tags": ["altme", "user-a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"]
  }
}
```

**エラーハンドリング:**
| ステータス | 原因 | 対応 |
|-----------|------|------|
| 401 | トークン無効 | 環境変数を確認 |
| 422 | パラメータ不正 | リクエスト内容を確認 |
| 429 | レート制限 | リトライ（exponential backoff） |
| 500 | DO障害 | リトライ + アラート通知 |

---

#### GET /v2/droplets/{id} --- Droplet状態確認

プロビジョニング中のポーリングおよびヘルスチェックで使用。

**レスポンス（200 OK）:**
```json
{
  "droplet": {
    "id": 123456789,
    "status": "active",
    "networks": {
      "v4": [
        {
          "ip_address": "203.0.113.1",
          "type": "public"
        }
      ]
    }
  }
}
```

**statusの値:**
| status | 意味 |
|--------|------|
| new | 作成中 |
| active | 稼働中 |
| off | 停止中 |
| archive | アーカイブ済み |

---

#### DELETE /v2/droplets/{id} --- Droplet削除

解約時またはインスタンス破棄時に呼び出す。

**レスポンス:** 204 No Content

**注意事項:**
- 削除は非同期。レスポンス後もDropletが完全に削除されるまで数秒かかる
- 存在しないDroplet IDで呼び出した場合は404が返る（冪等性のため404は成功扱いとする）

---

#### POST /v2/droplets/{id}/actions --- Droplet操作

インスタンスの起動・停止・再起動に使用。

**リクエスト（再起動の例）:**
```json
{
  "type": "reboot"
}
```

**使用するアクション:**
| type | 用途 |
|------|------|
| power_on | 停止中のDropletを起動 |
| power_off | Dropletを停止（強制） |
| shutdown | Dropletをグレースフルに停止 |
| reboot | Dropletを再起動 |

**レスポンス（201 Created）:**
```json
{
  "action": {
    "id": 987654321,
    "status": "in-progress",
    "type": "reboot"
  }
}
```

---

### コスト管理

| 項目 | 内容 |
|------|------|
| Dropletコスト | $6/月（s-1vcpu-1gb） |
| 転送量 | 1TB/月（超過 $0.01/GB） |
| 想定最大Droplet数 | 100（MRR ¥500,000 / ¥4,980 ≒ 100ユーザー） |
| 想定最大インフラコスト | $600/月（100 x $6） |

---

## 2. OpenClaw Gateway API

### 基本情報

| 項目 | 内容 |
|------|------|
| プロトコル | WebSocket（TLS暗号化） |
| エンドポイント | `wss://{ip_address}:443`（nginx reverse proxy経由） |
| 認証方式 | ハンドシェイク時に `gateway_token` を送信 |
| メッセージフォーマット | JSON |

### 接続フロー

```
[アプリ] → [Supabase Edge Function] → gateway_token取得
    |
    v
[アプリ] → WebSocket接続 → wss://{ip}:443（TLS） → [nginx reverse proxy] → localhost:18789
    |
    v
[connect イベント送信] → { "type": "connect", "params": { "auth": { "token": "{gateway_token}" }, "deviceId": "{uuid}" } }
    |
    v
[サーバー] → { "type": "connected", "sessionId": "..." }
```

### メッセージフォーマット

#### connect --- 接続確立

**クライアント → サーバー:**
```json
{
  "type": "connect",
  "params": {
    "auth": {
      "token": "{gateway_token}"
    },
    "deviceId": "{device_uuid}",
    "clientType": "mobile"
  }
}
```

**サーバー → クライアント（成功）:**
```json
{
  "type": "connected",
  "sessionId": "{session_id}",
  "serverVersion": "1.0.0"
}
```

**サーバー → クライアント（認証失敗）:**
```json
{
  "type": "error",
  "code": "AUTH_FAILED",
  "message": "Invalid gateway token"
}
```

---

#### message --- ユーザーメッセージ送信

**クライアント → サーバー:**
```json
{
  "type": "message",
  "content": "明日の会議の準備を手伝って",
  "sessionId": "{current_session_id}"
}
```

---

#### agent.text_delta --- AI応答ストリーミング断片

**サーバー → クライアント:**
```json
{
  "type": "agent",
  "event": "text_delta",
  "delta": "もちろん、",
  "sessionId": "{session_id}"
}
```
```json
{
  "type": "agent",
  "event": "text_delta",
  "delta": "会議の準備をお手伝いします。",
  "sessionId": "{session_id}"
}
```

---

#### agent.text_done --- AI応答完了

**サーバー → クライアント:**
```json
{
  "type": "agent",
  "event": "text_done",
  "content": "もちろん、会議の準備をお手伝いします。まず、会議のアジェンダを確認しましょう。",
  "sessionId": "{session_id}"
}
```

---

#### health --- ヘルスチェック

**クライアント → サーバー:**
```json
{
  "type": "health"
}
```

**サーバー → クライアント:**
```json
{
  "type": "health",
  "status": "ok",
  "uptime_seconds": 86400,
  "memory_usage_mb": 256
}
```

---

#### presence --- オンライン状態

**サーバー → クライアント（自動送信）:**
```json
{
  "type": "presence",
  "status": "online",
  "last_active": "2026-02-14T10:30:00Z"
}
```

### 接続管理

| 項目 | 内容 |
|------|------|
| 接続タイムアウト | 10秒 |
| Ping間隔 | 30秒 |
| 再接続戦略 | Exponential backoff（1s, 2s, 4s, 8s, 最大30s） |
| 最大再接続回数 | 10回（超過時はエラー画面表示） |
| メッセージサイズ上限 | 64KB |

### エラーコード

| コード | 意味 | 対応 |
|--------|------|------|
| AUTH_FAILED | 認証失敗 | トークン再取得 |
| RATE_LIMITED | レート制限 | 待機後リトライ |
| AGENT_ERROR | エージェントエラー | ユーザーに通知 |
| INTERNAL_ERROR | 内部エラー | 再接続 |
| SESSION_EXPIRED | セッション期限切れ | 再接続 |

---

## 3. Supabase Edge Functions

### 一覧

| # | 関数名 | 状態 | 概要 | トリガー |
|---|--------|------|------|---------|
| 1 | chat | 既存 | Freeユーザー用チャット処理 | クライアント呼出 |
| 2 | personality-analyze | 既存 | 性格診断の分析処理 | クライアント呼出 |
| 3 | webhook-revenuecat | 既存 → 更新 | RevenueCat Webhook受信 | RevenueCat Webhook |
| 4 | journal-reflect | 既存 | 日記のAI振り返り生成 | クライアント呼出 |
| 5 | generate-insight | 既存 | ユーザー洞察の生成 | Cron / クライアント呼出 |
| 6 | daily-notification | 既存 → 修正 | Push通知送信 | Cron（毎日） |
| 7 | **provision-openclaw** | NEW | OpenClawインスタンス作成 | webhook-revenuecat |
| 8 | **destroy-openclaw** | NEW | OpenClawインスタンス削除 | webhook-revenuecat |
| 9 | **health-check-openclaw** | NEW | ヘルスチェック実行 | Cron（5分間隔） |
| 10 | **update-soul-md** | NEW | SOUL.md更新（ツイン名変更等） | クライアント呼出 |
| 11 | **restart-openclaw** | NEW | OpenClawインスタンス再起動 | クライアント呼出 |
| 12 | **onboarding-chat** | NEW | オンボーディング中の初回チャット | クライアント呼出 |
| 13 | **generate-twin-conversation** | NEW | 2つのAIツイン間の会話生成 | クライアント呼出 |
| 14 | **upload-media** | NEW | メディアファイルアップロード | クライアント呼出 |
| 15 | **fetch-ogp** | NEW | OGPメタデータ取得 | クライアント呼出 |
| 16 | **translate-message** | NEW | メッセージ翻訳 | クライアント呼出 |
| 17 | **send-push-notification** | NEW | プッシュ通知送信 | 内部呼出 |
| 18 | **trigger-community-conversation** | NEW | コミュニティ自律会話トリガー | Cron（毎時） |
| 19 | **create-community** | NEW | コミュニティ作成 | クライアント呼出 |

---

### 3-1. chat（既存）

Freeユーザー向けのチャット処理。OpenAI API経由でAI応答を生成し、SSEストリーミングで配信する。

**エンドポイント:** `POST /functions/v1/chat`

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

**レスポンス（SSE ストリーミング）:**
```
Content-Type: text/event-stream

data: {"type": "text_delta", "delta": "こん"}
data: {"type": "text_delta", "delta": "にちは！"}
data: {"type": "text_done", "content": "こんにちは！今日はどんなお手伝いができますか？"}
data: {"type": "usage", "remaining": 2}
data: [DONE]
```

**処理フロー:**
1. 認証チェック（JWT検証）
2. サブスク状態チェック（Proの場合はOpenClaw経由を案内）
3. クレジット残高チェック（日次リセット含む）
4. クレジット消費（残高0なら拒否）
5. OpenAI API呼出
6. SSE形式でストリーミング配信
7. chat_messagesにuser/assistantの両方を保存
8. ストリーミング完了

---

### 3-2. personality-analyze（既存）

性格診断の回答をAIで分析する。

**エンドポイント:** `POST /functions/v1/personality-analyze`

**リクエスト:**
```json
{
  "answers": [
    { "question_id": "q1", "answer": "選択肢A" },
    { "question_id": "q2", "answer": "自由記述テキスト" }
  ]
}
```

**レスポンス:**
```json
{
  "personality_type": "INTJ",
  "analysis": {
    "summary": "...",
    "strengths": ["..."],
    "communication_style": "..."
  },
  "soul_md_draft": "# SOUL.md\n..."
}
```

---

### 3-3. webhook-revenuecat（既存 → 更新）

RevenueCat Webhookを受信し、サブスク状態を更新する。**OpenClawプロビジョニングトリガーを追加。**

**エンドポイント:** `POST /functions/v1/webhook-revenuecat`

**認証:** RevenueCat Webhook Authorization Header で検証

**リクエスト（RevenueCatから送信）:**
```json
{
  "api_version": "1.0",
  "event": {
    "id": "evt_abc123",
    "type": "INITIAL_PURCHASE",
    "app_user_id": "{supabase_user_id}",
    "product_id": "pro_monthly",
    "entitlement_ids": ["pro"],
    "period_type": "NORMAL",
    "purchased_at_ms": 1707900000000,
    "expiration_at_ms": 1710578400000,
    "environment": "PRODUCTION"
  }
}
```

**処理フロー（更新後）:**
```
1. Authorization Header 検証
2. イベント冪等性チェック（event.id で重複排除）
3. app_user_id → Supabase user_id のマッピング
4. イベント種別に応じた処理:
   ├─ INITIAL_PURCHASE / RENEWAL:
   │   a. subscriptions テーブルを active に更新
   │   b. provision-openclaw Edge Function を呼出（非同期）
   │
   ├─ EXPIRATION / CANCELLATION:
   │   a. subscriptions テーブルを expired に更新
   │   b. destroy-openclaw Edge Function を呼出（非同期）
   │
   ├─ BILLING_ISSUE:
   │   a. subscriptions テーブルを grace_period に更新
   │   b. ユーザーに決済エラー通知
   │
   └─ PRODUCT_CHANGE:
       a. subscriptions テーブルの plan を更新
       b. OpenClawインスタンスは維持（再作成しない）
5. HTTP 200 返却（リトライ防止）
```

---

### 3-4. journal-reflect（既存）

日記エントリに対するAI振り返りを生成する。

**エンドポイント:** `POST /functions/v1/journal-reflect`

**リクエスト:**
```json
{
  "entry_id": "uuid",
  "content": "今日は大事なプレゼンがあった..."
}
```

**レスポンス:**
```json
{
  "reflection": "プレゼンお疲れ様でした。準備の過程で..."
}
```

---

### 3-5. generate-insight（既存）

ユーザーのチャット履歴・日記・気分記録から洞察を生成する。

**エンドポイント:** `POST /functions/v1/generate-insight`

**トリガー:** 週次Cron or ユーザーの手動リクエスト

---

### 3-6. daily-notification（既存 → 修正）

毎日のプッシュ通知を送信する。Expo Notifications使用。

**トリガー:** Cron（毎朝9:00 JST）

**修正内容:**
- Expo Push APIへの実際の送信処理を実装
- ユーザーごとの通知設定（時間帯、On/Off）を考慮
- Pro/Freeで通知内容を出し分け

---

### 3-7. provision-openclaw（NEW）

OpenClawインスタンス（DigitalOcean Droplet）を作成し、起動する。

**エンドポイント:** `POST /functions/v1/provision-openclaw`

**認証:** service_role キーまたは内部呼出のみ（外部公開しない）

**リクエスト:**
```json
{
  "user_id": "uuid",
  "plan": "monthly"
}
```

**処理フロー:**
```
1. 入力バリデーション
2. 既存インスタンスチェック
   └─ 既に running なら早期リターン（冪等性）
   └─ stopped/error なら既存レコードを更新して再作成
3. gateway_token を生成（crypto.randomUUID()）
4. SOUL.md を取得
   └─ personality_results から最新の分析結果を取得
   └─ 未設定の場合はデフォルトSOUL.mdを使用
5. openclaw_instances にレコードをUPSERT（status='provisioning'）
6. DigitalOcean API: POST /v2/droplets でDroplet作成
   └─ user_data にcloud-initスクリプトを設定
   └─ GATEWAY_TOKEN, OPENAI_API_KEY, SOUL.md を埋め込み
7. Droplet IDとIPアドレスを取得
   └─ IPはDroplet作成直後は未割当のため、ポーリングで取得（最大60秒）
8. openclaw_instances を更新（droplet_id, ip_address, status='running'）
9. ヘルスチェック実行（OpenClaw Gatewayの応答を確認）
   └─ 応答なしの場合はstatus='provisioning' のまま
   └─ health-check-openclaw が後続で確認する
```

**レスポンス:**
```json
{
  "success": true,
  "instance": {
    "id": "uuid",
    "droplet_id": 123456789,
    "ip_address": "203.0.113.1",
    "status": "running"
  }
}
```

**エラーハンドリング:**
| エラー | 対応 |
|--------|------|
| DigitalOcean API障害 | status='error', error_message設定、アラート通知 |
| Droplet作成タイムアウト | リトライ（最大3回） |
| IPアドレス未割当タイムアウト | status='provisioning' のまま、Cronで再チェック |
| SOUL.md生成失敗 | デフォルトSOUL.mdで続行 |

**環境変数:**
- `DIGITALOCEAN_API_TOKEN` — DigitalOcean PAT
- `DIGITALOCEAN_SSH_KEY_FINGERPRINT` — SSH鍵フィンガープリント
- `OPENAI_API_KEY` — OpenClaw内部で使用するOpenAI APIキー

---

### 3-8. destroy-openclaw（NEW）

OpenClawインスタンス（DigitalOcean Droplet）を停止・削除する。

**エンドポイント:** `POST /functions/v1/destroy-openclaw`

**認証:** service_role キーまたは内部呼出のみ

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
   └─ レコードなし or status='stopped' なら早期リターン（冪等性）
3. openclaw_instances.status を 'destroying' に更新
4. DigitalOcean API: DELETE /v2/droplets/{droplet_id}
   └─ 404の場合は既に削除済みとして成功扱い
5. openclaw_instances を更新:
   └─ status = 'stopped'
   └─ droplet_id = NULL
   └─ ip_address = NULL
   └─ gateway_token = NULL（セキュリティのためクリア）
   └─ soul_md は保持（再プロビジョニング時に復元するため）
6. subscriptions.status を 'expired' に更新
```

**レスポンス:**
```json
{
  "success": true,
  "message": "OpenClaw instance destroyed"
}
```

**エラーハンドリング:**
| エラー | 対応 |
|--------|------|
| DigitalOcean API障害 | リトライ（最大3回、exponential backoff） |
| Droplet削除タイムアウト | status='destroying' のまま、Cronで再チェック |
| DBレコードなし | 正常終了（冪等性） |

---

### 3-9. health-check-openclaw（NEW）

全アクティブOpenClawインスタンスのヘルスチェックを実行する。

**トリガー:** Cron（5分間隔）

**認証:** service_role キー

**処理フロー:**
```
1. openclaw_instances から status IN ('running', 'provisioning') のレコードを全件取得
2. 各インスタンスに対して並列実行:
   a. WebSocket接続を試行（ws://{ip}:18789）
   b. health メッセージを送信
   c. 応答を確認（タイムアウト: 10秒）
3. 結果に応じて更新:
   ├─ 応答あり:
   │   └─ last_health_check = now()
   │   └─ status = 'running'（provisioningから遷移）
   │   └─ error_message = NULL
   │
   ├─ 応答なし（status='provisioning'）:
   │   └─ created_at から10分以上経過 → status = 'error', error_message = 'Provisioning timeout'
   │   └─ 10分以内 → そのまま（起動待ち）
   │
   └─ 応答なし（status='running'）:
       └─ 連続3回失敗 → status = 'error', error_message = 'Health check failed'
       └─ 3回未満 → last_health_check は更新しない
4. status='error' のインスタンスについてアラート通知
5. status='destroying' で30分以上経過したインスタンスを強制クリーンアップ
```

**レスポンス:**
```json
{
  "checked": 15,
  "healthy": 13,
  "unhealthy": 1,
  "provisioning": 1,
  "errors": [
    {
      "user_id": "uuid",
      "droplet_id": 123456789,
      "error": "Health check failed (3 consecutive failures)"
    }
  ]
}
```

---

## 受け入れ条件

### AC-1: DigitalOcean Dropletが正しく作成される

**Given** ユーザーがProプランを購入し、`provision-openclaw` が呼び出される
**When** DigitalOcean API にDroplet作成リクエストが送信される
**Then**
- Dropletが `altme-{userId先頭8文字}` の名前で作成される
- リージョンが `sgp1` である
- サイズが `s-1vcpu-1gb` である
- イメージが `docker-20-04` である
- タグに `altme` と `user-{userId}` が設定される
- cloud-initスクリプトによりOpenClawが自動起動する
- `openclaw_instances` テーブルに `droplet_id`、`ip_address` が記録される

**エッジケース:**
- DigitalOcean APIが一時的に利用不可の場合、リトライされること
- リージョンが満杯の場合、代替リージョンにフォールバックすること（将来対応）
- Droplet作成後にIPアドレスの割当に時間がかかる場合、ポーリングで取得すること

**テスト観点:**
- DigitalOcean APIをモックしてDroplet作成リクエストの内容を検証
- cloud-initスクリプトの内容が正しいことを確認
- IPアドレスのポーリングロジックをテスト（即時割当 / 遅延割当のケース）

---

### AC-2: OpenClaw Gatewayに正常に接続できる

**Given** OpenClawインスタンスが `running` 状態で、`gateway_token` が設定されている
**When** アプリからWebSocket接続を開始し、`connect` イベントで `gateway_token` を送信する
**Then**
- サーバーから `connected` イベントが返される
- `session_id` が発行される
- 以降のメッセージ送受信が可能になる

**Given** 無効な `gateway_token` でWebSocket接続を試みる
**When** `connect` イベントを送信する
**Then**
- サーバーから `error` イベント（code: `AUTH_FAILED`）が返される
- WebSocket接続が切断される

**エッジケース:**
- ネットワーク切断時に自動再接続されること
- 再接続時に新しいsession_idが発行されること
- 同一ユーザーの複数端末からの同時接続が許可されること（または制限されること、要件に応じて）

**テスト観点:**
- WebSocket接続の確立・切断を検証
- 認証成功・失敗のケースを検証
- ストリーミング応答（text_delta → text_done）の順序を検証
- 大量メッセージ送信時のパフォーマンスを検証

---

### AC-3: Webhook処理が正しく動作する

**Given** RevenueCatからWebhookイベントが送信される
**When** `webhook-revenuecat` Edge Functionがイベントを受信する
**Then**

**INITIAL_PURCHASE の場合:**
- `subscriptions.status` が `active` に更新される
- `subscriptions.plan` が購入したプランに更新される
- `provision-openclaw` が非同期で呼び出される
- HTTP 200が返される

**EXPIRATION の場合:**
- `subscriptions.status` が `expired` に更新される
- `destroy-openclaw` が非同期で呼び出される
- HTTP 200が返される

**BILLING_ISSUE の場合:**
- `subscriptions.status` が `grace_period` に更新される
- ユーザーに決済エラーのPush通知が送信される
- OpenClawインスタンスは維持される（即時停止しない）
- HTTP 200が返される

**PRODUCT_CHANGE の場合:**
- `subscriptions.plan` のみが更新される
- OpenClawインスタンスは再作成されない
- HTTP 200が返される

**エッジケース:**
- Authorization Headerが不正な場合、HTTP 401を返すこと
- 不明なイベントタイプの場合、HTTP 200を返して無視すること（エラーにしない）
- `app_user_id` に対応するユーザーが存在しない場合、HTTP 200を返してログ出力

**テスト観点:**
- 各イベントタイプのペイロードを送信し、DB更新を確認
- Authorization Header検証のテスト
- Edge Function呼出の非同期処理が正しくトリガーされることを確認

---

### AC-4: ヘルスチェックが異常を検知して対応する

**Given** `health-check-openclaw` がCronで5分間隔で実行される
**When** あるインスタンスが3回連続でヘルスチェックに失敗する（計15分以上無応答）
**Then**
- そのインスタンスの `status` が `error` に更新される
- `error_message` に `Health check failed (3 consecutive failures)` が設定される
- アラート通知が送信される（管理者向け）

**Given** `provisioning` 状態のインスタンスが10分以上経過している
**When** ヘルスチェックが実行される
**Then**
- `status` が `error` に更新される
- `error_message` に `Provisioning timeout` が設定される

**Given** `destroying` 状態のインスタンスが30分以上経過している
**When** ヘルスチェックが実行される
**Then**
- DigitalOcean APIで再度Droplet削除を試行する
- 成功した場合、`status` を `stopped` に更新する
- `droplet_id`、`ip_address`、`gateway_token` をクリアする

**エッジケース:**
- ヘルスチェック自体がタイムアウトした場合（Edge Functionの実行時間制限）
- 大量のインスタンスを並列チェックする場合のレート制限
- DigitalOcean APIのレート制限に達した場合

**テスト観点:**
- 正常応答するインスタンスの `last_health_check` が更新されることを確認
- 連続失敗カウントのロジックを検証
- `provisioning` → `error` の遷移条件をテスト
- `destroying` の強制クリーンアップをテスト

---

### AC-5: Dropletが正しく削除される

**Given** ユーザーのサブスクリプションが期限切れになり、`destroy-openclaw` が呼び出される
**When** DigitalOcean APIでDroplet削除リクエストが送信される
**Then**
- Dropletが削除される（HTTP 204）
- `openclaw_instances.status` が `stopped` に更新される
- `droplet_id`、`ip_address`、`gateway_token` がNULLに設定される
- `soul_md` は保持される（再プロビジョニング時に復元するため）

**Given** Dropletが既に存在しない状態で `destroy-openclaw` が呼び出される
**When** DigitalOcean APIが404を返す
**Then**
- エラーにならず正常終了する（冪等性）
- `openclaw_instances.status` が `stopped` に更新される

**テスト観点:**
- DigitalOcean APIをモックして削除リクエストを検証
- 404レスポンス時の正常終了を確認
- `soul_md` が保持されていることを確認
- 削除後にWebSocket接続が切断されることを確認

---

### 3-10. update-soul-md（NEW）

SOUL.mdの内容を更新する（ツイン名変更、性格診断やり直し時）。

**エンドポイント:** `POST /functions/v1/update-soul-md`

**認証:** Bearer Token（Supabase JWT）

**リクエスト:**
```json
{
  "user_id": "uuid",
  "twin_name": "新しいツイン名",
  "mbti_type": "INTJ"
}
```

**処理フロー:**
```
1. 認証チェック（auth.uid() = user_id）
2. personality_results から最新の分析結果を取得
3. profiles.mbti_type を更新（指定された場合）
4. SOUL.mdを再生成（新しいツイン名 + 性格データ + MBTI情報）
5. openclaw_instances.soul_md を更新
6. インスタンスが running の場合:
   a. WebSocket経由でSOUL.md更新コマンドを送信（対応していればホットリロード）
   b. 非対応の場合、Dropletにファイルを書き込み → OpenClaw再起動
6. インスタンスが running 以外の場合:
   a. DBのみ更新（次回起動時にSOUL.md反映）
```

**レスポンス:**
```json
{
  "success": true,
  "message": "SOUL.md updated"
}
```

**エラーハンドリング:**
| エラー | 対応 |
|--------|------|
| インスタンス未作成 | DBのみ更新、成功として返却 |
| WebSocket通信失敗 | DB更新は成功、SOUL.mdの反映は次回起動時 |
| personality_results未取得 | デフォルトSOUL.mdで更新 |

---

### 3-11. restart-openclaw（NEW）

OpenClawインスタンスを再起動する（エラー復旧用）。

**エンドポイント:** `POST /functions/v1/restart-openclaw`

**認証:** Bearer Token（Supabase JWT）

**リクエスト:**
```json
{
  "user_id": "uuid"
}
```

**処理フロー:**
```
1. 認証チェック（auth.uid() = user_id）
2. openclaw_instances からレコード取得
   └─ レコードなし → エラー返却
   └─ status = 'stopped' → エラー（サブスク切れ）
3. レート制限チェック（5分以内に3回以上 → 拒否）
4. openclaw_instances.status を 'provisioning' に更新
5. DigitalOcean API: POST /v2/droplets/{id}/actions → type: 'reboot'
6. ヘルスチェック（最大120秒ポーリング）
   └─ 成功 → status = 'running'
   └─ タイムアウト → status = 'error', error_message = 'Restart timeout'
```

**レスポンス:**
```json
{
  "success": true,
  "instance": {
    "status": "running"
  }
}
```

**エラーハンドリング:**
| エラー | 対応 |
|--------|------|
| レート制限到達 | HTTP 429、`retryAfter: 300` |
| DigitalOcean API障害 | status='error'、リトライ案内 |
| 再起動タイムアウト（120秒） | status='error'、サポート案内 |

---

## 環境変数一覧

| 変数名 | 用途 | 設定場所 |
|--------|------|---------|
| `SUPABASE_URL` | Supabase プロジェクトURL | Edge Function環境変数 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_roleキー | Edge Function環境変数（シークレット） |
| `SUPABASE_ANON_KEY` | Supabase anonキー | アプリ環境変数 |
| `DIGITALOCEAN_API_TOKEN` | DigitalOcean PAT | Edge Function環境変数（シークレット） |
| `DIGITALOCEAN_SSH_KEY_FINGERPRINT` | SSH鍵フィンガープリント | Edge Function環境変数 |
| `OPENAI_API_KEY` | OpenAI APIキー（OpenClaw内部使用） | Edge Function環境変数（シークレット） |
| `REVENUECAT_WEBHOOK_AUTH_KEY` | RevenueCat Webhook認証キー | Edge Function環境変数（シークレット） |
| `REVENUECAT_API_KEY` | RevenueCat API キー | アプリ環境変数 |
| `EXPO_PUSH_TOKEN` | Expo Push通知トークン | Edge Function環境変数 |

---

### 3-12. onboarding-chat（NEW）

オンボーディング中の初回チャット（meet-twin.tsx）で使用。OpenClawインスタンスがまだ存在しないため、Edge Function経由でOpenAI APIを呼び出す。

**エンドポイント:** `POST /functions/v1/onboarding-chat`

**認証:** Bearer Token（Supabase JWT）

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

**処理フロー:**
```
1. 認証チェック（JWT検証）
2. personality_resultsから最新の分析結果を取得
3. ツイン名と性格データをシステムプロンプトに組み込み
4. OpenAI API呼出（GPT-4o mini）
   - システムプロンプト: "あなたは{twin_name}です。性格は{personality_data}に基づきます。"
   - 温度: 0.8（自然な会話のため）
5. レスポンス返却
   - chat_messagesには保存しない（オンボーディング中のため）
   - 会話履歴はクライアント側で管理（最大5ターン）
```

**エラーハンドリング:**
| エラー | 対応 |
|--------|------|
| OpenAI API障害 | リトライ（最大2回）、失敗時はデフォルトメッセージ返却 |
| personality_results未取得 | デフォルト性格データで続行 |
| リクエストボディ不正 | HTTP 400、バリデーションエラー返却 |

**制限:**
- オンボーディング中のみ使用（subscription_status不問）
- 最大メッセージ長: 500文字
- レート制限: ユーザーあたり10req/分

---

### 3-13. generate-twin-conversation（NEW）

コミュニティ機能用。2つのAIツインの会話を生成する。

**エンドポイント:** `POST /functions/v1/generate-twin-conversation`

**認証:** Bearer Token（Supabase JWT）+ Pro Entitlementチェック

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
    {
      "role": "twin_a",
      "content": "こんにちは！",
      "timestamp": "2026-02-14T10:30:00Z"
    },
    {
      "role": "twin_b",
      "content": "はじめまして！",
      "timestamp": "2026-02-14T10:30:05Z"
    }
  ],
  "compatibility_score": 75
}
```

**処理フロー:**
```
1. 認証チェック（JWT検証）
2. Proチェック
   - RevenueCat Entitlement "pro" が有効か確認
   - Freeユーザーの場合はHTTP 403返却
3. initiator_user_idのpersonality_resultsを取得
4. partner_user_idのtwin_profiles_publicから性格データを取得
   - twin_profiles_publicは公開プロフィールテーブル（RLSで閲覧制御）
5. 両方のツインの性格に基づいたシステムプロンプトを構築
   - Twin A: {initiator_twin_name}、性格: {initiator_personality}
   - Twin B: {partner_twin_name}、性格: {partner_personality}
6. OpenAI API（GPT-4o）で5往復程度の会話を生成
   - プロンプト: "2人のAIツインが初めて会話するシーンを生成してください"
   - 出力形式: JSON（role/content/timestampの配列）
7. 相性スコアを計算（Big Fiveの類似度ベース）
   - 各次元の差の絶対値を算出 → 平均 → 100点満点に変換
   - 例: |O1-O2| + |C1-C2| + |E1-E2| + |A1-A2| + |N1-N2| / 5 → スコア化
8. twin_conversationsテーブルに保存
   - initiator_user_id, partner_user_id, messages, compatibility_score
   - created_at（自動）
9. レスポンス返却
```

**エラーハンドリング:**
| エラー | 対応 |
|--------|------|
| Proチェック失敗 | HTTP 403、"Pro subscription required" |
| partner_user_idが存在しない | HTTP 404、"Partner user not found" |
| personality_results未取得 | デフォルト性格データで続行 |
| OpenAI API障害 | リトライ（最大2回）、失敗時はHTTP 500 |
| 同じペアの会話が既に存在 | 既存のconversation_idを返却（冪等性） |

**制限:**
- Proユーザーのみ
- レート制限: ユーザーあたり5req/時間
- 同じペアの会話は24時間に1回のみ生成可能（キャッシュ活用）
- 最大会話ターン数: 10ターン

**DBスキーマ（新規テーブル）:**
```sql
CREATE TABLE twin_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL,
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(initiator_user_id, partner_user_id, DATE(created_at))
);

-- RLS
ALTER TABLE twin_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
ON twin_conversations FOR SELECT
USING (
  auth.uid() = initiator_user_id
  OR auth.uid() = partner_user_id
);
```

---

### 3-14. upload-media（NEW）

メディアファイル（画像・動画・音声）をSupabase Storageにアップロードする。

**エンドポイント:** `POST /functions/v1/upload-media`

**認証:** Bearer Token（Supabase JWT）

**リクエスト:**
```
Content-Type: multipart/form-data

file: <binary>
type: "image" | "video" | "audio"
```

**レスポンス:**
```json
{
  "url": "https://xxx.supabase.co/storage/v1/object/signed/chat-media/...",
  "thumbnail_url": "https://...",
  "file_size": 1048576,
  "mime_type": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "duration_seconds": null
}
```

**処理フロー:**
```
1. JWT認証チェック
2. ファイルバリデーション
   - サイズ制限: image 10MB, video 100MB, audio 50MB
   - MIMEタイプ制限: image/jpeg, image/png, image/webp, video/mp4, audio/m4a, audio/mp3
3. Supabase Storage にアップロード（chat-media バケット）
4. 画像の場合: 幅・高さを取得
5. 動画の場合: サムネイル生成、duration取得
6. レスポンス返却
```

**エラーハンドリング:**
| エラー | 対応 |
|--------|------|
| ファイルサイズ超過 | HTTP 413、サイズ制限情報返却 |
| MIMEタイプ不正 | HTTP 400、許可MIMEタイプ一覧返却 |
| Storage障害 | HTTP 502、リトライ案内 |

---

### 3-15. fetch-ogp（NEW）

URLからOGPメタデータを取得する。チャット内のリンクプレビュー用。

**エンドポイント:** `POST /functions/v1/fetch-ogp`

**認証:** Bearer Token（Supabase JWT）

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
  "description": "記事の概要...",
  "image": "https://example.com/og-image.jpg",
  "site_name": "Example Site",
  "url": "https://example.com/article"
}
```

**処理フロー:**
```
1. JWT認証チェック
2. URL形式バリデーション
3. キャッシュチェック（24時間有効）
4. キャッシュミスの場合: HTMLを取得してOGPタグを解析
5. 結果をキャッシュに保存
6. レスポンス返却
```

**制限:**
- レート制限: 20 req/分/user
- キャッシュ: 24時間

---

### 3-16. translate-message（NEW）

メッセージを翻訳する。コミュニティ内の多言語対応用。

**エンドポイント:** `POST /functions/v1/translate-message`

**認証:** Bearer Token（Supabase JWT）

**リクエスト:**
```json
{
  "text": "Hello, how are you?",
  "target_language": "ja"
}
```

**レスポンス:**
```json
{
  "translated_text": "こんにちは、お元気ですか？",
  "source_language": "en",
  "target_language": "ja"
}
```

**処理フロー:**
```
1. JWT認証チェック
2. テキストバリデーション（最大5,000文字）
3. OpenAI API呼出（GPT-4o-mini, temperature: 0.3）
4. 翻訳結果返却
```

**制限:**
- レート制限: 10 req/分/user
- 最大文字数: 5,000文字

---

### 3-17. send-push-notification（NEW）

指定ユーザーにプッシュ通知を送信する。内部利用のみ。

**エンドポイント:** `POST /functions/v1/send-push-notification`

**認証:** service_role キー（内部呼出のみ）

**リクエスト:**
```json
{
  "user_id": "uuid",
  "title": "通知タイトル",
  "body": "通知本文",
  "data": {
    "type": "chat",
    "screen": "chat"
  }
}
```

**処理フロー:**
```
1. service_role認証チェック
2. notification_settingsで送信可否を判定
3. push_tokensからユーザーのトークンを全件取得
4. Expo Push APIで通知送信
5. 無効なトークンをpush_tokensから削除
```

**レスポンス:**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0
}
```

---

### 3-18. trigger-community-conversation（NEW）

アクティブコミュニティで自律的なAIエージェント間の会話をトリガーする。

**トリガー:** Cron（毎時）

**認証:** service_role キー

**処理フロー:**
```
1. アクティブコミュニティ（is_active = true、member_count >= 3）を取得
2. 各コミュニティから3-5体のエージェントをランダム選出
3. 選出されたエージェントのSOUL.md/personality_resultsを取得
4. OpenAI API（GPT-4o）で会話を生成（3-5往復）
5. community_messagesに保存（is_autonomous = true）
6. Supabase Realtimeで新規メッセージを配信
```

**レスポンス:**
```json
{
  "triggered": 5,
  "messages_generated": 23,
  "communities": ["uuid1", "uuid2", "..."]
}
```

---

### 3-19. create-community（NEW）

新しいコミュニティを作成する。

**エンドポイント:** `POST /functions/v1/create-community`

**認証:** Bearer Token（Supabase JWT）

**リクエスト:**
```json
{
  "name": "コミュニティ名",
  "description": "コミュニティの説明",
  "language": "jp",
  "category": "hobby",
  "thumbnail_url": null,
  "is_default_thumbnail": true
}
```

**処理フロー:**
```
1. JWT認証チェック
2. バリデーション（name: 1-50文字、description: 0-200文字）
3. communitiesテーブルにINSERT
4. community_membersに作成者を自動追加
5. member_countを1に設定
6. レスポンス返却
```

**レスポンス:**
```json
{
  "id": "uuid",
  "name": "コミュニティ名",
  "description": "コミュニティの説明",
  "language": "jp",
  "category": "hobby",
  "member_count": 1,
  "created_at": "2026-02-15T10:00:00Z"
}
```

---

## 4. 追加外部サービス連携

### 4-1. Supabase Storage

| 項目 | 内容 |
|------|------|
| 用途 | メディアファイルの保存 |
| 認証 | Supabase JWT（バケットポリシー） |

**バケット一覧:**

| バケット名 | 用途 | サイズ制限 | MIMEタイプ制限 |
|-----------|------|----------|--------------|
| chat-media | チャット添付ファイル | image: 10MB, video: 100MB, audio: 50MB | image/jpeg, image/png, image/webp, video/mp4, audio/m4a, audio/mp3 |
| community-thumbnails | コミュニティサムネイル | 5MB | image/jpeg, image/png, image/webp |

**バケットポリシー:**
```sql
-- chat-media: 認証済みユーザーのみアップロード・閲覧可能（Signed URL経由）
-- community-thumbnails: 認証済みユーザーのみアップロード可能、全員が閲覧可能
```

---

### 4-2. Expo Push API

| 項目 | 内容 |
|------|------|
| エンドポイント | https://exp.host/--/api/v2/push/send |
| 認証 | `EXPO_ACCESS_TOKEN` |
| 送信形式 | JSON配列（バッチ送信対応） |

**リクエスト例:**
```json
[
  {
    "to": "ExponentPushToken[xxxxxx]",
    "title": "ツインからメッセージ",
    "body": "新しいメッセージがあります",
    "data": { "type": "chat", "screen": "chat" },
    "sound": "default"
  }
]
```

**エラーハンドリング:**
- `DeviceNotRegistered`: トークンをpush_tokensから削除
- `InvalidCredentials`: EXPO_ACCESS_TOKENを確認

---

### 4-3. Stripe（Web課金用）

| 項目 | 内容 |
|------|------|
| 用途 | Web経由の課金処理 |
| 認証 | `STRIPE_SECRET_KEY` |
| Provider | RevenueCatのStripe Provider経由で統合 |

**使用APIエンドポイント:**

| エンドポイント | 用途 |
|--------------|------|
| POST /v1/checkout/sessions | Checkout Session作成 |
| POST /v1/webhook | Stripe Webhook受信 |

**RevenueCatとの統合:**
- Stripe Providerを設定してRevenueCat側でサブスク状態を一元管理
- Stripe Webhookは RevenueCat が受信し、AltMeへは RevenueCat Webhook として転送される

---

## 変更履歴

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| 2026-02-14 | 3-12: onboarding-chat Edge Function追加 | オンボーディング中の初回チャット機能（OpenClawインスタンス未作成時） |
| 2026-02-14 | 3-13: generate-twin-conversation Edge Function追加 | コミュニティ機能（2つのAIツイン間の会話生成） |
| 2026-02-14 | Edge Functions一覧テーブルに2件追加 | 仕様書の完全性担保 |
| 2026-02-14 | Free chat Edge Function: SSEストリーミング明記 | chat.mdとの整合性（Clarify Phase Q2決定）|
| 2026-02-14 | WebSocketプロトコル: chat.md形式に統一 | 仕様間矛盾解消 |
| 2026-02-14 | cloud-init: wss://対応（nginx + 自己署名証明書）| セキュリティ: MVPでもTLS必須（Clarify Phase Q5決定）|
| 2026-02-14 | cloud-init: 機密情報の自動削除 | セキュリティ強化 |
| 2026-02-15 | 新Edge Functions 6個追加: upload-media(#14), fetch-ogp(#15), translate-message(#16), send-push-notification(#17), trigger-community-conversation(#18), create-community(#19) | 新機能対応: メディア添付、OGP、翻訳、通知、コミュニティ |
| 2026-02-15 | update-soul-md: MBTI情報反映、twin_name変更時のnameフィールド更新を追加 | MBTI・ツイン名対応 |
| 2026-02-15 | 追加外部サービス: Supabase Storage（chat-media, community-thumbnails）、Expo Push API、Stripe（Web課金）を追加 | 新機能対応 |
| 2026-02-21 | chat-attachments → chat-media にバケット名変更、Signed URL アクセスに変更 | 実装との整合性（Codex レビュー C-1/C-2 指摘対応） |
