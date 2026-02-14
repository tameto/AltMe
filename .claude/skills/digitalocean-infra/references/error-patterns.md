# エラーパターン集と対処法

> Source: digitalocean-labs/do-app-platform-skills — shared/error-patterns.md + troubleshooting/SKILL.md

## DB接続エラー

### 1. SELF_SIGNED_CERT_IN_CHAIN

**症状**: Node.js で DB 接続時に `SELF_SIGNED_CERT_IN_CHAIN` エラー
**原因**: DigitalOcean Managed Database は独自 CA で署名された証明書を使用。Node.js のデフォルト検証で拒否される
**対処法**:
```typescript
// 本番: CA 証明書を指定（推奨）
import { Pool } from 'pg';
import fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
    rejectUnauthorized: true,
  },
});

// 開発のみ: 検証スキップ（本番禁止）
const devPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

### 2. ECONNREFUSED

**症状**: `connect ECONNREFUSED <ip>:<port>`
**原因**: DB サーバーが起動していない、またはファイアウォールでブロック
**対処法**:
```bash
# Docker コンテナの状態確認
docker ps -a
docker logs <container_name>

# ポートリスン確認
ss -tlnp | grep <port>

# ファイアウォール確認
ufw status
# DigitalOcean Firewall で DB ポートが許可されているか確認
doctl compute firewall list --format ID,Name,InboundRules
```

### 3. permission denied

**症状**: `FATAL: permission denied for database "xxx"` or `permission denied for table`
**原因**: DB ユーザーに必要な権限がない
**対処法**:
```sql
-- ユーザー権限確認
\du
-- データベースへの接続権限付与
GRANT CONNECT ON DATABASE mydb TO myuser;
-- テーブルへの権限付与
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO myuser;
-- 今後のテーブルにもデフォルト権限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO myuser;
```

### 4. too many connections

**症状**: `FATAL: too many connections for role "xxx"` or `remaining connection slots are reserved`
**原因**: コネクションプールを使っていない、または接続がリークしている
**対処法**:
```typescript
// コネクションプール設定（pg）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,           // 最大接続数（デフォルト10）
  idleTimeoutMillis: 30000,  // アイドル接続のタイムアウト
  connectionTimeoutMillis: 5000, // 接続タイムアウト
});

// 接続を必ず返却
const client = await pool.connect();
try {
  await client.query('SELECT ...');
} finally {
  client.release();  // 必ず release()
}
```
```bash
# 現在の接続数を確認
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
# 接続中のユーザーごとの接続数
psql $DATABASE_URL -c "SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;"
```

### 5. SSL connection required

**症状**: `FATAL: no pg_hba.conf entry for host "x.x.x.x", user "xxx", database "xxx", SSL off`
**原因**: Managed Database は SSL 必須だが、接続文字列に `sslmode` がない
**対処法**:
```bash
# 接続文字列に sslmode=require を追加
DATABASE_URL="postgresql://user:pass@host:25060/db?sslmode=require"
```

### 6. connection timed out

**症状**: DB 接続がタイムアウトする
**原因**: ネットワーク到達性の問題（ファイアウォール、セキュリティグループ）
**対処法**:
```bash
# ネットワーク到達性テスト
nc -zv <db_host> <db_port>
# DNS 解決確認
dig <db_host>
# DigitalOcean DB ファイアウォール確認（Droplet の IP を許可する必要あり）
doctl databases firewalls list <cluster_id>
# Droplet の IP を許可
doctl databases firewalls append <cluster_id> --rule ip_addr:<droplet_ip>
```

### 7. authentication failed

**症状**: `FATAL: password authentication failed for user "xxx"`
**原因**: パスワードが間違っている、またはユーザーが存在しない
**対処法**:
```bash
# ユーザー一覧確認
doctl databases user list <cluster_id>
# パスワードリセット
doctl databases user reset <cluster_id> <username>
```

### 8. database does not exist

**症状**: `FATAL: database "xxx" does not exist`
**原因**: 指定された DB が作成されていない
**対処法**:
```bash
# DB 一覧確認
doctl databases db list <cluster_id>
# DB 作成
doctl databases db create <cluster_id> <db_name>
```

### 9. could not translate host name

**症状**: `could not translate host name "xxx" to address`
**原因**: DNS 解決の問題
**対処法**:
```bash
# DNS 確認
cat /etc/resolv.conf
# Google DNS を追加して再試行
echo "nameserver 8.8.8.8" >> /etc/resolv.conf
# ホスト名を直接 IP で解決テスト
dig <hostname>
nslookup <hostname>
```

### 10. pg_isready タイムアウト

**症状**: `pg_isready` コマンドがタイムアウト
**原因**: DB が起動中、またはネットワーク問題
**対処法**:
```bash
# DB ステータス確認
pg_isready -h <host> -p <port> -U <user> -d <dbname> -t 10
# DigitalOcean Managed DB の場合はクラスター状態確認
doctl databases get <cluster_id> --format Status
```

## コンテナ起動エラー

### 1. Cannot find module

**症状**: `Error: Cannot find module 'xxx'`
**原因**: `node_modules` が不完全、または Docker ビルド時にインストールされていない
**対処法**:
```dockerfile
# Dockerfile でクリーンインストール
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .
```
```bash
# Droplet 上で直接修復
docker exec -it <container> npm ci
# コンテナ再ビルド
docker compose build --no-cache && docker compose up -d
```

### 2. EADDRINUSE

**症状**: `Error: listen EADDRINUSE: address already in use :::18789`
**原因**: 同じポートで別プロセスが既に起動中
**対処法**:
```bash
# ポートを使用しているプロセス確認
ss -tlnp | grep 18789
# Docker コンテナの場合
docker ps --format "{{.ID}} {{.Ports}}" | grep 18789
# 既存コンテナ停止
docker stop <container_id>
# 全ての OpenClaw コンテナを停止
docker ps -q --filter "ancestor=ghcr.io/openclaw/openclaw" | xargs -r docker stop
```

### 3. OOMKilled

**症状**: コンテナが `OOMKilled` で終了（exit code 137）
**原因**: コンテナのメモリ使用量が制限を超過
**対処法**:
```bash
# コンテナのメモリ使用状況確認
docker stats --no-stream
# メモリ制限を引き上げ（docker-compose.yml）
```
```yaml
# docker-compose.yml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    deploy:
      resources:
        limits:
          memory: 768M    # メモリ制限引き上げ
        reservations:
          memory: 256M
