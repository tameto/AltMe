# OpenClaw Docker デプロイメント

## Docker イメージ

### 公式イメージ

| イメージ | 用途 |
|---------|------|
| `openclaw:local` | ソースからビルドしたローカルイメージ |
| `openclaw-sandbox:bookworm-slim` | サンドボックス実行用（軽量） |
| `openclaw-sandbox-browser` | ブラウザ付きサンドボックス |

### ベースイメージ

- `node:22-bookworm`
- Bun ランタイム（curl でインストール）
- corepack 有効化（pnpm 使用）

### ビルド

```bash
# 標準ビルド
docker build -t openclaw:local -f Dockerfile .

# 追加パッケージ付きビルド
docker build \
  --build-arg OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential" \
  -t openclaw:local \
  -f Dockerfile .
```

### エントリポイント

```
node openclaw.mjs gateway --allow-unconfigured
```

デフォルトで loopback (127.0.0.1) にバインド。外部アクセスには `--bind lan` が必要。

## docker-compose.yml テンプレート

### AltMe 本番用

```yaml
services:
  openclaw-gateway:
    image: ${OPENCLAW_IMAGE:-openclaw:local}
    environment:
      HOME: /home/node
      TERM: xterm-256color
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    volumes:
      - ${OPENCLAW_CONFIG_DIR:-/opt/openclaw/config}:/home/node/.openclaw
      - ${OPENCLAW_WORKSPACE_DIR:-/opt/openclaw/workspace}:/home/node/.openclaw/workspace
    ports:
      - "${OPENCLAW_GATEWAY_PORT:-18789}:18789"
    init: true
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "dist/index.js", "health", "--token", "${OPENCLAW_GATEWAY_TOKEN}", "--timeout", "5000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
        reservations:
          memory: 256M
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "lan",
        "--port",
        "18789",
      ]
```

### AltMe cloud-init 内 docker-compose.yml

DigitalOcean Droplet の cloud-init スクリプト内で使用する最小構成:

```yaml
version: '3.8'
services:
  openclaw:
    image: openclaw:local
    ports:
      - "18789:18789"
    volumes:
      - ./config:/home/node/.openclaw
      - ./workspace:/home/node/.openclaw/workspace
    environment:
      - OPENCLAW_GATEWAY_TOKEN=${GATEWAY_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped
    init: true
    command: ["node", "dist/index.js", "gateway", "--bind", "lan", "--port", "18789"]
```

## ボリュームマウント設計

### 必須ボリューム

| ホスト | コンテナ | 用途 |
|--------|---------|------|
| `${CONFIG_DIR}` | `/home/node/.openclaw` | 設定ディレクトリ（openclaw.json, .env） |
| `${WORKSPACE_DIR}` | `/home/node/.openclaw/workspace` | ワークスペース（SOUL.md, IDENTITY.md, skills/） |

### AltMe Droplet でのディレクトリ構造

```
/opt/openclaw/
  docker-compose.yml          # Docker Compose 設定
  config/                     # → /home/node/.openclaw
    openclaw.json             # メイン設定
    .env                      # 環境変数
  workspace/                  # → /home/node/.openclaw/workspace
    SOUL.md                   # エージェント性格定義
    IDENTITY.md               # エージェント識別情報
    skills/                   # カスタムスキル
  data/                       # 永続データ（ログ等）
```

### SOUL.md ボリュームマウント

SOUL.md はワークスペースディレクトリ内に配置:

```yaml
volumes:
  - /opt/openclaw/workspace:/home/node/.openclaw/workspace
# SOUL.md は /opt/openclaw/workspace/SOUL.md に配置
```

## 環境変数一覧

### 必須

| 変数 | 説明 | 例 |
|------|------|-----|
| `OPENCLAW_GATEWAY_TOKEN` | Gateway 認証トークン | `openssl rand -hex 32` の出力 |

### LLM プロバイダー（いずれか 1 つ以上必須）

