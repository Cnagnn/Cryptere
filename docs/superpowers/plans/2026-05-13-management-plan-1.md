# Management Plan 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to execute this plan.

**Goal:** Stabilize admin management for courses, lessons, tasks, users, and assessments so the flow is predictable from draft creation to publication, learner progress, archival, and safe administration.

**Architecture:** Keep the existing Laravel + Fortify + Inertia React + Wayfinder architecture. Treat the Laravel controllers and FormRequests as the source of truth, and keep React pages as thin workflow clients that consume complete, typed props from `CourseController@index` and `UserController@index`.

**Tech Stack:** Laravel 13, PHP 8.4, Inertia Laravel v3, React 19, Wayfinder, Tailwind v4, Pest v4.

---

## Current Assessment

The management area is functional, but it is not yet "sempurna". The main issue is not one isolated bug. The current system has several partially finished workflows:

- Course, lesson, task, and assessment entities have draft/published/archived concepts, but some code still uses `is_published` while other code uses `status`.
- Admin React pages expect richer fields than the backend sends in several lists.
- Assessment question routes accept nested URLs but do not consistently prove the question belongs to the nested assessment.
- Destructive actions delete entities that may already have learner progress, submissions, enrollments, or quiz attempts.
- Existing tests cover only a small part of the admin management flow.
- The local test environment is blocked by the same MySQL `crypter_test` connection issue found during the auth audit.

Recommended strategy: contract-first hardening. First make tests runnable, then lock expected admin props and workflow behavior in Pest tests, then normalize backend state transitions, then simplify the frontend workflow around the now-stable contract.

---

## Target Management Flow

### Course Workflow

1. Admin creates a course as `draft`.
2. Admin edits title, summary, cover, category, difficulty, duration, and ordering.
3. Admin adds lessons and tasks.
4. Admin optionally attaches assessments.
5. System validates publish readiness:
   - course has title, slug, summary, and at least one lesson;
   - every publishable lesson has required content;
   - every publishable task has valid content for its type;
   - quiz tasks have questions;
   - assessment publish rules pass.
6. Admin publishes the course.
7. Learners can enroll and progress.
8. Admin can archive a course with learner history preserved.
9. Delete is reserved for content that has no learner history.

### Lesson Workflow

1. Admin creates lesson under a course as `draft`.
2. Admin assigns topic, prerequisite lesson, description, content, learning objectives, and key concepts.
3. Admin reorders lessons inside the course.
4. Admin publishes a lesson only when its required fields and task dependencies are valid.
5. Admin archives lessons with learner history preserved.
6. Delete is blocked when lesson progress exists.

### Task Workflow

1. Admin creates video, read, quiz, lab, or challenge task under a lesson as `draft`.
2. Admin configures task-specific required fields:
   - video: `video_url` or processed upload status ready;
   - read: content, document, or converted PDF;
   - quiz: at least one question and valid answer key;
   - lab/challenge: content/instructions and scoring rules.
3. Admin sets prerequisite task only within the same lesson.
4. Admin reorders tasks inside the lesson.
5. Learner access checks use real completion data from `task_progress` and `quiz_submissions`.
6. Delete is blocked when progress or submissions exist.

### User Management Workflow

1. Admin searches, filters, and paginates users.
2. Admin edits safe profile fields, role, status, and point balances through validated requests.
3. Admin cannot delete self.
4. Admin cannot delete users with irreversible learning or financial history unless an explicit deactivation/status workflow is used.
5. User changes that affect access are auditable.

### Assessment Workflow

1. Admin creates assessment as `draft`.
2. Admin adds questions using direct input or question bank imports.
3. Admin reorders questions inside the assessment only.
4. Publish readiness validates question count, scoring, time limit, passing score, and rubric/completion fields.
5. Learners can attempt only published assessments that pass policy rules.
6. Archive preserves submissions; delete is blocked once submissions exist.

---

## Findings To Fix

### 1. Backend and frontend data contracts are incomplete

Observed examples:

