# Cryptere Project Improvement Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fix 53 failing tests, reduce frontend bundle bloat, improve DevOps readiness, and harden database schema management for the Cryptere LMS platform.

**Architecture:** Laravel 13 + Inertia v3 + React 19 multi-domain LMS with gamification. Backend uses service layer pattern (XpService, LevelService, StreakService), Spatie permissions for RBAC, Fortify for auth with multi-domain routing. Frontend uses Radix UI + shadcn components with Vite code splitting.

**Tech Stack:** PHP 8.4, Laravel 13, Inertia v3, React 19, TypeScript 5.7, Tailwind v4, Vite 7, Pest v4, Playwright, MySQL (prod) / SQLite (test)

---

## Current State Summary

| Area                  | Score | Status                                    |
|-----------------------|-------|-------------------------------------------|
| Backend Code Quality  | 9/10  | Excellent service layer, clean models     |
| Frontend Code Quality | 8/10  | Modern stack, but oversized components    |
| Testing               | 7/10  | 311 passed / 53 failed (364 total)        |
| Database              | 7/10  | 60+ migrations, no schema dump            |
| Security              | 9/10  | CSP nonce, HSTS, rate limiting, RBAC      |
| Performance           | 7/10  | Good caching, but no Octane/response cache|
| DevOps                | 6/10  | Has CI workflows, but no Docker           |
| **Overall**           | **7.6** | Production-ready with improvement areas  |

---

## Phase 1: Fix Failing Tests (CRITICAL — 53 failures)

### Root Cause Analysis

**Root cause #1 (majority of failures):** `phpunit.xml` does not set `APP_URL`, `AUTH_URL`, or `APP_HOME_URL`. The app's `config/app.php` extracts domain hosts from these env vars and assigns them to `config('app.domains.auth')`. Fortify's `config/fortify.php` sets `'domain' => config('app.domains.auth')`. Without env vars in phpunit.xml, the domain resolves to `127.0.0.1` (from default `APP_URL=http://127.0.0.1:8000`). Test requests like `$this->get('/login')` send `Host: localhost` or `Host: 127.0.0.1`, but Symfony's domain matcher strips ports and is strict about the host — so Fortify routes (bound to domain `127.0.0.1`) are not matched when the request comes from `localhost`. Additionally, `config/app.php` has a local-env bypass (`env('APP_ENV') === 'local'`) that nulls out domains, but `APP_ENV=testing` in phpunit.xml does NOT trigger this bypass — so domains stay active and block route resolution.

**Root cause #2 (2 failures):** `LevelServiceTest` has wrong test assumptions — test expects XP=56 to be the level 2 boundary, but actual boundary is XP=50 (per `config/levels.php`). At XP=56, progress = (56-50)/(63-50)*100 = 46.2%, not 0%.

**Root cause #3 (some failures):** `FortifyCrossDomainRedirectTest` manually sets multi-domain env vars and calls `$this->refreshApplication()`, but the test's `afterEach` env restoration has a bug — `putenv($value === null ? $key : "{$key}={$value}")` calls `putenv('APP_URL')` (no `=`) when value is null, which unsets the var. But the original `APP_ENV` from phpunit.xml is `testing`, and the test sets it to nothing — leaving the app in a stale state for subsequent tests.

### Task 1.1: Fix phpunit.xml — add domain env vars

**Objective:** Ensure Fortify routes resolve correctly in test environment by setting APP_URL and related env vars.

**Files:**
- Modify: `phpunit.xml:20-34` (the `<php>` block)

**Step 1: Add env vars to phpunit.xml**

Add these lines inside the `<php>` block, before the closing `</php>` tag:

```xml
<env name="APP_ENV" value="testing"/>
<env name="APP_URL" value="http://127.0.0.1:8000"/>
<env name="AUTH_URL" value="http://127.0.0.1:8000"/>
<env name="APP_HOME_URL" value="http://127.0.0.1:8000/dashboard"/>
<env name="APP_MAINTENANCE_DRIVER" value="file"/>
<!-- ... existing envs ... -->
```

