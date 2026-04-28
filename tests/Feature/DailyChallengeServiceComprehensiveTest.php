<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Services\DailyChallengeService;

beforeEach(function () {
    $this->service = new DailyChallengeService;
});

// ============================================================
// getTodaysChallenge — Positive Scenarios
// ============================================================

test('returns todays daily challenge when one exists', function () {
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    $result = $this->service->getTodaysChallenge();

    expect($result)->not->toBeNull()
        ->and($result->id)->toBe($challenge->id);
});

test('returns null when no daily challenge exists', function () {
    // Create a non-daily challenge
    Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => false,
    ]);

    $result = $this->service->getTodaysChallenge();

    expect($result)->toBeNull();
});

test('returns null when daily challenge is for different date', function () {
    Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->subDay()->toDateString(),
    ]);

    $result = $this->service->getTodaysChallenge();

    expect($result)->toBeNull();
});

test('returns null when daily challenge is unpublished', function () {
    Challenge::factory()->create([
        'is_published' => false,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    $result = $this->service->getTodaysChallenge();

    expect($result)->toBeNull();
});

// ============================================================
// getTodaysChallenge — Edge Scenarios
// ============================================================

test('returns first daily challenge when multiple exist for today', function () {
    Challenge::factory()->count(3)->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    $result = $this->service->getTodaysChallenge();

    expect($result)->not->toBeNull();
});

test('ignores future daily challenges', function () {
    Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->addDay()->toDateString(),
    ]);

    $result = $this->service->getTodaysChallenge();

    expect($result)->toBeNull();
});

// ============================================================
// hasUserSolvedToday — Positive Scenarios
// ============================================================

test('returns true when user solved challenge today', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'submitted_at' => now(),
    ]);

    $result = $this->service->hasUserSolvedToday($user->id, $challenge);

    expect($result)->toBeTrue();
});

test('returns false when user has not submitted today', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    $result = $this->service->hasUserSolvedToday($user->id, $challenge);

    expect($result)->toBeFalse();
});

test('returns false when user submitted incorrect answer today', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => false,
        'submitted_at' => now(),
    ]);

    $result = $this->service->hasUserSolvedToday($user->id, $challenge);

    expect($result)->toBeFalse();
});

test('returns false when user solved challenge yesterday', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'submitted_at' => now()->subDay(),
    ]);

    $result = $this->service->hasUserSolvedToday($user->id, $challenge);

    expect($result)->toBeFalse();
});

// ============================================================
// hasUserSolvedToday — Negative / Edge Scenarios
// ============================================================

test('returns false for different user who solved it', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $otherUser->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'submitted_at' => now(),
    ]);

    $result = $this->service->hasUserSolvedToday($user->id, $challenge);

    expect($result)->toBeFalse();
});

test('returns true even with multiple submissions if one is correct today', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    // Multiple incorrect attempts
    ChallengeSubmission::factory()->count(3)->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => false,
        'submitted_at' => now(),
    ]);

    // One correct attempt
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'submitted_at' => now(),
    ]);

    $result = $this->service->hasUserSolvedToday($user->id, $challenge);

    expect($result)->toBeTrue();
});
