<?php

use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Services\XpService;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

// --- Quiz Session Generation ---

test('challenge show returns quiz session when question bank exists', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    ChallengeQuestion::factory()->count(5)->create([
        'challenge_id' => $challenge->id,
    ]);

    $this->actingAs($user)
        ->get(route('challenges.show', $challenge->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/show')
            ->has('quizSession.sessionId')
            ->has('quizSession.questions', 5)
            ->where('challenge.hasQuestionBank', true)
        );
});

test('challenge show returns legacy mode when no question bank', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    $this->actingAs($user)
        ->get(route('challenges.show', $challenge->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/show')
            ->where('quizSession', null)
            ->where('challenge.hasQuestionBank', false)
        );
});

test('quiz session questions do not expose correct answer', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'secret-answer',
    ]);

    $response = $this->actingAs($user)
        ->get(route('challenges.show', $challenge->slug));

    $page = $response->original->getData()['page']['props'];
    $questions = $page['quizSession']['questions'];

    expect($questions[0])->not->toHaveKey('correct_answer');
    expect($questions[0])->not->toHaveKey('correctAnswer');
});

// --- Quiz Submit ---

test('quiz submit scores correct answer with Kahoot formula', function () {
    $user = User::factory()->create(['points' => 0]);
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'max_points_per_question' => 1000,
    ]);

    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
    ]);

    $sessionId = (string) Str::uuid();

    $response = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => $sessionId,
            'challenge_question_id' => $question->id,
            'answer' => 'aes', // case-insensitive
            'elapsed_ms' => 5000,
            'question_index' => 0,
            'consecutive_correct' => 0,
        ]);

    $response->assertOk()
        ->assertJson([
            'isCorrect' => true,
            'correctAnswer' => 'AES',
        ]);

    // Score should be > 0 for fast correct answer
    expect($response->json('questionScore'))->toBeGreaterThan(0);

    // Submission should be persisted
    expect(ChallengeSubmission::query()
        ->where('session_id', $sessionId)
        ->where('challenge_question_id', $question->id)
        ->exists()
    )->toBeTrue();
});

test('quiz submit returns zero score for wrong answer', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => (string) Str::uuid(),
            'challenge_question_id' => $question->id,
            'answer' => 'DES',
            'elapsed_ms' => 5000,
            'question_index' => 0,
            'consecutive_correct' => 0,
        ]);

    $response->assertOk()
        ->assertJson([
            'isCorrect' => false,
            'questionScore' => 0,
            'streakBonus' => 0,
        ]);
});

test('quiz submit includes streak bonus for consecutive correct', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);

    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => (string) Str::uuid(),
            'challenge_question_id' => $question->id,
            'answer' => 'AES',
            'elapsed_ms' => 5000,
            'question_index' => 2,
            'consecutive_correct' => 2, // will become 3 → 4 bonus
        ]);

    $response->assertOk();
    expect($response->json('streakBonus'))->toBe(4);
});

test('quiz submit rejects question from different challenge', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $otherChallenge = Challenge::factory()->create(['is_published' => true]);

    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $otherChallenge->id,
    ]);

    $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => (string) Str::uuid(),
            'challenge_question_id' => $question->id,
            'answer' => 'test',
            'elapsed_ms' => 5000,
            'question_index' => 0,
            'consecutive_correct' => 0,
        ])
        ->assertNotFound();
});

// --- Session Summary ---

test('session summary calculates totals and awards points and xp on first session', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'last_active_date' => now()->toDateString(),
        'current_streak' => 1,
        'daily_goal_met_at' => now()->toDateString(),
    ]);
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $sessionId = (string) Str::uuid();

    // Create some submissions for this session
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'is_correct' => true,
        'score' => 800,
        'streak_bonus' => 0,
        'question_index' => 0,
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'is_correct' => true,
        'score' => 900,
        'streak_bonus' => 100,
        'question_index' => 1,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge->slug), [
            'session_id' => $sessionId,
        ]);

    $response->assertOk()
        ->assertJson([
            'totalScore' => 1700,
            'totalStreakBonus' => 100,
            'totalPoints' => 1800,
            'correctCount' => 2,
            'totalQuestions' => 2,
            'isFirstSession' => true,
        ]);

    // Points include level bonus + perfect score bonus (all 2 correct)
    $fresh = $user->fresh();
    expect($fresh->points)->toBeGreaterThanOrEqual(1800);
    // XP = challenge_quiz_session_xp(20) + perfect_score_xp(50) — no streak XP since same day
    $sessionXp = (int) config('rewards.challenge_quiz_session_xp');
    $perfectXp = (int) config('rewards.perfect_score_xp');
    expect($fresh->xp)->toBe($sessionXp + $perfectXp);
    expect($response->json('awardedXp'))->toBe($sessionXp + $perfectXp);
    expect($response->json('isPerfectScore'))->toBeTrue();
});

