<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\Dashboard\AcademyDataBuilder;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();
    $this->service = app(AcademyDataBuilder::class);
});

// ─── build ───────────────────────────────────────────────────────────

it('returns the full academy payload structure', function () {
    $user = User::factory()->create(['name' => 'John Doe']);

    $stats = [
        'enrolledCourses' => 0,
        'completedCourses' => 0,
        'inProgressCourses' => 0,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 0.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    expect($result)->toHaveKeys([
        'hero',
        'learningPath',
        'successMetrics',
        'leaderboardPreview',
        'activityBreakdown',
        'monthlyProgress',
        'earningsHistory',
        'popularCourses',
        'recentActivity',
    ]);
});

it('generates correct hero greeting with first name', function () {
    $user = User::factory()->create(['name' => 'Alice Wonderland']);

    $stats = [
        'enrolledCourses' => 0,
        'completedCourses' => 0,
        'inProgressCourses' => 0,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 75.0, 'previousSuccessRate' => 50.0];

    $result = $this->service->build($user, $stats, $successRates);

    expect($result['hero']['greeting'])->toBe('Hi, Alice 👋')
        ->and($result['hero']['completionRate'])->toBe(75.0);
});

it('uses Learner as fallback when name is empty', function () {
    $user = User::factory()->create(['name' => '']);

    $stats = [
        'enrolledCourses' => 0,
        'completedCourses' => 0,
        'inProgressCourses' => 0,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 0.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    expect($result['hero']['greeting'])->toBe('Hi, Learner 👋');
});

it('calculates learning path progress correctly', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lessons = Lesson::factory()->count(4)->for($course)->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    // Complete 2 of 4 lessons
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

    $stats = [
        'enrolledCourses' => 1,
        'completedCourses' => 0,
        'inProgressCourses' => 1,
        'completedLessons' => 2,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 0.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    expect($result['learningPath']['totalModules'])->toBe(4)
        ->and($result['learningPath']['completedModules'])->toBe(2)
        ->and($result['learningPath']['progressPercentage'])->toBe(50.0);
});

it('returns zero progress when no enrolled courses', function () {
    $user = User::factory()->create();

    $stats = [
        'enrolledCourses' => 0,
        'completedCourses' => 0,
        'inProgressCourses' => 0,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 0.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    expect($result['learningPath']['totalModules'])->toBe(0)
        ->and($result['learningPath']['completedModules'])->toBe(0)
        ->and($result['learningPath']['progressPercentage'])->toBe(0.0);
});

it('calculates current user rank correctly', function () {
    // Create users with different points
    User::factory()->create(['points' => 500]);
    User::factory()->create(['points' => 300]);
    $user = User::factory()->create(['points' => 200]);
    User::factory()->create(['points' => 100]);

    $stats = [
        'enrolledCourses' => 0,
        'completedCourses' => 0,
        'inProgressCourses' => 0,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 0.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    // User has 200 points, 2 users have more (500, 300), so rank = 3
    expect($result['learningPath']['currentRank'])->toBe(3);
});

it('returns top 5 learners in leaderboard preview', function () {
    User::factory()->count(7)->create(['points' => fake()->numberBetween(10, 1000)]);
    $user = User::factory()->create(['points' => 50]);

    $stats = [
        'enrolledCourses' => 0,
        'completedCourses' => 0,
        'inProgressCourses' => 0,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 0.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    expect($result['leaderboardPreview'])->toHaveCount(5);

    // Check structure of first entry
    $first = $result['leaderboardPreview'][0];
    expect($first)->toHaveKeys(['rank', 'name', 'username', 'avatar', 'points'])
        ->and($first['rank'])->toBe(1);
});

it('builds activity breakdown with courses and challenges', function () {
    $user = User::factory()->create();
    Course::factory()->count(5)->create(['is_published' => true]);
    Challenge::factory()->count(3)->create(['is_published' => true]);

    $stats = [
        'enrolledCourses' => 5,
        'completedCourses' => 2,
        'inProgressCourses' => 3,
        'completedLessons' => 10,
        'solvedChallenges' => 1,
    ];
    $successRates = ['overallSuccessRate' => 40.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    $breakdown = $result['activityBreakdown'];
    expect($breakdown)->toHaveCount(2)
        ->and($breakdown[0]['label'])->toBe('Courses')
        ->and($breakdown[0]['completed'])->toBe(2)
        ->and($breakdown[0]['total'])->toBe(5)
        ->and($breakdown[0]['percentage'])->toBe(40.0)
        ->and($breakdown[1]['label'])->toBe('Challenges')
        ->and($breakdown[1]['completed'])->toBe(1)
        ->and($breakdown[1]['total'])->toBe(3);
});

it('builds monthly progress with 6 months of data', function () {
    $user = User::factory()->create();

    $stats = [
        'enrolledCourses' => 0,
        'completedCourses' => 0,
        'inProgressCourses' => 0,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 0.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    expect($result['monthlyProgress'])->toHaveKeys([
        'rangeLabel',
        'summaryPercentage',
        'deltaFromPrevious',
        'series',
    ])
        ->and($result['monthlyProgress']['series'])->toHaveCount(6);
});

it('builds popular courses ordered by enrollment count', function () {
    $user = User::factory()->create();

    $popularCourse = Course::factory()->create(['is_published' => true]);
    $lessCourse = Course::factory()->create(['is_published' => true]);

    // Popular course has more enrollments
    Enrollment::factory()->count(5)->create(['course_id' => $popularCourse->id]);
    Enrollment::factory()->count(2)->create(['course_id' => $lessCourse->id]);

    $stats = [
        'enrolledCourses' => 0,
        'completedCourses' => 0,
        'inProgressCourses' => 0,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 0.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    $courses = $result['popularCourses'];
    expect($courses)->not->toBeEmpty();

    // First course should be the most popular
    expect($courses[0]['id'])->toBe($popularCourse->id)
        ->and($courses[0]['enrollmentCount'])->toBe(5);
});

it('sets correct call to action for popular courses', function () {
    $user = User::factory()->create();

    $notEnrolled = Course::factory()->create(['is_published' => true]);
    $inProgress = Course::factory()->create(['is_published' => true]);
    $completed = Course::factory()->create(['is_published' => true]);

    // Create enrollments to make them "popular"
    Enrollment::factory()->count(3)->create(['course_id' => $notEnrolled->id]);
    Enrollment::factory()->count(3)->create(['course_id' => $inProgress->id]);
    Enrollment::factory()->count(3)->create(['course_id' => $completed->id]);

    // User enrollment states
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $inProgress->id,
        'completed_at' => null,
        'progress_percentage' => 50,
    ]);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $completed->id,
        'completed_at' => now(),
        'progress_percentage' => 100,
    ]);

    $stats = [
        'enrolledCourses' => 2,
        'completedCourses' => 1,
        'inProgressCourses' => 1,
        'completedLessons' => 0,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 50.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    $courses = collect($result['popularCourses']);

    $notEnrolledCourse = $courses->firstWhere('id', $notEnrolled->id);
    $inProgressCourse = $courses->firstWhere('id', $inProgress->id);
    $completedCourse = $courses->firstWhere('id', $completed->id);

    expect($notEnrolledCourse['callToAction'])->toBe('Explore')
        ->and($inProgressCourse['callToAction'])->toBe('Continue')
        ->and($completedCourse['callToAction'])->toBe('Review');
});

it('passes success metrics through correctly', function () {
    $user = User::factory()->create();

    $stats = [
        'enrolledCourses' => 10,
        'completedCourses' => 7,
        'inProgressCourses' => 3,
        'completedLessons' => 20,
        'solvedChallenges' => 5,
    ];
    $successRates = ['overallSuccessRate' => 70.0, 'previousSuccessRate' => 50.0];

    $result = $this->service->build($user, $stats, $successRates);

    expect($result['successMetrics']['overallSuccessRate'])->toBe(70.0)
        ->and($result['successMetrics']['previousSuccessRate'])->toBe(50.0)
        ->and($result['successMetrics']['targetRate'])->toBe(100)
        ->and($result['successMetrics']['totalEnrollments'])->toBe(10)
        ->and($result['successMetrics']['completedEnrollments'])->toBe(7)
        ->and($result['successMetrics']['inProgressEnrollments'])->toBe(3);
});

it('calculates monthly progress delta correctly', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    // Complete lessons last month (each needs a unique lesson)
    $lastMonthLessons = Lesson::factory()->count(3)->for($course)->create();
    foreach ($lastMonthLessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now()->subMonth(),
        ]);
    }

    // Complete lessons this month (each needs a unique lesson)
    $thisMonthLessons = Lesson::factory()->count(6)->for($course)->create();
    foreach ($thisMonthLessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    $stats = [
        'enrolledCourses' => 1,
        'completedCourses' => 0,
        'inProgressCourses' => 1,
        'completedLessons' => 9,
        'solvedChallenges' => 0,
    ];
    $successRates = ['overallSuccessRate' => 0.0, 'previousSuccessRate' => 0.0];

    $result = $this->service->build($user, $stats, $successRates);

    // Delta should be positive since current month has more activity
    expect($result['monthlyProgress']['deltaFromPrevious'])->toBeGreaterThan(0);
});
