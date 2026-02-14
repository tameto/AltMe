# インスタンスサイズ・価格リファレンス

> Source: digitalocean-labs/do-app-platform-skills — shared/instance-sizes.yaml

## Droplet サイズ一覧（AltMe で使用）

AltMe は App Platform ではなく Droplet を直接使用するため、Droplet のサイズ体系を使用する。

### 共有CPU（Shared / Basic）

コスト効率が高く、バースト可能。開発・テスト・軽量ワークロード向け。

| Slug | vCPU | RAM | ディスク | 月額 | 帯域幅 |
|------|------|-----|---------|------|--------|
| `s-1vcpu-512mb` | 1 shared | 512MB | 10GB | $4 | 500GB |
| `s-1vcpu-1gb` | 1 shared | 1GB | 25GB | $6 | 1TB |
| `s-1vcpu-1gb-amd` | 1 shared (AMD) | 1GB | 25GB | $7 | 1TB |
| `s-1vcpu-1gb-intel` | 1 shared (Intel) | 1GB | 25GB | $7 | 1TB |
| `s-1vcpu-2gb` | 1 shared | 2GB | 50GB | $12 | 2TB |
| `s-1vcpu-2gb-amd` | 1 shared (AMD) | 2GB | 50GB | $14 | 2TB |
| `s-1vcpu-2gb-intel` | 1 shared (Intel) | 2GB | 50GB | $14 | 2TB |
| `s-2vcpu-2gb` | 2 shared | 2GB | 60GB | $18 | 3TB |
| `s-2vcpu-4gb` | 2 shared | 4GB | 80GB | $24 | 4TB |
| `s-4vcpu-8gb` | 4 shared | 8GB | 160GB | $48 | 5TB |

### 専用CPU（Dedicated / CPU-Optimized）

一貫したパフォーマンス。SLA のある本番環境・レイテンシ重視のワークロード向け。

| Slug | vCPU | RAM | ディスク | 月額 |
|------|------|-----|---------|------|
| `c-2` | 2 dedicated | 4GB | 25GB | $42 |
| `c-4` | 4 dedicated | 8GB | 50GB | $84 |
| `c-8` | 8 dedicated | 16GB | 100GB | $168 |
| `c-16` | 16 dedicated | 32GB | 200GB | $336 |

### メモリ最適化

メモリ集約的なワークロード（DB, キャッシュ等）向け。

| Slug | vCPU | RAM | ディスク | 月額 |
|------|------|-----|---------|------|
| `m-2vcpu-16gb` | 2 dedicated | 16GB | 50GB | $84 |
| `m-4vcpu-32gb` | 4 dedicated | 32GB | 100GB | $168 |
| `m-8vcpu-64gb` | 8 dedicated | 64GB | 200GB | $336 |

## 共有CPU vs 専用CPU の違い

| 項目 | 共有CPU | 専用CPU |
|------|---------|---------|
| **性能特性** | バースト可能、他テナントと共有 | 一貫した性能、専有リソース |
| **コスト** | 安い（$4〜） | 高い（$42〜） |
| **適用場面** | 開発、テスト、軽量プロダクション | 本番SLA、レイテンシ重視 |
| **AltMe での用途** | OpenClaw インスタンス（標準） | プレミアムユーザー向け（将来） |

**AltMe の判断基準**:
- ほとんどのユーザー: 共有CPU で十分（OpenClaw は常時高負荷ではない）
- ヘビーユーザー（多数のタスク並列実行）: サイズアップで対応
- 将来のプレミアムプラン: 専用CPU を検討

## AltMe での推奨サイズ（用途別）

| 用途 | Slug | CPU | RAM | 月額 | 備考 |
|------|------|-----|-----|------|------|
| **開発・テスト** | `s-1vcpu-512mb` | 1 shared | 512MB | $4 | 最小構成、テスト用 |
| **本番（標準）** | `s-1vcpu-1gb` | 1 shared | 1GB | $6 | **デフォルト推奨** |
| **本番（ヘビー）** | `s-1vcpu-2gb` | 1 shared | 2GB | $12 | メモリ集約的タスク |
| **プレミアム** | `s-2vcpu-2gb` | 2 shared | 2GB | $18 | 高負荷ユーザー |

## App Platform インスタンスサイズ（参考）

App Platform を将来使用する場合のサイズ一覧。

### 共有CPU

