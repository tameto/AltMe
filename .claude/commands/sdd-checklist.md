---
description: Generate a custom checklist for the current feature based on user requirements.
---

## Checklist Purpose: "Unit Tests for Requirements"

**CRITICAL CONCEPT**: Checklists are **UNIT TESTS FOR REQUIREMENTS WRITING** - they validate the quality, clarity, and completeness of requirements in a given domain.

**NOT for verification/testing**:
- NOT "Verify the button clicks correctly"
- NOT "Test error handling works"

**FOR requirements quality validation**:
- "Are visual hierarchy requirements defined for all card types?" (completeness)
- "Is 'prominent display' quantified with specific sizing/positioning?" (clarity)

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Execution Steps

1. **Locate feature files** (no external scripts):
   - Get current git branch via `git branch --show-current`
   - Use Glob to find matching spec directory: `.sdd/specs/*/`
   - Match directory name to branch name
   - Set `FEATURE_DIR` from matched path

2. **Clarify intent (dynamic)**: Derive up to THREE contextual clarifying questions. They MUST:
   - Be generated from the user's phrasing + extracted signals from spec/plan/tasks
   - Only ask about information that materially changes checklist content
   - Be skipped individually if already unambiguous in `$ARGUMENTS`

3. **Understand user request**: Combine `$ARGUMENTS` + clarifying answers:
   - Derive checklist theme (e.g., security, review, deploy, ux, mobile)
   - Consolidate explicit must-have items
   - Map focus selections to category scaffolding

4. **Load feature context**: Read from FEATURE_DIR:
   - spec.md: Feature requirements and scope
   - plan.md (if exists): Technical details
   - tasks.md (if exists): Implementation tasks

5. **Generate checklist** - Create "Unit Tests for Requirements":
   - Create `FEATURE_DIR/checklists/` directory if needed
   - Generate unique checklist filename based on domain
   - Number items sequentially starting from CHK001
   - Each run creates a NEW file

   **Category Structure**:
   - Requirement Completeness
   - Requirement Clarity
   - Requirement Consistency
   - Acceptance Criteria Quality
   - Scenario Coverage
   - Edge Case Coverage
   - Non-Functional Requirements
   - Dependencies & Assumptions
   - Ambiguities & Conflicts
   - Mobile-Specific (offline, touch targets, platform differences)

   **REQUIRED PATTERNS**:
   - "Are [requirement type] defined/specified/documented for [scenario]?"
   - "Is [vague term] quantified/clarified with specific criteria?"
   - "Are requirements consistent between [section A] and [section B]?"

   **PROHIBITED PATTERNS**:
   - Any item starting with "Verify", "Test", "Confirm" + implementation behavior
   - References to code execution, user actions, system behavior

6. **Structure Reference**: Use `.claude/templates/sdd/checklist-template.md` for formatting.

7. **Report**: Output full path to created checklist, item count, and summary.
