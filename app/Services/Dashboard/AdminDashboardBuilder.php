<?php

namespace App\Services\Dashboard;

use App\Models\Challenge;
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
    public function __construct(
        private readonly AdminAnalyticsService $adminAnalyticsService,
    ) {}

    /**
     * Build the full admin dashboard props array.
     *
     * @return array{admin: array}
     */
    public function build(): array
    {
        $stats = $this->buildStats();
        $enrollmentTrends = $this->buildEnrollmentTrends();
        $userGrowth = $this->buildUserGrowth();
        $coursePerformance = $this->buildCoursePerformance();
        $challengePerformance = $this->buildChallengePerformance();
        $recentUsers = $this->buildRecentUsers();

        return [
            'admin' => [
                'stats' => $stats,
                'enrollmentTrends' => $enrollmentTrends,
                'userGrowth' => $userGrowth,
                'coursePerformance' => $coursePerformance,
                'challengePerformance' => $challengePerformance,
                'recentUsers' => $recentUsers,
                'cohortRetention' => Inertia::defer(fn () => $this->adminAnalyticsService->getCohortRetention()),
                'gamificationFunnel' => Inertia::defer(fn () => $this->adminAnalyticsService->getGamificationFunnel()),
                'economyHealth' => Inertia::defer(fn () => $this->adminAnalyticsService->getEconomyHealth()),
            ],
        ];
    }

    private function buildStats(): array
    {
        return Cache::remember('admin_dashboard_stats', 300, fn (): array => [
            'totalUsers' => User::count(),
            'totalCourses' => Course::count(),
            'totalChallenges' => Challenge::count(),
            'totalEnrollments' => Enrollment::count(),
            'activeUsers' => User::where('last_active_date', '>=', now()->subDays(30))->count(),
            'newUsersThisMonth' => User::where('created_at', '>=', now()->startOfMonth())->count(),
        ]);
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

    private function buildChallengePerformance(): array
    {
        return Cache::remember('admin_challenge_performance', 300, function (): array {
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
                })->values()->all();
        });
    }

    private function buildRecentUsers(): array
    {
        return User::query()
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
            ])->values()->all();
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
