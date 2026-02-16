# SSL/TLS データベース接続ガイド

> Source: digitalocean-labs/do-app-platform-skills — shared/ssl-database-connections.md

## 概要

DigitalOcean Managed Database は独自 CA（Certificate Authority）で署名された証明書を使用する。
標準のクライアントライブラリはデフォルトでこの CA を信頼しないため、明示的な設定が必要。

## CA 証明書の取得

```bash
# DigitalOcean Console からダウンロード
# Database > Settings > Connection Parameters > Download CA Certificate

# または doctl で取得
doctl databases get <cluster_id> --format Connection.SSL.ca
```

## Node.js

### pg ライブラリ

```typescript
import { Pool } from 'pg';
import fs from 'fs';

// 本番環境（推奨）: CA 証明書を指定して完全検証
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
    rejectUnauthorized: true,  // 証明書を検証
  },
});

// 開発環境のみ: 検証スキップ（本番では絶対に使用しない）
const devPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
```

**注意**: Node.js の `pg` ライブラリでは、接続文字列の `?sslmode=require` パラメータだけでは CA 検証は行われない。必ず `ssl` オブジェクトで設定すること。

### 環境変数で CA 証明書を渡す場合

```typescript
// 環境変数に Base64 エンコードした証明書を保存
// CA_CERT=base64-encoded-content

const caCert = Buffer.from(process.env.CA_CERT!, 'base64').toString('utf-8');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: caCert,
    rejectUnauthorized: true,
  },
});
```

### Prisma

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
# 接続文字列に sslmode と sslcert パラメータを追加
DATABASE_URL="postgresql://user:pass@host:25060/db?sslmode=verify-full&sslcert=/path/to/ca-certificate.crt"

# 開発環境（検証なし）
DATABASE_URL="postgresql://user:pass@host:25060/db?sslmode=require"
```

```typescript
// Prisma Client でプログラマティックに設定する場合
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

## Python

### psycopg2

```python
import psycopg2

# 本番環境（推奨）: CA 証明書を指定
conn = psycopg2.connect(
    dsn=os.environ["DATABASE_URL"],
    sslmode="verify-full",
    sslrootcert="/path/to/ca-certificate.crt",
)

# 開発環境のみ: 検証なし（本番禁止）
conn = psycopg2.connect(
    dsn=os.environ["DATABASE_URL"],
    sslmode="require",  # 暗号化するが証明書検証しない
)
```

### asyncpg

```python
import asyncpg
import ssl

# 本番環境（推奨）: SSL コンテキストを作成
ssl_context = ssl.create_default_context(cafile="/path/to/ca-certificate.crt")
conn = await asyncpg.connect(
    dsn=os.environ["DATABASE_URL"],
    ssl=ssl_context,
)

# 開発環境のみ: 検証スキップ
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE
conn = await asyncpg.connect(
    dsn=os.environ["DATABASE_URL"],
    ssl=ssl_context,
)
```

### SQLAlchemy

```python
from sqlalchemy import create_engine

# 本番環境
engine = create_engine(
    os.environ["DATABASE_URL"],
    connect_args={
        "sslmode": "verify-full",
        "sslrootcert": "/path/to/ca-certificate.crt",
    },
)

# 開発環境
engine = create_engine(
    os.environ["DATABASE_URL"] + "?sslmode=require",
)
```

## Go

### lib/pq

```go
package main

import (
    "database/sql"
    "os"
    _ "github.com/lib/pq"
)

func main() {
    // 本番環境（推奨）: CA 証明書を指定
    connStr := os.Getenv("DATABASE_URL") + "&sslmode=verify-full&sslrootcert=/path/to/ca-certificate.crt"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        panic(err)
    }
    defer db.Close()
}
```

### pgx

```go
package main

import (
    "context"
    "crypto/tls"
    "crypto/x509"
    "os"

    "github.com/jackc/pgx/v5"
)

func main() {
    // 本番環境（推奨）: TLS 設定
    caCert, _ := os.ReadFile("/path/to/ca-certificate.crt")
    caCertPool := x509.NewCertPool()
    caCertPool.AppendCertsFromPEM(caCert)

    config, _ := pgx.ParseConfig(os.Getenv("DATABASE_URL"))
    config.TLSConfig = &tls.Config{
        RootCAs: caCertPool,
    }

    conn, _ := pgx.ConnectConfig(context.Background(), config)
    defer conn.Close(context.Background())
}
```

## Ruby

### pg gem

```ruby
require 'pg'

# 本番環境（推奨）
conn = PG.connect(
  ENV['DATABASE_URL'],
  sslmode: 'verify-full',
  sslrootcert: '/path/to/ca-certificate.crt'
)

# 開発環境のみ
conn = PG.connect(ENV['DATABASE_URL'], sslmode: 'require')
```

## Rust

### tokio-postgres

```rust
use native_tls::TlsConnector;
use postgres_native_tls::MakeTlsConnector;
use std::fs;

// 本番環境（推奨）
let cert = fs::read("/path/to/ca-certificate.crt")?;
let cert = native_tls::Certificate::from_pem(&cert)?;
let connector = TlsConnector::builder()
    .add_root_certificate(cert)
    .build()?;
let connector = MakeTlsConnector::new(connector);

let (client, connection) = tokio_postgres::connect(
    &std::env::var("DATABASE_URL")?,
    connector,
).await?;
```

## 接続文字列パラメータ

### sslmode オプション

| 値 | 暗号化 | CA 検証 | ホスト名検証 | 用途 |
|---|--------|---------|-------------|------|
| `disable` | No | No | No | **使用禁止** |
| `allow` | 可能なら | No | No | **使用禁止** |
| `prefer` | 可能なら | No | No | 非推奨 |
| `require` | Yes | No | No | 開発環境のみ |
| `verify-ca` | Yes | Yes | No | ステージング |
| `verify-full` | Yes | Yes | Yes | **本番推奨** |

### 接続文字列の例

```
# 本番環境（完全検証）
postgresql://user:pass@host:25060/db?sslmode=verify-full&sslrootcert=/path/to/ca-certificate.crt

# 開発環境（暗号化のみ）
postgresql://user:pass@host:25060/db?sslmode=require

# 環境変数に CA 証明書を含む場合（App Platform デプロイ向け）
postgresql://user:pass@host:25060/db?sslmode=verify-full&sslrootcert=/tmp/ca-cert.crt
```

## AltMe での適用

### Supabase 経由の接続（主要パターン）

AltMe はバックエンドに Supabase を使用するため、DB 接続は主に Supabase クライアント経由で行う。直接の PostgreSQL 接続は Edge Function 内で Supabase の接続プール経由で行われる。

```typescript
// Edge Function 内では Supabase クライアントを使用（SSL 自動設定）
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
```

### OpenClaw インスタンスから外部 DB への接続

OpenClaw が外部 DB に接続する場合は、CA 証明書を cloud-init で配置する。

```yaml
#cloud-config
write_files:
  - path: /opt/openclaw/ca-certificate.crt
    content: |
      -----BEGIN CERTIFICATE-----
      ... (CA 証明書内容) ...
      -----END CERTIFICATE-----
    permissions: '0644'
```

## よくある間違い

1. **Node.js で URL パラメータだけに頼る**: `?sslmode=require` だけでは `pg` ライブラリの CA 検証は有効にならない
2. **本番で SSL を無効化する**: `rejectUnauthorized: false` を本番に残す
3. **CA 証明書を Git にコミットする**: 環境変数または Vault で管理すべき
4. **全言語で同じ方法を使う**: 各言語・ライブラリで SSL 設定方法が異なる
