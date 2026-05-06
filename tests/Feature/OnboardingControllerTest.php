<?php

use App\Models\User;

test('guest cannot access onboarding', function () {
    $this->get(route('onboarding'))
        ->assertRedirect(route('login'));
});

test('authenticated user can view onboarding page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('onboarding'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('onboarding')
            ->has('userName')
            ->has('userEmail')
            ->has('hasAvatar')
        );
});

test('user can complete onboarding', function () {
    $user = User::factory()->create(['onboarding_completed_at' => null]);

    $this->actingAs($user)
        ->post(route('onboarding.complete'), [
            'learning_goal' => 'Learn Laravel',
            'experience_level' => 'beginner',
            'interests' => ['php', 'laravel'],
        ])
        ->assertRedirect(route('dashboard'));

    expect($user->fresh()->onboarding_completed_at)->not->toBeNull();
});

test('user can skip onboarding', function () {
    $user = User::factory()->create(['onboarding_completed_at' => null]);

    $this->actingAs($user)
        ->post(route('onboarding.skip'))
        ->assertRedirect(route('dashboard'));

    expect($user->fresh()->onboarding_completed_at)->not->toBeNull();
});

test('onboarding validates experience level', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('onboarding.complete'), [
            'experience_level' => 'invalid-level',
        ])
        ->assertSessionHasErrors('experience_level');
});
