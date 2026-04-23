<?php

namespace App\Http\Controllers;

use App\Concerns\FlashesAchievements;
use App\Http\Requests\SubmitChallengeRequest;
use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Services\BadgeService;
use App\Services\ChallengeScoreService;
use App\Services\LevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ChallengeSubmissionController extends Controller
{
    use FlashesAchievements;

    private const ROUND_TIME_LIMIT_SECONDS = 30;

    private const BASE_CHALLENGE_POINTS = 100;

    private const SPEED_SCORE_FLOOR_RATIO = 0.25;

    private const SPEED_SCORE_MINIMUM = 10;

    public function __construct(
        private readonly ChallengeScoreService $scoreService,
        private readonly BadgeService $badgeService,
        private readonly LevelService $levelService,
    ) {}

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

        if ($result['isCorrect']) {
            $user = $request->user();
            $user->refresh();
            $this->checkAndFlashAchievements(
                $this->badgeService,
                $this->levelService,
                $user,
                ['challenges_solved', 'speed_demon', 'points_earned'],
                $user->points - $result['awardedPoints'],
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

        if ($result['isCorrect']) {
            $user = $request->user();
            $user->refresh();
            $this->checkAndFlashAchievements(
                $this->badgeService,
                $this->levelService,
                $user,
                ['challenges_solved', 'speed_demon', 'points_earned'],
                $user->points - $result['awardedPoints'],
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
        $question = ChallengeQuestion::findOrFail($validated['challenge_question_id']);

        abort_unless($question->challenge_id === $challenge->id, 422);

        $isCorrect = $question->isCorrect($validated['answer']);
        $timeLimitMs = ($challenge->time_limit_seconds ?? 20) * 1000;
        $maxPoints = $challenge->max_points_per_question ?? 1000;

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

        // Award points only if this is the user's first completed session for this challenge
        $hasEarlierSession = ChallengeSubmission::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($challenge)
            ->whereNotNull('session_id')
            ->where('session_id', '!=', $sessionId)
            ->where('is_correct', true)
            ->exists();

        $awardedPoints = 0;
        $previousPoints = $user->points;
        if (! $hasEarlierSession && $totalPoints > 0) {
            $awardedPoints = $totalPoints;
            $user->increment('points', $awardedPoints);
        }

        $user->refresh();
        $this->checkAndFlashAchievements(
            $this->badgeService,
            $this->levelService,
            $user,
            ['challenges_solved', 'perfect_quiz', 'speed_demon', 'points_earned'],
            $previousPoints,
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
            'isFirstSession' => ! $hasEarlierSession,
            'userTotalPoints' => $user->fresh()->points,
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
                ? $this->resolveSpeedAwardedPoints($safeElapsedMilliseconds, $timeLimitMilliseconds)
                : self::BASE_CHALLENGE_POINTS)
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
        int $elapsedMilliseconds,
        int $timeLimitMilliseconds,
    ): int {
        $maximumPoints = self::BASE_CHALLENGE_POINTS;
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