- `CourseController@index` returns course rows with `id`, `slug`, `title`, `summary`, `cover`, `status`, `enrollments_count`, `created_at`, and `updated_at`, while `resources/js/pages/admin/courses/title.tsx` expects fields like `is_published`, `version`, and `published_by_name`.
- Lesson rows omit `topic_id`, `topic_name`, `prerequisite_lesson_id`, `status`, `version`, and `published_by_name`, while `topic.tsx` uses those fields.
- Task rows omit several fields used by `task.tsx`, including publish/version metadata, prerequisite metadata, video processing status, document conversion status, and estimated duration.
- Assessment rows omit `is_published`, `version`, and `published_by_name`, while `assessment.tsx` uses them.

### 2. Publication state has drift

Observed examples:

- `CourseController@store` sets `is_published` and `status` separately.
- `CourseController@togglePublish` checks `$request->has('status')`, but `TogglePublishAdminCourseRequest` validates only `is_published`.
- `AssessmentController@togglePublish` updates only `status`, while `publish` and `archive` update both `status` and `is_published`.
- Policies use `status`, while several tests and factories still use `is_published`.
- The migration `2026_05_07_190000_add_draft_and_versioning_columns.php` says `is_published` is dropped for assessments, but the `Assessment` model and admin UI still reference it.

### 3. Assessment validation is less consistent than course/lesson/task validation

`AssessmentController` and `AssessmentQuestionController` use inline `$request->validate()` in multiple actions. This makes the assessment workflow harder to test and less consistent with the existing admin FormRequest pattern.

### 4. Nested assessment question ownership is not enforced enough

`AssessmentQuestionController@update` and `destroy` receive both `Assessment $assessment` and `AssessmentQuestion $question`, but the action updates or deletes the question without verifying that `$question->assessment_id === $assessment->id`.

### 5. Learner history can be damaged by admin deletes

The app has real learner history tables:

- `enrollments`
- `lesson_progress`
- `task_progress`
- `quiz_submissions`
- `assessment_submissions`
- `certificates`

Admin delete actions need clear guard behavior before deleting courses, lessons, tasks, users, assessments, and questions.

### 6. Task prerequisite logic is incomplete

`LessonTask::canAccess()` currently returns `true` with a comment that it still needs progress tracking. The app already has `task_progress` and `quiz_submissions`, so the prerequisite check should use those tables.

### 7. Frontend workflow is too large and repeated

The admin course child pages are large and repeat status badges, date formatting, CSV import/export logic, dialog behavior, delete confirmations, toasts, and form state patterns. This increases the risk of inconsistent behavior across course, lesson, task, and assessment management.

### 8. Management test coverage is too thin

Current direct admin management tests only cover:

- task management starts without auto-selecting a topic;
- assessment management starts without a selected course filter.

There is no complete coverage for admin CRUD, publish/archive/toggle behavior, nested assessment question ownership, deletion guards, data contracts, or task prerequisite access.

---

## Implementation Plan

### Task 0: Make The Test Environment Runnable

Files to inspect:

- `phpunit.xml`
- `.env.testing` if present
- `config/database.php`

Current blocker:

`php artisan test --filter="login page renders"` fails because MySQL on `127.0.0.1:3306` refuses the `crypter_test` connection.

Implementation decision:

- Prefer an isolated SQLite test connection for local feature/unit tests unless this project intentionally requires MySQL-only behavior.
- Keep production and development database settings unchanged.

Expected test config shape:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

Acceptance checks:

```bash
php artisan test --compact --filter=AdminCourseTaskSelectionTest
php artisan test --compact --filter=AdminCourseAssessmentSelectionTest
```

Do not continue to broad management refactors until a small existing test can run locally.

---

### Task 1: Add Contract Tests For Admin Management Props

Create feature tests before changing controllers.

Files to create:

- `tests/Feature/Admin/AdminManagementContractTest.php`

Test coverage:

- admin course list includes all fields consumed by `title.tsx`;
- admin lesson list includes all fields consumed by `topic.tsx`;
- admin task list includes all fields consumed by `task.tsx`;
- admin assessment list includes all fields consumed by `assessment.tsx`;
- non-admin users cannot access admin management routes.

Required assertions example:

