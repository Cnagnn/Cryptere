<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\ChallengeSubmission;
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

        $newlyAwarded = collect();

        foreach ($candidateBadges as $badge) {
            if ($this->isCriteriaMet($user, $badge)) {
                $user->badges()->attach($badge->id, ['earned_at' => now()]);
                $newlyAwarded->push($badge);
            }
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
        return Cache::remember('badge_definitions', 3600, fn (): Collection => Badge::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get());
    }

    /**
     * Evaluate whether a user meets the criteria for a specific badge.
     */
    private function isCriteriaMet(User $user, Badge $badge): bool
    {
        return match ($badge->criteria_type) {
            'first_enrollment' => $this->checkFirstEnrollment($user),
            'courses_completed' => $this->checkCoursesCompleted($user, $badge->criteria_value),
            'lessons_completed' => $this->checkLessonsCompleted($user, $badge->criteria_value),
            'challenges_solved' => $this->checkChallengesSolved($user, $badge->criteria_value),
            'perfect_quiz' => $this->checkPerfectQuiz($user),
            'speed_demon' => $this->checkSpeedDemon($user),
            'streak_days' => $this->checkStreakDays($user, $badge->criteria_value),
            'labs_visited' => $this->checkLabsVisited($user, $badge->criteria_value),
            'points_earned' => $this->checkPointsEarned($user, $badge->criteria_value),
            default => false,
        };
    }

    private function checkFirstEnrollment(User $user): bool
    {
        return Enrollment::query()->whereBelongsTo($user)->exists();
    }

    private function checkCoursesCompleted(User $user, int $required): bool
    {
        return Enrollment::query()
            ->whereBelongsTo($user)
            ->whereNotNull('completed_at')
            ->count() >= $required;
    }

    private function checkLessonsCompleted(User $user, int $required): bool
    {
        return LessonProgress::query()
            ->whereBelongsTo($user)
            ->whereNotNull('completed_at')
            ->count() >= $required;
    }

    private function checkChallengesSolved(User $user, int $required): bool
    {
        return ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->where('is_correct', true)
            ->distinct('challenge_id')
            ->count('challenge_id') >= $required;
    }

    private function checkPerfectQuiz(User $user): bool
    {
        // Check if user has any quiz session where all answers are correct
        $sessions = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->whereNotNull('session_id')
            ->selectRaw('session_id, COUNT(*) as total, SUM(is_correct) as correct_count')
            ->groupBy('session_id')
            ->havingRaw('COUNT(*) = SUM(is_correct)')
            ->havingRaw('COUNT(*) >= 3')
            ->exists();

        return $sessions;
    }

    private function checkSpeedDemon(User $user): bool
    {
        return ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->where('is_correct', true)
            ->where('elapsed_ms', '<', 5000)
            ->exists();
    }

    private function checkStreakDays(User $user, int $required): bool
    {
        return ($user->current_streak ?? 0) >= $required
            || ($user->longest_streak ?? 0) >= $required;
    }

    private function checkLabsVisited(User $user, int $required): bool
    {
        return LabVisit::query()
            ->whereBelongsTo($user)
            ->distinct('lab_slug')
            ->count('lab_slug') >= $required;
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
