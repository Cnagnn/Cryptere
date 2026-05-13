# Learner Course Experience Plan 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the learner-facing course catalog, course detail, lesson/task flow, video/read/quiz tasks, and Bloom taxonomy assessments without duplicating the admin management work in Management Plan 1.

**Architecture:** Keep Laravel as the source of truth for learner access, progress, task completion, quiz grading, and assessment attempts. Keep Inertia React as the course experience shell, but split the current large course detail page into focused learner components and typed contracts. This plan depends on Management Plan 1 for admin authoring/status consistency and does not replace admin CRUD, admin publish/archive workflows, or admin delete guard work.

**Tech Stack:** Laravel 13, PHP 8.4, Inertia Laravel v3, React 19, Wayfinder, Tailwind v4, Pest v4, Plyr, react-pdf.

---

## Non-Conflict Boundary With Management Plan 1

This plan must not overwrite or duplicate these Management Plan 1 tasks:

- Admin CRUD for course, lesson, task, user, and assessment.
- Admin React pages under `resources/js/pages/admin/**`.
- Admin FormRequests for assessment/question authoring.
- Admin delete/archive guards.
- Canonical publish state migration from mixed `is_published`/`status`.
- Admin task prerequisite authoring.

This plan may rely on these Management Plan 1 outcomes:

- `status` is the canonical publish state.
- course, lesson, task, and assessment models expose reliable `isPublished()` helpers.
- factories create status-consistent records.
- tests can run locally.
- `LessonTask::canAccess(User $user)` is implemented or has equivalent tested behavior.

If Management Plan 1 has not been executed, start this plan by completing the dependency gate in Task 0 and stop before changing learner code.

---

## Current Findings

The learner experience is functional, but several pieces are not safe enough for a polished course platform:

- `CourseController@index` loads all published courses and filters/paginates in React; this will not scale and makes URLs less shareable.
- `CourseThumbnail` ignores `coverImage`, so uploaded course covers are not visible in the catalog.
- `resources/js/pages/courses/show.tsx` is over 3,000 lines and owns video, PDF, quiz, assessment, navigation, data mapping, and layout in one file.
- `CourseDetailBuilder` filters visible tasks by `published_at`, while the models already have `status`.
- `Lesson::canAccess()` checks `is_completed`, but `lesson_progress` completion in this app is stored through `completed_at`.
- `LessonTask::canAccess()` currently returns `true` after a comment, so task prerequisites are not enforced by the learner flow.
- `QuizSubmissionController` says correct answers are never exposed but returns `correctAnswer`.
- `QuizTask` uses the JSON response only as a success signal; the rendered results depend on stale `task.submission` props until the reload completes.
- `AssessmentSubmissionController` does not centralize start/save/submit validation, time-limit checks, answer shape validation, and question ownership.
- `CourseDetailBuilder` does not include saved active assessment answers, so continue mode cannot accurately show answered progress.
- `AssessmentAttempt` timer is client-side only; server submit does not enforce the time limit.
- `DocumentController` streams PDF files for enrolled users, but does not verify task type, task publish state, lesson publish state, or task access.
- `react-pdf` loads the worker from `unpkg.com`, which creates an avoidable runtime dependency on an external CDN.

Recommended approach: learner-contract first. Lock expected props and endpoint behavior in tests, then harden backend access/attempt services, then split the React course detail page without changing the visual product direction.

---

## Target Learner Flow

### Catalog

1. Learner opens `/courses`.
2. Server returns paginated, searchable, sortable published courses.
3. Each card shows real cover image, title, summary, lesson count, enrollment count, duration, difficulty/category when available, enrollment state, and progress.
4. Filters are represented in the URL query so reload, browser back, and shared links work.
5. Course prerequisites are shown as locked/unlocked from server state.
6. Labs remain under `/labs`; the course catalog does not depend on hardcoded lab fallback data.

### Course Detail

1. Learner opens a published course.
2. If not enrolled, the page shows overview and enrollment CTA while task execution stays locked.
3. If enrolled, the page resumes the first incomplete accessible task.
4. Lessons unlock in order and respect explicit lesson prerequisites.
5. Tasks unlock by publish state and prerequisite task completion.
6. Completion is accepted only through server-validated endpoints.

### Video Task

1. Learner watches through Plyr.
2. Frontend sends heartbeat while the player is actively playing.
3. Server accepts heartbeat only for enrolled users with access to the task.
4. Server completion requires enough engagement and task accessibility.
5. Resume playback uses persisted `video_position_seconds`.

### Read / Document Task

1. Learner opens an inline PDF from an authorized document endpoint.
2. PDF worker is bundled locally through Vite.
3. Reading progress and heartbeat are tracked.
4. Server completion requires enough engagement.
5. Missing or still-converting documents show a clear blocked state.

### Quiz Task

1. Learner starts a quiz with all answer options rendered from server props.
2. Answers can be reviewed before submit.
3. Submit endpoint verifies every submitted question belongs to the task.
4. Result response includes score, correctness, remediation, XP, points, and attempt metadata.
5. Result response does not expose answer keys while retry remains available.
6. UI renders the returned result immediately, then refreshes authoritative props.

### Bloom Assessment

1. Assessments are listed by Bloom level C1 to C6.
2. Start endpoint enforces availability, enrollment, attempt limit, and question count.
3. Save endpoint enforces active submission ownership and question ownership.
4. Submit endpoint enforces time limit and answer requirements.
5. Auto-graded objective questions are graded immediately.
6. Manual Bloom levels expose rubric status and feedback after grading.
7. Continue mode restores saved answers and accurate answered count.
8. Results show Bloom level, points, passing status, feedback, and rubric detail without leaking answer keys before grading.

---

## File Structure

Create learner-specific backend request/service files:

- `app/Http/Requests/Course/CourseCatalogRequest.php` - validates catalog query filters.
- `app/Http/Requests/Course/CompleteLessonTaskRequest.php` - validates task completion payload.
- `app/Http/Requests/Course/TrackTaskHeartbeatRequest.php` - validates heartbeat payload.
- `app/Http/Requests/Course/SubmitLessonQuizRequest.php` - validates quiz submit payload.
- `app/Http/Requests/Assessment/StartAssessmentAttemptRequest.php` - authorizes assessment start.
- `app/Http/Requests/Assessment/SaveAssessmentAnswerRequest.php` - validates answer autosave payload.
- `app/Http/Requests/Assessment/SubmitAssessmentAttemptRequest.php` - authorizes assessment submit.
- `app/Services/CourseCatalogBuilder.php` - builds paginated catalog props.
- `app/Services/LearningAccessService.php` - centralizes learner enrollment, lesson access, task access, and published checks.
- `app/Services/AssessmentAttemptService.php` - centralizes assessment start/save/submit rules.

