-- Chat topics integration: add topic_id to chat_messages, backfill default topics
-- Spec: specs/features/chat.md (topic chips UI)

-- 1. Add topic_id column to chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS topic_id TEXT DEFAULT 'daily';
CREATE INDEX IF NOT EXISTS idx_chat_messages_topic ON chat_messages(user_id, topic_id, created_at DESC);

-- 2. Add missing DELETE policy to chat_topics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_topics'
      AND policyname = 'Users can delete own chat topics'
  ) THEN
    CREATE POLICY "Users can delete own chat topics"
      ON chat_topics FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Update handle_new_profile() to create default topics
-- !! IMPORTANT: This function is the single source for new-user initialization.
-- !! When modifying, ensure ALL of these inserts are preserved:
-- !!   1. subscriptions (user_id, status='free')
-- !!   2. credits (user_id, daily_remaining=3)
-- !!   3. chat_topics (4 default topics: daily, work, reflection, consultation)
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, status) VALUES (NEW.id, 'free');
  INSERT INTO credits (user_id, daily_remaining) VALUES (NEW.id, 3);
  INSERT INTO chat_topics (id, user_id, name, icon, sort_order) VALUES
    (NEW.id || '::daily',        NEW.id, '日常',    '#', 0),
    (NEW.id || '::work',         NEW.id, '仕事',    '#', 1),
    (NEW.id || '::reflection',   NEW.id, '振り返り', '#', 2),
    (NEW.id || '::consultation', NEW.id, '相談',    '#', 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backfill existing users (idempotent)
INSERT INTO chat_topics (id, user_id, name, icon, sort_order)
SELECT p.id || '::daily', p.id, '日常', '#', 0 FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM chat_topics ct WHERE ct.id = p.id || '::daily')
UNION ALL
SELECT p.id || '::work', p.id, '仕事', '#', 1 FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM chat_topics ct WHERE ct.id = p.id || '::work')
UNION ALL
SELECT p.id || '::reflection', p.id, '振り返り', '#', 2 FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM chat_topics ct WHERE ct.id = p.id || '::reflection')
UNION ALL
SELECT p.id || '::consultation', p.id, '相談', '#', 3 FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM chat_topics ct WHERE ct.id = p.id || '::consultation');
