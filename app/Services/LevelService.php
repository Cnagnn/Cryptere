<?php

namespace App\Services;

use App\Models\User;

class LevelService
{
    /**
     * Get the level thresholds from config, cached for the request lifetime.
     *
     * @return array<int, array{min_xp: int, bonus_percent: float}>
     */
    private function thresholds(): array
    {
        return once(fn (): array => config('levels.thresholds'));
    }

    /**
     * Calculate the level info for a given XP total.
     *
     * @return array{level: int, current_xp: int, next_level_xp: int|null, progress: float, bonus_percent: float}
     */
    public function getLevelForXp(int $xp): array
    {
        $thresholds = $this->thresholds();
        $currentLevel = 1;

        foreach ($thresholds as $level => $data) {
            if ($xp >= $data['min_xp']) {
                $currentLevel = $level;
            }
        }

        $nextLevel = $currentLevel + 1;
        $nextLevelXp = $thresholds[$nextLevel]['min_xp'] ?? null;
        $currentLevelXp = $thresholds[$currentLevel]['min_xp'];

        $progress = 100.0;
        if ($nextLevelXp !== null) {
            $range = $nextLevelXp - $currentLevelXp;
            $progress = $range > 0
                ? round((($xp - $currentLevelXp) / $range) * 100, 1)
                : 100.0;
        }

        $bonusPercent = $thresholds[$currentLevel]['bonus_percent'];

        return [
            'level' => $currentLevel,
            'current_xp' => $xp,
            'next_level_xp' => $nextLevelXp,
            'progress' => min($progress, 100.0),
            'bonus_percent' => $bonusPercent,
        ];
    }

    /**
     * Check if a user leveled up after an XP change.
     *
     * @return array{level: int, bonus_percent: float}|null
     */
    public function checkLevelUp(int $previousXp, int $currentXp): ?array
    {
        $previousLevel = $this->getLevelForXp($previousXp);
        $currentLevel = $this->getLevelForXp($currentXp);

        if ($currentLevel['level'] > $previousLevel['level']) {
            return [
                'level' => $currentLevel['level'],
                'bonus_percent' => $currentLevel['bonus_percent'],
            ];
        }

        return null;
    }

    /**
     * Get the level info for a user (uses XP column).
     *
     * @return array{level: int, current_xp: int, next_level_xp: int|null, progress: float, bonus_percent: float}
     */
    public function getUserLevel(User $user): array
    {
        return $this->getLevelForXp($user->xp ?? 0);
    }

    /**
     * Get the bonus percentage for a given level.
     *
     * Each level grants 0.2% bonus: level 10 → 2%, level 25 → 5%, level 50 → 10%.
     */
    public function getBonusPercent(int $level): float
    {
        $thresholds = $this->thresholds();

        return $thresholds[$level]['bonus_percent'] ?? 0.0;
    }

    /**
     * Get the point bonus multiplier for a user based on their current level.
     *
     * Returns a multiplier like 1.02 (level 10, 2% bonus) or 1.10 (level 50, 10% bonus).
     */
    public function getPointBonusMultiplier(User $user): float
    {
        $levelInfo = $this->getUserLevel($user);

        return 1 + ($levelInfo['bonus_percent'] / 100);
    }

    /**
     * Get the maximum level number.
     */
    public function maxLevel(): int
    {
        return max(array_keys($this->thresholds()));
    }
}
