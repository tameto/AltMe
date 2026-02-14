# RevenueCat Webhook イベントリファレンス

## 概要

RevenueCat は JSON 形式の POST リクエストでイベントを送信する。
AltMe では Supabase Edge Function で受信し、subscriptions テーブルと OpenClaw インスタンスを管理する。

## 全 Webhook イベントタイプ

### 購入イベント

| イベント | 説明 | 対応ストア |
|---------|------|-----------|
| `INITIAL_PURCHASE` | 新規サブスクリプション購入（トライアル開始含む） | 全ストア |
| `NON_RENEWING_PURCHASE` | 自動更新しない購入（買い切り等） | 全ストア |
| `RENEWAL` | サブスクリプション更新、または失効後の再購読 | 全ストア |
| `PRODUCT_CHANGE` | サブスクリプションのプラン変更 | 全ストア |

### サブスクリプション管理イベント

| イベント | 説明 | 対応ストア |
|---------|------|-----------|
| `CANCELLATION` | 解約またはリファンド | 全ストア |
| `UNCANCELLATION` | 期間内の解約取り消し（再有効化） | 全ストア |
| `SUBSCRIPTION_PAUSED` | サブスクリプション一時停止 | Play Store のみ |
| `SUBSCRIPTION_EXTENDED` | 有効期限の延長 | 全ストア |
| `EXPIRATION` | サブスクリプション期限切れ（アクセス削除が必要） | 全ストア |

### 課金イベント

| イベント | 説明 | 対応ストア |
|---------|------|-----------|
| `BILLING_ISSUE` | 課金に失敗（支払い方法の問題） | 全ストア |
| `REFUND_REVERSED` | リファンドの取り消し | App Store |
| `INVOICE_ISSUANCE` | 未払い購入の請求書発行 | Web Billing のみ |
| `VIRTUAL_CURRENCY_TRANSACTION` | 仮想通貨の調整（購入/リファンド由来） | 全ストア |

### 管理イベント

| イベント | 説明 | 対応ストア |
|---------|------|-----------|
| `TEST` | ダッシュボードから送信されたテストイベント | - |
| `TRANSFER` | ユーザー間のトランザクション/Entitlement 転送 | 全ストア |
| `TEMPORARY_ENTITLEMENT_GRANT` | 購入検証が一時的に不可能な場合の仮付与 | 全ストア |
| `EXPERIMENT_ENROLLMENT` | A/B テスト実験への登録 | - |

## Webhook ペイロード構造

### 共通フィールド（全イベント）

```json
{
  "api_version": "1.0",
  "event": {
    "type": "INITIAL_PURCHASE",
    "id": "UniqueEventID-123456",
    "app_id": "app1a2b3c4d5e",
    "event_timestamp_ms": 1700000000000,
    "app_user_id": "supabase-user-uuid-here",
    "original_app_user_id": "$RCAnonymousID:xxxx",
    "aliases": ["supabase-user-uuid-here", "$RCAnonymousID:xxxx"],
    "subscriber_attributes": {
      "$email": { "value": "user@example.com", "updated_at_ms": 1700000000000 },
      "$displayName": { "value": "田中太郎", "updated_at_ms": 1700000000000 }
    },
    "experiments": [
      {
        "experiment_id": "exp_abc123",
        "experiment_variant": "treatment",
        "enrolled_at_ms": 1700000000000
      }
    ]
  }
}
```

### INITIAL_PURCHASE ペイロード例