Refactor learner frontend into focused modules:

- `resources/js/features/course-learning/types.ts`
- `resources/js/features/course-learning/course-outline.tsx`
- `resources/js/features/course-learning/video-task.tsx`
- `resources/js/features/course-learning/reading-task.tsx`
- `resources/js/features/course-learning/quiz-task.tsx`
- `resources/js/features/course-learning/assessment-panel.tsx`
- `resources/js/features/course-learning/use-course-navigation.ts`
- `resources/js/features/course-learning/use-task-heartbeat.ts`
- `resources/js/features/course-catalog/course-card.tsx`
- `resources/js/features/course-catalog/course-filters.tsx`

Modify existing entry pages:

- `resources/js/pages/courses/index.tsx`
- `resources/js/pages/courses/show.tsx`

Add learner tests:

- `tests/Feature/CourseCatalogContractTest.php`
- `tests/Feature/CourseDetailContractTest.php`
- `tests/Feature/LearnerTaskAccessTest.php`
- `tests/Feature/LearnerQuizSubmissionTest.php`
- `tests/Feature/LearnerDocumentAccessTest.php`
- `tests/Feature/LearnerAssessmentAttemptTest.php`
- `tests/Unit/Services/CourseCatalogBuilderTest.php`
- `tests/Unit/Services/LearningAccessServiceTest.php`
- `tests/Unit/Services/AssessmentAttemptServiceTest.php`
- `tests/e2e/course-learning.spec.ts`

---

## Task 0: Dependency Gate

**Files:**

- Read: `docs/superpowers/plans/2026-05-13-management-plan-1.md`
- Read: `app/Models/Course.php`
- Read: `app/Models/Lesson.php`
- Read: `app/Models/LessonTask.php`
- Read: `app/Models/Assessment.php`

- [ ] **Step 1: Confirm test environment is runnable**

Run:

```bash
php artisan test --compact --filter=CourseShowPageTest
```

Expected after Management Plan 1 Task 0:

```text
PASS
```

If the command fails with MySQL connection refused for `crypter_test`, complete Management Plan 1 Task 0 first.

- [ ] **Step 2: Confirm canonical publish helpers exist**

Inspect:

```bash
rg -n "function isPublished|scopePublished|STATUS_PUBLISHED" app/Models/Course.php app/Models/Lesson.php app/Models/LessonTask.php app/Models/Assessment.php
```

Expected:

```text
Course.php has isPublished and published scope using status
Lesson.php has isPublished and published scope using status
LessonTask.php has isPublished and published scope using status
Assessment.php has isPublished and published scope using status
```

- [ ] **Step 3: Confirm task prerequisite behavior is available**

Inspect:

```bash
rg -n "function canAccess" app/Models/LessonTask.php
```

Expected implementation behavior:

```php
public function canAccess(User $user): bool
{
    if (! $this->isPublished()) {
        return false;
    }

    if ($this->prerequisite_task_id === null) {
        return true;
    }

    $prerequisite = self::query()->find($this->prerequisite_task_id);

    if ($prerequisite === null) {
        return false;
    }

    return TaskProgress::query()
        ->where('user_id', $user->id)
        ->where('lesson_task_id', $prerequisite->id)
        ->whereNotNull('completed_at')
        ->exists();
}
```

If `LessonTask::canAccess()` still returns unconditional `true`, complete Management Plan 1 Task 7 before executing learner endpoint changes.

---

## Task 1: Lock Learner Catalog And Detail Contracts In Tests

**Files:**

- Create: `tests/Feature/CourseCatalogContractTest.php`
- Create: `tests/Feature/CourseDetailContractTest.php`
- Modify: `database/factories/CourseFactory.php` only if Management Plan 1 has already normalized factory status fields.
- Modify: `database/factories/LessonFactory.php` only if Management Plan 1 has already normalized factory status fields.
- Modify: `database/factories/LessonTaskFactory.php` only if Management Plan 1 has already normalized factory status fields.
- Modify: `database/factories/AssessmentFactory.php` only if Management Plan 1 has already normalized factory status fields.

- [ ] **Step 1: Write failing catalog contract tests**

Create `tests/Feature/CourseCatalogContractTest.php`:

```php
<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('course catalog returns searchable paginated learner contract', function (): void {
    $user = User::factory()->create();

    $published = Course::factory()->create([
        'title' => 'Applied Cryptography',
        'summary' => 'Modern ciphers and protocols.',
        'status' => 'published',
        'is_published' => true,
        'category' => 'cryptography',
        'difficulty' => 'intermediate',
        'estimated_minutes' => 90,
    ]);

    Course::factory()->create([
        'title' => 'Draft Cryptography',
        'status' => 'draft',
        'is_published' => false,
    ]);

    Enrollment::factory()->for($user)->for($published)->create([
        'progress_percentage' => 35,
        'completed_at' => null,
    ]);

    $this->actingAs($user)
        ->get(route('courses.index', ['search' => 'Applied', 'sort' => 'title']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('courses/index')
            ->where('filters.search', 'Applied')
            ->where('filters.sort', 'title')
            ->has('courses.data', 1)
            ->where('courses.data.0.id', $published->id)
            ->where('courses.data.0.slug', $published->slug)
            ->where('courses.data.0.title', 'Applied Cryptography')
            ->where('courses.data.0.category', 'cryptography')
            ->where('courses.data.0.difficulty', 'intermediate')
            ->where('courses.data.0.isEnrolled', true)
            ->where('courses.data.0.progressPercentage', 35)
            ->has('courses.meta')
        );
});
```

- [ ] **Step 2: Write failing course detail contract tests**

Create `tests/Feature/CourseDetailContractTest.php`:

```php
<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('course detail exposes only learner safe published lessons and tasks', function (): void {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => 'published',
        'is_published' => true,
    ]);

    $publishedLesson = Lesson::factory()->for($course)->create([
        'title' => 'Published Lesson',
        'position' => 1,
        'status' => 'published',
    ]);

    Lesson::factory()->for($course)->create([
        'title' => 'Draft Lesson',
        'position' => 2,
        'status' => 'draft',
    ]);

    $quizTask = LessonTask::factory()->for($publishedLesson, 'lesson')->create([
        'title' => 'Quiz Task',
        'type' => 'quiz',
        'status' => 'published',
        'published_at' => now(),
    ]);

    LessonTask::factory()->for($publishedLesson, 'lesson')->create([
        'title' => 'Draft Task',
        'type' => 'read',
        'status' => 'draft',
        'published_at' => null,
    ]);

    QuizQuestion::factory()->for($quizTask, 'task')->create([
        'question' => 'Which cipher is symmetric?',
        'options' => ['AES', 'RSA', 'ECC', 'DSA'],
        'correct_option' => 0,
        'explanation' => 'AES is symmetric.',
    ]);

    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->get(route('courses.show', $course))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('courses/show')
            ->has('lessons', 1)
            ->where('lessons.0.title', 'Published Lesson')
            ->has('lessons.0.tasks', 1)
            ->where('lessons.0.tasks.0.title', 'Quiz Task')
            ->missing('lessons.0.tasks.0.questions.0.correctOption')
            ->missing('lessons.0.tasks.0.questions.0.correct_answer')
        );
});
```

- [ ] **Step 3: Verify tests fail before implementation**

Run:

```bash
php artisan test --compact --filter=CourseCatalogContractTest
php artisan test --compact --filter=CourseDetailContractTest
```

Expected:

```text
FAIL
```

Failure should mention missing `courses.meta`, missing `filters`, missing `category`/`difficulty`, draft content leakage, or incomplete contract fields.

---

## Task 2: Move Course Catalog Querying To The Server

**Files:**

- Create: `app/Http/Requests/Course/CourseCatalogRequest.php`
- Create: `app/Services/CourseCatalogBuilder.php`
- Modify: `app/Http/Controllers/Course/CourseController.php`
- Modify: `resources/js/types/courses.ts`
- Modify: `resources/js/pages/courses/index.tsx`
- Modify: `resources/js/pages/labs/index.tsx` only to keep lab props compatible if `CoursesIndexProps` becomes a discriminated union.

- [ ] **Step 1: Add catalog request validation**

Create `app/Http/Requests/Course/CourseCatalogRequest.php`:

```php
<?php

namespace App\Http\Requests\Course;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'enrollment' => ['nullable', Rule::in(['all', 'enrolled', 'not-enrolled'])],
            'sort' => ['nullable', Rule::in(['title', 'progress', 'newest'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:4', 'max:24'],
        ];
    }

    /**
     * @return array{search: string, enrollment: string, sort: string, per_page: int}
     */
    public function catalogFilters(): array
    {
        $validated = $this->validated();

        return [
            'search' => trim((string) ($validated['search'] ?? '')),
            'enrollment' => (string) ($validated['enrollment'] ?? 'all'),
            'sort' => (string) ($validated['sort'] ?? 'title'),
            'per_page' => (int) ($validated['per_page'] ?? 12),
        ];
    }
}
```

- [ ] **Step 2: Add catalog builder**

Create `app/Services/CourseCatalogBuilder.php`:

```php
<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CourseCatalogBuilder
{
    /**
     * @param  array{search: string, enrollment: string, sort: string, per_page: int}  $filters
     */
    public function build(User $user, array $filters): LengthAwarePaginator
    {
        $enrolledCourseIds = $user->enrollments()->pluck('course_id');

        $query = Course::query()
            ->published()
            ->withCount(['lessons', 'enrollments'])
            ->when($filters['search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($builder) use ($filters): void {
                    $builder
                        ->where('title', 'like', '%'.$filters['search'].'%')
                        ->orWhere('summary', 'like', '%'.$filters['search'].'%')
                        ->orWhere('category', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when($filters['enrollment'] === 'enrolled', fn ($query) => $query->whereIn('id', $enrolledCourseIds))
            ->when($filters['enrollment'] === 'not-enrolled', fn ($query) => $query->whereNotIn('id', $enrolledCourseIds));

        match ($filters['sort']) {
            'progress' => $query->orderByDesc('id'),
            'newest' => $query->latest(),
            default => $query->orderBy('title'),
        };

        $progressByCourse = $user->enrollments()
            ->pluck('progress_percentage', 'course_id');

        return $query
            ->paginate($filters['per_page'])
            ->withQueryString()
            ->through(function (Course $course) use ($progressByCourse, $user): array {
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
                    'category' => $course->category,
                    'difficulty' => $course->difficulty,
                    'isEnrolled' => $isEnrolled,
                    'isUnlocked' => $course->isUnlockedFor($user),
                    'progressPercentage' => $isEnrolled ? (int) $progressByCourse[$course->id] : null,
                ];
            });
    }
}
```

- [ ] **Step 3: Inject builder into course controller**

Modify `app/Http/Controllers/Course/CourseController.php`:

```php
use App\Http\Requests\Course\CourseCatalogRequest;
use App\Services\CourseCatalogBuilder;
```

Update constructor:

```php
public function __construct(
    private readonly CourseDetailBuilder $detailBuilder,
    private readonly CourseCatalogBuilder $catalogBuilder,
) {}
```

Update index signature and render:

```php
public function index(CourseCatalogRequest $request): Response
{
    $filters = $request->catalogFilters();

    return Inertia::render('courses/index', [
        'courses' => $this->catalogBuilder->build($request->user(), $filters),
        'filters' => [
            'search' => $filters['search'],
            'enrollment' => $filters['enrollment'],
            'sort' => $filters['sort'],
            'perPage' => $filters['per_page'],
        ],
    ]);
}
```

- [ ] **Step 4: Update TypeScript catalog types**

Modify `resources/js/types/courses.ts` while keeping lab mode compatible:

