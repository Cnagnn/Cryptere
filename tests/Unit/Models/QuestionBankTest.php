<?php

use App\Models\AssessmentQuestion;
use App\Models\QuestionBank;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function createQuestionBank(array $attributes = []): QuestionBank
{
    return QuestionBank::query()->create(array_merge([
        'title' => 'Caesar basics',
        'category' => 'cryptography',
        'bloom_level' => 'C1',
        'question_type' => 'mcq',
        'question_text' => 'What is Caesar cipher?',
        'options' => ['Cipher', 'Hash'],
        'correct_answer' => 'Cipher',
        'points' => 10,
        'created_by' => User::factory()->create()->id,
        'is_active' => true,
        'times_used' => 0,
    ], $attributes));
}

test('canDelete checks assessment usage with an exists query', function (): void {
    $questionBank = createQuestionBank();
    AssessmentQuestion::factory()->create([
        'question_bank_id' => $questionBank->id,
    ]);

    DB::enableQueryLog();

    $canDelete = $questionBank->canDelete();

    $queries = collect(DB::getQueryLog())->pluck('query');
    DB::disableQueryLog();

    expect($canDelete)->toBeFalse()
        ->and($queries->contains(fn (string $query): bool => str_contains($query, 'exists')))->toBeTrue()
        ->and($queries->contains(fn (string $query): bool => str_contains($query, 'count')))->toBeFalse();
});
