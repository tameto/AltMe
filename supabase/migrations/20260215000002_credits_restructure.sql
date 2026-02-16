-- T002: credits restructure
-- Replace balance-based system with daily_remaining + last_reset_at
-- Update handle_new_profile() to use new column structure
-- Update credit_transactions type CHECK to include 'reset'
-- Spec: specs/api/database.md #7 (credits), #8 (credit_transactions)

-- Drop old balance column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'credits'
      AND column_name = 'balance'
  ) THEN
    ALTER TABLE credits DROP COLUMN balance;
  END IF;
END $$;

-- Add new columns (idempotent)
ALTER TABLE credits ADD COLUMN IF NOT EXISTS daily_remaining INTEGER DEFAULT 3;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS last_reset_at DATE DEFAULT CURRENT_DATE;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update handle_new_profile() to use new credits structure
-- Also insert subscriptions with plan column per spec
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, status)
  VALUES (NEW.id, 'free');
  INSERT INTO credits (user_id, daily_remaining)
  VALUES (NEW.id, 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update credit_transactions type CHECK to include 'reset'
-- Drop the old constraint and recreate with updated values
DO $$
BEGIN
  -- Drop existing CHECK constraint on type column
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage ccu
    JOIN information_schema.table_constraints tc
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'credit_transactions'
      AND tc.constraint_type = 'CHECK'
      AND ccu.column_name = 'type'
  ) THEN
    -- Find and drop the constraint by querying pg_constraint
    EXECUTE (
      SELECT 'ALTER TABLE credit_transactions DROP CONSTRAINT ' || quote_ident(con.conname)
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'credit_transactions'
        AND nsp.nspname = 'public'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) LIKE '%type%'
      LIMIT 1
    );
  END IF;
END $$;

-- Add new CHECK constraint including 'reset'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'credit_transactions'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
      AND con.conname = 'credit_transactions_type_check'
  ) THEN
    ALTER TABLE credit_transactions
      ADD CONSTRAINT credit_transactions_type_check
      CHECK (type IN ('consume', 'reset', 'bonus'));
  END IF;
END $$;
