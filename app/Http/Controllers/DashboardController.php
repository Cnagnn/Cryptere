<?php

namespace App\Http\Controllers;

use App\Models\Challenge;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\DailyChallengeService;
use App\Services\Dashboard\AcademyDataBuilder;
use App\Services\Dashboard\AnalyticsBuilder;
use App\Services\Dashboard\LearnerStatsAggregator;
use App\Services\Dashboard\LearningPathBuilder;
use App\Services\LevelService;
use App\Services\MasteryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly LevelService $levelService,
        private readonly DailyChallengeService $dailyChallengeService,
        private readonly MasteryService $masteryService,
        private readonly LearnerStatsAggregator $statsAggregator,
        private readonly AcademyDataBuilder $academyBuilder,
        private readonly LearningPathBuilder $learningPathBuilder,
        private readonly AnalyticsBuilder $analyticsBuilder,
    ) {}

    /**
     * Show the dashboard — learner view for members, analytics view for admins.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return $this->adminDashboard();
        }

        return $this->learnerDashboard($user);
    }

    /**
     * Admin analytics dashboard.
     */
    private function adminDashboard(): Response
    {
        $stats = Cache::remember('admin_dashboard_stats', 300, fn (): array => [
            'totalUsers' => User::count(),
            'totalCourses' => Course::count(),
            'totalChallenges' => Challenge::count(),
            'totalEnrollments' => Enrollment::count(),
            'activeUsers' => User::where('last_active_date', '>=', now()->subDays(30))->count(),
            'newUsersThisMonth' => User::where('created_at', '>=', now()->startOfMonth())->count(),
        ]);

        $totalUsers = $stats['totalUsers'];
        $totalCourses = $stats['totalCourses'];
        $totalChallenges = $stats['totalChallenges'];
        $totalEnrollments = $stats['totalEnrollments'];
        $activeUsers = $stats['activeUsers'];
        $newUsersThisMonth = $stats['newUsersThisMonth'];

        $enrollmentTrends = Cache::remember('admin_enrollment_trends', 300, function () {
            return collect(range(5, 0))->map(function (int $monthOffset): array {
                $month = now()->subMonths($monthOffset)->startOfMonth();
                $end = (clone $month)->endOfMonth();

                return [
                    'month' => $month->format('M'),
                    'enrollments' => Enrollment::whereBetween('created_at', [$month, $end])->count(),
                ];
            })->values();
        });

        $userGrowth = Cache::remember('admin_user_growth', 300, function () {
            return collect(range(5, 0))->map(function (int $monthOffset): array {
                $month = now()->subMonths($monthOffset)->startOfMonth();
                $end = (clone $month)->endOfMonth();

                return [
                    'month' => $month->format('M'),
                    'users' => User::whereBetween('created_at', [$month, $end])->count(),
                ];
            })->values();
        });

        $coursePerformance = Cache::remember('admin_course_performance', 300, function () {
            return Course::query()
                ->where('is_published', true)
                ->withCount([
                    'enrollments',
                    'enrollments as completed_enrollments_count' => function ($query): void {
                        $query->whereNotNull('completed_at');
                    },
                ])
                ->orderByDesc('enrollments_count')
                ->take(5)
                ->get(['id', 'title'])
                ->map(function (Course $course): array {
                    $enrollmentCount = (int) $course->enrollments_count;
                    $completedCount = (int) $course->completed_enrollments_count;

                    return [
                        'title' => $course->title,
                        'enrollments' => $enrollmentCount,
                        'completionRate' => $enrollmentCount > 0
                            ? round(($completedCount / $enrollmentCount) * 100, 1)
                            : 0.0,
                    ];
                });
        });

        $challengePerformance = Cache::remember('admin_challenge_performance', 300, function () {
            return Challenge::query()
                ->where('is_published', true)
                ->withCount([
                    'submissions',
                    'submissions as correct_submissions_count' => function ($query): void {
                        $query->where('is_correct', true);
                    },
                ])
                ->orderByDesc('submissions_count')
                ->take(5)
                ->get(['id', 'title'])
                ->map(function (Challenge $challenge): array {
                    $submissionCount = (int) $challenge->submissions_count;
                    $correctCount = (int) $challenge->correct_submissions_count;

                    return [
                        'title' => $challenge->title,
                        'submissions' => $submissionCount,
                        'successRate' => $submissionCount > 0
                            ? round(($correctCount / $submissionCount) * 100, 1)
                            : 0.0,
                    ];
                });
        });

        $recentUsers = User::query()
            ->latest()
            ->take(5)
            ->get(['id', 'name', 'username', 'email', 'role', 'created_at'])
            ->map(fn (User $u): array => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'role' => $u->role,
                'createdAt' => $u->created_at?->diffForHumans(),
            ]);

        return Inertia::render('dashboard', [
            'admin' => [
                'stats' => [
                    'totalUsers' => $totalUsers,
                    'totalCourses' => $totalCourses,
                    'totalChallenges' => $totalChallenges,
                    'totalEnrollments' => $totalEnrollments,
                    'activeUsers' => $activeUsers,
                    'newUsersThisMonth' => $newUsersThisMonth,
                ],
                'enrollmentTrends' => $enrollmentTrends,
                'userGrowth' => $userGrowth,
                'coursePerformance' => $coursePerformance,
                'challengePerformance' => $challengePerformance,
                'recentUsers' => $recentUsers,
            ],
        ]);
    }

    /**
     * Learner dashboard for regular members.
     */
    private function learnerDashboard(User $user): Response
    {
        // ── Core stats (cached) ──
        $stats = $this->statsAggregator->aggregate($user);
        $successRates = $this->statsAggregator->successRates(
            $user,
            $stats['enrolledCourses'],
            $stats['completedCourses'],
        );

        // ── Recent & recommended courses ──
        $enrollments = Enrollment::query()
            ->whereBelongsTo($user)
            ->with(['course' => function ($query): void {
                $query->select('id', 'slug', 'title', 'summary')
                    ->withCount('lessons');
            }])
            ->latest('updated_at')
            ->take(4)
            ->get();

        $recommendedCourses = Course::query()
            ->where('is_published', true)
            ->whereDoesntHave('enrollments', function ($query) use ($user): void {
                $query->whereBelongsTo($user);
            })
            ->withCount('lessons')
            ->orderBy('sort_order')
            ->orderBy('title')
            ->take(3)
            ->get(['id', 'slug', 'title', 'summary', 'difficulty', 'estimated_minutes']);

        // ── Level, badges, daily challenge ──
        $levelInfo = $this->levelService->getUserLevel($user);

        $recentBadges = $user->badges()
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

        $dailyChallengePayload = $this->buildDailyChallengePayload($user);

        // ── Delegated sections ──
        $academy = $this->academyBuilder->build($user, $stats, $successRates);
        $learningPath = $this->learningPathBuilder->build($user);

        // ── Point decay warning ──
        $decayWarning = $this->buildDecayWarning($user);

        return Inertia::render('dashboard', [
            'decayWarning' => $decayWarning,
            'stats' => [
                'enrolledCourses' => $stats['enrolledCourses'],
                'completedCourses' => $stats['completedCourses'],
                'completedLessons' => $stats['completedLessons'],
                'solvedChallenges' => $stats['solvedChallenges'],
                'points' => $user->points,
                'xp' => $user->xp,
            ],
            'level' => $levelInfo,
            'recentBadges' => $recentBadges,
            'dailyChallenge' => $dailyChallengePayload,
            'recentCourses' => $enrollments->map(fn (Enrollment $enrollment): array => [
                'id' => $enrollment->course?->id,
                'slug' => $enrollment->course?->slug,
                'title' => $enrollment->course?->title,
                'summary' => $enrollment->course?->summary,
                'lessonCount' => $enrollment->course?->lessons_count,
                'progressPercentage' => $enrollment->progress_percentage,
            ])->values(),
            'recommendedCourses' => $recommendedCourses->map(fn (Course $course): array => [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'summary' => $course->summary,
                'difficulty' => $course->difficulty,
                'estimatedMinutes' => $course->estimated_minutes,
                'lessonCount' => $course->lessons_count,
            ])->values(),
            'academy' => $academy,
            'learningPath' => $learningPath,
            'analytics' => [
                'stats' => [
                    'totalPoints' => $user->points,
                    'totalXp' => $user->xp,
                    'currentStreak' => $user->current_streak,
                    'longestStreak' => $user->longest_streak,
                    'completedCourses' => $stats['completedCourses'],
                    'completedLessons' => $stats['completedLessons'],
                    'solvedChallenges' => $stats['solvedChallenges'],
                    'badgeCount' => $user->badges()->count(),
                ],
                // Heavy data — deferred so the Overview tab loads instantly
                'activityHeatmap' => Inertia::defer(fn () => $this->analyticsBuilder->heatmap($user->id)),
                'skillRadar' => Inertia::defer(fn () => $this->analyticsBuilder->skillRadar($user->id)),
                'topicMastery' => Inertia::defer(fn () => $this->masteryService->getUserMastery($user)),
                'streakCalendar' => Inertia::defer(fn () => $this->analyticsBuilder->streakCalendar($user->id)),
                'progressTrend' => Inertia::defer(fn () => $this->analyticsBuilder->progressTrend($user->id)),
            ],
        ]);
    }

    private function buildDailyChallengePayload(User $user): ?array
    {
        $dailyChallenge = $this->dailyChallengeService->getTodaysChallenge();

        if ($dailyChallenge === null) {
            return null;
        }

        return [
            'id' => $dailyChallenge->id,
            'slug' => $dailyChallenge->slug,
            'title' => $dailyChallenge->title,
            'prompt' => Str::limit($dailyChallenge->prompt, 120),
            'isSolved' => $this->dailyChallengeService->hasUserSolvedToday($user->id, $dailyChallenge),
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
