<?php

use App\Jobs\ConvertLessonVideo;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can create update and delete lesson and task from management', function () {
    Queue::fake();

    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $course = Course::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.courses.lessons.store'), [
            'course_id' => $course->id,
            'title' => 'Encryption Basics',
            'description' => 'Intro topic about encryption concepts.',
        ])
        ->assertRedirect();

    $lesson = Lesson::query()->where('course_id', $course->id)->where('title', 'Encryption Basics')->first();

    expect($lesson)->not->toBeNull();

    $this->actingAs($admin)
        ->patch(route('admin.courses.lessons.update', ['lesson' => $lesson?->id]), [
            'title' => 'Encryption Basics Updated',
            'description' => 'Updated topic description.',
        ])
        ->assertRedirect();

    expect($lesson?->fresh()?->title)->toBe('Encryption Basics Updated');

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson?->id,
            'title' => 'Watch Caesar Video',
            'description' => 'Task to watch lesson video material.',
            'type' => 'video',
            'minutes' => 12,
            'video_url' => 'https://example.com/video',
        ])
        ->assertRedirect();

    $task = LessonTask::query()->where('lesson_id', $lesson?->id)->where('title', 'Watch Caesar Video')->first();

    expect($task)->not->toBeNull();
    expect($task?->type)->toBe('video');
    expect($task?->video_processing_status)->toBe('pending');

    Queue::assertPushed(ConvertLessonVideo::class);

    $this->actingAs($admin)
        ->patch(route('admin.courses.tasks.update', ['task' => $task?->id]), [
            'title' => 'Watch Caesar Video Updated',
            'description' => 'Updated task description.',
            'type' => 'quiz',
            'minutes' => 8,
            'video_url' => null,
            'quiz_questions' => [
                [
                    'question' => 'What is Caesar cipher shift of A by 3?',
                    'options' => ['A', 'C', 'D', 'E'],
                    'correct_option' => 3,
                    'explanation' => 'A shifted by 3 becomes D.',
                ],
            ],
        ])
        ->assertRedirect();

    expect($task?->fresh()?->title)->toBe('Watch Caesar Video Updated');
    expect($task?->fresh()?->type)->toBe('quiz');
    expect($task?->fresh()?->quizQuestions()->count())->toBe(1);

    $this->actingAs($admin)
        ->delete(route('admin.courses.tasks.destroy', ['task' => $task?->id]))
        ->assertRedirect();

    expect(LessonTask::query()->whereKey($task?->id)->exists())->toBeFalse();

    $this->actingAs($admin)
        ->delete(route('admin.courses.lessons.destroy', ['lesson' => $lesson?->id]))
        ->assertRedirect();

    expect(Lesson::query()->whereKey($lesson?->id)->exists())->toBeFalse();
});

test('admin can reorder lessons from builder endpoint', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $course = Course::factory()->create();

    $firstLesson = Lesson::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    $secondLesson = Lesson::factory()->create([
        'course_id' => $course->id,
        'position' => 2,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.courses.lessons.reorder'), [
            'items' => [
                ['id' => $firstLesson->id, 'position' => 2],
                ['id' => $secondLesson->id, 'position' => 1],
            ],
        ])
        ->assertRedirect();

    expect($firstLesson->fresh()?->position)->toBe(2);
    expect($secondLesson->fresh()?->position)->toBe(1);
});

test('admin can reorder tasks from builder endpoint', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $lesson = Lesson::factory()->create();

    $firstTask = LessonTask::factory()->create([
        'lesson_id' => $lesson->id,
        'sort_order' => 1,
    ]);

    $secondTask = LessonTask::factory()->create([
        'lesson_id' => $lesson->id,
        'sort_order' => 2,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.reorder'), [
            'items' => [
                ['id' => $firstTask->id, 'sort_order' => 2],
                ['id' => $secondTask->id, 'sort_order' => 1],
            ],
        ])
        ->assertRedirect();

    expect($firstTask->fresh()?->sort_order)->toBe(2);
    expect($secondTask->fresh()?->sort_order)->toBe(1);
});

test('admin can toggle course publish status', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $course = Course::factory()->create([
        'is_published' => false,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.courses.toggle-publish', ['course' => $course->id]), [
            'is_published' => true,
        ])
        ->assertRedirect();

    expect($course->fresh()?->is_published)->toBeTrue();

    $this->actingAs($admin)
        ->patch(route('admin.courses.toggle-publish', ['course' => $course->id]))
        ->assertRedirect();

    expect($course->fresh()?->is_published)->toBeFalse();
});

test('admin can reorder course catalog rows', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $firstCourse = Course::factory()->create([
        'sort_order' => 1,
    ]);

    $secondCourse = Course::factory()->create([
        'sort_order' => 2,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.courses.reorder'), [
            'items' => [
                ['id' => $firstCourse->id, 'sort_order' => 2],
                ['id' => $secondCourse->id, 'sort_order' => 1],
            ],
        ])
        ->assertRedirect();

    expect($firstCourse->fresh()?->sort_order)->toBe(2);
    expect($secondCourse->fresh()?->sort_order)->toBe(1);
});

test('admin can open course management page', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $course = Course::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.courses.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/courses/index')
            ->where('courses.data.0.id', $course->id),
        );
});

test('topic and task management ids are unique in inertia payload', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $course = Course::factory()->create();

    $firstLesson = Lesson::factory()->create([
        'course_id' => $course->id,
        'content' => json_encode([
            'tasks' => [
                [
                    'type' => 'video',
                    'title' => 'Legacy Task One',
                    'minutes' => 5,
                    'videoUrl' => 'https://example.com/legacy-one',
                ],
                [
                    'type' => 'read',
                    'title' => 'Legacy Task Two',
                    'minutes' => 8,
                    'videoUrl' => null,
                ],
            ],
        ]),
    ]);

    Lesson::factory()->create([
        'course_id' => $course->id,
    ]);

    $topicResponse = $this->actingAs($admin)->get(route('admin.courses.index', [
        'section' => 'lesson',
        'course_id' => $course->id,
    ]));

    $topicResponse->assertOk();

    /** @var array<int, array{management_id: string}> $topicRows */
    $topicRows = $topicResponse->viewData('page')['props']['lessons']['data'];
    $topicManagementIds = array_column($topicRows, 'management_id');

    expect($topicManagementIds)
        ->not->toBeEmpty()
        ->and(count($topicManagementIds))
        ->toBe(count(array_unique($topicManagementIds)));

    $taskResponse = $this->actingAs($admin)->get(route('admin.courses.index', [
        'section' => 'task',
        'course_id' => $course->id,
        'lesson_id' => $firstLesson->id,
    ]));

    $taskResponse->assertOk();

    /** @var array<int, array{id: int, management_id: string, is_legacy: bool}> $taskRows */
    $taskRows = $taskResponse->viewData('page')['props']['tasks']['data'];
    $taskIds = array_column($taskRows, 'id');
    $taskManagementIds = array_column($taskRows, 'management_id');

    expect($taskRows)
        ->toHaveCount(2)
        ->and($taskIds)
        ->toContain(-1, -2)
        ->and(count($taskIds))
        ->toBe(count(array_unique($taskIds)))
        ->and(count($taskManagementIds))
        ->toBe(count(array_unique($taskManagementIds)))
        ->and(collect($taskRows)->every(fn (array $task): bool => $task['is_legacy'] === true))
        ->toBeTrue();
});
