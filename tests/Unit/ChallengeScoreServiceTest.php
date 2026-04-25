<?php

use App\Services\ChallengeScoreService;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->service = new ChallengeScoreService;
});

// --- calculateQuestionScore ---

test('instant answer gets maximum points', function () {
    expect($this->service->calculateQuestionScore(0, 20000, 1000))->toBe(1000);
});

test('answer at half time limit gets 750 points', function () {
    // elapsed = 10000ms, timeLimit = 20000ms → ratio = 1 - (10000/40000) = 0.75
    expect($this->service->calculateQuestionScore(10000, 20000, 1000))->toBe(750);
});

test('answer at exact time limit gets 500 points', function () {
    // elapsed = 20000ms, timeLimit = 20000ms → ratio = 1 - (20000/40000) = 0.5
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

// --- calculateStreakBonus ---

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
});

// --- calculateSessionTotal ---

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
