<?php

namespace App\Http\Controllers;

use App\Models\ChallengeSubmission;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Services\Dashboard\AnalyticsBuilder;
use App\Services\LevelService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function __construct(
        private readonly AnalyticsBuilder $analyticsBuilder,
        private readonly LevelService $levelService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $userId = $user->id;

        $cacheKey = "analytics_page_{$userId}";
        $data = Cache::remember($cacheKey, 300, function () use ($user, $userId) {
            // Skill radar
            $skillRadar = $this->analyticsBuilder->skillRadar($userId);

            // Activity heatmap (last 365 days)
            $heatmap = $this->analyticsBuilder->heatmap($userId);

            // Weekly trends (last 8 weeks)
            $weeklyTrends = $this->buildWeeklyTrends($userId);

            // Study time estimates
            $studyStats = $this->buildStudyStats($userId);

            // Recommendations
            $recommendations = $this->buildRecommendations($user);

            // Level info
            $levelInfo = $this->levelService->getUserLevel($user);

            return [
                'skillRadar' => $skillRadar,
                'heatmap' => $heatmap,
                'weeklyTrends' => $weeklyTrends,
                'studyStats' => $studyStats,
                'recommendations' => $recommendations,
                'level' => $levelInfo,
                'stats' => [
                    'totalXp' => $user->xp,
                    'totalPoints' => $user->points,
                    'currentStreak' => $user->current_streak,
                    'longestStreak' => $user->longest_streak,
                ],
            ];
        });

        return Inertia::render('analytics', $data);
    }

    /**
     * Build weekly activity trends for the last 8 weeks.
     */
    private function buildWeeklyTrends(int $userId): array
    {
        $weeks = [];
        for ($i = 7; $i >= 0; $i--) {
            $weekStart = now()->subWeeks($i)->startOfWeek();
            $weekEnd = (clone $weekStart)->endOfWeek();

            $lessons = LessonProgress::query()
                ->where('user_id', $userId)
                ->whereBetween('completed_at', [$weekStart, $weekEnd])
                ->count();

            $challenges = ChallengeSubmission::query()
                ->where('user_id', $userId)
                ->whereBetween('submitted_at', [$weekStart, $weekEnd])
                ->count();

            $weeks[] = [
                'week' => $weekStart->format('M d'),
                'lessons' => $lessons,
                'challenges' => $challenges,
                'total' => $lessons + $challenges,
            ];
        }

        return $weeks;
    }

    /**
     * Build study statistics.
     */
    private function buildStudyStats(int $userId): array
    {
        $totalLessons = LessonProgress::where('user_id', $userId)->count();
        $totalChallenges = ChallengeSubmission::where('user_id', $userId)->count();
        $enrollments = Enrollment::where('user_id', $userId)->count();
        $completedCourses = Enrollment::where('user_id', $userId)->whereNotNull('completed_at')->count();

        // Estimate study time: ~5 min per lesson, ~10 min per challenge
        $estimatedMinutes = ($totalLessons * 5) + ($totalChallenges * 10);

        return [
            'totalLessons' => $totalLessons,
            'totalChallenges' => $totalChallenges,
            'totalEnrollments' => $enrollments,
            'completedCourses' => $completedCourses,
            'estimatedStudyMinutes' => $estimatedMinutes,
            'completionRate' => $enrollments > 0
                ? round(($completedCourses / $enrollments) * 100, 1)
                : 0,
        ];
    }

    /**
     * Build personalized recommendations.
     */
    private function buildRecommendations(mixed $user): array
    {
        $recommendations = [];

        if ($user->current_streak === 0) {
            $recommendations[] = [
                'type' => 'streak',
                'title' => 'Start a Streak',
                'description' => 'Complete a lesson or challenge today to start building your streak!',
                'priority' => 'high',
            ];
        }

        $inProgress = Enrollment::where('user_id', $user->id)
            ->whereNull('completed_at')
            ->where('progress_percentage', '>', 0)
            ->with('course:id,title,slug')
            ->orderByDesc('progress_percentage')
            ->first();

        if ($inProgress && $inProgress->course) {
            $recommendations[] = [
                'type' => 'continue',
                'title' => "Continue \"{$inProgress->course->title}\"",
                'description' => "You're {$inProgress->progress_percentage}% through — keep going!",
                'priority' => 'medium',
                'slug' => $inProgress->course->slug,
            ];
        }

        $notStarted = Enrollment::where('user_id', $user->id)
            ->whereNull('completed_at')
            ->where('progress_percentage', 0)
            ->count();

        if ($notStarted > 0) {
            $recommendations[] = [
                'type' => 'enrolled',
                'title' => "{$notStarted} Enrolled Course(s) Not Started",
                'description' => 'You have courses waiting — start one today!',
                'priority' => 'low',
            ];
        }

        return $recommendations;
    }
}
