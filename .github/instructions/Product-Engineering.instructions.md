---
description: "Use when planning or implementing Crypter product work: PRD intake, tech stack confirmation, product context, design system references, Laravel/Inertia React changes, shadcn/ui UI work, auth flows, routes, database, tests, QA, and implementation plans."
name: "Crypter Product Engineering, PRD, and Design System Compliance"
applyTo: "app/**/*.php,routes/**/*.php,database/**/*.php,resources/js/**/*.ts,resources/js/**/*.tsx,resources/js/**/*.js,resources/js/**/*.jsx,tests/**/*.php"
---
# Crypter Product Engineering, PRD, and Design System Compliance

This instruction is the unified operating contract for product-facing work in Crypter. Use it before planning, editing, reviewing, validating, or shipping Laravel backend, Inertia React frontend, route, database, test, authentication, or UI/design-system changes.

## Non-negotiable outcome

Every product change must connect four things:

1. **Product intent** — what user/business problem is being solved.
2. **Technical reality** — how current Laravel/Inertia codebase works.
3. **Design system fit** — which existing UI patterns and shadcn/ui primitives should be used.
4. **Verification evidence** — which tests, formatters, checks, or manual validations prove done.

Do not begin implementation until those four things are clear enough to produce testable acceptance criteria.

## Hard stop rules

Stop and ask concise questions before editing when any item below is unclear:

- Product problem, goal, or target user.
- Scope boundary or explicit exclusions.
- Acceptance criteria.
- Current behavior versus desired behavior.
- Affected role, permission, auth state, route, or data model.
- Design reference or allowed design direction for UI work.
- Registry source for any third-party shadcn block/component.
- Permission to add dependencies, change schema, change public contracts, or overwrite generated UI components.
- Whether assumptions are allowed.

Do not invent product requirements, UI direction, database behavior, auth behavior, authorization rules, success metrics, dependency choices, or migration effects unless the user explicitly approves assumptions.

## Decision matrix: ask or proceed

Use this matrix before planning or editing:

| Situation | Action |
| --- | --- |
| PRD problem, goal, target user, or acceptance criteria are missing | Stop and ask first. |
| User asks for backend-only change and UI/design is irrelevant | Proceed after backend context is clear. |
| User asks for UI work without design reference or explicit style direction | Stop and ask for reference or permission to follow existing local pattern. |
| User asks for route/controller changes used by React | Proceed only with Wayfinder check/regeneration plan. |
| User asks for schema/data-model change | Stop unless migration behavior, data impact, and rollback/backfill risk are clear. |
| User asks to add or update dependencies | Ask for approval before installing or editing dependency files. |
| User asks to overwrite shadcn/ui generated files | Ask for explicit overwrite approval and mention local customization risk. |
| Existing dirty files are unrelated to requested work | Do not touch them. Mention if they block validation. |
| Current file changed since last read | Re-read before editing. |
| Tests fail outside touched scope | Report separately; do not silently fix unless user asks. |

## PRD quality rubric

Grade requirements before implementation:

### Ready

Proceed when all are true:

- Problem, goal, target user, and scope are clear.
- Acceptance criteria are testable.
- Current and desired behavior are known.
- Relevant roles, data, permissions, and UI states are known.
- Design direction is clear for UI work.
- Risks and assumptions are documented.

### Needs clarification

Ask targeted questions when one or two important details are missing, for example:

- Edge/error states unknown.
- Copy/content not final.
- Exact role/permission unclear.
- Success metric absent but not needed for implementation.
- Design direction partially clear from existing page but not explicit.

### Blocked

Do not implement when any are missing:

- Core problem or target user.
- Acceptance criteria.
- Data behavior for create/update/delete flows.
- Authorization rule for protected/admin behavior.
- UI reference or permission to infer design from existing app.
- Approval for dependency, destructive migration, or overwrite.

When blocked, return only missing blockers and concise questions.

## Crypter domain taxonomy

Map feature work to domain areas and inspect related side effects.

### Courses

