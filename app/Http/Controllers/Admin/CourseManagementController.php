<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminCourseRequest;
use App\Http\Requests\Admin\StoreAdminLessonRequest;
use App\Http\Requests\Admin\StoreAdminLessonTaskRequest;
use App\Http\Requests\Admin\UpdateAdminCourseRequest;
use App\Http\Requests\Admin\UpdateAdminLessonRequest;
use App\Http\Requests\Admin\UpdateAdminLessonTaskRequest;
use App\Jobs\ConvertLessonDocument;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $courses = Course::query()
            ->withCount(['lessons', 'enrollments'])
            ->searchManagement($search)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->paginate(10)
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

        $lessons = collect();
        $tasks = collect();

        if ($section === self::SECTION_LESSON || $section === self::SECTION_TASK) {
            $lessons = Lesson::query()
                ->with('course:id,slug,title')
                ->withCount('tasks')
                ->when($selectedCourseId > 0, fn ($q) => $q->where('course_id', $selectedCourseId))
                ->orderBy('course_id')
                ->orderBy('position')
                ->get(['id', 'course_id', 'slug', 'title', 'position', 'xp_reward', 'content'])
                ->map(function (Lesson $lesson): array {
                    $legacyTasks = $this->extractLegacyTaskPayloads((string) $lesson->content);

                    return [
                        'id' => $lesson->id,
                        'course_id' => $lesson->course_id,
                        'course_slug' => $lesson->course?->slug,
                        'course_title' => $lesson->course?->title,
                        'slug' => $lesson->slug,
                        'title' => $lesson->title,
                        'position' => $lesson->position,
                        'xp_reward' => $lesson->xp_reward,
                        'tasks_count' => (int) $lesson->tasks_count > 0
                            ? (int) $lesson->tasks_count
                            : $legacyTasks->count(),
                    ];
                });
        }

        if ($section === self::SECTION_TASK) {
            if ($selectedLessonId === 0 && $lessons->isNotEmpty()) {
                $selectedLessonId = (int) $lessons->first()['id'];
            }

            $selectedLesson = Lesson::query()
                ->with(['course:id,slug,title', 'tasks:id,lesson_id,title,type,minutes,video_url,sort_order'])
                ->when($selectedLessonId > 0, fn ($q) => $q->whereKey($selectedLessonId))
                ->first(['id', 'course_id', 'slug', 'title', 'content']);

            if ($selectedLesson !== null) {
                $tasks = $selectedLesson->tasks->isNotEmpty()
                    ? $selectedLesson->tasks
                        ->load('quizQuestions:id,lesson_task_id,question,options,correct_option,explanation,sort_order')
                        ->values()
                        ->map(function (LessonTask $task, int $index) use ($selectedLesson): array {
                            return [
                                'id' => $task->id,
                                'task_index' => $index,
                                'lesson_id' => $selectedLesson->id,
                                'lesson_title' => $selectedLesson->title,
                                'course_slug' => $selectedLesson->course?->slug,
                                'type' => $task->type,
                                'title' => $task->title,
                                'minutes' => $task->minutes,
                                'video_url' => $task->video_url,
                                'quiz_questions' => $task->quizQuestions->map(fn (QuizQuestion $q): array => [
                                    'question' => $q->question,
                                    'options' => $q->options,
                                    'correct_option' => $q->correct_option,
                                    'explanation' => $q->explanation,
                                ])->values()->all(),
                            ];
                        })
                    : $this->extractLegacyTaskPayloads((string) $selectedLesson->content)
                        ->values()
                        ->map(function (array $task, int $index) use ($selectedLesson): array {
                            return [
                                'id' => 0,
                                'task_index' => $index,
                                'lesson_id' => $selectedLesson->id,
                                'lesson_title' => $selectedLesson->title,
                                'course_slug' => $selectedLesson->course?->slug,
                                'type' => (string) ($task['type'] ?? 'video'),
                                'title' => (string) ($task['title'] ?? 'Task'),
                                'minutes' => (int) ($task['minutes'] ?? 5),
                                'video_url' => isset($task['videoUrl']) ? (string) $task['videoUrl'] : null,
                                'quiz_questions' => [],
                            ];
                        });
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

        if (in_array(SoftDeletes::class, class_uses_recursive($course), true)) {
            $course->forceDelete();
        } else {
            $course->delete();
        }

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
            'xp_reward' => (int) ($validated['xp_reward'] ?? $lesson->xp_reward),
        ]);

        return back();
    }

    public function destroyLesson(Lesson $lesson): RedirectResponse
    {
        $courseId = $lesson->course_id;
        $lesson->delete();

        return back();
    }

    // ── tasks CRUD ───────────────────────────────────────────────────────────

    public function storeTask(StoreAdminLessonTaskRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $lesson = Lesson::query()->findOrFail($validated['lesson_id']);
        $documentName = null;
        $conversionStatus = null;

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

        DB::transaction(function () use ($validated, $lesson, $documentName, $conversionStatus, $nextOrder): void {
            $task = LessonTask::query()->create([
                'lesson_id' => $lesson->id,
                'title' => $validated['title'],
                'type' => $validated['type'],
                'minutes' => (int) $validated['minutes'],
                'video_url' => $validated['type'] === 'video' ? ($validated['video_url'] ?? null) : null,
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
        });

        return back();
    }

    public function updateTask(UpdateAdminLessonTaskRequest $request, LessonTask $task): RedirectResponse
    {
        $validated = $request->validated();
        $documentName = $task->document_name;
        $conversionStatus = $task->conversion_status;
        $pdfUrl = $task->pdf_url;

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

        DB::transaction(function () use ($task, $validated, $documentName, $conversionStatus, $pdfUrl): void {
            $task->update([
                'title' => $validated['title'],
                'type' => $validated['type'],
                'minutes' => (int) $validated['minutes'],
                'video_url' => $validated['type'] === 'video' ? ($validated['video_url'] ?? null) : null,
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
