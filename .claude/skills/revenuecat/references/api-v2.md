# RevenueCat REST API v2 リファレンス

## 基本情報

- **Base URL:** `https://api.revenuecat.com/v2`
- **認証:** `Authorization: Bearer {RC_API_KEY}`（v2 Secret API Key）
- **Content-Type:** `application/json`

## 認証

```bash
# プロジェクト一覧（最初に project_id を取得）
curl -s "https://api.revenuecat.com/v2/projects" \
  -H "Authorization: Bearer $RC_API_KEY"
```

API Key は RevenueCat ダッシュボード > Project Settings > API keys > Secret keys (v2) から取得。
クライアントアプリには **Public Key** を使用し、Secret Key は絶対に含めない。

## ページネーション

リスト系エンドポイントはカーソルベースのページネーション。

```json
{
  "object": "list",
  "items": [...],
  "next_page": "/v2/projects/{project_id}/products?starting_after=prod_last_id",
  "url": "/v2/projects/{project_id}/products"
}
```

| パラメータ | デフォルト | 説明 |
|-----------|----------|------|
| `limit` | 20 | 1ページあたりの件数 |
| `starting_after` | - | カーソルID（前ページ最後のアイテムID） |

`next_page` が `null` の場合、次のページはない（前方ページネーションのみ対応）。

## Expandable Fields

```bash
# expand パラメータで関連データを同時取得
GET /v2/projects/{project_id}/products?expand=app
```

---

## Projects API

### プロジェクト一覧

```
GET /v2/projects
```

**レスポンス例:**

```json
{
  "object": "list",
  "items": [
    {
      "object": "project",
      "id": "proj1ab2c3d4",
      "name": "AltMe Production",
      "created_at": 1700000000000
    }
  ],
  "next_page": null,
  "url": "/v2/projects"
}
```

### プロジェクト作成

```
POST /v2/projects
```

**リクエスト:**

```json
{
  "name": "AltMe Production"
}
```

### アプリ一覧

```
GET /v2/projects/{project_id}/apps
```

### アプリ作成

```
POST /v2/projects/{project_id}/apps
```

**リクエスト:**

```json
{
  "name": "AltMe iOS",
  "type": "app_store"
}
```

対応プラットフォーム: `amazon`, `app_store`, `mac_app_store`, `play_store`, `stripe`, `rc_billing`, `roku`, `paddle`

### アプリ取得

```
GET /v2/projects/{project_id}/apps/{app_id}
```

### アプリ更新

```
POST /v2/projects/{project_id}/apps/{app_id}
```

### アプリ削除

```
DELETE /v2/projects/{project_id}/apps/{app_id}
```

### アプリ API Key 取得

```
GET /v2/projects/{project_id}/apps/{app_id}/api_keys
```

### StoreKit 設定取得

```
GET /v2/projects/{project_id}/apps/{app_id}/storekit_configuration
```

---

## Customers API（16エンドポイント）

### 顧客一覧

```
GET /v2/projects/{project_id}/customers
```

**パラメータ:** `starting_after`, `limit`

### 顧客作成

```
POST /v2/projects/{project_id}/customers
```

**リクエスト:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 顧客取得

```
GET /v2/projects/{project_id}/customers/{customer_id}
```

**expand:** `subscriber_attributes`

**レスポンス例:**

```json
{
  "object": "customer",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "proj1ab2c3d4",
  "first_seen_at": 1700000000000,
  "last_seen_at": 1707868800000,
  "active_entitlements": ["pro"],
  "experiment": {
    "id": "exp_abc123",
    "variant": "treatment"
  }
}
```

### 顧客削除

```
DELETE /v2/projects/{project_id}/customers/{customer_id}
```

### 顧客属性取得・設定

```
GET /v2/projects/{project_id}/customers/{customer_id}/attributes
POST /v2/projects/{project_id}/customers/{customer_id}/attributes
```

**属性設定リクエスト:**

```json
{
  "attributes": {
    "$email": { "value": "user@example.com" },
    "$displayName": { "value": "田中太郎" },
    "custom_key": { "value": "custom_value" }
  }
}
```

### 顧客サブスクリプション一覧

```
GET /v2/projects/{project_id}/customers/{customer_id}/subscriptions
```

**レスポンス例:**

```json
{
  "object": "list",
  "items": [
    {
      "object": "subscription",
      "id": "sub_abc123",
      "customer_id": "550e8400-e29b-41d4-a716-446655440000",
      "product_id": "altme_pro_annual",
      "status": "active",
      "auto_renewal_status": "will_renew",
      "current_period_starts_at": 1700000000000,
      "current_period_ends_at": 1731536000000,
      "gives_access": true,
      "store": "app_store",
      "environment": "production"
    }
  ]
}
```