```php
use App\Models\Assessment;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin course management returns the frontend data contract', function (): void {
    $admin = User::factory()->create(['role' => 'admin']);
    $publisher = User::factory()->create(['name' => 'Publisher']);

    $course = Course::factory()->create([
        'status' => 'published',
        'is_published' => true,
        'version' => 2,
        'published_by' => $publisher->id,
    ]);

    $lesson = Lesson::factory()->for($course)->create([
        'status' => 'published',
        'version' => 3,
        'published_by' => $publisher->id,
    ]);

    LessonTask::factory()->for($lesson, 'lesson')->create([
        'status' => 'draft',
        'version' => 1,
        'published_by' => null,
    ]);

    Assessment::factory()->for($course)->create([
        'status' => 'draft',
        'is_published' => false,
        'version' => 1,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'title']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/courses/index')
            ->has('courses.data.0', fn (Assert $row) => $row
                ->where('id', $course->id)
                ->where('status', 'published')
                ->where('is_published', true)
                ->where('version', 2)
                ->where('published_by_name', 'Publisher')
                ->has('lessons_count')
                ->has('tasks_count')
                ->etc()
            )
        );
});
```

Acceptance checks:

```bash
php artisan test --compact --filter=AdminManagementContractTest
```

The new tests should fail before the controller contract is fixed.

---

### Task 2: Normalize Publication State Around `status`

Files to modify:

- `app/Models/Course.php`
- `app/Models/Lesson.php`
- `app/Models/LessonTask.php`
- `app/Models/Assessment.php`
- `app/Http/Controllers/Admin/CourseController.php`
- `app/Http/Controllers/Admin/LessonController.php`
- `app/Http/Controllers/Admin/TaskController.php`
- `app/Http/Controllers/Admin/AssessmentController.php`
- relevant factories and policy tests

Decision:

- Use `status` as the canonical source of truth.
- Keep `is_published` only as a compatibility mirror for models/tables that still have the column.
- Do not let controller actions set `status` and `is_published` independently.

Add model constants where missing:

```php
public const STATUS_DRAFT = 'draft';
public const STATUS_PUBLISHED = 'published';
public const STATUS_ARCHIVED = 'archived';
```

Use a consistent controller transition:

```php
$course->forceFill([
    'status' => Course::STATUS_PUBLISHED,
    'is_published' => true,
    'published_by' => $request->user()->id,
    'version' => $course->version + 1,
])->save();
```

For draft/toggle:

```php
$isPublished = $request->boolean('is_published');

$course->forceFill([
    'status' => $isPublished ? Course::STATUS_PUBLISHED : Course::STATUS_DRAFT,
    'is_published' => $isPublished,
    'published_by' => $isPublished ? $request->user()->id : null,
    'version' => $course->version + 1,
])->save();
```

For archive:

```php
$course->forceFill([
    'status' => Course::STATUS_ARCHIVED,
    'is_published' => false,
    'version' => $course->version + 1,
])->save();
```

Add tests:

- toggling course publish from false to true sets `status=published` and `is_published=true`;
- toggling from true to false sets `status=draft` and `is_published=false`;
- archiving course sets `status=archived` and `is_published=false`;
- assessment publish/toggle/archive uses the same behavior;
- policy tests create records with `status`, not only `is_published`.

Acceptance checks:

```bash
php artisan test --compact --filter=CoursePolicyTest
php artisan test --compact --filter=AssessmentPolicyTest
php artisan test --compact --filter=AdminManagementStatusTest
```

---

### Task 3: Complete Admin Index Data Contracts

Files to modify:

- `app/Http/Controllers/Admin/CourseController.php`
- `resources/js/types/course-management.ts`
- `resources/js/types/assessments.ts`

Backend contract requirements:

Course rows must include:

```php
[
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
    'created_at' => optional($course->created_at)->toIso8601String(),
    'updated_at' => optional($course->updated_at)->toIso8601String(),
]
```

Lesson rows must include:

```php
[
    'id' => $lesson->id,
    'course_id' => $lesson->course_id,
    'course_title' => $lesson->course?->title,
    'topic_id' => $lesson->topic_id,
    'topic_name' => $lesson->topic?->title,
    'prerequisite_lesson_id' => $lesson->prerequisite_lesson_id,
    'title' => $lesson->title,
    'slug' => $lesson->slug,
    'description' => $lesson->description,
    'content' => $lesson->content,
    'position' => $lesson->position,
    'status' => $lesson->status,
    'version' => $lesson->version,
    'published_by_name' => $lesson->publishedBy?->name,
    'tasks_count' => $lesson->tasks_count,
]
```