```json
{
  "api_version": "1.0",
  "event": {
    "type": "INITIAL_PURCHASE",
    "id": "evt_initial_abc123",
    "app_id": "app1a2b3c4d5e",
    "event_timestamp_ms": 1700000000000,
    "app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_app_user_id": "$RCAnonymousID:abcdef123456",
    "aliases": ["550e8400-e29b-41d4-a716-446655440000"],
    "product_id": "altme_pro_annual",
    "entitlement_ids": ["pro"],
    "period_type": "TRIAL",
    "purchased_at_ms": 1700000000000,
    "expiration_at_ms": 1700259200000,
    "store": "APP_STORE",
    "environment": "PRODUCTION",
    "is_trial_conversion": false,
    "presented_offering_id": "default",
    "price": 0.0,
    "currency": "JPY",
    "price_in_purchased_currency": 0.0,
    "tax_percentage": 0.1,
    "commission_percentage": 0.15,
    "transaction_id": "2000000123456789",
    "original_transaction_id": "2000000123456789",
    "is_family_share": false,
    "country_code": "JP",
    "offer_code": null,
    "renewal_number": 1,
    "subscriber_attributes": {}
  }
}
```

### RENEWAL ペイロード例

```json
{
  "api_version": "1.0",
  "event": {
    "type": "RENEWAL",
    "id": "evt_renewal_def456",
    "app_id": "app1a2b3c4d5e",
    "event_timestamp_ms": 1700259200000,
    "app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "aliases": ["550e8400-e29b-41d4-a716-446655440000"],
    "product_id": "altme_pro_annual",
    "entitlement_ids": ["pro"],
    "period_type": "NORMAL",
    "purchased_at_ms": 1700259200000,
    "expiration_at_ms": 1731795200000,
    "store": "APP_STORE",
    "environment": "PRODUCTION",
    "is_trial_conversion": true,
    "price": 39800.0,
    "currency": "JPY",
    "price_in_purchased_currency": 39800.0,
    "tax_percentage": 0.1,
    "commission_percentage": 0.15,
    "transaction_id": "2000000123456790",
    "original_transaction_id": "2000000123456789",
    "country_code": "JP",
    "renewal_number": 2
  }
}
```

### CANCELLATION ペイロード例

```json
{
  "api_version": "1.0",
  "event": {
    "type": "CANCELLATION",
    "id": "evt_cancel_ghi789",
    "app_id": "app1a2b3c4d5e",
    "event_timestamp_ms": 1705000000000,
    "app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "aliases": ["550e8400-e29b-41d4-a716-446655440000"],
    "product_id": "altme_pro_monthly",
    "entitlement_ids": ["pro"],
    "period_type": "NORMAL",
    "purchased_at_ms": 1702408000000,
    "expiration_at_ms": 1705000000000,
    "store": "APP_STORE",
    "environment": "PRODUCTION",
    "cancel_reason": "UNSUBSCRIBE",
    "price": -4980.0,
    "currency": "JPY",
    "price_in_purchased_currency": -4980.0,
    "transaction_id": "2000000123456791",
    "original_transaction_id": "2000000123456789",
    "country_code": "JP"
  }
}
```

### EXPIRATION ペイロード例

```json
{
  "api_version": "1.0",
  "event": {
    "type": "EXPIRATION",
    "id": "evt_expire_jkl012",
    "app_id": "app1a2b3c4d5e",
    "event_timestamp_ms": 1705000000000,
    "app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "aliases": ["550e8400-e29b-41d4-a716-446655440000"],
    "product_id": "altme_pro_monthly",
    "entitlement_ids": ["pro"],
    "period_type": "NORMAL",
    "purchased_at_ms": 1702408000000,
    "expiration_at_ms": 1705000000000,
    "store": "APP_STORE",
    "environment": "PRODUCTION",
    "expiration_reason": "UNSUBSCRIBE",
    "transaction_id": "2000000123456791",
    "original_transaction_id": "2000000123456789",
    "country_code": "JP"
  }
}
```

### BILLING_ISSUE ペイロード例

```json
{
  "api_version": "1.0",
  "event": {
    "type": "BILLING_ISSUE",
    "id": "evt_billing_mno345",
    "app_id": "app1a2b3c4d5e",
    "event_timestamp_ms": 1705000000000,
    "app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "aliases": ["550e8400-e29b-41d4-a716-446655440000"],
    "product_id": "altme_pro_monthly",
    "entitlement_ids": ["pro"],
    "period_type": "NORMAL",
    "purchased_at_ms": 1702408000000,
    "expiration_at_ms": 1705000000000,
    "grace_period_expiration_at_ms": 1706382400000,
    "store": "APP_STORE",
    "environment": "PRODUCTION",
    "transaction_id": "2000000123456791",
    "original_transaction_id": "2000000123456789",
    "country_code": "JP"
  }
}
```

