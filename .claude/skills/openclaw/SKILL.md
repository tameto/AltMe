---
name: openclaw
description: |
  OpenClaw パーソナルAIエージェント管理の専門スキル。
  Gateway API連携、SOUL.md設計、インスタンス設定、パーソナリティチューニングを担当。
  トリガー: OpenClaw, SOUL.md, Gateway, AIエージェント, パーソナリティ, WebSocket
---

# OpenClaw パーソナル AI エージェント

## 概要

OpenClaw は自己ホスト型パーソナル AI アシスタントフレームワーク。WebSocket ベースの Gateway サーバーがコントロールプレーンとして動作し、CLI / Web UI / モバイルアプリなど複数クライアントから接続する。

- **リポジトリ**: https://github.com/openclaw/openclaw
- **公式サイト**: https://openclaw.ai
- **ライセンス**: MIT
- **言語**: TypeScript (Node.js 22+)
- **Docker イメージ**: `openclaw:local`（自前ビルド）/ GitHub Packages `ghcr.io/openclaw/openclaw`
- **インストール**: `npm install -g openclaw@latest && openclaw onboard --install-daemon`

## アーキテクチャ

```
[モバイルアプリ] --WebSocket--> [Gateway :18789] --> [Agent Runtime]
                                      |                    |
                                      v                    v
                                 [Sessions]           [SOUL.md]
                                 [Channels]           [Skills]
                                 [Cron/Hooks]         [Tools]
```

### 主要コンポーネント

| コンポーネント | 役割 |
|--------------|------|
| **Gateway** | WebSocket コントロールプレーン（デフォルト port 18789）。RPC、HTTP API、Control UI を統一ポートで提供 |
| **Agent Runtime** | LLM とのやり取り、ツール実行、コンテキスト管理 |
| **SOUL.md** | エージェントの性格・行動指針を定義するブートストラップファイル |
| **IDENTITY.md** | エージェントの名前・見た目・雰囲気を定義 |
| **TOOLS.md** | 環境固有の設定メモ（デバイス名、SSH ホスト等） |
| **USER.md** | ユーザー固有の情報 |
| **MEMORY.md** | エージェントの長期記憶 |
| **Skills** | 機能拡張モジュール（`SKILL.md` + オプションスクリプト）。Bundled / Managed / Workspace の3階層 |
| **Sessions** | チャネル/ピアごとの会話隔離・コンテキスト管理。`main` セッションと Group セッション |

### ブートストラップファイル（毎ターン注入）

以下のファイルは **全ての Agent ターンでコンテキストに注入** される:
- `AGENTS.md` / `SOUL.md` / `IDENTITY.md` / `TOOLS.md` / `USER.md` / `HEARTBEAT.md`
- `MEMORY.md` / `BOOTSTRAP.md`（新規ワークスペースのみ）

`bootstrapMaxChars` のデフォルトは 20,000 文字。超過分は切り詰められる。

### ワークスペース構造

```
~/.openclaw/
  openclaw.json          # メイン設定ファイル（JSON5）
  workspace/
    AGENTS.md
    SOUL.md
    TOOLS.md
    skills/
      <skill>/SKILL.md
```

## Gateway API

### 基本情報

| 項目 | 値 |
|------|-----|
| プロトコル | WebSocket（JSON テキストフレーム）+ OpenAI互換 HTTP API |
| デフォルトポート | `18789`（`--port` / `OPENCLAW_GATEWAY_PORT` / `gateway.port` で変更可能） |
| バインド | `loopback`（デフォルト）/ `lan` / `tailnet` |
| 認証 | `token` / `password` / `trusted-proxy` |
| 設定ファイル | `~/.openclaw/openclaw.json`（JSON5 形式） |
| ホットリロード | `off` / `hot` / `restart` / `hybrid`（デフォルト） |

### WebSocket 接続フロー

1. **初回フレーム**: クライアントが `connect` メッセージを送信（認証トークン含む）
2. **サーバー応答**: `hello-ok` で presence, health, stateVersion, uptimeMs, limits/policy を返却
3. **RPC**: `req(method, params)` → `res(ok/payload|error)` 形式

### 主要 RPC メソッド