```ts
export type CourseCard = {
    id: number;
    slug: string;
    title: string;
    summary: string;
    coverImage: string | null;
    estimatedMinutes: number;
    lessonCount: number;
    enrollmentCount: number;
    category: string | null;
    difficulty: string | null;
    isEnrolled: boolean;
    isUnlocked: boolean;
    progressPercentage: number | null;
    labGroup?: 'classical' | 'symmetric' | 'asymmetric' | 'signature';
};

export type PaginatedCourses = {
    data: CourseCard[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        path: string;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type LearningCoursesIndexProps = {
    courses: PaginatedCourses;
    filters: {
        search: string;
        enrollment: EnrollmentFilterValue;
        sort: SortValue;
        perPage: number;
    };
    catalogMode?: 'learning';
};

export type LabsCoursesIndexProps = {
    courses?: CourseCard[];
    catalogMode: 'labs';
    sidebarMode?: 'filters' | 'statistics';
    statistics?: Array<{ label: string; value: string }>;
    pageTitle?: string;
    pageDescription?: string;
    headTitle?: string;
};

export type CoursesIndexProps = LearningCoursesIndexProps | LabsCoursesIndexProps;

export type SortValue = 'title' | 'progress' | 'newest';
```

- [ ] **Step 5: Update catalog page to use server props**

Modify `resources/js/pages/courses/index.tsx` so filtering uses `router.get` with Wayfinder URL:

```tsx
const updateFilters = (next: Partial<CoursesIndexProps['filters']>) => {
    const merged = { ...filters, ...next };

    router.get(
        coursesIndex.url(),
        {
            search: merged.search || undefined,
            enrollment: merged.enrollment === 'all' ? undefined : merged.enrollment,
            sort: merged.sort === 'title' ? undefined : merged.sort,
            per_page: merged.perPage,
        },
        {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            only: ['courses', 'filters'],
        },
    );
};
```

Render `courses.data` for learning mode and preserve the existing lab-mode array:

```tsx
const isLabsCatalog = catalogMode === 'labs';
const catalogCourses = isLabsCatalog
    ? (courses as CourseCard[] | undefined) ?? []
    : (courses as PaginatedCourses).data;
```

Use server pagination links only when `!isLabsCatalog`.

- [ ] **Step 6: Render real course cover images**

Replace thumbnail fallback:

```tsx
function CourseThumbnail({ course }: { course: CourseCard }) {
    if (course.coverImage) {
        return (
            <div className="relative aspect-video overflow-hidden border-b bg-muted/40">
                <img
                    src={course.coverImage}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div className="relative aspect-video overflow-hidden border-b bg-muted/40">
            <div className="flex h-full w-full items-center justify-center">
                <BookOpenCheck className="size-5 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Gambar mini {course.title}</span>
            </div>
        </div>
    );
}
```

- [ ] **Step 7: Verify catalog**

Run:

```bash
php artisan test --compact --filter=CourseCatalogContractTest
npm run types:check
```

Expected:

```text
PASS
```

---

## Task 3: Harden Course Detail Builder And Learner Access

**Files:**

- Create: `app/Services/LearningAccessService.php`
- Modify: `app/Services/CourseDetailBuilder.php`
- Modify: `app/Http/Controllers/Course/CourseController.php`
- Test: `tests/Feature/CourseDetailContractTest.php`
- Test: `tests/Unit/Services/LearningAccessServiceTest.php`

- [ ] **Step 1: Add learning access service**

Create `app/Services/LearningAccessService.php`:

```php
<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
use App\Models\User;

class LearningAccessService
{
    public function isEnrolled(User $user, Course $course): bool
    {
        return Enrollment::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($course)
            ->exists();
    }

    public function canViewLesson(User $user, Lesson $lesson, bool $isAdmin = false): bool
    {
        if ($isAdmin) {
            return true;
        }

        if (! $lesson->isPublished()) {
            return false;
        }

        if ($lesson->prerequisite_lesson_id === null) {
            return true;
        }

        return LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('lesson_id', $lesson->prerequisite_lesson_id)
            ->whereNotNull('completed_at')
            ->exists();
    }

    public function canUseTask(User $user, LessonTask $task, bool $isAdmin = false): bool
    {
        if ($isAdmin) {
            return true;
        }

        $task->loadMissing('lesson.course');

        if (! $this->isEnrolled($user, $task->lesson->course)) {
            return false;
        }

        return $task->canAccess($user);
    }
}
```

- [ ] **Step 2: Inject service into detail builder**

Modify `app/Services/CourseDetailBuilder.php` constructor:

```php
public function __construct(
    private readonly LearningAccessService $learningAccess,
) {}
```

Update lesson/task visibility:

```php
$visibleLessons = $course->lessons
    ->filter(fn (Lesson $lesson): bool => $this->learningAccess->canViewLesson($user, $lesson, $isAdmin))
    ->values();
```

Update task filtering:

```php
$visibleTasks = $lesson->tasks
    ->filter(fn (LessonTask $task): bool => $this->learningAccess->canUseTask($user, $task, $isAdmin))
    ->values();
```

Update task payload publication fields:

```php
'isPublished' => $task->isPublished(),
'publishedAt' => optional($task->published_at)->toIso8601String(),
'isLocked' => ! $task->canAccess($user),
```

- [ ] **Step 3: Include saved active assessment answers**

In `CourseDetailBuilder::buildAssessments()`, update active submission payload:

```php
'activeSubmission' => $activeSubmission ? [
    'id' => $activeSubmission->id,
    'attemptNumber' => $activeSubmission->attempt_number,
    'startedAt' => $activeSubmission->started_at->toIso8601String(),
    'answers' => $activeSubmission->answers()
        ->get(['question_id', 'answer_text', 'selected_option'])
        ->mapWithKeys(fn (AssessmentAnswer $answer): array => [
            $answer->question_id => [
                'answer_text' => $answer->answer_text,
                'selected_option' => $answer->selected_option,
            ],
        ])
        ->all(),
] : null,
```

- [ ] **Step 4: Verify detail contract**

Run:

```bash
php artisan test --compact --filter=CourseDetailContractTest
php artisan test --compact --filter=LearningAccessServiceTest
```

Expected:

```text
PASS
```

---

## Task 4: Replace Inline Learner Endpoint Validation With FormRequests

**Files:**

- Create: `app/Http/Requests/Course/CompleteLessonTaskRequest.php`
- Create: `app/Http/Requests/Course/TrackTaskHeartbeatRequest.php`
- Create: `app/Http/Requests/Course/SubmitLessonQuizRequest.php`
- Modify: `app/Http/Controllers/Course/LessonProgressController.php`
- Modify: `app/Http/Controllers/Course/TaskHeartbeatController.php`
- Modify: `app/Http/Controllers/Course/QuizSubmissionController.php`

