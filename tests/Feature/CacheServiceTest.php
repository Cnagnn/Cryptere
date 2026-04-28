<?php

use App\Models\Course;
use App\Services\BadgeService;
use App\Services\CacheService;
use Illuminate\Support\Facades\Cache;

// ============================================================
// getPublishedCourseCount — Positive Scenarios
// ============================================================

test('returns published course count', function () {
    Course::factory()->count(3)->create(['is_published' => true]);
    Course::factory()->count(2)->create(['is_published' => false]);

    $service = new CacheService;
    $count = $service->getPublishedCourseCount();

    expect($count)->toBe(3);
});

test('caches published course count', function () {
    Course::factory()->count(2)->create(['is_published' => true]);

    $service = new CacheService;

    // First call — hits DB
    $count1 = $service->getPublishedCourseCount();

    // Create more courses — should not affect cached result
    Course::factory()->count(3)->create(['is_published' => true]);

    $count2 = $service->getPublishedCourseCount();

    expect($count1)->toBe(2)
        ->and($count2)->toBe(2); // Still cached
});

test('returns zero when no published courses', function () {
    Course::factory()->count(2)->create(['is_published' => false]);

    $service = new CacheService;

    expect($service->getPublishedCourseCount())->toBe(0);
});

// ============================================================
// invalidateCourseCatalog — Positive Scenarios
// ============================================================

test('invalidates course catalog caches', function () {
    Cache::put('stats:published_courses_count', 5, 3600);
    Cache::put('courses:catalog', ['data'], 3600);
    Cache::put('learning_path:courses', ['data'], 3600);

    CacheService::invalidateCourseCatalog();

    expect(Cache::has('stats:published_courses_count'))->toBeFalse()
        ->and(Cache::has('courses:catalog'))->toBeFalse()
        ->and(Cache::has('learning_path:courses'))->toBeFalse();
});

// ============================================================
// invalidateAdminDashboard — Positive Scenarios
// ============================================================

test('invalidates admin dashboard caches', function () {
    Cache::put('admin_dashboard_stats', ['data'], 3600);
    Cache::put('admin_enrollment_trends', ['data'], 3600);
    Cache::put('admin_user_growth', ['data'], 3600);
    Cache::put('admin_course_performance', ['data'], 3600);
    Cache::put('admin_challenge_performance', ['data'], 3600);

    CacheService::invalidateAdminDashboard();

    expect(Cache::has('admin_dashboard_stats'))->toBeFalse()
        ->and(Cache::has('admin_enrollment_trends'))->toBeFalse()
        ->and(Cache::has('admin_user_growth'))->toBeFalse()
        ->and(Cache::has('admin_course_performance'))->toBeFalse()
        ->and(Cache::has('admin_challenge_performance'))->toBeFalse();
});

// ============================================================
// invalidateLeaderboard — Positive Scenarios
// ============================================================

test('invalidates leaderboard caches', function () {
    Cache::put('leaderboard_top_weekly', 100, 3600);
    Cache::put('leaderboard_top_monthly', 200, 3600);
    Cache::put('leaderboard_top3_all', ['data'], 3600);
    Cache::put('leaderboard_top3_weekly', ['data'], 3600);
    Cache::put('leaderboard_top3_monthly', ['data'], 3600);

    CacheService::invalidateLeaderboard();

    expect(Cache::has('leaderboard_top_weekly'))->toBeFalse()
        ->and(Cache::has('leaderboard_top_monthly'))->toBeFalse()
        ->and(Cache::has('leaderboard_top3_all'))->toBeFalse()
        ->and(Cache::has('leaderboard_top3_weekly'))->toBeFalse()
        ->and(Cache::has('leaderboard_top3_monthly'))->toBeFalse();
});

// ============================================================
// invalidateChallengeCatalog — Positive Scenarios
// ============================================================

test('invalidates challenge catalog cache', function () {
    Cache::put('challenges:catalog', ['data'], 3600);

    CacheService::invalidateChallengeCatalog();

    expect(Cache::has('challenges:catalog'))->toBeFalse();
});

