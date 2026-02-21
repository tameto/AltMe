# Codex Review: feat/avatar-thumbnail-selector
Date: 2026-02-21
Branch: feat/avatar-thumbnail-selector vs main

## Review Settings
- Model: gpt-5.3-codex
- Method: manual diff + codex exec (focus: bugs/logic/security)
- TypeScript: npx tsc --noEmit -> PASS
- Tests: npm test (client.test.ts) -> PASS (9/9)
- Scope: 7 modified files + generate-community-chat Edge Function

## Findings Summary
- Critical: 3 (categories mismatch, creator_id missing, profiles JOIN RLS)
- Warning: 3 (pagination direction, race condition, uploadThumbnail exception)
- Info: 3 (AvatarIcon cast, ListHeader JSX element, no auth guard on create)

## Key Lessons
- When DB CHECK constraints change (categories), UI must be updated atomically
- createCommunity must include creator_id for RLS to pass (NOT NULL + policy)
- getCommunityMessages ascending=true fetches OLDEST 50 first - for chat, fetch descending then reverse
- useCommunities language switch has race condition - use requestId ref pattern
- FlatList ListHeaderComponent should use useMemo or named component, not JSX variable
- profiles JOIN in community queries fails RLS for other users' profiles - use denormalized columns