- Check course visibility, enrollment/access rules, published/draft state, ordering, progress, lesson relationship, admin management, and SEO/share behavior if public.
- Verify lists are paginated or filtered when large.
- Ensure course cards and detail pages handle empty lessons, locked content, and incomplete progress.

### Lessons

- Check lesson completion rules, previous/next navigation, locked prerequisites, content rendering, progress persistence, and return routes.
- Preserve state when users move between lessons and courses.

### Challenges, tasks, and labs

- Check task lifecycle: not started, active, submitted, failed, solved, expired, reset.
- Verify attempts, hints, validation rules, expected outputs, security boundaries, and rate limits.
- Avoid leaking solution data to client props.

### Assessments and quizzes

- Check attempt limits, scoring, pass/fail thresholds, randomization, time limits, review visibility, and retake rules.
- Store results server-side and avoid trusting client-calculated scores.

### XP, levels, badges, and rewards

- Check idempotency before awarding XP or badges.
- Verify duplicate events do not duplicate rewards.
- Test award side effects with events/notifications faked when practical.

### Leaderboards

- Check ranking period, tie-breaker, privacy, pagination, caching, and refresh strategy.
- Avoid sending unnecessary user profile data to frontend.

### Admin course management

- Check admin authorization, validation, destructive actions, bulk actions, drafts, publish state, audit needs, and preview paths.
- Ensure admin tables handle sorting, filtering, empty state, and permission-denied state.

### Auth, profile, and settings

- Check Fortify contracts, session behavior, email verification, password confirmation, two-factor state, profile validation, and redirect/status messages.
- Do not change security-sensitive flows without explicit acceptance criteria.

### Notifications, events, and real-time features

- Check broadcast channels, authorization, queue behavior, retry/idempotency, and fallback UI.
- Ensure Reverb/broadcast props do not leak private data.

## Data contract checklist

For every controller-to-Inertia or backend-to-frontend contract:

- Shape props intentionally; do not pass full Eloquent models unless existing convention requires it.
- Keep prop names stable and descriptive.
- Keep nullable fields explicit in TypeScript types.
- Return empty arrays for lists unless `null` has semantic meaning.
- Format dates consistently and document timezone expectations when relevant.
- Keep IDs, slugs, score, XP, percentage, and status fields typed consistently.
- Include permissions/capabilities as explicit booleans when frontend needs conditional UI.
- Avoid sending sensitive fields, hidden model attributes, tokens, solutions, password data, email verification internals, or admin-only metadata.
- Keep controller props aligned with page prop types.
- Update tests when contract shape changes.

## Performance budget

Before shipping query-heavy or UI-heavy work:

- Avoid N+1 queries with eager loading, counts, or `exists` checks.
- Paginate large lists and admin tables.
- Do not send giant collections through Inertia props.
- Use `withCount`, `withExists`, aggregates, or dedicated DTO arrays when full relationships are not needed.
- Add indexes for new filters, foreign keys, sorting, and uniqueness constraints.
- Use caching only with an invalidation strategy.
- Avoid expensive work in render paths; queue long-running side effects.
- Keep client bundle impact in mind when adding large UI dependencies or icons.

## Security and privacy classification

Classify data before exposing it:

| Class | Examples | Rule |
| --- | --- | --- |
| Public | public course title, public description, published metadata | Safe for public routes when intended. |
| Authenticated user data | progress, enrollment, personal settings | Require authenticated access and scoped ownership. |
| Admin-only data | unpublished content, admin metrics, user management data | Require server-side admin authorization. |
| Sensitive auth/security data | passwords, tokens, recovery codes, solution keys, private challenge answers | Never expose in props, logs, browser storage, or debug output. |

Security rules:

- Server-side authorization is mandatory; frontend gates are UX only.
- Validate ownership and role for every mutation.
- Avoid mass assignment risk by using intended fillable/validated data only.
- Do not log secrets or security-sensitive request payloads.
- Treat challenge/lab answers and scoring internals as sensitive.

## Accessibility checklist

For UI work, verify:

