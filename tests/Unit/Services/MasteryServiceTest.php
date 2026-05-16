<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Topic;
use App\Models\User;
use App\Services\MasteryService;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->service = new MasteryService;
});

test('returns empty array for user with no attempts', function () {
    $user = User::factory()->create();

    expect($this->service->getUserMastery($user))->toBeEmpty();
});

test('calculates mastery from challenge submissions', function () {
    $user = User::factory()->create();
    $topic = Topic::factory()->create(['name' => 'Encryption']);
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $challenge->topics()->attach($topic->id);

    // 2 correct, 1 wrong = 66.7% mastery
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => false,
    ]);

    $mastery = $this->service->getUserMastery($user);

    expect($mastery)->not->toBeEmpty()
        ->and($mastery[0]['topic'])->toBe('Encryption')
        ->and($mastery[0]['mastery'])->toBe(66.7)
        ->and($mastery[0]['attempts'])->toBe(3)
        ->and($mastery[0]['correct'])->toBe(2);
});

test('aggregates mastery with a single database query', function () {
    $user = User::factory()->create();
    $topic = Topic::factory()->create(['name' => 'Caesar']);
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $challenge->topics()->attach($topic->id);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => false,
    ]);

    DB::enableQueryLog();

    $mastery = $this->service->getUserMastery($user);

    $queryCount = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($mastery)->toHaveCount(1)
        ->and($mastery[0]['attempts'])->toBe(2)
        ->and($queryCount)->toBeLessThanOrEqual(1);
});
