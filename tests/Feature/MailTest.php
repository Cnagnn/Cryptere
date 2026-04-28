<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;

test('email verification notification is sent on registration', function () {
    Notification::fake();

    $response = $this->post('/register', [
        'name' => 'Test User',
        'username' => 'testuser',
        'email' => 'test@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $user = User::where('email', 'test@example.com')->first();
    expect($user)->not->toBeNull();

    Notification::assertSentTo($user, VerifyEmail::class);
});

test('password reset notification is sent', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'reset@example.com',
        'last_active_date' => now(),
    ]);

    $this->post('/forgot-password', [
        'email' => 'reset@example.com',
    ]);

    Notification::assertSentTo($user, ResetPassword::class);
});

test('password reset notification is not sent for unknown email', function () {
    Notification::fake();

    $this->post('/forgot-password', [
        'email' => 'nonexistent@example.com',
    ]);

    Notification::assertNothingSent();
});