- Full keyboard path exists for interactive flows.
- Focus ring is visible and not removed.
- Focus moves correctly for dialogs, sheets, popovers, dropdowns, and form errors.
- Form fields have accessible label, description, and error association.
- Buttons and links have clear accessible names.
- Color is not the only status indicator.
- Contrast works in light and dark mode.
- Loading and async state are communicated when relevant.
- Reduced motion is respected for animated elements.
- Tables/cards/lists have meaningful headings and structure.
- Empty/error states are understandable without visual-only cues.

## QA matrix for UI and product flows

For UI/product work, cover relevant states:

- Mobile viewport.
- Desktop viewport.
- Dark mode.
- Empty state.
- Loading/skeleton state.
- Validation error state.
- Permission denied or unauthenticated state.
- Slow network or retry state when applicable.
- Long text/content overflow.
- Large list/pagination/filter state.
- Success state and post-submit redirect/status message.

## Release and rollback considerations

For risky changes, identify:

- Feature flag need and default state.
- Migration deploy order and rollback safety.
- Existing data impact and backfill plan.
- Queue/job/event compatibility across deploys.
- Wayfinder/generated asset deployment order.
- User-visible downtime or broken-state risk.
- Rollback path for UI, route, schema, and background side effects.

## Source of truth hierarchy

Use this priority order when rules overlap:

1. Direct user request for the current task.
2. `AGENTS.md` Laravel Boost and project rules.
3. `.github/copilot-instructions.md` methodology rules.
4. This instruction file.
5. Existing local code conventions in sibling files.
6. Official framework/package docs for installed versions.
7. General framework knowledge.

If sources conflict, call out the conflict and ask before continuing unless a higher-priority source clearly resolves it.

## Operating mode by task type

Classify task before acting.

### Discovery-only tasks

When user asks for explanation, audit, analysis, PRD drafting, or planning only:

- Read relevant files and summarize findings.
- Do not edit code unless explicitly asked.
- Identify gaps and risks.
- Return structured recommendations with file references.

### Product implementation tasks

When user asks to build, fix, change, refactor, redesign, or wire a feature:

- Gather required context.
- Inspect existing implementation.
- Define acceptance criteria.
- Prefer tests first for behavior changes.
- Make scoped edits only.
- Validate with minimum relevant checks.

### UI/design tasks

When user asks for page, component, layout, styling, responsive, dark mode, auth UI, or shadcn work:

- Require design reference or explicit style direction.
- Use shadcn/ui components for primitives.
- Reuse existing local components first.
- Confirm registry/source before adding components.
- Preserve accessibility and responsive states.

### Backend/data tasks

When user asks for controllers, models, requests, policies, migrations, jobs, services, routes, APIs, auth, feature flags, or database work:

- Follow Laravel best practices and `AGENTS.md`.
- Inspect schema and relationships before changing data behavior.
- Use policies/validation/tests.
- Do not change schema or public data contracts without clear acceptance criteria.

### Bugfix tasks

When user reports broken behavior, failed tests, errors, or unexpected UI:

- Reproduce or identify evidence first.
- Find root cause before editing.
- Add or update regression test when practical.
- Fix smallest responsible unit.
- Verify failure is gone.

## Required product intake

Confirm these sections before planning or coding. If user supplied enough information, summarize briefly and proceed.

### 1. Tech stack and project constraints

Confirm relevant stack from `AGENTS.md`, `package.json`, `composer.json`, current files, and existing conventions:

- App: Crypter Laravel product.
- Backend: PHP 8.4, Laravel 13, Fortify, Pennant, Socialite, Reverb, queues, policies, Eloquent, migrations, notifications, events, jobs, services.
- Frontend: Inertia Laravel v3, `@inertiajs/react` v3, React 19, TypeScript.
- Routing/action generation: Laravel Wayfinder; use imports from `@/actions` or `@/routes` instead of hardcoded backend URLs.
- Styling: Tailwind CSS v4, CSS variables, shadcn/ui source components.
- Testing: Pest 4 / PHPUnit 12; feature tests preferred for user-visible behavior.
- Tooling: Pint for PHP formatting; ESLint/Prettier/TypeScript/Vite for frontend checks.
- Package manager: follow existing lockfiles and scripts; do not switch runners.
- Dependency policy: do not add or change dependencies without user approval.
- Structure policy: do not create new top-level folders without approval.
- Documentation policy: do not create docs unless user requests docs or plan file.

