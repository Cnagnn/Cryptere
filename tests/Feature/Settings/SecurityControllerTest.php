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
    $user = User::factory()->create(['password' => bcrypt('OldPassword123!')]);

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'OldPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
        ->assertRedirect(route('profile.settings', $user->username));

    expect(Hash::check('NewPassword123!', $user->fresh()->password))->toBeTrue();
});

test('password update requires current password', function (): void {
    $user = User::factory()->create(['password' => bcrypt('OldPassword123!')]);

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'WrongPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
        ->assertSessionHasErrors('current_password');
});