```
```bash
# Droplet サイズアップ（最終手段）
doctl compute droplet-action resize <droplet_id> --size s-1vcpu-2gb --resize-disk
```

### 4. exec format error

**症状**: `exec /usr/local/bin/node: exec format error`
**原因**: Docker イメージのアーキテクチャと Droplet の CPU アーキテクチャが不一致（ARM イメージを AMD64 で実行等）
**対処法**:
```bash
# イメージのアーキテクチャ確認
docker inspect <image> | grep Architecture
# 正しいプラットフォームでプル
docker pull --platform linux/amd64 ghcr.io/openclaw/openclaw:latest
```
```dockerfile
# Dockerfile でプラットフォーム指定
FROM --platform=linux/amd64 node:22-slim
```

### 5. container exited immediately (exit code 0 or 1)

**症状**: コンテナが起動直後に終了
**原因**: アプリがフォアグラウンドで実行されていない、またはクラッシュ
**対処法**:
```bash
# 終了ログ確認
docker logs <container> --tail 50
# 手動でコンテナ内に入って確認
docker run -it --entrypoint /bin/sh <image>
# CMD / ENTRYPOINT が正しいか確認
docker inspect <image> --format '{{.Config.Cmd}} {{.Config.Entrypoint}}'
```

### 6. no space left on device

**症状**: `no space left on device`
**原因**: Droplet のディスクが満杯
**対処法**:
```bash
# ディスク使用状況確認
df -h
du -sh /var/lib/docker/
# Docker のクリーンアップ
docker system prune -af    # 未使用イメージ・コンテナ・ボリューム全削除
docker volume prune -f     # 未使用ボリューム削除
# 古いログの削除
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### 7. network not found / bridge error

**症状**: `network xxx not found` または Docker ネットワーク関連エラー
**原因**: Docker ネットワークが破損、または docker-compose.yml のネットワーク定義が不正
**対処法**:
```bash
# Docker ネットワーク一覧
docker network ls
# 破損したネットワーク削除
docker network prune -f
# Docker Compose でネットワーク再作成
docker compose down && docker compose up -d
```

## ビルドエラー

### 1. ERESOLVE (npm dependency conflict)

**症状**: `npm ERR! ERESOLVE unable to resolve dependency tree`
**原因**: npm の依存関係バージョン競合
**対処法**:
```bash
# --legacy-peer-deps で回避
npm install --legacy-peer-deps
# package-lock.json を再生成
rm -rf node_modules package-lock.json
npm install
```
```dockerfile
# Dockerfile での対処
RUN npm ci --legacy-peer-deps
```

### 2. COPY failed: file not found

**症状**: `COPY failed: file not found in build context`
**原因**: .dockerignore がファイルを除外している、またはパスが間違っている
**対処法**:
```bash
# .dockerignore 確認
cat .dockerignore
# ビルドコンテキスト内のファイル確認
ls -la
# .dockerignore から必要なファイルを除外解除
```

### 3. tsc: command not found

