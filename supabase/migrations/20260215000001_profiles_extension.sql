-- T001: profiles extension
-- Add email, avatar_url, avatar_icon, speech_tone, mbti_type columns
-- Update handle_new_user() to save email from NEW.email
-- Spec: specs/api/database.md #1 (profiles)

-- Add new columns (idempotent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_icon TEXT DEFAULT 'default';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS speech_tone TEXT DEFAULT 'friendly';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mbti_type TEXT;

-- Make display_name nullable (was NOT NULL)
ALTER TABLE profiles ALTER COLUMN display_name DROP NOT NULL;

-- Set twin_name default to 'My Agent'
ALTER TABLE profiles ALTER COLUMN twin_name SET DEFAULT 'My Agent';

-- Update handle_new_user() to save email from auth.users
-- Also creates subscriptions, credits, notification_settings per spec
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
