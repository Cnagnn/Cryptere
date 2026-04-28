<?php

use App\Models\User;
use App\Services\LevelService;
use App\Services\XpService;
use Carbon\CarbonImmutable;

beforeEach(function () {
    $this->service = app(XpService::class);
});

// ============================================================
// awardXpAndPoints — Positive Scenarios
// ============================================================

test('awards XP and points for positive base amount', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0]);

    $result = $this->service->awardXpAndPoints($user, 100);

    expect($result['xp'])->toBe(100) // streak 0 → 1.0× multiplier
        ->and($result['points'])->toBeGreaterThanOrEqual(100);

    $user->refresh();
    expect($user->xp)->toBeGreaterThanOrEqual(100)
        ->and($user->points)->toBeGreaterThanOrEqual(100);
});

test('streak multiplier boosts XP but not points', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'points' => 0,
        'current_streak' => 7, // 1.5× multiplier
    ]);

    $result = $this->service->awardXpAndPoints($user, 100);

    expect($result['xp'])->toBe(150) // 100 × 1.5
        ->and($result['points'])->toBeGreaterThanOrEqual(100)
        ->and($result['points'])->toBeLessThan(150); // Points don't get streak bonus
});

test('level bonus increases points', function () {
    // User at level 10 (xp >= 139) gets 2% bonus
    $user = User::factory()->create([
        'xp' => 139,
        'points' => 0,
        'current_streak' => 0,
    ]);

    $result = $this->service->awardXpAndPoints($user, 100);

    expect($result['points'])->toBe(102); // 100 × 1.02
});

test('awards XP and points with high streak', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'points' => 0,
        'current_streak' => 30, // 2.0× multiplier
    ]);

    $result = $this->service->awardXpAndPoints($user, 50);

    expect($result['xp'])->toBe(100); // 50 × 2.0
});

// ============================================================
// awardXpAndPoints — Negative Scenarios
// ============================================================

test('zero base XP returns zero for both', function () {
    $user = User::factory()->create(['xp' => 100, 'points' => 100]);

    $result = $this->service->awardXpAndPoints($user, 0);

    expect($result)->toBe(['xp' => 0, 'points' => 0]);

    $user->refresh();
    expect($user->xp)->toBe(100)
        ->and($user->points)->toBe(100);
});

test('negative base XP returns zero for both', function () {
    $user = User::factory()->create(['xp' => 100, 'points' => 100]);

    $result = $this->service->awardXpAndPoints($user, -50);

    expect($result)->toBe(['xp' => 0, 'points' => 0]);
});

// ============================================================
// awardTaskXp — Positive Scenarios
// ============================================================

test('awards task XP using config value', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0]);
    $task = \App\Models\LessonTask::factory()->create();

    $result = $this->service->awardTaskXp($user, $task);

    $expectedXp = (int) config('rewards.quiz_task_xp', 20);

    expect($result['xp'])->toBe($expectedXp)
        ->and($result['points'])->toBeGreaterThanOrEqual($expectedXp);
});

// ============================================================
// awardXp — Positive Scenarios
// ============================================================

test('awards raw XP without streak multiplier', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'current_streak' => 30, // Should NOT affect raw XP
    ]);

    $result = $this->service->awardXp($user, 50);

    expect($result)->toBe(50);

    $user->refresh();
    expect($user->xp)->toBeGreaterThanOrEqual(50);
});

test('awards raw XP and tracks daily goal', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $this->service->awardXp($user, 50);

    $user->refresh();
    expect($user->daily_xp_earned)->toBeGreaterThanOrEqual(50);
});

// ============================================================
// awardXp — Negative Scenarios
// ============================================================

test('zero raw XP returns zero', function () {
    $user = User::factory()->create(['xp' => 100]);

    $result = $this->service->awardXp($user, 0);

    expect($result)->toBe(0);
});

test('negative raw XP returns zero', function () {
    $user = User::factory()->create(['xp' => 100]);

    $result = $this->service->awardXp($user, -10);

    expect($result)->toBe(0);
});

// ============================================================
// applyLevelBonus — Positive Scenarios
// ============================================================

test('level 1 user gets minimal bonus', function () {
    $user = User::factory()->create(['xp' => 0]);

    $result = $this->service->applyLevelBonus($user, 100);

    // Level 1 = 0.2% bonus → 100 × 1.002 = 100 (rounded)
    expect($result)->toBe(100);
});

test('level 50 user gets 10% bonus', function () {
    $user = User::factory()->create(['xp' => 12873]);

    $result = $this->service->applyLevelBonus($user, 100);

    expect($result)->toBe(110); // 100 × 1.10
});

test('level bonus with zero base returns zero', function () {
    $user = User::factory()->create(['xp' => 12873]);

    $result = $this->service->applyLevelBonus($user, 0);

    expect($result)->toBe(0);
});

// ============================================================
// trackDailyGoal — Positive Scenarios
// ============================================================

test('tracks daily XP progress', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $bonus = $this->service->trackDailyGoal($user, 50);

    expect($bonus)->toBe(0); // Not yet at target
    expect($user->daily_xp_earned)->toBe(50);
});

test('awards bonus when daily goal is first met', function () {
    $target = (int) config('rewards.daily_goal_target_xp', 100);
    $expectedBonus = (int) config('rewards.daily_goal_bonus_xp', 20);

    $user = User::factory()->create([
        'xp' => 0,
        'daily_xp_earned' => $target - 10,
        'daily_goal_met_at' => null,
    ]);

    $bonus = $this->service->trackDailyGoal($user, 20); // Crosses target

    expect($bonus)->toBe($expectedBonus);
});

