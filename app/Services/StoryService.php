<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\StoryChapter;
use App\Models\User;
use App\Models\UserStoryProgress;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class StoryService
{
    /**
     * Check and unlock any new story chapters for the user.
     * Called after course completion, badge earning, level up, challenge solving.
     * Returns newly unlocked chapters.
     *
     * @return Collection<int, StoryChapter>
     */
    public function checkAndUnlock(User $user): Collection
    {
        $unlockedChapterIds = $user->unlockedChapters()->pluck('story_chapters.id');

        $candidates = $this->getChapterDefinitions()
            ->whereNotIn('id', $unlockedChapterIds);

        $newlyUnlocked = collect();

        foreach ($candidates as $chapter) {
            if ($this->isUnlockCriteriaMet($user, $chapter)) {
                UserStoryProgress::query()->firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'story_chapter_id' => $chapter->id,
                    ],
                    [
                        'unlocked_at' => now(),
                    ]
                );
                $newlyUnlocked->push($chapter);
            }
        }

        if ($newlyUnlocked->isNotEmpty()) {
            Cache::forget("user:{$user->id}:story_progress");
        }

        return $newlyUnlocked;
    }

    /**
     * Get all chapters with unlock status for a user.
     * Returns chapters ordered by chapter_number with 'is_unlocked' and 'is_read' flags.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getChaptersForUser(User $user): Collection
    {
        $chapters = $this->getChapterDefinitions();
        $progress = UserStoryProgress::query()
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('story_chapter_id');

        return $chapters->map(function (StoryChapter $chapter) use ($progress): array {
            $userProgress = $progress->get($chapter->id);
            $isUnlocked = $userProgress !== null;

            return [
                'id' => $chapter->id,
                'slug' => $chapter->slug,
                'title' => $chapter->title,
                'narrative' => $isUnlocked ? $chapter->narrative : null,
                'chapter_number' => $chapter->chapter_number,
                'unlock_type' => $chapter->unlock_type,
                'unlock_value' => $chapter->unlock_value,
                'icon' => $chapter->icon,
                'is_unlocked' => $isUnlocked,
                'is_read' => $isUnlocked && $userProgress->read_at !== null,
                'unlocked_at' => $userProgress?->unlocked_at?->toISOString(),
                'read_at' => $userProgress?->read_at?->toISOString(),
                'unlock_hint' => $this->getUnlockHint($chapter),
            ];
        });
    }

    /**
     * Mark a chapter as read by the user.
     */
    public function markAsRead(User $user, StoryChapter $chapter): void
    {
        UserStoryProgress::query()
            ->where('user_id', $user->id)
            ->where('story_chapter_id', $chapter->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        Cache::forget("user:{$user->id}:story_progress");
    }

    /**
     * Get the user's story progress summary.
     * Returns: total chapters, unlocked count, read count, next unlock hint.
     *
     * @return array{total: int, unlocked: int, read: int, next_hint: string|null, latest_chapter: array<string, mixed>|null}
     */
    public function getProgressSummary(User $user): array
    {
        $chapters = $this->getChapterDefinitions();
        $progress = UserStoryProgress::query()
            ->where('user_id', $user->id)
            ->get();

        $unlockedIds = $progress->pluck('story_chapter_id');
        $readCount = $progress->whereNotNull('read_at')->count();

        // Find next locked chapter
        $nextChapter = $chapters
            ->whereNotIn('id', $unlockedIds)
            ->sortBy('chapter_number')
            ->first();

        // Find latest unlocked chapter
        $latestProgress = $progress->sortByDesc('unlocked_at')->first();
        $latestChapter = null;
        if ($latestProgress) {
            $chapter = $chapters->firstWhere('id', $latestProgress->story_chapter_id);
            if ($chapter) {
                $latestChapter = [
                    'id' => $chapter->id,
                    'slug' => $chapter->slug,
                    'title' => $chapter->title,
                    'chapter_number' => $chapter->chapter_number,
                    'icon' => $chapter->icon,
                    'is_read' => $latestProgress->read_at !== null,
                ];
            }
        }

        return [
            'total' => $chapters->count(),
            'unlocked' => $unlockedIds->count(),
            'read' => $readCount,
            'next_hint' => $nextChapter ? $this->getUnlockHint($nextChapter) : null,
            'latest_chapter' => $latestChapter,
        ];
    }

    /**
     * Evaluate whether a user meets the unlock criteria for a chapter.
     */
    private function isUnlockCriteriaMet(User $user, StoryChapter $chapter): bool
    {
        return match ($chapter->unlock_type) {
            StoryChapter::UNLOCK_COURSE_COMPLETE => $this->checkCourseComplete($user, $chapter->unlock_value),
            StoryChapter::UNLOCK_BADGE_EARNED => $this->checkBadgeEarned($user, $chapter->unlock_value),
            StoryChapter::UNLOCK_LEVEL_REACHED => $this->checkLevelReached($user, (int) $chapter->unlock_value),
            StoryChapter::UNLOCK_CHALLENGE_SOLVED => $this->checkChallengeSolved($user, (int) $chapter->unlock_value),
            StoryChapter::UNLOCK_FIRST_ENROLLMENT => $this->checkFirstEnrollment($user),
            default => false,
        };
    }

    private function checkCourseComplete(User $user, string $courseSlug): bool
    {
        return Enrollment::query()
            ->whereBelongsTo($user)
            ->whereHas('course', fn ($q) => $q->where('slug', $courseSlug))
            ->whereNotNull('completed_at')
            ->exists();
    }

    private function checkBadgeEarned(User $user, string $badgeSlug): bool
    {
        return $user->badges()
            ->where('slug', $badgeSlug)
            ->exists();
    }

    private function checkLevelReached(User $user, int $level): bool
    {
        $levelService = app(LevelService::class);
        $userLevel = $levelService->getUserLevel($user);

        return $userLevel['level'] >= $level;
    }

    private function checkChallengeSolved(User $user, int $count): bool
    {
        return $user->challengeSubmissions()
            ->where('is_correct', true)
            ->distinct('challenge_id')
            ->count('challenge_id') >= $count;
    }

    private function checkFirstEnrollment(User $user): bool
    {
        return Enrollment::query()
            ->whereBelongsTo($user)
            ->exists();
    }

    /**
     * Get a human-readable hint for how to unlock a chapter.
     */
    private function getUnlockHint(StoryChapter $chapter): string
    {
        return match ($chapter->unlock_type) {
            StoryChapter::UNLOCK_COURSE_COMPLETE => "Complete the course '{$chapter->unlock_value}' to unlock this chapter.",
            StoryChapter::UNLOCK_BADGE_EARNED => "Earn the '{$chapter->unlock_value}' badge to unlock this chapter.",
            StoryChapter::UNLOCK_LEVEL_REACHED => "Reach Level {$chapter->unlock_value} to unlock this chapter.",
            StoryChapter::UNLOCK_CHALLENGE_SOLVED => "Solve {$chapter->unlock_value} challenges to unlock this chapter.",
            StoryChapter::UNLOCK_FIRST_ENROLLMENT => 'Enroll in your first course to unlock this chapter.',
            default => 'Keep progressing to unlock this chapter.',
        };
    }

    /**
     * Get all chapter definitions, cached for performance.
     *
     * @return Collection<int, StoryChapter>
     */
    private function getChapterDefinitions(): Collection
    {
        $chapters = Cache::remember('story_chapter_definitions', 3600, fn (): Collection => StoryChapter::query()
            ->orderBy('chapter_number')
            ->orderBy('id')
            ->get());

        if (! $chapters instanceof Collection) {
            Cache::forget('story_chapter_definitions');

            return StoryChapter::query()
                ->orderBy('chapter_number')
                ->orderBy('id')
                ->get();
        }

        return $chapters;
    }

    /**
     * Clear the cached chapter definitions (call after seeding or admin changes).
     */
    public static function clearCache(): void
    {
        Cache::forget('story_chapter_definitions');
    }
}
