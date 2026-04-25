<?php

use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

// --- Show page: hasCompletedSession flag ---

test('show page sets hasCompletedSession to false when user has no submissions', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    ChallengeQuestion::factory()->count(3)->create([
        'challenge_id' => $challenge->id,
    ]);

    $this->actingAs($user)
        ->get(route('challenges.show', $challenge->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/show')
            ->where('challenge.hasCompletedSession', false)
            ->has('quizSession.sessionId')
            ->has('quizSession.questions', 3)
        );
});

test('show page sets hasCompletedSession to true when user has completed a session', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    ChallengeQuestion::factory()->count(3)->create([
        'challenge_id' => $challenge->id,
    ]);

    // Simulate a completed session
    $sessionId = (string) Str::uuid();
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
    ]);

    $this->actingAs($user)
        ->get(route('challenges.show', $challenge->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/show')
            ->where('challenge.hasCompletedSession', true)
            ->where('quizSession', null)
        );
});

test('show page does not generate quiz session when user already completed', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    ChallengeQuestion::factory()->count(5)->create([
        'challenge_id' => $challenge->id,
    ]);

    // Completed session
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => (string) Str::uuid(),
    ]);

    $this->actingAs($user)
        ->get(route('challenges.show', $challenge->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/show')
            ->where('quizSession', null)
        );
});

// --- Quiz submit: one-attempt enforcement ---

test('quiz submit blocks submission when user already completed a different session', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
    ]);

    // First completed session
    $firstSessionId = (string) Str::uuid();
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $firstSessionId,
    ]);

    // Attempt a new session
    $newSessionId = (string) Str::uuid();

    $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => $newSessionId,
            'challenge_question_id' => $question->id,
            'answer' => 'AES',
            'elapsed_ms' => 5000,
            'question_index' => 0,
            'consecutive_correct' => 0,
        ])
        ->assertStatus(422)
        ->assertJson([
            'message' => 'You have already completed this challenge.',
        ]);
});

test('quiz submit allows submission within the same session', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'max_points_per_question' => 1000,
    ]);

    $question1 = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
    ]);

    $question2 = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'RSA',
    ]);

    $sessionId = (string) Str::uuid();

    // First submission in session
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'challenge_question_id' => $question1->id,
    ]);

    // Second submission in same session should succeed
    $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => $sessionId,
            'challenge_question_id' => $question2->id,
            'answer' => 'RSA',
            'elapsed_ms' => 5000,
            'question_index' => 1,
            'consecutive_correct' => 1,
        ])
        ->assertOk()
        ->assertJson([
            'isCorrect' => true,
        ]);
});

// --- Index page: hasCompletedSession flag ---

test('challenge index includes hasCompletedSession flag', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    ChallengeQuestion::factory()->count(3)->create([
        'challenge_id' => $challenge->id,
    ]);

    // No submissions yet
    $this->actingAs($user)
        ->get(route('challenges.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/index')
            ->has('challenges', 1, fn (Assert $challenge) => $challenge
                ->where('hasCompletedSession', false)
                ->etc()
            )
        );
});

test('challenge index marks hasCompletedSession true for completed challenges', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    ChallengeQuestion::factory()->count(3)->create([
        'challenge_id' => $challenge->id,
    ]);

    // Completed session
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => (string) Str::uuid(),
    ]);

    $this->actingAs($user)
        ->get(route('challenges.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/index')
            ->has('challenges', 1, fn (Assert $challenge) => $challenge
                ->where('hasCompletedSession', true)
                ->etc()
            )
        );
});
