# SDD Workflow Rules

## Auto-Judgment Protocol (MUST)

**When receiving a development task, judge the scope BEFORE starting implementation.**

1. Score the task against these criteria (count matches):
   - New Supabase table / migration needed?
   - 3+ new files required?
   - Multiple agents collaborating in parallel?
   - Business rules need clarification / spec alignment?
   - QA or stakeholder review needed?

2. Declare the judgment:
   - **0 matches -> S (Direct Fix)**: Implement directly
   - **1 match -> M (Branch + PR)**: `EnterPlanMode` then implement
   - **2+ matches -> L (SDD)**: Run `/sdd-specify` to enter full SDD flow

3. Report judgment in one line before starting:
   ```
   SDD Sizing: M (Medium) - Creating branch and implementing
   ```

**Exception**: If user explicitly requests `/sdd-specify` or "just fix it", follow their instruction.

---

## Overview

Select the appropriate workflow based on change scope. Not every change needs full SDD.

## Workflow Selection Criteria

### S: Minor Change -> Direct Fix

**Workflow**: No branch needed, fix directly and commit

| Target | Example |
|--------|---------|
| Typo / copy fix | Comment typo, error message wording |
| Config value change | .env.example update, constant change |
| 1-file bug fix | Condition fix, null check addition |
| Dependency update | expo install, package version bump |
| Documentation update | README, CLAUDE.md additions |

### M: Medium Change -> Branch + Plan + PR

**Workflow**: Feature branch, plan, implement, PR

| Target | Example |
|--------|---------|
| Existing API modification | Response format change, filter addition |
| Validation change | Zod schema update, form rule change |
| Refactoring | Component split, hook extraction |
| Test additions | Coverage improvement, new test patterns |
| Small feature extension | Column addition + migration + type update |

### L: Large Change -> Full SDD

**Workflow**: `/sdd-specify` -> `/sdd-clarify` -> `/sdd-plan` -> `/sdd-tasks` -> `/sdd-implement`

| Target | Example |
|--------|---------|
| New feature (multiple screens) | Community feature, token purchase |
| New domain addition | New Supabase tables + Edge Functions + RN screens |
| Cross-layer changes | Feature spanning DB + Edge Functions + Store + UI |
| External service integration | New API integration, OpenClaw feature |
| Architecture change | Auth flow change, navigation restructure |

## SDD Application Criteria

Use SDD when **2+ of these apply**:

1. New Supabase table / migration needed
2. 3+ new files required
3. Multiple agents collaborating in parallel
4. Business rules need clarification / spec alignment
5. QA or stakeholder review needed

**1 match only**: M (Branch + PR) is usually sufficient
**0 matches**: S (Direct Fix)

## SDD Command Flow

```
/sdd-specify {feature description}    # Generate spec.md
    |
/sdd-clarify                          # Resolve spec ambiguities (optional)
    |
/sdd-plan                             # Generate plan.md (technical design)
    |
/sdd-tasks                            # Generate tasks.md (Agent Team tasks)
    |
/sdd-analyze                          # Consistency check (optional)
    |
/sdd-implement                        # Agent Team parallel execution
```

## Branch & Directory Naming

| Workflow | Branch Name | Spec Directory |
|----------|------------|----------------|
| S (Minor) | main or feat/{name} | None |
| M (Medium) | feat/{name} or fix/{name} | None |
| L (SDD) | {YYYYMMDD}-{short-name} | .sdd/specs/{YYYYMMDD}-{short-name}/ |

## Quality Gates

### Pre-Commit

```bash
tsc --noEmit           # TypeScript type check
npx jest --passWithNoTests  # Unit tests
```

### Pre-PR

```bash
tsc --noEmit
npx jest
npx expo lint          # ESLint
```

### Pre-Release

```bash
tsc --noEmit
npx jest
npx expo lint
npx expo run:ios --configuration Release  # iOS build check
```

## Notes

- SDD is a tool for spec clarity and traceability. Don't apply it to changes that don't need it.
- When in doubt, start with M (Branch + PR) and upgrade to SDD if needed mid-way.
- Existing specs in `specs/` are the Single Source of Truth - SDD artifacts in `.sdd/specs/` supplement them for new features.
