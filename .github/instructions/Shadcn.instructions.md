---
description: "Use when building or editing React/Inertia pages, forms, authentication flows, layouts, or UI components in resources/js. Enforces Laravel Starter Kit React customization/authentication docs, mandatory shadcn/ui usage, and CLI/SKILLS/MCP workflow with registry and update safety rules."
name: "React Starter Kit and shadcn UI Compliance"
applyTo:
  - "resources/js/**/*.ts"
  - "resources/js/**/*.tsx"
  - "resources/js/**/*.js"
  - "resources/js/**/*.jsx"
---
# React Starter Kit and shadcn/ui Compliance

These are hard requirements for this workspace.

## Required documentation

Before implementing or changing React/Inertia UI, read and follow:

- https://laravel.com/docs/13.x/starter-kits#react-customization

If requirements from these docs conflict with assumptions, follow the docs.

## shadcn operating principles

- Open Code: treat shadcn/ui files as editable source code and adapt them to this project when needed.
- Composition first: compose new UI from existing shadcn primitives before inventing new APIs.
- Distribution workflow: discover and install through shadcn CLI or MCP, not copy-paste from random sources.

## Mandatory toolchain gate (CLI + SKILLS + MCP)

For every frontend task in resources/js, all of the following are required:

1. SKILLS: apply the installed shadcn skill and follow its critical rules before writing UI code.
2. CLI: use shadcn CLI to inspect context and component availability (`info`, `docs`, `search`/`view`, `add`).
3. MCP: use shadcn MCP for registry discovery and component selection when implementing new UI.
4. Runner consistency: use the project package runner for shadcn commands (`npx`, `pnpm dlx`, or `bunx --bun`) based on project tooling.
5. Dependency safety: when shadcn workflow requires new dependencies, ask for user approval before installing, in line with project dependency policy.

Disallowed workflow:

- Copy-pasting third-party UI code directly as a replacement for official shadcn components.
- Building custom primitives that duplicate existing shadcn components without explicit need.
- Skipping CLI and MCP discovery when adding new frontend UI pieces.

## Registry and source controls

- Registry must be explicit. If a requested component/block does not include a registry source, ask which registry to use before adding.
- Do not assume or silently switch registry sources.
- After adding components from third-party registries, review generated files for alias correctness, missing imports, and composition consistency with local shadcn patterns.

## Component update safety

When updating existing shadcn components:

1. Preview changes first with `add --dry-run` and `add --diff`.
2. Merge local customizations deliberately; do not blindly replace files.
3. Never use `--overwrite` unless the user explicitly approved overwrite behavior.

## Mandatory component policy

- Always use shadcn/ui React components for UI primitives and composed UI.
- Prefer existing shadcn/ui components before building custom UI.
- Do not use raw HTML primitives for standard controls when a shadcn/ui equivalent exists (for example button, input, textarea, select, dialog, sheet, card, table, dropdown, tooltip, and form field wrappers).

Component sourcing order:

1. Reuse existing local components first.
2. Add from shadcn registry with CLI.
3. Compose a custom component from shadcn primitives only when no suitable component exists.

Allowed raw HTML usage is limited to non-interactive layout and semantic structure (for example section, article, nav, main, header, footer, and container wrappers).

## Bootstrap gate (required before new UI work)

If shadcn/ui is not configured yet (for example missing components.json or missing shadcn dependencies), set it up first:

1. Initialize shadcn for Laravel.
2. Keep CSS variables enabled.
3. Add required components with the shadcn CLI instead of ad hoc code.

Default commands:
- npx shadcn@latest init --template laravel --yes --css-variables
- npx shadcn@latest info --json
- npx shadcn@latest add <component-names>

Post-bootstrap checks:

- Confirm components.json exists and aliases map correctly to resources/js.
- Confirm generated components use project utilities (for example cn from @/lib/utils).

## MCP and discovery gate

- Configure and keep a shadcn MCP server available in .vscode/mcp.json.
- Use shadcn CLI or MCP for discovery before custom implementation:
  - Search/list for candidates.
  - View/docs for API and composition patterns.
  - Add to install components.
- Prefer `npx shadcn@latest docs <component>` when implementation details are unclear.

## Authentication requirements

For login, register, forgot password, reset password, email verification, profile, and related auth UI:

- Follow Laravel starter kit authentication conventions from the required docs.
- Implement the React/Inertia UI with shadcn/ui components.
- Keep naming, flow, and user experience aligned with starter kit behavior.

## Implementation conventions

- Use `cn` from `@/lib/utils` to merge class names.
- Keep shadcn-style component APIs predictable (`variant`, `size`, `className`) when extending components.
- Preserve accessibility behavior from base components (focus states, keyboard handling, aria attributes).

## Definition of done

- Required docs were followed for the changed area.
- shadcn SKILLS guidance was applied for the frontend task.
- shadcn CLI and MCP discovery steps were used before final implementation.
- Registry source was explicit for each newly added component or block.
- UI uses shadcn/ui components for all applicable controls.
- Any missing component was added via shadcn CLI or MCP-guided workflow.
- For component updates, dry-run and diff review was completed before applying changes.
- If installation introduced new dependencies, user approval was obtained first.
- Auth flow behavior remains aligned with Laravel starter kit conventions.

## Scope boundary

- This instruction applies to the React/Inertia UI layer only.
- Keep existing Laravel backend conventions from AGENTS.md intact unless explicitly requested otherwise.

## Response expectation

When delivering UI/auth changes, briefly state:

- Which required Laravel doc sections were followed.
- Which shadcn/ui components were used or added.
- Which shadcn CLI and MCP commands were executed.
- Which registry source was used for added components.
