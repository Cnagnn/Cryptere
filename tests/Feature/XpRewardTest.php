<?php

use App\Models\LessonTask;
use App\Models\User;
use App\Services\XpService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('awardTaskXp grants config-based XP and points with no streak', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'current_streak' => 0,
    ]);

    $task = LessonTask::factory()->create();

    $quizTaskXp = (int) config('rewards.quiz_task_xp', 20);

    $xpService = app(XpService::class);
    $result = $xpService->awardTaskXp($user, $task);

    expect($result)->toBeArray()
        ->xp->toBe($quizTaskXp);

    $fresh = $user->fresh();
    expect($fresh->xp)->toBe($quizTaskXp);
    expect($fresh->points)->toBe($result['points']);
});

test('awardTaskXp applies streak multiplier to XP only, not points', function () {
    $user = User::factory()->create([
        'points' => 100,
        'xp' => 10,
        'current_streak' => 7, // 1.5× multiplier
    ]);

    $task = LessonTask::factory()->create();

    $quizTaskXp = (int) config('rewards.quiz_task_xp', 20);

    $xpService = app(XpService::class);
    $result = $xpService->awardTaskXp($user, $task);

    // XP gets streak multiplier: 20 × 1.5 = 30
    expect($result['xp'])->toBe((int) round($quizTaskXp * 1.5));
    expect($user->fresh()->xp)->toBe(10 + $result['xp']);

    // Points use base amount (no streak): applyLevelBonus(20) ≈ 20
    expect($result['points'])->toBe($xpService->applyLevelBonus($user, $quizTaskXp));
    expect($user->fresh()->points)->toBe(100 + $result['points']);
});

test('awardTaskXp always uses config value regardless of task', function () {
    $user = User::factory()->create([
        'points' => 100,
        'xp' => 50,
        'current_streak' => 0,
    ]);

    $task = LessonTask::factory()->create();

    $quizTaskXp = (int) config('rewards.quiz_task_xp', 20);

    $xpService = app(XpService::class);
    $result = $xpService->awardTaskXp($user, $task);

    expect($result['xp'])->toBe($quizTaskXp);
    expect($user->fresh()->xp)->toBe(50 + $quizTaskXp);
});

test('awardTaskXp applies 2x multiplier at 30 day streak to XP only', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'current_streak' => 30,
    ]);

    $task = LessonTask::factory()->create();

    $quizTaskXp = (int) config('rewards.quiz_task_xp', 20);

    $xpService = app(XpService::class);
    $result = $xpService->awardTaskXp($user, $task);

    // XP gets 2× streak: 20 × 2.0 = 40
    expect($result['xp'])->toBe($quizTaskXp * 2);
    expect($user->fresh()->xp)->toBe($quizTaskXp * 2);

    // Points use base amount (no streak): applyLevelBonus(20) ≈ 20
    $expectedPoints = $xpService->applyLevelBonus($user, $quizTaskXp);
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

    // Points use base (no streak) at user's level BEFORE XP award (level 1, 0.2% bonus)
    // 100 * 1.002 = 100 (rounded)
    expect($result['points'])->toBe(100);
    expect($user->fresh()->points)->toBe(100);
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
    // Level 10 user (2% bonus)
    $user = User::factory()->create(['xp' => 139]);

    $xpService = app(XpService::class);
    $boosted = $xpService->applyLevelBonus($user, 100);

    expect($boosted)->toBe(102); // 100 * 1.02 = 102
});

test('applyLevelBonus at level 1 is nearly unchanged', function () {
    $user = User::factory()->create(['xp' => 0]);

    $xpService = app(XpService::class);
    $boosted = $xpService->applyLevelBonus($user, 100);

    // Level 1 = 0.2% bonus → 100 * 1.002 = 100 (rounded)
    expect($boosted)->toBe(100);
});
