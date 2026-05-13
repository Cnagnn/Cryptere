<?php

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Policies\AssessmentPolicy;

beforeEach(function () {
    $this->policy = new AssessmentPolicy;
});

test('any user can view any assessments', function () {
    $user = User::factory()->create(['role' => 'member']);

    expect($this->policy->viewAny($user))->toBeTrue();
});

test('user can view published assessment', function () {
    $user = User::factory()->create(['role' => 'member']);
    $assessment = Assessment::factory()->create(['status' => 'published']);

    expect($this->policy->view($user, $assessment))->toBeTrue();
});

test('user cannot view unpublished assessment', function () {
    $user = User::factory()->create(['role' => 'member']);
    $assessment = Assessment::factory()->create(['status' => 'draft']);

    expect($this->policy->view($user, $assessment))->toBeFalse();
});

test('admin can view unpublished assessment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $assessment = Assessment::factory()->create(['status' => 'draft']);

    expect($this->policy->view($admin, $assessment))->toBeTrue();
});

test('enrolled user can attempt available assessment', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'max_attempts' => 3,
        'available_from' => null,
        'available_until' => null,
    ]);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    expect($this->policy->attempt($user, $assessment))->toBeTrue();
});

test('non-enrolled user cannot attempt course assessment', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'max_attempts' => 3,
    ]);

    expect($this->policy->attempt($user, $assessment))->toBeFalse();
});

test('user cannot attempt unpublished assessment', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->create([
        'status' => 'draft',
        'course_id' => null,
    ]);

    expect($this->policy->attempt($user, $assessment))->toBeFalse();
});

test('only admin can create assessments', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);

    expect($this->policy->create($admin))->toBeTrue();
    expect($this->policy->create($user))->toBeFalse();
});

test('only admin can update assessments', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);
    $assessment = Assessment::factory()->create();

    expect($this->policy->update($admin, $assessment))->toBeTrue();
    expect($this->policy->update($user, $assessment))->toBeFalse();
});

test('only admin can delete assessments', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);
    $assessment = Assessment::factory()->create();

    expect($this->policy->delete($admin, $assessment))->toBeTrue();
    expect($this->policy->delete($user, $assessment))->toBeFalse();
});

test('only admin can grade submissions', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);

    expect($this->policy->grade($admin))->toBeTrue();
    expect($this->policy->grade($user))->toBeFalse();
});
