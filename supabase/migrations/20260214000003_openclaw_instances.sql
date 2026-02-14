-- OpenClaw Instances Table
-- 仕様書: specs/api/database.md#9, specs/features/openclaw-provisioning.md

-- ============================
-- openclaw_instances
-- ============================
CREATE TABLE openclaw_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  droplet_id BIGINT,
  ip_address INET,
  gateway_token TEXT,
  status TEXT CHECK (status IN ('provisioning', 'running', 'stopped', 'error', 'destroying')) DEFAULT 'provisioning',
  region TEXT DEFAULT 'sgp1',
  droplet_size TEXT DEFAULT 's-1vcpu-1gb',
  soul_md TEXT,
  last_health_check TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_openclaw_instances_user_id ON openclaw_instances(user_id);
CREATE INDEX idx_openclaw_instances_status ON openclaw_instances(status);

ALTER TABLE openclaw_instances ENABLE ROW LEVEL SECURITY;

-- Users can view own instance (gateway_token is excluded via view)
CREATE POLICY "Users can view own openclaw instance"
  ON openclaw_instances FOR SELECT
  USING (auth.uid() = user_id);

-- insert/update/delete is only via Edge Functions (service_role)

-- updated_at trigger
CREATE TRIGGER set_updated_at_openclaw_instances
  BEFORE UPDATE ON openclaw_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Public view (excludes gateway_token for client safety)
CREATE VIEW openclaw_instances_public AS
  SELECT id, user_id, status, region, droplet_size, last_health_check, error_message, created_at, updated_at
  FROM openclaw_instances;

-- ============================
-- chat_messages: add source, session_id, metadata columns
-- (specs/features/chat.md data spec)
-- ============================
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'edge_function';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB;
