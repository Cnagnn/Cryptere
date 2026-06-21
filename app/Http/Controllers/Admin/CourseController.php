<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\ExtractsLegacyTasks;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdminCoursesRequest;
use App\Http\Requests\Admin\StoreAdminCourseRequest;
use App\Http\Requests\Admin\TogglePublishAdminCourseRequest;
use App\Http\Requests\Admin\UpdateAdminCourseRequest;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use App\Models\ContentVersion;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
use App\Models\QuestionBank;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use App\Models\TaskProgress;
use App\Models\Topic;
use App\Services\AuditService;
use App\Services\CacheService;
use App\Support\CourseAssetStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    use ExtractsLegacyTasks;

    private const SECTION_CATALOG = 'catalog';

    private const SECTION_LESSON = 'lesson';

    private const SECTION_TASK = 'task';

    private const SECTION_ASSESSMENT = 'assessment';

    private const ALLOWED_SECTIONS = [
        self::SECTION_CATALOG,
        self::SECTION_LESSON,
        self::SECTION_TASK,
        self::SECTION_ASSESSMENT,
    ];

    public function __construct(
        private readonly CourseAssetStorage $courseAssets,
    ) {}

    // ── index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $section = (string) $request->input('section', self::SECTION_CATALOG);
        if (! in_array($section, self::ALLOWED_SECTIONS, true)) {
            $section = self::SECTION_CATALOG;
        }

        $search = trim((string) $request->input('search', ''));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = max(10, min($perPage, 9999));

        $emptyPaginated = [
            'data' => [],
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => $perPage,
            'total' => 0,
            'from' => null,
            'to' => null,
        ];

        $courses = $emptyPaginated;
        $courseOptions = collect();
        $allLessons = [];

        if ($section === self::SECTION_CATALOG) {
            $coursePaginator = Course::query()
                ->select(['id', 'slug', 'title', 'summary', 'cover_path', 'status', 'version', 'published_by', 'sort_order', 'created_at', 'updated_at'])
                ->with('publishedBy:id,name')
                ->withCount(['enrollments', 'lessons', 'tasks'])
                ->searchManagement($search)
                ->orderBy('sort_order')
                ->orderBy('title')
                ->paginate($perPage)
                ->withQueryString();

            $coursePaginator->getCollection()->transform(function (Course $course): array {
                return [
                    'id' => $course->id,
                    'slug' => $course->slug,
                    'title' => $course->title,
                    'summary' => $course->summary,
                    'cover' => $course->cover,
                    'status' => $course->status,
                    'is_published' => $course->status === Course::STATUS_PUBLISHED,
                    'version' => $course->version,
                    'published_by_name' => $course->publishedBy?->name,
                    'lessons_count' => $course->lessons_count,
                    'tasks_count' => $course->tasks_count,
                    'enrollments_count' => $course->enrollments_count,
                    'created_at' => $course->created_at?->toIso8601String(),
                    'updated_at' => $course->updated_at?->toIso8601String(),
                ];
            });

            $courses = $coursePaginator;
        }

        if ($section !== self::SECTION_CATALOG) {
            $courseOptions = Course::query()->orderBy('title')->get(['id', 'slug', 'title']);
        }

        if (in_array($section, [self::SECTION_TASK, self::SECTION_ASSESSMENT], true)) {
            $allLessons = Lesson::query()
                ->orderBy('course_id')
                ->orderBy('position')
                ->get(['id', 'course_id', 'title'])
                ->map(fn (Lesson $l) => [
                    'id' => $l->id,
                    'course_id' => $l->course_id,
                    'title' => $l->title,
                ])
                ->values()
                ->all();
        }

        $defaultCourseId = in_array($section, [self::SECTION_LESSON, self::SECTION_TASK], true) ? 0 : (int) ($courseOptions->first()?->id ?? 0);
        $selectedCourseId = (int) $request->integer('course_id', $defaultCourseId);
        $selectedLessonId = (int) $request->integer('lesson_id', 0);
        $selectedLesson = null;

        if ($section === self::SECTION_TASK) {
            if ($selectedLessonId > 0) {
                $selectedLesson = Lesson::query()
                    ->with('course:id,slug,title')
                    ->whereKey($selectedLessonId)
                    ->first(['id', 'course_id', 'slug', 'title', 'content']);

                if ($selectedLesson === null) {
                    $selectedLessonId = 0;
                } else {
                    $selectedCourseId = (int) $selectedLesson->course_id;
                }
            }
        }

        $lessons = $emptyPaginated;
        $tasks = $emptyPaginated;

        if ($section === self::SECTION_LESSON || $section === self::SECTION_TASK) {
            $lessonPaginator = Lesson::query()
                ->select(['id', 'course_id', 'topic_id', 'prerequisite_lesson_id', 'slug', 'title', 'description', 'content', 'position', 'status', 'version', 'published_by', 'created_at', 'updated_at'])
                ->with(['course:id,slug,title', 'topic:id,name', 'publishedBy:id,name'])
                ->withCount('tasks')
                ->when($selectedCourseId > 0, fn ($q) => $q->where('course_id', $selectedCourseId))
                ->orderBy('course_id')
                ->orderBy('position')
                ->paginate($perPage)
                ->withQueryString();

            $lessonPaginator->getCollection()->transform(function (Lesson $lesson): array {
                return [
                    'id' => $lesson->id,
                    'management_id' => 'topic-'.$lesson->id,
                    'course_id' => $lesson->course_id,
                    'course_slug' => $lesson->course?->slug,
                    'course_title' => $lesson->course?->title,
                    'topic_id' => $lesson->topic_id,
                    'topic_name' => $lesson->topic?->name,
                    'prerequisite_lesson_id' => $lesson->prerequisite_lesson_id,
                    'slug' => $lesson->slug,
                    'title' => $lesson->title,
                    'description' => (string) ($lesson->description ?? ''),
                    'content' => (string) ($lesson->content ?? ''),
                    'position' => $lesson->position,
                    'status' => $lesson->status,
                    'version' => $lesson->version,
                    'published_by_name' => $lesson->publishedBy?->name,
                    'tasks_count' => $lesson->tasks_count,
                    'created_at' => $lesson->created_at?->toIso8601String(),
                    'updated_at' => $lesson->updated_at?->toIso8601String(),
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
            if ($selectedLesson !== null) {
                if ($selectedLesson->tasks()->exists()) {
                    $taskPaginator = LessonTask::query()
                        ->select(['id', 'lesson_id', 'type', 'title', 'description', 'sort_order', 'status', 'version', 'published_by', 'prerequisite_task_id', 'video_url', 'document_name', 'conversion_status', 'pdf_url', 'created_at', 'updated_at'])
                        ->where('lesson_id', $selectedLesson->id)
                        ->with([
                            'quizQuestions' => fn ($q) => $q->select(['id', 'lesson_task_id', 'question', 'options', 'correct_option', 'explanation', 'sort_order'])->orderBy('sort_order'),
                            'publishedBy:id,name',
                        ])
                        ->orderBy('sort_order')
                        ->orderBy('id')
                        ->paginate($perPage)
                        ->withQueryString();

                    $taskPaginator->getCollection()->transform(function (LessonTask $task, int $index) use ($selectedLesson, $taskPaginator): array {
                        $globalIndex = (($taskPaginator->currentPage() - 1) * $taskPaginator->perPage()) + $index;

                        return [
                            'id' => $task->id,
                            'management_id' => 'task-'.$task->id,
                            'is_legacy' => false,
                            'task_index' => $globalIndex,
                            'lesson_id' => $selectedLesson->id,
                            'lesson_title' => $selectedLesson->title,
                            'course_id' => $selectedLesson->course_id,
                            'course_slug' => $selectedLesson->course?->slug,
                            'type' => $task->type,
                            'title' => $task->title,
                            'description' => (string) ($task->description ?? ''),
                            'content' => (string) ($task->description ?? ''),
                            'position' => $task->sort_order,
                            'status' => $task->status,
                            'version' => $task->version,
                            'published_by_name' => $task->publishedBy?->name,
                            'prerequisite_task_id' => $task->prerequisite_task_id,
                            'video_url' => $task->video_url,
                            'document_name' => $task->document_name,
                            'conversion_status' => $task->conversion_status,
                            'pdf_url' => $task->pdf_url,
                            'created_at' => $task->created_at?->toIso8601String(),
                            'updated_at' => $task->updated_at?->toIso8601String(),
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
                                'video_url' => isset($task['videoUrl']) ? (string) $task['videoUrl'] : null,
                                'created_at' => null,
                                'updated_at' => null,
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
            } else {
                // No lesson selected — show all tasks across all lessons
                $taskPaginator = LessonTask::query()
                    ->select(['id', 'lesson_id', 'type', 'title', 'description', 'sort_order', 'status', 'version', 'published_by', 'prerequisite_task_id', 'video_url', 'document_name', 'conversion_status', 'pdf_url', 'created_at', 'updated_at'])
                    ->with([
                        'lesson:id,title,course_id',
                        'lesson.course:id,slug,title',
                        'quizQuestions' => fn ($q) => $q->select(['id', 'lesson_task_id', 'question', 'options', 'correct_option', 'explanation', 'sort_order'])->orderBy('sort_order'),
                        'publishedBy:id,name',
                    ])
                    ->when($selectedCourseId > 0, fn ($q) => $q->whereIn('lesson_id', fn ($sub) => $sub->select('id')->from('lessons')->where('course_id', $selectedCourseId)))
                    ->orderBy('lesson_id')
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->paginate($perPage)
                    ->withQueryString();

                $taskPaginator->getCollection()->transform(function (LessonTask $task, int $index) use ($taskPaginator): array {
                    $globalIndex = (($taskPaginator->currentPage() - 1) * $taskPaginator->perPage()) + $index;

                    return [
                        'id' => $task->id,
                        'management_id' => 'task-'.$task->id,
                        'is_legacy' => false,
                        'task_index' => $globalIndex,
                        'lesson_id' => $task->lesson_id,
                        'lesson_title' => $task->lesson?->title,
                        'course_id' => $task->lesson?->course_id,
                        'course_slug' => $task->lesson?->course?->slug,
                        'type' => $task->type,
                        'title' => $task->title,
                        'description' => (string) ($task->description ?? ''),
                        'content' => (string) ($task->description ?? ''),
                        'position' => $task->sort_order,
                        'status' => $task->status,
                        'version' => $task->version,
                        'published_by_name' => $task->publishedBy?->name,
                        'prerequisite_task_id' => $task->prerequisite_task_id,
                        'video_url' => $task->video_url,
                        'document_name' => $task->document_name,
                        'conversion_status' => $task->conversion_status,
                        'pdf_url' => $task->pdf_url,
                        'created_at' => $task->created_at?->toIso8601String(),
                        'updated_at' => $task->updated_at?->toIso8601String(),
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
            }
        }

        // ── Assessment section data ──────────────────────────────────────────
        $assessments = $emptyPaginated;
        $assessmentQuestions = [];
        $selectedAssessmentId = 0;
        $assessmentTopics = [];
        $assessmentFilters = ['search' => '', 'bloom_level' => null];
        $courseFilterSelected = false;
        $questionBank = $emptyPaginated;

        if ($section === self::SECTION_ASSESSMENT) {
            $bloomFilter = $request->input('bloom_level');
            $courseFilterSelected = $request->has('course_id');
            $assessmentCourseId = $courseFilterSelected ? (int) $request->integer('course_id') : 0;

            $assessmentPaginator = Assessment::query()
                ->select(['id', 'slug', 'title', 'description', 'course_id', 'topic_id', 'bloom_level', 'grading_type', 'passing_score', 'max_attempts', 'time_limit_minutes', 'status', 'version', 'published_by', 'available_from', 'available_until', 'sort_order', 'created_at', 'updated_at'])
                ->with(['course:id,title', 'publishedBy:id,name'])
                ->searchManagement($search)
                ->when($bloomFilter, fn ($q) => $q->where('bloom_level', $bloomFilter))
                ->when($assessmentCourseId > 0, fn ($q) => $q->where('course_id', $assessmentCourseId))
                ->withCount('questions')
                ->orderBy('course_id')
                ->orderBy('sort_order')
                ->paginate($perPage)
                ->withQueryString();

            $assessmentPaginator->getCollection()->transform(function (Assessment $a): array {
                return [
                    'id' => $a->id,
                    'slug' => $a->slug,
                    'title' => $a->title,
                    'description' => $a->description,
                    'course_id' => $a->course_id,
                    'course_title' => $a->course?->title,
                    'topic_id' => $a->topic_id,
                    'bloom_level' => $a->bloom_level,
                    'grading_type' => $a->grading_type,
                    'passing_score' => $a->passing_score,
                    'max_attempts' => $a->max_attempts,
                    'time_limit_minutes' => $a->time_limit_minutes,
                    'status' => $a->status,
                    'is_published' => $a->status === Assessment::STATUS_PUBLISHED,
                    'version' => $a->version,
                    'published_by_name' => $a->publishedBy?->name,
                    'available_from' => $a->available_from,
                    'available_until' => $a->available_until,
                    'sort_order' => $a->sort_order,
                    'questions_count' => $a->questions_count,
                    'created_at' => $a->created_at?->toIso8601String(),
                    'updated_at' => $a->updated_at?->toIso8601String(),
                ];
            });

            $assessments = [
                'data' => $assessmentPaginator->items(),
                'current_page' => $assessmentPaginator->currentPage(),
                'last_page' => $assessmentPaginator->lastPage(),
                'per_page' => $assessmentPaginator->perPage(),
                'total' => $assessmentPaginator->total(),
                'from' => $assessmentPaginator->firstItem(),
                'to' => $assessmentPaginator->lastItem(),
            ];

            // All assessments for the dropdown (ungrouped by pagination)
            $allAssessments = Assessment::query()
                ->with('course:id,title')
                ->orderBy('course_id')
                ->orderBy('sort_order')
                ->get(['id', 'title', 'course_id', 'bloom_level'])
                ->map(fn (Assessment $a) => [
                    'id' => $a->id,
                    'title' => $a->title,
                    'course_id' => $a->course_id,
                    'course_title' => $a->course?->title,
                ])
                ->values()
                ->all();

            $selectedAssessmentId = $request->integer('assessment_id');

            if ($selectedAssessmentId > 0) {
                $assessmentQuestions = AssessmentQuestion::query()
                    ->select(['id', 'assessment_id', 'question_bank_id', 'question_text', 'question_type', 'options', 'correct_answer', 'points', 'explanation', 'rubric', 'sort_order', 'created_at', 'updated_at'])
                    ->where('assessment_id', $selectedAssessmentId)
                    ->with(['questionBank:id,title', 'assessment:id,title,bloom_level,course_id', 'assessment.course:id,title'])
                    ->orderBy('sort_order')
                    ->get()
                    ->makeVisible('correct_answer')
                    ->map(fn (AssessmentQuestion $question): array => [
                        ...$question->toArray(),
                        'source_badge' => $question->question_bank_id ? 'From Bank' : 'Local',
                        'question_bank_title' => $question->questionBank?->title,
                        'assessment_title' => $question->assessment?->title,
                        'assessment_bloom_level' => $question->assessment?->bloom_level,
                        'course_title' => $question->assessment?->course?->title,
                    ])
                    ->values()
                    ->all();
            } else {
                $assessmentQuestions = AssessmentQuestion::query()
                    ->select(['assessment_questions.id', 'assessment_questions.assessment_id', 'assessment_questions.question_bank_id', 'assessment_questions.question_text', 'assessment_questions.question_type', 'assessment_questions.options', 'assessment_questions.correct_answer', 'assessment_questions.points', 'assessment_questions.explanation', 'assessment_questions.rubric', 'assessment_questions.sort_order', 'assessment_questions.created_at', 'assessment_questions.updated_at'])
                    ->with(['questionBank:id,title', 'assessment:id,title,bloom_level,course_id,sort_order', 'assessment.course:id,title'])
                    ->join('assessments', 'assessment_questions.assessment_id', '=', 'assessments.id')
                    ->when($assessmentCourseId > 0, fn ($q) => $q->where('assessments.course_id', $assessmentCourseId))
                    ->orderBy('assessments.course_id')
                    ->orderBy('assessments.sort_order')
                    ->orderBy('assessment_questions.sort_order')
                    ->get()
                    ->makeVisible('correct_answer')
                    ->map(fn (AssessmentQuestion $question): array => [
                        ...$question->toArray(),
                        'source_badge' => $question->question_bank_id ? 'From Bank' : 'Local',
                        'question_bank_title' => $question->questionBank?->title,
                        'assessment_title' => $question->assessment?->title,
                        'assessment_bloom_level' => $question->assessment?->bloom_level,
                        'course_title' => $question->assessment?->course?->title,
                    ])
                    ->values()
                    ->all();
            }

            $bankPaginator = QuestionBank::query()
                ->select(['id', 'title', 'category', 'bloom_level', 'question_type', 'question_text', 'options', 'correct_answer', 'explanation', 'rubric', 'points', 'is_active', 'times_used', 'created_by', 'created_at', 'updated_at'])
                ->active()
                ->when($search, fn ($q) => $q->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('question_text', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                }))
                ->when($bloomFilter, fn ($q) => $q->where('bloom_level', $bloomFilter))
                ->with('creator:id,name')
                ->withCount('assessmentQuestions')
                ->orderByDesc('updated_at')
                ->paginate($perPage, ['*'], 'question_bank_page')
                ->withQueryString();

            $bankPaginator->getCollection()->transform(fn (QuestionBank $question): array => [
                'id' => $question->id,
                'title' => $question->title,
                'category' => $question->category,
                'bloom_level' => $question->bloom_level,
                'question_type' => $question->question_type,
                'question_text' => $question->question_text,
                'options' => $question->options,
                'correct_answer' => $question->correct_answer,
                'explanation' => $question->explanation,
                'rubric' => $question->rubric,
                'points' => $question->points,
                'is_active' => $question->is_active,
                'times_used' => $question->times_used,
                'assessment_questions_count' => $question->assessment_questions_count,
                'creator_name' => $question->creator?->name,
                'source_badge' => 'Bank',
                'created_at' => $question->created_at?->toIso8601String(),
                'updated_at' => $question->updated_at?->toIso8601String(),
            ]);

            $questionBank = [
                'data' => $bankPaginator->items(),
                'current_page' => $bankPaginator->currentPage(),
                'last_page' => $bankPaginator->lastPage(),
                'per_page' => $bankPaginator->perPage(),
                'total' => $bankPaginator->total(),
                'from' => $bankPaginator->firstItem(),
                'to' => $bankPaginator->lastItem(),
            ];

            $assessmentTopics = Topic::orderBy('name')->get(['id', 'name']);
            $assessmentFilters = [
                'search' => $search,
                'bloom_level' => $bloomFilter,
            ];

            // Override selectedCourseId for assessment section
            $selectedCourseId = $assessmentCourseId;
        }

        $versionHistories = $this->buildVersionHistories(
            courses: $this->paginatedItems($courses),
            lessons: data_get($lessons, 'data', []),
            tasks: data_get($tasks, 'data', []),
            assessments: data_get($assessments, 'data', []),
        );

        return Inertia::render('admin/courses/index', [
            'section' => $section,
            'courses' => $courses,
            'courseOptions' => $courseOptions,
            'allLessons' => $allLessons,
            'lessons' => $lessons,
            'tasks' => $tasks,
            'selectedCourseId' => $selectedCourseId,
            'selectedLessonId' => $selectedLessonId,
            'filters' => ['search' => $search],
            // Assessment section data
            'assessments' => $assessments,
            'allAssessments' => $allAssessments ?? [],
            'assessmentQuestions' => $assessmentQuestions,
            'selectedAssessmentId' => $selectedAssessmentId,
            'assessmentTopics' => $assessmentTopics,
            'assessmentFilters' => $assessmentFilters,
            'courseFilterSelected' => $courseFilterSelected,
            'questionBank' => $questionBank,
            'versionHistories' => $versionHistories,
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function paginatedItems(mixed $value): array
    {
        if (is_array($value)) {
            return data_get($value, 'data', []);
        }

        if (method_exists($value, 'items')) {
            return $value->items();
        }

        return [];
    }

    /**
     * @param  array<int, array<string, mixed>>  $courses
     * @param  array<int, array<string, mixed>>  $lessons
     * @param  array<int, array<string, mixed>>  $tasks
     * @param  array<int, array<string, mixed>>  $assessments
     * @return array<string, array<int, array<int, array<string, mixed>>>>
     */
    private function buildVersionHistories(array $courses, array $lessons, array $tasks, array $assessments): array
    {
        return [
            'courses' => $this->versionsFor(Course::class, collect($courses)->pluck('id')->filter()->all()),
            'lessons' => $this->versionsFor(Lesson::class, collect($lessons)->pluck('id')->filter()->all()),
            'tasks' => $this->versionsFor(LessonTask::class, collect($tasks)->pluck('id')->filter(fn ($id) => (int) $id > 0)->all()),
            'assessments' => $this->versionsFor(Assessment::class, collect($assessments)->pluck('id')->filter()->all()),
        ];
    }

    /**
     * @param  class-string  $modelClass
     * @param  array<int, int|string>  $ids
     * @return array<int, array<int, array<string, mixed>>>
     */
    private function versionsFor(string $modelClass, array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return ContentVersion::query()
            ->select(['id', 'versionable_type', 'versionable_id', 'version_number', 'changed_fields', 'change_summary', 'created_by', 'created_at', 'restored_at'])
            ->where('versionable_type', $modelClass)
            ->whereIn('versionable_id', $ids)
            ->with('creator:id,name')
            ->orderByDesc('version_number')
            ->get()
            ->groupBy('versionable_id')
            ->map(fn ($versions) => $versions->map(fn (ContentVersion $version): array => [
                'id' => $version->id,
                'version_number' => $version->version_number,
                'changed_fields' => $version->changed_fields ?? [],
                'change_summary' => $version->change_summary,
                'creator_name' => $version->creator?->name,
                'created_at' => $version->created_at?->toIso8601String(),
                'restored_at' => $version->restored_at?->toIso8601String(),
            ])->values()->all())
            ->all();
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

        // Store cover image to disk
        $coverPath = null;
        if ($request->hasFile('cover_image') && $request->file('cover_image') !== null) {
            $coverFile = $request->file('cover_image');
            $coverPath = $this->courseAssets->storeUploadedFile($coverFile, 'course-covers');
        }

        $course = Course::query()->create([
            'slug' => $slug,
            'title' => $validated['title'],
            'summary' => $validated['description'],
            'cover_path' => $coverPath,
            'sort_order' => $nextSortOrder,
            'is_published' => (bool) ($validated['is_published'] ?? false),
            'status' => $validated['status'] ?? 'draft',
            'version' => 1,
            'published_by' => null,
        ]);

        app(AuditService::class)->log($request->user(), 'created', $course);

        CacheService::invalidateCourseCatalog();

        return back(fallback: route('admin.courses.index'));
    }

    public function update(UpdateAdminCourseRequest $request, Course $course): RedirectResponse
    {
        $validated = $request->validated();

        // Store new cover image to disk if provided
        $coverPath = $course->cover_path;
        if ($request->hasFile('cover_image') && $request->file('cover_image') !== null) {
            $coverFile = $request->file('cover_image');

            // Delete old file if it was stored on disk
            if ($coverPath !== null) {
                $this->courseAssets->deleteExisting($coverPath);
            }

            $coverPath = $this->courseAssets->storeUploadedFile($coverFile, 'course-covers');
        }

        $updateData = [
            'title' => $validated['title'],
            'summary' => $validated['description'],
            'cover_path' => $coverPath,
            'is_published' => (bool) ($validated['is_published'] ?? true),
        ];

        // Handle status if provided
        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }

        // Increment version on update
        $updateData['version'] = $course->version + 1;

        $course->update($updateData);

        app(AuditService::class)->log($request->user(), 'updated', $course);

        CacheService::invalidateCourseCatalog();

        return back(fallback: route('admin.courses.index'));
    }

    public function destroy(Course $course): RedirectResponse
    {
        $this->authorize('delete', $course);

        $lessonIds = $course->lessons()->pluck('id');
        $taskIds = LessonTask::query()->whereIn('lesson_id', $lessonIds)->pluck('id');
        $assessmentIds = $course->assessments()->pluck('id');

        if (
            $course->enrollments()->exists()
            || LessonProgress::query()->whereIn('lesson_id', $lessonIds)->exists()
            || TaskProgress::query()->whereIn('lesson_task_id', $taskIds)->exists()
            || QuizSubmission::query()->whereIn('lesson_task_id', $taskIds)->exists()
            || AssessmentSubmission::query()->whereIn('assessment_id', $assessmentIds)->exists()
        ) {
            return back()->withErrors([
                'course' => __('Archive this course instead. It already has learner history.'),
            ]);
        }

        // Clean up cover file from disk
        if ($course->cover_path !== null) {
            $this->courseAssets->deleteExisting($course->cover_path);
        }

        app(AuditService::class)->log(request()->user(), 'deleted', $course);

        $course->delete();

        CacheService::invalidateCourseCatalog();

        return back(fallback: route('admin.courses.index'));
    }

    public function reorder(ReorderAdminCoursesRequest $request): RedirectResponse
    {
        $sourceId = $request->integer('source_id');
        $targetId = $request->integer('target_id');

        $source = Course::findOrFail($sourceId);
        $target = Course::findOrFail($targetId);

        DB::transaction(function () use ($source, $target): void {
            $sourceSortOrder = $source->sort_order;
            $targetSortOrder = $target->sort_order;

            if ($sourceSortOrder < $targetSortOrder) {
                // Moving down: decrement items between source and target
                Course::whereBetween('sort_order', [$sourceSortOrder + 1, $targetSortOrder])
                    ->decrement('sort_order');
            } else {
                // Moving up: increment items between target and source
                Course::whereBetween('sort_order', [$targetSortOrder, $sourceSortOrder - 1])
                    ->increment('sort_order');
            }

            $source->update(['sort_order' => $targetSortOrder]);
        });

        return back(fallback: route('admin.courses.index'));
    }

    public function togglePublish(TogglePublishAdminCourseRequest $request, Course $course): RedirectResponse
    {
        $isPublished = $request->boolean('is_published');

        $course->update([
            'status' => $isPublished ? Course::STATUS_PUBLISHED : Course::STATUS_DRAFT,
            'is_published' => $isPublished,
            'published_by' => $isPublished ? $request->user()->id : null,
            'version' => $course->version + 1,
        ]);

        CacheService::invalidateCourseCatalog();

        return back();
    }

    /**
     * Publish a course (set status to published).
     */
    public function publishCourse(Course $course): RedirectResponse
    {
        $course->update([
            'status' => Course::STATUS_PUBLISHED,
            'published_by' => request()->user()->id,
            'is_published' => true,
            'version' => $course->version + 1,
        ]);

        app(AuditService::class)->log(request()->user(), 'published', $course);
        CacheService::invalidateCourseCatalog();

        return back()->with('success', 'Course published.');
    }

    /**
     * Archive a course (set status to archived).
     */
    public function archiveCourse(Course $course): RedirectResponse
    {
        $course->update([
            'is_published' => false,
            'status' => Course::STATUS_ARCHIVED,
            'version' => $course->version + 1,
        ]);

        app(AuditService::class)->log(request()->user(), 'archived', $course);
        CacheService::invalidateCourseCatalog();

        return back()->with('success', 'Course archived.');
    }
}
