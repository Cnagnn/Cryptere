<?php

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use App\Models\Course;
use App\Models\User;
use App\Services\CourseDetailBuilder;
use Illuminate\Support\Facades\DB;

test('build assessments batches related data instead of querying per assessment', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create([
        'status' => Course::STATUS_PUBLISHED,
        'is_published' => true,
    ]);

    Assessment::factory()
        ->count(4)
        ->for($course)
        ->sequence(fn ($sequence) => ['sort_order' => $sequence->index + 1])
        ->create()
        ->each(function (Assessment $assessment) use ($user): void {
            $question = AssessmentQuestion::factory()->for($assessment)->create();
            $gradedSubmission = AssessmentSubmission::factory()
                ->for($user)
                ->for($assessment)
                ->graded(80)
                ->create(['attempt_number' => 1]);

            AssessmentAnswer::factory()
                ->for($gradedSubmission, 'submission')
                ->for($question, 'question')
                ->correct()
                ->create();

            AssessmentSubmission::factory()
                ->for($user)
                ->for($assessment)
                ->create(['attempt_number' => 2]);
        });

    DB::enableQueryLog();

    $payload = app(CourseDetailBuilder::class)->buildAssessments($course, $user);

    $queryCount = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($payload)->toHaveCount(4)
        ->and($payload[0]['questionsCount'])->toBe(1)
        ->and($payload[0]['totalPoints'])->toBe(10)
        ->and($payload[0]['attemptCount'])->toBe(1)
        ->and($payload[0]['activeSubmission'])->not->toBeNull()
        ->and($payload[0]['latestResults'])->not->toBeNull()
        ->and($queryCount)->toBeLessThanOrEqual(5);
});
