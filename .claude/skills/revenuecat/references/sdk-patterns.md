# RevenueCat SDK 詳細パターン集

## 1. SDK 初期化

### React Native (Expo) — AltMe 標準

```typescript
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const configureRevenueCat = async (appUserId?: string) => {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({
    apiKey: Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
    })!,
    appUserID: appUserId ?? null, // null = 匿名ID自動生成
  });
};
```

### Purchases.configure() 全オプション

```typescript
Purchases.configure({
  // 必須: RevenueCat ダッシュボード > Project Settings > API keys
  apiKey: string,

  // 任意: ユーザー識別子。null で匿名ID自動生成
  appUserID: string | null,

  // 任意: true にすると RevenueCat はトランザクションを完了しない
  // 既存の課金処理コードがある場合のみ true
  purchasesAreCompletedBy: 'REVENUECAT' | 'MY_APP', // デフォルト: 'REVENUECAT'

  // 任意: iOS App Extension で CustomerInfo にアクセスする場合
  userDefaultsSuiteName: string,

  // 任意: API 制限地域向けプロキシ
  // Purchases.setProxyURL('https://api.rc-backup.com/') を configure 前に呼ぶ

  // 任意: Entitlement 検証モード (v5.0+)
  entitlementVerificationMode: 'DISABLED' | 'INFORMATIONAL', // デフォルト: 'DISABLED'
});
```

### iOS (Swift)

```swift
import RevenueCat

// AppDelegate.application(_:didFinishLaunchingWithOptions:) 内
Purchases.logLevel = .debug
Purchases.configure(withAPIKey: "appl_xxxxxxxx", appUserID: "user_123")
```

### Android (Kotlin)

```kotlin
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration

// Application.onCreate() 内
Purchases.logLevel = LogLevel.DEBUG
Purchases.configure(
    PurchasesConfiguration.Builder(this, "goog_xxxxxxxx")
        .appUserID("user_123")
        .build()
)
```

### Flutter

```dart
await Purchases.setLogLevel(LogLevel.debug);
PurchasesConfiguration configuration = PurchasesConfiguration("your_public_api_key")
  ..appUserID = "user_123";
await Purchases.configure(configuration);
```

**重要ルール:**
- SDK 初期化はアプリ起動時の最も早い段階で行う
- Public API Key のみ使用。Secret Key は絶対にクライアントに含めない
- API Key はプラットフォームごとに異なる（iOS: `appl_xxx`, Android: `goog_xxx`）
- `appUserID` に Supabase の `auth.uid()` を設定してユーザー紐付け
- デバッグログは `__DEV__` 時のみ有効にする

## 2. Supabase Auth 連携

```typescript
// ログイン後に RevenueCat ユーザーIDを設定
const onLogin = async (supabaseUserId: string) => {
  const { customerInfo } = await Purchases.logIn(supabaseUserId);
  return customerInfo;
};

// ログアウト時（匿名IDにリセット）
const onLogout = async () => {
  await Purchases.logOut();
};
```

**logIn の挙動:**
- 匿名ユーザーに購入履歴がある場合、識別済みユーザーに自動転送
- 既に同じ appUserID でログイン済みなら何もしない
- 別のユーザーからの切り替え時は新しいユーザーの CustomerInfo を返す

**logOut の挙動:**
- 新しい匿名 App User ID を生成
- 以前の識別済みユーザーのデータには影響しない

## 3. Entitlement チェック

### 同期チェック（一回取得）

```typescript
import Purchases, { CustomerInfo } from 'react-native-purchases';

const checkProAccess = async (): Promise<boolean> => {
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo.entitlements.active['pro'] !== undefined;
};
```

### 非同期リスナー（リアルタイム更新）

```typescript
// アプリ起動時に設定
Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
  const isPro = customerInfo.entitlements.active['pro'] !== undefined;
  useSubscriptionStore.getState().setIsPro(isPro);
});
```

### 詳細な Entitlement 情報

```typescript
const getEntitlementDetails = async () => {
  const customerInfo = await Purchases.getCustomerInfo();
  const proEntitlement = customerInfo.entitlements.active['pro'];

  if (!proEntitlement) return null;

  return {
    isActive: proEntitlement.isActive,
    willRenew: proEntitlement.willRenew,
    periodType: proEntitlement.periodType, // 'NORMAL' | 'TRIAL' | 'INTRO'
    latestPurchaseDate: proEntitlement.latestPurchaseDate,
    originalPurchaseDate: proEntitlement.originalPurchaseDate,
    expirationDate: proEntitlement.expirationDate,
    store: proEntitlement.store, // 'APP_STORE' | 'PLAY_STORE' | etc.
    productIdentifier: proEntitlement.productIdentifier,
    isSandbox: proEntitlement.isSandbox,
    unsubscribeDetectedAt: proEntitlement.unsubscribeDetectedAt,
    billingIssueDetectedAt: proEntitlement.billingIssueDetectedAt,
  };
};
```

