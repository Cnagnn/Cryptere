<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

test('forgot password page renders', function (): void {
    $this->get('/forgot-password')->assertSuccessful();
});

test('reset password page renders with token and email', function (): void {
    $this->get('/reset-password/test-token?email=student@example.com')
        ->assertSuccessful();
});

test('known user receives a reset password link', function (): void {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'student@example.com',
    ]);

    $this->post('/forgot-password', [
        'email' => 'student@example.com',
    ])->assertSessionHas('status');

    Notification::assertSentTo($user, ResetPassword::class);
});

test('unknown email receives a neutral response without sending notification', function (): void {
    Notification::fake();

    $this->post('/forgot-password', [
        'email' => 'missing@example.com',
    ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status');

    Notification::assertNothingSent();
});

test('user can reset password with a valid token', function (): void {
    $user = User::factory()->create([
        'email' => 'student@example.com',
        'password' => 'OldPassword123!',
    ]);

    $token = Password::broker()->createToken($user);

    $this->post('/reset-password', [
        'token' => $token,
        'email' => 'student@example.com',
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])->assertRedirect('/login');

    expect(Hash::check('NewPassword123!', $user->fresh()->password))->toBeTrue();
});
