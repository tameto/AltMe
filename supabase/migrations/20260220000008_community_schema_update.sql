-- Community schema update migration
-- Spec: specs/api/database.md
-- Changes:
--   1. communities.language CHECK: 'jp' -> 'ja', add 'ko'
--   2. communities.category CHECK: update categories
--   3. communities.description CHECK: increase limit 200 -> 300
--   4. communities.conversation_count column
--   5. community_messages.twin_name, avatar_icon columns (denormalized)
--   6. member_count auto-update trigger
--   7. conversation_count auto-update trigger
--   8. BEFORE INSERT trigger for denormalized fields
--   9. service_role INSERT RLS policy for community_messages

-- ============================
-- Step 1: Data migration BEFORE constraint changes
-- ============================

-- 1a. Update 'jp' -> 'ja' for new language CHECK
UPDATE communities SET language = 'ja' WHERE language = 'jp';

-- 1b. Update old categories to 'other' (keep valid ones: 'other')
--     Old values: 'info', 'business', 'hobby', 'casual' (all not in new set) -> 'other'
--     New valid values: 'entertainment', 'lifestyle', 'technology', 'other'
UPDATE communities
SET category = 'other'
WHERE category NOT IN ('entertainment', 'lifestyle', 'technology', 'other');

-- ============================
-- Step 2: communities CHECK constraint changes
-- ============================

-- 2a. language CHECK: drop old, add new
ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_language_check;
ALTER TABLE communities
  ADD CONSTRAINT communities_language_check
  CHECK (language IN ('ja', 'en', 'ko'));

-- 2b. category CHECK: drop old, add new
ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_category_check;
ALTER TABLE communities
  ADD CONSTRAINT communities_category_check
  CHECK (category IN ('entertainment', 'lifestyle', 'technology', 'other'));

-- 2c. description CHECK: drop old (200 chars), add new (300 chars)
ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_description_check;
ALTER TABLE communities
  ADD CONSTRAINT communities_description_check
  CHECK (char_length(description) <= 300);

-- ============================
-- Step 3: Add conversation_count column to communities
-- ============================
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS conversation_count INTEGER DEFAULT 0;

-- ============================
-- Step 4: Add denormalized columns to community_messages
-- ============================
ALTER TABLE community_messages
  ADD COLUMN IF NOT EXISTS twin_name TEXT;
ALTER TABLE community_messages
  ADD COLUMN IF NOT EXISTS avatar_icon TEXT;

-- ============================
-- Step 5: member_count auto-update trigger
-- ============================
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_member_count ON community_members;
CREATE TRIGGER trg_update_member_count
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- ============================
-- Step 6: conversation_count auto-update trigger
-- ============================
CREATE OR REPLACE FUNCTION update_community_conversation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
    SET conversation_count = conversation_count + 1
    WHERE id = NEW.community_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_conversation_count ON community_messages;
CREATE TRIGGER trg_update_conversation_count
  AFTER INSERT ON community_messages
  FOR EACH ROW EXECUTE FUNCTION update_community_conversation_count();

-- ============================
-- Step 7: BEFORE INSERT trigger for denormalized twin_name / avatar_icon
-- ============================
CREATE OR REPLACE FUNCTION set_community_message_twin_info()
RETURNS TRIGGER AS $$
DECLARE
  v_twin_name TEXT;
  v_avatar_icon TEXT;
BEGIN
  SELECT twin_name, avatar_icon
    INTO v_twin_name, v_avatar_icon
    FROM profiles
    WHERE id = NEW.agent_user_id;

  NEW.twin_name  := COALESCE(v_twin_name, '');
  NEW.avatar_icon := COALESCE(v_avatar_icon, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_twin_info ON community_messages;
CREATE TRIGGER trg_set_twin_info
  BEFORE INSERT ON community_messages
  FOR EACH ROW EXECUTE FUNCTION set_community_message_twin_info();

-- ============================
-- Step 8: service_role INSERT RLS policy for community_messages
-- service_role bypasses RLS entirely in Supabase, but an explicit policy
-- is added here for clarity and to allow Edge Functions using service_role
-- to insert autonomous messages even if RLS is enforced in future.
-- In Supabase, service_role JWT has role = 'service_role'.
-- We detect it via auth.jwt()->>'role' = 'service_role'.
-- ============================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_messages'
      AND policyname = 'Service role can insert autonomous messages'
  ) THEN
    CREATE POLICY "Service role can insert autonomous messages"
      ON community_messages FOR INSERT
      WITH CHECK (
        (auth.jwt() ->> 'role') = 'service_role'
      );
  END IF;
END $$;
