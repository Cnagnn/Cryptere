<?php

namespace App\Services;

use App\Events\XpAwarded;
use App\Models\LessonTask;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class XpService
{
    public function __construct(
        private readonly LevelService $levelService,
    ) {}

    /**
     * Award XP and points for completing a lesson task (quiz).
     *
     * Uses the centralized config value instead of per-task xp_reward.
     * XP is boosted by streak multiplier. Points use the raw base amount
     * with level bonus only — streak does NOT inflate points.
     *
     * @return array{xp: int, points: int}
     */
    public function awardTaskXp(User $user, LessonTask $task): array
    {
        return $this->awardXpAndPoints($user, (int) config('rewards.quiz_task_xp', 20));
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

        DB::transaction(function () use ($user, $awardedXp, $awardedPoints): void {
            if ($awardedXp > 0) {
                $user->increment('xp', $awardedXp);
                $this->trackDailyGoal($user, $awardedXp);
            }

            if ($awardedPoints > 0) {
                $user->increment('points', $awardedPoints);
            }
        });

        if ($awardedXp > 0 || $awardedPoints > 0) {
            XpAwarded::dispatch($user, $awardedXp, $awardedPoints, 'task');
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

        DB::transaction(function () use ($user, $baseXp): void {
            $user->increment('xp', $baseXp);
            $this->trackDailyGoal($user, $baseXp);
        });

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

        // Use atomic update to prevent race conditions on daily_xp_earned
        $freshUser = User::query()->lockForUpdate()->find($user->id);
        $previousDaily = $freshUser->daily_xp_earned ?? 0;
        $newDaily = $previousDaily + $xpEarned;

        $freshUser->forceFill(['daily_xp_earned' => $newDaily])->save();
        $user->daily_xp_earned = $newDaily;

        // Award bonus only on the first crossing of the target today
        if ($previousDaily < $target && $newDaily >= $target && $freshUser->daily_goal_met_at === null) {
            $bonus = (int) config('rewards.daily_goal_bonus_xp', 20);
            $freshUser->increment('xp', $bonus);
            $freshUser->forceFill(['daily_goal_met_at' => CarbonImmutable::today()])->save();
            $user->daily_goal_met_at = CarbonImmutable::today();

            return $bonus;
        }

        return 0;
    }

    /**
     * Update the user's daily login streak and award streak XP.
     *
     * Delegates to StreakService. Kept here for backward compatibility.
     *
     * @return array{xp: int, bonuses: string[]}
     */
    public function updateDailyStreak(User $user): array
    {
        return app(StreakService::class)->updateDailyStreak($user);
    }
}
