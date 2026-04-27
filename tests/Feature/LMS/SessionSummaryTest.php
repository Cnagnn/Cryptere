<?php

use App\Events\XpAwarded;
use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

test('session summary awards xp and points on first session', function () {
    Event::fake([XpAwarded::class]);

    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0]);
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $question = ChallengeQuestion::factory()->create(['challenge_id' => $challenge->id]);

    $sessionId = (string) Str::uuid();

    ChallengeSubmission::create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'challenge_question_id' => $question->id,
        'answer' => $question->correct_answer,
        'is_correct' => true,
        'score' => 100,
        'elapsed_ms' => 5000,
        'streak_bonus' => 0,
        'question_index' => 0,
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge), [
            'session_id' => $sessionId,
        ]);

    $response->assertOk();
    $response->assertJsonPath('isFirstSession', true);
    $response->assertJsonPath('correctCount', 1);

    expect($response->json('awardedXp'))->toBeGreaterThan(0);
    expect($response->json('awardedPoints'))->toBeGreaterThan(0);

    Event::assertDispatched(XpAwarded::class);
});

test('session summary does not double-award on repeat session', function () {
    Event::fake([XpAwarded::class]);

    $user = User::factory()->create(['xp' => 0, 'points' => 0]);
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $question = ChallengeQuestion::factory()->create(['challenge_id' => $challenge->id]);

    // First session
    $firstSessionId = (string) Str::uuid();
    ChallengeSubmission::create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $firstSessionId,
        'challenge_question_id' => $question->id,
        'answer' => $question->correct_answer,
        'is_correct' => true,
        'score' => 100,
        'elapsed_ms' => 5000,
        'streak_bonus' => 0,
        'question_index' => 0,
        'submitted_at' => now(),
    ]);

    // Trigger first session summary to award points
    $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge), [
            'session_id' => $firstSessionId,
        ]);

    $pointsAfterFirst = $user->fresh()->points;

    // Second session
    $secondSessionId = (string) Str::uuid();
    ChallengeSubmission::create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $secondSessionId,
        'challenge_question_id' => $question->id,
        'answer' => $question->correct_answer,
        'is_correct' => true,
        'score' => 100,
        'elapsed_ms' => 4000,
        'streak_bonus' => 0,
        'question_index' => 0,
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge), [
            'session_id' => $secondSessionId,
        ]);

    $response->assertOk();
    $response->assertJsonPath('isFirstSession', false);
    $response->assertJsonPath('awardedXp', 0);
    $response->assertJsonPath('awardedPoints', 0);

    // Points should not increase on repeat session
    expect($user->fresh()->points)->toBe($pointsAfterFirst);
});

test('session summary awards perfect score bonus when all correct', function () {
    Event::fake([XpAwarded::class]);

    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0]);
    $challenge = Challenge::factory()->create(['is_published' => true]);

    $questions = ChallengeQuestion::factory()
        ->count(3)
        ->sequence(
            ['sort_order' => 0],
            ['sort_order' => 1],
            ['sort_order' => 2],
        )
        ->create(['challenge_id' => $challenge->id]);

    $sessionId = (string) Str::uuid();

    foreach ($questions as $index => $question) {
        ChallengeSubmission::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'session_id' => $sessionId,
            'challenge_question_id' => $question->id,
            'answer' => $question->correct_answer,
            'is_correct' => true,
            'score' => 100,
            'elapsed_ms' => 3000,
            'streak_bonus' => 0,
            'question_index' => $index,
            'submitted_at' => now(),
        ]);
    }

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge), [
            'session_id' => $sessionId,
        ]);

    $response->assertOk();
    $response->assertJsonPath('isPerfectScore', true);
    $response->assertJsonPath('isFirstSession', true);

    $perfectXp = (int) config('rewards.perfect_score_xp', 50);
    $baseXp = (int) config('rewards.challenge_quiz_session_xp', 20);

    expect($response->json('awardedXp'))->toBe($baseXp + $perfectXp);
});

test('session summary returns 404 for unknown session', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge), [
            'session_id' => (string) Str::uuid(),
        ]);

    $response->assertNotFound();
});
