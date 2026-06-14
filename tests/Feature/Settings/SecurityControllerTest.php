<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('guest cannot access security settings', function () {
    $this->get(route('settings.security.edit'))
        ->assertRedirect(route('login'));
});

test('authenticated user is redirected from old security settings page to profile settings tab', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.security.edit'))
        ->assertRedirect(route('profile.settings', $user->username));
});

test('user can update password from security settings', function (): void {
    $user = User::factory()->create(['password' => bcrypt('CryptereTestUserOld2026!')]);

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'CryptereTestUserOld2026!',
            'password' => 'CryptereTestUserNew2026!',
            'password_confirmation' => 'CryptereTestUserNew2026!',
        ])
        ->assertRedirect(route('profile.settings', $user->username));

    expect(Hash::check('CryptereTestUserNew2026!', $user->fresh()->password))->toBeTrue();
});

test('password update requires current password', function (): void {
    $user = User::factory()->create(['password' => bcrypt('CryptereTestUserOld2026!')]);

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'CryptereTestUserWrong2026!',
            'password' => 'CryptereTestUserNew2026!',
            'password_confirmation' => 'CryptereTestUserNew2026!',
        ])
        ->assertSessionHasErrors('current_password');
});
