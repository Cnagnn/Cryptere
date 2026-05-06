<?php

use App\Models\Challenge;
use App\Models\User;
use App\Policies\ChallengePolicy;

beforeEach(function () {
    $this->policy = new ChallengePolicy;
});

test('any user can view any challenges', function () {
    $user = User::factory()->create(['role' => 'member']);

    expect($this->policy->viewAny($user))->toBeTrue();
});

test('user can view published challenge', function () {
    $user = User::factory()->create(['role' => 'member']);
    $challenge = Challenge::factory()->create(['is_published' => true]);

    expect($this->policy->view($user, $challenge))->toBeTrue();
});

test('user cannot view unpublished challenge', function () {
    $user = User::factory()->create(['role' => 'member']);
    $challenge = Challenge::factory()->create(['is_published' => false]);

    expect($this->policy->view($user, $challenge))->toBeFalse();
});

test('admin can view unpublished challenge', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $challenge = Challenge::factory()->create(['is_published' => false]);

    expect($this->policy->view($admin, $challenge))->toBeTrue();
});

test('only admin can create challenges', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);

    expect($this->policy->create($admin))->toBeTrue();
    expect($this->policy->create($user))->toBeFalse();
});

test('only admin can update challenges', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);
    $challenge = Challenge::factory()->create();

    expect($this->policy->update($admin, $challenge))->toBeTrue();
    expect($this->policy->update($user, $challenge))->toBeFalse();
});

test('only admin can delete challenges', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'member']);
    $challenge = Challenge::factory()->create();

    expect($this->policy->delete($admin, $challenge))->toBeTrue();
    expect($this->policy->delete($user, $challenge))->toBeFalse();
});

test('user can submit to published challenge', function () {
    $user = User::factory()->create(['role' => 'member']);
    $challenge = Challenge::factory()->create(['is_published' => true]);

    expect($this->policy->submit($user, $challenge))->toBeTrue();
});

test('user cannot submit to unpublished challenge', function () {
    $user = User::factory()->create(['role' => 'member']);
    $challenge = Challenge::factory()->create(['is_published' => false]);

    expect($this->policy->submit($user, $challenge))->toBeFalse();
});
