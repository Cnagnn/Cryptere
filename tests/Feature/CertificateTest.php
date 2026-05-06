<?php

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

test('certificates index shows user certificates', function () {
    $user = User::factory()->create();
    Certificate::factory()->count(2)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('certificates.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('certificates/index')
            ->has('certificates', 2)
        );
});

test('user can generate certificate for completed course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'completed_at' => now(),
        'progress_percentage' => 100,
    ]);

    $this->actingAs($user)
        ->post(route('certificates.store'), ['course_id' => $course->id])
        ->assertRedirect();

    $this->assertDatabaseHas('certificates', [
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);
});

test('user cannot generate certificate for incomplete course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'completed_at' => null,
        'progress_percentage' => 50,
    ]);

    $this->actingAs($user)
        ->post(route('certificates.store'), ['course_id' => $course->id])
        ->assertRedirect();

    $this->assertDatabaseMissing('certificates', [
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);
});

test('user cannot generate duplicate certificate', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'completed_at' => now(),
    ]);
    Certificate::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $this->actingAs($user)
        ->post(route('certificates.store'), ['course_id' => $course->id])
        ->assertRedirect();

    expect(Certificate::where('user_id', $user->id)->where('course_id', $course->id)->count())->toBe(1);
});

test('certificate show page accessible by owner', function () {
    $user = User::factory()->create();
    $certificate = Certificate::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('certificates.show', $certificate))
        ->assertSuccessful();
});

test('certificate show page forbidden for non-owner', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $certificate = Certificate::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($other)
        ->get(route('certificates.show', $certificate))
        ->assertForbidden();
});

test('public verification works with valid code', function () {
    $certificate = Certificate::factory()->create();

    $this->get(route('certificates.verify', $certificate->verification_code))
        ->assertSuccessful();
});

test('public verification shows invalid state for bad code', function () {
    $this->get(route('certificates.verify', 'invalid-code-xyz'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('certificates/verify')
            ->where('valid', false)
        );
});
