<?php

use App\Models\User;
use App\Services\LevelService;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->service = new LevelService;
});

// ============================================================
// getLevelForXp — Positive Scenarios
// ============================================================

test('level 1 for zero XP', function () {
    $result = $this->service->getLevelForXp(0);

    expect($result['level'])->toBe(1)
        ->and($result['current_xp'])->toBe(0)
        ->and($result['bonus_percent'])->toBe(0.2);
});

test('level 1 for XP below level 2 threshold', function () {
    $result = $this->service->getLevelForXp(55);

    expect($result['level'])->toBe(1)
        ->and($result['progress'])->toBeGreaterThan(0.0);
});

test('level 2 at exact threshold', function () {
    $result = $this->service->getLevelForXp(56);

    expect($result['level'])->toBe(2)
        ->and($result['bonus_percent'])->toBe(0.4);
});

test('level 10 at exact threshold', function () {
    $result = $this->service->getLevelForXp(139);

    expect($result['level'])->toBe(10)
        ->and($result['bonus_percent'])->toBe(2.0);
});

test('level 25 at exact threshold', function () {
    $result = $this->service->getLevelForXp(758);

    expect($result['level'])->toBe(25)
        ->and($result['bonus_percent'])->toBe(5.0);
});

test('level 50 at exact threshold', function () {
    $result = $this->service->getLevelForXp(12873);

    expect($result['level'])->toBe(50)
        ->and($result['bonus_percent'])->toBe(10.0);
});

test('max level with XP far beyond threshold', function () {
    $result = $this->service->getLevelForXp(999999);

    expect($result['level'])->toBe(50)
        ->and($result['progress'])->toBe(100.0)
        ->and($result['next_level_xp'])->toBeNull();
});

test('progress is 0 at start of level', function () {
    $result = $this->service->getLevelForXp(56); // exact level 2

    expect($result['progress'])->toBe(0.0);
});

test('progress is between 0 and 100 mid-level', function () {
    // Level 2 starts at 56, level 3 at 63 → range = 7
    $result = $this->service->getLevelForXp(59); // 3/7 through level 2

    expect($result['progress'])->toBeGreaterThan(0.0)
        ->and($result['progress'])->toBeLessThan(100.0);
});

test('progress never exceeds 100', function () {
    $result = $this->service->getLevelForXp(999999);

    expect($result['progress'])->toBeLessThanOrEqual(100.0);
});

test('next_level_xp is set for non-max levels', function () {
    $result = $this->service->getLevelForXp(0);

    expect($result['next_level_xp'])->not->toBeNull()
        ->and($result['next_level_xp'])->toBe(56);
});

test('next_level_xp is null at max level', function () {
    $result = $this->service->getLevelForXp(12873);

    expect($result['next_level_xp'])->toBeNull();
});

// ============================================================
// getLevelForXp — Negative / Edge Scenarios
// ============================================================

test('negative XP defaults to level 1', function () {
    $result = $this->service->getLevelForXp(-100);

    expect($result['level'])->toBe(1);
});

// ============================================================
// checkLevelUp — Positive Scenarios
// ============================================================

test('detects level up from level 1 to level 2', function () {
    $result = $this->service->checkLevelUp(50, 56);

    expect($result)->not->toBeNull()
        ->and($result['level'])->toBe(2)
        ->and($result['bonus_percent'])->toBe(0.4);
});

test('detects multi-level jump', function () {
    $result = $this->service->checkLevelUp(0, 139);

    expect($result)->not->toBeNull()
        ->and($result['level'])->toBe(10);
});

test('detects level up to max level', function () {
    $result = $this->service->checkLevelUp(11494, 12873);

    expect($result)->not->toBeNull()
        ->and($result['level'])->toBe(50)
        ->and($result['bonus_percent'])->toBe(10.0);
});

// ============================================================
// checkLevelUp — Negative Scenarios
// ============================================================

