<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;

test('user can enroll in published course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);

    $response = $this->actingAs($user)
        ->post(route('courses.enroll', $course));

    $response->assertRedirect();

    $this->assertDatabaseHas('enrollments', [
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);
});

test('user cannot enroll in unpublished course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => false]);

    $response = $this->actingAs($user)
        ->post(route('courses.enroll', $course));

    $response->assertForbidden();
});

test('guest cannot enroll', function () {
    $course = Course::factory()->create(['is_published' => true]);

    $response = $this->post(route('courses.enroll', $course));

    $response->assertRedirect(route('login'));
});

test('user can reset course progress', function () {
    $user = User::factory()->create(['points' => 100, 'xp' => 100]);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 50,
    ]);

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->post(route('courses.reset', $course));

    $response->assertRedirect();

    $enrollment->refresh();
    expect((int) $enrollment->progress_percentage)->toBe(0);
});

test('user cannot reset another users enrollment', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);

    Enrollment::factory()->create([
        'user_id' => $owner->id,
        'course_id' => $course->id,
        'progress_percentage' => 50,
    ]);

    $response = $this->actingAs($other)
        ->post(route('courses.reset', $course));

    $response->assertStatus(404);
});
