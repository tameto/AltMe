# RevenueCat エラーハンドリングリファレンス

## HTTP ステータスコード（REST API v2）

### 成功レスポンス

| コード | 説明 |
|-------|------|
| `200 OK` | リクエスト成功 |
| `201 Created` | リソース作成成功 |
| `202 Accepted` | リクエスト受理（非同期処理） |
| `204 No Content` | 成功（レスポンスボディなし） |

### クライアントエラー

| コード | 説明 | 対処法 |
|-------|------|--------|
| `400 Bad Request` | リクエストパラメータが不正 | リクエストボディ・パラメータを確認 |
| `401 Unauthorized` | 認証失敗 | API Key を確認（v2 Secret Key が必要） |
| `403 Forbidden` | 権限不足 | API Key のパーミッションを確認 |
| `404 Not Found` | リソースが存在しない | ID・パスを確認 |
| `409 Conflict` | リソース競合 | 既存リソースとの重複を確認 |
| `422 Unprocessable Entity` | バリデーションエラー | 必須フィールド・値の制約を確認 |
| `423 Locked` | リソースがロック中 | 処理完了を待ってリトライ |
| `429 Too Many Requests` | レート制限超過 | `Retry-After` ヘッダーに従う |

### サーバーエラー

| コード | 説明 | 対処法 |
|-------|------|--------|
| `500 Internal Server Error` | サーバー内部エラー | リトライ、status.revenuecat.com を確認 |
| `502 Bad Gateway` | ゲートウェイエラー | 時間をおいてリトライ |
| `503 Service Unavailable` | サービス一時停止 | status.revenuecat.com を確認 |
| `504 Gateway Timeout` | ゲートウェイタイムアウト | 時間をおいてリトライ |

### API エラーレスポンス構造

```json
{
  "type": "parameter_error",
  "param": "customer_id",
  "message": "id is too long",
  "retryable": false,
  "doc_url": "https://docs.revenuecat.com/reference#section-error-handling"
}
```

| フィールド | 型 | 説明 |
|-----------|---|------|
| `type` | string | エラー種別（`parameter_error`, `authentication_error`, `rate_limit_error` 等） |
| `param` | string | エラーの原因となったパラメータ名 |
| `message` | string | 人間が読めるエラーメッセージ |
| `retryable` | boolean | リトライ可能かどうか |
| `doc_url` | string | ドキュメントへのリンク |

## SDK エラーコード（PURCHASES_ERROR_CODE）

### 共通エラー

| コード | 定数名 | 説明 | ユーザー向けメッセージ（日本語） |
|-------|--------|------|------|
| 0 | `UNKNOWN_ERROR` | 原因不明のエラー | 予期しないエラーが発生しました。しばらく後にお試しください。 |
| 1 | `PURCHASE_CANCELLED_ERROR` | ユーザーが購入をキャンセル | （表示不要） |
| 2 | `STORE_PROBLEM_ERROR` | App Store / Play Store の問題 | 購入処理に問題が発生しました。しばらく後にお試しください。 |
| 3 | `PURCHASE_NOT_ALLOWED_ERROR` | デバイスで購入が許可されていない | お使いのデバイスで購入が制限されています。設定をご確認ください。 |
| 4 | `PURCHASE_INVALID_ERROR` | 購入引数が無効 | 購入情報が無効です。もう一度お試しください。 |
| 5 | `PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR` | 商品が購入不可 | 現在この商品は購入できません。 |
| 6 | `PRODUCT_ALREADY_PURCHASED_ERROR` | 既に購入済み | 既にこのプランを購入済みです。「購入を復元」をお試しください。 |
| 7 | `RECEIPT_ALREADY_IN_USE_ERROR` | レシートが別アカウントで使用中 | このレシートは別のアカウントで使用されています。元のアカウントでログインしてください。 |
| 8 | `INVALID_RECEIPT_ERROR` | レシートが無効 | レシートの検証に失敗しました。もう一度お試しください。 |
| 9 | `MISSING_RECEIPT_FILE_ERROR` | レシートファイルが見つからない | レシートが見つかりません。ストアにログインし直してください。 |
| 10 | `NETWORK_ERROR` | ネットワーク接続の問題 | ネットワークエラーが発生しました。接続を確認してください。 |
| 11 | `INVALID_CREDENTIALS_ERROR` | API Key / 認証情報が無効 | アプリの設定に問題があります。最新版にアップデートしてください。 |
| 12 | `UNEXPECTED_BACKEND_RESPONSE_ERROR` | サーバーからの不正なレスポンス | サーバーからの応答に問題があります。しばらく後にお試しください。 |
| 13 | `INVALID_APP_USER_ID_ERROR` | App User ID が無効（100文字超等） | アカウント情報に問題があります。再ログインしてください。 |
| 14 | `OPERATION_ALREADY_IN_PROGRESS_ERROR` | 同一操作が実行中 | 処理中です。しばらくお待ちください。 |
| 15 | `UNKNOWN_BACKEND_ERROR` | 不明なバックエンドエラー | サーバーエラーが発生しました。しばらく後にお試しください。 |
| 16 | `INVALID_APPLE_SUBSCRIPTION_KEY_ERROR` | Apple Subscription Key が無効 | （内部エラー。ダッシュボード設定を確認） |
| 17 | `INELIGIBLE_ERROR` | オファーの適用条件を満たさない | このオファーは現在ご利用いただけません。 |
| 18 | `INSUFFICIENT_PERMISSIONS_ERROR` | 購入権限がない | 購入が許可されていません。ストアアカウントにログインしてください。 |
| 19 | `PAYMENT_PENDING_ERROR` | 支払いが保留中 | 支払いが保留中です。完了後にアクセスできるようになります。 |
| 20 | `INVALID_SUBSCRIBER_ATTRIBUTES_ERROR` | カスタマー属性が無効 | （内部エラー。属性値を確認） |
| 21 | `OFFLINE_CONNECTION_ERROR` | デバイスがオフライン | インターネットに接続されていません。接続を確認してください。 |
| 22 | `SIGNATURE_VERIFICATION_FAILED` | レスポンス署名検証失敗 | セキュリティ検証に失敗しました。VPN やプロキシを無効にしてください。 |

