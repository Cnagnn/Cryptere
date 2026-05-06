<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Policies\EnrollmentPolicy;

beforeEach(function () {
    $this->policy = new EnrollmentPolicy;
});

test('owner can view their enrollment', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    expect($this->policy->view($user, $enrollment))->toBeTrue();
});

test('admin can view any enrollment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $owner = User::factory()->create();
    $course = Course::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
        'course_id' => $course->id,
    ]);

    expect($this->policy->view($admin, $enrollment))->toBeTrue();
});

test('non-owner non-admin cannot view enrollment', function () {
    $other = User::factory()->create(['role' => 'member']);
    $owner = User::factory()->create();
    $course = Course::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
        'course_id' => $course->id,
    ]);

    expect($this->policy->view($other, $enrollment))->toBeFalse();
});

test('owner can reset their enrollment', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    expect($this->policy->reset($user, $enrollment))->toBeTrue();
});

test('non-owner cannot reset enrollment', function () {
    $other = User::factory()->create();
    $owner = User::factory()->create();
    $course = Course::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
        'course_id' => $course->id,
    ]);

    expect($this->policy->reset($other, $enrollment))->toBeFalse();
});

test('admin cannot reset other user enrollment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $owner = User::factory()->create();
    $course = Course::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
        'course_id' => $course->id,
    ]);

    expect($this->policy->reset($admin, $enrollment))->toBeFalse();
});

test('only admin can delete enrollment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);
    $course = Course::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    expect($this->policy->delete($admin, $enrollment))->toBeTrue();
    expect($this->policy->delete($user, $enrollment))->toBeFalse();
});