- [ ] **Step 1: Create task completion request**

Create `app/Http/Requests/Course/CompleteLessonTaskRequest.php`:

```php
<?php

namespace App\Http\Requests\Course;

use Illuminate\Foundation\Http\FormRequest;

class CompleteLessonTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'task_id' => ['nullable', 'integer', 'exists:lesson_tasks,id'],
        ];
    }
}
```

- [ ] **Step 2: Create heartbeat request**

Create `app/Http/Requests/Course/TrackTaskHeartbeatRequest.php`:

```php
<?php

namespace App\Http\Requests\Course;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TrackTaskHeartbeatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'task_id' => ['required', 'integer', 'exists:lesson_tasks,id'],
            'type' => ['required', Rule::in(['video', 'reading'])],
            'seconds' => ['required', 'integer', 'min:1', 'max:60'],
            'current_time' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
```

- [ ] **Step 3: Create quiz submit request**

Create `app/Http/Requests/Course/SubmitLessonQuizRequest.php`:

```php
<?php

namespace App\Http\Requests\Course;

use Illuminate\Foundation\Http\FormRequest;

class SubmitLessonQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'task_id' => ['required', 'integer', 'exists:lesson_tasks,id'],
            'answers' => ['required', 'array', 'min:1'],
            'answers.*.question_id' => ['required', 'integer', 'exists:quiz_questions,id'],
            'answers.*.answer' => ['required', 'integer', 'min:0', 'max:3'],
        ];
    }
}
```

- [ ] **Step 4: Update controllers to type-hint requests**

Modify method signatures:

```php
public function store(CompleteLessonTaskRequest $request, Course $course, Lesson $lesson): RedirectResponse|JsonResponse
```

```php
public function store(TrackTaskHeartbeatRequest $request, Course $course, Lesson $lesson): JsonResponse
```

```php
public function store(SubmitLessonQuizRequest $request, Course $course, Lesson $lesson): JsonResponse
```

Replace `$request->validate(...)` with:

```php
$validated = $request->validated();
```

- [ ] **Step 5: Verify learner endpoint validation still passes**

Run:

```bash
php artisan test --compact --filter=LessonProgressTest
vendor/bin/pint --dirty --format agent
```

Expected:

```text
PASS
```

---

## Task 5: Harden Video, Reading, And Document Access

**Files:**

- Modify: `app/Http/Controllers/Course/DocumentController.php`
- Modify: `app/Http/Controllers/Course/TaskHeartbeatController.php`
- Modify: `app/Http/Controllers/Course/LessonProgressController.php`
- Create: `tests/Feature/LearnerDocumentAccessTest.php`
- Create: `tests/Feature/LearnerTaskAccessTest.php`
- Modify: `resources/js/features/course-learning/reading-task.tsx`
- Modify: `resources/js/features/course-learning/video-task.tsx`

- [ ] **Step 1: Add document access tests**

Create `tests/Feature/LearnerDocumentAccessTest.php`:

```php
<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('document stream requires enrollment and published read task', function (): void {
    Storage::fake('public');
    Storage::disk('public')->put('lesson-documents/intro.pdf', 'PDF');

    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $lesson = Lesson::factory()->for($course)->create(['status' => 'published']);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'type' => 'read',
        'status' => 'published',
        'pdf_url' => '/storage/lesson-documents/intro.pdf',
    ]);

    $this->actingAs($user)
        ->get(route('courses.documents.show', $task))
        ->assertForbidden();

    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->get(route('courses.documents.show', $task))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');
});
```

- [ ] **Step 2: Harden document controller**

Modify `app/Http/Controllers/Course/DocumentController.php`:

```php
public function show(LessonTask $task): StreamedResponse
{
    $user = auth()->user();
    abort_unless($user !== null, 403);

    $task->loadMissing('lesson.course');
    $lesson = $task->lesson;
    $course = $lesson->course;

    abort_unless($course->isPublished(), 404);
    abort_unless($lesson->isPublished(), 404);
    abort_unless($task->isPublished(), 404);
    abort_unless($task->type === 'read', 404);
    abort_unless($course->enrollments()->where('user_id', $user->id)->exists(), 403);
    abort_unless($task->canAccess($user), 403);

    $pdfUrl = $task->pdf_url;
    abort_unless(is_string($pdfUrl) && $pdfUrl !== '', 404);

    $path = ltrim(str_replace('/storage/', '', (string) parse_url($pdfUrl, PHP_URL_PATH)), '/');
    abort_unless(str_starts_with($path, 'lesson-documents/'), 404);
    abort_unless(Storage::disk('public')->exists($path), 404);

    $filename = basename($path);
    $size = Storage::disk('public')->size($path);

    return response()->stream(
        function () use ($path): void {
            $stream = Storage::disk('public')->readStream($path);
            if ($stream !== false) {
                fpassthru($stream);
                fclose($stream);
            }
        },
        200,
        [
            'Content-Type' => 'application/pdf',
            'Content-Length' => (string) $size,
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'Accept-Ranges' => 'none',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Transfer-Encoding' => 'binary',
        ],
    );
}
```

- [ ] **Step 3: Add task access checks in heartbeat and completion**

In `TaskHeartbeatController`, after loading task:

```php
$task = $lesson->tasks()
    ->whereKey($validated['task_id'])
    ->first();

if (! $task || ! $task->isPublished() || ! $task->canAccess($user)) {
    return response()->json(['message' => __('Task is not available.')], 403);
}
```

In `LessonProgressController`, before anti-cheat:

```php
if (isset($validated['task_id'])) {
    $task = $lesson->tasks()->whereKey($validated['task_id'])->first();

    if (! $task || ! $task->isPublished() || ! $task->canAccess($user)) {
        return response()->json([
            'success' => false,
            'message' => __('Task is not available.'),
        ], 403);
    }
}
```

- [ ] **Step 4: Use bundled PDF worker**

Modify the future `resources/js/features/course-learning/reading-task.tsx`:

```tsx
import { pdfjs } from 'react-pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
```

Remove this remote worker line from `resources/js/pages/courses/show.tsx` during frontend extraction:

