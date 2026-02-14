# ネットワーキングリファレンス

> Source: digitalocean-labs/do-app-platform-skills — skills/networking/SKILL.md + skills/troubleshooting/SKILL.md

## ファイアウォールルール設定

### DigitalOcean Cloud Firewall

DigitalOcean Firewall は Droplet の前段で動作するステートフルファイアウォール。

```bash
# ファイアウォール作成
doctl compute firewall create \
  --name altme-openclaw-fw \
  --inbound-rules "protocol:tcp,ports:18789,address:0.0.0.0/0,address:::/0 protocol:tcp,ports:22,address:<管理者IP>/32" \
  --outbound-rules "protocol:tcp,ports:all,address:0.0.0.0/0,address:::/0 protocol:udp,ports:all,address:0.0.0.0/0,address:::/0 protocol:icmp,address:0.0.0.0/0,address:::/0" \
  --droplet-ids <droplet_id>

# ファイアウォール一覧
doctl compute firewall list --format ID,Name,InboundRules,DropletIDs

# Droplet にファイアウォールを追加
doctl compute firewall add-droplets <firewall_id> --droplet-ids <droplet_id>

# ルール追加（既存ファイアウォールに）
doctl compute firewall add-rules <firewall_id> \
  --inbound-rules "protocol:tcp,ports:443,address:0.0.0.0/0"

# ルール削除
doctl compute firewall remove-rules <firewall_id> \
  --inbound-rules "protocol:tcp,ports:22,address:0.0.0.0/0"
```

### AltMe 推奨インバウンドルール

| プロトコル | ポート | ソース | 用途 |
|-----------|--------|--------|------|
| TCP | 18789 | `0.0.0.0/0, ::/0` | OpenClaw Gateway（WebSocket） |
| TCP | 22 | `<管理者IP>/32` | SSH（緊急メンテナンスのみ） |
| ICMP | — | `0.0.0.0/0` | Ping（監視用） |

**注意**: SSH は DigitalOcean Console 経由を推奨。直接 SSH は管理者 IP のみに制限。

### UFW（Droplet 内ファイアウォール）

DigitalOcean Cloud Firewall と併用する場合のバックアップとして設定。

```bash
# cloud-init で UFW を設定
runcmd:
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 18789/tcp comment 'OpenClaw Gateway'
  - ufw allow from <管理者IP> to any port 22 proto tcp comment 'SSH admin only'
  - ufw --force enable

# UFW ステータス確認
ufw status verbose
ufw status numbered

# ルール追加
ufw allow 18789/tcp

# ルール削除（番号指定）
ufw status numbered
ufw delete <rule_number>

# 特定 IP からのアクセスのみ許可
ufw allow from 203.0.113.0/24 to any port 18789
```

### 二重ファイアウォール構成（推奨）

```
インターネット
  ↓
[DigitalOcean Cloud Firewall] ← 第1層（API で管理可能）
  ↓
[UFW on Droplet]              ← 第2層（cloud-init で設定）
  ↓
[Docker Container :18789]
```

## VPC ネットワーキング

### VPC の作成と使用

```bash
# VPC 作成
doctl vpcs create \
  --name altme-vpc \
  --region sgp1 \
  --ip-range 10.10.10.0/24 \
  --description "AltMe OpenClaw instances"

# VPC 一覧
doctl vpcs list --format ID,Name,Region,IPRange

# Droplet を VPC に配置（作成時に指定）
doctl compute droplet create openclaw-001 \
  --image ubuntu-24-04-x64 \
  --size s-1vcpu-1gb \
  --region sgp1 \
  --vpc-uuid <vpc_id> \
  --ssh-keys <key_fingerprint>
```

### VPC 内通信

```
# VPC 内の Droplet 間はプライベート IP で通信
# パブリック IP: 外部からアクセス可能（ファイアウォール経由）
# プライベート IP: VPC 内のみアクセス可能（10.10.10.x）

# プライベート IP の確認
doctl compute droplet get <id> --format PrivateIPv4
```

### VPC ピアリング

同一リージョン内の VPC 間で通信が必要な場合に使用。

```bash
# VPC ピアリングの作成
doctl vpcs peerings create \
  --vpc-ids <vpc_id_1>,<vpc_id_2> \
  --name altme-peer
```

### Managed Database のファイアウォール

Droplet から Managed Database に接続する場合、DB のファイアウォールに Droplet の IP を追加する必要がある。

```bash
# DB ファイアウォールにルール追加
# 個別 Droplet IP
doctl databases firewalls append <cluster_id> --rule ip_addr:<droplet_ip>

# VPC CIDR 範囲（推奨: VPC 内の全 Droplet を許可）
doctl databases firewalls append <cluster_id> --rule ip_addr:10.10.10.0/24

# タグベース（Droplet タグ）
doctl databases firewalls append <cluster_id> --rule tag:altme

# ファイアウォールルール一覧
doctl databases firewalls list <cluster_id>
```

