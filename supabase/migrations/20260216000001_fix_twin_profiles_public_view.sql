-- Fix twin_profiles_public VIEW: deduplicate users with multiple personality results
-- After migration 003 dropped the UNIQUE(user_id) constraint on personality_results,
-- users who retake the quiz can appear multiple times. Use DISTINCT ON to pick the latest.

CREATE OR REPLACE VIEW twin_profiles_public AS
SELECT DISTINCT ON (p.id)
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
  )
ORDER BY p.id, pr.created_at DESC;
