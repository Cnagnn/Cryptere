<?php

namespace App\Services;

use App\Concerns\ExtractsLegacyTasks;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentSubmission;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use App\Models\TaskProgress;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Builds the data payload for the course detail (show) page.
 *
 * Extracted from CourseController::show() to reduce controller complexity.
 */
class CourseDetailBuilder
{
    use ExtractsLegacyTasks;

    /**
     * Build the lessons array with tasks, quiz submissions, and unlock state.
     *
     * @return Collection<int, array>
     */
    public function buildLessons(Course $course, User $user, bool $isAdmin): Collection
    {
        $allTaskIds = $course->lessons->flatMap(fn (Lesson $lesson) => $lesson->tasks->pluck('id'));
        $lessonIds = $course->lessons->pluck('id');

        $quizSubmissions = $allTaskIds->isNotEmpty()
            ? QuizSubmission::query()
                ->where('user_id', $user->id)
                ->whereIn('lesson_task_id', $allTaskIds)
                ->orderByDesc('attempt_number')
                ->get()
                ->unique('lesson_task_id')
                ->keyBy('lesson_task_id')
            : collect();

        $completedLessonIds = $lessonIds->isNotEmpty()
            ? $user
                ->lessonProgress()
                ->whereIn('lesson_id', $lessonIds)
                ->whereNotNull('completed_at')
                ->pluck('lesson_id')
            : collect();

        $taskProgressByTaskId = $allTaskIds->isNotEmpty()
            ? TaskProgress::query()
                ->where('user_id', $user->id)
                ->whereIn('lesson_task_id', $allTaskIds)
                ->get()
                ->keyBy('lesson_task_id')
            : collect();
        $completedTaskIds = $taskProgressByTaskId
            ->filter(fn (TaskProgress $progress): bool => $progress->completed_at !== null)
            ->keys();

        $canUnlockNext = true;

        return $course->lessons->map(function (Lesson $lesson) use (&$canUnlockNext, $completedLessonIds, $isAdmin, $quizSubmissions, $completedTaskIds, $taskProgressByTaskId): array {
            $isCompleted = $completedLessonIds->contains($lesson->id);
            $isUnlocked = $canUnlockNext;

            if (! $isCompleted) {
                $canUnlockNext = false;
            }

            $visibleTasks = $lesson->tasks->when(
                ! $isAdmin,
                fn ($tasks) => $tasks->filter(fn (LessonTask $task): bool => $task->isPublished()),
            )->values();

            return [
                'id' => $lesson->id,
                'slug' => $lesson->slug,
                'title' => $lesson->title,
                'position' => $lesson->position,
                'content' => $lesson->content,
                'tasks' => $visibleTasks->isNotEmpty()
                    ? $visibleTasks->map(fn (LessonTask $task): array => $this->buildTask($task, $quizSubmissions, $completedTaskIds, $taskProgressByTaskId))->values()->all()
                    : ($isAdmin ? $this->extractLegacyTaskPayloads($lesson->content) : []),
                'isCompleted' => $isCompleted,
                'isUnlocked' => $isUnlocked,
            ];
        })->values();
    }