test('does not award bonus when goal already met today', function () {
    $target = (int) config('rewards.daily_goal_target_xp', 100);

    $user = User::factory()->create([
        'xp' => 200,
        'daily_xp_earned' => $target + 50,
        'daily_goal_met_at' => CarbonImmutable::today(),
    ]);

    $bonus = $this->service->trackDailyGoal($user, 30);

    expect($bonus)->toBe(0);
});

// ============================================================
// trackDailyGoal — Negative Scenarios
// ============================================================

test('zero XP earned returns zero bonus', function () {
    $user = User::factory()->create([
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $bonus = $this->service->trackDailyGoal($user, 0);

    expect($bonus)->toBe(0);
});

test('negative XP earned returns zero bonus', function () {
    $user = User::factory()->create([
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $bonus = $this->service->trackDailyGoal($user, -10);

    expect($bonus)->toBe(0);
});

// ============================================================
// updateDailyStreak — Positive Scenarios
// ============================================================

test('first login sets streak to 1 and awards first login bonus', function () {
    $user = User::factory()->create([
        'current_streak' => 0,
        'longest_streak' => 0,
        'last_active_date' => null,
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('first_login')
        ->and($result['xp'])->toBeGreaterThan(0);

    $user->refresh();
    expect($user->current_streak)->toBe(1)
        ->and($user->last_active_date->toDateString())->toBe(CarbonImmutable::today()->toDateString());
});

test('consecutive day increments streak', function () {
    $user = User::factory()->create([
        'current_streak' => 5,
        'longest_streak' => 5,
        'last_active_date' => CarbonImmutable::yesterday(),
        'daily_xp_earned' => 50,
        'daily_goal_met_at' => null,
    ]);

    $result = $this->service->updateDailyStreak($user);

    $user->refresh();
    expect($user->current_streak)->toBe(6)
        ->and($user->longest_streak)->toBe(6)
        ->and($result['xp'])->toBeGreaterThan(0);
});

test('gap in days resets streak to 1', function () {
    $user = User::factory()->create([
        'current_streak' => 10,
        'longest_streak' => 10,
        'last_active_date' => CarbonImmutable::today()->subDays(3),
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $result = $this->service->updateDailyStreak($user);

    $user->refresh();
    expect($user->current_streak)->toBe(1)
        ->and($user->longest_streak)->toBe(10); // Longest preserved
});

test('same day login returns zero XP', function () {
    $user = User::factory()->create([
        'current_streak' => 5,
        'last_active_date' => CarbonImmutable::today(),
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result)->toBe(['xp' => 0, 'bonuses' => []]);
});

test('streak reaching 7 awards weekly active bonus', function () {
    $user = User::factory()->create([
        'current_streak' => 6,
        'longest_streak' => 6,
        'last_active_date' => CarbonImmutable::yesterday(),
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('weekly_active');
});

test('comeback bonus after long absence', function () {
    $comebackGap = (int) config('rewards.comeback_gap_days', 7);

    $user = User::factory()->create([
        'current_streak' => 5,
        'longest_streak' => 5,
        'last_active_date' => CarbonImmutable::today()->subDays($comebackGap + 1),
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('comeback');
});

// ============================================================
// updateDailyStreak — Negative Scenarios
// ============================================================

test('no comeback bonus for short absence', function () {
    $user = User::factory()->create([
        'current_streak' => 5,
        'longest_streak' => 5,
        'last_active_date' => CarbonImmutable::today()->subDays(2),
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result['bonuses'])->not->toContain('comeback');
});

test('no weekly bonus when streak is not exactly 7', function () {
    $user = User::factory()->create([
        'current_streak' => 7, // Will become 8
        'longest_streak' => 7,
        'last_active_date' => CarbonImmutable::yesterday(),
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result['bonuses'])->not->toContain('weekly_active');
});

test('daily XP resets on new day', function () {
    $user = User::factory()->create([
        'current_streak' => 3,
        'longest_streak' => 3,
        'last_active_date' => CarbonImmutable::yesterday(),
        'daily_xp_earned' => 500,
        'daily_goal_met_at' => CarbonImmutable::yesterday(),
    ]);

    $this->service->updateDailyStreak($user);

    $user->refresh();
    expect($user->daily_xp_earned)->toBeGreaterThanOrEqual(0)
        ->and($user->daily_goal_met_at)->toBeNull();
});

// ============================================================
// getStreakMultiplier — Boundary Tests (comprehensive)
// ============================================================

test('streak multiplier boundary at day 2-3', function () {
    expect($this->service->getStreakMultiplier(2))->toBe(1.0)
        ->and($this->service->getStreakMultiplier(3))->toBe(1.25);
});

test('streak multiplier boundary at day 6-7', function () {
    expect($this->service->getStreakMultiplier(6))->toBe(1.25)
        ->and($this->service->getStreakMultiplier(7))->toBe(1.5);
});

test('streak multiplier boundary at day 13-14', function () {
    expect($this->service->getStreakMultiplier(13))->toBe(1.5)
        ->and($this->service->getStreakMultiplier(14))->toBe(1.75);
});

test('streak multiplier boundary at day 29-30', function () {
    expect($this->service->getStreakMultiplier(29))->toBe(1.75)
        ->and($this->service->getStreakMultiplier(30))->toBe(2.0);
});

// ============================================================
// Integration: Full XP Award Flow
// ============================================================

test('full XP flow: task completion with streak and level bonus', function () {
    $user = User::factory()->create([
        'xp' => 139, // Level 10 → 2% bonus
        'points' => 0,
        'current_streak' => 7, // 1.5× multiplier
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
    ]);

    $result = $this->service->awardXpAndPoints($user, 100);

    // XP = 100 × 1.5 = 150 (streak boosts XP)
    expect($result['xp'])->toBe(150);

    // Points = 100 × 1.02 = 102 (level bonus only, no streak)
    expect($result['points'])->toBe(102);
});
