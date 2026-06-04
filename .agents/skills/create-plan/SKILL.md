---
name: create-plan
description: Create a concise, actionable implementation plan for coding work. Use when the user explicitly asks for a plan, implementation plan, task breakdown, rollout plan, or ordered checklist before changes are made.
---

# Create Plan

## Goal

Turn a user prompt into a single actionable plan delivered in the final assistant message.

## Workflow

Operate in read-only mode throughout the workflow. Do not write or update project files.

1. Scan context quickly.
   - Read `README.md` and obvious docs such as `docs/`, `CONTRIBUTING.md`, or `ARCHITECTURE.md`.
   - Skim relevant files that are likely to be touched.
   - Identify constraints such as language, frameworks, CI commands, tests, and deployment shape.

2. Ask follow-ups only if blocking.
   - Ask at most 1-2 questions.
   - Only ask if the plan cannot be made responsibly without the answer.
   - Prefer multiple-choice questions when possible.
   - If unsure but not blocked, make a reasonable assumption and proceed.

3. Create a plan using the template below.
   - Start with 1 short paragraph describing the intent and approach.
   - Clearly call out what is in scope and what is out of scope.
   - Provide a small checklist of action items, usually 6-10 items.
   - Make items atomic and ordered: discovery -> changes -> tests -> rollout.
   - Use verb-first items such as "Add...", "Refactor...", "Verify...", or "Ship...".
   - Include at least one item for tests or validation.
   - Include an edge-case or risk item when applicable.
   - If there are unknowns, include a short Open questions section with at most 3 questions.

4. Output only the plan.
   - Do not preface the plan with meta explanations.
   - Do not include code snippets unless the user explicitly asks.

## Plan Template

```markdown
# Plan

<1-3 sentences: what we're doing, why, and the high-level approach.>

## Scope
- In:
- Out:

## Action items
[ ] <Step 1>
[ ] <Step 2>
[ ] <Step 3>
[ ] <Step 4>
[ ] <Step 5>
[ ] <Step 6>

## Open questions
- <Question 1>
- <Question 2>
- <Question 3>
```

## Checklist Guidance

Good checklist items:

- Point to likely files or modules, such as `src/...`, `app/...`, or `resources/js/...`.
- Name concrete validation, such as `npm test`, `php artisan test`, or a focused lint command.
- Include rollout or rollback notes when relevant.

Avoid:

- Vague steps such as "handle backend" or "do auth".
- Too many micro-steps.
- Implementation-specific code.