### 2. PRD fields

Require enough product requirements to answer:

- **Problem**: user or business pain being solved.
- **Goal**: measurable outcome or behavior change.
- **Target users**: roles/personas affected.
- **Jobs to be done**: what users are trying to accomplish.
- **Scope in**: exact features, screens, states, and data changes to build.
- **Scope out**: explicit exclusions and non-goals.
- **User flow**: happy path, alternate paths, error paths, empty states, permission-denied paths.
- **Functional requirements**: exact system behaviors and transitions.
- **Non-functional requirements**: accessibility, security, performance, reliability, localization, compatibility, observability.
- **Data requirements**: entities, fields, relationships, lifecycle, retention, migration/backfill needs.
- **Content requirements**: labels, empty text, success/error messages, localization tone.
- **Acceptance criteria**: testable conditions for done.
- **Success metrics**: how outcome will be measured.
- **Rollout/release notes**: feature flags, migration risk, backwards compatibility, deployment order.
- **Risks, assumptions, dependencies, and open questions**.

### 3. Product context

Confirm:

- Product/domain goal.
- Feature location in app navigation and route hierarchy.
- Current behavior and current user pain.
- Desired behavior and target user outcome.
- Affected roles, permissions, guards, middleware, or auth states.
- Related routes, controllers, models, policies, services, actions, events, listeners, jobs, notifications, tests, pages, and components.
- Data model, migration, factory, seeder, validation, authorization, and API constraints.
- Empty, loading, error, disabled, offline, edge, retry, rollback, and success states.
- Analytics, audit, notification, broadcast, queue, or logging needs if relevant.
- Backward compatibility risks for existing URLs, props, tests, user data, and browser behavior.

### 4. Design system references

For UI work, confirm:

- Reference source: Figma, screenshot, URL, existing page, written style description, or shadcn block.
- Existing local components to reuse before creating new ones.
- shadcn/ui components, registry items, or blocks to use.
- Tailwind v4 layout, spacing, color, responsive, dark mode, and typography patterns.
- Interaction behavior: hover, focus, active, disabled, loading, validation, transitions.
- Accessibility expectations: keyboard behavior, focus order, aria attributes, contrast, reduced motion, screen reader text.
- Auth or starter-kit UX expectations when work touches login, registration, password reset, verification, profile, or settings.
- Content tone and language consistency with existing Indonesian/English usage in nearby pages.

## Missing information workflow

When context is incomplete:

1. List only missing items that block safe planning or implementation.
2. Ask the smallest set of questions needed to unblock work.
3. Group questions by PRD, Product Context, Design, and Technical Risk.
4. Offer this compact template if user wants to provide everything at once:

```markdown
## Tech stack
- Relevant backend/frontend constraints:
- Existing files/features to inspect:
- Dependencies allowed? yes/no:

## PRD
- Problem:
- Goal:
- Target users:
- Jobs to be done:
- Scope in:
- Scope out:
- User flow:
- Functional requirements:
- Non-functional requirements:
- Data/content requirements:
- Acceptance criteria:
- Success metrics:
- Risks/open questions:

## Product context
- Feature location:
- Current behavior:
- Desired behavior:
- Roles/permissions/auth state:
- Related routes/models/controllers/pages:
- Data/API constraints:
- Empty/loading/error/edge states:

## Design system
- Reference source:
- Existing components to reuse:
- shadcn/ui components or blocks:
- Tailwind/responsive/dark mode/accessibility notes:
- Copy/content notes:
```

5. Wait for answers before planning or editing.

Proceed with assumptions only when user explicitly says assumptions are acceptable. Record approved assumptions in the plan and final response.

## Planning requirements

When context is sufficient:

- Restate tech stack, PRD summary, product context, design references, and assumptions briefly.
- Identify likely affected files before editing.
- Define acceptance criteria before implementation.
- Identify risks, rollback strategy, and validation plan.
- Prefer test-driven development for new behavior and bugfixes.
- Keep scope narrow; avoid unrelated refactors.
- Reuse existing components, actions, models, factories, requests, policies, routes, and tests before adding new ones.
- For multi-step work, create a clear task list with tests and validation steps.
- For risky changes, stage work in small commits/checkpoints when user requests commits.

## Exploration requirements before editing

Before changing code, inspect enough context to avoid guessing:

- Read sibling files for naming, structure, prop shape, validation style, and component conventions.
- Search for existing routes, controller methods, model relationships, factories, policies, tests, components, and generated Wayfinder helpers.
- Inspect database schema before migrations or data queries.
- Inspect current UI components before creating new UI.
- Inspect existing tests before writing new ones.
- Prefer Laravel Boost/database/schema tools when available for Laravel context.
- Use read-only exploration first; do not mutate until plan is clear.

## Laravel backend requirements

Follow `AGENTS.md` and Laravel best practices for all PHP work.

### Controllers and routes

- Keep controllers focused on HTTP orchestration.
- Use named routes and route model binding where appropriate.
- Use middleware for repeated access constraints.
- Return Inertia responses for SPA pages and redirects for mutations following existing conventions.
- Keep route names stable unless user requested route contract changes.
- Update Wayfinder types after route/controller signature changes when needed.

### Requests and validation

- Prefer Form Request classes when validation is non-trivial or reused.
- Keep validation messages consistent with existing locale/content style.
- Validate authorization separately with policies/gates when appropriate.
- Preserve validation error bags and Inertia form behavior.

### Models and Eloquent

- Use explicit relationships and eager loading to avoid N+1 queries.
- Keep casts, fillable/guarded, accessors, scopes, and factories aligned.
- Prefer query scopes for repeated query logic.
- Do not hide complex business rules inside views or React props.
- Avoid loading unbounded collections when pagination or filtering is needed.

### Migrations and schema

- Use migrations for schema changes.
- Include indexes for queried foreign keys, filters, ordering, and uniqueness constraints.
- Define foreign keys and cascade behavior intentionally.
- Consider existing data and nullability/backfill strategy.
- Avoid destructive migrations unless explicitly approved.

### Authorization and security

- Enforce permissions server-side; frontend checks are not security boundaries.
- Use policies, gates, middleware, or existing role conventions.
- Protect auth flows, password flows, email verification, two-factor, and profile changes.
- Avoid leaking sensitive fields through Inertia props.
- Validate file uploads, external URLs, and user-generated content.

### Jobs, events, notifications, and broadcasts

- Queue long-running or external side effects.
- Keep jobs idempotent when retries are possible.
- Use events/listeners when behavior crosses domains.
- Use notifications and broadcasts according to existing app patterns.
- Test side effects with fakes where practical.

### Laravel creation and formatting

- Use `php artisan make:* --no-interaction` when creating Laravel classes.
- Use factories for test data.
- Do not create or mutate production-like data with ad hoc scripts unless user approves.
- For PHP changes, run relevant Pest tests and `vendor/bin/pint --dirty --format agent` before finalizing.

## Inertia React requirements

Use Inertia v3 React patterns.

- Pages live under `resources/js/pages` unless Vite config says otherwise.
- Use Inertia navigation, forms, props, deferred props, prefetching, polling, optimistic updates, or standalone HTTP requests only when they fit the task.
- Use Wayfinder-generated route/action helpers from `@/actions` or `@/routes` for backend calls.
- Do not hardcode app URLs for backend routes.
- Keep page props explicit and aligned with controller responses.
- Preserve TypeScript types for server props, form payloads, filters, and domain entities.
- Handle loading, empty, error, validation, disabled, optimistic rollback, and success states.
- Preserve scroll/state behavior intentionally when using router visits.
- Avoid duplicating server-side authorization assumptions in frontend-only logic.
- Keep components small enough to reason about; extract local components when repeated or complex.
- Avoid unrelated formatting churn in large TSX files.

## Wayfinder requirements