**Step 2: Verify the fix resolves route resolution**

Run: `php artisan test --compact --filter="login page renders"`
Expected: PASS

**Step 3: Run full auth test suite**

Run: `php artisan test --compact --filter="AuthenticationTest"`
Expected: All 7 tests PASS

**Step 4: Commit**

```bash
git add phpunit.xml
git commit -m "test: fix phpunit.xml env vars for multi-domain route resolution

Fortify routes require APP_URL/AUTH_URL to be set so config('app.domains.auth')
resolves correctly. Without these, domain-based routing blocks route resolution
in test environment."
```

---

### Task 1.2: Fix LevelServiceTest — correct boundary assumptions

**Objective:** Fix 2 unit test failures caused by incorrect XP boundary assumptions.

**Files:**
- Modify: `tests/Unit/Services/LevelServiceTest.php:31-35` (progress boundary test)
- Modify: `tests/Unit/Services/LevelServiceTest.php:44-49` (checkLevelUp test)

**Step 1: Fix progress boundary test**

The test uses XP=56 expecting it to be the level 2 boundary. Actual boundary is XP=50 (from `config/levels.php`: level 2 min_xp=50, level 3 min_xp=63).

Replace:
```php
test('progress is 0 at level boundary', function () {
    $result = $this->service->getLevelForXp(56); // exact level 2 boundary

    expect($result['progress'])->toBe(0.0);
});
```

With:
```php
test('progress is 0 at level boundary', function () {
    $result = $this->service->getLevelForXp(50); // exact level 2 boundary

    expect($result['level'])->toBe(2);
    expect($result['progress'])->toBe(0.0);
});
```

**Step 2: Fix checkLevelUp test**

The test uses XP 50→60 expecting a level change. At XP=50: level 2 (min_xp=50). At XP=60: still level 2 (level 3 min_xp=63). No level change occurs.

Replace:
```php
test('checkLevelUp detects level increase', function () {
    $result = $this->service->checkLevelUp(50, 60); // level 1 → level 3

    expect($result)->not->toBeNull();
    expect($result['level'])->toBeGreaterThan(1);
});
```

With:
```php
test('checkLevelUp detects level increase', function () {
    $result = $this->service->checkLevelUp(49, 63); // level 1 → level 3

    expect($result)->not->toBeNull();
    expect($result['level'])->toBe(3);
});
```

**Step 3: Run the tests**

Run: `php artisan test --compact --filter="LevelServiceTest"`
Expected: All 9 tests PASS

**Step 4: Commit**

```bash
git add tests/Unit/Services/LevelServiceTest.php
git commit -m "test: fix LevelServiceTest boundary assumptions

XP=56 is not level 2 boundary (actual: 50). XP 50→60 stays in level 2.
Fix to use correct values from config/levels.php."
```

---

### Task 1.3: Run full test suite and verify all green

**Objective:** Confirm all 364 tests pass after fixes.

**Step 1: Run full suite**

Run: `php artisan test --compact`
Expected: 364 passed, 0 failed

**Step 2: If any failures remain, triage by category**

```bash
php artisan test --compact 2>&1 | grep "FAILED" | sort
```

**Step 3: Commit any additional fixes**

```bash
git add -A
git commit -m "test: resolve remaining test failures"
```

---

## Phase 2: Frontend Cleanup & Bundle Optimization

### Task 2.1: Split admin/courses/index.tsx (4393 lines)

**Objective:** Break down the 4393-line monolithic admin courses page into smaller, maintainable components.

**Files:**
- Modify: `resources/js/pages/admin/courses/index.tsx` (4393 lines)
- Create: `resources/js/pages/admin/courses/components/course-form.tsx`
- Create: `resources/js/pages/admin/courses/components/course-list.tsx`
- Create: `resources/js/pages/admin/courses/components/course-dialog.tsx`
- Create: `resources/js/pages/admin/courses/components/lesson-manager.tsx`
- Create: `resources/js/pages/admin/courses/components/task-manager.tsx`
- Create: `resources/js/pages/admin/courses/components/assessment-manager.tsx`