    /**
     * Build a single task payload.
     *
     * @param  Collection<int, QuizSubmission>  $quizSubmissions
     * @param  Collection<int, int>  $completedTaskIds
     * @param  Collection<int, TaskProgress>  $taskProgressByTaskId
     */
    private function buildTask(LessonTask $task, Collection $quizSubmissions, Collection $completedTaskIds, Collection $taskProgressByTaskId): array
    {
        $progress = $taskProgressByTaskId->get($task->id);

        return [
            'taskId' => $task->id,
            'type' => $task->type,
            'title' => $task->title,
            'minutes' => null,
            'videoUrl' => $task->video_mp4_url ?? $task->video_url,
            'videoProcessingStatus' => $task->video_processing_status,
            'videoPositionSeconds' => $progress?->video_position_seconds ?? 0,
            'documentName' => $task->document_name,
            'conversionStatus' => $task->conversion_status,
            'pdfUrl' => $task->pdf_url ? route('courses.documents.show', $task) : null,
            'isPublished' => $task->isPublished(),
            'publishedAt' => optional($task->published_at)->toIso8601String(),
            'isCompleted' => $completedTaskIds->contains($task->id),
            'questions' => $task->quizQuestions->map(fn (QuizQuestion $question): array => [
                'id' => $question->id,
                'question' => $question->question,
                'options' => $question->options,
                'explanation' => null,
            ])->values()->all(),
            'questionCount' => $task->quizQuestions->count(),
            'submission' => $quizSubmissions->has($task->id)
                ? [
                    'answers' => $quizSubmissions[$task->id]->answers,
                    'score' => $quizSubmissions[$task->id]->score,
                    'total' => $quizSubmissions[$task->id]->total,
                    'results' => $this->enrichResults(
                        $quizSubmissions[$task->id]->results,
                        $task->quizQuestions,
                    ),
                    'xpEarned' => $quizSubmissions[$task->id]->xp_earned,
                    'pointsEarned' => $quizSubmissions[$task->id]->points_earned,
                    'canRetry' => true,
                ]
                : null,
        ];
    }

    /**
     * Enrich stored results with correctAnswer from quiz questions.
     *
     * @param  array<int, array>  $results
     * @param  \Illuminate\Database\Eloquent\Collection<int, QuizQuestion>  $questions
     * @return array<int, array>
     */
    private function enrichResults(array $results, $questions): array
    {
        return collect($results)->map(function (array $result, int $index) use ($questions) {
            $question = $questions->values()->get($index);
            $result['correctAnswer'] = $question ? (int) $question->correct_option : null;

            return $result;
        })->all();
    }

