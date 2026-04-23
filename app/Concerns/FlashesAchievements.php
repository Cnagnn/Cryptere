<?php

namespace App\Concerns;

use App\Models\User;
use App\Services\BadgeService;
use App\Services\LevelService;
use Illuminate\Support\Collection;
use Inertia\Inertia;

trait FlashesAchievements
{
    /**
     * Check badges and flash any newly awarded ones + level-up info.
     * Also persists notifications for each achievement.
     *
     * @param  string|array<int, string>  $criteriaTypes
     */
    protected function checkAndFlashAchievements(
        BadgeService $badgeService,
        LevelService $levelService,
        User $user,
        string|array $criteriaTypes,
        ?int $previousPoints = null,
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

        if ($previousPoints !== null) {
            $levelUp = $levelService->checkLevelUp($previousPoints, $user->points);
            if ($levelUp !== null) {
                Inertia::flash('levelUp', $levelUp);
            }
        }

        return $newBadges;
    }
}
