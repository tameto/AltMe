-- T003: personality_results extension
-- Add communication_style, raw_answers columns
-- Drop UNIQUE constraint on user_id (allow multiple results per user)
-- Migrate existing answers data to raw_answers
-- Spec: specs/api/database.md #2 (personality_results)

-- Add new columns (idempotent)
ALTER TABLE personality_results ADD COLUMN IF NOT EXISTS communication_style JSONB;
ALTER TABLE personality_results ADD COLUMN IF NOT EXISTS raw_answers JSONB;

-- Migrate existing answers data to raw_answers (only where raw_answers is NULL)
UPDATE personality_results
SET raw_answers = answers
WHERE raw_answers IS NULL AND answers IS NOT NULL;

-- Drop UNIQUE constraint on user_id to allow multiple personality results
-- (e.g., user retakes the personality test)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'personality_results'
      AND nsp.nspname = 'public'
      AND con.contype = 'u'
      AND EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage ccu
        WHERE ccu.constraint_name = con.conname
          AND ccu.column_name = 'user_id'
      )
  ) THEN
    ALTER TABLE personality_results DROP CONSTRAINT personality_results_user_id_key;
  END IF;
END $$;

-- Add index on user_id for efficient lookups (idempotent)
CREATE INDEX IF NOT EXISTS idx_personality_results_user_id ON personality_results(user_id);
