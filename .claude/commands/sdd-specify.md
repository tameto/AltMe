---
description: Create or update the feature specification from a natural language feature description.
handoffs:
  - label: Build Technical Plan
    agent: sdd-plan
    prompt: Create a plan for the spec. I am building with...
  - label: Clarify Spec Requirements
    agent: sdd-clarify
    prompt: Clarify specification requirements
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/sdd-specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

1. **Generate a concise short name** (2-4 words) for the branch:
   - Analyze the feature description and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "add-guest-browse", "fix-chat-scroll")
   - Preserve technical terms and acronyms (WebSocket, RLS, IAP, etc.)
   - Keep it concise but descriptive enough to understand the feature at a glance

2. **Generate branch/directory name with date prefix**:

   a. Get today's date:
      ```bash
      date +%Y%m%d
      ```

   b. Compose the name: `{YYYYMMDD}-{short-name}`
      - Example: `20260215-guest-browse`, `20260215-chat-media-upload`

   c. Check for same-day collision:
      - Local branches: `git branch | grep -E "^[* ]*$(date +%Y%m%d)-<short-name>$"`
      - Specs directories: Use Glob to check `.sdd/specs/$(date +%Y%m%d)-<short-name>/`
      - If collision found: append suffix `-2`, `-3`, etc.

3. **Create feature branch and directory** (native git + mkdir):
   ```bash
   git checkout -b {YYYYMMDD}-{short-name}
   mkdir -p .sdd/specs/{YYYYMMDD}-{short-name}/checklists
   ```

4. Load `.claude/templates/sdd/spec-template.md` to understand required sections.

5. Follow this execution flow:

    1. Parse user description from Input
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    4. Fill User Scenarios & Testing section
       If no clear user flow: ERROR "Cannot determine user scenarios"
    5. Generate Functional Requirements
       Each requirement must be testable
       Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
    6. Define Success Criteria
       Create measurable, technology-agnostic outcomes
       Include both quantitative metrics and qualitative measures
       Each criterion must be verifiable without implementation details
    7. Identify Key Entities (if data involved)
    8. Return: SUCCESS (spec ready for planning)

6. Write the specification to `.sdd/specs/{YYYYMMDD}-{short-name}/spec.md` using the template structure, replacing placeholders with concrete details derived from the feature description while preserving section order and headings.

7. **Specification Quality Validation**: After writing the initial spec, validate it against quality criteria:

   a. **Create Spec Quality Checklist**: Generate a checklist file at `.sdd/specs/{YYYYMMDD}-{short-name}/checklists/requirements.md`

   b. **Run Validation Check**: Review the spec against each checklist item

   c. **Handle Validation Results**:
      - **If all items pass**: Mark checklist complete and proceed
      - **If items fail**: List failing items, update spec, re-run (max 3 iterations)
      - **If [NEEDS CLARIFICATION] markers remain**: Present max 3 clarification questions with options table

   d. **Update Checklist** after each validation iteration

8. **Cross-reference with existing specs**: Check `specs/` directory for related existing specifications and note any dependencies or conflicts.

9. Report completion with branch name, spec file path, checklist results, and readiness for `/sdd-clarify` or `/sdd-plan`.

## General Guidelines

- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement (no tech stack, APIs, code structure).
- Written for business stakeholders, not developers.
- DO NOT create any checklists that are embedded in the spec.

### AltMe Context

- Reference existing specs in `specs/` for context on authentication, navigation, database schema, etc.
- Consider Free vs Pro user tiers when writing user stories
- Consider mobile-first UX patterns (touch targets, offline states, loading states)
- Reference the design file (`designs/lunaris.pen`) for existing screen designs

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: Record reasonable defaults in the Assumptions section
3. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers
4. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item

### Success Criteria Guidelines

Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective
4. **Verifiable**: Can be tested/validated without knowing implementation details
