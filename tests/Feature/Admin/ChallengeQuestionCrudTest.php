<?php

use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function adminUser(): User
{
    return User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);
}

function publishedChallenge(): Challenge
{
    return Challenge::factory()->create([
        'is_published' => true,
        'time_limit_seconds' => 20,
        'questions_per_session' => 5,
        'max_points_per_question' => 1000,
    ]);
}

// ─── Store ────────────────────────────────────────────────────────────────────

test('admin can store an MCQ question', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();

    $this->actingAs($admin)
        ->post(route('admin.challenges.questions.store', $challenge), [
            'type' => 'mcq',
            'question' => 'What is AES?',
            'options' => ['A block cipher', 'A hash function', 'A protocol', 'A key exchange'],
            'correct_answer' => 'A block cipher',
            'explanation' => 'AES is the Advanced Encryption Standard, a symmetric block cipher.',
        ])
        ->assertRedirect();

    $question = ChallengeQuestion::query()->where('challenge_id', $challenge->id)->first();

    expect($question)->not->toBeNull();
    expect($question->type)->toBe('mcq');
    expect($question->question)->toBe('What is AES?');
    expect($question->options)->toBeArray()->toHaveCount(4);
    expect($question->correct_answer)->toBe('A block cipher');
    expect($question->explanation)->toBe('AES is the Advanced Encryption Standard, a symmetric block cipher.');
});

test('admin can store a true/false question', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();

    $this->actingAs($admin)
        ->post(route('admin.challenges.questions.store', $challenge), [
            'type' => 'true_false',
            'question' => 'SHA-256 produces a 256-bit digest.',
            'correct_answer' => 'True',
        ])
        ->assertRedirect();

    $question = ChallengeQuestion::query()->where('challenge_id', $challenge->id)->first();

    expect($question)->not->toBeNull();
    expect($question->type)->toBe('true_false');
    expect($question->correct_answer)->toBe('True');
});

test('admin can store a text question', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();

    $this->actingAs($admin)
        ->post(route('admin.challenges.questions.store', $challenge), [
            'type' => 'text',
            'question' => 'What does RSA stand for?',
            'correct_answer' => 'Rivest Shamir Adleman',
        ])
        ->assertRedirect();

    $question = ChallengeQuestion::query()->where('challenge_id', $challenge->id)->first();

    expect($question)->not->toBeNull();
    expect($question->type)->toBe('text');
});

test('admin can store a fill_blank question', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();

    $this->actingAs($admin)
        ->post(route('admin.challenges.questions.store', $challenge), [
            'type' => 'fill_blank',
            'question' => 'AES uses a _____ key.',
            'correct_answer' => 'symmetric',
        ])
        ->assertRedirect();

    $question = ChallengeQuestion::query()->where('challenge_id', $challenge->id)->first();

    expect($question)->not->toBeNull();
    expect($question->type)->toBe('fill_blank');
});

// ─── Validation ──────────────────────────────────────────────────────────────

test('MCQ question requires options with at least 2 items', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();

    $this->actingAs($admin)
        ->post(route('admin.challenges.questions.store', $challenge), [
            'type' => 'mcq',
            'question' => 'What is AES?',
            'options' => ['Only one'],
            'correct_answer' => 'Only one',
        ])
        ->assertSessionHasErrors('options');
});

test('question requires a question text', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();

    $this->actingAs($admin)
        ->post(route('admin.challenges.questions.store', $challenge), [
            'type' => 'mcq',
            'question' => '',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_answer' => 'A',
        ])
        ->assertSessionHasErrors('question');
});

test('question requires a correct_answer', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();

    $this->actingAs($admin)
        ->post(route('admin.challenges.questions.store', $challenge), [
            'type' => 'text',
            'question' => 'What is AES?',
        ])
        ->assertSessionHasErrors('correct_answer');
});

test('question type must be valid', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();

    $this->actingAs($admin)
        ->post(route('admin.challenges.questions.store', $challenge), [
            'type' => 'invalid_type',
            'question' => 'Test question',
            'correct_answer' => 'answer',
        ])
        ->assertSessionHasErrors('type');
});

// ─── Update ──────────────────────────────────────────────────────────────────

test('admin can update a question', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'type' => 'mcq',
        'question' => 'Original question',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.challenges.questions.update', [$challenge, $question]), [
            'type' => 'mcq',
            'question' => 'Updated question',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_answer' => 'B',
            'explanation' => 'Updated explanation',
        ])
        ->assertRedirect();

    expect($question->fresh()->question)->toBe('Updated question');
    expect($question->fresh()->correct_answer)->toBe('B');
    expect($question->fresh()->explanation)->toBe('Updated explanation');
});

// ─── Delete ──────────────────────────────────────────────────────────────────

test('admin can delete a question', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();
    $question = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.challenges.questions.destroy', [$challenge, $question]))
        ->assertRedirect();

    expect(ChallengeQuestion::query()->whereKey($question->id)->exists())->toBeFalse();
});

// ─── Reorder ─────────────────────────────────────────────────────────────────

test('admin can reorder questions', function () {
    $admin = adminUser();
    $challenge = publishedChallenge();

    $q1 = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'sort_order' => 1,
    ]);

    $q2 = ChallengeQuestion::factory()->create([
        'challenge_id' => $challenge->id,
        'sort_order' => 2,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.challenges.questions.reorder', $challenge), [
            'items' => [
                ['id' => $q1->id, 'sort_order' => 2],
                ['id' => $q2->id, 'sort_order' => 1],
            ],
        ])
        ->assertRedirect();

    expect($q1->fresh()->sort_order)->toBe(2);
    expect($q2->fresh()->sort_order)->toBe(1);
});

// ─── Authorization ───────────────────────────────────────────────────────────

test('non-admin cannot store a question', function () {
    $member = User::factory()->create(['is_admin' => false, 'role' => 'member']);
    $challenge = publishedChallenge();

    $this->actingAs($member)
        ->post(route('admin.challenges.questions.store', $challenge), [
            'type' => 'text',
            'question' => 'Test',
            'correct_answer' => 'answer',
        ])
        ->assertForbidden();
});
