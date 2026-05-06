<?php

use App\Events\XpAwarded;
use App\Models\User;
use App\Services\LevelService;
use App\Services\XpService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->levelService = app(LevelService::class);
    $this->xpService = app(XpService::class);
});

// --- Streak Multiplier ---

test('streak multiplier returns 1.0 for 0-2 days', function (int $days) {
    expect($this->xpService->getStreakMultiplier($days))->toBe(1.0);
})->with([0, 1, 2]);

test('streak multiplier returns 1.25 for 3-6 days', function (int $days) {
    expect($this->xpService->getStreakMultiplier($days))->toBe(1.25);
})->with([3, 4, 5, 6]);

test('streak multiplier returns 1.5 for 7-13 days', function (int $days) {
    expect($this->xpService->getStreakMultiplier($days))->toBe(1.5);
})->with([7, 10, 13]);

test('streak multiplier returns 1.75 for 14-29 days', function (int $days) {
    expect($this->xpService->getStreakMultiplier($days))->toBe(1.75);
})->with([14, 20, 29]);

test('streak multiplier returns 2.0 for 30+ days', function (int $days) {
    expect($this->xpService->getStreakMultiplier($days))->toBe(2.0);
})->with([30, 50, 100]);

// --- Streak Daily XP ---

test('streak daily xp scales with streak tier', function (int $days, int $expected) {
    expect($this->xpService->getStreakDailyXp($days))->toBe($expected);
})->with([
    [0, 2],
    [2, 2],
    [3, 3],
    [6, 3],
    [7, 5],
    [13, 5],
    [14, 8],
    [29, 8],
    [30, 12],
    [100, 12],
]);

// --- Award XP and Points ---

test('awardXpAndPoints returns zero for zero base', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0]);

    $result = $this->xpService->awardXpAndPoints($user, 0);

    expect($result)->toBe(['xp' => 0, 'points' => 0]);
    expect($user->fresh()->xp)->toBe(0);
});

test('awardXpAndPoints increments user xp and points', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0, 'daily_xp_earned' => 0, 'daily_goal_met_at' => null]);

    $result = $this->xpService->awardXpAndPoints($user, 100);

    expect($result['xp'])->toBe(100); // 1.0x multiplier (0 streak)
    expect($result['points'])->toBeGreaterThanOrEqual(100);
    // User XP may include daily goal bonus if target was crossed
    expect($user->fresh()->xp)->toBeGreaterThanOrEqual(100);
});

test('awardXpAndPoints applies streak multiplier to xp', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 7]);

    $result = $this->xpService->awardXpAndPoints($user, 100);

    expect($result['xp'])->toBe(150); // 1.5x multiplier (7 day streak)
});

test('awardXpAndPoints dispatches XpAwarded event', function () {
    Event::fake([XpAwarded::class]);
    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0]);

    $this->xpService->awardXpAndPoints($user, 50);

    Event::assertDispatched(XpAwarded::class);
});

test('awardXpAndPoints does not dispatch event for zero base', function () {
    Event::fake([XpAwarded::class]);
    $user = User::factory()->create();

    $this->xpService->awardXpAndPoints($user, 0);

    Event::assertNotDispatched(XpAwarded::class);
});

// --- Award Raw XP ---

test('awardXp increments xp without streak multiplier', function () {
    $user = User::factory()->create(['xp' => 50, 'current_streak' => 30]);

    $result = $this->xpService->awardXp($user, 20);

    expect($result)->toBe(20);
    expect($user->fresh()->xp)->toBe(70);
});

test('awardXp returns zero for zero or negative base', function () {
    $user = User::factory()->create(['xp' => 50]);

    expect($this->xpService->awardXp($user, 0))->toBe(0);
    expect($this->xpService->awardXp($user, -5))->toBe(0);
    expect($user->fresh()->xp)->toBe(50);
});

// --- Daily Streak ---

test('updateDailyStreak no-ops if already active today', function () {
    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::today(),
        'current_streak' => 5,
    ]);

    $result = $this->xpService->updateDailyStreak($user);

    expect($result)->toBe(['xp' => 0, 'bonuses' => []]);
    expect($user->fresh()->current_streak)->toBe(5);
});

test('updateDailyStreak increments streak for consecutive day', function () {
    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::yesterday(),
        'current_streak' => 3,
        'longest_streak' => 5,
        'xp' => 0,
        'daily_xp_earned' => 0,
    ]);

    $result = $this->xpService->updateDailyStreak($user);

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(4);
    expect($result['xp'])->toBeGreaterThan(0);
    expect($result['bonuses'])->not->toContain('first_login');
});

test('updateDailyStreak resets streak after gap', function () {
    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::today()->subDays(3),
        'current_streak' => 10,
        'longest_streak' => 10,
        'xp' => 0,
        'daily_xp_earned' => 0,
    ]);

    $result = $this->xpService->updateDailyStreak($user);

    expect($user->fresh()->current_streak)->toBe(1);
});

test('updateDailyStreak awards first login bonus', function () {
    $user = User::factory()->create([
        'last_active_date' => null,
        'current_streak' => 0,
        'longest_streak' => 0,
        'xp' => 0,
        'daily_xp_earned' => 0,
    ]);

    $result = $this->xpService->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('first_login');
    expect($result['xp'])->toBeGreaterThanOrEqual(50);
});

test('updateDailyStreak awards comeback bonus after long absence', function () {
    $comebackGap = (int) config('rewards.comeback_gap_days', 7);
    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::today()->subDays($comebackGap + 1),
        'current_streak' => 5,
        'longest_streak' => 5,
        'xp' => 0,
        'daily_xp_earned' => 0,
    ]);

    $result = $this->xpService->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('comeback');
});

test('updateDailyStreak awards weekly active bonus at streak 7', function () {
    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::yesterday(),
        'current_streak' => 6,
        'longest_streak' => 6,
        'xp' => 0,
        'daily_xp_earned' => 0,
    ]);

    $result = $this->xpService->updateDailyStreak($user);

    expect($user->fresh()->current_streak)->toBe(7);
    expect($result['bonuses'])->toContain('weekly_active');
});

// --- Daily Goal ---

test('trackDailyGoal awards bonus when target crossed', function () {
    $target = (int) config('rewards.daily_goal_target_xp', 100);
    $user = User::factory()->create([
        'daily_xp_earned' => $target - 10,
        'daily_goal_met_at' => null,
        'xp' => 200,
    ]);

    $bonus = $this->xpService->trackDailyGoal($user, 20);

    expect($bonus)->toBe((int) config('rewards.daily_goal_bonus_xp', 20));
});

test('trackDailyGoal does not double-award', function () {
    $target = (int) config('rewards.daily_goal_target_xp', 100);
    $user = User::factory()->create([
        'daily_xp_earned' => $target + 50,
        'daily_goal_met_at' => CarbonImmutable::today(),
        'xp' => 200,
    ]);

    $bonus = $this->xpService->trackDailyGoal($user, 20);

    expect($bonus)->toBe(0);
});

// --- Level Bonus ---

test('applyLevelBonus adds percentage based on user level', function () {
    // Level 10 = 2% bonus
    $user = User::factory()->create(['xp' => 139]);

    $result = $this->xpService->applyLevelBonus($user, 100);

    expect($result)->toBe(102); // 100 * 1.02
});