### 顧客の購入一覧

```
GET /v2/projects/{project_id}/customers/{customer_id}/purchases
```

### 顧客の Entitlement 一覧

```
GET /v2/projects/{project_id}/customers/{customer_id}/active_entitlements
```

### Entitlement 付与

```
POST /v2/projects/{project_id}/customers/{customer_id}/entitlements/{entitlement_id}/grant
```

プロモーショナルサブスクリプションを作成して Entitlement を付与する。

**リクエスト:**

```json
{
  "duration": "monthly",
  "start_time_ms": 1700000000000
}
```

### Entitlement 剥奪

```
POST /v2/projects/{project_id}/customers/{customer_id}/entitlements/{entitlement_id}/revoke
```

関連するプロモーショナルサブスクリプションを期限切れにする。

### Offering Override 設定

```
POST /v2/projects/{project_id}/customers/{customer_id}/offering_override
```

特定の顧客に特定の Offering を表示する。

**リクエスト:**

```json
{
  "offering_id": "ofrng_special_offer"
}
```

### Offering Override 解除

```
DELETE /v2/projects/{project_id}/customers/{customer_id}/offering_override
```

### 顧客転送

```
POST /v2/projects/{project_id}/customers/{customer_id}/transfer
```

**リクエスト:**

```json
{
  "to_customer_id": "new-user-uuid",
  "app_id": "app1a2b3c4d5e"
}
```

### 顧客の仮想通貨残高

```
GET /v2/projects/{project_id}/customers/{customer_id}/virtual_currency_balances
```

### 顧客ブロック（Beta）

```
POST /v2/projects/{project_id}/customers/{customer_id}/block
DELETE /v2/projects/{project_id}/customers/{customer_id}/block
```

### 顧客請求書一覧

```
GET /v2/projects/{project_id}/customers/{customer_id}/invoices
GET /v2/projects/{project_id}/customers/{customer_id}/invoices/{invoice_id}/file
```

---

## Subscriptions API

### サブスクリプション検索

```
GET /v2/projects/{project_id}/subscriptions
```

**パラメータ:** `store_purchase_identifier` でストアの購入IDで検索

### サブスクリプション取得

```
GET /v2/projects/{project_id}/subscriptions/{subscription_id}
```

**レスポンス例:**

```json
{
  "object": "subscription",
  "id": "sub_abc123",
  "customer_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_id": "altme_pro_annual",
  "status": "active",
  "auto_renewal_status": "will_renew",
  "current_period_starts_at": 1700000000000,
  "current_period_ends_at": 1731536000000,
  "gives_access": true,
  "store": "app_store",
  "environment": "production",
  "billing_issues_detected_at": null,
  "grace_period_expires_at": null,
  "pending_payment": false,
  "country": "JP"
}
```

### サブスクリプション ステータス値

```json
{
  "status": "trialing | active | expired | in_grace_period | in_billing_retry | paused | unknown | incomplete",
  "auto_renewal_status": "will_renew | will_not_renew | will_change_product | will_pause | requires_price_increase_consent | has_already_renewed"
}
```

### サブスクリプション キャンセル（Web Billing のみ）

```
POST /v2/projects/{project_id}/subscriptions/{subscription_id}/actions/cancel
```

### サブスクリプション リファンド（Web Billing のみ）

```
POST /v2/projects/{project_id}/subscriptions/{subscription_id}/actions/refund
```

### Customer Portal URL 取得

```
POST /v2/projects/{project_id}/subscriptions/{subscription_id}/management_url
```

セキュアな一時URLを返す。顧客がサブスクリプションを管理できる。

### サブスクリプションの Entitlement 一覧

```
GET /v2/projects/{project_id}/subscriptions/{subscription_id}/entitlements
```

### サブスクリプションのトランザクション一覧

```
GET /v2/projects/{project_id}/subscriptions/{subscription_id}/transactions
```

### トランザクション リファンド（Play Store のみ）

```
POST /v2/projects/{project_id}/subscriptions/{subscription_id}/transactions/{transaction_id}/actions/refund
```

---

## Products API

### プロダクト一覧

```
GET /v2/projects/{project_id}/products
```

**パラメータ:** `app_id`（任意）, `starting_after`, `limit`

### プロダクト作成

```
POST /v2/projects/{project_id}/products
```

**リクエスト:**

```json
{
  "store_identifier": "altme_pro_monthly",
  "app_id": "app1a2b3c4d5e",
  "type": "subscription",
  "display_name": "AltMe Pro Monthly"
}
```

`type`: `subscription`, `one_time`, `consumable`, `non_consumable`, `prepaid`

ストア識別子フォーマット:
- Apple: プロダクトID そのまま（例: `altme_pro_monthly`）
- Google Play: `productId:basePlanId` 形式（例: `altme_pro:monthly`）