Task rows must include:

```php
[
    'id' => $task->id,
    'lesson_id' => $task->lesson_id,
    'lesson_title' => $task->lesson?->title,
    'course_id' => $task->lesson?->course_id,
    'title' => $task->title,
    'type' => $task->type,
    'content' => $task->content,
    'position' => $task->position,
    'estimated_minutes' => $task->estimated_minutes,
    'status' => $task->status,
    'version' => $task->version,
    'published_by_name' => $task->publishedBy?->name,
    'prerequisite_task_id' => $task->prerequisite_task_id,
    'video_url' => $task->video_url,
    'video_processing_status' => $task->video_processing_status,
    'video_mp4_url' => $task->video_mp4_url,
    'document_name' => $task->document_name,
    'conversion_status' => $task->conversion_status,
    'pdf_url' => $task->pdf_url,
]
```

Assessment rows must include:

```php
[
    'id' => $assessment->id,
    'course_id' => $assessment->course_id,
    'course_title' => $assessment->course?->title,
    'title' => $assessment->title,
    'description' => $assessment->description,
    'type' => $assessment->type,
    'difficulty' => $assessment->difficulty,
    'bloom_level' => $assessment->bloom_level,
    'time_limit_minutes' => $assessment->time_limit_minutes,
    'passing_score' => $assessment->passing_score,
    'status' => $assessment->status,
    'is_published' => $assessment->status === Assessment::STATUS_PUBLISHED,
    'version' => $assessment->version,
    'published_by_name' => $assessment->publishedBy?->name,
    'questions_count' => $assessment->questions_count,
]
```

Query requirements:

- Use `with()` for `publishedBy`, `course`, `topic`, and prerequisite relations used in maps.
- Use `withCount()` for list counts.
- Preserve existing pagination and filtering behavior.
- Do not hardcode frontend-only fallback state that hides missing backend fields.

Acceptance checks:

```bash
php artisan test --compact --filter=AdminManagementContractTest
npm run types:check
```

---

### Task 4: Move Assessment Validation Into FormRequests

Files to create:

- `app/Http/Requests/Admin/StoreAdminAssessmentRequest.php`
- `app/Http/Requests/Admin/UpdateAdminAssessmentRequest.php`
- `app/Http/Requests/Admin/ReorderAdminAssessmentsRequest.php`
- `app/Http/Requests/Admin/StoreAdminAssessmentQuestionRequest.php`
- `app/Http/Requests/Admin/UpdateAdminAssessmentQuestionRequest.php`
- `app/Http/Requests/Admin/ReorderAdminAssessmentQuestionsRequest.php`

Files to modify:

- `app/Http/Controllers/Admin/AssessmentController.php`
- `app/Http/Controllers/Admin/AssessmentQuestionController.php`

Rules for assessment store/update:

```php
return [
    'course_id' => ['nullable', 'integer', 'exists:courses,id'],
    'title' => ['required', 'string', 'max:255'],
    'description' => ['nullable', 'string'],
    'type' => ['required', 'string', 'in:quiz,essay,project,practical'],
    'difficulty' => ['required', 'string', 'in:beginner,intermediate,advanced'],
    'bloom_level' => ['nullable', 'string', 'max:50'],
    'time_limit_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
    'passing_score' => ['required', 'integer', 'min:0', 'max:100'],
    'status' => ['nullable', 'string', 'in:draft,published,archived'],
];
```

Rules for question store/update:

```php
return [
    'question' => ['required', 'string'],
    'type' => ['required', 'string', 'in:multiple_choice,true_false,short_answer,essay,code'],
    'options' => ['nullable', 'array'],
    'correct_answer' => ['nullable'],
    'explanation' => ['nullable', 'string'],
    'points' => ['required', 'integer', 'min:1', 'max:100'],
    'sort_order' => ['nullable', 'integer', 'min:1'],
    'bloom_level' => ['nullable', 'string', 'max:50'],
    'rubric' => ['nullable', 'array'],
];
```

Add `authorize()` to FormRequests:

```php
public function authorize(): bool
{
    return $this->user()?->isAdmin() === true;
}
```

Acceptance checks:

```bash
php artisan test --compact --filter=AdminAssessment
vendor/bin/pint --dirty --format agent
```

