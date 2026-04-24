<?php

use App\Models\LessonTask;
use App\Models\User;
use App\Services\XpService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('awardTaskXp grants base XP and points with no streak', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'current_streak' => 0,
    ]);

    $task = LessonTask::factory()->create([
        'xp_reward' => 50,
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->awardTaskXp($user, $task);

    expect($result)->toBeArray()
        ->xp->toBe(50);

    $fresh = $user->fresh();
    expect($fresh->xp)->toBe(50);
    // Points include level bonus (level 1 = 0.1% → 50 * 1.001 = 50 rounded)
    expect($fresh->points)->toBe($result['points']);
});

test('awardTaskXp applies streak multiplier to XP only, not points', function () {
    $user = User::factory()->create([
        'points' => 100,
        'xp' => 10,
        'current_streak' => 7, // 1.5× multiplier
    ]);

    $task = LessonTask::factory()->create([
        'xp_reward' => 40,
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->awardTaskXp($user, $task);

    // XP gets streak multiplier: 40 × 1.5 = 60
    expect($result['xp'])->toBe(60);
    expect($user->fresh()->xp)->toBe(70); // 10 + 60

    // Points use base amount (no streak): applyLevelBonus(40) ≈ 40
    expect($result['points'])->toBe($xpService->applyLevelBonus($user, 40));
    expect($user->fresh()->points)->toBe(100 + $result['points']);
});

test('awardTaskXp returns zero for task with zero xp_reward', function () {
    $user = User::factory()->create([
        'points' => 100,
        'xp' => 50,
        'current_streak' => 5,
    ]);

    $task = LessonTask::factory()->create([
        'xp_reward' => 0,
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->awardTaskXp($user, $task);

    expect($result)->toBe(['xp' => 0, 'points' => 0]);
    expect($user->fresh()->points)->toBe(100);
    expect($user->fresh()->xp)->toBe(50);
});

test('awardTaskXp applies 2x multiplier at 30 day streak to XP only', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'current_streak' => 30,
    ]);

    $task = LessonTask::factory()->create([
        'xp_reward' => 25,
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->awardTaskXp($user, $task);

    // XP gets 2× streak: 25 × 2.0 = 50
    expect($result['xp'])->toBe(50);
    expect($user->fresh()->xp)->toBe(50);

    // Points use base amount (no streak): applyLevelBonus(25) ≈ 25
    $expectedPoints = $xpService->applyLevelBonus($user, 25);
    expect($result['points'])->toBe($expectedPoints);
    expect($user->fresh()->points)->toBe($expectedPoints);
});

test('awardXpAndPoints applies streak to XP and level bonus to base points', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'current_streak' => 14, // 1.75× multiplier
        'daily_goal_met_at' => now()->toDateString(), // Prevent daily goal bonus
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->awardXpAndPoints($user, 100);

    // XP gets streak: 100 × 1.75 = 175
    expect($result['xp'])->toBe(175);
    expect($user->fresh()->xp)->toBe(175);

    // Points use base (no streak): applyLevelBonus(100) ≈ 100
    $expectedPoints = $xpService->applyLevelBonus($user, 100);
    expect($result['points'])->toBe($expectedPoints);
    expect($user->fresh()->points)->toBe($expectedPoints);
});

test('awardXpAndPoints returns zero for zero base', function () {
    $user = User::factory()->create(['points' => 50, 'xp' => 50, 'current_streak' => 10]);

    $xpService = app(XpService::class);
    $result = $xpService->awardXpAndPoints($user, 0);

    expect($result)->toBe(['xp' => 0, 'points' => 0]);
    expect($user->fresh()->xp)->toBe(50);
    expect($user->fresh()->points)->toBe(50);
});

test('applyLevelBonus applies correct multiplier', function () {
    // Level 10 user (1% bonus)
    $user = User::factory()->create(['xp' => 277]);

    $xpService = app(XpService::class);
    $boosted = $xpService->applyLevelBonus($user, 100);

    expect($boosted)->toBe(101); // 100 * 1.01 = 101
});

test('applyLevelBonus at level 1 is nearly unchanged', function () {
    $user = User::factory()->create(['xp' => 0]);

    $xpService = app(XpService::class);
    $boosted = $xpService->applyLevelBonus($user, 100);

    // Level 1 = 0.1% bonus → 100 * 1.001 = 100 (rounded)
    expect($boosted)->toBe(100);
});
