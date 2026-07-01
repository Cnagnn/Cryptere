---
name: grill-with-docs
description: Use when reviewing code against documentation, finding gaps between implemented code and specs/requirements, auditing API surface against documented contracts, or verifying that behavior matches written definitions — before merging, during PR review, or during QA
---

# Grill with Docs

## Overview

**Core principle:** Every public API, contract, or documented behavior must have a corresponding implementation. Every implementation must match its documented contract. Grill = cross-reference aggressive.

## When to Use

- PR review — verify changes match documented APIs/contracts
- Pre-release QA — audit implementation against spec
- Documentation drift check — find stale/incorrect docs
- Onboarding review — verify new code respects existing contracts

**Don't use for:** Quick bug fixes, single-line changes, or when docs don't exist yet.

## The Three Lenses

### 1. Doc → Code (What's documented that's missing?)

For each documented feature/endpoint/behavior:
- Does the code path exist?
- Is every documented parameter handled?
- Are documented error cases returned?
- Are documented side effects implemented?

### 2. Code → Doc (What's implemented that's undocumented?)

For each public function/route/component:
- Is the behavior documented?
- Are all parameters documented?
- Are exceptions/errors documented?
- Are defaults documented?

### 3. Contract Match (Does implementation match the promise?)

- Return types match documented types?
- Status codes match API docs?
- Validation rules match documented constraints?
- Pagination/filtering behaves as documented?

## Quick Audit Pattern

```bash
# 1. Extract all documented public symbols
rg "^##\s+(GET|POST|PUT|DELETE|PATCH)\b" docs/api.md      # API routes
rg "^public function" app/                                  # Implementations

# 2. Cross-reference: for each documented endpoint, find the route+controller
php artisan route:list                                       # Verify wiring

# 3. For each mismatch: severity
#    Doc→Code gap (docs promise what code doesn't deliver) → HIGH
#    Code→Doc gap (code does what docs don't mention)        → MEDIUM
#    Type/contract mismatch (both exist, disagree)            → CRITICAL
```

## Severity Rules

| Gap | Severity | Action |
|-----|----------|--------|
| Documented endpoint missing route | CRITICAL | 500s in production |
| Documented parameter not handled | HIGH | Silent ignores |
| Return type mismatch (code stricter) | HIGH | Runtime errors |
| Return type mismatch (code looser) | MEDIUM | Security surface |
| Undocumented public method | MEDIUM | Discoverability |
| Stale doc example | LOW | Developer friction |

## Red Flags

- "The docs are out of date" — fix the gap, don't excuse it
- "It's just an internal API" — internal consumers need correctness too
- "The test covers it" — tests test code, not docs

## Resolution Pattern

```
Found gap → file issue with severity → fix whichever is wrong (code or docs)
                                        NEVER fix both simultaneously without
                                        tracking — you'll lose the thread
```

## Real-World Impact

- Doc→Code gaps caught before release: zero user-facing 500s from missing routes
- Contract mismatches caught in review: eliminates "but the docs say..." debates