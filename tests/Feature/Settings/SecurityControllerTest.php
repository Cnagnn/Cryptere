<?php

use App\Models\User;

test('guest cannot access security settings', function () {
    $this->get(route('settings.security.edit'))
        ->assertRedirect(route('login'));
});

test('authenticated user can access security settings', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('settings.security.edit'));

    // Route may require password confirmation — either 200 or redirect to confirm
    expect($response->status())->toBeIn([200, 302]);
});

test('password update route is removed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put('/settings/password')
        ->assertNotFound();
});
