<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCourseLessonRequest;
use App\Http\Requests\StoreLessonTaskRequest;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
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
     * Store a new lesson for the course.
     */
    public function storeLesson(StoreCourseLessonRequest $request, Course $course): RedirectResponse
    {
        abort_unless($course->is_published, 404);

        $validated = $request->validated();
        $baseSlug = Str::slug($validated['title']);

        if ($baseSlug === '') {
            $baseSlug = 'lesson';
        }

        $existingSlugs = Lesson::query()
            ->whereBelongsTo($course)
            ->where('slug', 'like', $baseSlug.'%')
            ->pluck('slug');

        $slug = $baseSlug;
        $counter = 2;

        while ($existingSlugs->contains($slug)) {
            $slug = sprintf('%s-%d', $baseSlug, $counter);
            $counter++;
        }

        $nextPosition = ((int) Lesson::query()
            ->whereBelongsTo($course)
            ->max('position')) + 1;

        Lesson::query()->create([
            'course_id' => $course->id,
            'slug' => $slug,
            'title' => $validated['title'],
            'content' => '',
            'position' => $nextPosition,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Lesson created.'),
        ]);

        return back();
    }

    /**
     * Store a new task entry for a lesson.
     */
    public function storeTask(StoreLessonTaskRequest $request, Course $course, Lesson $lesson): RedirectResponse
    {
        abort_unless($course->is_published, 404);
        abort_unless($lesson->course_id === $course->id, 404);

        $validated = $request->validated();
        $documentName = null;
        $conversionStatus = null;
        $pdfUrl = null;

        if ($validated['type'] === 'read') {
            $uploadedDocument = $request->file('document');

            if ($uploadedDocument !== null) {
                $storedPath = $uploadedDocument->store('lesson-documents', 'public');
                $documentName = $uploadedDocument->getClientOriginalName();
                $conversionStatus = 'pending';
                $pdfUrl = Storage::disk('public')->url($storedPath);
            }
        }

        LessonTask::query()->create([
            'lesson_id' => $lesson->id,
            'title' => $validated['title'],
            'type' => $validated['type'],
            'minutes' => match ($validated['type']) {
                'video' => 18,
                'read' => 10,
                default => 5,
            },
            'video_url' => $validated['type'] === 'video' ? $validated['video_url'] : null,
            'document_name' => $documentName,
            'conversion_status' => $conversionStatus,
            'pdf_url' => $pdfUrl,
            'sort_order' => (int) LessonTask::query()->where('lesson_id', $lesson->id)->max('sort_order') + 1,
            'published_at' => null,
            'published_by' => null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Task created.'),
        ]);

        return back();
    }

    /**
     * Show a single course detail page.
     */
    public function show(Request $request, Course $course): Response
    {
        abort_unless($course->is_published, 404);
        $isAdmin = (bool) $request->user()?->isAdmin();

        $course->load([
            'lessons' => fn ($query) => $query->with(['tasks.quizQuestions'])->orderBy('position'),
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

        $canUnlockNext = true;

        $lessons = $course->lessons->map(function (Lesson $lesson) use (&$canUnlockNext, $completedLessonIds, $isAdmin): array {
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
                        'videoUrl' => $task->video_url,
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

    /**
     * Publish a lesson task once (one-way).
     */
    public function publishTask(Request $request, Course $course, Lesson $lesson, LessonTask $task): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);
        abort_unless($course->is_published, 404);
        abort_unless($lesson->course_id === $course->id, 404);
        abort_unless($task->lesson_id === $lesson->id, 404);

        if ($task->published_at !== null) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => __('Task is already published.'),
            ]);

            return back();
        }

        $task->update([
            'published_at' => now(),
            'published_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Task published.'),
        ]);

        return back();
    }

    /**
    * @return array<int, array{type: string, title: string, minutes: int, videoUrl: string|null, documentName: string|null, conversionStatus: string|null, pdfUrl: string|null, taskId: null, isPublished: bool, publishedAt: string|null, questionCount: int}>
     */
    private function extractLegacyTaskPayloads(string $content): array
    {
        if (trim($content) === '') {
            return [];
        }

        $decoded = json_decode($content, true);

        if (! is_array($decoded) || ! isset($decoded['tasks']) || ! is_array($decoded['tasks'])) {
            return [];
        }

        $allowedTypes = ['video', 'read', 'quiz'];
        $tasks = [];

        foreach ($decoded['tasks'] as $task) {
            if (! is_array($task)) {
                continue;
            }

            $type = isset($task['type']) && in_array($task['type'], $allowedTypes, true)
                ? $task['type']
                : null;

            $title = isset($task['title']) && is_string($task['title'])
                ? trim($task['title'])
                : '';

            $minutes = isset($task['minutes'])
                ? (int) $task['minutes']
                : 0;
            $videoUrl = isset($task['videoUrl']) && is_string($task['videoUrl'])
                ? $task['videoUrl']
                : null;
            $documentName = isset($task['documentName']) && is_string($task['documentName'])
                ? $task['documentName']
                : null;
            $conversionStatus = isset($task['conversionStatus']) && is_string($task['conversionStatus'])
                ? $task['conversionStatus']
                : null;
            $pdfUrl = isset($task['pdfUrl']) && is_string($task['pdfUrl'])
                ? $task['pdfUrl']
                : null;

            if ($type === null || $title === '') {
                continue;
            }

            $tasks[] = [
                'taskId' => null,
                'type' => $type,
                'title' => $title,
                'minutes' => max($minutes, 1),
                'videoUrl' => $videoUrl,
                'documentName' => $documentName,
                'conversionStatus' => $conversionStatus,
                'pdfUrl' => $pdfUrl,
                'isPublished' => false,
                'publishedAt' => null,
                'questions' => [],
                'questionCount' => 0,
            ];
        }

        return $tasks;
    }
}
