<?php

namespace App\Services;

use App\Models\User;

class MasteryService
{
    /**
     * Hitung mastery per topik untuk user.
     * Mastery = (correct answers for topic / total attempts for topic) × 100
     *
     * @return array<string, array{topic: string, mastery: float, attempts: int, correct: int}>
     */
    public function getUserMastery(User $user): array
    {
        return [];
    }
}
