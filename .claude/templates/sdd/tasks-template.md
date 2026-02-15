---
description: "Agent Team task list template for AltMe"
---

# Tasks: [FEATURE NAME]

**Input**: `.sdd/specs/[YYYYMMDD-feature-name]/` design documents
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, screen-specs/, edge-functions/

## Agent Team Execution Model

This task list is executed by the `/sdd-implement` command as an Agent Team.

**Execution flow:**
1. Leader creates team via TeamCreate
2. Each task registered via TaskCreate (dependencies expressed with `blockedBy`)
3. Parallel tasks within each Phase are spawned as teammates
4. Quality gate at each Phase Checkpoint
5. All Phases complete -> TeamDelete -> `/compact`

## Task Notation

```markdown
### T001: Task Title
- **agent**: rn-mobile-dev | supabase-backend | openclaw-specialist | billing-specialist | general-purpose | Explore | Bash
- **story**: US1 | shared | polish
- **parallel**: yes | no
- **blockedBy**: [] | [T001, T002]
- **files**: target file paths (multiple OK)
- **acceptance**: completion criteria

Detailed description enabling an independent agent to complete the task from this alone.
Include necessary context (spec/plan section references, existing code paths, etc.).
```

**Notation rules:**
- `agent`: subagent_type for task execution (see Agent Selection Guide in /sdd-tasks)
- `story`: User story this belongs to (shared = all stories, polish = final adjustments)
- `parallel`: yes = can run concurrently with other same-Phase tasks (different files, no dependencies)
- `blockedBy`: Task IDs that must complete before this can start
- `files`: Primary target file paths (for file conflict prevention)
- `acceptance`: Criteria to meet before marking completed via TaskUpdate

<!--
  ============================================================================
  IMPORTANT: Below are SAMPLE tasks for illustration only.

  The /sdd-tasks command replaces these with actual tasks based on:
  - spec.md user stories (P1, P2, P3...)
  - plan.md tech stack & structure
  - data-model.md entities
  - screen-specs/ UI specifications
  - edge-functions/ backend contracts

  Each task must be completable by an independent agent.
  ============================================================================
-->

---

## Phase 1: Setup

**Purpose**: Project initialization and basic structure
**Checkpoint**: Directory structure ready, dependencies installed

### T001: Add required dependencies
- **agent**: Bash
- **story**: shared
- **parallel**: no
- **blockedBy**: []
- **files**: package.json
- **acceptance**: `npx expo install` succeeds

Install any new dependencies required by plan.md.

### T002: Configure feature directory structure
- **agent**: general-purpose
- **story**: shared
- **parallel**: no
- **blockedBy**: [T001]
- **files**: src/features/{feature}/
- **acceptance**: Directory structure matches plan.md

Create feature module directory following AltMe conventions.

---

## Phase 2: Foundational (Blocking)

**Purpose**: Core foundation all user stories depend on
**Checkpoint**: DB migration succeeds, shared types compile, basic hooks work

**CRITICAL**: No user story work may begin until this Phase completes

### T003: Create Supabase migration
- **agent**: supabase-backend
- **story**: shared
- **parallel**: no
- **blockedBy**: [T001]
- **files**: supabase/migrations/
- **acceptance**: `supabase db reset` succeeds, tables match data-model.md

Create migration file(s) per data-model.md entity definitions.
Follow existing migration patterns in supabase/migrations/.

### T004: Define shared TypeScript types
- **agent**: general-purpose
- **story**: shared
- **parallel**: yes
- **blockedBy**: [T003]
- **files**: src/shared/types/{feature}.ts
- **acceptance**: `tsc --noEmit` passes, types match data-model.md

Define types in src/shared/types/ following existing patterns.
Named exports only. Use Zod schemas if validation needed.

### T005: Create Zustand store
- **agent**: rn-mobile-dev
- **story**: shared
- **parallel**: yes
- **blockedBy**: [T004]
- **files**: src/features/{feature}/store.ts
- **acceptance**: Store compiles, persist middleware configured correctly

Create Zustand store with selector pattern per AltMe conventions.