---

### Task 5: Enforce Nested Assessment Question Ownership

Files to modify:

- `app/Http/Controllers/Admin/AssessmentQuestionController.php`

Add a controller guard for nested question actions:

```php
private function ensureQuestionBelongsToAssessment(Assessment $assessment, AssessmentQuestion $question): void
{
    abort_unless($question->assessment_id === $assessment->id, 404);
}
```

Use it in:

- `update`
- `destroy`

Add tests:

- admin cannot update a question through another assessment's nested route;
- admin cannot delete a question through another assessment's nested route;
- reorder only affects questions belonging to the route assessment.

Expected test file:

- `tests/Feature/Admin/AdminAssessmentQuestionOwnershipTest.php`

Acceptance checks:

```bash
php artisan test --compact --filter=AdminAssessmentQuestionOwnershipTest
```

---

### Task 6: Add Safe Delete And Archive Rules

Files to modify:

- `app/Http/Controllers/Admin/CourseController.php`
- `app/Http/Controllers/Admin/LessonController.php`
- `app/Http/Controllers/Admin/TaskController.php`
- `app/Http/Controllers/Admin/UserController.php`
- `app/Http/Controllers/Admin/AssessmentController.php`
- `app/Http/Controllers/Admin/AssessmentQuestionController.php`

Behavior rules:

- Course delete is blocked when enrollments, certificates, lesson progress, task progress, quiz submissions, or assessment submissions exist. Admin should archive instead.
- Lesson delete is blocked when `lesson_progress` or task history exists for tasks under that lesson.
- Task delete is blocked when `task_progress` or `quiz_submissions` exist.
- Assessment delete is blocked when `assessment_submissions` exist.
- Assessment question delete is blocked when submitted answers reference the question.
- User delete is blocked for the current admin user and for users with learning, certificate, balance, or submission history. Use status deactivation instead.

Example controller pattern:

```php
if ($course->enrollments()->exists()) {
    return back()->withErrors([
        'course' => __('Archive this course instead. It already has learner history.'),
    ]);
}
```

Add tests:

- enrolled course cannot be deleted;
- lesson with progress cannot be deleted;
- task with progress cannot be deleted;
- assessment with submissions cannot be deleted;
- admin cannot delete self;
- user with history cannot be deleted.

Expected test file:

- `tests/Feature/Admin/AdminManagementDeleteGuardTest.php`

Acceptance checks:

```bash
php artisan test --compact --filter=AdminManagementDeleteGuardTest
```

---

### Task 7: Complete Task Prerequisite Access Logic

Files to modify:

- `app/Models/LessonTask.php`
- `app/Http/Requests/Admin/StoreAdminLessonTaskRequest.php`
- `app/Http/Requests/Admin/UpdateAdminLessonTaskRequest.php`
- any feature tests for course task access

Backend rules:

- `prerequisite_task_id` must reference a task in the same lesson.
- A task with no prerequisite is accessible.
- A task with prerequisite is accessible only when the prerequisite is complete for the user.
- For quiz prerequisites, passing/completion must use the existing quiz submission semantics.
- For video/read prerequisites, completion must use `task_progress.completed_at`.

Suggested model logic:

```php
public function canAccess(User $user): bool
{
    if ($this->prerequisite_task_id === null) {
        return true;
    }

    $prerequisite = self::query()->find($this->prerequisite_task_id);

    if ($prerequisite === null) {
        return false;
    }

    if ($prerequisite->type === 'quiz') {
        return $prerequisite->submissions()
            ->where('user_id', $user->id)
            ->where('passed', true)
            ->exists();
    }

    return $prerequisite->progress()
        ->where('user_id', $user->id)
        ->whereNotNull('completed_at')
        ->exists();
}
```

If `submissions()` or `progress()` relations are missing on `LessonTask`, add them using the existing `QuizSubmission` and `TaskProgress` models.

Add tests:

- task with no prerequisite is accessible;
- task with incomplete prerequisite is not accessible;
- task with completed prerequisite is accessible;
- validation rejects prerequisite task from another lesson.

Acceptance checks:

```bash
php artisan test --compact --filter=LessonTaskPrerequisiteTest
```

---

### Task 8: Stabilize Admin React Workflow

Files to modify:

