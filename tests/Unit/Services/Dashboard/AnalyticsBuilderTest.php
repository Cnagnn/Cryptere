<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\Dashboard\AnalyticsBuilder;
use Illuminate\Support\Facades\DB;

test('progress trend batches weekly activity queries', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->for($course)->create();
    $challenge = Challenge::factory()->create();

    LessonProgress::factory()->for($user)->for($lesson)->create([
        'completed_at' => now()->startOfWeek(),
    ]);

    ChallengeSubmission::factory()->for($user)->for($challenge)->create([
        'is_correct' => true,
        'score' => 25,
        'submitted_at' => now()->startOfWeek()->addDay(),
    ]);

    DB::enableQueryLog();

    $trend = app(AnalyticsBuilder::class)->progressTrend($user->id);

    $queryCount = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($trend)->toHaveCount(12)
        ->and(collect($trend)->last()['points'])->toBeGreaterThan(0)
        ->and($queryCount)->toBeLessThanOrEqual(2);
});
