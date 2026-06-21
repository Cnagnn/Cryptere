<?php

namespace App\Services\Dashboard;

use App\Models\Badge;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
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
            'nextAction' => $this->buildNextAction($user),
            'weeklyGoal' => $this->buildWeeklyGoal($user),
            'rankProgress' => $this->buildRankProgress($user),
            'learningRisks' => $this->buildLearningRisks($user),
            'progressInsights' => $this->buildProgressInsights($user),
            'badgeGoal' => $this->buildBadgeGoal($user, $stats),
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
                'actionLabel' => 'Lihat progres badge',
                'actionUrl' => route('dashboard'),
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
        $enrolledCourseIds = Enrollment::query()
            ->whereBelongsTo($user)
            ->pluck('course_id');
        $completedCourseIds = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereNotNull('completed_at')
            ->pluck('course_id');
        $knownCategories = Course::query()
            ->whereIn('id', $enrolledCourseIds)
            ->whereNotNull('category')
            ->pluck('category')
            ->filter()
            ->unique()
            ->values();

        return Course::query()
            ->where('status', 'published')
            ->whereNotIn('id', $enrolledCourseIds)
            ->withCount(['lessons', 'enrollments'])
            ->orderBy('sort_order')
            ->orderBy('title')
            ->take(12)
            ->get(['id', 'slug', 'title', 'summary', 'difficulty', 'category', 'prerequisite_course_id', 'sort_order'])
            ->map(function (Course $course) use ($completedCourseIds, $knownCategories): array {
                $score = 0;
                $reason = 'Jalur baru untuk memperluas kemampuan Anda.';

                if ($course->prerequisite_course_id && $completedCourseIds->contains($course->prerequisite_course_id)) {
                    $score += 35;
                    $reason = 'Cocok sebagai lanjutan dari kursus yang sudah selesai.';
                }

                if ($course->category && $knownCategories->contains($course->category)) {
                    $score += 30;
                    $reason = "Masih satu topik dengan progres {$course->category} Anda.";
                }

                if ((int) $course->enrollments_count > 0) {
                    $score += min(20, (int) $course->enrollments_count);
                }

                if (strtolower((string) $course->difficulty) === 'pemula' && $knownCategories->isEmpty()) {
                    $score += 15;
                    $reason = 'Pilihan aman untuk memulai jalur belajar.';
                }

                return [
                    'score' => $score,
                    'sortOrder' => (int) $course->sort_order,
                    'id' => $course->id,
                    'slug' => $course->slug,
                    'title' => $course->title,
                    'summary' => $course->summary,
                    'difficulty' => $course->difficulty,
                    'category' => $course->category,
                    'lessonCount' => $course->lessons_count,
                    'recommendationReason' => $reason,
                    'actionLabel' => 'Mulai kursus',
                ];
            })
            ->sortBy([
                ['score', 'desc'],
                ['sortOrder', 'asc'],
                ['title', 'asc'],
            ])
            ->take(3)
            ->map(fn (array $course): array => [
                'id' => $course['id'],
                'slug' => $course['slug'],
                'title' => $course['title'],
                'summary' => $course['summary'],
                'difficulty' => $course['difficulty'],
                'category' => $course['category'],
                'lessonCount' => $course['lessonCount'],
                'recommendationReason' => $course['recommendationReason'],
                'actionLabel' => $course['actionLabel'],
            ])->values();
    }

    private function buildNextAction(User $user): array
    {
        $inProgressEnrollment = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereNull('completed_at')
            ->where('progress_percentage', '>', 0)
            ->where('progress_percentage', '<', 100)
            ->with(['course.lessons' => fn ($query) => $query
                ->where('status', 'published')
                ->select(['id', 'course_id', 'slug', 'title', 'position'])
                ->orderBy('position')])
            ->latest('updated_at')
            ->first();

        if ($inProgressEnrollment?->course) {
            $completedLessonIds = LessonProgress::query()
                ->whereBelongsTo($user)
                ->whereNotNull('completed_at')
                ->pluck('lesson_id');
            $nextLesson = $inProgressEnrollment->course->lessons
                ->first(fn ($lesson): bool => ! $completedLessonIds->contains($lesson->id));

            return [
                'type' => 'continue_course',
                'title' => 'Lanjutkan '.$inProgressEnrollment->course->title,
                'description' => 'Progress Anda sudah '.round((float) $inProgressEnrollment->progress_percentage).'% - lanjutkan dari materi berikutnya.',
                'actionLabel' => 'Lanjut belajar',
                'url' => route('courses.show', $inProgressEnrollment->course->slug),
                'meta' => [
                    'courseTitle' => $inProgressEnrollment->course->title,
                    'lessonTitle' => $nextLesson?->title,
                    'progressPercentage' => (float) $inProgressEnrollment->progress_percentage,
                ],
            ];
        }

        $recommendedCourse = $this->buildRecommendedCourses($user)->first();

        if ($recommendedCourse) {
            return [
                'type' => 'start_course',
                'title' => 'Mulai '.$recommendedCourse['title'],
                'description' => $recommendedCourse['recommendationReason'],
                'actionLabel' => 'Mulai kursus',
                'url' => route('courses.show', $recommendedCourse['slug']),
                'meta' => [
                    'courseTitle' => $recommendedCourse['title'],
                    'lessonCount' => $recommendedCourse['lessonCount'],
                ],
            ];
        }

        return [
            'type' => 'review_progress',
            'title' => 'Tinjau progres belajar',
            'description' => 'Semua kursus utama sudah masuk daftar belajar Anda. Gunakan dashboard untuk menjaga konsistensi.',
            'actionLabel' => 'Lihat kursus',
            'url' => route('courses.index'),
            'meta' => [],
        ];
    }

    private function buildWeeklyGoal(User $user): array
    {
        $weekStart = now()->startOfWeek();
        $targetLessons = 5;
        $targetXp = (int) round((float) config('rewards.daily_goal_target_xp', 100) * 7 * 0.7);
        $completedLessons = LessonProgress::query()
            ->whereBelongsTo($user)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $weekStart)
            ->count();
        $earnedXp = (int) $user->balanceChanges()
            ->where('created_at', '>=', $weekStart)
            ->sum('xp_delta');

        return [
            'label' => 'Target Mingguan',
            'targetLessons' => $targetLessons,
            'completedLessons' => $completedLessons,
            'remainingLessons' => max(0, $targetLessons - $completedLessons),
            'targetXp' => $targetXp,
            'earnedXp' => max(0, $earnedXp),
            'progressPercentage' => min(100, round(($completedLessons / $targetLessons) * 100, 1)),
            'resetsAt' => now()->endOfWeek()->diffForHumans(),
        ];
    }

    private function buildRankProgress(User $user): array
    {
        $currentRank = User::query()
            ->where('points', '>', $user->points)
            ->count() + 1;
        $nextUser = User::query()
            ->where('points', '>', $user->points)
            ->orderBy('points')
            ->first(['name', 'username', 'points']);

        return [
            'currentRank' => $currentRank,
            'nextRank' => $nextUser ? max(1, $currentRank - 1) : null,
            'pointsToNextRank' => $nextUser ? ((int) $nextUser->points - (int) $user->points + 1) : 0,
            'nextUser' => $nextUser ? [
                'name' => $nextUser->name,
                'username' => $nextUser->username,
                'points' => (int) $nextUser->points,
            ] : null,
        ];
    }

    private function buildLearningRisks(User $user): array
    {
        $risks = [];
        $lastActiveDate = $user->last_active_date ? Carbon::parse($user->last_active_date) : null;
        $daysSinceActive = $lastActiveDate ? abs((int) now()->diffInDays($lastActiveDate)) : null;

        if ($lastActiveDate === null || $daysSinceActive >= 1 || (int) $user->current_streak <= 0) {
            $risks[] = [
                'type' => 'streak',
                'severity' => $daysSinceActive !== null && $daysSinceActive >= 3 ? 'high' : 'medium',
                'title' => 'Konsistensi perlu dijaga',
                'description' => $daysSinceActive === null
                    ? 'Mulai satu aktivitas belajar untuk membuka streak pertama.'
                    : "Belum ada aktivitas tercatat selama {$daysSinceActive} hari.",
                'actionLabel' => 'Kerjakan pelajaran',
                'url' => route('courses.index'),
            ];
        }

        $stalledEnrollment = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereNull('completed_at')
            ->where('progress_percentage', '>', 0)
            ->where('progress_percentage', '<', 100)
            ->where(function ($query): void {
                $query->where('updated_at', '<', now()->subDays(7))
                    ->orWhere('enrolled_at', '<', now()->subDays(7))
                    ->orWhere('progress_percentage', '<', 50);
            })
            ->with('course:id,slug,title')
            ->latest('updated_at')
            ->first();

        if ($stalledEnrollment?->course) {
            $risks[] = [
                'type' => 'stalled_course',
                'severity' => 'medium',
                'title' => 'Kursus mulai mandek',
                'description' => $stalledEnrollment->course->title.' belum bergerak lebih dari 7 hari.',
                'actionLabel' => 'Lanjutkan kursus',
                'url' => route('courses.show', $stalledEnrollment->course->slug),
            ];
        }

        return $risks;
    }

    private function buildProgressInsights(User $user): array
    {
        return Enrollment::query()
            ->whereBelongsTo($user)
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->whereNotNull('courses.category')
            ->selectRaw('courses.category, AVG(enrollments.progress_percentage) as average_progress, COUNT(*) as course_count')
            ->groupBy('courses.category')
            ->orderByDesc('average_progress')
            ->get()
            ->map(fn ($row): array => [
                'label' => $row->category,
                'value' => round((float) $row->average_progress, 1),
                'unit' => '%',
                'description' => ((float) $row->average_progress) >= 70
                    ? 'Area kuat - pertahankan ritme belajar.'
                    : 'Area yang layak diberi sesi latihan tambahan.',
                'status' => ((float) $row->average_progress) >= 70 ? 'strong' : 'needs_practice',
                'courseCount' => (int) $row->course_count,
            ])
            ->values()
            ->all();
    }

    private function buildBadgeGoal(User $user, array $stats): array
    {
        $earnedBadgeIds = $user->badges()->pluck('badges.id');
        $candidate = Badge::query()
            ->whereNotIn('id', $earnedBadgeIds)
            ->orderBy('sort_order')
            ->orderBy('criteria_value')
            ->first();

        if (! $candidate) {
            return [
                'title' => 'Badge pertama',
                'description' => 'Selesaikan aktivitas belajar untuk membuka badge berikutnya.',
                'currentValue' => $stats['completedLessons'],
                'targetValue' => max(1, $stats['completedLessons'] + 1),
                'progressPercentage' => 0,
                'actionLabel' => 'Cari pelajaran',
                'url' => route('courses.index'),
            ];
        }

        $currentValue = match ($candidate->criteria_type) {
            'courses_completed' => $stats['completedCourses'],
            'lessons_completed' => $stats['completedLessons'],
            'points_earned' => $user->points,
            'streak_days' => $user->current_streak,
            'labs_visited' => $user->labVisits()->count(),
            default => 0,
        };
        $targetValue = max(1, (int) $candidate->criteria_value);

        return [
            'title' => $candidate->name,
            'description' => $candidate->description,
            'currentValue' => $currentValue,
            'targetValue' => $targetValue,
            'progressPercentage' => min(100, round(($currentValue / $targetValue) * 100, 1)),
            'actionLabel' => 'Kejar badge',
            'url' => route('courses.index'),
        ];
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
        $decayMinPoints = (int) config('rewards.decay_min_points', 10);

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
