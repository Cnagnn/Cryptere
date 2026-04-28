<?php

namespace App\Services\Dashboard;

use App\Models\User;
use Illuminate\Support\Collection;

class EarningsHistoryAggregator
{
    /**
     * Build weekly (7 days) + monthly (12 months) earnings series with delta.
     *
     * @return array{deltaFromPrevious: float, weekly: Collection, monthly: Collection}
     */
    public function build(User $user): array
    {
        $lessonXpPerLesson = (int) config('rewards.lesson_completion_xp', 30);

        // ── Weekly: last 7 days ──
        $weeklyStart = now()->subDays(6)->startOfDay();

        $lessonPointsByDay = $user->lessonProgress()
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $weeklyStart)
            ->get(['completed_at'])
            ->groupBy(fn ($p): string => $p->completed_at->format('Y-m-d'))
            ->map(fn ($rows): int => $rows->count() * $lessonXpPerLesson);

        $challengePointsByDay = $user->challengeSubmissions()
            ->where('is_correct', true)
            ->whereNotNull('submitted_at')
            ->where('submitted_at', '>=', $weeklyStart)
            ->get(['submitted_at', 'score'])
            ->groupBy(fn ($s): string => $s->submitted_at->format('Y-m-d'))
            ->map(fn ($rows): int => (int) $rows->sum('score'));

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

        // ── Monthly: last 12 months ──
        $monthlyStart = now()->subMonths(11)->startOfMonth();

        $lessonPointsByMonth = $user->lessonProgress()
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $monthlyStart)
            ->get(['completed_at'])
            ->groupBy(fn ($p): string => $p->completed_at->format('Y-m'))
            ->map(fn ($rows): int => $rows->count() * $lessonXpPerLesson);

        $challengePointsByMonth = $user->challengeSubmissions()
            ->where('is_correct', true)
            ->whereNotNull('submitted_at')
            ->where('submitted_at', '>=', $monthlyStart)
            ->get(['submitted_at', 'score'])
            ->groupBy(fn ($s): string => $s->submitted_at->format('Y-m'))
            ->map(fn ($rows): int => (int) $rows->sum('score'));

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

        // Delta based on monthly series
        $currentMonthPoints = (int) ($monthlySeries->last()['points'] ?? 0);
        $previousMonthPoints = $monthlySeries->count() > 1
            ? (int) ($monthlySeries->get($monthlySeries->count() - 2)['points'] ?? 0)
            : 0;

        $earningsDelta = $previousMonthPoints > 0
            ? round((($currentMonthPoints - $previousMonthPoints) / $previousMonthPoints) * 100, 1)
            : ($currentMonthPoints > 0 ? 100.0 : 0.0);

        return [
            'deltaFromPrevious' => $earningsDelta,
            'weekly' => $weeklySeries,
            'monthly' => $monthlySeries,
        ];
    }
}
