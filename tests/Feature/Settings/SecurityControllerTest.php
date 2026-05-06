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

test('user can update password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'old-password',
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ])
        ->assertRedirect();

    expect(Hash::check('new-secure-password', $user->fresh()->password))->toBeTrue();
});

test('password update requires correct current password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ])
        ->assertSessionHasErrors('current_password');
});

test('password update is throttled', function () {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    // Make 7 requests (limit is 6 per minute)
    for ($i = 0; $i < 7; $i++) {
        $response = $this->actingAs($user)
            ->put(route('settings.password.update'), [
                'current_password' => 'old-password',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ]);
    }

    $response->assertStatus(429);
});
