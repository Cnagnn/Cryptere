<?php

namespace App\Services;

use App\Models\Challenge;

class DailyChallengeService
{
    /**
     * Get today's daily challenge, or null if none is set.
     */
    public function getTodaysChallenge(): ?Challenge
    {
        return Challenge::query()
            ->published()
            ->daily()
            ->first();
    }

    /**
     * Check if a challenge has been solved by a user today.
     */
    public function hasUserSolvedToday(int $userId, Challenge $challenge): bool
    {
        return $challenge->submissions()
            ->where('user_id', $userId)
            ->where('is_correct', true)
            ->whereDate('submitted_at', now()->toDateString())
            ->exists();
    }
}
