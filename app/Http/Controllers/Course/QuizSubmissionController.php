<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizSubmissionController extends Controller
{
    /**
     * Validate quiz answers server-side and return per-question results.
     * Correct answers are never exposed — only correctness flags + explanations.
     */
    public function store(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        abort_unless($course->is_published, 404);
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

        // Fetch questions in sort order
        $questions = $task->quizQuestions()
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
            ];
        })->values()->all();

        return response()->json([
            'score' => $correctCount,
            'total' => $questions->count(),
            'results' => $results,
        ]);
    }
}
