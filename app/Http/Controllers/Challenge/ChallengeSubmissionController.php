<?php

namespace App\Http\Controllers\Challenge;

use App\Concerns\FlashesAchievements;
use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitChallengeRequest;
use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Services\BadgeService;
use App\Services\ChallengeHelperService;
use App\Services\ChallengeScoreService;
use App\Services\LevelService;
use App\Services\XpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChallengeSubmissionController extends Controller
{
    use FlashesAchievements;

    public function __construct(
        private readonly ChallengeScoreService $scoreService,
        private readonly BadgeService $badgeService,
        private readonly LevelService $levelService,
        private readonly ChallengeHelperService $challengeHelper,
        private readonly XpService $xpService,
    ) {}

    /**
     * Submit a standalone challenge answer.
     */
    public function store(SubmitChallengeRequest $request, Challenge $challenge): RedirectResponse
    {
        abort_unless($challenge->is_published, 404);

        $availabilityError = $this->challengeHelper->resolveChallengeAvailabilityError($challenge);

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

        if ($result['isCorrect']) {
            $user = $request->user();
            $user->refresh();
            $this->checkAndFlashAchievements(
                $this->badgeService,
                $this->levelService,
                $user,
                ['challenges_solved', 'speed_demon', 'points_earned'],
                $result['previousXp'],
            );
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

        $availabilityError = $this->challengeHelper->resolveChallengeAvailabilityError($challenge);

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

        if ($result['isCorrect']) {
            $user = $request->user();
            $user->refresh();
            $this->checkAndFlashAchievements(
                $this->badgeService,
                $this->levelService,
                $user,
                ['challenges_solved', 'speed_demon', 'points_earned'],
                $result['previousXp'],
            );
        }

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
     * Submit a single quiz question answer (new quiz mode).
     *
     * Accepts session_id, challenge_question_id, answer, elapsed_ms, question_index,
     * and consecutive_correct (client-tracked streak). Returns score + feedback.
     */
    public function quizSubmit(Request $request, Challenge $challenge): JsonResponse
    {
        abort_unless($challenge->is_published, 404);

        $validated = $request->validate([
            'session_id' => ['required', 'string', 'max:36'],
            'challenge_question_id' => ['required', 'integer', 'exists:challenge_questions,id'],
            'answer' => ['required', 'string', 'max:500'],
            'elapsed_ms' => ['required', 'integer', 'min:0', 'max:120000'],
            'question_index' => ['required', 'integer', 'min:0'],
            'consecutive_correct' => ['required', 'integer', 'min:0'],
        ]);

        /** @var User $user */
        $user = $request->user();

        // Block submission if user already completed a session for this challenge
        $hasCompletedSession = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($challenge)
            ->whereNotNull('session_id')
            ->where('session_id', '!=', $validated['session_id'])
            ->exists();

        if ($hasCompletedSession) {
            return response()->json([
                'message' => __('You have already completed this challenge.'),
            ], 422);
        }

        $question = ChallengeQuestion::findOrFail($validated['challenge_question_id']);

        abort_unless($question->challenge_id === $challenge->id, 422);

        $isCorrect = $question->isCorrect($validated['answer']);
        $timeLimitMs = ($challenge->time_limit_seconds ?? 20) * 1000;
        $maxPoints = $challenge->max_points_per_question ?? 10;

        $questionScore = $isCorrect
            ? $this->scoreService->calculateQuestionScore($validated['elapsed_ms'], $timeLimitMs, $maxPoints)
            : 0;

        $streakBonus = $isCorrect
            ? $this->scoreService->calculateStreakBonus($validated['consecutive_correct'] + 1)
            : 0;

        ChallengeSubmission::query()->create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'session_id' => $validated['session_id'],
            'challenge_question_id' => $question->id,
            'answer' => $validated['answer'],
            'is_correct' => $isCorrect,
            'score' => $questionScore,
            'elapsed_ms' => $validated['elapsed_ms'],
            'streak_bonus' => $streakBonus,
            'question_index' => $validated['question_index'],
            'submitted_at' => now(),
        ]);

        return response()->json([
            'isCorrect' => $isCorrect,
            'correctAnswer' => $question->correct_answer,
            'explanation' => $question->explanation,
            'questionScore' => $questionScore,
            'streakBonus' => $streakBonus,
            'totalQuestionPoints' => $questionScore + $streakBonus,
        ]);
    }

    /**
     * Finalize a quiz session: calculate totals and award points (first session only).
     */
    public function sessionSummary(Request $request, Challenge $challenge): JsonResponse
    {
        abort_unless($challenge->is_published, 404);

        $validated = $request->validate([
            'session_id' => ['required', 'string', 'max:36'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $sessionId = $validated['session_id'];

        $submissions = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($challenge)
            ->where('session_id', $sessionId)
            ->get();

        if ($submissions->isEmpty()) {
            return response()->json(['message' => 'No submissions found for this session.'], 404);
        }

        $totalScore = $submissions->sum('score');
        $totalStreakBonus = $submissions->sum('streak_bonus');
        $totalPoints = $totalScore + $totalStreakBonus;
        $correctCount = $submissions->where('is_correct', true)->count();
        $totalQuestions = $submissions->count();
        $averageElapsedMs = (int) round($submissions->avg('elapsed_ms') ?? 0);

        // Best streak within this session
        $bestStreak = 0;
        $currentStreak = 0;
        foreach ($submissions->sortBy('question_index') as $submission) {
            if ($submission->is_correct) {
                $currentStreak++;
                $bestStreak = max($bestStreak, $currentStreak);
            } else {
                $currentStreak = 0;
            }
        }

        // Award points + XP only if this is the user's first completed session for this challenge
        $hasEarlierSession = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($challenge)
            ->whereNotNull('session_id')
            ->where('session_id', '!=', $sessionId)
            ->where('is_correct', true)
            ->exists();

        $awardedPoints = 0;
        $awardedXp = 0;
        $isPerfectScore = $correctCount === $totalQuestions && $totalQuestions > 0;
        $previousXp = $user->xp;
        if (! $hasEarlierSession && $totalPoints > 0) {
            $awardedPoints = $this->xpService->applyLevelBonus($user, $totalPoints);
            $awardedXp = (int) config('rewards.challenge_quiz_session_xp', 20);
            $user->increment('points', $awardedPoints);
            $user->increment('xp', $awardedXp);

            // Perfect Score Bonus — all questions correct on first session
            if ($isPerfectScore) {
                $perfectXp = (int) config('rewards.perfect_score_xp', 50);
                $perfectPoints = (int) config('rewards.perfect_score_points', 150);
                $awardedXp += $perfectXp;
                $awardedPoints += $perfectPoints;
                $user->increment('xp', $perfectXp);
                $user->increment('points', $perfectPoints);
            }
        }

        $user->refresh();
        $this->checkAndFlashAchievements(
            $this->badgeService,
            $this->levelService,
            $user,
            ['challenges_solved', 'perfect_quiz', 'speed_demon', 'points_earned'],
            $previousXp,
        );

        return response()->json([
            'sessionId' => $sessionId,
            'totalScore' => $totalScore,
            'totalStreakBonus' => $totalStreakBonus,
            'totalPoints' => $totalPoints,
            'correctCount' => $correctCount,
            'totalQuestions' => $totalQuestions,
            'averageElapsedMs' => $averageElapsedMs,
            'bestStreak' => $bestStreak,
            'awardedPoints' => $awardedPoints,
            'awardedXp' => $awardedXp,
            'isPerfectScore' => $isPerfectScore,
            'isFirstSession' => ! $hasEarlierSession,
            'userTotalPoints' => $user->fresh()->points,
        ]);
    }

    /**
     * Persist challenge submission and award points + XP once per challenge.
     *
     * @return array{isCorrect: bool, alreadySolved: bool, awardedPoints: int, awardedXp: int, previousXp: int, correctAnswer: string, elapsedMs: int, timeLimitSeconds: int}
     */
    private function recordSubmission(
        User $user,
        Challenge $challenge,
        string $answer,
        ?int $elapsedMilliseconds = null,
        bool $speedBased = false,
    ): array {
        $normalizedAnswer = $this->challengeHelper->normalizeAnswer($answer);
        $correctAnswer = $this->challengeHelper->normalizeAnswer((string) $challenge->getRawOriginal('expected_answer'));
        $isCorrect = $normalizedAnswer !== '' && hash_equals($correctAnswer, $normalizedAnswer);
        $timeLimitSeconds = $this->challengeHelper->resolveTimeLimitSeconds();
        $timeLimitMilliseconds = $timeLimitSeconds * 1000;
        $safeElapsedMilliseconds = $elapsedMilliseconds === null
            ? $timeLimitMilliseconds
            : max(0, min($elapsedMilliseconds, $timeLimitMilliseconds));

        $alreadySolved = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($challenge)
            ->where('is_correct', true)
            ->exists();

        $baseChallengePoints = (int) config('rewards.challenge_base_points', 15);
        $basePoints = $isCorrect && ! $alreadySolved
            ? ($speedBased
                ? $this->resolveSpeedAwardedPoints($safeElapsedMilliseconds, $timeLimitMilliseconds, $baseChallengePoints)
                : $baseChallengePoints)
            : 0;

        $baseChallengeXp = (int) config('rewards.challenge_base_xp', 15);
        $firstBloodXp = (int) config('rewards.challenge_first_blood_xp', 10);
        $baseXp = $isCorrect && ! $alreadySolved ? ($baseChallengeXp + $firstBloodXp) : 0;
        $previousXp = $user->xp;

        DB::transaction(function () use ($challenge, $user, $answer, $isCorrect, $basePoints, $baseXp): void {
            ChallengeSubmission::query()->create([
                'user_id' => $user->id,
                'challenge_id' => $challenge->id,
                'answer' => $answer,
                'is_correct' => $isCorrect,
                'score' => $isCorrect ? $basePoints : 0,
                'submitted_at' => now(),
            ]);

            if ($basePoints > 0) {
                $awardedPoints = $this->xpService->applyLevelBonus($user, $basePoints);
                $user->increment('points', $awardedPoints);
            }

            if ($baseXp > 0) {
                $user->increment('xp', $baseXp);
            }
        });

        $awardedPoints = $basePoints > 0 ? $this->xpService->applyLevelBonus($user, $basePoints) : 0;

        return [
            'isCorrect' => $isCorrect,
            'alreadySolved' => $alreadySolved,
            'awardedPoints' => $awardedPoints,
            'awardedXp' => $baseXp,
            'previousXp' => $previousXp,
            'correctAnswer' => $correctAnswer,
            'elapsedMs' => $safeElapsedMilliseconds,
            'timeLimitSeconds' => $timeLimitSeconds,
        ];
    }

    /**
     * Resolve speed-based awarded points within min-max boundaries.
     */
    private function resolveSpeedAwardedPoints(
        int $elapsedMilliseconds,
        int $timeLimitMilliseconds,
        int $maximumPoints = 15,
    ): int {
        $speedMinPoints = (int) config('rewards.challenge_speed_min_points', 3);
        $speedFloorRatio = (float) config('rewards.challenge_speed_floor_ratio', 0.25);
        $minimumPoints = min(
            $maximumPoints,
            max($speedMinPoints, (int) round($maximumPoints * $speedFloorRatio))
        );

        if ($timeLimitMilliseconds <= 0) {
            return $minimumPoints;
        }

        $remainingRatio = 1 - ($elapsedMilliseconds / $timeLimitMilliseconds);
        $variablePoints = (int) round(($maximumPoints - $minimumPoints) * max(0, $remainingRatio));

        return min($maximumPoints, $minimumPoints + $variablePoints);
    }
}
