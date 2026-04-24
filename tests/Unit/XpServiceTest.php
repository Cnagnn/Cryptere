<?php

use App\Services\LevelService;
use App\Services\XpService;

beforeEach(function () {
    $this->service = new XpService(new LevelService);
});

// --- getStreakMultiplier ---

test('streak multiplier is 1.0 for 0-2 days', function () {
    expect($this->service->getStreakMultiplier(0))->toBe(1.0);
    expect($this->service->getStreakMultiplier(1))->toBe(1.0);
    expect($this->service->getStreakMultiplier(2))->toBe(1.0);
});

test('streak multiplier is 1.25 for 3-6 days', function () {
    expect($this->service->getStreakMultiplier(3))->toBe(1.25);
    expect($this->service->getStreakMultiplier(6))->toBe(1.25);
});

test('streak multiplier is 1.5 for 7-13 days', function () {
    expect($this->service->getStreakMultiplier(7))->toBe(1.5);
    expect($this->service->getStreakMultiplier(13))->toBe(1.5);
});

test('streak multiplier is 1.75 for 14-29 days', function () {
    expect($this->service->getStreakMultiplier(14))->toBe(1.75);
    expect($this->service->getStreakMultiplier(29))->toBe(1.75);
});

test('streak multiplier is 2.0 for 30+ days', function () {
    expect($this->service->getStreakMultiplier(30))->toBe(2.0);
    expect($this->service->getStreakMultiplier(100))->toBe(2.0);
});

// --- getStreakDailyXp ---

test('streak daily XP is 2 for 0-2 days', function () {
    expect($this->service->getStreakDailyXp(0))->toBe(2);
    expect($this->service->getStreakDailyXp(1))->toBe(2);
    expect($this->service->getStreakDailyXp(2))->toBe(2);
});

test('streak daily XP is 3 for 3-6 days', function () {
    expect($this->service->getStreakDailyXp(3))->toBe(3);
    expect($this->service->getStreakDailyXp(6))->toBe(3);
});

test('streak daily XP is 5 for 7-13 days', function () {
    expect($this->service->getStreakDailyXp(7))->toBe(5);
    expect($this->service->getStreakDailyXp(13))->toBe(5);
});

test('streak daily XP is 8 for 14-29 days', function () {
    expect($this->service->getStreakDailyXp(14))->toBe(8);
    expect($this->service->getStreakDailyXp(29))->toBe(8);
});

test('streak daily XP is 12 for 30+ days', function () {
    expect($this->service->getStreakDailyXp(30))->toBe(12);
    expect($this->service->getStreakDailyXp(100))->toBe(12);
});
