# 11 --- OpenClaw統合仕様

## ステータス: DRAFT
- 作成日: 2026-02-15
- 最終更新: 2026-02-15
- 承認状態: 未承認
- 担当: Agent A (Foundation) / Agent C (Core AI) / Agent D (Engagement)

---

## 1. 概要

OpenClawはWebSocketベースのAIエージェントフレームワーク。
課金ユーザーごとにDigitalOcean上にOpenClawインスタンスをデプロイし、パーソナライズされたAIツインとして利用する。

### アーキテクチャ

```
[モバイルアプリ]
      |
      +------ Free: Supabase Edge Function (chat) -> OpenAI API (SSE)
      |
      +------ Pro: WebSocket (wss://) -> nginx reverse proxy -> OpenClaw Gateway (:18789)
                                              |
                                        [DigitalOcean Droplet]
                                              |
                                        [Docker: OpenClaw]
                                              |
                                        [SOUL.md + anthropic/claude-sonnet-4-5-20250929]
```

---

## 2. プロビジョニングフロー

### 2.1 全体フロー

```
[ユーザー] -- Pro課金完了 --> [RevenueCat Webhook]
    --> [Supabase Edge Function: webhook-revenuecat]
    --> [provision-openclaw Edge Function]
    --> [DigitalOcean API: POST /v2/droplets]
    --> [cloud-init: Docker + OpenClaw 自動セットアップ]
    --> [health-check-openclaw (Cron 5分): WebSocket接続テスト]
    --> [status: provisioning -> running]
    --> [モバイルアプリ: Realtime Subscription で検知]
```

### 2.2 詳細ステップ

1. **RevenueCat Webhook 受信** --- INITIAL_PURCHASE / TRIAL_STARTED / RENEWAL
2. **webhook-revenuecat** が provision-openclaw を非同期呼出
3. **provision-openclaw**:
   a. 冪等性チェック（既存インスタンス確認）
   b. personality_results + profiles からユーザーデータ取得
   c. SOUL.md 生成 + gateway_token 生成（UUID v4）
   d. DigitalOcean API で Droplet 作成（cloud-init スクリプト付き）
   e. openclaw_instances に status=provisioning でレコード挿入
4. **cloud-init 自動実行**:
   a. Docker + Docker Compose v2 プラグインインストール
   b. OpenClaw Docker イメージ pull
   c. SOUL.md + docker-compose.yml 配置
   d. UFW で port 18789 開放
   e. `docker compose up -d` で起動
5. **health-check-openclaw（Cron 5分間隔）**:
   a. Droplet が active かチェック
   b. IP アドレス解決
   c. WebSocket 接続テスト（gateway_token でハンドシェイク）
   d. 成功時: status を running に遷移
6. **モバイルアプリ**: Supabase Realtime で openclaw_instances の変更を検知

### 2.3 冪等性保証

| 既存status | 動作 |
|-----------|------|
| running | 早期リターン（no-op） |
| provisioning | 早期リターン（二重作成防止） |
| stopped / error | 既存Droplet削除 -> 新規作成 |
| destroying | 待機（別プロセスで削除中） |
| なし | 新規作成 |

---

## 3. SOUL.md 構造と生成

### 3.1 テンプレート

```markdown
# AltMe Twin - {ユーザー名}

## Core Identity
あなたは{ユーザー名}さんのAIツイン「{ツイン名}」です。

## Personality
- 外向性: {extraversion}/100
- 協調性: {agreeableness}/100
- 誠実性: {conscientiousness}/100
- 神経症傾向: {neuroticism}/100
- 開放性: {openness}/100

## Communication Style
{性格分析サマリーに基づくコミュニケーションスタイル指示}

## Rules
- {locale}で応答（ユーザーのlocaleに従う）
- 共感的で温かいトーン
- ユーザーの過去の会話を参照して文脈を維持
- プライバシーを尊重
- 1回のレスポンスは100〜200文字程度
```

### 3.2 生成ロジック

- `personality_results` テーブルから Big Five スコアを取得
- `profiles` テーブルから display_name, twin_name, locale を取得
- 各スコアの高低に応じて Communication Style セクションを動的生成
- personality_results が未取得の場合はデフォルト SOUL.md を使用

### 3.3 SOUL.md 更新トリガー