**重要**: VPC を使用していても、Bindable Variables は公開ホスト名を返す。VPC 内通信にはプライベート接続文字列を別途取得する必要がある。

## CORS 設定パターン

### App Platform での CORS 設定

```yaml
# app spec での CORS 設定
services:
  - name: api
    cors:
      allow_origins:
        - exact: "https://app.altme.ai"
        - exact: "https://staging.altme.ai"
      allow_methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      allow_headers:
        - Content-Type
        - Authorization
        - X-Request-ID
      allow_credentials: true
      max_age: "86400"
```

**重要な制約**: `allow_credentials: true` の場合、`allow_origins` にはワイルドカード（`*`）は使えない。正確なオリジンを指定すること。

### Express.js での CORS 設定（OpenClaw Gateway）

```typescript
import cors from 'cors';

// 本番環境
app.use(cors({
  origin: [
    'https://app.altme.ai',
    'https://staging.altme.ai',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400,
}));

// 開発環境
app.use(cors({
  origin: true, // 全オリジン許可（開発のみ）
  credentials: true,
}));
```

### WebSocket の CORS（OpenClaw Gateway）

WebSocket は CORS ポリシーの制約を受けないが、Origin ヘッダーでの検証を推奨。

```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 18789 });

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://app.altme.ai', 'https://staging.altme.ai'];

  if (origin && !allowedOrigins.includes(origin)) {
    ws.close(1008, 'Origin not allowed');
    return;
  }

  // 接続を処理
});
```

## ドメイン・DNS 設定

### DigitalOcean DNS

```bash
# ドメイン追加
doctl compute domain create altme.ai

# レコード追加
# A レコード（Droplet IP 指定）
doctl compute domain records create altme.ai \
  --record-type A \
  --record-name api \
  --record-data <droplet_ip> \
  --record-ttl 300

# CNAME レコード
doctl compute domain records create altme.ai \
  --record-type CNAME \
  --record-name www \
  --record-data altme.ai. \
  --record-ttl 300

# レコード一覧
doctl compute domain records list altme.ai

# レコード更新
doctl compute domain records update altme.ai \
  --record-id <record_id> \
  --record-data <new_ip>
```

### AltMe ドメイン構成（例）

| サブドメイン | レコードタイプ | 値 | 用途 |
|-------------|--------------|---|------|
| `app.altme.ai` | CNAME | App Platform or CDN | モバイルアプリ Web ビュー |
| `api.altme.ai` | A | Supabase IP | バックエンド API |
| `*.gateway.altme.ai` | A | 各 Droplet IP | OpenClaw Gateway（ユーザーごと） |

### ワイルドカード DNS（OpenClaw Gateway）

各ユーザーの OpenClaw インスタンスにサブドメインを割り当てる場合。

```bash
# ワイルドカード A レコード（ロードバランサー向け）
doctl compute domain records create altme.ai \
  --record-type A \
  --record-name "*.gateway" \
  --record-data <load_balancer_ip> \
  --record-ttl 300

# 個別ユーザーの A レコード（Droplet 直接）
doctl compute domain records create altme.ai \
  --record-type A \
  --record-name "user-abc123.gateway" \
  --record-data <user_droplet_ip> \
  --record-ttl 300
```

## AltMe での適用: ネットワーク設計

### 基本構成

```
[モバイルアプリ]
  ↓ HTTPS
[Supabase] (認証・DB・Edge Functions)
  ↓ HTTPS (Edge Function → DO API)
[DigitalOcean Cloud Firewall]
  ↓ TCP:18789
[Droplet (UFW)]
  ↓
[Docker: OpenClaw Gateway :18789]
```

### WebSocket 接続フロー

```
[モバイルアプリ]
  ↓ wss:// (将来的にはTLS終端)
[Droplet IP:18789]
  ↓ ws://localhost:18789 (Docker 内)
[OpenClaw Gateway]
```

### セキュリティ設計

1. **ポート 18789 のみ公開**: ファイアウォール（Cloud + UFW）で制限
2. **SSH は管理者 IP のみ**: DigitalOcean Console を優先
3. **VPC 内通信**: 同一 VPC 内の Droplet 間はプライベート IP
4. **TLS 終端**: 将来的に Nginx リバースプロキシまたは DigitalOcean Load Balancer で TLS 終端

## ネットワーク診断コマンド

```bash
# ポートリスン確認
ss -tlnp | grep 18789

# 外部からのポート到達性テスト
nc -zv <droplet_ip> 18789

# DNS 解決テスト
dig api.altme.ai
nslookup <subdomain>.gateway.altme.ai

# ファイアウォール状態
ufw status verbose
doctl compute firewall list

# Docker ネットワーク確認
docker network ls
docker network inspect bridge

# Droplet 間の接続テスト（VPC 内）
ping <private_ip>
curl -v http://<private_ip>:18789/health
```
