<?php

namespace App\Http\Controllers\Course;

use App\Concerns\ExtractsLegacyTasks;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use Illuminate\Http\Request;
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
        $courses = Course::query()
            ->published()
            ->withCount(['lessons', 'enrollments'])
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        $progressByCourse = $request->user()
            ->enrollments()
            ->pluck('progress_percentage', 'course_id');

        return Inertia::render('courses/index', [
            'courses' => $courses->map(function (Course $course) use ($progressByCourse): array {
                $isEnrolled = $progressByCourse->has($course->id);

                return [
                    'id' => $course->id,
                    'slug' => $course->slug,
                    'title' => $course->title,
                    'summary' => $course->summary,
                    'coverImage' => $course->cover,
                    'estimatedMinutes' => $course->estimated_minutes,
                    'lessonCount' => $course->lessons_count,
                    'enrollmentCount' => $course->enrollments_count,
                    'isEnrolled' => $isEnrolled,
                    'progressPercentage' => $isEnrolled ? $progressByCourse[$course->id] : null,
                ];
            })->values(),
        ]);
    }

    /**
     * Show a single course detail page.
     */
    public function show(Request $request, Course $course): Response
    {
        abort_unless($course->is_published, 404);
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
                'xpReward' => $lesson->xp_reward,
                'isCompleted' => $isCompleted,
                'isUnlocked' => $isUnlocked,
            ];
        })->values();

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
        ]);
    }
}
