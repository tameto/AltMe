# RevenueCat Charts & Metrics リファレンス

## 概要

RevenueCat REST API v2 で利用可能な Charts & Metrics API。
サブスクリプションのパフォーマンスデータをプログラムから取得可能。

> レート制限: **5 req/min**（Charts & Metrics ドメイン）

## エンドポイント

### Overview Metrics 取得

```
GET /v2/projects/{project_id}/metrics/overview
```

プロジェクト全体のメトリクス概要を取得。

**パラメータ:**

| パラメータ | 場所 | 必須 | 説明 |
|-----------|------|------|------|
| `project_id` | path | 必須 | プロジェクトID |
| `currency` | query | 任意 | 通貨コード（ISO 4217, デフォルト: USD） |

**リクエスト例:**

```bash
curl -s "https://api.revenuecat.com/v2/projects/${PROJECT_ID}/metrics/overview?currency=JPY" \
  -H "Authorization: Bearer ${RC_API_KEY}"
```

**レスポンス例:**

```json
{
  "object": "overview_metrics",
  "metrics": [
    {
      "id": "mrr",
      "name": "MRR",
      "description": "Monthly Recurring Revenue",
      "value": 498000,
      "period": "month",
      "unit": "$"
    },
    {
      "id": "active_subscribers",
      "name": "Active Subscribers",
      "value": 150
    },
    {
      "id": "active_trials",
      "name": "Active Trials",
      "value": 42
    },
    {
      "id": "revenue",
      "name": "Revenue",
      "value": 1250000,
      "period": "month",
      "unit": "$"
    }
  ]
}
```

### チャートデータ取得

```
GET /v2/projects/{project_id}/charts/{chart_name}
```

**パラメータ:**

| パラメータ | 場所 | 必須 | 説明 |
|-----------|------|------|------|
| `project_id` | path | 必須 | プロジェクトID |
| `chart_name` | path | 必須 | チャート名（下記参照） |
| `realtime` | query | 任意 | v3 リアルタイムチャート（デフォルト: true） |
| `filters` | query | 任意 | JSON配列のフィルタ条件 |
| `selectors` | query | 任意 | JSON オブジェクトのセレクタ |
| `currency` | query | 任意 | 通貨コード（ISO 4217） |
| `resolution` | query | 任意 | 時間解像度（day/week/month/quarter/year） |
| `start_date` | query | 任意 | 開始日（ISO 8601） |
| `end_date` | query | 任意 | 終了日（ISO 8601） |
| `segment` | query | 任意 | セグメント軸 |

**リクエスト例（MRR チャート）:**

```bash
curl -s "https://api.revenuecat.com/v2/projects/${PROJECT_ID}/charts/mrr?\
start_date=2026-01-01&end_date=2026-02-14&resolution=day&currency=JPY" \
  -H "Authorization: Bearer ${RC_API_KEY}"
```

**レスポンス例:**

```json
{
  "object": "chart_data",
  "category": "revenue",
  "display_type": "line",
  "display_name": "MRR",
  "description": "Monthly Recurring Revenue",
  "last_computed_at": 1707868800000,
  "start_date": 1704067200000,
  "end_date": 1707868800000,
  "yaxis_currency": "JPY",
  "filtering_allowed": true,
  "segmenting_allowed": true,
  "resolution": "day",
  "values": [
    [1704067200000, 150000],
    [1704153600000, 155000],
    [1704240000000, 160000]
  ],
  "summary": {
    "current": 498000,
    "previous": 350000,
    "change": 0.423
  },
  "yaxis": "¥"
}
```

### チャートオプション取得

```
GET /v2/projects/{project_id}/charts/{chart_name}/options
```

利用可能な解像度、セグメント、フィルタを取得。

**リクエスト例:**

```bash
curl -s "https://api.revenuecat.com/v2/projects/${PROJECT_ID}/charts/mrr/options" \
  -H "Authorization: Bearer ${RC_API_KEY}"
```

**レスポンス例:**

```json
{
  "object": "chart_options",
  "resolutions": [
    { "id": "0", "display_name": "day" },
    { "id": "1", "display_name": "week" },
    { "id": "2", "display_name": "month" }
  ],
  "segments": [
    { "id": "country", "display_name": "Country" },
    { "id": "product", "display_name": "Product" },
    { "id": "store", "display_name": "Store" }
  ],
  "filters": [
    { "name": "country", "values": ["JP", "US", "GB"] },
    { "name": "store", "values": ["app_store", "play_store"] }
  ]
}
```

## 全チャートタイプ一覧（21種類）

### Revenue 系

| チャート名 | 説明 | 用途 |
|-----------|------|------|
| `revenue` | 総収益 | 日次/月次の売上トラッキング |
| `mrr` | 月間経常収益（Monthly Recurring Revenue） | SaaS の基本 KPI |
| `mrr_movement` | MRR の変動内訳（新規/更新/解約/アップグレード） | MRR 変動要因の分析 |
| `arr` | 年間経常収益（Annual Recurring Revenue） | 長期的な収益見通し |

### Subscriber 系

| チャート名 | 説明 | 用途 |
|-----------|------|------|
| `actives` | アクティブサブスクライバー数 | 有料ユーザーの推移 |
| `actives_movement` | アクティブの変動内訳 | 増減の要因分析 |
| `actives_new` | 新規アクティブ数 | 新規獲得のトラッキング |
| `customers_active` | アクティブ顧客数 | DAU/MAU 的な指標 |
| `customers_new` | 新規顧客数 | インストール→顧客の転換 |
| `subscription_status` | サブスクリプション状態の内訳 | active/trial/expired の分布 |

