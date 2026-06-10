# Community UI Libraries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install every officially distributed free core component from six shadcn-compatible community libraries while preserving the existing shadcn/ui source files.

**Architecture:** Discover each provider's current public registry inventory, then use temporary provider-specific shadcn projects to resolve files and dependencies without writing into the application. Integrate reusable component source into provider namespaces, normalize imports for Laravel Vite, and verify the protected shadcn directory against a baseline.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, shadcn CLI, npm, Vitest, ESLint.

---

### Task 1: Capture Baseline And Provider Inventories

**Files:**
- Create: `resources/js/components/community-ui.manifest.json`
- Create: `resources/js/components/__tests__/community-ui-manifest.test.ts`

- [ ] **Step 1: Write a failing manifest contract test**

Create a Vitest test that imports the manifest and asserts that it contains the
six provider keys, a non-empty official source URL for each provider, an
`installed` array, and an `unavailable` array.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm run test:unit -- resources/js/components/__tests__/community-ui-manifest.test.ts`

Expected: FAIL because `community-ui.manifest.json` does not exist.

- [ ] **Step 3: Record protected-file hashes and discover official inventories**

Hash all tracked files under `resources/js/components/ui`. Query official
registry indexes, CLIs, sitemaps, or public repositories for REUI, Blocks,
Kibo UI, Aceternity UI, Kokonut UI, and uselayouts. Exclude names identified
as demos, pages, templates, sections, or paid items.

- [ ] **Step 4: Create the initial manifest**

Write the six provider entries with source URLs, discovered component names,
empty installation results, and discovery notes. Include the protected
shadcn baseline hash as metadata.

- [ ] **Step 5: Run the manifest test**

Run: `npm run test:unit -- resources/js/components/__tests__/community-ui-manifest.test.ts`

Expected: PASS.

### Task 2: Stage And Integrate REUI

**Files:**
- Create: `resources/js/components/reui/*.tsx`
- Modify: `resources/js/components/community-ui.manifest.json`
- Modify when required: `package.json`
- Modify when required: `package-lock.json`
- Modify when required: `resources/css/app.css`

- [ ] **Step 1: Resolve each free core REUI item in an isolated shadcn project**

Use the official `https://reui.io/r/{style}/{name}.json` registry with the
project's Radix Nova style. Do not install catalog blocks whose names begin
with `c-`.

- [ ] **Step 2: Integrate provider-owned files**

Move only reusable REUI component files into
`resources/js/components/reui`. Keep shared primitive imports pointed at
`@/components/ui` and normalize utility and hook aliases.

- [ ] **Step 3: Install missing runtime dependencies**

Add only dependencies declared by successfully resolved REUI registry items.
Do not upgrade existing packages solely to match a registry's preferred range.

- [ ] **Step 4: Update the manifest and verify protected hashes**

Record installed and unavailable names with reasons. Re-hash
`resources/js/components/ui` and require an exact baseline match.

### Task 3: Stage And Integrate Blocks

**Files:**
- Create: `resources/js/components/blocks/*.tsx`
- Modify: `resources/js/components/community-ui.manifest.json`
- Modify when required: `package.json`
- Modify when required: `package-lock.json`

- [ ] **Step 1: Resolve the official Blocks registry inventory**

Use `@blocks-so` registry items from Blocks' official public registry. Include
reusable component entries and exclude login pages, onboarding flows, and
other full-page or application blocks according to the approved scope.

- [ ] **Step 2: Adapt framework-specific imports**

Place reusable files in `resources/js/components/blocks`. Replace Next.js-only
imports with framework-neutral React markup only when behavior remains
equivalent; otherwise mark the item unavailable.

- [ ] **Step 3: Update the manifest and verify protected hashes**

Record results and require the shadcn baseline hash to remain unchanged.

### Task 4: Stage And Integrate Kibo UI

**Files:**
- Create: `resources/js/components/kibo-ui/*.tsx`
- Modify: `resources/js/components/community-ui.manifest.json`
- Modify when required: `package.json`
- Modify when required: `package-lock.json`

- [ ] **Step 1: Enumerate Kibo's free component catalog**

Use the official Kibo UI CLI catalog or official component index. Exclude
separate AI Elements and demo applications from this installation.

- [ ] **Step 2: Generate components in an isolated project**

Run Kibo's CLI against staging, then integrate provider-owned source into
`resources/js/components/kibo-ui`.

- [ ] **Step 3: Normalize aliases and dependencies**

Keep required shadcn imports under `@/components/ui`, remove Next.js-only
assumptions, and add missing runtime dependencies.

- [ ] **Step 4: Update the manifest and verify protected hashes**

Record results and require the shadcn baseline hash to remain unchanged.

### Task 5: Stage And Integrate Aceternity UI

**Files:**
- Create: `resources/js/components/aceternity-ui/*.tsx`
- Modify: `resources/js/components/community-ui.manifest.json`
- Modify when required: `package.json`
- Modify when required: `package-lock.json`
- Modify when required: `resources/css/app.css`

- [ ] **Step 1: Enumerate official free non-demo registry items**

Use Aceternity's official component catalog and `@aceternity` registry.
Install component entries, excluding `*-demo`, blocks, sections, templates,
and premium-only items.

- [ ] **Step 2: Integrate reusable source**

Place provider files in `resources/js/components/aceternity-ui`, normalize
imports, and add narrowly scoped Tailwind v4 keyframes or theme variables
required by the components.

- [ ] **Step 3: Update dependencies and manifest**

Add required animation or rendering packages without changing existing
dependency versions unnecessarily. Record installed and unavailable items.

- [ ] **Step 4: Verify protected hashes**

Require the shadcn baseline hash to remain unchanged.

### Task 6: Stage And Integrate Kokonut UI

**Files:**
- Create: `resources/js/components/kokonut-ui/*.tsx`
- Modify: `resources/js/components/community-ui.manifest.json`
- Modify when required: `package.json`
- Modify when required: `package-lock.json`
- Modify when required: `resources/css/app.css`

- [ ] **Step 1: Enumerate Kokonut's official free registry**

Use `https://kokonutui.com/r/{name}.json` and the official component index.
Exclude templates, blocks, and Pro-only entries.

- [ ] **Step 2: Integrate registry source**

Place provider source in `resources/js/components/kokonut-ui`, retain existing
shadcn primitive imports, and normalize all other aliases.

- [ ] **Step 3: Update dependencies, CSS, and manifest**

Add only requirements of resolved free components and record all results.

- [ ] **Step 4: Verify protected hashes**

Require the shadcn baseline hash to remain unchanged.

### Task 7: Stage And Integrate uselayouts

**Files:**
- Create: `resources/js/components/uselayouts/*.tsx`
- Modify: `resources/js/components/community-ui.manifest.json`
- Modify when required: `resources/js/hooks/use-measure.tsx`
- Modify when required: `package.json`
- Modify when required: `package-lock.json`

- [ ] **Step 1: Enumerate official component registry URLs**

Read the official uselayouts component index and resolve each public
`https://uselayouts.com/r/{name}.json` item. Exclude templates and page-level
layouts.

- [ ] **Step 2: Integrate source and shared hooks**

Place provider source in `resources/js/components/uselayouts`. Add shared hooks
only when declared by a component and no equivalent hook already exists.

- [ ] **Step 3: Normalize imports and update dependencies**

Use the project's existing Lucide dependency where supported. Add Hugeicons,
Motion, Number Flow, or other packages only when required by installed items.

- [ ] **Step 4: Update the manifest and verify protected hashes**

Record all results and require the shadcn baseline hash to remain unchanged.

### Task 8: Add Integrity Tests And Complete Verification

**Files:**
- Modify: `resources/js/components/__tests__/community-ui-manifest.test.ts`
- Modify: `resources/js/components/community-ui.manifest.json`

- [ ] **Step 1: Extend the test with filesystem integrity assertions**

Assert that every installed manifest item has at least one existing source
file under its provider namespace, no provider file imports `next/*`, and no
installed path is under `resources/js/components/ui`.

- [ ] **Step 2: Run the test and fix inventory mismatches**

Run: `npm run test:unit -- resources/js/components/__tests__/community-ui-manifest.test.ts`

Expected: PASS with all manifest entries represented on disk.

- [ ] **Step 3: Run source audits**

Run searches for unresolved provider aliases, `next/image`, `next/link`,
server-only directives, and imports that point to missing local files.

- [ ] **Step 4: Run project verification**

Run:

```text
npm run test:unit
npm run types:check
npm run lint:check
npm run build
```

Expected: all commands exit successfully. Any unrelated pre-existing failure
must be reported separately with its exact output.

- [ ] **Step 5: Verify protected source and review the final diff**

Compare current hashes and Git diff for `resources/js/components/ui` against
the Task 1 baseline. The directory must have no changes introduced by this
implementation.
