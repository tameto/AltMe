---
description: Execute the implementation plan using Agent Team for parallel task execution.
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
   - Verify tasks.md exists in the matched directory
   - If no tasks.md, suggest running `/sdd-tasks` first

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files
   - Count completed vs incomplete items
   - Display status table
   - If any incomplete: ask user whether to proceed
   - If all complete: automatically proceed

3. **Load and analyze implementation context**:
   - **REQUIRED**: Read tasks.md and plan.md
   - **IF EXISTS**: Read data-model.md, screen-specs/, edge-functions/, research.md

4. **Parse tasks.md** and extract:
   - Phase structure (Phase 1, 2, 3+, N)
   - Each task's metadata block (agent, story, parallel, blockedBy, files, acceptance)
   - Dependency graph
   - Parallelizable task groups

5. **Execution mode selection**:
   - `--solo`: Leader executes all tasks sequentially (no team)
   - `--team` (default): Agent Team parallel execution
   - `--parallel`: All US executed simultaneously (maximum parallelism)
   - `--phase=N`: Execute only specific Phase

6. **Agent Team Execution Flow** (--team / --parallel mode):

   ### Phase 1-2: Leader Execution
   Setup and Foundational phases are executed by the leader sequentially.
   Reason: Foundation work has low parallelization benefit and high conflict risk.

   ```
   a. TeamCreate(team_name: "{feature-name}-impl")
   b. TaskCreate for each Phase 1-2 task from tasks.md:
      - subject: Task title
      - description: Full metadata block + description
      - activeForm: "Executing T001: {title}"
   c. TaskUpdate to set blockedBy dependencies
   d. Execute Phase 1 tasks sequentially, TaskUpdate(status: completed) each
   e. Phase 2 [parallel: yes] tasks: spawn teammates via Task tool
   f. Phase 2 Checkpoint: `tsc --noEmit && npx jest --passWithNoTests`
   ```

   ### Phase 3+: User Story Parallel Execution
   Spawn one teammate per US for parallel implementation.

   ```
   a. TaskCreate for each US task (blockedBy includes Phase 2 final task)
   b. Spawn teammate per US:
      - Task tool name: "us{N}-impl" (e.g., "us1-impl", "us2-impl")
      - Task tool subagent_type: from task's "agent" field (e.g., "rn-mobile-dev")
      - Task tool team_name: "{feature-name}-impl"
      - Prompt: US task list + execution instructions
   c. Each teammate:
      1. TaskList to find assigned tasks
      2. TaskGet for details
      3. TaskUpdate(status: in_progress)
      4. Implement
      5. Verify acceptance criteria
      6. TaskUpdate(status: completed)
      7. Move to next task
      8. SendMessage to leader when all done
   d. Leader runs quality gate at each US Checkpoint:
      - `tsc --noEmit`
      - `npx jest --passWithNoTests`
   ```

   ### Phase N: Polish
   After all US complete, leader executes Polish tasks.
   Spawn specialist agents as needed (security-auditor, code-reviewer, etc.).

   ```
   a. TaskCreate for Phase N tasks
   b. Spawn specialist teammates:
      - security-auditor -> Security review
      - code-reviewer -> Code quality review
      - doc-updater -> Spec reconciliation
   c. Final quality gate: `tsc --noEmit && npx jest`
   ```

7. **Team Shutdown**:
   ```
   a. Verify all tasks completed via TaskList
   b. SendMessage(type: shutdown_request) to all teammates
   c. TeamDelete
   d. Recommend `/compact` to user
   ```

8. **tasks.md Update**:
   - Mark completed task checkboxes as `[x]`
   - Append execution results summary at end

9. **Post-implementation recommendation**:
   - `doc-updater` agent for spec reconciliation
   - `/sdd-analyze` for consistency check
   - Update existing specs in `specs/` if schema/navigation/API changed

10. **Completion validation**:
    - Verify all tasks completed
    - Final `tsc --noEmit && npx jest`
    - Report final status

## Solo Mode (--solo)

Execute all tasks sequentially without Agent Team. For small features or single-US features.

```
1. Parse tasks.md
2. Execute tasks in Phase order sequentially
3. Update tasks.md checkboxes after each completion
4. Run quality gate at each Checkpoint
```

## Teammate Prompt Template

Prompt for each US teammate:

```
You are an AltMe implementation agent for {feature-name}, User Story {N}.

## Assigned Tasks
{tasks.md excerpt for this US}

## Reference Documents
- spec.md: `.sdd/specs/{feature}/spec.md` US{N} section
- plan.md: `.sdd/specs/{feature}/plan.md`
- data-model.md: `.sdd/specs/{feature}/data-model.md`
- Existing specs: `specs/` directory

## AltMe Coding Conventions
- TypeScript strict mode, named exports only (except Expo Router screens)
- File names: kebab-case.ts / kebab-case.tsx
- State: Zustand selectors for pinpoint subscriptions
- Lists: FlashList/LegendList (no ScrollView + .map())
- 1 file = 1 component

## Workflow
1. TaskList to find your tasks
2. For each task (lowest ID first):
   a. TaskUpdate(status: in_progress)
   b. Read existing code patterns
   c. Implement
   d. Verify acceptance criteria
   e. TaskUpdate(status: completed)
3. SendMessage to leader when all done
```

## Error Handling

- **Teammate error/stall**: Leader reassigns task or executes directly
- **File conflict detected**: `git diff` to check, manual merge
- **Test failure**: Revert task to in_progress, request fix
- **Phase 2 Checkpoint failure**: Stop all US work, fix foundation first

## Progress Report

At each Phase completion, report to user:

```markdown
## Phase {N} Completion Report

| Task | Status | Agent |
|------|--------|-------|
| T001: {title} | completed | leader |
| T002: {title} | completed | us1-impl |
| T003: {title} | completed | us2-impl |

### Quality Gate
- tsc --noEmit: PASS
- npx jest: PASS (XX tests, XX assertions)

### Next Steps
- Starting Phase {N+1}
```
