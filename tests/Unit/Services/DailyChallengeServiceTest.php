<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Services\DailyChallengeService;

beforeEach(function () {
    $this->service = new DailyChallengeService;
});

test('returns todays daily challenge', function () {
    $daily = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);
    Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => false,
    ]);

    $result = $this->service->getTodaysChallenge();

    expect($result)->not->toBeNull()
        ->and($result->id)->toBe($daily->id);
});

test('returns null when no daily challenge', function () {
    Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => false,
    ]);

    expect($this->service->getTodaysChallenge())->toBeNull();
});

test('detects user solved today', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true, 'is_daily' => true, 'daily_date' => now()->toDateString()]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'submitted_at' => now(),
    ]);

    expect($this->service->hasUserSolvedToday($user->id, $challenge))->toBeTrue();
});

test('returns false when user has not solved today', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true, 'is_daily' => true, 'daily_date' => now()->toDateString()]);

    expect($this->service->hasUserSolvedToday($user->id, $challenge))->toBeFalse();
});

test('returns false when user solved yesterday not today', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true, 'is_daily' => true, 'daily_date' => now()->toDateString()]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'submitted_at' => now()->subDay(),
    ]);

    expect($this->service->hasUserSolvedToday($user->id, $challenge))->toBeFalse();
});
