<?php

namespace App\Services\Dashboard;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminDashboardBuilder
{
    private const PERIODS = [
        '7d' => ['label' => '7 hari', 'days' => 7],
        '30d' => ['label' => '30 hari', 'days' => 30],
        '90d' => ['label' => '90 hari', 'days' => 90],
        '6m' => ['label' => '6 bulan', 'days' => 183],
    ];

    public function __construct(
        private readonly AdminAnalyticsService $adminAnalyticsService,
    ) {}

    /**
     * Build the full admin dashboard props array.
     *
     * @return array{admin: array}
     */
    public function build(?string $period = null): array
    {
        $resolvedPeriod = $this->resolvePeriod($period);
        $stats = $this->buildStats($resolvedPeriod);
        $enrollmentTrends = $this->buildEnrollmentTrends();
        $userGrowth = $this->buildUserGrowth();
        $coursePerformance = $this->buildCoursePerformance();
        $recentUsers = $this->buildRecentUsers();
        $courseAnalytics = $this->buildCourseAnalytics($resolvedPeriod);
        $actionQueue = $this->buildActionQueue($resolvedPeriod, $courseAnalytics);
        $anomalies = $this->buildAnomalies($stats);

        return [
            'admin' => [
                'filters' => $this->buildFilters($resolvedPeriod),
                'stats' => $stats,
                'enrollmentTrends' => $enrollmentTrends,
                'userGrowth' => $userGrowth,
                'coursePerformance' => $coursePerformance,
                'recentUsers' => $recentUsers,
                'actionQueue' => $actionQueue,
                'courseAnalytics' => $courseAnalytics,
                'anomalies' => $anomalies,
                'reportSnapshot' => $this->buildReportSnapshot($resolvedPeriod, $stats, $actionQueue, $anomalies),
                'cohortRetention' => Inertia::defer(fn () => $this->adminAnalyticsService->getCohortRetention()),
                'gamificationFunnel' => Inertia::defer(fn () => $this->adminAnalyticsService->getGamificationFunnel()),
                'economyHealth' => Inertia::defer(fn () => $this->adminAnalyticsService->getEconomyHealth()),
            ],
        ];
    }

    private function buildStats(string $period): array
    {
        return Cache::remember("admin_dashboard_stats:{$period}", 300, function () use ($period): array {
            $periodDays = self::PERIODS[$period]['days'];
            $currentStart = now()->subDays($periodDays);
            $previousStart = now()->subDays($periodDays * 2);

            $activeUsers = User::where('last_active_date', '>=', $currentStart)->count();
            $previousActiveUsers = User::whereBetween('last_active_date', [$previousStart, $currentStart])->count();
            $periodEnrollments = Enrollment::where('created_at', '>=', $currentStart)->count();
            $previousPeriodEnrollments = Enrollment::whereBetween('created_at', [$previousStart, $currentStart])->count();
            $periodUsers = User::where('created_at', '>=', $currentStart)->count();
            $previousPeriodUsers = User::whereBetween('created_at', [$previousStart, $currentStart])->count();

            return [
                'totalUsers' => User::count(),
                'totalCourses' => Course::count(),
                'totalEnrollments' => Enrollment::count(),
                'activeUsers' => $activeUsers,
                'newUsersThisMonth' => User::where('created_at', '>=', now()->startOfMonth())->count(),
                'periodUsers' => $periodUsers,
                'periodEnrollments' => $periodEnrollments,
                'activeUsersDelta' => $this->percentDelta($activeUsers, $previousActiveUsers),
                'newUsersDelta' => $this->percentDelta($periodUsers, $previousPeriodUsers),
                'enrollmentsDelta' => $this->percentDelta($periodEnrollments, $previousPeriodEnrollments),
                'periodLabel' => self::PERIODS[$period]['label'],
            ];
        });
    }

    private function buildFilters(string $period): array
    {
        return [
            'period' => $period,
            'availablePeriods' => collect(self::PERIODS)
                ->map(fn (array $config, string $value): array => [
                    'value' => $value,
                    'label' => $config['label'],
                ])
                ->values()
                ->all(),
            'segment' => 'all',
            'availableSegments' => [
                ['value' => 'all', 'label' => 'Semua user'],
                ['value' => 'active', 'label' => 'User aktif'],
                ['value' => 'inactive', 'label' => 'User tidak aktif'],
                ['value' => 'at_risk', 'label' => 'Butuh intervensi'],
            ],
        ];
    }

