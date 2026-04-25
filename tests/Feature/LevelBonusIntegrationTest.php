<?php

use App\Models\User;
use App\Services\LevelService;
use App\Services\XpService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('level bonus multiplier increases points earned', function () {
    // Level 10 user (2% bonus) with 139 XP
    $user = User::factory()->create(['xp' => 139, 'points' => 0]);

    $xpService = app(XpService::class);
    $boostedPoints = $xpService->applyLevelBonus($user, 100);

    // 100 * 1.02 = 102
    expect($boostedPoints)->toBe(102);
});

test('high level user gets significant point bonus', function () {
    // Level 25 user (5% bonus) with 758 XP
    $user = User::factory()->create(['xp' => 758, 'points' => 0]);

    $xpService = app(XpService::class);
    $boostedPoints = $xpService->applyLevelBonus($user, 100);

    // 100 * 1.05 = 105
    expect($boostedPoints)->toBe(105);
});

test('max level user gets 10% point bonus', function () {
    // Level 50 user (10% bonus)
    $user = User::factory()->create(['xp' => 12873, 'points' => 0]);

    $xpService = app(XpService::class);
    $boostedPoints = $xpService->applyLevelBonus($user, 100);

    // 100 * 1.10 = 110
    expect($boostedPoints)->toBe(110);
});

test('xp and points are tracked independently', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0]);

    // Simulate awarding XP and points separately
    $user->increment('xp', 50);
    $user->increment('points', 100);

    $fresh = $user->fresh();
    expect($fresh->xp)->toBe(50);
    expect($fresh->points)->toBe(100);
});

test('level is determined by xp not points', function () {
    // User with high points but low XP should be low level
    $user = User::factory()->create(['xp' => 0, 'points' => 999999]);

    $levelService = app(LevelService::class);
    $level = $levelService->getUserLevel($user);

    expect($level['level'])->toBe(1);
    expect($level['bonus_percent'])->toBe(0.2);
});

test('level up detection uses xp column', function () {
    $levelService = app(LevelService::class);

    // XP went from 50 (level 1) to 60 (level 2 at 56)
    $result = $levelService->checkLevelUp(50, 60);

    expect($result)->not->toBeNull()
        ->level->toBe(2)
        ->bonus_percent->toBe(0.4);
});

test('bonus percent scales linearly with level', function () {
    $levelService = app(LevelService::class);

    expect($levelService->getBonusPercent(1))->toBe(0.2);
    expect($levelService->getBonusPercent(10))->toBe(2.0);
    expect($levelService->getBonusPercent(25))->toBe(5.0);
    expect($levelService->getBonusPercent(50))->toBe(10.0);
});
