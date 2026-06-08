# Laravel Echo + Pusher Real-time Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace HTTP polling with WebSocket-based real-time updates using Laravel Echo + Pusher for comprehensive dashboard and profile updates.

**Architecture:** Backend broadcasts events via Pusher when data changes. Frontend subscribes via Laravel Echo, updates Inertia state, and shows appropriate UI feedback (toast/animation/silent). Smart adaptive polling as fallback when WebSocket fails.

**Tech Stack:** Laravel Broadcasting, Pusher, Laravel Echo, pusher-js, Sonner (toast), Framer Motion (animations), React hooks

---

## File Structure Overview

### Backend Files
**New:**
- `app/Events/Dashboard/AcademyDataUpdated.php` - Academy stats broadcast
- `app/Events/Dashboard/UserStatsUpdated.php` - XP, points, level updates
- `app/Events/Dashboard/BadgeUnlocked.php` - Badge achievements
- `app/Events/Dashboard/LevelUp.php` - Level milestones
- `app/Events/Dashboard/StreakUpdated.php` - Streak changes
- `app/Events/Dashboard/CourseProgressUpdated.php` - Course completion
- `app/Events/Dashboard/RankChanged.php` - Leaderboard position
- `app/Events/Profile/PublicProfileUpdated.php` - Public profile data
- `app/Observers/BadgeUserObserver.php` - Badge unlock observer

**Modified:**
- `app/Observers/UserObserver.php` - Add level up and stats events
- `app/Services/Dashboard/LearnerDashboardBuilder.php` - Dispatch academy updates
- `routes/channels.php` - Channel authorization

### Frontend Files
**New:**
- `resources/js/lib/echo.ts` - Echo client setup
- `resources/js/hooks/use-realtime.ts` - Real-time subscription hook
- `resources/js/hooks/use-smart-polling.ts` - Adaptive fallback polling
- `resources/js/hooks/use-connection-monitor.ts` - Connection state tracking

**Modified:**
- `resources/js/pages/dashboard.tsx` - Replace usePoll with useRealtime
- `resources/js/app.tsx` - Import echo initialization
- `package.json` - Add dependencies

### Configuration Files
**Modified:**
- `.env.example` - Add Pusher variables
- `routes/channels.php` - Add channel authorization

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install npm packages**

```bash
npm install laravel-echo pusher-js framer-motion
```

Expected output: Packages installed successfully

- [ ] **Step 2: Verify installations**

```bash
npm list laravel-echo pusher-js framer-motion
```

Expected: All three packages listed with versions

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install laravel-echo, pusher-js, and framer-motion"
```

---

## Task 2: Configure Backend Broadcasting

**Files:**
- Modify: `.env.example`
- Modify: `routes/channels.php`

- [ ] **Step 1: Add Pusher variables to .env.example**

```bash
# Add after existing broadcast config
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_APP_CLUSTER=ap1
```

- [ ] **Step 2: Update routes/channels.php**

```php
<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('user.{userId}.public', function ($user, $userId) {
    return true; // Anyone can subscribe to public profile
});

Broadcast::channel('leaderboard', function ($user) {
    return true; // Anyone can subscribe
});
```

- [ ] **Step 3: Commit**

```bash
git add .env.example routes/channels.php
git commit -m "config: add pusher config and channel authorization"
```

---

## Task 3: Create Base Event Classes

**Files:**
- Create: `app/Events/Dashboard/AcademyDataUpdated.php`
- Create: `app/Events/Dashboard/UserStatsUpdated.php`

- [ ] **Step 1: Create AcademyDataUpdated event**

```php
<?php

namespace App\Events\Dashboard;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AcademyDataUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly array $academyData,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'academy.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'academy' => $this->academyData,
        ];
    }
}
```

- [ ] **Step 2: Create UserStatsUpdated event**

```php
<?php

namespace App\Events\Dashboard;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserStatsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly int $xp,
        public readonly int $points,
        public readonly int $level,
        public readonly ?int $streak = null,
        public readonly ?int $enrolledCourses = null,
        public readonly ?int $completedCourses = null,
        public readonly ?int $completedLessons = null,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'stats.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'xp' => $this->xp,
            'points' => $this->points,
            'level' => $this->level,
            'streak' => $this->streak,
            'enrolledCourses' => $this->enrolledCourses,
            'completedCourses' => $this->completedCourses,
            'completedLessons' => $this->completedLessons,
        ];
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/Events/Dashboard/
git commit -m "feat: add academy and user stats broadcast events"
```

---

## Task 4: Create Achievement Events

**Files:**
- Create: `app/Events/Dashboard/BadgeUnlocked.php`
- Create: `app/Events/Dashboard/LevelUp.php`
- Create: `app/Events/Dashboard/RankChanged.php`

- [ ] **Step 1: Create BadgeUnlocked event**

```php
<?php

namespace App\Events\Dashboard;

use App\Models\Badge;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BadgeUnlocked implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly array $badge,
        public readonly string $earnedAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'badge.unlocked';
    }

    public function broadcastWith(): array
    {
        return [
            'badge' => $this->badge,
            'earnedAt' => $this->earnedAt,
        ];
    }
}
```

- [ ] **Step 2: Create LevelUp event**

```php
<?php

namespace App\Events\Dashboard;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LevelUp implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly int $oldLevel,
        public readonly int $newLevel,
        public readonly int $xp,
        public readonly array $unlockedFeatures = [],
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'level.up';
    }

    public function broadcastWith(): array
    {
        return [
            'oldLevel' => $this->oldLevel,
            'newLevel' => $this->newLevel,
            'xp' => $this->xp,
            'unlockedFeatures' => $this->unlockedFeatures,
        ];
    }
}
```

- [ ] **Step 3: Create RankChanged event**

```php
<?php

namespace App\Events\Dashboard;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RankChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly int $oldRank,
        public readonly int $newRank,
        public readonly string $direction,
        public readonly int $change,
        public readonly string $timeframe,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'rank.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'oldRank' => $this->oldRank,
            'newRank' => $this->newRank,
            'direction' => $this->direction,
            'change' => $this->change,
            'timeframe' => $this->timeframe,
        ];
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/Events/Dashboard/
git commit -m "feat: add badge, level up, and rank changed events"
```

---

## Task 5: Create Profile Event

**Files:**
- Create: `app/Events/Profile/PublicProfileUpdated.php`

- [ ] **Step 1: Create PublicProfileUpdated event**

```php
<?php

namespace App\Events\Profile;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PublicProfileUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly array $profileData,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("user.{$this->userId}"),
            new Channel("user.{$this->userId}.public"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'profile.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'profile' => $this->profileData,
        ];
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Events/Profile/
git commit -m "feat: add public profile updated event"
```

---

## Task 6: Create Badge Observer

**Files:**
- Create: `app/Observers/BadgeUserObserver.php`
- Modify: `app/Providers/AppServiceProvider.php`

- [ ] **Step 1: Create BadgeUserObserver**

```php
<?php

namespace App\Observers;

use App\Events\Dashboard\BadgeUnlocked;
use App\Models\Badge;
use Illuminate\Database