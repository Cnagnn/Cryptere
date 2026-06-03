<?php

use App\Models\User;

test('guest cannot access appearance settings', function (): void {
    $this->get(route('settings.appearance.edit'))
        ->assertRedirect(route('login'));
});

test('authenticated user is redirected from old appearance settings page to profile settings tab', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.appearance.edit'))
        ->assertRedirect(route('profile.settings', $user->username));
});