    /**
     * Build the assessments data array for a course.
     *
     * @return array<int, array>
     */
    public function buildAssessments(Course $course, User $user): array
    {
        $assessments = $course->assessments()
            ->published()
            ->with('questions')
            ->withCount('questions')
            ->withSum('questions as questions_points_sum', 'points')
            ->orderBy('sort_order')
            ->get();

        $submissionsByAssessment = $assessments->isNotEmpty()
            ? AssessmentSubmission::query()
                ->where('user_id', $user->id)
                ->whereIn('assessment_id', $assessments->pluck('id'))
                ->with(['answers.question', 'grader:id,name'])
                ->get()
                ->groupBy('assessment_id')
            : collect();

        $assessmentsData = [];

        foreach ($assessments as $assessment) {
            $submissions = $submissionsByAssessment->get($assessment->id, collect());
            $gradedSubmissions = $submissions->where('status', AssessmentSubmission::STATUS_GRADED);
            $bestSubmission = $gradedSubmissions->sortByDesc('total_score')->first();
            $attemptCount = $submissions
                ->whereIn('status', [
                    AssessmentSubmission::STATUS_SUBMITTED,
                    AssessmentSubmission::STATUS_GRADING,
                    AssessmentSubmission::STATUS_GRADED,
                ])
                ->count();

            $questions = $assessment->questions
                ->map(fn ($q) => [
                    'id' => $q->id,
                    'bloomLevel' => $q->bloom_level,
                    'questionType' => $q->question_type,
                    'questionText' => $q->question_text,
                    'options' => $q->options,
                    'points' => $q->points,
                    'gradingType' => $q->grading_type,
                    'minWords' => $q->min_words,
                    'maxWords' => $q->max_words,
                    'sortOrder' => $q->sort_order,
                ]);

            $activeSubmission = $submissions
                ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
                ->sortByDesc('attempt_number')
                ->first();

            $pastSubmissions = $submissions
                ->whereIn('status', [
                    AssessmentSubmission::STATUS_SUBMITTED,
                    AssessmentSubmission::STATUS_GRADING,
                    AssessmentSubmission::STATUS_GRADED,
                ])
                ->sortByDesc('attempt_number')
                ->map(fn (AssessmentSubmission $sub) => [
                    'id' => $sub->id,
                    'attemptNumber' => $sub->attempt_number,
                    'status' => $sub->status,
                    'totalScore' => $sub->total_score,
                    'passed' => $sub->passed,
                    'submittedAt' => $sub->submitted_at?->toIso8601String(),
                    'gradedAt' => $sub->graded_at?->toIso8601String(),
                ]);

            $latestResults = $this->buildLatestResults($gradedSubmissions->sortByDesc('attempt_number')->first());

            $assessmentsData[] = [
                'id' => $assessment->id,
                'slug' => $assessment->slug,
                'title' => $assessment->title,
                'description' => $assessment->description,
                'bloomLevel' => $assessment->bloom_level,
                'bloomLabel' => $assessment->bloom_label,
                'gradingType' => $assessment->grading_type,
                'passingScore' => $assessment->passing_score,
                'maxAttempts' => $assessment->max_attempts,
                'timeLimitMinutes' => $assessment->time_limit_minutes,
                'questionsCount' => $assessment->questions_count,
                'totalPoints' => (int) $assessment->questions_points_sum,
                'bestScore' => $bestSubmission?->total_score,
                'passed' => $bestSubmission?->passed ?? false,
                'attemptCount' => $attemptCount,
                'canAttempt' => $assessment->isAvailable() && $attemptCount < $assessment->max_attempts,
                'isLocked' => false,
                'questions' => $questions,
                'activeSubmission' => $activeSubmission ? [
                    'id' => $activeSubmission->id,
                    'attemptNumber' => $activeSubmission->attempt_number,
                    'startedAt' => $activeSubmission->started_at->toIso8601String(),
                    'answers' => $activeSubmission->answers->map(fn (AssessmentAnswer $answer) => [
                        'questionId' => $answer->question_id,
                        'answerText' => $answer->answer_text,
                        'selectedOption' => $answer->selected_option,
                    ])->values(),
                ] : null,
                'pastSubmissions' => $pastSubmissions,
                'latestResults' => $latestResults,
            ];
        }

        return $assessmentsData;
    }

    /**
     * Build the latest graded results for an assessment.
     */
    private function buildLatestResults(?AssessmentSubmission $latestGraded): ?array
    {
        if (! $latestGraded) {
            return null;
        }

        return [
            'submission' => [
                'id' => $latestGraded->id,
                'attemptNumber' => $latestGraded->attempt_number,
                'status' => $latestGraded->status,
                'totalScore' => $latestGraded->total_score,
                'pointsEarned' => $latestGraded->points_earned,
                'pointsPossible' => $latestGraded->points_possible,
                'passed' => $latestGraded->passed,
                'submittedAt' => $latestGraded->submitted_at?->toIso8601String(),
                'gradedAt' => $latestGraded->graded_at?->toIso8601String(),
                'overallFeedback' => $latestGraded->overall_feedback,
                'graderName' => $latestGraded->grader?->name,
            ],
            'answers' => $latestGraded->answers->map(fn (AssessmentAnswer $answer) => [
                'id' => $answer->id,
                'questionId' => $answer->question_id,
                'questionText' => $answer->question->question_text,
                'questionType' => $answer->question->question_type,
                'bloomLevel' => $answer->question->bloom_level,
                'answerText' => $answer->answer_text,
                'selectedOption' => $answer->selected_option,
                'isCorrect' => $answer->is_correct,
                'pointsAwarded' => $answer->points_awarded,
                'maxPoints' => $answer->max_points,
                'rubricScores' => $answer->rubric_scores,
                'feedback' => $answer->feedback,
                'explanation' => $answer->question->explanation,
                'correctAnswer' => $answer->question->correct_answer,
            ]),
        ];
    }
}