| 変数 | プロバイダー | 説明 |
|------|------------|------|
| `ANTHROPIC_API_KEY` | Anthropic | Claude モデル用 API キー |
| `OPENAI_API_KEY` | OpenAI | GPT モデル用 API キー |
| `GOOGLE_AI_API_KEY` | Google | Gemini モデル用 API キー |
| `OPENROUTER_API_KEY` | OpenRouter | マルチプロバイダーアクセス |

### Gateway 設定

| 変数 | デフォルト | 説明 |
|------|----------|------|
| `OPENCLAW_GATEWAY_PORT` | `18789` | Gateway ポート |
| `OPENCLAW_BRIDGE_PORT` | `18790` | Bridge ポート（レガシー） |
| `OPENCLAW_GATEWAY_BIND` | `lan` | バインドモード: `loopback`, `lan`, `tailnet` |
| `OPENCLAW_CONFIG_DIR` | `~/.openclaw` | 設定ディレクトリ |
| `OPENCLAW_WORKSPACE_DIR` | `~/.openclaw/workspace` | ワークスペースディレクトリ |

### Docker ビルド

| 変数 | 説明 |
|------|------|
| `OPENCLAW_DOCKER_APT_PACKAGES` | 追加 APT パッケージ（スペース区切り） |
| `OPENCLAW_IMAGE` | Docker イメージ名（デフォルト: `openclaw:local`） |
| `OPENCLAW_EXTRA_MOUNTS` | 追加バインドマウント（カンマ区切り） |
| `OPENCLAW_HOME_VOLUME` | `/home/node` 永続化用名前付きボリューム |

### チャネル（オプション）

| 変数 | チャネル |
|------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram |
| `DISCORD_BOT_TOKEN` | Discord |
| `SLACK_BOT_TOKEN` | Slack |

### ツール・サービス（オプション）

| 変数 | サービス |
|------|---------|
| `BRAVE_SEARCH_API_KEY` | Brave Search |
| `PERPLEXITY_API_KEY` | Perplexity |
| `FIRECRAWL_API_KEY` | Firecrawl |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS |
| `DEEPGRAM_API_KEY` | Deepgram STT |

## ヘルスチェック設定

### Docker Compose healthcheck

```yaml
healthcheck:
  test: ["CMD", "node", "dist/index.js", "health", "--token", "${OPENCLAW_GATEWAY_TOKEN}", "--timeout", "5000"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

### CLI ヘルスチェック

```bash
# コンテナ内から
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"

