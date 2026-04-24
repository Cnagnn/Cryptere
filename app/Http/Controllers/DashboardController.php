<?php

namespace App\Http\Controllers;

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\DailyChallengeService;
use App\Services\LevelService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly LevelService $levelService,
        private readonly DailyChallengeService $dailyChallengeService,
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
        $totalUsers = User::count();
        $totalCourses = Course::count();
        $totalChallenges = Challenge::count();
        $totalEnrollments = Enrollment::count();
        $activeUsers = User::where('last_active_date', '>=', now()->subDays(30))->count();
        $newUsersThisMonth = User::where('created_at', '>=', now()->startOfMonth())->count();

        $monthsWindowStart = now()->subMonths(5)->startOfMonth();

        $enrollmentTrends = collect(range(5, 0))->map(function (int $monthOffset): array {
            $month = now()->subMonths($monthOffset)->startOfMonth();
            $end = (clone $month)->endOfMonth();

            return [
                'month' => $month->format('M'),
                'enrollments' => Enrollment::whereBetween('created_at', [$month, $end])->count(),
            ];
        })->values();

        $userGrowth = collect(range(5, 0))->map(function (int $monthOffset): array {
            $month = now()->subMonths($monthOffset)->startOfMonth();
            $end = (clone $month)->endOfMonth();

            return [
                'month' => $month->format('M'),
                'users' => User::whereBetween('created_at', [$month, $end])->count(),
            ];
        })->values();

        $coursePerformance = Course::query()
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

        $challengePerformance = Challenge::query()
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

        $enrollmentQuery = Enrollment::query()->whereBelongsTo($user);

        $enrollments = Enrollment::query()
            ->whereBelongsTo($user)
            ->with('course:id,slug,title')
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
            ->get(['id', 'slug', 'title', 'estimated_minutes']);

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

        $overallSuccessRate = $enrolledCourses > 0
            ? round(($completedCourses / $enrolledCourses) * 100, 1)
            : 0.0;

        $startOfCurrentMonth = now()->startOfMonth();

        $previousEnrolledCourses = Enrollment::query()
            ->whereBelongsTo($user)
            ->where('created_at', '<', $startOfCurrentMonth)
            ->count();
        $previousCompletedCourses = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereNotNull('completed_at')
            ->where('completed_at', '<', $startOfCurrentMonth)
            ->count();

        $previousSuccessRate = $previousEnrolledCourses > 0
            ? round(($previousCompletedCourses / $previousEnrolledCourses) * 100, 1)
            : 0.0;

        $topLearners = User::query()
            ->select(['id', 'name', 'username', 'points'])
            ->orderByDesc('points')
            ->orderBy('name')
            ->take(4)
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

        // ── Activity Breakdown (percentage-based for radial chart) ──
        $totalPublishedCourses = Course::where('is_published', true)->count();
        $totalPublishedChallenges = Challenge::where('is_published', true)->count();

        $activityBreakdown = [
            [
                'label' => 'Courses',
                'completed' => $completedCourses,
                'total' => $totalPublishedCourses,
                'percentage' => $totalPublishedCourses > 0
                    ? round(($completedCourses / $totalPublishedCourses) * 100, 1)
                    : 0.0,
            ],
            [
                'label' => 'Challenges',
                'completed' => $solvedChallenges,
                'total' => $totalPublishedChallenges,
                'percentage' => $totalPublishedChallenges > 0
                    ? round(($solvedChallenges / $totalPublishedChallenges) * 100, 1)
                    : 0.0,
            ],
        ];

        $monthsWindowStart = now()->subMonths(5)->startOfMonth();

        $lessonCompletionsByMonth = $user->lessonProgress()
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $monthsWindowStart)
            ->get(['completed_at'])
            ->groupBy(function ($progress): string {
                return $progress->completed_at->format('Y-m');
            })
            ->map(fn ($progressRows): int => $progressRows->count());

        $challengeCompletionsByMonth = $user->challengeSubmissions()
            ->where('is_correct', true)
            ->whereNotNull('submitted_at')
            ->where('submitted_at', '>=', $monthsWindowStart)
            ->get(['challenge_id', 'submitted_at'])
            ->groupBy(function ($submission): string {
                return $submission->submitted_at->format('Y-m');
            })
            ->map(function ($submissions): int {
                return $submissions->pluck('challenge_id')->unique()->count();
            });

        $monthlyProgress = collect(range(5, 0))->map(function (int $monthOffset) use (
            $lessonCompletionsByMonth,
            $challengeCompletionsByMonth
        ): array {
            $month = now()->subMonths($monthOffset)->startOfMonth();
            $period = $month->format('Y-m');
            $lessonsCompleted = (int) ($lessonCompletionsByMonth[$period] ?? 0);
            $challengesSolved = (int) ($challengeCompletionsByMonth[$period] ?? 0);
            $totalActivity = $lessonsCompleted + $challengesSolved;

            return [
                'month' => $month->format('M'),
                'lessonsCompleted' => $lessonsCompleted,
                'challengesSolved' => $challengesSolved,
                'totalActivity' => $totalActivity,
            ];
        })->values();

        $currentMonthActivity = (int) ($monthlyProgress->last()['totalActivity'] ?? 0);
        $previousMonthActivity = $monthlyProgress->count() > 1
            ? (int) ($monthlyProgress->get($monthlyProgress->count() - 2)['totalActivity'] ?? 0)
            : 0;

        $monthlyActivityScore = min(100, round(($currentMonthActivity / 20) * 100, 2));
        $monthlyDelta = $previousMonthActivity > 0
            ? round((($currentMonthActivity - $previousMonthActivity) / $previousMonthActivity) * 100, 1)
            : ($currentMonthActivity > 0 ? 100.0 : 0.0);

        // ── Earnings History (weekly / monthly) ──

        // --- Weekly: last 7 days, grouped by date ---
        $weeklyStart = now()->subDays(6)->startOfDay();

        $lessonPointsByDay = $user->lessonProgress()
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $weeklyStart)
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->selectRaw("DATE_FORMAT(lesson_progress.completed_at, '%Y-%m-%d') as period, SUM(lessons.xp_reward) as total")
            ->groupByRaw("DATE_FORMAT(lesson_progress.completed_at, '%Y-%m-%d')")
            ->pluck('total', 'period');

        $challengePointsByDay = $user->challengeSubmissions()
            ->where('is_correct', true)
            ->whereNotNull('submitted_at')
            ->where('submitted_at', '>=', $weeklyStart)
            ->selectRaw("DATE_FORMAT(submitted_at, '%Y-%m-%d') as period, SUM(score) as total")
            ->groupByRaw("DATE_FORMAT(submitted_at, '%Y-%m-%d')")
            ->pluck('total', 'period');

        $weeklySeries = collect(range(6, 0))->map(function (int $dayOffset) use ($lessonPointsByDay, $challengePointsByDay): array {
            $day = now()->subDays($dayOffset);
            $period = $day->format('Y-m-d');
            $lessonPts = (int) ($lessonPointsByDay[$period] ?? 0);
            $challengePts = (int) ($challengePointsByDay[$period] ?? 0);

            return [
                'label' => $day->format('D'),
                'points' => $lessonPts + $challengePts,
                'xp' => $lessonPts,
            ];
        })->values();

        // --- Monthly: last 12 months ---
        $monthlyStart = now()->subMonths(11)->startOfMonth();

        $lessonPointsByMonth = $user->lessonProgress()
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $monthlyStart)
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->selectRaw("DATE_FORMAT(lesson_progress.completed_at, '%Y-%m') as period, SUM(lessons.xp_reward) as total")
            ->groupByRaw("DATE_FORMAT(lesson_progress.completed_at, '%Y-%m')")
            ->pluck('total', 'period');

        $challengePointsByMonth = $user->challengeSubmissions()
            ->where('is_correct', true)
            ->whereNotNull('submitted_at')
            ->where('submitted_at', '>=', $monthlyStart)
            ->selectRaw("DATE_FORMAT(submitted_at, '%Y-%m') as period, SUM(score) as total")
            ->groupByRaw("DATE_FORMAT(submitted_at, '%Y-%m')")
            ->pluck('total', 'period');

        $monthlySeries = collect(range(11, 0))->map(function (int $monthOffset) use ($lessonPointsByMonth, $challengePointsByMonth): array {
            $month = now()->subMonths($monthOffset)->startOfMonth();
            $period = $month->format('Y-m');
            $lessonPts = (int) ($lessonPointsByMonth[$period] ?? 0);
            $challengePts = (int) ($challengePointsByMonth[$period] ?? 0);

            return [
                'label' => $month->format('M'),
                'points' => $lessonPts + $challengePts,
                'xp' => $lessonPts,
            ];
        })->values();

        // Delta based on monthly series (current vs previous month)
        $currentMonthPoints = (int) ($monthlySeries->last()['points'] ?? 0);
        $previousMonthPoints = $monthlySeries->count() > 1
            ? (int) ($monthlySeries->get($monthlySeries->count() - 2)['points'] ?? 0)
            : 0;

        $earningsDelta = $previousMonthPoints > 0
            ? round((($currentMonthPoints - $previousMonthPoints) / $previousMonthPoints) * 100, 1)
            : ($currentMonthPoints > 0 ? 100.0 : 0.0);

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

        $popularCourseEnrollmentMap = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereIn('course_id', $popularCourses->pluck('id'))
            ->get(['course_id', 'progress_percentage', 'completed_at'])
            ->keyBy('course_id');

        $popularCoursesPayload = $popularCourses->map(function (Course $course) use ($popularCourseEnrollmentMap): array {
            $courseEnrollmentCount = (int) $course->enrollments_count;
            $completedEnrollmentCount = (int) $course->completed_enrollments_count;
            $completionRate = $courseEnrollmentCount > 0
                ? round(($completedEnrollmentCount / $courseEnrollmentCount) * 100, 1)
                : 0.0;

            $currentUserEnrollment = $popularCourseEnrollmentMap->get($course->id);

            $callToAction = 'Explore';

            if ($currentUserEnrollment !== null) {
                $callToAction = $currentUserEnrollment->completed_at !== null
                    ? 'Review'
                    : 'Continue';
            }

            return [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'lessonCount' => (int) $course->lessons_count,
                'enrollmentCount' => $courseEnrollmentCount,
                'completionRate' => $completionRate,
                'currentUserProgress' => $currentUserEnrollment?->progress_percentage,
                'callToAction' => $callToAction,
            ];
        })->values();

        $lessonActivities = $user->lessonProgress()
            ->whereNotNull('completed_at')
            ->with('lesson:id,title')
            ->latest('completed_at')
            ->take(5)
            ->get()
            ->map(function ($progress): array {
                return [
                    'id' => 'lesson-'.$progress->id,
                    'title' => 'Completed lesson "'.$progress->lesson?->title.'"',
                    'tag' => 'Lesson',
                    'timestamp' => $progress->completed_at?->diffForHumans(),
                    'isoDate' => $progress->completed_at?->toIso8601String(),
                ];
            });

        $challengeActivities = $user->challengeSubmissions()
            ->where('is_correct', true)
            ->whereNotNull('submitted_at')
            ->with('challenge:id,title')
            ->latest('submitted_at')
            ->take(5)
            ->get()
            ->map(function ($submission): array {
                return [
                    'id' => 'challenge-'.$submission->id,
                    'title' => 'Solved challenge "'.$submission->challenge?->title.'"',
                    'tag' => 'Challenge',
                    'timestamp' => $submission->submitted_at?->diffForHumans(),
                    'isoDate' => $submission->submitted_at?->toIso8601String(),
                ];
            });

        $enrollmentActivities = Enrollment::query()
            ->whereBelongsTo($user)
            ->with('course:id,title')
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(function (Enrollment $enrollment): array {
                return [
                    'id' => 'enrollment-'.$enrollment->id,
                    'title' => 'Enrolled in "'.$enrollment->course?->title.'"',
                    'tag' => 'Course',
                    'timestamp' => $enrollment->created_at?->diffForHumans(),
                    'isoDate' => $enrollment->created_at?->toIso8601String(),
                ];
            });

        $recentActivity = collect($lessonActivities->all())
            ->merge($challengeActivities->all())
            ->merge($enrollmentActivities->all())
            ->filter(fn (array $activity): bool => ! empty($activity['isoDate']))
            ->sortByDesc('isoDate')
            ->take(6)
            ->values();

        $firstName = Str::of($user->name)->trim()->before(' ')->toString();
        $displayName = $firstName !== '' ? $firstName : 'Learner';

        // Level info
        $levelInfo = $this->levelService->getUserLevel($user);

        // Recent badges (last 5 earned)
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

        // Daily challenge
        $dailyChallenge = $this->dailyChallengeService->getTodaysChallenge();
        $dailyChallengePayload = null;

        if ($dailyChallenge !== null) {
            $dailyChallengePayload = [
                'id' => $dailyChallenge->id,
                'slug' => $dailyChallenge->slug,
                'title' => $dailyChallenge->title,
                'prompt' => Str::limit($dailyChallenge->prompt, 120),
                'isSolved' => $this->dailyChallengeService->hasUserSolvedToday($user->id, $dailyChallenge),
            ];
        }

        // Learning path nodes (lightweight — loaded eagerly)
        $pathCourses = Course::query()
            ->published()
            ->with('prerequisite:id,title,slug')
            ->withCount('lessons')
            ->orderBy('path_position')
            ->orderBy('sort_order')
            ->get([
                'id',
                'slug',
                'title',
                'summary',
                'category',
                'difficulty',
                'path_position',
                'prerequisite_course_id',
                'estimated_minutes',
                'cover_path',
            ]);

        $pathEnrollments = Enrollment::query()
            ->whereBelongsTo($user)
            ->get(['course_id', 'progress_percentage', 'completed_at'])
            ->keyBy('course_id');

        $learningPathNodes = $pathCourses->map(function (Course $course) use ($pathEnrollments): array {
            $enrollment = $pathEnrollments->get($course->id);
            $prerequisiteCompleted = true;

            if ($course->prerequisite_course_id !== null) {
                $prereqEnrollment = $pathEnrollments->get($course->prerequisite_course_id);
                $prerequisiteCompleted = $prereqEnrollment !== null && $prereqEnrollment->completed_at !== null;
            }

            return [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'summary' => $course->summary,
                'category' => $course->category,
                'difficulty' => $course->difficulty,
                'pathPosition' => $course->path_position,
                'prerequisiteId' => $course->prerequisite_course_id,
                'prerequisiteTitle' => $course->prerequisite?->title,
                'lessonCount' => $course->lessons_count,
                'estimatedMinutes' => $course->estimated_minutes,
                'cover' => $course->cover,
                'isEnrolled' => $enrollment !== null,
                'progressPercentage' => $enrollment?->progress_percentage ?? 0,
                'isCompleted' => $enrollment?->completed_at !== null,
                'isLocked' => ! $prerequisiteCompleted,
            ];
        })->values();

        $learningPathCategories = $pathCourses->pluck('category')->filter()->unique()->values();

        return Inertia::render('dashboard', [
            'stats' => [
                'enrolledCourses' => $enrolledCourses,
                'completedCourses' => $completedCourses,
                'completedLessons' => $completedLessons,
                'solvedChallenges' => $solvedChallenges,
                'points' => $user->points,
            ],
            'level' => $levelInfo,
            'recentBadges' => $recentBadges,
            'dailyChallenge' => $dailyChallengePayload,
            'recentCourses' => $enrollments->map(function (Enrollment $enrollment): array {
                return [
                    'id' => $enrollment->course?->id,
                    'slug' => $enrollment->course?->slug,
                    'title' => $enrollment->course?->title,
                    'progressPercentage' => $enrollment->progress_percentage,
                ];
            })->values(),
            'recommendedCourses' => $recommendedCourses->map(function (Course $course): array {
                return [
                    'id' => $course->id,
                    'slug' => $course->slug,
                    'title' => $course->title,
                    'estimatedMinutes' => $course->estimated_minutes,
                    'lessonCount' => $course->lessons_count,
                ];
            })->values(),
            'academy' => [
                'hero' => [
                    'greeting' => 'Hi, '.$displayName.' 👋',
                    'headline' => 'What do you want to learn today?',
                    'description' => 'Discover courses, track progress, and maintain your learning streak with focused milestones.',
                    'completionRate' => $overallSuccessRate,
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
                    'overallSuccessRate' => $overallSuccessRate,
                    'previousSuccessRate' => $previousSuccessRate,
                    'targetRate' => 100,
                    'totalEnrollments' => $enrolledCourses,
                    'completedEnrollments' => $completedCourses,
                    'inProgressEnrollments' => $inProgressCourses,
                ],
                'leaderboardPreview' => $topLearners->values()->map(function (User $learner, int $index): array {
                    return [
                        'rank' => $index + 1,
                        'name' => $learner->name,
                        'username' => $learner->username,
                        'avatar' => $learner->avatar,
                        'points' => $learner->points,
                    ];
                }),
                'activityBreakdown' => $activityBreakdown,
                'monthlyProgress' => [
                    'rangeLabel' => now()->subMonths(5)->startOfMonth()->format('d M Y')
                        .' - '
                        .now()->format('d M Y'),
                    'summaryPercentage' => $monthlyActivityScore,
                    'deltaFromPrevious' => $monthlyDelta,
                    'series' => $monthlyProgress,
                ],
                'earningsHistory' => [
                    'deltaFromPrevious' => $earningsDelta,
                    'weekly' => $weeklySeries,
                    'monthly' => $monthlySeries,
                ],
                'popularCourses' => $popularCoursesPayload,
                'recentActivity' => $recentActivity,
            ],
            'learningPath' => [
                'nodes' => $learningPathNodes,
                'categories' => $learningPathCategories,
            ],
            'analytics' => [
                'stats' => [
                    'totalPoints' => $user->points,
                    'currentStreak' => $user->current_streak,
                    'longestStreak' => $user->longest_streak,
                    'completedCourses' => $completedCourses,
                    'completedLessons' => $completedLessons,
                    'solvedChallenges' => $solvedChallenges,
                    'badgeCount' => $user->badges()->count(),
                ],
                // Heavy data — deferred so the Overview tab loads instantly
                'activityHeatmap' => Inertia::defer(fn () => $this->buildActivityHeatmap($user->id)),
                'skillRadar' => Inertia::defer(fn () => $this->buildSkillRadar($user->id)),
                'streakCalendar' => Inertia::defer(fn () => $this->buildStreakCalendar($user->id)),
                'progressTrend' => Inertia::defer(fn () => $this->buildProgressTrend($user->id)),
            ],
        ]);
    }

    /**
     * Build activity heatmap data (last 365 days).
     *
     * @return array<int, array{date: string, count: int}>
     */
    private function buildActivityHeatmap(int $userId): array
    {
        $startDate = now()->subYear()->startOfDay();

        $lessonActivity = LessonProgress::query()
            ->where('user_id', $userId)
            ->where('completed_at', '>=', $startDate)
            ->selectRaw('DATE(completed_at) as activity_date, COUNT(*) as cnt')
            ->groupByRaw('DATE(completed_at)')
            ->pluck('cnt', 'activity_date');

        $challengeActivity = ChallengeSubmission::query()
            ->where('user_id', $userId)
            ->where('submitted_at', '>=', $startDate)
            ->selectRaw('DATE(submitted_at) as activity_date, COUNT(*) as cnt')
            ->groupByRaw('DATE(submitted_at)')
            ->pluck('cnt', 'activity_date');

        $heatmap = [];
        $period = CarbonPeriod::create($startDate, now());

        foreach ($period as $date) {
            $dateStr = $date->toDateString();
            $count = ($lessonActivity[$dateStr] ?? 0) + ($challengeActivity[$dateStr] ?? 0);
            $heatmap[] = [
                'date' => $dateStr,
                'count' => $count,
            ];
        }

        return $heatmap;
    }

    /**
     * Build skill radar data based on course categories.
     *
     * @return array<int, array{category: string, score: int}>
     */
    private function buildSkillRadar(int $userId): array
    {
        $enrollments = Enrollment::query()
            ->where('user_id', $userId)
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->whereNotNull('courses.category')
            ->selectRaw('courses.category, AVG(enrollments.progress_percentage) as avg_progress')
            ->groupBy('courses.category')
            ->get();

        return $enrollments->map(fn ($row) => [
            'category' => $row->category ?? 'General',
            'score' => (int) round($row->avg_progress),
        ])->values()->all();
    }

    /**
     * Build streak calendar data (5 full weeks, today in the middle week).
     *
     * @return array<int, array{date: string, active: bool, isToday: bool, isOutOfRange: bool, isFuture: bool}>
     */
    private function buildStreakCalendar(int $userId): array
    {
        $user = User::find($userId);
        $today = now()->startOfDay();

        // Find the Sunday that starts the current week (Indonesian week starts Sunday)
        $currentWeekSunday = $today->copy()->startOfWeek(Carbon::SUNDAY);

        // 5 weeks total, today's week in the middle (week 3) → start 2 weeks before
        $calendarStart = $currentWeekSunday->copy()->subWeeks(2);
        $calendarEnd = $calendarStart->copy()->addWeeks(5)->subDay(); // 35 days total

        // Query activity from calendar start (past dates only)
        $lessonDates = LessonProgress::query()
            ->where('user_id', $userId)
            ->where('completed_at', '>=', $calendarStart)
            ->where('completed_at', '<=', $today)
            ->selectRaw('DATE(completed_at) as d')
            ->groupByRaw('DATE(completed_at)')
            ->pluck('d');

        $challengeDates = ChallengeSubmission::query()
            ->where('user_id', $userId)
            ->where('submitted_at', '>=', $calendarStart)
            ->where('submitted_at', '<=', $today)
            ->selectRaw('DATE(submitted_at) as d')
            ->groupByRaw('DATE(submitted_at)')
            ->pluck('d');

        // Include streak login dates so the calendar matches the streak counter
        $streakDates = collect();
        if ($user && $user->last_active_date && $user->current_streak > 0) {
            $lastActive = Carbon::parse($user->last_active_date);
            for ($i = 0; $i < $user->current_streak; $i++) {
                $streakDates->push($lastActive->copy()->subDays($i)->toDateString());
            }
        }

        $activeDates = $lessonDates->merge($challengeDates)->merge($streakDates)->unique();

        $calendar = [];
        $todayStr = $today->toDateString();
        $period = CarbonPeriod::create($calendarStart, $calendarEnd);

        foreach ($period as $date) {
            $dateStr = $date->toDateString();
            $isFuture = $date->gt($today);
            $calendar[] = [
                'date' => $dateStr,
                'active' => ! $isFuture && $activeDates->contains($dateStr),
                'isToday' => $dateStr === $todayStr,
                'isOutOfRange' => false,
                'isFuture' => $isFuture,
            ];
        }

        return $calendar;
    }

    /**
     * Build progress trend (weekly points earned over last 12 weeks).
     *
     * @return array<int, array{week: string, points: int}>
     */
    private function buildProgressTrend(int $userId): array
    {
        $weeks = [];

        for ($i = 11; $i >= 0; $i--) {
            $weekStart = now()->subWeeks($i)->startOfWeek();
            $weekEnd = now()->subWeeks($i)->endOfWeek();

            $lessonPoints = LessonProgress::query()
                ->where('user_id', $userId)
                ->whereBetween('completed_at', [$weekStart, $weekEnd])
                ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
                ->sum('lessons.xp_reward');

            $challengePoints = ChallengeSubmission::query()
                ->where('user_id', $userId)
                ->where('is_correct', true)
                ->whereBetween('submitted_at', [$weekStart, $weekEnd])
                ->sum('score');

            $weeks[] = [
                'week' => $weekStart->format('M d'),
                'points' => (int) ($lessonPoints + $challengePoints),
            ];
        }

        return $weeks;
    }
}
