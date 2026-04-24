<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\ExtractsLegacyTasks;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdminCoursesRequest;
use App\Http\Requests\Admin\StoreAdminCourseRequest;
use App\Http\Requests\Admin\TogglePublishAdminCourseRequest;
use App\Http\Requests\Admin\UpdateAdminCourseRequest;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    use ExtractsLegacyTasks;

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
                        : count($legacyTasks),
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
                    $legacyTasks = collect($this->extractLegacyTaskPayloads((string) $selectedLesson->content))
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

        Course::query()->create([
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

        $course->delete();

        return back(fallback: route('admin.courses.index'));
    }

    public function reorder(ReorderAdminCoursesRequest $request): RedirectResponse
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
}
