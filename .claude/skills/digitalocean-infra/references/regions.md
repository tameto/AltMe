# リージョン一覧・選択ガイド

> Source: digitalocean-labs/do-app-platform-skills — shared/regions.yaml

## 全リージョン一覧

### 北米

| Slug | 都市 | 大陸 | Spaces Slug | 備考 |
|------|------|------|-------------|------|
| `nyc` (`nyc1`, `nyc3`) | ニューヨーク | 北米 | `nyc3` | App Platform デフォルト |
| `sfo` (`sfo3`) | サンフランシスコ | 北米 | `sfo3` | 北米西海岸 |
| `tor` (`tor1`) | トロント | 北米 | — | カナダ向け |
| `atl` (`atl1`) | アトランタ | 北米 | — | 米国南部 |

### ヨーロッパ

| Slug | 都市 | 大陸 | Spaces Slug | 備考 |
|------|------|------|-------------|------|
| `ams` (`ams3`) | アムステルダム | ヨーロッパ | `ams3` | EU中心 |
| `lon` (`lon1`) | ロンドン | ヨーロッパ | `lon1` | UK向け |
| `fra` (`fra1`) | フランクフルト | ヨーロッパ | `fra1` | EU中心、GDPR対応 |

### アジア太平洋

| Slug | 都市 | 大陸 | Spaces Slug | 備考 |
|------|------|------|-------------|------|
| `sgp` (`sgp1`) | シンガポール | アジア | `sgp1` | **AltMe デフォルト** |
| `blr` (`blr1`) | バンガロール | アジア | — | インド向け |

### オセアニア

| Slug | 都市 | 大陸 | Spaces Slug | 備考 |
|------|------|------|-------------|------|
| `syd` (`syd1`) | シドニー | オセアニア | `syd1` | オーストラリア向け |

## Spaces リージョンマッピング

Spaces（オブジェクトストレージ）は一部のリージョンでのみ利用可能。

| App Platform Slug | Spaces Slug |
|-------------------|-------------|
| `nyc` | `nyc3` |
| `sfo` | `sfo3` |
| `ams` | `ams3` |
| `sgp` | `sgp1` |
| `fra` | `fra1` |
| `lon` | `lon1` |
| `syd` | `syd1` |
| `tor` | — (利用不可) |
| `blr` | — (利用不可) |
| `atl` | — (利用不可) |

## 他プラットフォームからのマッピング

### Heroku → DigitalOcean

| Heroku リージョン | DigitalOcean 推奨 |
|-------------------|-------------------|
| `us` (Virginia) | `nyc` |
| `eu` (Dublin) | `ams` or `lon` |

### AWS → DigitalOcean

| AWS リージョン | DigitalOcean 推奨 |
|---------------|-------------------|
| `us-east-1` (Virginia) | `nyc` |
| `us-east-2` (Ohio) | `nyc` |
| `us-west-1` (California) | `sfo` |
| `us-west-2` (Oregon) | `sfo` |
| `ca-central-1` (Montreal) | `tor` |
| `eu-west-1` (Ireland) | `lon` |
| `eu-west-2` (London) | `lon` |
| `eu-central-1` (Frankfurt) | `fra` |
| `ap-southeast-1` (Singapore) | `sgp` |
| `ap-southeast-2` (Sydney) | `syd` |
| `ap-south-1` (Mumbai) | `blr` |
| `ap-northeast-1` (Tokyo) | `sgp` |
| `ap-northeast-2` (Seoul) | `sgp` |
| `sa-east-1` (Sao Paulo) | `nyc` |
| `eu-north-1` (Stockholm) | `ams` |
| `me-south-1` (Bahrain) | `blr` |

### Render → DigitalOcean

| Render リージョン | DigitalOcean 推奨 |
|-------------------|-------------------|
| `oregon` | `sfo` |
| `ohio` | `nyc` |
| `virginia` | `nyc` |
| `frankfurt` | `fra` |

### Railway → DigitalOcean

| Railway リージョン | DigitalOcean 推奨 |
|--------------------|-------------------|
| `us-west1` | `sfo` |
| `us-east4` | `nyc` |
| `europe-west4` | `ams` |
| `asia-southeast1` | `sgp` |

### Fly.io → DigitalOcean

| Fly.io リージョン | DigitalOcean 推奨 |
|-------------------|-------------------|
| `iad` (Ashburn) | `nyc` |
| `ewr` (Secaucus) | `nyc` |
| `ord` (Chicago) | `nyc` |
| `lax` (Los Angeles) | `sfo` |
| `sjc` (San Jose) | `sfo` |
| `sea` (Seattle) | `sfo` |
| `yyz` (Toronto) | `tor` |
| `lhr` (London) | `lon` |
| `ams` (Amsterdam) | `ams` |
| `fra` (Frankfurt) | `fra` |
| `sin` (Singapore) | `sgp` |
| `hkg` (Hong Kong) | `sgp` |
| `nrt` (Tokyo) | `sgp` |
| `syd` (Sydney) | `syd` |
| `maa` (Chennai) | `blr` |
| `gru` (Sao Paulo) | `nyc` |

## AltMe でのリージョン選択

### デフォルト: `sgp1`（シンガポール）

**理由**:
- 日本ユーザーからのレイテンシが最小（60-80ms）
- 東南アジア全体をカバー
- Spaces 対応リージョン

### 日本からの各リージョンへのレイテンシ目安

| リージョン | レイテンシ | 適用場面 |
|-----------|-----------|---------|
| `sgp1` シンガポール | 60-80ms | **日本・東南アジアユーザー（デフォルト）** |
| `sfo3` サンフランシスコ | 100-130ms | 北米西海岸ユーザー |
| `syd1` シドニー | 120-150ms | オセアニアユーザー |
| `nyc3` ニューヨーク | 170-200ms | 北米東海岸ユーザー |
| `lon1` ロンドン | 230-260ms | UK ユーザー |
| `ams3` アムステルダム | 240-270ms | EU ユーザー |
| `fra1` フランクフルト | 240-270ms | EU ユーザー（GDPR） |

### リージョン自動選択ロジック（将来実装）

```typescript
// ユーザーの locale / タイムゾーンに基づくリージョン自動選択
const selectRegion = (timezone: string): string => {
  const regionMap: Record<string, string> = {
    'Asia/Tokyo': 'sgp1',
    'Asia/Seoul': 'sgp1',
    'Asia/Shanghai': 'sgp1',
    'Asia/Singapore': 'sgp1',
    'Asia/Bangkok': 'sgp1',
    'Asia/Kolkata': 'blr1',
    'Australia/Sydney': 'syd1',
    'America/Los_Angeles': 'sfo3',
    'America/Denver': 'sfo3',
    'America/Chicago': 'nyc3',
    'America/New_York': 'nyc3',
    'America/Toronto': 'tor1',
    'Europe/London': 'lon1',
    'Europe/Amsterdam': 'ams3',
    'Europe/Berlin': 'fra1',
    'Europe/Paris': 'fra1',
  };
  return regionMap[timezone] ?? 'sgp1'; // デフォルト: シンガポール
};
```

### リージョン選択の考慮事項

1. **レイテンシ**: ユーザーに最も近いリージョンを選択
2. **データ主権・GDPR**: EU ユーザーのデータは `fra1` or `ams3` に配置
3. **コスト**: 全リージョン同一価格（DO の場合）
4. **Spaces 対応**: Spaces を使う場合は対応リージョンを選択
5. **クロスリージョンレイテンシ**: 50-200ms 追加されるため、DB と App は同一リージョンに配置