| トリガー | 処理 |
|---------|------|
| ツイン名変更（設定画面） | update-soul-md Edge Function 呼出 |
| 性格診断やり直し（設定画面） | 新しい personality_results -> update-soul-md |
| プロビジョニング時 | 自動生成してDropletに配置 |

### 3.4 保存先

- `openclaw_instances.soul_md` カラム --- DB内に保存（監査・デバッグ・再プロビジョニング用）
- `/opt/openclaw/soul.md` --- Droplet内のファイル（OpenClawが実際に読み込む）

---

## 4. Gateway API（WebSocket）

### 4.1 接続情報

| 項目 | 値 |
|------|-----|
| プロトコル | WebSocket（TLS） |
| エンドポイント | `wss://{ip_address}:443` |
| 内部転送先 | `localhost:18789`（nginx reverse proxy） |
| 認証方式 | connect ハンドシェイク時に gateway_token 送信 |
| メッセージフォーマット | JSON |

### 4.2 接続シーケンス

```
[アプリ]                                    [nginx:443]          [OpenClaw:18789]
   |                                            |                      |
   |-- wss:// 接続 --------------------------->|                      |
   |                                            |-- ws:// 転送 ------>|
   |                                            |                      |
   |-- connect { token, deviceId } ----------->|--------------------->|
   |                                            |                      |
   |<-- connected { sessionId } ---------------|----- <----------- ---|
   |                                            |                      |
   |-- message { content, sessionId } -------->|--------------------->|
   |                                            |                      |
   |<-- agent.text_delta { delta } ------------|-----<------------- --|
   |<-- agent.text_delta { delta } ------------|-----<------------- --|
   |<-- agent.text_done { content } -----------|-----<------------- --|
```

### 4.3 メッセージ型

#### connect（Client -> Server）
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

#### connected（Server -> Client）
```json
{
  "type": "connected",
  "sessionId": "{session_id}",
  "serverVersion": "1.0.0"
}
```

#### message（Client -> Server）
```json
{
  "type": "message",
  "content": "明日の会議の準備を手伝って",
  "sessionId": "{current_session_id}"
}
```

#### agent.text_delta（Server -> Client）
```json
{
  "type": "agent",
  "event": "text_delta",
  "delta": "もちろん、",
  "sessionId": "{session_id}"
}
```

#### agent.text_done（Server -> Client）
```json
{
  "type": "agent",
  "event": "text_done",
  "content": "もちろん、会議の準備をお手伝いします。",
  "sessionId": "{session_id}"
}
```

#### health（双方向）
```json
{ "type": "health" }
```
```json
{
  "type": "health",
  "status": "ok",
  "uptime_seconds": 86400,
  "memory_usage_mb": 256
}
```

#### error（Server -> Client）
```json
{
  "type": "error",
  "code": "AUTH_FAILED",
  "message": "Invalid gateway token"
}
```

### 4.4 接続管理パラメータ

| 項目 | 値 |
|------|-----|
| 接続タイムアウト | 10秒 |
| Ping間隔 | 30秒 |
| 再接続戦略 | Exponential backoff + jitter |
| 再接続計算式 | `min(1000ms * 2^attempt + random(0,500)ms, 30000ms)` |
| 最大再接続回数 | 10回 |
| メッセージサイズ上限 | 64KB |

### 4.5 クライアント実装

WebSocketクライアントの主要メソッド:

```
OpenClawWebSocketClient
  |-- connect()          --- WebSocket接続開始
  |-- disconnect()       --- 手動切断（再接続しない）
  |-- sendMessage(content) --- メッセージ送信
  |-- isConnected         --- 接続状態取得（getter）
  |-- currentSessionId    --- セッションID取得（getter）
```

コールバック:
- `onTextDelta(delta, sessionId)` --- ストリーミング断片受信
- `onTextDone(content, sessionId)` --- 応答完了受信
- `onConnected(sessionId)` --- 接続成功
- `onError(code, message)` --- エラー受信
- `onStatusChange(status)` --- 接続状態変更（connecting/connected/disconnected/reconnecting）

### 4.6 gateway_token セキュリティ

