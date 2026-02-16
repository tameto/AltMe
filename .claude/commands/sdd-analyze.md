---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Identify inconsistencies, duplications, ambiguities, and underspecified items across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) before implementation. This command MUST run only after `/sdd-tasks` has successfully produced a complete `tasks.md`.

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify any files. Output a structured analysis report.

**Constitution Authority**: The project constitution (`.claude/constitution.md`) is **non-negotiable** within this analysis scope.

## Execution Steps

### 1. Locate Feature Files

- Get current git branch via `git branch --show-current`
- Use Glob to find matching spec directory: `.sdd/specs/*/`
- Derive absolute paths for SPEC, PLAN, TASKS
- Abort if any required file is missing

### 2. Load Artifacts

**From spec.md:** Overview, Functional/Non-Functional Requirements, User Stories, Edge Cases
**From plan.md:** Architecture/stack, Data Model references, Phases, Technical constraints
**From tasks.md:** Task IDs, Descriptions, Phase grouping, Parallel markers, File paths
**From constitution:** Load `.claude/constitution.md` for principle validation
**From existing specs:** Cross-reference `specs/` for database, navigation, external services consistency

### 3. Build Semantic Models

- **Requirements inventory**: Each requirement with stable key
- **User story/action inventory**: Discrete user actions with acceptance criteria
- **Task coverage mapping**: Map tasks to requirements
- **Constitution rule set**: Extract MUST/SHOULD statements

### 4. Detection Passes

#### A. Duplication Detection
#### B. Ambiguity Detection
#### C. Underspecification
#### D. Constitution Alignment
#### E. Coverage Gaps
#### F. Inconsistency (including cross-reference with `specs/` directory)

### 5. Severity Assignment

- **CRITICAL**: Violates constitution MUST, missing core artifact, zero coverage on baseline functionality
- **HIGH**: Duplicate/conflicting requirement, ambiguous security/performance, untestable criterion
- **MEDIUM**: Terminology drift, missing non-functional coverage, underspecified edge case
- **LOW**: Style/wording improvements, minor redundancy

### 6. Produce Analysis Report

Output Markdown report with findings table, coverage summary, constitution alignment issues, unmapped tasks, and metrics.

### 7. Next Actions

- If CRITICAL: Recommend resolving before `/sdd-implement`
- If only LOW/MEDIUM: User may proceed with suggestions

### 8. Offer Remediation

Ask user if they want concrete edit suggestions for top N issues. Do NOT apply automatically.

## Operating Principles

- **NEVER modify files** (read-only)
- **Prioritize constitution violations** (always CRITICAL)
- **Report zero issues gracefully**

## Context

$ARGUMENTS
