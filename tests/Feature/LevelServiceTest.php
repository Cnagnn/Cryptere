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
        ->name->toBe('Plaintext Novice')
        ->current_xp->toBe(0)
        ->next_level_xp->toBe(112)
        ->progress->toBe(0.0)
        ->bonus_percent->toBe(0.1);
});

test('level 2 at exactly 112 xp', function () {
    $result = $this->service->getLevelForXp(112);

    expect($result)
        ->level->toBe(2)
        ->name->toBe('Cipher Initiate')
        ->current_xp->toBe(112)
        ->next_level_xp->toBe(125)
        ->bonus_percent->toBe(0.2);
});

test('level 10 at 277 xp', function () {
    $result = $this->service->getLevelForXp(277);

    expect($result)
        ->level->toBe(10)
        ->name->toBe('Substitution Solver')
        ->bonus_percent->toBe(1.0);
});

test('level 20 at 858 xp', function () {
    $result = $this->service->getLevelForXp(858);

    expect($result)
        ->level->toBe(20)
        ->name->toBe('Block Builder')
        ->bonus_percent->toBe(2.0);
});

test('level 50 at 25694 xp', function () {
    $result = $this->service->getLevelForXp(25694);

    expect($result)
        ->level->toBe(50)
        ->name->toBe('Crypto Analyst')
        ->bonus_percent->toBe(5.0);
});

test('max level 100 at 7425476 xp', function () {
    $result = $this->service->getLevelForXp(7425476);

    expect($result)
        ->level->toBe(100)
        ->name->toBe('Cryptographic Deity')
        ->next_level_xp->toBeNull()
        ->progress->toBe(100.0)
        ->bonus_percent->toBe(10.0);
});

test('progress is calculated correctly mid-level', function () {
    // Level 1 is 0-112 (range 112). At 56 xp = 50% through level 1.
    $result = $this->service->getLevelForXp(56);

    expect($result)
        ->level->toBe(1)
        ->progress->toBe(50.0);
});

test('xp beyond max level still returns max level', function () {
    $result = $this->service->getLevelForXp(99999999);

    expect($result)
        ->level->toBe(100)
        ->name->toBe('Cryptographic Deity');
});

// --- checkLevelUp ---

test('detects level up from level 1 to level 2', function () {
    $result = $this->service->checkLevelUp(50, 120);

    expect($result)
        ->not->toBeNull()
        ->level->toBe(2)
        ->name->toBe('Cipher Initiate')
        ->bonus_percent->toBe(0.2);
});

test('returns null when no level change', function () {
    $result = $this->service->checkLevelUp(50, 80);

    expect($result)->toBeNull();
});

test('detects multi-level jump', function () {
    $result = $this->service->checkLevelUp(0, 7425476);

    expect($result)
        ->not->toBeNull()
        ->level->toBe(100);
});

// --- getUserLevel ---

test('getUserLevel reads from user xp column', function () {
    $user = User::factory()->create(['xp' => 277, 'points' => 5000]);

    $result = $this->service->getUserLevel($user);

    expect($result)
        ->level->toBe(10)
        ->bonus_percent->toBe(1.0);
});

// --- getBonusPercent ---

test('getBonusPercent returns correct value for level', function () {
    expect($this->service->getBonusPercent(1))->toBe(0.1);
    expect($this->service->getBonusPercent(10))->toBe(1.0);
    expect($this->service->getBonusPercent(50))->toBe(5.0);
    expect($this->service->getBonusPercent(100))->toBe(10.0);
});

test('getBonusPercent returns 0 for invalid level', function () {
    expect($this->service->getBonusPercent(999))->toBe(0.0);
});

// --- getPointBonusMultiplier ---

test('getPointBonusMultiplier returns correct multiplier', function () {
    // Level 1 user (0.1% bonus) → multiplier 1.001
    $user = User::factory()->create(['xp' => 0]);
    expect($this->service->getPointBonusMultiplier($user))->toBe(1.001);

    // Level 10 user (1.0% bonus) → multiplier 1.01
    $user = User::factory()->create(['xp' => 277]);
    expect($this->service->getPointBonusMultiplier($user))->toBe(1.01);

    // Level 100 user (10.0% bonus) → multiplier 1.10
    $user = User::factory()->create(['xp' => 7425476]);
    expect($this->service->getPointBonusMultiplier($user))->toBe(1.10);
});

// --- maxLevel ---

test('max level is 100', function () {
    expect($this->service->maxLevel())->toBe(100);
});