| メソッド | 説明 |
|---------|------|
| `connect` | 接続確立・認証 |
| `chat.send` / `.inject` / `.abort` | チャット操作 |
| `sessions.list` / `.get` / `.reset` / `.send` | セッション管理 |
| `config.get` / `.apply` / `.patch` | 設定読み書き |
| `health` | ヘルスチェック |
| `skills.list` / `.update` | スキル管理 |
| `models.list` / `.status` | モデル一覧・状態 |
| `agents.list` | エージェント一覧 |
| `agent.start` / `.stop` | エージェント制御 |
| `devices.list` / `.approve` | デバイスペアリング |
| `system.info` / `update.run` | システム管理 |

### Agent ストリーミングイベント

| イベント | 説明 |
|---------|------|
| `agent.text_delta` | テキスト部分受信 |
| `agent.text_done` | テキスト完了（usage 情報付き） |
| `agent.tool_use` | ツール実行 |
| `agent.error` | エージェントエラー |

### OpenAI 互換 HTTP API

```
POST http://{ip}:18789/v1/chat/completions
Authorization: Bearer {OPENCLAW_GATEWAY_TOKEN}
Content-Type: application/json
```

### エラーコード

| コード | 意味 | 対応 |
|--------|------|------|
| `AUTH_FAILED` | 認証失敗 | トークン再取得 |
| `RATE_LIMITED` | レート制限 | `retryAfter` 秒待機 |
| `AGENT_ERROR` | エージェントエラー | ユーザー通知 |
| `INTERNAL_ERROR` | 内部エラー | 再接続 |
| `SESSION_EXPIRED` | セッション期限切れ | 再接続 |

詳細 → `references/gateway-api.md`

## SOUL.md

エージェントの性格・行動指針を定義するコアファイル。毎ターンコンテキストに注入される。

### 基本原則

- 実質重視（社交辞令より実際の支援）
- 本物のパーソナリティと意見を持つ
- 独立した問題解決を優先
- プライバシー情報の機密性は絶対
- 外部アクション（通信、公開投稿）は事前確認必須
- ユーザーのなりすまし禁止

### AltMe での SOUL.md 生成

オンボーディングの性格診断結果（Big Five）から自動生成:

```markdown
# AltMe Twin - {ユーザー名}

## Core Identity
あなたは{ユーザー名}のAIツイン「{ツイン名}」です。

## Personality
- 外向性: {extraversion}/100
- 協調性: {agreeableness}/100
- 誠実性: {conscientiousness}/100
- 神経症傾向: {neuroticism}/100
- 開放性: {openness}/100

## Communication Style
{性格分析サマリーに基づくスタイル指示}

## Rules
- 日本語で応答
- 共感的で温かいトーン
- 過去の会話を参照してコンテキスト維持
- プライバシー尊重
```

詳細 → `references/soul-md.md`

## Docker デプロイ

### docker-compose.yml（AltMe 用）

```yaml
services:
  openclaw-gateway:
    image: ${OPENCLAW_IMAGE:-openclaw:local}
    environment:
      HOME: /home/node
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    volumes:
      - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
      - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
    ports:
      - "${OPENCLAW_GATEWAY_PORT:-18789}:18789"
    init: true
    restart: unless-stopped
    command: ["node", "dist/index.js", "gateway", "--bind", "lan", "--port", "18789"]
```

### Dockerfile

- ベースイメージ: `node:22-bookworm`
- 非 root 実行 (`USER node`)
- CMD: `["node", "openclaw.mjs", "gateway", "--allow-unconfigured"]`
- `--bind lan` で外部ヘルスチェック対応

### 必須環境変数

| 変数 | 用途 |
|------|------|
| `OPENCLAW_GATEWAY_TOKEN` | Gateway 認証トークン（64 文字ランダム hex 推奨） |
| `ANTHROPIC_API_KEY` | Anthropic API キー |

詳細 → `references/docker-deployment.md`

## セッション管理

### セッションタイプ

| タイプ | 説明 |
|--------|------|
| `main` | 直接の個人チャット。ホストレベルアクセス |
| Group | チャネル固有の隔離セッション |

### セッション設定（永続化）

- `thinkingLevel`: off / minimal / low / medium / high / xhigh
- `verboseLevel`: 冗長度設定
- `model`: セッションごとのモデル選択
- `sendPolicy`: 送信ポリシー
- `groupActivation`: mention / always
- `elevated`: 昇格アクセストグル

## ツールシステム

### 組み込みツール

- **Browser control**: Chrome/Chromium via CDP
- **Canvas + A2UI**: ビジュアルワークスペース
- **Node actions**: camera, screen record, location, notifications
- **Cron + wakeups**: 定期実行
- **Webhooks**: 外部連携
- **Gmail Pub/Sub**: メール統合
- **Session coordination**: `sessions_list`, `sessions_history`, `sessions_send`

