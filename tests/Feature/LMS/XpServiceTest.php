<?php

use App\Events\XpAwarded;
use App\Models\User;
use App\Services\XpService;
use Illuminate\Support\Facades\Event;

test('awardXpAndPoints awards correct xp with streak multiplier', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 7]);
    $xpService = app(XpService::class);

    $result = $xpService->awardXpAndPoints($user, 20);

    // Streak 7 = 1.5x multiplier → 30 XP
    expect($result['xp'])->toBe(30);
    expect($user->fresh()->xp)->toBe(30);
});

test('awardXpAndPoints dispatches XpAwarded event', function () {
    Event::fake([XpAwarded::class]);

    $user = User::factory()->create(['xp' => 0, 'points' => 0]);
    $xpService = app(XpService::class);

    $xpService->awardXpAndPoints($user, 20);

    Event::assertDispatched(XpAwarded::class, function ($event) use ($user) {
        return $event->user->id === $user->id;
    });
});

test('awardXpAndPoints returns zero for zero base xp', function () {
    $user = User::factory()->create(['xp' => 100, 'points' => 100]);
    $xpService = app(XpService::class);

    $result = $xpService->awardXpAndPoints($user, 0);

    expect($result)->toBe(['xp' => 0, 'points' => 0]);
    expect($user->fresh()->xp)->toBe(100);
});

test('trackDailyGoal awards bonus on first crossing of target', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'daily_xp_earned' => 90,
        'daily_goal_met_at' => null,
    ]);

    $xpService = app(XpService::class);
    $bonus = $xpService->trackDailyGoal($user, 20);

    $dailyGoalBonus = (int) config('rewards.daily_goal_bonus_xp', 20);
    expect($bonus)->toBe($dailyGoalBonus);
    expect($user->fresh()->daily_goal_met_at)->not->toBeNull();
});

test('trackDailyGoal does not double-award bonus', function () {
    $user = User::factory()->create([
        'xp' => 100,
        'daily_xp_earned' => 110,
        'daily_goal_met_at' => now(),
    ]);

    $xpService = app(XpService::class);
    $bonus = $xpService->trackDailyGoal($user, 20);

    expect($bonus)->toBe(0);
});

test('streak multiplier tiers are correct', function () {
    $xpService = app(XpService::class);

    expect($xpService->getStreakMultiplier(0))->toBe(1.0);
    expect($xpService->getStreakMultiplier(2))->toBe(1.0);
    expect($xpService->getStreakMultiplier(3))->toBe(1.25);
    expect($xpService->getStreakMultiplier(7))->toBe(1.5);
    expect($xpService->getStreakMultiplier(14))->toBe(1.75);
    expect($xpService->getStreakMultiplier(30))->toBe(2.0);
});