### PRODUCT_CHANGE ペイロード例

```json
{
  "api_version": "1.0",
  "event": {
    "type": "PRODUCT_CHANGE",
    "id": "evt_change_pqr678",
    "app_id": "app1a2b3c4d5e",
    "event_timestamp_ms": 1705000000000,
    "app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "aliases": ["550e8400-e29b-41d4-a716-446655440000"],
    "product_id": "altme_pro_monthly",
    "new_product_id": "altme_pro_annual",
    "entitlement_ids": ["pro"],
    "period_type": "NORMAL",
    "purchased_at_ms": 1705000000000,
    "expiration_at_ms": 1736536000000,
    "store": "APP_STORE",
    "environment": "PRODUCTION",
    "price": 39800.0,
    "currency": "JPY",
    "price_in_purchased_currency": 39800.0,
    "country_code": "JP"
  }
}
```

### TRANSFER ペイロード例

```json
{
  "api_version": "1.0",
  "event": {
    "type": "TRANSFER",
    "id": "evt_transfer_stu901",
    "app_id": "app1a2b3c4d5e",
    "event_timestamp_ms": 1705000000000,
    "app_user_id": "new-user-uuid",
    "original_app_user_id": "old-user-uuid",
    "aliases": ["new-user-uuid"],
    "transferred_from": ["old-user-uuid"],
    "transferred_to": ["new-user-uuid"]
  }
}
```

## キャンセル・期限切れ理由コード

| 理由コード | 説明 |
|-----------|------|
| `UNSUBSCRIBE` | ユーザーが自発的に解約 |
| `BILLING_ERROR` | 支払い方法の失敗 |
| `DEVELOPER_INITIATED` | 開発者による解約 |
| `PRICE_INCREASE` | 値上げを拒否 |
| `CUSTOMER_SUPPORT` | カスタマーサポートによるリファンド |
| `UNKNOWN` | 理由不明（App Store のみ） |
| `SUBSCRIPTION_PAUSED` | 一時停止による期限切れ（Play Store のみ） |

## サブスクリプションフィールド詳細

### period_type

| 値 | 説明 |
|---|------|
| `TRIAL` | 無料トライアル期間 |
| `INTRO` | 導入価格期間 |
| `NORMAL` | 通常価格期間 |
| `PROMOTIONAL` | プロモーショナルオファー |
| `PREPAID` | プリペイド期間 |

### store

| 値 | 説明 |
|---|------|
| `APP_STORE` | Apple App Store |
| `MAC_APP_STORE` | Mac App Store |
| `PLAY_STORE` | Google Play Store |
| `AMAZON` | Amazon Appstore |
| `STRIPE` | Stripe |
| `RC_BILLING` | RevenueCat Web Billing |
| `PROMOTIONAL` | ダッシュボードからの手動付与 |
| `ROKU` | Roku Channel Store |
| `TEST_STORE` | テストストア |

### environment

| 値 | 説明 |
|---|------|
| `SANDBOX` | テスト環境 |
| `PRODUCTION` | 本番環境 |

## AltMe での Webhook 処理パターン

### subscriptions テーブル同期

