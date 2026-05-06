<?php

use App\Models\Course;
use App\Services\CacheService;
use Illuminate\Support\Facades\Cache;

test('TTL constants are correct', function () {
    expect(CacheService::TTL_SHORT)->toBe(60)
        ->and(CacheService::TTL_MEDIUM)->toBe(300)
        ->and(CacheService::TTL_LONG)->toBe(3600);
});

test('getPublishedCourseCount caches result', function () {
    Course::factory()->count(3)->create(['is_published' => true]);
    Course::factory()->count(2)->create(['is_published' => false]);

    $service = new CacheService;
    $count = $service->getPublishedCourseCount();

    expect($count)->toBe(3);

    // Verify cached
    expect(Cache::has('stats:published_courses_count'))->toBeTrue();
});

test('invalidateCourseCatalog clears course caches', function () {
    Cache::put('stats:published_courses_count', 5);
    Cache::put('courses:catalog', ['data']);
    Cache::put('learning_path:courses', ['data']);

    CacheService::invalidateCourseCatalog();

    expect(Cache::has('stats:published_courses_count'))->toBeFalse()
        ->and(Cache::has('courses:catalog'))->toBeFalse()
        ->and(Cache::has('learning_path:courses'))->toBeFalse();
});

test('invalidateAdminDashboard clears admin caches', function () {
    Cache::put('admin_dashboard_stats', ['data']);
    Cache::put('admin_enrollment_trends', ['data']);

    CacheService::invalidateAdminDashboard();

    expect(Cache::has('admin_dashboard_stats'))->toBeFalse()
        ->and(Cache::has('admin_enrollment_trends'))->toBeFalse();
});

test('invalidateLeaderboard clears leaderboard caches', function () {
    Cache::put('leaderboard_top_weekly', ['data']);
    Cache::put('leaderboard_top_monthly', ['data']);
    Cache::put('leaderboard_top3_all', ['data']);

    CacheService::invalidateLeaderboard();

    expect(Cache::has('leaderboard_top_weekly'))->toBeFalse()
        ->and(Cache::has('leaderboard_top_monthly'))->toBeFalse()
        ->and(Cache::has('leaderboard_top3_all'))->toBeFalse();
});

test('trackLeaderboardRankUser stores user id', function () {
    CacheService::trackLeaderboardRankUser(42);
    CacheService::trackLeaderboardRankUser(99);
    CacheService::trackLeaderboardRankUser(42); // duplicate

    $tracked = Cache::get('leaderboard_rank_tracked_users');

    expect($tracked)->toContain(42)
        ->and($tracked)->toContain(99)
        ->and(count(array_filter($tracked, fn ($id) => $id === 42)))->toBe(1);
});

test('invalidateUserAnalytics clears user-specific caches', function () {
    Cache::put('analytics_page_5', ['data']);
    Cache::put('learner_dashboard_stats:5', ['data']);

    CacheService::invalidateUserAnalytics(5);

    expect(Cache::has('analytics_page_5'))->toBeFalse()
        ->and(Cache::has('learner_dashboard_stats:5'))->toBeFalse();
});

test('invalidateChallengeCatalog clears challenge cache', function () {
    Cache::put('challenges:catalog', ['data']);

    CacheService::invalidateChallengeCatalog();

    expect(Cache::has('challenges:catalog'))->toBeFalse();
});

test('invalidateAll clears everything', function () {
    Cache::put('stats:published_courses_count', 5);
    Cache::put('admin_dashboard_stats', ['data']);
    Cache::put('leaderboard_top_weekly', ['data']);
    Cache::put('challenges:catalog', ['data']);

    CacheService::invalidateAll();

    expect(Cache::has('stats:published_courses_count'))->toBeFalse()
        ->and(Cache::has('admin_dashboard_stats'))->toBeFalse()
        ->and(Cache::has('leaderboard_top_weekly'))->toBeFalse()
        ->and(Cache::has('challenges:catalog'))->toBeFalse();
});
