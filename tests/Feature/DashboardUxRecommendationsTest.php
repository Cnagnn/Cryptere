<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
use App\Models\QuizSubmission;
use App\Models\User;
use App\Services\Dashboard\AdminAnalyticsService;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();
});

test('learner dashboard exposes action-oriented learning guidance', function () {
    $learner = User::factory()->create([
        'role' => 'member',
        'points' => 120,
        'xp' => 240,
        'current_streak' => 0,
        'last_active_date' => now()->subDays(4),
    ]);
    User::factory()->create(['points' => 175]);

    $completedCourse = Course::factory()->create([
        'title' => 'Dasar Kriptografi',
        'category' => 'Kriptografi',
        'difficulty' => 'Pemula',
        'sort_order' => 1,
    ]);
    Enrollment::factory()->create([
        'user_id' => $learner->id,
        'course_id' => $completedCourse->id,
        'progress_percentage' => 100,
        'completed_at' => now()->subDays(2),
    ]);

    $stalledCourse = Course::factory()->create([
        'title' => 'RSA Praktis',
        'category' => 'Kriptografi',
        'difficulty' => 'Menengah',
        'sort_order' => 2,
    ]);
    $nextLesson = Lesson::factory()->create([
        'course_id' => $stalledCourse->id,
        'title' => 'Kunci Publik dan Privat',
        'position' => 1,
    ]);
    Enrollment::factory()->create([
        'user_id' => $learner->id,
        'course_id' => $stalledCourse->id,
        'progress_percentage' => 35,
        'enrolled_at' => now()->subDays(12),
        'completed_at' => null,
        'updated_at' => now()->subDays(10),
    ]);

    LessonProgress::factory()->create([
        'user_id' => $learner->id,
        'lesson_id' => Lesson::factory()->create(['course_id' => $completedCourse->id])->id,
        'completed_at' => now()->startOfWeek()->addDay(),
    ]);

    Course::factory()->create([
        'title' => 'Analisis Cipher Modern',
        'category' => 'Kriptografi',
        'difficulty' => 'Menengah',
        'sort_order' => 3,
    ]);

    expect(Enrollment::query()
        ->whereBelongsTo($learner)
        ->whereNull('completed_at')
        ->where('progress_percentage', '<', 50)
        ->count())->toBe(1);

    $response = $this->actingAs($learner)->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('nextAction.title', 'Lanjutkan RSA Praktis')
        ->where('nextAction.meta.lessonTitle', $nextLesson->title)
        ->where('weeklyGoal.targetLessons', 5)
        ->where('weeklyGoal.completedLessons', 1)
        ->where('rankProgress.pointsToNextRank', 56)
        ->where('learningRisks.0.type', 'stalled_course')
        ->has('progressInsights', 1)
        ->has('badgeGoal')
        ->has('recommendedCourses.0.recommendationReason')
    );
});

test('admin dashboard exposes operating filters and action queues', function () {
    $admin = User::factory()->admin()->create();
    $activeUser = User::factory()->create([
        'created_at' => now()->subDays(2),
        'last_active_date' => now()->subDays(1),
    ]);
    $inactiveUser = User::factory()->create([
        'created_at' => now()->subDays(40),
        'last_active_date' => now()->subDays(45),
    ]);

    $course = Course::factory()->create(['title' => 'Course Perlu Intervensi']);
    Enrollment::factory()->create([
        'user_id' => $activeUser->id,
        'course_id' => $course->id,
        'progress_percentage' => 100,
        'completed_at' => now()->subDays(1),
    ]);
    Enrollment::factory()->create([
        'user_id' => $inactiveUser->id,
        'course_id' => $course->id,
        'progress_percentage' => 10,
        'completed_at' => null,
        'updated_at' => now()->subDays(20),
    ]);

    $task = LessonTask::factory()->create();
    QuizSubmission::factory()->create([
        'user_id' => $inactiveUser->id,
        'lesson_task_id' => $task->id,
        'score' => 1,
        'total' => 10,
        'submitted_at' => now()->subDays(1),
    ]);

    $response = $this->actingAs($admin)->get(route('dashboard', ['period' => '30d']));

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('admin.filters.period', '30d')
        ->has('admin.filters.availablePeriods', 4)
        ->has('admin.stats.activeUsersDelta')
        ->has('admin.actionQueue.0')
        ->has('admin.courseAnalytics.0')
        ->has('admin.anomalies')
        ->has('admin.reportSnapshot.generatedAt')
    );
});

test('admin analytics include dropoff status and retention confidence', function () {
    User::factory()->create([
        'created_at' => now()->subWeek(),
        'last_active_date' => now(),
        'current_streak' => 1,
        'daily_xp_earned' => 30,
    ]);

    $analytics = app(AdminAnalyticsService::class);

    $funnel = $analytics->getGamificationFunnel();
    $economy = $analytics->getEconomyHealth();
    $retention = $analytics->getCohortRetention(2);

    expect($funnel[1])
        ->toHaveKeys(['conversion_from_previous', 'dropoff_count', 'dropoff_percentage'])
        ->and($economy)
        ->toHaveKeys(['status', 'signals'])
        ->and($retention[0])
        ->toHaveKeys(['confidence', 'sample_label']);
});
