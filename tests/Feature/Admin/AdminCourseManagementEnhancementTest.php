<?php

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\ContentVersion;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuestionBank;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createQuestionBankQuestion(User $creator, array $overrides = []): QuestionBank
{
    return QuestionBank::query()->create([
        'title' => 'Reusable Caesar Question',
        'category' => 'Classical Crypto',
        'question_type' => 'mcq',
        'question_text' => 'What shift is used by a Caesar cipher?',
        'options' => ['Fixed shift', 'Prime modulus', 'Public key', 'Hash block'],
        'correct_answer' => 'Fixed shift',
        'explanation' => 'A Caesar cipher shifts letters by a fixed offset.',
        'points' => 10,
        'created_by' => $creator->id,
        'is_active' => true,
        'times_used' => 0,
        ...$overrides,
    ]);
}

test('admin can attach a question bank item to an assessment as a snapshot', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $assessment = Assessment::factory()->create();
    $bankQuestion = createQuestionBankQuestion($admin, [
        'question_text' => 'Original bank question?',
        'correct_answer' => 'Fixed shift',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.assessments.questions.store', $assessment), [
            'question_bank_id' => $bankQuestion->id,
            'bloom_level' => 'C1',
            'question_type' => 'mcq',
            'question_text' => $bankQuestion->question_text,
            'options' => $bankQuestion->options,
            'correct_answer' => $bankQuestion->correct_answer,
            'explanation' => $bankQuestion->explanation,
            'points' => $bankQuestion->points,
            'grading_type' => 'auto',
        ])
        ->assertRedirect();

    $createdQuestion = AssessmentQuestion::query()->firstOrFail();

    expect($createdQuestion->question_bank_id)->toBe($bankQuestion->id)
        ->and($createdQuestion->question_text)->toBe('Original bank question?')
        ->and($bankQuestion->refresh()->times_used)->toBe(1);

    $bankQuestion->update(['question_text' => 'Edited bank question?']);

    expect($createdQuestion->refresh()->question_text)->toBe('Original bank question?');
});

test('assessment management exposes question bank and version history data for integrated UI', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $course = Course::factory()->create(['title' => 'Cryptography Basics']);
    $assessment = Assessment::factory()->for($course)->create(['title' => 'Caesar Assessment']);
    $bankQuestion = createQuestionBankQuestion($admin);
    $version = ContentVersion::query()->create([
        'versionable_type' => Assessment::class,
        'versionable_id' => $assessment->id,
        'version_number' => 1,
        'content_snapshot' => $assessment->only(['title', 'description', 'status']),
        'changed_fields' => ['title'],
        'change_summary' => 'Initial assessment version',
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'assessment', 'assessment_id' => $assessment->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/courses/index')
            ->has('questionBank.data.0', fn (Assert $row) => $row
                ->where('id', $bankQuestion->id)
                ->where('title', 'Reusable Caesar Question')
                ->where('source_badge', 'Bank')
                ->etc()
            )
            ->has('versionHistories.assessments.'.$assessment->id.'.0', fn (Assert $row) => $row
                ->where('id', $version->id)
                ->where('version_number', 1)
                ->where('change_summary', 'Initial assessment version')
                ->etc()
            )
        );
});

test('course catalog management exposes version history data for integrated UI', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $course = Course::factory()->create(['title' => 'Caesar Catalog']);
    $version = ContentVersion::query()->create([
        'versionable_type' => Course::class,
        'versionable_id' => $course->id,
        'version_number' => 1,
        'content_snapshot' => $course->only(['title', 'summary', 'status']),
        'changed_fields' => ['title'],
        'change_summary' => 'Initial course version',
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'catalog']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/courses/index')
            ->has('versionHistories.courses.'.$course->id.'.0', fn (Assert $row) => $row
                ->where('id', $version->id)
                ->where('version_number', 1)
                ->where('change_summary', 'Initial course version')
                ->etc()
            )
        );
});

test('admin can restore a content version and preserve a pre restore snapshot', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $course = Course::factory()->create([
        'title' => 'Current Title',
        'summary' => 'Current summary',
        'version' => 2,
    ]);
    $version = ContentVersion::query()->create([
        'versionable_type' => Course::class,
        'versionable_id' => $course->id,
        'version_number' => 1,
        'content_snapshot' => [
            'title' => 'Old Title',
            'summary' => 'Old summary',
        ],
        'changed_fields' => ['title', 'summary'],
        'change_summary' => 'Old course version',
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.versions.restore', $version))
        ->assertRedirect();

    expect($course->refresh()->title)->toBe('Old Title')
        ->and($course->summary)->toBe('Old summary')
        ->and(ContentVersion::query()->where('versionable_type', Course::class)->where('versionable_id', $course->id)->count())->toBe(2)
        ->and(ContentVersion::query()->where('change_summary', 'Pre-restore snapshot')->exists())->toBeTrue();
});

test('versionable course management models create content versions when updated', function (string $modelClass, array $attributes, array $updates): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $model = $modelClass::factory()->create($attributes);

    $this->actingAs($admin);

    $model->update($updates);

    $version = ContentVersion::query()
        ->where('versionable_type', $modelClass)
        ->where('versionable_id', $model->id)
        ->first();

    expect($version)->not->toBeNull()
        ->and($version->created_by)->toBe($admin->id)
        ->and($version->changed_fields)->toContain(array_key_first($updates));
})->with([
    'course' => [Course::class, ['title' => 'Old Course'], ['title' => 'New Course']],
    'lesson' => [Lesson::class, ['title' => 'Old Lesson'], ['title' => 'New Lesson']],
    'task' => [LessonTask::class, ['title' => 'Old Task'], ['title' => 'New Task']],
    'assessment' => [Assessment::class, ['title' => 'Old Assessment'], ['title' => 'New Assessment']],
]);
