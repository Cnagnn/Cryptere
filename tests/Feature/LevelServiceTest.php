<?php

use App\Models\User;
use App\Services\LevelService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = new LevelService;
});

// --- getLevelForXp ---

test('level 1 for zero xp', function () {
    $result = $this->service->getLevelForXp(0);

    expect($result)
        ->level->toBe(1)
        ->current_xp->toBe(0)
        ->next_level_xp->toBe(56)
        ->progress->toBe(0.0)
        ->bonus_percent->toBe(0.2);
});

test('level 2 at exactly 56 xp', function () {
    $result = $this->service->getLevelForXp(56);

    expect($result)
        ->level->toBe(2)
        ->current_xp->toBe(56)
        ->next_level_xp->toBe(63)
        ->bonus_percent->toBe(0.4);
});

test('level 10 at 139 xp', function () {
    $result = $this->service->getLevelForXp(139);

    expect($result)
        ->level->toBe(10)
        ->bonus_percent->toBe(2.0);
});

test('level 20 at 430 xp', function () {
    $result = $this->service->getLevelForXp(430);

    expect($result)
        ->level->toBe(20)
        ->bonus_percent->toBe(4.0);
});

test('level 25 at 758 xp', function () {
    $result = $this->service->getLevelForXp(758);

    expect($result)
        ->level->toBe(25)
        ->bonus_percent->toBe(5.0);
});

test('max level 50 at 12873 xp', function () {
    $result = $this->service->getLevelForXp(12873);

    expect($result)
        ->level->toBe(50)
        ->next_level_xp->toBeNull()
        ->progress->toBe(100.0)
        ->bonus_percent->toBe(10.0);
});

test('progress is calculated correctly mid-level', function () {
    // Level 1 is 0-56 (range 56). At 28 xp = 50% through level 1.
    $result = $this->service->getLevelForXp(28);

    expect($result)
        ->level->toBe(1)
        ->progress->toBe(50.0);
});

test('xp beyond max level still returns max level', function () {
    $result = $this->service->getLevelForXp(99999999);

    expect($result)
        ->level->toBe(50);
});

// --- checkLevelUp ---

test('detects level up from level 1 to level 2', function () {
    $result = $this->service->checkLevelUp(50, 60);

    expect($result)
        ->not->toBeNull()
        ->level->toBe(2)
        ->bonus_percent->toBe(0.4);
});

test('returns null when no level change', function () {
    $result = $this->service->checkLevelUp(10, 40);

    expect($result)->toBeNull();
});

test('detects multi-level jump', function () {
    $result = $this->service->checkLevelUp(0, 12873);

    expect($result)
        ->not->toBeNull()
        ->level->toBe(50);
});

// --- getUserLevel ---

test('getUserLevel reads from user xp column', function () {
    $user = User::factory()->create(['xp' => 139, 'points' => 5000]);

    $result = $this->service->getUserLevel($user);

    expect($result)
        ->level->toBe(10)
        ->bonus_percent->toBe(2.0);
});

// --- getBonusPercent ---

test('getBonusPercent returns correct value for level', function () {
    expect($this->service->getBonusPercent(1))->toBe(0.2);
    expect($this->service->getBonusPercent(10))->toBe(2.0);
    expect($this->service->getBonusPercent(25))->toBe(5.0);
    expect($this->service->getBonusPercent(50))->toBe(10.0);
});

test('getBonusPercent returns 0 for invalid level', function () {
    expect($this->service->getBonusPercent(999))->toBe(0.0);
});

// --- getPointBonusMultiplier ---

test('getPointBonusMultiplier returns correct multiplier', function () {
    // Level 1 user (0.2% bonus) → multiplier 1.002
    $user = User::factory()->create(['xp' => 0]);
    expect($this->service->getPointBonusMultiplier($user))->toBe(1.002);

    // Level 10 user (2.0% bonus) → multiplier 1.02
    $user = User::factory()->create(['xp' => 139]);
    expect($this->service->getPointBonusMultiplier($user))->toBe(1.02);

    // Level 50 user (10.0% bonus) → multiplier 1.10
    $user = User::factory()->create(['xp' => 12873]);
    expect($this->service->getPointBonusMultiplier($user))->toBe(1.10);
});

// --- maxLevel ---

test('max level is 50', function () {
    expect($this->service->maxLevel())->toBe(50);
});
