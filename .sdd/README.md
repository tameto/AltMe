# AltMe SDD (Spec-Driven Development)

## Overview

SDD is a structured workflow for developing features through specification, planning, and parallel execution.

## Command Flow

```
/sdd-specify {feature description}    # Step 1: Generate spec.md
/sdd-clarify                          # Step 2: Resolve ambiguities (optional)
/sdd-plan                             # Step 3: Generate plan.md + design artifacts
/sdd-tasks                            # Step 4: Generate tasks.md for Agent Team
/sdd-analyze                          # Step 5: Consistency check (optional)
/sdd-implement                        # Step 6: Parallel implementation via Agent Team
```

## When to Use SDD

Use full SDD when 2+ of these apply:
1. New Supabase table / migration needed
2. 3+ new files required
3. Multiple agents collaborating
4. Business rules need clarification
5. QA or stakeholder review needed

See `.claude/rules/sdd-workflow.md` for the auto-judgment protocol.

## Directory Structure

```
.sdd/
├── README.md                          # This file
└── specs/
    └── {YYYYMMDD}-{feature-name}/     # Per-feature SDD artifacts
        ├── spec.md                    # Feature specification
        ├── plan.md                    # Technical plan
        ├── research.md               # Research findings
        ├── data-model.md             # Entity definitions
        ├── screen-specs/             # UI specifications
        ├── edge-functions/           # Backend contracts
        ├── checklists/               # Quality validation
        └── tasks.md                  # Agent Team task list
```

## Relationship to specs/

- `specs/` = **Single Source of Truth** for the entire project (persistent specifications)
- `.sdd/specs/` = **Working artifacts** for individual feature development (transient)
- After implementation, `/sdd-implement` triggers spec reconciliation (updates `specs/` to match)

## Supporting Tools

- `/sdd-constitution` - Update project constitution (`.claude/constitution.md`)
- `/sdd-checklist` - Generate requirement quality checklists

## AltMe-Specific Agent Types

| Agent | Use For |
|-------|---------|
| `rn-mobile-dev` | React Native components, screens, navigation |
| `supabase-backend` | DB, migrations, Edge Functions, RLS |
| `openclaw-specialist` | OpenClaw integration, SOUL.md |
| `billing-specialist` | RevenueCat, paywall, subscriptions |
| `screen-designer` | Pencil .pen design files |
| `security-auditor` | Security review |
| `code-reviewer` | Code quality review |
| `doc-updater` | Spec reconciliation |
