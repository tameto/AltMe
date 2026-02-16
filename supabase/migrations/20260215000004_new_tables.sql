-- T004: New tables
-- webhook_events, twin_conversations, twin_profiles_public VIEW, chat_topics
-- All with RLS policies per spec
-- Spec: specs/api/database.md #10, #11, #12, #13

-- ============================
-- webhook_events
-- RevenueCat Webhook idempotency check
-- ============================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- webhook_events: no RLS needed (accessed only via service_role in Edge Functions)

-- ============================
-- twin_conversations
-- AI twin-to-twin conversation records
-- ============================
CREATE TABLE IF NOT EXISTS twin_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('generating', 'completed', 'error')) DEFAULT 'generating',
  messages JSONB DEFAULT '[]',
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_twin_conversations_initiator ON twin_conversations(initiator_user_id);
CREATE INDEX IF NOT EXISTS idx_twin_conversations_partner ON twin_conversations(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_twin_conversations_status ON twin_conversations(status);

ALTER TABLE twin_conversations ENABLE ROW LEVEL SECURITY;

-- RLS: Only initiator can view their conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'twin_conversations'
      AND policyname = 'Users can view own initiated conversations'
  ) THEN
    CREATE POLICY "Users can view own initiated conversations"
      ON twin_conversations FOR SELECT
      USING (auth.uid() = initiator_user_id);
  END IF;
END $$;

-- ============================
-- twin_profiles_public VIEW
-- Community public profiles (read-only view)
-- ============================
CREATE OR REPLACE VIEW twin_profiles_public AS
SELECT
  p.id AS user_id,
  p.twin_name,
  pr.summary AS personality_summary,
  pr.personality_traits AS big_five_scores,
  p.created_at
FROM profiles p
INNER JOIN personality_results pr ON p.id = pr.user_id
WHERE
  p.onboarding_completed = true
  AND p.twin_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.id
    AND s.status IN ('trial', 'active', 'grace_period')
  );

-- ============================
-- chat_topics
-- Chat topic management per user
-- ============================
CREATE TABLE IF NOT EXISTS chat_topics (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_topics_user_id ON chat_topics(user_id);

ALTER TABLE chat_topics ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_topics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_topics'
      AND policyname = 'Users can view own chat topics'
  ) THEN
    CREATE POLICY "Users can view own chat topics"
      ON chat_topics FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_topics'
      AND policyname = 'Users can insert own chat topics'
  ) THEN
    CREATE POLICY "Users can insert own chat topics"
      ON chat_topics FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_topics'
      AND policyname = 'Users can update own chat topics'
  ) THEN
    CREATE POLICY "Users can update own chat topics"
      ON chat_topics FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;
