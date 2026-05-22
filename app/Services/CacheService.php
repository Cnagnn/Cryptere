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
    }

    /**
     * Invalidate leaderboard caches.
     */
    public static function invalidateLeaderboard(): void
    {
        // Top score caches
        Cache::forget('leaderboard_top_weekly');
        Cache::forget('leaderboard_top_monthly');
        Cache::forget('leaderboard_top3_all');
        Cache::forget('leaderboard_top3_weekly');
        Cache::forget('leaderboard_top3_monthly');
        Cache::forget('leaderboard_top3_pixabot_v1_all');
        Cache::forget('leaderboard_top3_pixabot_v1_weekly');
        Cache::forget('leaderboard_top3_pixabot_v1_monthly');

        // Timeframe leaderboard caches.
        foreach (['weekly', 'monthly'] as $timeframe) {
            foreach ([10, 25, 50, 100] as $perPage) {
                Cache::forget("leaderboard_timeframe_{$timeframe}_perpage_{$perPage}");
                Cache::forget("leaderboard_timeframe_pixabot_v1_{$timeframe}_perpage_{$perPage}");

                for ($page = 1; $page <= 10; $page++) {
                    Cache::forget("leaderboard_timeframe_{$timeframe}_page_{$page}_perpage_{$perPage}");
                }
            }
        }

        // User rank caches — use pattern-based clearing if available, otherwise
        // individual keys are cleared when they naturally expire (2 min TTL).
        // We clear known keys via a tag-less approach for common user IDs.
        self::clearLeaderboardRankCaches();
    }

    /**
     * Clear cached user rank entries for timeframe leaderboards.
     *
     * Since we cannot use cache tags with all drivers, we store tracked user IDs
     * in a dedicated cache key and clear them individually.
     */
    private static function clearLeaderboardRankCaches(): void
    {
        $trackedUserIds = Cache::get('leaderboard_rank_tracked_users', []);

        foreach (['weekly', 'monthly'] as $timeframe) {
            foreach ($trackedUserIds as $userId) {
                Cache::forget("leaderboard_rank_{$timeframe}_user_{$userId}");
            }
        }

        Cache::forget('leaderboard_rank_tracked_users');
    }

    /**
     * Track a user ID for leaderboard rank cache invalidation.
     */
    public static function trackLeaderboardRankUser(int $userId): void
    {
        $tracked = Cache::get('leaderboard_rank_tracked_users', []);

        if (! in_array($userId, $tracked, true)) {
            $tracked[] = $userId;
            Cache::put('leaderboard_rank_tracked_users', $tracked, 86400);
        }
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
     * Invalidate admin analytics caches (cohort, funnel, economy).
     */
    public static function invalidateAdminAnalytics(): void
    {
        Cache::forget('admin:cohort_retention');
        Cache::forget('admin:gamification_funnel');
        Cache::forget('admin:economy_health');
    }

    /**
     * Invalidate all application caches.
     */
    public static function invalidateAll(): void
    {
        self::invalidateCourseCatalog();
        self::invalidateAdminDashboard();
        self::invalidateAdminAnalytics();
        self::invalidateLeaderboard();
        BadgeService::clearCache();
    }
}
