<?php

namespace App\Services;

use App\Events\BadgeEarned;
use App\Models\Badge;
use App\Models\Enrollment;
use App\Models\LabVisit;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class BadgeService
{
    /**
     * Check all badge criteria for a user and award any newly earned badges.
     *
     * @param  string|array<int, string>  $criteriaTypes  Criteria type(s) to check
     * @return Collection<int, Badge> Newly awarded badges
     */
    public function checkAndAward(User $user, string|array $criteriaTypes): Collection
    {
        $criteriaTypes = (array) $criteriaTypes;
        $earnedBadgeIds = $user->badges()->pluck('badges.id');

        $candidateBadges = $this->getBadgeDefinitions()
            ->whereIn('criteria_type', $criteriaTypes)
            ->whereNotIn('id', $earnedBadgeIds);
        $criteriaStats = $this->buildCriteriaStats($user, $criteriaTypes);

        $newlyAwarded = collect();

        foreach ($candidateBadges as $badge) {
            if ($this->isCriteriaMet($user, $badge, $criteriaStats)) {
                $user->badges()->syncWithoutDetaching([
                    $badge->id => ['earned_at' => now()],
                ]);
                $newlyAwarded->push($badge);

                BadgeEarned::dispatch($user, $badge);
            }
        }

        if ($newlyAwarded->isNotEmpty()) {
            Cache::forget("user:{$user->id}:badge_count");
        }

        return $newlyAwarded;
    }

    /**
     * Get all badge definitions, cached for performance.
     *
     * @return Collection<int, Badge>
     */
    private function getBadgeDefinitions(): Collection
    {
        $badges = Cache::remember('badge_definitions', 3600, fn (): Collection => Badge::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get());

        // Guard against corrupted cache (e.g. __PHP_Incomplete_Class)
        if (! $badges instanceof Collection) {
            Cache::forget('badge_definitions');

            return Badge::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();
        }

        return $badges;
    }

    /**
     * Evaluate whether a user meets the criteria for a specific badge.
     *
     * @param  array<string, bool|int>  $criteriaStats
     */
    private function isCriteriaMet(User $user, Badge $badge, array $criteriaStats): bool
    {
        return match ($badge->criteria_type) {
            'first_enrollment' => (bool) ($criteriaStats['first_enrollment'] ?? false),
            'courses_completed' => (int) ($criteriaStats['courses_completed'] ?? 0) >= $badge->criteria_value,
            'lessons_completed' => (int) ($criteriaStats['lessons_completed'] ?? 0) >= $badge->criteria_value,
            'perfect_quiz' => (bool) ($criteriaStats['perfect_quiz'] ?? false),
            'streak_days' => $this->checkStreakDays($user, $badge->criteria_value),
            'labs_visited' => (int) ($criteriaStats['labs_visited'] ?? 0) >= $badge->criteria_value,
            'points_earned' => $this->checkPointsEarned($user, $badge->criteria_value),
            default => false,
        };
    }

    /**
     * Build the user statistics needed for the requested badge criteria.
     *
     * @param  array<int, string>  $criteriaTypes
     * @return array<string, bool|int>
     */
    private function buildCriteriaStats(User $user, array $criteriaTypes): array
    {
        $criteriaTypes = array_values(array_unique($criteriaTypes));
        $stats = [];

        if (array_intersect($criteriaTypes, ['first_enrollment', 'courses_completed']) !== []) {
            $enrollmentStats = Enrollment::query()
                ->whereBelongsTo($user)
                ->selectRaw('COUNT(*) as total_enrollments, SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed_courses')
                ->first();

            $stats['first_enrollment'] = (int) $enrollmentStats->total_enrollments > 0;
            $stats['courses_completed'] = (int) $enrollmentStats->completed_courses;
        }

        if (in_array('lessons_completed', $criteriaTypes, true)) {
            $stats['lessons_completed'] = LessonProgress::query()
                ->whereBelongsTo($user)
                ->whereNotNull('completed_at')
                ->count();
        }

        if (in_array('labs_visited', $criteriaTypes, true)) {
            $stats['labs_visited'] = LabVisit::query()
                ->whereBelongsTo($user)
                ->distinct('lab_slug')
                ->count('lab_slug');
        }

        return $stats;
    }

    private function checkStreakDays(User $user, int $required): bool
    {
        return ($user->current_streak ?? 0) >= $required
            || ($user->longest_streak ?? 0) >= $required;
    }

    private function checkPointsEarned(User $user, int $required): bool
    {
        return ($user->points ?? 0) >= $required;
    }

    /**
     * Clear the cached badge definitions (call after seeding or admin changes).
     */
    public static function clearCache(): void
    {
        Cache::forget('badge_definitions');
    }
}
