# Community UI Libraries Design

## Goal

Install the free core components from REUI, Blocks, Kibo UI, Aceternity UI,
Kokonut UI, and uselayouts without overwriting or modifying the project's
existing shadcn/ui component source files.

## Scope

The installation includes reusable components that are publicly available for
free from each library's official catalog.

The installation excludes:

- Paid or gated components.
- Full-page templates.
- Demo-only pages and showcase applications.
- Large application blocks that are not reusable core components.
- Assets or examples that are not required by an installed component.

If a provider does not expose an automated registry containing its complete
free catalog, only components available through its official public
distribution mechanism will be installed. Components must not be scraped from
rendered documentation pages.

## Directory Layout

Third-party component source files will use provider-specific namespaces:

- `resources/js/components/reui`
- `resources/js/components/blocks`
- `resources/js/components/kibo-ui`
- `resources/js/components/aceternity-ui`
- `resources/js/components/kokonut-ui`
- `resources/js/components/uselayouts`

The existing `resources/js/components/ui` directory remains the canonical
shadcn/ui implementation. Third-party components may import primitives from
`@/components/ui`, but their own source files must not be written into that
directory.

## Installation Strategy

Each provider's official registry, package, or documented CLI is the source of
truth. Before installation, the available free component inventory and output
paths will be inspected.

Registry output will first be installed or generated in an isolated temporary
location when the tool cannot target a provider-specific directory directly.
Only the required third-party component files will then be integrated into the
provider namespace. Required npm dependencies may be added to the existing
project, but application dependencies will not be upgraded or removed unless
the component cannot work otherwise and the user approves that change.

Imports will be normalized to the project's aliases. Shared shadcn primitives
will continue to resolve from `@/components/ui`, utilities from `@/lib`, and
hooks from `@/hooks`.

## Styling

Components should use the existing Tailwind CSS v4 setup and semantic shadcn
tokens where practical. Provider-specific animations, keyframes, CSS
variables, or utilities will be added to `resources/css/app.css` only when
required.

Existing theme variables and global styles must not be replaced. New global CSS
must be namespaced or narrowly scoped to avoid changing existing application
screens.

## Conflict Protection

Before installation, the current Git state of
`resources/js/components/ui`, `resources/css/app.css`, `components.json`, and
dependency manifests will be recorded.

After each provider is integrated:

- Verify no existing shadcn component file was modified or deleted.
- Review generated files for hardcoded aliases and incompatible framework
  assumptions.
- Remove demo-only code and unnecessary assets.
- Resolve duplicate filenames within the provider namespace.
- Confirm required dependencies are declared.

Any registry operation that requires overwriting existing shadcn files will be
stopped and replaced with isolated generation and manual integration.

## Compatibility

Installed components must be compatible with:

- React 19.
- TypeScript.
- Vite.
- Tailwind CSS 4.
- The current Laravel Inertia client environment.

Next.js-only APIs such as `next/image`, `next/link`, server components, or
framework-specific routing must not remain in reusable components. A component
that cannot reasonably be adapted without changing its intended behavior will
be documented as unavailable rather than installed in a broken state.

## Verification

Verification will include:

- A Git diff proving existing files under `resources/js/components/ui` were not
  changed by this work.
- TypeScript checking with `npm run types:check`.
- ESLint checking with `npm run lint:check`.
- A production build with `npm run build`.
- A source audit for unresolved imports and Next.js-only dependencies.
- A provider inventory listing installed and unavailable components.

Failures caused by pre-existing unrelated worktree changes will be identified
separately from failures introduced by this installation.

## Deliverables

- Provider-namespaced component source files.
- Required npm dependency updates.
- Minimal required additions to the global Tailwind CSS file.
- A concise final inventory of installed and unavailable free components.
- Verification results confirming the original shadcn/ui source remains
  unchanged.
