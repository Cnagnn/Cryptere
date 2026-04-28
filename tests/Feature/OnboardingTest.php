<?php

use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create([
        'last_active_date' => now(),
        'onboarding_completed_at' => null,
    ]);
});

test('onboarding page renders for authenticated user', function () {
    $this->actingAs($this->user)
        ->get(route('onboarding'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('onboarding')
            ->has('userName')
            ->has('userEmail')
            ->has('hasAvatar')
        );
});

test('onboarding page requires authentication', function () {
    $this->get(route('onboarding'))
        ->assertRedirect(route('login'));
});

test('user can complete onboarding', function () {
    $this->actingAs($this->user)
        ->post(route('onboarding.complete'), [
            'experience_level' => 'beginner',
            'interests' => ['symmetric', 'hashing'],
        ])
        ->assertRedirect(route('dashboard'));

    $this->user->refresh();
    expect($this->user->onboarding_completed_at)->not->toBeNull();
});

test('user can skip onboarding', function () {
    $this->actingAs($this->user)
        ->post(route('onboarding.skip'))
        ->assertRedirect(route('dashboard'));

    $this->user->refresh();
    expect($this->user->onboarding_completed_at)->not->toBeNull();
});

test('onboarding complete validates experience level', function () {
    $this->actingAs($this->user)
        ->post(route('onboarding.complete'), [
            'experience_level' => 'invalid',
        ])
        ->assertSessionHasErrors('experience_level');
});

test('onboarding complete validates interests array', function () {
    $this->actingAs($this->user)
        ->post(route('onboarding.complete'), [
            'interests' => 'not-an-array',
        ])
        ->assertSessionHasErrors('interests');
});

test('onboarding complete sets toast message', function () {
    $this->actingAs($this->user)
        ->post(route('onboarding.complete'), [
            'experience_level' => 'intermediate',
        ])
        ->assertSessionHas('toast');
});

test('onboarding shows user name', function () {
    $this->user->update(['name' => 'Alice Crypto']);

    $this->actingAs($this->user)
        ->get(route('onboarding'))
        ->assertInertia(fn ($page) => $page
            ->where('userName', 'Alice Crypto')
        );
});

test('onboarding accepts optional learning goal', function () {
    $this->actingAs($this->user)
        ->post(route('onboarding.complete'), [
            'learning_goal' => 'Master AES encryption',
            'experience_level' => 'advanced',
            'interests' => ['symmetric'],
        ])
        ->assertRedirect(route('dashboard'));

    $this->user->refresh();
    expect($this->user->onboarding_completed_at)->not->toBeNull();
});
