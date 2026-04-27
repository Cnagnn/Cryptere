<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;

test('deleting a course cascades to lessons', function () {
    $admin = User::factory()->create(['is_admin' => true, 'role' => 'admin']);
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $this->actingAs($admin)
        ->delete(route('admin.courses.destroy', $course));

    $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    $this->assertDatabaseMissing('lessons', ['id' => $lesson->id]);
});

test('deleting a course cascades to enrollments', function () {
    $admin = User::factory()->create(['is_admin' => true, 'role' => 'admin']);
    $user = User::factory()->create();
    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.courses.destroy', $course));

    $this->assertDatabaseMissing('enrollments', [
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);
});

test('deleting a lesson cascades to tasks', function () {
    $admin = User::factory()->create(['is_admin' => true, 'role' => 'admin']);
    $lesson = Lesson::factory()->create();
    $task = LessonTask::factory()->create(['lesson_id' => $lesson->id]);

    $this->actingAs($admin)
        ->delete(route('admin.courses.lessons.destroy', $lesson));

    $this->assertDatabaseMissing('lessons', ['id' => $lesson->id]);
    $this->assertDatabaseMissing('lesson_tasks', ['id' => $task->id]);
});
