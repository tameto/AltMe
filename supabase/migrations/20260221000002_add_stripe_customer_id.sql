-- profiles テーブルに stripe_customer_id カラムを追加
-- Stripe Checkout / Portal セッション作成時に Customer を再利用するため

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
