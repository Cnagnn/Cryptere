<?php

use App\Models\User;

test('guest cannot access profile settings', function () {
    $this->get(route('settings.profile.edit'))
        ->assertRedirect(route('login'));
});

test('authenticated user can view profile settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.profile.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/profile')
            ->has('mustVerifyEmail')
            ->has('profileUser')
            ->has('badges')
            ->has('socialAccounts')
            ->has('hasPassword')
        );
});

test('user can update profile information', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => 'Updated Name',
            'email' => 'newemail@example.com',
        ])
        ->assertRedirect(route('settings.profile.edit'));

    $user->refresh();
    expect($user->name)->toBe('Updated Name')
        ->and($user->email)->toBe('newemail@example.com')
        ->and($user->email_verified_at)->toBeNull();
});

test('email verification resets when email changes', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => $user->name,
            'email' => 'changed@example.com',
        ]);

    expect($user->fresh()->email_verified_at)->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create(['password' => bcrypt('password')]);

    $this->actingAs($user)
        ->delete(route('settings.profile.destroy'), [
            'password' => 'password',
        ])
        ->assertRedirect('/');

    $this->assertGuest();
    expect(User::find($user->id))->toBeNull();
});

test('profile update requires valid data', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => '',
            'email' => 'not-an-email',
        ])
        ->assertSessionHasErrors(['name', 'email']);
});
