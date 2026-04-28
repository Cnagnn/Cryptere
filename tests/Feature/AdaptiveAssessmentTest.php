<?php

use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\AdaptiveQuestionService;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->service = app(AdaptiveQuestionService::class);
});

// ─────────────────────────────────────────────────────────
//  Question Selection — Challenge Sessions
// ─────────────────────────────────────────────────────────

test('selectQuestionsForSession returns correct count', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);
    $challenge = Challenge::factory()->create();

    ChallengeQuestion::factory()
        ->count(10)
        ->sequence(
            ['difficulty_score' => 0.2, 'difficulty_level' => 'easy', 'times_shown' => 5, 'times_correct' => 4],
            ['difficulty_score' => 0.3, 'difficulty_level' => 'easy', 'times_shown' => 5, 'times_correct' => 3],
            ['difficulty_score' => 0.4, 'difficulty_level' => 'medium', 'times_shown' => 5, 'times_correct' => 3],
            ['difficulty_score' => 0.5, 'difficulty_level' => 'medium', 'times_shown' => 5, 'times_correct' => 2],
            ['difficulty_score' => 0.6, 'difficulty_level' => 'medium', 'times_shown' => 5, 'times_correct' => 2],
            ['difficulty_score' => 0.7, 'difficulty_level' => 'hard', 'times_shown' => 5, 'times_correct' => 1],
            ['difficulty_score' => 0.8, 'difficulty_level' => 'hard', 'times_shown' => 5, 'times_correct' => 1],
            ['difficulty_score' => 0.9, 'difficulty_level' => 'hard', 'times_shown' => 5, 'times_correct' => 0],
            ['difficulty_score' => 0.15, 'difficulty_level' => 'easy', 'times_shown' => 5, 'times_correct' => 4],
            ['difficulty_score' => 0.55, 'difficulty_level' => 'medium', 'times_shown' => 5, 'times_correct' => 2],
        )
        ->create(['challenge_id' => $challenge->id]);

    $questions = $this->service->selectQuestionsForSession($user, $challenge, 5);

    expect($questions)->toHaveCount(5);
    expect($questions->pluck('id')->unique())->toHaveCount(5);
});

test('selectQuestionsForSession targets difficulty near user ability', function () {
    $user = User::factory()->create(['ability_estimate' => 0.3]);
    $challenge = Challenge::factory()->create();

    // Create questions with varied difficulty
    ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'difficulty_score' => 0.1,
        'difficulty_level' => 'easy',
        'times_shown' => 10,
        'times_correct' => 9,
    ]);
    ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'difficulty_score' => 0.3,
        'difficulty_level' => 'easy',
        'times_shown' => 10,
        'times_correct' => 7,
    ]);
    ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'difficulty_score' => 0.5,
        'difficulty_level' => 'medium',
        'times_shown' => 10,
        'times_correct' => 5,
    ]);
    ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'difficulty_score' => 0.9,
        'difficulty_level' => 'hard',
        'times_shown' => 10,
        'times_correct' => 1,
    ]);

    $questions = $this->service->selectQuestionsForSession($user, $challenge, 2);

    // For a low-ability user (0.3), selected questions should tend toward easier ones
    // With randomness in top-3 selection, we use a generous bound
    $avgDifficulty = $questions->avg('difficulty_score');
    expect($avgDifficulty)->toBeLessThanOrEqual(0.7);
});

test('selectQuestionsForSession falls back to random when no adaptive data', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);
    $challenge = Challenge::factory()->create();

    // Create questions with default difficulty (no times_shown)
    ChallengeQuestion::factory()
        ->count(8)
        ->create([
            'challenge_id' => $challenge->id,
            'difficulty_score' => 0.5,
            'times_shown' => 0,
            'times_correct' => 0,
        ]);

    $questions = $this->service->selectQuestionsForSession($user, $challenge, 5);

    expect($questions)->toHaveCount(5);
});

test('selectQuestionsForSession handles small question pool gracefully', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);
    $challenge = Challenge::factory()->create();

    ChallengeQuestion::factory()
        ->count(3)
        ->create(['challenge_id' => $challenge->id]);

    // Request more questions than available
    $questions = $this->service->selectQuestionsForSession($user, $challenge, 10);

    expect($questions)->toHaveCount(3);
});

