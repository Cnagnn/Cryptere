<?php

use App\Models\User;
use App\Services\LevelService;

beforeEach(function () {
    $this->service = app(LevelService::class);
});

test('level 1 at 0 xp', function () {
    $result = $this->service->getLevelForXp(0);

    expect($result['level'])->toBe(1);
    expect($result['current_xp'])->toBe(0);
    expect($result['progress'])->toBeLessThan(100.0);
});

test('level 2 at 56 xp', function () {
    $result = $this->service->getLevelForXp(56);

    expect($result['level'])->toBe(2);
});

test('level 10 at 139 xp', function () {
    $result = $this->service->getLevelForXp(139);

    expect($result['level'])->toBe(10);
    expect($result['bonus_percent'])->toBe(2.0);
});

test('progress is 0 at level boundary', function () {
    $result = $this->service->getLevelForXp(50); // exact level 2 boundary

    expect($result['level'])->toBe(2);
    expect($result['progress'])->toBe(0.0);
});

test('progress is capped at 100', function () {
    // Max level (50) should have 100% progress
    $result = $this->service->getLevelForXp(999999);

    expect($result['progress'])->toBe(100.0);
});

test('checkLevelUp detects level increase', function () {
    $result = $this->service->checkLevelUp(49, 63); // level 1 → level 3

    expect($result)->not->toBeNull();
    expect($result['level'])->toBe(3);
});

test('checkLevelUp returns null when no level change', function () {
    $result = $this->service->checkLevelUp(0, 10); // both level 1

    expect($result)->toBeNull();
});

test('getUserLevel returns correct level for user', function () {
    $user = User::factory()->create(['xp' => 200]);

    $result = $this->service->getUserLevel($user);

    expect($result['level'])->toBeGreaterThan(1);
    expect($result['current_xp'])->toBe(200);
});

test('getBonusPercent returns correct percentage', function () {
    expect($this->service->getBonusPercent(1))->toBe(0.2);
    expect($this->service->getBonusPercent(10))->toBe(2.0);
    expect($this->service->getBonusPercent(25))->toBe(5.0);
});

test('getPointBonusMultiplier returns 1 + bonus_percent/100', function () {
    $user = User::factory()->create(['xp' => 139]); // level 10

    $multiplier = $this->service->getPointBonusMultiplier($user);

    expect($multiplier)->toBe(1.02); // 1 + 2%/100
});
