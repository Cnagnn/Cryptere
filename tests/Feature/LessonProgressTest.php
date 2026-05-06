<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\TaskProgress;
use App\Models\User;

test('enrolled user can complete lesson task', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0]);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $task = LessonTask::factory()->create(['lesson_id' => $lesson->id, 'type' => 'video']);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    // Simulate heartbeat engagement (anti-cheat requirement)
    TaskProgress::create([
        'user_id' => $user->id,
        'lesson_task_id' => $task->id,
        'watch_seconds' => 60,
        'started_at' => now()->subMinutes(2),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('courses.lessons.complete', [$course, $lesson]), [
            'task_id' => $task->id,
        ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);

    $this->assertDatabaseHas('task_progress', [
        'user_id' => $user->id,
        'lesson_task_id' => $task->id,
    ]);
});

test('non-enrolled user cannot complete lesson', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);

    $response = $this->actingAs($user)
        ->postJson(route('courses.lessons.complete', [$course, $lesson]));

    $response->assertStatus(403);
});

test('user cannot skip lessons', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson1 = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $lesson2 = Lesson::factory()->create(['course_id' => $course->id, 'position' => 2]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('courses.lessons.complete', [$course, $lesson2]));

    $response->assertStatus(422);
});

test('completing all tasks marks lesson complete and awards xp', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0]);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $task1 = LessonTask::factory()->create(['lesson_id' => $lesson->id, 'type' => 'video']);
    $task2 = LessonTask::factory()->create(['lesson_id' => $lesson->id, 'type' => 'read']);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    // Complete first task (with anti-cheat data)
    TaskProgress::create([
        'user_id' => $user->id,
        'lesson_task_id' => $task1->id,
        'completed_at' => now(),
        'watch_seconds' => 60,
        'started_at' => now()->subMinutes(2),
    ]);

    // Simulate heartbeat for second task (anti-cheat requirement)
    TaskProgress::create([
        'user_id' => $user->id,
        'lesson_task_id' => $task2->id,
        'reading_seconds' => 30,
        'started_at' => now()->subMinutes(1),
    ]);

    // Complete second (last) task
    $response = $this->actingAs($user)
        ->postJson(route('courses.lessons.complete', [$course, $lesson]), [
            'task_id' => $task2->id,
        ]);

    $response->assertOk();

    $user->refresh();
    expect($user->xp)->toBeGreaterThan(0);
});

test('anti-cheat rejects completion without heartbeat', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $task = LessonTask::factory()->create(['lesson_id' => $lesson->id, 'type' => 'video']);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    // No heartbeat sent — should be rejected
    $response = $this->actingAs($user)
        ->postJson(route('courses.lessons.complete', [$course, $lesson]), [
            'task_id' => $task->id,
        ]);

    $response->assertStatus(422);
    $response->assertJson(['success' => false]);
});

test('heartbeat accumulates watch time', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $task = LessonTask::factory()->create(['lesson_id' => $lesson->id, 'type' => 'video']);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('courses.lessons.heartbeat', [$course, $lesson]), [
            'task_id' => $task->id,
            'type' => 'video',
            'seconds' => 30,
        ]);

    $response->assertOk();
    $response->assertJson(['success' => true, 'accumulated' => 30]);

    // Send another heartbeat
    $response = $this->actingAs($user)
        ->postJson(route('courses.lessons.heartbeat', [$course, $lesson]), [
            'task_id' => $task->id,
            'type' => 'video',
            'seconds' => 15,
        ]);

    $response->assertOk();
    $response->assertJson(['success' => true, 'accumulated' => 45]);
});

test('heartbeat rejects non-enrolled user', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $task = LessonTask::factory()->create(['lesson_id' => $lesson->id, 'type' => 'video']);

    $response = $this->actingAs($user)
        ->postJson(route('courses.lessons.heartbeat', [$course, $lesson]), [
            'task_id' => $task->id,
            'type' => 'video',
            'seconds' => 30,
        ]);

    $response->assertStatus(403);
});

test('heartbeat caps seconds at maximum', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $task = LessonTask::factory()->create(['lesson_id' => $lesson->id, 'type' => 'video']);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    // Try to send more than max (60s) — validation should reject
    $response = $this->actingAs($user)
        ->postJson(route('courses.lessons.heartbeat', [$course, $lesson]), [
            'task_id' => $task->id,
            'type' => 'video',
            'seconds' => 999,
        ]);

    $response->assertStatus(422); // Validation fails: max:60
});

test('guest cannot complete lesson', function () {
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);

    $response = $this->postJson(route('courses.lessons.complete', [$course, $lesson]));

    $response->assertUnauthorized();
});
