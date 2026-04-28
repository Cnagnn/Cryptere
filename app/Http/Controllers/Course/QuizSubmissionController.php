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
use App\Services\XpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizSubmissionController extends Controller
{
    public function __construct(
        private readonly XpService $xpService,
    ) {}

    /**
     * Validate quiz answers server-side and return per-question results.
     * Correct answers are never exposed — only correctness flags + explanations.
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

        // Fetch questions in sort order (eager-load topic for remedial links)
        $questions = $task->quizQuestions()
            ->with('topic')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $answers = $validated['answers'];
        $correctCount = 0;

        $results = $questions->map(function (QuizQuestion $question, int $index) use ($answers, &$correctCount): array {
            $givenAnswer = isset($answers[$index]) ? (int) $answers[$index] : -1;
            $isCorrect = $givenAnswer === (int) $question->correct_option;

            if ($isCorrect) {
                $correctCount++;
            }

            return [
                'correct' => $isCorrect,
                'explanation' => $question->explanation,
                'remedialLessonSlug' => ! $isCorrect ? $question->topic?->relatedLessonSlug() : null,
            ];
        })->values()->all();

        /** @var User $user */
        $user = $request->user();

        $xpEarned = 0;
        $pointsEarned = 0;

        // Check if user already has a submission for this task
        $existingSubmission = QuizSubmission::query()
            ->where('user_id', $user->id)
            ->where('lesson_task_id', $task->id)
            ->first();

        $alreadyRewarded = $existingSubmission !== null && $existingSubmission->xp_earned > 0;

        // Award XP only on first perfect score (never re-award)
        if ($correctCount === $questions->count() && ! $alreadyRewarded) {
            $rewards = $this->xpService->awardTaskXp($user, $task);
            $xpEarned = $rewards['xp'];
            $pointsEarned = $rewards['points'];
        }

        // Persist (or update) the submission
        $submission = QuizSubmission::updateOrCreate(
            [
                'user_id' => $user->id,
                'lesson_task_id' => $task->id,
            ],
            [
                'answers' => $answers,
                'score' => $correctCount,
                'total' => $questions->count(),
                'results' => $results,
                'xp_earned' => $alreadyRewarded
                    ? $existingSubmission->xp_earned
                    : $xpEarned,
                'points_earned' => $alreadyRewarded
                    ? $existingSubmission->points_earned
                    : $pointsEarned,
                'submitted_at' => now(),
            ],
        );

        return response()->json([
            'score' => $correctCount,
            'total' => $questions->count(),
            'results' => $results,
            'xp_earned' => $xpEarned,
            'points_earned' => $pointsEarned,
        ]);
    }
}
