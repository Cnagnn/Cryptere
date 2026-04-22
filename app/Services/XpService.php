<?php

namespace App\Services;

use App\Models\LessonTask;
use App\Models\User;
use Carbon\CarbonImmutable;

class XpService
{
    /**
     * Award XP for completing a lesson task, applying streak multiplier.
     */
    public function awardTaskXp(User $user, LessonTask $task): int
    {
        $baseXp = $task->xp_reward ?? 0;

        if ($baseXp <= 0) {
            return 0;
        }

        $multiplier = $this->getStreakMultiplier($user->current_streak ?? 0);
        $awarded = (int) round($baseXp * $multiplier);

        if ($awarded > 0) {
            $user->increment('points', $awarded);
        }

        return $awarded;
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
     * Update the user's daily login streak.
     *
     * Call once per request (via middleware). Increments streak if last active was yesterday,
     * resets if gap > 1 day, no-ops if already active today.
     */
    public function updateDailyStreak(User $user): void
    {
        $today = CarbonImmutable::today();
        $lastActive = $user->last_active_date;

        if ($lastActive !== null && $today->isSameDay($lastActive)) {
            return;
        }

        $isConsecutive = $lastActive !== null && $today->subDay()->isSameDay($lastActive);

        $newStreak = $isConsecutive ? ($user->current_streak + 1) : 1;
        $longestStreak = max($user->longest_streak, $newStreak);

        $user->update([
            'current_streak' => $newStreak,
            'longest_streak' => $longestStreak,
            'last_active_date' => $today,
        ]);
    }
}
