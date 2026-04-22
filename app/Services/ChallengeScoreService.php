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
     * 0-1 correct → 0, 2 → 100, 3 → 200, 4 → 300, 5+ → 500
     */
    public function calculateStreakBonus(int $consecutiveCorrect): int
    {
        return match (true) {
            $consecutiveCorrect >= 5 => 500,
            $consecutiveCorrect === 4 => 300,
            $consecutiveCorrect === 3 => 200,
            $consecutiveCorrect === 2 => 100,
            default => 0,
        };
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
}
