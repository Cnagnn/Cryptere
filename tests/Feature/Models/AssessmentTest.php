<?php

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use App\Models\Course;
use App\Models\Topic;
use App\Models\User;
use Tests\TestCase;

uses(TestCase::class);

// ============================================================
// Constants
// ============================================================

test('BLOOM_LEVELS contains all six levels', function () {
    expect(Assessment::BLOOM_LEVELS)->toBe(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
});

test('BLOOM_LABELS maps each level to its label', function () {
    expect(Assessment::BLOOM_LABELS)->toBe([
        'C1' => 'Remember',
        'C2' => 'Understand',
        'C3' => 'Apply',
        'C4' => 'Analyze',
        'C5' => 'Evaluate',
        'C6' => 'Create',
    ]);
});

test('grading type constants are defined', function () {
    expect(Assessment::GRADING_AUTO)->toBe('auto');
    expect(Assessment::GRADING_MANUAL)->toBe('manual');
    expect(Assessment::GRADING_MIXED)->toBe('mixed');
});

// ============================================================
// Relationships
// ============================================================

test('assessment belongs to a course', function () {
    $course = Course::factory()->create();
    $assessment = Assessment::factory()->create(['course_id' => $course->id]);

    expect($assessment->course)->toBeInstanceOf(Course::class);
    expect($assessment->course->id)->toBe($course->id);
});

test('assessment belongs to a topic', function () {
    $topic = Topic::factory()->create();
    $assessment = Assessment::factory()->create(['topic_id' => $topic->id]);

    expect($assessment->topic)->toBeInstanceOf(Topic::class);
    expect($assessment->topic->id)->toBe($topic->id);
});

test('assessment has many questions', function () {
    $assessment = Assessment::factory()->create();
    AssessmentQuestion::factory()->count(3)->create(['assessment_id' => $assessment->id]);

    expect($assessment->questions)->toHaveCount(3);
    expect($assessment->questions->first())->toBeInstanceOf(AssessmentQuestion::class);
});

test('assessment has many submissions', function () {
    $assessment = Assessment::factory()->create();
    AssessmentSubmission::factory()->count(2)->create(['assessment_id' => $assessment->id]);

    expect($assessment->submissions)->toHaveCount(2);
    expect($assessment->submissions->first())->toBeInstanceOf(AssessmentSubmission::class);
});

test('questions are ordered by sort_order then id', function () {
    $assessment = Assessment::factory()->create();

    $q3 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'sort_order' => 3]);
    $q1 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'sort_order' => 1]);
    $q2 = AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'sort_order' => 2]);

    $questions = $assessment->questions;

    expect($questions[0]->id)->toBe($q1->id);
    expect($questions[1]->id)->toBe($q2->id);
    expect($questions[2]->id)->toBe($q3->id);
});

// ============================================================
// Scopes
// ============================================================

test('published scope filters only published assessments', function () {
    Assessment::factory()->published()->count(2)->create();
    Assessment::factory()->unpublished()->count(3)->create();

    expect(Assessment::published()->count())->toBe(2);
});

test('available scope filters published and within date range', function () {
    // Available: published, no date constraints
    Assessment::factory()->published()->create([
        'available_from' => null,
        'available_until' => null,
    ]);

    // Available: published, within date range
    Assessment::factory()->published()->create([
        'available_from' => now()->subDay(),
        'available_until' => now()->addDay(),
    ]);

    // Not available: unpublished
    Assessment::factory()->unpublished()->create();

    // Not available: published but future start
    Assessment::factory()->published()->create([
        'available_from' => now()->addWeek(),
    ]);

    // Not available: published but past end
    Assessment::factory()->published()->create([
        'available_until' => now()->subWeek(),
    ]);

    expect(Assessment::available()->count())->toBe(2);
});

test('bloomLevel scope filters by bloom level', function () {
    Assessment::factory()->bloomLevel('C1')->count(2)->create();
    Assessment::factory()->bloomLevel('C4')->count(3)->create();
    Assessment::factory()->bloomLevel('C6')->create();

    expect(Assessment::bloomLevel('C1')->count())->toBe(2);
    expect(Assessment::bloomLevel('C4')->count())->toBe(3);
    expect(Assessment::bloomLevel('C6')->count())->toBe(1);
});

test('searchManagement scope searches title and description', function () {
    Assessment::factory()->create(['title' => 'AES Encryption Basics', 'description' => 'Learn about AES.']);
    Assessment::factory()->create(['title' => 'RSA Overview', 'description' => 'Public key cryptography.']);
    Assessment::factory()->create(['title' => 'Hashing', 'description' => 'SHA-256 and AES comparison.']);

    expect(Assessment::searchManagement('AES')->count())->toBe(2);
    expect(Assessment::searchManagement('RSA')->count())->toBe(1);
    expect(Assessment::searchManagement('nonexistent')->count())->toBe(0);
});

test('searchManagement scope returns all when search is empty', function () {
    Assessment::factory()->count(3)->create();

    expect(Assessment::searchManagement('')->count())->toBe(3);
    expect(Assessment::searchManagement('  ')->count())->toBe(3);
});

// ============================================================
// Helpers — bloom_label attribute
// ============================================================

test('bloom_label accessor returns correct label', function () {
    $assessment = Assessment::factory()->bloomLevel('C1')->create();
    expect($assessment->bloom_label)->toBe('Remember');

    $assessment = Assessment::factory()->bloomLevel('C6')->create();
    expect($assessment->bloom_label)->toBe('Create');
});

