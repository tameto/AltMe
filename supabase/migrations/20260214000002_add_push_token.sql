-- Add push_token column to profiles for Expo Push Notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
