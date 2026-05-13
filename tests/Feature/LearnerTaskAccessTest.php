<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\TaskProgress;
use App\Models\User;

test('heartbeat rejects locked prerequisite tasks', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $lesson = Lesson::factory()->for($course)->create(['status' => 'published']);
    $prerequisite = LessonTask::factory()->for($lesson, 'lesson')->create(['status' => 'published', 'type' => 'read']);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'status' => 'published',
        'type' => 'video',
        'prerequisite_task_id' => $prerequisite->id,
    ]);
    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->postJson(route('courses.lessons.heartbeat', [$course, $lesson]), [
            'task_id' => $task->id,
            'type' => 'video',
            'seconds' => 10,
        ])
        ->assertForbidden();

    TaskProgress::query()->create([
        'user_id' => $user->id,
        'lesson_task_id' => $prerequisite->id,
        'completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->postJson(route('courses.lessons.heartbeat', [$course, $lesson]), [
            'task_id' => $task->id,
            'type' => 'video',
            'seconds' => 10,
        ])
        ->assertOk();
});