// ============================================================
// invalidateUserAnalytics — Positive Scenarios
// ============================================================

test('invalidates user-specific analytics caches', function () {
    Cache::put('analytics_page_42', ['data'], 3600);
    Cache::put('learner_dashboard_stats:42', ['data'], 3600);

    CacheService::invalidateUserAnalytics(42);

    expect(Cache::has('analytics_page_42'))->toBeFalse()
        ->and(Cache::has('learner_dashboard_stats:42'))->toBeFalse();
});

test('does not invalidate other users analytics', function () {
    Cache::put('analytics_page_42', ['data'], 3600);
    Cache::put('analytics_page_99', ['other'], 3600);

    CacheService::invalidateUserAnalytics(42);

    expect(Cache::has('analytics_page_42'))->toBeFalse()
        ->and(Cache::has('analytics_page_99'))->toBeTrue();
});

// ============================================================
// invalidateAdminAnalytics — Positive Scenarios
// ============================================================

test('invalidates admin analytics caches', function () {
    Cache::put('admin:cohort_retention', ['data'], 3600);
    Cache::put('admin:gamification_funnel', ['data'], 3600);
    Cache::put('admin:economy_health', ['data'], 3600);

    CacheService::invalidateAdminAnalytics();

    expect(Cache::has('admin:cohort_retention'))->toBeFalse()
        ->and(Cache::has('admin:gamification_funnel'))->toBeFalse()
        ->and(Cache::has('admin:economy_health'))->toBeFalse();
});

// ============================================================
// invalidateAll — Positive Scenarios
// ============================================================

test('invalidates all application caches', function () {
    Cache::put('stats:published_courses_count', 5, 3600);
    Cache::put('courses:catalog', ['data'], 3600);
    Cache::put('admin_dashboard_stats', ['data'], 3600);
    Cache::put('leaderboard_top_weekly', 100, 3600);
    Cache::put('challenges:catalog', ['data'], 3600);
    Cache::put('badge_definitions', ['data'], 3600);
    Cache::put('admin:cohort_retention', ['data'], 3600);

    CacheService::invalidateAll();

    expect(Cache::has('stats:published_courses_count'))->toBeFalse()
        ->and(Cache::has('courses:catalog'))->toBeFalse()
        ->and(Cache::has('admin_dashboard_stats'))->toBeFalse()
        ->and(Cache::has('leaderboard_top_weekly'))->toBeFalse()
        ->and(Cache::has('challenges:catalog'))->toBeFalse()
        ->and(Cache::has('badge_definitions'))->toBeFalse()
        ->and(Cache::has('admin:cohort_retention'))->toBeFalse();
});

// ============================================================
// TTL Constants — Validation
// ============================================================

test('TTL constants have correct values', function () {
    expect(CacheService::TTL_SHORT)->toBe(60)
        ->and(CacheService::TTL_MEDIUM)->toBe(300)
        ->and(CacheService::TTL_LONG)->toBe(3600);
});

// ============================================================
// Negative / Edge Scenarios
// ============================================================

test('invalidating non-existent cache keys does not throw', function () {
    // None of these keys exist — should not throw
    CacheService::invalidateCourseCatalog();
    CacheService::invalidateAdminDashboard();
    CacheService::invalidateLeaderboard();
    CacheService::invalidateChallengeCatalog();
    CacheService::invalidateUserAnalytics(999);
    CacheService::invalidateAdminAnalytics();
    CacheService::invalidateAll();

    expect(true)->toBeTrue(); // No exception thrown
});

test('cache refreshes after invalidation', function () {
    Course::factory()->count(2)->create(['is_published' => true]);

    $service = new CacheService;

    // Cache the count
    $count1 = $service->getPublishedCourseCount();
    expect($count1)->toBe(2);

    // Add more courses
    Course::factory()->count(3)->create(['is_published' => true]);

    // Invalidate
    CacheService::invalidateCourseCatalog();

    // Should now return fresh count
    $count2 = $service->getPublishedCourseCount();
    expect($count2)->toBe(5);
});
