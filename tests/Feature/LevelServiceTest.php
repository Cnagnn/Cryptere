<?php

use App\Services\LevelService;

beforeEach(function () {
    $this->service = new LevelService;
});

// --- getLevelForPoints ---

test('level 1 for zero points', function () {
    $result = $this->service->getLevelForPoints(0);

    expect($result)
        ->level->toBe(1)
        ->name->toBe('Plaintext Novice')
        ->current_xp->toBe(0)
        ->next_level_xp->toBe(100)
        ->progress->toBe(0.0);
});

test('level 2 at exactly 100 points', function () {
    $result = $this->service->getLevelForPoints(100);

    expect($result)
        ->level->toBe(2)
        ->name->toBe('Cipher Initiate')
        ->current_xp->toBe(100)
        ->next_level_xp->toBe(300);
});

test('level 5 at 1000 points', function () {
    $result = $this->service->getLevelForPoints(1000);

    expect($result)
        ->level->toBe(5)
        ->name->toBe('Block Builder');
});

test('max level at 10000 points', function () {
    $result = $this->service->getLevelForPoints(10000);

    expect($result)
        ->level->toBe(10)
        ->name->toBe('Quantum Guardian')
        ->next_level_xp->toBeNull()
        ->progress->toBe(100.0);
});

test('progress is calculated correctly mid-level', function () {
    // Level 2 is 100-300 (range 200). At 200 points = 50% through level 2.
    $result = $this->service->getLevelForPoints(200);

    expect($result)
        ->level->toBe(2)
        ->progress->toBe(50.0);
});

test('points beyond max level still return max level', function () {
    $result = $this->service->getLevelForPoints(99999);

    expect($result)
        ->level->toBe(10)
        ->name->toBe('Quantum Guardian');
});

// --- checkLevelUp ---

test('detects level up from level 1 to level 2', function () {
    $result = $this->service->checkLevelUp(50, 150);

    expect($result)
        ->not->toBeNull()
        ->level->toBe(2)
        ->name->toBe('Cipher Initiate');
});

test('returns null when no level change', function () {
    $result = $this->service->checkLevelUp(50, 80);

    expect($result)->toBeNull();
});

test('detects multi-level jump', function () {
    $result = $this->service->checkLevelUp(0, 10000);

    expect($result)
        ->not->toBeNull()
        ->level->toBe(10);
});

// --- maxLevel ---

test('max level is 10', function () {
    expect($this->service->maxLevel())->toBe(10);
});
