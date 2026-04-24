<?php

use App\Models\User;
use App\Services\XpService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('daily goal tracks XP earned today', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'daily_xp_earned' => 0,
        'daily_goal_met_at' => null,
        'current_streak' => 1,
        'last_active_date' => now()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $xpService->awardXp($user, 30);

    expect($user->fresh()->daily_xp_earned)->toBe(30);
});

test('daily goal awards bonus when target is reached', function () {
    $target = (int) config('rewards.daily_goal_target_xp');
    $bonus = (int) config('rewards.daily_goal_bonus_xp');

    $user = User::factory()->create([
        'xp' => 0,
        'daily_xp_earned' => $target - 10,
        'daily_goal_met_at' => null,
        'current_streak' => 1,
        'last_active_date' => now()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $goalBonus = $xpService->trackDailyGoal($user, 15);

    expect($goalBonus)->toBe($bonus);
    expect($user->fresh()->daily_goal_met_at)->not->toBeNull();
    // XP should include the bonus
    expect($user->fresh()->xp)->toBe($bonus);
});

test('daily goal bonus is not awarded twice on same day', function () {
    $target = (int) config('rewards.daily_goal_target_xp');

    $user = User::factory()->create([
        'xp' => 200,
        'daily_xp_earned' => $target + 50,
        'daily_goal_met_at' => now()->toDateString(),
        'current_streak' => 1,
        'last_active_date' => now()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $goalBonus = $xpService->trackDailyGoal($user, 20);

    expect($goalBonus)->toBe(0);
    expect($user->fresh()->xp)->toBe(200); // No bonus XP added
});

test('daily goal resets on new day via updateDailyStreak', function () {
    $user = User::factory()->create([
        'xp' => 100,
        'daily_xp_earned' => 150,
        'daily_goal_met_at' => now()->subDay()->toDateString(),
        'current_streak' => 3,
        'longest_streak' => 5,
        'last_active_date' => now()->subDay()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $xpService->updateDailyStreak($user);

    $fresh = $user->fresh();
    // daily_xp_earned should be reset to 0 then incremented by streak daily XP
    expect($fresh->daily_goal_met_at)->toBeNull();
    // daily_xp_earned starts at 0 then gets streak daily XP tracked
    expect($fresh->daily_xp_earned)->toBeGreaterThanOrEqual(0);
});

test('daily goal bonus is awarded through awardXpAndPoints', function () {
    $target = (int) config('rewards.daily_goal_target_xp');

    $user = User::factory()->create([
        'xp' => 0,
        'points' => 0,
        'daily_xp_earned' => $target - 5,
        'daily_goal_met_at' => null,
        'current_streak' => 0,
        'last_active_date' => now()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->awardXpAndPoints($user, 10);

    // XP awarded = 10 (base, no streak) + daily goal bonus
    $bonus = (int) config('rewards.daily_goal_bonus_xp');
    $fresh = $user->fresh();
    expect($fresh->xp)->toBe(10 + $bonus);
    expect($fresh->daily_goal_met_at)->not->toBeNull();
});
