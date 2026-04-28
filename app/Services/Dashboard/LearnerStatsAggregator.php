<?php

namespace App\Services\Dashboard;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class LearnerStatsAggregator
{
    /**
     * Core learner stats (cached 60s).
     *
     * @return array{enrolledCourses: int, completedCourses: int, inProgressCourses: int, completedLessons: int, solvedChallenges: int}
     */
    public function aggregate(User $user): array
    {
        return Cache::remember("learner_dashboard_stats:{$user->id}", 60, function () use ($user): array {
            $enrollmentQuery = Enrollment::query()->whereBelongsTo($user);

            $enrolledCourses = (clone $enrollmentQuery)->count();
            $completedCourses = (clone $enrollmentQuery)->whereNotNull('completed_at')->count();
            $inProgressCourses = (clone $enrollmentQuery)
                ->whereNull('completed_at')
                ->where('progress_percentage', '>', 0)
                ->count();
            $completedLessons = $user->lessonProgress()->whereNotNull('completed_at')->count();
            $solvedChallenges = $user->challengeSubmissions()
                ->where('is_correct', true)
                ->distinct('challenge_id')
                ->count('challenge_id');

            return compact('enrolledCourses', 'completedCourses', 'inProgressCourses', 'completedLessons', 'solvedChallenges');
        });
    }

    /**
     * Success rate comparison: current vs previous month.
     *
     * @return array{overallSuccessRate: float, previousSuccessRate: float}
     */
    public function successRates(User $user, int $enrolledCourses, int $completedCourses): array
    {
        $overallSuccessRate = $enrolledCourses > 0
            ? round(($completedCourses / $enrolledCourses) * 100, 1)
            : 0.0;

        $startOfCurrentMonth = now()->startOfMonth();

        $previousEnrolled = Enrollment::query()
            ->whereBelongsTo($user)
            ->where('created_at', '<', $startOfCurrentMonth)
            ->count();
        $previousCompleted = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereNotNull('completed_at')
            ->where('completed_at', '<', $startOfCurrentMonth)
            ->count();

        $previousSuccessRate = $previousEnrolled > 0
            ? round(($previousCompleted / $previousEnrolled) * 100, 1)
            : 0.0;

        return compact('overallSuccessRate', 'previousSuccessRate');
    }
}
