<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Services\DailyChallengeService;

test('get todays challenge returns daily challenge for today', function () {
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    $service = app(DailyChallengeService::class);
    $result = $service->getTodaysChallenge();

    expect($result)->not->toBeNull();
    expect($result->id)->toBe($challenge->id);
});

test('get todays challenge returns null when no daily challenge', function () {
    Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => false,
    ]);

    $service = app(DailyChallengeService::class);
    $result = $service->getTodaysChallenge();

    expect($result)->toBeNull();
});

test('has user solved today returns true when solved', function () {
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

    $service = app(DailyChallengeService::class);
    expect($service->hasUserSolvedToday($user->id, $challenge))->toBeTrue();
});

test('has user solved today returns false when not solved', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'is_daily' => true,
        'daily_date' => now()->toDateString(),
    ]);

    $service = app(DailyChallengeService::class);
    expect($service->hasUserSolvedToday($user->id, $challenge))->toBeFalse();
});