- Use Wayfinder whenever frontend code calls backend routes or controller actions.
- Import generated helpers from `@/actions` or `@/routes`.
- Prefer `.url()`, `.get()`, `.post()`, `.form()`, or generated method helpers according to existing code.
- After changing routes/controllers used by frontend, regenerate types with project command when needed.
- If generated helper is missing, inspect route/controller registration before hardcoding.

## Required React starter kit documentation

Before implementing or changing React/Inertia UI, read and follow:

- https://laravel.com/docs/13.x/starter-kits#react-customization

If docs conflict with assumptions, follow docs or ask when project-specific behavior is unclear.

## shadcn/ui operating principles

- Open Code: treat shadcn/ui files as editable project source when needed.
- Composition first: compose new UI from existing shadcn primitives before inventing new APIs.
- Distribution workflow: discover and install through shadcn CLI or MCP, not copy-paste from random sources.
- Mandatory component policy: always use shadcn/ui React components for UI primitives and composed UI when equivalents exist.
- Design consistency: keep variants, spacing, tokens, radius, border, focus rings, and disabled states aligned with local components.

## Mandatory shadcn toolchain gate

For frontend tasks in `resources/js`, all are required when adding or materially changing UI:

1. Apply relevant shadcn/design-system guidance before writing UI code.
2. Confirm `components.json` and aliases if adding or modifying shadcn components.
3. Use shadcn CLI to inspect context and component availability (`info`, `docs`, `search`/`view`, `add`) when adding or changing component choices.
4. Use shadcn MCP registry tools for registry discovery and component selection when implementing new UI.
5. Use project package runner consistently (`pnpm dlx`, `npx`, or `bunx --bun`) based on project tooling.
6. Ask approval before installing dependencies.

Disallowed:

- Copy-pasting third-party UI code as a replacement for official shadcn components.
- Building custom primitives that duplicate existing shadcn components without explicit need.
- Skipping discovery when adding new frontend UI pieces.
- Using raw interactive HTML controls when a shadcn/ui equivalent exists.
- Blindly overwriting customized local shadcn files.

## Registry and source controls

- Registry must be explicit. If requested component/block lacks registry source, ask which registry to use before adding.
- Do not silently switch registry sources.
- Distinguish official shadcn registry, local registry, and third-party registries.
- After adding registry components, review generated files for alias correctness, missing imports, dependency changes, server/client boundaries, and consistency with local shadcn patterns.
- If component code introduces dependencies, ask approval before installing or committing dependency changes.

## Component sourcing order

Use this order for UI:

1. Reuse existing local feature components.
2. Reuse existing local shadcn/ui primitives from `resources/js/components/ui`.
3. Compose from existing shadcn primitives.
4. Add official shadcn registry components with CLI/MCP.
5. Add explicit third-party registry components only after registry confirmation.
6. Compose a custom component from shadcn primitives only when no suitable component exists.

Allowed raw HTML is limited to non-interactive layout and semantic structure, for example `section`, `article`, `nav`, `main`, `header`, `footer`, `aside`, `dl`, `dt`, `dd`, `ul`, `ol`, `li`, and container wrappers.

Do not use raw HTML primitives for standard controls when shadcn/ui equivalent exists, for example button, input, textarea, select, checkbox, radio, switch, dialog, sheet, drawer, card, table, dropdown, tooltip, badge, tabs, accordion, command, popover, toast, alert, avatar, separator, skeleton, progress, breadcrumb, pagination, and form field wrappers.

## Bootstrap gate for shadcn/ui

If shadcn/ui is not configured, set it up before new UI work:

1. Initialize shadcn for Laravel.
2. Keep CSS variables enabled.
3. Add required components with shadcn CLI instead of ad hoc code.

Default commands:

- `npx shadcn@latest init --template laravel --yes --css-variables`
- `npx shadcn@latest info --json`
- `npx shadcn@latest add <component-names>`

Post-bootstrap checks:

- Confirm `components.json` exists.
- Confirm aliases map to `resources/js`.
- Confirm generated components use project utilities, for example `cn` from `@/lib/utils`.
- Confirm Tailwind and CSS variable setup remains compatible with existing app CSS.