```tsx
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

- [ ] **Step 5: Verify document and task access**

Run:

```bash
php artisan test --compact --filter=LearnerDocumentAccessTest
php artisan test --compact --filter=LearnerTaskAccessTest
npm run types:check
```

Expected:

```text
PASS
```

---

## Task 6: Fix Quiz Integrity And Immediate Results

**Files:**

- Modify: `app/Http/Controllers/Course/QuizSubmissionController.php`
- Modify: `app/Services/CourseDetailBuilder.php`
- Create: `tests/Feature/LearnerQuizSubmissionTest.php`
- Modify: `resources/js/features/course-learning/quiz-task.tsx`
- Modify: `resources/js/features/course-learning/types.ts`

- [ ] **Step 1: Add quiz leakage regression test**

Create `tests/Feature/LearnerQuizSubmissionTest.php`:

```php
<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\User;

test('quiz submission does not expose correct answer key while retry is available', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $lesson = Lesson::factory()->for($course)->create(['status' => 'published']);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'type' => 'quiz',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $question = QuizQuestion::factory()->for($task, 'task')->create([
        'options' => ['AES', 'RSA', 'ECC', 'DSA'],
        'correct_option' => 0,
    ]);

    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->postJson(route('courses.lessons.quiz', [$course, $lesson]), [
            'task_id' => $task->id,
            'answers' => [
                ['question_id' => $question->id, 'answer' => 1],
            ],
        ])
        ->assertOk()
        ->assertJsonMissingPath('results.0.correctAnswer')
        ->assertJsonPath('results.0.correct', false);
});
```

- [ ] **Step 2: Remove answer key from quiz response**

Modify result mapping in `QuizSubmissionController`:

```php
return [
    'correct' => $isCorrect,
    'explanation' => $question->explanation,
    'remedialLessonSlug' => ! $isCorrect ? $question->topic?->relatedLessonSlug() : null,
];
```

Do not include `correctAnswer`.

- [ ] **Step 3: Add stable quiz response shape**

Update final JSON:

```php
return response()->json([
    'submission' => [
        'answers' => $answerArray,
        'score' => $correctCount,
        'total' => $questions->count(),
        'results' => $results,
        'xpEarned' => $xpEarned,
        'pointsEarned' => $pointsEarned,
        'attemptNumber' => $attemptNumber,
        'xpMultiplier' => $xpMultiplier,
        'bestScore' => $bestSubmission?->score ?? $correctCount,
        'bestTotal' => $bestSubmission?->total ?? $questions->count(),
        'canRetry' => true,
    ],
]);
```

- [ ] **Step 4: Render returned result immediately**

In `resources/js/features/course-learning/quiz-task.tsx`, store returned submission:

```tsx
const [localSubmission, setLocalSubmission] = useState<QuizSubmission | null>(
    task.submission,
);
```

After submit:

```tsx
.then((payload: { submission: QuizSubmission }) => {
    setLocalSubmission(payload.submission);
    setShowResults(true);
    setShowReview(false);
    toast.success('Kuis berhasil dikirim!');
    setAriaLiveMessage('Kuis berhasil dikirim!');
    onComplete();
});
```

Use `localSubmission` for results:

```tsx
if (showResults && localSubmission) {
    const scorePercentage = Math.round(
        (localSubmission.score / localSubmission.total) * 100,
    );
}
```

- [ ] **Step 5: Verify quiz behavior**

Run:

```bash
php artisan test --compact --filter=LearnerQuizSubmissionTest
npm run types:check
```

Expected:

```text
PASS
```

---

## Task 7: Centralize Bloom Assessment Attempt Rules

**Files:**

- Create: `app/Services/AssessmentAttemptService.php`
- Create: `app/Http/Requests/Assessment/StartAssessmentAttemptRequest.php`
- Create: `app/Http/Requests/Assessment/SaveAssessmentAnswerRequest.php`
- Create: `app/Http/Requests/Assessment/SubmitAssessmentAttemptRequest.php`
- Modify: `app/Http/Controllers/Assessment/AssessmentSubmissionController.php`
- Create: `tests/Feature/LearnerAssessmentAttemptTest.php`
- Create: `tests/Unit/Services/AssessmentAttemptServiceTest.php`

- [ ] **Step 1: Add assessment attempt service**

Create `app/Services/AssessmentAttemptService.php`:

```php
<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentSubmission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AssessmentAttemptService
{
    public function start(User $user, Assessment $assessment): AssessmentSubmission
    {
        if (! $assessment->canAttempt($user)) {
            throw ValidationException::withMessages([
                'assessment' => __('This assessment is not available.'),
            ]);
        }

        $existing = AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
            ->first();

        if ($existing) {
            return $existing;
        }

        $questionCount = $assessment->questions()->count();
        if ($questionCount === 0) {
            throw ValidationException::withMessages([
                'assessment' => __('This assessment has no questions.'),
            ]);
        }

        $attemptNumber = (int) AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->max('attempt_number') + 1;

        return DB::transaction(function () use ($user, $assessment, $attemptNumber): AssessmentSubmission {
            $submission = AssessmentSubmission::create([
                'user_id' => $user->id,
                'assessment_id' => $assessment->id,
                'attempt_number' => $attemptNumber,
                'status' => AssessmentSubmission::STATUS_IN_PROGRESS,
                'started_at' => now(),
            ]);

            $assessment->questions()->get()->each(function ($question) use ($submission): void {
                AssessmentAnswer::create([
                    'submission_id' => $submission->id,
                    'question_id' => $question->id,
                    'max_points' => $question->points,
                ]);
            });

            return $submission;
        });
    }

    /**
     * @param  array{answer_text?: string|null, selected_option?: string|null}  $payload
     */
    public function saveAnswer(User $user, Assessment $assessment, int $questionId, array $payload): AssessmentAnswer
    {
        $submission = $this->activeSubmission($user, $assessment);

        $answer = AssessmentAnswer::query()
            ->where('submission_id', $submission->id)
            ->where('question_id', $questionId)
            ->firstOrFail();

        $answer->update([
            'answer_text' => array_key_exists('answer_text', $payload) ? $payload['answer_text'] : $answer->answer_text,
            'selected_option' => array_key_exists('selected_option', $payload) ? $payload['selected_option'] : $answer->selected_option,
        ]);

        return $answer;
    }

    public function activeSubmission(User $user, Assessment $assessment): AssessmentSubmission
    {
        return AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
            ->firstOrFail();
    }

    public function assertWithinTimeLimit(AssessmentSubmission $submission): void
    {
        $minutes = $submission->assessment->time_limit_minutes;

        if ($minutes === null) {
            return;
        }

        if ($submission->started_at->addMinutes($minutes)->isPast()) {
            throw ValidationException::withMessages([
                'assessment' => __('Assessment time limit has expired.'),
            ]);
        }
    }
}
```

- [ ] **Step 2: Add assessment request classes**

Create `app/Http/Requests/Assessment/StartAssessmentAttemptRequest.php`:

```php
<?php

