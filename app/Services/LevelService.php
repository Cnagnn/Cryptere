<?php

namespace App\Services;

use App\Models\User;

class LevelService
{
    /**
     * Get the level thresholds from config, cached for the request lifetime.
     *
     * @return array<int, array{min_points: int, name: string}>
     */
    private function thresholds(): array
    {
        return once(fn (): array => config('levels.thresholds'));
    }

    /**
     * Calculate the level info for a given point total.
     *
     * @return array{level: int, name: string, current_xp: int, next_level_xp: int|null, progress: float}
     */
    public function getLevelForPoints(int $points): array
    {
        $thresholds = $this->thresholds();
        $currentLevel = 1;
        $currentName = $thresholds[1]['name'];

        foreach ($thresholds as $level => $data) {
            if ($points >= $data['min_points']) {
                $currentLevel = $level;
                $currentName = $data['name'];
            }
        }

        $nextLevel = $currentLevel + 1;
        $nextLevelXp = $thresholds[$nextLevel]['min_points'] ?? null;
        $currentLevelXp = $thresholds[$currentLevel]['min_points'];

        $progress = 100.0;
        if ($nextLevelXp !== null) {
            $range = $nextLevelXp - $currentLevelXp;
            $progress = $range > 0
                ? round((($points - $currentLevelXp) / $range) * 100, 1)
                : 100.0;
        }

        return [
            'level' => $currentLevel,
            'name' => $currentName,
            'current_xp' => $points,
            'next_level_xp' => $nextLevelXp,
            'progress' => min($progress, 100.0),
        ];
    }

    /**
     * Check if a user leveled up after a points change.
     *
     * @return array{level: int, name: string}|null
     */
    public function checkLevelUp(int $previousPoints, int $currentPoints): ?array
    {
        $previousLevel = $this->getLevelForPoints($previousPoints);
        $currentLevel = $this->getLevelForPoints($currentPoints);

        if ($currentLevel['level'] > $previousLevel['level']) {
            return [
                'level' => $currentLevel['level'],
                'name' => $currentLevel['name'],
            ];
        }

        return null;
    }

    /**
     * Get the level info for a user.
     *
     * @return array{level: int, name: string, current_xp: int, next_level_xp: int|null, progress: float}
     */
    public function getUserLevel(User $user): array
    {
        return $this->getLevelForPoints($user->points ?? 0);
    }

    /**
     * Get the maximum level number.
     */
    public function maxLevel(): int
    {
        return max(array_keys($this->thresholds()));
    }
}
