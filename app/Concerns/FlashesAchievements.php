<?php

namespace App\Concerns;

use App\Events\XpAwarded;
use App\Models\User;
use App\Services\BadgeService;
use App\Services\LevelService;
use App\Services\StoryService;
use Illuminate\Support\Collection;
use Inertia\Inertia;

trait FlashesAchievements
{
    /**
     * Check badges, story chapters, and flash any newly awarded ones + level-up info.
     * Also persists notifications for each achievement.
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
                $pointsPerLevel = (int) config('rewards.level_up_points_per_level', 50);
                $levelUpPoints = $levelUp['level'] * $pointsPerLevel;
                $user->increment('points', $levelUpPoints);
                XpAwarded::dispatch($user, 0, $levelUpPoints, 'level_up');

                Inertia::flash('levelUp', [
                    ...$levelUp,
                    'bonus_points' => $levelUpPoints,
                ]);
            }
        }

        // Check and unlock story chapters after badges/level changes
        $this->checkAndFlashStoryUnlocks($user);

        return $newBadges;
    }

    /**
     * Check for newly unlocked story chapters and flash them.
     */
    protected function checkAndFlashStoryUnlocks(User $user): void
    {
        $storyService = app(StoryService::class);
        $newChapters = $storyService->checkAndUnlock($user);

        if ($newChapters->isNotEmpty()) {
            Inertia::flash('newStoryChapters', $newChapters->map(fn ($chapter) => [
                'id' => $chapter->id,
                'slug' => $chapter->slug,
                'title' => $chapter->title,
                'chapter_number' => $chapter->chapter_number,
                'icon' => $chapter->icon,
            ])->values()->all());
        }
    }
}
