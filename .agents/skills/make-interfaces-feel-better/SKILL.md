---
name: make-interfaces-feel-better
description: Use when reviewing or improving UI polish — adding loading skeletons, empty states, error handling, transitions, optimistic updates, responsive edge cases, or accessibility fixes for React/Inertia applications
---

# Make Interfaces Feel Better

## Overview

**Core principle:** Every interface has three states — loading, empty, error — and most only handle the success state. Polish the other three and the UI transforms from "works" to "feels great."

## When to Use

- New feature UI before shipping
- Code review for frontend changes
- "This page feels janky" feedback
- Performance/UX audit pass

## The Four States Every View Must Handle

### 1. Loading

```tsx
// Bad: spinner in the middle
if (isLoading) return <Spinner />;

// Bad: nothing at all (flash of blank)
if (isLoading) return null;

// Good: skeleton that matches content shape
if (isLoading) return <TableSkeleton rows={10} cols={4} />;
```

**Rules:**
- Skeleton over spinner (reduces perceived wait)
- Match skeleton shape to content (avoid layout shift)
- Use Inertia's `usePoll` or React's `Suspense` for streaming when available

### 2. Empty

```tsx
// Bad: "No data" or blank page
if (items.length === 0) return <p>No items found.</p>;

// Good: illustration + context + primary CTA
if (items.length === 0) return (
  <EmptyState
    title="No invoices yet"
    description="Create your first invoice to start tracking payments."
    action={<Button href="/invoices/create">Create Invoice</Button>}
  />
);
```

**Rules:**
- Always show the primary action (don't make the user hunt for "Create" in the nav)
- Differentiate "no data exists" from "filter returned nothing" (offer "Clear filters" CTA)
- Animate the empty state in (fade-in, not instant)

### 3. Error

```tsx
// Bad: raw error message or nothing
if (error) return <p className="text-red-500">{error}</p>;

// Good: user-facing message + recovery action
if (error) return (
  <ErrorPanel
    title="Failed to load invoices"
    action={<Button onClick={reload}>Try again</Button>}
  />
);
```

**Rules:**
- Never show raw exception messages to users
- Always offer a recovery path (retry, go back, contact support)
- Distinguish transient (network) from permanent (404) errors
- Log the real error; show the user something useful

### 4. Success

This is the easy one — but verify:
- Data is sorted meaningfully (default sort)
- Dates/times are relative or localized
- Long text doesn't overflow (truncate with tooltip)

## Performance Feel

| Technique | When |
|-----------|------|
| Optimistic updates | Mutations (Inertia: form helper or `useHttp`) |
| Deferred props | Slow-loading page sections |
| Prefetch on hover | Navigation links in nav/sidebar |
| `IntersectionObserver` | Lazy-load images, infinite scroll |
| `startTransition` | Search/filter inputs (keep typing responsive) |

## Accessibility Checklist

- [ ] Every interactive element is keyboard-reachable (Tab)
- [ ] Focus is managed after modal open/close and page nav
- [ ] Loading state is announced to screen readers (`aria-busy`, `aria-live`)
- [ ] Error messages have `role="alert"` or live region
- [ ] Color is never the only indicator (add icons, text)
- [ ] Touch targets are ≥ 44px (mobile)

## Transitions (Tailwind v4)

```tsx
// Page transitions
<div className="transition-opacity duration-150 data-enter:opacity-0 data-enter:animate-in">
  {children}
</div>

// List enter/exit
<ul>
  {items.map(item => (
    <li key={item.id} className="animate-in fade-in slide-in-from-top-2 duration-200">
      {item.name}
    </li>
  ))}
</ul>
```

**Rules:**
- Keep transitions ≤ 200ms (feels instant, not laggy)
- Use `prefers-reduced-motion` — disable animations when set
- Only animate what changes (not the whole page)

## Quick Audit Script

For any view/page, check:
1. Pull the network cable — does it show loading or blank?
2. Clear all data — does it show empty state or "No data"?
3. Force a 500 — does it show error or crash?
4. Resize to 320px — does it break?
5. Tab through — can you reach everything?

**Five checks, two minutes each. Ten minutes total.**