namespace App\Http\Requests\Assessment;

use Illuminate\Foundation\Http\FormRequest;

class StartAssessmentAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [];
    }
}
```

Create `app/Http/Requests/Assessment/SaveAssessmentAnswerRequest.php`:

```php
<?php

namespace App\Http\Requests\Assessment;

use Illuminate\Foundation\Http\FormRequest;

class SaveAssessmentAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'question_id' => ['required', 'integer', 'exists:assessment_questions,id'],
            'answer_text' => ['nullable', 'string', 'max:5000'],
            'selected_option' => ['nullable', 'string', 'max:500'],
        ];
    }
}
```

Create `app/Http/Requests/Assessment/SubmitAssessmentAttemptRequest.php`:

```php
<?php

namespace App\Http\Requests\Assessment;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAssessmentAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [];
    }
}
```

- [ ] **Step 3: Update assessment submission controller**

Inject service:

```php
public function __construct(
    private readonly AssessmentGradingService $gradingService,
    private readonly AssessmentAttemptService $attemptService,
) {}
```

Use request classes:

```php
public function start(StartAssessmentAttemptRequest $request, Assessment $assessment): RedirectResponse
{
    $this->authorize('attempt', $assessment);
    $this->attemptService->start($request->user(), $assessment);

    return redirect($assessment->course_id
        ? route('courses.show', $assessment->course->slug)
        : route('assessments.show', $assessment->slug)
    )->with('success', __('Assessment started. Good luck!'));
}
```

```php
public function saveAnswer(SaveAssessmentAnswerRequest $request, Assessment $assessment): JsonResponse
{
    $validated = $request->validated();

    $this->attemptService->saveAnswer(
        $request->user(),
        $assessment,
        (int) $validated['question_id'],
        [
            'answer_text' => $validated['answer_text'] ?? null,
            'selected_option' => $validated['selected_option'] ?? null,
        ],
    );

    return response()->json(['saved' => true]);
}
```

```php
public function submit(SubmitAssessmentAttemptRequest $request, Assessment $assessment): RedirectResponse
{
    $submission = $this->attemptService->activeSubmission($request->user(), $assessment);
    $this->attemptService->assertWithinTimeLimit($submission);

    $submission->update([
        'status' => AssessmentSubmission::STATUS_SUBMITTED,
        'submitted_at' => now(),
    ]);

    $this->gradingService->processSubmission($submission);

    return redirect($assessment->course_id
        ? route('courses.show', $assessment->course->slug)
        : route('assessments.show', $assessment->slug)
    )->with('success', $assessment->requiresManualGrading()
        ? __('Assessment submitted. Subjective answers are queued for manual review.')
        : __('Assessment submitted and graded.')
    );
}
```

- [ ] **Step 4: Add tests for Bloom attempts**

Create `tests/Feature/LearnerAssessmentAttemptTest.php` with these tests:

```php
<?php

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

test('enrolled learner can start and continue a published bloom assessment', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $assessment = Assessment::factory()->for($course)->create([
        'status' => 'published',
        'is_published' => true,
        'bloom_level' => 'C4',
        'max_attempts' => 2,
    ]);

    AssessmentQuestion::factory()->for($assessment)->create([
        'bloom_level' => 'C4',
        'question_type' => 'case_study',
        'grading_type' => 'manual',
        'points' => 10,
    ]);

    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->post(route('assessments.start', ['assessment' => $assessment->slug]))
        ->assertRedirect(route('courses.show', $course));

    $this->assertDatabaseHas('assessment_submissions', [
        'user_id' => $user->id,
        'assessment_id' => $assessment->id,
        'status' => 'in_progress',
        'attempt_number' => 1,
    ]);
});
```

Add a second test in the same file:

```php
test('assessment answer save rejects question outside active submission', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $assessment = Assessment::factory()->for($course)->create(['status' => 'published', 'is_published' => true]);
    $otherAssessment = Assessment::factory()->for($course)->create(['status' => 'published', 'is_published' => true]);

    $question = AssessmentQuestion::factory()->for($assessment)->create();
    $otherQuestion = AssessmentQuestion::factory()->for($otherAssessment)->create();

    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)->post(route('assessments.start', ['assessment' => $assessment->slug]));

    $this->actingAs($user)
        ->postJson(route('assessments.save-answer', ['assessment' => $assessment->slug]), [
            'question_id' => $otherQuestion->id,
            'answer_text' => 'Cross assessment answer',
        ])
        ->assertNotFound();

    $this->assertDatabaseMissing('assessment_answers', [
        'question_id' => $question->id,
        'answer_text' => 'Cross assessment answer',
    ]);
});
```

- [ ] **Step 5: Verify assessment rules**

Run:

```bash
php artisan test --compact --filter=LearnerAssessmentAttemptTest
php artisan test --compact --filter=AssessmentPolicyTest
```

Expected:

```text
PASS
```

---

## Task 8: Split The Course Detail React Page

**Files:**

- Create: `resources/js/features/course-learning/types.ts`
- Create: `resources/js/features/course-learning/course-outline.tsx`
- Create: `resources/js/features/course-learning/video-task.tsx`
- Create: `resources/js/features/course-learning/reading-task.tsx`
- Create: `resources/js/features/course-learning/quiz-task.tsx`
- Create: `resources/js/features/course-learning/assessment-panel.tsx`
- Create: `resources/js/features/course-learning/use-course-navigation.ts`
- Create: `resources/js/features/course-learning/use-task-heartbeat.ts`
- Modify: `resources/js/pages/courses/show.tsx`

- [ ] **Step 1: Move shared types**

Create `resources/js/features/course-learning/types.ts`:

```tsx
export type VideoProcessingStatus =
    | 'pending'
    | 'processing'
    | 'ready'
    | 'converted'
    | 'failed'
    | null;

