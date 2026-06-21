<?php

namespace App\Concerns;

use App\Events\XpAwarded;
use App\Models\User;
use App\Services\BadgeService;
use App\Services\LevelService;
use Illuminate\Support\Collection;
use Inertia\Inertia;

trait FlashesAchievements
{
    /**
     * Check badges, story chapters, and flash any newly awarded ones.
     * Also persists notifications for each achievement.
     *
     * Level-up notification (event dispatch + Inertia flash) is handled
     * exclusively by UserObserver to avoid duplicate notifications.
     * This trait only awards the level-up BONUS POINTS here.
     *
     * @param  string|array<int, string>  $criteriaTypes
     */
    protected function checkAndFlashAchievements(
        BadgeService $badgeService,
        LevelService $levelService,
        User $user,
        string|array $criteriaTypes,
        ?int $previousXp = null,
    ): Collection {
        $newBadges = $badgeService->checkAndAward($user, $criteriaTypes);

        if ($newBadges->isNotEmpty()) {
            Inertia::flash('newBadges', $newBadges->map(fn ($badge) => [
                'name' => $badge->name,
                'description' => $badge->description,
                'icon' => $badge->icon,
                'tier' => $badge->tier,
                'category' => $badge->category,
            ])->values()->all());
        }

        if ($previousXp !== null) {
            $levelUp = $levelService->checkLevelUp($previousXp, $user->xp);
            if ($levelUp !== null) {
                // Award bonus points for leveling up: level × points_per_level
                // The level-up NOTIFICATION is handled by UserObserver.
                $pointsPerLevel = (int) config('rewards.level_up_points_per_level', 5);
                $levelUpPoints = $levelUp['level'] * $pointsPerLevel;
                $user->increment('points', $levelUpPoints);
                XpAwarded::dispatch($user, 0, $levelUpPoints, 'level_up');
            }
        }

        return $newBadges;
    }
}