test('no level up when XP stays in same level', function () {
    $result = $this->service->checkLevelUp(50, 55);

    expect($result)->toBeNull();
});

test('no level up when XP is identical', function () {
    $result = $this->service->checkLevelUp(100, 100);

    expect($result)->toBeNull();
});

test('no level up when XP decreases', function () {
    $result = $this->service->checkLevelUp(200, 100);

    expect($result)->toBeNull();
});

test('no level up when both at max level', function () {
    $result = $this->service->checkLevelUp(12873, 15000);

    expect($result)->toBeNull();
});

// ============================================================
// getUserLevel — Positive Scenarios
// ============================================================

test('getUserLevel returns correct level for user', function () {
    $user = User::factory()->make(['xp' => 500]);

    $result = $this->service->getUserLevel($user);

    expect($result['level'])->toBeGreaterThan(1)
        ->and($result['current_xp'])->toBe(500);
});

test('getUserLevel handles null xp as zero', function () {
    $user = User::factory()->make(['xp' => null]);

    $result = $this->service->getUserLevel($user);

    expect($result['level'])->toBe(1)
        ->and($result['current_xp'])->toBe(0);
});

// ============================================================
// getBonusPercent — Positive Scenarios
// ============================================================

test('bonus percent for level 1 is 0.2', function () {
    expect($this->service->getBonusPercent(1))->toBe(0.2);
});

test('bonus percent for level 10 is 2.0', function () {
    expect($this->service->getBonusPercent(10))->toBe(2.0);
});

test('bonus percent for level 50 is 10.0', function () {
    expect($this->service->getBonusPercent(50))->toBe(10.0);
});

// ============================================================
// getBonusPercent — Negative Scenarios
// ============================================================

test('bonus percent for invalid level returns 0', function () {
    expect($this->service->getBonusPercent(0))->toBe(0.0);
    expect($this->service->getBonusPercent(999))->toBe(0.0);
});

// ============================================================
// getPointBonusMultiplier — Positive Scenarios
// ============================================================

test('point bonus multiplier for level 1 user', function () {
    $user = User::factory()->make(['xp' => 0]);

    $multiplier = $this->service->getPointBonusMultiplier($user);

    expect($multiplier)->toBe(1.002); // 1 + (0.2 / 100)
});

test('point bonus multiplier for level 10 user', function () {
    $user = User::factory()->make(['xp' => 139]);

    $multiplier = $this->service->getPointBonusMultiplier($user);

    expect($multiplier)->toBe(1.02); // 1 + (2.0 / 100)
});

test('point bonus multiplier for level 50 user', function () {
    $user = User::factory()->make(['xp' => 12873]);

    $multiplier = $this->service->getPointBonusMultiplier($user);

    expect($multiplier)->toBe(1.10); // 1 + (10.0 / 100)
});

// ============================================================
// maxLevel — Positive Scenarios
// ============================================================

test('max level is 50', function () {
    expect($this->service->maxLevel())->toBe(50);
});

// ============================================================
// Boundary Tests — Level Transitions
// ============================================================

test('XP one below level 2 threshold stays at level 1', function () {
    $result = $this->service->getLevelForXp(55);

    expect($result['level'])->toBe(1);
});

test('XP exactly at level 2 threshold is level 2', function () {
    $result = $this->service->getLevelForXp(56);

    expect($result['level'])->toBe(2);
});

test('XP one above level 2 threshold is still level 2', function () {
    $result = $this->service->getLevelForXp(57);

    expect($result['level'])->toBe(2);
});

test('every level has increasing min_xp', function () {
    $previousXp = -1;
    for ($level = 1; $level <= 50; $level++) {
        $result = $this->service->getLevelForXp(config("levels.thresholds.{$level}.min_xp"));
        expect($result['level'])->toBe($level);

        $currentXp = config("levels.thresholds.{$level}.min_xp");
        expect($currentXp)->toBeGreaterThan($previousXp);
        $previousXp = $currentXp;
    }
});