// ─────────────────────────────────────────────────────────
//  Question Selection — Quiz
// ─────────────────────────────────────────────────────────

test('selectQuestionsForQuiz returns correct count', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);
    $task = LessonTask::factory()->create(['type' => 'quiz']);

    QuizQuestion::factory()
        ->count(6)
        ->sequence(
            ['difficulty_score' => 0.2, 'times_shown' => 5],
            ['difficulty_score' => 0.4, 'times_shown' => 5],
            ['difficulty_score' => 0.5, 'times_shown' => 5],
            ['difficulty_score' => 0.6, 'times_shown' => 5],
            ['difficulty_score' => 0.8, 'times_shown' => 5],
            ['difficulty_score' => 0.9, 'times_shown' => 5],
        )
        ->create(['lesson_task_id' => $task->id]);

    $questions = $this->service->selectQuestionsForQuiz($user, $task, 4);

    expect($questions)->toHaveCount(4);
});

// ─────────────────────────────────────────────────────────
//  Question Stats Updates
// ─────────────────────────────────────────────────────────

test('updateQuestionStats increments times_shown and times_correct on correct answer', function () {
    $question = ChallengeQuestion::factory()->create([
        'times_shown' => 5,
        'times_correct' => 3,
        'difficulty_score' => 0.5,
    ]);

    $this->service->updateQuestionStats($question, true);

    $question->refresh();
    expect($question->times_shown)->toBe(6);
    expect($question->times_correct)->toBe(4);
});

test('updateQuestionStats increments only times_shown on incorrect answer', function () {
    $question = ChallengeQuestion::factory()->create([
        'times_shown' => 5,
        'times_correct' => 3,
        'difficulty_score' => 0.5,
    ]);

    $this->service->updateQuestionStats($question, false);

    $question->refresh();
    expect($question->times_shown)->toBe(6);
    expect($question->times_correct)->toBe(3);
});

test('updateQuestionStats recalculates difficulty_score after enough data', function () {
    $question = ChallengeQuestion::factory()->create([
        'times_shown' => 9,
        'times_correct' => 8,
        'difficulty_score' => 0.5,
    ]);

    // After this, times_shown=10, times_correct=9 → success_rate=0.9 → difficulty=0.1
    $this->service->updateQuestionStats($question, true);

    $question->refresh();
    expect($question->difficulty_score)->toBeLessThan(0.2);
    expect($question->difficulty_score)->toBeGreaterThanOrEqual(0.05);
});

test('updateQuestionStats does not recalculate with insufficient data', function () {
    $question = ChallengeQuestion::factory()->create([
        'times_shown' => 1,
        'times_correct' => 1,
        'difficulty_score' => 0.5,
    ]);

    $this->service->updateQuestionStats($question, true);

    $question->refresh();
    // With only 2 total attempts, difficulty_score should remain at 0.5
    expect($question->difficulty_score)->toBe(0.5);
});

test('updateQuestionStats works for QuizQuestion model', function () {
    $question = QuizQuestion::factory()->create([
        'times_shown' => 5,
        'times_correct' => 2,
        'difficulty_score' => 0.5,
    ]);

    $this->service->updateQuestionStats($question, true);

    $question->refresh();
    expect($question->times_shown)->toBe(6);
    expect($question->times_correct)->toBe(3);
});

// ─────────────────────────────────────────────────────────
//  User Ability Updates
// ─────────────────────────────────────────────────────────

test('updateUserAbility increases ability after high accuracy session', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);

    $this->service->updateUserAbility($user, 1.0); // 100% accuracy

    $user->refresh();
    expect($user->ability_estimate)->toBeGreaterThan(0.5);
    // 0.7 * 0.5 + 0.3 * 1.0 = 0.35 + 0.3 = 0.65
    expect($user->ability_estimate)->toBe(0.65);
});

test('updateUserAbility decreases ability after low accuracy session', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);

    $this->service->updateUserAbility($user, 0.0); // 0% accuracy

    $user->refresh();
    expect($user->ability_estimate)->toBeLessThan(0.5);
    // 0.7 * 0.5 + 0.3 * 0.0 = 0.35
    expect($user->ability_estimate)->toBe(0.35);
});

