# OpenClaw 設定リファレンス

## 設定ファイル

| 項目 | 値 |
|------|-----|
| パス | `~/.openclaw/openclaw.json` |
| フォーマット | JSON5（コメント・末尾カンマ対応） |
| 検証 | 厳密なスキーマバリデーション（不明キー・型不一致でエラー） |
| ホットリロード | デフォルト有効（`hybrid` モード） |

## 設定の読み書き方法

| 方法 | コマンド/手段 |
|------|-------------|
| CLI | `openclaw config get/set/unset` |
| ウィザード | `openclaw onboard` / `openclaw configure` |
| Web UI | `http://127.0.0.1:18789` |
| RPC | `config.get` / `config.apply` / `config.patch` メソッド |
| 直接編集 | ファイル編集 → 自動ホットリロード |

## 全設定オプション

### gateway（Gateway サーバー設定）

```json5
{
  gateway: {
    port: 18789,                    // Gateway ポート番号
    mode: "local",                  // "local" | "remote"
    bind: "loopback",              // "loopback" | "lan" | "tailnet"
    auth: {
      mode: "token",              // "token" | "password" | "trusted-proxy"
    },
  }
}
```

| キー | 型 | デフォルト | 説明 |
|------|-----|----------|------|
| `port` | number | `18789` | WebSocket ポート |
| `mode` | string | `"local"` | ローカル or リモートモード |
| `bind` | string | `"loopback"` | ネットワークバインド |
| `auth.mode` | string | `"token"` | 認証方式 |

**AltMe 設定値**: `port: 18789`, `bind: "lan"`, `auth.mode: "token"`

### agents（エージェント設定）

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["anthropic/claude-sonnet-4-5-20250929"],
        imageModel: null,
        thinkingDefault: "off",     // "off" | "low" | "high"
      },
      contextTokens: 200000,
      maxConcurrent: 3,
      bootstrapMaxChars: 20000,
      sandbox: {
        mode: "off",               // "off" | "non-main" | "all"
        scope: "agent",            // "session" | "agent" | "shared"
      },
    },
    list: [
      // 複数エージェント定義（省略可）
    ],
  }
}
```

| キー | 型 | デフォルト | 説明 |
|------|-----|----------|------|
| `defaults.model.primary` | string | `"anthropic/claude-opus-4-6"` | メインモデル |
| `defaults.model.fallbacks` | string[] | `[]` | フォールバックモデル |
| `defaults.contextTokens` | number | `200000` | コンテキストトークン数 |
| `defaults.maxConcurrent` | number | `3` | 最大同時実行数 |
| `defaults.bootstrapMaxChars` | number | `20000` | ブートストラップファイル最大文字数 |

**AltMe 設定値**: `model.primary: "anthropic/claude-sonnet-4-5-20250929"`, `contextTokens: 128000`

### sessions（セッション管理）

```json5
{
  sessions: {
    scope: "per-sender",           // "per-sender" | "main"
    dmScope: "main",              // "main" | "per-peer" | "per-channel-peer"
    reset: {
      mode: "idle",               // "daily" | "idle"
      idleMinutes: 60,
    },
  }
}
```

| キー | 型 | デフォルト | 説明 |
|------|-----|----------|------|
| `scope` | string | `"per-sender"` | セッション分離スコープ |
| `dmScope` | string | `"main"` | DM セッションスコープ |
| `reset.mode` | string | `"daily"` | リセットモード |
| `reset.idleMinutes` | number | - | idle モードのタイムアウト（分） |

### channels（チャネル設定）

```json5
{
  channels: {
    whatsapp: { enabled: false },
    telegram: {
      enabled: true,
      token: "${TELEGRAM_BOT_TOKEN}",
    },
    discord: {
      enabled: true,
      token: "${DISCORD_BOT_TOKEN}",
    },
    // slack, mattermost, signal, imessage, googlechat, msteams...
  }
}
```

#### DM ポリシー

| 値 | 説明 |
|-----|------|
| `pairing` | デフォルト。未知の送信者にワンタイム承認コード |
| `allowlist` | 許可リストのみ |
| `open` | 制限なし |
| `disabled` | 全 DM ブロック |

#### グループポリシー

| 値 | 説明 |
|-----|------|
| `allowlist` | デフォルト。ホワイトリスト制 |
| `open` | 制限なし |
| `disabled` | 全グループメッセージブロック |

### messages（メッセージ設定）

```json5
{
  messages: {
    responsePrefix: "",            // Agent 識別プレフィックス
    ackReaction: "",               // 受領確認の絵文字
    queue: {
      mode: "collect",            // "collect" | "steer" | "followup"
    },
  }
}
```

### tools（ツール設定）

```json5
{
  tools: {
    profile: "full",              // "minimal" | "coding" | "messaging" | "full"
    allow: [],                    // 追加許可ツール
    deny: [],                     // 拒否ツール
    elevated: {
      enabled: false,             // ホストコマンド実行
    },
  }
}
```

#### ツールプロファイル

| プロファイル | 含まれるツール |
|------------|-------------|
| `minimal` | 基本的な読み取りのみ |
| `coding` | ファイル操作、実行 |
| `messaging` | メッセージング + 基本 |
| `full` | 全ツール |

### skills（スキル設定）

```json5
{
  skills: {
    load: {
      extraDirs: [],              // 追加スキルディレクトリ
    },
    entries: {
      "skill-name": {
        enabled: true,
        apiKey: "API_KEY",
        env: { CUSTOM_VAR: "value" },
        config: { custom: "field" },
      },
    },
    allowBundled: [],             // バンドルスキル許可リスト
  }
}
```

### cron（スケジュール設定）

```json5
{
  cron: [
    {
      schedule: "0 9 * * *",      // cron 式
      prompt: "Check morning tasks",
      session: "cron-morning",
    },
  ]
}
```

### hooks（Webhook 設定）

```json5
{
  hooks: {
    webhooks: [
      {
        path: "/webhook/github",
        secret: "${GITHUB_WEBHOOK_SECRET}",
        session: "github-events",
      },
    ],
  }
}
```

### memory（メモリ設定）

```json5
{
  memory: {
    provider: "lancedb",          // "lancedb" | "core"
    compaction: {
      enabled: true,
      threshold: 50000,           // トークン閾値
    },
  }
}
```

### sandbox（サンドボックス設定）

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",         // "off" | "non-main" | "all"
        scope: "agent",           // "session" | "agent" | "shared"
        workspaceAccess: "none",  // "none" | "ro" | "rw"
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          memory: "1g",
          cpus: 1,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  }
}
```

