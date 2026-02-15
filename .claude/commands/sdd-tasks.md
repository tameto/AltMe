---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
handoffs:
  - label: Analyze For Consistency
    agent: sdd-analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: sdd-implement
    prompt: Start the implementation in phases
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Locate feature files** (no external scripts):
   - Get current git branch via `git branch --show-current`
   - Use Glob to find matching spec directory: `.sdd/specs/*/`
   - Match directory name to branch name
   - Set `FEATURE_DIR` from the matched path
   - If no matching directory found, instruct user to run `/sdd-specify` first

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md (entities), screen-specs/ (UI), edge-functions/ (backend), research.md (decisions)

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories
   - If screen-specs/ exists: Map screens to user stories
   - If edge-functions/ exists: Map functions to user stories
   - Generate tasks organized by user story (see Task Generation Rules below)
   - Generate dependency graph
   - Validate task completeness

4. **Generate tasks.md**: Use `.claude/templates/sdd/tasks-template.md` as structure, fill with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks
   - Phase 2: Foundational tasks
   - Phase 3+: One phase per user story (in priority order)
   - Final Phase: Polish & cross-cutting concerns
   - All tasks follow **structured metadata block format** (see below)
   - Dependencies section with Agent Team execution strategy

5. **Report**: Output path to generated tasks.md and summary including:
   - Total task count, Phase breakdown
   - Parallelizable task count
   - Estimated teammate count (by US count)

Context for task generation: $ARGUMENTS

## Task Generation Rules

**CRITICAL**: Tasks must be generated at a granularity suitable for Agent Team parallel execution.

### Task Notation (REQUIRED)

Each task uses the following **structured metadata block**:

```markdown
### T001: Task Title (imperative form)
- **agent**: rn-mobile-dev
- **story**: US1
- **parallel**: yes
- **blockedBy**: []
- **files**: src/features/chat/components/message-list.tsx
- **acceptance**: Component renders messages correctly, Jest test passes

Detailed description that allows an independent agent to complete the task from this description alone.
Include references to design documents, existing code paths, and AltMe conventions.
```

### Metadata Field Definitions

| Field | Required | Values | Description |
|-------|:--------:|--------|-------------|
| `agent` | Yes | See agent selection below | subagent_type for task execution |
| `story` | Yes | `US1`, `US2`, `shared`, `polish` | User story this belongs to |
| `parallel` | Yes | `yes` / `no` | Can run in parallel within same Phase |
| `blockedBy` | Yes | `[]` / `[T001, T002]` | Prerequisite task IDs |
| `files` | Yes | File paths (comma-separated) | Target files (for conflict prevention) |
| `acceptance` | Yes | Completion criteria | Basis for TaskUpdate completed |

### Agent Selection Guide (AltMe-specific)

| Task Type | agent | Reason |
|-----------|-------|--------|
| React Native component/screen | `rn-mobile-dev` | RN/Expo specialist with component skills |
| Supabase DB/migration/RLS/Edge Function | `supabase-backend` | Supabase specialist |
| OpenClaw integration/SOUL.md | `openclaw-specialist` | OpenClaw specialist |
| RevenueCat billing/paywall | `billing-specialist` | RevenueCat specialist |
| UI/Screen design (.pen) | `screen-designer` | Pencil MCP + UI design skills |
| Code investigation/analysis | `Explore` | Read-only, fast |
| Shell commands (test, lint) | `Bash` | Shell execution only |
| Security review | `security-auditor` | OWASP + RLS audit |
| Code review | `code-reviewer` | Quality check |
| Spec/doc updates | `doc-updater` | Low-cost documentation |
| General implementation | `general-purpose` | Full tool access |

### File Conflict Prevention Rules

**CRITICAL**: Agent Team runs multiple agents concurrently, so file conflicts must be prevented.

1. **Tasks operating on the same file MUST use `parallel: no` + `blockedBy` for serialization**
2. **`src/shared/types/`** is conflict-prone:
   - Type definition tasks should be in Phase 2 (Foundational)
   - Or serialize with `blockedBy`
3. **`files` field must always be explicit** for leader scheduling
4. **Common files (config, shared hooks, navigation)** should be completed in Phase 2

### Task Granularity Guidelines

**Appropriate granularity (1 task = 1 agent's 1-few turns to complete):**

| Good | Bad |
|------|-----|
| `T007: Create ChatMessageList component` | `T007: Implement entire chat feature` |
| `T008: Add chat_attachments migration` | `T008: All database changes` |
| `T010: Write ChatMessage unit tests` | `T010: Write all tests` |

**Per-task target:**
- 1-3 files created/edited
- Clear completion criteria (test passes, lint passes, etc.)
- Completable within ~15 minutes of agent work

### Phase Structure

- **Phase 1**: Setup (project initialization, dependencies)
- **Phase 2**: Foundational (shared types, DB migrations, common hooks - blocks all US work)
- **Phase 3+**: User Stories (in priority order, parallelizable across US)
- **Final Phase**: Polish & Cross-Cutting Concerns (security review, design review, docs)

### Description Writing Rules

Each task description MUST include:

1. **What to do**: Specific work to perform
2. **What to reference**: Relevant sections in spec.md / plan.md / data-model.md
3. **Existing patterns**: Path to existing code to follow as a pattern
4. **AltMe conventions**: Applicable rules from CLAUDE.md (named exports, kebab-case, Zustand selectors, etc.)
5. **Gotchas**: Special constraints or known pitfalls

This enables independent agents to complete tasks without additional context.
