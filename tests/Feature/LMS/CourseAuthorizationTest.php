<?php

use App\Models\Challenge;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;

test('guest cannot view course catalog', function () {
    $this->get(route('courses.index'))->assertRedirect(route('login'));
});

test('guest cannot view course detail', function () {
    $course = Course::factory()->create();

    $this->get(route('courses.show', $course))->assertRedirect(route('login'));
});

test('authenticated user can view published course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);

    $this->actingAs($user)
        ->get(route('courses.show', $course))
        ->assertOk();
});

test('authenticated user cannot view unpublished course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => false]);

    $this->actingAs($user)
        ->get(route('courses.show', $course))
        ->assertForbidden();
});

test('admin can view unpublished course', function () {
    $admin = User::factory()->create(['is_admin' => true, 'role' => 'admin']);
    $course = Course::factory()->create(['is_published' => false]);

    $this->actingAs($admin)
        ->get(route('courses.show', $course))
        ->assertOk();
});

test('non-admin cannot delete course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($user)
        ->delete(route('admin.courses.destroy', $course))
        ->assertForbidden();
});

test('admin can delete course', function () {
    $admin = User::factory()->create(['is_admin' => true, 'role' => 'admin']);
    $course = Course::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.courses.destroy', $course))
        ->assertRedirect();

    $this->assertDatabaseMissing('courses', ['id' => $course->id]);
});

test('non-admin cannot delete lesson', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    $this->actingAs($user)
        ->delete(route('admin.courses.lessons.destroy', $lesson))
        ->assertForbidden();
});

test('admin can delete lesson', function () {
    $admin = User::factory()->create(['is_admin' => true, 'role' => 'admin']);
    $lesson = Lesson::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.courses.lessons.destroy', $lesson))
        ->assertRedirect();

    $this->assertDatabaseMissing('lessons', ['id' => $lesson->id]);
});

test('authenticated user cannot view unpublished challenge', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => false]);

    $this->actingAs($user)
        ->get(route('challenges.show', $challenge))
        ->assertForbidden();
});

test('admin can view unpublished challenge', function () {
    $admin = User::factory()->create(['is_admin' => true, 'role' => 'admin']);
    $challenge = Challenge::factory()->create(['is_published' => false]);

    $this->actingAs($admin)
        ->get(route('challenges.show', $challenge))
        ->assertOk();
});

test('user cannot submit to unpublished challenge', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['is_published' => false]);

    $this->actingAs($user)
        ->post(route('challenges.submit', $challenge), ['answer' => 'test'])
        ->assertForbidden();
});

test('non-admin cannot delete challenge', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    $this->actingAs($user)
        ->delete(route('admin.challenges.destroy', $challenge))
        ->assertForbidden();
});

test('admin can delete challenge', function () {
    $admin = User::factory()->create(['is_admin' => true, 'role' => 'admin']);
    $challenge = Challenge::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.challenges.destroy', $challenge))
        ->assertRedirect();

    $this->assertDatabaseMissing('challenges', ['id' => $challenge->id]);
});

test('user cannot enroll in unpublished course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => false]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertForbidden();
});

test('user can enroll in published course', function () {
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

test('user cannot reset another users enrollment', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);

    Enrollment::factory()->create([
        'user_id' => $owner->id,
        'course_id' => $course->id,
    ]);

    $this->actingAs($other)
        ->post(route('courses.reset', $course))
        ->assertNotFound();
});