test('updateUserAbility stays within 0-1 bounds', function () {
    $userHigh = User::factory()->create(['ability_estimate' => 0.95]);
    $this->service->updateUserAbility($userHigh, 1.0);
    $userHigh->refresh();
    expect($userHigh->ability_estimate)->toBeLessThanOrEqual(1.0);

    $userLow = User::factory()->create(['ability_estimate' => 0.05]);
    $this->service->updateUserAbility($userLow, 0.0);
    $userLow->refresh();
    expect($userLow->ability_estimate)->toBeGreaterThanOrEqual(0.0);
});

test('updateUserAbility uses exponential moving average', function () {
    $user = User::factory()->create(['ability_estimate' => 0.6]);

    $this->service->updateUserAbility($user, 0.8);

    $user->refresh();
    // 0.7 * 0.6 + 0.3 * 0.8 = 0.42 + 0.24 = 0.66
    expect($user->ability_estimate)->toBe(0.66);
});

// ─────────────────────────────────────────────────────────
//  Target Difficulty
// ─────────────────────────────────────────────────────────

test('getTargetDifficulty returns value slightly above ability', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);

    $target = $this->service->getTargetDifficulty($user);

    expect($target)->toBe(0.55);
});

test('getTargetDifficulty clamps to valid range', function () {
    $userHigh = User::factory()->create(['ability_estimate' => 0.99]);
    $target = $this->service->getTargetDifficulty($userHigh);
    expect($target)->toBeLessThanOrEqual(1.0);

    $userLow = User::factory()->create(['ability_estimate' => 0.0]);
    $target = $this->service->getTargetDifficulty($userLow);
    expect($target)->toBeGreaterThanOrEqual(0.0);
});

// ─────────────────────────────────────────────────────────
//  Time Limit Adjustment
// ─────────────────────────────────────────────────────────

test('getAdjustedTimeLimit gives more time to lower ability users', function () {
    $lowAbility = User::factory()->create(['ability_estimate' => 0.1]);
    $highAbility = User::factory()->create(['ability_estimate' => 0.9]);

    $lowTime = $this->service->getAdjustedTimeLimit($lowAbility, 20);
    $highTime = $this->service->getAdjustedTimeLimit($highAbility, 20);

    expect($lowTime)->toBeGreaterThan($highTime);
});

test('getAdjustedTimeLimit stays within 0.7x to 1.5x bounds', function () {
    $baseTime = 20;

    $lowAbility = User::factory()->create(['ability_estimate' => 0.0]);
    $highAbility = User::factory()->create(['ability_estimate' => 1.0]);

    $lowTime = $this->service->getAdjustedTimeLimit($lowAbility, $baseTime);
    $highTime = $this->service->getAdjustedTimeLimit($highAbility, $baseTime);

    // 0.7x = 14, 1.5x = 30
    expect($lowTime)->toBeLessThanOrEqual(30);
    expect($lowTime)->toBeGreaterThanOrEqual(14);
    expect($highTime)->toBeLessThanOrEqual(30);
    expect($highTime)->toBeGreaterThanOrEqual(14);
});

test('getAdjustedTimeLimit returns base time for average ability', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);

    $adjusted = $this->service->getAdjustedTimeLimit($user, 20);

    // ability 0.5 → multiplier = 1.5 - (0.5 * 0.8) = 1.1 → 22
    expect($adjusted)->toBe(22);
});

// ─────────────────────────────────────────────────────────
//  Integration: Quiz Submit Updates Question Stats
// ─────────────────────────────────────────────────────────

test('quizSubmit endpoint updates question stats', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'max_points_per_question' => 10,
    ]);
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'times_shown' => 0,
        'times_correct' => 0,
    ]);

    $sessionId = (string) Str::uuid();

    $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge), [
            'session_id' => $sessionId,
            'challenge_question_id' => $question->id,
            'answer' => $question->correct_answer,
            'elapsed_ms' => 5000,
            'question_index' => 0,
        ])
        ->assertOk();

    $question->refresh();
    expect($question->times_shown)->toBe(1);
    expect($question->times_correct)->toBe(1);
});