### プロダクト取得

```
GET /v2/projects/{project_id}/products/{product_id}
```

**expand:** `app`

### プロダクト削除

```
DELETE /v2/projects/{project_id}/products/{product_id}
```

### ストアにプッシュ

```
POST /v2/projects/{project_id}/products/{product_id}/create_in_store
```

---

## Offerings API

### Offering 一覧

```
GET /v2/projects/{project_id}/offerings
```

**expand:** `items.packages`, `items.packages.items.product`

### Offering 作成

```
POST /v2/projects/{project_id}/offerings
```

**リクエスト:**

```json
{
  "lookup_key": "default",
  "display_name": "AltMe Default Offering",
  "metadata": {
    "description": "Standard offering with monthly and annual plans"
  }
}
```

### Offering 取得

```
GET /v2/projects/{project_id}/offerings/{offering_id}
```

**expand:** `packages`, `packages.items.product`

### Offering 更新

```
POST /v2/projects/{project_id}/offerings/{offering_id}
```

**リクエスト:**

```json
{
  "display_name": "Updated Display Name",
  "is_current": true,
  "metadata": { "key": "value" }
}
```

### Offering 削除

```
DELETE /v2/projects/{project_id}/offerings/{offering_id}
```

### Package 一覧

```
GET /v2/projects/{project_id}/offerings/{offering_id}/packages
```

### Package 作成

```
POST /v2/projects/{project_id}/offerings/{offering_id}/packages
```

**リクエスト:**

```json
{
  "lookup_key": "$rc_monthly",
  "display_name": "月額プラン ¥4,980",
  "position": 1
}
```

### Package 取得

```
GET /v2/projects/{project_id}/offerings/{offering_id}/packages/{package_id}
```

### Package 更新

```
POST /v2/projects/{project_id}/offerings/{offering_id}/packages/{package_id}
```

### Package 削除

```
DELETE /v2/projects/{project_id}/offerings/{offering_id}/packages/{package_id}
```

### Package に Product を紐付け

```
POST /v2/projects/{project_id}/offerings/{offering_id}/packages/{package_id}/actions/attach_products
```

**リクエスト:**

```json
{
  "products": [
    {
      "product_id": "prod_abc123",
      "eligibility_criteria": "all",
      "base_plan_id": null
    }
  ]
}
```

### Package から Product を外す

```
POST /v2/projects/{project_id}/offerings/{offering_id}/packages/{package_id}/actions/detach_products
```

### Package の Product 一覧

```
GET /v2/projects/{project_id}/offerings/{offering_id}/packages/{package_id}/products
```

---

## Entitlements API（8エンドポイント）

### Entitlement 一覧

```
GET /v2/projects/{project_id}/entitlements
```

**expand:** `items.product`

**レスポンス例:**

```json
{
  "object": "list",
  "items": [
    {
      "object": "entitlement",
      "id": "entla1b2c3d4e5",
      "project_id": "proj1ab2c3d4",
      "lookup_key": "pro",
      "display_name": "Pro Access",
      "created_at": 1700000000000,
      "products": {
        "object": "list",
        "items": [
          { "object": "product", "id": "prod_monthly", "store_identifier": "altme_pro_monthly" },
          { "object": "product", "id": "prod_annual", "store_identifier": "altme_pro_annual" }
        ]
      }
    }
  ]
}
```

### Entitlement 作成

```
POST /v2/projects/{project_id}/entitlements
```

**リクエスト:**

```json
{
  "lookup_key": "pro",
  "display_name": "Pro Access"
}
```

### Entitlement 取得

```
GET /v2/projects/{project_id}/entitlements/{entitlement_id}
```

**expand:** `product`

### Entitlement 更新

```
POST /v2/projects/{project_id}/entitlements/{entitlement_id}
```

**リクエスト:**

```json
{
  "display_name": "Premium Access"
}
```

### Entitlement 削除

```
DELETE /v2/projects/{project_id}/entitlements/{entitlement_id}
```

### Entitlement に Product 紐付け

```
POST /v2/projects/{project_id}/entitlements/{entitlement_id}/actions/attach_products
```

**リクエスト:**

```json
{
  "product_ids": ["prod_monthly", "prod_annual", "prod_intro_annual"]
}
```

### Entitlement から Product を外す

```
POST /v2/projects/{project_id}/entitlements/{entitlement_id}/actions/detach_products
```

**リクエスト:**

```json
{
  "product_ids": ["prod_old"]
}
```

### Entitlement の Product 一覧

```
GET /v2/projects/{project_id}/entitlements/{entitlement_id}/products
```

---

## Purchases API

### 購入検索

```
GET /v2/projects/{project_id}/purchases
```

**パラメータ:** `store_purchase_identifier` でストアの購入IDで検索

