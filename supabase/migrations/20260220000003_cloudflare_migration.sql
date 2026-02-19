-- Cloudflare Containers migration for openclaw_instances
-- Adds infra_provider, container lifecycle state columns while preserving DigitalOcean columns

-- ============================
-- Add Cloudflare Containers columns
-- ============================
ALTER TABLE openclaw_instances
  ADD COLUMN IF NOT EXISTS infra_provider TEXT NOT NULL DEFAULT 'cloudflare',
  ADD COLUMN IF NOT EXISTS container_name TEXT,
  ADD COLUMN IF NOT EXISTS desired_state TEXT NOT NULL DEFAULT 'active'
    CHECK (desired_state IN ('active', 'suspended', 'deleting')),
  ADD COLUMN IF NOT EXISTS runtime_state TEXT NOT NULL DEFAULT 'cold'
    CHECK (runtime_state IN ('cold', 'waking', 'healthy', 'sleeping', 'error')),
  ADD COLUMN IF NOT EXISTS soul_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cf_worker_url TEXT,
  ADD COLUMN IF NOT EXISTS last_wake_at TIMESTAMPTZ;

-- Migrate existing status to new lifecycle columns
-- Only update rows that still have the default 'active'/'cold' (i.e. not yet migrated)
UPDATE openclaw_instances SET
  desired_state = CASE
    WHEN status IN ('running', 'provisioning') THEN 'active'
    WHEN status = 'destroying' THEN 'deleting'
    ELSE 'suspended'
  END,
  runtime_state = CASE
    WHEN status = 'running' THEN 'healthy'
    WHEN status = 'provisioning' THEN 'waking'
    WHEN status = 'error' THEN 'error'
    ELSE 'cold'
  END
WHERE desired_state = 'active' AND runtime_state = 'cold';

-- ============================
-- Update openclaw_instances_public view to include new columns
-- (excludes gateway_token and cf_worker_url for client safety)
-- ============================
DROP VIEW IF EXISTS openclaw_instances_public;

CREATE VIEW openclaw_instances_public AS
  SELECT
    id,
    user_id,
    status,
    infra_provider,
    container_name,
    desired_state,
    runtime_state,
    soul_version,
    region,
    droplet_size,
    last_health_check,
    last_wake_at,
    error_message,
    created_at,
    updated_at
  FROM openclaw_instances;
