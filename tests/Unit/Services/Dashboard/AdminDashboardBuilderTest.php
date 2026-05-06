<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\Dashboard\AdminAnalyticsService;
use App\Services\Dashboard\AdminDashboardBuilder;

beforeEach(function () {
    $this->analyticsService = Mockery::mock(AdminAnalyticsService::class);
    $this->builder = new AdminDashboardBuilder($this->analyticsService);
});

test('build returns admin key with expected structure', function () {
    User::factory()->count(3)->create();
    Course::factory()->count(2)->create(['is_published' => true]);
    Challenge::factory()->count(2)->create(['is_published' => true]);

    $result = $this->builder->build();

    expect($result)->toHaveKey('admin')
        ->and($result['admin'])->toHaveKeys([
            'stats',
            'enrollmentTrends',
            'userGrowth',
            'coursePerformance',
            'challengePerformance',
            'recentUsers',
            'cohortRetention',
            'gamificationFunnel',
            'economyHealth',
        ]);
});

test('stats contains correct counts', function () {
    User::factory()->count(5)->create(['last_active_date' => now()]);
    Course::factory()->count(3)->create();
    Challenge::factory()->count(2)->create();

    $result = $this->builder->build();
    $stats = $result['admin']['stats'];

    expect($stats['totalUsers'])->toBe(5)
        ->and($stats['totalCourses'])->toBe(3)
        ->and($stats['totalChallenges'])->toBe(2);
});

test('coursePerformance includes completion rate', function () {
    $course = Course::factory()->create(['is_published' => true]);
    $users = User::factory()->count(4)->create();

    foreach ($users as $user) {
        Enrollment::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'completed_at' => $user->id === $users[0]->id ? now() : null,
        ]);
    }

    $result = $this->builder->build();
    $performance = $result['admin']['coursePerformance'];

    expect($performance)->not->toBeEmpty()
        ->and($performance[0]['enrollments'])->toBe(4)
        ->and($performance[0]['completionRate'])->toBe(25.0);
});

test('challengePerformance includes success rate', function () {
    $challenge = Challenge::factory()->create(['is_published' => true]);
    $user = User::factory()->create();

    ChallengeSubmission::factory()->count(3)->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => false,
    ]);

    $result = $this->builder->build();
    $performance = $result['admin']['challengePerformance'];

    expect($performance)->not->toBeEmpty()
        ->and($performance[0]['submissions'])->toBe(4)
        ->and($performance[0]['successRate'])->toBe(75.0);
});

test('recentUsers returns latest users', function () {
    User::factory()->count(3)->create();

    $result = $this->builder->build();
    $recentUsers = $result['admin']['recentUsers'];

    expect($recentUsers)->toHaveCount(3);
    expect($recentUsers[0])->toHaveKeys(['id', 'name', 'email', 'role']);
});
