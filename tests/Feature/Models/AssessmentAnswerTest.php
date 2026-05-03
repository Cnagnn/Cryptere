<?php

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use Tests\TestCase;

uses(TestCase::class);

// ============================================================
// Relationships
// ============================================================

test('answer belongs to a submission', function () {
    $submission = AssessmentSubmission::factory()->create();
    $question = AssessmentQuestion::factory()->create(['assessment_id' => $submission->assessment_id]);
    $answer = AssessmentAnswer::factory()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
    ]);

    expect($answer->submission)->toBeInstanceOf(AssessmentSubmission::class);
    expect($answer->submission->id)->toBe($submission->id);
});

test('answer belongs to a question', function () {
    $question = AssessmentQuestion::factory()->create();
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $question->assessment_id]);
    $answer = AssessmentAnswer::factory()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
    ]);

    expect($answer->question)->toBeInstanceOf(AssessmentQuestion::class);
    expect($answer->question->id)->toBe($question->id);
});

// ============================================================
// Helpers — isGraded
// ============================================================

test('isGraded returns true when points_awarded is set', function () {
    $answer = AssessmentAnswer::factory()->correct()->create();

    expect($answer->isGraded())->toBeTrue();
});

test('isGraded returns false when points_awarded is null', function () {
    $answer = AssessmentAnswer::factory()->ungraded()->create();

    expect($answer->isGraded())->toBeFalse();
});

test('isGraded returns true even when points_awarded is 0', function () {
    $answer = AssessmentAnswer::factory()->incorrect()->create();

    expect($answer->points_awarded)->toBe(0);
    expect($answer->isGraded())->toBeTrue();
});

// ============================================================
// Helpers — score_percentage attribute
// ============================================================

test('score_percentage returns correct percentage', function () {
    $answer = AssessmentAnswer::factory()->create([
        'points_awarded' => 7,
        'max_points' => 10,
    ]);

    expect($answer->score_percentage)->toBe(70.0);
});

test('score_percentage returns null when not graded', function () {
    $answer = AssessmentAnswer::factory()->ungraded()->create();

    expect($answer->score_percentage)->toBeNull();
});

test('score_percentage returns null when max_points is 0', function () {
    $answer = AssessmentAnswer::factory()->create([
        'points_awarded' => 5,
        'max_points' => 0,
    ]);

    expect($answer->score_percentage)->toBeNull();
});

test('score_percentage returns 100 for full marks', function () {
    $answer = AssessmentAnswer::factory()->create([
        'points_awarded' => 10,
        'max_points' => 10,
    ]);

    expect($answer->score_percentage)->toBe(100.0);
});

// ============================================================
// Helpers — autoGrade
// ============================================================

test('autoGrade correctly grades a correct MCQ answer', function () {
    $question = AssessmentQuestion::factory()->mcq()->create([
        'correct_answer' => 'Option B',
        'points' => 10,
    ]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $question->assessment_id]);
    $answer = AssessmentAnswer::factory()->ungraded()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
        'selected_option' => 'Option B',
        'max_points' => 10,
    ]);

    $answer->autoGrade();
    $answer->refresh();

    expect($answer->is_correct)->toBeTrue();
    expect($answer->points_awarded)->toBe(10);
    expect($answer->graded_at)->not->toBeNull();
});

test('autoGrade correctly grades an incorrect MCQ answer', function () {
    $question = AssessmentQuestion::factory()->mcq()->create([
        'correct_answer' => 'Option A',
        'points' => 10,
    ]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $question->assessment_id]);
    $answer = AssessmentAnswer::factory()->ungraded()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
        'selected_option' => 'Option C',
        'max_points' => 10,
    ]);

    $answer->autoGrade();
    $answer->refresh();

    expect($answer->is_correct)->toBeFalse();
    expect($answer->points_awarded)->toBe(0);
    expect($answer->graded_at)->not->toBeNull();
});

test('autoGrade does nothing for manual-graded questions', function () {
    $question = AssessmentQuestion::factory()->essay()->create(['points' => 20]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $question->assessment_id]);
    $answer = AssessmentAnswer::factory()->ungraded()->withEssayAnswer()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
        'max_points' => 20,
    ]);

    $answer->autoGrade();
    $answer->refresh();

    expect($answer->points_awarded)->toBeNull();
    expect($answer->graded_at)->toBeNull();
});