### Amazon 固有エラー

| コード | 定数名 | 説明 | ユーザー向けメッセージ（日本語） |
|-------|--------|------|------|
| - | `ERROR_FINDING_RECEIPT_SKU` | SKU のレシート検索失敗 | Amazon のレシート情報を取得できません。 |
| - | `ERROR_FETCHING_RECEIPTS` | レシート取得失敗 | レシートの取得に失敗しました。 |
| - | `ERROR_FETCHING_RECEIPT_INFO` | レシート情報取得失敗 | レシート詳細の取得に失敗しました。 |

## エラーハンドリング実装（React Native）

### 購入エラーハンドラー

```typescript
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';

type PurchaseResult = {
  success: boolean;
  cancelled?: boolean;
  pending?: boolean;
  errorMessage?: string;
};

const handlePurchaseError = (error: any): PurchaseResult => {
  // ユーザーキャンセル → UI を閉じない、何も表示しない
  if (error.userCancelled || error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    return { success: false, cancelled: true };
  }

  // 支払い保留 → 特別な UI 表示
  if (error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
    return {
      success: false,
      pending: true,
      errorMessage: '支払いが保留中です。完了後にアクセスできるようになります。',
    };
  }

  // ネットワークエラー → リトライ可能
  if (
    error.code === PURCHASES_ERROR_CODE.NETWORK_ERROR ||
    error.code === PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR
  ) {
    return {
      success: false,
      errorMessage: 'ネットワークに接続できません。接続を確認して再度お試しください。',
    };
  }

  // ストアの問題 → リトライ推奨
  if (error.code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
    return {
      success: false,
      errorMessage: '購入処理に問題が発生しました。しばらく後にお試しください。',
    };
  }

  // 既に購入済み → 復元を案内
  if (
    error.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR ||
    error.code === PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR
  ) {
    return {
      success: false,
      errorMessage: '既に購入済みです。「購入を復元」をお試しください。',
    };
  }

  // その他 → 汎用エラー
  return {
    success: false,
    errorMessage: '予期しないエラーが発生しました。しばらく後にお試しください。',
  };
};
```

### 復元エラーハンドラー

```typescript
const handleRestoreError = (error: any): string => {
  switch (error.code) {
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return 'ネットワークに接続できません。接続を確認して再度お試しください。';

    case PURCHASES_ERROR_CODE.INVALID_RECEIPT_ERROR:
    case PURCHASES_ERROR_CODE.MISSING_RECEIPT_FILE_ERROR:
      return '購入情報が見つかりません。ストアアカウントにログインしていることを確認してください。';

    default:
      return '購入の復元に失敗しました。しばらく後にお試しください。';
  }
};
```

## リトライ戦略

### SDK リトライ（自動）

RevenueCat SDK は以下のケースで自動リトライを行う:
- ネットワーク一時障害
- 5xx サーバーエラー
- レシート検証の一時的な失敗

### REST API リトライ（手動実装）

```typescript
const callWithRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // リトライ不可能なエラー
      if (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404) {
        throw error;
      }

      // 429: Retry-After ヘッダーに従う
      if (error.status === 429) {
        const retryAfterMs = (error.headers?.['retry-after'] ?? 60) * 1000;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
          continue;
        }
      }

      // 5xx: 指数バックオフ
      if (error.status >= 500 && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};
```

### リトライ判断マトリックス

| エラー種別 | リトライ | 方法 |
|-----------|---------|------|
| `400 Bad Request` | 不可 | パラメータ修正が必要 |
| `401 Unauthorized` | 不可 | API Key を確認 |
| `403 Forbidden` | 不可 | 権限設定を確認 |
| `404 Not Found` | 不可 | ID・パスを確認 |
| `409 Conflict` | 条件付き | 競合解消後にリトライ |
| `429 Rate Limited` | 可 | `Retry-After` ヘッダーに従う |
| `500 Server Error` | 可 | 指数バックオフ（最大3回） |
| `502/503/504` | 可 | 指数バックオフ（最大3回） |
| `NETWORK_ERROR` (SDK) | 自動 | SDK が自動リトライ |
| `STORE_PROBLEM_ERROR` (SDK) | 自動 | SDK が自動リトライ |

## レート制限

### ドメイン別レート制限

| ドメイン | 制限 | 対象エンドポイント |
|---------|------|----|
| Customer Information | 480 req/min | `/customers/*` |
| Charts & Metrics | 5 req/min | `/metrics/*`, `/charts/*` |
| Project Configuration | 60 req/min | `/products/*`, `/entitlements/*`, `/offerings/*` |
| Virtual Currencies (Create Transaction) | 480 req/min | `/virtual_currencies/*/transactions` |

### レスポンスヘッダー

```
RevenueCat-Rate-Limit-Current-Usage: 45
RevenueCat-Rate-Limit-Current-Limit: 480
```

### 429 レスポンス

```json
{
  "type": "rate_limit_error",
  "message": "Rate limit exceeded",
  "retryable": true,
  "backoff_ms": 5000
}
```

ヘッダー `Retry-After: 5`（秒数）に従ってリトライする。