    private function buildActionQueue(string $period, array $courseAnalytics): array
    {
        $periodDays = self::PERIODS[$period]['days'];
        $actions = [];
        $lowCompletionCourse = collect($courseAnalytics)
            ->first(fn (array $course): bool => $course['enrollments'] > 0 && $course['completionRate'] <= 50);

        if ($lowCompletionCourse) {
            $actions[] = [
                'type' => 'course_completion',
                'severity' => 'high',
                'title' => 'Tinjau course completion rendah',
                'description' => $lowCompletionCourse['title'].' hanya selesai '.$lowCompletionCourse['completionRate'].'% dari pendaftaran.',
                'metric' => $lowCompletionCourse['completionRate'],
                'actionLabel' => 'Buka course',
                'actionUrl' => $lowCompletionCourse['actionUrl'],
            ];
        }

        $inactiveUsers = User::query()
            ->where(function ($query): void {
                $query->whereNull('last_active_date')
                    ->orWhere('last_active_date', '<', now()->subDays(30));
            })
            ->count();

        if ($inactiveUsers > 0) {
            $actions[] = [
                'type' => 'inactive_users',
                'severity' => 'medium',
                'title' => 'Reaktivasi user tidak aktif',
                'description' => "{$inactiveUsers} user belum aktif dalam 30 hari terakhir.",
                'metric' => $inactiveUsers,
                'actionLabel' => 'Lihat pengguna',
                'actionUrl' => route('admin.users.index', ['status' => 'inactive']),
            ];
        }

        $lowQuizAverage = DB::table('quiz_submissions')
            ->where('submitted_at', '>=', now()->subDays($periodDays))
            ->selectRaw('AVG(CASE WHEN total > 0 THEN (score * 100.0 / total) ELSE NULL END) as average_score')
            ->value('average_score');

        if ($lowQuizAverage !== null && (float) $lowQuizAverage < 60) {
            $actions[] = [
                'type' => 'quiz_performance',
                'severity' => 'medium',
                'title' => 'Kuis perlu ditinjau',
                'description' => 'Rata-rata skor kuis periode ini di bawah 60%.',
                'metric' => round((float) $lowQuizAverage, 1),
                'actionLabel' => 'Buka bank soal',
                'actionUrl' => route('admin.question-bank.index'),
            ];
        }

        return collect($actions)
            ->sortBy(fn (array $action): int => $action['severity'] === 'high' ? 0 : 1)
            ->values()
            ->all();
    }

    private function buildCourseAnalytics(string $period): array
    {
        $periodDays = self::PERIODS[$period]['days'];
        $courses = Course::query()
            ->where('status', 'published')
            ->withCount([
                'lessons',
                'enrollments',
                'enrollments as completed_enrollments_count' => function ($query): void {
                    $query->whereNotNull('completed_at');
                },
            ])
            ->orderByDesc('enrollments_count')
            ->orderBy('title')
            ->take(8)
            ->get(['id', 'slug', 'title']);

        if ($courses->isEmpty()) {
            return [];
        }

        $courseIds = $courses->pluck('id');
        $lessonCompletions = DB::table('lesson_progress')
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->whereIn('lessons.course_id', $courseIds)
            ->whereNotNull('lesson_progress.completed_at')
            ->where('lesson_progress.completed_at', '>=', now()->subDays($periodDays))
            ->selectRaw('lessons.course_id, COUNT(*) as completed_lessons')
            ->groupBy('lessons.course_id')
            ->pluck('completed_lessons', 'course_id');
        $quizPassRates = DB::table('quiz_submissions')
            ->join('lesson_tasks', 'quiz_submissions.lesson_task_id', '=', 'lesson_tasks.id')
            ->join('lessons', 'lesson_tasks.lesson_id', '=', 'lessons.id')
            ->whereIn('lessons.course_id', $courseIds)
            ->where('quiz_submissions.submitted_at', '>=', now()->subDays($periodDays))
            ->selectRaw('lessons.course_id, AVG(CASE WHEN quiz_submissions.total > 0 AND (quiz_submissions.score * 100.0 / quiz_submissions.total) >= 70 THEN 100 ELSE 0 END) as pass_rate')
            ->groupBy('lessons.course_id')
            ->pluck('pass_rate', 'course_id');
        $inactiveLearners = Enrollment::query()
            ->whereIn('course_id', $courseIds)
            ->whereNull('completed_at')
            ->where('updated_at', '<', now()->subDays(14))
            ->selectRaw('course_id, COUNT(*) as inactive_count')
            ->groupBy('course_id')
            ->pluck('inactive_count', 'course_id');

        return $courses->map(function (Course $course) use ($inactiveLearners, $lessonCompletions, $quizPassRates): array {
            $enrollmentCount = (int) $course->enrollments_count;
            $completedCount = (int) $course->completed_enrollments_count;
            $lessonCapacity = max(1, (int) $course->lessons_count * max(1, $enrollmentCount));
            $completionRate = $enrollmentCount > 0
                ? round(($completedCount / $enrollmentCount) * 100, 1)
                : 0.0;
            $quizPassRate = $quizPassRates->get($course->id);

            return [
                'id' => $course->id,
                'title' => $course->title,
                'enrollments' => $enrollmentCount,
                'completionRate' => $completionRate,
                'lessonCompletionRate' => round(((int) ($lessonCompletions[$course->id] ?? 0) / $lessonCapacity) * 100, 1),
                'quizPassRate' => $quizPassRate !== null ? round((float) $quizPassRate, 1) : null,
                'inactiveLearners' => (int) ($inactiveLearners[$course->id] ?? 0),
                'actionLabel' => 'Kelola course',
                'actionUrl' => route('admin.courses.index', ['search' => $course->title]),
            ];
        })->values()->all();
    }

