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
            ->has('academy.activityBreakdown', 3)
            ->has('academy.monthlyProgress.series', 6)
            ->has('academy.popularCourses')
            ->has('academy.recentActivity')
        );
});