### models（モデル設定）

```json5
{
  models: {
    aliases: {
      fast: "anthropic/claude-sonnet-4-5-20250929",
      smart: "anthropic/claude-opus-4-6",
    },
    providers: [
      {
        id: "custom-provider",
        type: "openai-compatible",
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_API_KEY}",
      },
    ],
  }
}
```

### tts（音声合成設定）

```json5
{
  tts: {
    provider: "elevenlabs",       // "elevenlabs" | "openai"
    voice: "voice-id",
  }
}
```

### env（インライン環境変数）

```json5
{
  env: {
    CUSTOM_VAR: "value",
    API_KEY: "secret",
  }
}
```

## ホットリロードモード

| モード | 説明 |
|--------|------|
| `hybrid`（デフォルト） | 安全な変更は即時適用、クリティカルな変更は自動再起動 |
| `hot` | 安全な変更のみ適用、再起動が必要な場合は警告 |
| `restart` | 全変更で再起動 |
| `off` | ファイル監視無効 |

### 即時適用される設定

- channels, agents, models, sessions, tools, skills, cron, hooks, messages, sandbox, memory

### 再起動が必要な設定

- gateway.port, gateway.bind, gateway.tls

## 環境変数の優先順位

1. プロセス環境変数（最高優先）
2. ローカル `.env` ファイル（CWD）
3. ユーザーレベル `~/.openclaw/.env`
4. `openclaw.json` の `env` セクション
5. `openclaw.json` 内の `${VAR_NAME}` 参照

## AltMe 用最小設定

```json5
{
  // エージェント設定
  agent: {
    model: {
      primary: "anthropic/claude-sonnet-4-5-20250929",
    },
    contextTokens: 128000,
  },

  // Gateway 設定
  gateway: {
    port: 18789,
    auth: {
      mode: "token",
    },
    bind: "lan",
  },

  // セッション設定
  sessions: {
    scope: "per-sender",
    reset: {
      mode: "idle",
      idleMinutes: 60,
    },
  },
}
```

## 設定の検証

```bash
# 設定ファイルの検証
openclaw doctor

# 自動修復
openclaw doctor --fix

# 現在の設定を表示
openclaw config get

# 特定キーの取得
openclaw config get agent.model.primary
```
