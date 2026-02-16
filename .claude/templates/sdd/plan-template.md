# Implementation Plan: [FEATURE]

**Branch**: `[YYYYMMDD-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `.sdd/specs/[YYYYMMDD-feature-name]/spec.md`

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  AltMe pre-filled context. Update only fields specific to this feature.
-->

**Language/Version**: TypeScript 5.x (strict mode)
**Framework**: React Native (Expo SDK 54) + Expo Router v3
**State Management**: Zustand 5.x (persist middleware)
**Backend**: Supabase (Auth + PostgreSQL + Edge Functions + RLS)
**AI Backend**: OpenClaw (per-user DigitalOcean Droplets, WebSocket port 18789)
**Billing**: RevenueCat SDK 8.x (Entitlement: `pro`)
**Testing**: Jest + React Native Testing Library
**Target Platform**: iOS 16+ / Android 13+
**Design Tool**: Pencil MCP (.pen files)
**Performance Goals**: [feature-specific, e.g., chat message render <100ms]
**Constraints**: [feature-specific, e.g., offline-capable, <3s initial load]
**Scale/Scope**: [feature-specific, e.g., 10k users, 50 messages/screen]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
.sdd/specs/[YYYYMMDD-feature]/
├── spec.md              # Feature specification (/sdd-specify output)
├── plan.md              # This file (/sdd-plan output)
├── research.md          # Phase 0 output (/sdd-plan)
├── data-model.md        # Phase 1 output (/sdd-plan)
├── screen-specs/        # Phase 1 output - UI specifications
├── edge-functions/      # Phase 1 output - Edge Function contracts
├── checklists/          # Quality validation checklists
└── tasks.md             # Phase 2 output (/sdd-tasks - NOT created by /sdd-plan)
```

### Source Code (AltMe structure)

```text
app/                         # Expo Router screens (default export allowed)
├── (auth)/                  # Authentication screens
├── (onboarding)/            # Onboarding flow
├── (tabs)/                  # Main tab screens
├── (paywall)/               # Paywall modal
└── _layout.tsx              # Root layout with routing guard

src/
├── features/                # Feature modules (Agent-owned)
│   ├── auth/
│   ├── chat/
│   ├── community/
│   ├── journal/
│   ├── insights/
│   ├── onboarding/
│   ├── settings/
│   └── subscription/
├── shared/                  # Cross-cutting (Agent A managed)
│   ├── components/
│   ├── hooks/
│   └── types/
├── services/                # External service clients
│   ├── supabase/
│   ├── openclaw/
│   ├── revenuecat/
│   └── digitalocean/
└── config/                  # Constants, theme, env

supabase/
├── functions/               # Edge Functions (Deno)
└── migrations/              # PostgreSQL migrations

specs/                       # Existing specifications (Single Source of Truth)
```

## Existing Specs Cross-Reference

| Spec | Relevance to This Feature | Action Needed |
|------|--------------------------|---------------|
| specs/api/database.md | [How DB schema relates] | [New table / column / none] |
| specs/shared/navigation.md | [How navigation relates] | [New screen / route / none] |
| specs/api/external-services.md | [How APIs relate] | [New Edge Function / none] |
| specs/features/*.md | [Related features] | [Update needed / none] |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., new service dependency] | [current need] | [why simpler approach insufficient] |