| Slug | CPU | RAM | 月額 | スケーラブル | 推奨用途 |
|------|-----|-----|------|------------|---------|
| `apps-s-1vcpu-0.5gb` | 1 shared | 512MB | $5 | No | ワーカー、ジョブ、小規模アプリ |
| `apps-s-1vcpu-1gb-fixed` | 1 shared | 1GB | $10 | No | ワーカー、ジョブ |
| `apps-s-1vcpu-1gb` | 1 shared | 1GB | $12 | Yes | サービス、ワーカー |
| `apps-s-1vcpu-2gb` | 1 shared | 2GB | $25 | Yes | サービス、メモリ集約ワーカー |
| `apps-s-2vcpu-4gb` | 2 shared | 4GB | $50 | Yes | サービス、高トラフィック |

### 専用CPU

| Slug | CPU | RAM | 月額 | 推奨用途 |
|------|-----|-----|------|---------|
| `apps-d-1vcpu-0.5gb` | 1 dedicated | 512MB | $29 | レイテンシ重視 |
| `apps-d-1vcpu-1gb` | 1 dedicated | 1GB | $34 | 本番ワーカー |
| `apps-d-1vcpu-2gb` | 1 dedicated | 2GB | $39 | 本番サービス |
| `apps-d-1vcpu-4gb` | 1 dedicated | 4GB | $49 | メモリ集約 |
| `apps-d-2vcpu-4gb` | 2 dedicated | 4GB | $78 | CPU 集約 |
| `apps-d-2vcpu-8gb` | 2 dedicated | 8GB | $98 | 高パフォーマンス |
| `apps-d-4vcpu-8gb` | 4 dedicated | 8GB | $156 | CPU バウンド |
| `apps-d-4vcpu-16gb` | 4 dedicated | 16GB | $196 | 大規模アプリ |
| `apps-d-8vcpu-32gb` | 8 dedicated | 32GB | $392 | エンタープライズ |

### 環境別デフォルト（App Platform）

| 環境 | サービス | ワーカー | ジョブ |
|------|---------|---------|--------|
| test | `apps-s-1vcpu-1gb` | `apps-s-1vcpu-0.5gb` | `apps-s-1vcpu-0.5gb` |
| staging | `apps-s-1vcpu-1gb` | `apps-s-1vcpu-0.5gb` | `apps-s-1vcpu-0.5gb` |
| production | `apps-d-1vcpu-2gb` | `apps-d-1vcpu-1gb` | `apps-s-1vcpu-1gb` |

## コスト計算

### AltMe 1ユーザーあたりのコスト

```
Droplet (s-1vcpu-1gb):  $6.00/月
帯域幅（推定）:          ~$0.50/月
スナップショット:        ~$0.20/月（$0.06/GB/月 × ~3GB）
────────────────────────────────
合計:                    ~$6.70/月 ≈ ¥1,005
```

### 損益分岐

```
サブスク月額:         ¥4,980
インフラコスト:       ¥1,005
粗利:                ¥3,975
粗利率:              約 80%
```

### スケール別コスト

| ユーザー数 | 月額売上 | インフラコスト | 粗利 |
|-----------|---------|-------------|------|
| 50 | ¥249,000 | ¥50,250 | ¥198,750 |
| 100 | ¥498,000 | ¥100,500 | ¥397,500 |
| 200 | ¥996,000 | ¥201,000 | ¥795,000 |
| 500 | ¥2,490,000 | ¥502,500 | ¥1,987,500 |

### サイズ別ユーザーあたりコスト比較

| サイズ | 月額 | 粗利率 | 備考 |
|--------|------|--------|------|
| `s-1vcpu-512mb` ($4) | ¥600 | 88% | 最小構成 |
| `s-1vcpu-1gb` ($6) | ¥900 | 82% | **標準** |
| `s-1vcpu-2gb` ($12) | ¥1,800 | 64% | ヘビーユーザー |
| `s-2vcpu-2gb` ($18) | ¥2,700 | 46% | プレミアム |

## サイジングガイドライン

1. **開始サイズ**: `s-1vcpu-1gb`（ほとんどのユーザーに適切）
2. **専用CPU を検討するタイミング**:
   - 一貫したパフォーマンスが必要な場合
   - レイテンシ重視のアプリケーション
   - SLA のある本番環境
3. **ワーカーはサービスより小さいサイズで OK**: 常時接続がない分、リソース要件が低い
4. **スケーラブルインスタンスのみ水平オートスケーリングに対応**
