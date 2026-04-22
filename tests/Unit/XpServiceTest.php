<?php

use App\Services\XpService;

beforeEach(function () {
    $this->service = new XpService;
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
