<?php

use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;
use Database\Seeders\ManagementSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('management seeder populates core management data', function () {
    $this->seed(ManagementSeeder::class);

    $admin = User::query()->where('email', 'admin@example.com')->first();
    $learner = User::query()->where('email', 'test@example.com')->first();

    expect($admin)->not->toBeNull();
    expect($admin?->is_admin)->toBeTrue();
    expect($admin?->role)->toBe('admin');

    expect($learner)->not->toBeNull();
    expect($learner?->role)->toBe('member');

    expect(Course::query()->count())->toBeGreaterThanOrEqual(3);
    expect(Challenge::query()->count())->toBeGreaterThanOrEqual(4);
    expect(Lesson::query()->count())->toBeGreaterThanOrEqual(6);
    expect(LessonTask::query()->count())->toBeGreaterThanOrEqual(6);
});

test('management seeder creates question banks for challenges', function () {
    $this->seed(ManagementSeeder::class);

    $publishedChallenges = Challenge::query()->where('is_published', true)->get();

    expect($publishedChallenges)->toHaveCount(3);

    foreach ($publishedChallenges as $challenge) {
        $questionCount = ChallengeQuestion::query()
            ->where('challenge_id', $challenge->id)
            ->count();

        expect($questionCount)->toBeGreaterThanOrEqual(8, "Challenge '{$challenge->title}' should have at least 8 questions");
        expect($challenge->time_limit_seconds)->toBeGreaterThan(0);
        expect($challenge->questions_per_session)->toBeGreaterThan(0);
        expect($challenge->max_points_per_question)->toBeGreaterThan(0);
    }

    // Verify question types are mixed
    $allTypes = ChallengeQuestion::query()->distinct('type')->pluck('type')->toArray();
    expect($allTypes)->toContain('mcq');
    expect($allTypes)->toContain('true_false');
});

test('management seeder creates lesson tasks', function () {
    $this->seed(ManagementSeeder::class);

    expect(LessonTask::query()->count())->toBeGreaterThan(0);
});