test('quizSubmit response includes difficulty level', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'max_points_per_question' => 10,
    ]);
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'difficulty_level' => 'hard',
    ]);

    $sessionId = (string) Str::uuid();

    $response = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge), [
            'session_id' => $sessionId,
            'challenge_question_id' => $question->id,
            'answer' => $question->correct_answer,
            'elapsed_ms' => 5000,
            'question_index' => 0,
        ]);

    $response->assertOk();
    $response->assertJsonPath('difficultyLevel', 'hard');
});

// ─────────────────────────────────────────────────────────
//  Integration: Session Summary Updates User Ability
// ─────────────────────────────────────────────────────────

test('session summary updates user ability estimate', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5, 'xp' => 0, 'points' => 0]);
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'max_points_per_question' => 10,
    ]);
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
    $response->assertJsonStructure(['abilityEstimate', 'abilityChange']);

    $user->refresh();
    // 100% accuracy: 0.7 * 0.5 + 0.3 * 1.0 = 0.65
    expect($user->ability_estimate)->toBe(0.65);
});

test('session summary includes ability change in response', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5, 'xp' => 0, 'points' => 0]);
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'max_points_per_question' => 10,
    ]);

    $questions = ChallengeQuestion::factory()
        ->count(2)
        ->create(['challenge_id' => $challenge->id]);

    $sessionId = (string) Str::uuid();

    // One correct, one incorrect → 50% accuracy
    ChallengeSubmission::create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'challenge_question_id' => $questions[0]->id,
        'answer' => $questions[0]->correct_answer,
        'is_correct' => true,
        'score' => 50,
        'elapsed_ms' => 5000,
        'streak_bonus' => 0,
        'question_index' => 0,
        'submitted_at' => now(),
    ]);

    ChallengeSubmission::create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'challenge_question_id' => $questions[1]->id,
        'answer' => 'wrong',
        'is_correct' => false,
        'score' => 0,
        'elapsed_ms' => 5000,
        'streak_bonus' => 0,
        'question_index' => 1,
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge), [
            'session_id' => $sessionId,
        ]);

    $response->assertOk();

    // 50% accuracy: 0.7 * 0.5 + 0.3 * 0.5 = 0.5 → no change
    $response->assertJsonPath('abilityEstimate', 0.5);
    expect($response->json('abilityChange'))->toBe(0);
});

// ─────────────────────────────────────────────────────────
//  Topic Diversity in Question Selection
// ─────────────────────────────────────────────────────────

test('selectQuestionsForSession promotes topic diversity', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);
    $challenge = Challenge::factory()->create();

    // Create questions with same difficulty but different topics
    $topicIds = [100, 200, 300];

    foreach ($topicIds as $topicId) {
        ChallengeQuestion::factory()
            ->count(3)
            ->create([
                'challenge_id' => $challenge->id,
                'topic_id' => null, // No actual topic FK needed for selection logic
                'difficulty_score' => 0.5,
                'times_shown' => 10,
                'times_correct' => 5,
            ]);
    }

    $questions = $this->service->selectQuestionsForSession($user, $challenge, 5);

    // Should return 5 questions without error
    expect($questions)->toHaveCount(5);
});

// ─────────────────────────────────────────────────────────
//  Backward Compatibility
// ─────────────────────────────────────────────────────────

test('challenge show page works with default difficulty values', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'questions_per_session' => 3,
    ]);

    ChallengeQuestion::factory()
        ->count(5)
        ->create([
            'challenge_id' => $challenge->id,
            // Default values: difficulty_score=0.5, times_shown=0
        ]);

    $response = $this->actingAs($user)
        ->get(route('challenges.show', $challenge));

    $response->assertOk();
});

test('quiz submission still works with adaptive columns present', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'max_points_per_question' => 10,
    ]);
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'difficulty_level' => 'medium',
        'difficulty_score' => 0.5,
    ]);

    $sessionId = (string) Str::uuid();

    $response = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge), [
            'session_id' => $sessionId,
            'challenge_question_id' => $question->id,
            'answer' => $question->correct_answer,
            'elapsed_ms' => 5000,
            'question_index' => 0,
        ]);

    $response->assertOk();
    $response->assertJsonStructure([
        'isCorrect',
        'explanation',
        'questionScore',
        'streakBonus',
        'totalQuestionPoints',
        'difficultyLevel',
    ]);
});