## 4. Zustand Store 統合

```typescript
import { create } from 'zustand';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

interface SubscriptionState {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  checkEntitlement: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  setIsPro: (isPro: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: false,
  customerInfo: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;
      set({ isPro, customerInfo, isLoading: false });

      Purchases.addCustomerInfoUpdateListener((info) => {
        set({
          isPro: info.entitlements.active['pro'] !== undefined,
          customerInfo: info,
        });
      });
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  checkEntitlement: async () => {
    const customerInfo = await Purchases.getCustomerInfo();
    set({
      isPro: customerInfo.entitlements.active['pro'] !== undefined,
      customerInfo,
    });
  },

  purchase: async (pkg) => {
    set({ isLoading: true, error: null });
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;
      set({ isPro, customerInfo, isLoading: false });
      return isPro;
    } catch (e: any) {
      if (!e.userCancelled) {
        set({ error: e.message });
      }
      set({ isLoading: false });
      return false;
    }
  },

  restore: async () => {
    set({ isLoading: true, error: null });
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;
      set({ isPro, customerInfo, isLoading: false });
      return isPro;
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
      return false;
    }
  },

  setIsPro: (isPro) => set({ isPro }),
}));
```

## 5. 購入フロー

### Offering & Package 取得

```typescript
const getOfferings = async () => {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return null;

  return {
    monthly: current.monthly,      // $rc_monthly → 月額 ¥4,980
    annual: current.annual,        // $rc_annual → 年額 ¥39,800
    introAnnual: current.availablePackages.find(
      (p) => p.identifier === 'intro_annual'
    ), // 初回限定 ¥29,800
  };
};
```

### 購入実行

```typescript
import Purchases, { PurchasesPackage } from 'react-native-purchases';

const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (customerInfo.entitlements.active['pro']) {
      return { success: true };
    }
    return { success: false, error: 'Entitlement not active' };
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, cancelled: true };
    }
    return { success: false, error: e.message };
  }
};
```

### Promotional Offer 付き購入 (iOS)

```typescript
const purchaseWithPromo = async (
  pkg: PurchasesPackage,
  discount: PurchasesPromotionalOffer
) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg, {
      discount,
    });
    return customerInfo.entitlements.active['pro'] !== undefined;
  } catch (e: any) {
    if (!e.userCancelled) throw e;
    return false;
  }
};
```

## 6. 購入復元

```typescript
// ユーザー操作（ボタンタップ）からのみ呼ぶこと
const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['pro'] !== undefined;
  } catch (e) {
    console.error('Restore failed:', e);
    return false;
  }
};
```

**復元のルールと制約:**
- `restorePurchases` は必ずユーザーのボタンタップから呼ぶ。自動実行禁止
- App Store 審査要件: 「購入を復元」ボタンの配置が必須
- 復元は同一 Apple ID / Google アカウントの購入を紐付ける
- 匿名ユーザーの場合、購入履歴が現在のユーザーに転送される
- 識別済みユーザーの場合、`appUserID` ベースで購入を復元

## 7. ペイウォールコンポーネントパターン

### useOfferings Hook

```typescript
import { useCallback, useEffect, useState } from 'react';
import Purchases, { PurchasesOffering } from 'react-native-purchases';

export const useOfferings = () => {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        setOffering(offerings.current);
      } catch (e) {
        console.error('Failed to fetch offerings:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  return { offering, isLoading };
};
```

### 価格表示ユーティリティ

```typescript
import { PurchasesPackage } from 'react-native-purchases';

const formatPrice = (pkg: PurchasesPackage) => {
  const product = pkg.product;
  return {
    price: product.priceString,              // "¥4,980"
    pricePerMonth: product.priceString,      // 月額の場合
    // 年額の月換算
    monthlyEquivalent: pkg.packageType === 'ANNUAL'
      ? `¥${Math.round(product.price / 12).toLocaleString()}/月`
      : null,
    currencyCode: product.currencyCode,      // "JPY"
    introPrice: product.introPrice,          // トライアル/導入価格情報
  };
};
```

## 8. 購入エラーハンドリング

