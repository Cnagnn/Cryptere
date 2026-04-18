<?php

namespace App\Http\Controllers;

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChallengeController extends Controller
{
    private const ROUND_TIME_LIMIT_SECONDS = 30;

    /**
     * Show standalone challenges.
     */
    public function index(Request $request): Response
    {
        $currentTime = now();

        $challenges = Challenge::query()
            ->published()
            ->orderBy('title')
            ->get();

        $solvedChallengeIds = ChallengeSubmission::query()
            ->whereBelongsTo($request->user())
            ->where('is_correct', true)
            ->distinct('challenge_id')
            ->pluck('challenge_id');

        $speedRounds = $this->buildSpeedRounds($challenges);

        return Inertia::render('challenges/index', [
            'challenges' => $challenges->map(function (Challenge $challenge) use ($solvedChallengeIds, $currentTime): array {
                return [
                    'id' => $challenge->id,
                    'slug' => $challenge->slug,
                    'title' => $challenge->title,
                    'prompt' => $challenge->prompt,
                    'hint' => $challenge->hint,
                    'pointsReward' => $challenge->points_reward,
                    'timeStart' => optional($challenge->time_start)?->toIso8601String(),
                    'timeEnd' => optional($challenge->time_end)?->toIso8601String(),
                    'status' => $this->resolveAvailabilityStatus($challenge, $currentTime),
                    'isSolved' => $solvedChallengeIds->contains($challenge->id),
                ];
            })->values(),
            'speedRounds' => $speedRounds,
        ]);
    }

    /**
     * Show standalone challenge details.
     */
    public function show(Request $request, Challenge $challenge): Response
    {
        abort_unless($challenge->is_published, 404);

        $currentTime = now();
        $availabilityStatus = $this->resolveAvailabilityStatus($challenge, $currentTime);

        $solvedChallengeIds = ChallengeSubmission::query()
            ->whereBelongsTo($request->user())
            ->where('is_correct', true)
            ->distinct('challenge_id')
            ->pluck('challenge_id');

        $speedRounds = collect(
            $this->buildSpeedRounds(
                Challenge::query()
                    ->published()
                    ->orderBy('title')
                    ->get()
            )
        );

        $speedRound = $speedRounds
            ->first(fn (array $round): bool => (int) $round['id'] === $challenge->id);

        $userSubmissions = ChallengeSubmission::query()
            ->whereBelongsTo($request->user())
            ->whereBelongsTo($challenge)
            ->latest('submitted_at')
            ->take(10)
            ->get(['id', 'answer', 'is_correct', 'score', 'submitted_at']);

        $attemptCount = $userSubmissions->count();
        $correctCount = $userSubmissions->where('is_correct', true)->count();

        $relatedChallenges = Challenge::query()
            ->published()
            ->whereKeyNot($challenge->id)
            ->orderBy('title')
            ->take(3)
            ->get(['id', 'slug', 'title', 'points_reward']);

        return Inertia::render('challenges/show', [
            'challenge' => [
                'id' => $challenge->id,
                'slug' => $challenge->slug,
                'title' => $challenge->title,
                'prompt' => $challenge->prompt,
                'hint' => $challenge->hint,
                'pointsReward' => $challenge->points_reward,
                'timeStart' => optional($challenge->time_start)?->toIso8601String(),
                'timeEnd' => optional($challenge->time_end)?->toIso8601String(),
                'status' => $availabilityStatus,
                'timeLimitSeconds' => (int) ($speedRound['timeLimitSeconds'] ?? $this->resolveTimeLimitSeconds()),
                'options' => $speedRound['options'] ?? [],
                'isSolved' => $solvedChallengeIds->contains($challenge->id),
            ],
            'submissionSummary' => [
                'attemptCount' => $attemptCount,
                'correctCount' => $correctCount,
                'bestScore' => (int) $userSubmissions->max('score'),
                'lastSubmittedAt' => optional($userSubmissions->first()?->submitted_at)?->toIso8601String(),
            ],
            'recentSubmissions' => $userSubmissions->map(fn (ChallengeSubmission $submission): array => [
                'id' => $submission->id,
                'answer' => $submission->answer,
                'isCorrect' => $submission->is_correct,
                'score' => $submission->score,
                'submittedAt' => optional($submission->submitted_at)?->toIso8601String(),
                'submittedAtHuman' => optional($submission->submitted_at)?->diffForHumans(),
            ])->values(),
            'relatedChallenges' => $relatedChallenges->map(fn (Challenge $related): array => [
                'id' => $related->id,
                'slug' => $related->slug,
                'title' => $related->title,
                'pointsReward' => $related->points_reward,
            ])->values(),
        ]);
    }

    /**
     * Build Quizizz-like speed rounds from published challenges.
     *
     * @param  Collection<int, Challenge>  $challenges
     * @return array<int, array<string, mixed>>
     */
    private function buildSpeedRounds(Collection $challenges): array
    {
        $fallbackDistractors = collect([
            'encryption',
            'decryption',
            'integrity',
            'confidentiality',
            'nonce',
            'salt',
            'public key',
            'private key',
            'signature',
            'key exchange',
            'diffusion',
            'substitution',
        ]);

        $allAnswers = $challenges
            ->map(fn (Challenge $challenge): string => $this->normalizeAnswer(
                (string) $challenge->getRawOriginal('expected_answer'),
            ))
            ->filter()
            ->values();

        return $challenges->map(function (Challenge $challenge) use ($allAnswers, $fallbackDistractors): array {
            $expectedAnswer = $this->normalizeAnswer((string) $challenge->getRawOriginal('expected_answer'));

            $distractors = $allAnswers
                ->reject(fn (string $answer): bool => hash_equals($answer, $expectedAnswer))
                ->unique()
                ->shuffle()
                ->take(3)
                ->values();

            if ($distractors->count() < 3) {
                $missing = 3 - $distractors->count();

                $fallback = $fallbackDistractors
                    ->map(fn (string $answer): string => $this->normalizeAnswer($answer))
                    ->reject(fn (string $answer): bool => hash_equals($answer, $expectedAnswer) || $distractors->contains($answer))
                    ->shuffle()
                    ->take($missing)
                    ->values();

                $distractors = $distractors->concat($fallback)->values();
            }

            $options = $distractors
                ->push($expectedAnswer)
                ->unique()
                ->shuffle()
                ->values()
                ->map(fn (string $answer): array => [
                    'label' => Str::of($answer)->headline()->value(),
                    'value' => $answer,
                ]);

            return [
                'id' => $challenge->id,
                'slug' => $challenge->slug,
                'title' => $challenge->title,
                'prompt' => $challenge->prompt,
                'pointsReward' => $challenge->points_reward,
                'timeLimitSeconds' => $this->resolveTimeLimitSeconds(),
                'options' => $options->values()->all(),
            ];
        })->values()->all();
    }

    /**
     * Resolve challenge availability based on configured time window.
     */
    private function resolveAvailabilityStatus(Challenge $challenge, CarbonInterface $currentTime): string
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
     * Normalize a challenge answer for consistent comparison.
     */
    private function normalizeAnswer(string $answer): string
    {
        return Str::of($answer)->squish()->lower()->value();
    }

    /**
     * Resolve a timer duration for the speed-round.
     */
    private function resolveTimeLimitSeconds(): int
    {
        return self::ROUND_TIME_LIMIT_SECONDS;
    }
}
