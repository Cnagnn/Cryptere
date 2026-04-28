<?php

namespace App\Http\Controllers\Challenge;

use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Services\AdaptiveQuestionService;
use App\Services\CacheService;
use App\Services\ChallengeHelperService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChallengeController extends Controller
{
    public function __construct(
        private readonly ChallengeHelperService $challengeHelper,
        private readonly AdaptiveQuestionService $adaptiveService,
    ) {}

    /**
     * Show standalone challenges.
     */
    public function index(Request $request): Response
    {
        $currentTime = now();

        $catalogBase = Cache::remember('challenges:catalog', CacheService::TTL_MEDIUM, fn () => Challenge::query()
            ->published()
            ->withCount('questions')
            ->orderBy('title')
            ->get()
            ->map(fn (Challenge $challenge): array => [
                'id' => $challenge->id,
                'slug' => $challenge->slug,
                'title' => $challenge->title,
                'prompt' => $challenge->prompt,
                'hint' => $challenge->hint,
                'timeStart' => optional($challenge->time_start)?->toIso8601String(),
                'timeEnd' => optional($challenge->time_end)?->toIso8601String(),
                'questionsCount' => $challenge->questions_count,
                'hasQuestionBank' => $challenge->questions_count > 0,
                'time_start_raw' => $challenge->time_start,
                'time_end_raw' => $challenge->time_end,
            ])->values()->all());

        $user = $request->user();

        $solvedChallengeIds = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->where('is_correct', true)
            ->distinct('challenge_id')
            ->pluck('challenge_id');

        $completedSessionChallengeIds = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->whereNotNull('session_id')
            ->distinct('challenge_id')
            ->pluck('challenge_id');

        $bestScores = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->selectRaw('challenge_id, MAX(score) as best_score')
            ->groupBy('challenge_id')
            ->pluck('best_score', 'challenge_id');

        $challenges = collect($catalogBase)->map(function (array $c) use ($solvedChallengeIds, $completedSessionChallengeIds, $bestScores, $currentTime): array {
            return [
                'id' => $c['id'],
                'slug' => $c['slug'],
                'title' => $c['title'],
                'prompt' => $c['prompt'],
                'hint' => $c['hint'],
                'timeStart' => $c['timeStart'],
                'timeEnd' => $c['timeEnd'],
                'status' => $this->challengeHelper->resolveAvailabilityStatusFromDates($c['time_start_raw'], $c['time_end_raw'], $currentTime),
                'isSolved' => $solvedChallengeIds->contains($c['id']),
                'hasCompletedSession' => $completedSessionChallengeIds->contains($c['id']),
                'hasQuestionBank' => $c['hasQuestionBank'],
                'questionsCount' => $c['questionsCount'],
                'bestScore' => $bestScores->get($c['id'], 0),
            ];
        })->values();

        return Inertia::render('challenges/index', [
            'challenges' => $challenges,
        ]);
    }

    /**
     * Show standalone challenge details.
     *
     * When the challenge has a question bank, generates a quiz session with
     * random questions. Otherwise falls back to legacy speed-round mode.
     */
    public function show(Request $request, Challenge $challenge): Response
    {
        $this->authorize('view', $challenge);

        $currentTime = now();
        $availabilityStatus = $this->challengeHelper->resolveAvailabilityStatus($challenge, $currentTime);
        $hasQuestionBank = $challenge->hasQuestionBank();

        $solvedChallengeIds = ChallengeSubmission::query()
            ->whereBelongsTo($request->user())
            ->where('is_correct', true)
            ->distinct('challenge_id')
            ->pluck('challenge_id');

        // Check if user already completed a quiz session for this challenge
        $hasCompletedSession = $hasQuestionBank && ChallengeSubmission::query()
            ->whereBelongsTo($request->user())
            ->whereBelongsTo($challenge)
            ->whereNotNull('session_id')
            ->exists();

        // Quiz mode: generate session with adaptive questions (only if not already completed)
        $quizSession = null;
        $adjustedTimeLimit = null;
        if ($hasQuestionBank && ! $hasCompletedSession) {
            $quizSession = $this->buildQuizSession($challenge, $request->user());
            $adjustedTimeLimit = $this->adaptiveService->getAdjustedTimeLimit(
                $request->user(),
                $challenge->time_limit_seconds ?? 20,
            );
        }

        // Legacy mode: build speed rounds for backward compat
        $speedRound = null;
        if (! $hasQuestionBank) {
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
        }

        $userSubmissions = ChallengeSubmission::query()
            ->whereBelongsTo($request->user())
            ->whereBelongsTo($challenge)
            ->latest('submitted_at')
            ->take(10)
            ->get(['id', 'answer', 'is_correct', 'score', 'streak_bonus', 'submitted_at']);

        $attemptCount = $userSubmissions->count();
        $correctCount = $userSubmissions->where('is_correct', true)->count();

        // Best session score (sum of score + streak_bonus per session)
        $bestSessionScore = ChallengeSubmission::query()
            ->whereBelongsTo($request->user())
            ->whereBelongsTo($challenge)
            ->whereNotNull('session_id')
            ->selectRaw('session_id, SUM(score + streak_bonus) as session_total')
            ->groupBy('session_id')
            ->orderByDesc('session_total')
            ->value('session_total');

        $relatedChallenges = Challenge::query()
            ->published()
            ->whereKeyNot($challenge->id)
            ->orderBy('title')
            ->take(3)
            ->get(['id', 'slug', 'title']);

        return Inertia::render('challenges/show', [
            'challenge' => [
                'id' => $challenge->id,
                'slug' => $challenge->slug,
                'title' => $challenge->title,
                'prompt' => $challenge->prompt,
                'hint' => $challenge->hint,
                'timeStart' => optional($challenge->time_start)?->toIso8601String(),
                'timeEnd' => optional($challenge->time_end)?->toIso8601String(),
                'status' => $availabilityStatus,
                'isSolved' => $solvedChallengeIds->contains($challenge->id),
                'hasCompletedSession' => $hasCompletedSession,
                'hasQuestionBank' => $hasQuestionBank,
                'timeLimitSeconds' => $hasQuestionBank
                    ? ($adjustedTimeLimit ?? $challenge->time_limit_seconds)
                    : (int) ($speedRound['timeLimitSeconds'] ?? $this->challengeHelper->resolveTimeLimitSeconds()),
                'questionsPerSession' => $challenge->questions_per_session,
                'maxPointsPerQuestion' => $challenge->max_points_per_question,
                // Legacy speed-round options (null when quiz mode)
                'options' => $speedRound['options'] ?? [],
            ],
            'quizSession' => $quizSession,
            'submissionSummary' => [
                'attemptCount' => $attemptCount,
                'correctCount' => $correctCount,
                'bestScore' => (int) ($bestSessionScore ?? $userSubmissions->max('score') ?? 0),
                'lastSubmittedAt' => optional($userSubmissions->first()?->submitted_at)?->toIso8601String(),
            ],
            'recentSubmissions' => $userSubmissions->map(fn (ChallengeSubmission $submission): array => [
                'id' => $submission->id,
                'answer' => $submission->answer,
                'isCorrect' => $submission->is_correct,
                'score' => $submission->score,
                'streakBonus' => $submission->streak_bonus,
                'submittedAt' => optional($submission->submitted_at)?->toIso8601String(),
                'submittedAtHuman' => optional($submission->submitted_at)?->diffForHumans(),
            ])->values(),
            'relatedChallenges' => $relatedChallenges->map(fn (Challenge $related): array => [
                'id' => $related->id,
                'slug' => $related->slug,
                'title' => $related->title,
            ])->values(),
        ]);
    }

    /**
     * Build a quiz session with adaptively selected questions from the challenge's question bank.
     *
     * @return array{sessionId: string, questions: array<int, array<string, mixed>>}
     */
    private function buildQuizSession(Challenge $challenge, \App\Models\User $user): array
    {
        $sessionId = (string) Str::uuid();
        $count = $challenge->questions_per_session ?? 10;

        // Use adaptive selection instead of random
        $questions = $this->adaptiveService->selectQuestionsForSession($user, $challenge, $count);

        return [
            'sessionId' => $sessionId,
            'questions' => $questions->map(fn (ChallengeQuestion $question, int $index): array => [
                'id' => $question->id,
                'index' => $index,
                'type' => $question->type,
                'question' => $question->question,
                'options' => $question->options,
                'difficultyLevel' => $question->difficulty_level,
                // correct_answer is hidden via model attribute — never sent to client
            ])->values()->all(),
        ];
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
            ->map(fn (Challenge $challenge): string => $this->challengeHelper->normalizeAnswer(
                (string) $challenge->getRawOriginal('expected_answer'),
            ))
            ->filter()
            ->values();

        return $challenges->map(function (Challenge $challenge) use ($allAnswers, $fallbackDistractors): array {
            $expectedAnswer = $this->challengeHelper->normalizeAnswer((string) $challenge->getRawOriginal('expected_answer'));

            $distractors = $allAnswers
                ->reject(fn (string $answer): bool => hash_equals($answer, $expectedAnswer))
                ->unique()
                ->shuffle()
                ->take(3)
                ->values();

            if ($distractors->count() < 3) {
                $missing = 3 - $distractors->count();

                $fallback = $fallbackDistractors
                    ->map(fn (string $answer): string => $this->challengeHelper->normalizeAnswer($answer))
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
                'timeLimitSeconds' => $this->challengeHelper->resolveTimeLimitSeconds(),
                'options' => $options->values()->all(),
            ];
        })->values()->all();
    }
}
