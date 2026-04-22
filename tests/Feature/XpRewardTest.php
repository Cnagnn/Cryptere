<?php

use App\Models\LessonTask;
use App\Models\User;
use App\Services\XpService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('awardTaskXp grants base XP with no streak', function () {
    $user = User::factory()->create([
        'points' => 0,
        'current_streak' => 0,
    ]);

    $task = LessonTask::factory()->create([
        'xp_reward' => 50,
    ]);

    $xpService = app(XpService::class);
    $awarded = $xpService->awardTaskXp($user, $task);

    expect($awarded)->toBe(50);
    expect($user->fresh()->points)->toBe(50);
});

test('awardTaskXp applies streak multiplier', function () {
    $user = User::factory()->create([
        'points' => 100,
        'current_streak' => 7, // 1.5× multiplier
    ]);

    $task = LessonTask::factory()->create([
        'xp_reward' => 40,
    ]);

    $xpService = app(XpService::class);
    $awarded = $xpService->awardTaskXp($user, $task);

    expect($awarded)->toBe(60); // 40 × 1.5 = 60
    expect($user->fresh()->points)->toBe(160); // 100 + 60
});

test('awardTaskXp returns zero for task with zero xp_reward', function () {
    $user = User::factory()->create([
        'points' => 100,
        'current_streak' => 5,
    ]);

    $task = LessonTask::factory()->create([
        'xp_reward' => 0,
    ]);

    $xpService = app(XpService::class);
    $awarded = $xpService->awardTaskXp($user, $task);

    expect($awarded)->toBe(0);
    expect($user->fresh()->points)->toBe(100);
});

test('awardTaskXp applies 2x multiplier at 30 day streak', function () {
    $user = User::factory()->create([
        'points' => 0,
        'current_streak' => 30,
    ]);

    $task = LessonTask::factory()->create([
        'xp_reward' => 25,
    ]);

    $xpService = app(XpService::class);
    $awarded = $xpService->awardTaskXp($user, $task);

    expect($awarded)->toBe(50); // 25 × 2.0 = 50
    expect($user->fresh()->points)->toBe(50);
});
