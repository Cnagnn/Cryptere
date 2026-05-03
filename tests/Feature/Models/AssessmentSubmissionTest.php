<?php

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use App\Models\User;
use Tests\TestCase;

uses(TestCase::class);

// ============================================================
// Constants
// ============================================================

test('STATUS constants are defined', function () {
    expect(AssessmentSubmission::STATUS_IN_PROGRESS)->toBe('in_progress');
    expect(AssessmentSubmission::STATUS_SUBMITTED)->toBe('submitted');
    expect(AssessmentSubmission::STATUS_GRADING)->toBe('grading');
    expect(AssessmentSubmission::STATUS_GRADED)->toBe('graded');
});

test('STATUSES contains all status values', function () {
    expect(AssessmentSubmission::STATUSES)->toBe([
        'in_progress',
        'submitted',
        'grading',
        'graded',
    ]);
});

// ============================================================
// Relationships
// ============================================================

test('submission belongs to a user', function () {
    $user = User::factory()->create();
    $submission = AssessmentSubmission::factory()->create(['user_id' => $user->id]);

    expect($submission->user)->toBeInstanceOf(User::class);
    expect($submission->user->id)->toBe($user->id);
});

test('submission belongs to an assessment', function () {
    $assessment = Assessment::factory()->create();
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $assessment->id]);

    expect($submission->assessment)->toBeInstanceOf(Assessment::class);
    expect($submission->assessment->id)->toBe($assessment->id);
});

test('submission belongs to a grader', function () {
    $grader = User::factory()->create();
    $submission = AssessmentSubmission::factory()->graded()->create(['graded_by' => $grader->id]);

    expect($submission->grader)->toBeInstanceOf(User::class);
    expect($submission->grader->id)->toBe($grader->id);
});

test('submission has many answers', function () {
    $assessment = Assessment::factory()->create();
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $assessment->id]);
    $question = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id]);

    AssessmentAnswer::factory()->count(3)->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
    ]);

    expect($submission->answers)->toHaveCount(3);
    expect($submission->answers->first())->toBeInstanceOf(AssessmentAnswer::class);
});

// ============================================================
// Scopes
// ============================================================

test('status scope filters by status', function () {
    AssessmentSubmission::factory()->count(2)->create(['status' => 'in_progress']);
    AssessmentSubmission::factory()->count(3)->submitted()->create();
    AssessmentSubmission::factory()->graded()->create();

    expect(AssessmentSubmission::status('in_progress')->count())->toBe(2);
    expect(AssessmentSubmission::status('submitted')->count())->toBe(3);
    expect(AssessmentSubmission::status('graded')->count())->toBe(1);
});

test('pendingGrading scope returns submitted submissions ordered by submitted_at', function () {
    $older = AssessmentSubmission::factory()->submitted()->create([
        'submitted_at' => now()->subHours(2),
    ]);
    $newer = AssessmentSubmission::factory()->submitted()->create([
        'submitted_at' => now()->subHour(),
    ]);
    AssessmentSubmission::factory()->graded()->create();

    $pending = AssessmentSubmission::pendingGrading()->get();

    expect($pending)->toHaveCount(2);
    expect($pending->first()->id)->toBe($older->id);
});

test('graded scope returns only graded submissions', function () {
    AssessmentSubmission::factory()->submitted()->count(2)->create();
    AssessmentSubmission::factory()->graded()->count(3)->create();

    expect(AssessmentSubmission::graded()->count())->toBe(3);
});

test('forUser scope filters by user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    AssessmentSubmission::factory()->count(2)->create(['user_id' => $user->id]);
    AssessmentSubmission::factory()->count(3)->create(['user_id' => $otherUser->id]);

    expect(AssessmentSubmission::forUser($user)->count())->toBe(2);
    expect(AssessmentSubmission::forUser($otherUser->id)->count())->toBe(3);
});

// ============================================================
// Helpers — Status checks
// ============================================================

test('isInProgress returns true for in_progress status', function () {
    $submission = AssessmentSubmission::factory()->create([
        'status' => AssessmentSubmission::STATUS_IN_PROGRESS,
    ]);

    expect($submission->isInProgress())->toBeTrue();
});

test('isInProgress returns false for other statuses', function () {
    $submission = AssessmentSubmission::factory()->submitted()->create();

    expect($submission->isInProgress())->toBeFalse();
});

test('isGraded returns true for graded status', function () {
    $submission = AssessmentSubmission::factory()->graded()->create();

    expect($submission->isGraded())->toBeTrue();
});

test('isGraded returns false for non-graded statuses', function () {
    $submission = AssessmentSubmission::factory()->submitted()->create();

    expect($submission->isGraded())->toBeFalse();
});

test('isPendingGrading returns true for submitted status', function () {
    $submission = AssessmentSubmission::factory()->submitted()->create();

    expect($submission->isPendingGrading())->toBeTrue();
});

test('isPendingGrading returns true for grading status', function () {
    $submission = AssessmentSubmission::factory()->create([
        'status' => AssessmentSubmission::STATUS_GRADING,
    ]);

    expect($submission->isPendingGrading())->toBeTrue();
});

test('isPendingGrading returns false for graded status', function () {
    $submission = AssessmentSubmission::factory()->graded()->create();

    expect($submission->isPendingGrading())->toBeFalse();
});

// ============================================================
// Helpers — calculateScore
// ============================================================

test('calculateScore computes correct totals from answers', function () {
    $assessment = Assessment::factory()->create(['passing_score' => 70]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $assessment->id]);
    $question = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'points' => 10]);

    // 8 out of 10 points = 80%
    AssessmentAnswer::factory()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
        'points_awarded' => 8,
        'max_points' => 10,
    ]);

    $submission->calculateScore();
    $submission->refresh();

    expect($submission->points_earned)->toBe(8);
    expect($submission->points_possible)->toBe(10);
    expect($submission->total_score)->toBe(80);
    expect($submission->passed)->toBeTrue();
});