    private function buildAnomalies(array $stats): array
    {
        $anomalies = [];

        if ($stats['activeUsersDelta'] < -20) {
            $anomalies[] = [
                'type' => 'active_users_drop',
                'severity' => 'high',
                'title' => 'Aktivitas pengguna turun',
                'description' => 'Pengguna aktif turun '.$stats['activeUsersDelta'].'% dibanding periode sebelumnya.',
            ];
        }

        if ($stats['enrollmentsDelta'] > 50) {
            $anomalies[] = [
                'type' => 'enrollment_spike',
                'severity' => 'info',
                'title' => 'Pendaftaran melonjak',
                'description' => 'Pendaftaran naik '.$stats['enrollmentsDelta'].'% dibanding periode sebelumnya.',
            ];
        }

        if ($stats['periodUsers'] === 0 && $stats['totalUsers'] > 0) {
            $anomalies[] = [
                'type' => 'no_new_users',
                'severity' => 'medium',
                'title' => 'Belum ada user baru',
                'description' => 'Tidak ada pendaftaran baru dalam '.$stats['periodLabel'].' terakhir.',
            ];
        }

        return $anomalies;
    }

    private function buildReportSnapshot(string $period, array $stats, array $actionQueue, array $anomalies): array
    {
        return [
            'generatedAt' => now()->toIso8601String(),
            'period' => $period,
            'periodLabel' => self::PERIODS[$period]['label'],
            'summary' => [
                'totalUsers' => $stats['totalUsers'],
                'activeUsers' => $stats['activeUsers'],
                'periodEnrollments' => $stats['periodEnrollments'],
                'openActions' => count($actionQueue),
                'anomalies' => count($anomalies),
            ],
            'topActions' => array_slice($actionQueue, 0, 3),
        ];
    }

    private function buildEnrollmentTrends(): array
    {
        return Cache::remember('admin_enrollment_trends', 300, function (): array {
            $months = $this->lastSixMonths();
            $counts = Enrollment::query()
                ->selectRaw($this->monthSelectSql().' as month_key, COUNT(*) as aggregate')
                ->where('created_at', '>=', $months->first())
                ->groupBy('month_key')
                ->pluck('aggregate', 'month_key');

            return $months->map(function (CarbonImmutable $month) use ($counts): array {
                return [
                    'month' => $month->format('M'),
                    'enrollments' => (int) ($counts[$month->format('Y-m')] ?? 0),
                ];
            })->values()->all();
        });
    }

    private function buildUserGrowth(): array
    {
        return Cache::remember('admin_user_growth', 300, function (): array {
            $months = $this->lastSixMonths();
            $counts = User::query()
                ->selectRaw($this->monthSelectSql().' as month_key, COUNT(*) as aggregate')
                ->where('created_at', '>=', $months->first())
                ->groupBy('month_key')
                ->pluck('aggregate', 'month_key');

            return $months->map(function (CarbonImmutable $month) use ($counts): array {
                return [
                    'month' => $month->format('M'),
                    'users' => (int) ($counts[$month->format('Y-m')] ?? 0),
                ];
            })->values()->all();
        });
    }

    private function buildCoursePerformance(): array
    {
        return Cache::remember('admin_course_performance', 300, function (): array {
            return Course::query()
                ->where('status', 'published')
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
                })->values()->all();
        });
    }

    private function buildRecentUsers(): array
    {
        return User::query()
            ->with('roles:id,name')
            ->latest()
            ->take(5)
            ->get(['id', 'name', 'username', 'email', 'created_at'])
            ->map(fn (User $u): array => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'role' => $u->primaryRoleName(),
                'createdAt' => $u->created_at?->diffForHumans(),
            ])->values()->all();
    }

    private function resolvePeriod(?string $period): string
    {
        return array_key_exists((string) $period, self::PERIODS)
            ? (string) $period
            : '30d';
    }

    private function percentDelta(int $current, int $previous): float
    {
        if ($previous === 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function lastSixMonths(): Collection
    {
        return collect(range(5, 0))
            ->map(fn (int $monthOffset): CarbonImmutable => CarbonImmutable::now()->subMonths($monthOffset)->startOfMonth());
    }

    private function monthSelectSql(): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";
    }
}
