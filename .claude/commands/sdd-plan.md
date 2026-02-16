---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
handoffs:
  - label: Create Tasks
    agent: sdd-tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: sdd-checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Locate feature files** (no external scripts):
   - Get current git branch via `git branch --show-current`
   - Use Glob to find matching spec directory: `.sdd/specs/*/spec.md`
   - Match directory name to branch name
   - Set paths: `FEATURE_SPEC`, `FEATURE_DIR`, `IMPL_PLAN` (plan.md in same dir)
   - If no spec found, instruct user to run `/sdd-specify` first

2. **Load context**: Read `FEATURE_SPEC` and `.claude/constitution.md`. Load `.claude/templates/sdd/plan-template.md` as structure guide. Also read relevant existing specs from `specs/` (database.md, navigation.md, external-services.md).

3. **Execute plan workflow**: Follow the template structure to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, screen-specs/, edge-functions/
   - Re-evaluate Constitution Check post-design

4. **Stop and report**: Command ends after Phase 1 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context**:
   - For each NEEDS CLARIFICATION -> research task
   - For each dependency -> best practices task
   - For each integration -> patterns task

2. **Generate and dispatch research agents**:
   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md`:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** -> `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable
   - Supabase RLS policy requirements

2. **Generate screen specifications** (if UI involved):
   - Screen layout descriptions
   - Component hierarchy
   - State management requirements
   - Navigation flow

3. **Generate Edge Function contracts** (if backend involved):
   - For each user action -> endpoint / Edge Function
   - Input/output types
   - Error responses

4. **Cross-reference with existing specs**:
   - Read `specs/api/database.md` for existing tables
   - Read `specs/shared/navigation.md` for routing
   - Read `specs/api/external-services.md` for Edge Functions
   - Note conflicts or required updates to existing specs

**Output**: data-model.md, screen-specs/, edge-functions/

## AltMe Technical Context (Pre-filled)

**Language/Version**: TypeScript 5.x (strict mode)
**Framework**: React Native (Expo SDK 54) + Expo Router v3
**State Management**: Zustand 5.x (persist middleware)
**Backend**: Supabase (Auth + PostgreSQL + Edge Functions + RLS)
**AI Backend**: OpenClaw (per-user DigitalOcean Droplets, WebSocket)
**Billing**: RevenueCat SDK 8.x
**Testing**: Jest + React Native Testing Library
**Target Platform**: iOS 16+ / Android 13+
**Design Tool**: Pencil MCP (.pen files)

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
- Constitution reference: `.claude/constitution.md`
- Existing specs reference: `specs/` directory