test('calculateScore marks as failed when below passing score', function () {
    $assessment = Assessment::factory()->create(['passing_score' => 70]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $assessment->id]);
    $question = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'points' => 10]);

    // 5 out of 10 points = 50%
    AssessmentAnswer::factory()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
        'points_awarded' => 5,
        'max_points' => 10,
    ]);

    $submission->calculateScore();
    $submission->refresh();

    expect($submission->total_score)->toBe(50);
    expect($submission->passed)->toBeFalse();
});

test('calculateScore handles multiple answers', function () {
    $assessment = Assessment::factory()->create(['passing_score' => 70]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $assessment->id]);
    $q1 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'points' => 10]);
    $q2 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'points' => 20]);

    AssessmentAnswer::factory()->create([
        'submission_id' => $submission->id,
        'question_id' => $q1->id,
        'points_awarded' => 10,
        'max_points' => 10,
    ]);
    AssessmentAnswer::factory()->create([
        'submission_id' => $submission->id,
        'question_id' => $q2->id,
        'points_awarded' => 14,
        'max_points' => 20,
    ]);

    $submission->calculateScore();
    $submission->refresh();

    expect($submission->points_earned)->toBe(24);
    expect($submission->points_possible)->toBe(30);
    expect($submission->total_score)->toBe(80); // 24/30 = 80%
    expect($submission->passed)->toBeTrue();
});

test('calculateScore returns 0 when no graded answers', function () {
    $assessment = Assessment::factory()->create(['passing_score' => 70]);
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $assessment->id]);

    $submission->calculateScore();
    $submission->refresh();

    expect($submission->total_score)->toBe(0);
    expect($submission->passed)->toBeFalse();
});

// ============================================================
// Helpers — isFullyGraded
// ============================================================

test('isFullyGraded returns true when all answers have points_awarded', function () {
    $assessment = Assessment::factory()->create();
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $assessment->id]);
    $question = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id]);

    AssessmentAnswer::factory()->correct()->create([
        'submission_id' => $submission->id,
        'question_id' => $question->id,
    ]);

    expect($submission->isFullyGraded())->toBeTrue();
});

test('isFullyGraded returns false when some answers are ungraded', function () {
    $assessment = Assessment::factory()->create();
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $assessment->id]);
    $q1 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id]);
    $q2 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id]);

    AssessmentAnswer::factory()->correct()->create([
        'submission_id' => $submission->id,
        'question_id' => $q1->id,
    ]);
    AssessmentAnswer::factory()->ungraded()->create([
        'submission_id' => $submission->id,
        'question_id' => $q2->id,
    ]);

    expect($submission->isFullyGraded())->toBeFalse();
});

test('isFullyGraded returns false when no answers exist', function () {
    $submission = AssessmentSubmission::factory()->create();

    expect($submission->isFullyGraded())->toBeFalse();
});

// ============================================================
// Helpers — pending_answers_count attribute
// ============================================================

test('pending_answers_count returns count of ungraded answers', function () {
    $assessment = Assessment::factory()->create();
    $submission = AssessmentSubmission::factory()->create(['assessment_id' => $assessment->id]);
    $q1 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id]);
    $q2 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id]);
    $q3 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id]);

    AssessmentAnswer::factory()->correct()->create([
        'submission_id' => $submission->id,
        'question_id' => $q1->id,
    ]);
    AssessmentAnswer::factory()->ungraded()->create([
        'submission_id' => $submission->id,
        'question_id' => $q2->id,
    ]);
    AssessmentAnswer::factory()->ungraded()->create([
        'submission_id' => $submission->id,
        'question_id' => $q3->id,
    ]);

    expect($submission->pending_answers_count)->toBe(2);
});

// ============================================================
// Casts
// ============================================================

test('attributes are properly cast', function () {
    $submission = AssessmentSubmission::factory()->graded()->create();

    expect($submission->attempt_number)->toBeInt();
    expect($submission->started_at)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
    expect($submission->submitted_at)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
    expect($submission->graded_at)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
    expect($submission->total_score)->toBeInt();
    expect($submission->points_earned)->toBeInt();
    expect($submission->points_possible)->toBeInt();
    expect($submission->passed)->toBeBool();
});

// ============================================================
// Factory States
// ============================================================

test('factory creates valid submission', function () {
    $submission = AssessmentSubmission::factory()->create();

    expect($submission)->toBeInstanceOf(AssessmentSubmission::class);
    expect($submission->status)->toBe('in_progress');
});

test('factory submitted state sets correct status', function () {
    $submission = AssessmentSubmission::factory()->submitted()->create();

    expect($submission->status)->toBe('submitted');
    expect($submission->submitted_at)->not->toBeNull();
});

test('factory graded state sets correct status and score', function () {
    $submission = AssessmentSubmission::factory()->graded(85)->create();

    expect($submission->status)->toBe('graded');
    expect($submission->total_score)->toBe(85);
    expect($submission->graded_at)->not->toBeNull();
});

test('factory passed state creates passing submission', function () {
    $submission = AssessmentSubmission::factory()->passed()->create();

    expect($submission->passed)->toBeTrue();
    expect($submission->total_score)->toBeGreaterThanOrEqual(70);
});

test('factory failed state creates failing submission', function () {
    $submission = AssessmentSubmission::factory()->failed()->create();

    expect($submission->passed)->toBeFalse();
    expect($submission->total_score)->toBeLessThan(70);
});
