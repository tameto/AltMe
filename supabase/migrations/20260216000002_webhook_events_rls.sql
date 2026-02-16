-- Enable RLS on webhook_events table
-- This table is only accessed via service_role in Edge Functions.
-- service_role bypasses RLS, so no policies are needed.
-- RLS prevents anon/authenticated clients from accessing the table via API.

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Revoke direct access from anon and authenticated roles
REVOKE ALL ON TABLE webhook_events FROM anon, authenticated;
