-- stripe_customer_id をクライアントから直接変更できないよう保護する
-- service_role（Edge Functions）経由のみ更新可能

-- ユーザーが stripe_customer_id を変更しようとした場合、元の値を維持するトリガー
CREATE OR REPLACE FUNCTION protect_stripe_customer_id()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role は制限しない（Edge Functions 経由の正当な更新）
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- クライアントからの stripe_customer_id 変更を無視
  IF OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id THEN
    NEW.stripe_customer_id := OLD.stripe_customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_stripe_customer_id_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_stripe_customer_id();
