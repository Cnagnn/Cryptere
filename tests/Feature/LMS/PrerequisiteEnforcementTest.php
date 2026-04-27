<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

test('user can enroll in course without prerequisite', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    $this->assertDatabaseHas('enrollments', [
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);
});

test('user cannot enroll in course with incomplete prerequisite', function () {
    $user = User::factory()->create();
    $prerequisite = Course::factory()->create(['is_published' => true]);
    $course = Course::factory()->create([
        'is_published' => true,
        'prerequisite_course_id' => $prerequisite->id,
    ]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    $this->assertDatabaseMissing('enrollments', [
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);
});

test('user can enroll after completing prerequisite', function () {
    $user = User::factory()->create();
    $prerequisite = Course::factory()->create(['is_published' => true]);
    $course = Course::factory()->create([
        'is_published' => true,
        'prerequisite_course_id' => $prerequisite->id,
    ]);

    // Complete the prerequisite
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $prerequisite->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    $this->assertDatabaseHas('enrollments', [
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);
});

test('user with enrolled but incomplete prerequisite cannot enroll', function () {
    $user = User::factory()->create();
    $prerequisite = Course::factory()->create(['is_published' => true]);
    $course = Course::factory()->create([
        'is_published' => true,
        'prerequisite_course_id' => $prerequisite->id,
    ]);

    // Enrolled but not completed
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $prerequisite->id,
        'progress_percentage' => 50,
        'completed_at' => null,
    ]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    $this->assertDatabaseMissing('enrollments', [
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);
});

test('duplicate enrollment is idempotent', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    expect(Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->count())->toBe(1);
});
