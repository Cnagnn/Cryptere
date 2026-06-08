<?php

namespace App\Observers;

use App\Events\Dashboard\LevelUp;
use App\Events\Dashboard\UserStatsUpdated;
use App\Models\User;
use App\Services\LevelService;

class UserObserver
{
    public function __construct(
        private readonly LevelService $levelService,
    ) {}

    public function updated(User $user): void
    {
        // Check if XP or points changed
        if ($user->wasChanged(['xp', 'points', 'level'])) {
            // Check for level up
            $oldXp = $user->getOriginal('xp') ?? 0;
            $newXp = $user->xp;

            $oldLevel = $user->getOriginal('level') ?? 1;
            $currentLevel = $this->levelService->getUserLevel($user);
            $newLevel = $currentLevel['current'];

            // Dispatch level up event if level changed
            if ($newLevel > $oldLevel) {
                event(new LevelUp(
                    userId: $user->id,
                    oldLevel: $oldLevel,
                    newLevel: $newLevel,
                    xp: $newXp,
                    unlockedFeatures: $this->getUnlockedFeatures($newLevel),
                ));
            }

            // Always dispatch stats updated for XP/points changes
            event(new UserStatsUpdated(
                userId: $user->id,
                xp: $user->xp,
                points: $user->points,
                level: $newLevel,
                streak: $user->current_streak,
            ));
        }
    }

    private function getUnlockedFeatures(int $level): array
    {
        // Define features unlocked at each level
        $features = [
            5 => ['Advanced Courses'],
            10 => ['Custom Badges', 'Leaderboard Badges'],
            15 => ['Premium Content'],
            20 => ['Mentor Access'],
        ];

        return $features[$level] ?? [];
    }
}