- `resources/js/pages/admin/courses/title.tsx`
- `resources/js/pages/admin/courses/topic.tsx`
- `resources/js/pages/admin/courses/task.tsx`
- `resources/js/pages/admin/courses/assessment.tsx`
- `resources/js/pages/admin/users/index.tsx`
- shared components/hooks under existing `resources/js/components` or existing local admin component folders only

Do this after backend contracts pass.

Frontend rules:

- Keep Wayfinder imports for backend calls.
- Keep file upload forms using `router.post` with `_method` and `forceFormData` where needed.
- Extract repeated status display into one shared component.
- Replace `confirm()` with existing `AlertDialog`.
- Normalize toast language to Indonesian or the app's chosen admin language.
- Normalize date formatting through one helper.
- Keep filters reflected in query parameters.
- Keep selected course/lesson/assessment state explicit and recoverable from URL query where the page already supports it.

Shared status component shape:

```tsx
type PublishStatus = 'draft' | 'published' | 'archived';

export function PublishStatusBadge({ status }: { status: PublishStatus }) {
    const label = {
        draft: 'Draft',
        published: 'Published',
        archived: 'Archived',
    }[status];

    return <Badge variant={status === 'published' ? 'default' : 'secondary'}>{label}</Badge>;
}
```

Do not create visual redesign work in this task. The goal is workflow stability, not a new admin UI.

Acceptance checks:

```bash
npm run types:check
npm run lint
```

---

### Task 9: Add Admin Management Smoke Tests

Files to create or modify:

- `tests/Feature/Admin/AdminCourseManagementTest.php`
- `tests/Feature/Admin/AdminLessonManagementTest.php`
- `tests/Feature/Admin/AdminTaskManagementTest.php`
- `tests/Feature/Admin/AdminAssessmentManagementTest.php`
- `tests/Feature/Admin/AdminUserManagementTest.php`

Minimum smoke coverage:

- admin can create, update, publish, archive each supported content type;
- non-admin cannot access management routes;
- invalid payloads are rejected with validation errors;
- reorder actions only affect entities inside the expected parent scope;
- user management cannot delete self;
- user role/status updates validate allowed values.

Acceptance checks:

```bash
php artisan test --compact --filter=Admin
```

---

### Task 10: Final Verification

Run after all implementation tasks:

```bash
vendor/bin/pint --dirty --format agent
npm run types
npm run types:check
npm run lint
php artisan test --compact
```

If frontend behavior changed materially, run the app and inspect the admin pages:

```bash
composer dev
```

Use the actual project URL resolved by Laravel Boost `get-absolute-url` if that tool is available in the implementation session.

Manual admin checks:

- course draft to publish to archive;
- lesson create, edit, reorder, publish;
- task create for video/read/quiz, prerequisite set, reorder, publish;
- assessment create, question create, reorder, publish;
- user search, edit status/role, blocked self-delete;
- delete attempts with learner history return clear errors.

---

## Execution Order

1. Fix test environment.
2. Add failing admin contract/status/ownership/delete guard tests.
3. Normalize publication state.
4. Complete admin index contracts.
5. Move assessment validation into FormRequests.
6. Enforce nested assessment question ownership.
7. Add safe delete/archive guards.
8. Complete task prerequisite logic.
9. Stabilize React workflows.
10. Run final verification.

---

## Out Of Scope For Plan 1

- Full visual redesign of the admin dashboard.
- New role/permission package.
- Replacing Inertia with API-only admin screens.
- Removing all `is_published` columns from the database. That should be a separate migration plan after compatibility is proven.
- Large content-version UI. This plan only preserves and exposes existing version metadata.

---

## Definition Of Done

Management Plan 1 is complete when:

- existing tests run locally;
- admin management has feature tests for data contracts, status lifecycle, ownership, delete guards, and prerequisite access;
- `status` is canonical for publish/archive behavior;
- backend props match the React types and UI usage;
- assessment validation uses FormRequests;
- nested assessment question routes cannot modify questions from another assessment;
- destructive admin actions preserve learner history;
- frontend management pages avoid duplicated status/delete/date workflow code where practical;
- `vendor/bin/pint --dirty --format agent`, `npm run types`, `npm run types:check`, `npm run lint`, and `php artisan test --compact` pass.
