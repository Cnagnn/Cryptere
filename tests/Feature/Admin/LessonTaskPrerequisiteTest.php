<?php

use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizSubmission;
use App\Models\TaskProgress;
use App\Models\User;

test('published task with no prerequisite is accessible', function (): void {
    $user = User::factory()->create();
    $task = LessonTask::factory()->create(['status' => 'published', 'prerequisite_task_id' => null]);

    expect($task->canAccess($user))->toBeTrue();
});

test('task with incomplete prerequisite is not accessible', function (): void {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();
    $prerequisite = LessonTask::factory()->for($lesson, 'lesson')->create(['status' => 'published']);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'status' => 'published',
        'prerequisite_task_id' => $prerequisite->id,
    ]);

    expect($task->canAccess($user))->toBeFalse();
});

test('task with completed prerequisite is accessible', function (): void {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();
    $prerequisite = LessonTask::factory()->for($lesson, 'lesson')->create(['status' => 'published', 'type' => 'read']);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'status' => 'published',
        'prerequisite_task_id' => $prerequisite->id,
    ]);

    TaskProgress::query()->create([
        'user_id' => $user->id,
        'lesson_task_id' => $prerequisite->id,
        'completed_at' => now(),
    ]);

    expect($task->canAccess($user))->toBeTrue();
});

test('task with completed quiz prerequisite is accessible only after a passing submission', function (): void {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();
    $prerequisite = LessonTask::factory()->for($lesson, 'lesson')->create(['status' => 'published', 'type' => 'quiz']);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'status' => 'published',
        'prerequisite_task_id' => $prerequisite->id,
    ]);

    QuizSubmission::factory()->for($user)->for($prerequisite, 'task')->create([
        'attempt_number' => 1,
        'score' => 4,
        'total' => 10,
    ]);

    expect($task->canAccess($user))->toBeFalse();

    QuizSubmission::factory()->for($user)->for($prerequisite, 'task')->create([
        'attempt_number' => 2,
        'score' => 8,
        'total' => 10,
    ]);

    expect($task->canAccess($user))->toBeTrue();
});

test('validation rejects prerequisite task from another lesson', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $lesson = Lesson::factory()->create();
    $otherLesson = Lesson::factory()->create();
    $otherTask = LessonTask::factory()->for($otherLesson, 'lesson')->create();

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson->id,
            'title' => 'Read task',
            'description' => 'Read this material.',
            'type' => 'read',
            'document' => null,
            'prerequisite_task_id' => $otherTask->id,
        ])
        ->assertSessionHasErrors('prerequisite_task_id');
});
