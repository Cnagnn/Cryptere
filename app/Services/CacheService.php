<?php

namespace App\Services;

use App\Models\Course;
use Illuminate\Support\Facades\Cache;

class CacheService
{
    private const TTL_MEDIUM = 300; // 5 minutes

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
    }

    /**
     * Invalidate admin dashboard stats cache.
     *
     * Call after significant data changes (new users, enrollments, etc.).
     */
    public static function invalidateAdminDashboard(): void
    {
        Cache::forget('admin_dashboard_stats');
    }

    /**
     * Invalidate leaderboard caches.
     */
    public static function invalidateLeaderboard(): void
    {
        Cache::forget('leaderboard_top_weekly');
        Cache::forget('leaderboard_top_monthly');
    }

    /**
     * Invalidate all application caches.
     */
    public static function invalidateAll(): void
    {
        self::invalidateCourseCatalog();
        self::invalidateAdminDashboard();
        self::invalidateLeaderboard();
        BadgeService::clearCache();
    }
}
