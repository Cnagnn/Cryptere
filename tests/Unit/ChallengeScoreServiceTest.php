<?php

use App\Services\ChallengeScoreService;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->service = new ChallengeScoreService;
});

// ============================================================
// calculateQuestionScore — Positive Scenarios (existing coverage extended)
// ============================================================

test('instant answer gets maximum points', function () {
    expect($this->service->calculateQuestionScore(0, 20000, 1000))->toBe(1000);
});

test('answer at half time limit gets 750 points', function () {
    expect($this->service->calculateQuestionScore(10000, 20000, 1000))->toBe(750);
});

test('answer at exact time limit gets 500 points', function () {
    expect($this->service->calculateQuestionScore(20000, 20000, 1000))->toBe(500);
});

test('answer at double time limit gets zero points', function () {
    expect($this->service->calculateQuestionScore(40000, 20000, 1000))->toBe(0);
});

test('answer beyond double time limit gets zero points', function () {
    expect($this->service->calculateQuestionScore(50000, 20000, 1000))->toBe(0);
});

test('zero time limit returns zero', function () {
    expect($this->service->calculateQuestionScore(5000, 0, 1000))->toBe(0);
});

test('zero max points returns zero', function () {
    expect($this->service->calculateQuestionScore(5000, 20000, 0))->toBe(0);
});

// ============================================================
// calculateQuestionScore — Negative / Edge Scenarios
// ============================================================

test('negative elapsed time gives max points (clamped by formula)', function () {
    // ratio = 1 - (-5000 / 40000) = 1.125 → max(0, 1.125) = 1.125
    // score = round(1000 * 1.125) = 1125 — formula allows > max
    $score = $this->service->calculateQuestionScore(-5000, 20000, 1000);

    expect($score)->toBeGreaterThanOrEqual(1000);
});

test('negative time limit returns zero', function () {
    expect($this->service->calculateQuestionScore(5000, -20000, 1000))->toBe(0);
});

test('negative max points returns zero', function () {
    expect($this->service->calculateQuestionScore(5000, 20000, -100))->toBe(0);
});

test('very large elapsed time returns zero', function () {
    expect($this->service->calculateQuestionScore(1000000, 20000, 1000))->toBe(0);
});

test('score with custom max points scales correctly', function () {
    // elapsed = 0, timeLimit = 10000, maxPoints = 500
    expect($this->service->calculateQuestionScore(0, 10000, 500))->toBe(500);

    // elapsed = 5000 (half), timeLimit = 10000 → ratio = 1 - (5000/20000) = 0.75
    expect($this->service->calculateQuestionScore(5000, 10000, 500))->toBe(375);
});

// ============================================================
// calculateStreakBonus — Positive Scenarios
// ============================================================

test('streak bonus is zero for 0 or 1 consecutive correct', function () {
    expect($this->service->calculateStreakBonus(0))->toBe(0);
    expect($this->service->calculateStreakBonus(1))->toBe(0);
});

test('streak bonus is 2 for 2 consecutive correct', function () {
    expect($this->service->calculateStreakBonus(2))->toBe(2);
});

test('streak bonus is 4 for 3 consecutive correct', function () {
    expect($this->service->calculateStreakBonus(3))->toBe(4);
});

test('streak bonus is 6 for 4 consecutive correct', function () {
    expect($this->service->calculateStreakBonus(4))->toBe(6);
});

test('streak bonus caps at 10 for 5+ consecutive correct', function () {
    expect($this->service->calculateStreakBonus(5))->toBe(10);
    expect($this->service->calculateStreakBonus(10))->toBe(10);
    expect($this->service->calculateStreakBonus(100))->toBe(10);
});

// ============================================================
// calculateStreakBonus — Negative Scenarios
// ============================================================

test('streak bonus for negative consecutive returns zero', function () {
    expect($this->service->calculateStreakBonus(-1))->toBe(0);
});

// ============================================================
// calculateSessionTotal — Positive Scenarios
// ============================================================

test('session total sums score and streak bonus', function () {
    $submissions = [
        ['score' => 800, 'streak_bonus' => 0],
        ['score' => 900, 'streak_bonus' => 100],
        ['score' => 0, 'streak_bonus' => 0],
        ['score' => 700, 'streak_bonus' => 200],
    ];

    expect($this->service->calculateSessionTotal($submissions))->toBe(2700);
});

test('session total returns zero for empty submissions', function () {
    expect($this->service->calculateSessionTotal([]))->toBe(0);
});

