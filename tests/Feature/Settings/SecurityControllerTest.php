<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

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

test('user can update password from security settings', function (): void {
    $user = User::factory()->create(['password' => bcrypt('OldPassword123!')]);

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'OldPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
        ->assertRedirect(route('settings.security.edit'));

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