test('session summary does not award points or xp on subsequent sessions', function () {
    $user = User::factory()->create(['points' => 500, 'xp' => 50, 'last_active_date' => now()->toDateString()]);
    $challenge = Challenge::factory()->create(['is_published' => true]);

    $firstSessionId = (string) Str::uuid();
    $secondSessionId = (string) Str::uuid();

    // First session (already completed)
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $firstSessionId,
        'is_correct' => true,
        'score' => 500,
        'streak_bonus' => 0,
    ]);

    // Second session
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $secondSessionId,
        'is_correct' => true,
        'score' => 900,
        'streak_bonus' => 100,
        'question_index' => 0,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge->slug), [
            'session_id' => $secondSessionId,
        ]);

    $response->assertOk()
        ->assertJson([
            'isFirstSession' => false,
            'awardedPoints' => 0,
            'awardedXp' => 0,
        ]);

    // Points and XP should not change (last_active_date = today, so no streak XP)
    $fresh = $user->fresh();
    expect($fresh->points)->toBe(500);
    expect($fresh->xp)->toBe(50);
});

// --- Daily Streak ---

test('daily streak increments on consecutive days and awards XP', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'current_streak' => 3,
        'longest_streak' => 5,
        'last_active_date' => now()->subDay()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(4);
    expect($fresh->longest_streak)->toBe(5);
    // New streak = 4 (3-6 tier) → 3 XP
    expect($result['xp'])->toBe(3);
    expect($result['bonuses'])->toBeEmpty();
    expect($fresh->xp)->toBe(3);
});

test('daily streak resets after gap and awards base XP', function () {
    $user = User::factory()->create([
        'xp' => 100,
        'current_streak' => 5,
        'longest_streak' => 5,
        'last_active_date' => now()->subDays(3)->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(1);
    expect($fresh->longest_streak)->toBe(5);
    // Reset to streak 1 (0-2 tier) → 2 XP (gap=3 days, below comeback threshold of 7)
    expect($result['xp'])->toBe(2);
    expect($result['bonuses'])->toBeEmpty();
    expect($fresh->xp)->toBe(102);
});

test('daily streak updates longest streak when surpassed and awards XP', function () {
    $user = User::factory()->create([
        'xp' => 50,
        'current_streak' => 5,
        'longest_streak' => 5,
        'last_active_date' => now()->subDay()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(6);
    expect($fresh->longest_streak)->toBe(6);
    // New streak = 6 (3-6 tier) → 3 XP
    expect($result['xp'])->toBe(3);
    expect($result['bonuses'])->toBeEmpty();
    expect($fresh->xp)->toBe(53);
});

test('daily streak does not double-increment on same day and awards no XP', function () {
    $user = User::factory()->create([
        'xp' => 20,
        'current_streak' => 3,
        'longest_streak' => 3,
        'last_active_date' => now()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    expect($user->fresh()->current_streak)->toBe(3);
    expect($result)->toBe(['xp' => 0, 'bonuses' => []]);
    expect($user->fresh()->xp)->toBe(20);
});

// --- Backward Compatibility ---

test('legacy speed round submit still works', function () {
    $user = User::factory()->create(['points' => 0]);
    $challenge = Challenge::factory()->create(['is_published' => true]);

    $this->actingAs($user)
        ->postJson(route('challenges.quick-submit', $challenge->slug), [
            'answer' => $challenge->getRawOriginal('expected_answer'),
            'elapsed_ms' => 5000,
        ])
        ->assertOk()
        ->assertJsonStructure(['isCorrect', 'awardedPoints', 'totalPoints']);
});
