<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Manages daily login streaks and streak-related bonuses.
 *
 * Extracted from XpService to reduce complexity and isolate streak logic.
 */
class StreakService
{
    public function __construct(
        private readonly XpService $xpService,
        private readonly BadgeService $badgeService,
    ) {}

    /**
     * Update the user's daily login streak and award streak XP.
     *
     * Call once per request (via middleware). Increments streak if last active was yesterday,
     * resets if gap > 1 day, no-ops if already active today.
     *
     * Awards daily XP based on streak tier (XP only, no points).
     * Also detects and awards: first login, comeback, and weekly active bonuses.
     *
     * @return array{xp: int, bonuses: string[]}
     */
    public function updateDailyStreak(User $user): array
    {
        $today = CarbonImmutable::today();
        $lastActive = $user->last_active_date;

        if ($lastActive !== null && $today->isSameDay($lastActive)) {
            return ['xp' => 0, 'bonuses' => []];
        }

        return DB::transaction(function () use ($user, $today, $lastActive): array {
            $isConsecutive = $lastActive !== null && $today->subDay()->isSameDay($lastActive);

            $newStreak = $isConsecutive ? ($user->current_streak + 1) : 1;
            $longestStreak = max($user->longest_streak, $newStreak);

            // Reset daily goal tracking for the new day
            $user->forceFill([
                'current_streak' => $newStreak,
                'longest_streak' => $longestStreak,
                'last_active_date' => $today,
                'daily_xp_earned' => 0,
                'daily_goal_met_at' => null,
            ])->save();

            $totalXp = 0;
            $bonuses = [];

            // Streak daily XP
            $dailyXp = $this->xpService->getStreakDailyXp($newStreak);
            $user->increment('xp', $dailyXp);
            $this->xpService->trackDailyGoal($user, $dailyXp);
            $totalXp += $dailyXp;

            // First Login Bonus
            if ($lastActive === null) {
                $totalXp += $this->awardBonus($user, 'first_login_xp', 50);
                $bonuses[] = 'first_login';
            }

            // Comeback Bonus
            if ($lastActive !== null && ! $isConsecutive) {
                $gapDays = (int) $lastActive->diffInDays($today);
                $comebackGap = (int) config('rewards.comeback_gap_days', 7);

                if ($gapDays >= $comebackGap) {
                    $totalXp += $this->awardBonus($user, 'comeback_xp', 40);
                    $bonuses[] = 'comeback';
                }
            }

            // Weekly Active Bonus
            if ($newStreak === 7) {
                $totalXp += $this->awardBonus($user, 'weekly_active_xp', 30);
                $bonuses[] = 'weekly_active';
            }

            $this->badgeService->checkAndAward($user, 'streak_days');

            return ['xp' => $totalXp, 'bonuses' => $bonuses];
        });
    }

    /**
     * Award a config-driven XP bonus and track toward daily goal.
     */
    private function awardBonus(User $user, string $configKey, int $default): int
    {
        $xp = (int) config("rewards.{$configKey}", $default);
        $user->increment('xp', $xp);
        $this->xpService->trackDailyGoal($user, $xp);

        return $xp;
    }
}
