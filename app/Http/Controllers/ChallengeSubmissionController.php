<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitChallengeRequest;
use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ChallengeSubmissionController extends Controller
{
    private const ROUND_TIME_LIMIT_SECONDS = 30;

    private const SPEED_SCORE_FLOOR_RATIO = 0.25;

    private const SPEED_SCORE_MINIMUM = 10;

    /**
     * Submit a standalone challenge answer.
     */
    public function store(SubmitChallengeRequest $request, Challenge $challenge): RedirectResponse
    {
        abort_unless($challenge->is_published, 404);

        $availabilityError = $this->resolveChallengeAvailabilityError($challenge);

        if ($availabilityError !== null) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __($availabilityError),
            ]);

            return back();
        }

        $result = $this->recordSubmission(
            $request->user(),
            $challenge,
            (string) $request->string('answer')->trim(),
            null,
            false,
        );

        if (! $result['isCorrect']) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Not quite right. Try again.'),
            ]);

            return back();
        }

        Inertia::flash('toast', [
            'type' => $result['alreadySolved'] ? 'info' : 'success',
            'message' => $result['alreadySolved']
                ? __('Correct answer. You already claimed points for this challenge.')
                : __('Correct answer. :points points added!', ['points' => $result['awardedPoints']]),
        ]);

        return back();
    }

    /**
     * Submit answer for speed-round mode and return immediate JSON feedback.
     */
    public function quickStore(SubmitChallengeRequest $request, Challenge $challenge): JsonResponse
    {
        abort_unless($challenge->is_published, 404);

        $availabilityError = $this->resolveChallengeAvailabilityError($challenge);

        if ($availabilityError !== null) {
            return response()->json([
                'message' => __($availabilityError),
            ], 422);
        }

        $result = $this->recordSubmission(
            $request->user(),
            $challenge,
            (string) $request->string('answer')->trim(),
            $request->integer('elapsed_ms'),
            true,
        );

        return response()->json([
            'challengeId' => $challenge->id,
            'isCorrect' => $result['isCorrect'],
            'alreadySolved' => $result['alreadySolved'],
            'awardedPoints' => $result['awardedPoints'],
            'correctAnswer' => $result['correctAnswer'],
            'elapsedMs' => $result['elapsedMs'],
            'timeLimitSeconds' => $result['timeLimitSeconds'],
            'totalPoints' => $request->user()->fresh()->points,
        ]);
    }

    /**
     * Persist challenge submission and award points once per challenge.
     *
     * @return array{isCorrect: bool, alreadySolved: bool, awardedPoints: int, correctAnswer: string, elapsedMs: int, timeLimitSeconds: int}
     */
    private function recordSubmission(
        User $user,
        Challenge $challenge,
        string $answer,
        ?int $elapsedMilliseconds = null,
        bool $speedBased = false,
    ): array {
        $normalizedAnswer = $this->normalizeAnswer($answer);
        $correctAnswer = $this->normalizeAnswer((string) $challenge->getRawOriginal('expected_answer'));
        $isCorrect = $normalizedAnswer !== '' && hash_equals($correctAnswer, $normalizedAnswer);
        $timeLimitSeconds = $this->resolveTimeLimitSeconds();
        $timeLimitMilliseconds = $timeLimitSeconds * 1000;
        $safeElapsedMilliseconds = $elapsedMilliseconds === null
            ? $timeLimitMilliseconds
            : max(0, min($elapsedMilliseconds, $timeLimitMilliseconds));

        $alreadySolved = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($challenge)
            ->where('is_correct', true)
            ->exists();

        $awardedPoints = $isCorrect && ! $alreadySolved
            ? ($speedBased
                ? $this->resolveSpeedAwardedPoints($challenge, $safeElapsedMilliseconds, $timeLimitMilliseconds)
                : (int) $challenge->points_reward)
            : 0;

        DB::transaction(function () use ($challenge, $user, $answer, $isCorrect, $awardedPoints): void {
            ChallengeSubmission::query()->create([
                'user_id' => $user->id,
                'challenge_id' => $challenge->id,
                'answer' => $answer,
                'is_correct' => $isCorrect,
                'score' => $isCorrect ? $awardedPoints : 0,
                'submitted_at' => now(),
            ]);

            if ($awardedPoints > 0) {
                $user->increment('points', $awardedPoints);
            }
        });

        return [
            'isCorrect' => $isCorrect,
            'alreadySolved' => $alreadySolved,
            'awardedPoints' => $awardedPoints,
            'correctAnswer' => $correctAnswer,
            'elapsedMs' => $safeElapsedMilliseconds,
            'timeLimitSeconds' => $timeLimitSeconds,
        ];
    }

    /**
     * Resolve validation error when challenge is outside playable window.
     */
    private function resolveChallengeAvailabilityError(Challenge $challenge): ?string
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
     * Resolve speed-based awarded points within min-max boundaries.
     */
    private function resolveSpeedAwardedPoints(
        Challenge $challenge,
        int $elapsedMilliseconds,
        int $timeLimitMilliseconds,
    ): int {
        $maximumPoints = max(1, (int) $challenge->points_reward);
        $minimumPoints = min(
            $maximumPoints,
            max(self::SPEED_SCORE_MINIMUM, (int) round($maximumPoints * self::SPEED_SCORE_FLOOR_RATIO))
        );

        if ($timeLimitMilliseconds <= 0) {
            return $minimumPoints;
        }

        $remainingRatio = 1 - ($elapsedMilliseconds / $timeLimitMilliseconds);
        $variablePoints = (int) round(($maximumPoints - $minimumPoints) * max(0, $remainingRatio));

        return min($maximumPoints, $minimumPoints + $variablePoints);
    }

    /**
     * Normalize a challenge answer for consistent comparison.
     */
    private function normalizeAnswer(string $answer): string
    {
        return Str::of($answer)->squish()->lower()->value();
    }

    /**
     * Resolve time limit in seconds for each challenge round.
     */
    private function resolveTimeLimitSeconds(): int
    {
        return self::ROUND_TIME_LIMIT_SECONDS;
    }
}