**Phase 2 Checkpoint**: `tsc --noEmit && npx jest --passWithNoTests`

---

## Phase 3: User Story 1 - [Title] (Priority: P1) MVP

**Goal**: [Value this story delivers]
**Independent Test**: [How to verify this story alone]

### T006: [US1] Create screen component
- **agent**: rn-mobile-dev
- **story**: US1
- **parallel**: yes
- **blockedBy**: [T005]
- **files**: src/features/{feature}/components/
- **acceptance**: Component renders correctly, follows Liquid Glass design

Implement screen per screen-specs/ and existing design (.pen file).
Reference: spec.md "User Story 1" section.

### T007: [US1] Create Edge Function
- **agent**: supabase-backend
- **story**: US1
- **parallel**: yes
- **blockedBy**: [T003]
- **files**: supabase/functions/{function-name}/
- **acceptance**: Edge Function returns correct response, RLS enforced

Implement Edge Function per edge-functions/ contract.
Follow existing patterns in supabase/functions/.

### T008: [US1] Wire screen to Expo Router
- **agent**: rn-mobile-dev
- **story**: US1
- **parallel**: no
- **blockedBy**: [T006, T007]
- **files**: app/{route}.tsx
- **acceptance**: Navigation works, screen accessible from expected entry point

Add Expo Router screen file and update navigation as needed.
Reference: specs/shared/navigation.md for routing conventions.

### T009: [US1] Write unit tests
- **agent**: general-purpose
- **story**: US1
- **parallel**: no
- **blockedBy**: [T008]
- **files**: src/features/{feature}/__tests__/
- **acceptance**: Tests pass covering happy path + edge cases from spec

Write Jest tests following AltMe test conventions.

**Phase 3 Checkpoint**: US1 independently functional, `tsc --noEmit && npx jest` passes

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Value this story delivers]
**Independent Test**: [How to verify this story alone]

### T010: [US2] Implementation tasks...
(Follow same pattern as Phase 3)

**Phase 4 Checkpoint**: US1 + US2 both independently functional

---

[Add more Phases per user story]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance and finalization across all stories

### TXXX: Code quality check
- **agent**: Bash
- **story**: polish
- **parallel**: yes
- **blockedBy**: [all implementation tasks]
- **files**: -
- **acceptance**: `tsc --noEmit && npx jest` all pass

### TXXX: Security review
- **agent**: security-auditor
- **story**: polish
- **parallel**: yes
- **blockedBy**: [all implementation tasks]
- **files**: all changed files
- **acceptance**: No Critical/High vulnerabilities detected

### TXXX: Update existing specs
- **agent**: doc-updater
- **story**: polish
- **parallel**: yes
- **blockedBy**: [all implementation tasks]
- **files**: specs/
- **acceptance**: specs/ consistent with new implementation

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) -> Phase 2 (Foundational) -> Phase 3+ (User Stories) -> Phase N (Polish)
                                              -> US1 (P1)
                                              -> US2 (P2)  <- parallel across US
                                              -> US3 (P3)
```

### Agent Team Execution Strategy

**Default (--team):**
1. Leader executes Phase 1-2 directly
2. Phase 3+: spawn teammate per US
3. Each teammate: TaskList -> TaskGet -> implement -> TaskUpdate cycle
4. Quality gate at each Phase Checkpoint

**Maximum parallel (--parallel):**
1. Leader completes Phase 1-2
2. Spawn all US teammates simultaneously
3. Leader monitors via TaskList, runs Checkpoints

### File Conflict Prevention

- Each task's `files` field identifies target files
- Same-file tasks: `parallel: no` + `blockedBy` serialization
- `src/shared/types/` is conflict-prone: complete in Phase 2
- `app/_layout.tsx` changes: serialize or defer to Polish

---

## Notes

- `parallel: yes` = different files, no inter-task dependencies
- `story` label ensures traceability to user stories
- Quality gate (`tsc --noEmit && npx jest`) at each Checkpoint
- Commit after each task completion
- Run `/compact` after Agent Team completion
