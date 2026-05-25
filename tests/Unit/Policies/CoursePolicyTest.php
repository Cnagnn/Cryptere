<?php

use App\Models\Course;
use App\Models\User;
use App\Policies\CoursePolicy;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->policy = new CoursePolicy;
});

test('any user can view published course', function () {
    $user = User::factory()->create(['is_admin' => false]);
    $course = Course::factory()->create(['status' => 'published']);

    expect($this->policy->view($user, $course))->toBeTrue();
});

test('non-admin cannot view unpublished course', function () {
    $user = User::factory()->create(['is_admin' => false]);
    $course = Course::factory()->create(['status' => 'draft']);

    expect($this->policy->view($user, $course))->toBeFalse();
});

test('admin can view unpublished course', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create(['status' => 'draft']);

    expect($this->policy->view($user, $course))->toBeTrue();
});

test('only admin can create courses', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);

    expect($this->policy->create($admin))->toBeTrue();
    expect($this->policy->create($user))->toBeFalse();
});

test('course management requires the manage courses permission', function () {
    $admin = User::factory()->admin()->create();

    Permission::findOrCreate('manage courses');
    $admin->roles()->firstOrFail()->revokePermissionTo('manage courses');
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    expect($this->policy->create($admin->refresh()))->toBeFalse();
});

test('only admin can update courses', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);
    $course = Course::factory()->create();

    expect($this->policy->update($admin, $course))->toBeTrue();
    expect($this->policy->update($user, $course))->toBeFalse();
});

test('only admin can delete courses', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);
    $course = Course::factory()->create();

    expect($this->policy->delete($admin, $course))->toBeTrue();
    expect($this->policy->delete($user, $course))->toBeFalse();
});

test('user can enroll in published course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published']);

    expect($this->policy->enroll($user, $course))->toBeTrue();
});

test('user cannot enroll in unpublished course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'draft']);

    expect($this->policy->enroll($user, $course))->toBeFalse();
});

test('viewAny always returns true', function () {
    $user = User::factory()->create(['is_admin' => false]);

    expect($this->policy->viewAny($user))->toBeTrue();
});
