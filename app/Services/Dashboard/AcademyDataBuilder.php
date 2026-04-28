<?php

namespace App\Services\Dashboard;

use App\Models\Challenge;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\CacheService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class AcademyDataBuilder
{
    public function __construct(
        private readonly EarningsHistoryAggregator $earningsAggregator,
        private readonly RecentActivityAggregator $activityAggregator,
    ) {}

    /**
     * Build the full academy section payload for the learner dashboard.
     */
    public function build(User $user, array $stats, array $successRates): array
    {
        $firstName = Str::of($user->name)->trim()->before(' ')->toString();
        $displayName = $firstName !== '' ? $firstName : 'Learner';

        $topLearners = User::query()
            ->select(['id', 'name', 'username', 'points', 'avatar_path', 'avatar_image', 'avatar_mime_type'])
            ->orderByDesc('points')
            ->orderBy('name')
            ->take(5)
            ->get();

        $currentUserRank = User::query()
            ->where('points', '>', $user->points)
            ->count() + 1;

        $enrolledCourseIds = Enrollment::query()
            ->whereBelongsTo($user)
            ->pluck('course_id');

        $totalModules = $enrolledCourseIds->isNotEmpty()
            ? Course::query()
                ->whereIn('id', $enrolledCourseIds)
                ->withCount('lessons')
                ->get()
                ->sum('lessons_count')
            : 0;

        $completedModules = $enrolledCourseIds->isNotEmpty()
            ? $user->lessonProgress()
                ->whereNotNull('completed_at')
                ->whereHas('lesson', function ($query) use ($enrolledCourseIds): void {
                    $query->whereIn('course_id', $enrolledCourseIds);
                })
                ->count()
            : 0;

        $activityBreakdown = $this->buildActivityBreakdown($stats);
        $monthlyProgress = $this->buildMonthlyProgress($user);
        $earningsHistory = $this->earningsAggregator->build($user);
        $popularCourses = $this->buildPopularCourses($user);
        $recentActivity = $this->activityAggregator->build($user);

        return [
            'hero' => [
                'greeting' => 'Hi, '.$displayName.' 👋',
                'headline' => 'What do you want to learn today?',
                'description' => 'Discover courses, track progress, and maintain your learning streak with focused milestones.',
                'completionRate' => $successRates['overallSuccessRate'],
            ],
            'learningPath' => [
                'name' => 'Full-Stack Crypto Developer',
                'completedModules' => $completedModules,
                'totalModules' => $totalModules,
                'progressPercentage' => $totalModules > 0
                    ? round(($completedModules / $totalModules) * 100, 1)
                    : 0.0,
                'currentRank' => $currentUserRank,
            ],
            'successMetrics' => [
                'overallSuccessRate' => $successRates['overallSuccessRate'],
                'previousSuccessRate' => $successRates['previousSuccessRate'],
                'targetRate' => 100,
                'totalEnrollments' => $stats['enrolledCourses'],
                'completedEnrollments' => $stats['completedCourses'],
                'inProgressEnrollments' => $stats['inProgressCourses'],
            ],
            'leaderboardPreview' => $topLearners->values()->map(fn (User $learner, int $index): array => [
                'rank' => $index + 1,
                'name' => $learner->name,
                'username' => $learner->username,
                'avatar' => $learner->avatar,
                'points' => $learner->points,
            ]),
            'activityBreakdown' => $activityBreakdown,
            'monthlyProgress' => $monthlyProgress,
            'earningsHistory' => $earningsHistory,
            'popularCourses' => $popularCourses,
            'recentActivity' => $recentActivity,
        ];
    }

    private function buildActivityBreakdown(array $stats): array
    {
        $totalPublishedCourses = app(CacheService::class)->getPublishedCourseCount();
        $totalPublishedChallenges = Challenge::where('is_published', true)->count();

        return [
            [
                'label' => 'Courses',
                'completed' => $stats['completedCourses'],
                'total' => $totalPublishedCourses,
                'percentage' => $totalPublishedCourses > 0
                    ? round(($stats['completedCourses'] / $totalPublishedCourses) * 100, 1)
                    : 0.0,
            ],
            [
                'label' => 'Challenges',
                'completed' => $stats['solvedChallenges'],
                'total' => $totalPublishedChallenges,
                'percentage' => $totalPublishedChallenges > 0
                    ? round(($stats['solvedChallenges'] / $totalPublishedChallenges) * 100, 1)
                    : 0.0,
            ],
        ];
    }

    /**
     * @return array{rangeLabel: string, summaryPercentage: float, deltaFromPrevious: float, series: Collection}
     */
    private function buildMonthlyProgress(User $user): array
    {
        $monthsWindowStart = now()->subMonths(5)->startOfMonth();

        $lessonCompletionsByMonth = $user->lessonProgress()
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $monthsWindowStart)
            ->get(['completed_at'])
            ->groupBy(fn ($progress): string => $progress->completed_at->format('Y-m'))
            ->map(fn ($rows): int => $rows->count());

        $challengeCompletionsByMonth = $user->challengeSubmissions()
            ->where('is_correct', true)
            ->whereNotNull('submitted_at')
            ->where('submitted_at', '>=', $monthsWindowStart)
            ->get(['challenge_id', 'submitted_at'])
            ->groupBy(fn ($submission): string => $submission->submitted_at->format('Y-m'))
            ->map(fn ($submissions): int => $submissions->pluck('challenge_id')->unique()->count());

        $series = collect(range(5, 0))->map(function (int $monthOffset) use (
            $lessonCompletionsByMonth,
            $challengeCompletionsByMonth
        ): array {
            $month = now()->subMonths($monthOffset)->startOfMonth();
            $period = $month->format('Y-m');
            $lessonsCompleted = (int) ($lessonCompletionsByMonth[$period] ?? 0);
            $challengesSolved = (int) ($challengeCompletionsByMonth[$period] ?? 0);

            return [
                'month' => $month->format('M'),
                'lessonsCompleted' => $lessonsCompleted,
                'challengesSolved' => $challengesSolved,
                'totalActivity' => $lessonsCompleted + $challengesSolved,
            ];
        })->values();

        $currentMonthActivity = (int) ($series->last()['totalActivity'] ?? 0);
        $previousMonthActivity = $series->count() > 1
            ? (int) ($series->get($series->count() - 2)['totalActivity'] ?? 0)
            : 0;

        $summaryPercentage = min(100, round(($currentMonthActivity / 20) * 100, 2));
        $delta = $previousMonthActivity > 0
            ? round((($currentMonthActivity - $previousMonthActivity) / $previousMonthActivity) * 100, 1)
            : ($currentMonthActivity > 0 ? 100.0 : 0.0);

        return [
            'rangeLabel' => now()->subMonths(5)->startOfMonth()->format('d M Y')
                .' - '
                .now()->format('d M Y'),
            'summaryPercentage' => $summaryPercentage,
            'deltaFromPrevious' => $delta,
            'series' => $series,
        ];
    }

    private function buildPopularCourses(User $user): Collection
    {
        $popularCourses = Course::query()
            ->where('is_published', true)
            ->withCount([
                'lessons',
                'enrollments',
                'enrollments as completed_enrollments_count' => function ($query): void {
                    $query->whereNotNull('completed_at');
                },
            ])
            ->orderByDesc('enrollments_count')
            ->orderBy('sort_order')
            ->orderBy('title')
            ->take(6)
            ->get(['id', 'slug', 'title']);

        $enrollmentMap = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereIn('course_id', $popularCourses->pluck('id'))
            ->get(['course_id', 'progress_percentage', 'completed_at'])
            ->keyBy('course_id');

        return $popularCourses->map(function (Course $course) use ($enrollmentMap): array {
            $enrollmentCount = (int) $course->enrollments_count;
            $completedCount = (int) $course->completed_enrollments_count;
            $completionRate = $enrollmentCount > 0
                ? round(($completedCount / $enrollmentCount) * 100, 1)
                : 0.0;

            $userEnrollment = $enrollmentMap->get($course->id);
            $callToAction = 'Explore';

            if ($userEnrollment !== null) {
                $callToAction = $userEnrollment->completed_at !== null ? 'Review' : 'Continue';
            }

            return [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'lessonCount' => (int) $course->lessons_count,
                'enrollmentCount' => $enrollmentCount,
                'completionRate' => $completionRate,
                'currentUserProgress' => $userEnrollment?->progress_percentage,
                'callToAction' => $callToAction,
            ];
        })->values();
    }
}