// ============================================================
// Helpers — isAvailable
// ============================================================

test('isAvailable returns true for published assessment with no date constraints', function () {
    $assessment = Assessment::factory()->published()->create([
        'available_from' => null,
        'available_until' => null,
    ]);

    expect($assessment->isAvailable())->toBeTrue();
});

test('isAvailable returns false for unpublished assessment', function () {
    $assessment = Assessment::factory()->unpublished()->create();

    expect($assessment->isAvailable())->toBeFalse();
});

test('isAvailable returns false when before available_from', function () {
    $assessment = Assessment::factory()->published()->create([
        'available_from' => now()->addDay(),
    ]);

    expect($assessment->isAvailable())->toBeFalse();
});

test('isAvailable returns false when after available_until', function () {
    $assessment = Assessment::factory()->published()->create([
        'available_until' => now()->subDay(),
    ]);

    expect($assessment->isAvailable())->toBeFalse();
});

test('isAvailable returns true when within date range', function () {
    $assessment = Assessment::factory()->published()->create([
        'available_from' => now()->subDay(),
        'available_until' => now()->addDay(),
    ]);

    expect($assessment->isAvailable())->toBeTrue();
});

// ============================================================
// Helpers — canAttempt
// ============================================================

test('canAttempt returns true when user has no submissions', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->published()->create(['max_attempts' => 3]);

    expect($assessment->canAttempt($user))->toBeTrue();
});

test('canAttempt returns true when user has fewer attempts than max', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->published()->create(['max_attempts' => 3]);

    AssessmentSubmission::factory()->graded()->create([
        'user_id' => $user->id,
        'assessment_id' => $assessment->id,
    ]);

    expect($assessment->canAttempt($user))->toBeTrue();
});

test('canAttempt returns false when user has reached max attempts', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->published()->create(['max_attempts' => 2]);

    AssessmentSubmission::factory()->graded()->count(2)->create([
        'user_id' => $user->id,
        'assessment_id' => $assessment->id,
    ]);

    expect($assessment->canAttempt($user))->toBeFalse();
});

test('canAttempt returns false when assessment is not available', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->unpublished()->create(['max_attempts' => 3]);

    expect($assessment->canAttempt($user))->toBeFalse();
});

test('canAttempt does not count in_progress submissions toward limit', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->published()->create(['max_attempts' => 1]);

    // In-progress submission should not count
    AssessmentSubmission::factory()->create([
        'user_id' => $user->id,
        'assessment_id' => $assessment->id,
        'status' => AssessmentSubmission::STATUS_IN_PROGRESS,
    ]);

    expect($assessment->canAttempt($user))->toBeTrue();
});

// ============================================================
// Helpers — total_points attribute
// ============================================================

test('total_points returns sum of question points', function () {
    $assessment = Assessment::factory()->create();

    AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'points' => 10]);
    AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'points' => 20]);
    AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'points' => 15]);

    expect($assessment->total_points)->toBe(45);
});

test('total_points returns 0 when no questions exist', function () {
    $assessment = Assessment::factory()->create();

    expect($assessment->total_points)->toBe(0);
});

// ============================================================
// Helpers — requiresManualGrading
// ============================================================

test('requiresManualGrading returns true for manual grading type', function () {
    $assessment = Assessment::factory()->create(['grading_type' => 'manual']);

    expect($assessment->requiresManualGrading())->toBeTrue();
});

test('requiresManualGrading returns true for mixed grading type', function () {
    $assessment = Assessment::factory()->create(['grading_type' => 'mixed']);

    expect($assessment->requiresManualGrading())->toBeTrue();
});

test('requiresManualGrading returns false for auto grading type', function () {
    $assessment = Assessment::factory()->create(['grading_type' => 'auto']);

    expect($assessment->requiresManualGrading())->toBeFalse();
});

// ============================================================
// Casts
// ============================================================

test('attributes are properly cast', function () {
    $assessment = Assessment::factory()->create([
        'is_published' => 1,
        'passing_score' => '70',
        'max_attempts' => '3',
        'time_limit_minutes' => '60',
        'available_from' => '2025-01-01 00:00:00',
        'available_until' => '2025-12-31 23:59:59',
    ]);

    expect($assessment->is_published)->toBeBool();
    expect($assessment->passing_score)->toBeInt();
    expect($assessment->max_attempts)->toBeInt();
    expect($assessment->time_limit_minutes)->toBeInt();
    expect($assessment->available_from)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
    expect($assessment->available_until)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});

// ============================================================
// Factory States
// ============================================================

test('factory creates valid assessment', function () {
    $assessment = Assessment::factory()->create();

    expect($assessment)->toBeInstanceOf(Assessment::class);
    expect($assessment->id)->toBeGreaterThan(0);
    expect($assessment->bloom_level)->toBeIn(Assessment::BLOOM_LEVELS);
});

test('factory bloomLevel state sets correct level', function () {
    $assessment = Assessment::factory()->bloomLevel('C5')->create();

    expect($assessment->bloom_level)->toBe('C5');
});

test('factory published state sets is_published to true', function () {
    $assessment = Assessment::factory()->published()->create();

    expect($assessment->is_published)->toBeTrue();
});

test('factory unpublished state sets is_published to false', function () {
    $assessment = Assessment::factory()->unpublished()->create();

    expect($assessment->is_published)->toBeFalse();
});
