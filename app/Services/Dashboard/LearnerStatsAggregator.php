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
     * @return array{enrolledCourses: int, completedCourses: int, inProgressCourses: int, completedLessons: int}
     */
    public function aggregate(User $user): array
    {
        return Cache::remember("learner_dashboard_stats:{$user->id}", 60, function () use ($user): array {
            $enrollmentStats = Enrollment::query()
                ->whereBelongsTo($user)
                ->selectRaw('
                    COUNT(*) as enrolled_courses,
                    SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed_courses,
                    SUM(CASE WHEN completed_at IS NULL AND progress_percentage > 0 THEN 1 ELSE 0 END) as in_progress_courses
                ')
                ->first();

            $enrolledCourses = (int) $enrollmentStats->enrolled_courses;
            $completedCourses = (int) $enrollmentStats->completed_courses;
            $inProgressCourses = (int) $enrollmentStats->in_progress_courses;
            $completedLessons = $user->lessonProgress()->whereNotNull('completed_at')->count();

            return compact('enrolledCourses', 'completedCourses', 'inProgressCourses', 'completedLessons');
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

        $previousStats = Enrollment::query()
            ->whereBelongsTo($user)
            ->where('created_at', '<', $startOfCurrentMonth)
            ->selectRaw('
                COUNT(*) as enrolled_courses,
                SUM(CASE WHEN completed_at IS NOT NULL AND completed_at < ? THEN 1 ELSE 0 END) as completed_courses
            ', [$startOfCurrentMonth])
            ->first();

        $previousEnrolled = (int) $previousStats->enrolled_courses;
        $previousCompleted = (int) $previousStats->completed_courses;

        $previousSuccessRate = $previousEnrolled > 0
            ? round(($previousCompleted / $previousEnrolled) * 100, 1)
            : 0.0;

        return compact('overallSuccessRate', 'previousSuccessRate');
    }
}
