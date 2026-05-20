<?php

namespace App\Services\Dashboard;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\LevelService;
use App\Services\MasteryService;
use Carbon\Carbon;
use Inertia\Inertia;

class LearnerDashboardBuilder
{
    public function __construct(
        private readonly LevelService $levelService,
        private readonly MasteryService $masteryService,
        private readonly LearnerStatsAggregator $statsAggregator,
        private readonly AcademyDataBuilder $academyBuilder,
        private readonly AnalyticsBuilder $analyticsBuilder,
    ) {}

    /**
     * Build the full learner dashboard props array.
     */
    public function build(User $user): array
    {
        $stats = $this->statsAggregator->aggregate($user);
        $successRates = $this->statsAggregator->successRates(
            $user,
            $stats['enrolledCourses'],
            $stats['completedCourses'],
        );

        return [
            'decayWarning' => $this->buildDecayWarning($user),
            'stats' => [
                'enrolledCourses' => $stats['enrolledCourses'],
                'completedCourses' => $stats['completedCourses'],
                'completedLessons' => $stats['completedLessons'],
                'points' => $user->points,
                'xp' => $user->xp,
            ],
            'level' => $this->levelService->getUserLevel($user),
            'recentBadges' => $this->buildRecentBadges($user),
            'recentCourses' => $this->buildRecentCourses($user),
            'recommendedCourses' => $this->buildRecommendedCourses($user),
            'academy' => $this->academyBuilder->build($user, $stats, $successRates),
            'analytics' => $this->buildAnalytics($user, $stats),
        ];
    }

    private function buildRecentBadges(User $user): mixed
    {
        return $user->badges()
            ->orderByPivot('earned_at', 'desc')
            ->take(5)
            ->get(['badges.id', 'name', 'description', 'icon', 'tier', 'category'])
            ->map(fn ($badge): array => [
                'id' => $badge->id,
                'name' => $badge->name,
                'description' => $badge->description,
                'icon' => $badge->icon,
                'tier' => $badge->tier,
                'category' => $badge->category,
                'earnedAt' => $badge->pivot->earned_at
                    ? Carbon::parse($badge->pivot->earned_at)->diffForHumans()
                    : null,
            ]);
    }

    private function buildRecentCourses(User $user): mixed
    {
        return Enrollment::query()
            ->whereBelongsTo($user)
            ->with(['course' => function ($query): void {
                $query->select('id', 'slug', 'title', 'summary')
                    ->withCount('lessons');
            }])
            ->latest('updated_at')
            ->take(4)
            ->get()
            ->map(fn (Enrollment $enrollment): array => [
                'id' => $enrollment->course?->id,
                'slug' => $enrollment->course?->slug,
                'title' => $enrollment->course?->title,
                'summary' => $enrollment->course?->summary,
                'lessonCount' => $enrollment->course?->lessons_count,
                'progressPercentage' => $enrollment->progress_percentage,
            ])->values();
    }

    private function buildRecommendedCourses(User $user): mixed
    {
        return Course::query()
            ->where('status', 'published')
            ->whereDoesntHave('enrollments', function ($query) use ($user): void {
                $query->whereBelongsTo($user);
            })
            ->withCount('lessons')
            ->orderBy('sort_order')
            ->orderBy('title')
            ->take(3)
            ->get(['id', 'slug', 'title', 'summary', 'difficulty'])
            ->map(fn (Course $course): array => [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'summary' => $course->summary,
                'difficulty' => $course->difficulty,
                'lessonCount' => $course->lessons_count,
            ])->values();
    }

    private function buildAnalytics(User $user, array $stats): array
    {
        return [
            'stats' => [
                'totalPoints' => $user->points,
                'totalXp' => $user->xp,
                'currentStreak' => $user->current_streak,
                'longestStreak' => $user->longest_streak,
                'completedCourses' => $stats['completedCourses'],
                'completedLessons' => $stats['completedLessons'],
                'badgeCount' => $user->badges()->count(),
            ],
            // Heavy data — deferred so the Overview tab loads instantly
            'activityHeatmap' => Inertia::defer(fn () => $this->analyticsBuilder->heatmap($user->id)),
            'skillRadar' => Inertia::defer(fn () => $this->analyticsBuilder->skillRadar($user->id)),
            'topicMastery' => Inertia::defer(fn () => $this->masteryService->getUserMastery($user)),
            'streakCalendar' => Inertia::defer(fn () => $this->analyticsBuilder->streakCalendar($user->id)),
            'progressTrend' => Inertia::defer(fn () => $this->analyticsBuilder->progressTrend($user->id)),
        ];
    }

    private function buildDecayWarning(User $user): ?array
    {
        $decayInactiveDays = (int) config('rewards.decay_inactive_days', 14);
        $decayMinPoints = (int) config('rewards.decay_min_points', 100);

        if ($user->points <= $decayMinPoints || $user->last_active_date === null) {
            return null;
        }

        $daysSinceActive = (int) now()->diffInDays($user->last_active_date);
        $daysUntilDecay = max(0, $decayInactiveDays - $daysSinceActive);

        if ($daysUntilDecay > 3 || $daysUntilDecay <= 0) {
            return null;
        }

        return [
            'daysUntilDecay' => $daysUntilDecay,
            'currentPoints' => $user->points,
            'decayPercent' => (float) config('rewards.decay_percent', 1),
        ];
    }
}
