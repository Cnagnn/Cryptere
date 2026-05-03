<?php

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use Tests\TestCase;

uses(TestCase::class);

// ============================================================
// Constants
// ============================================================

test('TYPES contains all question types', function () {
    expect(AssessmentQuestion::TYPES)->toBe([
        'mcq',
        'true_false',
        'short_answer',
        'essay',
        'computation',
        'case_study',
        'design',
    ]);
});

test('AUTO_GRADABLE_TYPES contains objective types', function () {
    expect(AssessmentQuestion::AUTO_GRADABLE_TYPES)->toBe([
        'mcq',
        'true_false',
        'short_answer',
        'computation',
    ]);
});

test('MANUAL_GRADED_TYPES contains subjective types', function () {
    expect(AssessmentQuestion::MANUAL_GRADED_TYPES)->toBe([
        'essay',
        'case_study',
        'design',
    ]);
});

// ============================================================
// Relationships
// ============================================================

test('question belongs to an assessment', function () {
    $assessment = Assessment::factory()->create();
    $question = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id]);

    expect($question->assessment)->toBeInstanceOf(Assessment::class);
    expect($question->assessment->id)->toBe($assessment->id);
});

test('question has many answers', function () {
    $question = AssessmentQuestion::factory()->create();
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $question->assessment_id]);

    AssessmentAnswer::factory()->count(3)->create([
        'question_id' => $question->id,
        'submission_id' => $submission->id,
    ]);

    expect($question->answers)->toHaveCount(3);
    expect($question->answers->first())->toBeInstanceOf(AssessmentAnswer::class);
});

// ============================================================
// isCorrect — MCQ
// ============================================================

test('isCorrect returns true for exact MCQ match', function () {
    $question = AssessmentQuestion::factory()->mcq()->create([
        'correct_answer' => 'Option B',
    ]);

    expect($question->isCorrect('Option B'))->toBeTrue();
});

test('isCorrect is case insensitive for MCQ', function () {
    $question = AssessmentQuestion::factory()->mcq()->create([
        'correct_answer' => 'Option A',
    ]);

    expect($question->isCorrect('option a'))->toBeTrue();
    expect($question->isCorrect('OPTION A'))->toBeTrue();
});

test('isCorrect trims whitespace for MCQ', function () {
    $question = AssessmentQuestion::factory()->mcq()->create([
        'correct_answer' => 'Option C',
    ]);

    expect($question->isCorrect('  Option C  '))->toBeTrue();
});

test('isCorrect returns false for wrong MCQ answer', function () {
    $question = AssessmentQuestion::factory()->mcq()->create([
        'correct_answer' => 'Option A',
    ]);

    expect($question->isCorrect('Option B'))->toBeFalse();
});

// ============================================================
// isCorrect — True/False
// ============================================================

test('isCorrect works for true/false questions', function () {
    $question = AssessmentQuestion::factory()->trueFalse()->create([
        'correct_answer' => 'True',
    ]);

    expect($question->isCorrect('True'))->toBeTrue();
    expect($question->isCorrect('true'))->toBeTrue();
    expect($question->isCorrect('False'))->toBeFalse();
});

// ============================================================
// isCorrect — Short Answer / Computation
// ============================================================

test('isCorrect normalizes whitespace for short answer', function () {
    $question = AssessmentQuestion::factory()->create([
        'question_type' => 'short_answer',
        'grading_type' => 'auto',
        'correct_answer' => 'public key',
    ]);

    expect($question->isCorrect('public key'))->toBeTrue();
    expect($question->isCorrect('PUBLIC KEY'))->toBeTrue();
    expect($question->isCorrect('public   key'))->toBeTrue();
    expect($question->isCorrect('  public  key  '))->toBeTrue();
});

test('isCorrect works for computation type', function () {
    $question = AssessmentQuestion::factory()->computation()->create([
        'correct_answer' => '256',
    ]);

    expect($question->isCorrect('256'))->toBeTrue();
    expect($question->isCorrect(' 256 '))->toBeTrue();
    expect($question->isCorrect('128'))->toBeFalse();
});

// ============================================================
// isCorrect — Manual graded types always return false
// ============================================================

test('isCorrect returns false for essay questions', function () {
    $question = AssessmentQuestion::factory()->essay()->create();

    expect($question->isCorrect('any answer'))->toBeFalse();
});

test('isCorrect returns false for case study questions', function () {
    $question = AssessmentQuestion::factory()->caseStudy()->create();

    expect($question->isCorrect('any answer'))->toBeFalse();
});

test('isCorrect returns false for design questions', function () {
    $question = AssessmentQuestion::factory()->design()->create();

    expect($question->isCorrect('any answer'))->toBeFalse();
});

// ============================================================
// isAutoGradable
// ============================================================

test('isAutoGradable returns true for auto-graded MCQ', function () {
    $question = AssessmentQuestion::factory()->mcq()->create();

    expect($question->isAutoGradable())->toBeTrue();
});

test('isAutoGradable returns true for auto-graded true/false', function () {
    $question = AssessmentQuestion::factory()->trueFalse()->create();

    expect($question->isAutoGradable())->toBeTrue();
});

