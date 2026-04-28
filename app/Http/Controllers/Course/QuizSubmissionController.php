<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use App\Models\User;
use App\Services\AdaptiveQuestionService;
use App\Services\XpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizSubmissionController extends Controller
{
    public function __construct(
        private readonly XpService $xpService,
        private readonly AdaptiveQuestionService $adaptiveService,
    ) {}

    /**
     * Validate quiz answers server-side and return per-question results.
     * Correct answers are never exposed — only correctness flags + explanations.
     *
     * Supports multiple attempts with diminishing XP rewards:
     * - Attempt 1: 100% XP on perfect score
     * - Attempt 2: 50% XP on perfect score
     * - Attempt 3: 25% XP on perfect score
     * - Attempt 4+: 10% XP on perfect score
     */
    public function store(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->authorize('view', $course);
        abort_if($lesson->course_id !== $course->id, 404);

        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:lesson_tasks,id'],
            'answers' => ['required', 'array', 'min:1'],
            'answers.*' => ['required', 'integer', 'min:0', 'max:3'],
        ]);

        // Verify task belongs to this lesson
        $task = LessonTask::query()
            ->where('id', $validated['task_id'])
            ->where('lesson_id', $lesson->id)
            ->where('type', 'quiz')
            ->firstOrFail();

        // Verify the user is enrolled
        $enrollment = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->first();

        if ($enrollment === null) {
            return response()->json(['error' => 'You must be enrolled in this course to take a quiz.'], 403);
        }

        /** @var User $user */
        $user = $request->user();

        // Get all existing submissions for this user + task
        $existingSubmissions = QuizSubmission::query()
            ->where('user_id', $user->id)
            ->where('lesson_task_id', $task->id)
            ->orderBy('attempt_number')
            ->get();

        // Calculate attempt number
        $attemptNumber = $existingSubmissions->isEmpty()
            ? 1
            : $existingSubmissions->max('attempt_number') + 1;

        // Get questions per attempt from config
        $questionsPerAttempt = (int) config('rewards.quiz_questions_per_attempt', 4);

        // Get total available questions for this task
        $totalAvailable = $task->quizQuestions()->count();

        // Select questions: random from pool, limited to config amount
        // If pool is smaller than config, use all questions
        $questionsToShow = min($questionsPerAttempt, $totalAvailable);

        $questions = $task->quizQuestions()
            ->with('topic')
            ->inRandomOrder()
            ->take($questionsToShow)
            ->get();

        $answers = $validated['answers'];
        $correctCount = 0;

        $results = $questions->map(function (QuizQuestion $question, int $index) use ($answers, &$correctCount): array {
            $givenAnswer = isset($answers[$index]) ? (int) $answers[$index] : -1;
            $isCorrect = $givenAnswer === (int) $question->correct_option;

            if ($isCorrect) {
                $correctCount++;
            }

            // R2: Update adaptive question statistics
            $this->adaptiveService->updateQuestionStats($question, $isCorrect);

            return [
                'correct' => $isCorrect,
                'explanation' => $question->explanation,
                'remedialLessonSlug' => ! $isCorrect ? $question->topic?->relatedLessonSlug() : null,
            ];
        })->values()->all();

        // Calculate XP multiplier based on attempt number
        $xpMultipliers = config('rewards.quiz_retry_xp_multipliers', [1.0, 0.5, 0.25, 0.1]);
        $multiplierIndex = min($attemptNumber - 1, count($xpMultipliers) - 1);
        $xpMultiplier = (float) $xpMultipliers[$multiplierIndex];

        // Check max XP already earned across all previous attempts
        $maxPreviousXp = $existingSubmissions->max('xp_earned') ?? 0;

        $xpEarned = 0;
        $pointsEarned = 0;

        // Award XP on perfect score with diminishing returns
        // Never re-award if already earned XP on a previous attempt with same or better score
        $isPerfect = $correctCount === $questions->count();

        if ($isPerfect && ($maxPreviousXp === 0 || $xpMultiplier > 0)) {
            // Calculate base XP reward
            $baseRewards = $this->xpService->awardTaskXp($user, $task);
            $baseXp = $baseRewards['xp'];
            $basePoints = $baseRewards['points'];

            if ($maxPreviousXp > 0) {
                // Already earned XP before — only award if multiplied amount exceeds previous
                $scaledXp = (int) round($baseXp * $xpMultiplier);
                $scaledPoints = (int) round($basePoints * $xpMultiplier);

                // Don't re-award if previous attempt already earned more
                if ($scaledXp <= $maxPreviousXp) {
                    $xpEarned = 0;
                    $pointsEarned = 0;
                    // Reverse the XP that was just awarded by awardTaskXp
                    $this->reverseXpAward($user, $baseXp, $basePoints);
                } else {
                    // Award the difference only
                    $xpDiff = $scaledXp - $maxPreviousXp;
                    $pointsDiff = max(0, $scaledPoints - ($existingSubmissions->max('points_earned') ?? 0));
                    // Reverse the full award and re-award the correct amount
                    $this->reverseXpAward($user, $baseXp, $basePoints);
                    $user->increment('xp', $xpDiff);
                    $user->increment('points', $pointsDiff);
                    $xpEarned = $scaledXp;
                    $pointsEarned = $scaledPoints;
                }
            } else {
                // First time earning XP — apply multiplier
                if ($xpMultiplier < 1.0) {
                    $scaledXp = (int) round($baseXp * $xpMultiplier);
                    $scaledPoints = (int) round($basePoints * $xpMultiplier);
                    // Reverse full award and re-award scaled amount
                    $this->reverseXpAward($user, $baseXp, $basePoints);
                    $user->increment('xp', $scaledXp);
                    $user->increment('points', $scaledPoints);
                    $xpEarned = $scaledXp;
                    $pointsEarned = $scaledPoints;
                } else {
                    $xpEarned = $baseXp;
                    $pointsEarned = $basePoints;
                }
            }
        }

        // Create the new submission (always create, never update)
        $submission = QuizSubmission::create([
            'user_id' => $user->id,
            'lesson_task_id' => $task->id,
            'attempt_number' => $attemptNumber,
            'answers' => $answers,
            'score' => $correctCount,
            'total' => $questions->count(),
            'results' => $results,
            'xp_earned' => $xpEarned,
            'points_earned' => $pointsEarned,
            'is_best_attempt' => false,
            'submitted_at' => now(),
        ]);

        // Recalculate is_best_attempt across all submissions for this user + task
        $this->recalculateBestAttempt($user->id, $task->id);

        // R2: Update user ability estimate based on quiz accuracy
        $quizAccuracy = $questions->count() > 0 ? $correctCount / $questions->count() : 0.0;
        $this->adaptiveService->updateUserAbility($user, $quizAccuracy);

        // Get best score across all attempts
        $allSubmissions = QuizSubmission::query()
            ->where('user_id', $user->id)
            ->where('lesson_task_id', $task->id)
            ->get();

        $bestSubmission = $allSubmissions->sortByDesc('score')->first();

        return response()->json([
            'score' => $correctCount,
            'total' => $questions->count(),
            'results' => $results,
            'xp_earned' => $xpEarned,
            'points_earned' => $pointsEarned,
            'attempt_number' => $attemptNumber,
            'max_attempts' => null, // unlimited
            'xp_multiplier' => $xpMultiplier,
            'best_score' => $bestSubmission?->score ?? $correctCount,
            'best_total' => $bestSubmission?->total ?? $questions->count(),
            'can_retry' => true,
        ]);
    }

    /**
     * Recalculate which submission is the best attempt for a user + task.
     */
    private function recalculateBestAttempt(int $userId, int $taskId): void
    {
        // Reset all to false
        QuizSubmission::query()
            ->where('user_id', $userId)
            ->where('lesson_task_id', $taskId)
            ->update(['is_best_attempt' => false]);

        // Find the best submission (highest score, then earliest attempt)
        $best = QuizSubmission::query()
            ->where('user_id', $userId)
            ->where('lesson_task_id', $taskId)
            ->orderByDesc('score')
            ->orderBy('attempt_number')
            ->first();

        if ($best) {
            $best->update(['is_best_attempt' => true]);
        }
    }

    /**
     * Reverse an XP/points award (used when recalculating scaled amounts).
     */
    private function reverseXpAward(User $user, int $xp, int $points): void
    {
        if ($xp > 0) {
            $user->decrement('xp', $xp);
        }
        if ($points > 0) {
            $user->decrement('points', $points);
        }
    }
}
