<?php

use App\Models\Course;
use App\Models\User;

test('courses index renders for authenticated user', function () {
    $user = User::factory()->create();
    Course::factory()->count(3)->create(['is_published' => true]);

    $this->actingAs($user)
        ->get(route('courses.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('courses/index')
            ->has('courses')
        );
});

test('course show renders for published course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);

    $this->actingAs($user)
        ->get(route('courses.show', $course->slug))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('courses/show')
        );
});

test('course show returns 403 for unpublished course (non-admin)', function () {
    $user = User::factory()->create(['role' => 'member']);
    $course = Course::factory()->create(['is_published' => false]);

    $this->actingAs($user)
        ->get(route('courses.show', $course->slug))
        ->assertForbidden();
});

test('user can enroll in published course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course->slug))
        ->assertRedirect();

    $this->assertDatabaseHas('enrollments', [
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);
});

test('user cannot enroll in unpublished course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => false]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course->slug))
        ->assertForbidden();
});

test('courses require authentication', function () {
    $this->get(route('courses.index'))
        ->assertRedirect('/login');
});
