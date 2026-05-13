<?php

use App\Models\User;

test('guest cannot access appearance settings', function (): void {
    $this->get(route('settings.appearance.edit'))
        ->assertRedirect(route('login'));
});

test('authenticated user can view appearance settings', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.appearance.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/appearance')
        );
});
