<?php

namespace App\Services;

class ChallengeScoreService
{
    /**
     * Calculate Kahoot-style score for a single question.
     *
     * Score decays linearly: answering instantly = maxPoints, answering at 2× time limit = 0.
     * Formula: round(maxPoints × max(0, 1 − (elapsedMs / (timeLimitMs × 2))))
     */
    public function calculateQuestionScore(int $elapsedMs, int $timeLimitMs, int $maxPoints = 1000): int
    {
        if ($timeLimitMs <= 0 || $maxPoints <= 0) {
            return 0;
        }

        $ratio = 1 - ($elapsedMs / ($timeLimitMs * 2));

        return (int) round($maxPoints * max(0, $ratio));
    }

    /**
     * Calculate streak bonus based on consecutive correct answers.
     *
     * Values are read from config('rewards.challenge_streak_bonus').
     * Index = consecutive correct count; last value repeats for higher streaks.
     */
    public function calculateStreakBonus(int $consecutiveCorrect): int
    {
        /** @var array<int, int> $table */
        $table = config('rewards.challenge_streak_bonus', [0, 0, 2, 4, 6, 10]);

        if ($consecutiveCorrect >= count($table)) {
            return (int) end($table);
        }

        return (int) ($table[$consecutiveCorrect] ?? 0);
    }

    /**
     * Calculate total session score from individual submission data.
     *
     * @param  array<int, array{score: int, streak_bonus: int}>  $submissions
     */
    public function calculateSessionTotal(array $submissions): int
    {
        $total = 0;

        foreach ($submissions as $submission) {
            $total += ($submission['score'] ?? 0) + ($submission['streak_bonus'] ?? 0);
        }

        return $total;
    }

    /**
     * Resolve speed-based awarded points within min-max boundaries.
     * Single-answer mode: speed bonus, decay over 1× time limit, floor = 25% of max.
     * Used by quickStore() for standalone challenge submissions.
     */
    public function calculateSpeedAwardedPoints(
        int $elapsedMs,
        int $timeLimitMs,
        int $maxPoints = 15,
    ): int {
        $speedMinPoints = (int) config('rewards.challenge_speed_min_points', 3);
        $speedFloorRatio = (float) config('rewards.challenge_speed_floor_ratio', 0.25);
        $minimumPoints = min(
            $maxPoints,
            max($speedMinPoints, (int) round($maxPoints * $speedFloorRatio))
        );

        if ($timeLimitMs <= 0) {
            return $minimumPoints;
        }

        $remainingRatio = 1 - ($elapsedMs / $timeLimitMs);
        $variablePoints = (int) round(($maxPoints - $minimumPoints) * max(0, $remainingRatio));

        return min($maxPoints, $minimumPoints + $variablePoints);
    }
}
