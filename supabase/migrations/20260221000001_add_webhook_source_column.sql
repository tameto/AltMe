-- webhook_events テーブルに source カラムを追加し、複合ユニーク制約に変更
-- Critical fix: checkIdempotency が event_id + source の複合キーを使うため

-- source カラム追加
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'unknown';

-- 既存の event_id 単独ユニーク制約を削除し、複合ユニーク制約に変更
ALTER TABLE webhook_events DROP CONSTRAINT IF EXISTS webhook_events_event_id_key;
ALTER TABLE webhook_events ADD CONSTRAINT webhook_events_event_id_source_key UNIQUE (event_id, source);

-- パフォーマンス用インデックス追加
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events (source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events (created_at);
