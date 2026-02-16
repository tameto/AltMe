# AltMe Constitution

## Core Principles

### I. Spec-First Development
All features start from a specification in `specs/`. Implementation follows specs, not the other way around.
Specs are the Single Source of Truth. Code changes that contradict specs MUST update specs first.
No feature work begins without a corresponding specification or SDD artifact.

### II. Mobile-First UX
Every feature MUST be designed for touch-first mobile interaction.
Offline states, loading states, and error states MUST be defined for all network-dependent features.
Performance budget: initial screen render < 2s, interaction response < 100ms.

### III. Type-Safe Contracts
TypeScript strict mode is mandatory. `src/shared/types/` defines inter-module contracts.
Type changes require cross-agent coordination (Agent A manages shared types).
Zustand stores use selector pattern for precise re-render control.

### IV. Security by Default
Supabase RLS policies MUST be defined for every table.
No secrets in code (enforced by secret-detect hook).
Authentication/authorization checks at every boundary (Edge Functions, client routes).
User data isolation: users can only access their own data.

### V. Simplicity & YAGNI
Start simple. Only add complexity when current needs require it.
No premature abstractions. Three similar lines > one premature helper.
Feature flags and backwards-compatibility shims are discouraged.
Each feature module should be independently understandable.

## Technology Constraints

- React Native (Expo SDK 54) + Expo Router v3
- Zustand 5.x for state management (no Redux, no Context for global state)
- Supabase for all backend needs (no custom backend servers except OpenClaw)
- RevenueCat for all billing (no direct StoreKit/Billing Library usage)
- Named exports only (except Expo Router screen files)
- File names: kebab-case
- FlashList/LegendList for lists (no ScrollView + .map())

## Agent Team Governance

- `src/features/` owned by assigned Agent only
- `src/shared/` managed by Agent A; others propose changes
- `src/services/` owned by service-specific Agent
- Type definition changes require all-Agent consensus
- Edge Functions owned by feature-specific Agent

## Governance

This constitution supersedes all other development practices.
Amendments require documentation of rationale and migration plan.
All implementations must verify compliance with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-02-15 | **Last Amended**: 2026-02-15
