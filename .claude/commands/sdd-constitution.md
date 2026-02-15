---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
handoffs:
  - label: Build Specification
    agent: sdd-specify
    prompt: Implement the feature specification based on the updated constitution. I want to build...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

You are updating the project constitution at `.claude/constitution.md`. This file is a TEMPLATE containing placeholder tokens in square brackets (e.g. `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Your job is to (a) collect/derive concrete values, (b) fill the template precisely, and (c) propagate any amendments across dependent artifacts.

Follow this execution flow:

1. Load the existing constitution template at `.claude/constitution.md`.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.

2. Collect/derive values for placeholders:
   - If user input supplies a value, use it.
   - Otherwise infer from existing repo context (CLAUDE.md, specs/overview.md).
   - `CONSTITUTION_VERSION` must increment according to semantic versioning.

3. Draft the updated constitution content:
   - Replace every placeholder with concrete text.
   - Preserve heading hierarchy.
   - Ensure each Principle section has name, rules, and rationale.

4. Consistency propagation checklist:
   - Read `.claude/templates/sdd/plan-template.md` and ensure "Constitution Check" aligns
   - Read `.claude/templates/sdd/spec-template.md` for scope/requirements alignment
   - Read `.claude/templates/sdd/tasks-template.md` for task categorization alignment

5. Produce a Sync Impact Report.

6. Validation: No remaining unexplained bracket tokens, version matches report, dates in ISO format.

7. Write the completed constitution back to `.claude/constitution.md`.

8. Output final summary with new version and bump rationale.