## Component update safety

When updating existing shadcn components:

1. Preview changes first with `add --dry-run` and `add --diff` when available.
2. Compare generated changes with local customizations.
3. Preserve local variants, class names, accessibility fixes, and API compatibility unless user requested replacement.
4. Merge deliberately; do not blindly replace files.
5. Never use `--overwrite` unless user explicitly approves overwrite behavior.

## UI implementation conventions

- Use `cn` from `@/lib/utils` to merge class names.
- Keep shadcn-style APIs predictable: `variant`, `size`, `className`, `asChild` when applicable.
- Preserve accessibility from base components: focus states, keyboard behavior, aria attributes, labels, descriptions, error associations.
- Design mobile-first and include responsive states for key layouts.
- Include loading, empty, error, disabled, success, and optimistic states when data or actions can be unavailable.
- Respect existing dark mode and theme tokens.
- Prefer semantic sections and clear hierarchy.
- Keep copy concise and consistent with nearby pages.
- Avoid one-off styling that bypasses project tokens unless design reference requires it.
- Avoid layout shifts from late-loading data; use skeletons or stable containers when needed.
- Keep icons decorative unless they convey meaning; add accessible text when needed.

## Authentication UI requirements

For login, register, forgot password, reset password, email verification, password confirmation, two-factor authentication, profile, settings, and related auth UI:

- Follow Laravel starter kit authentication conventions from required docs.
- Follow Fortify behavior and existing auth route/controller contracts.
- Activate and follow Fortify-specific project rules when editing auth backend or frontend contracts.
- Implement React/Inertia UI with shadcn/ui components.
- Preserve validation errors, status messages, redirects, rate limits, throttling, remember-me behavior, email verification state, password confirmation, recovery codes, and security-sensitive flows.
- Keep naming, flow, and user experience aligned with starter kit behavior unless user explicitly asks for product-specific changes.
- Do not expose sensitive auth fields in props or logs.

## Feature flags and rollout

When work involves feature flags, experiments, phased rollout, or access gating:

- Use Laravel Pennant conventions.
- Define clear flag name, scope, default behavior, and fallback path.
- Keep flagged code easy to remove after rollout.
- Test both active and inactive states.
- Do not hide security-sensitive authorization solely behind frontend flags.

## Social authentication

When work involves OAuth, social login, providers, callbacks, scopes, or linked accounts:

- Use Socialite conventions.
- Preserve redirect/callback security and state validation.
- Store provider identifiers safely.
- Handle denied consent, missing email, duplicate email, and existing account linking scenarios.
- Test provider interactions with fakes/mocks where practical.

## Testing and verification requirements

- Every behavior change needs a programmatic test when practical.
- Prefer Pest feature tests for Laravel behavior.
- Use unit tests for pure services, value objects, and complex calculations.
- Use factories and existing states for test data.
- Use fakes for mail, notifications, events, queues, storage, broadcasts, and external providers.
- Run the smallest relevant test set, for example `php artisan test --compact --filter=<name>`.
- For TypeScript/UI changes, run relevant lint/type/build checks when applicable.
- For route/controller changes used by frontend, regenerate/check Wayfinder output when needed.
- For PHP files, run `vendor/bin/pint --dirty --format agent` before final response.
- Do not claim work is done until validation results are known.
- If validation cannot run, state exact reason and risk.

## Quality gates by change type

### PHP-only change

- Relevant Pest/PHPUnit test or focused manual proof.
- Pint on dirty PHP files.
- Authorization and validation reviewed.

### React/UI-only change

- Existing component reuse checked.
- shadcn discovery done when adding/changing primitives.
- Type/lint/build check run when practical.
- Accessibility states reviewed.

### Full-stack change

- Backend request/response contract defined.
- Wayfinder helpers used.
- Page props typed.
- Feature test covers server behavior.
- UI states cover success, validation error, and empty/loading states.

### Database change