- **生成**: `crypto.randomUUID()`（UUID v4）
- **保存**: `openclaw_instances.gateway_token`（RLSで保護、クライアントからは直接参照不可）
- **取得**: Edge Function `get-gateway-token` 経由（JWT認証必須）
- **クリア**: インスタンス破棄時に NULL に設定
- **Droplet内**: cloud-init 完了後、`/var/lib/cloud/instance/user-data.txt` を削除

---

## 5. ヘルスチェック / 再起動 / 破棄ライフサイクル

### 5.1 ヘルスチェック（health-check-openclaw）

| 項目 | 値 |
|------|-----|
| トリガー | Supabase pg_cron（5分間隔） |
| チェック対象 | status IN ('running', 'provisioning') |
| チェック方法 | WebSocket接続 + connect ハンドシェイク |
| タイムアウト | 5秒 |
| provisioning タイムアウト | 15分超で error に遷移 |
| running 失敗閾値 | 15分以上連続失敗で error に遷移 |
| 並列実行 | Promise.allSettled で全インスタンス並列チェック |

### 5.2 再起動（restart-openclaw）

| 項目 | 値 |
|------|-----|
| トリガー | ユーザー操作（設定画面「再起動」ボタン） |
| 認証 | JWT（本人確認） |
| レート制限 | 5分間に3回まで |
| 方法 | DigitalOcean API: POST /v2/droplets/{id}/actions -> type: reboot |
| 遷移 | running/error -> provisioning -> (ヘルスチェック成功) -> running |
| タイムアウト | ヘルスチェックで15分以内に復帰しなければ error |

### 5.3 破棄（destroy-openclaw）

| 項目 | 値 |
|------|-----|
| トリガー | RevenueCat Webhook EXPIRATION / ユーザー解約 |
| 方法 | DigitalOcean API: DELETE /v2/droplets/{id} |
| 冪等性 | 404は成功扱い |
| データ保持 | soul_md は保持（再サブスク時に復元可能） |
| クリア対象 | ip_address, gateway_token を NULL に設定 |

---

## 6. インスタンス状態遷移図

```
                          +------------------+
                          |   (レコードなし)   |
                          +--------+---------+
                                   |
                          課金完了 (provision)
                                   |
                                   v
                          +------------------+
                     +--->|  provisioning    |<---+
                     |    +--------+---------+    |
                     |             |               |
                     |    ヘルスチェック成功         |
                     |             |               |
                     |             v               |
                     |    +------------------+    |
                     |    |     running      |    |
                     |    +--------+---------+    |
                     |             |               |
                     |    +--------+--------+     |
                     |    |                 |     |
              再試行  | サブスク切れ    15分連続失敗 | 再起動
              (retry) |   (destroy)    (health NG) | (restart)
                     |    |                 |     |
                     |    v                 v     |
                     |  +--------+   +----------+ |
                     |  | stopped|   |   error   |-+
                     |  +--------+   +-----+----+
                     |                      |
                     +----------------------+
                            再試行
```

### 状態一覧

| status | 意味 | 許可される操作 |
|--------|------|-------------|
| provisioning | Droplet作成中・起動待ち | なし（待機） |
| running | 正常稼働中 | チャット、再起動、SOUL.md更新 |
| stopped | サブスク切れで停止 | 再サブスクで再プロビジョニング |
| error | 障害発生 | 再試行、再起動 |
| destroying | 削除処理中 | なし（待機） |

---

## 7. Droplet仕様

### 7.1 サーバー構成

| 項目 | 値 |
|------|-----|
| サイズ | `s-1vcpu-1gb`（$6/月） |
| リージョン | `sgp1`（シンガポール） |
| イメージ | `docker-20-04`（Docker pre-installed Ubuntu） |
| タグ | `altme`, `user-{userId}` |
| 命名規則 | `altme-{userId先頭8文字}` |

### 7.2 Docker構成

```yaml
version: "3.8"
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    container_name: openclaw
    restart: unless-stopped
    ports:
      - "18789:18789"
    volumes:
      - /opt/openclaw/soul.md:/app/SOUL.md:ro
    environment:
      - OPENCLAW_GATEWAY_TOKEN={gateway_token}
      - OPENCLAW_MODEL=anthropic/claude-sonnet-4-5-20250929
      - OPENCLAW_HOST=0.0.0.0
      - OPENCLAW_PORT=18789
```

### 7.3 TLS構成（nginx reverse proxy）