**症状**: `sh: tsc: command not found`
**原因**: TypeScript がグローバルにインストールされていない
**対処法**:
```dockerfile
# devDependencies も含めてインストール
RUN npm ci
RUN npx tsc --build
# または明示的にインストール
RUN npm install -g typescript
```

### 4. Python package build failed

**症状**: `error: subprocess-exited-with-error` during pip install
**原因**: C 拡張のビルドに必要なシステムパッケージが不足
**対処法**:
```dockerfile
# ビルド依存関係をインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt
```

### 5. Go module download failure

**症状**: `go: module lookup disabled by GOPROXY=off`
**原因**: ビルド環境でネットワークアクセスが制限されている
**対処法**:
```dockerfile
# Go モジュールのキャッシュを利用
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /app
```

## ヘルスチェック失敗

### 1. 503 Service Unavailable

**症状**: ヘルスチェックが 503 を返す
**原因**: アプリが完全に起動していない、またはバックエンドサービスに接続できない
**対処法**:
```bash
# アプリの起動状態確認
docker logs <container> --tail 100
# ヘルスエンドポイントを手動テスト
curl -v http://localhost:18789/health
# コンテナ内からテスト
docker exec <container> curl -s http://localhost:18789/health
```

### 2. Connection refused on health check

**症状**: ヘルスチェックで `Connection refused`
**原因**: アプリが `localhost` ではなく `127.0.0.1` のみにバインドしている
**対処法**:
```typescript
// 全インターフェースにバインド（0.0.0.0）
app.listen(18789, '0.0.0.0', () => {
  console.log('Server listening on 0.0.0.0:18789');
});
```
```bash
# バインドアドレス確認
docker exec <container> ss -tlnp
# 0.0.0.0:18789 で LISTEN していることを確認
```

### 3. Health check timeout

**症状**: ヘルスチェックがタイムアウト
**原因**: アプリの起動に時間がかかっている、またはヘルスチェックエンドポイントが重い処理を実行
**対処法**:
```yaml
# docker-compose.yml でヘルスチェック設定
services:
  openclaw:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s  # 起動待機時間を延長
```

### 4. Non-200 response

**症状**: ヘルスチェックが 200 以外のステータスコードを返す
**原因**: ヘルスエンドポイントが依存サービスの状態もチェックしている
**対処法**:
```typescript
// ヘルスエンドポイントはシンプルに保つ
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 詳細なヘルスチェックは別エンドポイント
app.get('/health/detailed', async (req, res) => {
  const dbOk = await checkDatabase();
  const cacheOk = await checkCache();
  const status = dbOk && cacheOk ? 200 : 503;
  res.status(status).json({ db: dbOk, cache: cacheOk });
});
```

## Exit Code リファレンス

| Exit Code | シグナル | 原因 | 対処 |
|-----------|---------|------|------|
| 0 | 正常終了 | プロセスが正常に終了した | フォアグラウンド実行を確認 |
| 1 | ERROR | アプリケーションエラー | ログを確認 |
| 126 | NOEXEC | 実行権限がない | `chmod +x` で実行権限付与 |
| 127 | NOTFOUND | コマンドが見つからない | PATH / インストール確認 |
| 137 | SIGKILL (OOM) | メモリ不足で強制終了 | メモリ制限引き上げ or Droplet サイズアップ |
| 139 | SIGSEGV | セグメンテーション違反 | ネイティブモジュールの再ビルド |
| 143 | SIGTERM | 正常な停止リクエスト | 通常の動作（Docker stop） |

## 診断コマンド集

### Droplet レベル

```bash
# システムリソース確認
htop                          # CPU/メモリのリアルタイム確認
df -h                         # ディスク使用状況
free -h                       # メモリ使用状況
uptime                        # 稼働時間・負荷平均

# ネットワーク診断
ss -tlnp                      # リスニングポート一覧
curl -v http://localhost:18789/health  # ヘルスチェック手動実行
ip addr show                  # ネットワークインターフェース
```

### Docker レベル

```bash
# コンテナ状態
docker ps -a                  # 全コンテナ一覧（停止含む）
docker stats --no-stream      # リソース使用状況スナップショット
docker inspect <container>    # コンテナ詳細情報

# ログ
docker logs <container> --tail 100              # 最新100行
docker logs <container> --since 1h              # 直近1時間
docker logs <container> 2>&1 | grep -i error    # エラーのみ

# クリーンアップ
docker system df              # Docker のディスク使用状況
docker system prune -af       # 未使用リソース全削除
```

### DigitalOcean API レベル

```bash
# Droplet 操作
doctl compute droplet get <id> --format ID,Name,Status,PublicIPv4
doctl compute droplet actions <id>
doctl compute droplet logs <id>

# ファイアウォール確認
doctl compute firewall list --format ID,Name,InboundRules
doctl compute firewall get <firewall_id>
```
