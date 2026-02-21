# Web Full Impl Codex Review (2026-02-21)

## ブランチ: 20260221-web-full-impl

## 確認済み重要問題

### Critical
- `planType` vs `priceId` 不整合: フロントは `planType` 送信、EF は `priceId` 期待
  - `src/shared/hooks/use-platform-subscription.web.ts:188` → `planType: pkg.planType` を送信
  - `supabase/functions/create-checkout-session/index.ts:37` → `const { priceId } = await req.json()` を期待
  - Stripe決済フロー完全破綻（自分で確認済み）

### High
- Webhook secret 空文字 fail-open (Codex検証済み)
  - `webhook-stripe/index.ts:10`: `?? ''` でemptyになると問題
  - `webhook-revenuecat/index.ts:15`: `Bearer ` と空Authが一致してしまう
- 冪等性チェック非原子的（Codex指摘、ただし前回HOTFIXで一部対応済みか要確認）

## TypeScript エラー（npx tsc --noEmit で発見）
- `src/__tests__/webhook-integration.test.ts`: TS2722 多数
- `src/features/billing/__tests__/webhook-integration.test.ts`: TS2554

## プラットフォーム分離パターン
- `.ts` エントリが `.native` を直re-export（Metro以外で壊れる可能性）
- `client.web.ts` が sessionStorage 使用（localStorage にすべき）
- `client.native/web` でイベントリスナー未クリーンアップ

## 教訓
- フロントエンド→EF間のAPIパラメータ名の整合性テストは必須
- Webhook secret の startup validation（起動時に即エラー）が有効