**Approach:**
1. Read the full file to identify component boundaries (dialog sections, tab panels, form sections)
2. Extract each major section into its own component file
3. Keep the main `index.tsx` as a thin orchestrator that composes the sub-components
4. Move shared types to `resources/js/types/course-management.ts` (already exists)
5. Ensure all imports resolve correctly

**Verification:**
Run: `pnpm run types:check && pnpm run lint:check && pnpm run build`
Expected: All pass with no errors

---

### Task 2.2: Split courses/show.tsx (3481 lines)

**Objective:** Break down the 3481-line course detail page.

**Files:**
- Modify: `resources/js/pages/courses/show.tsx` (3481 lines)
- Create: `resources/js/pages/courses/components/course-header.tsx`
- Create: `resources/js/pages/courses/components/lesson-list.tsx`
- Create: `resources/js/pages/courses/components/lesson-content.tsx`
- Create: `resources/js/pages/courses/components/quiz-panel.tsx`
- Create: `resources/js/pages/courses/components/assessment-panel.tsx`
- Create: `resources/js/pages/courses/components/task-viewer.tsx`

**Approach:** Same as Task 2.1 — identify boundaries, extract, compose.

**Verification:**
Run: `pnpm run types:check && pnpm run lint:check && pnpm run build`
Expected: All pass

---

### Task 2.3: Split dashboard.tsx (2608 lines)

**Objective:** Break down the 2608-line dashboard page.

**Files:**
- Modify: `resources/js/pages/dashboard.tsx` (2608 lines)
- Create: `resources/js/pages/dashboard/components/learner-dashboard.tsx`
- Create: `resources/js/pages/dashboard/components/admin-dashboard.tsx`
- Create: `resources/js/pages/dashboard/components/stats-cards.tsx`
- Create: `resources/js/pages/dashboard/components/recent-activity.tsx`
- Create: `resources/js/pages/dashboard/components/earnings-chart.tsx`
- Create: `resources/js/pages/dashboard/components/streak-tracker.tsx`

**Verification:**
Run: `pnpm run types:check && pnpm run lint:check && pnpm run build`
Expected: All pass

---

### Task 2.4: Audit and remove redundant UI dependencies

**Objective:** Eliminate overlapping UI libraries to reduce bundle size.

**Files:**
- Modify: `package.json`

**Analysis:**
The project uses both `@headlessui/react` and `@radix-ui/*` for similar primitives (Dialog, Popover, etc.). Pick one and migrate.