- Schema inspected.
- Migration reversible where possible.
- Indexes/foreign keys considered.
- Factories/tests updated.
- Existing data/backfill risk addressed.

### Auth/security change

- Fortify/starter-kit behavior reviewed.
- Server-side authorization enforced.
- Sensitive data not leaked.
- Rate limiting/session/verification implications checked.

## Documentation and comments

- Do not create documentation files unless user explicitly requests docs or a plan file.
- Prefer self-explanatory code and descriptive names.
- Use PHPDoc for complex PHP array shapes or domain contracts.
- Avoid inline comments except for non-obvious logic.
- If adding comments, explain why, not what.

## Change safety and user edits

- Never overwrite unrelated user changes.
- Before large edits, check current file contents if user or formatter changed files.
- Keep diffs scoped.
- Avoid formatting-only churn unless running required formatter on touched files.
- Do not delete tests without approval.
- Do not remove features without explicit user request.
- Do not change public URLs, route names, database columns, or component APIs without identifying downstream impact.

## Anti-patterns

Never do these unless user explicitly requests and risk is documented:

- Hardcode Laravel backend URLs in React instead of Wayfinder helpers.
- Add raw interactive HTML controls when shadcn/ui equivalent exists.
- Put authorization only in frontend logic.
- Return full Eloquent models to Inertia without shaping or privacy review.
- Add a dependency for a small utility that can be written locally.
- Create documentation files without request.
- Format unrelated dirty files.
- Delete or weaken tests to make a change pass.
- Use `--overwrite` on shadcn/ui files without approval.
- Change route names, prop contracts, database columns, or public component APIs without downstream review.
- Trust client-calculated XP, score, completion, role, or permission values.
- Hide migration risk or skipped validation in final response.

## Good input versus bad input examples

### Bad input

"Buat dashboard admin yang bagus."

Problems:

- No target user details beyond admin.
- No data requirements.
- No acceptance criteria.
- No design reference.
- No states for empty/loading/error.

### Better input

"Buat admin course dashboard untuk melihat total courses, published drafts, pending assessments, dan recent completions. Gunakan pola card/table yang sudah ada, shadcn/ui, dark mode, empty state, dan filter status. Admin-only. Acceptance: admin bisa lihat metrik, filter course by status, dan klik course ke halaman edit. Non-admin ditolak."

Why ready:

- Product goal clear.
- Data and role clear.
- UI direction clear.
- Acceptance criteria testable.
- Authorization expectation clear.

## Definition of done

A task is done only when relevant items are true:

- Requirement and acceptance criteria are satisfied.
- Scope stayed narrow; unrelated files untouched.
- Product context and affected domains were considered.
- Server-side validation and authorization exist where needed.
- Data contracts are typed, shaped, and privacy-reviewed.
- shadcn/ui and existing components were used for applicable UI.
- Loading, empty, error, disabled, and success states exist where applicable.
- Accessibility checklist was reviewed for UI work.
- Performance/N+1/pagination concerns were considered.
- Tests were added or updated when practical.
- Relevant tests/formatters/lint/type/build checks ran, or skipped checks have explicit reasons.
- Assumptions, blockers, and follow-up items are documented.

## Final review checklist before response

Confirm:

- PRD requirements are satisfied or documented as follow-up.
- Product context and affected app areas were handled.
- Existing conventions were followed.
- shadcn/ui components were used for applicable UI primitives.
- Wayfinder was used for frontend-backend route/action calls.
- Backend validation and authorization are server-side where needed.
- Tests/formatters/validation were run or skipped with reason.
- No unrelated user changes were overwritten.
- New dependencies were not added without approval.
- Remaining assumptions and open questions are listed.

## Final response format

When delivering work, be brief and include:

- **Changed**: files or behavior changed.
- **Product fit**: PRD/product requirements addressed.
- **Design system**: shadcn/ui components or design references used for UI work.
- **Validation**: tests, formatters, lint/type/build checks run.
- **Notes**: assumptions, blockers, skipped checks, or follow-up items.

For analysis-only work, include:

- **Findings**.
- **Risks**.
- **Questions**.
- **Recommended next step**.
