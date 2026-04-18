<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the learner dashboard.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

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

        $activityTotals = [
            [
                'label' => 'Lessons',
                'count' => $completedLessons,
            ],
            [
                'label' => 'Challenges',
                'count' => $solvedChallenges,
            ],
            [
                'label' => 'Courses',
                'count' => $completedCourses,
            ],
        ];

        $totalActivityCount = collect($activityTotals)->sum('count');

        $activityBreakdown = collect($activityTotals)->map(function (array $activity) use ($totalActivityCount): array {
            return [
                'label' => $activity['label'],
                'count' => $activity['count'],
                'percentage' => $totalActivityCount > 0
                    ? round(($activity['count'] / $totalActivityCount) * 100, 1)
                    : 0.0,
            ];
        })->values();

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

        return Inertia::render('dashboard', [
            'stats' => [
                'enrolledCourses' => $enrolledCourses,
                'completedCourses' => $completedCourses,
                'completedLessons' => $completedLessons,
                'solvedChallenges' => $solvedChallenges,
                'points' => $user->points,
            ],
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
                'popularCourses' => $popularCoursesPayload,
                'recentActivity' => $recentActivity,
            ],
        ]);
    }
}
