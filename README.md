# Crypter

A gamified e-learning platform built with Laravel 13 and React 19. Features course management, interactive quizzes, coding challenges, assessments with Bloom's taxonomy, XP/streak/badge gamification, and real-time leaderboards.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | PHP 8.4, Laravel 13, Fortify (auth), Pennant (feature flags), Reverb (WebSockets) |
| **Frontend** | React 19, TypeScript, Inertia.js v3, Tailwind CSS v4, shadcn/ui |
| **Database** | MySQL |
| **Testing** | Pest 4 (PHP), Vitest (JS), Playwright (E2E) |
| **Tooling** | Pint (PHP formatting), ESLint + Prettier (JS), Wayfinder (type-safe routing), Sentry (monitoring) |

## Prerequisites

- PHP 8.4+
- Composer 2.x
- Node.js 20+ with pnpm
- MySQL 8.0+

## Setup

```bash
# Clone and install everything (PHP deps, JS deps, key, migrations)
composer setup

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials
```

## Development

```bash
# Start Laravel server + queue worker + Vite dev server concurrently
composer dev
```

This runs:
- `php artisan serve` — Laravel on http://localhost:8000
- `php artisan queue:listen` — Queue worker for async jobs
- `npm run dev` — Vite HMR for frontend

## Testing

```bash
# PHP tests (Pest)
php artisan test --compact              # All tests
php artisan test --filter=CourseTest     # Filter by name
php artisan test tests/Unit             # Unit only
php artisan test tests/Feature          # Feature only

# JavaScript unit tests (Vitest)
npm run test:unit                       # Run once
npm run test:unit:watch                 # Watch mode
npm run test:unit:coverage              # With coverage

# E2E tests (Playwright)
npm run e2e                             # Headless
npm run e2e:headed                      # With browser UI

# Code quality
composer lint                           # PHP formatting (Pint)
npm run lint                            # ESLint fix
npm run format                          # Prettier fix
npm run types:check                     # TypeScript check
```

## Project Structure

```
app/
├── Actions/Fortify/       # Auth actions (register, update profile, etc.)
├── Concerns/              # Shared traits
├── Console/Commands/      # Artisan commands
├── Events/                # Domain events (XpAwarded, ChallengeSolved, etc.)
├── Features/              # Pennant feature flags
├── Http/
│   ├── Controllers/
│   │   ├── Admin/         # Admin CRUD (courses, lessons, tasks, assessments)
│   │   ├── Assessment/    # Assessment taking & submission
│   │   ├── Auth/          # Social OAuth
│   │   ├── Challenge/     # Coding challenges & submissions
│   │   ├── Course/        # Course catalog, enrollment, lessons, quizzes
│   │   ├── Lab/           # Interactive labs
│   │   └── Settings/      # User settings (profile, security, social)
│   └── Middleware/        # Security headers, streak tracking
├── Jobs/                  # Queued jobs (grading, notifications)
├── Models/                # 27 Eloquent models
├── Policies/              # Authorization (Course, Enrollment, Challenge, Assessment)
├── Providers/             # Service providers
└── Services/              # 29 business logic services
    └── Dashboard/         # Dashboard data builders (admin, learner, analytics)

resources/js/
├── components/            # Reusable React components (shadcn/ui based)
├── hooks/                 # Custom React hooks
├── layouts/               # Page layouts
├── lib/                   # Utilities, helpers
├── pages/                 # Inertia page components
└── types/                 # TypeScript type definitions

database/
├── factories/             # 22 model factories
├── migrations/            # 44 versioned migrations
└── seeders/               # Database seeders

tests/
├── Feature/               # HTTP integration tests
└── Unit/                  # Service & policy unit tests
```

## Key Features

- **Courses & Lessons** — Structured learning paths with video, PDF, and quiz tasks
- **Assessments** — Bloom's taxonomy-based assessments with rubric grading (auto + manual)
- **Challenges** — Timed coding challenges with Kahoot-style scoring
- **Gamification** — XP, levels, streaks, daily rewards, badges, leaderboards
- **Labs** — Interactive coding environments
- **Real-time** — WebSocket-powered leaderboard updates via Laravel Reverb
- **Feature Flags** — Gradual rollouts via Laravel Pennant

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## API Documentation

API docs are auto-generated via [Scramble](https://scramble.dedoc.co/). Access at `/docs/api` when the app is running.

## Code Style

- **PHP**: Laravel Pint (PSR-12 based). Run `composer lint` before committing.
- **TypeScript/React**: ESLint + Prettier. Run `npm run lint && npm run format`.
- **Routing**: Always use [Wayfinder](https://github.com/laravel/wayfinder) for frontend → backend routing. Import from `@/actions/` or `@/routes/`.

## Deployment

Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/) or any PHP hosting with:
- PHP 8.4+ with required extensions
- MySQL 8.0+
- Redis (recommended for cache/queue)
- Node.js for asset building

## License

MIT
