<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\Dashboard\AdminAnalyticsService;
use App\Services\Dashboard\AdminDashboardBuilder;

beforeEach(function () {
    Cache::flush();

    $this->analyticsService = Mockery::mock(AdminAnalyticsService::class);
    $this->builder = new AdminDashboardBuilder($this->analyticsService);
});

test('build returns admin key with expected structure', function () {
    User::factory()->count(3)->create();
    Course::factory()->count(2)->create(['status' => 'published']);

    $result = $this->builder->build();

    expect($result)->toHaveKey('admin')
        ->and($result['admin'])->toHaveKeys([
            'stats',
            'enrollmentTrends',
            'userGrowth',
            'coursePerformance',
            'recentUsers',
            'cohortRetention',
            'gamificationFunnel',
            'economyHealth',
        ]);
});

test('stats contains correct counts', function () {
    User::factory()->count(5)->create(['last_active_date' => now()]);
    Course::factory()->count(3)->create();

    $result = $this->builder->build();
    $stats = $result['admin']['stats'];

    expect($stats['totalUsers'])->toBe(5)
        ->and($stats['totalCourses'])->toBe(3);
});

test('coursePerformance includes completion rate', function () {
    $course = Course::factory()->create(['status' => 'published']);
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

test('monthly trends aggregate users and enrollments', function () {
    $course = Course::factory()->create();
    $user = User::factory()->create([
        'created_at' => now()->startOfMonth(),
    ]);

    User::factory()->create([
        'created_at' => now()->subMonth()->startOfMonth(),
    ]);

    Enrollment::factory()->for($user)->for($course)->create([
        'created_at' => now()->startOfMonth(),
    ]);

    $result = $this->builder->build();

    expect($result['admin']['userGrowth'])->toHaveCount(6)
        ->and($result['admin']['enrollmentTrends'])->toHaveCount(6)
        ->and(collect($result['admin']['userGrowth'])->last()['users'])->toBe(1)
        ->and(collect($result['admin']['enrollmentTrends'])->last()['enrollments'])->toBe(1);
});

test('recentUsers returns latest users', function () {
    User::factory()->count(3)->create();

    $result = $this->builder->build();
    $recentUsers = $result['admin']['recentUsers'];

    expect($recentUsers)->toHaveCount(3);
    expect($recentUsers[0])->toHaveKeys(['id', 'name', 'email', 'role']);
});
