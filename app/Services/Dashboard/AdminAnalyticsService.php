<?php

namespace App\Services\Dashboard;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Advanced analytics for the admin dashboard.
 *
 * Provides cohort retention analysis, gamification funnel metrics,
 * and XP/points economy health indicators.
 *
 * @see IMPLEMENTATION_PLAN.md R15: Admin Analytics Enhancements
 */
class AdminAnalyticsService
{
    /**
     * Cohort analysis: retention by signup week.
     * Returns array of weeks with signup count and active-in-week-N counts.
     */
    public function getCohortRetention(int $weeks = 8): array
    {
        return Cache::remember('admin:cohort_retention', 3600, function () use ($weeks) {
            $cohorts = DB::table('users')
                ->selectRaw('YEARWEEK(created_at) as cohort_week, COUNT(*) as signup_count')
                ->where('created_at', '>=', now()->subWeeks($weeks))
                ->groupBy('cohort_week')
                ->orderBy('cohort_week')
                ->get();

            return $cohorts->map(function ($cohort) use ($weeks) {
                $retention = [];
                for ($w = 0; $w < $weeks; $w++) {
                    $activeCount = DB::table('users')
                        ->whereRaw('YEARWEEK(created_at) = ?', [$cohort->cohort_week])
                        ->whereRaw('YEARWEEK(last_active_date) >= ? + ?', [$cohort->cohort_week, $w])
                        ->count();
                    $retention["week_{$w}"] = $cohort->signup_count > 0
                        ? round(($activeCount / $cohort->signup_count) * 100, 1)
                        : 0;
                }

                return [
                    'cohort_week' => $cohort->cohort_week,
                    'signup_count' => $cohort->signup_count,
                    'retention' => $retention,
                ];
            })->toArray();
        });
    }

    /**
     * Gamification funnel: enrollment → lesson → quiz → challenge → certificate.
     */
    public function getGamificationFunnel(): array
    {
        return Cache::remember('admin:gamification_funnel', 3600, function () {
            $totalUsers = DB::table('users')->count();
            $enrolled = DB::table('enrollments')->distinct('user_id')->count('user_id');
            $completedLesson = DB::table('lesson_progress')->whereNotNull('completed_at')->distinct('user_id')->count('user_id');
            $completedQuiz = DB::table('quiz_submissions')->distinct('user_id')->count('user_id');
            $solvedChallenge = DB::table('challenge_submissions')->where('is_correct', true)->distinct('user_id')->count('user_id');
            $earnedCertificate = DB::table('certificates')->distinct('user_id')->count('user_id');

            return [
                ['stage' => 'Registered', 'count' => $totalUsers, 'percentage' => 100],
                ['stage' => 'Enrolled', 'count' => $enrolled, 'percentage' => $totalUsers > 0 ? round(($enrolled / $totalUsers) * 100, 1) : 0],
                ['stage' => 'Completed Lesson', 'count' => $completedLesson, 'percentage' => $totalUsers > 0 ? round(($completedLesson / $totalUsers) * 100, 1) : 0],
                ['stage' => 'Completed Quiz', 'count' => $completedQuiz, 'percentage' => $totalUsers > 0 ? round(($completedQuiz / $totalUsers) * 100, 1) : 0],
                ['stage' => 'Solved Challenge', 'count' => $solvedChallenge, 'percentage' => $totalUsers > 0 ? round(($solvedChallenge / $totalUsers) * 100, 1) : 0],
                ['stage' => 'Earned Certificate', 'count' => $earnedCertificate, 'percentage' => $totalUsers > 0 ? round(($earnedCertificate / $totalUsers) * 100, 1) : 0],
            ];
        });
    }

    /**
     * XP/Points economy health metrics.
     */
    public function getEconomyHealth(): array
    {
        return Cache::remember('admin:economy_health', 3600, function () {
            $totalUsers = max(1, DB::table('users')->count());

            return [
                'total_xp_awarded_today' => (int) DB::table('users')->sum('daily_xp_earned'),
                'avg_xp_per_user' => (int) DB::table('users')->avg('xp'),
                'avg_points_per_user' => (int) DB::table('users')->avg('points'),
                'median_streak' => (int) DB::table('users')->where('current_streak', '>', 0)->avg('current_streak'),
                'users_with_streak' => DB::table('users')->where('current_streak', '>', 0)->count(),
                'total_badges_earned' => DB::table('user_badges')->count(),
                'avg_badges_per_user' => round(DB::table('user_badges')->count() / $totalUsers, 1),
                'top_badge' => DB::table('user_badges')
                    ->join('badges', 'user_badges.badge_id', '=', 'badges.id')
                    ->selectRaw('badges.name, COUNT(*) as earn_count')
                    ->groupBy('badges.name')
                    ->orderByDesc('earn_count')
                    ->first(),
            ];
        });
    }
}
