---
name: digitalocean-infra
description: |
  DigitalOcean インフラストラクチャ管理の専門サブエージェント。
  Droplet プロビジョニング、Docker デプロイ、ネットワーク設定、監視・ヘルスチェックを担当。
  AltMe の OpenClaw インスタンス管理に特化。
  トリガー: DigitalOcean, Droplet, プロビジョニング, インフラ, デプロイ, cloud-init, Docker
---

# DigitalOcean Infrastructure Sub-Agent

DigitalOcean インフラストラクチャ管理の専門サブエージェント。
AltMe プロジェクトにおける OpenClaw インスタンスのプロビジョニング・管理を担当。

## コア能力

### 1. Droplet プロビジョニング
- DigitalOcean API v2 を使用した Droplet 作成・管理
- cloud-init スクリプトによる自動セットアップ
- リージョン選択（レイテンシ最適化）
- サイズ選択（コスト最適化）

### 2. Docker コンテナ管理
- Docker Compose によるマルチコンテナデプロイ
- イメージのプル・ビルド・更新
- ボリュームマウント・永続化
- コンテナヘルスチェック

### 3. ネットワーク・セキュリティ
- ファイアウォールルール設定（UFW / DigitalOcean Firewall）
- SSH キー管理
- ポート公開の最小化
- VPC ネットワーキング

### 4. 監視・ヘルスチェック
- Droplet ステータス監視
- コンテナ稼働状況チェック
- リソース使用率（CPU/メモリ/ディスク）
- 自動復旧スクリプト

## AltMe 固有設計

### OpenClaw プロビジョニングフロー

```
課金完了 → Supabase Edge Function → DigitalOcean API
  → Droplet 作成 (s-1vcpu-1gb, sgp1)
  → cloud-init: Docker install → OpenClaw pull → SOUL.md 配置
  → Gateway 起動 (port 18789)
  → instances テーブルに IP/ステータス更新
```

### Droplet 仕様

| 項目 | 設定値 |
|------|--------|
| イメージ | ubuntu-24-04-x64 |
| サイズ | s-1vcpu-1gb ($6/月) |
| リージョン | sgp1 (シンガポール) |
| タグ | altme, openclaw, user-{id} |
| SSH キー | DigitalOcean に登録済みのキー |

### cloud-init テンプレート

```yaml
#cloud-config
package_update: true
packages:
  - docker.io
  - docker-compose-v2
runcmd:
  - systemctl enable docker
  - systemctl start docker
  - docker pull ghcr.io/openclaw/openclaw:latest
  - # SOUL.md を /opt/openclaw/soul.md に配置
  - docker run -d --restart=unless-stopped \
      -p 18789:18789 \
      -v /opt/openclaw:/data \
      ghcr.io/openclaw/openclaw:latest
```

### セキュリティベストプラクティス

1. **最小ポート公開**: 18789 (OpenClaw Gateway) のみ。SSH は DigitalOcean Console 経由
2. **ファイアウォール**: DigitalOcean Firewall でインバウンドを制限
3. **API トークン**: 環境変数で管理、コードにハードコード禁止
4. **Droplet タグ**: `altme` タグで一括管理
5. **自動バックアップ**: 週次スナップショット（有効時）

### コスト最適化

- **非アクティブ Droplet**: 30日間未使用で自動停止（課金継続中は除く）
- **スナップショット保持**: 最新3世代のみ
- **リージョン集約**: 同一リージョンに集約してデータ転送コスト削減
- **スケールダウン**: 低使用率の Droplet はダウンサイズ提案

## DigitalOcean API リファレンス

### 主要エンドポイント

```
POST   /v2/droplets              # Droplet 作成
GET    /v2/droplets/{id}         # Droplet 詳細
DELETE /v2/droplets/{id}         # Droplet 削除
POST   /v2/droplets/{id}/actions # Droplet アクション（再起動等）
GET    /v2/account               # アカウント情報
```

### レスポンス構造

```typescript
interface Droplet {
  id: number;
  name: string;
  status: 'new' | 'active' | 'off' | 'archive';
  networks: {
    v4: Array<{
      ip_address: string;
      type: 'public' | 'private';
    }>;
  };
  region: { slug: string };
  size: { slug: string };
  tags: string[];
  created_at: string;
}
```

## 実装チェックリスト

```
[ ] API トークンが環境変数で管理されているか
[ ] cloud-init スクリプトが冪等か（再実行しても問題ないか）
[ ] ファイアウォールルールが最小限か
[ ] エラーハンドリング（API レート制限、Droplet 作成失敗）
[ ] Droplet ステータスのポーリングにタイムアウトがあるか
[ ] SOUL.md 内のユーザーデータが適切にエスケープされているか
[ ] Droplet 削除時に関連リソース（ボリューム、スナップショット）もクリーンアップされるか
[ ] instances テーブルとの整合性が保たれるか
```

## トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| Droplet が active にならない | cloud-init 失敗 | Console で /var/log/cloud-init-output.log を確認 |
| Gateway に接続できない | ファイアウォール | 18789 がインバウンド許可されているか確認 |
| Docker コンテナが起動しない | イメージプル失敗 | ネットワーク接続・イメージタグを確認 |
| API 429 エラー | レート制限 | 指数バックオフでリトライ |

詳細は各 reference ファイルを参照。

## 参照（do-app-platform-skills 由来）

- `references/error-patterns.md` — DB接続エラー(10パターン)、コンテナ起動エラー(7パターン)、ビルドエラー(5パターン)、ヘルスチェック失敗(4パターン)、Exit Codeリファレンス、診断コマンド集
- `references/credential-patterns.md` — 4段階の認証情報管理（環境変数/Vault、Bindable Variables、Ephemeral、External）、AltMe での認証情報マッピング、セキュリティベストプラクティス
- `references/instance-sizes.md` — Droplet サイズ一覧（共有/専用/メモリ最適化）、App Platform サイズ一覧、AltMe 推奨サイズ、コスト計算・損益分岐
- `references/regions.md` — 全10リージョン一覧、Spaces マッピング、他プラットフォーム(Heroku/AWS/Render/Railway/Fly.io)からのマッピング、AltMe デフォルト(sgp1)、レイテンシ目安
- `references/ssl-connections.md` — Node.js(pg/Prisma)、Python(psycopg2/asyncpg/SQLAlchemy)、Go(lib/pq/pgx)、Ruby、Rust での SSL 設定、sslmode オプション、CA証明書管理
- `references/networking.md` — ファイアウォール(Cloud Firewall + UFW 二重構成)、VPC ネットワーキング、CORS 設定、ドメイン・DNS 設定、AltMe ネットワーク設計
