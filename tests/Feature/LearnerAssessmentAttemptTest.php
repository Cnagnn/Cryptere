<?php

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

test('enrolled learner can start and continue a published bloom assessment', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $assessment = Assessment::factory()->for($course)->create([
        'status' => 'published',
        'bloom_level' => 'C4',
        'max_attempts' => 2,
    ]);

    AssessmentQuestion::factory()->for($assessment)->create([
        'bloom_level' => 'C4',
        'question_type' => 'essay',
        'grading_type' => 'auto',
        'points' => 10,
    ]);

    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->post(route('assessments.start', ['assessment' => $assessment->slug]))
        ->assertRedirect(route('courses.show', $course));

    $this->assertDatabaseHas('assessment_submissions', [
        'user_id' => $user->id,
        'assessment_id' => $assessment->id,
        'status' => 'in_progress',
        'attempt_number' => 1,
    ]);
});

test('assessment answer save rejects question outside active submission', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $assessment = Assessment::factory()->for($course)->create(['status' => 'published']);
    $otherAssessment = Assessment::factory()->for($course)->create(['status' => 'published']);
    AssessmentQuestion::factory()->for($assessment)->create();
    $otherQuestion = AssessmentQuestion::factory()->for($otherAssessment)->create();

    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)->post(route('assessments.start', ['assessment' => $assessment->slug]));

    $this->actingAs($user)
        ->postJson(route('assessments.save-answer', ['assessment' => $assessment->slug]), [
            'question_id' => $otherQuestion->id,
            'answer_text' => 'Cross assessment answer',
        ])
        ->assertNotFound();
});