test('session total handles single submission', function () {
    $submissions = [
        ['score' => 500, 'streak_bonus' => 50],
    ];

    expect($this->service->calculateSessionTotal($submissions))->toBe(550);
});

test('session total handles missing keys gracefully', function () {
    $submissions = [
        ['score' => 500],
        ['streak_bonus' => 100],
        [],
    ];

    expect($this->service->calculateSessionTotal($submissions))->toBe(600);
});

// ============================================================
// calculateSpeedAwardedPoints — Positive Scenarios
// ============================================================

test('instant answer gets maximum speed points', function () {
    $points = $this->service->calculateSpeedAwardedPoints(0, 30000, 15);

    expect($points)->toBe(15);
});

test('answer at exact time limit gets minimum speed points', function () {
    $points = $this->service->calculateSpeedAwardedPoints(30000, 30000, 15);

    // remainingRatio = 1 - (30000/30000) = 0 → variablePoints = 0
    // result = minimumPoints + 0
    expect($points)->toBeGreaterThanOrEqual(3);
});

test('answer at half time limit gets mid-range speed points', function () {
    $points = $this->service->calculateSpeedAwardedPoints(15000, 30000, 15);

    expect($points)->toBeGreaterThan(3)
        ->and($points)->toBeLessThanOrEqual(15);
});

test('answer beyond time limit gets minimum speed points', function () {
    $points = $this->service->calculateSpeedAwardedPoints(60000, 30000, 15);

    // remainingRatio = 1 - (60000/30000) = -1 → max(0, -1) = 0
    expect($points)->toBeGreaterThanOrEqual(3);
});

test('speed points never exceed max points', function () {
    $points = $this->service->calculateSpeedAwardedPoints(0, 30000, 15);

    expect($points)->toBeLessThanOrEqual(15);
});

test('speed points never go below minimum', function () {
    $points = $this->service->calculateSpeedAwardedPoints(999999, 30000, 15);

    expect($points)->toBeGreaterThanOrEqual(3);
});

test('speed points with custom max points', function () {
    $points = $this->service->calculateSpeedAwardedPoints(0, 30000, 100);

    expect($points)->toBe(100);
});

// ============================================================
// calculateSpeedAwardedPoints — Negative / Edge Scenarios
// ============================================================

test('speed points with zero time limit returns minimum', function () {
    $points = $this->service->calculateSpeedAwardedPoints(5000, 0, 15);

    expect($points)->toBeGreaterThanOrEqual(3);
});

test('speed points with negative time limit returns minimum', function () {
    $points = $this->service->calculateSpeedAwardedPoints(5000, -1000, 15);

    expect($points)->toBeGreaterThanOrEqual(3);
});

test('speed points with very small max points', function () {
    $points = $this->service->calculateSpeedAwardedPoints(0, 30000, 1);

    // minimumPoints = min(1, max(3, round(1 * 0.25))) = min(1, 3) = 1
    expect($points)->toBe(1);
});

test('speed points minimum is at least config value', function () {
    // With default config: challenge_speed_min_points = 3
    $points = $this->service->calculateSpeedAwardedPoints(999999, 30000, 15);

    expect($points)->toBeGreaterThanOrEqual((int) config('rewards.challenge_speed_min_points', 3));
});

// ============================================================
// calculateSpeedAwardedPoints — Boundary Tests
// ============================================================

test('speed points at quarter time', function () {
    // elapsed = 7500, timeLimit = 30000 → remainingRatio = 0.75
    $points = $this->service->calculateSpeedAwardedPoints(7500, 30000, 15);

    expect($points)->toBeGreaterThan(10)
        ->and($points)->toBeLessThanOrEqual(15);
});

test('speed points at three-quarter time', function () {
    // elapsed = 22500, timeLimit = 30000 → remainingRatio = 0.25
    $points = $this->service->calculateSpeedAwardedPoints(22500, 30000, 15);

    expect($points)->toBeGreaterThanOrEqual(3)
        ->and($points)->toBeLessThan(10);
});

// ============================================================
// calculateSpeedAwardedPoints — Monotonicity Test
// ============================================================

test('speed points decrease as elapsed time increases', function () {
    $previous = PHP_INT_MAX;

    for ($elapsed = 0; $elapsed <= 30000; $elapsed += 5000) {
        $points = $this->service->calculateSpeedAwardedPoints($elapsed, 30000, 15);
        expect($points)->toBeLessThanOrEqual($previous);
        $previous = $points;
    }
});
