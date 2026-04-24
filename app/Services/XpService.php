<?php

namespace App\Services;

use App\Models\LessonTask;
use App\Models\User;
use Carbon\CarbonImmutable;

class XpService
{
    public function __construct(
        private readonly LevelService $levelService,
    ) {}

    /**
     * Award XP and points for completing a lesson task.
     *
     * XP is boosted by streak multiplier. Points use the raw base amount
     * with level bonus only — streak does NOT inflate points.
     *
     * @return array{xp: int, points: int}
     */
    public function awardTaskXp(User $user, LessonTask $task): array
    {
        return $this->awardXpAndPoints($user, $task->xp_reward ?? 0);
    }

    /**
     * Award XP and points from a base amount.
     *
     * - XP = baseXp × streak multiplier (streak boosts XP for leveling)
     * - Points = applyLevelBonus(baseXp) (streak does NOT affect points)
     *
     * Sources: course tasks and challenges.
     *
     * @return array{xp: int, points: int}
     */
    public function awardXpAndPoints(User $user, int $baseXp): array
    {
        if ($baseXp <= 0) {
            return ['xp' => 0, 'points' => 0];
        }

        $streakMultiplier = $this->getStreakMultiplier($user->current_streak ?? 0);
        $awardedXp = (int) round($baseXp * $streakMultiplier);
        $awardedPoints = $this->applyLevelBonus($user, $baseXp);

        if ($awardedXp > 0) {
            $user->increment('xp', $awardedXp);
            $this->trackDailyGoal($user, $awardedXp);
        }

        if ($awardedPoints > 0) {
            $user->increment('points', $awardedPoints);
        }

        return ['xp' => $awardedXp, 'points' => $awardedPoints];
    }

    /**
     * Award raw XP to a user (no streak multiplier, no points).
     *
     * Used for streak daily XP and other XP-only awards.
     * Also tracks progress toward the daily XP goal.
     */
    public function awardXp(User $user, int $baseXp): int
    {
        if ($baseXp <= 0) {
            return 0;
        }

        $user->increment('xp', $baseXp);

        $this->trackDailyGoal($user, $baseXp);

        return $baseXp;
    }

    /**
     * Apply the user's current level bonus to a base point amount.
     *
     * Level bonus only inflates points (leaderboard), not XP (leveling stays fair).
     * Example: level 10 (1% bonus) + 100 base → 101 points.
     */
    public function applyLevelBonus(User $user, int $basePoints): int
    {
        $multiplier = $this->levelService->getPointBonusMultiplier($user);

        return (int) round($basePoints * $multiplier);
    }

    /**
     * Get the XP multiplier based on current streak length.
     *
     * 1-2 days → 1.0×, 3-6 → 1.25×, 7-13 → 1.5×, 14-29 → 1.75×, 30+ → 2.0×
     */
    public function getStreakMultiplier(int $streakDays): float
    {
        return match (true) {
            $streakDays >= 30 => 2.0,
            $streakDays >= 14 => 1.75,
            $streakDays >= 7 => 1.5,
            $streakDays >= 3 => 1.25,
            default => 1.0,
        };
    }

    /**
     * Get the daily XP bonus for maintaining a streak.
     *
     * Scales with streak tier — longer streaks earn more daily XP.
     * 1-2 days → 2, 3-6 → 3, 7-13 → 5, 14-29 → 8, 30+ → 12
     */
    public function getStreakDailyXp(int $streakDays): int
    {
        return match (true) {
            $streakDays >= 30 => 12,
            $streakDays >= 14 => 8,
            $streakDays >= 7 => 5,
            $streakDays >= 3 => 3,
            default => 2,
        };
    }

    /**
     * Track XP earned today toward the daily goal.
     *
     * Awards a bonus when the user first reaches the daily target.
     * Returns the bonus XP awarded (0 if goal not yet met or already met today).
     */
    public function trackDailyGoal(User $user, int $xpEarned): int
    {
        if ($xpEarned <= 0) {
            return 0;
        }

        $target = (int) config('rewards.daily_goal_target_xp', 100);
        $previousDaily = $user->daily_xp_earned ?? 0;
        $newDaily = $previousDaily + $xpEarned;

        $user->update(['daily_xp_earned' => $newDaily]);

        // Award bonus only on the first crossing of the target today
        if ($previousDaily < $target && $newDaily >= $target && $user->daily_goal_met_at === null) {
            $bonus = (int) config('rewards.daily_goal_bonus_xp', 20);
            $user->increment('xp', $bonus);
            $user->update(['daily_goal_met_at' => CarbonImmutable::today()]);

            return $bonus;
        }

        return 0;
    }

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

        $isConsecutive = $lastActive !== null && $today->subDay()->isSameDay($lastActive);

        $newStreak = $isConsecutive ? ($user->current_streak + 1) : 1;
        $longestStreak = max($user->longest_streak, $newStreak);

        // Reset daily goal tracking for the new day
        $user->update([
            'current_streak' => $newStreak,
            'longest_streak' => $longestStreak,
            'last_active_date' => $today,
            'daily_xp_earned' => 0,
            'daily_goal_met_at' => null,
        ]);

        $totalXp = 0;
        $bonuses = [];

        // Streak daily XP
        $dailyXp = $this->getStreakDailyXp($newStreak);
        $this->awardXp($user, $dailyXp);
        $totalXp += $dailyXp;

        // First Login Bonus — user has never logged in before
        if ($lastActive === null) {
            $firstLoginXp = (int) config('rewards.first_login_xp', 50);
            $this->awardXp($user, $firstLoginXp);
            $totalXp += $firstLoginXp;
            $bonuses[] = 'first_login';
        }

        // Comeback Bonus — returning after a long absence
        if ($lastActive !== null && ! $isConsecutive) {
            $gapDays = (int) $lastActive->diffInDays($today);
            $comebackGap = (int) config('rewards.comeback_gap_days', 7);

            if ($gapDays >= $comebackGap) {
                $comebackXp = (int) config('rewards.comeback_xp', 40);
                $this->awardXp($user, $comebackXp);
                $totalXp += $comebackXp;
                $bonuses[] = 'comeback';
            }
        }

        // Weekly Active Bonus — streak hits exactly 7
        if ($newStreak === 7) {
            $weeklyXp = (int) config('rewards.weekly_active_xp', 30);
            $this->awardXp($user, $weeklyXp);
            $totalXp += $weeklyXp;
            $bonuses[] = 'weekly_active';
        }

        app(BadgeService::class)->checkAndAward($user, 'streak_days');

        return ['xp' => $totalXp, 'bonuses' => $bonuses];
    }
}
