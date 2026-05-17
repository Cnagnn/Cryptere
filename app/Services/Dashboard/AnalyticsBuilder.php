<?php

namespace App\Services\Dashboard;

use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
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

        $heatmap = [];
        $period = CarbonPeriod::create($startDate, now());

        foreach ($period as $date) {
            $dateStr = $date->toDateString();
            $count = $lessonActivity[$dateStr] ?? 0;
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

        $streakDates = collect();
        if ($user && $user->last_active_date && $user->current_streak > 0) {
            $lastActive = Carbon::parse($user->last_active_date);
            for ($i = 0; $i < $user->current_streak; $i++) {
                $streakDates->push($lastActive->copy()->subDays($i)->toDateString());
            }
        }

        $activeDates = $lessonDates->merge($streakDates)->unique();

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
        $lessonXpPerLesson = (int) config('rewards.lesson_completion_xp', 30);
        $weekStart = CarbonImmutable::now()->subWeeks(11)->startOfWeek();

        $lessonPointsByWeek = LessonProgress::query()
            ->where('user_id', $userId)
            ->where('completed_at', '>=', $weekStart)
            ->selectRaw('DATE(completed_at) as activity_date, COUNT(*) * ? as points', [$lessonXpPerLesson])
            ->groupByRaw('DATE(completed_at)')
            ->get()
            ->groupBy(fn ($row): string => Carbon::parse($row->activity_date)->startOfWeek()->format('Y-m-d'))
            ->map(fn ($rows): int => (int) $rows->sum('points'));

        return collect(range(11, 0))->map(function (int $weekOffset) use ($lessonPointsByWeek): array {
            $weekStart = now()->subWeeks($weekOffset)->startOfWeek();
            $weekKey = $weekStart->format('Y-m-d');

            return [
                'week' => $weekStart->format('M d'),
                'points' => (int) ($lessonPointsByWeek[$weekKey] ?? 0),
            ];
        })->values()->all();
    }
}
