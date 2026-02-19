-- Community tables migration
-- Spec: specs/api/database.md #17, #18, #19
-- Tables: communities, community_members, community_messages

-- ============================
-- communities (#17)
-- Community management table
-- ============================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  description TEXT CHECK (char_length(description) <= 200),
  language TEXT NOT NULL DEFAULT 'jp' CHECK (language IN ('jp', 'en')),
  category TEXT NOT NULL CHECK (category IN ('info', 'business', 'hobby', 'casual', 'other')),
  thumbnail_url TEXT,
  is_default_thumbnail BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communities_creator_id ON communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_communities_category ON communities(category);
CREATE INDEX IF NOT EXISTS idx_communities_is_active ON communities(is_active);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- updated_at trigger for communities
-- update_updated_at() function is defined in 20260214000001_initial_schema.sql
DROP TRIGGER IF EXISTS set_updated_at ON communities;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS policies for communities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'communities'
      AND policyname = 'Anyone can view communities'
  ) THEN
    CREATE POLICY "Anyone can view communities"
      ON communities FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'communities'
      AND policyname = 'Authenticated users can create communities'
  ) THEN
    CREATE POLICY "Authenticated users can create communities"
      ON communities FOR INSERT
      WITH CHECK (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'communities'
      AND policyname = 'Creators can update own communities'
  ) THEN
    CREATE POLICY "Creators can update own communities"
      ON communities FOR UPDATE
      USING (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'communities'
      AND policyname = 'Creators can delete own communities'
  ) THEN
    CREATE POLICY "Creators can delete own communities"
      ON communities FOR DELETE
      USING (auth.uid() = creator_id);
  END IF;
END $$;

-- ============================
-- community_members (#18)
-- Community membership management
-- ============================
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for community_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_members'
      AND policyname = 'Anyone can view community members'
  ) THEN
    CREATE POLICY "Anyone can view community members"
      ON community_members FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_members'
      AND policyname = 'Users can join communities'
  ) THEN
    CREATE POLICY "Users can join communities"
      ON community_members FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_members'
      AND policyname = 'Users can leave communities'
  ) THEN
    CREATE POLICY "Users can leave communities"
      ON community_members FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================
-- community_messages (#19)
-- Community chat messages including autonomous AI agent posts
-- ============================
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  agent_user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_autonomous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_community_id ON community_messages(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_agent_user_id ON community_messages(agent_user_id);

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for community_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_messages'
      AND policyname = 'Anyone can view community messages'
  ) THEN
    CREATE POLICY "Anyone can view community messages"
      ON community_messages FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_messages'
      AND policyname = 'Users can post as own agent'
  ) THEN
    CREATE POLICY "Users can post as own agent"
      ON community_messages FOR INSERT
      WITH CHECK (auth.uid() = agent_user_id);
  END IF;
END $$;
