<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Services\ChallengeScoreService;

beforeEach(function () {
    $this->service = app(ChallengeScoreService::class);
});

// --- Question Score (Kahoot-style decay) ---

test('instant answer gets max points', function () {
    $score = $this->service->calculateQuestionScore(0, 10000, 1000);

    expect($score)->toBe(1000);
});

test('answer at time limit gets half points', function () {
    $score = $this->service->calculateQuestionScore(10000, 10000, 1000);

    expect($score)->toBe(500); // 1 - (10000 / 20000) = 0.5
});

test('answer at 2x time limit gets zero', function () {
    $score = $this->service->calculateQuestionScore(20000, 10000, 1000);

    expect($score)->toBe(0);
});

test('answer beyond 2x time limit gets zero', function () {
    $score = $this->service->calculateQuestionScore(30000, 10000, 1000);

    expect($score)->toBe(0);
});

test('zero time limit returns zero', function () {
    expect($this->service->calculateQuestionScore(5000, 0, 1000))->toBe(0);
});

test('zero max points returns zero', function () {
    expect($this->service->calculateQuestionScore(5000, 10000, 0))->toBe(0);
});

// --- Streak Bonus ---

test('streak bonus scales with consecutive correct', function () {
    expect($this->service->calculateStreakBonus(0))->toBe(0);
    expect($this->service->calculateStreakBonus(1))->toBe(0);
    expect($this->service->calculateStreakBonus(2))->toBeGreaterThan(0);
});

test('streak bonus caps at last table value', function () {
    $table = config('rewards.challenge_streak_bonus', [0, 0, 2, 4, 6, 10]);
    $maxBonus = (int) end($table);

    expect($this->service->calculateStreakBonus(100))->toBe($maxBonus);
});

// --- Session Total ---

test('calculateSessionTotal sums scores and streak bonuses', function () {
    $submissions = [
        ['score' => 800, 'streak_bonus' => 0],
        ['score' => 600, 'streak_bonus' => 2],
        ['score' => 900, 'streak_bonus' => 4],
    ];

    $total = $this->service->calculateSessionTotal($submissions);

    expect($total)->toBe(2306);
});

test('calculateSessionTotal handles empty array', function () {
    expect($this->service->calculateSessionTotal([]))->toBe(0);
});

// --- Session Consecutive Correct ---

test('getSessionConsecutiveCorrect counts trailing correct answers', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();
    $sessionId = 99001;

    // Create submissions: correct, wrong, correct, correct (last 2 are streak)
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'question_index' => 0,
        'is_correct' => true,
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'question_index' => 1,
        'is_correct' => false,
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'question_index' => 2,
        'is_correct' => true,
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'question_index' => 3,
        'is_correct' => true,
    ]);

    $streak = $this->service->getSessionConsecutiveCorrect($user->id, $challenge->id, $sessionId);

    expect($streak)->toBe(2);
});

// --- Speed Awarded Points ---

test('calculateSpeedAwardedPoints gives max for instant answer', function () {
    $points = $this->service->calculateSpeedAwardedPoints(0, 10000, 15);

    expect($points)->toBe(15);
});

test('calculateSpeedAwardedPoints gives minimum for slow answer', function () {
    $points = $this->service->calculateSpeedAwardedPoints(20000, 10000, 15);

    $minPoints = (int) config('rewards.challenge_speed_min_points', 3);
    expect($points)->toBeGreaterThanOrEqual($minPoints);
});

test('calculateSpeedAwardedPoints returns minimum for zero time limit', function () {
    $points = $this->service->calculateSpeedAwardedPoints(5000, 0, 15);

    $minPoints = (int) config('rewards.challenge_speed_min_points', 3);
    expect($points)->toBeGreaterThanOrEqual($minPoints);
});
