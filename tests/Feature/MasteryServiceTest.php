<?php

use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\Topic;
use App\Models\User;
use App\Services\MasteryService;

beforeEach(function () {
    $this->service = new MasteryService;
});

// ============================================================
// getUserMastery — Positive Scenarios
// ============================================================

test('returns empty array for user with no attempts', function () {
    $user = User::factory()->create();

    $result = $this->service->getUserMastery($user);

    expect($result)->toBe([]);
});

test('calculates mastery for single topic via challenge submissions', function () {
    $user = User::factory()->create();
    $topic = Topic::factory()->create(['name' => 'PHP Basics']);
    $challenge = Challenge::factory()->create();
    $challenge->topics()->attach($topic);

    // 3 correct, 1 incorrect = 75% mastery
    ChallengeSubmission::factory()->count(3)->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => false,
    ]);

    $result = $this->service->getUserMastery($user);

    expect($result)->toHaveCount(1);
    expect($result[0]['topic'])->toBe('PHP Basics');
    expect($result[0]['mastery'])->toBe(75.0);
    expect($result[0]['attempts'])->toBe(4);
    expect($result[0]['correct'])->toBe(3);
});

test('calculates mastery for multiple topics', function () {
    $user = User::factory()->create();
    $topicPHP = Topic::factory()->create(['name' => 'PHP']);
    $topicJS = Topic::factory()->create(['name' => 'JavaScript']);

    $challengePHP = Challenge::factory()->create();
    $challengePHP->topics()->attach($topicPHP);

    $challengeJS = Challenge::factory()->create();
    $challengeJS->topics()->attach($topicJS);

    // PHP: 2/2 = 100%
    ChallengeSubmission::factory()->count(2)->create([
        'user_id' => $user->id,
        'challenge_id' => $challengePHP->id,
        'is_correct' => true,
    ]);

    // JS: 1/3 = 33.3%
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challengeJS->id,
        'is_correct' => true,
    ]);
    ChallengeSubmission::factory()->count(2)->create([
        'user_id' => $user->id,
        'challenge_id' => $challengeJS->id,
        'is_correct' => false,
    ]);

    $result = $this->service->getUserMastery($user);

    expect($result)->toHaveCount(2);

    $phpMastery = collect($result)->firstWhere('topic', 'PHP');
    $jsMastery = collect($result)->firstWhere('topic', 'JavaScript');

    expect($phpMastery['mastery'])->toBe(100.0)
        ->and($phpMastery['correct'])->toBe(2)
        ->and($phpMastery['attempts'])->toBe(2);

    expect($jsMastery['mastery'])->toBe(33.3)
        ->and($jsMastery['correct'])->toBe(1)
        ->and($jsMastery['attempts'])->toBe(3);
});

test('calculates mastery from quiz question submissions', function () {
    $user = User::factory()->create();
    $topic = Topic::factory()->create(['name' => 'Algorithms']);
    $challenge = Challenge::factory()->create();
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'topic_id' => $topic->id,
    ]);

    // 2 correct, 1 incorrect via quiz questions
    ChallengeSubmission::factory()->count(2)->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'challenge_question_id' => $question->id,
        'is_correct' => true,
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'challenge_question_id' => $question->id,
        'is_correct' => false,
    ]);

    $result = $this->service->getUserMastery($user);

    $algoMastery = collect($result)->firstWhere('topic', 'Algorithms');

    expect($algoMastery)->not->toBeNull()
        ->and($algoMastery['mastery'])->toBe(66.7);
});

test('100% mastery when all answers are correct', function () {
    $user = User::factory()->create();
    $topic = Topic::factory()->create(['name' => 'Perfect Topic']);
    $challenge = Challenge::factory()->create();
    $challenge->topics()->attach($topic);

    ChallengeSubmission::factory()->count(5)->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
    ]);

    $result = $this->service->getUserMastery($user);

    expect($result[0]['mastery'])->toBe(100.0);
});

test('0% mastery when all answers are incorrect', function () {
    $user = User::factory()->create();
    $topic = Topic::factory()->create(['name' => 'Hard Topic']);
    $challenge = Challenge::factory()->create();
    $challenge->topics()->attach($topic);

    ChallengeSubmission::factory()->count(3)->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => false,
    ]);

    $result = $this->service->getUserMastery($user);

    expect($result[0]['mastery'])->toBe(0.0);
});

// ============================================================
// getUserMastery — Negative / Edge Scenarios
// ============================================================

test('does not include other users submissions', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $topic = Topic::factory()->create(['name' => 'Exclusive']);
    $challenge = Challenge::factory()->create();
    $challenge->topics()->attach($topic);

    ChallengeSubmission::factory()->count(3)->create([
        'user_id' => $otherUser->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
    ]);

    $result = $this->service->getUserMastery($user);

    expect($result)->toBe([]);
});

test('handles challenge with multiple topics', function () {
    $user = User::factory()->create();
    $topic1 = Topic::factory()->create(['name' => 'Topic A']);
    $topic2 = Topic::factory()->create(['name' => 'Topic B']);
    $challenge = Challenge::factory()->create();
    $challenge->topics()->attach([$topic1->id, $topic2->id]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
    ]);

    $result = $this->service->getUserMastery($user);

    // Each topic should have its own mastery entry
    expect(count($result))->toBeGreaterThanOrEqual(2);
});
