# OpenClaw Gateway API リファレンス

## 接続情報

| 項目 | 値 |
|------|-----|
| プロトコル | WebSocket（テキストフレーム、JSON ペイロード）+ OpenAI 互換 HTTP API |
| デフォルトポート | `18789` |
| ポート解決順 | `--port` CLI → `OPENCLAW_GATEWAY_PORT` env → `gateway.port` config → `18789` |
| AltMe エンドポイント | `ws://{ip_address}:18789` |
| メッセージサイズ上限 | 64KB |
| Ping 間隔 | 30 秒 |
| バインドモード | `loopback`（デフォルト）/ `lan` / `tailnet` |

## 認証

### 認証方式

| 方式 | 設定値 | 説明 |
|------|--------|------|
| **token** | `gateway.auth.mode: "token"` | `OPENCLAW_GATEWAY_TOKEN` で認証（AltMe で採用） |
| **password** | `gateway.auth.mode: "password"` | パスワードベース認証（Funnel 使用時に必須） |
| **trusted-proxy** | `gateway.auth.mode: "trusted-proxy"` | リバースプロキシ信頼 |

### トークン認証

AltMe では `OPENCLAW_GATEWAY_TOKEN` 環境変数で設定。UUID v4 またはランダム hex（64 文字推奨）。

```bash
# トークン生成例
openssl rand -hex 32
```

### 認証必須条件

非 loopback バインド（`lan` / `tailnet`）では認証設定が必須。未設定の場合:
```
"refusing to bind gateway ... without auth"
```

## WebSocket プロトコル

### 接続ハンドシェイク

#### Stage 1: サーバーチャレンジ（接続直後にサーバーから送信）

```json
{
  "type": "challenge",
  "nonce": "random-nonce-string",
  "timestamp": 1707900000000
}
```

#### Stage 2: クライアント応答

```json
{
  "type": "connect",
  "minProtocol": 1,
  "maxProtocol": 1,
  "client": {
    "id": "altme-mobile",
    "version": "1.0.0",
    "platform": "ios",
    "mode": "operator"
  },
  "role": "operator",
  "scopes": ["operator.read", "operator.write"],
  "device": {
    "id": "device-uuid",
    "signature": "nonce-signature"
  },
  "auth": {
    "token": "{OPENCLAW_GATEWAY_TOKEN}"
  }
}
```

#### Stage 3: サーバー応答（成功）

```json
{
  "type": "hello-ok",
  "protocol": 1,
  "policy": {
    "maxPayload": 65536,
    "pingInterval": 30000
  },
  "deviceToken": "device-scoped-token",
  "presence": { ... },
  "health": { ... },
  "stateVersion": "v1",
  "uptimeMs": 86400000,
  "limits": { ... }
}
```

#### サーバー応答（認証失敗）

```json
{
  "type": "error",
  "code": "AUTH_FAILED",
  "message": "Invalid gateway token"
}
```

### AltMe 簡略化ハンドシェイク

AltMe の WebSocket クライアントは以下の簡略化フォーマットを使用:

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

成功レスポンス:

```json
{
  "type": "connected",
  "sessionId": "sess_abc123",
  "serverVersion": "1.0.0"
}
```

## メッセージフレーム

### Request フレーム（クライアント → サーバー）

```json
{
  "type": "req",
  "id": "unique-request-id",
  "method": "method.name",
  "params": { ... }
}
```

### Response フレーム（サーバー → クライアント）

```json
{
  "type": "res",
  "id": "matching-request-id",
  "success": true,
  "payload": { ... }
}
```

エラー時:

```json
{
  "type": "res",
  "id": "matching-request-id",
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

### Event フレーム（サーバー → クライアント、非同期）

```json
{
  "type": "event",
  "event": "event.name",
  "payload": { ... },
  "seq": 42,
  "stateVersion": "v1"
}
```

### 安全保証

- Gateway 不到達時はクライアント即時失敗（暗黙のフォールバックなし）
- 無効な非 connect フレームは拒否してソケットを閉じる
- グレースフルシャットダウン時は `shutdown` イベント発行後にソケットクローズ
- シーケンスギャップ発生時はイベントリプレイなし。クライアントが状態をリフレッシュする必要あり

## RPC メソッド一覧

### チャット

| メソッド | 説明 | パラメータ |
|---------|------|----------|
| `chat.send` | メッセージ送信 | `{ sessionKey, content, messageId? }` |
| `chat.inject` | メッセージ注入（履歴に追加） | `{ sessionKey, role, content, parentId? }` |
| `chat.abort` | 応答中断 | `{ sessionKey }` |

Agent run は2段階: 即時 `status:"accepted"` ACK → 完了時にストリーミング `agent` イベント。

### セッション

| メソッド | 説明 | パラメータ |
|---------|------|----------|
| `sessions.list` | セッション一覧 | `{}` |
| `sessions.get` | セッション詳細 | `{ sessionKey }` |
| `sessions.reset` | セッションリセット | `{ sessionKey }` |
| `sessions.send` | セッションにメッセージ送信 | `{ sessionKey, content }` |

### エージェント

| メソッド | 説明 | パラメータ |
|---------|------|----------|
| `agent.start` | エージェント開始 | `{ sessionKey }` |
| `agent.stop` | エージェント停止 | `{ sessionKey }` |
| `agents.list` | エージェント一覧 | `{}` |

### 設定

| メソッド | 説明 | パラメータ |
|---------|------|----------|
| `config.get` | 設定取得 | `{ path? }` |
| `config.apply` | 設定適用 | `{ config, hash? }` |
| `config.patch` | 設定部分更新 | `{ patch, hash? }` |

### スキル

| メソッド | 説明 | パラメータ |
|---------|------|----------|
| `skills.list` | スキル一覧 | `{}` |
| `skills.update` | スキル更新 | `{ name, config }` |

### モデル

| メソッド | 説明 | パラメータ |
|---------|------|----------|
| `models.list` | 利用可能モデル一覧 | `{}` |
| `models.status` | モデル認証状態 | `{}` |

### ヘルスチェック

| メソッド | 説明 | パラメータ |
|---------|------|----------|
| `health` | ヘルス状態取得 | `{}` |

レスポンス:

```json
{
  "type": "health",
  "status": "ok",
  "uptime_seconds": 86400,
  "memory_usage_mb": 256
}
```

### システム

| メソッド | 説明 |
|---------|------|
| `system.info` | システム情報 |
| `update.run` | アップデート実行 |

### デバイス

| メソッド | 説明 |
|---------|------|
| `devices.list` | 接続デバイス一覧 |
| `devices.approve` | デバイスペアリング承認 |

## Agent ストリーミングイベント

### text_delta（テキスト部分受信）

```json
{
  "type": "agent",
  "event": "text_delta",
  "delta": "こんに",
  "sessionId": "sess_abc123",
  "messageId": "msg_resp_uuid",
  "index": 0
}
```

### text_done（テキスト完了）

```json
{
  "type": "agent",
  "event": "text_done",
  "content": "こんにちは！今日はどんな一日でしたか？",
  "sessionId": "sess_abc123",
  "messageId": "msg_resp_uuid",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 45,
    "total_tokens": 195
  }
}
```

### tool_use（ツール実行）

```json
{
  "type": "agent",
  "event": "tool_use",
  "tool": "exec",
  "input": { "command": "date" },
  "sessionId": "sess_abc123"
}
```

### error（エージェントエラー）

```json
{
  "type": "agent",
  "event": "error",
  "code": "AGENT_ERROR",
  "message": "Failed to generate response",
  "sessionId": "sess_abc123"
}
```

## 共通イベント

| イベント | 説明 |
|---------|------|
| `connect.challenge` | 認証チャレンジ |
| `agent` | エージェントストリーミング |
| `chat` | チャット関連 |
| `presence` | オンライン状態 |
| `tick` | ハートビート |
| `health` | ヘルスステータス |
| `heartbeat` | 接続維持 |
| `shutdown` | グレースフルシャットダウン |

## Presence イベント

サーバーから自動送信:

```json
{
  "type": "presence",
  "status": "online",
  "last_active": "2026-02-14T10:30:00Z"
}
```

## OpenAI 互換 HTTP API

Gateway は OpenAI Chat Completions 互換の HTTP エンドポイントを提供:

```
POST http://{ip}:18789/v1/chat/completions
Authorization: Bearer {OPENCLAW_GATEWAY_TOKEN}
Content-Type: application/json
```

```json
{
  "model": "anthropic/claude-sonnet-4-5-20250929",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "stream": true
}
```

## エラーコード一覧

| コード | 意味 | HTTP 相当 | 対応策 |
|--------|------|----------|--------|
| `AUTH_FAILED` | 認証失敗 | 401 | トークン再取得、再接続 |
| `RATE_LIMITED` | レート制限超過 | 429 | `retryAfter` 秒待機後リトライ |
| `AGENT_ERROR` | エージェント処理エラー | 500 | ユーザーに通知、必要ならセッションリセット |
| `INTERNAL_ERROR` | サーバー内部エラー | 500 | 再接続 |
| `SESSION_EXPIRED` | セッション期限切れ | 401 | 新しいセッションで再接続 |
| `NOT_FOUND` | リソース未発見 | 404 | パラメータ確認 |
| `INVALID_REQUEST` | リクエスト不正 | 400 | フォーマット確認 |

## 接続管理パラメータ

| 項目 | AltMe 設定値 | OpenClaw デフォルト |
|------|-------------|-------------------|
| 接続タイムアウト | 10 秒 | 10 秒 |
| Ping 間隔 | 30 秒 | 30 秒 |
| 再接続: 初回遅延 | 1 秒 | 1 秒 |
| 再接続: 最大遅延 | 30 秒 | 30 秒 |
| 再接続: 最大試行回数 | 10 回 | - |
| 再接続: 戦略 | Exponential backoff | Exponential backoff |
| メッセージサイズ上限 | 64 KB | 64 KB |

## AltMe WebSocket クライアント実装

### 実装ファイル

- `src/services/openclaw/websocket-client.ts` — WebSocket クライアントクラス
- `src/shared/types/openclaw.ts` — 型定義

### 接続シーケンス（AltMe）

```
1. ws://{ip_address}:18789 に WebSocket 接続
2. connect ハンドシェイク送信（gateway_token + deviceId + clientType）
3. connected レスポンス受信（sessionId 取得）
4. message 送受信開始
5. agent.text_delta / agent.text_done でストリーミング受信
6. 切断時は exponential backoff で自動再接続（最大 10 回）
7. 10 回失敗後は Edge Function フォールバックモードに切替
```

### メッセージ送信

```json
{
  "type": "message",
  "content": "今日はこんなことがあったよ",
  "sessionId": "{current_session_id}"
}
```

## ヘルスチェック方法

### CLI

```bash
openclaw health --json --timeout 10000
```

### Docker

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### WebSocket（AltMe ヘルスチェックで使用）

```
1. ws://{ip}:18789 に接続
2. connect ハンドシェイク送信
3. "connected" レスポンス受信 → healthy
4. タイムアウト (5秒) or エラー → unhealthy
```

### Operator コマンド

```bash
openclaw gateway status [--deep] [--json]
openclaw channels status --probe
openclaw doctor
openclaw logs --follow
```

## よくある障害パターン

| エラー | 原因 | 対処 |
|--------|------|------|
| "refusing to bind gateway ... without auth" | 非 loopback バインドで認証未設定 | token/password を設定 |
| "EADDRINUSE" | ポート競合 | 別のプロセスが 18789 を使用中。kill するか別ポート指定 |
| "Gateway start blocked: set gateway.mode=local" | config が remote mode | 設定変更 |
| "unauthorized" during connect | 認証情報不一致 | トークン確認 |
| 接続直後に切断 | 初回フレームが connect 以外 | プロトコル確認 |

## リモートアクセス

### SSH トンネル（推奨）

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
# クライアントは ws://127.0.0.1:18789 に接続
```

### Tailscale

```json
{
  "gateway": {
    "tailscale": {
      "mode": "serve"
    }
  }
}
```

| モード | 説明 |
|--------|------|
| `off` | デフォルト |
| `serve` | tailnet 内のみ（HTTPS 自動） |
| `funnel` | パブリック（password 認証必須） |