### 購入取得

```
GET /v2/projects/{project_id}/purchases/{purchase_id}
```

**レスポンス例:**

```json
{
  "object": "purchase",
  "id": "purch_abc123",
  "customer_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_id": "prod_lifetime",
  "purchased_at": 1700000000000,
  "revenue_in_usd": 99.99,
  "quantity": 1,
  "status": "owned",
  "store": "app_store",
  "environment": "production",
  "country": "JP"
}
```

`status`: `owned`, `refunded`

### 購入リファンド（Web Billing のみ）

```
POST /v2/projects/{project_id}/purchases/{purchase_id}/actions/refund
```

### 購入の Entitlement 一覧

```
GET /v2/projects/{project_id}/purchases/{purchase_id}/entitlements
```

---

## Paywalls API

### ペイウォール作成

```
POST /v2/projects/{project_id}/paywalls
```

**リクエスト:**

```json
{
  "offering_id": "ofrng123456789a"
}
```

**レスポンス例:**

```json
{
  "object": "paywall",
  "id": "pw123456789abcdef",
  "name": null,
  "offering_id": "ofrng123456789a",
  "created_at": 1700000000000,
  "published_at": null
}
```

---

## Integrations API（Webhook 管理）

### Webhook 一覧

```
GET /v2/projects/{project_id}/integrations/webhooks
```

### Webhook 作成

```
POST /v2/projects/{project_id}/integrations/webhooks
```

**リクエスト:**

```json
{
  "name": "AltMe Supabase Webhook",
  "url": "https://your-project.supabase.co/functions/v1/revenuecat-webhook",
  "authorization_header": "Bearer your-webhook-secret",
  "environment": "production",
  "event_types": [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "CANCELLATION",
    "EXPIRATION",
    "BILLING_ISSUE",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
    "TRANSFER"
  ],
  "app_id": null
}
```

### Webhook 取得

```
GET /v2/projects/{project_id}/integrations/webhooks/{webhook_id}
```

### Webhook 更新

```
POST /v2/projects/{project_id}/integrations/webhooks/{webhook_id}
```

### Webhook 削除

```
DELETE /v2/projects/{project_id}/integrations/webhooks/{webhook_id}
```

---

## Virtual Currencies API

### 仮想通貨一覧

```
GET /v2/projects/{project_id}/virtual_currencies
```

### 仮想通貨作成

```
POST /v2/projects/{project_id}/virtual_currencies
```

**リクエスト:**

```json
{
  "code": "gems",
  "display_name": "Gems",
  "description": "In-app currency",
  "product_grants": [
    { "product_id": "prod_gem_pack", "amount": 100 }
  ]
}
```

### 仮想通貨取得

```
GET /v2/projects/{project_id}/virtual_currencies/{virtual_currency_code}
```

### 仮想通貨更新

```
POST /v2/projects/{project_id}/virtual_currencies/{virtual_currency_code}
```

### 仮想通貨削除

```
DELETE /v2/projects/{project_id}/virtual_currencies/{virtual_currency_code}
```

---

## Charts & Metrics API

### Overview Metrics

```
GET /v2/projects/{project_id}/metrics/overview
```

**パラメータ:** `currency`（ISO 4217）

### チャートデータ取得

```
GET /v2/projects/{project_id}/charts/{chart_name}
```

**パラメータ:** `realtime`, `filters`, `selectors`, `currency`, `resolution`, `start_date`, `end_date`, `segment`

**利用可能なチャート（21種類）:**

`actives`, `actives_movement`, `actives_new`, `arr`, `churn`, `cohort_explorer`, `conversion_to_paying`, `customers_active`, `customers_new`, `ltv_per_customer`, `ltv_per_paying_customer`, `mrr`, `mrr_movement`, `refund_rate`, `revenue`, `subscription_retention`, `subscription_status`, `trial_conversion_rate`, `trials`, `trials_movement`, `trials_new`

### チャートオプション取得

```
GET /v2/projects/{project_id}/charts/{chart_name}/options
```

---

## レート制限

| ドメイン | 制限 | 対象 |
|---------|------|------|
| Customer Information | 480 req/min | `/customers/*` |
| Charts & Metrics | 5 req/min | `/metrics/*`, `/charts/*` |
| Project Configuration | 60 req/min | `/products/*`, `/entitlements/*`, `/offerings/*` 等 |
| Virtual Currencies (Create Transaction) | 480 req/min | トランザクション作成 |

レスポンスヘッダー:
- `RevenueCat-Rate-Limit-Current-Usage`: 現在の使用量
- `RevenueCat-Rate-Limit-Current-Limit`: 制限値

429 エラー時は `Retry-After` ヘッダー（秒数）に従う。

詳細: [error-handling.md](./error-handling.md)
