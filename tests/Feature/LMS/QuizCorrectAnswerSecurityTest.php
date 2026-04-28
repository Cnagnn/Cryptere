<?php

use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\User;
use Illuminate\Support\Lottery;
use Illuminate\Support\Str;
use Laravel\Pennant\Feature;

beforeEach(function () {
    // Fix pre-existing Pennant/Lottery compatibility issue in test environment
    // The GamificationRewardVariant feature uses incorrect Lottery::choose() API
    Feature::define('App\\Features\\GamificationRewardVariant', fn () => 'control');
});

// ── quizSubmit: correctAnswer must NOT be in response ──

test('quizSubmit response does not contain correctAnswer for correct answer', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
        'explanation' => 'AES is a symmetric cipher.',
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => (string) Str::uuid(),
            'challenge_question_id' => $question->id,
            'answer' => 'AES',
            'elapsed_ms' => 5000,
            'question_index' => 0,
        ]);

    $response->assertOk()
        ->assertJson(['isCorrect' => true])
        ->assertJsonMissing(['correctAnswer']);

    // Verify the key literally does not exist in the response
    expect(array_key_exists('correctAnswer', $response->json()))->toBeFalse();
});

test('quizSubmit response does not contain correctAnswer for wrong answer', function () {
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
        ]);

    $response->assertOk()
        ->assertJson(['isCorrect' => false])
        ->assertJsonMissing(['correctAnswer']);

    expect(array_key_exists('correctAnswer', $response->json()))->toBeFalse();
});

test('quizSubmit still returns explanation for learning value', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
        'explanation' => 'AES stands for Advanced Encryption Standard.',
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => (string) Str::uuid(),
            'challenge_question_id' => $question->id,
            'answer' => 'DES',
            'elapsed_ms' => 5000,
            'question_index' => 0,
        ]);

    $response->assertOk()
        ->assertJsonPath('explanation', 'AES stands for Advanced Encryption Standard.');
});

test('quizSubmit still returns isCorrect boolean for immediate feedback', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
    ]);

    $sessionId = (string) Str::uuid();

    // Correct answer
    $response = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => $sessionId,
            'challenge_question_id' => $question->id,
            'answer' => 'AES',
            'elapsed_ms' => 5000,
            'question_index' => 0,
        ]);

    $response->assertOk();
    expect($response->json('isCorrect'))->toBeTrue();
});

test('quizSubmit response has correct structure without correctAnswer', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
        'explanation' => 'Test explanation',
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => (string) Str::uuid(),
            'challenge_question_id' => $question->id,
            'answer' => 'AES',
            'elapsed_ms' => 5000,
            'question_index' => 0,
        ]);

    $response->assertOk()
        ->assertJsonStructure([
            'isCorrect',
            'explanation',
            'questionScore',
            'streakBonus',
            'totalQuestionPoints',
        ]);

    // Ensure only expected keys are present
    $keys = array_keys($response->json());
    expect($keys)->not->toContain('correctAnswer');
    expect($keys)->toContain('isCorrect');
    expect($keys)->toContain('explanation');
    expect($keys)->toContain('questionScore');
    expect($keys)->toContain('streakBonus');
    expect($keys)->toContain('totalQuestionPoints');
});

// ── sessionSummary: correctAnswer MUST be in response ──

test('sessionSummary response contains questionDetails with correctAnswer', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0]);
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
        'explanation' => 'AES is a symmetric cipher.',
        'question' => 'What is AES?',
    ]);

    $sessionId = (string) Str::uuid();

    ChallengeSubmission::create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'challenge_question_id' => $question->id,
        'answer' => 'DES',
        'is_correct' => false,
        'score' => 0,
        'elapsed_ms' => 5000,
        'streak_bonus' => 0,
        'question_index' => 0,
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge), [
            'session_id' => $sessionId,
        ]);

    $response->assertOk()
        ->assertJsonStructure([
            'questionDetails' => [
                '*' => [
                    'questionIndex',
                    'question',
                    'userAnswer',
                    'correctAnswer',
                    'isCorrect',
                    'explanation',
                    'score',
                    'streakBonus',
                    'elapsedMs',
                ],
            ],
        ]);

    $details = $response->json('questionDetails');
    expect($details)->toHaveCount(1);
    expect($details[0]['correctAnswer'])->toBe('AES');
    expect($details[0]['userAnswer'])->toBe('DES');
    expect($details[0]['isCorrect'])->toBeFalse();
    expect($details[0]['explanation'])->toBe('AES is a symmetric cipher.');
    expect($details[0]['question'])->toBe('What is AES?');
});