### Trial 系

| チャート名 | 説明 | 用途 |
|-----------|------|------|
| `trials` | アクティブトライアル数 | トライアル利用状況 |
| `trials_movement` | トライアルの変動内訳 | 開始/転換/キャンセルの分析 |
| `trials_new` | 新規トライアル数 | Day 0 トライアル開始数 |
| `trial_conversion_rate` | トライアル→有料転換率 | 最重要 KPI の一つ |

### Conversion & Retention 系

| チャート名 | 説明 | 用途 |
|-----------|------|------|
| `conversion_to_paying` | 無料→有料転換率 | ペイウォール効果の測定 |
| `subscription_retention` | サブスクリプション継続率 | コホート別の継続率分析 |
| `cohort_explorer` | コホート分析 | 時期別ユーザー行動の比較 |

### Churn & LTV 系

| チャート名 | 説明 | 用途 |
|-----------|------|------|
| `churn` | 解約率 | サブスクリプションの健全性 |
| `refund_rate` | リファンド率 | 返金の発生状況 |
| `ltv_per_customer` | 全顧客あたりの LTV | インストールベースの価値 |
| `ltv_per_paying_customer` | 有料顧客あたりの LTV | 課金ユーザーの価値 |

## AltMe KPI のAPI取得パターン

### 1. MRR（目標: ¥200,000〜500,000）

```bash
# 現在の MRR
./rc-api.sh -X GET "/projects/${PROJECT_ID}/metrics/overview" | \
  jq '.metrics[] | select(.id == "mrr")'

# MRR の推移（日次）
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/mrr?\
start_date=2026-01-01&end_date=2026-02-14&resolution=day&currency=JPY"
```

### 2. Day 0 課金率（トライアル開始率）

```bash
# 新規トライアル数
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/trials_new?\
start_date=2026-02-01&end_date=2026-02-14&resolution=day"

# 無料→有料転換率（Day 0 課金率の指標）
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/conversion_to_paying?\
start_date=2026-02-01&end_date=2026-02-14&resolution=day"
```

### 3. Trial 転換率

```bash
# トライアル→有料転換率
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/trial_conversion_rate?\
start_date=2026-01-01&end_date=2026-02-14&resolution=week"

# セレクタで変換タイムフレームを指定
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/trial_conversion_rate?\
start_date=2026-01-01&end_date=2026-02-14&\
selectors={\"conversion_timeframe\":\"7_days\"}"
```

### 4. 解約率

```bash
# 月次解約率
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/churn?\
start_date=2025-08-01&end_date=2026-02-14&resolution=month"

# プロダクト別セグメント（月額 vs 年額の解約率比較）
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/churn?\
start_date=2025-08-01&end_date=2026-02-14&resolution=month&segment=product"
```

### 5. LTV（顧客生涯価値）

```bash
# 全顧客ベースの LTV
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/ltv_per_customer?\
start_date=2025-08-01&end_date=2026-02-14&resolution=month&currency=JPY"

# 有料顧客ベースの LTV
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/ltv_per_paying_customer?\
start_date=2025-08-01&end_date=2026-02-14&resolution=month&currency=JPY"
```

### 6. コホート分析

```bash
# サブスクリプション継続率（コホート別）
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/subscription_retention?\
start_date=2025-11-01&end_date=2026-02-14&resolution=month"

# コホートエクスプローラー
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/cohort_explorer?\
start_date=2025-11-01&end_date=2026-02-14&resolution=month"
```

### 7. フィルタ付きクエリ

```bash
# 日本のユーザーのみ
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/revenue?\
start_date=2026-01-01&end_date=2026-02-14&resolution=day&\
filters=[{\"name\":\"country\",\"values\":[\"JP\"]}]&currency=JPY"

# App Store のみ
./rc-api.sh -X GET "/projects/${PROJECT_ID}/charts/revenue?\
start_date=2026-01-01&end_date=2026-02-14&resolution=day&\
filters=[{\"name\":\"store\",\"values\":[\"app_store\"]}]&currency=JPY"
```

## AltMe KPI ダッシュボード設計

### 主要メトリクス

| KPI | チャート | 目標値 | 計測頻度 |
|-----|---------|--------|---------|
| MRR | `mrr` | ¥200K〜500K（6ヶ月後） | 日次 |
| アクティブサブスクライバー | `actives` | MRR / ¥4,980 ≒ 40〜100人 | 日次 |
| Day 0 トライアル開始率 | `conversion_to_paying` | 30%+ | 日次 |
| Trial→有料転換率 | `trial_conversion_rate` | 50%+ | 週次 |
| 月次解約率 | `churn` | <5% | 月次 |
| LTV（有料顧客） | `ltv_per_paying_customer` | ¥30,000+ | 月次 |
| リファンド率 | `refund_rate` | <3% | 月次 |

### セグメント分析

| 分析軸 | segment パラメータ | 目的 |
|--------|-------------------|------|
| プラン別 | `product` | 月額 vs 年額の比較 |
| ストア別 | `store` | iOS vs Android の比較 |
| 国別 | `country` | 地域別パフォーマンス |
