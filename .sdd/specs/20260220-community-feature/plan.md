# Community Feature Implementation Plan

**Feature Branch**: `20260220-community-feature`
**Created**: 2026-02-20
**Codex Consultation**: Architecture reviewed (denormalization, pg_cron, triggers, client-side resize)

---

## Architecture Decisions (Codex-reviewed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI conversation trigger | pg_cron + Edge Function | Server-side, no client dependency, keys secured |
| Message display | Denormalize twin_name/avatar_icon into community_messages | JOINless FlatList, smooth scroll |
| Count caching | Postgres triggers + nightly cron safety net | Atomic, race-condition free |
| Thumbnail upload | Client-side resize (expo-image-manipulator) then Supabase Storage | Lower egress, reliable |

## Phase Overview

```
Phase 0: DB Migration + Types + i18n (Agent A, parallel)
    ↓
Phase 1: Service Client + Edge Function (Agent A + Agent C, parallel)
    ↓
Phase 2: Components + Hooks + Screens (Agent D)
    ↓
Phase 3: Tests + Review + Spec Update (QA + Code Review + Codex)
```

## Critical Path

DB Migration → Service Client → Hooks → Detail Screen → Tests

## DB Schema Changes

1. `communities.category` CHECK: `entertainment, lifestyle, technology, other`
2. `communities.language` CHECK: `ja, en, ko`
3. `communities.description` CHECK: `<= 300` (was 200)
4. `communities.conversation_count INTEGER DEFAULT 0` (new column)
5. `community_messages.twin_name TEXT` (denormalized, new column)
6. `community_messages.avatar_icon TEXT` (denormalized, new column)
7. Triggers: member_count/conversation_count auto-update
8. Trigger: BEFORE INSERT on community_messages to populate twin_name/avatar_icon from profiles

## Agent Assignments

| Agent | Tasks |
|-------|-------|
| Agent A (Foundation) | DB migration, types, i18n, service client |
| Agent C (Core AI) | generate-community-chat Edge Function |
| Agent D (Engagement) | All frontend (components, hooks, screens) |
| QA Debugger | Tests (TDD: tests before implementation for Phase 3) |
| Code Reviewer + Codex | Final review |
