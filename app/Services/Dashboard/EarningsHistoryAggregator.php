<?php

namespace App\Services\Dashboard;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EarningsHistoryAggregator
{
    /**
     * Build weekly (7 days) + monthly (12 months) earnings series with delta.
     *
     * @return array{deltaFromPrevious: float, weekly: Collection, monthly: Collection}
     */
    public function build(User $user): array
    {
        // ── Weekly: last 7 days ──
        $weeklyStart = now()->subDays(6)->startOfDay();

        $weeklyTotals = $user->balanceChanges()
            ->selectRaw('DATE(created_at) as period, SUM(xp_delta) as xp, SUM(points_delta) as points')
            ->where('created_at', '>=', $weeklyStart)
            ->groupByRaw('DATE(created_at)')
            ->get()
            ->keyBy('period');

        $weeklySeries = collect(range(6, 0))->map(function (int $dayOffset) use ($weeklyTotals): array {
            $day = now()->subDays($dayOffset);
            $period = $day->format('Y-m-d');
            $totals = $weeklyTotals->get($period);

            return [
                'label' => $day->format('D'),
                'points' => (int) ($totals->points ?? 0),
                'xp' => (int) ($totals->xp ?? 0),
            ];
        })->values();

        // ── Monthly: last 12 months ──
        $monthlyStart = now()->subMonths(11)->startOfMonth();
        $monthlyPeriodExpression = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";

        $monthlyTotals = $user->balanceChanges()
            ->selectRaw("{$monthlyPeriodExpression} as period, SUM(xp_delta) as xp, SUM(points_delta) as points")
            ->where('created_at', '>=', $monthlyStart)
            ->groupByRaw($monthlyPeriodExpression)
            ->get()
            ->keyBy('period');

        $monthlySeries = collect(range(11, 0))->map(function (int $monthOffset) use ($monthlyTotals): array {
            $month = now()->subMonths($monthOffset)->startOfMonth();
            $period = $month->format('Y-m');
            $totals = $monthlyTotals->get($period);

            return [
                'label' => $month->format('M'),
                'points' => (int) ($totals->points ?? 0),
                'xp' => (int) ($totals->xp ?? 0),
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
