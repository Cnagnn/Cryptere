<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create([
        'name' => 'Andrew Stone',
        'username' => 'andrew',
        'points' => 320,
    ]);

    User::factory()->create([
        'name' => 'Top Learner',
        'username' => 'top-learner',
        'points' => 900,
    ]);

    $enrolledCourse = Course::factory()->create([
        'slug' => 'secure-web-fundamentals',
        'title' => 'Secure Web Fundamentals',
        'is_published' => true,
    ]);

    Course::factory()->create([
        'slug' => 'api-hardening',
        'title' => 'API Hardening',
        'is_published' => true,
    ]);

    $lesson = Lesson::factory()->for($enrolledCourse)->create([
        'title' => 'Threat Modeling Basics',
    ]);

    Enrollment::factory()->for($user)->for($enrolledCourse)->create([
        'progress_percentage' => 45,
        'enrolled_at' => now()->subDays(7),
        'completed_at' => null,
    ]);

    $challenge = Challenge::factory()->create([
        'title' => 'SQL Injection Defense',
        'is_published' => true,
    ]);

    LessonProgress::factory()->for($user)->for($lesson)->create([
        'completed_at' => now()->subDay(),
    ]);

    ChallengeSubmission::factory()->for($user)->for($challenge)->create([
        'is_correct' => true,
        'submitted_at' => now()->subHours(4),
    ]);

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('stats.enrolledCourses', 1)
            ->where('stats.completedLessons', 1)
            ->where('stats.solvedChallenges', 1)
            ->where('academy.hero.headline', 'What do you want to learn today?')
            ->where('academy.learningPath.currentRank', 2)
            ->where('academy.learningPath.totalModules', 1)
            ->where('academy.successMetrics.inProgressEnrollments', 1)
            ->has('academy.leaderboardPreview', 2)
            ->has('academy.activityBreakdown', 2)
            ->where('academy.activityBreakdown.0.label', 'Courses')
            ->has('academy.activityBreakdown.0.completed')
            ->has('academy.activityBreakdown.0.total')
            ->has('academy.activityBreakdown.0.percentage')
            ->where('academy.activityBreakdown.1.label', 'Challenges')
            ->has('academy.monthlyProgress.series', 6)
            ->has('academy.earningsHistory.weekly', 7)
            ->has('academy.earningsHistory.monthly', 12)
            ->has('academy.earningsHistory.deltaFromPrevious')
            ->has('academy.popularCourses')
            ->has('academy.recentActivity')
            ->has('learningPath')
            ->has('learningPath.nodes')
            ->has('learningPath.categories')
            ->has('analytics')
            ->has('analytics.stats')
        );
});

test('admin users see the analytics dashboard', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    // Seed some data for analytics
    User::factory()->count(3)->create();

    $course = Course::factory()->create([
        'is_published' => true,
    ]);

    $challenge = Challenge::factory()->create([
        'is_published' => true,
    ]);

    $member = User::factory()->create();

    Enrollment::factory()->for($member)->for($course)->create();

    ChallengeSubmission::factory()->for($member)->for($challenge)->create([
        'is_correct' => true,
    ]);

    $this->actingAs($admin);

    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('admin')
            ->has('admin.stats')
            ->where('admin.stats.totalCourses', 1)
            ->where('admin.stats.totalChallenges', 1)
            ->where('admin.stats.totalEnrollments', 1)
            ->has('admin.enrollmentTrends', 6)
            ->has('admin.userGrowth', 6)
            ->has('admin.coursePerformance')
            ->has('admin.challengePerformance')
            ->has('admin.recentUsers')
            ->missing('stats')
            ->missing('academy')
            ->missing('learningPath')
            ->missing('analytics')
        );
});

test('admin dashboard does not include learner props', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $this->actingAs($admin);

    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('admin')
            ->missing('stats')
            ->missing('recentCourses')
            ->missing('recommendedCourses')
            ->missing('academy')
            ->missing('learningPath')
            ->missing('analytics')
        );
});

test('member users do not see admin analytics', function () {
    $member = User::factory()->create([
        'is_admin' => false,
        'role' => 'member',
    ]);

    $this->actingAs($member);

    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('stats')
            ->has('academy')
            ->has('learningPath')
            ->has('analytics')
            ->missing('admin')
        );
});

// ─── Learning Path (merged from LearningPathTest) ────────────────────────────

test('dashboard includes learning path with published courses', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'is_published' => true,
        'category' => 'Classical Ciphers',
        'difficulty' => 'beginner',
        'path_position' => 1,
    ]);

    Course::factory()->create(['is_published' => false]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('learningPath.nodes', 1)
        ->where('learningPath.nodes.0.title', $course->title)
        ->where('learningPath.nodes.0.category', 'Classical Ciphers')
        ->where('learningPath.nodes.0.difficulty', 'beginner')
        ->where('learningPath.nodes.0.isLocked', false)
        ->where('learningPath.nodes.0.isEnrolled', false)
    );
});

test('dashboard learning path shows locked status when prerequisite not completed', function () {
    $user = User::factory()->create();

    $prereq = Course::factory()->create([
        'is_published' => true,
        'path_position' => 1,
    ]);

    $course = Course::factory()->create([
        'is_published' => true,
        'prerequisite_course_id' => $prereq->id,
        'path_position' => 2,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('learningPath.nodes.1.isLocked', true)
    );
});

test('dashboard learning path shows unlocked when prerequisite is completed', function () {
    $user = User::factory()->create();

    $prereq = Course::factory()->create([
        'is_published' => true,
        'path_position' => 1,
    ]);

    $course = Course::factory()->create([
        'is_published' => true,
        'prerequisite_course_id' => $prereq->id,
        'path_position' => 2,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $prereq->id,
        'completed_at' => now(),
        'progress_percentage' => 100,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('learningPath.nodes.1.isLocked', false)
    );
});

test('dashboard learning path shows enrollment progress', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create(['is_published' => true]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 60,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('learningPath.nodes.0.isEnrolled', true)
        ->where('learningPath.nodes.0.progressPercentage', 60)
    );
});

// ─── Points History ──────────────────────────────────────────────────────────

test('dashboard points history reflects lesson and challenge points', function () {
    $user = User::factory()->create(['points' => 100]);

    $course = Course::factory()->create(['is_published' => true]);

    $lesson = Lesson::factory()->for($course)->create([
        'xp_reward' => 50,
    ]);

    LessonProgress::factory()->for($user)->for($lesson)->create([
        'completed_at' => now()->subDays(5),
    ]);

    $challenge = Challenge::factory()->create(['is_published' => true]);

    ChallengeSubmission::factory()->for($user)->for($challenge)->create([
        'is_correct' => true,
        'score' => 30,
        'submitted_at' => now()->subDays(3),
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('academy.earningsHistory.monthly', 12)
            ->where('academy.earningsHistory.monthly.11.points', 80) // 50 lesson + 30 challenge
            ->where('academy.earningsHistory.monthly.11.xp', 50) // lesson XP only, no challenge
            ->has('academy.earningsHistory.weekly', 7)
            ->has('academy.earningsHistory.deltaFromPrevious')
        );
});

// ─── Analytics (merged from AnalyticsTest) ───────────────────────────────────

test('dashboard includes analytics stats with expected keys', function () {
    $user = User::factory()->create(['points' => 500]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('analytics.stats.totalPoints')
        ->has('analytics.stats.currentStreak')
        ->has('analytics.stats.longestStreak')
        ->has('analytics.stats.completedCourses')
        ->has('analytics.stats.completedLessons')
        ->has('analytics.stats.solvedChallenges')
        ->has('analytics.stats.badgeCount')
    );
});
