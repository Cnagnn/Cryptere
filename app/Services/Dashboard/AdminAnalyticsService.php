<?php

namespace App\Services\Dashboard;

use Illuminate\Support\Carbon;
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
        return Cache::remember("admin:cohort_retention:v3:{$weeks}", 3600, function () use ($weeks) {
            $users = DB::table('users')
                ->select(['created_at', 'last_active_date'])
                ->where('created_at', '>=', now()->subWeeks($weeks))
                ->get();
            $now = now();

            return $users
                ->groupBy(fn ($user): string => $this->weekKey($user->created_at))
                ->sortKeys()
                ->map(function ($cohortUsers, string $cohortWeek) use ($now, $weeks) {
                    $signupCount = $cohortUsers->count();
                    $cohortStart = $this->weekStart($cohortUsers->first()->created_at);

                    $retention = [];
                    for ($w = 0; $w < $weeks; $w++) {
                        $activeThreshold = $cohortStart->copy()->addWeeks($w);

                        if ($activeThreshold->gt($now)) {
                            $retention["week_{$w}"] = null;

                            continue;
                        }

                        $activeCount = $cohortUsers
                            ->filter(fn ($user): bool => $user->last_active_date !== null && Carbon::parse($user->last_active_date)->gte($activeThreshold))
                            ->count();

                        $retention["week_{$w}"] = $signupCount > 0
                        ? round(($activeCount / $signupCount) * 100, 1)
                        : 0;
                    }

                    return [
                        'cohort_week' => $cohortWeek,
                        'signup_count' => $signupCount,
                        'confidence' => $this->sampleConfidence($signupCount),
                        'sample_label' => $this->sampleLabel($signupCount),
                        'retention' => $retention,
                    ];
                })
                ->values()
                ->toArray();
        });
    }

    /**
     * Gamification funnel: enrollment -> lesson -> quiz.
     */
    public function getGamificationFunnel(): array
    {
        return Cache::remember('admin:gamification_funnel', 3600, function () {
            $totalUsers = DB::table('users')->count();
            $enrolled = DB::table('enrollments')->distinct('user_id')->count('user_id');
            $completedLesson = DB::table('lesson_progress')->whereNotNull('completed_at')->distinct('user_id')->count('user_id');
            $completedQuiz = DB::table('quiz_submissions')->distinct('user_id')->count('user_id');

            $stages = [
                ['stage' => 'Registered', 'count' => $totalUsers, 'percentage' => 100],
                ['stage' => 'Enrolled', 'count' => $enrolled, 'percentage' => $totalUsers > 0 ? round(($enrolled / $totalUsers) * 100, 1) : 0],
                ['stage' => 'Completed Lesson', 'count' => $completedLesson, 'percentage' => $totalUsers > 0 ? round(($completedLesson / $totalUsers) * 100, 1) : 0],
                ['stage' => 'Completed Quiz', 'count' => $completedQuiz, 'percentage' => $totalUsers > 0 ? round(($completedQuiz / $totalUsers) * 100, 1) : 0],
            ];

            return collect($stages)
                ->map(function (array $stage, int $index) use ($stages): array {
                    $previousCount = $index === 0 ? null : (int) $stages[$index - 1]['count'];
                    $dropoffCount = $previousCount === null ? 0 : max(0, $previousCount - (int) $stage['count']);

                    return [
                        ...$stage,
                        'conversion_from_previous' => $previousCount === null
                            ? 100.0
                            : ($previousCount > 0 ? round(((int) $stage['count'] / $previousCount) * 100, 1) : 0.0),
                        'dropoff_count' => $dropoffCount,
                        'dropoff_percentage' => $previousCount !== null && $previousCount > 0
                            ? round(($dropoffCount / $previousCount) * 100, 1)
                            : 0.0,
                    ];
                })
                ->values()
                ->all();
        });
    }

    /**
     * XP/Points economy health metrics.
     */
    public function getEconomyHealth(): array
    {
        return Cache::remember('admin:economy_health:v3', 3600, function () {
            $userStats = DB::table('users')
                ->selectRaw('
                    COUNT(*) as total_users,
                    SUM(daily_xp_earned) as total_xp_awarded_today,
                    AVG(xp) as avg_xp_per_user,
                    AVG(points) as avg_points_per_user,
                    AVG(CASE WHEN current_streak > 0 THEN current_streak ELSE NULL END) as avg_streak,
                    SUM(CASE WHEN current_streak > 0 THEN 1 ELSE 0 END) as users_with_streak
                ')
                ->first();
            $totalUsers = max(1, (int) $userStats->total_users);
            $totalBadgesEarned = DB::table('user_badges')->count();
            $activeStreakShare = round(((int) $userStats->users_with_streak / $totalUsers) * 100, 1);
            $avgXpPerUser = (float) $userStats->avg_xp_per_user;
            $signals = [
                [
                    'label' => 'User dengan streak',
                    'value' => $activeStreakShare,
                    'unit' => '%',
                    'status' => $activeStreakShare >= 30 ? 'healthy' : 'watch',
                ],
                [
                    'label' => 'Rata-rata XP',
                    'value' => round($avgXpPerUser, 1),
                    'unit' => 'XP',
                    'status' => $avgXpPerUser >= 100 ? 'healthy' : 'watch',
                ],
                [
                    'label' => 'Badge per user',
                    'value' => round($totalBadgesEarned / $totalUsers, 1),
                    'unit' => 'badge',
                    'status' => $totalBadgesEarned > 0 ? 'healthy' : 'watch',
                ],
            ];
            $watchSignals = collect($signals)->where('status', 'watch')->count();

            return [
                'total_xp_awarded_today' => (int) $userStats->total_xp_awarded_today,
                'avg_xp_per_user' => (int) $userStats->avg_xp_per_user,
                'avg_points_per_user' => (int) $userStats->avg_points_per_user,
                'avg_streak' => round((float) $userStats->avg_streak, 1),
                'users_with_streak' => (int) $userStats->users_with_streak,
                'total_badges_earned' => $totalBadgesEarned,
                'avg_badges_per_user' => round($totalBadgesEarned / $totalUsers, 1),
                'status' => $watchSignals >= 2 ? 'watch' : 'healthy',
                'status_label' => $watchSignals >= 2 ? 'Perlu perhatian' : 'Sehat',
                'signals' => $signals,
                'top_badge' => DB::table('user_badges')
                    ->join('badges', 'user_badges.badge_id', '=', 'badges.id')
                    ->selectRaw('badges.name, COUNT(*) as earn_count')
                    ->groupBy('badges.name')
                    ->orderByDesc('earn_count')
                    ->first(),
            ];
        });
    }

    private function weekKey(string $date): string
    {
        return Carbon::parse($date)->startOfWeek()->format('Y-m-d');
    }

    private function weekStart(string $date): Carbon
    {
        return Carbon::parse($date)->startOfWeek();
    }

    private function sampleConfidence(int $signupCount): string
    {
        if ($signupCount >= 30) {
            return 'high';
        }

        if ($signupCount >= 10) {
            return 'medium';
        }

        return 'low';
    }

    private function sampleLabel(int $signupCount): string
    {
        return match ($this->sampleConfidence($signupCount)) {
            'high' => 'Sampel kuat',
            'medium' => 'Sampel sedang',
            default => 'Sampel kecil',
        };
    }
}
