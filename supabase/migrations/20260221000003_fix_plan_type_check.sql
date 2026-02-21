-- Fix plan_type CHECK constraint: 'intro_annual' → 'annual_intro'
-- Aligns DB constraint with TS PlanType definition and all frontend code
-- Also adds 'claimed_at' column to webhook_events for atomic idempotency

-- 1. Fix plan_type CHECK constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IS NULL OR plan_type IN ('monthly', 'annual', 'annual_intro'));

-- Migrate any existing 'intro_annual' values to 'annual_intro'
UPDATE subscriptions SET plan_type = 'annual_intro' WHERE plan_type = 'intro_annual';

-- 2. Add claimed_at column to webhook_events for atomic claim-based idempotency
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
