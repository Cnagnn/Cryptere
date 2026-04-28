<?php

namespace App\Services;

use App\Models\Challenge;
use Carbon\CarbonInterface;
use Illuminate\Support\Str;

class ChallengeHelperService
{
    public const ROUND_TIME_LIMIT_SECONDS = 30;

    /**
     * Normalize a challenge answer for consistent comparison.
     */
    public function normalizeAnswer(string $answer): string
    {
        return Str::of($answer)->squish()->lower()->value();
    }

    /**
     * Resolve time limit in seconds for each speed-round.
     */
    public function resolveTimeLimitSeconds(): int
    {
        return self::ROUND_TIME_LIMIT_SECONDS;
    }

    /**
     * Resolve challenge availability based on configured time window.
     */
    public function resolveAvailabilityStatus(Challenge $challenge, CarbonInterface $currentTime): string
    {
        if ($challenge->time_start !== null && $currentTime->lt($challenge->time_start)) {
            return 'upcoming';
        }

        if ($challenge->time_end !== null && $currentTime->gt($challenge->time_end)) {
            return 'ended';
        }

        return 'active';
    }

    /**
     * Resolve availability from raw date values (for cached challenge data).
     */
    public function resolveAvailabilityStatusFromDates(mixed $timeStart, mixed $timeEnd, CarbonInterface $currentTime): string
    {
        if ($timeStart !== null && $currentTime->lt($timeStart)) {
            return 'upcoming';
        }

        if ($timeEnd !== null && $currentTime->gt($timeEnd)) {
            return 'ended';
        }

        return 'active';
    }

    /**
     * Resolve validation error when challenge is outside playable window.
     */
    public function resolveChallengeAvailabilityError(Challenge $challenge): ?string
    {
        $currentTime = now();

        if ($challenge->time_start !== null && $currentTime->lt($challenge->time_start)) {
            return 'This challenge has not started yet.';
        }

        if ($challenge->time_end !== null && $currentTime->gt($challenge->time_end)) {
            return 'This challenge has ended.';
        }

        return null;
    }

    /**
     * Hash a normalized answer for secure storage.
     */
    public function hashAnswer(string $normalizedAnswer): string
    {
        return hash('sha256', $normalizedAnswer);
    }
}
