<?php

namespace App\Services\Dashboard;

use App\Models\ChallengeSubmission;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class AnalyticsBuilder
{
    /**
     * Build activity heatmap data (last 365 days).
     *
     * @return array<int, array{date: string, count: int}>
     */
    public function heatmap(int $userId): array
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
    public function skillRadar(int $userId): array
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
    public function streakCalendar(int $userId): array
    {
        $user = User::find($userId);
        $today = now()->startOfDay();

        $currentWeekMonday = $today->copy()->startOfWeek(Carbon::MONDAY);
        $calendarStart = $currentWeekMonday->copy()->subWeeks(2);
        $calendarEnd = $calendarStart->copy()->addWeeks(5)->subDay();

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
    public function progressTrend(int $userId): array
    {
        $weeks = [];
        $lessonXpPerLesson = (int) config('rewards.lesson_completion_xp', 30);

        for ($i = 11; $i >= 0; $i--) {
            $weekStart = now()->subWeeks($i)->startOfWeek();
            $weekEnd = now()->subWeeks($i)->endOfWeek();

            $lessonPoints = LessonProgress::query()
                ->where('user_id', $userId)
                ->whereBetween('completed_at', [$weekStart, $weekEnd])
                ->count() * $lessonXpPerLesson;

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