test('isAutoGradable returns true for auto-graded computation', function () {
    $question = AssessmentQuestion::factory()->computation()->create();

    expect($question->isAutoGradable())->toBeTrue();
});

test('isAutoGradable returns false for essay', function () {
    $question = AssessmentQuestion::factory()->essay()->create();

    expect($question->isAutoGradable())->toBeFalse();
});

test('isAutoGradable returns false when grading_type is manual even for MCQ type', function () {
    $question = AssessmentQuestion::factory()->create([
        'question_type' => 'mcq',
        'grading_type' => 'manual',
    ]);

    expect($question->isAutoGradable())->toBeFalse();
});

// ============================================================
// requiresManualGrading
// ============================================================

test('requiresManualGrading returns true for manual grading_type', function () {
    $question = AssessmentQuestion::factory()->essay()->create();

    expect($question->requiresManualGrading())->toBeTrue();
});

test('requiresManualGrading returns false for auto grading_type', function () {
    $question = AssessmentQuestion::factory()->mcq()->create();

    expect($question->requiresManualGrading())->toBeFalse();
});

// ============================================================
// getRubricCriteria
// ============================================================

test('getRubricCriteria returns criteria array from rubric', function () {
    $question = AssessmentQuestion::factory()->essay()->create([
        'rubric' => [
            'criteria' => [
                ['name' => 'Accuracy', 'description' => 'Test', 'max_points' => 5, 'levels' => []],
                ['name' => 'Clarity', 'description' => 'Test', 'max_points' => 5, 'levels' => []],
            ],
        ],
    ]);

    $criteria = $question->getRubricCriteria();

    expect($criteria)->toHaveCount(2);
    expect($criteria[0]['name'])->toBe('Accuracy');
    expect($criteria[1]['name'])->toBe('Clarity');
});

test('getRubricCriteria returns empty array when no rubric', function () {
    $question = AssessmentQuestion::factory()->mcq()->create(['rubric' => null]);

    expect($question->getRubricCriteria())->toBe([]);
});

// ============================================================
// getMaxRubricScore
// ============================================================

test('getMaxRubricScore returns sum of criteria max_points', function () {
    $question = AssessmentQuestion::factory()->essay()->create([
        'rubric' => [
            'criteria' => [
                ['name' => 'A', 'description' => '', 'max_points' => 5, 'levels' => []],
                ['name' => 'B', 'description' => '', 'max_points' => 7, 'levels' => []],
                ['name' => 'C', 'description' => '', 'max_points' => 3, 'levels' => []],
            ],
        ],
    ]);

    expect($question->getMaxRubricScore())->toBe(15);
});

test('getMaxRubricScore returns 0 when no rubric', function () {
    $question = AssessmentQuestion::factory()->mcq()->create(['rubric' => null]);

    expect($question->getMaxRubricScore())->toBe(0);
});

// ============================================================
// Casts
// ============================================================

test('options are cast to array', function () {
    $question = AssessmentQuestion::factory()->mcq()->create([
        'options' => ['A', 'B', 'C', 'D'],
    ]);

    $question->refresh();

    expect($question->options)->toBeArray();
    expect($question->options)->toHaveCount(4);
});

test('rubric is cast to array', function () {
    $question = AssessmentQuestion::factory()->essay()->create();

    $question->refresh();

    expect($question->rubric)->toBeArray();
    expect($question->rubric)->toHaveKey('criteria');
});

test('points is cast to integer', function () {
    $question = AssessmentQuestion::factory()->create(['points' => '15']);

    expect($question->points)->toBeInt();
    expect($question->points)->toBe(15);
});

// ============================================================
// Hidden attribute
// ============================================================

test('correct_answer is hidden from serialization', function () {
    $question = AssessmentQuestion::factory()->mcq()->create([
        'correct_answer' => 'Option A',
    ]);

    $array = $question->toArray();

    expect($array)->not->toHaveKey('correct_answer');
});

test('correct_answer can be made visible', function () {
    $question = AssessmentQuestion::factory()->mcq()->create([
        'correct_answer' => 'Option A',
    ]);

    $array = $question->makeVisible('correct_answer')->toArray();

    expect($array)->toHaveKey('correct_answer');
    expect($array['correct_answer'])->toBe('Option A');
});

// ============================================================
// Factory States
// ============================================================

test('factory mcq state creates MCQ question', function () {
    $question = AssessmentQuestion::factory()->mcq()->create();

    expect($question->question_type)->toBe('mcq');
    expect($question->grading_type)->toBe('auto');
    expect($question->options)->toBeArray();
    expect($question->correct_answer)->not->toBeNull();
});

test('factory essay state creates essay question', function () {
    $question = AssessmentQuestion::factory()->essay()->create();

    expect($question->question_type)->toBe('essay');
    expect($question->grading_type)->toBe('manual');
    expect($question->options)->toBeNull();
    expect($question->correct_answer)->toBeNull();
    expect($question->rubric)->toBeArray();
});

test('factory design state creates design question', function () {
    $question = AssessmentQuestion::factory()->design()->create();

    expect($question->question_type)->toBe('design');
    expect($question->grading_type)->toBe('manual');
    expect($question->points)->toBe(30);
});