### macOS ノード権限

- `system.run` — ローカルコマンド実行
- `system.notify` — ユーザー通知
- `node.invoke` — デバイスローカルツールルーティング（TCC 準拠）

## チャネル

WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, BlueBubbles (iMessage), iMessage (legacy), Microsoft Teams, Matrix, Zalo, Zalo Personal, WebChat

### DM セキュリティ

- `dmPolicy="pairing"` — 未知の送信者にペアリングコードを要求（デフォルト）
- `dmPolicy="open"` — `"*"` で明示的オプトイン必須
- `openclaw pairing approve <channel> <code>` で承認

## スキルプラットフォーム

3 階層構成:
1. **Bundled skills** — 同梱スキル
2. **Managed skills** — ClawHub から自動ダウンロード
3. **Workspace skills** — カスタムユーザー定義

## AltMe での使い方

### フロー: 課金 → プロビジョニング → Gateway 接続 → チャット

```
1. ユーザーが Pro 課金完了
   ↓ RevenueCat Webhook
2. Supabase Edge Function `provision-openclaw` 起動
   ↓ DigitalOcean API
3. Droplet 作成 + cloud-init で OpenClaw デプロイ
   ↓ Docker Compose up
4. Gateway :18789 で WebSocket 待受開始
   ↓ ヘルスチェック成功
5. モバイルアプリから WebSocket 接続
   ↓ gateway_token で認証
6. チャット開始（ストリーミング応答）
```

### 関連 Edge Functions

| 関数名 | 役割 |
|--------|------|
| `provision-openclaw` | Droplet 作成 + OpenClaw デプロイ |
| `destroy-openclaw` | Droplet 削除 + クリーンアップ |
| `health-check-openclaw` | 定期ヘルスチェック（5 分間隔 cron） |
| `update-soul-md` | SOUL.md 更新（ツイン名変更、性格診断やり直し時） |
| `restart-openclaw` | インスタンス再起動（エラー復旧） |

### 関連ファイル

| パス | 概要 |
|------|------|
| `src/services/openclaw/client.ts` | OpenClaw インスタンス管理クライアント |
| `src/services/openclaw/websocket-client.ts` | WebSocket クライアント |
| `src/shared/types/openclaw.ts` | 型定義 |
| `src/config/constants.ts` | OPENCLAW 定数 |
| `specs/features/openclaw-provisioning.md` | プロビジョニング仕様書 |
| `specs/features/chat.md` | チャット機能仕様書 |
| `specs/api/external-services.md` | 外部 API 仕様書 |

### 責務分離

| 領域 | 担当エージェント |
|------|----------------|
| Droplet 作成/削除/管理、ネットワーク、ファイアウォール、Docker 起動 | `digitalocean-infra` |
| SOUL.md 設計、Gateway API 連携、パーソナリティ設定、OpenClaw 設定 | `openclaw-specialist` |
| DB スキーマ、Edge Functions、RLS ポリシー | `supabase-backend` |

## セキュリティ

### デフォルト設定

- デフォルト sandbox モード: `main` セッションはホストレベルアクセス
- `agents.defaults.sandbox.mode: "non-main"` で非 main セッションを Docker sandbox 化
- DM ペアリングで未知送信者の処理を防止
- `gateway.auth.mode: "password"` が public Funnel アクセスに必須
- `openclaw doctor` でリスクのある DM ポリシーを検出

### AltMe 固有

- `OPENCLAW_GATEWAY_TOKEN`: UUID v4 で生成、DB に保存
- ポート 18789 のみ開放（UFW 制限）
- SSH: プロビジョニング時のみ使用

## リモートアクセス

### Tailscale

| モード | 説明 |
|--------|------|
| `off` | デフォルト |
| `serve` | tailnet 内のみ |
| `funnel` | パブリック（password 認証必須） |

### SSH トンネル

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

## 診断コマンド

```bash
openclaw gateway status [--deep] [--json]
openclaw channels status --probe
openclaw health [--json] [--timeout 10000]
openclaw doctor
openclaw logs --follow
```

## リファレンス

- `references/gateway-api.md` — Gateway API 全エンドポイント・WebSocket プロトコル仕様
- `references/soul-md.md` — SOUL.md フォーマット仕様・AltMe テンプレート
- `references/docker-deployment.md` — Docker デプロイ詳細・環境変数一覧
- `references/configuration.md` — openclaw.json 設定オプション全般