```
[クライアント] --wss://:443--> [nginx (TLS終端)] --ws://:18789--> [OpenClaw]
```

- 初期: 自己署名証明書（openssl で生成）
- 将来: Let's Encrypt（certbot）に移行可能
- nginx 設定: `/etc/nginx/sites-available/openclaw`

### 7.4 セキュリティ

| 項目 | 設定 |
|------|------|
| ファイアウォール | UFW: port 18789/tcp のみ開放 |
| 認証 | gateway_token（UUID v4、DB管理） |
| 機密情報保護 | cloud-init 完了後 user-data.txt を削除 |
| SSH | プロビジョニング時のみ使用 |

---

## 8. コスト概算

### 8.1 インスタンス単価

| 項目 | コスト |
|------|--------|
| Droplet（s-1vcpu-1gb） | $6/月 |
| 転送量（1TB/月込み） | $0（超過 $0.01/GB） |
| OpenAI API（Claude Sonnet 4.5経由） | 利用量依存 |

### 8.2 スケール見込み

| ユーザー数 | 月間インフラコスト | MRR（月額プラン） | 粗利率 |
|-----------|------------------|------------------|--------|
| 10 | $60 | 49,800 | 98.8% |
| 50 | $300 | 249,000 | 98.3% |
| 100 | $600 | 498,000 | 98.2% |

- Dropletコストは月額プラン収益に対して約1.2%
- OpenAI APIコストが主要な変動費（別途管理）

---

## 9. クライアント側サービス

### 9.1 OpenClawクライアント（src/services/openclaw/client.ts）

| メソッド | 用途 |
|---------|------|
| `getMyInstance()` | 自分のインスタンス情報取得（publicビュー経由） |
| `getGatewayToken()` | gateway_token取得（Edge Function経由） |
| `restartInstance()` | インスタンス再起動リクエスト |
| `updateSoulMd()` | SOUL.md再生成リクエスト |
| `subscribeToInstanceChanges(userId, onUpdate)` | Realtime変更監視 |

### 9.2 WebSocketクライアント（src/services/openclaw/websocket-client.ts）

`OpenClawWebSocketClient` クラスがWebSocket接続を管理する。
詳細はセクション4.5を参照。

---

## 10. 関連ファイル

| ファイル | 概要 |
|---------|------|
| `src/services/openclaw/client.ts` | インスタンス管理クライアント |
| `src/services/openclaw/websocket-client.ts` | WebSocketクライアント |
| `src/shared/types/openclaw.ts` | OpenClaw関連型定義 |
| `src/features/settings/hooks/use-openclaw-instance.ts` | インスタンス状態取得hook |
| `src/features/settings/components/instance-status-card.tsx` | インスタンス状態表示UI |
| `supabase/functions/provision-openclaw/index.ts` | プロビジョニングEdge Function |
| `supabase/functions/destroy-openclaw/index.ts` | 破棄Edge Function |
| `supabase/functions/health-check-openclaw/index.ts` | ヘルスチェックEdge Function |
| `supabase/functions/restart-openclaw/index.ts` | 再起動Edge Function |
| `supabase/functions/update-soul-md/index.ts` | SOUL.md更新Edge Function |
| `supabase/migrations/xxx_create_openclaw_instances.sql` | DBマイグレーション |

---

## 11. 検証条件

- [ ] 課金完了後にDropletが自動作成されること（cloud-init完了まで）
- [ ] ヘルスチェック成功後にstatus=runningに遷移すること
- [ ] SOUL.mdがユーザーの性格データに基づいて生成されること
- [ ] WebSocket接続でgateway_token認証が成功すること
- [ ] 無効なgateway_tokenで接続が拒否されること
- [ ] AI応答がtext_delta -> text_doneの順でストリーミング配信されること
- [ ] 解約時にDropletが削除され、soul_mdが保持されること
- [ ] 再サブスク時にsoul_mdが復元されてDropletが再作成されること
- [ ] ヘルスチェック15分超失敗でerrorに遷移すること
- [ ] 再起動のレート制限が5分3回で動作すること
- [ ] SOUL.md更新後にインスタンスが再起動されること
- [ ] Supabase Realtimeでインスタンス状態変更がアプリに通知されること
- [ ] WebSocket切断時にExponential Backoffで再接続されること
