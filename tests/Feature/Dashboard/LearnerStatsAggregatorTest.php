<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\Dashboard\LearnerStatsAggregator;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();
    $this->service = new LearnerStatsAggregator;
});

// ─── aggregate ───────────────────────────────────────────────────────

it('returns zero stats for a user with no activity', function () {
    $user = User::factory()->create();

    $result = $this->service->aggregate($user);

    expect($result)->toBe([
        'enrolledCourses' => 0,
        'completedCourses' => 0,
        'inProgressCourses' => 0,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ]);
});

it('counts enrolled courses correctly', function () {
    $user = User::factory()->create();
    Enrollment::factory()->count(3)->create([
        'user_id' => $user->id,
        'completed_at' => null,
        'progress_percentage' => 0,
    ]);

    $result = $this->service->aggregate($user);

    expect($result['enrolledCourses'])->toBe(3);
});

it('counts completed courses correctly', function () {
    $user = User::factory()->create();
    Enrollment::factory()->count(2)->create([
        'user_id' => $user->id,
        'completed_at' => now(),
        'progress_percentage' => 100,
    ]);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'completed_at' => null,
        'progress_percentage' => 50,
    ]);

    $result = $this->service->aggregate($user);

    expect($result['completedCourses'])->toBe(2)
        ->and($result['enrolledCourses'])->toBe(3);
});

it('counts in-progress courses correctly', function () {
    $user = User::factory()->create();

    // In progress: not completed, progress > 0
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'completed_at' => null,
        'progress_percentage' => 50,
    ]);

    // Not started: not completed, progress = 0
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'completed_at' => null,
        'progress_percentage' => 0,
    ]);

    // Completed
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'completed_at' => now(),
        'progress_percentage' => 100,
    ]);

    $result = $this->service->aggregate($user);

    expect($result['inProgressCourses'])->toBe(1);
});

it('counts completed lessons correctly', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $lessons = Lesson::factory()->count(3)->for($course)->create();

    // 2 completed, 1 not
    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lessons[0]->id,
        'completed_at' => now(),
    ]);
    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lessons[1]->id,
        'completed_at' => now(),
    ]);
    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lessons[2]->id,
        'completed_at' => null,
    ]);

    $result = $this->service->aggregate($user);

    expect($result['completedLessons'])->toBe(2);
});

it('counts solved challenges with distinct challenge ids', function () {
    $user = User::factory()->create();
    $challenge1 = Challenge::factory()->create();
    $challenge2 = Challenge::factory()->create();

    // Two correct submissions for same challenge should count as 1
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge1->id,
        'is_correct' => true,
        'submitted_at' => now(),
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge1->id,
        'is_correct' => true,
        'submitted_at' => now(),
    ]);

    // One correct for another challenge
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge2->id,
        'is_correct' => true,
        'submitted_at' => now(),
    ]);

    // One incorrect submission should not count
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => Challenge::factory()->create()->id,
        'is_correct' => false,
        'submitted_at' => now(),
    ]);

    $result = $this->service->aggregate($user);

    expect($result['solvedChallenges'])->toBe(2);
});

it('does not count other users data', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Enrollment::factory()->count(3)->create(['user_id' => $otherUser->id]);
    LessonProgress::factory()->count(2)->create([
        'user_id' => $otherUser->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->aggregate($user);

    expect($result['enrolledCourses'])->toBe(0)
        ->and($result['completedLessons'])->toBe(0);
});

it('caches aggregate results per user', function () {
    $user = User::factory()->create();
    Enrollment::factory()->create(['user_id' => $user->id]);

    $first = $this->service->aggregate($user);

    // Add more enrollments — should not affect cached result
    Enrollment::factory()->count(3)->create(['user_id' => $user->id]);

    $second = $this->service->aggregate($user);

    expect($second)->toBe($first);
});

// ─── successRates ────────────────────────────────────────────────────

it('returns zero success rates when no enrollments', function () {
    $user = User::factory()->create();

    $result = $this->service->successRates($user, 0, 0);

    expect($result)->toBe([
        'overallSuccessRate' => 0.0,
        'previousSuccessRate' => 0.0,
    ]);
});

it('calculates overall success rate correctly', function () {
    $user = User::factory()->create();

    $result = $this->service->successRates($user, 10, 7);

    expect($result['overallSuccessRate'])->toBe(70.0);
});

it('calculates previous success rate from before current month', function () {
    $user = User::factory()->create();

    // Enrollments from last month
    Enrollment::factory()->count(4)->create([
        'user_id' => $user->id,
        'created_at' => now()->subMonth(),
        'completed_at' => now()->subMonth(),
    ]);
    Enrollment::factory()->count(2)->create([
        'user_id' => $user->id,
        'created_at' => now()->subMonth(),
        'completed_at' => null,
    ]);

    $result = $this->service->successRates($user, 6, 4);

    // Previous: 4 completed / 6 enrolled = 66.7%
    expect($result['previousSuccessRate'])->toBe(66.7);
});

it('returns zero previous success rate when no previous enrollments', function () {
    $user = User::factory()->create();

    // Only current month enrollments
    Enrollment::factory()->count(3)->create([
        'user_id' => $user->id,
        'created_at' => now(),
        'completed_at' => now(),
    ]);

    $result = $this->service->successRates($user, 3, 3);

    expect($result['overallSuccessRate'])->toBe(100.0)
        ->and($result['previousSuccessRate'])->toBe(0.0);
});

it('handles single enrollment for success rate', function () {
    $user = User::factory()->create();

    $result = $this->service->successRates($user, 1, 1);

    expect($result['overallSuccessRate'])->toBe(100.0);
});