**Decision required:**
- Option A: Keep Radix (more granular, already has 16+ packages) — remove @headlessui/react
- Option B: Keep HeadlessUI (simpler, fewer packages) — remove @radix-ui/* (big migration)

**Recommended:** Option A (keep Radix) — it's already the dominant UI primitive library in the project, and shadcn is built on Radix.

**Steps:**
1. Search for all `@headlessui/react` imports: `grep -r "@headlessui/react" resources/js/`
2. For each usage, find the equivalent Radix component
3. Migrate each component
4. Remove `@headlessui/react` from package.json
5. Run: `pnpm install && pnpm run build`
6. Verify bundle size reduction

**Verification:**
Run: `pnpm run build && du -sh public/build/assets/*.js | sort -rh | head -10`
Expected: Build succeeds, bundle size reduced

---

### Task 2.5: Enable Wayfinder Vite plugin

**Objective:** Re-enable the Wayfinder Vite plugin that is currently commented out.

**Files:**
- Modify: `vite.config.ts:59-61`

**Step 1: Uncomment the wayfinder plugin**

Replace:
```typescript
// wayfinder({
//     formVariants: true,
// }),
```

With:
```typescript
wayfinder({
    formVariants: true,
}),
```

**Step 2: Verify build**

Run: `pnpm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "chore: enable Wayfinder Vite plugin for form variants"
```

---

## Phase 3: Database Schema Management

### Task 3.1: Generate schema dump for faster test CI

**Objective:** Squash 60+ migrations into a schema dump for faster CI and fresh installs.

**Files:**
- Create: `database/schema/mysql-schema.sql` (auto-generated)
- Create: `database/schema/sqlite-schema.sql` (auto-generated)

**Step 1: Generate schema dumps**

Run:
```bash
php artisan schema:dump --database=mysql
php artisan schema:dump --database=sqlite
```

This creates schema dump files and marks migrations as migrated without running them.

**Step 2: Verify test suite still passes**

Run: `php artisan test --compact`
Expected: 364 passed, 0 failed

**Step 3: Commit**

```bash
git add database/schema/
git commit -m "chore: add schema dump for faster CI and fresh installs

60+ migrations squashed into schema dumps. New installs skip migration
replay and load schema directly."
```

---

### Task 3.2: Audit migration files for cleanup candidates

**Objective:** Identify migrations that can be safely removed or consolidated.

**Files:**
- Review: `database/migrations/2026_05_03_*.php` (batch migration files)
- Review: `database/migrations/2026_05_04_*.php` (fix/patch migrations)
- Review: `database/migrations/2026_05_20_*.php` (drop column migrations)

**Analysis:**
These migration patterns suggest iterative schema churn:
- `add_missing_columns_batch_1` + `create_missing_tables_batch_2` + `add_all_missing_schema_columns` — should be consolidated
- `add_estimated_minutes_to_lesson_tasks` followed by `remove_minutes_from_lesson_tasks` + `drop_estimated_minutes_from_lesson_tasks` — add-then-remove cycle
- `add_correct_option_to_quiz_questions` + `fix_quiz_questions_foreign_key` — fix-up migration

**Action:**
After schema dump (Task 3.1), these migrations are skipped on fresh installs. For existing production databases, they must remain. No file deletion needed — the schema dump handles the optimization.

**Document the migration history** in a comment at the top of the schema dump file for reference.

---

## Phase 4: DevOps & Infrastructure

### Task 4.1: Create Dockerfile for development

**Objective:** Provide consistent development environment via Docker.

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `docker/nginx.conf`
- Create: `docker/php.ini`

**Dockerfile:**
```dockerfile
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    git curl libpng-dev oniguruma-dev libxml2-dev zip unzip \
    mysql-client redis

RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-interaction --optimize-autoloader

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apk add --no-cache nodejs npm

RUN npm install -g pnpm && pnpm install --frozen-lockfile

EXPOSE 9000

CMD ["php-fpm"]
```

**docker-compose.yml:**
```yaml
services:
  app:
    build: .
    volumes:
      - .:/var/www/html
    ports:
      - "9000:9000"
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: cryptere
      MYSQL_ROOT_PASSWORD: secret
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - .:/var/www/html
      - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app

volumes:
  mysql-data:
```

**Verification:**
Run: `docker-compose up -d && docker-compose exec app php artisan test --compact`
Expected: All tests pass

---

### Task 4.2: Update CI workflow — add Pint format check

**Objective:** Ensure CI catches formatting issues before merge.

**Files:**
- Modify: `.github/workflows/lint.yml:54-55`

**Current:** CI runs `composer lint` which runs `pint --parallel` (auto-fixes). This mutates files in CI rather than checking.

**Fix:** Change to `composer lint:check` which runs `pint --parallel --test` (check-only, no auto-fix).

Replace:
```yaml
- name: Run Pint
  run: composer lint
```

With:
```yaml
- name: Check Pint
  run: composer lint:check
```

**Verification:**
Push to a branch and verify CI runs the check-only mode.

---

### Task 4.3: Add security audit to CI

**Objective:** Ensure dependency vulnerabilities are caught in CI.

**Files:**
- Modify: `.github/workflows/tests.yml` (add audit step to ci job)

**Note:** The tests.yml already has a Security Audit step at line 84-87. Verify it's comprehensive:

```yaml
- name: Security Audit
  run: |
    composer audit
    pnpm audit --prod || true
```

**Improvement:** Change `pnpm audit --prod || true` to fail on high/critical:

```yaml
- name: Security Audit
  run: |
    composer audit
    pnpm audit --prod --audit-level=high
```

**Verification:**
CI should fail if high/critical vulnerabilities are found.

---

### Task 4.4: Update composer.json project name

**Objective:** Change project name from starter kit to actual project name.

**Files:**
- Modify: `composer.json:3` (line 3)

Replace:
```json
"name": "laravel/react-starter-kit",
```

With:
```json
"name": "cnagnn/cryptere",
```

**Step 1: Commit**

```bash
git add composer.json
git commit -m "chore: update composer.json project name to cryptere"
```

---

## Phase 5: Performance Optimizations

### Task 5.1: Add response cache for public pages

**Objective:** Cache public landing page and legal pages for faster response times.

**Files:**
- Modify: `routes/web.php:54-56` (welcome page route)
- Modify: `routes/web.php:88-89` (terms/privacy routes)
- Modify: `app/Http/Middleware/PublicPageCacheHeaders.php` (already exists — verify config)

**Approach:**
1. Review the existing `PublicPageCacheHeaders` middleware
2. Ensure it sets appropriate `Cache-Control` headers for public pages
3. Consider adding `Cache-Control: public, max-age=300, s-maxage=600` for landing page
4. Add ETag support for legal pages

**Verification:**
```bash
curl -I http://127.0.0.1:8000/
# Should include Cache-Control header
```

---

### Task 5.2: Add eager loading audit

**Objective:** Prevent N+1 queries in frequently accessed pages.

**Files:**
- Review: `app/Http/Controllers/DashboardController.php`
- Review: `app/Http/Controllers/Course/CourseController.php`
- Review: `app/Services/Dashboard/LearnerDashboardBuilder.php`
- Review: `app/Services/CourseDetailBuilder.php`

**Approach:**
1. Enable Laravel Debugbar or Telescope in local
2. Navigate to each major page (dashboard, courses, course detail, leaderboard)
3. Identify N+1 queries
4. Add `with()` eager loading where needed
5. Add query count assertions to feature tests

**Verification:**
Run: `php artisan test --compact --filter="DashboardTest"`
Expected: All pass, no N+1 warnings

---

### Task 5.3: Add database query count to tests

**Objective:** Prevent N+1 regressions by asserting max query counts in tests.

**Files:**
- Modify: `tests/Feature/DashboardTest.php` (add query count assertions)
- Modify: `tests/Feature/CourseTest.php` (add query count assertions)

**Example:**
```php
test('dashboard does not produce N+1 queries', function () {
    $user = User::factory()->create();

    DB::enableQueryLog();
    $this->actingAs($user)->get('/dashboard');
    $queryCount = count(DB::getQueryLog());

    expect($queryCount)->toBeLessThan(20); // Adjust threshold as needed
});
```

**Verification:**
Run: `php artisan test --compact --filter="N+1"`
Expected: PASS

---

## Phase 6: Code Quality Hardening

### Task 6.1: Add strict_types to all PHP files

**Objective:** Ensure type safety across all PHP files.

**Files:**
- All files in `app/` directory

**Approach:**
1. Run: `grep -rL "declare(strict_types=1)" app/ --include="*.php" | head -20`
2. Add `declare(strict_types=1);` after the opening `<?php` tag for each file missing it
3. Run Pint to format: `vendor/bin/pint --dirty --format agent`
4. Run tests to verify no type errors: `php artisan test --compact`

**Verification:**
Run: `grep -rL "declare(strict_types=1)" app/ --include="*.php" | wc -l`
Expected: 0

---

### Task 6.2: Add PHPStan static analysis

**Objective:** Catch type errors and bugs before runtime.

**Files:**
- Modify: `composer.json` (add phpstan dependency)
- Create: `phpstan.neon`

**Note:** This requires user approval to add a new dependency (per AGENTS.md: "Do not change the application's dependencies without approval").

**Step 1: Ask user for approval**

**Step 2 (if approved): Install PHPStan**
```bash
composer require --dev larastan/larastan
```

**Step 3: Create phpstan.neon**
```yaml
includes:
    - vendor/larastan/larastan/larastan.neon
parameters:
    paths:
        - app/
    level: 6
    checkMissingIterableValueType: false
```

**Step 4: Run and fix issues**
```bash
./vendor/bin/phpstan analyse --memory-limit=2G
```

**Step 5: Add to CI**
Add a PHPStan step to `.github/workflows/lint.yml`.

---

### Task 6.3: Add React Error Boundary

**Objective:** Prevent white-screen crashes on frontend errors.

**Files:**
- Create: `resources/js/components/error-boundary.tsx`
- Modify: `resources/js/app.tsx` (wrap app in ErrorBoundary)

**error-boundary.tsx:**
```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught:', error, errorInfo);
        Sentry.captureException(error);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Something went wrong</h1>
                        <p className="mt-2 text-muted-foreground">
                            {this.state.error?.message}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
```

**Verification:**
Run: `pnpm run types:check && pnpm run build`
Expected: PASS

---

## Phase 7: Documentation & Developer Experience

### Task 7.1: Create .env.example

**Objective:** Document all required environment variables for new developers.

**Files:**
- Create: `.env.example`

**Content:** Based on `config/app.php` and other config files, document all env vars:
```env
APP_NAME=Cryptere
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
AUTH_URL=http://127.0.0.1:8000
APP_HOME_URL=http://127.0.0.1:8000/dashboard

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cryptere
DB_USERNAME=root
DB_PASSWORD=

# ... (full list from config files)
```

**Note:** The CI workflow at `.github/workflows/tests.yml:76` does `cp .env.example .env` — so this file MUST exist for CI to pass. If it's missing, CI is currently broken. Verify this.

---

### Task 7.2: Update README with setup instructions

**Objective:** Provide clear onboarding for new developers.

**Files:**
- Modify: `README.md`

**Content:**
- Project overview
- Requirements (PHP 8.4, Node 22, MySQL 8, pnpm)
- Setup: `composer setup` (one-step)
- Dev: `composer dev`
- Test: `php artisan test --compact`
- E2E: `npm run e2e`
- Lint: `composer lint` + `pnpm run lint`
- Build: `pnpm run build`
- Deployment: cPanel git pull workflow

---

## Priority Order

1. **Phase 1** (CRITICAL) — Fix 53 failing tests. Blocks everything.
2. **Phase 4.4** (QUICK WIN) — Update composer.json name. 1 line.
3. **Phase 2.5** (QUICK WIN) — Enable Wayfinder plugin. 3 lines.
4. **Phase 3.1** — Schema dump. Big CI speedup.
5. **Phase 2.1-2.3** — Split oversized frontend files. Maintenance nightmare.
6. **Phase 4.1** — Docker. Dev consistency.
7. **Phase 4.2-4.3** — CI improvements.
8. **Phase 5.1-5.3** — Performance.
9. **Phase 6.1-6.3** — Code quality.
10. **Phase 7.1-7.2** — Documentation.

---

## Risks & Tradeoffs

| Risk | Mitigation |
|------|------------|
| Splitting frontend files may introduce subtle bugs | Run E2E tests after each split; use TypeScript to catch type errors |
| Schema dump may diverge from migrations | Keep migrations in repo; dump is optimization only |
| Docker adds complexity | Make it optional — `composer dev` still works without Docker |
| PHPStan may surface many issues | Start at level 5, gradually increase; only fix new code first |
| Removing @headlessui/react may break components | Audit all usages first; migrate one component at a time |

## Open Questions

1. Should we keep both `@headlessui/react` and `@radix-ui/*`, or migrate to one?
2. Is adding PHPStan/Larastan approved as a new dev dependency?
3. Should Docker be the primary dev environment, or stay optional?
4. Is there a deployment pipeline beyond "cPanel git pull" that needs documenting?
5. Are there plans to add Laravel Octane for performance?