# ホストから（WebSocket 接続テスト）
# AltMe の health-check-openclaw Edge Function が使用する方法
ws://{ip}:18789 に接続 → health メッセージ送信 → 応答確認
```

### AltMe ヘルスチェック Edge Function

```
1. openclaw_instances から status IN ('running', 'provisioning') を取得
2. 各インスタンスに WebSocket 接続試行 (ws://{ip}:18789)
3. health メッセージ送信、10 秒タイムアウト
4. 成功: last_health_check 更新
5. 失敗 3 回連続: status = 'error'
```

## リソース制限設定

### DigitalOcean Droplet サイズ別

| Droplet サイズ | vCPU | RAM | コスト | 推奨 |
|---------------|------|-----|--------|------|
| `s-1vcpu-1gb` | 1 | 1GB | $6/月 | 基本（AltMe デフォルト） |
| `s-1vcpu-2gb` | 1 | 2GB | $12/月 | 長いコンテキスト |
| `s-2vcpu-2gb` | 2 | 2GB | $18/月 | 高負荷 |

### Docker リソース制限

```yaml
deploy:
  resources:
    limits:
      memory: 512M     # s-1vcpu-1gb の場合
      cpus: '1.0'
    reservations:
      memory: 256M
```

### メモリ使用量目安

| コンポーネント | メモリ |
|--------------|--------|
| Node.js ランタイム | 100-150MB |
| Gateway サーバー | 50-100MB |
| Agent ランタイム（アクティブ時） | 100-200MB |
| **合計** | **250-450MB** |

## ログ管理

### ログ出力先

- コンテナ stdout/stderr → `docker compose logs`
- ファイルログ: `/home/node/.openclaw/logs/`（コンテナ内）

### ログ確認コマンド

```bash
# リアルタイムログ
docker compose logs -f openclaw-gateway

# 最新 100 行
docker compose logs --tail 100 openclaw-gateway
```

### ログローテーション（Docker）

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

## AltMe cloud-init 完全スクリプト

```bash
#!/bin/bash
set -euo pipefail

# 環境変数（provision-openclaw Edge Function から注入）
GATEWAY_TOKEN="${GATEWAY_TOKEN}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
SOUL_MD_CONTENT="${SOUL_MD_CONTENT}"
TWIN_NAME="${TWIN_NAME}"

# ディレクトリ作成
mkdir -p /opt/openclaw/{config,workspace,data}

# SOUL.md 配置
cat > /opt/openclaw/workspace/SOUL.md << 'SOULEOF'
${SOUL_MD_CONTENT}
SOULEOF

# IDENTITY.md 配置
cat > /opt/openclaw/workspace/IDENTITY.md << IDEOF
# IDENTITY.md

- **Name:** ${TWIN_NAME}
- **Creature:** AI Twin
- **Vibe:** warm, empathetic
- **Emoji:** (none)
IDEOF

# openclaw.json 設定
cat > /opt/openclaw/config/openclaw.json << 'CONFEOF'
{
  "agent": {
    "model": {
      "primary": "anthropic/claude-sonnet-4-5-20250929"
    },
    "contextTokens": 128000
  },
  "gateway": {
    "port": 18789,
    "auth": {
      "mode": "token"
    },
    "bind": "lan"
  },
  "sessions": {
    "scope": "per-sender",
    "reset": {
      "mode": "idle",
      "idleMinutes": 60
    }
  }
}
CONFEOF

# .env 配置
cat > /opt/openclaw/config/.env << ENVEOF
OPENCLAW_GATEWAY_TOKEN=${GATEWAY_TOKEN}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ENVEOF

# docker-compose.yml 配置
cat > /opt/openclaw/docker-compose.yml << 'DCEOF'
services:
  openclaw-gateway:
    image: openclaw:local
    environment:
      HOME: /home/node
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    env_file:
      - ./config/.env
    volumes:
      - ./config:/home/node/.openclaw
      - ./workspace:/home/node/.openclaw/workspace
    ports:
      - "18789:18789"
    init: true
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
    command: ["node", "dist/index.js", "gateway", "--bind", "lan", "--port", "18789"]
DCEOF

# UFW ファイアウォール
ufw allow 18789/tcp
ufw --force enable

# OpenClaw イメージビルド or pull
cd /opt/openclaw
git clone --depth 1 https://github.com/openclaw/openclaw.git /tmp/openclaw-src
cd /tmp/openclaw-src
docker build -t openclaw:local -f Dockerfile .

# 起動
cd /opt/openclaw
docker compose up -d

# クリーンアップ
rm -rf /tmp/openclaw-src
```

## トラブルシューティング

| 症状 | 原因 | 対策 |
|------|------|------|
| Gateway に接続できない | ポートが閉じている | `ufw allow 18789/tcp` |
| AUTH_FAILED | トークン不一致 | `.env` の `OPENCLAW_GATEWAY_TOKEN` と DB の `gateway_token` を比較 |
| メモリ不足で OOM Kill | Droplet サイズが小さい | `s-1vcpu-2gb` にアップグレード |
| コンテナが再起動ループ | 設定エラー | `docker compose logs` で確認 |
| SOUL.md が反映されない | ボリュームマウント不正 | コンテナ内で `cat /home/node/.openclaw/workspace/SOUL.md` |
| ヘルスチェック失敗 | Gateway 未起動 | `docker compose ps` → `docker compose restart` |
