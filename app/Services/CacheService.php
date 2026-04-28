<?php

namespace App\Services;

use App\Models\Course;
use Illuminate\Support\Facades\Cache;

class CacheService
{
    /** @var int 1 minute — user-specific volatile data */
    public const TTL_SHORT = 60;

    /** @var int 5 minutes — shared catalog/listing data */
    public const TTL_MEDIUM = 300;

    /** @var int 1 hour — rarely changing reference data */
    public const TTL_LONG = 3600;

    /**
     * Get total published course count, cached for 5 minutes.
     */
    public function getPublishedCourseCount(): int
    {
        return Cache::remember('stats:published_courses_count', self::TTL_MEDIUM, fn (): int => Course::query()
            ->published()
            ->count());
    }

    /**
     * Invalidate course catalog caches.
     *
     * Call after creating, updating, deleting, or toggling publish on a course.
     */
    public static function invalidateCourseCatalog(): void
    {
        Cache::forget('stats:published_courses_count');
        Cache::forget('courses:catalog');
        Cache::forget('learning_path:courses');
    }

    /**
     * Invalidate admin dashboard stats cache.
     *
     * Call after significant data changes (new users, enrollments, etc.).
     */
    public static function invalidateAdminDashboard(): void
    {
        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_enrollment_trends');
        Cache::forget('admin_user_growth');
        Cache::forget('admin_course_performance');
        Cache::forget('admin_challenge_performance');
    }

    /**
     * Invalidate leaderboard caches.
     */
    public static function invalidateLeaderboard(): void
    {
        Cache::forget('leaderboard_top_weekly');
        Cache::forget('leaderboard_top_monthly');
        Cache::forget('leaderboard_top3_all');
        Cache::forget('leaderboard_top3_weekly');
        Cache::forget('leaderboard_top3_monthly');
    }

    /**
     * Invalidate challenge catalog caches.
     */
    public static function invalidateChallengeCatalog(): void
    {
        Cache::forget('challenges:catalog');
    }

    /**
     * Invalidate per-user analytics cache.
     */
    public static function invalidateUserAnalytics(int $userId): void
    {
        Cache::forget("analytics_page_{$userId}");
        Cache::forget("learner_dashboard_stats:{$userId}");
    }

    /**
     * Invalidate all application caches.
     */
    public static function invalidateAll(): void
    {
        self::invalidateCourseCatalog();
        self::invalidateAdminDashboard();
        self::invalidateLeaderboard();
        self::invalidateChallengeCatalog();
        BadgeService::clearCache();
    }
}