test('sessionSummary returns correct answers for multiple questions', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0]);
    $challenge = Challenge::factory()->create(['is_published' => true]);

    $q1 = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
        'question' => 'What is AES?',
    ]);
    $q2 = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'RSA',
        'question' => 'What is RSA?',
    ]);

    $sessionId = (string) Str::uuid();

    ChallengeSubmission::create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'challenge_question_id' => $q1->id,
        'answer' => 'AES',
        'is_correct' => true,
        'score' => 800,
        'elapsed_ms' => 3000,
        'streak_bonus' => 0,
        'question_index' => 0,
        'submitted_at' => now(),
    ]);

    ChallengeSubmission::create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'challenge_question_id' => $q2->id,
        'answer' => 'DES',
        'is_correct' => false,
        'score' => 0,
        'elapsed_ms' => 8000,
        'streak_bonus' => 0,
        'question_index' => 1,
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge), [
            'session_id' => $sessionId,
        ]);

    $response->assertOk();

    $details = $response->json('questionDetails');
    expect($details)->toHaveCount(2);

    // Sorted by question_index
    expect($details[0]['correctAnswer'])->toBe('AES');
    expect($details[0]['isCorrect'])->toBeTrue();
    expect($details[1]['correctAnswer'])->toBe('RSA');
    expect($details[1]['isCorrect'])->toBeFalse();
    expect($details[1]['userAnswer'])->toBe('DES');
});

// ── Negative: quiz still works correctly without correctAnswer ──

test('quiz flow works end-to-end without correctAnswer in individual responses', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0]);
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'max_points_per_question' => 1000,
    ]);

    $q1 = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'AES',
    ]);
    $q2 = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'correct_answer' => 'RSA',
    ]);

    $sessionId = (string) Str::uuid();

    // Submit question 1 — correct
    $r1 = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => $sessionId,
            'challenge_question_id' => $q1->id,
            'answer' => 'AES',
            'elapsed_ms' => 3000,
            'question_index' => 0,
        ]);

    $r1->assertOk();
    expect($r1->json('isCorrect'))->toBeTrue();
    expect(array_key_exists('correctAnswer', $r1->json()))->toBeFalse();
    expect($r1->json('questionScore'))->toBeGreaterThan(0);

    // Submit question 2 — wrong
    $r2 = $this->actingAs($user)
        ->postJson(route('challenges.quiz-submit', $challenge->slug), [
            'session_id' => $sessionId,
            'challenge_question_id' => $q2->id,
            'answer' => 'DES',
            'elapsed_ms' => 5000,
            'question_index' => 1,
        ]);

    $r2->assertOk();
    expect($r2->json('isCorrect'))->toBeFalse();
    expect(array_key_exists('correctAnswer', $r2->json()))->toBeFalse();
    expect($r2->json('questionScore'))->toBe(0);

    // Finalize session — correct answers should now be available
    $summary = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge->slug), [
            'session_id' => $sessionId,
        ]);

    $summary->assertOk();
    expect($summary->json('correctCount'))->toBe(1);
    expect($summary->json('totalQuestions'))->toBe(2);

    $details = $summary->json('questionDetails');
    expect($details)->toHaveCount(2);
    expect($details[0]['correctAnswer'])->toBe('AES');
    expect($details[1]['correctAnswer'])->toBe('RSA');
});