test('autoGrade uses answer_text when selected_option is null', function () {
    $question = AssessmentQuestion::factory()->computation()->create([
        'correct_answer' => '42',
        'points' => 10,
    ]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $question->assessment_id]);
    $answer = AssessmentAnswer::factory()->ungraded()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
        'answer_text' => '42',
        'selected_option' => null,
        'max_points' => 10,
    ]);

    $answer->autoGrade();
    $answer->refresh();

    expect($answer->is_correct)->toBeTrue();
    expect($answer->points_awarded)->toBe(10);
});

// ============================================================
// Helpers — manualGrade
// ============================================================

test('manualGrade applies rubric scores and feedback', function () {
    $question = AssessmentQuestion::factory()->essay()->create(['points' => 10]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $question->assessment_id]);
    $answer = AssessmentAnswer::factory()->ungraded()->withEssayAnswer()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
        'max_points' => 10,
    ]);

    $rubricScores = [
        'Accuracy' => ['score' => 4, 'feedback' => 'Good understanding'],
        'Clarity' => ['score' => 3, 'feedback' => 'Could be clearer'],
    ];

    $answer->manualGrade($rubricScores, 'Overall good effort.');
    $answer->refresh();

    expect($answer->points_awarded)->toBe(7);
    expect($answer->rubric_scores)->toBe($rubricScores);
    expect($answer->feedback)->toBe('Overall good effort.');
    expect($answer->graded_at)->not->toBeNull();
    expect($answer->is_correct)->toBeTrue(); // 7/10 = 70% >= threshold
});

test('manualGrade marks as incorrect when below 70% threshold', function () {
    $question = AssessmentQuestion::factory()->essay()->create(['points' => 10]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $question->assessment_id]);
    $answer = AssessmentAnswer::factory()->ungraded()->withEssayAnswer()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
        'max_points' => 10,
    ]);

    $rubricScores = [
        'Accuracy' => ['score' => 2],
        'Clarity' => ['score' => 1],
    ];

    $answer->manualGrade($rubricScores);
    $answer->refresh();

    expect($answer->points_awarded)->toBe(3);
    expect($answer->is_correct)->toBeFalse(); // 3/10 = 30% < 70%
});

test('manualGrade caps points at max_points', function () {
    $question = AssessmentQuestion::factory()->essay()->create(['points' => 10]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $question->assessment_id]);
    $answer = AssessmentAnswer::factory()->ungraded()->withEssayAnswer()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
        'max_points' => 10,
    ]);

    // Rubric scores exceed max points
    $rubricScores = [
        'Accuracy' => ['score' => 8],
        'Clarity' => ['score' => 7],
    ];

    $answer->manualGrade($rubricScores);
    $answer->refresh();

    expect($answer->points_awarded)->toBe(10); // Capped at max
});

// ============================================================
// Casts
// ============================================================

test('attributes are properly cast', function () {
    $answer = AssessmentAnswer::factory()->correct()->create([
        'rubric_scores' => ['Accuracy' => ['score' => 5]],
    ]);

    expect($answer->is_correct)->toBeBool();
    expect($answer->points_awarded)->toBeInt();
    expect($answer->max_points)->toBeInt();
    expect($answer->rubric_scores)->toBeArray();
    expect($answer->graded_at)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});

// ============================================================
// Factory States
// ============================================================

test('factory creates valid answer', function () {
    $answer = AssessmentAnswer::factory()->create();

    expect($answer)->toBeInstanceOf(AssessmentAnswer::class);
    expect($answer->id)->toBeGreaterThan(0);
});

test('factory correct state sets is_correct and points', function () {
    $answer = AssessmentAnswer::factory()->correct()->create();

    expect($answer->is_correct)->toBeTrue();
    expect($answer->points_awarded)->toBe(10);
});

test('factory incorrect state sets is_correct false and 0 points', function () {
    $answer = AssessmentAnswer::factory()->incorrect()->create();

    expect($answer->is_correct)->toBeFalse();
    expect($answer->points_awarded)->toBe(0);
});

test('factory ungraded state sets null values', function () {
    $answer = AssessmentAnswer::factory()->ungraded()->create();

    expect($answer->is_correct)->toBeNull();
    expect($answer->points_awarded)->toBeNull();
    expect($answer->graded_at)->toBeNull();
});

test('factory withMcqAnswer state sets selected_option', function () {
    $answer = AssessmentAnswer::factory()->withMcqAnswer('Option D')->create();

    expect($answer->selected_option)->toBe('Option D');
});

test('factory withEssayAnswer state sets answer_text', function () {
    $answer = AssessmentAnswer::factory()->withEssayAnswer()->create();

    expect($answer->answer_text)->not->toBeNull();
    expect($answer->answer_text)->toBeString();
});
