<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdminCoursesRequest;
use App\Http\Requests\Admin\ReorderAdminLessonsRequest;
use App\Http\Requests\Admin\ReorderAdminTasksRequest;
use App\Http\Requests\Admin\StoreAdminCourseRequest;
use App\Http\Requests\Admin\StoreAdminLessonRequest;
use App\Http\Requests\Admin\StoreAdminLessonTaskRequest;
use App\Http\Requests\Admin\TogglePublishAdminCourseRequest;
use App\Http\Requests\Admin\UpdateAdminCourseRequest;
use App\Http\Requests\Admin\UpdateAdminLessonRequest;
use App\Http\Requests\Admin\UpdateAdminLessonTaskRequest;
use App\Jobs\ConvertLessonDocument;
use App\Jobs\ConvertLessonVideo;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CourseManagementController extends Controller
{
    private const SECTION_CATALOG = 'catalog';

    private const SECTION_LESSON = 'lesson';

    private const SECTION_TASK = 'task';

    private const ALLOWED_SECTIONS = [
        self::SECTION_CATALOG,
        self::SECTION_LESSON,
        self::SECTION_TASK,
    ];

    // ── index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $section = (string) $request->input('section', self::SECTION_CATALOG);
        if (! in_array($section, self::ALLOWED_SECTIONS, true)) {
            $section = self::SECTION_CATALOG;
        }

        $search = trim((string) $request->input('search', ''));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = max(10, min($perPage, 100));

        $courses = Course::query()
            ->withCount(['lessons', 'enrollments'])
            ->searchManagement($search)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->paginate($perPage)
            ->withQueryString();

        // Transform paginated data to include cover URL and extra fields
        $courses->getCollection()->transform(function (Course $course): array {
            return [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'summary' => $course->summary,
                'cover' => $course->cover,
                'is_published' => $course->is_published,
                'lessons_count' => $course->lessons_count,
                'enrollments_count' => $course->enrollments_count,
            ];
        });

        $courseOptions = Course::query()->orderBy('title')->get(['id', 'slug', 'title']);

        $selectedCourseId = (int) $request->integer('course_id', (int) ($courseOptions->first()?->id ?? 0));
        $selectedLessonId = (int) $request->integer('lesson_id', 0);

        $emptyPaginated = [
            'data' => [],
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => $perPage,
            'total' => 0,
            'from' => null,
            'to' => null,
        ];

        $lessons = $emptyPaginated;
        $tasks = $emptyPaginated;

        if ($section === self::SECTION_LESSON || $section === self::SECTION_TASK) {
            $lessonPaginator = Lesson::query()
                ->with(['course:id,slug,title'])
                ->withCount('tasks')
                ->when($selectedCourseId > 0, fn ($q) => $q->where('course_id', $selectedCourseId))
                ->orderBy('course_id')
                ->orderBy('position')
                ->paginate($perPage)
                ->withQueryString();

            $lessonPaginator->getCollection()->transform(function (Lesson $lesson): array {
                $legacyTasks = $this->extractLegacyTaskPayloads((string) $lesson->content);

                return [
                    'id' => $lesson->id,
                    'management_id' => 'topic-'.$lesson->id,
                    'course_id' => $lesson->course_id,
                    'course_slug' => $lesson->course?->slug,
                    'course_title' => $lesson->course?->title,
                    'slug' => $lesson->slug,
                    'title' => $lesson->title,
                    'description' => (string) ($lesson->description ?? ''),
                    'position' => $lesson->position,
                    'xp_reward' => $lesson->xp_reward,
                    'tasks_count' => (int) $lesson->tasks_count > 0
                        ? (int) $lesson->tasks_count
                        : $legacyTasks->count(),
                ];
            });

            $lessons = [
                'data' => $lessonPaginator->items(),
                'current_page' => $lessonPaginator->currentPage(),
                'last_page' => $lessonPaginator->lastPage(),
                'per_page' => $lessonPaginator->perPage(),
                'total' => $lessonPaginator->total(),
                'from' => $lessonPaginator->firstItem(),
                'to' => $lessonPaginator->lastItem(),
            ];
        }

        if ($section === self::SECTION_TASK) {
            if ($selectedLessonId === 0 && ! empty($lessons['data'])) {
                $selectedLessonId = (int) data_get($lessons['data'][0], 'id', 0);
            }

            $selectedLesson = Lesson::query()
                ->with('course:id,slug,title')
                ->when($selectedLessonId > 0, fn ($q) => $q->whereKey($selectedLessonId))
                ->first(['id', 'course_id', 'slug', 'title', 'content']);

            if ($selectedLesson !== null) {
                if ($selectedLesson->tasks()->exists()) {
                    $taskPaginator = LessonTask::query()
                        ->where('lesson_id', $selectedLesson->id)
                        ->with('quizQuestions:id,lesson_task_id,question,options,correct_option,explanation,sort_order')
                        ->orderBy('sort_order')
                        ->orderBy('id')
                        ->paginate($perPage)
                        ->withQueryString();

                    $taskPaginator->getCollection()->values()->transform(function (LessonTask $task, int $index) use ($selectedLesson, $taskPaginator): array {
                        $globalIndex = (($taskPaginator->currentPage() - 1) * $taskPaginator->perPage()) + $index;

                        return [
                            'id' => $task->id,
                            'management_id' => 'task-'.$task->id,
                            'is_legacy' => false,
                            'task_index' => $globalIndex,
                            'lesson_id' => $selectedLesson->id,
                            'lesson_title' => $selectedLesson->title,
                            'course_slug' => $selectedLesson->course?->slug,
                            'type' => $task->type,
                            'title' => $task->title,
                            'description' => (string) ($task->description ?? ''),
                            'minutes' => $task->minutes,
                            'video_url' => $task->video_url,
                            'quiz_questions' => $task->quizQuestions->map(fn (QuizQuestion $q): array => [
                                'question' => $q->question,
                                'options' => $q->options,
                                'correct_option' => $q->correct_option,
                                'explanation' => $q->explanation,
                            ])->values()->all(),
                        ];
                    });

                    $tasks = [
                        'data' => $taskPaginator->items(),
                        'current_page' => $taskPaginator->currentPage(),
                        'last_page' => $taskPaginator->lastPage(),
                        'per_page' => $taskPaginator->perPage(),
                        'total' => $taskPaginator->total(),
                        'from' => $taskPaginator->firstItem(),
                        'to' => $taskPaginator->lastItem(),
                    ];
                } else {
                    $legacyTasks = $this->extractLegacyTaskPayloads((string) $selectedLesson->content)
                        ->values()
                        ->map(function (array $task, int $index) use ($selectedLesson): array {
                            return [
                                'id' => -($index + 1),
                                'management_id' => 'legacy-task-'.$selectedLesson->id.'-'.($index + 1),
                                'is_legacy' => true,
                                'task_index' => $index,
                                'lesson_id' => $selectedLesson->id,
                                'lesson_title' => $selectedLesson->title,
                                'course_slug' => $selectedLesson->course?->slug,
                                'type' => (string) ($task['type'] ?? 'video'),
                                'title' => (string) ($task['title'] ?? 'Task'),
                                'description' => '',
                                'minutes' => (int) ($task['minutes'] ?? 5),
                                'video_url' => isset($task['videoUrl']) ? (string) $task['videoUrl'] : null,
                                'quiz_questions' => [],
                            ];
                        });

                    $legacyPaginator = new LengthAwarePaginator(
                        items: $legacyTasks->forPage($request->integer('page', 1), $perPage)->values()->all(),
                        total: $legacyTasks->count(),
                        perPage: $perPage,
                        currentPage: max(1, $request->integer('page', 1)),
                        options: ['path' => $request->url(), 'query' => $request->query()],
                    );

                    $tasks = [
                        'data' => $legacyPaginator->items(),
                        'current_page' => $legacyPaginator->currentPage(),
                        'last_page' => $legacyPaginator->lastPage(),
                        'per_page' => $legacyPaginator->perPage(),
                        'total' => $legacyPaginator->total(),
                        'from' => $legacyPaginator->firstItem(),
                        'to' => $legacyPaginator->lastItem(),
                    ];
                }
            }
        }

        return Inertia::render('admin/courses/index', [
            'section' => $section,
            'courses' => $courses,
            'courseOptions' => $courseOptions,
            'lessons' => $lessons,
            'tasks' => $tasks,
            'selectedCourseId' => $selectedCourseId,
            'selectedLessonId' => $selectedLessonId,
            'filters' => ['search' => $search],
        ]);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /** @return Collection<int, array<string, mixed>> */
    private function extractLegacyTaskPayloads(string $content): Collection
    {
        $decoded = json_decode($content, true);
        $tasks = data_get($decoded, 'tasks');
        if (! is_array($tasks)) {
            return collect();
        }

        return collect($tasks)->filter(fn ($task) => is_array($task));
    }

    // ── courses CRUD ─────────────────────────────────────────────────────────

    public function store(StoreAdminCourseRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $baseSlug = Str::slug($validated['title']);

        if ($baseSlug === '') {
            $baseSlug = 'course';
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (Course::query()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$suffix++;
        }

        $nextSortOrder = (int) Course::query()->max('sort_order') + 1;

        // Store cover image to disk (not as binary blob)
        $coverPath = null;
        $coverMimeType = null;
        if ($request->hasFile('cover_image') && $request->file('cover_image') !== null) {
            $coverFile = $request->file('cover_image');
            $coverPath = $coverFile->store('course-covers', 'public');
            $coverMimeType = $coverFile->getMimeType();
        }

        $course = Course::query()->create([
            'slug' => $slug,
            'title' => $validated['title'],
            'summary' => $validated['description'],
            'cover_path' => $coverPath,
            'cover_mime_type' => $coverMimeType,
            'estimated_minutes' => (int) ($validated['estimated_minutes'] ?? 30),
            'sort_order' => $nextSortOrder,
            'is_published' => (bool) ($validated['is_published'] ?? true),
        ]);

        return back(fallback: route('admin.courses.index'));
    }

    public function update(UpdateAdminCourseRequest $request, Course $course): RedirectResponse
    {
        $validated = $request->validated();

        // Store new cover image to disk if provided
        $coverPath = $course->cover_path;
        $coverMimeType = $course->cover_mime_type;
        if ($request->hasFile('cover_image') && $request->file('cover_image') !== null) {
            $coverFile = $request->file('cover_image');

            // Delete old file if it was stored on disk
            if ($coverPath !== null && Storage::disk('public')->exists($coverPath)) {
                Storage::disk('public')->delete($coverPath);
            }

            $coverPath = $coverFile->store('course-covers', 'public');
            $coverMimeType = $coverFile->getMimeType();
        }

        $course->update([
            'title' => $validated['title'],
            'summary' => $validated['description'],
            'cover_path' => $coverPath,
            'cover_mime_type' => $coverMimeType,
            'estimated_minutes' => (int) ($validated['estimated_minutes'] ?? $course->estimated_minutes),
            'is_published' => (bool) ($validated['is_published'] ?? true),
        ]);

        return back(fallback: route('admin.courses.index'));
    }

    public function destroy(Course $course): RedirectResponse
    {
        // Clean up cover file from disk
        if ($course->cover_path !== null && Storage::disk('public')->exists($course->cover_path)) {
            Storage::disk('public')->delete($course->cover_path);
        }

        if (in_array(SoftDeletes::class, class_uses_recursive($course), true)) {
            $course->forceDelete();
        } else {
            $course->delete();
        }

        return back(fallback: route('admin.courses.index'));
    }

    public function reorderCourses(ReorderAdminCoursesRequest $request): RedirectResponse
    {
        $items = collect($request->validated('items'));

        DB::transaction(function () use ($items): void {
            $items->each(function (array $item): void {
                Course::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order'] + 1000]);
            });

            $items->each(function (array $item): void {
                Course::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order']]);
            });
        });

        return back(fallback: route('admin.courses.index'));
    }

    // ── lessons CRUD ─────────────────────────────────────────────────────────

    public function storeLesson(StoreAdminLessonRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $course = Course::query()->findOrFail($validated['course_id']);

        $baseSlug = Str::slug($validated['title']);
        if ($baseSlug === '') {
            $baseSlug = 'lesson';
        }

        $slug = $baseSlug;
        $counter = 2;
        while (Lesson::query()->where('course_id', $course->id)->where('slug', $slug)->exists()) {
            $slug = sprintf('%s-%d', $baseSlug, $counter++);
        }

        $nextPosition = (int) Lesson::query()->where('course_id', $course->id)->max('position') + 1;

        Lesson::query()->create([
            'course_id' => $course->id,
            'slug' => $slug,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'content' => '',
            'position' => $nextPosition,
            'xp_reward' => (int) ($validated['xp_reward'] ?? 50),
        ]);

        return back();
    }

    public function updateLesson(UpdateAdminLessonRequest $request, Lesson $lesson): RedirectResponse
    {
        $validated = $request->validated();

        $lesson->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'xp_reward' => (int) ($validated['xp_reward'] ?? $lesson->xp_reward),
        ]);

        return back();
    }

    public function reorderLessons(ReorderAdminLessonsRequest $request): RedirectResponse
    {
        $items = collect($request->validated('items'));

        DB::transaction(function () use ($items): void {
            $items->each(function (array $item): void {
                Lesson::query()
                    ->whereKey((int) $item['id'])
                    ->update(['position' => (int) $item['position'] + 1000]);
            });

            $items->each(function (array $item): void {
                Lesson::query()
                    ->whereKey((int) $item['id'])
                    ->update(['position' => (int) $item['position']]);
            });
        });

        return back();
    }

    public function destroyLesson(Lesson $lesson): RedirectResponse
    {
        $lesson->delete();

        return back();
    }

    public function togglePublish(TogglePublishAdminCourseRequest $request, Course $course): RedirectResponse
    {
        $isPublished = $request->has('is_published')
            ? (bool) $request->boolean('is_published')
            : ! $course->is_published;

        $course->update([
            'is_published' => $isPublished,
        ]);

        return back();
    }

    // ── tasks CRUD ───────────────────────────────────────────────────────────

    public function storeTask(StoreAdminLessonTaskRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $lesson = Lesson::query()->findOrFail($validated['lesson_id']);
        $documentName = null;
        $conversionStatus = null;
        $videoProcessingStatus = null;

        if ($validated['type'] === 'video' && ! empty($validated['video_url'])) {
            $videoProcessingStatus = 'pending';
        }

        if ($validated['type'] === 'read') {
            $uploadedDocument = $request->file('document');
            if ($uploadedDocument !== null) {
                $storedPath = $uploadedDocument->store('lesson-documents', 'public');
                $documentName = $uploadedDocument->getClientOriginalName();
                $conversionStatus = 'pending';

                // Dispatch the PDF conversion job
                ConvertLessonDocument::dispatch($storedPath, $lesson->id);
            }
        }

        $nextOrder = (int) LessonTask::query()->where('lesson_id', $lesson->id)->max('sort_order') + 1;

        $createdTask = DB::transaction(function () use ($validated, $lesson, $documentName, $conversionStatus, $nextOrder, $videoProcessingStatus): LessonTask {
            $task = LessonTask::query()->create([
                'lesson_id' => $lesson->id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'type' => $validated['type'],
                'minutes' => (int) $validated['minutes'],
                'video_url' => $validated['type'] === 'video' ? ($validated['video_url'] ?? null) : null,
                'video_processing_status' => $videoProcessingStatus,
                'video_mp4_url' => null,
                'document_name' => $documentName,
                'conversion_status' => $conversionStatus,
                'pdf_url' => null,
                'sort_order' => $nextOrder,
                'published_at' => null,
                'published_by' => null,
            ]);

            if ($validated['type'] === 'quiz') {
                collect($validated['quiz_questions'] ?? [])
                    ->values()
                    ->each(function (array $question, int $index) use ($task): void {
                        QuizQuestion::query()->create([
                            'lesson_task_id' => $task->id,
                            'question' => $question['question'],
                            'options' => $question['options'],
                            'correct_option' => (int) $question['correct_option'],
                            'explanation' => $question['explanation'] ?? null,
                            'sort_order' => $index + 1,
                        ]);
                    });
            }

            return $task;
        });

        if ($createdTask->type === 'video' && $createdTask->video_processing_status === 'pending') {
            ConvertLessonVideo::dispatch($createdTask->id);
        }

        return back();
    }

    public function updateTask(UpdateAdminLessonTaskRequest $request, LessonTask $task): RedirectResponse
    {
        $validated = $request->validated();
        $documentName = $task->document_name;
        $conversionStatus = $task->conversion_status;
        $pdfUrl = $task->pdf_url;
        $videoProcessingStatus = $task->video_processing_status;
        $videoMp4Url = $task->video_mp4_url;

        if ($validated['type'] === 'read') {
            $uploadedDocument = $request->file('document');
            if ($uploadedDocument !== null) {
                $storedPath = $uploadedDocument->store('lesson-documents', 'public');
                $documentName = $uploadedDocument->getClientOriginalName();
                $conversionStatus = 'pending';
                $pdfUrl = null;

                // Dispatch the PDF conversion job
                ConvertLessonDocument::dispatch($storedPath, $task->lesson_id);
            }
        } else {
            $documentName = null;
            $conversionStatus = null;
            $pdfUrl = null;
        }

        if ($validated['type'] === 'video') {
            $videoProcessingStatus = ! empty($validated['video_url']) ? 'pending' : null;
            $videoMp4Url = null;
        } else {
            $videoProcessingStatus = null;
            $videoMp4Url = null;
        }

        DB::transaction(function () use ($task, $validated, $documentName, $conversionStatus, $pdfUrl, $videoProcessingStatus, $videoMp4Url): void {
            $task->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'type' => $validated['type'],
                'minutes' => (int) $validated['minutes'],
                'video_url' => $validated['type'] === 'video' ? ($validated['video_url'] ?? null) : null,
                'video_processing_status' => $videoProcessingStatus,
                'video_mp4_url' => $videoMp4Url,
                'document_name' => $documentName,
                'conversion_status' => $conversionStatus,
                'pdf_url' => $pdfUrl,
            ]);

            $task->quizQuestions()->delete();

            if ($validated['type'] === 'quiz') {
                collect($validated['quiz_questions'] ?? [])
                    ->values()
                    ->each(function (array $question, int $index) use ($task): void {
                        QuizQuestion::query()->create([
                            'lesson_task_id' => $task->id,
                            'question' => $question['question'],
                            'options' => $question['options'],
                            'correct_option' => (int) $question['correct_option'],
                            'explanation' => $question['explanation'] ?? null,
                            'sort_order' => $index + 1,
                        ]);
                    });
            }
        });

        if ($task->type === 'video' && $task->video_processing_status === 'pending') {
            ConvertLessonVideo::dispatch($task->id);
        }

        return back();
    }

    public function reorderTasks(ReorderAdminTasksRequest $request): RedirectResponse
    {
        $items = collect($request->validated('items'));

        DB::transaction(function () use ($items): void {
            $items->each(function (array $item): void {
                LessonTask::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order'] + 1000]);
            });

            $items->each(function (array $item): void {
                LessonTask::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order']]);
            });
        });

        return back();
    }

    public function destroyTask(LessonTask $task): RedirectResponse
    {
        $lessonId = $task->lesson_id;
        $courseId = $task->lesson->course_id;
        $task->delete();

        return back();
    }
}