export type LessonQuizQuestion = {
    id: number;
    question: string;
    options: [string, string, string, string];
    explanation: string | null;
};

export type QuizSubmission = {
    answers?: unknown;
    score: number;
    total: number;
    results: Array<{
        correct: boolean;
        explanation?: string | null;
        remedialLessonSlug?: string | null;
    }>;
    xpEarned?: number;
    pointsEarned?: number;
    attemptNumber?: number;
    xpMultiplier?: number;
    bestScore?: number;
    bestTotal?: number;
    canRetry?: boolean;
};

export type LessonTask = {
    id: number;
    type: 'video' | 'read' | 'quiz';
    title: string;
    description: string;
    videoUrl: string | null;
    videoProcessingStatus: VideoProcessingStatus;
    videoPositionSeconds: number;
    pdfUrl: string | null;
    pdfName: string | null;
    isPublished: boolean;
    isLocked: boolean;
    isCompleted: boolean;
    quizQuestions: LessonQuizQuestion[];
    submission: QuizSubmission | null;
};
```

- [ ] **Step 2: Extract task components without visual redesign**

Move existing component bodies into:

- `video-task.tsx` for `VideoTask`
- `reading-task.tsx` for `ReadingTask` and `PdfStreamViewer`
- `quiz-task.tsx` for `QuizTask`
- `assessment-panel.tsx` for `AssessmentPanel`, `AssessmentOverview`, `AssessmentAttempt`, `AssessmentResults`, and `AssessmentAnswerInput`
- `course-outline.tsx` for `CourseTaskPanel`

Keep class names and UI primitives unchanged except for fixes already listed in earlier tasks.

- [ ] **Step 3: Keep page file as orchestration only**

After extraction, `resources/js/pages/courses/show.tsx` should keep:

```tsx
export default function CourseShow(props: Props) {
    const state = useCourseNavigation(props);

    return (
        <>
            <Head title={`${props.course.title} - Course Detail`} />
            <CourseLearningLayout {...state} />
        </>
    );
}
```

The page should not define video player internals, PDF rendering, quiz submit internals, or assessment input internals.

- [ ] **Step 4: Verify frontend types**

Run:

```bash
npm run types:check
npm run lint
```

Expected:

```text
PASS
```

---

## Task 9: Add Learner E2E Smoke Coverage

**Files:**

- Create: `tests/e2e/course-learning.spec.ts`
- Modify: `playwright.config.ts` only if the existing base URL does not match the local Laravel server.

- [ ] **Step 1: Add course catalog smoke test**

Create `tests/e2e/course-learning.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('course catalog renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(message.text());
        }
    });

    await page.goto('/courses');
    await expect(page.getByRole('heading', { name: /kursus/i })).toBeVisible();
    expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Add course detail smoke test**

Append:

```ts
test('course detail outline renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(message.text());
        }
    });

    await page.goto('/courses/caesar-chiper');
    await expect(page.getByRole('button', { name: /outline materi/i })).toBeVisible();
    expect(errors).toEqual([]);
});
```

- [ ] **Step 3: Verify browser smoke after seeding data**

Run:

```bash
php artisan db:seed --class=CaesarCipherCourseSeeder --no-interaction
npm run e2e
```

Expected:

```text
2 passed
```

---

## Task 10: Final Verification

**Files:**

- Verify all files touched by this plan.

- [ ] **Step 1: Regenerate Wayfinder routes**

Run:

```bash
npm run types
```

Expected:

```text
php artisan wayfinder:generate completes without errors
```

- [ ] **Step 2: Format PHP**

Run:

```bash
vendor/bin/pint --dirty --format agent
```

Expected:

```text
No syntax or formatting failures
```

- [ ] **Step 3: Run focused backend tests**

Run:

```bash
php artisan test --compact --filter=CourseCatalogContractTest
php artisan test --compact --filter=CourseDetailContractTest
php artisan test --compact --filter=LearnerTaskAccessTest
php artisan test --compact --filter=LearnerQuizSubmissionTest
php artisan test --compact --filter=LearnerDocumentAccessTest
php artisan test --compact --filter=LearnerAssessmentAttemptTest
```

Expected:

```text
PASS
```

- [ ] **Step 4: Run frontend checks**

Run:

```bash
npm run types:check
npm run lint
```

Expected:

```text
PASS
```

- [ ] **Step 5: Run all tests**

Run:

```bash
php artisan test --compact
```

Expected:

```text
PASS
```

---

## Execution Order

1. Complete dependency gate against Management Plan 1.
2. Add failing learner contract tests.
3. Move course catalog querying to the server.
4. Harden course detail builder and access services.
5. Replace learner inline validation with FormRequests.
6. Harden video, reading, and document access.
7. Fix quiz answer-key leakage and immediate result rendering.
8. Centralize Bloom assessment attempt rules.
9. Split the course detail React page into focused modules.
10. Add learner E2E smoke coverage.
11. Run final verification.

---

## Out Of Scope

- Admin management pages and admin CRUD changes covered by Management Plan 1.
- Rewriting the labs product.
- Adding a new role/permission package.
- Replacing Inertia with an API-only frontend.
- Changing course content authored by seeders except where tests need deterministic fixture data.
- A full visual redesign of catalog or course detail.

---

## Definition Of Done

Learner Course Experience Plan 1 is complete when:

- course catalog filtering, sorting, and pagination are server-backed and URL shareable;
- uploaded course covers render in catalog cards;
- labs remain independent from course catalog behavior;
- course detail payload exposes only published and learner-safe lessons/tasks/questions;
- lesson and task access are enforced by backend endpoints;
- video and reading completion cannot bypass heartbeat/access checks;
- document streaming verifies enrollment, published state, task type, and storage path;
- quiz responses do not expose answer keys while retry is available;
- quiz results render immediately from the response payload;
- active assessment attempts restore saved answers;
- Bloom assessment start/save/submit rules are centralized and tested;
- server-side assessment time limit enforcement exists;
- `resources/js/pages/courses/show.tsx` is reduced to page orchestration;
- focused Pest tests, TypeScript check, ESLint, and Playwright smoke tests pass.
