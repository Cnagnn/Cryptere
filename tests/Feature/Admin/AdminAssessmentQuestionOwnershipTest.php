<?php

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\User;

function validAssessmentQuestionPayload(array $overrides = []): array
{
    return [
        'bloom_level' => 'C1',
        'question_type' => 'mcq',
        'question_text' => 'What is Caesar cipher?',
        'options' => ['A', 'B', 'C', 'D'],
        'correct_answer' => 'A',
        'explanation' => 'Explanation',
        'points' => 10,
        'grading_type' => 'auto',
        ...$overrides,
    ];
}

test('admin cannot update a question through another assessment nested route', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $first = Assessment::factory()->create();
    $second = Assessment::factory()->create();
    $question = AssessmentQuestion::factory()->for($second, 'assessment')->create([
        'question_text' => 'Original question?',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.assessments.questions.update', [$first, $question]), validAssessmentQuestionPayload([
            'question_text' => 'Tampered question?',
        ]))
        ->assertNotFound();

    expect($question->refresh()->question_text)->toBe('Original question?');
});

test('admin cannot delete a question through another assessment nested route', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $first = Assessment::factory()->create();
    $second = Assessment::factory()->create();
    $question = AssessmentQuestion::factory()->for($second, 'assessment')->create();

    $this->actingAs($admin)
        ->delete(route('admin.assessments.questions.destroy', [$first, $question]))
        ->assertNotFound();

    $this->assertDatabaseHas('assessment_questions', ['id' => $question->id]);
});

test('question reorder only affects questions inside the route assessment', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $first = Assessment::factory()->create();
    $second = Assessment::factory()->create();
    $firstQuestion = AssessmentQuestion::factory()->for($first, 'assessment')->create(['sort_order' => 1]);
    $secondQuestion = AssessmentQuestion::factory()->for($second, 'assessment')->create(['sort_order' => 9]);

    $this->actingAs($admin)
        ->post(route('admin.assessments.questions.reorder', $first), [
            'items' => [
                ['id' => $firstQuestion->id, 'sort_order' => 4],
                ['id' => $secondQuestion->id, 'sort_order' => 1],
            ],
        ])
        ->assertRedirect();

    expect($firstQuestion->refresh()->sort_order)->toBe(4)
        ->and($secondQuestion->refresh()->sort_order)->toBe(9);
});
