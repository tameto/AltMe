-- Chat Experience Improvement Schema
-- Adds: is_read/read_at to chat_messages, ogp_cache table, chat-media storage bucket

-- 1. chat_messages: Add is_read and read_at columns
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Index for unread messages per user (partial index for performance)
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read
  ON chat_messages(user_id, is_read)
  WHERE is_read = false;

-- 2. ogp_cache table (URL preview cache, managed by service role)
CREATE TABLE IF NOT EXISTS ogp_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  image TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_ogp_cache_url ON ogp_cache(url);
CREATE INDEX IF NOT EXISTS idx_ogp_cache_expires ON ogp_cache(expires_at);

-- 3. RLS for ogp_cache (service role writes, authenticated reads)
ALTER TABLE ogp_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ogp_cache' AND policyname = 'ogp_cache_read'
  ) THEN
    CREATE POLICY "ogp_cache_read" ON ogp_cache
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ogp_cache' AND policyname = 'ogp_cache_write'
  ) THEN
    CREATE POLICY "ogp_cache_write" ON ogp_cache
      FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- 4. Storage bucket for chat media (100MB limit, private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-media', 'chat-media', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS policies for chat-media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'chat_media_read'
  ) THEN
    CREATE POLICY "chat_media_read" ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'chat-media'
        AND (select auth.uid())::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'chat_media_insert'
  ) THEN
    CREATE POLICY "chat_media_insert" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'chat-media'
        AND (select auth.uid())::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'chat_media_delete'
  ) THEN
    CREATE POLICY "chat_media_delete" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'chat-media'
        AND (select auth.uid())::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;