```typescript
// supabase/functions/revenuecat-webhook/index.ts

const handleWebhookEvent = async (event: any, supabase: any) => {
  const appUserId = event.app_user_id;

  switch (event.type) {
    // === 購入・更新 → アクティブ化 ===
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION': {
      const isTrialing = event.period_type === 'TRIAL';
      await supabase.from('subscriptions').upsert({
        user_id: appUserId,
        status: isTrialing ? 'trialing' : 'active',
        plan_type: event.product_id.includes('annual') ? 'annual' : 'monthly',
        current_period_start: event.purchased_at_ms,
        current_period_end: event.expiration_at_ms,
        revenuecat_customer_id: event.original_app_user_id,
        store: event.store,
        environment: event.environment,
        is_trial_conversion: event.is_trial_conversion ?? false,
      }, { onConflict: 'user_id' });

      // トライアル→有料転換時は OpenClaw インスタンスをプロビジョニング
      if (event.type === 'RENEWAL' && event.is_trial_conversion) {
        await supabase.functions.invoke('provision-openclaw', {
          body: { userId: appUserId },
        });
      }
      break;
    }

    // === 解約（期間終了まで有効） ===
    case 'CANCELLATION':
      await supabase.from('subscriptions').update({
        status: 'cancelled',
        cancel_reason: event.cancel_reason,
      }).eq('user_id', appUserId);
      break;

    // === 期限切れ → アクセス削除 ===
    case 'EXPIRATION':
      await supabase.from('subscriptions').update({
        status: 'expired',
        expiration_reason: event.expiration_reason,
      }).eq('user_id', appUserId);
      // OpenClaw インスタンス停止
      await supabase.functions.invoke('destroy-openclaw', {
        body: { userId: appUserId },
      });
      break;

    // === 課金問題（猶予期間開始） ===
    case 'BILLING_ISSUE':
      await supabase.from('subscriptions').update({
        status: 'billing_issue',
        grace_period_end: event.grace_period_expiration_at_ms,
      }).eq('user_id', appUserId);
      // プッシュ通知で支払い方法の更新を促す
      await supabase.functions.invoke('send-push', {
        body: {
          userId: appUserId,
          title: 'お支払いに問題があります',
          body: 'お支払い方法を更新してください。猶予期間後にサービスが停止されます。',
        },
      });
      break;

    // === プラン変更 ===
    case 'PRODUCT_CHANGE':
      await supabase.from('subscriptions').update({
        plan_type: event.new_product_id.includes('annual') ? 'annual' : 'monthly',
        current_period_end: event.expiration_at_ms,
      }).eq('user_id', appUserId);
      break;

    // === 一時停止（Play Store のみ） ===
    case 'SUBSCRIPTION_PAUSED':
      await supabase.from('subscriptions').update({
        status: 'paused',
        auto_resume_at: event.auto_resume_at_ms,
      }).eq('user_id', appUserId);
      break;

    // === アカウント転送 ===
    case 'TRANSFER':
      // 古いユーザーのサブスクリプションを新しいユーザーに移行
      if (event.transferred_from?.[0] && event.transferred_to?.[0]) {
        await supabase.from('subscriptions').update({
          user_id: event.transferred_to[0],
        }).eq('user_id', event.transferred_from[0]);
      }
      break;
  }
};
```

### OpenClaw インスタンス管理連動

| Webhook イベント | OpenClaw アクション |
|-----------------|-------------------|
| `INITIAL_PURCHASE` (TRIAL) | インスタンス作成開始（トライアル開始） |
| `RENEWAL` (is_trial_conversion=true) | 本格プロビジョニング |
| `RENEWAL` (通常) | 何もしない（継続中） |
| `CANCELLATION` | 何もしない（期間終了まで有効） |
| `EXPIRATION` | インスタンス停止・データ保持（90日間） |
| `BILLING_ISSUE` | 猶予期間開始。プッシュ通知送信 |
| `UNCANCELLATION` | 何もしない（インスタンスは稼働中） |

## Webhook リトライ

- Webhook 配信に失敗した場合、RevenueCat は自動リトライする
- リトライ時の `id` と `event_timestamp_ms` は初回と同じ
- 冪等性を担保するため、`id` でイベントの重複チェックを行うこと

## Webhook セキュリティ

- RevenueCat ダッシュボードで Authorization ヘッダーを設定
- Edge Function 側で `Authorization: Bearer {secret}` を検証
- HTTPS のみ対応（HTTP は不可）