```typescript
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';

const handlePurchaseError = (error: any): string | null => {
  switch (error.code) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return null; // ユーザーキャンセル → 何もしない

    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return '購入処理に問題が発生しました。しばらく後にお試しください。';

    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return 'お使いのデバイスで購入が制限されています。設定をご確認ください。';

    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return '支払いが保留中です。完了後にアクセスできるようになります。';

    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return 'ネットワークエラーが発生しました。接続を確認してください。';

    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return '既にこのプランを購入済みです。「購入を復元」をお試しください。';

    case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      return 'このレシートは別のアカウントで使用されています。元のアカウントでログインしてください。';

    case PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR:
      return 'アプリの設定に問題があります。最新版にアップデートしてください。';

    case PURCHASES_ERROR_CODE.INSUFFICIENT_PERMISSIONS_ERROR:
      return '購入が許可されていません。ストアアカウントにログインしてください。';

    case PURCHASES_ERROR_CODE.INVALID_RECEIPT_ERROR:
      return 'レシートの検証に失敗しました。もう一度お試しください。';

    case PURCHASES_ERROR_CODE.MISSING_RECEIPT_FILE_ERROR:
      return 'レシートが見つかりません。ストアにログインし直してください。';

    case PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR:
      return '処理中です。しばらくお待ちください。';

    case PURCHASES_ERROR_CODE.UNKNOWN_ERROR:
    default:
      return '予期しないエラーが発生しました。しばらく後にお試しください。';
  }
};
```

## 9. Webhook Edge Function パターン

```typescript
// supabase/functions/revenuecat-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (authHeader !== `Bearer ${webhookSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const event = body.event;
  const appUserId = event.app_user_id;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
      await supabase.from('subscriptions').upsert({
        user_id: appUserId,
        status: 'active',
        plan_type: event.product_id.includes('annual') ? 'annual' : 'monthly',
        current_period_start: event.period_type === 'TRIAL'
          ? event.purchased_at_ms
          : event.event_timestamp_ms,
        current_period_end: event.expiration_at_ms,
        revenuecat_customer_id: event.id,
      }, { onConflict: 'user_id' });
      break;

    case 'CANCELLATION':
      await supabase.from('subscriptions').update({
        status: 'cancelled',
      }).eq('user_id', appUserId);
      break;

    case 'EXPIRATION':
      await supabase.from('subscriptions').update({
        status: 'expired',
      }).eq('user_id', appUserId);
      // OpenClaw インスタンス停止をトリガー
      await supabase.functions.invoke('destroy-openclaw', {
        body: { userId: appUserId },
      });
      break;

    case 'BILLING_ISSUE':
      await supabase.from('subscriptions').update({
        status: 'billing_issue',
      }).eq('user_id', appUserId);
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## 10. サンドボックステスト手順

### iOS テストアカウント設定
1. App Store Connect > Users and Access > Sandbox Testers
2. テスト用メールアドレスを登録
3. 実機の Settings > App Store > Sandbox Account でログイン

### Android テスト設定
1. Google Play Console > Setup > License testing にテスターのメールを追加
2. Internal testing track にビルドをアップロード
3. テスターはテスト参加リンクからオプトイン

### サンドボックスでのサブスクリプション期間

| 実際の期間 | サンドボックス (iOS) | テスト (Android) |
|-----------|---------------------|-----------------|
| 3日トライアル | 2分 | 3分 |
| 1週間 | 3分 | 5分 |
| 1ヶ月 | 5分 | 5分 |
| 2ヶ月 | 10分 | 5分 |
| 3ヶ月 | 15分 | 5分 |
| 6ヶ月 | 30分 | 5分 |
| 1年 | 1時間 | 5分 |

### デバッグチェックリスト

1. `Purchases.setLogLevel(LOG_LEVEL.DEBUG)` を有効にする
2. RevenueCat ダッシュボードで Customer > 対象ユーザーを確認
3. `Purchases.getCustomerInfo()` の結果をデバッグ画面に表示
4. Sandbox 環境では `environment: "SANDBOX"` が返ることを確認
5. Webhook テスト: RevenueCat ダッシュボード > Integrations > Webhooks > Test ボタン
6. トランザクションログ: ダッシュボード > Customer > Activity タブ

### RevenueCat Debug Overlay (開発時)

```typescript
// デバッグ画面で CustomerInfo をダンプ
const DebugSubscription = () => {
  const [info, setInfo] = useState<string>('');

  useEffect(() => {
    Purchases.getCustomerInfo().then((ci) => {
      setInfo(JSON.stringify({
        activeEntitlements: Object.keys(ci.entitlements.active),
        allPurchaseDates: ci.allPurchaseDates,
        activeSubscriptions: ci.activeSubscriptions,
        managementURL: ci.managementURL,
      }, null, 2));
    });
  }, []);

  return <Text selectable>{info}</Text>;
};
```
