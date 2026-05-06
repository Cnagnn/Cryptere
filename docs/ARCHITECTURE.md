# Architecture

This document describes the architectural decisions and patterns used in Crypter.

## Overview

Crypter is a server-side rendered SPA using the **Inertia.js** pattern: Laravel handles routing, authentication, and data; React renders the UI. No separate API layer — controllers return Inertia responses directly.

```
Browser ←→ Inertia ←→ Laravel Controllers ←→ Services ←→ Eloquent Models ←→ MySQL
                                                ↕
                                         Events / Jobs (async)
```

## Layered Architecture

### 1. HTTP Layer (Controllers)

Controllers are thin orchestrators. They:
- Authorize the request (via Policies)
- Delegate business logic to Services
- Return Inertia responses

Controllers are organized by domain:
- `Course/` — Learner-facing course interactions
- `Admin/` — Admin CRUD operations
- `Challenge/` — Challenge submissions and scoring
- `Assessment/` — Assessment taking and grading
- `Settings/` — User profile and security

### 2. Service Layer

Business logic lives in `app/Services/`. Each service is focused on a single domain:

| Service | Responsibility |
|---------|---------------|
| `XpService` | Award XP/points, apply streak multipliers, track daily goals |
| `StreakService` | Daily login streaks, bonus detection (first login, comeback, weekly) |
| `LevelService` | Level calculation from XP, progress tracking, bonus multipliers |
| `BadgeService` | Badge criteria evaluation, award logic, cache management |
| `LeaderboardService` | Rankings, timeframe queries, rank snapshots |
| `ChallengeScoreService` | Kahoot-style scoring (speed bonus, streak bonus) |
| `AssessmentGradingService` | Auto-grading MCQ, manual grading essays |
| `RubricScoringService` | Rubric-based scoring for essay questions |
| `MasteryService` | Learning mastery tracking per topic |
| `CourseDetailBuilder` | Builds course show page data payload |
| `CacheService` | Centralized cache key management and TTLs |
| `DailyChallengeService` | Daily challenge selection and rotation |

**Dashboard Builders** (`Services/Dashboard/`):
- `AdminDashboardBuilder` — Admin overview stats
- `LearnerDashboardBuilder` — Learner progress dashboard
- `LearnerStatsAggregator` — Aggregates learner statistics
- `AnalyticsBuilder` — Analytics page data
- `LearningPathBuilder` — Recommended learning paths

### 3. Model Layer

27 Eloquent models with:
- Proper relationships (belongsTo, hasMany, morphMany)
- Query scopes (`published()`, `active()`)
- Factories for testing (22 factories)
- Policies for authorization

### 4. Event System

Domain events decouple side effects:
- `XpAwarded` → Update leaderboard cache, check badge criteria
- `ChallengeSolved` → Award XP, update streak
- `LessonCompleted` → Update progress, check course completion
- `CourseCompleted` → Generate certificate eligibility
- `BadgeEarned` → Send notification
- `LeaderboardUpdated` → Broadcast via WebSocket

## Authentication

Uses **Laravel Fortify** (headless auth backend):
- Email/password registration and login
- Email verification
- Password reset
- Two-factor authentication (TOTP)
- Social OAuth via **Laravel Socialite** (Google, GitHub)

Frontend renders all auth UI — Fortify only provides routes and logic.

## Authorization

Four policies enforce access control:
- `CoursePolicy` — View published courses, admin-only create/update/delete
- `EnrollmentPolicy` — Enroll in published courses only
- `ChallengePolicy` — Access active challenges
- `AssessmentPolicy` — Attempt assessments within limits

Admin check: `User::isAdmin()` returns `$this->role === 'admin'`.

## Gamification System

```
Action (complete lesson, solve challenge)
    ↓
XpService::awardXpAndPoints(user, baseXp)
    ↓
├── XP = baseXp × streakMultiplier (for leveling)
├── Points = baseXp × levelBonus (for leaderboard)
├── trackDailyGoal() → bonus if target met
└── Event: XpAwarded
    ↓
BadgeService::checkAndAward() → evaluate criteria
LevelService → recalculate level from total XP
LeaderboardService → update rankings
```

### Streak Tiers

| Days | XP Multiplier | Daily XP |
|------|--------------|----------|
| 1-2 | 1.0× | 2 |
| 3-6 | 1.25× | 3 |
| 7-13 | 1.5× | 5 |
| 14-29 | 1.75× | 8 |
| 30+ | 2.0× | 12 |

### Level System

Levels are calculated from total XP using a quadratic formula. Each level grants a small point bonus multiplier for leaderboard earnings.

## Frontend Architecture

### Routing

All frontend routing uses **Wayfinder** — auto-generated TypeScript functions from Laravel routes:

```tsx
import { show } from '@/actions/Course/CourseController';

// Type-safe URL generation
<Link href={show.url({ course: slug })} />
```

Never hardcode URLs. Always import from `@/actions/` or `@/routes/`.

### Component System

UI built with **shadcn/ui** (Radix primitives + Tailwind):
- Components in `resources/js/components/`
- Pages in `resources/js/pages/`
- Layouts in `resources/js/layouts/`

### State Management

- Server state via Inertia props (no client-side fetching for page data)
- `useForm` for form submissions
- `useHttp` for standalone AJAX requests (Inertia v3)
- React Context for theme/layout state only

## Database Design

### Core Entities

```
User ──┬── Enrollment ── Course ── Lesson ── LessonTask ── QuizQuestion
       ├── ChallengeSubmission ── Challenge ── ChallengeQuestion
       ├── AssessmentSubmission ── Assessment ── AssessmentQuestion
       ├── Certificate
       ├── Badge (pivot)
       ├── DailyReward
       ├── Note
       ├── LabVisit
       └── SocialAccount
```

### Key Design Decisions

- **Soft deletes**: Not used (hard deletes with audit logging instead)
- **UUIDs**: Not used (auto-increment IDs for simplicity)
- **Timestamps**: All tables have `created_at`/`updated_at`
- **Indexes**: On all foreign keys + frequently queried columns (user_id, course_id, submitted_at)
- **JSON columns**: Used for quiz answers, rubric scores, badge criteria

## Caching Strategy

Managed by `CacheService` with defined TTLs:
- `TTL_SHORT` (60s) — User-specific data (daily XP, streak)
- `TTL_MEDIUM` (300s) — Shared data (course catalog, leaderboard)
- `TTL_LONG` (3600s) — Rarely changing data (badge definitions)

Cache invalidation happens via events and explicit `Cache::forget()` calls.

## Security

- **CSP**: Nonce-based Content Security Policy (no `unsafe-inline`)
- **Rate Limiting**: On auth endpoints, enrollment, quiz submission, daily rewards
- **HSTS**: Strict Transport Security enabled
- **Timing-safe**: Username/email enumeration prevention
- **XSS**: React's default escaping + CSP
- **CSRF**: Laravel's built-in token verification
- **SQL Injection**: Eloquent parameterized queries throughout

## Real-time

Laravel Reverb (WebSocket server) powers:
- Leaderboard position updates
- Badge earned notifications
- Achievement broadcasts

## Feature Flags

Laravel Pennant manages gradual rollouts:
- Class-based features in `app/Features/`
- Scoped to users or teams
- Database-backed storage

## Monitoring

Sentry integration for:
- Error tracking (PHP + JavaScript)
- Performance monitoring (transaction tracing)
- Custom spans in services (e.g., leaderboard queries)
