<?php

namespace App\Http\Controllers\Course;

use App\Concerns\ExtractsLegacyTasks;
use App\Http\Controllers\Controller;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentSubmission;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    use ExtractsLegacyTasks;

    /**
     * Show the published course catalog.
     */
    public function index(Request $request): Response
    {
        $catalogBase = Cache::remember('courses:catalog', CacheService::TTL_MEDIUM, fn () => Course::query()
            ->published()
            ->withCount(['lessons', 'enrollments'])
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get()
            ->map(fn (Course $course): array => [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'summary' => $course->summary,
                'coverImage' => $course->cover,
                'estimatedMinutes' => $course->estimated_minutes,
                'lessonCount' => $course->lessons_count,
                'enrollmentCount' => $course->enrollments_count,
            ])->values()->all());

        $progressByCourse = $request->user()
            ->enrollments()
            ->pluck('progress_percentage', 'course_id');

        $courses = collect($catalogBase)->map(function (array $course) use ($progressByCourse): array {
            $isEnrolled = $progressByCourse->has($course['id']);

            return [
                ...$course,
                'isEnrolled' => $isEnrolled,
                'progressPercentage' => $isEnrolled ? $progressByCourse[$course['id']] : null,
            ];
        })->values();

        return Inertia::render('courses/index', [
            'courses' => $courses,
        ]);
    }

    /**
     * Show a single course detail page.
     */
    public function show(Request $request, Course $course): Response
    {
        $this->authorize('view', $course);
        $isAdmin = (bool) $request->user()?->isAdmin();

        $course->load([
            'lessons' => fn ($query) => $query
                ->with(['tasks.quizQuestions'])
                ->orderBy('position'),
        ])->loadCount('enrollments');

        $enrollment = $request->user()
            ->enrollments()
            ->whereBelongsTo($course)
            ->first();

        $completedLessonIds = $request->user()
            ->lessonProgress()
            ->whereIn('lesson_id', $course->lessons->pluck('id'))
            ->whereNotNull('completed_at')
            ->pluck('lesson_id');

        // Load quiz submissions for all tasks in this course (keyed by lesson_task_id)
        $allTaskIds = $course->lessons->flatMap(fn (Lesson $lesson) => $lesson->tasks->pluck('id'));

        $quizSubmissions = QuizSubmission::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('lesson_task_id', $allTaskIds)
            ->get()
            ->keyBy('lesson_task_id');

        $canUnlockNext = true;

        $lessons = $course->lessons->map(function (Lesson $lesson) use (&$canUnlockNext, $completedLessonIds, $isAdmin, $quizSubmissions): array {
            $isCompleted = $completedLessonIds->contains($lesson->id);
            $isUnlocked = $canUnlockNext;

            if (! $isCompleted) {
                $canUnlockNext = false;
            }

            $visibleTasks = $lesson->tasks->when(
                ! $isAdmin,
                fn ($tasks) => $tasks->filter(fn (LessonTask $task): bool => $task->published_at !== null),
            )->values();

            return [
                'id' => $lesson->id,
                'slug' => $lesson->slug,
                'title' => $lesson->title,
                'position' => $lesson->position,
                'content' => $lesson->content,
                'tasks' => $visibleTasks->isNotEmpty()
                    ? $visibleTasks->map(fn (LessonTask $task): array => [
                        'taskId' => $task->id,
                        'type' => $task->type,
                        'title' => $task->title,
                        'minutes' => $task->minutes,
                        'videoUrl' => $task->video_mp4_url ?? $task->video_url,
                        'videoProcessingStatus' => $task->video_processing_status,
                        'documentName' => $task->document_name,
                        'conversionStatus' => $task->conversion_status,
                        'pdfUrl' => $task->pdf_url,
                        'isPublished' => $task->published_at !== null,
                        'publishedAt' => optional($task->published_at)->toIso8601String(),
                        // NOTE: correctOption is intentionally NOT sent to frontend (security)
                        'questions' => $task->quizQuestions->map(fn (QuizQuestion $question): array => [
                            'question' => $question->question,
                            'options' => $question->options,
                            'explanation' => null, // shown only after quiz submission
                        ])->values()->all(),
                        'questionCount' => $task->quizQuestions->count(),
                        'submission' => $quizSubmissions->has($task->id)
                            ? [
                                'answers' => $quizSubmissions[$task->id]->answers,
                                'score' => $quizSubmissions[$task->id]->score,
                                'total' => $quizSubmissions[$task->id]->total,
                                'results' => $quizSubmissions[$task->id]->results,
                                'xpEarned' => $quizSubmissions[$task->id]->xp_earned,
                                'pointsEarned' => $quizSubmissions[$task->id]->points_earned,
                            ]
                            : null,
                    ])->values()->all()
                    : ($isAdmin ? $this->extractLegacyTaskPayloads($lesson->content) : []),
                'isCompleted' => $isCompleted,
                'isUnlocked' => $isUnlocked,
            ];
        })->values();

        // Load the course's final assessment (if any)
        $user = $request->user();
        $assessment = $course->assessment()->published()->withCount('questions')->first();
        $assessmentData = null;

        if ($assessment) {
            $allLessonsCompleted = $enrollment && $enrollment->progress_percentage >= 100;

            $bestSubmission = AssessmentSubmission::query()
                ->where('user_id', $user->id)
                ->where('assessment_id', $assessment->id)
                ->where('status', 'graded')
                ->orderByDesc('total_score')
                ->first();

            $attemptCount = AssessmentSubmission::query()
                ->where('user_id', $user->id)
                ->where('assessment_id', $assessment->id)
                ->whereIn('status', ['submitted', 'grading', 'graded'])
                ->count();

            // Load questions (hide correct answers)
            $questions = $assessment->questions()
                ->get()
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

            // Check for in-progress submission
            $activeSubmission = AssessmentSubmission::query()
                ->where('user_id', $user->id)
                ->where('assessment_id', $assessment->id)
                ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
                ->first();

            // Get past submissions
            $pastSubmissions = AssessmentSubmission::query()
                ->where('user_id', $user->id)
                ->where('assessment_id', $assessment->id)
                ->whereIn('status', [
                    AssessmentSubmission::STATUS_SUBMITTED,
                    AssessmentSubmission::STATUS_GRADING,
                    AssessmentSubmission::STATUS_GRADED,
                ])
                ->orderByDesc('attempt_number')
                ->get()
                ->map(fn (AssessmentSubmission $sub) => [
                    'id' => $sub->id,
                    'attemptNumber' => $sub->attempt_number,
                    'status' => $sub->status,
                    'totalScore' => $sub->total_score,
                    'passed' => $sub->passed,
                    'submittedAt' => $sub->submitted_at?->toIso8601String(),
                    'gradedAt' => $sub->graded_at?->toIso8601String(),
                ]);

            // Load results for the latest graded submission (for inline results view)
            $latestGraded = AssessmentSubmission::query()
                ->where('user_id', $user->id)
                ->where('assessment_id', $assessment->id)
                ->where('status', 'graded')
                ->orderByDesc('attempt_number')
                ->with(['answers.question', 'grader:id,name'])
                ->first();

            $latestResults = null;
            if ($latestGraded) {
                $latestResults = [
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

            $assessmentData = [
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
                'totalPoints' => $assessment->total_points,
                'bestScore' => $bestSubmission?->total_score,
                'passed' => $bestSubmission?->passed ?? false,
                'attemptCount' => $attemptCount,
                'canAttempt' => $allLessonsCompleted && $assessment->canAttempt($user),
                'isLocked' => ! $allLessonsCompleted,
                'questions' => $questions,
                'activeSubmission' => $activeSubmission ? [
                    'id' => $activeSubmission->id,
                    'attemptNumber' => $activeSubmission->attempt_number,
                    'startedAt' => $activeSubmission->started_at->toIso8601String(),
                ] : null,
                'pastSubmissions' => $pastSubmissions,
                'latestResults' => $latestResults,
            ];
        }

        return Inertia::render('courses/show', [
            'course' => [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'summary' => $course->summary,
                'estimatedMinutes' => $course->estimated_minutes,
                'enrollmentCount' => $course->enrollments_count,
            ],
            'lessons' => $lessons,
            'enrollment' => $enrollment ? [
                'progressPercentage' => $enrollment->progress_percentage,
                'completedAt' => optional($enrollment->completed_at)->toIso8601String(),
            ] : null,
            'assessment' => $assessmentData,
        ]);
    }
}
