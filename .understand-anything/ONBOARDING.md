# Crypter — Onboarding Guide

> A gamified cryptography learning platform with courses, lessons, challenges, assessments (Bloom's Taxonomy), labs, leaderboards, badges, certificates, daily rewards, and social authentication.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.4, Laravel 13 |
| Frontend | React 19, Inertia.js v3, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Testing | Pest (PHP), Playwright (E2E) |
| Real-time | Laravel Reverb (WebSockets) |
| Feature Flags | Laravel Pennant |
| Auth | Laravel Fortify + Socialite (GitHub, Google) |
| Build | Vite, pnpm |
| Database | MySQL |

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer                                     │
│  React pages, components, layouts, hooks (Inertia.js)   │
├─────────────────────────────────────────────────────────┤
│  Application Layer                                      │
│  Controllers, middleware, routes, form requests          │
├─────────────────────────────────────────────────────────┤
│  Domain Layer                                           │
│  Services, events, listeners, policies, jobs, commands  │
├─────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                   │
│  Eloquent models, migrations, factories, seeders, cache │
├─────────────────────────────────────────────────────────┤
│  Configuration Layer                                    │
│  Config files, build tooling (Vite)                     │
└─────────────────────────────────────────────────────────┘
```

### Presentation Layer
React pages, components, layouts, and hooks that render the UI via Inertia.js.

**Key files:**
- `resources/js/app.tsx` — Frontend entry point, Inertia init, layout assignment
- `resources/js/pages/` — All page components (dashboard, courses, labs, auth, admin, settings)
- `resources/js/layouts/` — AppLayout (authenticated), AuthLayout (login/register)
- `resources/js/components/app-sidebar.tsx` — Main navigation sidebar
- `resources/js/hooks/` — Custom hooks (leaderboard channel, 2FA)
- `resources/js/lib/lab-simulations.ts` — Client-side cipher logic (Caesar, Vigenère, etc.)

### Application Layer
Controllers, middleware, and route definitions that handle HTTP requests.

**Key files:**
- `routes/web.php` — All main routes (public, authenticated, admin)
- `routes/settings.php` — Settings routes (profile, security, social accounts)
- `app/Http/Controllers/` — Organized by domain (Course/, Assessment/, Challenge/, Lab/, Admin/, Settings/)
- `app/Http/Middleware/` — HandleInertiaRequests, CheckAdmin, SecurityHeaders, SetLocale

### Domain Layer
Business logic services, events, listeners, and scheduled commands.

**Key files:**
- `app/Services/XpService.php` — XP awarding logic
- `app/Services/LevelService.php` — Level progression
- `app/Services/BadgeService.php` — Achievement system
- `app/Services/AssessmentGradingService.php` — Bloom's Taxonomy grading
- `app/Services/AdaptiveQuestionService.php` — Adaptive question selection
- `app/Services/LeaderboardService.php` — Rankings + caching
- `app/Events/` — Domain events (XpAwarded, LessonCompleted, ChallengeSolved, etc.)
- `app/Features/` — Pennant feature flags
- `app/Jobs/` — Background processing (video/document conversion)

### Infrastructure Layer
Data persistence and cross-cutting concerns.

**Key files:**
- `app/Models/` — Eloquent models (User, Course, Lesson, Assessment, Badge, etc.)
- `database/migrations/` — Schema definitions
- `database/factories/` — Test factories
- `database/seeders/` — Content seeders (CaesarCipherCourseSeeder, BloomAssessmentsSeeder)
- `app/Services/CacheService.php` — Centralized caching
- `app/Services/AuditService.php` — Audit logging

### Configuration Layer
- `config/levels.php` — XP thresholds per level
- `config/rewards.php` — XP amounts for activities
- `config/fortify.php` — Auth features (2FA, email verification)
- `config/pennant.php` — Feature flag storage
- `config/reverb.php` — WebSocket server config
- `vite.config.ts` — Build config with Laravel, React, Wayfinder plugins

---

## Key Concepts

### Gamification System
- **XP (Experience Points)**: Awarded for completing lessons, solving challenges, daily logins. Configured in `config/rewards.php`.
- **Levels**: XP thresholds defined in `config/levels.php`. `LevelService` calculates current level.
- **Badges**: Achievement-based awards granted by `BadgeService` when criteria are met.
- **Leaderboard**: Real-time XP rankings broadcast via WebSocket (Reverb). Cached by `LeaderboardService`.
- **Daily Rewards**: Streak-based login rewards managed by `DailyRewardController`.
- **Point Decay**: Inactive users lose XP over time (`DecayInactivePoints` command).

### Bloom's Taxonomy Assessments
- Assessments are tiered by cognitive levels (Remember → Create)
- `AssessmentGradingService` scores submissions using Bloom's rubrics
- `AdaptiveQuestionService` selects questions based on user performance
- `MasteryService` tracks topic mastery progression

### Real-Time Leaderboard
- `LeaderboardUpdated` event broadcasts via Laravel Reverb
- Frontend subscribes via `useLeaderboardChannel` hook
- Controlled by `RealtimeLeaderboard` feature flag

### Feature Flags (Pennant)
- `GamificationRewardVariant` — A/B test reward amounts
- `IndonesianLocale` — Gradual locale rollout
- `RealtimeLeaderboard` — WebSocket leaderboard toggle
- Class-based flags in `app/Features/`

---

## Guided Tour

### 1. Entry Points — How Requests Flow In
All HTTP requests enter via `routes/web.php` (and `routes/settings.php`). The frontend boots from `resources/js/app.tsx` which initializes Inertia, resolves pages lazily, and assigns layouts.

### 2. Authentication — Fortify + Social Login
Laravel Fortify handles login, register, 2FA, password reset (configured in `FortifyServiceProvider`). Social OAuth (GitHub, Google) via `SocialAuthController` using Socialite. Auth pages in `resources/js/pages/auth/`.

### 3. Core Learning — Courses, Lessons, Tasks
The course system is the heart of Crypter. Courses contain Lessons → Tasks (read/code/video) + QuizQuestions. Users enroll, progress through tasks, complete lessons to earn XP.

### 4. Assessments — Bloom's Taxonomy Grading
Assessments tiered by Bloom's levels. `AssessmentGradingService` scores, `AdaptiveQuestionService` selects questions adaptively, `MasteryService` tracks mastery. Embedded in course detail pages.

### 5. Gamification — XP, Levels, Badges, Leaderboard
`XpService` → `LevelService` → `BadgeService` pipeline. Real-time leaderboard via Reverb WebSockets. Daily rewards encourage streaks.

### 6. Interactive Labs — Client-Side Crypto Simulations
Hands-on cipher practice. Logic runs client-side in `resources/js/lib/lab-simulations.ts` (Caesar, Vigenère, etc.). `LabVisit` tracks engagement.

### 7. Admin Panel — Content Management
CRUD for courses, lessons, tasks, assessments, users. Protected by `CheckAdmin` middleware. Pages in `resources/js/pages/admin/`.

### 8. Real-Time & Events — Broadcasting Architecture
Domain events → listeners → broadcast. `LeaderboardUpdated` consumed by `useLeaderboardChannel` hook via Reverb.

### 9. Feature Flags & Experiments
Pennant manages flags. `ExperimentService` wraps for A/B testing. Class-based flags in `app/Features/`.

### 10. Background Jobs & Scheduled Commands
Queue jobs: video/document conversion. Scheduled: daily challenge rotation, point decay, decay warnings.

---

## Getting Started

### Prerequisites
- PHP 8.4+
- Composer
- Node.js 20+ with pnpm
- MySQL

### Setup

```bash
# Clone and enter project
cd Crypter

# One-step setup (installs PHP + JS deps, generates key, runs migrations)
composer setup

# Start development server (Laravel + queue + Vite concurrently)
composer dev
```

### Environment
- Copy `.env.example` to `.env` if not done by setup
- Configure MySQL credentials in `.env`
- Social auth requires `GITHUB_CLIENT_ID`, `GOOGLE_CLIENT_ID` etc.

### Generate TypeScript Route Types
```bash
npm run types
# or: php artisan wayfinder:generate
```

Run this whenever routes or controllers change.

---

## File Map

| Domain | Key Files |
|--------|-----------|
| **Routes** | `routes/web.php`, `routes/settings.php`, `routes/channels.php` |
| **Auth** | `app/Providers/FortifyServiceProvider.php`, `app/Actions/Fortify/`, `app/Http/Controllers/Auth/SocialAuthController.php` |
| **Courses** | `app/Http/Controllers/Course/`, `app/Models/Course.php`, `app/Models/Lesson.php`, `app/Models/LessonTask.php` |
| **Assessments** | `app/Http/Controllers/Assessment/`, `app/Services/AssessmentGradingService.php`, `app/Services/AdaptiveQuestionService.php` |
| **Challenges** | `app/Http/Controllers/Challenge/`, `app/Models/Challenge.php`, `app/Services/ChallengeScoreService.php` |
| **Gamification** | `app/Services/XpService.php`, `app/Services/LevelService.php`, `app/Services/BadgeService.php`, `config/rewards.php`, `config/levels.php` |
| **Leaderboard** | `app/Services/LeaderboardService.php`, `app/Events/LeaderboardUpdated.php`, `resources/js/hooks/useLeaderboardChannel.ts` |
| **Labs** | `app/Http/Controllers/Lab/LabController.php`, `resources/js/lib/lab-simulations.ts` |
| **Admin** | `app/Http/Controllers/Admin/`, `resources/js/pages/admin/` |
| **Feature Flags** | `app/Features/`, `app/Services/ExperimentService.php`, `config/pennant.php` |
| **Frontend Entry** | `resources/js/app.tsx`, `resources/js/layouts/`, `resources/js/components/app-sidebar.tsx` |
| **Types** | `resources/js/types/index.ts` |
| **Config** | `config/levels.php`, `config/rewards.php`, `config/fortify.php`, `config/reverb.php` |

---

## Complexity Hotspots

These files have high complexity — approach carefully, understand context before modifying:

| File | Why Complex |
|------|-------------|
| `routes/web.php` | All route definitions — many controllers, middleware groups, nested resources |
| `app/Http/Controllers/Course/CourseController.php` | Course listing + detail with lessons, tasks, quizzes, assessments |
| `app/Http/Controllers/Assessment/AssessmentSubmissionController.php` | Start/save/submit flow with grading and adaptive logic |
| `app/Http/Controllers/Admin/CourseController.php` | Full CRUD + reorder + publish toggle |
| `app/Services/AssessmentGradingService.php` | Bloom's Taxonomy rubric-based grading |
| `app/Services/AdaptiveQuestionService.php` | Performance-based question selection algorithm |
| `app/Services/Dashboard/LearningPathBuilder.php` | Personalized recommendations from progress + mastery |
| `app/Models/User.php` | Many relationships (enrollments, badges, social, certificates, gamification) |
| `resources/js/pages/dashboard.tsx` | Stats, progress, activity, quick actions |
| `resources/js/pages/courses/show.tsx` | Course detail with lessons, tasks, quizzes, embedded assessments |
| `resources/js/pages/labs/show.tsx` | Interactive cipher simulation UI |
| `resources/js/pages/settings/security.tsx` | Password + 2FA management |
| `resources/js/pages/admin/courses/index.tsx` | Admin CRUD interface |
| `resources/js/lib/lab-simulations.ts` | Multiple cipher algorithms client-side |
| `database/seeders/CaesarCipherCourseSeeder.php` | Complete course content seeding |
| `database/seeders/BloomAssessmentsSeeder.php` | Tiered assessment content seeding |

---

## Testing

### Run All Tests
```bash
php artisan test --compact
```

### Filter Specific Tests
```bash
php artisan test --compact --filter=CourseTest
```

### Create New Tests
```bash
# Feature test (default)
php artisan make:test CourseEnrollmentTest --pest

# Unit test
php artisan make:test XpCalculationTest --pest --unit
```

### E2E Tests (Playwright)
```bash
npm run e2e           # headless
npm run e2e:headed    # with browser UI
```

### Code Style
```bash
# PHP (Pint)
composer lint

# Frontend (Prettier + ESLint)
npm run format
npm run lint
```

---

## Common Workflows

### Adding a New Feature
1. Create migration: `php artisan make:migration`
2. Create model + factory: `php artisan make:model --factory`
3. Create controller: `php artisan make:controller`
4. Add routes in `routes/web.php`
5. Create React page in `resources/js/pages/`
6. Generate types: `npm run types`
7. Write tests: `php artisan make:test --pest`
8. Run Pint: `composer lint`

### Working with Feature Flags
1. Create class in `app/Features/`
2. Check with `Feature::active(YourFlag::class)`
3. Test with Pennant's testing helpers

### Real-Time Updates
1. Create broadcast event extending `ShouldBroadcast`
2. Define channel in `routes/channels.php`
3. Subscribe in React with Echo/Reverb hook

---

*Generated from knowledge graph on 2026-05-06*
